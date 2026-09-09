'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { Camera, Plus, X, Edit2, Trash2, Eye, EyeOff, Upload, Search } from 'lucide-react';

type Portfolio = {
  id: string; title: string; category?: string | null; description?: string | null;
  beforeImage?: string | null; afterImage?: string | null; staffName?: string | null;
  isPublic: boolean; createdAt: string;
};

export default function PortfolioPage() {
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

  const [items, setItems] = useState<Portfolio[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');

  // \uBAA8\uB2EC
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Portfolio | null>(null);
  const [form, setForm] = useState({ title: '', category: '', description: '', beforeImage: '', afterImage: '', staffName: '', isPublic: true });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'before' | 'after' | null>(null);

  // \uD655\uB300 \uBDF0
  const [viewItem, setViewItem] = useState<Portfolio | null>(null);

  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/portfolio`);
      if (res.ok) {
        const d = await res.json();
        setItems(d.items || []);
        setCategories(d.categories || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [shopSlug]);

  // 헤더의 등록 탭 클릭 시 ?new=1로 진입 → 모달 열기
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openAdd();
      router.replace(`/${shopSlug}/portfolio`);
    }
  }, [searchParams]);

  const uploadImage = async (file: File, type: 'before' | 'after') => {
    setUploading(type);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const d = await res.json();
        setForm(f => ({ ...f, [type === 'before' ? 'beforeImage' : 'afterImage']: d.url }));
      }
    } catch (e) { console.error(e); }
    setUploading(null);
  };

  const handlePaste = (e: React.ClipboardEvent, type: 'before' | 'after') => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) { uploadImage(file, type); break; }
      }
    }
  };

  const openAdd = () => {
    setEditTarget(null);
    setForm({ title: '', category: '', description: '', beforeImage: '', afterImage: '', staffName: '', isPublic: true });
    setShowModal(true);
  };

  const openEdit = (p: Portfolio) => {
    setEditTarget(p);
    setForm({ title: p.title, category: p.category || '', description: p.description || '', beforeImage: p.beforeImage || '', afterImage: p.afterImage || '', staffName: p.staffName || '', isPublic: p.isPublic });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const url = editTarget ? `/api/shops/${shopSlug}/portfolio/${editTarget.id}` : `/api/shops/${shopSlug}/portfolio`;
      await fetch(url, {
        method: editTarget ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setShowModal(false);
      fetchItems();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('\uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?')) return;
    try {
      await fetch(`/api/shops/${shopSlug}/portfolio/${id}`, { method: 'DELETE' });
      fetchItems();
    } catch (e) { console.error(e); }
  };

  const togglePublic = async (p: Portfolio) => {
    setItems(prev => prev.map(i => i.id === p.id ? { ...i, isPublic: !i.isPublic } : i));
    try {
      await fetch(`/api/shops/${shopSlug}/portfolio/${p.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !p.isPublic }),
      });
    } catch (e) { fetchItems(); }
  };

  const filtered = items.filter(p => {
    if (search && !p.title.includes(search) && !p.category?.includes(search) && !p.staffName?.includes(search)) return false;
    if (filterCat && p.category !== filterCat) return false;
    return true;
  });

  if (!mounted) return null;

  const card = { background: 'white', borderRadius: 14, border: `1px solid ${c.borderLight}` } as const;
  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${c.borderLight}`, fontSize: 13, outline: 'none' } as const;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: mob ? '14px 10px' : '20px 16px' }}>
      {/* 필터 */}
      <div style={{ display: 'flex', flexDirection: mob ? 'column' : 'row', gap: 8, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: c.textLight }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={'검색'}
            style={{ ...inputStyle, paddingLeft: 30 }} />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          style={{ width: mob ? '100%' : 'auto', padding: '8px 12px', borderRadius: 10, border: `1px solid ${c.borderLight}`, fontSize: 13, cursor: 'pointer', outline: 'none' }}>
          <option value="">{'전체'}</option>
          {categories.map(ct => <option key={ct} value={ct}>{ct}</option>)}
        </select>
      </div>

      {/* 그리드 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: c.textLight }}>{'로딩 중...'}</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: c.textLight }}>
          {'포트폴리오를 등록해보세요'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: mob ? 10 : 12 }}>
          {filtered.map(p => (
            <div key={p.id} style={{ ...card, overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow .2s' }}
              onClick={() => setViewItem(p)}>
              {/* 비포애프터 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: 140 }}>
                <div style={{ background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  {p.beforeImage ? (
                    <img src={p.beforeImage} alt="before" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 10, color: '#9CA3AF' }}>Before</span>
                  )}
                </div>
                <div style={{ background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  {p.afterImage ? (
                    <img src={p.afterImage} alt="after" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 10, color: '#9CA3AF' }}>After</span>
                  )}
                </div>
              </div>
              <div style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: c.text }}>{p.title}</span>
                  {!p.isPublic && <EyeOff style={{ width: 12, height: 12, color: c.textLight }} />}
                </div>
                <div style={{ display: 'flex', gap: 6, fontSize: 10, color: c.textLight }}>
                  {p.category && <span style={{ padding: '1px 6px', borderRadius: 4, background: '#F3F4F6' }}>{p.category}</span>}
                  {p.staffName && <span>{p.staffName}</span>}
                </div>
              </div>
              {/* 액션 */}
              <div style={{ display: 'flex', borderTop: `1px solid ${c.borderLight}10`, padding: '4px 8px' }}
                onClick={e => e.stopPropagation()}>
                <button onClick={() => togglePublic(p)} title={p.isPublic ? '비공개' : '공개'}
                  style={{ flex: 1, padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: p.isPublic ? '#22C55E' : c.textLight }}>
                  {p.isPublic ? <Eye style={{ width: 13, height: 13 }} /> : <EyeOff style={{ width: 13, height: 13 }} />}
                </button>
                <button onClick={() => openEdit(p)} style={{ flex: 1, padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: c.primary }}>
                  <Edit2 style={{ width: 13, height: 13 }} />
                </button>
                <button onClick={() => handleDelete(p.id)} style={{ flex: 1, padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}>
                  <Trash2 style={{ width: 13, height: 13 }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 등록/수정 모달 */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: mob ? 10 : 0 }}
          onClick={() => setShowModal(false)}>
          <div style={{ background: 'white', borderRadius: 16, padding: mob ? '18px 16px' : '24px 28px', width: mob ? '95vw' : '100%', maxWidth: 440, maxHeight: mob ? '90vh' : '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text }}>{editTarget ? '포트폴리오 수정' : '포트폴리오 등록'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textLight }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Before / After 사진 */}
            <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 14 }}>
              {['before', 'after'].map(type => {
                const img = type === 'before' ? form.beforeImage : form.afterImage;
                const ref = type === 'before' ? beforeRef : afterRef;
                return (
                  <div key={type}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: c.textLight, display: 'block', marginBottom: 4 }}>{type === 'before' ? '시술 전' : '시술 후'}</label>
                    <div onClick={() => ref.current?.click()} tabIndex={0} onPaste={e => handlePaste(e, type as 'before' | 'after')}
                      style={{ height: mob ? 100 : 120, borderRadius: 10, border: `2px dashed ${c.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', background: '#F9FAFB', position: 'relative', outline: 'none' }}>
                      {uploading === type ? (
                        <span style={{ fontSize: 11, color: c.textLight }}>{'업로드 중...'}</span>
                      ) : img ? (
                        <img src={img} alt={type} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ textAlign: 'center' }}>
                          <Upload style={{ width: 20, height: 20, color: c.textLight }} />
                          <div style={{ fontSize: 10, color: c.textLight, marginTop: 4 }}>{'클릭 또는 Ctrl+V'}</div>
                        </div>
                      )}
                    </div>
                    <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={e => { if (e.target.files?.[0]) uploadImage(e.target.files[0], type as 'before' | 'after'); }} />
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'block', marginBottom: 4 }}>{'제목'} *</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder={'예: 얼굴 리프팅 시술'} style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'block', marginBottom: 4 }}>{'카테고리'}</label>
                  <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder={'예: 피부관리'} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'block', marginBottom: 4 }}>{'담당 관리사'}</label>
                  <input value={form.staffName} onChange={e => setForm({...form, staffName: e.target.value})} placeholder={'예: 김원장'} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'block', marginBottom: 4 }}>{'설명'}</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} placeholder={'시술 설명, 효과 등'}
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight }}>{'공개'}</label>
                <button onClick={() => setForm({...form, isPublic: !form.isPublic})}
                  style={{ width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', position: 'relative', background: form.isPublic ? '#22C55E' : '#D1D5DB', transition: 'background .2s' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: form.isPublic ? 20 : 2, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                </button>
                <span style={{ fontSize: 11, color: form.isPublic ? '#22C55E' : c.textLight }}>{form.isPublic ? '공개' : '비공개'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '8px 18px', borderRadius: 10, fontSize: 13, border: `1px solid ${c.borderLight}`, background: 'white', cursor: 'pointer', color: c.text }}>{'취소'}</button>
              <button onClick={handleSave} disabled={saving || !form.title.trim()}
                style={{ padding: '8px 22px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: 'none', background: c.primary, color: c.textOnPrimary, cursor: 'pointer', opacity: !form.title.trim() ? 0.5 : 1 }}>
                {saving ? '저장 중...' : editTarget ? '수정' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 확대 뷰 모달 */}
      {viewItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: mob ? 0 : 16 }}
          onClick={() => setViewItem(null)}>
          <div style={{ background: 'white', borderRadius: mob ? 0 : 16, padding: mob ? '16px 14px' : '20px', width: mob ? '100vw' : '100%', maxWidth: mob ? '100vw' : 600, height: mob ? '100vh' : 'auto', maxHeight: mob ? '100vh' : '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: mob ? 16 : 18, fontWeight: 700, color: c.text }}>{viewItem.title}</h3>
                <div style={{ display: 'flex', gap: 8, fontSize: 12, color: c.textLight, marginTop: 2 }}>
                  {viewItem.category && <span style={{ padding: '1px 8px', borderRadius: 4, background: '#F3F4F6' }}>{viewItem.category}</span>}
                  {viewItem.staffName && <span>{viewItem.staffName}</span>}
                  <span>{new Date(viewItem.createdAt).toLocaleDateString('ko-KR')}</span>
                </div>
              </div>
              <button onClick={() => setViewItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textLight }}>
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: c.textLight, marginBottom: 4, textAlign: 'center' }}>Before</div>
                <div style={{ borderRadius: 10, overflow: 'hidden', background: '#F3F4F6', height: mob ? 180 : 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {viewItem.beforeImage ? (
                    <img src={viewItem.beforeImage} alt="before" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>{'사진 없음'}</span>
                  )}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: c.textLight, marginBottom: 4, textAlign: 'center' }}>After</div>
                <div style={{ borderRadius: 10, overflow: 'hidden', background: '#F3F4F6', height: mob ? 180 : 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {viewItem.afterImage ? (
                    <img src={viewItem.afterImage} alt="after" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>{'사진 없음'}</span>
                  )}
                </div>
              </div>
            </div>

            {viewItem.description && (
              <div style={{ padding: '12px 14px', borderRadius: 10, background: '#F9FAFB', fontSize: 13, color: c.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {viewItem.description}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
