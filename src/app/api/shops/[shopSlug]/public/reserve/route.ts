import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// 고객 예약 요청 API (인증 불필요)
export async function POST(req: NextRequest, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const body = await req.json();
  const { name, phone, menuId, date, time, memo } = body;

  if (!name?.trim() || !phone?.trim() || !menuId || !date || !time) {
    return NextResponse.json({ error: '필수 항목을 입력해주세요' }, { status: 400 });
  }

  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const menu = await prisma.menu.findFirst({ where: { id: menuId, shopId: shop.id, isActive: true } });
  if (!menu) return NextResponse.json({ error: '해당 시술을 찾을 수 없습니다' }, { status: 404 });

  // 고객 찾기 또는 생성
  const cleanPhone = phone.replace(/-/g, '');
  let user = await prisma.user.findFirst({ where: { phone: cleanPhone } });

  if (!user) {
    user = await prisma.user.create({
      data: { name: name.trim(), phone: cleanPhone, role: 'USER' },
    });
  }

  // ShopMember (CUSTOMER)  찾기 또는 생성
  let member = await prisma.shopMember.findFirst({
    where: { shopId: shop.id, userId: user.id },
  });
  if (!member) {
    member = await prisma.shopMember.create({
      data: { shopId: shop.id, userId: user.id, role: 'CUSTOMER' },
    });
  }

  // 자동 직원 배정 (활성 직원 중 랜덤)
  const staffList = await prisma.shopMember.findMany({
    where: { shopId: shop.id, role: { in: ['OWNER', 'STAFF'] }, isActive: true },
    select: { id: true },
  });
  const assignedStaff = staffList.length > 0 ? staffList[Math.floor(Math.random() * staffList.length)] : null;

  // 예약 시간 파싱
  const startTime = new Date(`${date}T${time}:00`);
  const endTime = new Date(startTime.getTime() + (menu.duration || 60) * 60000);

  const reservation = await prisma.reservation.create({
    data: {
      shopId: shop.id,
      customerId: member.id,
      menuId: menu.id,
      staffId: assignedStaff?.id || null,
      startTime,
      endTime,
      status: 'PENDING',
      source: 'WEBSITE',
      memo: memo?.trim() || null,
    },
  });

  return NextResponse.json({
    success: true,
    reservationId: reservation.id,
    message: '예약 요청이 접수되었습니다. 확정 후 안내드리겠습니다.',
  });
}
