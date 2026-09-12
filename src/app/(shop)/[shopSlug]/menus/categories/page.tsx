'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import TagInput from '@/components/ui/tag-input';
import { Plus, Pencil, Trash2, FolderOpen, X, Check, Tag, Clock, Sparkles, Wrench, Camera, ImagePlus, XCircle, ShoppingBag } from 'lucide-react';

type Category = { id: string; name: string; sortOrder: number };
type Treatment = {
  id: string; name: string; duration: number; features?: string; equipment?: string;
  photos?: string[] | string | null; categoryId: string; sortOrder: number;
  category?: { name: string }; processSteps?: string;
};

export default function TreatmentDetailPage() {
  const params = useParams();
  const shopSlug = params.shopSlug as string;
  const [mounted, setMounted] = useState(false);
  const store = useThemeStore();
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;

  const [categories, setCategories] = useState<Category[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Group form
  const [newGroupName, setNewGroupName] = useState('');
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');

  // Treatment modal
  const [showModal, setShowModal] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<string | null>(null);
  const [tForm, setTForm] = useState({ name: '', duration: '60', features: '', processSteps: '' });
  const [enablePhotos, setEnablePhotos] = useState(false);
  const [equipmentTags, setEquipmentTags] = useState<string[]>([]);
  const [productTags, setProductTags] = useState<string[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`/api/shops/${shopSlug}/categories`);
      if (res.ok) { const d = await res.json(); setCategories(d.categories); }
    } catch (e) { console.error(e); }
  }, [shopSlug]);

  const fetchTreatments = useCallback(async () => {
    try {
      const res = await fetch(`/api/shops/${shopSlug}/treatments`);
      if (res.ok) {
        const d = await res.json();
        setTreatments(d.treatments.map((t: any) => ({
          ...t,
          photos: Array.isArray(t.photos) ? t.photos : (typeof t.photos === 'string' ? (() => { try { return JSON.parse(t.photos); } catch { return []; } })() : [])
        })));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [shopSlug]);

  useEffect(() => { if (shopSlug) { fetchCategories(); fetchTreatments(); } }, [shopSlug, fetchCategories, fetchTreatments]);

  // Group CRUD
  const addGroup = async () => {
    if (!newGroupName.trim()) return;
    const maxSort = categories.length > 0 ? Math.max(...categories.map(c => c.sortOrder)) + 1 : 0;
    const res = await fetch(`/api/shops/${shopSlug}/categories`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newGroupName.trim(), sortOrder: maxSort })
    });
    if (res.ok) { setNewGroupName(''); fetchCategories(); }
    else if (res.status === 409) alert('\uC774\uBBF8 \uC874\uC7AC\uD558\uB294 \uADF8\uB8F9\uBA85\uC785\uB2C8\uB2E4.');
  };

  const updateGroup = async (id: string) => {
    if (!editGroupName.trim()) return;
    await fetch(`/api/shops/${shopSlug}/categories/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editGroupName.trim() })
    });
    setEditGroupId(null); fetchCategories();
  };

  const deleteGroup = async (id: string, name: string) => {
    if (!confirm(`"${name}" \uADF8\uB8F9\uC744 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?\n\uC18C\uC18D \uC2DC\uC220\uB3C4 \uD568\uAED8 \uC0AD\uC81C\uB429\uB2C8\uB2E4.`)) return;
    await fetch(`/api/shops/${shopSlug}/categories/${id}`, { method: 'DELETE' });
    if (selectedGroupId === id) setSelectedGroupId(null);
    fetchCategories(); fetchTreatments();
  };

  // Treatment modal
  const openNewTreatment = () => {
    setTForm({ name: '', duration: '60', features: '', processSteps: '' });
    setEnablePhotos(false);
    setEquipmentTags([]); setProductTags([]);
    setPhotoUrls([]); setEditingTreatment(null); setShowModal(true);
  };

  const openEditTreatment = (t: Treatment) => {
    let processText = '';
    try {
      if (t.processSteps) {
        const parsed = typeof t.processSteps === 'string' ? JSON.parse(t.processSteps) : t.processSteps;
        if (Array.isArray(parsed)) {
          processText = parsed.map((f: any) => `${f.name},${f.value || ''}-${f.unit || ''}`).join('\n');
        }
      }
    } catch {}
    setTForm({ name: t.name, duration: String(t.duration), features: t.features || '', processSteps: processText });
    setEnablePhotos(!!(t as any).enablePhotos);
    // Parse equipment JSON
    let eqTags: string[] = [], prTags: string[] = [];
    if (t.equipment) {
      try {
        const parsed = JSON.parse(t.equipment as string);
        if (parsed.equipment) eqTags = parsed.equipment;
        if (parsed.products) prTags = parsed.products;
      } catch { /* legacy text format - ignore */ }
    }
    setEquipmentTags(eqTags); setProductTags(prTags);
    const photos = Array.isArray(t.photos) ? t.photos : [];
    setPhotoUrls(photos);
    setEditingTreatment(t.id); setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingTreatment(null); };

  // Collect all unique tags for suggestions
  const allEquipmentSuggestions = [...new Set(treatments.flatMap(t => {
    if (!t.equipment) return [];
    try { const p = JSON.parse(t.equipment as string); return p.equipment || []; } catch { return []; }
  }))];
  const allProductSuggestions = [...new Set(treatments.flatMap(t => {
    if (!t.equipment) return [];
    try { const p = JSON.parse(t.equipment as string); return p.products || []; } catch { return []; }
  }))];

  const saveTreatment = async () => {
    if (!tForm.name.trim()) return;
    const catId = editingTreatment ? treatments.find(t => t.id === editingTreatment)?.categoryId : selectedGroupId;
    if (!catId) return;
    const equipmentData = (equipmentTags.length > 0 || productTags.length > 0) ? JSON.stringify({ equipment: equipmentTags, products: productTags }) : null;
    // processSteps 변환
    let processStepsJson: string | null = null;
    if (tForm.processSteps.trim()) {
      const steps = tForm.processSteps.trim().split('\n').filter(Boolean).map(line => {
        const [name, rest] = line.split(',');
        const [value, unit] = (rest || '').split('-');
        return { name: (name || '').trim(), value: (value || '').trim(), unit: (unit || '').trim() };
      });
      processStepsJson = JSON.stringify(steps);
    }
    const body = { categoryId: catId, name: tForm.name, duration: parseInt(tForm.duration) || 60, features: tForm.features || null, equipment: equipmentData, photos: photoUrls.length > 0 ? photoUrls : null, processSteps: processStepsJson, enablePhotos };
    const url = editingTreatment ? `/api/shops/${shopSlug}/treatments/${editingTreatment}` : `/api/shops/${shopSlug}/treatments`;
    const method = editingTreatment ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) { closeModal(); fetchTreatments(); }
  };

  const deleteTreatment = async () => {
    if (!editingTreatment) return;
    const t = treatments.find(t => t.id === editingTreatment);
    if (!confirm(`"${t?.name}" \uC2DC\uC220\uC744 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?`)) return;
    await fetch(`/api/shops/${shopSlug}/treatments/${editingTreatment}`, { method: 'DELETE' });
    closeModal(); fetchTreatments();
  };

  // Photo upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (res.ok) {
          const d = await res.json();
          setPhotoUrls(prev => [...prev, d.url]);
        }
      }
    } catch (e) { console.error(e); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const removePhoto = (idx: number) => { setPhotoUrls(prev => prev.filter((_, i) => i !== idx)); };

  const filteredTreatments = selectedGroupId ? treatments.filter(t => t.categoryId === selectedGroupId) : treatments;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="w-8 h-8 rounded-full animate-spin" style={{ borderWidth: 2, borderStyle: 'solid', borderColor: c.primary, borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: c.text }}>{'\uC2DC\uC220 \uC0C1\uC138'}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* LEFT: Groups */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold px-1" style={{ color: c.textLight }}>{'\uC0C1\uC704\uADF8\uB8F9'}</h3>
          <div className="flex gap-2">
            <Input value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addGroup()}
              placeholder={'\uADF8\uB8F9\uBA85 \uC785\uB825'} className="rounded-xl text-sm h-9" />
            <button onClick={addGroup} disabled={!newGroupName.trim()}
              className="px-3 py-1 rounded-xl text-xs font-medium shrink-0 disabled:opacity-40"
              style={{ backgroundColor: c.primary, color: c.textOnPrimary }}>
              <Plus className="w-4 h-4" /></button>
          </div>

          <button onClick={() => setSelectedGroupId(null)}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ backgroundColor: !selectedGroupId ? c.primary : 'transparent', color: !selectedGroupId ? c.textOnPrimary : c.text }}>
            {'\uC804\uCCB4'} <span className="text-xs opacity-70">({treatments.length})</span>
          </button>

          {categories.map(cat => {
            const count = treatments.filter(t => t.categoryId === cat.id).length;
            const isSelected = selectedGroupId === cat.id;
            return (
              <div key={cat.id} className="group">
                {editGroupId === cat.id ? (
                  <div className="flex gap-1">
                    <Input value={editGroupName} onChange={e => setEditGroupName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') updateGroup(cat.id); if (e.key === 'Escape') setEditGroupId(null); }}
                      className="rounded-lg h-8 text-sm" autoFocus />
                    <button onClick={() => updateGroup(cat.id)} className="p-1 rounded hover:bg-green-50"><Check className="w-4 h-4 text-green-600" /></button>
                    <button onClick={() => setEditGroupId(null)} className="p-1 rounded hover:bg-red-50"><X className="w-4 h-4 text-red-400" /></button>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <button onClick={() => setSelectedGroupId(cat.id)}
                      className="flex-1 text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={{ backgroundColor: isSelected ? c.primary : 'transparent', color: isSelected ? c.textOnPrimary : c.text }}>
                      <Tag className="w-3.5 h-3.5 inline mr-2" />{cat.name} <span className="text-xs opacity-70">({count})</span>
                    </button>
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditGroupId(cat.id); setEditGroupName(cat.name); }} className="p-1 rounded hover:bg-black/5">
                        <Pencil className="w-3 h-3" style={{ color: c.textLight }} /></button>
                      <button onClick={() => deleteGroup(cat.id, cat.name)} className="p-1 rounded hover:bg-red-50">
                        <Trash2 className="w-3 h-3 text-red-400" /></button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* RIGHT: Treatments */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold" style={{ color: c.text }}>
              {selectedGroupId ? categories.find(c => c.id === selectedGroupId)?.name : '\uC804\uCCB4'} {'\uC2DC\uC220'}
              <span className="text-sm font-normal ml-2" style={{ color: c.textLight }}>({filteredTreatments.length}{'\uAC1C'})</span>
            </h3>
            {selectedGroupId && (
              <button onClick={openNewTreatment}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                style={{ backgroundColor: c.primary, color: c.textOnPrimary }}>
                <Plus className="w-4 h-4" /> {'\uC2DC\uC220 \uCD94\uAC00'}
              </button>
            )}
          </div>

          {filteredTreatments.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: c.primaryLight + '15' }}>
              <FolderOpen className="w-12 h-12 mx-auto mb-3" style={{ color: c.primary + '40' }} />
              <p className="text-sm" style={{ color: c.textLight }}>
                {selectedGroupId ? '\uC774 \uADF8\uB8F9\uC5D0 \uB4F1\uB85D\uB41C \uC2DC\uC220\uC774 \uC5C6\uC2B5\uB2C8\uB2E4' : '\uC0C1\uC704\uADF8\uB8F9\uC744 \uC120\uD0DD\uD558\uACE0 \uC2DC\uC220\uC744 \uCD94\uAC00\uD558\uC138\uC694'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTreatments.map(t => {
                const photos = Array.isArray(t.photos) ? t.photos : [];
                return (
                  <div key={t.id} className="rounded-2xl p-4 cursor-pointer group transition-all hover:shadow-md"
                    onClick={() => openEditTreatment(t)}
                    style={{ backgroundColor: c.surface, border: `1px solid ${c.borderLight}` }}>
                    <div className="flex items-start gap-3">
                      {/* Thumbnail */}
                      {photos.length > 0 ? (
                        <img src={photos[0]} alt={t.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: c.primaryLight + '30' }}>
                          <Sparkles className="w-6 h-6" style={{ color: c.primary }} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold" style={{ color: c.text }}>{t.name}</span>
                          {!selectedGroupId && t.category && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8' }}>{t.category.name}</span>
                          )}
                          {photos.length > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#F3E8FF', color: '#7C3AED' }}>
                              <Camera className="w-3 h-3 inline" /> {photos.length}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: c.textLight }}>
                          <span><Clock className="w-3 h-3 inline mr-1" />{t.duration}{'\uBD84'}</span>
                          {t.features && <span>{'\u00B7'} {t.features.substring(0, 40)}{t.features.length > 40 ? '...' : ''}</span>}
                        </div>
                        {t.equipment && (() => {
                          try {
                            const p = JSON.parse(t.equipment as string);
                            const eq = p.equipment || []; const pr = p.products || [];
                            if (eq.length === 0 && pr.length === 0) return null;
                            return (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {eq.map((e: string) => <span key={e} className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}>{e}</span>)}
                                {pr.map((p: string) => <span key={p} className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: '#FDF2F4', color: '#B76E79' }}>{p}</span>)}
                              </div>
                            );
                          } catch { return <p className="text-xs mt-1" style={{ color: c.textLight + '99' }}><Wrench className="w-3 h-3 inline mr-1" />{(t.equipment as string).substring(0, 50)}</p>; }
                        })()}
                      </div>
                      <Pencil className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" style={{ color: c.textLight }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!selectedGroupId && categories.length === 0 && (
            <div className="rounded-xl p-4 text-xs" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
              <p className="font-semibold mb-1">{'\uC2DC\uC791\uD558\uAE30'}</p>
              <p>{'\uC88C\uCE21\uC5D0\uC11C \uC0C1\uC704\uADF8\uB8F9\uC744 \uB9CC\uB4E4\uACE0, \uADF8\uB8F9\uC744 \uC120\uD0DD\uD55C \uD6C4 \uC2DC\uC220\uC744 \uCD94\uAC00\uD558\uC138\uC694.'}</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={closeModal}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: c.primaryLight + '30' }}>
              <h3 className="text-lg font-bold" style={{ color: c.text }}>
                <Sparkles className="w-5 h-5 inline mr-2" style={{ color: c.primary }} />
                {editingTreatment ? '\uC2DC\uC220 \uC218\uC815' : '\uC0C8 \uC2DC\uC220 \uCD94\uAC00'}
              </h3>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-black/5"><X className="w-5 h-5" style={{ color: c.textLight }} /></button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium block mb-1" style={{ color: c.textLight }}>{'\uC2DC\uC220\uBA85'}</label>
                  <Input value={tForm.name} onChange={e => setTForm({...tForm, name: e.target.value})} placeholder={'\uC608: \uC218\uBD84 \uCF00\uC5B4'} className="rounded-xl" /></div>
                <div><label className="text-xs font-medium block mb-1" style={{ color: c.textLight }}>{'\uAE30\uBCF8\uC2DC\uAC04(\uBD84)'}</label>
                  <Input type="number" value={tForm.duration} onChange={e => setTForm({...tForm, duration: e.target.value})} className="rounded-xl" /></div>
              </div>

              <div><label className="text-xs font-medium block mb-1" style={{ color: c.textLight }}>
                <Sparkles className="w-3.5 h-3.5 inline mr-1" />{'\uD2B9\uC9D5'}</label>
                <Textarea value={tForm.features} onChange={e => setTForm({...tForm, features: e.target.value})} rows={2} placeholder={'\uC2DC\uC220\uC758 \uD2B9\uC9D5\uC744 \uC785\uB825\uD558\uC138\uC694'} className="rounded-xl" /></div>

              {/* 시술과정 등록 */}
              <div><label className="text-xs font-medium block mb-1" style={{ color: c.textLight }}>
                <Sparkles className="w-3.5 h-3.5 inline mr-1" />시술과정</label>
                <Textarea
                  value={tForm.processSteps}
                  onChange={e => setTForm({...tForm, processSteps: e.target.value})}
                  rows={4}
                  placeholder={'시술명,숫자-단위 (한 줄에 하나씩)\n예:\n페이스 마사지,20-분\n레이저샷,20-샷\n오일 진정 마사지,50-회'}
                  className="rounded-xl font-mono text-xs"
                />
                {tForm.processSteps.trim() && (
                  <div className="mt-2 p-2.5 rounded-lg" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                    <div className="text-[10px] font-bold mb-1.5" style={{ color: '#166534' }}>미리보기</div>
                    {tForm.processSteps.trim().split('\n').filter(Boolean).map((line, i) => {
                      const [name, rest] = line.split(',');
                      const [val, unit] = (rest || '').split('-');
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs" style={{ color: '#15803D' }}>
                          <span className="font-medium" style={{ minWidth: 100 }}>{(name || '').trim()}</span>
                          <span>=</span>
                          <span className="font-bold">{(val || '').trim()}</span>
                          <span>{(unit || '').trim()}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div><label className="text-xs font-medium block mb-1" style={{ color: c.textLight }}>
                <Wrench className="w-3.5 h-3.5 inline mr-1" />{'\uC0AC\uC6A9\uC7A5\uBE44'}</label>
                <TagInput tags={equipmentTags} onChange={setEquipmentTags} suggestions={allEquipmentSuggestions}
                  placeholder={'\uC7A5\uBE44\uBA85 \uC785\uB825 \uD6C4 Enter'} color="#2563EB" bgColor="#DBEAFE" /></div>

              <div><label className="text-xs font-medium block mb-1" style={{ color: c.textLight }}>
                <ShoppingBag className="w-3.5 h-3.5 inline mr-1" />{'\uCF00\uC5B4\uC0C1\uD488'}</label>
                <TagInput tags={productTags} onChange={setProductTags} suggestions={allProductSuggestions}
                  placeholder={'\uC0C1\uD488\uBA85 \uC785\uB825 \uD6C4 Enter'} color="#B76E79" bgColor="#FDF2F4" /></div>

              {/* Photos */}
              <div>
                <label className="text-xs font-medium block mb-2" style={{ color: c.textLight }}>
                  <Camera className="w-3.5 h-3.5 inline mr-1" />{'\uC0AC\uC9C4 \uB4F1\uB85D'}
                </label>
                <div className="flex flex-wrap gap-3">
                  {photoUrls.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden group/photo">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removePhoto(i)}
                        className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 opacity-0 group-hover/photo:opacity-100 transition-opacity">
                        <XCircle className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    className="w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors"
                    style={{ border: `2px dashed ${c.borderLight}`, color: c.textLight }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = c.primary}
                    onMouseLeave={e => e.currentTarget.style.borderColor = c.borderLight}>
                    {uploading ? (
                      <div className="w-5 h-5 rounded-full animate-spin" style={{ borderWidth: 2, borderStyle: 'solid', borderColor: c.primary, borderTopColor: 'transparent' }} />
                    ) : (
                      <><ImagePlus className="w-5 h-5" /><span className="text-[10px]">{'\uCD94\uAC00'}</span></>
                    )}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between px-6 py-4 border-t" style={{ backgroundColor: '#fafafa' }}>
              <div>
                {editingTreatment && (
                  <button onClick={deleteTreatment} className="px-4 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4 inline mr-1" />{'\uC0AD\uC81C'}
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={closeModal} className="rounded-xl">{'\uCDE8\uC18C'}</Button>
                <button onClick={saveTreatment} disabled={!tForm.name.trim()}
                  className="px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-40"
                  style={{ backgroundColor: c.primary, color: c.textOnPrimary }}>{'\uC800\uC7A5'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
