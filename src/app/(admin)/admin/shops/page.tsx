'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { Search, Plus, Eye, X, Upload, FileText } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface Shop {
  id: string; name: string; slug: string; plan: string;
  owner: { name: string; email: string } | null;
  memberCount: number; customerCount: number; moduleCount: number;
  isActive: boolean; createdAt: string; status: string;
}
interface PlanItem { id: string; name: string; price: number; description: string | null; }

export default function ShopsPage() {
  const [mounted, setMounted] = useState(false);
  const store = useThemeStore();
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;
  const mob = useIsMobile();

  const [shops, setShops] = useState<Shop[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'OVERDUE' | 'INACTIVE'>('ALL');

  const [form, setForm] = useState({
    shopName: '', phone: '', ownerName: '', ownerEmail: '', ownerPhone: '',
    planId: '', address: '', bizNumber: '', bizType: '', bizCategory: '',
    taxEmail: '', bizLicenseUrl: '',
  });
  const [bizFileName, setBizFileName] = useState('');

  const fetchShops = async () => {
    try {
      const res = await fetch('/api/admin/shops');
      if (res.ok) setShops(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/plans');
      if (res.ok) setPlans(await res.json());
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchShops(); fetchPlans(); }, []);

  const getShopStatus = (s: Shop) => {
    if (!s.isActive) return 'INACTIVE';
    if (s.status === 'PAST_DUE') return 'OVERDUE';
    return 'ACTIVE';
  };

  const statusCounts = {
    active: shops.filter((s) => getShopStatus(s) === 'ACTIVE').length,
    overdue: shops.filter((s) => getShopStatus(s) === 'OVERDUE').length,
    inactive: shops.filter((s) => getShopStatus(s) === 'INACTIVE').length,
  };

  const filtered = shops
    .filter((s) => s.name.includes(search) || s.owner?.name.includes(search) || s.owner?.email.includes(search))
    .filter((s) => {
      if (statusFilter === 'ALL') return true;
      return getShopStatus(s) === statusFilter;
    });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setForm({ ...form, bizLicenseUrl: data.url });
        setBizFileName(file.name);
      }
    } catch { /* ignore */ }
    setUploading(false);
  };

  const resetForm = () => {
    setForm({ shopName: '', phone: '', ownerName: '', ownerEmail: '', ownerPhone: '',
      planId: '', address: '', bizNumber: '', bizType: '', bizCategory: '',
      taxEmail: '', bizLicenseUrl: '' });
    setBizFileName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setShowForm(false);
        resetForm();
        fetchShops();
      } else {
        setMessage(data.error || '등록 실패');
      }
    } catch { setMessage('서버 오류'); }
    setSubmitting(false);
  };

  const InputField = ({ label, required, ...props }: { label: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>{label}{required && ' *'}</label>
      <input {...props} required={required}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1"
        style={{ borderColor: c.border, color: c.text, '--tw-ring-color': c.primary } as React.CSSProperties} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 상단 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: c.textLight }} />
            <input type="text" placeholder="매장명, 원장, 이메일 검색..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border py-2 pl-10 pr-4 text-sm outline-none"
              style={{ borderColor: c.border, background: c.surface, color: c.text }} />
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {([
              { id: 'ALL' as const, label: '전체', count: shops.length, color: 'bg-gray-500' },
              { id: 'ACTIVE' as const, label: '사용', count: statusCounts.active, color: 'bg-green-500' },
              { id: 'OVERDUE' as const, label: '연체', count: statusCounts.overdue, color: 'bg-red-500' },
              { id: 'INACTIVE' as const, label: '비활성', count: statusCounts.inactive, color: 'bg-orange-500' },
            ]).map((t) => (
              <button key={t.id} onClick={() => setStatusFilter(t.id)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all"
                style={{
                  background: statusFilter === t.id ? c.primary : 'transparent',
                  color: statusFilter === t.id ? c.textOnPrimary : c.text,
                  border: `1px solid ${statusFilter === t.id ? c.primary : c.border}`,
                }}>
                {t.label}
                {t.count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${statusFilter === t.id ? 'bg-white/20 text-white' : `${t.color} text-white`}`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
          style={{ background: c.primary, color: c.textOnPrimary }}>
          <Plus className="h-4 w-4" /> 매장 등록
        </button>
      </div>

      {message && (
        <div className="rounded-lg border px-4 py-3 text-sm"
          style={{ background: c.primaryLight, color: c.primary, borderColor: c.primary }}>
          {message}
        </div>
      )}

      {/* 매장 등록 폼 (모달) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl" style={{ background: c.surface }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: c.text }}>새 매장 등록</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1 rounded-lg" style={{ color: c.textLight }}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 매장 정보 */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: c.primary }}>
                  <span className="h-5 w-5 rounded-full flex items-center justify-center text-xs text-white" style={{ background: c.primary }}>1</span>
                  매장 정보
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InputField label="매장명" required value={form.shopName} onChange={(e) => setForm({ ...form, shopName: (e.target as HTMLInputElement).value })} />
                  <InputField label="매장 전화번호" value={form.phone} onChange={(e) => setForm({ ...form, phone: (e.target as HTMLInputElement).value })} placeholder="02-1234-5678" />
                  <div className="col-span-2">
                    <InputField label="주소" value={form.address} onChange={(e) => setForm({ ...form, address: (e.target as HTMLInputElement).value })} />
                  </div>
                </div>
              </div>

              {/* 대표자 정보 */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: c.primary }}>
                  <span className="h-5 w-5 rounded-full flex items-center justify-center text-xs text-white" style={{ background: c.primary }}>2</span>
                  대표자 정보
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InputField label="대표자명" required value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: (e.target as HTMLInputElement).value })} />
                  <InputField label="대표자 이메일" required type="email" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: (e.target as HTMLInputElement).value })} />
                  <InputField label="대표자 연락처" value={form.ownerPhone} onChange={(e) => setForm({ ...form, ownerPhone: (e.target as HTMLInputElement).value })} placeholder="010-0000-0000" />
                </div>
              </div>

              {/* 사업자 정보 */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: c.primary }}>
                  <span className="h-5 w-5 rounded-full flex items-center justify-center text-xs text-white" style={{ background: c.primary }}>3</span>
                  사업자 정보
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InputField label="사업자등록번호" value={form.bizNumber} onChange={(e) => setForm({ ...form, bizNumber: (e.target as HTMLInputElement).value })} placeholder="123-45-67890" />
                  <InputField label="세금계산서 이메일" type="email" value={form.taxEmail} onChange={(e) => setForm({ ...form, taxEmail: (e.target as HTMLInputElement).value })} />
                  <InputField label="업태" value={form.bizType} onChange={(e) => setForm({ ...form, bizType: (e.target as HTMLInputElement).value })} placeholder="서비스업" />
                  <InputField label="업종" value={form.bizCategory} onChange={(e) => setForm({ ...form, bizCategory: (e.target as HTMLInputElement).value })} placeholder="피부관리" />
                  <div className="col-span-2">
                    <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>사업자등록증</label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer rounded-lg border px-4 py-2 text-sm transition-colors"
                        style={{ borderColor: c.border, color: c.textLight }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = c.primary)}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = c.border)}>
                        <Upload className="h-4 w-4" />
                        {uploading ? '업로드 중...' : '파일 선택'}
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                      </label>
                      {bizFileName && (
                        <span className="flex items-center gap-1 text-sm" style={{ color: c.primary }}>
                          <FileText className="h-4 w-4" /> {bizFileName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 플랜 선택 */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: c.primary }}>
                  <span className="h-5 w-5 rounded-full flex items-center justify-center text-xs text-white" style={{ background: c.primary }}>4</span>
                  플랜 선택
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Free 플랜 */}
                  <button type="button" onClick={() => setForm({ ...form, planId: '' })}
                    className="rounded-lg border p-3 text-left transition-all"
                    style={{
                      borderColor: form.planId === '' ? c.primary : c.border,
                      background: form.planId === '' ? c.primaryLight : 'transparent',
                    }}>
                    <p className="text-sm font-bold" style={{ color: c.text }}>Free</p>
                    <p className="text-lg font-bold" style={{ color: c.primary }}>무료</p>
                    <p className="text-[10px] mt-1" style={{ color: c.textLight }}>고객 20명, 직원 1명</p>
                  </button>
                  {plans.map((p) => (
                    <button key={p.id} type="button" onClick={() => setForm({ ...form, planId: p.id })}
                      className="rounded-lg border p-3 text-left transition-all"
                      style={{
                        borderColor: form.planId === p.id ? c.primary : c.border,
                        background: form.planId === p.id ? c.primaryLight : 'transparent',
                      }}>
                      <p className="text-sm font-bold" style={{ color: c.text }}>{p.name}</p>
                      <p className="text-lg font-bold" style={{ color: c.primary }}>₩{p.price.toLocaleString()}</p>
                      <p className="text-[10px] mt-1" style={{ color: c.textLight }}>{p.description || ''}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 rounded-lg border py-2.5 text-sm font-medium" style={{ borderColor: c.border, color: c.text }}>
                  취소
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
                  style={{ background: c.primary, color: c.textOnPrimary }}>
                  {submitting ? '등록 중...' : '매장 등록'}
                </button>
              </div>
              <p className="text-xs text-center" style={{ color: c.textLight }}>
                원장 계정 초기 비밀번호: &quot;owner1234&quot;
              </p>
            </form>
          </div>
        </div>
      )}

      {/* 매장 목록 */}
      {loading ? (
        <div className="rounded-xl border p-8 text-center" style={{ background: c.surface, borderColor: c.borderLight, color: c.textLight }}>{'\uB85C\uB529 \uC911...'}</div>
      ) : mob ? (
        /* 모바일: 카드 리스트 */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((shop) => {
            const statusColor = !shop.isActive ? '#F97316' : shop.status === 'PAST_DUE' ? '#EF4444' : '#22C55E';
            const statusText = !shop.isActive ? '\uBE44\uD65C\uC131' : shop.status === 'PAST_DUE' ? '\uC5F0\uCCB4' : '\uC0AC\uC6A9';
            return (
              <div key={shop.id} style={{ background: c.surface, borderRadius: 12, border: `1px solid ${c.borderLight}`, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{shop.name}</div>
                    <div style={{ fontSize: 11, color: c.textLight }}>{shop.owner?.name || '-'} {'\xB7'} {shop.owner?.email || ''}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: statusColor, fontWeight: 600 }}>{'\u25CF'} {statusText}</span>
                    <Link href={`/admin/shops/${shop.id}`} style={{ color: c.textLight, padding: 4 }}><Eye className="h-4 w-4" /></Link>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: c.primaryLight, color: c.primary, fontWeight: 600 }}>{shop.plan}</span>
                  <span style={{ fontSize: 10, color: c.textLight }}>{'\uC9C1\uC6D0'} {shop.memberCount}</span>
                  <span style={{ fontSize: 10, color: c.textLight }}>{'\uACE0\uAC1D'} {shop.customerCount}</span>
                  <span style={{ fontSize: 10, color: c.textLight }}>{'\uBAA8\uB4C8'} {shop.moduleCount}/13</span>
                  <span style={{ fontSize: 10, color: c.textLight, marginLeft: 'auto' }}>{new Date(shop.createdAt).toLocaleDateString('ko-KR')}</span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: c.textLight, fontSize: 13 }}>
              {search ? '\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.' : '\uB4F1\uB85D\uB41C \uB9E4\uC7A5\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.'}
            </div>
          )}
          <div style={{ fontSize: 12, color: c.textLight, textAlign: 'center', padding: 8 }}>{'\uCD1D'} {filtered.length}{'\uAC1C \uB9E4\uC7A5'}</div>
        </div>
      ) : (
        /* 데스크탑: 테이블 */
        <div className="rounded-xl border overflow-hidden" style={{ background: c.surface, borderColor: c.borderLight }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: c.secondaryLight, borderBottom: `1px solid ${c.borderLight}` }}>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: c.textLight }}>{'\uB9E4\uC7A5'}</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: c.textLight }}>{'\uC6D0\uC7A5'}</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: c.textLight }}>{'\uD50C\uB79C'}</th>
                  <th className="px-4 py-3 text-center font-medium" style={{ color: c.textLight }}>{'\uC9C1\uC6D0'}</th>
                  <th className="px-4 py-3 text-center font-medium" style={{ color: c.textLight }}>{'\uACE0\uAC1D'}</th>
                  <th className="px-4 py-3 text-center font-medium" style={{ color: c.textLight }}>{'\uBAA8\uB4C8'}</th>
                  <th className="px-4 py-3 text-center font-medium" style={{ color: c.textLight }}>{'\uC0C1\uD0DC'}</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: c.textLight }}>{'\uAC00\uC785\uC77C'}</th>
                  <th className="px-4 py-3 text-center font-medium" style={{ color: c.textLight }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((shop) => (
                  <tr key={shop.id} style={{ borderBottom: `1px solid ${c.borderLight}` }} className="transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.background = c.surfaceHover)} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <td className="px-4 py-3"><p className="font-medium" style={{ color: c.text }}>{shop.name}</p><p className="text-xs" style={{ color: c.textLight }}>{shop.slug}</p></td>
                    <td className="px-4 py-3"><p style={{ color: c.text }}>{shop.owner?.name || '-'}</p><p className="text-xs" style={{ color: c.textLight }}>{shop.owner?.email || ''}</p></td>
                    <td className="px-4 py-3"><span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: c.primaryLight, color: c.primary }}>{shop.plan}</span></td>
                    <td className="px-4 py-3 text-center" style={{ color: c.text }}>{shop.memberCount}</td>
                    <td className="px-4 py-3 text-center" style={{ color: c.text }}>{shop.customerCount}</td>
                    <td className="px-4 py-3 text-center" style={{ color: c.text }}>{shop.moduleCount}/13</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium ${!shop.isActive ? 'text-orange-500' : shop.status === 'PAST_DUE' ? 'text-red-500' : 'text-green-600'}`}>
                        {'\u25CF'} {!shop.isActive ? '\uBE44\uD65C\uC131' : shop.status === 'PAST_DUE' ? '\uC5F0\uCCB4' : '\uC0AC\uC6A9'}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: c.textLight }}>{new Date(shop.createdAt).toLocaleDateString('ko-KR')}</td>
                    <td className="px-4 py-3 text-center">
                      <Link href={`/admin/shops/${shop.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors" style={{ color: c.textLight }} title={'\uC0C1\uC138 \uBCF4\uAE30'}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-8 text-center" style={{ color: c.textLight }}>
                    {search ? '\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.' : '\uB4F1\uB85D\uB41C \uB9E4\uC7A5\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: `1px solid ${c.borderLight}` }}>
            <p className="text-sm" style={{ color: c.textLight }}>{'\uCD1D'} {filtered.length}{'\uAC1C \uB9E4\uC7A5'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
