'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Phone, Scissors, CalendarDays, Clock, StickyNote, CheckCircle2, Sparkles, Minus, Plus } from 'lucide-react';
import DatePicker from '@/components/DatePicker';

type MenuOption = {
  id: string; name: string; price?: number; duration?: number;
  categoryId?: string; photos?: string;
};

type Category = { id: string; name: string };

function formatPrice(n: number) { return n.toLocaleString(); }
function formatDuration(m: number) { return m >= 60 ? `${Math.floor(m/60)}시간${m%60 ? ` ${m%60}분` : ''}` : `${m}분`; }

function getMenuPhoto(photos?: string): string | null {
  if (!photos) return null;
  try {
    const p = JSON.parse(photos);
    if (Array.isArray(p) && p.length > 0) return p[0].url || p[0];
  } catch {}
  return null;
}

export default function ReservePage() {
  const params = useParams();
  const shopSlug = params.shopSlug as string;

  const [shopName, setShopName] = useState('');
  const [menus, setMenus] = useState<MenuOption[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedMenu, setSelectedMenu] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [memo, setMemo] = useState('');
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePeriod, setTimePeriod] = useState<'AM' | 'PM'>('AM');

  useEffect(() => {
    fetch(`/api/shops/${shopSlug}/public`)
      .then(r => r.json())
      .then(d => {
        setShopName(d.shop?.name || '');
        setMenus(d.menus || []);
        setCategories(d.categories || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [shopSlug]);

  // 전화번호 자동 포맷
  const handlePhone = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 11);
    let formatted = nums;
    if (nums.length > 3 && nums.length <= 7) formatted = `${nums.slice(0,3)}-${nums.slice(3)}`;
    else if (nums.length > 7) formatted = `${nums.slice(0,3)}-${nums.slice(3,7)}-${nums.slice(7)}`;
    setPhone(formatted);
  };

  // 최소 날짜: 오늘
  const today = new Date().toISOString().split('T')[0];

  // 시간 옵션 (10:00~20:00, 30분 간격)
  const timeSlots: string[] = [];
  for (let h = 10; h <= 20; h++) {
    timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
    if (h < 20) timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
  }

  const handleSubmit = async () => {
    if (!name.trim()) { setError('이름을 입력해주세요'); return; }
    if (!phone.trim() || phone.replace(/-/g, '').length < 10) { setError('전화번호를 확인해주세요'); return; }
    if (!pin || pin.length !== 4) { setError('비밀번호 4자리를 입력해주세요'); return; }
    if (!selectedMenu) { setError('시술 상품을 선택해주세요'); return; }
    if (!date) { setError('날짜를 선택해주세요'); return; }
    if (!time) { setError('시간을 선택해주세요'); return; }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/shops/${shopSlug}/public/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, pin, menuId: selectedMenu, date, time, memo }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.error || '예약 요청에 실패했습니다');
      }
    } catch {
      setError('네트워크 오류가 발생했습니다');
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="booking-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #40BFA3', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (success) return (
    <div className="booking-page">
      <header className="bk-header">
        <div className="bk-header-inner">
          <Link href={`/s/${shopSlug}`} className="bk-logo">
            <Sparkles style={{ width: 20, height: 20, color: 'white' }} />
            <span className="bk-logo-text">{shopName}</span>
          </Link>
        </div>
      </header>
      <div className="bk-success">
        <div className="bk-success-icon">
          <CheckCircle2 style={{ width: 40, height: 40, color: '#166534' }} />
        </div>
        <h2>예약 요청 완료!</h2>
        <p>예약이 접수되었습니다.<br />확정 후 연락드리겠습니다.</p>
        <div style={{ marginTop: 8, fontSize: 13, color: '#374151' }}>
          <div><strong>{name}</strong> 님</div>
          <div>{date} {time}</div>
          <div>{menus.find(m => m.id === selectedMenu)?.name}</div>
        </div>
        <Link href={`/s/${shopSlug}`} style={{ display: 'inline-block', marginTop: 24, padding: '10px 24px', background: '#40BFA3', color: 'white', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );

  const selectedMenuData = menus.find(m => m.id === selectedMenu);

  return (
    <div className="booking-page">
      {/* 헤더 */}
      <header className="bk-header">
        <div className="bk-header-inner">
          <Link href={`/s/${shopSlug}`} className="bk-logo">
            <ArrowLeft style={{ width: 20, height: 20, color: 'white' }} />
            <span className="bk-logo-text">{shopName}</span>
          </Link>
        </div>
      </header>

      <div className="bk-reserve-container">
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, color: '#1a1a2e' }}>온라인 예약</h2>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>원하시는 시술과 일정을 선택해주세요</p>

        {/* 이름 */}
        <div className="bk-form-group">
          <div className="bk-form-label"><User /> 이름 *</div>
          <input className="bk-form-input" value={name} onChange={e => setName(e.target.value)} placeholder="홍길동" />
        </div>

        {/* 전화번호 */}
        <div className="bk-form-group">
          <div className="bk-form-label"><Phone /> 전화번호 *</div>
          <input className="bk-form-input" value={phone} onChange={e => handlePhone(e.target.value)} placeholder="010-0000-0000" inputMode="tel" />
        </div>

        {/* 예약확인 비밀번호 */}
        <div className="bk-form-group">
          <div className="bk-form-label"><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#40BFA3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> 예약확인 비밀번호 *</span></div>
          <input
            className="bk-form-input"
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="숫자 4자리"
            inputMode="numeric"
            maxLength={4}
            style={{ letterSpacing: 8, textAlign: 'center', fontSize: 18, fontWeight: 700 }}
          />
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>예약 조회 시 필요한 비밀번호입니다</div>
        </div>

        {/* 시술 선택 */}
        <div className="bk-form-group">
          <div className="bk-form-label"><Scissors /> 시술 선택 *</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {menus.map(menu => {
              const photo = getMenuPhoto(menu.photos);
              const isSelected = selectedMenu === menu.id;
              return (
                <div key={menu.id} className={`bk-menu-select-card ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedMenu(menu.id)}>
                  {photo ? (
                    <img src={photo} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Scissors style={{ width: 18, height: 18, color: '#40BFA3' }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>{menu.name}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', display: 'flex', gap: 8 }}>
                      {menu.duration && <span>{formatDuration(menu.duration)}</span>}
                      {menu.price != null && <span style={{ color: '#40BFA3', fontWeight: 700 }}>₩{formatPrice(menu.price)}</span>}
                    </div>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${isSelected ? '#40BFA3' : '#D1D5DB'}`, background: isSelected ? '#40BFA3' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 날짜 + 시간 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <div style={{ position: 'relative' }}>
            <div className="bk-form-label"><CalendarDays /> 날짜 *</div>
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <button type="button" onClick={() => {
                if (!date) return;
                const d = new Date(date); d.setDate(d.getDate() - 1);
                setDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
              }} style={{ width: 28, height: 38, borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <div
                onClick={() => { setShowDatePicker(!showDatePicker); setShowTimePicker(false); }}
                className="bk-form-input"
                style={{ cursor: 'pointer', flex: 1, textAlign: 'center', fontSize: 13, padding: '10px 6px', margin: 0 }}
              >
                {date || '날짜 선택'}
              </div>
              <button type="button" onClick={() => {
                const d = date ? new Date(date) : new Date(); d.setDate(d.getDate() + 1);
                setDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
              }} style={{ width: 28, height: 38, borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
            {showDatePicker && (
              <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 50, marginTop: 4 }}>
                <DatePicker
                  inline
                  value={date || ''}
                  onChange={(d) => { setDate(typeof d === 'string' ? d : d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : ''); setShowDatePicker(false); }}
                />
              </div>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <div className="bk-form-label"><Clock /> 시간 *</div>
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <button type="button" onClick={() => {
                if (!time) return;
                const [hh, mm] = time.split(':').map(Number);
                let total = hh * 60 + mm - 30; if (total < 600) total = 600;
                const nh = Math.floor(total / 60), nm = total % 60;
                setTime(`${String(nh).padStart(2,'0')}:${String(nm).padStart(2,'0')}`);
              }} style={{ width: 28, height: 38, borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <div
                onClick={() => { setShowTimePicker(!showTimePicker); setShowDatePicker(false); }}
                className="bk-form-input"
                style={{ cursor: 'pointer', flex: 1, textAlign: 'center', fontSize: 13, padding: '10px 6px', margin: 0 }}
              >
                {time ? (() => {
                  const h = parseInt(time.split(':')[0]);
                  const m = time.split(':')[1];
                  return `${h >= 12 ? '오후' : '오전'} ${h > 12 ? h - 12 : h === 0 ? 12 : h}:${m}`;
                })() : '시간 선택'}
              </div>
              <button type="button" onClick={() => {
                const [hh, mm] = time ? time.split(':').map(Number) : [9, 30];
                let total = hh * 60 + mm + 30; if (total > 1200) total = 1200;
                const nh = Math.floor(total / 60), nm = total % 60;
                setTime(`${String(nh).padStart(2,'0')}:${String(nm).padStart(2,'0')}`);
              }} style={{ width: 28, height: 38, borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
            {showTimePicker && (
              <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 50, marginTop: 4 }}>
                <div style={{ background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 14, padding: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', width: 240, minWidth: 240 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 10, padding: 3, borderRadius: 10, background: '#F0FDF4' }}>
                    {(['AM', 'PM'] as const).map(p => (
                      <button key={p} type="button" onClick={() => setTimePeriod(p)}
                        style={{
                          flex: 1, padding: '6px 0', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          border: 'none', cursor: 'pointer',
                          background: timePeriod === p ? '#40BFA3' : 'transparent',
                          color: timePeriod === p ? 'white' : '#6B7280',
                        }}>
                        {p === 'AM' ? '오전' : '오후'}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                    {Array.from({ length: 12 }).map((_, i) => {
                      const baseH = timePeriod === 'AM' ? 0 : 12;
                      return [0, 30].map(m => {
                        const h = baseH + i;
                        if (h < 10 || h >= 20) return null;
                        const slot = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
                        const label = `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${String(m).padStart(2,'0')}`;
                        return (
                          <button key={slot} type="button" onClick={() => { setTime(slot); setShowTimePicker(false); }}
                            style={{
                              padding: '7px 4px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                              border: `1.5px solid ${time === slot ? '#40BFA3' : '#e5e7eb'}`,
                              background: time === slot ? '#F0FDF4' : 'white',
                              color: time === slot ? '#166534' : '#374151',
                              cursor: 'pointer',
                            }}>
                            {label}
                          </button>
                        );
                      });
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 메모 */}
        <div className="bk-form-group">
          <div className="bk-form-label"><StickyNote /> 요청사항</div>
          <textarea className="bk-form-input" value={memo} onChange={e => setMemo(e.target.value)} placeholder="추가 요청사항이 있으시면 입력해주세요" rows={3} style={{ resize: 'none' }} />
        </div>

        {/* 선택 요약 */}
        {selectedMenuData && date && time && (
          <div style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', marginBottom: 6 }}>예약 요약</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{selectedMenuData.name}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
              {date} {time} · {selectedMenuData.duration ? formatDuration(selectedMenuData.duration) : ''} · {selectedMenuData.price ? `₩${formatPrice(selectedMenuData.price)}` : ''}
            </div>
          </div>
        )}

        {/* 에러 */}
        {error && <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 12 }}>{error}</div>}

        {/* 제출 */}
        <button className="bk-submit-btn" onClick={handleSubmit} disabled={submitting}>
          {submitting ? '예약 접수 중...' : '예약 요청하기'}
        </button>
      </div>
    </div>
  );
}
