'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { Clock, User, Sparkles, UserCog, FileText, ChevronDown, Check, Search, X, ShoppingBag, MessageSquare, AlertCircle } from 'lucide-react';
import DatePicker from '@/components/DatePicker';

interface Customer { id: string; user: { name: string; phone?: string | null; profileImage?: string | null } }
interface Staff { id: string; user: { name: string } }
interface MenuItem {
  id: string; name: string; duration: number; price: number;
  sessions?: number; description?: string;
  category?: { id: string; name: string };
  categoryId?: string;
  menuTreatments?: { id: string; treatment: { id: string; name: string; duration: number; category?: { name: string } } }[];
}

export default function NewReservationPage({ params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = use(params);
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const store = useThemeStore();
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<{id:string;name:string}[]>([]);
  const [selectedMenuCat, setSelectedMenuCat] = useState<string>('ALL');

  const [form, setForm] = useState({
    customerId: '', menuId: '', staffId: '', date: '', startTime: '', memo: '', status: 'CONFIRMED',
  });

  const [custSearch, setCustSearch] = useState('');
  const [showCustDrop, setShowCustDrop] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePeriod, setTimePeriod] = useState<'AM'|'PM'>('AM');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [customerReservations, setCustomerReservations] = useState<any[]>([]);
  const [customerRecords, setCustomerRecords] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/shops/${shopSlug}/customers`).then(r => r.json()),
      fetch(`/api/shops/${shopSlug}/staff`).then(r => r.json()),
      fetch(`/api/shops/${shopSlug}/menus`).then(r => r.json()),
      fetch(`/api/shops/${shopSlug}/categories`).then(r => r.json()).catch(() => ({ categories: [] })),
    ]).then(([custData, staffData, menuData, catData]) => {
      setCustomers(custData.customers || []);
      setStaff(staffData.staff || []);
      setMenus(menuData.menus || []);
      setCategories(catData.categories || []);
    });
  }, [shopSlug]);

  const selectedMenu = menus.find(m => m.id === form.menuId);
  const selectedCustomer = customers.find(c => c.id === form.customerId);
  const selectedStaff = staff.find(s => s.id === form.staffId);

  useEffect(() => {
    if (!form.customerId) { setCustomerReservations([]); setCustomerRecords([]); return; }
    Promise.all([
      fetch(`/api/shops/${shopSlug}/reservations?customerId=${form.customerId}`).then(r => r.json()),
      fetch(`/api/shops/${shopSlug}/customers/${form.customerId}/records`).then(r => r.json()),
    ]).then(([resvData, recData]) => {
      setCustomerReservations(resvData.reservations || []);
      setCustomerRecords(Array.isArray(recData) ? recData : []);
    });
  }, [form.customerId, shopSlug]);

  const menusWithRemaining = form.customerId ? (() => {
    const completed = customerReservations.filter((r: any) => (r.status === 'COMPLETED' || r.status === 'IN_PROGRESS') && r.menu);
    const menuMap = new Map<string, { menu: any; total: number; used: number }>();
    completed.forEach((r: any) => {
      const key = r.menuId;
      const totalSessions = r.menu?.sessions || 1;
      const usedSessions = customerRecords.filter((rec: any) => rec.reservation?.menuId === key).length;
      if (!menuMap.has(key) || menuMap.get(key)!.total < totalSessions) {
        menuMap.set(key, { menu: r.menu, total: totalSessions, used: usedSessions });
      }
    });
    return Array.from(menuMap.values()).filter(m => m.total - m.used > 0);
  })() : [];

  const fmtPhone = (ph: string) => {
    const n = ph.replace(/\D/g, '');
    if (n.length === 11) return `${n.slice(0,3)}-${n.slice(3,7)}-${n.slice(7)}`;
    return ph;
  };

  const filteredCust = customers.filter(c =>
    c.user.name.includes(custSearch) || (c.user.phone || '').includes(custSearch)
  );

  const endTime = (() => {
    if (!form.startTime || !selectedMenu) return '';
    const [h, m] = form.startTime.split(':').map(Number);
    const total = h * 60 + m + selectedMenu.duration;
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  })();

  const timeSlots = (() => {
    const slots: string[] = [];
    for (let h = 8; h < 22; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
      slots.push(`${String(h).padStart(2, '0')}:30`);
    }
    return slots;
  })();

  const handleSubmit = async () => {
    if (!form.customerId || !form.menuId || !form.date || !form.startTime) {
      setError('고객, 시술, 날짜, 시간을 모두 선택해주세요.');
      return;
    }
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/shops/${shopSlug}/reservations`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/${shopSlug}/reservations`);
      } else {
        setError(data.error || '등록 실패');
      }
    } catch { setError('서버 오류'); }
    setSaving(false);
  };

  if (!mounted) return null;

  // 섹션 스타일
  const sectionStyle = {
    padding: '16px 18px',
    borderRadius: 14,
    border: `1px solid ${c.borderLight}`,
    background: c.surface,
  };
  const sectionTitle = (icon: React.ReactNode, label: string, required?: boolean) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: 13, fontWeight: 700, color: c.text }}>
      {icon}
      <span>{label}</span>
      {required && <span style={{ color: '#EF4444', fontSize: 11 }}>*</span>}
    </div>
  );
  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14,
    border: `1px solid ${c.borderLight}`, background: c.surface, color: c.text,
    outline: 'none', transition: 'border .15s',
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 4px' }}>
      {/* 헤더 */}
      <div style={{
        padding: '20px 20px 16px',
        background: `linear-gradient(135deg, ${c.primary}12 0%, ${c.primaryLight}18 50%, ${c.secondaryLight}15 100%)`,
        borderRadius: '16px 16px 0 0',
        borderBottom: `1px solid ${c.borderLight}`,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: c.primary + '08' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `linear-gradient(135deg, ${c.primary}, ${c.primaryLight || c.primary}cc)`,
            boxShadow: `0 4px 12px ${c.primary}30`,
          }}>
            <Sparkles style={{ width: 18, height: 18, color: 'white' }} />
          </div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: c.text }}>새 예약 등록</h2>
            <p style={{ fontSize: 11, color: c.textLight, marginTop: 1 }}>예약 정보를 입력하세요</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 0' }}>

        {/* ────── 섹션 1: 고객 ────── */}
        <div style={sectionStyle}>
          {sectionTitle(<User style={{ width: 15, height: 15, color: c.primary }} />, '고객', true)}

          {/* 선택된 고객 카드 */}
          {selectedCustomer && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 10, marginBottom: 10,
              border: `1.5px solid ${c.primary}`, background: `${c.primary}06`,
            }}>
              {/* 프로필 사진 */}
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                background: c.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${c.primary}30`,
              }}>
                {selectedCustomer.user.profileImage ? (
                  <img src={selectedCustomer.user.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User style={{ width: 20, height: 20, color: c.primary }} />
                )}
              </div>
              {/* 이름 + 전화 */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>{selectedCustomer.user.name}</div>
                <div style={{ fontSize: 12, color: c.textLight, marginTop: 1 }}>
                  {selectedCustomer.user.phone ? fmtPhone(selectedCustomer.user.phone) : '연락처 없음'}
                </div>
              </div>
              {/* 변경 버튼 */}
              <button onClick={() => { setForm({ ...form, customerId: '' }); setCustSearch(''); }}
                style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  border: `1px solid ${c.borderLight}`, background: 'white', color: c.textLight, cursor: 'pointer',
                }}>변경</button>
            </div>
          )}

          {/* 검색 + 고객 리스트 (선택 전 또는 변경 시) */}
          {!selectedCustomer && (
            <div style={{ position: 'relative' }}>
              {/* 검색 입력 */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 10, border: `1px solid ${c.borderLight}`, background: c.surface,
              }}>
                <Search style={{ width: 15, height: 15, color: c.textLight, flexShrink: 0 }} />
                <input
                  value={custSearch} onChange={e => { setCustSearch(e.target.value); setShowCustDrop(true); }}
                  onFocus={() => setShowCustDrop(true)}
                  placeholder="이름 또는 연락처로 검색"
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: c.text, width: '100%' }}
                />
              </div>

              {/* 고객 목록 */}
              {showCustDrop && (
                <div style={{
                  marginTop: 6, borderRadius: 10, border: `1px solid ${c.borderLight}`,
                  background: c.surface, boxShadow: '0 4px 16px rgba(0,0,0,.06)',
                  maxHeight: 240, overflowY: 'auto',
                }}>
                  {filteredCust.map(cu => (
                    <div key={cu.id}
                      onClick={() => { setForm({ ...form, customerId: cu.id }); setShowCustDrop(false); setCustSearch(''); }}
                      style={{
                        padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                        background: 'transparent', transition: 'background .1s',
                        borderBottom: `1px solid ${c.borderLight}08`,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = c.surfaceHover}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* 미니 아바타 */}
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                        background: c.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {cu.user.profileImage ? (
                          <img src={cu.user.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <User style={{ width: 14, height: 14, color: c.primary }} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{cu.user.name}</div>
                        <div style={{ fontSize: 11, color: c.textLight }}>{cu.user.phone ? fmtPhone(cu.user.phone) : ''}</div>
                      </div>
                    </div>
                  ))}
                  {filteredCust.length === 0 && <div style={{ padding: 16, fontSize: 13, color: c.textLight, textAlign: 'center' }}>검색 결과 없음</div>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ────── 섹션 2: 상품 (시술) ────── */}
        <div style={sectionStyle}>
          {sectionTitle(<ShoppingBag style={{ width: 15, height: 15, color: '#6366F1' }} />, '시술 상품', true)}

          {/* 선택된 상품 표시 또는 선택 버튼 */}
          {selectedMenu ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderRadius: 10,
              border: `1.5px solid ${c.primary}`, background: `${c.primary}08`,
            }}>
              <div>
                {selectedMenu.category && (
                  <span style={{ fontSize: 9, fontWeight: 600, color: c.primary, background: c.primaryLight, padding: '1px 6px', borderRadius: 4, marginRight: 6 }}>
                    {selectedMenu.category.name}
                  </span>
                )}
                <div style={{ fontWeight: 700, fontSize: 14, color: c.text, marginTop: 4 }}>{selectedMenu.name}</div>
                <div style={{ fontSize: 12, color: c.textLight, marginTop: 2 }}>
                  {selectedMenu.duration}분 · {selectedMenu.price?.toLocaleString() || 0}원
                  {selectedMenu.sessions && selectedMenu.sessions > 1 && <span style={{ marginLeft: 4, fontWeight: 600, color: '#6366F1' }}>({selectedMenu.sessions}회)</span>}
                </div>
              </div>
              <button onClick={() => setShowMenuModal(true)} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: `1px solid ${c.primary}`, background: 'white', color: c.primary, cursor: 'pointer',
              }}>변경</button>
            </div>
          ) : (
            <button
              onClick={() => setShowMenuModal(true)}
              style={{
                width: '100%', padding: '14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                border: `1.5px dashed ${c.borderLight}`, background: 'transparent', color: c.textLight,
                cursor: 'pointer', transition: 'all .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = c.primary; e.currentTarget.style.color = c.primary; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = c.borderLight; e.currentTarget.style.color = c.textLight; }}
            >
              + 시술 상품을 선택하세요
            </button>
          )}

          {/* 종료 시간 표시 */}
          {endTime && form.startTime && (
            <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: c.primaryLight, fontSize: 12 }}>
              <span style={{ color: c.textLight }}>종료 예상: </span>
              <span style={{ fontWeight: 700, color: c.primary }}>{endTime}</span>
              <span style={{ color: c.textLight }}> ({selectedMenu?.duration}분 소요)</span>
            </div>
          )}

          {/* 날짜 + 시간 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: c.textLight, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Clock style={{ width: 12, height: 12 }} /> 날짜 *
              </div>
              <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                <button type="button" onClick={() => {
                  if (!form.date) return;
                  const d = new Date(form.date); d.setDate(d.getDate() - 1);
                  setForm({ ...form, date: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` });
                }} style={{ width: 28, height: 34, borderRadius: 6, border: `1px solid ${c.borderLight}`, background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: c.textLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <div
                  onClick={() => { setShowDatePicker(!showDatePicker); setShowTimePicker(false); }}
                  style={{ ...inputStyle, cursor: 'pointer', flex: 1, textAlign: 'center', fontSize: 13, padding: '8px 6px' }}
                >
                  {form.date || '날짜 선택'}
                </div>
                <button type="button" onClick={() => {
                  const d = form.date ? new Date(form.date) : new Date(); d.setDate(d.getDate() + 1);
                  setForm({ ...form, date: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` });
                }} style={{ width: 28, height: 34, borderRadius: 6, border: `1px solid ${c.borderLight}`, background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: c.textLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
              {showDatePicker && (
                <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 50, marginTop: 4 }}>
                  <DatePicker
                    inline
                    value={form.date || ''}
                    onChange={(d) => { setForm({ ...form, date: typeof d === 'string' ? d : d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : '' }); setShowDatePicker(false); }}
                  />
                </div>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: c.textLight, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Clock style={{ width: 12, height: 12 }} /> 시간 *
              </div>
              <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                <button type="button" onClick={() => {
                  if (!form.startTime) return;
                  const [hh, mm] = form.startTime.split(':').map(Number);
                  let total = hh * 60 + mm - 10; if (total < 0) total = 0;
                  const nh = Math.floor(total / 60), nm = total % 60;
                  setForm({ ...form, startTime: `${String(nh).padStart(2,'0')}:${String(nm).padStart(2,'0')}` });
                }} style={{ width: 28, height: 34, borderRadius: 6, border: `1px solid ${c.borderLight}`, background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: c.textLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <div
                  onClick={() => { setShowTimePicker(!showTimePicker); setShowDatePicker(false); }}
                  style={{ ...inputStyle, cursor: 'pointer', flex: 1, textAlign: 'center', fontSize: 13, padding: '8px 6px' }}
                >
                  {form.startTime ? (() => {
                    const h = parseInt(form.startTime.split(':')[0]);
                    const m = form.startTime.split(':')[1];
                    return `${h >= 12 ? '오후' : '오전'} ${h > 12 ? h - 12 : h === 0 ? 12 : h}:${m}`;
                  })() : '시간 선택'}
                </div>
                <button type="button" onClick={() => {
                  const [hh, mm] = form.startTime ? form.startTime.split(':').map(Number) : [8, 0];
                  let total = hh * 60 + mm + 10; if (total > 23 * 60 + 50) total = 23 * 60 + 50;
                  const nh = Math.floor(total / 60), nm = total % 60;
                  setForm({ ...form, startTime: `${String(nh).padStart(2,'0')}:${String(nm).padStart(2,'0')}` });
                }} style={{ width: 28, height: 34, borderRadius: 6, border: `1px solid ${c.borderLight}`, background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: c.textLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
              {showTimePicker && (
                <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 50, marginTop: 4 }}>
                  <div className="rounded-2xl border p-4 shadow-xl" style={{ background: c.surface, borderColor: c.borderLight, width: 260, minWidth: 260 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 10, padding: 3, borderRadius: 10, background: c.primaryLight + '40' }}>
                      {(['AM', 'PM'] as const).map(p => (
                        <button key={p} type="button" onClick={() => setTimePeriod(p)}
                          style={{
                            flex: 1, padding: '5px 0', borderRadius: 8, fontSize: 12, fontWeight: 600,
                            border: 'none', cursor: 'pointer',
                            background: timePeriod === p ? c.primary : 'transparent',
                            color: timePeriod === p ? c.textOnPrimary : c.textLight,
                          }}>
                          {p === 'AM' ? '오전' : '오후'}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3 }}>
                      {timeSlots
                        .filter(t => {
                          const h = parseInt(t.split(':')[0]);
                          return timePeriod === 'AM' ? h < 12 : h >= 12;
                        })
                        .map(t => {
                          const h = parseInt(t.split(':')[0]);
                          const m = t.split(':')[1];
                          const label = `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${m}`;
                          const isSelected = form.startTime === t;
                          return (
                            <button key={t} type="button"
                              onClick={() => { setForm({ ...form, startTime: t }); setShowTimePicker(false); }}
                              style={{
                                padding: '7px 0', borderRadius: 6, fontSize: 11, fontWeight: isSelected ? 700 : 400,
                                border: 'none', cursor: 'pointer',
                                background: isSelected ? c.primary : 'transparent',
                                color: isSelected ? c.textOnPrimary : c.text,
                              }}
                              onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = c.primaryLight; }}
                              onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
                              {label}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ────── 섹션 3: 담당 ────── */}
        <div style={sectionStyle}>
          {sectionTitle(<UserCog style={{ width: 15, height: 15, color: '#10B981' }} />, '담당 관리사')}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setForm({ ...form, staffId: '' })}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: `1.5px solid ${!form.staffId ? '#10B981' : c.borderLight}`,
                background: !form.staffId ? '#10B98118' : 'transparent',
                color: !form.staffId ? '#10B981' : c.textLight,
                cursor: 'pointer',
              }}
            >자동 배정</button>
            {staff.map(s => {
              const active = form.staffId === s.id;
              return (
                <button key={s.id}
                  onClick={() => setForm({ ...form, staffId: s.id })}
                  style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: `1.5px solid ${active ? c.primary : c.borderLight}`,
                    background: active ? `${c.primary}18` : 'transparent',
                    color: active ? c.primary : c.text,
                    cursor: 'pointer',
                  }}
                >{s.user.name}</button>
              );
            })}
          </div>
        </div>

        {/* ────── 섹션 4: 상태 ────── */}
        <div style={sectionStyle}>
          {sectionTitle(<AlertCircle style={{ width: 15, height: 15, color: '#F59E0B' }} />, '예약 상태')}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { key: 'CONFIRMED', label: '확정', color: c.primary },
              { key: 'PENDING', label: '대기', color: '#F59E0B' },
            ].map(s => (
              <button key={s.key}
                onClick={() => setForm({ ...form, status: s.key })}
                style={{
                  padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: `1.5px solid ${form.status === s.key ? s.color : c.borderLight}`,
                  background: form.status === s.key ? `${s.color}18` : 'transparent',
                  color: form.status === s.key ? s.color : c.textLight,
                  cursor: 'pointer',
                }}
              >{s.label}</button>
            ))}
          </div>
        </div>

        {/* ────── 섹션 5: 메모 ────── */}
        <div style={sectionStyle}>
          {sectionTitle(<MessageSquare style={{ width: 15, height: 15, color: '#8B5CF6' }} />, '메모')}
          <textarea value={form.memo} onChange={e => setForm({ ...form, memo: e.target.value })}
            placeholder="특이사항, 요청사항 등"
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' as const, fontSize: 13 }} />
        </div>

        {/* 에러 */}
        {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEE2E2', color: '#991B1B', fontSize: 13 }}>{error}</div>}

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '4px 0 16px' }}>
          <button
            onClick={() => router.back()}
            style={{ padding: '10px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600, border: `1px solid ${c.borderLight}`, background: 'transparent', color: c.textLight, cursor: 'pointer' }}
          >취소</button>
          <button
            onClick={handleSubmit} disabled={saving}
            style={{
              padding: '10px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              background: c.primary, color: c.textOnPrimary, border: 'none', cursor: 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >{saving ? '등록 중...' : '예약 등록'}</button>
        </div>
      </div>

      {/* ────── 시술 상품 선택 팝업 ────── */}
      {showMenuModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 12 }}
          onClick={() => setShowMenuModal(false)}>
          <div style={{
            background: c.surface, borderRadius: 18, width: '100%', maxWidth: 520,
            maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,.15)',
          }} onClick={e => e.stopPropagation()}>
            {/* 팝업 헤더 */}
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${c.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text }}>시술 상품 선택</h3>
              <button onClick={() => setShowMenuModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textLight, padding: 4 }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* 카테고리 탭 */}
            {categories.length > 0 && (
              <div style={{ padding: '10px 20px', borderBottom: `1px solid ${c.borderLight}`, display: 'flex', gap: 4, overflowX: 'auto', whiteSpace: 'nowrap' }}>
                {[{ id: 'ALL', name: '전체' }, ...categories].map(cat => {
                  const active = selectedMenuCat === cat.id;
                  return (
                    <button key={cat.id} onClick={() => setSelectedMenuCat(cat.id)}
                      style={{
                        flexShrink: 0, padding: '5px 14px', borderRadius: 8,
                        fontSize: 12, fontWeight: 600,
                        border: `1px solid ${active ? c.primary : c.borderLight}`,
                        background: active ? c.primary : 'white',
                        color: active ? c.textOnPrimary : c.text,
                        cursor: 'pointer',
                      }}>
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 회차 남은 메뉴 */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
              {form.customerId && menusWithRemaining.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', marginBottom: 8, padding: '4px 8px', background: '#EEF2FF', borderRadius: 6, display: 'inline-block' }}>
                    💎 구매 상품 (시술 잔여)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {menusWithRemaining.map(item => {
                      const isSelected = form.menuId === item.menu.id;
                      return (
                        <div key={`rem-${item.menu.id}`}
                          onClick={() => { setForm({ ...form, menuId: item.menu.id }); setShowMenuModal(false); }}
                          style={{
                            padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13,
                            border: `1.5px solid ${isSelected ? '#6366F1' : c.borderLight}`,
                            background: isSelected ? '#6366F110' : 'transparent',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: isSelected ? '#6366F1' : c.text }}>{item.menu.name}</div>
                            <div style={{ fontSize: 11, color: c.textLight, marginTop: 1 }}>
                              {item.menu.duration}분 · {item.menu.price?.toLocaleString() || 0}원
                            </div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#DBEAFE', color: '#1D4ED8' }}>
                            {item.used}/{item.total}회
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 전체 메뉴 리스트 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(selectedMenuCat === 'ALL' ? menus : menus.filter(m => m.categoryId === selectedMenuCat)).map(m => {
                  const isSelected = form.menuId === m.id;
                  const treatments = m.menuTreatments || [];
                  return (
                    <div key={m.id}
                      onClick={() => { setForm({ ...form, menuId: m.id }); setShowMenuModal(false); }}
                      style={{
                        padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13,
                        border: `1.5px solid ${isSelected ? c.primary : c.borderLight}`,
                        background: isSelected ? `${c.primary}10` : 'transparent',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        transition: 'all .15s',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = c.surfaceHover; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? `${c.primary}10` : 'transparent'; }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {m.category && (
                            <span style={{ fontSize: 9, fontWeight: 600, color: c.primary, background: c.primaryLight, padding: '1px 6px', borderRadius: 4 }}>
                              {m.category.name}
                            </span>
                          )}
                          <span style={{ fontWeight: 600, color: isSelected ? c.primary : c.text }}>{m.name}</span>
                        </div>
                        <div style={{ fontSize: 11, color: c.textLight, marginTop: 2 }}>
                          {m.duration}분 · {m.price?.toLocaleString() || 0}원
                          {m.sessions && m.sessions > 1 && <span style={{ marginLeft: 4, fontWeight: 600, color: '#6366F1' }}>({m.sessions}회)</span>}
                        </div>
                        {treatments.length > 0 && (
                          <div style={{ fontSize: 10, color: c.textLight, marginTop: 3, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            {treatments.slice(0, 3).map(t => (
                              <span key={t.id} style={{ background: c.secondaryLight, padding: '1px 5px', borderRadius: 4 }}>
                                {t.treatment.name}
                              </span>
                            ))}
                            {treatments.length > 3 && <span style={{ opacity: 0.6 }}>+{treatments.length - 3}</span>}
                          </div>
                        )}
                      </div>
                      {isSelected && <Check style={{ width: 16, height: 16, color: c.primary, flexShrink: 0, marginLeft: 8 }} />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
