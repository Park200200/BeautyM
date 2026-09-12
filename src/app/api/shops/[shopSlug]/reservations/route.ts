import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { notifyReservationCreated } from '@/lib/notifications';

// 자동 정리 (비동기, 에러 무시)
async function autoCleanup(shopId: string) {
  const now = new Date();
  try {
    // 0) 당일 확정 → 시술중
    await prisma.reservation.updateMany({
      where: { shopId, startTime: { lte: now }, endTime: { gt: now }, status: 'CONFIRMED' },
      data: { status: 'IN_PROGRESS' },
    });
    // 1) 과거 확정/시술중 → 완료
    const completedIds = await prisma.reservation.findMany({
      where: { shopId, endTime: { lt: now }, status: { in: ['CONFIRMED', 'IN_PROGRESS'] } },
      select: { id: true, customerId: true, staffId: true },
    });
    if (completedIds.length > 0) {
      await prisma.reservation.updateMany({
        where: { id: { in: completedIds.map(r => r.id) } },
        data: { status: 'COMPLETED' },
      });
      const existingRecords = await prisma.customerRecord.findMany({
        where: { reservationId: { in: completedIds.map(r => r.id) } },
        select: { reservationId: true },
      });
      const existingSet = new Set(existingRecords.map(r => r.reservationId));
      const newRecords = completedIds.filter(r => !existingSet.has(r.id));
      if (newRecords.length > 0) {
        await prisma.$transaction([
          prisma.customerRecord.createMany({
            data: newRecords.map(r => ({ shopId, customerId: r.customerId, staffId: r.staffId, reservationId: r.id, content: '시술 완료 (자동)' })),
          }),
          ...newRecords.map(r => prisma.shopMember.update({ where: { id: r.customerId }, data: { visitCount: { increment: 1 } } })),
        ]);
      }
    }
    // 2) 대기/요청 → 취소
    await prisma.reservation.updateMany({
      where: { shopId, endTime: { lt: now }, status: { in: ['PENDING', 'REQUESTED'] } },
      data: { status: 'CANCELLED' },
    });
  } catch (e) {
    console.error('자동 정리 오류 (무시):', e);
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get('customerId');
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  // 자동 정리는 비동기로 실행 (응답을 막지 않음)
  autoCleanup(shop.id).catch(() => {});

  // 날짜 범위 필터 (캘린더 뷰 범위만)
  const dateFilter: any = {};
  if (start) dateFilter.gte = new Date(start);
  if (end) dateFilter.lte = new Date(end);

  const reservations = await prisma.reservation.findMany({
    where: {
      shopId: shop.id,
      ...(customerId ? { customerId } : {}),
      ...(start || end ? { startTime: dateFilter } : {}),
    },
    select: {
      id: true, customerId: true, menuId: true, staffId: true,
      startTime: true, endTime: true, status: true, source: true, memo: true,
      customer: { select: { id: true, user: { select: { name: true, phone: true, profileImage: true, birthday: true, gender: true } } } },
      staff: { select: { user: { select: { name: true } } } },
      menu: {
        select: {
          id: true, name: true, managementFields: true, enablePhotos: true,
          menuTreatments: {
            select: {
              treatment: { select: { name: true, processSteps: true, enablePhotos: true } }
            }
          }
        }
      },
      customerRecord: { select: { managementData: true, content: true } },
    },
    orderBy: { startTime: 'asc' },
  });

  // 순번 계산 (취소 제외)
  const sessionMap: Record<string, { total: number; list: string[] }> = {};
  for (const r of reservations) {
    if (r.status === 'CANCELLED') continue;
    const key = `${r.customerId}_${r.menuId}`;
    if (!sessionMap[key]) sessionMap[key] = { total: 0, list: [] };
    sessionMap[key].total++;
    sessionMap[key].list.push(r.id);
  }

  const result = reservations.map((r) => {
    const key = `${r.customerId}_${r.menuId}`;
    const session = sessionMap[key];
    const currentSession = session ? session.list.indexOf(r.id) + 1 : 1;
    const totalSessions = session ? session.total : 1;
    return { ...r, currentSession, totalSessions };
  });

  return NextResponse.json({ reservations: result });
}

export async function POST(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const body = await req.json();
  const { customerId, menuId, staffId, date, startTime, memo, status } = body;

  if (!customerId || !menuId || !date || !startTime) {
    return NextResponse.json({ error: '필수 항목을 입력해주세요.' }, { status: 400 });
  }

  const menu = await prisma.menu.findUnique({ where: { id: menuId }, select: { duration: true } });
  if (!menu) return NextResponse.json({ error: '메뉴를 찾을 수 없습니다.' }, { status: 404 });

  const startDt = new Date(`${date}T${startTime}:00`);
  const end = new Date(startDt.getTime() + menu.duration * 60000);

  const reservation = await prisma.reservation.create({
    data: {
      shopId: shop.id, customerId, menuId,
      staffId: staffId || null,
      startTime: startDt, endTime: end,
      status: status || 'CONFIRMED', source: 'ADMIN',
      memo: memo || null,
    },
    include: {
      customer: { include: { user: true } },
      staff: { include: { user: true } },
      menu: { include: { menuTreatments: { include: { treatment: true } } } },
    },
  });

  await notifyReservationCreated(shop.id, reservation);
  return NextResponse.json({ reservation });
}
