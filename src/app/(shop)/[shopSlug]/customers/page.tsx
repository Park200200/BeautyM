'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { Plus, Search, X, User, Phone, Mail, ChevronRight, Camera, Cake, Calendar, Minus } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import DatePicker from '@/components/DatePicker';

type Customer = {
  id: string;
  skinType?: string;
  memberGrade?: string;
  visitCount?: number;
  memo?: string;
  createdAt: string;
  user: { name: string; phone?: string | null; email?: string | null; birthday?: string | null; profileImage?: string | null };
};

export default function CustomersPage() {
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

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', memo: '', birthday: '' });
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/customers`);
      if (res.ok) {
        const d = await res.json();
        setCustomers(d.customers || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, [shopSlug]);

  // 헤더의 고객등록 탭 클릭 시 ?new=1로 진입 → 모달 열기
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowModal(true);
      router.replace(`/${shopSlug}/customers`);
    }
  }, [searchParams, shopSlug, router]);

  const fmtPhone = (ph: string) => {
    const n = ph.replace(/\D/g, '');
    if (n.length === 11) return `${n.slice(0,3)}-${n.slice(3,7)}-${n.slice(7)}`;
    return ph;
  };

  const calcAge = (birthday: string) => {
    const birth = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const filtered = customers.filter(cust => {
    if (!search) return true;
    const s = search.toLowerCase();
    return cust.user.name.toLowerCase().includes(s) ||
      (cust.user.phone && cust.user.phone.includes(search.replace(/-/g, '')));
  });

  const handlePhoneInput = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 11);
    let formatted = nums;
    if (nums.length > 3 && nums.length <= 7) {
      formatted = `${nums.slice(0,3)}-${nums.slice(3)}`;
    } else if (nums.length > 7) {
      formatted = `${nums.slice(0,3)}-${nums.slice(3,7)}-${nums.slice(7)}`;
    }
    setForm({ ...form, phone: formatted });
  };

  const uploadFile = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) { const d = await res.json(); setProfilePhoto(d.url); }
    } catch (err) { console.error(err); }
    setUploadingPhoto(false);
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
    if (!form.name.trim()) { setError('\uC774\uB984\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694'); return; }
    if (!form.phone.trim()) { setError('\uC804\uD654\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.replace(/-/g, ''),
          email: form.email.trim() || null,
          memo: form.memo.trim() || null,
          birthday: form.birthday || null,
          profileImage: profilePhoto || null,
        })
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ name: '', phone: '', email: '', memo: '', birthday: '' });
        setProfilePhoto(null);
        fetchCustomers();
      } else {
        const d = await res.json();
        setError(d.error || '\uB4F1\uB85D \uC2E4\uD328');
      }
    } catch (e) {
      setError('\uB124\uD2B8\uC6CC\uD06C \uC624\uB958');
    }
    setSaving(false);
  };

  if (!mounted) return null;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: mob ? '14px 12px' : '20px 16px' }}>
      {/* Search */}
      <div style={{ position: 'relative', marginBottom: mob ? 12 : 16 }}>
        <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: c.textLight }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder={'\uC774\uB984 \uB610\uB294 \uC804\uD654\uBC88\uD638\uB85C \uAC80\uC0C9...'}
          style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: `1px solid ${c.borderLight}`, fontSize: 13, color: c.text, outline: 'none', background: 'white' }}
        />
      </div>

      {/* Customer List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: mob ? 30 : 40, color: c.textLight }}>{'\uB85C\uB529 \uC911...'}</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: mob ? 30 : 40, color: c.textLight }}>
          {search ? '\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4' : '\uB4F1\uB85D\uB41C \uACE0\uAC1D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map(cust => (
            <div key={cust.id}
              onClick={() => router.push(`/${shopSlug}/customers/${cust.id}`)}
              style={{
                display: 'flex', alignItems: 'center', padding: mob ? '10px 12px' : '12px 16px', borderRadius: 12, cursor: 'pointer',
                background: 'white', border: `1px solid ${c.borderLight}`, transition: 'all .15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = c.primary; (e.currentTarget as HTMLDivElement).style.background = c.primaryLight + '20'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = c.borderLight; (e.currentTarget as HTMLDivElement).style.background = 'white'; }}
            >
              {/* Avatar */}
              {cust.user.profileImage ? (
                <img src={cust.user.profileImage} alt="" style={{ width: mob ? 34 : 38, height: mob ? 34 : 38, borderRadius: '50%', objectFit: 'cover', marginRight: mob ? 10 : 12, flexShrink: 0 }} />
              ) : (
                <div style={{ width: mob ? 34 : 38, height: mob ? 34 : 38, borderRadius: '50%', background: c.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: mob ? 10 : 12, fontSize: 14, fontWeight: 700, color: c.primary, flexShrink: 0 }}>
                  {cust.user.name.slice(0, 1)}
                </div>
              )}
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: mob ? 13 : 14, color: c.text }}>{cust.user.name}</span>
                  {cust.user.birthday && (
                    <span style={{ fontSize: 11, color: c.textLight }}>{calcAge(cust.user.birthday)}{'\uC138'}</span>
                  )}
                  <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, fontWeight: 600,
                    background: cust.memberGrade === 'VIP' ? '#FEF3C7' : cust.memberGrade === '\uACE8\uB4DC' ? '#FEF3C7' : cust.memberGrade === '\uC2E4\uBC84' ? '#F0F0F0' : '#F5F5F5',
                    color: cust.memberGrade === 'VIP' ? '#D97706' : cust.memberGrade === '\uACE8\uB4DC' ? '#B45309' : c.textLight,
                  }}>{cust.memberGrade || '\uC77C\uBC18'}</span>
                </div>
                <div style={{ fontSize: mob ? 11 : 12, color: c.textLight, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {!mob && cust.user.phone ? fmtPhone(cust.user.phone) : ''}
                  {cust.visitCount ? ` \u00B7 ${cust.visitCount}\uD68C` : ''}
                  {!mob && cust.user.birthday && ` \u00B7 ${new Date(cust.user.birthday).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}\uC0DD`}
                  {!mob && ` \u00B7 ${new Date(cust.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })} \uB4F1\uB85D`}
                </div>
              </div>
              <ChevronRight style={{ width: 16, height: 16, color: c.textLight, flexShrink: 0 }} />
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: c.textLight }}>
        {'\uCD1D'} {filtered.length}{'\uBA85'}
      </div>

      {/* 고객 등록 모달 */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: mob ? 10 : 20 }}
          onClick={() => setShowModal(false)}>
          <div style={{ background: 'white', borderRadius: 16, padding: mob ? '20px 16px' : '24px 28px', width: mob ? '95vw' : '100%', maxWidth: mob ? '95vw' : 480, position: 'relative', maxHeight: mob ? '90vh' : '85vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: c.textLight }}>
              <X style={{ width: 18, height: 18 }} />
            </button>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, marginBottom: mob ? 16 : 20 }}>고객 등록</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: mob ? 12 : 14 }}>
              {/* 프로필 사진 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 2 }}>
                <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()} tabIndex={0} onPaste={handlePaste}>
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="" style={{ width: mob ? 70 : 80, height: mob ? 70 : 80, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${c.primaryLight}` }} />
                  ) : (
                    <div style={{ width: mob ? 70 : 80, height: mob ? 70 : 80, borderRadius: '50%', background: c.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px dashed ${c.primary}40` }}>
                      <Camera style={{ width: mob ? 22 : 24, height: mob ? 22 : 24, color: c.primary }} />
                    </div>
                  )}
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: '50%', background: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                    <Plus style={{ width: 12, height: 12, color: 'white' }} />
                  </div>
                  {uploadingPhoto && (
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10 }}>...</div>
                  )}
                </div>
                <span style={{ fontSize: 10, color: c.textLight, marginTop: 4 }}>클릭 또는 Ctrl+V 붙여넣기</span>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
              </div>

              {/* 이름 & 전화번호 (2열 -> 모바일 1열) */}
              <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: mob ? 12 : 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <User style={{ width: 13, height: 13 }} /> 이름 *
                  </label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="고객 이름"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${c.borderLight}`, fontSize: 13, outline: 'none' }} />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <Phone style={{ width: 13, height: 13 }} /> 전화번호 *
                  </label>
                  <input value={form.phone} onChange={e => handlePhoneInput(e.target.value)}
                    placeholder="010-0000-0000"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${c.borderLight}`, fontSize: 13, outline: 'none' }} />
                </div>
              </div>

              {/* 생년월일 & 이메일 (2열 -> 모바일 1열) */}
              <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: mob ? 12 : 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <Cake style={{ width: 13, height: 13 }} /> 생년월일
                    {form.birthday && <span style={{ fontSize: 11, fontWeight: 600, color: c.primary, marginLeft: 'auto' }}>{new Date(form.birthday + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {/* 나이 입력 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                      <input
                        type="number" min="1" max="120"
                        placeholder="나이"
                        value={(() => { if (!form.birthday) return ''; return calcAge(form.birthday); })()}
                        onChange={e => {
                          const age = parseInt(e.target.value);
                          if (!age || age < 1 || age > 120) { setForm({...form, birthday: ''}); return; }
                          const now = new Date();
                          const birthYear = now.getFullYear() - age;
                          const existing = form.birthday ? new Date(form.birthday + 'T00:00:00') : null;
                          const month = existing ? String(existing.getMonth() + 1).padStart(2, '0') : '01';
                          const day = existing ? String(existing.getDate()).padStart(2, '0') : '01';
                          setForm({...form, birthday: `${birthYear}-${month}-${day}`});
                        }}
                        style={{ width: '100%', minWidth: 0, padding: '8px 4px', borderRadius: 8, border: `1px solid ${c.borderLight}`, fontSize: 13, textAlign: 'center', outline: 'none', color: c.text }}
                      />
                      <span style={{ fontSize: 11, color: c.textLight, flexShrink: 0 }}>세</span>
                    </div>
                    {/* 월 입력 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                      <input
                        type="number" min="1" max="12"
                        placeholder="월"
                        value={form.birthday ? new Date(form.birthday + 'T00:00:00').getMonth() + 1 : ''}
                        onChange={e => {
                          const m = parseInt(e.target.value);
                          if (!m || m < 1 || m > 12) return;
                          const existing = form.birthday ? new Date(form.birthday + 'T00:00:00') : new Date();
                          const year = form.birthday ? existing.getFullYear() : new Date().getFullYear() - 30;
                          const day = form.birthday ? String(existing.getDate()).padStart(2, '0') : '01';
                          setForm({...form, birthday: `${year}-${String(m).padStart(2, '0')}-${day}`});
                        }}
                        style={{ width: '100%', minWidth: 0, padding: '8px 4px', borderRadius: 8, border: `1px solid ${c.borderLight}`, fontSize: 13, textAlign: 'center', outline: 'none', color: c.text }}
                      />
                      <span style={{ fontSize: 11, color: c.textLight, flexShrink: 0 }}>월</span>
                    </div>
                    {/* 일 입력 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                      <input
                        type="number" min="1" max="31"
                        placeholder="일"
                        value={form.birthday ? new Date(form.birthday + 'T00:00:00').getDate() : ''}
                        onChange={e => {
                          const d = parseInt(e.target.value);
                          if (!d || d < 1 || d > 31) return;
                          const existing = form.birthday ? new Date(form.birthday + 'T00:00:00') : new Date();
                          const year = form.birthday ? existing.getFullYear() : new Date().getFullYear() - 30;
                          const month = form.birthday ? String(existing.getMonth() + 1).padStart(2, '0') : '01';
                          setForm({...form, birthday: `${year}-${month}-${String(d).padStart(2, '0')}`});
                        }}
                        style={{ width: '100%', minWidth: 0, padding: '8px 4px', borderRadius: 8, border: `1px solid ${c.borderLight}`, fontSize: 13, textAlign: 'center', outline: 'none', color: c.text }}
                      />
                      <span style={{ fontSize: 11, color: c.textLight, flexShrink: 0 }}>일</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <Mail style={{ width: 13, height: 13 }} /> 이메일
                  </label>
                  <input value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    placeholder="email@example.com" type="email"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${c.borderLight}`, fontSize: 13, outline: 'none' }} />
                </div>
              </div>

              {/* 메모 */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, marginBottom: 6, display: 'block' }}>메모</label>
                <textarea value={form.memo} onChange={e => setForm({...form, memo: e.target.value})}
                  placeholder="특이사항, 알레르기 등"
                  rows={2}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${c.borderLight}`, fontSize: 13, outline: 'none', resize: 'vertical' }} />
              </div>

              {error && <div style={{ fontSize: 12, color: '#EF4444', padding: '6px 10px', borderRadius: 8, background: '#FEF2F2' }}>{error}</div>}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button onClick={() => setShowModal(false)}
                  style={{ flex: mob ? 1 : 'initial', padding: mob ? '10px 0' : '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500, border: `1px solid ${c.borderLight}`, background: 'white', cursor: 'pointer', color: c.text, textAlign: 'center' }}>
                  취소
                </button>
                <button onClick={handleSave} disabled={saving}
                  style={{ flex: mob ? 1 : 'initial', padding: mob ? '10px 0' : '8px 22px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: 'none', background: c.primary, color: c.textOnPrimary, cursor: 'pointer', opacity: saving ? 0.6 : 1, textAlign: 'center' }}>
                  {saving ? '등록 중...' : '등록'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
