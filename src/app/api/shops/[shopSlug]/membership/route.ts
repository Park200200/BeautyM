import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const url = new URL(req.url);
  const memberId = url.searchParams.get('memberId');

  // 등급별 고객 통계
  const customers = await prisma.shopMember.findMany({
    where: { shopId: shop.id, role: 'CUSTOMER' },
    include: { user: true },
    orderBy: { totalSpent: 'desc' },
  });

  const gradeStats = {
    '\uC77C\uBC18': customers.filter(c => c.memberGrade === '\uC77C\uBC18').length,
    '\uC2E4\uBC84': customers.filter(c => c.memberGrade === '\uC2E4\uBC84').length,
    '\uACE8\uB4DC': customers.filter(c => c.memberGrade === '\uACE8\uB4DC').length,
    'VIP': customers.filter(c => c.memberGrade === 'VIP').length,
  };

  // 특정 회원 포인트 내역
  let pointHistory: any[] = [];
  let coupons: any[] = [];
  if (memberId) {
    pointHistory = await prisma.pointHistory.findMany({
      where: { shopId: shop.id, memberId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    coupons = await prisma.coupon.findMany({
      where: { shopId: shop.id, memberId },
      orderBy: { createdAt: 'desc' },
    });
  }
  const gradeSettings = shop.gradeSettings ? JSON.parse(shop.gradeSettings) : {
    '\uC2E4\uBC84': { threshold: 100000, pointRate: 5, discount: 3 },
    '\uACE8\uB4DC': { threshold: 300000, pointRate: 7, discount: 5 },
    'VIP': { threshold: 500000, pointRate: 10, discount: 10 },
  };
  const paymentRates = shop.paymentRates ? JSON.parse(shop.paymentRates) : { CARD: 3, CASH: 5, TRANSFER: 4 };

  return NextResponse.json({ customers, gradeStats, pointHistory, coupons, pointRate: shop.pointRate, gradeSettings, paymentRates });
}

// 등급 변경
export async function PATCH(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  try {
    const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const body = await req.json();
    const { memberId, memberGrade, points, pointType, pointDesc, couponName, couponDiscount, couponDays, pointRate, gradeSettings, paymentRates } = body;

    // 포인트/등급 설정 저장
    if (pointRate !== undefined || gradeSettings !== undefined || paymentRates !== undefined) {
      const data: any = {};
      if (pointRate !== undefined) data.pointRate = pointRate;
      if (gradeSettings !== undefined) data.gradeSettings = JSON.stringify(gradeSettings);
      if (paymentRates !== undefined) data.paymentRates = JSON.stringify(paymentRates);
      await prisma.shop.update({ where: { id: shop.id }, data });
      if (!memberId) return NextResponse.json({ success: true });
    }

    if (!memberId) return NextResponse.json({ error: '\uD68C\uC6D0\uC744 \uC120\uD0DD\uD574\uC8FC\uC138\uC694' }, { status: 400 });

    // 등급 변경
    if (memberGrade) {
      await prisma.shopMember.update({ where: { id: memberId }, data: { memberGrade } });
    }

    // 포인트 적립/사용
    if (points && pointType) {
      const amount = pointType === 'EARN' ? Math.abs(points) : -Math.abs(points);
      await prisma.$transaction([
        prisma.pointHistory.create({
          data: { shopId: shop.id, memberId, amount, type: pointType, description: pointDesc || (pointType === 'EARN' ? '\uD3EC\uC778\uD2B8 \uC801\uB9BD' : '\uD3EC\uC778\uD2B8 \uC0AC\uC6A9') },
        }),
        prisma.shopMember.update({
          where: { id: memberId },
          data: { totalPoints: { increment: amount } },
        }),
      ]);
    }

    // 쿠폰 발급
    if (couponName) {
      const now = new Date();
      const until = new Date(now);
      until.setDate(until.getDate() + (couponDays || 30));
      await prisma.coupon.create({
        data: {
          shopId: shop.id,
          memberId,
          name: couponName,
          discountPercent: couponDiscount || null,
          validFrom: now,
          validUntil: until,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Membership update error:', error);
    return NextResponse.json({ error: '\uCC98\uB9AC \uC2E4\uD328' }, { status: 500 });
  }
}
