import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const url = new URL(req.url);
  const period = url.searchParams.get('period') || 'daily'; // daily | monthly | custom
  const dateStr = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const monthStr = url.searchParams.get('month'); // YYYY-MM

  let startDate: Date;
  let endDate: Date;

  if (period === 'monthly' && monthStr) {
    startDate = new Date(monthStr + '-01T00:00:00');
    endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
  } else {
    startDate = new Date(dateStr + 'T00:00:00');
    endDate = new Date(dateStr + 'T23:59:59');
  }

  // 완료된 예약 조회 (매출 기준)
  const completedReservations = await prisma.reservation.findMany({
    where: {
      shopId: shop.id,
      status: 'COMPLETED',
      startTime: { gte: startDate, lt: endDate },
    },
    include: {
      customer: { include: { user: true } },
      staff: { include: { user: true } },
      menu: true,
      payment: true,
    },
    orderBy: { startTime: 'desc' },
  });

  // 결제 데이터 조회
  const payments = await prisma.payment.findMany({
    where: {
      shopId: shop.id,
      paidAt: { gte: startDate, lt: endDate },
    },
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
  });

  // 집계
  const totalRevenue = completedReservations.reduce((sum, r) => sum + (r.menu?.price || 0), 0);
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalDiscount = payments.reduce((sum, p) => sum + p.discount, 0);
  const totalPointUsed = payments.reduce((sum, p) => sum + p.pointUsed, 0);

  // 결제 수단별 집계
  const methodSummary: Record<string, number> = {};
  payments.forEach(p => {
    methodSummary[p.method] = (methodSummary[p.method] || 0) + p.amount;
  });

  // 담당자별 매출
  const staffSummary: Record<string, { name: string; count: number; revenue: number }> = {};
  completedReservations.forEach(r => {
    const staffName = r.staff?.user?.name || '\uBBF8\uC9C0\uC815';
    const staffId = r.staffId || 'unassigned';
    if (!staffSummary[staffId]) staffSummary[staffId] = { name: staffName, count: 0, revenue: 0 };
    staffSummary[staffId].count++;
    staffSummary[staffId].revenue += r.menu?.price || 0;
  });

  // 메뉴별 매출
  const menuSummary: Record<string, { name: string; count: number; revenue: number }> = {};
  completedReservations.forEach(r => {
    const menuId = r.menuId;
    const menuName = r.menu?.name || '\uC54C \uC218 \uC5C6\uC74C';
    if (!menuSummary[menuId]) menuSummary[menuId] = { name: menuName, count: 0, revenue: 0 };
    menuSummary[menuId].count++;
    menuSummary[menuId].revenue += r.menu?.price || 0;
  });

  // 시간대별 매출 (일간)
  const hourly: Record<number, number> = {};
  completedReservations.forEach(r => {
    const hour = new Date(r.startTime).getHours();
    hourly[hour] = (hourly[hour] || 0) + (r.menu?.price || 0);
  });

  // 일별 매출 (월간)
  const daily: Record<string, number> = {};
  if (period === 'monthly') {
    completedReservations.forEach(r => {
      const day = new Date(r.startTime).toISOString().split('T')[0];
      daily[day] = (daily[day] || 0) + (r.menu?.price || 0);
    });
  }

  return NextResponse.json({
    period,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    summary: {
      totalRevenue,
      totalPayments,
      totalDiscount,
      totalPointUsed,
      completedCount: completedReservations.length,
      paymentCount: payments.length,
    },
    methodSummary,
    staffSummary: Object.values(staffSummary).sort((a, b) => b.revenue - a.revenue),
    menuSummary: Object.values(menuSummary).sort((a, b) => b.revenue - a.revenue),
    hourly,
    daily,
    reservations: completedReservations.map(r => ({
      id: r.id,
      startTime: r.startTime,
      endTime: r.endTime,
      customerName: r.customer?.user?.name || '-',
      staffName: r.staff?.user?.name || '\uBBF8\uC9C0\uC815',
      menuName: r.menu?.name || '-',
      price: r.menu?.price || 0,
      paymentMethod: r.payment?.method || null,
      paymentAmount: r.payment?.amount || null,
    })),
  });
}
