'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Building2, MapPin, Users, CalendarCheck, TrendingUp, Plus, ExternalLink, Crown } from 'lucide-react';

type ShopInfo = {
  id: string; slug: string; name: string; planName: string; isCurrent: boolean;
  staffCount: number; customerCount: number; monthRevenue: number; todayReservations: number;
};

export default function BranchesPage() {
  const params = useParams();
  const router = useRouter();
  const shopSlug = params.shopSlug as string;
  const mob = useIsMobile();
  const store = useThemeStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;

  const [shops, setShops] = useState<ShopInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/shops/${shopSlug}/multi-shop`);
        if (res.ok) { const d = await res.json(); setShops(d.shops || []); }
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [shopSlug]);

  const fmtNum = (n: number) => n.toLocaleString();

  if (!mounted) return null;

  const card = { background: 'white', borderRadius: 14, border: `1px solid ${c.borderLight}` } as const;

  // 통합 통계
  const totalStaff = shops.reduce((s, sh) => s + sh.staffCount, 0);
  const totalCustomers = shops.reduce((s, sh) => s + sh.customerCount, 0);
  const totalRevenue = shops.reduce((s, sh) => s + sh.monthRevenue, 0);
  const totalReservations = shops.reduce((s, sh) => s + sh.todayReservations, 0);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: mob ? '14px 12px' : '20px 16px' }}>
      {/* 통합 통계 */}
      <div style={{ display: 'grid', gridTemplateColumns: mob ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: '전체 직원', value: totalStaff, unit: '명', icon: Users, accent: '#3B82F6' },
          { label: '전체 고객', value: totalCustomers, unit: '명', icon: Users, accent: '#8B5CF6' },
          { label: '이번 달 총매출', value: totalRevenue, unit: '원', icon: TrendingUp, accent: '#10B981' },
          { label: '오늘 총예약', value: totalReservations, unit: '건', icon: CalendarCheck, accent: '#F59E0B' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} style={{ ...card, padding: mob ? '10px 12px' : '14px 16px', borderTop: `3px solid ${item.accent}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Icon style={{ width: mob ? 13 : 14, height: mob ? 13 : 14, color: item.accent }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: item.accent }}>{item.label}</span>
              </div>
              <div style={{ fontSize: mob ? 18 : 22, fontWeight: 800, color: c.text }}>{fmtNum(item.value)}<span style={{ fontSize: 11, fontWeight: 400, color: c.textLight }}>{item.unit}</span></div>
            </div>
          );
        })}
      </div>

      {/* 매장 리스트 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: c.textLight }}>로딩 중...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {shops.map(sh => (
            <div key={sh.id} style={{ ...card, overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow .2s' }}
              onClick={() => { if (!sh.isCurrent) router.push(`/${sh.slug}/dashboard`); }}>
              {/* 헤더 */}
              <div style={{ padding: mob ? '12px 14px' : '16px 18px', borderBottom: `1px solid ${c.borderLight}10` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: sh.isCurrent ? c.primary : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 style={{ width: 16, height: 16, color: sh.isCurrent ? 'white' : c.textLight }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>{sh.name}</div>
                      <div style={{ fontSize: 10, color: c.textLight }}>{sh.planName} 플랜</div>
                    </div>
                  </div>
                  {sh.isCurrent ? (
                    <span style={{ fontSize: 10, fontWeight: 600, color: c.primary, background: c.primaryLight + '30', padding: '2px 8px', borderRadius: 6 }}>현재</span>
                  ) : (
                    <ExternalLink style={{ width: 14, height: 14, color: c.textLight }} />
                  )}
                </div>
              </div>

              {/* 통계 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, padding: mob ? '10px 14px' : '12px 18px' }}>
                <div>
                  <div style={{ fontSize: 10, color: c.textLight }}>직원</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: c.text }}>{sh.staffCount}<span style={{ fontSize: 10, color: c.textLight }}>명</span></div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: c.textLight }}>고객</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: c.text }}>{fmtNum(sh.customerCount)}<span style={{ fontSize: 10, color: c.textLight }}>명</span></div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: c.textLight }}>월 매출</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#10B981' }}>{fmtNum(sh.monthRevenue)}<span style={{ fontSize: 10, color: c.textLight }}>원</span></div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: c.textLight }}>오늘 예약</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#3B82F6' }}>{sh.todayReservations}<span style={{ fontSize: 10, color: c.textLight }}>건</span></div>
                </div>
              </div>
            </div>
          ))}

          {/* 매장 추가 카드 */}
          <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: mob ? 120 : 180, cursor: 'pointer', borderStyle: 'dashed' }}>
            <div style={{ textAlign: 'center', color: c.textLight }}>
              <Plus style={{ width: 28, height: 28, margin: '0 auto 8px', color: c.borderLight }} />
              <div style={{ fontSize: 13, fontWeight: 600 }}>새 매장 추가</div>
              <div style={{ fontSize: 10, marginTop: 2 }}>플랜 업그레이드 필요</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
