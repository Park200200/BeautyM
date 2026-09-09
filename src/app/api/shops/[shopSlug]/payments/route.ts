import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 결제 등록
export async function POST(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  try {
    const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const body = await req.json();
    const { reservationId, amount, discount, pointUsed, pointEarned, method } = body;

    if (!reservationId || amount === undefined) {
      return NextResponse.json({ error: '\uC608\uC57D ID\uC640 \uAE08\uC561\uC740 \uD544\uC218\uC785\uB2C8\uB2E4' }, { status: 400 });
    }

    // 예약 확인
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { customer: true, menu: true },
    });
    if (!reservation || reservation.shopId !== shop.id) {
      return NextResponse.json({ error: '\uC608\uC57D\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4' }, { status: 404 });
    }

    // 이미 결제가 있는지 확인
    const existing = await prisma.payment.findUnique({ where: { reservationId } });
    if (existing) {
      return NextResponse.json({ error: '\uC774\uBBF8 \uACB0\uC81C\uAC00 \uB4F1\uB85D\uB41C \uC608\uC57D\uC785\uB2C8\uB2E4' }, { status: 409 });
    }

    // 트랜잭션: 결제 생성 + 예약 상태 완료 + 고객 매출 누적
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          shopId: shop.id,
          reservationId,
          amount: amount || 0,
          discount: discount || 0,
          pointUsed: pointUsed || 0,
          pointEarned: pointEarned || 0,
          method: method || 'CARD',
        },
      });

      // 예약 상태를 COMPLETED로 변경
      await tx.reservation.update({
        where: { id: reservationId },
        data: { status: 'COMPLETED' },
      });

      // 고객 누적 매출 업데이트
      if (reservation.customerId) {
        await tx.shopMember.update({
          where: { id: reservation.customerId },
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

    return NextResponse.json(paymentFull, { status: 201 });
  } catch (error: any) {
    console.error('Payment error:', error);
    return NextResponse.json({ error: '\uACB0\uC81C \uCC98\uB9AC \uC2E4\uD328' }, { status: 500 });
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
