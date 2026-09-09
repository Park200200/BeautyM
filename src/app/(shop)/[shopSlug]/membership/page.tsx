'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { Gift, Search, X, Plus, Minus, Star, Ticket, ChevronRight, Crown, Award, Users } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';

type Member = {
  id: string; memberGrade: string; totalPoints: number; totalSpent: number; visitCount: number;
  user: { name: string; phone?: string | null; profileImage?: string | null };
};
type PointH = { id: string; amount: number; type: string; description?: string | null; createdAt: string };
type CouponT = { id: string; name: string; discountPercent?: number | null; validUntil: string; isUsed: boolean };

const GRADES = ['\uC77C\uBC18', '\uC2E4\uBC84', '\uACE8\uB4DC', 'VIP'];
const GRADE_COLORS: Record<string, { bg: string; text: string; icon: any }> = {
  '\uC77C\uBC18': { bg: '#F3F4F6', text: '#6B7280', icon: Users },
  '\uC2E4\uBC84': { bg: '#E0E7FF', text: '#4F46E5', icon: Award },
  '\uACE8\uB4DC': { bg: '#FEF3C7', text: '#D97706', icon: Crown },
  'VIP': { bg: '#FCE7F3', text: '#DB2777', icon: Star },
};

export default function MembershipPage() {
  const mob = useIsMobile();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopSlug = params.shopSlug as string;
  const store = useThemeStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;

  const [members, setMembers] = useState<Member[]>([]);
  const [gradeStats, setGradeStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterGrade, setFilterGrade] = useState('');

  // \uC0C1\uC138 \uBAA8\uB2EC
  const [selected, setSelected] = useState<Member | null>(null);
  const [pointHistory, setPointHistory] = useState<PointH[]>([]);
  const [coupons, setCoupons] = useState<CouponT[]>([]);
  const [tab, setTab] = useState<'point' | 'coupon'>('point');

  // \uD3EC\uC778\uD2B8 \uBAA8\uB2EC
  const [showPointModal, setShowPointModal] = useState(false);
  const [pointForm, setPointForm] = useState({ amount: 0, type: 'EARN' as 'EARN' | 'USE', desc: '' });

  // 쿠폰 모달
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponForm, setCouponForm] = useState({ name: '', discount: 10, days: 30 });

  // 포인트 설정
  const [showSettings, setShowSettings] = useState(false);
  const [pointRate, setPointRate] = useState(3); // 일반 등급 적립률
  const [gradeCriteria, setGradeCriteria] = useState<Record<string, { threshold: number; pointRate: number; discount: number }>>({
    '\uC2E4\uBC84': { threshold: 100000, pointRate: 5, discount: 3 },
    '\uACE8\uB4DC': { threshold: 300000, pointRate: 7, discount: 5 },
    'VIP': { threshold: 500000, pointRate: 10, discount: 10 },
  });
  const [paymentRates, setPaymentRates] = useState<Record<string, number>>({ CARD: 3, CASH: 5, TRANSFER: 4 });

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/membership`);
      if (res.ok) {
        const d = await res.json();
        setMembers(d.customers || []);
        setGradeStats(d.gradeStats || {});
        if (d.pointRate !== undefined) setPointRate(d.pointRate);
        if (d.gradeSettings) setGradeCriteria(d.gradeSettings);
        if (d.paymentRates) setPaymentRates(d.paymentRates);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, [shopSlug]);

  // 헤더의 포인트설정 탭 클릭 시 ?settings=1로 진입 → 모달 열기
  useEffect(() => {
    if (searchParams.get('settings') === '1') {
      setShowSettings(true);
      router.replace(`/${shopSlug}/membership`);
    }
  }, [searchParams]);

  const fetchDetail = async (m: Member) => {
    setSelected(m);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/membership?memberId=${m.id}`);
      if (res.ok) {
        const d = await res.json();
        setPointHistory(d.pointHistory || []);
        setCoupons(d.coupons || []);
      }
    } catch (e) { console.error(e); }
  };

  const handleGradeChange = async (m: Member, grade: string) => {
    try {
      await fetch(`/api/shops/${shopSlug}/membership`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: m.id, memberGrade: grade }),
      });
      fetchMembers();
      if (selected?.id === m.id) setSelected({ ...m, memberGrade: grade });
    } catch (e) { console.error(e); }
  };

  const handlePoint = async () => {
    if (!selected || pointForm.amount <= 0) return;
    try {
      await fetch(`/api/shops/${shopSlug}/membership`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: selected.id, points: pointForm.amount, pointType: pointForm.type, pointDesc: pointForm.desc.trim() || null }),
      });
      setShowPointModal(false);
      setPointForm({ amount: 0, type: 'EARN', desc: '' });
      fetchMembers(); fetchDetail(selected);
    } catch (e) { console.error(e); }
  };

  const handleCoupon = async () => {
    if (!selected || !couponForm.name.trim()) return;
    try {
      await fetch(`/api/shops/${shopSlug}/membership`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: selected.id, couponName: couponForm.name.trim(), couponDiscount: couponForm.discount, couponDays: couponForm.days }),
      });
      setShowCouponModal(false);
      setCouponForm({ name: '', discount: 10, days: 30 });
      fetchDetail(selected);
    } catch (e) { console.error(e); }
  };

  const handleSaveSettings = async () => {
    try {
      await fetch(`/api/shops/${shopSlug}/membership`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pointRate, gradeSettings: gradeCriteria, paymentRates }),
      });
      setShowSettings(false);
    } catch (e) { console.error(e); }
  };

  const filtered = members.filter(m => {
    if (search && !m.user.name.includes(search) && !m.user.phone?.includes(search)) return false;
    if (filterGrade && m.memberGrade !== filterGrade) return false;
    return true;
  });

  const fmtDate = (s: string) => new Date(s).toLocaleDateString('ko-KR');
  const fmtNum = (n: number) => n.toLocaleString();

  if (!mounted) return null;

  const card = { background: 'white', borderRadius: 14, border: `1px solid ${c.borderLight}` } as const;
  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${c.borderLight}`, fontSize: 13, outline: 'none' } as const;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: mob ? '14px 12px' : '20px 16px' }}>

      {/* 등급별 통계 (모바일 2열) */}
      <div style={{ display: 'grid', gridTemplateColumns: mob ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 8, marginBottom: mob ? 12 : 16 }}>
        {GRADES.map(g => {
          const gc = GRADE_COLORS[g];
          const Icon = gc.icon;
          const isActive = filterGrade === g;
          const gRate = g === '일반' ? pointRate : (gradeCriteria[g]?.pointRate || pointRate);
          const gDiscount = g === '일반' ? 0 : (gradeCriteria[g]?.discount || 0);
          return (
            <div key={g} onClick={() => setFilterGrade(isActive ? '' : g)}
              style={{ ...card, padding: mob ? '10px 12px' : '12px 14px', cursor: 'pointer', background: isActive ? gc.bg : 'white', borderColor: isActive ? gc.text + '40' : c.borderLight, transition: 'all .2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Icon style={{ width: 14, height: 14, color: gc.text }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: gc.text }}>{g}</span>
              </div>
              <div style={{ fontSize: mob ? 18 : 20, fontWeight: 800, color: isActive ? gc.text : c.text }}>{gradeStats[g] || 0}<span style={{ fontSize: 12, fontWeight: 400, color: c.textLight }}>명</span></div>
              <div style={{ fontSize: 10, color: c.textLight, marginTop: 3 }}>적립 {gRate}%{gDiscount > 0 ? ` · 할인 ${gDiscount}%` : ''}</div>
            </div>
          );
        })}
      </div>

      {/* 검색 */}
      <div style={{ position: 'relative', marginBottom: mob ? 12 : 16 }}>
        <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: c.textLight }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="고객명 · 전화번호 검색"
          style={{ ...inputStyle, paddingLeft: 32 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: (selected && !mob) ? '1fr 1fr' : '1fr', gap: 12 }}>
        {/* \uD68C\uC6D0 \uBAA9\uB85D */}
        <div style={{ ...card, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: c.textLight }}>{'\uB85C\uB529 \uC911...'}</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: c.textLight }}>{'\uACE0\uAC1D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4'}</div>
          ) : (
            filtered.map(m => {
              const gc = GRADE_COLORS[m.memberGrade] || GRADE_COLORS['\uC77C\uBC18'];
              return (
                <div key={m.id} onClick={() => fetchDetail(m)}
                  style={{ padding: '12px 16px', borderBottom: `1px solid ${c.borderLight}10`, cursor: 'pointer', background: selected?.id === m.id ? c.primaryLight + '20' : 'transparent', display: 'flex', alignItems: 'center', gap: 10, transition: 'background .15s' }}>
                  {m.user.profileImage ? (
                    <img src={m.user.profileImage} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: gc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: gc.text }}>{m.user.name[0]}</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: c.text }}>{m.user.name}</span>
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, fontWeight: 600, background: gc.bg, color: gc.text }}>{m.memberGrade}</span>
                    </div>
                    <div style={{ fontSize: 11, color: c.textLight }}>{fmtNum(m.totalPoints)}P {'\xB7'} {fmtNum(m.totalSpent)}{'\uC6D0'} {'\xB7'} {m.visitCount}{'\uD68C'}</div>
                  </div>
                  <ChevronRight style={{ width: 14, height: 14, color: c.textLight }} />
                </div>
              );
            })
          )}
        </div>

        {/* \uC0C1\uC138 \uD328\uB110 */}
        {selected && (
          <div style={{ ...card, padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: c.text }}>{selected.user.name}</div>
                <div style={{ fontSize: 12, color: c.textLight, marginTop: 2 }}>{fmtNum(selected.totalSpent)}{'\uC6D0 \uC0AC\uC6A9'} {'\xB7'} {selected.visitCount}{'\uD68C \uBC29\uBB38'}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textLight }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {/* \uB4F1\uAE09 \uBCC0\uACBD */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: c.textLight, marginBottom: 6 }}>{'\uB4F1\uAE09 \uBCC0\uACBD'}</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {GRADES.map(g => {
                  const gc = GRADE_COLORS[g];
                  const active = selected.memberGrade === g;
                  return (
                    <button key={g} onClick={() => handleGradeChange(selected, g)}
                      style={{ flex: 1, padding: '6px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${active ? gc.text : c.borderLight}`, background: active ? gc.bg : 'white', color: active ? gc.text : c.textLight }}>
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* \uD3EC\uC778\uD2B8 */}
            <div style={{ padding: '12px 14px', borderRadius: 10, background: '#F0FDF4', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: '#16A34A' }}>{'\uBCF4\uC720 \uD3EC\uC778\uD2B8'}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#16A34A' }}>{fmtNum(selected.totalPoints)}<span style={{ fontSize: 12, fontWeight: 400 }}>P</span></div>
              </div>
              <button onClick={() => { setShowPointModal(true); setPointForm({ amount: 0, type: 'EARN', desc: '' }); }}
                style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', background: '#22C55E', color: 'white', cursor: 'pointer' }}>
                {'\uC801\uB9BD/\uC0AC\uC6A9'}
              </button>
            </div>

            {/* \uCFE0\uD3F0 \uBC1C\uAE09 */}
            <button onClick={() => { setShowCouponModal(true); setCouponForm({ name: '', discount: 10, days: 30 }); }}
              style={{ width: '100%', padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1px solid ${c.primary}`, background: c.primaryLight + '20', color: c.primary, cursor: 'pointer', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Ticket style={{ width: 13, height: 13 }} /> {'\uCFE0\uD3F0 \uBC1C\uAE09'}
            </button>

            {/* \uD0ED */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${c.borderLight}`, marginBottom: 10 }}>
              {[{ k: 'point' as const, l: '\uD3EC\uC778\uD2B8 \uB0B4\uC5ED' }, { k: 'coupon' as const, l: '\uCFE0\uD3F0' }].map(t => (
                <button key={t.k} onClick={() => setTab(t.k)}
                  style={{ flex: 1, padding: '8px', fontSize: 12, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', color: tab === t.k ? c.primary : c.textLight, borderBottom: tab === t.k ? `2px solid ${c.primary}` : '2px solid transparent' }}>
                  {t.l}
                </button>
              ))}
            </div>

            {/* \uD3EC\uC778\uD2B8 \uB0B4\uC5ED */}
            {tab === 'point' && (
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {pointHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 20, fontSize: 12, color: c.textLight }}>{'\uD3EC\uC778\uD2B8 \uB0B4\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4'}</div>
                ) : pointHistory.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${c.borderLight}10`, fontSize: 12 }}>
                    <div>
                      <span style={{ color: c.text }}>{p.description || (p.type === 'EARN' ? '\uC801\uB9BD' : '\uC0AC\uC6A9')}</span>
                      <span style={{ color: c.textLight, marginLeft: 6 }}>{fmtDate(p.createdAt)}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: p.amount > 0 ? '#22C55E' : '#EF4444' }}>{p.amount > 0 ? '+' : ''}{fmtNum(p.amount)}P</span>
                  </div>
                ))}
              </div>
            )}

            {/* \uCFE0\uD3F0 */}
            {tab === 'coupon' && (
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {coupons.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 20, fontSize: 12, color: c.textLight }}>{'\uCFE0\uD3F0\uC774 \uC5C6\uC2B5\uB2C8\uB2E4'}</div>
                ) : coupons.map(cp => (
                  <div key={cp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${c.borderLight}10`, fontSize: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, color: cp.isUsed ? c.textLight : c.text }}>{cp.name} {cp.discountPercent && `${cp.discountPercent}%`}</div>
                      <div style={{ fontSize: 10, color: c.textLight }}>~{fmtDate(cp.validUntil)}</div>
                    </div>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 600, background: cp.isUsed ? '#F3F4F6' : '#DCFCE7', color: cp.isUsed ? '#9CA3AF' : '#22C55E' }}>
                      {cp.isUsed ? '\uC0AC\uC6A9\uC644\uB8CC' : '\uC0AC\uC6A9\uAC00\uB2A5'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* \uD3EC\uC778\uD2B8 \uBAA8\uB2EC */}
      {showPointModal && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: mob ? 10 : 0 }}
          onClick={() => setShowPointModal(false)}>
          <div style={{ background: 'white', borderRadius: 16, padding: mob ? '20px 16px' : '24px 28px', width: mob ? '95vw' : '100%', maxWidth: mob ? '95vw' : 360 }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 4 }}>{selected.user.name}</h3>
            <div style={{ fontSize: 12, color: c.textLight, marginBottom: 16 }}>{'\uBCF4\uC720'}: <strong>{fmtNum(selected.totalPoints)}P</strong></div>

            <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: `1px solid ${c.borderLight}`, marginBottom: 14 }}>
              <button onClick={() => setPointForm({...pointForm, type: 'EARN'})}
                style={{ flex: 1, padding: '8px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: pointForm.type === 'EARN' ? '#22C55E' : 'white', color: pointForm.type === 'EARN' ? 'white' : c.textLight }}>
                <Plus style={{ width: 12, height: 12, display: 'inline', verticalAlign: -2, marginRight: 3 }} />{'\uC801\uB9BD'}
              </button>
              <button onClick={() => setPointForm({...pointForm, type: 'USE'})}
                style={{ flex: 1, padding: '8px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: pointForm.type === 'USE' ? '#EF4444' : 'white', color: pointForm.type === 'USE' ? 'white' : c.textLight }}>
                <Minus style={{ width: 12, height: 12, display: 'inline', verticalAlign: -2, marginRight: 3 }} />{'\uC0AC\uC6A9'}
              </button>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'block', marginBottom: 4 }}>{'\uD3EC\uC778\uD2B8'}</label>
              <input type="number" value={pointForm.amount || ''} onChange={e => setPointForm({...pointForm, amount: parseInt(e.target.value) || 0})} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'block', marginBottom: 4 }}>{'\uC0AC\uC720'}</label>
              <input value={pointForm.desc} onChange={e => setPointForm({...pointForm, desc: e.target.value})} placeholder={'\uC608: \uC0DD\uC77C \uCD95\uD558 \uD3EC\uC778\uD2B8'} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowPointModal(false)} style={{ padding: '8px 18px', borderRadius: 10, fontSize: 13, border: `1px solid ${c.borderLight}`, background: 'white', cursor: 'pointer', color: c.text }}>{'\uCDE8\uC18C'}</button>
              <button onClick={handlePoint} disabled={pointForm.amount <= 0}
                style={{ padding: '8px 22px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: pointForm.amount <= 0 ? 0.5 : 1, background: pointForm.type === 'EARN' ? '#22C55E' : '#EF4444', color: 'white' }}>
                {pointForm.type === 'EARN' ? `${fmtNum(pointForm.amount)}P \uC801\uB9BD` : `${fmtNum(pointForm.amount)}P \uC0AC\uC6A9`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* \uCFE0\uD3F0 \uBAA8\uB2EC */}
      {showCouponModal && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: mob ? 10 : 0 }}
          onClick={() => setShowCouponModal(false)}>
          <div style={{ background: 'white', borderRadius: 16, padding: mob ? '20px 16px' : '24px 28px', width: mob ? '95vw' : '100%', maxWidth: mob ? '95vw' : 360 }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 16 }}>{selected.user.name}{'\uB2D8 \uCFE0\uD3F0 \uBC1C\uAE09'}</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'block', marginBottom: 4 }}>{'\uCFE0\uD3F0\uBA85'} *</label>
                <input value={couponForm.name} onChange={e => setCouponForm({...couponForm, name: e.target.value})} placeholder={'\uC608: \uC0DD\uC77C \uCD95\uD558 \uCFE0\uD3F0'} style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'block', marginBottom: 4 }}>{'\uD560\uC778\uC728 (%)'}</label>
                  <input type="number" value={couponForm.discount || ''} onChange={e => setCouponForm({...couponForm, discount: parseInt(e.target.value) || 0})} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'block', marginBottom: 4 }}>{'\uC720\uD6A8\uAE30\uAC04 (\uC77C)'}</label>
                  <input type="number" value={couponForm.days || ''} onChange={e => setCouponForm({...couponForm, days: parseInt(e.target.value) || 0})} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button onClick={() => setShowCouponModal(false)} style={{ padding: '8px 18px', borderRadius: 10, fontSize: 13, border: `1px solid ${c.borderLight}`, background: 'white', cursor: 'pointer', color: c.text }}>{'\uCDE8\uC18C'}</button>
                <button onClick={handleCoupon} disabled={!couponForm.name.trim()}
                  style={{ padding: '8px 22px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: 'none', background: c.primary, color: c.textOnPrimary, cursor: 'pointer', opacity: !couponForm.name.trim() ? 0.5 : 1 }}>
                  {'\uBC1C\uAE09'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 포인트 설정 모달 */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: mob ? 10 : 0 }}
          onClick={() => setShowSettings(false)}>
          <div style={{ background: 'white', borderRadius: 16, padding: mob ? '20px 16px' : '24px 28px', width: mob ? '95vw' : '100%', maxWidth: mob ? '95vw' : 400, maxHeight: mob ? '90vh' : 'auto', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text }}>{'\uD3EC\uC778\uD2B8 \uC124\uC815'}</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textLight }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* 결제수단별 적립률 */}
            <div style={{ padding: '14px 16px', borderRadius: 12, background: '#F0FDF4', border: '1px solid #BBF7D0', marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#16A34A', display: 'block', marginBottom: 10 }}>{'\uACB0\uC81C\uC218\uB2E8\uBCC4 \uD3EC\uC778\uD2B8 \uC801\uB9BD\uB960 (\uC77C\uBC18 \uB4F1\uAE09 \uAE30\uC900)'}</label>
              {[{ key: 'CARD', label: '\uD0A4\uB4DC', emoji: '\uD83D\uDCB3' }, { key: 'CASH', label: '\uD604\uAE08', emoji: '\uD83D\uDCB5' }, { key: 'TRANSFER', label: '\uACC4\uC88C\uC774\uCCB4', emoji: '\uD83C\uDFE6' }].map(pm => (
                <div key={pm.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 80, fontSize: 12, fontWeight: 600, color: '#374151' }}>{pm.emoji} {pm.label}</span>
                  <input type="number" value={paymentRates[pm.key] || ''} onChange={e => setPaymentRates({...paymentRates, [pm.key]: parseInt(e.target.value) || 0})}
                    style={{ width: 60, padding: '6px 10px', borderRadius: 8, border: '1px solid #BBF7D0', fontSize: 14, fontWeight: 700, textAlign: 'center', outline: 'none' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#16A34A' }}>%</span>
                </div>
              ))}
            </div>

            {/* 등급별 혜택 설정 */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'block', marginBottom: 10 }}>{'\uB4F1\uAE09\uBCC4 \uD61C\uD0DD \uC124\uC815'}</label>
              <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 60px 60px', gap: 4, alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: c.textLight }}></span>
                <span style={{ fontSize: 10, color: c.textLight }}>{'\uC2B9\uAE09\uAE30\uC900'}</span>
                <span style={{ fontSize: 10, color: c.textLight, textAlign: 'center' }}>{'\uC801\uB9BD\uB960'}</span>
                <span style={{ fontSize: 10, color: c.textLight, textAlign: 'center' }}>{'\uD560\uC778\uB960'}</span>
              </div>
              {['\uC2E4\uBC84', '\uACE8\uB4DC', 'VIP'].map(g => {
                const gc = GRADE_COLORS[g];
                const gd = gradeCriteria[g] || { threshold: 0, pointRate: 0, discount: 0 };
                return (
                  <div key={g} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 60px 60px', gap: 4, alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: gc.text, background: gc.bg, padding: '3px 6px', borderRadius: 6, textAlign: 'center' }}>{g}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input value={gd.threshold ? gd.threshold.toLocaleString() : ''} onChange={e => { const v = parseInt(e.target.value.replace(/,/g, '')) || 0; setGradeCriteria({...gradeCriteria, [g]: {...gd, threshold: v}}); }}
                        style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: `1px solid ${c.borderLight}`, fontSize: 12, outline: 'none' }} />
                      <span style={{ fontSize: 10, color: c.textLight }}>{'\uC6D0'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                      <input type="number" value={gd.pointRate || ''} onChange={e => setGradeCriteria({...gradeCriteria, [g]: {...gd, pointRate: parseInt(e.target.value) || 0}})}
                        style={{ width: 36, padding: '6px 4px', borderRadius: 6, border: `1px solid ${c.borderLight}`, fontSize: 12, textAlign: 'center', outline: 'none' }} />
                      <span style={{ fontSize: 10, color: c.textLight }}>%</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                      <input type="number" value={gd.discount || ''} onChange={e => setGradeCriteria({...gradeCriteria, [g]: {...gd, discount: parseInt(e.target.value) || 0}})}
                        style={{ width: 36, padding: '6px 4px', borderRadius: 6, border: `1px solid ${c.borderLight}`, fontSize: 12, textAlign: 'center', outline: 'none' }} />
                      <span style={{ fontSize: 10, color: c.textLight }}>%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 설명 */}
            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#F9FAFB', marginBottom: 16, fontSize: 11, color: c.textLight, lineHeight: 1.6 }}>
              {'\uACB0\uC81C\uC218\uB2E8\uBCC4 \uC801\uB9BD: \uD604\uAE08 > \uACC4\uC88C\uC774\uCCB4 > \uCE74\uB4DC \uC21C\uC73C\uB85C \uB192\uC740 \uC801\uB9BD\uB960 \uAD8C\uC7A5'}<br/>
              {'\uB4F1\uAE09 \uC2B9\uAE09: \uB204\uC801 \uACB0\uC81C \uAE08\uC561\uC774 \uAE30\uC900\uC744 \uB118\uC73C\uBA74 \uC790\uB3D9 \uC2B9\uAE09'}<br/>
              {'\uB4F1\uAE09\uBCC4 \uC801\uB9BD\uB960: \uAE30\uBCF8 \uC801\uB9BD\uB960\uC5D0 \uB4F1\uAE09 \uC801\uB9BD\uB960\uC774 \uCD94\uAC00 \uC801\uC6A9'}
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowSettings(false)} style={{ padding: '8px 18px', borderRadius: 10, fontSize: 13, border: `1px solid ${c.borderLight}`, background: 'white', cursor: 'pointer', color: c.text }}>{'\uCDE8\uC18C'}</button>
              <button onClick={handleSaveSettings}
                style={{ padding: '8px 22px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: 'none', background: c.primary, color: c.textOnPrimary, cursor: 'pointer' }}>
                {'\uC800\uC7A5'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
