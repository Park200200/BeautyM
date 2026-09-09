'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { UsersRound, Plus, X, Phone, Mail, User, Star, Pencil, Trash2, ToggleLeft, ToggleRight, Camera } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';

type Staff = {
  id: string; userId: string; role: string; specialties?: string | null; jobTitle?: string | null;
  isActive: boolean; createdAt: string;
  user: { name: string; phone?: string | null; email?: string | null; profileImage?: string | null };
  stats: { completedCount: number; totalRevenue: number };
};

const ROLE_LABELS: Record<string, string> = { OWNER: '\uB300\uD45C', STAFF: '\uC9C1\uC6D0' };

export default function StaffPage() {
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

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Staff | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', specialties: '', role: 'STAFF', jobTitle: '' });
  const [error, setError] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/staff`);
      if (res.ok) { const d = await res.json(); setStaffList(d.staff || []); }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchStaff(); }, [shopSlug]);

  // 헤더의 직원등록 탭 클릭 시 ?new=1로 진입 → 모달 열기
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openAdd();
      router.replace(`/${shopSlug}/staff`);
    }
  }, [searchParams]);

  const fmtPhone = (ph: string) => {
    const n = ph.replace(/\D/g, '');
    if (n.length === 11) return `${n.slice(0,3)}-${n.slice(3,7)}-${n.slice(7)}`;
    return ph;
  };

  const handlePhoneInput = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 11);
    let formatted = nums;
    if (nums.length > 3 && nums.length <= 7) formatted = `${nums.slice(0,3)}-${nums.slice(3)}`;
    else if (nums.length > 7) formatted = `${nums.slice(0,3)}-${nums.slice(3,7)}-${nums.slice(7)}`;
    setForm({ ...form, phone: formatted });
  };

  const openAdd = () => {
    setEditTarget(null);
    setForm({ name: '', phone: '', email: '', specialties: '', role: 'STAFF', jobTitle: '' });
    setProfilePhoto(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (s: Staff) => {
    setEditTarget(s);
    setForm({ name: s.user.name, phone: s.user.phone || '', email: s.user.email || '', specialties: s.specialties || '', role: s.role, jobTitle: s.jobTitle || '' });
    setProfilePhoto(s.user.profileImage || null);
    setError('');
    setShowModal(true);
  };

  const uploadFile = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) { const d = await res.json(); setProfilePhoto(d.url); }
    } catch (err) { console.error(err); }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) { uploadFile(file); break; }
      }
    }
  };

  const handleSave = async () => {
    setError('');
    if (!editTarget) {
      if (!form.name.trim()) { setError('\uC774\uB984\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694'); return; }
      if (!form.phone.trim()) { setError('\uC804\uD654\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694'); return; }
    }
    setSaving(true);
    try {
      if (editTarget) {
        const res = await fetch(`/api/shops/${shopSlug}/staff/${editTarget.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            phone: form.phone.replace(/-/g, ''),
            email: form.email.trim() || null,
            specialties: form.specialties.trim() || null,
            role: form.role,
            jobTitle: form.jobTitle.trim() || null,
            profileImage: profilePhoto || null,
          }),
        });
        if (res.ok) { setShowModal(false); fetchStaff(); }
        else { const d = await res.json(); setError(d.error || '\uC218\uC815 \uC2E4\uD328'); }
      } else {
        const res = await fetch(`/api/shops/${shopSlug}/staff`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            phone: form.phone.replace(/-/g, ''),
            email: form.email.trim() || null,
            specialties: form.specialties.trim() || null,
            role: form.role,
            jobTitle: form.jobTitle.trim() || null,
            profileImage: profilePhoto || null,
          }),
        });
        if (res.ok) { setShowModal(false); fetchStaff(); }
        else { const d = await res.json(); setError(d.error || '\uB4F1\uB85D \uC2E4\uD328'); }
      }
    } catch (e) { setError('\uB124\uD2B8\uC6CC\uD06C \uC624\uB958'); }
    setSaving(false);
  };

  const handleToggleActive = async (s: Staff) => {
    const prev = [...staffList];
    setStaffList(staffList.map(st => st.id === s.id ? { ...st, isActive: !st.isActive } : st));
    try {
      const res = await fetch(`/api/shops/${shopSlug}/staff/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !s.isActive }),
      });
      if (!res.ok) setStaffList(prev);
    } catch { setStaffList(prev); }
  };

  const handleDelete = async (s: Staff) => {
    if (s.role === 'OWNER') return;
    if (!confirm(`${s.user.name}\uB2D8\uC744 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?`)) return;
    try {
      const res = await fetch(`/api/shops/${shopSlug}/staff/${s.id}`, { method: 'DELETE' });
      if (res.ok) fetchStaff();
    } catch (e) { console.error(e); }
  };

  if (!mounted) return null;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: mob ? '14px 12px' : '20px 16px' }}>

      {/* Staff List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: mob ? 30 : 40, color: c.textLight }}>로딩 중...</div>
      ) : staffList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: mob ? 30 : 40, color: c.textLight }}>등록된 직원이 없습니다</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: mob ? 10 : 8 }}>
          {staffList.map(s => (
            <div key={s.id} style={{ background: 'white', borderRadius: 14, border: `1px solid ${c.borderLight}`, padding: mob ? '14px' : '16px 20px', opacity: s.isActive ? 1 : 0.5 }}>
              <div style={{ display: 'flex', flexDirection: mob ? 'column' : 'row', alignItems: mob ? 'stretch' : 'center', gap: mob ? 10 : 12 }}>
                {/* Avatar & Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: mob ? 10 : 12, flex: 1, minWidth: 0 }}>
                  {/* Avatar */}
                  {s.user.profileImage ? (
                    <img src={s.user.profileImage} alt="" style={{ width: mob ? 40 : 44, height: mob ? 40 : 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: mob ? 40 : 44, height: mob ? 40 : 44, borderRadius: '50%', background: s.role === 'OWNER' ? '#FEF3C7' : c.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: mob ? 15 : 16, fontWeight: 700, color: s.role === 'OWNER' ? '#D97706' : c.primary, flexShrink: 0 }}>
                      {s.user.name.slice(0, 1)}
                    </div>
                  )}
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: mob ? 14 : 15, color: c.text }}>{s.user.name}</span>
                      {s.jobTitle && <span style={{ fontSize: 11, color: c.textLight, fontWeight: 500 }}>{s.jobTitle}</span>}
                      <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 6, fontWeight: 600,
                        background: s.role === 'OWNER' ? '#FEF3C7' : '#EFF6FF',
                        color: s.role === 'OWNER' ? '#D97706' : '#3B82F6',
                      }}>{ROLE_LABELS[s.role] || s.role}</span>
                      {!s.isActive && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#FEE2E2', color: '#EF4444', fontWeight: 600 }}>비활성</span>}
                    </div>
                    <div style={{ fontSize: 12, color: c.textLight }}>
                      {s.user.phone ? fmtPhone(s.user.phone) : '-'}
                      {s.specialties && ` · ${s.specialties}`}
                    </div>
                  </div>
                </div>

                {/* Stats & Actions */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: mob ? 'space-between' : 'flex-end',
                  borderTop: mob ? `1px solid ${c.borderLight}` : 'none',
                  paddingTop: mob ? 10 : 0,
                  gap: 10,
                }}>
                  {/* Stats */}
                  <div style={{ textAlign: mob ? 'left' : 'right', marginRight: mob ? 0 : 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{s.stats.totalRevenue.toLocaleString()}원</div>
                    <div style={{ fontSize: 11, color: c.textLight }}>{s.stats.completedCount}건 완료</div>
                  </div>
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => handleToggleActive(s)} title={s.isActive ? '비활성화' : '활성화'}
                      style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${c.borderLight}`, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {s.isActive ? <ToggleRight style={{ width: 16, height: 16, color: '#22C55E' }} /> : <ToggleLeft style={{ width: 16, height: 16, color: c.textLight }} />}
                    </button>
                    <button onClick={() => openEdit(s)} title="수정"
                      style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${c.borderLight}`, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Pencil style={{ width: 14, height: 14, color: c.textLight }} />
                    </button>
                    {s.role !== 'OWNER' && (
                      <button onClick={() => handleDelete(s)} title="삭제"
                        style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #FEE2E2', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 style={{ width: 14, height: 14, color: '#EF4444' }} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: c.textLight }}>총 {staffList.length}명</div>

      {/* 등록/수정 모달 */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: mob ? 0 : 20 }}
          onClick={() => setShowModal(false)}>
          <div style={{ background: 'white', borderRadius: 16, padding: mob ? '20px 16px' : '24px 28px', width: mob ? '95vw' : '100%', maxWidth: mob ? '95vw' : 460, height: mob ? 'auto' : 'auto', maxHeight: mob ? '90vh' : '90vh', overflowY: 'auto', position: 'relative' }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: mob ? 16 : 12, right: mob ? 16 : 12, background: 'none', border: 'none', cursor: 'pointer', color: c.textLight }}>
              <X style={{ width: 18, height: 18 }} />
            </button>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, marginBottom: mob ? 16 : 20 }}>{editTarget ? '직원 수정' : '직원 등록'}</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: mob ? 12 : 14 }}>
              {/* 프로필 사진 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 2 }}>
                <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()} tabIndex={0} onPaste={handlePaste}>
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="" style={{ width: mob ? 64 : 72, height: mob ? 64 : 72, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${c.primaryLight}` }} />
                  ) : (
                    <div style={{ width: mob ? 64 : 72, height: mob ? 64 : 72, borderRadius: '50%', background: c.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px dashed ${c.primary}40` }}>
                      <Camera style={{ width: 22, height: 22, color: c.primary }} />
                    </div>
                  )}
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: '50%', background: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                    <Plus style={{ width: 10, height: 10, color: 'white' }} />
                  </div>
                </div>
                <span style={{ fontSize: 10, color: c.textLight, marginTop: 4 }}>클릭 또는 Ctrl+V 붙여넣기</span>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
              </div>

              {/* 이름 & 전화번호 (그리드 2열→1열) */}
              <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: mob ? 12 : 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <User style={{ width: 13, height: 13 }} /> 이름 *
                  </label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="직원 이름"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${c.borderLight}`, fontSize: 13, outline: 'none' }} />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <Phone style={{ width: 13, height: 13 }} /> 전화번호 *
                  </label>
                  <input value={form.phone} onChange={e => handlePhoneInput(e.target.value)} placeholder="010-0000-0000"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${c.borderLight}`, fontSize: 13, outline: 'none' }} />
                </div>
              </div>

              {/* 이메일 & 직함 (그리드 2열→1열) */}
              <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: mob ? 12 : 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <Mail style={{ width: 13, height: 13 }} /> 이메일
                  </label>
                  <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@example.com" type="email"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${c.borderLight}`, fontSize: 13, outline: 'none' }} />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'block', marginBottom: 6 }}>직함</label>
                  <input value={form.jobTitle} onChange={e => setForm({...form, jobTitle: e.target.value})} placeholder="예: 실장, 부원장, 디자이너"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${c.borderLight}`, fontSize: 13, outline: 'none' }} />
                </div>
              </div>

              {/* 역할 & 전문 분야 (그리드 2열→1열) */}
              <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : 'auto 1fr', gap: mob ? 12 : 14, alignItems: 'flex-end' }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'block', marginBottom: 6 }}>역할</label>
                  <button onClick={() => setForm({...form, role: form.role === 'OWNER' ? 'STAFF' : 'OWNER'})}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                      border: `1.5px solid ${form.role === 'OWNER' ? '#F59E0B' : c.borderLight}`,
                      background: form.role === 'OWNER' ? '#FEF3C7' : '#F5F5F5',
                      width: mob ? '100%' : 'auto',
                    }}>
                    <div style={{
                      width: 36, height: 20, borderRadius: 10, position: 'relative',
                      background: form.role === 'OWNER' ? '#F59E0B' : '#D1D5DB',
                      transition: 'background .2s',
                    }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%', background: 'white', position: 'absolute', top: 2,
                        left: form.role === 'OWNER' ? 18 : 2,
                        transition: 'left .2s',
                      }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: form.role === 'OWNER' ? '#D97706' : c.textLight, whiteSpace: 'nowrap' }}>
                      {form.role === 'OWNER' ? '대표' : '직원'}
                    </span>
                  </button>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <Star style={{ width: 13, height: 13 }} /> 전문 분야
                  </label>
                  <input value={form.specialties} onChange={e => setForm({...form, specialties: e.target.value})} placeholder="예: 피부관리, 네일아트, 에스테틱"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${c.borderLight}`, fontSize: 13, outline: 'none' }} />
                </div>
              </div>

              {error && <div style={{ fontSize: 12, color: '#EF4444', padding: '6px 10px', borderRadius: 8, background: '#FEF2F2' }}>{error}</div>}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: mob ? 16 : 4 }}>
                <button onClick={() => setShowModal(false)}
                  style={{ flex: mob ? 1 : 'initial', padding: mob ? '11px 0' : '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500, border: `1px solid ${c.borderLight}`, background: 'white', cursor: 'pointer', color: c.text, textAlign: 'center' }}>
                  취소
                </button>
                <button onClick={handleSave} disabled={saving}
                  style={{ flex: mob ? 1 : 'initial', padding: mob ? '11px 0' : '8px 22px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: 'none', background: c.primary, color: c.textOnPrimary, cursor: 'pointer', opacity: saving ? 0.6 : 1, textAlign: 'center' }}>
                  {saving ? '처리 중...' : editTarget ? '수정' : '등록'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
