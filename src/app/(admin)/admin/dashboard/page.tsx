'use client';

import { useState, useEffect } from 'react';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export default function AdminDashboard() {
  const mob = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const store = useThemeStore();
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;

  const stats = [
    { label: '전체 매장', value: '24', change: '+3', up: true, icon: Building2 },
    { label: '전체 사용자', value: '156', change: '+12', up: true, icon: Users },
    { label: '월 구독 매출', value: '₩4,860,000', change: '+8.2%', up: true, icon: CreditCard },
    { label: '활성 구독률', value: '91.7%', change: '-1.2%', up: false, icon: TrendingUp },
  ];

  const recentShops = [
    { name: '글로우 스킨케어', owner: '김미영', plan: 'Standard', status: '활성', date: '2026-09-01' },
    { name: '뷰티라운지 강남', owner: '박서연', plan: 'Pro', status: '활성', date: '2026-08-28' },
    { name: '에스테틱 수', owner: '이수진', plan: 'Free', status: '활성', date: '2026-08-25' },
    { name: '더마뷰티', owner: '최은하', plan: 'Enterprise', status: '활성', date: '2026-08-20' },
    { name: '스킨랩 홍대', owner: '정다영', plan: 'Standard', status: '만료', date: '2026-08-15' },
  ];

  const planDistribution = [
    { plan: 'Free', count: 8, color: '#9CA3AF' },
    { plan: 'Standard', count: 9, color: c.primary },
    { plan: 'Pro', count: 5, color: c.primaryDark },
    { plan: 'Enterprise', count: 2, color: c.accent },
  ];

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: mob ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: mob ? 10 : 16,
        }}
      >
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-xl border"
              style={{
                background: c.surface,
                borderColor: c.borderLight,
                padding: mob ? '12px' : '20px',
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm" style={{ color: c.textLight, fontSize: mob ? 12 : 14 }}>{s.label}</p>
                <div
                  className="flex items-center justify-center rounded-lg"
                  style={{
                    width: mob ? 32 : 40,
                    height: mob ? 32 : 40,
                    background: c.primaryLight,
                  }}
                >
                  <Icon className={mob ? 'h-4 w-4' : 'h-5 w-5'} style={{ color: c.primary }} />
                </div>
              </div>
              <p
                className="mt-2 font-bold"
                style={{ color: c.text, fontSize: mob ? 18 : 24 }}
              >
                {s.value}
              </p>
              <div className="mt-1 flex items-center gap-1 text-xs sm:text-sm">
                {s.up ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
                <span className={s.up ? 'text-green-600' : 'text-red-600'}>{s.change}</span>
                <span style={{ color: c.textLight, fontSize: mob ? 11 : 12 }}>이번 달</span>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: mob ? '1fr' : 'repeat(3, 1fr)',
          gap: mob ? 16 : 24,
        }}
      >
        {/* 최근 가입 매장 */}
        <div
          className={mob ? 'rounded-xl border' : 'lg:col-span-2 rounded-xl border'}
          style={{
            background: c.surface,
            borderColor: c.borderLight,
            padding: mob ? '14px' : '20px',
            gridColumn: mob ? 'span 1' : 'span 2',
          }}
        >
          <h2 className="font-bold mb-4" style={{ color: c.text, fontSize: mob ? 16 : 18 }}>최근 가입 매장</h2>
          {mob ? (
            <div className="space-y-2.5">
              {recentShops.map((shop) => (
                <div
                  key={shop.name}
                  className="rounded-lg border p-3"
                  style={{ borderColor: c.borderLight, background: c.background }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm" style={{ color: c.text }}>{shop.name}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ background: c.primaryLight, color: c.primary }}
                    >
                      {shop.plan}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs" style={{ color: c.textLight }}>
                    <span>원장: {shop.owner}</span>
                    <span className={`font-medium ${shop.status === '활성' ? 'text-green-600' : 'text-red-500'}`}>
                      ● {shop.status}
                    </span>
                    <span>{shop.date}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${c.borderLight}` }}>
                    <th className="pb-3 text-left font-medium" style={{ color: c.textLight }}>매장명</th>
                    <th className="pb-3 text-left font-medium" style={{ color: c.textLight }}>원장</th>
                    <th className="pb-3 text-left font-medium" style={{ color: c.textLight }}>플랜</th>
                    <th className="pb-3 text-left font-medium" style={{ color: c.textLight }}>상태</th>
                    <th className="pb-3 text-left font-medium" style={{ color: c.textLight }}>가입일</th>
                  </tr>
                </thead>
                <tbody>
                  {recentShops.map((shop) => (
                    <tr key={shop.name} style={{ borderBottom: `1px solid ${c.borderLight}` }}>
                      <td className="py-3 font-medium" style={{ color: c.text }}>{shop.name}</td>
                      <td className="py-3" style={{ color: c.textLight }}>{shop.owner}</td>
                      <td className="py-3">
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ background: c.primaryLight, color: c.primary }}
                        >
                          {shop.plan}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`text-xs font-medium ${shop.status === '활성' ? 'text-green-600' : 'text-red-500'}`}>
                          ● {shop.status}
                        </span>
                      </td>
                      <td className="py-3" style={{ color: c.textLight }}>{shop.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 플랜 분포 */}
        <div
          className="rounded-xl border"
          style={{
            background: c.surface,
            borderColor: c.borderLight,
            padding: mob ? '14px' : '20px',
          }}
        >
          <h2 className="font-bold mb-4" style={{ color: c.text, fontSize: mob ? 16 : 18 }}>플랜 분포</h2>
          <div className="space-y-4">
            {planDistribution.map((p) => (
              <div key={p.plan}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: c.text }}>{p.plan}</span>
                  <span className="text-sm" style={{ color: c.textLight }}>{p.count}개</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: c.borderLight }}>
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${(p.count / 24) * 100}%`, background: p.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4" style={{ borderTop: `1px solid ${c.borderLight}` }}>
            <p className="text-sm" style={{ color: c.textLight }}>총 매장 수</p>
            <p className="font-bold" style={{ color: c.text, fontSize: mob ? 24 : 30 }}>24</p>
          </div>
        </div>
      </div>
    </div>
  );
}
