'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, User, Phone, Mail, MapPin, FileText, MessageSquare, CheckCircle2, ArrowLeft, Sparkles, Crown, Zap, Shield, X } from 'lucide-react';

const PLANS: Record<string, { name: string; price: string; monthly: number; color: string; icon: any; features: string[] }> = {
  Standard: { name: 'Standard', price: '29,000원/월', monthly: 29000, color: '#40BFA3', icon: Zap, features: ['Free 기능 전부', '고객 수 무제한', '매출/정산', '멤버십/포트폴리오', '대시보드', '알림톡/SMS'] },
  Pro: { name: 'Pro', price: '69,000원/월', monthly: 69000, color: '#2DD4A8', icon: Crown, features: ['Standard 기능 전부', '직원 관리 (10명)', '직원별 권한 설정', '재고 관리'] },
  Enterprise: { name: 'Enterprise', price: '149,000원/월', monthly: 149000, color: '#0D9488', icon: Shield, features: ['Pro 기능 전부', '다중 매장 (5개)', 'AI 분석', '커스텀 도메인', '직원 무제한'] },
};

function ApplyForm() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan') || 'Standard';
  const plan = PLANS[planParam] || PLANS.Standard;
  const PlanIcon = plan.icon;

  const [form, setForm] = useState({ shopName: '', ownerName: '', phone: '', email: '', address: '', bizNumber: '', memo: '' });
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [referralCode, setReferralCode] = useState('');
  const [dealerName, setDealerName] = useState('');
  const [dealerDiscount, setDealerDiscount] = useState(0);
  const [codeVerified, setCodeVerified] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // 신청확인
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [checkForm, setCheckForm] = useState({ phone: '', bizNumber: '' });
  const [checkResult, setCheckResult] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState('');

  const handlePhone = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 11);
    let f = nums;
    if (nums.length > 3 && nums.length <= 7) f = `${nums.slice(0,3)}-${nums.slice(3)}`;
    else if (nums.length > 7) f = `${nums.slice(0,3)}-${nums.slice(3,7)}-${nums.slice(7)}`;
    setForm({ ...form, phone: f });
  };

  const handleBiz = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 10);
    let f = nums;
    if (nums.length > 3 && nums.length <= 5) f = `${nums.slice(0,3)}-${nums.slice(3)}`;
    else if (nums.length > 5) f = `${nums.slice(0,3)}-${nums.slice(3,5)}-${nums.slice(5)}`;
    setForm({ ...form, bizNumber: f });
  };

  const handleCodeChange = (val: string) => {
    const code = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setReferralCode(code);
    setDealerName('');
    setDealerDiscount(0);
    setCodeVerified(false);
    setCodeError('');
  };

  const verifyCode = async () => {
    if (!referralCode) return;
    setVerifying(true);
    setCodeError('');
    try {
      const res = await fetch(`/api/admin/dealers/verify?code=${referralCode}`);
      const data = await res.json();
      if (data.valid) {
        setDealerName(data.dealerName);
        setDealerDiscount(data.discountRate || 0);
        setCodeVerified(true);
        setCodeError('');
      } else {
        setDealerName('');
        setDealerDiscount(0);
        setCodeVerified(false);
        setCodeError('유효하지 않은 할인코드입니다');
      }
    } catch { setCodeError('검증 중 오류가 발생했습니다'); }
    setVerifying(false);
  };

  const handleCheckPhone = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 11);
    let f = nums;
    if (nums.length > 3 && nums.length <= 7) f = `${nums.slice(0,3)}-${nums.slice(3)}`;
    else if (nums.length > 7) f = `${nums.slice(0,3)}-${nums.slice(3,7)}-${nums.slice(7)}`;
    setCheckForm({ ...checkForm, phone: f });
  };

  const handleCheckApplication = async () => {
    if (!checkForm.phone.trim() && !checkForm.bizNumber.trim()) { setCheckError('전화번호 또는 사업자등록번호를 입력하세요'); return; }
    setChecking(true); setCheckError(''); setCheckResult(null);
    try {
      const params = new URLSearchParams();
      if (checkForm.phone) params.set('phone', checkForm.phone.replace(/-/g, ''));
      if (checkForm.bizNumber) params.set('bizNumber', checkForm.bizNumber.replace(/-/g, ''));
      const res = await fetch(`/api/admin/registrations/check?${params}`);
      const data = await res.json();
      if (res.ok && data.length > 0) { setCheckResult(data); }
      else { setCheckError('일치하는 신청 내역이 없습니다'); }
    } catch { setCheckError('조회 중 오류가 발생했습니다'); }
    setChecking(false);
  };

  const handleSubmit = async () => {
    if (!form.shopName.trim()) { setError('매장명을 입력해주세요'); return; }
    if (!form.ownerName.trim()) { setError('대표자명을 입력해주세요'); return; }
    if (!form.phone || form.phone.replace(/-/g, '').length < 10) { setError('연락처를 확인해주세요'); return; }
    if (!form.email || !form.email.includes('@')) { setError('이메일을 확인해주세요'); return; }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/admin/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName: form.shopName.trim(),
          ownerName: form.ownerName.trim(),
          phone: form.phone,
          email: form.email.trim(),
          planId: planParam,
          address: form.address.trim() || null,
          bizNumber: form.bizNumber.replace(/-/g, '') || null,
          memo: (referralCode ? `[추천코드: ${referralCode}] ` : '') + `[결제: ${billingCycle === 'yearly' ? '연결제' : '월결제'}] ` + (form.memo.trim() || ''),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || '신청에 실패했습니다');
      }
    } catch (err: any) {
      setError(err?.message || '네트워크 오류가 발생했습니다');
    }
    setSubmitting(false);
  };

  if (success) return (
    <div style={{ minHeight: '100vh', background: '#f8fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle2 style={{ width: 40, height: 40, color: '#065F46' }} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', marginBottom: 8 }}>신청이 완료되었습니다!</h2>
        <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.8 }}>
          <strong>{plan.name}</strong> 플랜 신청이 접수되었습니다.<br />
          담당자가 확인 후 빠르게 연락드리겠습니다.<br />
          영업일 기준 1~2일 이내 처리됩니다.
        </p>
        <div style={{ background: 'white', borderRadius: 16, padding: '16px 20px', marginTop: 20, border: '1px solid #f3f4f6', textAlign: 'left', fontSize: 13, color: '#374151' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ color: '#9CA3AF' }}>매장명</span><span style={{ fontWeight: 600 }}>{form.shopName}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ color: '#9CA3AF' }}>플랜</span><span style={{ fontWeight: 600, color: plan.color }}>{plan.name} ({plan.price})</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#9CA3AF' }}>연락처</span><span style={{ fontWeight: 600 }}>{form.phone}</span></div>
        </div>
        <Link href="/" style={{ display: 'inline-block', marginTop: 24, padding: '10px 28px', background: '#40BFA3', color: 'white', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );

  const inputStyle = { width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: 12, fontSize: 14, outline: 'none', transition: 'border-color .15s' };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafb' }}>
      {/* 헤더 */}
      <header style={{ background: 'white', borderBottom: '1px solid #f3f4f6', padding: '12px 20px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#1a1a2e' }}>
            <ArrowLeft style={{ width: 18, height: 18, color: '#6B7280' }} />
            <Sparkles style={{ width: 22, height: 22, color: '#40BFA3' }} />
            <span style={{ fontSize: 16, fontWeight: 800 }}>BeautyM</span>
          </Link>
          <button onClick={() => { setShowCheckModal(true); setCheckResult(null); setCheckError(''); setCheckForm({ phone: '', bizNumber: '' }); }}
            style={{ padding: '6px 14px', background: 'rgba(64,191,163,0.1)', color: '#40BFA3', border: '1px solid rgba(64,191,163,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            신청확인
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 20px 60px' }}>
        {/* 플랜 소개 카드 */}
        <div style={{ background: 'white', borderRadius: 20, padding: '24px 24px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 24, border: `2px solid ${plan.color}20` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `${plan.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PlanIcon style={{ width: 24, height: 24, color: plan.color }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: plan.color, textTransform: 'uppercase' as const }}>{plan.name} Plan</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e' }}>{plan.price}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF' }}>추천인 할인코드</div>
              {codeVerified ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ padding: '7px 12px', background: '#D1FAE5', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#065F46' }}>
                    {dealerName}
                  </div>
                  <button onClick={() => { setReferralCode(''); setDealerName(''); setDealerDiscount(0); setCodeVerified(false); }} style={{ padding: '4px 8px', background: '#F3F4F6', border: 'none', borderRadius: 6, fontSize: 10, cursor: 'pointer', color: '#6B7280' }}>변경</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    value={referralCode}
                    onChange={e => handleCodeChange(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && verifyCode()}
                    placeholder="코드 입력"
                    style={{ width: 100, padding: '7px 10px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 12, textAlign: 'center', outline: 'none', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' as const }}
                    onFocus={e => (e.target.style.borderColor = plan.color)}
                    onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
                  />
                  <button onClick={verifyCode} disabled={!referralCode || verifying} style={{ padding: '7px 10px', background: plan.color, color: 'white', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: !referralCode || verifying ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                    {verifying ? '...' : '적용'}
                  </button>
                </div>
              )}
            </div>
          </div>
          {codeError && (
            <div style={{ textAlign: 'right', fontSize: 11, color: '#DC2626', fontWeight: 600, marginTop: -4, marginBottom: 4 }}>{codeError}</div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {plan.features.map(f => (
              <span key={f} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${plan.color}12`, color: plan.color, fontWeight: 600 }}>
                {f}
              </span>
            ))}
          </div>

          {/* 결제 주기 선택 */}
          <div style={{ marginTop: 14, display: 'flex', gap: 6 }}>
            {([
              { id: 'monthly' as const, label: '월 결제' },
              { id: 'yearly' as const, label: '연 결제 (2개월 무료)' },
            ]).map(opt => (
              <button key={opt.id} onClick={() => setBillingCycle(opt.id)}
                style={{ flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `2px solid ${billingCycle === opt.id ? plan.color : '#e5e7eb'}`, background: billingCycle === opt.id ? `${plan.color}12` : 'white', color: billingCycle === opt.id ? plan.color : '#6B7280', transition: 'all .15s' }}>
                {opt.label}
              </button>
            ))}
          </div>

          {/* 결제 금액 안내 */}
          {(() => {
            const isYearly = billingCycle === 'yearly';
            const discountedMonthly = dealerDiscount > 0 ? Math.round(plan.monthly * (1 - dealerDiscount / 100)) : plan.monthly;

            if (!isYearly) {
              // 월 결제
              const save = plan.monthly - discountedMonthly;
              return (
                <div style={{ marginTop: 12, padding: '14px 16px', background: '#F9FAFB', borderRadius: 14, border: `1px solid ${codeVerified ? plan.color + '40' : '#f3f4f6'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>월 결제</span>
                    {codeVerified && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#D1FAE5', color: '#065F46' }}>추천 {dealerDiscount}% 할인</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      {save > 0 && <div style={{ fontSize: 11, color: '#9CA3AF', textDecoration: 'line-through' }}>₩{plan.monthly.toLocaleString()}/월</div>}
                      <div style={{ fontSize: 20, fontWeight: 800, color: save > 0 ? '#DC2626' : plan.color }}>₩{discountedMonthly.toLocaleString()}/월</div>
                    </div>
                    {save > 0 && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 800 }}>-{dealerDiscount}%</div>
                        <div style={{ fontSize: 11, color: '#6B7280' }}>₩{save.toLocaleString()} 절약</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // 연 결제
            const base10 = plan.monthly * 10;
            const discounted10 = discountedMonthly * 10;
            const totalSave = plan.monthly * 12 - discounted10;
            const totalDiscountPct = Math.round((1 - discounted10 / (plan.monthly * 12)) * 100);
            return (
              <div style={{ marginTop: 12, padding: '14px 16px', background: '#F9FAFB', borderRadius: 14, border: `1px solid ${codeVerified ? plan.color + '40' : '#f3f4f6'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>12개월 결제 시</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#FEF3C7', color: '#92400E' }}>2개월 무료</span>
                    {codeVerified && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#D1FAE5', color: '#065F46' }}>추천 {dealerDiscount}% 추가</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', textDecoration: 'line-through' }}>정가 ₩{(plan.monthly * 12).toLocaleString()}</div>
                    {codeVerified && dealerDiscount > 0 && base10 !== discounted10 && (
                      <div style={{ fontSize: 11, color: '#9CA3AF', textDecoration: 'line-through' }}>2개월 무료 ₩{base10.toLocaleString()}</div>
                    )}
                    <div style={{ fontSize: 20, fontWeight: 800, color: codeVerified ? '#DC2626' : plan.color }}>₩{discounted10.toLocaleString()}</div>
                    {codeVerified && <div style={{ fontSize: 10, color: '#6B7280' }}>월 ₩{discountedMonthly.toLocaleString()} × 10개월</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 800 }}>-{totalDiscountPct}% 할인</div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>₩{totalSave.toLocaleString()} 절약</div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* 신청 폼 */}
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e', marginBottom: 4 }}>서비스 신청</h2>
        <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 24 }}>매장 정보를 입력해주세요. 검토 후 빠르게 연락드리겠습니다.</p>

        {/* 매장명 */}
        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}><Building2 style={{ width: 13, height: 13, color: '#40BFA3' }} /> 매장명 *</div>
          <input style={inputStyle} value={form.shopName} onChange={e => setForm({ ...form, shopName: e.target.value })} placeholder="매장 이름을 입력하세요" onFocus={e => (e.target.style.borderColor = '#40BFA3')} onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
        </div>

        {/* 대표자명 */}
        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}><User style={{ width: 13, height: 13, color: '#40BFA3' }} /> 대표자명 *</div>
          <input style={inputStyle} value={form.ownerName} onChange={e => setForm({ ...form, ownerName: e.target.value })} placeholder="대표자 성함" onFocus={e => (e.target.style.borderColor = '#40BFA3')} onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
        </div>

        {/* 연락처 + 이메일 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={labelStyle}><Phone style={{ width: 13, height: 13, color: '#40BFA3' }} /> 연락처 *</div>
            <input style={inputStyle} value={form.phone} onChange={e => handlePhone(e.target.value)} placeholder="010-0000-0000" inputMode="tel" onFocus={e => (e.target.style.borderColor = '#40BFA3')} onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
          </div>
          <div>
            <div style={labelStyle}><Mail style={{ width: 13, height: 13, color: '#40BFA3' }} /> 이메일 *</div>
            <input style={inputStyle} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="example@email.com" type="email" onFocus={e => (e.target.style.borderColor = '#40BFA3')} onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
          </div>
        </div>

        {/* 주소 */}
        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}><MapPin style={{ width: 13, height: 13, color: '#40BFA3' }} /> 매장 주소</div>
          <input style={inputStyle} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="시/구/동 상세주소" onFocus={e => (e.target.style.borderColor = '#40BFA3')} onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
        </div>

        {/* 사업자등록번호 */}
        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}><FileText style={{ width: 13, height: 13, color: '#40BFA3' }} /> 사업자등록번호</div>
          <input style={inputStyle} value={form.bizNumber} onChange={e => handleBiz(e.target.value)} placeholder="000-00-00000" inputMode="numeric" onFocus={e => (e.target.style.borderColor = '#40BFA3')} onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
        </div>

        {/* 메모 */}
        <div style={{ marginBottom: 24 }}>
          <div style={labelStyle}><MessageSquare style={{ width: 13, height: 13, color: '#40BFA3' }} /> 요청사항</div>
          <textarea style={{ ...inputStyle, resize: 'none' as const }} value={form.memo} onChange={e => setForm({ ...form, memo: e.target.value })} placeholder="추가 요청사항이 있으시면 입력해주세요" rows={3} onFocus={e => (e.target.style.borderColor = '#40BFA3')} onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
        </div>

        {/* 에러 */}
        {error && <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 12 }}>{error}</div>}

        {/* 제출 */}
        <button onClick={handleSubmit} disabled={submitting} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, #40BFA3, #2DD4A8)', color: 'white', fontSize: 15, fontWeight: 700, border: 'none', borderRadius: 14, cursor: 'pointer', transition: 'all .2s', opacity: submitting ? 0.6 : 1 }}>
          {submitting ? '신청 접수 중...' : `${plan.name} 플랜 신청하기`}
        </button>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF', marginTop: 12 }}>
          신청 후 담당자 확인을 거쳐 서비스가 개설됩니다. 영업일 1~2일 소요.
        </p>
      </div>

      {/* 신청확인 모달 */}
      {showCheckModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 420, background: 'white', borderRadius: 20, padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e' }}>신청 확인</h3>
              <button onClick={() => setShowCheckModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X style={{ width: 20, height: 20, color: '#6B7280' }} />
              </button>
            </div>

            <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>신청 시 입력한 전화번호 또는 사업자등록번호로 조회합니다.</p>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>전화번호</label>
              <input value={checkForm.phone} onChange={e => handleCheckPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCheckApplication()}
                placeholder="010-0000-0000" style={{ ...inputStyle }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>사업자등록번호</label>
              <input value={checkForm.bizNumber}
                onChange={e => {
                  const nums = e.target.value.replace(/\D/g, '').slice(0, 10);
                  let f = nums;
                  if (nums.length > 3 && nums.length <= 5) f = `${nums.slice(0,3)}-${nums.slice(3)}`;
                  else if (nums.length > 5) f = `${nums.slice(0,3)}-${nums.slice(3,5)}-${nums.slice(5)}`;
                  setCheckForm({ ...checkForm, bizNumber: f });
                }}
                onKeyDown={e => e.key === 'Enter' && handleCheckApplication()}
                placeholder="000-00-00000" style={{ ...inputStyle }} />
            </div>

            <button onClick={handleCheckApplication} disabled={checking || (!checkForm.phone && !checkForm.bizNumber)}
              style={{ width: '100%', padding: '12px 0', background: '#40BFA3', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: checking || (!checkForm.phone && !checkForm.bizNumber) ? 0.5 : 1 }}>
              {checking ? '조회 중...' : '조회하기'}
            </button>

            {checkError && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: '#FEF2F2', borderRadius: 10, fontSize: 12, color: '#DC2626', fontWeight: 600, textAlign: 'center' }}>{checkError}</div>
            )}

            {checkResult && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>조회 결과 ({checkResult.length}건)</div>
                {checkResult.map((r: any, i: number) => {
                  const statusMap: Record<string, { label: string; bg: string; color: string }> = {
                    PENDING: { label: '검토 중', bg: '#FEF3C7', color: '#92400E' },
                    APPROVED: { label: '승인', bg: '#D1FAE5', color: '#065F46' },
                    PENDING_SETUP: { label: '설정 중', bg: '#DBEAFE', color: '#1E40AF' },
                    REJECTED: { label: '거절', bg: '#FEE2E2', color: '#991B1B' },
                  };
                  const s = statusMap[r.status] || statusMap.PENDING;
                  return (
                    <div key={i} style={{ padding: '12px 14px', background: '#F9FAFB', borderRadius: 12, border: '1px solid #f3f4f6' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{r.shopName}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: s.bg, color: s.color }}>{s.label}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#6B7280' }}>
                        {r.ownerName} | {r.planId || '미선택'} | {new Date(r.createdAt).toLocaleDateString('ko-KR')}
                      </div>
                      {r.status === 'REJECTED' && (
                        <div style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>
                          거절 사유: {r.rejectionType || '-'} {r.rejectedReason ? `— ${r.rejectedReason}` : ''}
                        </div>
                      )}
                      {r.status === 'APPROVED' && r.reviewedAt && (
                        <div style={{ fontSize: 11, color: '#065F46', marginTop: 4 }}>
                          승인일: {new Date(r.reviewedAt).toLocaleDateString('ko-KR')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>로딩 중...</div>}>
      <ApplyForm />
    </Suspense>
  );
}
