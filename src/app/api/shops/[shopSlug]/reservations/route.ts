import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get('customerId');

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

  return NextResponse.json({ reservation });
}
