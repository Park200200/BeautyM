'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Package, Plus, X, Search, AlertTriangle, Pencil, Trash2, ArrowDown, ArrowUp, Filter } from 'lucide-react';

type Product = {
  id: string; name: string; category?: string | null; supplier?: string | null;
  stock: number; minStock: number; costPrice: number; sellPrice: number;
  createdAt: string;
};

export default function InventoryPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopSlug = params.shopSlug as string;
  const mob = useIsMobile();
  const store = useThemeStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showLow, setShowLow] = useState(false);

  // 등록/수정 모달
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', category: '', supplier: '', stock: 0, minStock: 0, costPrice: 0, sellPrice: 0, margin: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 입출고 모달
  const [stockModal, setStockModal] = useState<Product | null>(null);
  const [stockDelta, setStockDelta] = useState(0);
  const [stockType, setStockType] = useState<'in' | 'out'>('in');

  // 콤마 포맷 함수
  const fmtNum = (n: number) => n.toLocaleString();
  const parseNum = (s: string) => parseInt(s.replace(/,/g, '')) || 0;

  // 마진 → 판매가 계산 (1000원 단위 올림)
  const calcSellPrice = (cost: number, marginPct: number) => {
    if (cost <= 0 || marginPct <= 0) return 0;
    return Math.ceil(cost * (1 + marginPct / 100) / 1000) * 1000;
  };

  const updateCostPrice = (val: string) => {
    const cost = parseNum(val);
    setForm(f => ({ ...f, costPrice: cost, sellPrice: calcSellPrice(cost, f.margin) }));
  };

  const updateMargin = (val: string) => {
    const m = parseFloat(val) || 0;
    setForm(f => ({ ...f, margin: m, sellPrice: calcSellPrice(f.costPrice, m) }));
  };
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/products`);
      if (res.ok) {
        const d = await res.json();
        setProducts(d.products || []);
        setCategories(d.categories || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [shopSlug]);

  const fmtPrice = (n: number) => fmtNum(n) + '\uC6D0';

  const filtered = products.filter(p => {
    if (search && !p.name.includes(search) && !p.category?.includes(search) && !p.supplier?.includes(search)) return false;
    if (filterCat && p.category !== filterCat) return false;
    if (showLow && p.stock > p.minStock) return false;
    return true;
  });

  const lowStockCount = products.filter(p => p.stock <= p.minStock && p.minStock > 0).length;
  const totalValue = products.reduce((s, p) => s + p.stock * p.costPrice, 0);

  const openAdd = () => {
    setEditTarget(null);
    setForm({ name: '', category: '', supplier: '', stock: 0, minStock: 0, costPrice: 0, sellPrice: 0, margin: 0 });
    setError(''); setShowModal(true);
  };

  // 헤더의 제품등록 탭 클릭 시 ?new=1로 진입 → 모달 열기
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openAdd();
      router.replace(`/${shopSlug}/inventory`);
    }
  }, [searchParams]);

  const openEdit = (p: Product) => {
    setEditTarget(p);
    const m = p.costPrice > 0 && p.sellPrice > 0 ? Math.round((p.sellPrice / p.costPrice - 1) * 100) : 0;
    setForm({ name: p.name, category: p.category || '', supplier: p.supplier || '', stock: p.stock, minStock: p.minStock, costPrice: p.costPrice, sellPrice: p.sellPrice, margin: m });
    setError(''); setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('\uC81C\uD488\uBA85\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694'); return; }
    setSaving(true);
    try {
      const url = editTarget
        ? `/api/shops/${shopSlug}/products/${editTarget.id}`
        : `/api/shops/${shopSlug}/products`;
      const res = await fetch(url, {
        method: editTarget ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category.trim() || null,
          supplier: form.supplier.trim() || null,
          stock: form.stock || 0,
          minStock: form.minStock || 0,
          costPrice: form.costPrice || 0,
          sellPrice: form.sellPrice || 0,
        }),
      });
      if (res.ok) { setShowModal(false); fetchProducts(); }
      else { const d = await res.json(); setError(d.error || '\uC2E4\uD328'); }
    } catch { setError('\uB124\uD2B8\uC6CC\uD06C \uC624\uB958'); }
    setSaving(false);
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`"${p.name}" \uC81C\uD488\uC744 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?`)) return;
    try {
      const res = await fetch(`/api/shops/${shopSlug}/products/${p.id}`, { method: 'DELETE' });
      if (res.ok) fetchProducts();
    } catch (e) { console.error(e); }
  };

  const handleStockChange = async () => {
    if (!stockModal || stockDelta <= 0) return;
    const delta = stockType === 'in' ? stockDelta : -stockDelta;
    try {
      const res = await fetch(`/api/shops/${shopSlug}/products/${stockModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockDelta: delta }),
      });
      if (res.ok) { setStockModal(null); fetchProducts(); }
    } catch (e) { console.error(e); }
  };

  if (!mounted) return null;

  const card = { background: 'white', borderRadius: 14, border: `1px solid ${c.borderLight}` } as const;
  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${c.borderLight}`, fontSize: 13, outline: 'none' } as const;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: mob ? '14px 12px' : '20px 16px' }}>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        <div style={{ ...card, padding: mob ? '12px 14px' : '14px 18px' }}>
          <div style={{ fontSize: 11, color: c.textLight }}>총 제품</div>
          <div style={{ fontSize: mob ? 18 : 20, fontWeight: 800, color: c.text }}>{products.length}개</div>
        </div>
        <div style={{ ...card, padding: mob ? '12px 14px' : '14px 18px' }}>
          <div style={{ fontSize: 11, color: c.textLight }}>재고 자산</div>
          <div style={{ fontSize: mob ? 18 : 20, fontWeight: 800, color: c.primary }}>{totalValue.toLocaleString()}원</div>
        </div>
        <div style={{ ...card, padding: mob ? '12px 14px' : '14px 18px', cursor: 'pointer', background: lowStockCount > 0 ? '#FEF2F2' : 'white' }} onClick={() => setShowLow(!showLow)}>
          <div style={{ fontSize: 11, color: lowStockCount > 0 ? '#EF4444' : c.textLight, display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertTriangle style={{ width: 11, height: 11 }} /> 재고 부족
          </div>
          <div style={{ fontSize: mob ? 18 : 20, fontWeight: 800, color: lowStockCount > 0 ? '#EF4444' : c.text }}>{lowStockCount}개</div>
        </div>
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: c.textLight }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={'\uC81C\uD488\uBA85 \uAC80\uC0C9'}
            style={{ ...inputStyle, paddingLeft: 32 }} />
        </div>
        {categories.length > 0 && (
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            style={{ padding: '10px 12px', borderRadius: 10, border: `1px solid ${c.borderLight}`, fontSize: 13, outline: 'none', color: c.text, background: 'white' }}>
            <option value="">{'\uC804\uCCB4 \uCE74\uD14C\uACE0\uB9AC'}</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        )}
        <button onClick={() => setShowLow(!showLow)}
          style={{ padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            border: `1.5px solid ${showLow ? '#EF4444' : c.borderLight}`,
            background: showLow ? '#FEF2F2' : 'white', color: showLow ? '#EF4444' : c.textLight,
          }}>
          <AlertTriangle style={{ width: 12, height: 12, display: 'inline', verticalAlign: -1, marginRight: 4 }} />
          {'\uBD80\uC871'}
        </button>
      </div>

      {/* Product List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: c.textLight }}>{'\uB85C\uB529 \uC911...'}</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: c.textLight }}>{search || filterCat || showLow ? '\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4' : '\uB4F1\uB85D\uB41C \uC81C\uD488\uC774 \uC5C6\uC2B5\uB2C8\uB2E4'}</div>
      ) : mob ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(p => {
            const isLow = p.stock <= p.minStock && p.minStock > 0;
            return (
              <div key={p.id} style={{ ...card, padding: 14, background: isLow ? '#FEF2F230' : 'white', border: `1px solid ${isLow ? '#FECACA' : c.borderLight}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: c.text, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {p.name}
                      {isLow && <AlertTriangle style={{ width: 13, height: 13, color: '#EF4444' }} />}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                      {p.category && <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 5, background: '#F3F4F6', color: c.textLight }}>{p.category}</span>}
                      {p.supplier && <span style={{ fontSize: 11, color: c.textLight }}>{p.supplier}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => openEdit(p)}
                      style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${c.borderLight}`, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Pencil style={{ width: 13, height: 13, color: c.textLight }} />
                    </button>
                    <button onClick={() => handleDelete(p)}
                      style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #FECACA', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 style={{ width: 13, height: 13, color: '#EF4444' }} />
                    </button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '8px 10px', background: '#F9FAFB', borderRadius: 8, marginBottom: 10, fontSize: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: c.textLight, marginBottom: 2 }}>재고</div>
                    <div style={{ fontWeight: 700, color: isLow ? '#EF4444' : c.text }}>
                      {fmtNum(p.stock)}
                      {p.minStock > 0 && <span style={{ fontSize: 10, color: c.textLight, fontWeight: 400 }}> /{fmtNum(p.minStock)}</span>}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: c.textLight, marginBottom: 2 }}>원가</div>
                    <div style={{ color: c.textLight }}>{fmtPrice(p.costPrice)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: c.textLight, marginBottom: 2 }}>판매가</div>
                    <div style={{ fontWeight: 600, color: c.text }}>{fmtPrice(p.sellPrice)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setStockModal(p); setStockType('in'); setStockDelta(1); }}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#16A34A', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <ArrowDown style={{ width: 13, height: 13 }} /> 입고
                  </button>
                  <button onClick={() => { setStockModal(p); setStockType('out'); setStockDelta(1); }}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', color: '#EF4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <ArrowUp style={{ width: 13, height: 13 }} /> 출고
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ ...card, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${c.borderLight}`, background: '#FAFAFA' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: c.textLight }}>{'\uC81C\uD488\uBA85'}</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: 11, fontWeight: 600, color: c.textLight }}>{'\uCE74\uD14C\uACE0\uB9AC'}</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: 11, fontWeight: 600, color: c.textLight }}>{'\uB9E4\uC785\uCC98'}</th>
                <th style={{ textAlign: 'center', padding: '10px 8px', fontSize: 11, fontWeight: 600, color: c.textLight }}>{'\uC7AC\uACE0'}</th>
                <th style={{ textAlign: 'right', padding: '10px 8px', fontSize: 11, fontWeight: 600, color: c.textLight }}>{'\uC6D0\uAC00'}</th>
                <th style={{ textAlign: 'right', padding: '10px 8px', fontSize: 11, fontWeight: 600, color: c.textLight }}>{'\uD310\uB9E4\uAC00'}</th>
                <th style={{ textAlign: 'center', padding: '10px 8px', fontSize: 11, fontWeight: 600, color: c.textLight }}>{'\uC785/\uCD9C\uACE0'}</th>
                <th style={{ textAlign: 'center', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: c.textLight }}>{''}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const isLow = p.stock <= p.minStock && p.minStock > 0;
                return (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${c.borderLight}10`, background: isLow ? '#FEF2F240' : 'transparent' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: c.text }}>
                      {p.name}
                      {isLow && <AlertTriangle style={{ width: 12, height: 12, color: '#EF4444', display: 'inline', verticalAlign: -1, marginLeft: 4 }} />}
                    </td>
                    <td style={{ padding: '10px 8px', color: c.textLight }}>
                      {p.category ? <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 6, background: '#F3F4F6', color: c.textLight }}>{p.category}</span> : '-'}
                    </td>
                    <td style={{ padding: '10px 8px', color: c.textLight, fontSize: 12 }}>
                      {p.supplier || '-'}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: isLow ? '#EF4444' : c.text }}>
                      {fmtNum(p.stock)}
                      {p.minStock > 0 && <span style={{ fontSize: 10, color: c.textLight, fontWeight: 400 }}> /{fmtNum(p.minStock)}</span>}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', color: c.textLight, fontSize: 12 }}>{fmtPrice(p.costPrice)}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600, color: c.text, fontSize: 12 }}>{fmtPrice(p.sellPrice)}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                        <button onClick={() => { setStockModal(p); setStockType('in'); setStockDelta(1); }} title={'\uC785\uACE0'}
                          style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid #BBF7D0`, background: '#F0FDF4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ArrowDown style={{ width: 13, height: 13, color: '#22C55E' }} />
                        </button>
                        <button onClick={() => { setStockModal(p); setStockType('out'); setStockDelta(1); }} title={'\uCD9C\uACE0'}
                          style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid #FECACA`, background: '#FEF2F2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ArrowUp style={{ width: 13, height: 13, color: '#EF4444' }} />
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button onClick={() => openEdit(p)}
                          style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${c.borderLight}`, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Pencil style={{ width: 12, height: 12, color: c.textLight }} />
                        </button>
                        <button onClick={() => handleDelete(p)}
                          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #FECACA', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 style={{ width: 12, height: 12, color: '#EF4444' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 등록/수정 모달 */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: mob ? 10 : 0 }}
          onClick={() => setShowModal(false)}>
          <div style={{ background: 'white', borderRadius: 16, padding: mob ? '20px 16px' : '24px 28px', width: mob ? '95vw' : '100%', maxWidth: mob ? '95vw' : 420, maxHeight: mob ? '90vh' : '85vh', overflowY: 'auto', position: 'relative' }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: c.textLight }}>
              <X style={{ width: 18, height: 18 }} />
            </button>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, marginBottom: 20 }}>{editTarget ? '제품 수정' : '제품 등록'}</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'block', marginBottom: 4 }}>제품명 *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder={'제품명 입력'} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'block', marginBottom: 4 }}>카테고리</label>
                <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder={'예: 화장품, 도구, 소모품'} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'block', marginBottom: 4 }}>매입처</label>
                <input value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} placeholder={'예: 코스알엑스, 뷰티마트'} style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'block', marginBottom: 4 }}>현재 재고</label>
                  <input value={form.stock ? fmtNum(form.stock) : ''} onChange={e => setForm({...form, stock: parseNum(e.target.value)})} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'block', marginBottom: 4 }}>최소 재고</label>
                  <input value={form.minStock ? fmtNum(form.minStock) : ''} onChange={e => setForm({...form, minStock: parseNum(e.target.value)})} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'block', marginBottom: 4 }}>원가</label>
                  <input value={form.costPrice ? fmtNum(form.costPrice) : ''} onChange={e => updateCostPrice(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'block', marginBottom: 4 }}>마진 (%)</label>
                  <input type="number" value={form.margin || ''} onChange={e => updateMargin(e.target.value)} placeholder="0" style={inputStyle} />
                </div>
              </div>
              {form.sellPrice > 0 && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: c.primaryLight + '30', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: c.textLight }}>판매가 (자동계산)</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: c.primary }}>{fmtPrice(form.sellPrice)}</span>
                </div>
              )}
              {error && <div style={{ fontSize: 12, color: '#EF4444', padding: '6px 10px', borderRadius: 8, background: '#FEF2F2' }}>{error}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button onClick={() => setShowModal(false)}
                  style={{ padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500, border: `1px solid ${c.borderLight}`, background: 'white', cursor: 'pointer', color: c.text }}>취소</button>
                <button onClick={handleSave} disabled={saving}
                  style={{ padding: '8px 22px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: 'none', background: c.primary, color: c.textOnPrimary, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? '처리 중...' : editTarget ? '수정' : '등록'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 입출고 모달 */}
      {stockModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: mob ? 10 : 0 }}
          onClick={() => setStockModal(null)}>
          <div style={{ background: 'white', borderRadius: 16, padding: mob ? '20px 16px' : '24px 28px', width: mob ? '95vw' : '100%', maxWidth: mob ? '95vw' : 340, position: 'relative' }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setStockModal(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: c.textLight }}>
              <X style={{ width: 18, height: 18 }} />
            </button>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 4 }}>{stockModal.name}</h3>
            <div style={{ fontSize: 12, color: c.textLight, marginBottom: 16 }}>현재 재고: <strong>{stockModal.stock}</strong>개</div>

            {/* 입고/출고 전환 */}
            <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: `1px solid ${c.borderLight}`, marginBottom: 14 }}>
              <button onClick={() => setStockType('in')}
                style={{ flex: 1, padding: '8px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: stockType === 'in' ? '#22C55E' : 'white', color: stockType === 'in' ? 'white' : c.textLight }}>
                <ArrowDown style={{ width: 13, height: 13, display: 'inline', verticalAlign: -2, marginRight: 4 }} />입고
              </button>
              <button onClick={() => setStockType('out')}
                style={{ flex: 1, padding: '8px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: stockType === 'out' ? '#EF4444' : 'white', color: stockType === 'out' ? 'white' : c.textLight }}>
                <ArrowUp style={{ width: 13, height: 13, display: 'inline', verticalAlign: -2, marginRight: 4 }} />출고
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <button onClick={() => setStockDelta(Math.max(0, stockDelta - 1))}
                style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${c.borderLight}`, background: 'white', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: c.textLight }}>-</button>
              <input type="number" value={stockDelta} onChange={e => setStockDelta(Math.max(0, parseInt(e.target.value) || 0))}
                style={{ flex: 1, textAlign: 'center', padding: '10px', borderRadius: 10, border: `1px solid ${c.borderLight}`, fontSize: 18, fontWeight: 700, outline: 'none', color: c.text }} />
              <button onClick={() => setStockDelta(stockDelta + 1)}
                style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${c.borderLight}`, background: 'white', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: c.textLight }}>+</button>
            </div>

            <div style={{ textAlign: 'center', fontSize: 13, color: c.textLight, marginBottom: 14 }}>
              변경 후: <strong style={{ color: stockType === 'out' && stockModal.stock - stockDelta < 0 ? '#EF4444' : c.text }}>
                {stockType === 'in' ? stockModal.stock + stockDelta : stockModal.stock - stockDelta}개
              </strong>
            </div>

            <button onClick={handleStockChange} disabled={stockDelta <= 0}
              style={{ width: '100%', padding: '10px', borderRadius: 10, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: stockDelta <= 0 ? 0.5 : 1,
                background: stockType === 'in' ? '#22C55E' : '#EF4444', color: 'white' }}>
              {stockType === 'in' ? `${stockDelta}개 입고` : `${stockDelta}개 출고`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
