'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { Search, Plus, Eye, X, Upload, FileText, Store, ShoppingBag, Package, Trash2, List, ClipboardList, Image as ImageIcon, ImagePlus } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface Shop {
  id: string; name: string; slug: string; plan: string;
  owner: { name: string; email: string } | null;
  memberCount: number; customerCount: number; moduleCount: number;
  isActive: boolean; createdAt: string; status: string;
}
interface PlanItem { id: string; name: string; price: number; description: string | null; }

interface Vendor {
  id: string; name: string; contactName: string; phone: string; email: string;
  category: string; bizNumber: string; bankInfo: string; terms: string; memo: string;
  isActive: boolean; createdAt: string;
}

interface VendorProduct {
  id: string; vendorId: string; name: string; description: string; detailDesc: string;
  category: string; brand: string; spec: string; price: number; discountPrice: number | null;
  unit: string; sku: string; imageUrl: string; images: string; tags: string;
  displayOrder: number; isDisplayed: boolean; isActive: boolean; createdAt: string;
  vendor: { id: string; name: string; category: string };
}

export default function ShopsPage() {
  const [mounted, setMounted] = useState(false);
  const store = useThemeStore();
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;
  const mob = useIsMobile();

  const [subTab, setSubTab] = useState<'beauty' | 'product'>('beauty');

  // 뷰티관리 states
  const [shops, setShops] = useState<Shop[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'OVERDUE' | 'INACTIVE'>('ALL');

  // 상품판매 states
  const [productSubTab, setProductSubTab] = useState<'vendors' | 'products'>('vendors');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    name: '', contactName: '', phone: '', email: '', category: '',
    bizNumber: '', bankInfo: '', terms: '', memo: '',
  });

  // 판매 상품 states
  const [vendorProducts, setVendorProducts] = useState<VendorProduct[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<VendorProduct | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productForm, setProductForm] = useState({
    vendorId: '', name: '', description: '', detailDesc: '', category: '', brand: '',
    spec: '', price: '', discountPrice: '', unit: '', sku: '', imageUrl: '', images: '',
    tags: '', displayOrder: '0', isDisplayed: true,
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchVendors = async () => {
    setVendorLoading(true);
    try {
      const res = await fetch('/api/admin/vendors');
      if (res.ok) setVendors(await res.json());
    } catch { /* */ }
    setVendorLoading(false);
  };

  const fetchProducts = async () => {
    setProductLoading(true);
    try {
      const res = await fetch('/api/admin/vendor-products');
      if (res.ok) setVendorProducts(await res.json());
    } catch { /* */ }
    setProductLoading(false);
  };

  useEffect(() => {
    if (subTab === 'product') {
      fetchVendors();
      if (productSubTab === 'products') fetchProducts();
    }
  }, [subTab, productSubTab]);

  const handleVendorSubmit = async () => {
    try {
      const url = editingVendor ? `/api/admin/vendors/${editingVendor.id}` : '/api/admin/vendors';
      const method = editingVendor ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vendorForm) });
      if (res.ok) {
        setShowVendorForm(false);
        setEditingVendor(null);
        setVendorForm({ name: '', contactName: '', phone: '', email: '', category: '', bizNumber: '', bankInfo: '', terms: '', memo: '' });
        fetchVendors();
      }
    } catch { /* */ }
  };

  const uploadProductImage = async (file: File, type: 'thumbnail' | 'detail') => {
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const { url } = await res.json();
        if (type === 'thumbnail') {
          setProductForm(prev => ({ ...prev, imageUrl: url }));
        } else {
          const current = productForm.images ? JSON.parse(productForm.images) as string[] : [];
          current.push(url);
          setProductForm(prev => ({ ...prev, images: JSON.stringify(current) }));
        }
      }
    } catch { /* */ }
    setUploadingImage(false);
  };

  const removeDetailImage = (idx: number) => {
    const current = productForm.images ? JSON.parse(productForm.images) as string[] : [];
    current.splice(idx, 1);
    setProductForm(prev => ({ ...prev, images: current.length > 0 ? JSON.stringify(current) : '' }));
  };

  const handleProductSubmit = async () => {
    try {
      const url = editingProduct ? `/api/admin/vendor-products/${editingProduct.id}` : '/api/admin/vendor-products';
      const method = editingProduct ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(productForm) });
      if (res.ok) {
        setShowProductForm(false);
        setEditingProduct(null);
        setProductForm({ vendorId: '', name: '', description: '', detailDesc: '', category: '', brand: '', spec: '', price: '', discountPrice: '', unit: '', sku: '', imageUrl: '', images: '', tags: '', displayOrder: '0', isDisplayed: true });
        fetchProducts();
      }
    } catch { /* */ }
  };

  const deleteVendor = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await fetch(`/api/admin/vendors/${id}`, { method: 'DELETE' });
    fetchVendors();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await fetch(`/api/admin/vendor-products/${id}`, { method: 'DELETE' });
    fetchProducts();
  };

  const filteredVendors = vendors.filter(v =>
    !vendorSearch || v.name.includes(vendorSearch) || v.contactName.includes(vendorSearch) || v.category?.includes(vendorSearch)
  );

  const filteredProducts = vendorProducts.filter(p =>
    !productSearch || p.name.includes(productSearch) || p.vendor?.name.includes(productSearch) || p.category?.includes(productSearch) || p.sku?.includes(productSearch)
  );

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
      {/* 서브탭 */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: c.surfaceHover }}>
        {([
          { id: 'beauty' as const, label: '뷰티 관리', icon: Store },
          { id: 'product' as const, label: '상품 판매', icon: ShoppingBag },
        ]).map(tab => (
          <button key={tab.id} onClick={() => setSubTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{ background: subTab === tab.id ? c.surface : 'transparent', color: subTab === tab.id ? c.primary : c.textLight,
              boxShadow: subTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === 'beauty' && (<>
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
                    <td className="px-4 py-3 text-center" style={{ color: c.text }}>{shop.moduleCount}/14</td>
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
      </>)}

      {/* 상품 판매 탭 */}
      {subTab === 'product' && (
        <div className="space-y-4">
          {/* 서브탭 */}
          <div className="flex gap-1 border-b" style={{ borderColor: c.borderLight }}>
            {([
              { id: 'vendors' as const, label: '업체 목록', icon: List, count: vendors.length },
              { id: 'products' as const, label: '판매 상품', icon: ClipboardList, count: vendorProducts.length },
            ]).map(t => (
              <button key={t.id} onClick={() => setProductSubTab(t.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
                style={{ borderColor: productSubTab === t.id ? c.primary : 'transparent', color: productSubTab === t.id ? c.primary : c.textLight }}>
                <t.icon className="h-4 w-4" />
                {t.label}
                {t.count > 0 && <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded-full" style={{ background: c.primaryLight, color: c.primary }}>{t.count}</span>}
              </button>
            ))}
          </div>

          {/* 업체 목록 */}
          {productSubTab === 'vendors' && (<>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: c.textLight }} />
                <input type="text" placeholder="업체명, 대표자, 카테고리 검색..." value={vendorSearch}
                  onChange={e => setVendorSearch(e.target.value)}
                  className="w-full rounded-lg border py-2 pl-10 pr-4 text-sm outline-none"
                  style={{ borderColor: c.border, background: c.surface, color: c.text }} />
              </div>
              <button onClick={() => { setEditingVendor(null); setVendorForm({ name: '', contactName: '', phone: '', email: '', category: '', bizNumber: '', bankInfo: '', terms: '', memo: '' }); setShowVendorForm(true); }}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: c.primary }}>
                <Plus className="h-4 w-4" /> 업체 등록
              </button>
            </div>
            {vendorLoading ? (
              <div className="text-center py-16 text-sm" style={{ color: c.textLight }}>로딩 중...</div>
            ) : filteredVendors.length === 0 ? (
              <div className="text-center py-16 rounded-xl border" style={{ borderColor: c.borderLight, background: c.surface }}>
                <ShoppingBag className="mx-auto mb-3 h-10 w-10" style={{ color: c.borderLight }} />
                <p className="text-sm font-medium" style={{ color: c.textLight }}>등록된 상품 판매 업체가 없습니다</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredVendors.map(v => (
                  <div key={v.id} className="rounded-xl border p-4 space-y-3 transition-shadow hover:shadow-md" style={{ borderColor: c.borderLight, background: c.surface }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-sm" style={{ color: c.text }}>{v.name}</h3>
                        {v.category && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: c.primaryLight, color: c.primary }}>{v.category}</span>}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingVendor(v); setVendorForm({ name: v.name, contactName: v.contactName || '', phone: v.phone || '', email: v.email || '', category: v.category || '', bizNumber: v.bizNumber || '', bankInfo: v.bankInfo || '', terms: v.terms || '', memo: v.memo || '' }); setShowVendorForm(true); }}
                          className="text-xs px-2 py-1 rounded" style={{ color: c.primary, background: c.primaryLight }}>수정</button>
                        <button onClick={() => deleteVendor(v.id)} className="p-1"><Trash2 className="h-3.5 w-3.5" style={{ color: '#EF4444' }} /></button>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs" style={{ color: c.textLight }}>
                      {v.contactName && <div>대표자: {v.contactName}</div>}
                      {v.phone && <div>전화: {v.phone}</div>}
                      {v.email && <div>이메일: {v.email}</div>}
                      {v.bizNumber && <div>사업자: {v.bizNumber}</div>}
                    </div>
                    {(v.bankInfo || v.terms) && (
                      <div className="text-xs p-2 rounded-lg" style={{ background: c.surfaceHover, color: c.textLight }}>
                        {v.bankInfo && <div>ID: {v.bankInfo}</div>}
                        {v.terms && <div>PW: {v.terms}</div>}
                      </div>
                    )}
                    {v.memo && <div className="text-[11px] italic" style={{ color: c.borderLight }}>{v.memo}</div>}
                  </div>
                ))}
              </div>
            )}
          </>)}

          {/* 판매 상품 */}
          {productSubTab === 'products' && (<>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: c.textLight }} />
                <input type="text" placeholder="상품명, 업체명, 코드 검색..." value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="w-full rounded-lg border py-2 pl-10 pr-4 text-sm outline-none"
                  style={{ borderColor: c.border, background: c.surface, color: c.text }} />
              </div>
              <button onClick={() => { setEditingProduct(null); setProductForm({ vendorId: '', name: '', description: '', detailDesc: '', category: '', brand: '', spec: '', price: '', discountPrice: '', unit: '', sku: '', imageUrl: '', images: '', tags: '', displayOrder: '0', isDisplayed: true }); setShowProductForm(true); }}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: c.primary }}>
                <Plus className="h-4 w-4" /> 상품 등록
              </button>
            </div>
            {productLoading ? (
              <div className="text-center py-16 text-sm" style={{ color: c.textLight }}>로딩 중...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 rounded-xl border" style={{ borderColor: c.borderLight, background: c.surface }}>
                <Package className="mx-auto mb-3 h-10 w-10" style={{ color: c.borderLight }} />
                <p className="text-sm font-medium" style={{ color: c.textLight }}>등록된 판매 상품이 없습니다</p>
              </div>
            ) : (
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: c.borderLight, background: c.surface }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${c.borderLight}`, background: c.surfaceHover }}>
                        <th className="px-4 py-3 text-center font-medium" style={{ color: c.textLight }}>이미지</th>
                        <th className="px-4 py-3 text-left font-medium" style={{ color: c.textLight }}>상품명</th>
                        <th className="px-4 py-3 text-left font-medium" style={{ color: c.textLight }}>업체</th>
                        <th className="px-4 py-3 text-left font-medium" style={{ color: c.textLight }}>브랜드</th>
                        <th className="px-4 py-3 text-right font-medium" style={{ color: c.textLight }}>판매가</th>
                        <th className="px-4 py-3 text-center font-medium" style={{ color: c.textLight }}>규격</th>
                        <th className="px-4 py-3 text-center font-medium" style={{ color: c.textLight }}>진열</th>
                        <th className="px-4 py-3 text-center font-medium" style={{ color: c.textLight }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(p => (
                        <tr key={p.id} style={{ borderBottom: `1px solid ${c.borderLight}` }} className="transition-colors"
                          onMouseEnter={e => e.currentTarget.style.background = c.surfaceHover}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td className="px-4 py-3 text-center">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover mx-auto" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto" style={{ background: c.surfaceHover }}><ImageIcon className="w-4 h-4" style={{ color: c.borderLight }} /></div>
                            )}
                          </td>
                          <td className="px-4 py-3"><p className="font-medium" style={{ color: c.text }}>{p.name}</p>
                            {p.description && <p className="text-xs truncate max-w-[200px]" style={{ color: c.textLight }}>{p.description}</p>}</td>
                          <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: c.primaryLight, color: c.primary }}>{p.vendor?.name || '-'}</span></td>
                          <td className="px-4 py-3 text-xs" style={{ color: c.textLight }}>{p.brand || '-'}</td>
                          <td className="px-4 py-3 text-right">
                            {p.discountPrice ? (<><span className="line-through text-xs mr-1" style={{ color: c.textLight }}>{p.price?.toLocaleString()}</span><span className="font-semibold text-red-500">{p.discountPrice.toLocaleString()}원</span></>) : (<span className="font-semibold" style={{ color: c.text }}>{p.price?.toLocaleString()}원</span>)}
                          </td>
                          <td className="px-4 py-3 text-center text-xs" style={{ color: c.textLight }}>{p.spec || '-'}</td>
                          <td className="px-4 py-3 text-center"><span className={`text-xs font-medium ${p.isDisplayed ? 'text-green-600' : 'text-gray-400'}`}>{p.isDisplayed ? 'ON' : 'OFF'}</span></td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center gap-1 justify-center">
                              <button onClick={() => { setEditingProduct(p); setProductForm({ vendorId: p.vendorId, name: p.name, description: p.description || '', detailDesc: p.detailDesc || '', category: p.category || '', brand: p.brand || '', spec: p.spec || '', price: String(p.price || 0), discountPrice: p.discountPrice ? String(p.discountPrice) : '', unit: p.unit || '', sku: p.sku || '', imageUrl: p.imageUrl || '', images: p.images || '', tags: p.tags || '', displayOrder: String(p.displayOrder || 0), isDisplayed: p.isDisplayed !== false }); setShowProductForm(true); }}
                                className="text-xs px-2 py-1 rounded" style={{ color: c.primary, background: c.primaryLight }}>수정</button>
                              <button onClick={() => deleteProduct(p.id)} className="p-1"><Trash2 className="h-3.5 w-3.5" style={{ color: '#EF4444' }} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3" style={{ borderTop: `1px solid ${c.borderLight}` }}>
                  <p className="text-sm" style={{ color: c.textLight }}>총 {filteredProducts.length}개 상품</p>
                </div>
              </div>
            )}
          </>)}
        </div>
      )}

      {/* 업체 등록/수정 모달 */}
      {showVendorForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6 space-y-4 max-h-[80vh] overflow-y-auto" style={{ background: c.surface }}>
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base" style={{ color: c.text }}>{editingVendor ? '업체 수정' : '업체 등록'}</h3>
              <button onClick={() => setShowVendorForm(false)}><X className="h-5 w-5" style={{ color: c.textLight }} /></button>
            </div>
            {([
              { key: 'name', label: '업체명 *', placeholder: '업체명 입력' },
              { key: 'category', label: '카테고리', placeholder: '화장품, 장비, 소모품 등' },
              { key: 'contactName', label: '대표자', placeholder: '대표자 이름' },
              { key: 'phone', label: '전화번호', placeholder: '010-0000-0000' },
              { key: 'email', label: '이메일', placeholder: 'email@example.com' },
              { key: 'bizNumber', label: '사업자등록번호', placeholder: '000-00-00000' },
              { key: 'bankInfo', label: 'ID', placeholder: '로그인 아이디' },
              { key: 'terms', label: 'PW', placeholder: '비밀번호' },
            ] as const).map(f => (
              <div key={f.key}>
                <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>{f.label}</label>
                <input value={vendorForm[f.key]}
                  onChange={e => {
                    let val = e.target.value;
                    if (f.key === 'phone') {
                      const nums = val.replace(/\D/g, '').slice(0, 11);
                      if (nums.length <= 3) val = nums;
                      else if (nums.length <= 7) val = `${nums.slice(0,3)}-${nums.slice(3)}`;
                      else val = `${nums.slice(0,3)}-${nums.slice(3,7)}-${nums.slice(7)}`;
                    } else if (f.key === 'bizNumber') {
                      const nums = val.replace(/\D/g, '').slice(0, 10);
                      if (nums.length <= 3) val = nums;
                      else if (nums.length <= 5) val = `${nums.slice(0,3)}-${nums.slice(3)}`;
                      else val = `${nums.slice(0,3)}-${nums.slice(3,5)}-${nums.slice(5)}`;
                    }
                    setVendorForm({ ...vendorForm, [f.key]: val });
                  }}
                  placeholder={f.placeholder}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: c.border, color: c.text }} />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>메모</label>
              <textarea value={vendorForm.memo} onChange={e => setVendorForm({ ...vendorForm, memo: e.target.value })}
                rows={2} placeholder="특이사항 메모"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none"
                style={{ borderColor: c.border, color: c.text }} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowVendorForm(false)}
                className="flex-1 rounded-lg border py-2.5 text-sm font-semibold"
                style={{ borderColor: c.border, color: c.textLight }}>취소</button>
              <button onClick={handleVendorSubmit} disabled={!vendorForm.name.trim()}
                className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white"
                style={{ background: vendorForm.name.trim() ? c.primary : c.borderLight }}>
                {editingVendor ? '수정' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상품 등록/수정 모달 */}
      {showProductForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-2xl rounded-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto" style={{ background: c.surface }}>
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base" style={{ color: c.text }}>{editingProduct ? '상품 수정' : '상품 등록'}</h3>
              <button onClick={() => setShowProductForm(false)}><X className="h-5 w-5" style={{ color: c.textLight }} /></button>
            </div>
            <p className="text-xs font-bold pt-1" style={{ color: c.primary }}>기본 정보</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>업체 *</label>
                <select value={productForm.vendorId} onChange={e => setProductForm({ ...productForm, vendorId: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: c.border, color: c.text, background: c.surface }}>
                  <option value="">업체 선택</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>카테고리</label>
                <input value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                  placeholder="화장품, 장비, 소모품 등" className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: c.border, color: c.text }} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>상품명 *</label>
              <input value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="상품명 입력" className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: c.border, color: c.text }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>브랜드</label>
                <input value={productForm.brand} onChange={e => setProductForm({ ...productForm, brand: e.target.value })}
                  placeholder="브랜드명" className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: c.border, color: c.text }} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>상품코드 (SKU)</label>
                <input value={productForm.sku} onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
                  placeholder="SKU-001" className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: c.border, color: c.text }} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>간단 설명</label>
              <input value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                placeholder="한 줄 설명" className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: c.border, color: c.text }} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>상세 설명</label>
              <textarea value={productForm.detailDesc} onChange={e => setProductForm({ ...productForm, detailDesc: e.target.value })}
                rows={3} placeholder="상세한 상품 설명 (성분, 효능 등)"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none" style={{ borderColor: c.border, color: c.text }} />
            </div>
            <p className="text-xs font-bold pt-1" style={{ color: c.primary }}>가격 / 규격</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>판매가 (원)</label>
                <input type="number" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                  placeholder="0" className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: c.border, color: c.text }} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>할인가 (원)</label>
                <input type="number" value={productForm.discountPrice} onChange={e => setProductForm({ ...productForm, discountPrice: e.target.value })}
                  placeholder="미입력시 할인 없음" className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: c.border, color: c.text }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>용량/규격</label>
                <input value={productForm.spec} onChange={e => setProductForm({ ...productForm, spec: e.target.value })}
                  placeholder="50ml, 100매 등" className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: c.border, color: c.text }} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>단위</label>
                <input value={productForm.unit} onChange={e => setProductForm({ ...productForm, unit: e.target.value })}
                  placeholder="개, 박스, 세트" className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: c.border, color: c.text }} />
              </div>
            </div>

            {/* 이미지 */}
            <p className="text-xs font-bold pt-1" style={{ color: c.primary }}>상품 이미지</p>
            <div className="grid grid-cols-2 gap-4">
              {/* 썸네일 */}
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: c.textLight }}>대표 이미지 (썸네일)</label>
                <label className="block cursor-pointer">
                  {productForm.imageUrl ? (
                    <div className="relative group">
                      <img src={productForm.imageUrl} alt="썸네일" className="w-full h-32 rounded-lg object-cover border" style={{ borderColor: c.borderLight }} />
                      <button onClick={(e) => { e.preventDefault(); setProductForm({ ...productForm, imageUrl: '' }); }}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1"
                      style={{ borderColor: c.borderLight }}>
                      <ImagePlus className="w-6 h-6" style={{ color: c.borderLight }} />
                      <span className="text-[11px]" style={{ color: c.textLight }}>클릭하여 업로드</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadProductImage(f, 'thumbnail'); }} />
                </label>
              </div>
              {/* 상세 이미지 */}
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: c.textLight }}>상세 이미지 (여러장)</label>
                <div className="flex gap-2 flex-wrap">
                  {(productForm.images ? JSON.parse(productForm.images) as string[] : []).map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img src={img} alt={`상세${idx + 1}`} className="w-14 h-14 rounded-lg object-cover border" style={{ borderColor: c.borderLight }} />
                      <button onClick={() => removeDetailImage(idx)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                  <label className="w-14 h-14 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer"
                    style={{ borderColor: c.borderLight }}>
                    <Plus className="w-4 h-4" style={{ color: c.borderLight }} />
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadProductImage(f, 'detail'); }} />
                  </label>
                </div>
              </div>
            </div>
            {uploadingImage && <p className="text-xs text-center" style={{ color: c.primary }}>이미지 업로드 중...</p>}
            <p className="text-xs font-bold pt-1" style={{ color: c.primary }}>진열 설정</p>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>검색 태그</label>
              <input value={productForm.tags} onChange={e => setProductForm({ ...productForm, tags: e.target.value })}
                placeholder="쉼표로 구분 (예: 수분크림, 보습, 건성피부)" className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: c.border, color: c.text }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>진열 순서</label>
                <input type="number" value={productForm.displayOrder} onChange={e => setProductForm({ ...productForm, displayOrder: e.target.value })}
                  placeholder="0" className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: c.border, color: c.text }} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>진열 여부</label>
                <button onClick={() => setProductForm({ ...productForm, isDisplayed: !productForm.isDisplayed })}
                  className="w-full rounded-lg border px-3 py-2 text-sm text-left flex items-center justify-between"
                  style={{ borderColor: c.border, color: c.text }}>
                  <span>{productForm.isDisplayed ? '진열 중 (ON)' : '미진열 (OFF)'}</span>
                  <span className={`w-3 h-3 rounded-full ${productForm.isDisplayed ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                </button>
              </div>
            </div>
            <div className="flex gap-2 pt-3">
              <button onClick={() => setShowProductForm(false)}
                className="flex-1 rounded-lg border py-2.5 text-sm font-semibold"
                style={{ borderColor: c.border, color: c.textLight }}>취소</button>
              <button onClick={handleProductSubmit} disabled={!productForm.name.trim() || !productForm.vendorId}
                className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white"
                style={{ background: (productForm.name.trim() && productForm.vendorId) ? c.primary : c.borderLight }}>
                {editingProduct ? '수정' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
