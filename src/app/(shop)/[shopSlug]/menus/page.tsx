'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, X, Package, Sparkles, Search, Check } from 'lucide-react';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';

type Treatment = { id: string; name: string; duration: number; category?: { name: string } };
type MenuTreatment = { id: string; treatmentId: string; treatment: Treatment };
type Menu = {
  id: string; name: string; description?: string; price: number; duration: number;
  sessions?: number; sessionInterval?: number;
  categoryId?: string; isActive: boolean; isPublic: boolean;
  menuTreatments?: MenuTreatment[];
};

export default function MenusPage() {
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

  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<{id:string;name:string}[]>([]);
  const [allTreatments, setAllTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<string>('ALL');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', duration: '', sessions: '', sessionInterval: '', categoryId: '', isActive: true, isPublic: true });
  const [selectedTreatmentIds, setSelectedTreatmentIds] = useState<string[]>([]);
  const [treatmentSearch, setTreatmentSearch] = useState('');
  const [showTreatmentPicker, setShowTreatmentPicker] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/shops/${shopSlug}/categories`);
      if (res.ok) { const d = await res.json(); setCategories(d.categories); }
    } catch (e) { console.error(e); }
  };

  const fetchTreatments = async () => {
    try {
      const res = await fetch(`/api/shops/${shopSlug}/treatments`);
      if (res.ok) { const d = await res.json(); setAllTreatments(d.treatments); }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (shopSlug) { fetchMenus(); fetchCategories(); fetchTreatments(); } }, [shopSlug]);

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/menus`);
      if (res.ok) { const d = await res.json(); setMenus(d.menus || d); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // Modal open
  const openNew = () => {
    setForm({ name: '', description: '', price: '', duration: '', sessions: '', sessionInterval: '', categoryId: '', isActive: true, isPublic: true });
    setSelectedTreatmentIds([]); setTreatmentSearch(''); setShowTreatmentPicker(false);
    setEditingId(null); setShowModal(true);
  };

  // 헤더의 상품추가 탭 클릭 시 ?new=1로 진입 → 모달 열기
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openNew();
      router.replace(`/${shopSlug}/menus`);
    }
  }, [searchParams]);

  const openEdit = (m: Menu) => {
    setForm({
      name: m.name, description: m.description || '',
      price: m.price.toLocaleString(), duration: String(m.duration),
      sessions: m.sessions ? String(m.sessions) : '',
      sessionInterval: m.sessionInterval ? String(m.sessionInterval) : '',
      categoryId: m.categoryId || '', isActive: m.isActive, isPublic: m.isPublic
    });
    setSelectedTreatmentIds((m.menuTreatments || []).map(mt => mt.treatmentId));
    setTreatmentSearch(''); setShowTreatmentPicker(false);
    setEditingId(m.id); setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingId(null); };

  const handleSave = async () => {
    try {
      const priceNum = parseInt(form.price.replace(/,/g, '')) || 0;
      const body: any = { ...form, price: priceNum, duration: parseInt(form.duration) || 0 };
      body.categoryId = form.categoryId || null;
      body.sessions = form.sessions ? parseInt(form.sessions) || null : null;
      body.sessionInterval = form.sessionInterval ? parseInt(form.sessionInterval) || null : null;
      body.treatmentIds = selectedTreatmentIds;
      const url = editingId ? `/api/shops/${shopSlug}/menus/${editingId}` : `/api/shops/${shopSlug}/menus`;
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { fetchMenus(); closeModal(); }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    const m = menus.find(m => m.id === editingId);
    if (!confirm(`"${m?.name}" \uC0C1\uD488\uC744 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?`)) return;
    try {
      await fetch(`/api/shops/${shopSlug}/menus/${editingId}`, { method: 'DELETE' });
      fetchMenus(); closeModal();
    } catch (e) { console.error(e); }
  };

  const handleToggleActive = async (e: React.MouseEvent, menu: Menu) => {
    e.stopPropagation();
    // 낙관적 업데이트 - 먼저 UI 반영
    setMenus(prev => prev.map(m => m.id === menu.id ? { ...m, isActive: !m.isActive } : m));
    try {
      const res = await fetch(`/api/shops/${shopSlug}/menus/${menu.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !menu.isActive })
      });
      if (!res.ok) {
        // 실패 시 되돌리기
        setMenus(prev => prev.map(m => m.id === menu.id ? { ...m, isActive: menu.isActive } : m));
      }
    } catch (e) {
      // 에러 시 되돌리기
      setMenus(prev => prev.map(m => m.id === menu.id ? { ...m, isActive: menu.isActive } : m));
    }
  };

  // Total price
  const totalPrice = form.sessions && parseInt(form.sessions) > 0 && form.price
    ? (parseInt(form.price.replace(/,/g, '')) || 0) * (parseInt(form.sessions) || 0)
    : null;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="w-8 h-8 rounded-full animate-spin" style={{ borderWidth: 2, borderStyle: 'solid', borderColor: c.primary, borderTopColor: 'transparent' }} />
    </div>
  );

  const filteredMenus = selectedCat === 'ALL'
    ? menus
    : menus.filter(m => m.categoryId === selectedCat);

  return (
    <>
    <div style={{ maxWidth: 960, margin: '0 auto', padding: mob ? '14px 10px' : '20px 16px' }} className="space-y-4 sm:space-y-6">
      {/* 카테고리 탭: 가로 스크롤 */}
      {categories.length > 0 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
          {[{ id: 'ALL', name: '전체' }, ...categories].map(cat => {
            const active = selectedCat === cat.id;
            return (
              <button key={cat.id} onClick={() => setSelectedCat(cat.id)}
                style={{
                  flexShrink: 0, padding: mob ? '6px 12px' : '7px 16px', borderRadius: 10,
                  fontSize: mob ? 12 : 13, fontWeight: 600,
                  border: `1px solid ${active ? c.primary : c.borderLight}`,
                  background: active ? c.primary : 'white',
                  color: active ? c.textOnPrimary : c.text,
                  cursor: 'pointer', transition: 'all .15s'
                }}>
                {cat.name}
              </button>
            );
          })}
        </div>
      )}

      {filteredMenus.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: c.primaryLight + '20' }}>
          <Package className="w-12 h-12 mx-auto mb-3" style={{ color: c.borderLight }} />
          <p className="text-sm" style={{ color: c.textLight }}>{'등록된 상품이 없습니다'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : 'repeat(2, 1fr)', gap: 12 }}>
          {filteredMenus.map(menu => (
            <div key={menu.id} className="rounded-2xl overflow-hidden cursor-pointer group transition-all hover:shadow-md"
              onClick={() => openEdit(menu)}
              style={{ border: `1px solid ${c.borderLight}`, opacity: menu.isActive ? 1 : 0.5, background: 'white' }}>
              <div style={{ padding: mob ? '12px 14px' : '16px 20px', display: 'flex', alignItems: 'center', gap: mob ? 10 : 16 }}>
                <div style={{ width: mob ? 36 : 40, height: mob ? 36 : 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: c.primaryLight + '30' }}>
                  <Package style={{ width: mob ? 18 : 20, height: mob ? 18 : 20, color: c.primary }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: mob ? 14 : 15, color: c.text }}>{menu.name}</span>
                    {menu.categoryId && (() => {
                      const cat = categories.find(c => c.id === menu.categoryId);
                      return cat ? <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 9999, fontWeight: 500, backgroundColor: '#DBEAFE', color: '#1D4ED8' }}>{cat.name}</span> : null;
                    })()}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 4, color: c.textLight }}>
                    {menu.duration}분 · ₩{menu.price.toLocaleString()}
                    {menu.sessions && ` · ${menu.sessions}회`}
                    {menu.sessionInterval && ` · ${menu.sessionInterval}일간격`}
                    {menu.sessions && menu.sessions > 0 && (
                      <span style={{ fontWeight: 600, color: '#D97706' }}> · 총₩{(menu.price * menu.sessions).toLocaleString()}</span>
                    )}
                    {menu.description && ` · ${menu.description}`}
                  </div>
                  {menu.menuTreatments && menu.menuTreatments.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                      {menu.menuTreatments.map(mt => (
                        <span key={mt.id} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, backgroundColor: '#F3E8FF', color: '#7C3AED' }}>
                          {mt.treatment.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div onClick={e => e.stopPropagation()} style={{ flexShrink: 0 }}>
                  <Switch checked={menu.isActive} onCheckedChange={() => handleToggleActive({stopPropagation:()=>{}} as any, menu)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* MODAL */}
    {showModal && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={closeModal} style={{ padding: mob ? 10 : 0 }}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full mx-auto max-h-[90vh] overflow-hidden"
          style={{ width: mob ? '95vw' : '100%', maxWidth: mob ? '95vw' : 512 }} onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between border-b" style={{ padding: mob ? '12px 16px' : '16px 24px', backgroundColor: c.primaryLight + '30' }}>
            <h3 className="text-lg font-bold" style={{ color: c.text }}>
              <Package className="w-5 h-5 inline mr-2" style={{ color: c.primary }} />
              {editingId ? '상품 수정' : '새 상품 추가'}
            </h3>
            <button onClick={closeModal} className="p-1 rounded-lg hover:bg-black/5"><X className="w-5 h-5" style={{ color: c.textLight }} /></button>
          </div>

          {/* Body */}
          <div className="space-y-4 overflow-y-auto" style={{ padding: mob ? '14px 16px' : '20px 24px', maxHeight: 'calc(90vh - 130px)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: mob ? 10 : 16 }}>
              <div><label className="text-xs font-medium block mb-1" style={{ color: c.textLight }}>{'상품명'}</label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder={'예: 수분촉촉 패키지'} className="rounded-xl" /></div>
              <div><label className="text-xs font-medium block mb-1" style={{ color: c.textLight }}>{'카테고리'}</label>
                <select value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})}
                  className="w-full h-9 px-3 rounded-xl border text-sm" style={{ borderColor: c.borderLight, color: c.text }}>
                  <option value="">{'미분류'}</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: mob ? 10 : 16 }}>
              <div><label className="text-xs font-medium block mb-1" style={{ color: c.textLight }}>{'가격(원)'}</label>
                <Input value={form.price} onChange={e => { const raw = e.target.value.replace(/[^\d]/g, ''); setForm({...form, price: raw ? parseInt(raw).toLocaleString() : ''}); }} placeholder="50,000" className="rounded-xl" /></div>
              <div><label className="text-xs font-medium block mb-1" style={{ color: c.textLight }}>{'소요시간(분)'}</label>
                <Input type="number" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} placeholder="60" className="rounded-xl" /></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: mob ? 10 : 16 }}>
              <div><label className="text-xs font-medium block mb-1" style={{ color: c.textLight }}>{'횟수(회)'}</label>
                <Input type="number" value={form.sessions} onChange={e => setForm({...form, sessions: e.target.value})} placeholder={'예: 10'} className="rounded-xl" /></div>
              <div><label className="text-xs font-medium block mb-1" style={{ color: c.textLight }}>{'회차간격(일)'}</label>
                <Input type="number" value={form.sessionInterval} onChange={e => setForm({...form, sessionInterval: e.target.value})} placeholder={'예: 7'} className="rounded-xl" /></div>
            </div>

            {/* Total price */}
            {totalPrice !== null && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}>
                <span className="text-xs font-medium" style={{ color: '#92400E' }}>{'\uCD1D\uAE08\uC561'}</span>
                <span className="text-sm font-bold" style={{ color: '#92400E' }}>{'\u20A9'}{totalPrice.toLocaleString()}</span>
              </div>
            )}

            <div><label className="text-xs font-medium block mb-1" style={{ color: c.textLight }}>{'\uC124\uBA85'}</label>
              <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} placeholder={'\uC0C1\uD488 \uC124\uBA85\uC744 \uC785\uB825\uD558\uC138\uC694'} className="rounded-xl" /></div>

            {/* 시술 선택 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium" style={{ color: c.textLight }}>
                  <Sparkles className="w-3.5 h-3.5 inline mr-1" />{'\uC0C1\uC138\uC2DC\uC220'}
                  {selectedTreatmentIds.length > 0 && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: c.primaryLight, color: c.primary }}>{selectedTreatmentIds.length}</span>}
                </label>
                <button onClick={() => setShowTreatmentPicker(!showTreatmentPicker)}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                  style={{ backgroundColor: showTreatmentPicker ? '#7C3AED' : '#F3E8FF', color: showTreatmentPicker ? '#fff' : '#7C3AED' }}>
                  {showTreatmentPicker ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  {showTreatmentPicker ? '\uB2EB\uAE30' : '\uC2DC\uC220+'}
                </button>
              </div>

              {/* 선택된 시술 목록 */}
              {selectedTreatmentIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedTreatmentIds.map(tid => {
                    const t = allTreatments.find(t => t.id === tid);
                    if (!t) return null;
                    return (
                      <span key={tid} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: '#F3E8FF', color: '#7C3AED' }}>
                        {t.category?.name && <span className="opacity-60">{t.category.name} &gt;</span>} {t.name}
                        <span className="opacity-50">({t.duration}{'\uBD84'})</span>
                        <button onClick={() => setSelectedTreatmentIds(prev => prev.filter(id => id !== tid))} className="hover:opacity-70 ml-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* 검색 + 목록 (토글) */}
              {showTreatmentPicker && (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: c.textLight }} />
                    <Input value={treatmentSearch} onChange={e => setTreatmentSearch(e.target.value)}
                      placeholder={'\uC2DC\uC220\uBA85 \uAC80\uC0C9...'} className="rounded-xl pl-9 text-sm h-9" autoFocus />
                  </div>
                  <div className="mt-2 max-h-[180px] overflow-y-auto rounded-xl border" style={{ borderColor: c.borderLight }}>
                    {(() => {
                      const filtered = allTreatments.filter(t =>
                        !treatmentSearch || t.name.toLowerCase().includes(treatmentSearch.toLowerCase()) ||
                        t.category?.name?.toLowerCase().includes(treatmentSearch.toLowerCase())
                      );
                      if (filtered.length === 0) return (
                        <div className="p-4 text-center text-xs" style={{ color: c.textLight }}>{'\uB4F1\uB85D\uB41C \uC2DC\uC220\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.'}</div>
                      );
                      const groups: { [key: string]: { name: string; items: Treatment[] } } = {};
                      filtered.forEach(t => {
                        const gName = t.category?.name || '\uBBF8\uBD84\uB958';
                        if (!groups[gName]) groups[gName] = { name: gName, items: [] };
                        groups[gName].items.push(t);
                      });
                      return Object.values(groups).map(g => (
                        <div key={g.name}>
                          <div className="px-3 py-1.5 text-[10px] font-bold uppercase sticky top-0" style={{ backgroundColor: c.primaryLight + '30', color: c.textLight }}>{g.name}</div>
                          {g.items.map(t => {
                            const isSelected = selectedTreatmentIds.includes(t.id);
                            return (
                              <button key={t.id} onClick={() => {
                                if (isSelected) setSelectedTreatmentIds(prev => prev.filter(id => id !== t.id));
                                else setSelectedTreatmentIds(prev => [...prev, t.id]);
                              }}
                                className="w-full text-left px-3 py-2 flex items-center gap-2 text-sm transition-colors hover:bg-black/3"
                                style={{ backgroundColor: isSelected ? '#F3E8FF' : 'transparent' }}>
                                <div className="w-4 h-4 rounded border flex items-center justify-center shrink-0"
                                  style={{ borderColor: isSelected ? '#7C3AED' : c.borderLight, backgroundColor: isSelected ? '#7C3AED' : 'transparent' }}>
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span style={{ color: c.text }}>{t.name}</span>
                                <span className="text-[10px] ml-auto" style={{ color: c.textLight }}>{t.duration}{'\uBD84'}</span>
                              </button>
                            );
                          })}
                        </div>
                      ));
                    })()}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between border-t" style={{ padding: mob ? '12px 16px' : '16px 24px', backgroundColor: '#fafafa' }}>
            <div>
              {editingId && (
                <button onClick={handleDelete} className="px-3 sm:px-4 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4 inline mr-1" />{'삭제'}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeModal} className="rounded-xl">{'취소'}</Button>
              <button onClick={handleSave} disabled={!form.name.trim()}
                className="px-4 sm:px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-40"
                style={{ backgroundColor: c.primary, color: c.textOnPrimary }}>{'저장'}</button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
