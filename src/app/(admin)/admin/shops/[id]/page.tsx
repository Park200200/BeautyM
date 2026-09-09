'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import {
  ArrowLeft, Building2, CreditCard, ToggleRight, Users,
  Save, Check, X, Edit2, FileText,
} from 'lucide-react';
import DatePicker from '@/components/DatePicker';

interface ShopDetail {
  id: string; name: string; slug: string; phone: string | null; address: string | null;
  ownerName: string | null; ownerTitle: string | null; ownerPhone: string | null;
  salesPerson: string | null;
  bizNumber: string | null; bizType: string | null; bizCategory: string | null;
  taxEmail: string | null; bizLicenseUrl: string | null;
  isActive: boolean; createdAt: string;
  subscription: {
    id: string; planId: string; planName: string; planPrice: number;
    status: string; currentPeriodEnd: string;
  } | null;
  members: {
    id: string; name: string; email: string | null; phone: string | null;
    role: string; isActive: boolean; createdAt: string;
  }[];
  features: {
    id: string; moduleId: string; moduleName: string; moduleDescription: string;
    isEnabled: boolean; config: Record<string, number | boolean | string> | null;
  }[];
}

// 자동 포맷 유틸
const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.startsWith('02')) {
    if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`;
    if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6)}`;
  }
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
};

const formatBizNumber = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
};

const formatMoney = (v: string) => {
  const d = v.replace(/\D/g, '');
  return d ? parseInt(d).toLocaleString() : '';
};

const FORMATTERS: Record<string, (v: string) => string> = {
  phone: formatPhone,
  ownerPhone: formatPhone,
  bizNumber: formatBizNumber,
};

interface PlanItem { id: string; name: string; price: number; description: string | null; }

