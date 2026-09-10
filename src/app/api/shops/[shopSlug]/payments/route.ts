import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { notifyPaymentCompleted } from '@/lib/notifications';

// 결제 등록
export async function POST(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  try {
    const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const body = await req.json();
    const { reservationId, menuId, customerId, amount, discount, pointUsed, pointEarned, method } = body;

    if (!reservationId && !menuId) {
      return NextResponse.json({ error: '예약 ID 또는 메뉴 ID가 필요합니다' }, { status: 400 });
    }

    let targetReservationId = reservationId;
    let targetCustomerId = customerId;

    // 메뉴 직접 결제: 예약 자동 생성
    if (!reservationId && menuId) {
      const menu = await prisma.menu.findUnique({ where: { id: menuId } });
      if (!menu) return NextResponse.json({ error: '메뉴를 찾을 수 없습니다' }, { status: 404 });

      const now = new Date();
      const endTime = new Date(now.getTime() + (menu.duration || 60) * 60000);
      const newResv = await prisma.reservation.create({
        data: {
          shopId: shop.id,
          customerId: customerId || null,
          menuId: menu.id,
          startTime: now,
          endTime: endTime,
          status: 'COMPLETED',
          source: 'WALK_IN',
          memo: '직접 결제',
        },
      });
      targetReservationId = newResv.id;
      targetCustomerId = customerId || newResv.customerId;
    }

    // 예약 확인
    const reservation = await prisma.reservation.findUnique({
      where: { id: targetReservationId },
      include: { customer: true, menu: true },
    });
    if (!reservation || reservation.shopId !== shop.id) {
      return NextResponse.json({ error: '예약을 찾을 수 없습니다' }, { status: 404 });
    }

    // 이미 결제가 있는지 확인
    const existing = await prisma.payment.findUnique({ where: { reservationId: targetReservationId } });
    if (existing) {
      return NextResponse.json({ error: '이미 결제가 등록된 예약입니다' }, { status: 409 });
    }

    // 트랜잭션: 결제 생성 + 예약 상태 완료 + 고객 매출 누적
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          shopId: shop.id,
          reservationId: targetReservationId,
          amount: amount || 0,
          discount: discount || 0,
          pointUsed: pointUsed || 0,
          pointEarned: pointEarned || 0,
          method: method || 'CARD',
        },
      });

      // 예약 상태를 COMPLETED로 변경
      await tx.reservation.update({
        where: { id: targetReservationId },
        data: { status: 'COMPLETED' },
      });

      // 고객 누적 매출 업데이트
      if (targetCustomerId) {
        await tx.shopMember.update({
          where: { id: targetCustomerId },
          data: {
            totalSpent: { increment: amount || 0 },
            visitCount: { increment: 1 },
          },
        });
      }

      return payment;
    });

    // 영수증용 데이터 반환
    const paymentFull = await prisma.payment.findUnique({
      where: { id: result.id },
      include: {
        reservation: {
          include: {
            customer: { include: { user: true } },
            staff: { include: { user: true } },
            menu: true,
          },
        },
        shop: true,
      },
    });

    // 결제 완료 알림 생성
    const custName = paymentFull?.reservation?.customer?.user?.name || '고객';
    const menuName2 = paymentFull?.reservation?.menu?.name || '시술';
    await notifyPaymentCompleted(shop.id, paymentFull, custName, menuName2);

    return NextResponse.json(paymentFull, { status: 201 });
  } catch (error: any) {
    console.error('Payment error:', error);
    return NextResponse.json({ error: '결제 처리 실패' }, { status: 500 });
  }
}

// 결제 목록 조회
export async function GET(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const url = new URL(req.url);
  const reservationId = url.searchParams.get('reservationId');

  if (reservationId) {
    const payment = await prisma.payment.findUnique({
      where: { reservationId },
      include: {
        reservation: {
          include: {
            customer: { include: { user: true } },
            staff: { include: { user: true } },
            menu: true,
          },
        },
        shop: true,
      },
    });
    return NextResponse.json({ payment });
  }

  const payments = await prisma.payment.findMany({
    where: { shopId: shop.id },
    include: {
      reservation: {
        include: {
          customer: { include: { user: true } },
          staff: { include: { user: true } },
          menu: true,
        },
      },
    },
    orderBy: { paidAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ payments });
}
