import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { notifyCouponIssued } from '@/lib/notifications';

// 쿠폰 목록 조회
export async function GET(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get('memberId');

  const coupons = await prisma.coupon.findMany({
    where: {
      shopId: shop.id,
      ...(memberId ? { memberId } : {}),
    },
    include: {
      member: { include: { user: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ coupons });
}

// 쿠폰 발급
export async function POST(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const body = await req.json();
  const { memberId, name, discountPercent, discountAmount, validDays } = body;

  if (!memberId || !name) {
    return NextResponse.json({ error: '고객과 쿠폰명은 필수입니다' }, { status: 400 });
  }

  const now = new Date();
  const validUntil = new Date(now.getTime() + (validDays || 30) * 24 * 60 * 60 * 1000);

  const coupon = await prisma.coupon.create({
    data: {
      shopId: shop.id,
      memberId,
      name,
      discountPercent: discountPercent || null,
      discountAmount: discountAmount || null,
      validFrom: now,
      validUntil,
    },
    include: {
      member: { include: { user: true } },
    },
  });

  // 쿠폰 발급 알림
  const customerName = coupon.member?.user?.name || '고객';
  await notifyCouponIssued(shop.id, memberId, customerName, name);

  return NextResponse.json({ coupon }, { status: 201 });
}

// 쿠폰 사용 처리
export async function PATCH(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const body = await req.json();
  const { couponId, action } = body;

  if (!couponId) {
    return NextResponse.json({ error: '쿠폰 ID가 필요합니다' }, { status: 400 });
  }

  if (action === 'use') {
    const coupon = await prisma.coupon.update({
      where: { id: couponId },
      data: { isUsed: true },
    });
    return NextResponse.json({ coupon });
  }

  if (action === 'delete') {
    await prisma.coupon.delete({ where: { id: couponId } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: '유효하지 않은 액션' }, { status: 400 });
}
