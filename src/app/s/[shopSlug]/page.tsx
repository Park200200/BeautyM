'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Phone, MapPin, Clock, Scissors, Star, Users, CalendarPlus, ChevronRight, Sparkles, ClipboardList, X, Search } from 'lucide-react';

type ShopData = {
  shop: {
    name: string; slug: string; description?: string; logoUrl?: string;
    phone?: string; address?: string; businessHours?: string;
  };
  menus: {
    id: string; name: string; description?: string; price?: number;
    duration?: number; sessions?: number; sessionInterval?: number;
    photos?: string; categoryId?: string;
    menuTreatments?: { treatment: { name: string } }[];
  }[];
  categories: { id: string; name: string; sortOrder: number }[];
  staff: { id: string; specialties?: string; jobTitle?: string; user: { name: string; profileImage?: string } }[];
  portfolios: { id: string; title?: string; beforeImage?: string; afterImage?: string; description?: string }[];
  reviews: { id: string; rating: number; content?: string; createdAt: string; customer?: { user: { name: string } } }[];
};

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

export default function BookingPage() {
  const params = useParams();
  const shopSlug = params.shopSlug as string;
  const [data, setData] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [checkPhone, setCheckPhone] = useState('');
  const [checkPin, setCheckPin] = useState('');
  const [checkResult, setCheckResult] = useState<{ customerName?: string; reservations: any[] } | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetch(`/api/shops/${shopSlug}/public`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [shopSlug]);

  const handleCheckPhone = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 11);
    let formatted = nums;
    if (nums.length > 3 && nums.length <= 7) formatted = `${nums.slice(0,3)}-${nums.slice(3)}`;
    else if (nums.length > 7) formatted = `${nums.slice(0,3)}-${nums.slice(3,7)}-${nums.slice(7)}`;
    setCheckPhone(formatted);
  };

  const handleCheckReservation = async () => {
    if (!checkPhone || checkPhone.replace(/-/g, '').length < 10) return;
    if (!checkPin || checkPin.length !== 4) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/public/reservations?phone=${encodeURIComponent(checkPhone)}&pin=${checkPin}`);
      const data = await res.json();
      setCheckResult(data);
    } catch { setCheckResult({ reservations: [] }); }
    setChecking(false);
  };

  const getStatusInfo = (status: string) => {
    const map: Record<string, { label: string; bg: string; color: string }> = {
      PENDING: { label: '요청', bg: '#FEF3C7', color: '#92400E' },
      CONFIRMED: { label: '확정', bg: '#D1FAE5', color: '#065F46' },
      COMPLETED: { label: '완료', bg: '#DBEAFE', color: '#1E40AF' },
      CANCELLED: { label: '취소', bg: '#F3F4F6', color: '#6B7280' },
      NO_SHOW: { label: '노쇼', bg: '#FEE2E2', color: '#DC2626' },
    };
    return map[status] || { label: status, bg: '#F3F4F6', color: '#6B7280' };
  };

  if (loading) return (
    <div className="booking-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', color: '#40BFA3' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #40BFA3', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize: 14, fontWeight: 600 }}>로딩 중...</div>
      </div>
    </div>
  );

  if (!data?.shop) return (
    <div className="booking-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏠</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#374151' }}>매장을 찾을 수 없습니다</div>
      </div>
    </div>
  );

  const { shop, menus, categories, staff, reviews } = data;
  const filteredMenus = selectedCat === 'ALL' ? menus : menus.filter(m => m.categoryId === selectedCat);
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  let bh: Record<string, { open: string; close: string; isOff: boolean }> | null = null;
  try { if (shop.businessHours) bh = JSON.parse(shop.businessHours); } catch {}

  return (
    <div className="booking-page">
      {/* 헤더 */}
      <header className="bk-header">
        <div className="bk-header-inner">
          <div className="bk-logo">
            {shop.logoUrl ? <img src={shop.logoUrl} alt="" /> : (
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles style={{ width: 20, height: 20, color: 'white' }} />
              </div>
            )}
            <span className="bk-logo-text">{shop.name}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setShowCheckModal(true); setCheckResult(null); setCheckPhone(''); setCheckPin(''); }} className="bk-cta-btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1.5px solid rgba(255,255,255,0.4)' }}>예약확인</button>
            <Link href={`/s/${shopSlug}/reserve`} className="bk-cta-btn">예약하기</Link>
          </div>
        </div>
      </header>

      {/* 히어로 */}
      <section className="bk-hero">
        <h1>{shop.name}</h1>
        <p>{shop.description || '아름다움을 위한 전문 케어를 경험하세요'}</p>
        {avgRating && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, fontSize: 13 }}>
            <Star style={{ width: 16, height: 16, fill: '#FCD34D', color: '#FCD34D' }} />
            <span style={{ fontWeight: 700 }}>{avgRating}</span>
            <span style={{ opacity: 0.7 }}>({reviews.length}개 리뷰)</span>
          </div>
        )}
      </section>

      {/* 정보 칩 */}
      <div className="bk-info-bar">
        {shop.phone && (
          <div className="bk-info-chip">
            <Phone /> <span>{shop.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}</span>
          </div>
        )}
        {shop.address && (
          <div className="bk-info-chip">
            <MapPin /> <span>{shop.address}</span>
          </div>
        )}
        <div className="bk-info-chip">
          <Clock />
          <span>
            {bh ? (() => {
              const days = ['mon', 'tue', 'wed', 'thu', 'fri'];
              const weekday = bh![days[0]];
              return weekday && !weekday.isOff ? `평일 ${weekday.open}~${weekday.close}` : '영업시간 확인';
            })() : '영업시간 문의'}
          </span>
        </div>
      </div>

      {/* 시술 상품 */}
      <section className="bk-section">
        <div className="bk-section-title"><Scissors /> 시술 상품</div>
        <div className="bk-cat-tabs">
          <button className={`bk-cat-tab ${selectedCat === 'ALL' ? 'active' : ''}`} onClick={() => setSelectedCat('ALL')}>전체</button>
          {categories.map(cat => (
            <button key={cat.id} className={`bk-cat-tab ${selectedCat === cat.id ? 'active' : ''}`} onClick={() => setSelectedCat(cat.id)}>
              {cat.name}
            </button>
          ))}
        </div>
        <div className="bk-menu-grid">
          {filteredMenus.map(menu => {
            const photo = getMenuPhoto(menu.photos);
            const catName = categories.find(c => c.id === menu.categoryId)?.name;
            return (
              <div key={menu.id} className="bk-menu-card">
                {photo ? (
                  <img src={photo} alt={menu.name} className="bk-menu-card-img" />
                ) : (
                  <div className="bk-menu-card-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Scissors style={{ width: 32, height: 32, color: '#40BFA3', opacity: 0.4 }} />
                  </div>
                )}
                <div className="bk-menu-card-body">
                  <h3>{menu.name}</h3>
                  <div className="bk-menu-card-meta">
                    {catName && <span className="badge">{catName}</span>}
                    {menu.duration && <span><Clock style={{ width: 11, height: 11 }} /> {formatDuration(menu.duration)}</span>}
                    {menu.sessions && <span>{menu.sessions}회</span>}
                  </div>
                  {menu.price != null && <div className="bk-menu-price">₩{formatPrice(menu.price)}</div>}
                  {menu.description && <div className="bk-menu-desc">{menu.description}</div>}
                  {menu.menuTreatments && menu.menuTreatments.length > 0 && (
                    <div className="bk-menu-treatments">
                      {menu.menuTreatments.map((mt, i) => (
                        <span key={i} className="bk-treatment-tag">{mt.treatment.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 전문가 소개 */}
      {staff.length > 0 && (
        <section className="bk-section">
          <div className="bk-section-title"><Users /> 전문 관리사</div>
          <div className="bk-staff-scroll">
            {staff.map(s => (
              <div key={s.id} className="bk-staff-card">
                {s.user.profileImage ? (
                  <img src={s.user.profileImage} alt="" className="bk-staff-avatar" />
                ) : (
                  <div className="bk-staff-avatar" style={{ background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users style={{ width: 24, height: 24, color: '#40BFA3' }} />
                  </div>
                )}
                <div className="bk-staff-name">{s.user.name}</div>
                <div className="bk-staff-role">{s.jobTitle || '관리사'}</div>
                {s.specialties && <div style={{ fontSize: 10, color: '#40BFA3', marginTop: 4 }}>{s.specialties}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 리뷰 */}
      {reviews.length > 0 && (
        <section className="bk-section">
          <div className="bk-section-title"><Star /> 고객 리뷰</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reviews.slice(0, 5).map(r => (
              <div key={r.id} style={{ background: 'white', padding: '12px 16px', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} style={{ width: 12, height: 12, fill: i < r.rating ? '#FCD34D' : '#E5E7EB', color: i < r.rating ? '#FCD34D' : '#E5E7EB' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>{r.customer?.user?.name || '고객'}</span>
                </div>
                {r.content && <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{r.content}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 푸터 */}
      <footer className="bk-footer" style={{ paddingBottom: 80 }}>
        <div>{shop.name}</div>
        {shop.address && <div style={{ marginTop: 4 }}>{shop.address}</div>}
        {shop.phone && <div style={{ marginTop: 4 }}>{shop.phone}</div>}
        <div style={{ marginTop: 8, fontSize: 10 }}>Powered by BeautyM</div>
      </footer>

      {/* 플로팅 예약 버튼 */}
      <Link href={`/s/${shopSlug}/reserve`} className="bk-float-btn">
        <CalendarPlus style={{ width: 18, height: 18 }} /> 온라인 예약
      </Link>

      {/* 예약확인 모달 */}
      {showCheckModal && (
        <>
          <div onClick={() => setShowCheckModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxHeight: '85vh', background: 'white', borderRadius: '20px 20px 0 0', zIndex: 201, boxShadow: '0 -10px 40px rgba(0,0,0,0.15)', padding: '20px 20px 32px', overflowY: 'auto', scrollbarWidth: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList style={{ width: 20, height: 20, color: '#40BFA3' }} /> 예약 확인
              </div>
              <button onClick={() => setShowCheckModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X style={{ width: 20, height: 20, color: '#6B7280' }} />
              </button>
            </div>

            {/* 전화번호 + 비밀번호 입력 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Phone style={{ width: 14, height: 14, color: '#40BFA3', position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    value={checkPhone}
                    onChange={e => handleCheckPhone(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCheckReservation()}
                    placeholder="전화번호"
                    inputMode="tel"
                    style={{ width: '100%', padding: '12px 14px 12px 34px', border: '1.5px solid #e5e7eb', borderRadius: 12, fontSize: 14, outline: 'none' }}
                  />
                </div>
                <div style={{ position: 'relative', width: 110 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#40BFA3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  <input
                    value={checkPin}
                    onChange={e => setCheckPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    onKeyDown={e => e.key === 'Enter' && handleCheckReservation()}
                    placeholder="비밀번호"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    style={{ width: '100%', padding: '12px 14px 12px 30px', border: '1.5px solid #e5e7eb', borderRadius: 12, fontSize: 14, outline: 'none', letterSpacing: 4 }}
                  />
                </div>
              </div>
              <button onClick={handleCheckReservation} disabled={checking} style={{ padding: '10px 20px', background: '#40BFA3', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Search style={{ width: 15, height: 15 }} /> 예약 조회
              </button>
            </div>

            {/* 결과 */}
            {checking && (
              <div style={{ textAlign: 'center', padding: 20, color: '#6B7280', fontSize: 14 }}>조회 중...</div>
            )}
            {checkResult && !checking && (
              <>
                {checkResult.reservations.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: '#9CA3AF' }}>
                    <ClipboardList style={{ width: 32, height: 32, margin: '0 auto 8px', color: '#D1D5DB' }} />
                    <div style={{ fontSize: 14 }}>예약 내역이 없습니다</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {checkResult.customerName && (
                      <div style={{ fontSize: 13, color: '#374151', fontWeight: 600, marginBottom: 4 }}>
                        {checkResult.customerName} 님의 예약 내역
                      </div>
                    )}
                    {checkResult.reservations.map((r: any) => {
                      const st = getStatusInfo(r.status);
                      const d = new Date(r.startTime);
                      const dateStr = `${d.getMonth()+1}.${d.getDate()}(${['일','월','화','수','목','금','토'][d.getDay()]})`;
                      const timeStr = `${d.getHours() >= 12 ? '오후' : '오전'} ${d.getHours() > 12 ? d.getHours()-12 : d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
                      return (
                        <div key={r.id} style={{ padding: '14px 16px', background: '#FAFAFA', borderRadius: 14, border: '1px solid #f3f4f6' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            {r.status !== 'PENDING' && r.status !== 'REQUESTED' && (
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color }}>{st.label}</span>
                            )}
                            {(r.status === 'PENDING' || r.status === 'REQUESTED') && <span />}
                            <span style={{ fontSize: 11, color: '#9CA3AF' }}>{dateStr} {timeStr}</span>
                          </div>
                          {(r.status === 'PENDING' || r.status === 'REQUESTED') && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: '#FEF3C7', borderRadius: 10, marginBottom: 8, fontSize: 12, color: '#92400E', fontWeight: 600 }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                              스케줄 배정중입니다. 확정 후 안내드리겠습니다.
                            </div>
                          )}
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>{r.menu?.name || '-'}</div>
                          {/* 담당자 정보 */}
                          {r.staff?.user && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'white', borderRadius: 10, border: '1px solid #f3f4f6', marginBottom: 8 }}>
                              {r.staff.user.profileImage ? (
                                <img src={r.staff.user.profileImage} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #D1FAE5' }} />
                              ) : (
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Users style={{ width: 16, height: 16, color: '#40BFA3' }} />
                                </div>
                              )}
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>{r.staff.user.name} {r.staff.jobTitle || '담당'}</div>
                                {r.staff.user.phone && (
                                  <div style={{ fontSize: 11, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                                    <Phone style={{ width: 10, height: 10 }} />
                                    {r.staff.user.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#6B7280' }}>
                            {r.menu?.duration && <span><Clock style={{ width: 10, height: 10 }} /> {r.menu.duration}분</span>}
                            {r.menu?.price != null && <span style={{ color: '#40BFA3', fontWeight: 600 }}>₩{r.menu.price.toLocaleString()}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
