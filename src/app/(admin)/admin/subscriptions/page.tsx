'use client';

import { useState, useEffect } from 'react';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { AlertTriangle } from 'lucide-react';

export default function SubscriptionsPage() {
  const mob = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const store = useThemeStore();
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;

  const subscriptions = [
    { shop: '글로우 스킨케어', plan: 'Standard', amount: 29000, nextBill: '2026-10-01', lastPaid: '2026-09-01', status: '활성', method: '카드', unpaid: 0, unpaidCount: 0 },
    { shop: '뷰티라운지 강남', plan: 'Pro', amount: 69000, nextBill: '2026-10-05', lastPaid: '2026-08-05', status: '활성', method: '카드', unpaid: 69000, unpaidCount: 1 },
    { shop: '에스테틱 수', plan: 'Free', amount: 0, nextBill: '-', lastPaid: '-', status: '무료', method: '-', unpaid: 0, unpaidCount: 0 },
    { shop: '더마뷰티', plan: 'Enterprise', amount: 149000, nextBill: '2026-10-10', lastPaid: '2026-07-10', status: '활성', method: '계좌이체', unpaid: 298000, unpaidCount: 2 },
    { shop: '스킨랩 홍대', plan: 'Standard', amount: 29000, nextBill: '2026-09-15', lastPaid: '2026-06-15', status: '연체', method: '카드', unpaid: 87000, unpaidCount: 3 },
    { shop: '뷰티앤유 성수', plan: 'Pro', amount: 59000, nextBill: '2026-10-07', lastPaid: '2026-09-07', status: '활성', method: '카드', unpaid: 0, unpaidCount: 0 },
    { shop: '스킨마스터 판교', plan: 'Pro', amount: 59000, nextBill: '2026-09-30', lastPaid: '2026-08-30', status: '활성', method: '계좌이체', unpaid: 59000, unpaidCount: 1 },
  ];

  const getDday = (dateStr: string) => {
    if (!dateStr || dateStr === '-') return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getDdayStyle = (dday: number | null) => {
    if (dday === null) return { color: '#9CA3AF', text: '-' };
    if (dday < 0) return { color: '#EF4444', text: `D+${Math.abs(dday)}` };
    if (dday === 0) return { color: '#EF4444', text: 'D-Day' };
    if (dday <= 3) return { color: '#F59E0B', text: `D-${dday}` };
    if (dday <= 7) return { color: '#3B82F6', text: `D-${dday}` };
    return { color: '#6B7280', text: `D-${dday}` };
  };

  const totalUnpaid = subscriptions.reduce((sum, s) => sum + s.unpaid, 0);
  const unpaidShops = subscriptions.filter((s) => s.unpaid > 0).length;
  const totalRevenue = subscriptions.reduce((sum, s) => sum + s.amount, 0);
  const paidCount = subscriptions.filter((s) => s.amount > 0).length;
  const freeCount = subscriptions.filter((s) => s.amount === 0).length;
  const overdueCount = subscriptions.filter((s) => { const d = getDday(s.nextBill); return d !== null && d < 0; }).length;

  const summary = [
    { label: '월 총 매출', value: `₩${totalRevenue.toLocaleString()}`, color: c.text },
    { label: '유료 구독', value: `${paidCount}개`, color: c.text },
    { label: '총 미수금', value: `₩${totalUnpaid.toLocaleString()}`, color: totalUnpaid > 0 ? '#EF4444' : c.text },
    { label: '미수 매장', value: `${unpaidShops}개`, color: unpaidShops > 0 ? '#F59E0B' : c.text },
  ];

  return (
    <div className="space-y-6">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: mob ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: mob ? 10 : 16,
        }}
      >
        {summary.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border"
            style={{
              background: c.surface,
              borderColor: c.borderLight,
              padding: mob ? '12px' : '16px',
            }}
          >
            <p className="text-sm" style={{ color: c.textLight, fontSize: mob ? 12 : 14 }}>{s.label}</p>
            <p className="mt-1 font-bold" style={{ color: s.color, fontSize: mob ? 17 : 20 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: c.surface, borderColor: c.borderLight }}>
        {mob ? (
          <div className="divide-y" style={{ borderColor: c.borderLight }}>
            {subscriptions.map((s) => {
              const dday = getDday(s.nextBill);
              const ddayStyle = getDdayStyle(dday);
              return (
                <div key={s.shop} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base" style={{ color: c.text }}>{s.shop}</span>
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{ background: c.primaryLight, color: c.primary }}
                      >
                        {s.plan}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        s.status === '활성' ? 'text-green-600' : s.status === '연체' ? 'text-red-500' : 'text-gray-500'
                      }`}
                    >
                      ● {s.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span style={{ color: c.textLight }}>월 구독료: </span>
                      <span className="font-semibold" style={{ color: c.text }}>
                        {s.amount > 0 ? `₩${s.amount.toLocaleString()}` : '무료'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: c.textLight }}>결제수단: </span>
                      <span style={{ color: c.text }}>{s.method}</span>
                    </div>
                    <div>
                      <span style={{ color: c.textLight }}>다음 결제: </span>
                      <span style={{ color: c.text }}>{s.nextBill}</span>
                      <span className="ml-1 font-bold" style={{ color: ddayStyle.color }}>
                        ({ddayStyle.text})
                      </span>
                    </div>
                    <div>
                      <span style={{ color: c.textLight }}>마지막 결제: </span>
                      <span style={{ color: c.textLight }}>{s.lastPaid}</span>
                    </div>
                  </div>

                  {s.unpaid > 0 && (
                    <div
                      className="flex items-center justify-between rounded-lg p-2 text-xs"
                      style={{ background: '#FEF2F2' }}
                    >
                      <span className="text-red-700 font-medium">
                        미수금: ₩{s.unpaid.toLocaleString()}
                      </span>
                      {s.unpaidCount > 0 && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold"
                          style={{
                            background: s.unpaidCount >= 3 ? '#FEE2E2' : '#FEF3C7',
                            color: s.unpaidCount >= 3 ? '#EF4444' : '#F59E0B',
                          }}
                        >
                          <AlertTriangle className="h-3 w-3" />
                          {s.unpaidCount}회 연체
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: c.secondaryLight, borderBottom: `1px solid ${c.borderLight}` }}>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: c.textLight }}>매장</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: c.textLight }}>플랜</th>
                  <th className="px-4 py-3 text-right font-medium" style={{ color: c.textLight }}>월 구독료</th>
                  <th className="px-4 py-3 text-center font-medium" style={{ color: c.textLight }}>다음 결제</th>
                  <th className="px-4 py-3 text-center font-medium" style={{ color: c.textLight }}>D-Day</th>
                  <th className="px-4 py-3 text-right font-medium" style={{ color: c.textLight }}>미수금</th>
                  <th className="px-4 py-3 text-center font-medium" style={{ color: c.textLight }}>미수횟수</th>
                  <th className="px-4 py-3 text-center font-medium" style={{ color: c.textLight }}>마지막 결제</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: c.textLight }}>결제수단</th>
                  <th className="px-4 py-3 text-center font-medium" style={{ color: c.textLight }}>상태</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s) => {
                  const dday = getDday(s.nextBill);
                  const ddayStyle = getDdayStyle(dday);
                  return (
                    <tr key={s.shop} className="transition-colors"
                      style={{ borderBottom: `1px solid ${c.borderLight}` }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = c.surfaceHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                      <td className="px-4 py-3 font-medium" style={{ color: c.text }}>{s.shop}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{ background: c.primaryLight, color: c.primary }}>
                          {s.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium" style={{ color: c.text }}>
                        {s.amount > 0 ? `₩${s.amount.toLocaleString()}` : '무료'}
                      </td>
                      <td className="px-4 py-3 text-center" style={{ color: c.textLight }}>{s.nextBill}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-bold" style={{ color: ddayStyle.color }}>
                          {ddayStyle.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium" style={{ color: s.unpaid > 0 ? '#EF4444' : c.textLight }}>
                        {s.unpaid > 0 ? `₩${s.unpaid.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.unpaidCount > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold"
                            style={{ background: s.unpaidCount >= 3 ? '#FEE2E2' : '#FEF3C7', color: s.unpaidCount >= 3 ? '#EF4444' : '#F59E0B' }}>
                            <AlertTriangle className="h-3 w-3" />{s.unpaidCount}회
                          </span>
                        ) : (
                          <span style={{ color: c.textLight }}>-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center" style={{ color: c.textLight }}>{s.lastPaid}</td>
                      <td className="px-4 py-3" style={{ color: c.textLight }}>{s.method}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium ${
                          s.status === '활성' ? 'text-green-600' : s.status === '연체' ? 'text-red-500' : 'text-gray-500'
                        }`}>
                          ● {s.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
