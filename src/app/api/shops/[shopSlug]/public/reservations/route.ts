import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// 공개 API: 전화번호로 예약 조회
export async function GET(req: NextRequest, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const phone = req.nextUrl.searchParams.get('phone')?.replace(/-/g, '');
  const pin = req.nextUrl.searchParams.get('pin');

  if (!phone || phone.length < 10) {
    return NextResponse.json({ error: '전화번호를 입력해주세요' }, { status: 400 });
  }
  if (!pin || pin.length !== 4) {
    return NextResponse.json({ error: '비밀번호를 입력해주세요' }, { status: 400 });
  }

  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  // 전화번호로 유저 → ShopMember → Reservation 조회
  const user = await prisma.user.findFirst({ where: { phone } });
  if (!user) return NextResponse.json({ reservations: [] });

  const member = await prisma.shopMember.findFirst({
    where: { shopId: shop.id, userId: user.id },
  });
  if (!member) return NextResponse.json({ reservations: [] });

  const reservations = await prisma.reservation.findMany({
    where: { shopId: shop.id, customerId: member.id, pin },
    select: {
      id: true, startTime: true, endTime: true, status: true, memo: true,
      menu: { select: { name: true, duration: true, price: true } },
      staff: { select: { user: { select: { name: true } } } },
    },
    orderBy: { startTime: 'desc' },
    take: 10,
  });

  return NextResponse.json({ reservations, customerName: user.name });
}
