import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { notifyReservationCreated } from '@/lib/notifications';

export async function GET(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get('customerId');

  // 지난 날짜의 활성 상태 예약 자동 정리 (트랜잭션 없이 일괄 처리)
  const now = new Date();
  try {
    // 0) 당일 확정 예약 중 시작시간이 지난 것 → 시술중
    await prisma.reservation.updateMany({
      where: { shopId: shop.id, startTime: { lte: now }, endTime: { gt: now }, status: 'CONFIRMED' },
      data: { status: 'IN_PROGRESS' },
    });

    // 1) 과거(종료시간 지남) 확정/시술중 → 완료
    const completedIds = await prisma.reservation.findMany({
      where: { shopId: shop.id, endTime: { lt: now }, status: { in: ['CONFIRMED', 'IN_PROGRESS'] } },
      select: { id: true, customerId: true, staffId: true },
    });
    if (completedIds.length > 0) {
      await prisma.reservation.updateMany({
        where: { id: { in: completedIds.map(r => r.id) } },
        data: { status: 'COMPLETED' },
      });
      // 시술카드 생성 (이미 있는 것 제외)
      const existingRecords = await prisma.customerRecord.findMany({
        where: { reservationId: { in: completedIds.map(r => r.id) } },
        select: { reservationId: true },
      });
      const existingSet = new Set(existingRecords.map(r => r.reservationId));
      for (const r of completedIds.filter(r => !existingSet.has(r.id))) {
        await prisma.customerRecord.create({
          data: { shopId: shop.id, customerId: r.customerId, staffId: r.staffId, reservationId: r.id, content: '시술 완료 (자동)' },
        });
        await prisma.shopMember.update({ where: { id: r.customerId }, data: { visitCount: { increment: 1 } } });
      }
    }

    // 2) 대기/요청 → 취소
    await prisma.reservation.updateMany({
      where: { shopId: shop.id, endTime: { lt: now }, status: { in: ['PENDING', 'REQUESTED'] } },
      data: { status: 'CANCELLED' },
    });
  } catch (e) {
    console.error('자동 정리 오류 (무시):', e);
  }

  const reservations = await prisma.reservation.findMany({
    where: { 
      shopId: shop.id,
      ...(customerId ? { customerId } : {})
    },
    include: {
      customer: { include: { user: true } },
      staff: { include: { user: true } },
      menu: { include: { menuTreatments: { include: { treatment: { include: { category: true } } } } } },
      payment: true,
    },
    orderBy: { startTime: 'asc' },
  });

  // 고객+메뉴별 총 횟수, 현재 순번 계산
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
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const body = await req.json();
  const { customerId, menuId, staffId, date, startTime, memo, status } = body;

  if (!customerId || !menuId || !date || !startTime) {
    return NextResponse.json({ error: '필수 항목을 입력해주세요.' }, { status: 400 });
  }

  // 메뉴 정보로 종료 시간 계산
  const menu = await prisma.menu.findUnique({ where: { id: menuId } });
  if (!menu) return NextResponse.json({ error: '메뉴를 찾을 수 없습니다.' }, { status: 404 });

  const start = new Date(`${date}T${startTime}:00`);
  const end = new Date(start.getTime() + menu.duration * 60000);

  const reservation = await prisma.reservation.create({
    data: {
      shopId: shop.id,
      customerId,
      menuId,
      staffId: staffId || null,
      startTime: start,
      endTime: end,
      status: status || 'CONFIRMED',
      source: 'ADMIN',
      memo: memo || null,
    },
    include: {
      customer: { include: { user: true } },
      staff: { include: { user: true } },
      menu: { include: { menuTreatments: { include: { treatment: { include: { category: true } } } } } },
    },
  });

  // 예약 확인 알림 생성
  await notifyReservationCreated(shop.id, reservation);

  return NextResponse.json({ reservation });
}
