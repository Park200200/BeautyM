'use client';

import { useState, useEffect } from 'react';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  Plus, Save, X, Trash2, GripVertical, Edit2, Box,
  CalendarCheck, UserRound, TrendingUp, UsersRound, Gift,
  Package, LayoutDashboard, Globe, Bell, Scissors, Image, Brain, Building2, Store,
} from 'lucide-react';

const ICON_OPTIONS: { value: string; icon: React.ReactNode; label: string }[] = [
  { value: 'CalendarCheck', icon: <CalendarCheck className="h-4 w-4" />, label: '예약' },
  { value: 'UserRound', icon: <UserRound className="h-4 w-4" />, label: '고객' },
  { value: 'TrendingUp', icon: <TrendingUp className="h-4 w-4" />, label: '매출' },
  { value: 'UsersRound', icon: <UsersRound className="h-4 w-4" />, label: '직원' },
  { value: 'Gift', icon: <Gift className="h-4 w-4" />, label: '멤버십' },
  { value: 'Package', icon: <Package className="h-4 w-4" />, label: '재고' },
  { value: 'LayoutDashboard', icon: <LayoutDashboard className="h-4 w-4" />, label: '대시보드' },
  { value: 'Globe', icon: <Globe className="h-4 w-4" />, label: '웹사이트' },
  { value: 'Bell', icon: <Bell className="h-4 w-4" />, label: '알림' },
  { value: 'Scissors', icon: <Scissors className="h-4 w-4" />, label: '시술' },
  { value: 'Image', icon: <Image className="h-4 w-4" />, label: '포트폴리오' },
  { value: 'Brain', icon: <Brain className="h-4 w-4" />, label: 'AI' },
  { value: 'Building2', icon: <Building2 className="h-4 w-4" />, label: '다중매장' },
  { value: 'Store', icon: <Store className="h-4 w-4" />, label: '매장' },
  { value: 'Box', icon: <Box className="h-4 w-4" />, label: '기타' },
];

const ICON_MAP: Record<string, React.ReactNode> = Object.fromEntries(
  ICON_OPTIONS.map((o) => [o.value, o.icon])
);

interface Module {
  id: string; name: string; description: string; icon: string;
  target: string; sortOrder: number; activeCount: number;
}

