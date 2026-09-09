import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug }, include: { subscription: { include: { plan: true } } } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  // \uC0B5 \uC18C\uC720\uC790\uC758 \uB2E4\uB978 \uB9E4\uC7A5\uB4E4 \uCC3E\uAE30
  const owner = await prisma.shopMember.findFirst({
    where: { shopId: shop.id, role: 'OWNER' },
    select: { userId: true },
  });
  if (!owner) return NextResponse.json({ shops: [], current: shop });

  const otherMembers = await prisma.shopMember.findMany({
    where: { userId: owner.userId, role: 'OWNER' },
    include: { shop: { include: { subscription: { include: { plan: true } } } } },
  });

  const shops = await Promise.all(otherMembers.map(async m => {
    const s = m.shop;
    const staffCount = await prisma.shopMember.count({ where: { shopId: s.id, role: { in: ['OWNER', 'STAFF'] } } });
    const customerCount = await prisma.shopMember.count({ where: { shopId: s.id, role: 'CUSTOMER' } });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const payments = await prisma.payment.findMany({
      where: { shopId: s.id, paidAt: { gte: monthStart, lt: monthEnd } },
      select: { amount: true },
    });
    const monthRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart); todayEnd.setDate(todayEnd.getDate() + 1);
    const todayReservations = await prisma.reservation.count({
      where: { shopId: s.id, startTime: { gte: todayStart, lt: todayEnd } },
    });

    return {
      id: s.id, slug: s.slug, name: s.name, planName: s.subscription?.plan.name || 'Free',
      isCurrent: s.id === shop.id,
      staffCount, customerCount, monthRevenue, todayReservations,
    };
  }));

  return NextResponse.json({ shops, currentShopId: shop.id });
}
