'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { LayoutDashboard, CalendarCheck, TrendingUp, Users, Clock, CreditCard, Banknote, Building } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';

type DashData = {
  reservations: { today: Stat; week: Stat; month: Stat };
  sales: { today: Sales; week: Sales; month: Sales; year: Sales };
  customers: { total: number; todayNew: number; weekNew: number; monthNew: number; yearNew: number };
  charts: { dailySales: { date: string; amount: number; count: number }[]; hourlyDist: { hour: string; count: number }[] };
};
type Stat = { total: number; completed: number; waiting: number; inProgress: number; cancelled: number; noShow: number };
type Sales = { total: number; card: number; cash: number; transfer: number; count: number };

export default function DashboardPage() {
  const mob = useIsMobile();
  const params = useParams();
  const shopSlug = params.shopSlug as string;
  const store = useThemeStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;

  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/shops/${shopSlug}/dashboard`);
        if (res.ok) setData(await res.json());
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [shopSlug]);

  if (!mounted) return null;

  const fmtNum = (n: number) => n.toLocaleString();
  const card = { background: 'white', borderRadius: 14, border: `1px solid ${c.borderLight}`, padding: mob ? '12px 14px' : '16px 18px' } as const;

  if (loading) return <div style={{ textAlign: 'center', padding: mob ? 40 : 80, color: c.textLight }}>{'\uB85C\uB529 \uC911...'}</div>;
  if (!data) return <div style={{ textAlign: 'center', padding: mob ? 40 : 80, color: c.textLight }}>{'\uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4'}</div>;

  const { reservations: r, sales: s, customers: cu, charts: ch } = data;
  const maxSales = Math.max(...ch.dailySales.map(d => d.amount), 1);
  const maxHourly = Math.max(...ch.hourlyDist.map(d => d.count), 1);

  return (
    <div style={{ maxWidth: mob ? '100%' : 900, margin: '0 auto', padding: mob ? 12 : 20 }}>
      {/* ===== 1. 예약 현황 ===== */}
      <div style={{ marginBottom: mob ? 14 : 20 }}>
        <h3 style={{ fontSize: mob ? 13 : 14, fontWeight: 700, color: c.text, marginBottom: mob ? 8 : 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CalendarCheck style={{ width: 15, height: 15, color: c.primary }} /> 예약 현황
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: mob ? 8 : 10 }}>
          {[
            { label: '오늘', data: r.today, accent: '#10B981' },
            { label: '주간', data: r.week, accent: '#3B82F6' },
            { label: '당월', data: r.month, accent: '#8B5CF6' },
          ].map(item => (
            <div key={item.label} style={{ ...card, borderTop: `3px solid ${item.accent}` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: item.accent, marginBottom: 8 }}>{item.label}</div>
              <div style={{ fontSize: mob ? 22 : 26, fontWeight: 800, color: c.text, marginBottom: 8 }}>{item.data.total}<span style={{ fontSize: 12, fontWeight: 400, color: c.textLight }}>건</span></div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#D1FAE5', color: '#059669' }}>완료 {item.data.completed}</span>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#FEF3C7', color: '#D97706' }}>대기 {item.data.waiting}</span>
                {item.data.inProgress > 0 && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#DBEAFE', color: '#2563EB' }}>진행 {item.data.inProgress}</span>}
                {item.data.cancelled > 0 && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#FEE2E2', color: '#DC2626' }}>취소 {item.data.cancelled}</span>}
                {item.data.noShow > 0 && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#F3F4F6', color: '#6B7280' }}>노쇼 {item.data.noShow}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 2. 매출 현황 ===== */}
      <div style={{ marginBottom: mob ? 14 : 20 }}>
        <h3 style={{ fontSize: mob ? 13 : 14, fontWeight: 700, color: c.text, marginBottom: mob ? 8 : 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrendingUp style={{ width: 15, height: 15, color: c.primary }} /> 매출 현황
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: mob ? 8 : 10 }}>
          {[
            { label: '오늘 매출', amount: s.today.total, sub: `주간 누적 ${fmtNum(s.week.total)}원`, accent: '#10B981', sales: s.today },
            { label: '주간 매출', amount: s.week.total, sub: `${s.week.count}건 결제`, accent: '#3B82F6', sales: s.week },
            { label: '당월 매출', amount: s.month.total, sub: `연간 누적 ${fmtNum(s.year.total)}원`, accent: '#8B5CF6', sales: s.month },
            { label: '연간 매출', amount: s.year.total, sub: `${s.year.count}건 결제`, accent: '#F59E0B', sales: s.year },
          ].map(item => (
            <div key={item.label} style={{ ...card }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: item.accent, marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: mob ? 17 : 22, fontWeight: 800, color: c.text }}>{fmtNum(item.amount)}<span style={{ fontSize: 12, fontWeight: 400, color: c.textLight }}>원</span></div>
              <div style={{ fontSize: 10, color: c.textLight, marginBottom: 8 }}>{item.sub}</div>
              <div style={{ display: 'flex', gap: mob ? 4 : 8, flexWrap: 'wrap', fontSize: 10, color: c.textLight }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><CreditCard style={{ width: 10, height: 10 }} /> {fmtNum(item.sales.card)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Banknote style={{ width: 10, height: 10 }} /> {fmtNum(item.sales.cash)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Building style={{ width: 10, height: 10 }} /> {fmtNum(item.sales.transfer)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 3. 고객 현황 ===== */}
      <div style={{ marginBottom: mob ? 14 : 20 }}>
        <h3 style={{ fontSize: mob ? 13 : 14, fontWeight: 700, color: c.text, marginBottom: mob ? 8 : 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Users style={{ width: 15, height: 15, color: c.primary }} /> 고객 현황
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: mob ? 8 : 10 }}>
          {[
            { label: '전체 고객', value: cu.total, unit: '명', accent: '#6B7280' },
            { label: '오늘 신규', value: cu.todayNew, unit: '명', accent: '#10B981' },
            { label: '주간 신규', value: cu.weekNew, unit: '명', accent: '#3B82F6' },
            { label: '당월 신규', value: cu.monthNew, unit: '명', accent: '#8B5CF6' },
            { label: '연간 신규', value: cu.yearNew, unit: '명', accent: '#F59E0B' },
          ].map(item => (
            <div key={item.label} style={{ ...card, textAlign: 'center', padding: mob ? '10px 8px' : '14px 10px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: item.accent, marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontSize: mob ? 18 : 22, fontWeight: 800, color: c.text }}>{item.value}</div>
              <div style={{ fontSize: 10, color: c.textLight }}>{item.unit}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 4. 차트 ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: mob ? 8 : 10 }}>
        {/* 일별 매출 추이 */}
        <div style={{ ...card }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp style={{ width: 13, height: 13, color: c.primary }} /> 최근 7일 매출
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100 }}>
            {ch.dailySales.map((d, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ background: `${c.primary}${d.amount > 0 ? '' : '30'}`, borderRadius: '4px 4px 0 0', height: Math.max((d.amount / maxSales) * 80, 2), transition: 'height .3s' }} />
                <div style={{ fontSize: 9, color: c.textLight, marginTop: 3 }}>{d.date}</div>
                {d.amount > 0 && <div style={{ fontSize: 8, color: c.primary, fontWeight: 600 }}>{(d.amount / 10000).toFixed(0)}만</div>}
              </div>
            ))}
          </div>
        </div>

        {/* 시간대별 예약 */}
        <div style={{ ...card }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock style={{ width: 13, height: 13, color: c.primary }} /> 오늘 시간대별 예약
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 100 }}>
            {ch.hourlyDist.map((d, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ background: d.count > 0 ? '#3B82F6' : '#E5E7EB', borderRadius: '4px 4px 0 0', height: Math.max((d.count / maxHourly) * 80, 2), transition: 'height .3s' }} />
                <div style={{ fontSize: 8, color: c.textLight, marginTop: 3 }}>{d.hour}</div>
                {d.count > 0 && <div style={{ fontSize: 8, color: '#3B82F6', fontWeight: 600 }}>{d.count}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