export default function ModulesPage() {
  const mob = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const store = useThemeStore();
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;

  const [modules, setModules] = useState<Module[]>([]);
  const [totalShops, setTotalShops] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', icon: 'Box', target: 'SHOP', sortOrder: 99 });
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', description: '', icon: 'Box', target: 'SHOP', sortOrder: 99 });

  const fetchModules = async () => {
    try {
      const res = await fetch('/api/admin/modules');
      if (res.ok) {
        const data = await res.json();
        setModules(data.modules);
        setTotalShops(data.totalShops);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchModules(); }, []);

  const flash = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSave = async () => {
    if (!editId) return;
    const res = await fetch('/api/admin/modules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editId, action: 'update', ...editForm }),
    });
    const data = await res.json();
    if (res.ok) { setEditId(null); fetchModules(); flash('모듈이 수정되었습니다.'); }
    else flash(data.error);
  };

  const handleAdd = async () => {
    if (!addForm.name) return;
    const res = await fetch('/api/admin/modules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    });
    const data = await res.json();
    if (res.ok) { setShowAdd(false); setAddForm({ name: '', description: '', icon: 'Box', target: 'SHOP', sortOrder: 99 }); fetchModules(); flash('모듈이 추가되었습니다.'); }
    else flash(data.error);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 모듈을 삭제하시겠습니까?\n모든 매장의 해당 모듈 설정이 함께 삭제됩니다.`)) return;
    const res = await fetch('/api/admin/modules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'delete' }),
    });
    if (res.ok) { fetchModules(); flash('모듈이 삭제되었습니다.'); }
  };

  const IconSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="flex flex-wrap gap-1.5">
      {ICON_OPTIONS.map((opt) => (
        <button key={opt.value} type="button" title={opt.label}
          onClick={() => onChange(opt.value)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border transition-all"
          style={{
            borderColor: value === opt.value ? c.primary : c.borderLight,
            background: value === opt.value ? c.primaryLight : 'transparent',
            color: value === opt.value ? c.primary : c.textLight,
          }}>
          {opt.icon}
        </button>
      ))}
    </div>
  );

  const FormFields = ({ form, setForm }: { form: typeof addForm; setForm: (f: typeof addForm) => void }) => (
    <div className="space-y-3">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: mob ? '1fr' : '1fr 1fr',
          gap: mob ? 10 : 12,
        }}
      >
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>모듈명 *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ borderColor: c.border, color: c.text }} placeholder="예: 재고 관리" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>대상</label>
            <select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}
              className="w-full rounded-lg border px-2 py-2 text-sm outline-none"
              style={{ borderColor: c.border, color: c.text }}>
              <option value="SHOP">매장</option>
              <option value="CUSTOMER">고객</option>
              <option value="ADMIN">관리</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>정렬순서</label>
            <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
              className="w-full rounded-lg border px-2 py-2 text-sm outline-none"
              style={{ borderColor: c.border, color: c.text }} />
          </div>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>설명</label>
        <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ borderColor: c.border, color: c.text }} placeholder="모듈에 대한 간략한 설명" />
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: c.textLight }}>아이콘</label>
        <IconSelect value={form.icon} onChange={(v) => setForm({ ...form, icon: v })} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div
        style={{
          display: 'flex',
          flexDirection: mob ? 'column' : 'row',
          alignItems: mob ? 'stretch' : 'center',
          justifyContent: 'space-between',
          gap: mob ? 10 : 16,
        }}
      >
        <div>
          <p className="text-sm" style={{ color: c.textLight }}>
            총 {modules.length}개 모듈 · 등록 매장 {totalShops}개
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ background: c.primary }}>
          <Plus className="h-4 w-4" /> 모듈 추가
        </button>
      </div>

      {message && (
        <div className="rounded-lg border px-4 py-3 text-sm" style={{ background: c.primaryLight, color: c.primary, borderColor: c.primary }}>
          {message}
        </div>
      )}

      {/* 추가 폼 */}
      {showAdd && (
        <div className="rounded-xl border" style={{ background: c.surface, borderColor: c.primary, padding: mob ? '14px' : '20px' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: c.text }}>새 모듈 추가</h3>
          <FormFields form={addForm} setForm={setAddForm} />
          <div className="flex gap-2 mt-4 justify-end">
            <button onClick={() => setShowAdd(false)}
              className="rounded-lg border px-4 py-2 text-sm" style={{ borderColor: c.border, color: c.text }}>취소</button>
            <button onClick={handleAdd} disabled={!addForm.name}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50" style={{ background: c.primary }}>추가</button>
          </div>
        </div>
      )}

      {/* 모듈 목록 */}
      {loading ? (
        <div className="p-8 text-center" style={{ color: c.textLight }}>로딩 중...</div>
      ) : (
        <div className="grid gap-3">
          {modules.map((mod) => {
            const isEditing = editId === mod.id;
            return (
              <div key={mod.id} className="rounded-xl border transition-all"
                style={{ background: c.surface, borderColor: isEditing ? c.primary : c.borderLight }}>
                {isEditing ? (
                  // 편집 모드
                  <div style={{ padding: mob ? '14px' : '20px' }}>
                    <FormFields form={editForm} setForm={setEditForm} />
                    <div className="flex gap-2 mt-4 justify-end">
                      <button onClick={() => setEditId(null)}
                        className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm" style={{ borderColor: c.border, color: c.text }}>
                        <X className="h-4 w-4" /> 취소
                      </button>
                      <button onClick={handleSave}
                        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white" style={{ background: c.primary }}>
                        <Save className="h-4 w-4" /> 저장
                      </button>
                    </div>
                  </div>
                ) : (
                  // 보기 모드
                  <div style={{ padding: mob ? '12px' : '16px' }}>
                    {mob ? (
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: c.primaryLight, color: c.primary }}>
                            {ICON_MAP[mod.icon] || <Box className="h-5 w-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-bold" style={{ color: c.text }}>{mod.name}</p>
                              <span className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                                style={{ background: c.secondaryLight, color: c.textLight }}>
                                {mod.target === 'SHOP' ? '매장' : mod.target === 'CUSTOMER' ? '고객' : '관리'}
                              </span>
                              <span className="text-[10px]" style={{ color: c.textLight }}>#{mod.sortOrder}</span>
                            </div>
                            {mod.description && (
                              <p className="text-xs mt-1" style={{ color: c.textLight }}>{mod.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t text-xs" style={{ borderColor: c.borderLight }}>
                          <div className="flex items-center gap-1.5">
                            <span style={{ color: c.textLight }}>사용 매장:</span>
                            <span className="font-bold" style={{ color: c.primary }}>{mod.activeCount}개</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => { setEditId(mod.id); setEditForm({ name: mod.name, description: mod.description, icon: mod.icon, target: mod.target, sortOrder: mod.sortOrder }); }}
                              className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs"
                              style={{ borderColor: c.border, color: c.text }}>
                              <Edit2 className="h-3.5 w-3.5" /> 수정
                            </button>
                            <button onClick={() => handleDelete(mod.id, mod.name)}
                              className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs"
                              style={{ borderColor: '#FCA5A5', color: '#EF4444' }}>
                              <Trash2 className="h-3.5 w-3.5" /> 삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: c.primaryLight, color: c.primary }}>
                          {ICON_MAP[mod.icon] || <Box className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold" style={{ color: c.text }}>{mod.name}</p>
                            <span className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                              style={{ background: c.secondaryLight, color: c.textLight }}>
                              {mod.target === 'SHOP' ? '매장' : mod.target === 'CUSTOMER' ? '고객' : '관리'}
                            </span>
                            <span className="text-[10px]" style={{ color: c.textLight }}>#{mod.sortOrder}</span>
                          </div>
                          <p className="text-xs mt-0.5 truncate" style={{ color: c.textLight }}>{mod.description}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-bold" style={{ color: c.primary }}>{mod.activeCount}</p>
                            <p className="text-[10px]" style={{ color: c.textLight }}>매장 사용</p>
                          </div>
                          <button onClick={() => { setEditId(mod.id); setEditForm({ name: mod.name, description: mod.description, icon: mod.icon, target: mod.target, sortOrder: mod.sortOrder }); }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                            style={{ color: c.textLight }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = c.primaryLight; e.currentTarget.style.color = c.primary; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.textLight; }}>
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(mod.id, mod.name)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 transition-colors"
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#EF4444'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#FCA5A5'; }}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
