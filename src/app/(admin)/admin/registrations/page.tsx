'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  Check, X, Clock, CheckCircle, XCircle, Settings,
  Send, Search,
} from 'lucide-react';

interface Registration {
  id: string; shopName: string; ownerName: string; phone: string; email: string;
  address: string | null; planId: string | null; planName: string | null;
  bizNumber: string | null; bizType: string | null; bizCategory: string | null;
  taxEmail: string | null; memo: string | null;
  status: string; createdAt: string; reviewedAt: string | null; reviewedBy: string | null;
  rejectedReason: string | null; salesPerson: string | null;
  approvalType: string | null; rejectionType: string | null;
  createdShopId: string | null; isReusable: boolean | null; notifiedAt: string | null;
}

interface PlanItem { id: string; name: string; price: number; description: string | null; }

const REJECTION_TYPES = ['서류미비', '지역제한', '중복신청', '업종부적합', '기타'];

export default function RegistrationsPage() {
  const mob = useIsMobile();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const store = useThemeStore();
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');

  // 거절 모달
  const [rejectModal, setRejectModal] = useState<Registration | null>(null);
  const [processing, setProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState('관리자');

  const [rejectForm, setRejectForm] = useState({
    rejectionType: '서류미비', rejectedReason: '', reviewedBy: '',
  });

  // 승인 모달
  const [approveModal, setApproveModal] = useState<Registration | null>(null);
  const [approveForm, setApproveForm] = useState({
    planId: '',
    billingCycle: 'monthly' as 'monthly' | 'yearly',
    billingDay: '1',
    serviceStart: '',
    serviceEnd: '',
    approvalType: '정규신청',
    salesPerson: '',
    memo: '',
  });

  const fetchData = async () => {
    try {
      const [regRes, planRes] = await Promise.all([
        fetch('/api/admin/registrations'),
        fetch('/api/admin/plans'),
      ]);
      if (regRes.ok) setRegistrations(await regRes.json());
      if (planRes.ok) setPlans(await planRes.json());

      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const me = await meRes.json();
        setCurrentUser(me.name || '관리자');
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);
  // 딜러 할인 정보
  const [dealerInfo, setDealerInfo] = useState<{ name: string; discountRate: number; code: string } | null>(null);

  // 승인 모달 열기
  const handleApprove = async (reg: Registration) => {
    const today = new Date().toISOString().slice(0, 10);
    const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10);
    setApproveModal(reg);
    setApproveForm({
      planId: reg.planId || '',
      billingCycle: 'monthly',
      billingDay: '1',
      serviceStart: today,
      serviceEnd: nextYear,
      approvalType: '정규신청',
      salesPerson: reg.salesPerson || '',
      memo: reg.memo || '',
    });

    // 메모에서 추천코드 파싱
    setDealerInfo(null);
    const codeMatch = reg.memo?.match(/\[추천코드:\s*([A-Z0-9]+)\]/);
    if (codeMatch) {
      try {
        const res = await fetch(`/api/admin/dealers/verify?code=${codeMatch[1]}`);
        const data = await res.json();
        if (data.valid) {
          setDealerInfo({ name: data.dealerName, discountRate: data.discountRate || 0, code: codeMatch[1] });
          setApproveForm(prev => ({ ...prev, approvalType: '딜러추천' }));
        }
      } catch { /* ignore */ }
    }
  };

  // 승인 확정
  const submitApprove = async () => {
    if (!approveModal) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/registrations/${approveModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          approvalType: approveForm.approvalType,
          salesPerson: approveForm.salesPerson,
          reviewedBy: currentUser,
          planId: approveForm.planId,
          billingCycle: approveForm.billingCycle,
          billingDay: approveForm.billingDay,
          serviceStart: approveForm.serviceStart,
          serviceEnd: approveForm.serviceEnd,
          memo: approveForm.memo,
        }),
      });
      const data = await res.json();
      if (res.ok && data.createdShopId) {
        setMessage(`"${approveModal.shopName}" 승인 완료!`);
        setApproveModal(null);
        fetchData();
      } else {
        setMessage(data.error || '승인 실패');
      }
    } catch { setMessage('처리 실패'); }
    setProcessing(false);
  };

  // 거절
  const handleReject = async () => {
    if (!rejectModal) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/registrations/${rejectModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject', ...rejectForm,
          salesPerson: rejectModal.salesPerson || '',
          reviewedBy: currentUser,
        }),
      });
      const data = await res.json();
      setMessage(data.message || data.error);
      if (res.ok) { setRejectModal(null); fetchData(); }
    } catch { setMessage('처리 실패'); }
    setProcessing(false);
  };

  const counts = {
    pending: registrations.filter((r) => r.status === 'PENDING').length,
    approved: registrations.filter((r) => r.status === 'APPROVED' || r.status === 'PENDING_SETUP').length,
    rejected: registrations.filter((r) => r.status === 'REJECTED').length,
  };

  const filtered = registrations
    .filter((r) => {
      if (tab === 'PENDING') return r.status === 'PENDING';
      if (tab === 'APPROVED') return r.status === 'APPROVED' || r.status === 'PENDING_SETUP';
      if (tab === 'REJECTED') return r.status === 'REJECTED';
      return true;
    })
    .filter((r) =>
      !search || r.shopName.includes(search) || r.ownerName.includes(search) || r.email.includes(search)
    )
    // 대기(PENDING) 먼저, 승인/거절은 아래로
    .sort((a, b) => {
      const order: Record<string, number> = { PENDING: 0, PENDING_SETUP: 1, APPROVED: 2, REJECTED: 3 };
      return (order[a.status] ?? 9) - (order[b.status] ?? 9);
    });

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock className="h-3 w-3" />, label: '대기' },
      PENDING_SETUP: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Settings className="h-3 w-3" />, label: '설정중' },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="h-3 w-3" />, label: '승인' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle className="h-3 w-3" />, label: '거절' },
    };
    const s = map[status] || map.PENDING;
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>
        {s.icon} {s.label}
      </span>
    );
  };

  const tabs = [
    { id: 'PENDING' as const, label: '신규 대기', count: counts.pending, color: 'bg-yellow-500' },
    { id: 'APPROVED' as const, label: '승인 완료', count: counts.approved, color: 'bg-green-500' },
    { id: 'REJECTED' as const, label: '거절', count: counts.rejected, color: 'bg-red-500' },
    { id: 'ALL' as const, label: '전체', count: registrations.length, color: 'bg-gray-500' },
  ];

  return (
    <div className="space-y-6">
      {/* 상단: 검색 + 탭 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1" style={{ maxWidth: mob ? '100%' : 384 }}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: c.textLight }} />
          <input type="text" placeholder="매장명, 대표자, 이메일 검색..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border py-2 pl-10 pr-4 text-sm outline-none"
            style={{ borderColor: c.border, background: c.surface, color: c.text }} />
        </div>
        <div
          className="flex gap-2"
          style={{
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            paddingBottom: mob ? 4 : 0,
          }}
        >
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 rounded-lg font-medium transition-all flex-shrink-0"
              style={{
                fontSize: mob ? 11 : 12,
                padding: mob ? '6px 10px' : '8px 12px',
                background: tab === t.id ? c.primary : 'transparent',
                color: tab === t.id ? c.textOnPrimary : c.text,
                border: `1px solid ${tab === t.id ? c.primary : c.border}`,
              }}>
              {t.label}
              {t.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tab === t.id ? 'bg-white/20 text-white' : `${t.color} text-white`}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className="rounded-lg border px-4 py-3 text-sm flex items-center gap-2"
          style={{ background: c.primaryLight, color: c.primary, borderColor: c.primary }}>
          <Send className="h-4 w-4" /> {message}
        </div>
      )}

      {/* 테이블 / 모바일 카드 */}
      <div className="rounded-xl border overflow-hidden" style={{ background: c.surface, borderColor: c.borderLight }}>
        {loading ? (
          <div className="p-8 text-center" style={{ color: c.textLight }}>로딩 중...</div>
        ) : mob ? (
          <div className="divide-y" style={{ borderColor: c.borderLight }}>
            {filtered.map((reg) => (
              <div key={reg.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-base" style={{ color: c.text }}>{reg.shopName}</p>
                    {reg.address && (
                      <p className="text-xs mt-0.5" style={{ color: c.textLight }}>{reg.address}</p>
                    )}
                  </div>
                  <div>{statusBadge(reg.status)}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span style={{ color: c.textLight }}>대표자: </span>
                    <span className="font-medium" style={{ color: c.text }}>{reg.ownerName}</span>
                  </div>
                  <div>
                    <span style={{ color: c.textLight }}>연락처: </span>
                    <span style={{ color: c.text }}>{reg.phone}</span>
                  </div>
                  <div className="col-span-2">
                    <span style={{ color: c.textLight }}>이메일: </span>
                    <span style={{ color: c.text }}>{reg.email}</span>
                  </div>
                  <div>
                    <span style={{ color: c.textLight }}>요청 플랜: </span>
                    {reg.planName ? (
                      <span className="rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{ background: c.primaryLight, color: c.primary }}>
                        {reg.planName}
                      </span>
                    ) : (
                      <span style={{ color: c.textLight }}>미선택</span>
                    )}
                  </div>
                  <div>
                    <span style={{ color: c.textLight }}>신청일: </span>
                    <span style={{ color: c.textLight }}>
                      {new Date(reg.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>

                <div className="pt-2.5 border-t flex items-center justify-end gap-2" style={{ borderColor: c.borderLight }}>
                  {reg.status === 'PENDING' ? (
                    <>
                      <button onClick={() => { setRejectModal(reg); setRejectForm({ rejectionType: '서류미비', rejectedReason: '', reviewedBy: currentUser }); }}
                        className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium text-red-500"
                        style={{ borderColor: '#FCA5A5' }}>
                        <X className="h-3.5 w-3.5" /> 거절
                      </button>
                      <button onClick={() => handleApprove(reg)} disabled={processing}
                        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                        style={{ background: '#22C55E' }}>
                        <Check className="h-3.5 w-3.5" /> 승인
                      </button>
                    </>
                  ) : reg.status === 'APPROVED' || reg.status === 'PENDING_SETUP' ? (
                    <button onClick={() => reg.createdShopId && router.push(`/admin/shops/${reg.createdShopId}`)}
                      className="text-xs font-medium rounded-lg border px-3 py-1.5"
                      style={{ borderColor: c.primary, color: c.primary }}>
                      거래처 상세
                    </button>
                  ) : (
                    <span className="text-xs" style={{ color: c.textLight }}>
                      거절 사유: {reg.rejectionType || '-'}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-8 text-center" style={{ color: c.textLight }}>
                {search ? '검색 결과가 없습니다.' : '가입 신청이 없습니다.'}
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: c.secondaryLight, borderBottom: `1px solid ${c.borderLight}` }}>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: c.textLight }}>매장</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: c.textLight }}>대표자</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: c.textLight }}>연락처</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: c.textLight }}>요청 플랜</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: c.textLight }}>신청일</th>
                  <th className="px-4 py-3 text-center font-medium" style={{ color: c.textLight }}>상태</th>
                  <th className="px-4 py-3 text-center font-medium" style={{ color: c.textLight }}>처리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((reg) => (
                  <tr key={reg.id} style={{ borderBottom: `1px solid ${c.borderLight}`, cursor: reg.status === 'PENDING' ? 'pointer' : 'default' }}
                    className="transition-colors"
                    onClick={() => reg.status === 'PENDING' && handleApprove(reg)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = c.surfaceHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <td className="px-4 py-3">
                      <p className="font-medium" style={{ color: c.text }}>{reg.shopName}</p>
                      {reg.address && <p className="text-xs" style={{ color: c.textLight }}>{reg.address}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p style={{ color: c.text }}>{reg.ownerName}</p>
                      <p className="text-xs" style={{ color: c.textLight }}>{reg.email}</p>
                    </td>
                    <td className="px-4 py-3" style={{ color: c.text }}>{reg.phone}</td>
                    <td className="px-4 py-3">
                      {reg.planName ? (
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{ background: c.primaryLight, color: c.primary }}>
                          {reg.planName}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: c.textLight }}>미선택</span>
                      )}
                    </td>
                    <td className="px-4 py-3" style={{ color: c.textLight }}>
                      {new Date(reg.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {statusBadge(reg.status)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {reg.status === 'PENDING' ? (
                        <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => handleApprove(reg)} disabled={processing}
                            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                            style={{ background: '#22C55E' }}>
                            <Check className="h-3 w-3" /> 승인
                          </button>
                          <button onClick={() => { setRejectModal(reg); setRejectForm({ rejectionType: '서류미비', rejectedReason: '', reviewedBy: currentUser }); }}
                            className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium text-red-500"
                            style={{ borderColor: '#FCA5A5' }}>
                            <X className="h-3 w-3" /> 거절
                          </button>
                        </div>
                      ) : reg.status === 'APPROVED' || reg.status === 'PENDING_SETUP' ? (
                        <button onClick={() => reg.createdShopId && router.push(`/admin/shops/${reg.createdShopId}`)}
                          className="text-xs font-medium rounded-lg border px-3 py-1.5 transition-colors"
                          style={{ borderColor: c.primary, color: c.primary }}>
                          거래처 상세
                        </button>
                      ) : (
                        <span className="text-xs" style={{ color: c.textLight }}>
                          {reg.rejectionType || '-'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center" style={{ color: c.textLight }}>
                    {search ? '검색 결과가 없습니다.' : '가입 신청이 없습니다.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: `1px solid ${c.borderLight}` }}>
          <p className="text-sm" style={{ color: c.textLight }}>총 {filtered.length}건</p>
        </div>
      </div>

      {/* ============================================ */}
      {/* 거절 모달 */}
      {/* ============================================ */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="rounded-2xl shadow-2xl"
            style={{
              background: c.surface,
              width: mob ? '95vw' : 448,
              maxWidth: mob ? '95vw' : 448,
              maxHeight: mob ? '90vh' : '85vh',
              overflowY: 'auto',
              padding: mob ? '16px' : '24px',
            }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: c.text }}>거절 처리</h2>
                <p className="text-sm" style={{ color: c.textLight }}>{rejectModal.shopName} — {rejectModal.ownerName}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>거절 구분 *</label>
                <select value={rejectForm.rejectionType}
                  onChange={(e) => setRejectForm({ ...rejectForm, rejectionType: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: c.border, color: c.text }}>
                  {REJECTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>상세 사유</label>
                <textarea value={rejectForm.rejectedReason}
                  onChange={(e) => setRejectForm({ ...rejectForm, rejectedReason: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none"
                  style={{ borderColor: c.border, color: c.text }} rows={3}
                  placeholder="거절 사유를 상세히 입력해 주세요..." />
              </div>
              <div className="rounded-lg p-3 text-xs" style={{ background: '#FEF3C7', color: '#92400E' }}>
                <p>거절된 신청은 영업자료로 보존됩니다.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setRejectModal(null)}
                  className="flex-1 rounded-lg border py-2.5 text-sm font-medium" style={{ borderColor: c.border, color: c.text }}>취소</button>
                <button onClick={handleReject} disabled={processing}
                  className="flex-1 rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-50" style={{ background: '#EF4444' }}>
                  {processing ? '처리 중...' : '거절 처리'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 승인 모달 */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl p-6 space-y-5 max-h-[85vh] overflow-y-auto"
            style={{ background: c.surface, scrollbarWidth: 'none' }}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold" style={{ color: c.text }}>가입 승인 설정</h2>
                <p className="text-sm" style={{ color: c.textLight }}>{approveModal.shopName} — {approveModal.ownerName}</p>
              </div>
              <button onClick={() => setApproveModal(null)} className="p-1 rounded-lg" style={{ color: c.textLight }}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 신청 정보 요약 */}
            <div className="rounded-xl p-4 text-sm space-y-1" style={{ background: c.secondaryLight }}>
              <div className="flex gap-4">
                <span style={{ color: c.textLight }}>연락처</span>
                <span className="font-medium" style={{ color: c.text }}>{approveModal.phone}</span>
              </div>
              <div className="flex gap-4">
                <span style={{ color: c.textLight }}>이메일</span>
                <span className="font-medium" style={{ color: c.text }}>{approveModal.email}</span>
              </div>
              {approveModal.address && (
                <div className="flex gap-4">
                  <span style={{ color: c.textLight }}>주소</span>
                  <span className="font-medium" style={{ color: c.text }}>{approveModal.address}</span>
                </div>
              )}
              {approveModal.memo && (
                <div className="flex gap-4">
                  <span style={{ color: c.textLight }}>메모</span>
                  <span className="font-medium" style={{ color: c.text }}>{approveModal.memo}</span>
                </div>
              )}
            </div>

            {/* 플랜 선택 */}
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: c.primary }}>적용 플랜</label>
              <div className="grid grid-cols-3 gap-2">
                {plans.map(p => (
                  <button key={p.id} onClick={() => setApproveForm({ ...approveForm, planId: p.id })}
                    className="rounded-xl p-3 text-center transition-all border-2"
                    style={{
                      borderColor: approveForm.planId === p.id ? c.primary : c.borderLight,
                      background: approveForm.planId === p.id ? c.primaryLight : 'transparent',
                    }}>
                    <div className="text-xs font-bold" style={{ color: approveForm.planId === p.id ? c.primary : c.text }}>{p.name}</div>
                    <div className="text-xs mt-1" style={{ color: c.textLight }}>₩{p.price.toLocaleString()}/월</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 결제 주기 */}
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: c.primary }}>결제 주기</label>
              <div className="flex gap-2">
                {[
                  { id: 'monthly', label: '월 결제' },
                  { id: 'yearly', label: '연 결제 (2개월 무료)' },
                ].map(opt => (
                  <button key={opt.id} onClick={() => setApproveForm({ ...approveForm, billingCycle: opt.id as any })}
                    className="flex-1 rounded-xl py-2.5 text-sm font-medium border-2 transition-all"
                    style={{
                      borderColor: approveForm.billingCycle === opt.id ? c.primary : c.borderLight,
                      background: approveForm.billingCycle === opt.id ? c.primaryLight : 'transparent',
                      color: approveForm.billingCycle === opt.id ? c.primary : c.text,
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 월 결제일 (월 결제 시) */}
            {approveForm.billingCycle === 'monthly' && (
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: c.primary }}>월 결제일</label>
                <select value={approveForm.billingDay}
                  onChange={e => setApproveForm({ ...approveForm, billingDay: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: c.border, color: c.text }}>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={String(d)}>매월 {d}일</option>
                  ))}
                </select>
              </div>
            )}

            {/* 서비스 기간 */}
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: c.primary }}>서비스 기간</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] mb-1 block" style={{ color: c.textLight }}>시작일</label>
                  <input type="date" value={approveForm.serviceStart}
                    onChange={e => setApproveForm({ ...approveForm, serviceStart: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: c.border, color: c.text }} />
                </div>
                <div>
                  <label className="text-[10px] mb-1 block" style={{ color: c.textLight }}>종료일</label>
                  <input type="date" value={approveForm.serviceEnd}
                    onChange={e => setApproveForm({ ...approveForm, serviceEnd: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: c.border, color: c.text }} />
                </div>
              </div>
            </div>

            {/* 승인 유형 */}
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: c.primary }}>승인 유형</label>
              <select value={approveForm.approvalType}
                onChange={e => setApproveForm({ ...approveForm, approvalType: e.target.value })}
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                style={{ borderColor: c.border, color: c.text }}>
                <option value="정규신청">정규신청</option>
                <option value="딜러추천">딜러추천</option>
                <option value="프로모션">프로모션</option>
                <option value="무료체험">무료체험</option>
              </select>
            </div>

            {/* 메모 */}
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: c.primary }}>관리자 메모</label>
              <textarea value={approveForm.memo}
                onChange={e => setApproveForm({ ...approveForm, memo: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none"
                style={{ borderColor: c.border, color: c.text }} rows={2}
                placeholder="내부 메모 (선택)" />
            </div>

            {/* 추천인 할인 정보 */}
            {dealerInfo && (
              <div className="rounded-xl p-4" style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
                <div className="text-xs font-semibold mb-2" style={{ color: '#92400E' }}>추천인 할인 적용</div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-bold px-2 py-0.5 rounded text-xs" style={{ background: '#FCD34D', color: '#78350F', letterSpacing: 1 }}>{dealerInfo.code}</span>
                    <span style={{ color: '#374151' }}>{dealerInfo.name}</span>
                  </div>
                  <span className="font-bold text-base" style={{ color: '#DC2626' }}>-{dealerInfo.discountRate}%</span>
                </div>
              </div>
            )}

            {/* 결제 요약 */}
            {approveForm.planId && (() => {
              const p = plans.find(pl => pl.id === approveForm.planId);
              if (!p) return null;
              const monthly = p.price;
              const isYearly = approveForm.billingCycle === 'yearly';
              const discount = dealerInfo?.discountRate || 0;
              const discountedMonthly = discount > 0 ? Math.round(monthly * (1 - discount / 100)) : monthly;

              // 정가 기준
              const originalTotal = isYearly ? monthly * 12 : monthly;
              // 2개월 무료 적용 (연결제만)
              const afterFree = isYearly ? monthly * 10 : monthly;
              // 딜러할인 적용
              const finalTotal = isYearly ? discountedMonthly * 10 : discountedMonthly;
              const totalSave = originalTotal - finalTotal;
              const totalDiscountPct = originalTotal > 0 ? Math.round((totalSave / originalTotal) * 100) : 0;

              return (
                <div className="rounded-xl p-4 space-y-3" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                  <div className="text-xs font-semibold" style={{ color: '#065F46' }}>결제 정보 요약</div>

                  {/* 플랜/주기 */}
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#374151' }}>{p.name} — {isYearly ? '연 결제' : `월 결제 (매월 ${approveForm.billingDay}일)`}</span>
                  </div>

                  {/* 금액 상세 */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: '#6B7280' }}>정가</span>
                      <span style={{ color: '#9CA3AF', textDecoration: totalSave > 0 ? 'line-through' : 'none' }}>₩{originalTotal.toLocaleString()}{isYearly ? '' : '/월'}</span>
                    </div>
                    {isYearly && (
                      <div className="flex justify-between">
                        <span style={{ color: '#6B7280' }}>2개월 무료 적용</span>
                        <span style={{ color: '#9CA3AF', textDecoration: discount > 0 ? 'line-through' : 'none' }}>₩{afterFree.toLocaleString()}</span>
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="flex justify-between">
                        <span style={{ color: '#DC2626', fontWeight: 600 }}>추천 {discount}% 할인</span>
                        <span style={{ color: '#DC2626', fontWeight: 600 }}>-₩{(afterFree - finalTotal).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="border-t pt-1 flex justify-between" style={{ borderColor: '#BBF7D0' }}>
                      <span className="font-bold" style={{ color: '#065F46' }}>최종 결제금액</span>
                      <span className="font-bold text-lg" style={{ color: '#065F46' }}>₩{finalTotal.toLocaleString()}{isYearly ? '/년' : '/월'}</span>
                    </div>
                    {totalSave > 0 && (
                      <div className="flex justify-end gap-2 text-xs">
                        <span className="font-bold" style={{ color: '#DC2626' }}>-{totalDiscountPct}%</span>
                        <span style={{ color: '#6B7280' }}>₩{totalSave.toLocaleString()} 절약</span>
                      </div>
                    )}
                  </div>

                  {/* 서비스 기간 */}
                  <div className="text-xs pt-1" style={{ color: '#6B7280', borderTop: '1px solid #BBF7D0' }}>
                    서비스 기간: {approveForm.serviceStart} ~ {approveForm.serviceEnd}
                  </div>
                </div>
              );
            })()}

            {/* 버튼 */}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setApproveModal(null)}
                className="flex-1 rounded-lg border py-2.5 text-sm font-medium"
                style={{ borderColor: c.border, color: c.text }}>취소</button>
              <button onClick={() => { setApproveModal(null); setRejectModal(approveModal); setRejectForm({ rejectionType: '서류미비', rejectedReason: '', reviewedBy: currentUser }); }}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-white" style={{ background: '#EF4444' }}>
                불가
              </button>
              <button onClick={submitApprove} disabled={processing || !approveForm.planId}
                className="flex-1 rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-50"
                style={{ background: '#22C55E' }}>
                {processing ? '처리 중...' : '승인 확정'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
