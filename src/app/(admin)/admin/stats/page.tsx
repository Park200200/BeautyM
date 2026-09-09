'use client';

import { useState, useEffect } from 'react';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';

export default function StatsPage() {
  const [mounted, setMounted] = useState(false);
  const store = useThemeStore();
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;

  const monthlyRevenue = [
    { month: '4월', amount: 2900000 },
    { month: '5월', amount: 3180000 },
    { month: '6월', amount: 3760000 },
    { month: '7월', amount: 4120000 },
    { month: '8월', amount: 4580000 },
    { month: '9월', amount: 4860000 },
  ];
  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.amount));

  const moduleUsage = [
    { name: '예약 관리', usage: 100 },
    { name: '고객 관리', usage: 100 },
    { name: '시술 메뉴', usage: 100 },
    { name: '대시보드', usage: 67 },
    { name: '매출/정산', usage: 67 },
    { name: '멤버십', usage: 58 },
    { name: '알림', usage: 54 },
    { name: '직원 관리', usage: 29 },
    { name: '재고 관리', usage: 29 },
    { name: 'AI 분석', usage: 8 },
  ];

  return (
    <div className="space-y-6">
      {/* 월별 구독 매출 */}
      <div className="rounded-xl border p-5" style={{ background: c.surface, borderColor: c.borderLight }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: c.text }}>월별 구독 매출</h2>
        <div className="flex items-end gap-4 h-48">
          {monthlyRevenue.map((m) => (
            <div key={m.month} className="flex flex-col items-center flex-1 gap-1">
              <span className="text-xs font-medium" style={{ color: c.text }}>
                ₩{(m.amount / 10000).toFixed(0)}만
              </span>
              <div
                className="w-full rounded-t-lg transition-all"
                style={{
                  height: `${(m.amount / maxRevenue) * 150}px`,
                  background: `linear-gradient(to top, ${c.primary}, ${c.primaryDark || c.primary})`,
                }}
              />
              <span className="text-xs" style={{ color: c.textLight }}>{m.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 모듈 사용률 */}
      <div className="rounded-xl border p-5" style={{ background: c.surface, borderColor: c.borderLight }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: c.text }}>모듈 사용률 (매장 기준)</h2>
        <div className="space-y-3">
          {moduleUsage.map((m) => (
            <div key={m.name} className="flex items-center gap-4">
              <span className="text-sm w-24 flex-shrink-0" style={{ color: c.text }}>{m.name}</span>
              <div className="flex-1 h-3 rounded-full" style={{ background: c.borderLight }}>
                <div
                  className="h-3 rounded-full transition-all"
                  style={{ width: `${m.usage}%`, background: c.primary }}
                />
              </div>
              <span className="text-sm font-medium w-12 text-right" style={{ color: c.text }}>{m.usage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
