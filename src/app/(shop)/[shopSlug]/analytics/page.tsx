'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { BrainCircuit, TrendingUp, TrendingDown, Users, Calendar, Star, AlertTriangle, Lightbulb, CheckCircle, Info, CreditCard, Banknote, Building } from 'lucide-react';

type AnalysisData = {
  summary: {
    thisMonthRev: number; prevMonthRev: number; revenueGrowth: number;
    totalCustomers: number; newCustomerRate: number; retentionRate: number;
    totalReservations: number; cancelRate: number; noShowRate: number;
    avgVisit: number; avgSpent: number;
  };
  charts: {
    dayDist: { day: string; count: number }[];
    hourDist: { hour: number; count: number }[];
    topMenus: { menu: string; count: number }[];
    gradeDistribution: Record<string, number>;
    methodDist: Record<string, number>;
    staffPerformance: { name: string; total: number; completed: number }[];
  };
  insights: { type: string; title: string; content: string }[];
};

export default function AnalyticsPage() {
  const params = useParams();
  const shopSlug = params.shopSlug as string;
  const mob = useIsMobile();
  const store = useThemeStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;

  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/shops/${shopSlug}/ai-analysis`);
        if (res.ok) setData(await res.json());
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [shopSlug]);

  if (!mounted) return null;

  const fmtNum = (n: number) => n.toLocaleString();
  const card = { background: 'white', borderRadius: 14, border: `1px solid ${c.borderLight}`, padding: mob ? '12px 14px' : '16px 18px' } as const;

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: c.textLight }}>분석 중...</div>;
  if (!data) return <div style={{ textAlign: 'center', padding: 80, color: c.textLight }}>데이터 불러오기 실패</div>;

  const { summary: s, charts: ch, insights } = data;
  const maxDay = Math.max(...ch.dayDist.map(d => d.count), 1);
  const maxHour = Math.max(...ch.hourDist.map(d => d.count), 1);
  const maxMenu = Math.max(...ch.topMenus.map(d => d.count), 1);

  const insightIcons: Record<string, { icon: any; color: string; bg: string }> = {
    success: { icon: CheckCircle, color: '#10B981', bg: '#D1FAE5' },
    warning: { icon: AlertTriangle, color: '#F59E0B', bg: '#FEF3C7' },
    info: { icon: Info, color: '#3B82F6', bg: '#DBEAFE' },
    tip: { icon: Lightbulb, color: '#8B5CF6', bg: '#EDE9FE' },
  };

  const gradeColors: Record<string, string> = { '일반': '#9CA3AF', '실버': '#60A5FA', '골드': '#FBBF24', 'VIP': '#F472B6' };
  const methodLabels: Record<string, { label: string; icon: any }> = { CARD: { label: '카드', icon: CreditCard }, CASH: { label: '현금', icon: Banknote }, TRANSFER: { label: '이체', icon: Building }, OTHER: { label: '기타', icon: CreditCard } };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: mob ? '14px 12px' : '20px 16px' }}>
      {/* AI 인사이트 */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: mob ? 13 : 14, fontWeight: 700, color: c.text, marginBottom: 8 }}>💡 AI 인사이트</h3>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : 'repeat(2, 1fr)', gap: mob ? 6 : 8 }}>
          {insights.map((ins, i) => {
            const ic = insightIcons[ins.type] || insightIcons.info;
            const Icon = ic.icon;
            return (
              <div key={i} style={{ ...card, borderLeft: `4px solid ${ic.color}`, padding: mob ? '10px 12px' : '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: mob ? 20 : 24, height: mob ? 20 : 24, borderRadius: 6, background: ic.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon style={{ width: mob ? 11 : 12, height: mob ? 11 : 12, color: ic.color }} />
                  </div>
                  <span style={{ fontSize: mob ? 11.5 : 12, fontWeight: 700, color: c.text }}>{ins.title}</span>
                </div>
                <div style={{ fontSize: mob ? 10.5 : 11, color: c.textLight, lineHeight: 1.5 }}>{ins.content}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        <div style={{ ...card, borderTop: `3px solid ${s.revenueGrowth >= 0 ? '#10B981' : '#EF4444'}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: c.textLight, marginBottom: 4 }}>당월 매출</div>
          <div style={{ fontSize: mob ? 20 : 22, fontWeight: 800, color: c.text }}>{fmtNum(s.thisMonthRev)}<span style={{ fontSize: 10, color: c.textLight }}>원</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            {s.revenueGrowth >= 0 ? <TrendingUp style={{ width: 12, height: 12, color: '#10B981' }} /> : <TrendingDown style={{ width: 12, height: 12, color: '#EF4444' }} />}
            <span style={{ fontSize: 11, fontWeight: 600, color: s.revenueGrowth >= 0 ? '#10B981' : '#EF4444' }}>{s.revenueGrowth >= 0 ? '+' : ''}{s.revenueGrowth}%</span>
            <span style={{ fontSize: 10, color: c.textLight }}>전월대비</span>
          </div>
        </div>
        <div style={{ ...card }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: c.textLight, marginBottom: 4 }}>고객 현황</div>
          <div style={{ fontSize: mob ? 20 : 22, fontWeight: 800, color: c.text }}>{fmtNum(s.totalCustomers)}<span style={{ fontSize: 10, color: c.textLight }}>명</span></div>
          <div style={{ fontSize: 10, color: c.textLight, marginTop: 4 }}>재방문율 <span style={{ fontWeight: 700, color: s.retentionRate >= 50 ? '#10B981' : '#F59E0B' }}>{s.retentionRate}%</span> · 평균 {s.avgVisit}회 방문</div>
        </div>
        <div style={{ ...card }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: c.textLight, marginBottom: 4 }}>예약 분석</div>
          <div style={{ fontSize: mob ? 20 : 22, fontWeight: 800, color: c.text }}>{fmtNum(s.totalReservations)}<span style={{ fontSize: 10, color: c.textLight }}>건</span></div>
          <div style={{ fontSize: 10, color: c.textLight, marginTop: 4 }}>취소 <span style={{ fontWeight: 700, color: s.cancelRate > 15 ? '#EF4444' : '#10B981' }}>{s.cancelRate}%</span> · 노쇼 <span style={{ fontWeight: 700, color: s.noShowRate > 5 ? '#EF4444' : '#10B981' }}>{s.noShowRate}%</span></div>
        </div>
      </div>

      {/* 차트: 모바일 1열 */}
      <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {/* 요일별 예약 */}
        <div style={{ ...card }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 12 }}>📅 요일별 예약 패턴</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
            {ch.dayDist.map((d, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ background: d.count === Math.max(...ch.dayDist.map(x => x.count)) ? c.primary : `${c.primary}60`, borderRadius: '4px 4px 0 0', height: Math.max((d.count / maxDay) * 80, 2), transition: 'height .3s' }} />
                <div style={{ fontSize: 10, color: c.textLight, marginTop: 4 }}>{d.day}</div>
                <div style={{ fontSize: 9, fontWeight: 600, color: c.primary }}>{d.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 시간대별 */}
        <div style={{ ...card }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 12 }}>⏰ 시간대별 예약</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 100 }}>
            {ch.hourDist.map((d, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ background: d.count === Math.max(...ch.hourDist.map(x => x.count)) ? '#3B82F6' : '#93C5FD', borderRadius: '3px 3px 0 0', height: Math.max((d.count / maxHour) * 80, 2) }} />
                <div style={{ fontSize: 8, color: c.textLight, marginTop: 2 }}>{d.hour}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {/* 인기 메뉴 TOP 5 */}
        <div style={{ ...card }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 12 }}>🏆 인기 메뉴 TOP 5</div>
          {ch.topMenus.length === 0 ? (
            <div style={{ fontSize: 11, color: c.textLight, padding: 20, textAlign: 'center' }}>데이터 없음</div>
          ) : (
            ch.topMenus.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ width: 18, height: 18, borderRadius: 4, background: i === 0 ? '#FBBF24' : i === 1 ? '#9CA3AF' : i === 2 ? '#CD7F32' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: i < 3 ? 'white' : c.textLight }}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: c.text }}>{m.menu}</div>
                  <div style={{ height: 4, borderRadius: 2, background: '#F3F4F6', marginTop: 3 }}>
                    <div style={{ height: '100%', borderRadius: 2, background: c.primary, width: `${(m.count / maxMenu) * 100}%`, transition: 'width .3s' }} />
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: c.primary }}>{m.count}</span>
              </div>
            ))
          )}
        </div>

        {/* 고객 등급 + 결제수단 */}
        <div style={{ ...card }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 12 }}>👥 고객 등급 분포</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {Object.entries(ch.gradeDistribution).map(([grade, count]) => (
              <div key={grade} style={{ flex: 1, textAlign: 'center', padding: '8px 4px', borderRadius: 8, background: gradeColors[grade] + '20' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: gradeColors[grade] }}>{count}</div>
                <div style={{ fontSize: 10, color: c.textLight }}>{grade}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 8 }}>💳 결제수단 비율</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(ch.methodDist).filter(([_, v]) => v > 0).map(([method, count]) => {
              const ml = methodLabels[method] || methodLabels.OTHER;
              const Icon = ml.icon;
              return (
                <div key={method} style={{ flex: mob ? '1 1 40%' : 1, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: c.textLight }}>
                  <Icon style={{ width: 12, height: 12 }} /> {ml.label} <span style={{ fontWeight: 700, color: c.text }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 직원 성과 */}
      {ch.staffPerformance.length > 0 && (
        <div style={{ ...card, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 12 }}>👩‍💼 직원별 성과</div>
          <div style={{ display: 'grid', gridTemplateColumns: mob ? 'repeat(2, 1fr)' : `repeat(${Math.min(ch.staffPerformance.length, 4)}, 1fr)`, gap: 10 }}>
            {ch.staffPerformance.map((sp, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '10px', borderRadius: 10, background: '#F9FAFB' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 4 }}>{sp.name}</div>
                <div style={{ fontSize: mob ? 18 : 20, fontWeight: 800, color: c.primary }}>{sp.completed}</div>
                <div style={{ fontSize: 10, color: c.textLight }}>완료 / {sp.total} 총예약</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