export default function ShopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const store = useThemeStore();
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;

  const [shop, setShop] = useState<ShopDetail | null>(null);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'info' | 'plan' | 'modules' | 'members'>('info');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(false);
  const [editingSub, setEditingSub] = useState(false);
  const [subForm, setSubForm] = useState({ price: 0, status: 'ACTIVE', periodEnd: '' });

  // 편집 폼
  const [editForm, setEditForm] = useState({
    name: '', phone: '', ownerName: '', ownerTitle: '', ownerPhone: '', salesPerson: '', address: '', bizNumber: '', bizType: '', bizCategory: '', taxEmail: '',
  });

  const fetchShop = async () => {
    try {
      const res = await fetch(`/api/admin/shops/${id}`);
      if (res.ok) {
        const data = await res.json();
        setShop(data);
        setEditForm({
          name: data.name || '', phone: data.phone || '',
          ownerName: data.ownerName || '', ownerTitle: data.ownerTitle || '', ownerPhone: data.ownerPhone || '',
          salesPerson: data.salesPerson || '',
          address: data.address || '',
          bizNumber: data.bizNumber || '', bizType: data.bizType || '',
          bizCategory: data.bizCategory || '', taxEmail: data.taxEmail || '',
        });
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/plans');
      if (res.ok) setPlans(await res.json());
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchShop(); fetchPlans(); }, []);

  const api = async (body: Record<string, unknown>) => {
    setMessage('');
    const res = await fetch(`/api/admin/shops/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setMessage(data.message || data.error || '');
    fetchShop();
    return res.ok;
  };

  const handleSaveInfo = async () => {
    await api({ action: 'updateInfo', ...editForm });
    setEditing(false);
  };

  const handleSaveSub = async () => {
    await api({ action: 'updateSubscription', ...subForm });
    setEditingSub(false);
  };

  const handleChangePlan = async (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!confirm(`플랜을 "${plan?.name || ''}"(으)로 변경하시겠습니까? 모듈 설정이 플랜에 맞게 초기화됩니다.`)) return;
    const ok = await api({ action: 'changePlan', planId });
    if (ok) setEditingSub(false);
  };

  const handleToggleModule = async (featureId: string, isEnabled: boolean) => {
    await api({ action: 'toggleModule', featureId, isEnabled });
  };

  const handleToggleActive = async () => {
    if (!shop) return;
    await api({ action: 'updateInfo', isActive: !shop.isActive });
  };

  if (loading) return <div className="p-8 text-center" style={{ color: c.textLight }}>로딩 중...</div>;
  if (!shop) return <div className="p-8 text-center" style={{ color: c.textLight }}>매장을 찾을 수 없습니다.</div>;

  const tabs = [
    { id: 'info' as const, name: '기본 정보', icon: Building2 },
    { id: 'plan' as const, name: '구독 & 용량', icon: CreditCard },
    { id: 'modules' as const, name: '모듈 관리', icon: ToggleRight },
    { id: 'members' as const, name: '멤버', icon: Users },
  ];

  // 용량 관련 모듈 설정
  const capacityModules = shop.features.filter((f) =>
    ['customer', 'staff', 'multi_branch'].includes(f.moduleId)
  );

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/shops')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
            style={{ borderColor: c.border, color: c.textLight }}>
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: c.text }}>{shop.name}</h1>
            <p className="text-sm" style={{ color: c.textLight }}>{shop.slug}</p>
          </div>
          <span className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-semibold ${shop.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {shop.isActive ? '활성' : '비활성'}
          </span>
        </div>
        <button onClick={handleToggleActive}
          className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
          style={{ borderColor: shop.isActive ? '#FCA5A5' : '#86EFAC', color: shop.isActive ? '#EF4444' : '#22C55E' }}>
          {shop.isActive ? '매장 비활성화' : '매장 활성화'}
        </button>
      </div>

      {message && (
        <div className="rounded-lg border px-4 py-3 text-sm" style={{ background: c.primaryLight, color: c.primary, borderColor: c.primary }}>
          {message}
        </div>
      )}

      {/* 탭 */}
      <div className="flex gap-1 rounded-lg p-1" style={{ background: c.secondaryLight }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all flex-1 justify-center"
              style={{
                background: tab === t.id ? c.surface : 'transparent',
                color: tab === t.id ? c.primary : c.textLight,
                boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}>
              <Icon className="h-4 w-4" />
              {t.name}
            </button>
          );
        })}
      </div>

      {/* 기본 정보 탭 */}
      {tab === 'info' && (
        <div className="rounded-xl border p-6 space-y-6" style={{ background: c.surface, borderColor: c.borderLight }}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ color: c.text }}>매장 & 사업자 정보</h2>
            {!editing ? (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm" style={{ color: c.primary }}>
                <Edit2 className="h-4 w-4" /> 수정
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)}
                  className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm" style={{ borderColor: c.border, color: c.textLight }}>
                  <X className="h-4 w-4" /> 취소
                </button>
                <button onClick={handleSaveInfo}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-white" style={{ background: c.primary }}>
                  <Save className="h-4 w-4" /> 저장
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {([
              ['매장명', 'name', shop.name, ''],
              ['전화번호', 'phone', shop.phone, '010-0000-0000'],
              ['대표자명', 'ownerName', shop.ownerName, '홍길동'],
              ['직함', 'ownerTitle', shop.ownerTitle, '대표, 원장 등'],
              ['대표자 전화번호', 'ownerPhone', shop.ownerPhone, '010-0000-0000'],
              ['영업담당자', 'salesPerson', shop.salesPerson, '웹-홈페이지, 지인-홍길동 010-0000-0000'],
              ['주소', 'address', shop.address, ''],
              ['사업자등록번호', 'bizNumber', shop.bizNumber, '000-00-00000'],
              ['업태', 'bizType', shop.bizType, '서비스업'],
              ['업종', 'bizCategory', shop.bizCategory, '교육, 피부관리, 에스테틱 등'],
              ['세금계산서 이메일', 'taxEmail', shop.taxEmail, 'tax@example.com'],
            ] as [string, string, string | null, string][]).map(([label, key, value, placeholder]) => (
              <div key={key} className={key === 'address' || key === 'salesPerson' ? 'col-span-2' : ''}>
                <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>{label}</label>
                <input
                  readOnly={!editing}
                  value={editing ? editForm[key as keyof typeof editForm] : (value || '')}
                  placeholder={editing ? placeholder : ''}
                  onChange={(e) => {
                    if (!editing) return;
                    const fmt = FORMATTERS[key];
                    const val = fmt ? fmt(e.target.value) : e.target.value;
                    setEditForm({ ...editForm, [key]: val });
                  }}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors"
                  style={{
                    borderColor: editing ? c.primary : 'transparent',
                    color: (!editing && !value) ? c.textLight : c.text,
                    background: editing ? '#FFFFFF' : c.secondaryLight,
                    cursor: editing ? 'text' : 'default',
                  }}
                  onFocus={(e) => editing && (e.currentTarget.style.boxShadow = `0 0 0 3px ${c.primaryLight}`)}
                  onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
                />
              </div>
            ))}
            {shop.bizLicenseUrl && (
              <div className="col-span-2">
                <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>사업자등록증</label>
                <a href={shop.bizLicenseUrl} target="_blank" rel="noopener"
                  className="inline-flex items-center gap-1.5 text-sm" style={{ color: c.primary }}>
                  <FileText className="h-4 w-4" /> 파일 보기
                </a>
              </div>
            )}
          </div>

          <div className="pt-4" style={{ borderTop: `1px solid ${c.borderLight}` }}>
            <p className="text-xs" style={{ color: c.textLight }}>
              가입일: {new Date(shop.createdAt).toLocaleDateString('ko-KR')} | 슬러그: {shop.slug}
            </p>
          </div>
        </div>
      )}

      {/* 구독 & 용량 탭 */}
      {tab === 'plan' && (
        <div className="space-y-6">
          {/* 현재 구독 */}
          <div className="rounded-xl border p-6" style={{ background: c.surface, borderColor: c.borderLight }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: c.text }}>현재 구독</h2>
              {!editingSub ? (
                <button onClick={() => {
                  setEditingSub(true);
                  setSubForm({
                    price: shop.subscription?.planPrice || 0,
                    status: shop.subscription?.status || 'ACTIVE',
                    periodEnd: shop.subscription?.currentPeriodEnd
                      ? new Date(shop.subscription.currentPeriodEnd).toISOString().split('T')[0] : '',
                  });
                }}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm" style={{ color: c.primary }}>
                  <Edit2 className="h-4 w-4" /> 수정
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditingSub(false)}
                    className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm" style={{ borderColor: c.border, color: c.textLight }}>
                    <X className="h-4 w-4" /> 취소
                  </button>
                  <button onClick={handleSaveSub}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-white" style={{ background: c.primary }}>
                    <Save className="h-4 w-4" /> 저장
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-xs mb-1" style={{ color: c.textLight }}>플랜</p>
                <p className="text-lg font-bold" style={{ color: c.primary }}>{shop.subscription?.planName || 'Free'}</p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: c.textLight }}>월 구독료</p>
                {editingSub ? (
                  <div className="flex items-center gap-1">
                    <span className="text-sm" style={{ color: c.textLight }}>₩</span>
                    <input type="text" value={subForm.price ? subForm.price.toLocaleString() : '0'}
                      onChange={(e) => setSubForm({ ...subForm, price: parseInt(e.target.value.replace(/\D/g, '')) || 0 })}
                      className="w-32 rounded-lg border px-2 py-1.5 text-sm font-bold outline-none"
                      style={{ borderColor: c.border, color: c.text }} />
                  </div>
                ) : (
                  <p className="text-lg font-bold" style={{ color: c.text }}>
                    {shop.subscription?.planPrice ? `₩${shop.subscription.planPrice.toLocaleString()}` : '무료'}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: c.textLight }}>상태</p>
                {editingSub ? (
                  <select value={subForm.status}
                    onChange={(e) => setSubForm({ ...subForm, status: e.target.value })}
                    className="w-full rounded-lg border px-2 py-1.5 text-sm font-bold outline-none"
                    style={{ borderColor: c.border, color: subForm.status === 'ACTIVE' ? '#16A34A' : subForm.status === 'PAST_DUE' ? '#F59E0B' : '#EF4444' }}>
                    <option value="ACTIVE">활성</option>
                    <option value="PAST_DUE">연체</option>
                    <option value="CANCELLED">해지</option>
                  </select>
                ) : (
                  <p className={`text-lg font-bold ${shop.subscription?.status === 'ACTIVE' ? 'text-green-600' : shop.subscription?.status === 'PAST_DUE' ? 'text-yellow-500' : 'text-red-500'}`}>
                    {shop.subscription?.status === 'ACTIVE' ? '활성' : shop.subscription?.status === 'PAST_DUE' ? '연체' : shop.subscription?.status === 'CANCELLED' ? '해지' : '없음'}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: c.textLight }}>다음 결제일</p>
                {editingSub ? (
                  <DatePicker
                    value={subForm.periodEnd}
                    onChange={(v) => setSubForm({ ...subForm, periodEnd: typeof v === 'string' ? v : v ? String(v) : '' })}
                    colors={c}
                  />
                ) : (
                  <p className="text-lg font-bold" style={{ color: c.text }}>
                    {shop.subscription?.currentPeriodEnd
                      ? new Date(shop.subscription.currentPeriodEnd).toLocaleDateString('ko-KR')
                      : '-'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 플랜 변경 */}
          <div className="rounded-xl border p-6" style={{ background: c.surface, borderColor: c.borderLight }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: c.text }}>플랜 변경</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {plans.map((p) => {
                const isCurrent = shop.subscription?.planId === p.id;
                return (
                  <div key={p.id} className="rounded-lg border p-4 transition-all"
                    style={{
                      borderColor: isCurrent ? c.primary : c.borderLight,
                      background: isCurrent ? c.primaryLight : 'transparent',
                    }}>
                    <p className="text-sm font-bold" style={{ color: c.text }}>{p.name}</p>
                    <p className="text-xl font-bold mt-1" style={{ color: c.primary }}>
                      {p.price > 0 ? `₩${p.price.toLocaleString()}` : '무료'}
                    </p>
                    <p className="text-xs mt-1 mb-3" style={{ color: c.textLight }}>{p.description || ''}</p>
                    {isCurrent ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                        <Check className="h-3 w-3" /> 현재 플랜
                      </span>
                    ) : editingSub ? (
                      <button onClick={() => handleChangePlan(p.id)}
                        className="w-full rounded-lg border py-1.5 text-xs font-medium transition-colors"
                        style={{ borderColor: c.primary, color: c.primary }}>
                        변경
                      </button>
                    ) : (
                      <span className="text-xs" style={{ color: c.textLight }}>수정 모드에서 변경</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 용량 설정 */}
          <div className="rounded-xl border p-6" style={{ background: c.surface, borderColor: c.borderLight }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: c.text }}>용량 설정</h2>
            <div className="grid grid-cols-3 gap-4">
              {capacityModules.map((feat) => {
                const configKey = feat.moduleId === 'customer' ? 'maxCustomers'
                  : feat.moduleId === 'staff' ? 'maxStaff' : 'maxBranches';
                const label = feat.moduleId === 'customer' ? '최대 고객 수'
                  : feat.moduleId === 'staff' ? '최대 직원 수' : '최대 매장 수';
                const currentVal = feat.config?.[configKey] as number || 0;

                return (
                  <div key={feat.id} className="rounded-lg border p-4" style={{ borderColor: c.borderLight }}>
                    <p className="text-sm font-medium mb-2" style={{ color: c.text }}>{label}</p>
                    <div className="flex items-center gap-2">
                      <input type="number" min={0} defaultValue={currentVal}
                        className="w-24 rounded-lg border px-3 py-2 text-sm outline-none"
                        style={{ borderColor: c.border, color: c.text }}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          if (val !== currentVal) {
                            api({ action: 'updateModuleConfig', featureId: feat.id, config: { [configKey]: val } });
                          }
                        }} />
                      <span className="text-xs" style={{ color: c.textLight }}>
                        {currentVal === 0 ? '무제한' : `현재 ${currentVal}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs mt-3" style={{ color: c.textLight }}>0 = 무제한. 값 변경 후 포커스를 벗어나면 자동 저장됩니다.</p>
          </div>
        </div>
      )}

      {/* 모듈 관리 탭 */}
      {tab === 'modules' && (
        <div className="rounded-xl border p-6" style={{ background: c.surface, borderColor: c.borderLight }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: c.text }}>모듈 ON/OFF</h2>
            <span className="text-sm" style={{ color: c.textLight }}>
              {shop.features.filter((f) => f.isEnabled).length}/{shop.features.length} 활성
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {shop.features.map((feat) => (
              <div key={feat.id}
                className="flex items-center justify-between rounded-lg border p-4 transition-all"
                style={{
                  borderColor: feat.isEnabled ? c.primary : c.borderLight,
                  background: feat.isEnabled ? `${c.primaryLight}40` : 'transparent',
                }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: c.text }}>{feat.moduleName}</p>
                  <p className="text-xs mt-0.5" style={{ color: c.textLight }}>{feat.moduleDescription}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium min-w-[36px]" style={{ color: feat.isEnabled ? '#16A34A' : '#9CA3AF' }}>
                    {feat.isEnabled ? '사용중' : '미사용'}
                  </span>
                  <button onClick={() => handleToggleModule(feat.id, !feat.isEnabled)}
                    className="relative flex-shrink-0 rounded-full transition-all"
                    style={{ width: '44px', height: '24px', background: feat.isEnabled ? c.primary : '#D1D5DB' }}>
                    <span className="absolute rounded-full bg-white shadow transition-all"
                      style={{ width: '18px', height: '18px', top: '3px', left: feat.isEnabled ? '23px' : '3px' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 멤버 탭 */}
      {tab === 'members' && (
        <div className="rounded-xl border p-6" style={{ background: c.surface, borderColor: c.borderLight }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: c.text }}>
            멤버 ({shop.members.filter((m) => m.role !== 'CUSTOMER').length}명)
          </h2>
          <div className="space-y-3">
            {shop.members.filter((m) => m.role !== 'CUSTOMER').map((member) => (
              <div key={member.id} className="flex items-center justify-between rounded-lg border p-4"
                style={{ borderColor: c.borderLight }}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: c.primaryLight, color: c.primary }}>
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: c.text }}>{member.name}</p>
                    <p className="text-xs" style={{ color: c.textLight }}>{member.email || member.phone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ background: member.role === 'OWNER' ? c.primaryLight : '#F3F4F6', color: member.role === 'OWNER' ? c.primary : '#6B7280' }}>
                    {member.role === 'OWNER' ? '원장' : '직원'}
                  </span>
                  <span className={`text-xs ${member.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                    ● {member.isActive ? '활성' : '비활성'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
