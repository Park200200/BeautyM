import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // \uC608\uC57D \uB370\uC774\uD130
  const reservations = await prisma.reservation.findMany({
    where: { shopId: shop.id },
    select: { id: true, status: true, startTime: true, staffId: true, menuId: true, createdAt: true },
  });

  // \uACB0\uC81C \uB370\uC774\uD130
  const payments = await prisma.payment.findMany({
    where: { shopId: shop.id },
    select: { id: true, amount: true, method: true, paidAt: true },
  });

  // \uACE0\uAC1D \uB370\uC774\uD130
  const customers = await prisma.shopMember.findMany({
    where: { shopId: shop.id, role: 'CUSTOMER' },
    select: { id: true, visitCount: true, totalSpent: true, memberGrade: true, createdAt: true },
  });

  // \uC9C1\uC6D0 \uB370\uC774\uD130
  const staff = await prisma.shopMember.findMany({
    where: { shopId: shop.id, role: { in: ['OWNER', 'STAFF'] } },
    include: { user: { select: { name: true } } },
  });

  // \uBA54\uB274 \uB370\uC774\uD130
  const menus = await prisma.menu.findMany({
    where: { shopId: shop.id },
    select: { id: true, name: true, price: true, duration: true, category: true },
  });

  // ===== \uBD84\uC11D =====

  // 1. \uB9E4\uCD9C \uCD94\uC774 \uBD84\uC11D
  const thisMonthPay = payments.filter(p => new Date(p.paidAt) >= monthStart && new Date(p.paidAt) < monthEnd);
  const prevMonthPay = payments.filter(p => new Date(p.paidAt) >= prevMonthStart && new Date(p.paidAt) < monthStart);
  const thisMonthRev = thisMonthPay.reduce((s, p) => s + p.amount, 0);
  const prevMonthRev = prevMonthPay.reduce((s, p) => s + p.amount, 0);
  const revenueGrowth = prevMonthRev > 0 ? Math.round(((thisMonthRev - prevMonthRev) / prevMonthRev) * 100) : 0;

  // 2. \uC694\uC77C\uBCC4 \uC608\uC57D \uD328\uD134
  const dayNames = ['\uC77C', '\uC6D4', '\uD654', '\uC218', '\uBAA9', '\uAE08', '\uD1A0'];
  const dayDist = dayNames.map((name, idx) => ({
    day: name,
    count: reservations.filter(r => new Date(r.startTime).getDay() === idx).length,
  }));
  const busiestDay = dayDist.reduce((a, b) => a.count > b.count ? a : b);
  const slowestDay = dayDist.reduce((a, b) => a.count < b.count ? a : b);

  // 3. \uC2DC\uAC04\uB300\uBCC4 \uC608\uC57D \uD328\uD134
  const hourDist: { hour: number; count: number }[] = [];
  for (let h = 9; h <= 20; h++) {
    hourDist.push({ hour: h, count: reservations.filter(r => new Date(r.startTime).getHours() === h).length });
  }
  const peakHour = hourDist.reduce((a, b) => a.count > b.count ? a : b);

  // 4. \uC778\uAE30 \uBA54\uB274 TOP 5
  const menuCount: Record<string, number> = {};
  reservations.forEach(r => { menuCount[r.menuId] = (menuCount[r.menuId] || 0) + 1; });
  const topMenus = Object.entries(menuCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([menuId, count]) => ({ menu: menus.find(m => m.id === menuId)?.name || '\uBBF8\uC0C1', count }));

  // 5. \uACE0\uAC1D \uBD84\uC11D
  const avgVisit = customers.length > 0 ? Math.round(customers.reduce((s, c) => s + c.visitCount, 0) / customers.length * 10) / 10 : 0;
  const avgSpent = customers.length > 0 ? Math.round(customers.reduce((s, c) => s + c.totalSpent, 0) / customers.length) : 0;
  const gradeDistribution = {
    '\uC77C\uBC18': customers.filter(c => c.memberGrade === '\uC77C\uBC18').length,
    '\uC2E4\uBC84': customers.filter(c => c.memberGrade === '\uC2E4\uBC84').length,
    '\uACE8\uB4DC': customers.filter(c => c.memberGrade === '\uACE8\uB4DC').length,
    'VIP': customers.filter(c => c.memberGrade === 'VIP').length,
  };
  const newCustomerRate = customers.filter(c => new Date(c.createdAt) >= monthStart).length;
  const returningCustomers = customers.filter(c => c.visitCount >= 2).length;
  const retentionRate = customers.length > 0 ? Math.round((returningCustomers / customers.length) * 100) : 0;

  // 6. \uC9C1\uC6D0 \uC131\uACFC
  const staffPerformance = staff.map(s => {
    const staffRes = reservations.filter(r => r.staffId === s.id);
    const completed = staffRes.filter(r => r.status === 'COMPLETED').length;
    return { name: s.user.name, total: staffRes.length, completed };
  }).sort((a, b) => b.completed - a.completed);

  // 7. \uCDE8\uC18C/\uB178\uC1FC \uBD84\uC11D
  const cancelRate = reservations.length > 0 ? Math.round((reservations.filter(r => r.status === 'CANCELLED').length / reservations.length) * 100) : 0;
  const noShowRate = reservations.length > 0 ? Math.round((reservations.filter(r => r.status === 'NO_SHOW').length / reservations.length) * 100) : 0;

  // 8. \uACB0\uC81C\uC218\uB2E8 \uBD84\uC11D
  const methodDist = {
    CARD: payments.filter(p => p.method === 'CARD').length,
    CASH: payments.filter(p => p.method === 'CASH').length,
    TRANSFER: payments.filter(p => p.method === 'TRANSFER').length,
    OTHER: payments.filter(p => !['CARD', 'CASH', 'TRANSFER'].includes(p.method)).length,
  };

  // 9. AI \uCD94\uCC9C \uC0DD\uC131
  const insights: { type: 'success' | 'warning' | 'info' | 'tip'; title: string; content: string }[] = [];

  if (revenueGrowth > 0) insights.push({ type: 'success', title: '\uB9E4\uCD9C \uC131\uC7A5', content: `\uC804\uC6D4 \uB300\uBE44 ${revenueGrowth}% \uB9E4\uCD9C \uC131\uC7A5! \uD604\uC7AC \uCD94\uC138\uB97C \uC720\uC9C0\uD558\uC138\uC694.` });
  else if (revenueGrowth < -10) insights.push({ type: 'warning', title: '\uB9E4\uCD9C \uAC10\uC18C', content: `\uC804\uC6D4 \uB300\uBE44 ${Math.abs(revenueGrowth)}% \uAC10\uC18C. \uD504\uB85C\uBAA8\uC158\uC774\uB098 \uC774\uBCA4\uD2B8\uB97C \uACE0\uB824\uD574\uBCF4\uC138\uC694.` });

  if (cancelRate > 15) insights.push({ type: 'warning', title: '\uB192\uC740 \uCDE8\uC18C\uC728', content: `\uCDE8\uC18C\uC728\uC774 ${cancelRate}%\uC785\uB2C8\uB2E4. \uC608\uC57D \uD655\uC778 \uBB38\uC790\uB97C \uBC1C\uC1A1\uD574\uBCF4\uC138\uC694.` });
  if (noShowRate > 5) insights.push({ type: 'warning', title: '\uB178\uC1FC \uC8FC\uC758', content: `\uB178\uC1FC\uC728 ${noShowRate}%. \uC608\uC57D \uC804\uB0A0 \uB9AC\uB9C8\uC778\uB354\uB97C \uBCF4\uB0B4\uBCF4\uC138\uC694.` });

  insights.push({ type: 'info', title: '\uD53C\uD06C \uD0C0\uC784', content: `\uAC00\uC7A5 \uBC14\uC05C \uC2DC\uAC04\uB300\uB294 ${peakHour.hour}\uC2DC\uC774\uBA70, ${busiestDay.day}\uC694\uC77C\uC774 \uAC00\uC7A5 \uBC14\uC269\uB2C8\uB2E4.` });
  insights.push({ type: 'tip', title: '\uBE48 \uC2DC\uAC04 \uD65C\uC6A9', content: `${slowestDay.day}\uC694\uC77C\uC774 \uAC00\uC7A5 \uD55C\uAC00\uD569\uB2C8\uB2E4. \uD560\uC778 \uC774\uBCA4\uD2B8\uB85C \uC608\uC57D\uC744 \uC720\uB3C4\uD574\uBCF4\uC138\uC694.` });

  if (retentionRate < 40) insights.push({ type: 'tip', title: '\uC7AC\uBC29\uBB38\uC728 \uAC1C\uC120', content: `\uC7AC\uBC29\uBB38\uC728\uC774 ${retentionRate}%. \uBA64\uBC84\uC2ED \uD61C\uD0DD\uC744 \uAC15\uD654\uD574\uBCF4\uC138\uC694.` });
  else insights.push({ type: 'success', title: '\uC6B0\uC218\uD55C \uC7AC\uBC29\uBB38\uC728', content: `\uC7AC\uBC29\uBB38\uC728 ${retentionRate}%! \uACE0\uAC1D \uB9CC\uC871\uB3C4\uAC00 \uB192\uC2B5\uB2C8\uB2E4.` });

  if (topMenus.length > 0) insights.push({ type: 'info', title: '\uC778\uAE30 \uBA54\uB274', content: `"${topMenus[0].menu}"\uAC00 \uAC00\uC7A5 \uC778\uAE30 \uC788\uC2B5\uB2C8\uB2E4 (${topMenus[0].count}\uAC74). \uAD00\uB828 \uD328\uD0A4\uC9C0 \uC0C1\uD488\uC744 \uACE0\uB824\uD574\uBCF4\uC138\uC694.` });

  return NextResponse.json({
    summary: {
      thisMonthRev, prevMonthRev, revenueGrowth,
      totalCustomers: customers.length, newCustomerRate, retentionRate,
      totalReservations: reservations.length, cancelRate, noShowRate,
      avgVisit, avgSpent,
    },
    charts: { dayDist, hourDist, topMenus, gradeDistribution, methodDist, staffPerformance },
    insights,
  });
}
