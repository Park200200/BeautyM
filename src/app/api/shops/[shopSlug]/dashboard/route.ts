import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart); todayEnd.setDate(todayEnd.getDate() + 1);

  // 주간 (월~일)
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - dayOfWeek);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);

  // 당월
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // 연간
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1);

  // ===== 예약 =====
  const allReservations = await prisma.reservation.findMany({
    where: { shopId: shop.id },
    select: { id: true, status: true, startTime: true, createdAt: true },
  });

  const todayRes = allReservations.filter(r => { const d = new Date(r.startTime); return d >= todayStart && d < todayEnd; });
  const weekRes = allReservations.filter(r => { const d = new Date(r.startTime); return d >= weekStart && d < weekEnd; });
  const monthRes = allReservations.filter(r => { const d = new Date(r.startTime); return d >= monthStart && d < monthEnd; });

  const countByStatus = (list: typeof allReservations) => ({
    total: list.length,
    completed: list.filter(r => r.status === 'COMPLETED').length,
    waiting: list.filter(r => ['PENDING', 'CONFIRMED'].includes(r.status)).length,
    inProgress: list.filter(r => r.status === 'IN_PROGRESS').length,
    cancelled: list.filter(r => r.status === 'CANCELLED').length,
    noShow: list.filter(r => r.status === 'NO_SHOW').length,
  });

  // ===== 매출 =====
  const allPayments = await prisma.payment.findMany({
    where: { shopId: shop.id },
    select: { id: true, amount: true, method: true, paidAt: true },
  });

  const sumPayments = (list: typeof allPayments) => ({
    total: list.reduce((s, p) => s + p.amount, 0),
    card: list.filter(p => p.method === 'CARD').reduce((s, p) => s + p.amount, 0),
    cash: list.filter(p => p.method === 'CASH').reduce((s, p) => s + p.amount, 0),
    transfer: list.filter(p => p.method === 'TRANSFER').reduce((s, p) => s + p.amount, 0),
    count: list.length,
  });

  const todayPay = allPayments.filter(p => { const d = new Date(p.paidAt); return d >= todayStart && d < todayEnd; });
  const weekPay = allPayments.filter(p => { const d = new Date(p.paidAt); return d >= weekStart && d < weekEnd; });
  const monthPay = allPayments.filter(p => { const d = new Date(p.paidAt); return d >= monthStart && d < monthEnd; });
  const yearPay = allPayments.filter(p => { const d = new Date(p.paidAt); return d >= yearStart && d < yearEnd; });

  // ===== 고객 =====
  const allCustomers = await prisma.shopMember.findMany({
    where: { shopId: shop.id, role: 'CUSTOMER' },
    select: { id: true, createdAt: true },
  });

  const countNew = (start: Date, end: Date) => allCustomers.filter(c => { const d = new Date(c.createdAt); return d >= start && d < end; }).length;

  // ===== 일별 매출 추이 (최근 7일) =====
  const dailySales: { date: string; amount: number; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayStart); d.setDate(d.getDate() - i);
    const dEnd = new Date(d); dEnd.setDate(dEnd.getDate() + 1);
    const dayPay = allPayments.filter(p => { const pd = new Date(p.paidAt); return pd >= d && pd < dEnd; });
    dailySales.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      amount: dayPay.reduce((s, p) => s + p.amount, 0),
      count: dayPay.length,
    });
  }

  // ===== 시간대별 예약 분포 (오늘) =====
  const hourlyDist: { hour: string; count: number }[] = [];
  for (let h = 9; h <= 20; h++) {
    hourlyDist.push({
      hour: `${h}\uC2DC`,
      count: todayRes.filter(r => new Date(r.startTime).getHours() === h).length,
    });
  }

  return NextResponse.json({
    reservations: {
      today: countByStatus(todayRes),
      week: countByStatus(weekRes),
      month: countByStatus(monthRes),
    },
    sales: {
      today: sumPayments(todayPay),
      week: sumPayments(weekPay),
      month: sumPayments(monthPay),
      year: sumPayments(yearPay),
    },
    customers: {
      total: allCustomers.length,
      todayNew: countNew(todayStart, todayEnd),
      weekNew: countNew(weekStart, weekEnd),
      monthNew: countNew(monthStart, monthEnd),
      yearNew: countNew(yearStart, yearEnd),
    },
    charts: {
      dailySales,
      hourlyDist,
    },
  });
}
