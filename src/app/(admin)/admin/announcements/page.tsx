'use client';

import { useState, useEffect } from 'react';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { Plus, Eye, Pencil, Trash2, Megaphone, BellRing, X, Save } from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  content: string;
  category: string;
  target: string;
  status: string;
  isImportant: boolean;
  viewCount: number;
  createdAt: string;
}

const CATEGORIES = ['공지', '이벤트', '배송', '시스템', '광고'];
const TARGETS = ['전체', 'Free', 'Standard', 'Pro', 'Enterprise'];
const STATUSES = ['게시중', '예약', '종료'];

export default function AnnouncementsPage() {
  const [mounted, setMounted] = useState(false);
  const store = useThemeStore();
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [form, setForm] = useState({ title: '', content: '', category: '공지', target: '전체', status: '게시중', isImportant: false });

  const fetchNotices = async () => {
    try {
      const res = await fetch('/api/admin/notices');
      if (res.ok) setNotices(await res.json());
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => { fetchNotices(); }, []);

  const resetForm = () => {
    setForm({ title: '', content: '', category: '공지', target: '전체', status: '게시중', isImportant: false });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    try {
      const url = editing ? `/api/admin/notices/${editing.id}` : '/api/admin/notices';
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { resetForm(); fetchNotices(); }
    } catch { /* */ }
  };

  const deleteNotice = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      await fetch(`/api/admin/notices/${id}`, { method: 'DELETE' });
      fetchNotices();
    } catch { /* */ }
  };

  const openEdit = (n: Notice) => {
    setEditing(n);
    setForm({ title: n.title, content: n.content, category: n.category, target: n.target, status: n.status, isImportant: n.isImportant });
    setShowForm(true);
  };

  const statusColor = (s: string) => s === '게시중' ? 'text-green-600' : s === '예약' ? 'text-blue-600' : 'text-gray-500';

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
          style={{ background: c.primary, color: c.textOnPrimary }}>
          <Plus className="h-4 w-4" /> 새 공지/광고
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-sm" style={{ color: c.textLight }}>로딩 중...</div>
      ) : notices.length === 0 ? (
        <div className="text-center py-20">
          <Megaphone className="mx-auto mb-3 h-10 w-10" style={{ color: c.borderLight }} />
          <p className="text-sm" style={{ color: c.textLight }}>등록된 공지가 없습니다</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {notices.map(item => (
            <div key={item.id}
              className="flex items-center justify-between rounded-xl border p-5 transition-all"
              style={{ background: c.surface, borderColor: item.isImportant ? c.primary : c.borderLight,
                borderLeftWidth: item.isImportant ? '4px' : '1px' }}>
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    background: item.category === '공지' || item.category === '시스템' ? '#DBEAFE' : item.category === '이벤트' ? '#FCE7F3' : item.category === '배송' ? '#FEF3C7' : c.primaryLight,
                    color: item.category === '공지' || item.category === '시스템' ? '#2563EB' : item.category === '이벤트' ? '#DB2777' : item.category === '배송' ? '#D97706' : c.primary,
                  }}>
                  {item.category === '광고' ? <Megaphone className="h-5 w-5" /> : <BellRing className="h-5 w-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium" style={{ color: c.text }}>{item.title}</p>
                    {item.isImportant && <span className="text-[10px] font-bold text-red-500 px-1.5 py-0.5 rounded bg-red-50">중요</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs" style={{ color: c.textLight }}>
                      {new Date(item.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ background: c.primaryLight, color: c.primary }}>{item.target}</span>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ background: item.category === '이벤트' ? '#FCE7F3' : item.category === '배송' ? '#FEF3C7' : '#DBEAFE',
                        color: item.category === '이벤트' ? '#DB2777' : item.category === '배송' ? '#D97706' : '#2563EB' }}>{item.category}</span>
                    <span className={`text-xs font-medium ${statusColor(item.status)}`}>● {item.status}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs" style={{ color: c.textLight }}>
                  <Eye className="h-3 w-3" /> {item.viewCount}
                </span>
                <button onClick={() => openEdit(item)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors"
                  style={{ color: c.textLight }}
                  onMouseEnter={e => e.currentTarget.style.background = c.surfaceHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => deleteNotice(item.id)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors text-red-400"
                  onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 등록/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={resetForm}>
          <div className="w-full max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto" style={{ background: c.surface }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${c.borderLight}` }}>
              <h3 className="text-base font-bold" style={{ color: c.text }}>
                {editing ? '공지 수정' : '새 공지/광고 등록'}
              </h3>
              <button onClick={resetForm}><X className="w-5 h-5" style={{ color: c.textLight }} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>제목 *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="공지 제목을 입력하세요"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: c.border, color: c.text }} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>분류</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                    style={{ borderColor: c.border, color: c.text }}>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>대상</label>
                  <select value={form.target} onChange={e => setForm({ ...form, target: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                    style={{ borderColor: c.border, color: c.text }}>
                    {TARGETS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>상태</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                    style={{ borderColor: c.border, color: c.text }}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setForm({ ...form, isImportant: !form.isImportant })}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{ background: form.isImportant ? '#FEF2F2' : c.surfaceHover, color: form.isImportant ? '#DC2626' : c.textLight }}>
                  {form.isImportant ? '중요 ON' : '중요 OFF'}
                </button>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>내용 *</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                  rows={8} placeholder="공지 내용을 입력하세요"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none resize-none"
                  style={{ borderColor: c.border, color: c.text }} />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button onClick={resetForm}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium"
                  style={{ background: c.surfaceHover, color: c.textLight }}>취소</button>
                <button onClick={handleSubmit}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white"
                  style={{ background: c.primary }}>
                  <Save className="w-4 h-4" />
                  {editing ? '수정' : '등록'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
