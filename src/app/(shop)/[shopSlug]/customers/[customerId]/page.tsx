'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Calendar, Droplets, MessageSquare, Plus, Pencil, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Phone, Mail, Clock, Star, User, Sparkles, Shield, ArrowLeft, GripVertical, Trash2, X, Settings, ClipboardList, Camera, ImagePlus, XCircle, Package } from 'lucide-react';
import { getStatusLabel, getStatusColor } from '@/lib/utils';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import Link from 'next/link';
import DatePicker from '@/components/DatePicker';

type CustomTab = { name: string; sortOrder: number; fields: string[] };

export default function CustomerDetailPage() {
  const params = useParams();
  const shopSlug = params.shopSlug as string;
  const customerId = params.customerId as string;

  const store = useThemeStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;

  const [customer, setCustomer] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('records');
  const [customTabs, setCustomTabs] = useState<CustomTab[]>([]);
  const [customData, setCustomData] = useState<Record<string, string>>({});
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [tabForm, setTabForm] = useState<Record<string, string>>({});

  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [recordForm, setRecordForm] = useState<any>({ skinCondition: '', productsUsed: '', content: '', managementData: {} });
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [newRecordForm, setNewRecordForm] = useState<any>({ skinCondition: '', productsUsed: '', content: '', managementData: {}, reservationId: '', sessionNumber: '', nextReservationDate: '', nextDate: '', nextTime: '' });
  const [newRecordPhotos, setNewRecordPhotos] = useState<{url:string;type:string}[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showNextDatePicker, setShowNextDatePicker] = useState(false);
  const [showNextTimePicker, setShowNextTimePicker] = useState(false);
  const [nextTimePeriod, setNextTimePeriod] = useState<'AM'|'PM'>('AM');
  const nextTimeSlots = (() => { const s: string[] = []; for (let h = 8; h < 22; h++) { s.push(`${String(h).padStart(2,'0')}:00`); s.push(`${String(h).padStart(2,'0')}:30`); } return s; })();

  const [showFieldsModal, setShowFieldsModal] = useState(false);
  const [editTabs, setEditTabs] = useState<CustomTab[]>([]);
  const [newTabName, setNewTabName] = useState('');
  const [editingModalTabIdx, setEditingModalTabIdx] = useState<number | null>(null);
  const [newFieldName, setNewFieldName] = useState('');
  const [currentStaffId, setCurrentStaffId] = useState('');

  // 고객 정보 수정 모달
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({ name: '', phone: '', email: '', memo: '', birthday: '', profileImage: '' });
  const [bdYear, setBdYear] = useState('');
  const [bdMonth, setBdMonth] = useState('');
  const [bdDay, setBdDay] = useState('');
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false);
  const profilePhotoRef = useRef<HTMLInputElement>(null);

  // 탭 드래그 스크롤
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const [tabCanScrollLeft, setTabCanScrollLeft] = useState(false);
  const [tabCanScrollRight, setTabCanScrollRight] = useState(false);
  const tabDragState = useRef({ isDown: false, startX: 0, scrollLeft: 0 });

  const checkTabScroll = () => {
    const el = tabScrollRef.current;
    if (!el) return;
    setTabCanScrollLeft(el.scrollLeft > 2);
    setTabCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  };

  useEffect(() => {
    const el = tabScrollRef.current;
    if (!el) return;
    const t = setTimeout(checkTabScroll, 200);
    el.addEventListener('scroll', checkTabScroll);
    const ro = new ResizeObserver(checkTabScroll);
    ro.observe(el);
    return () => { clearTimeout(t); el.removeEventListener('scroll', checkTabScroll); ro.disconnect(); };
  }, [customTabs, loading]);

  useEffect(() => {
    if (shopSlug && customerId) fetchData();
  }, [shopSlug, customerId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [custRes, recRes, resvRes, fieldsRes, meRes, staffRes] = await Promise.all([
        fetch(`/api/shops/${shopSlug}/customers/${customerId}`),
        fetch(`/api/shops/${shopSlug}/customers/${customerId}/records`),
        fetch(`/api/shops/${shopSlug}/reservations?customerId=${customerId}`),
        fetch(`/api/shops/${shopSlug}/settings/customer-fields`),
        fetch('/api/auth/me'),
        fetch(`/api/shops/${shopSlug}/staff`)
      ]);
      if (custRes.ok) {
        const d = await custRes.json();
        setCustomer(d);
        setCustomData(d.customData || {});
      }
      if (recRes.ok) setRecords(await recRes.json());
      if (resvRes.ok) { const d = await resvRes.json(); setReservations(d.reservations || []); }
      if (fieldsRes.ok) { const d = await fieldsRes.json(); setCustomTabs(d.fields || []); }
      // 로그인 유저 → staffId 매핑
      if (meRes.ok && staffRes.ok) {
        const me = await meRes.json();
        const staffData = await staffRes.json();
        const staffList = staffData.staff || staffData;
        const myStaff = (Array.isArray(staffList) ? staffList : []).find((s: any) => s.userId === me.id);
        if (myStaff) setCurrentStaffId(myStaff.id);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const formatPhone = (p: string) => p ? p.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') : '-';
  const formatDate = (d: string) => new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  const formatDateTime = (d: string) => new Date(d).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  const handleSaveTabData = async () => {
    try {
      const res = await fetch(`/api/shops/${shopSlug}/customers/${customerId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customData: { ...customData, ...tabForm } })
      });
      if (res.ok) { fetchData(); setEditingTabId(null); }
    } catch (e) { console.error(e); }
  };

  const handleUpdateRecord = async (recordId: string) => {
    try {
      const body: any = { skinCondition: recordForm.skinCondition, productsUsed: recordForm.productsUsed, content: recordForm.content };
      if (recordForm.managementData && Object.keys(recordForm.managementData).length > 0) {
        body.managementData = recordForm.managementData;
      }
      const res = await fetch(`/api/shops/${shopSlug}/customers/${customerId}/records/${recordId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      if (res.ok) { fetchData(); setEditingRecordId(null); }
    } catch (e) { console.error(e); }
  };

  const handleAddRecord = async () => {
    try {
      const { showPurchasePopup, nextDate, nextTime, treatmentNotes, generalNote, ...formData } = newRecordForm;
      const body: any = { ...formData };
      if (currentStaffId) body.staffId = currentStaffId;
      if (newRecordPhotos.length > 0) body.photos = newRecordPhotos;
      // 시술별 내용을 content로 합치기
      if (treatmentNotes && Object.keys(treatmentNotes).length > 0) {
        const selectedResv = reservations.find((r: any) => r.id === newRecordForm.reservationId);
        const treatments = selectedResv?.menu?.menuTreatments?.map((mt: any) => mt.treatment) || [];
        const parts: string[] = [];
        treatments.forEach((t: any) => {
          if (treatmentNotes[t.id]) {
            const tName = t.category?.name ? `${t.category.name} > ${t.name}` : t.name;
            parts.push(`[${tName}]\n${treatmentNotes[t.id]}`);
          }
        });
        if (generalNote) parts.push(`[기타]\n${generalNote}`);
        body.content = parts.join('\n\n');
      } else if (generalNote) {
        body.content = generalNote;
      }
      const res = await fetch(`/api/shops/${shopSlug}/customers/${customerId}/records`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      if (res.ok) { fetchData(); setIsAddingRecord(false); setNewRecordForm({ skinCondition: '', content: '', reservationId: '', sessionNumber: '', nextReservationDate: '' }); setNewRecordPhotos([]); }
    } catch (e) { console.error(e); }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingPhoto(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (res.ok) { const d = await res.json(); setNewRecordPhotos(prev => [...prev, { url: d.url, type }]); }
      }
    } catch (e) { console.error(e); }
    finally { setUploadingPhoto(false); e.target.value = ''; }
  };

  const openFieldsModal = () => { setEditTabs(customTabs.map(t => ({...t, fields: [...t.fields]}))); setNewTabName(''); setEditingModalTabIdx(null); setShowFieldsModal(true); };
  const addTab = () => { const n = newTabName.trim(); if (!n || editTabs.some(t => t.name === n)) return; setEditTabs([...editTabs, { name: n, sortOrder: editTabs.length, fields: [n] }]); setNewTabName(''); };
  const removeTab = (i: number) => { setEditTabs(editTabs.filter((_, j) => j !== i).map((t, j) => ({...t, sortOrder: j}))); if (editingModalTabIdx === i) setEditingModalTabIdx(null); };
  const moveTab = (i: number, dir: -1 | 1) => { const a = [...editTabs]; const t = i + dir; if (t < 0 || t >= a.length) return; [a[i], a[t]] = [a[t], a[i]]; setEditTabs(a.map((x, j) => ({...x, sortOrder: j}))); };
  const renameTab = (i: number, n: string) => { const a = [...editTabs]; a[i] = {...a[i], name: n}; setEditTabs(a); };
  const addFieldToTab = (ti: number) => { const n = newFieldName.trim(); if (!n) return; const a = [...editTabs]; if (a[ti].fields.includes(n)) return; a[ti] = {...a[ti], fields: [...a[ti].fields, n]}; setEditTabs(a); setNewFieldName(''); };
  const removeFieldFromTab = (ti: number, fi: number) => { const a = [...editTabs]; a[ti] = {...a[ti], fields: a[ti].fields.filter((_, j) => j !== fi)}; setEditTabs(a); };
  const saveTabs = async () => { try { const r = await fetch(`/api/shops/${shopSlug}/settings/customer-fields`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: editTabs }) }); if (r.ok) { setShowFieldsModal(false); fetchData(); } } catch (e) { console.error(e); } };

  const openEditProfile = () => {
    if (!customer) return;
    const bd = customer.user?.birthday ? new Date(customer.user.birthday).toISOString().split('T')[0] : '';
    const [y, m, d] = bd ? bd.split('-') : ['', '', ''];
    setBdYear(y); setBdMonth(m); setBdDay(d);
    setEditProfileForm({
      name: customer.user?.name || '',
      phone: formatPhone(customer.user?.phone || ''),
      email: customer.user?.email || '',
      memo: customer.memo || '',
      birthday: bd,
      profileImage: customer.user?.profileImage || '',
    });
    setShowEditProfile(true);
  };

  const saveEditProfile = async () => {
    try {
      const birthday = (bdYear && bdMonth && bdDay) ? `${bdYear}-${bdMonth.padStart(2,'0')}-${bdDay.padStart(2,'0')}` : null;
      const res = await fetch(`/api/shops/${shopSlug}/customers/${customerId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editProfileForm.name,
          phone: editProfileForm.phone,
          email: editProfileForm.email,
          memo: editProfileForm.memo,
          birthday,
          profileImage: editProfileForm.profileImage || null,
        }),
      });
      if (res.ok) { fetchData(); setShowEditProfile(false); }
    } catch (e) { console.error(e); }
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProfilePhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const d = await res.json();
        setEditProfileForm(prev => ({ ...prev, profileImage: d.url }));
      }
    } catch (e) { console.error(e); }
    finally { setUploadingProfilePhoto(false); e.target.value = ''; }
  };

  const gradeConfig: Record<string, { icon: any; bg: string; text: string }> = {
    'VIP': { icon: Star, bg: '#FFD700', text: '#7C5C00' },
    'Gold': { icon: Star, bg: '#F59E0B', text: '#78350F' },
    'Silver': { icon: Shield, bg: '#94A3B8', text: '#1E293B' },
    'default': { icon: User, bg: c.primaryLight, text: c.primary },
  };

  const sortedTabs = [...customTabs].sort((a, b) => a.sortOrder - b.sortOrder);

  // 구매내역: COMPLETED 상태의 예약에서 메뉴 정보 추출
  const purchaseList = reservations
    .filter((r: any) => r.status === 'COMPLETED' && r.menu)
    .map((r: any) => ({ id: r.id, menuName: r.menu?.name, price: r.menu?.price || 0, duration: r.menu?.duration || 0, date: r.startTime, staffName: r.staff?.user?.name }));

  const tabs = [
    { id: 'records', label: '\uC2DC\uC220\uCE74\uB4DC', icon: FileText, count: records.length },
    { id: 'reservations', label: '\uC608\uC57D\uC774\uB825', icon: Calendar, count: reservations.length },
    { id: 'purchases', label: '\uAD6C\uB9E4\uB0B4\uC5ED', icon: ClipboardList, count: purchaseList.length },
    ...sortedTabs.map(t => ({ id: `custom_${t.name}`, label: t.name, icon: t.fields.length === 1 ? MessageSquare : Droplets, count: undefined as number | undefined })),
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: c.primary, borderTopColor: 'transparent' }} />
        <p className="text-sm" style={{ color: c.textLight }}>Loading...</p>
      </div>
    </div>
  );
  if (!customer) return <div className="p-8 text-center text-red-500">Customer not found</div>;

  const grade = gradeConfig[customer.memberGrade] || gradeConfig['default'];
  const GradeIcon = grade.icon;

  return (
    <>
    <div className="max-w-4xl mx-auto pb-16">
      <Link href={`/${shopSlug}/customers`} className="inline-flex items-center gap-1 text-sm mb-6 hover:opacity-70 transition" style={{ color: c.textLight }}>
        <ArrowLeft className="w-4 h-4" /> {'\uACE0\uAC1D \uBAA9\uB85D'}
      </Link>

      {/* Profile Card */}
      <div className="rounded-2xl overflow-hidden shadow-sm border mb-8 cursor-pointer group transition-shadow hover:shadow-md"
        style={{ borderColor: c.borderLight }}
        onClick={openEditProfile}
      >
        <div className="h-24 relative" style={{ background: `linear-gradient(135deg, ${c.primary}20, ${c.primary}08)` }}>
          <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 80% 20%, ${c.primary}15, transparent 60%)` }} />
          {/* 수정 힌트 아이콘 */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'white', borderRadius: 8, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: c.primary, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Pencil style={{ width: 12, height: 12 }} /> 수정
          </div>
        </div>
        <div className="px-8 pb-6 -mt-10 relative">
          <div className="flex flex-col md:flex-row gap-6">
            {customer.user?.profileImage ? (
              <img src={customer.user.profileImage} alt="" className="w-20 h-20 rounded-2xl shadow-lg border-4 border-white"
                style={{ objectFit: 'cover' }} />
            ) : (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg border-4 border-white"
                style={{ backgroundColor: c.primary, color: c.textOnPrimary }}>
                {customer.user?.name?.charAt(0) || '\uACE0'}
              </div>
            )}
            <div className="flex-1 pt-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold" style={{ color: c.text }}>{customer.user?.name}</h2>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ backgroundColor: grade.bg + '20', color: grade.text }}>
                  <GradeIcon className="w-3 h-3" />
                  {customer.memberGrade || '\uC77C\uBC18'}
                </span>
                {sortedTabs.length > 0 && sortedTabs[0]?.fields?.[0] && customData[sortedTabs[0].fields[0]] && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: c.primaryLight, color: c.primary }}>
                    <Droplets className="w-3 h-3" />
                    {customData[sortedTabs[0].fields[0]]}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-sm" style={{ color: c.textLight }}>
                  <Phone className="w-3.5 h-3.5" /> {formatPhone(customer.user?.phone)}
                </span>
                {customer.user?.email && (
                  <span className="inline-flex items-center gap-1.5 text-sm" style={{ color: c.textLight }}>
                    <Mail className="w-3.5 h-3.5" /> {customer.user.email}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-sm" style={{ color: c.textLight }}>
                  <Clock className="w-3.5 h-3.5" /> {formatDate(customer.createdAt)} {'\uAC00\uC785'}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { label: '\uCD1D \uBC29\uBB38', value: `${customer.visitCount || 0}\uD68C`, color: c.primary },
              { label: '\uC2DC\uC220 \uAE30\uB85D', value: `${records.length}\uAC74`, color: '#F59E0B' },
              { label: '\uCD1D \uACB0\uC81C', value: `${(customer.totalSpent || 0).toLocaleString()}\uC6D0`, color: '#10B981' },
            ].map((stat, i) => (
              <div key={i} className="rounded-xl p-4 text-center" style={{ backgroundColor: stat.color + '08', border: `1px solid ${stat.color}15` }}>
                <div className="text-xs font-medium mb-1" style={{ color: stat.color }}>{stat.label}</div>
                <div className="text-xl font-bold" style={{ color: c.text }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        {/* 왼쪽 화살표 */}
        {tabCanScrollLeft && (
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 36, zIndex: 2,
            background: `linear-gradient(to right, ${c.surface} 60%, transparent)`,
            display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
          }}>
            <button onClick={() => { const el = tabScrollRef.current; if (el) el.scrollBy({ left: -120, behavior: 'smooth' }); }}
              style={{
                width: 28, height: 28, borderRadius: '50%', border: `1px solid ${c.borderLight}`,
                background: c.surface, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              }}>
              <ChevronLeft style={{ width: 14, height: 14, color: c.primary }} />
            </button>
          </div>
        )}
        {/* 오른쪽 화살표 */}
        {tabCanScrollRight && (
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 36, zIndex: 2,
            background: `linear-gradient(to left, ${c.surface} 60%, transparent)`,
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          }}>
            <button onClick={() => { const el = tabScrollRef.current; if (el) el.scrollBy({ left: 120, behavior: 'smooth' }); }}
              style={{
                width: 28, height: 28, borderRadius: '50%', border: `1px solid ${c.borderLight}`,
                background: c.surface, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              }}>
              <ChevronRight style={{ width: 14, height: 14, color: c.primary }} />
            </button>
          </div>
        )}
        <div
          ref={tabScrollRef}
          className="flex gap-2 bm-tab-scroll"
          style={{
            overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
            cursor: tabDragState.current.isDown ? 'grabbing' : 'grab',
            userSelect: 'none', paddingBottom: 1,
          }}
          onMouseDown={e => {
            const el = tabScrollRef.current;
            if (!el) return;
            tabDragState.current = { isDown: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
          }}
          onMouseLeave={() => { tabDragState.current.isDown = false; }}
          onMouseUp={() => { tabDragState.current.isDown = false; }}
          onMouseMove={e => {
            if (!tabDragState.current.isDown) return;
            e.preventDefault();
            const el = tabScrollRef.current;
            if (!el) return;
            const x = e.pageX - el.offsetLeft;
            el.scrollLeft = tabDragState.current.scrollLeft - (x - tabDragState.current.startX);
          }}
        >
          <style>{`.bm-tab-scroll::-webkit-scrollbar { display:none!important; width:0!important; }`}</style>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
                style={{ backgroundColor: isActive ? c.primary : 'transparent', color: isActive ? c.textOnPrimary : c.textLight, border: isActive ? 'none' : `1px solid ${c.borderLight}`, flexShrink: 0 }}>
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-md text-xs font-bold"
                    style={{ backgroundColor: isActive ? 'rgba(255,255,255,.2)' : c.primaryLight, color: isActive ? c.textOnPrimary : c.primary }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
          <button onClick={openFieldsModal} className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs whitespace-nowrap transition-all"
            style={{ color: c.textLight, border: `1px dashed ${c.borderLight}`, flexShrink: 0 }}>
            <Settings className="w-3.5 h-3.5" /> {'\uD0ED \uAD00\uB9AC'}
          </button>
        </div>
      </div>

      {/* Tab 1: Records */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold" style={{ color: c.text }}>
              <Sparkles className="w-5 h-5 inline mr-2" style={{ color: c.primary }} />{'\uC2DC\uC220 \uAE30\uB85D'}
            </h3>
            <button onClick={() => setIsAddingRecord(!isAddingRecord)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ backgroundColor: isAddingRecord ? c.borderLight : c.primary, color: isAddingRecord ? c.text : c.textOnPrimary }}>
              {isAddingRecord ? '\uCDE8\uC18C' : <><Plus className="w-4 h-4" /> {'\uC218\uB3D9 \uAE30\uB85D'}</>}
            </button>
          </div>

          {isAddingRecord && (
            <div className="rounded-2xl p-6 space-y-4" style={{ backgroundColor: c.primaryLight + '40', border: `2px dashed ${c.primary}30` }}>
              <h4 className="font-semibold" style={{ color: c.primary }}>{'\uC0C8 \uC2DC\uC220 \uAE30\uB85D'}</h4>

              {/* 구매상품 선택 */}
              {(() => {
                // 회차 남은 상품 계산
                const purchasesWithRemaining = reservations
                  .filter((r: any) => (r.status === 'COMPLETED' || r.status === 'IN_PROGRESS') && r.menu)
                  .map((r: any) => {
                    const totalSessions = r.menu?.sessions || 1;
                    const usedSessions = records.filter((rec: any) => rec.reservation?.menuId === r.menuId).length;
                    return { ...r, totalSessions, usedSessions, remaining: totalSessions - usedSessions };
                  })
                  .filter((r: any) => r.remaining > 0);

                const selectedResv = reservations.find((r: any) => r.id === newRecordForm.reservationId);

                // 1개면 자동 선택
                if (purchasesWithRemaining.length === 1 && !newRecordForm.reservationId) {
                  const auto = purchasesWithRemaining[0];
                  setTimeout(() => {
                    const usedCount = records.filter((rec: any) => rec.reservation?.menuId === auto.menuId).length;
                    setNewRecordForm((prev: any) => ({ ...prev, reservationId: auto.id, sessionNumber: String(usedCount + 1) }));
                  }, 0);
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="text-xs font-medium block mb-1.5" style={{ color: c.textLight }}><Package className="w-3 h-3 inline mr-1" />{'\uAD6C\uB9E4\uC0C1\uD488'}</label>
                      <div
                        onDoubleClick={() => { if (purchasesWithRemaining.length >= 2) setNewRecordForm({...newRecordForm, showPurchasePopup: true }); }}
                        className="w-full h-9 px-3 rounded-xl border text-sm flex items-center justify-between cursor-pointer"
                        style={{ borderColor: c.borderLight, color: selectedResv ? c.text : c.textLight, background: '#fff' }}>
                        <span className="truncate">
                          {selectedResv ? (
                            <>{selectedResv.menu?.name} <span className="text-[10px] ml-1" style={{ color: c.primary }}>({records.filter((rec: any) => rec.reservation?.menuId === selectedResv.menuId).length + 1}/{selectedResv.menu?.sessions || 1}{'\uD68C'})</span></>
                          ) : purchasesWithRemaining.length === 0 ? '\uD68C\uCC28 \uB0A8\uC740 \uC0C1\uD488 \uC5C6\uC74C' : '\uB354\uBE14\uD074\uB9AD\uC73C\uB85C \uC0C1\uD488 \uC120\uD0DD'}
                        </span>
                        {purchasesWithRemaining.length >= 2 && <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ backgroundColor: c.primaryLight, color: c.primary }}>{purchasesWithRemaining.length}{'\uAC74'}</span>}
                      </div>

                      {/* 구매상품 선택 팝업 */}
                      {newRecordForm.showPurchasePopup && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)' }} onClick={() => setNewRecordForm({...newRecordForm, showPurchasePopup: false})}>
                          <div className="rounded-2xl p-5 w-full max-w-md shadow-2xl" style={{ background: c.surface, border: `1px solid ${c.borderLight}` }} onClick={e => e.stopPropagation()}>
                            <h3 className="text-sm font-bold mb-3" style={{ color: c.text }}>{'\uAD6C\uB9E4\uC0C1\uD488 \uC120\uD0DD'} <span className="text-xs font-normal" style={{ color: c.textLight }}>({'\uD68C\uCC28 \uB0A8\uC740 \uC0C1\uD488\uB9CC \uD45C\uC2DC'})</span></h3>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                              {purchasesWithRemaining.map((r: any) => {
                                const used = records.filter((rec: any) => rec.reservation?.menuId === r.menuId).length;
                                const isSelected = newRecordForm.reservationId === r.id;
                                return (
                                  <div key={r.id}
                                    onDoubleClick={() => {
                                      setNewRecordForm({...newRecordForm, reservationId: r.id, sessionNumber: String(used + 1), showPurchasePopup: false});
                                    }}
                                    className="p-3 rounded-xl border cursor-pointer transition-all"
                                    style={{
                                      borderColor: isSelected ? c.primary : c.borderLight,
                                      background: isSelected ? c.primaryLight + '60' : '#fff',
                                      boxShadow: isSelected ? `0 0 0 2px ${c.primary}30` : 'none'
                                    }}
                                    onMouseEnter={e => { if(!isSelected) e.currentTarget.style.background = c.primaryLight + '30'; }}
                                    onMouseLeave={e => { if(!isSelected) e.currentTarget.style.background = isSelected ? c.primaryLight + '60' : '#fff'; }}>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium" style={{ color: c.text }}>{r.menu?.name}</span>
                                      <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8' }}>
                                        {used}/{r.totalSessions}{'\uD68C'} ({r.remaining}{'\uD68C \uB0A8\uC74C'})
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-[11px]" style={{ color: c.textLight }}>
                                      <span>{formatDate(r.startTime)}</span>
                                      <span>{'\u00B7'}</span>
                                      <span>{r.menu?.price?.toLocaleString()}{'\uC6D0'}</span>
                                      <span>{'\u00B7'}</span>
                                      <span>{r.menu?.duration}{'\uBD84'}</span>
                                    </div>
                                    <p className="text-[10px] mt-1 font-medium" style={{ color: c.primary }}>{'\uB354\uBE14\uD074\uB9AD\uC73C\uB85C \uC120\uD0DD'}</p>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="flex justify-end mt-3">
                              <button onClick={() => setNewRecordForm({...newRecordForm, showPurchasePopup: false})}
                                className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ border: `1px solid ${c.borderLight}`, color: c.textLight }}>{'\uB2EB\uAE30'}</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-xs font-medium block mb-1.5" style={{ color: c.textLight }}>{'\uD68C\uCC28'}</label>
                    <div className="flex items-center gap-1">
                      <Input type="number" value={newRecordForm.sessionNumber} onChange={e => setNewRecordForm({...newRecordForm, sessionNumber: e.target.value})} placeholder="1" className="rounded-xl" />
                      {(() => { const resv = reservations.find((r: any) => r.id === newRecordForm.reservationId); const total = resv?.menu?.sessions; return total ? <span className="text-xs shrink-0" style={{ color: c.textLight }}>/ {total}{'\uD68C'}</span> : null; })()}
                    </div></div>
                  <div style={{ position: 'relative' }}><label className="text-xs font-medium block mb-1.5 whitespace-nowrap text-center" style={{ color: c.textLight }}>{'\uB2E4\uC74C\uC608\uC57D \uB0A0\uC9DC'}</label>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => {
                        if (!newRecordForm.nextDate) return;
                        const d = new Date(newRecordForm.nextDate); d.setDate(d.getDate() - 1);
                        const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                        setNewRecordForm({...newRecordForm, nextDate: ds, nextReservationDate: ds && newRecordForm.nextTime ? `${ds}T${newRecordForm.nextTime}` : ''});
                      }} className="shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center text-sm font-bold hover:opacity-70" style={{ borderColor: c.borderLight, color: c.textLight }}>{'\u2212'}</button>
                      <div onClick={() => { setShowNextDatePicker(!showNextDatePicker); setShowNextTimePicker(false); }}
                        className="flex-1 h-9 px-2 rounded-xl border text-xs flex items-center justify-center cursor-pointer whitespace-nowrap" style={{ borderColor: c.borderLight, color: c.text }}>
                        {newRecordForm.nextDate || '\uB0A0\uC9DC \uC120\uD0DD'}
                      </div>
                      <button type="button" onClick={() => {
                        const d = newRecordForm.nextDate ? new Date(newRecordForm.nextDate) : new Date(); d.setDate(d.getDate() + 1);
                        const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                        setNewRecordForm({...newRecordForm, nextDate: ds, nextReservationDate: ds && newRecordForm.nextTime ? `${ds}T${newRecordForm.nextTime}` : ''});
                      }} className="shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center text-sm font-bold hover:opacity-70" style={{ borderColor: c.borderLight, color: c.textLight }}>+</button>
                    </div>
                    {showNextDatePicker && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 50, marginTop: 4 }}>
                        <DatePicker inline value={newRecordForm.nextDate || ''} onChange={(d) => {
                          const ds = typeof d === 'string' ? d : '';
                          setNewRecordForm({...newRecordForm, nextDate: ds, nextReservationDate: ds && newRecordForm.nextTime ? `${ds}T${newRecordForm.nextTime}` : ''});
                          setShowNextDatePicker(false);
                        }} />
                      </div>
                    )}</div>
                  <div style={{ position: 'relative' }}><label className="text-xs font-medium block mb-1.5 whitespace-nowrap text-center" style={{ color: c.textLight }}>{'\uB2E4\uC74C\uC608\uC57D \uC2DC\uAC04'}</label>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => {
                        if (!newRecordForm.nextTime) return;
                        const [hh,mm] = newRecordForm.nextTime.split(':').map(Number);
                        let t = hh*60+mm-10; if (t<0) t=0;
                        const ts = `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
                        setNewRecordForm({...newRecordForm, nextTime: ts, nextReservationDate: newRecordForm.nextDate && ts ? `${newRecordForm.nextDate}T${ts}` : ''});
                      }} className="shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center text-sm font-bold hover:opacity-70" style={{ borderColor: c.borderLight, color: c.textLight }}>{'\u2212'}</button>
                      <div onClick={() => { setShowNextTimePicker(!showNextTimePicker); setShowNextDatePicker(false); }}
                        className="flex-1 h-9 px-2 rounded-xl border text-xs flex items-center justify-center cursor-pointer whitespace-nowrap" style={{ borderColor: c.borderLight, color: c.text }}>
                        {newRecordForm.nextTime ? (() => { const h = parseInt(newRecordForm.nextTime.split(':')[0]); const m = newRecordForm.nextTime.split(':')[1]; return `${h>=12?'\uC624\uD6C4':'\uC624\uC804'} ${h>12?h-12:h===0?12:h}:${m}`; })() : '\uC2DC\uAC04 \uC120\uD0DD'}
                      </div>
                      <button type="button" onClick={() => {
                        const [hh,mm] = newRecordForm.nextTime ? newRecordForm.nextTime.split(':').map(Number) : [10,0];
                        let t = hh*60+mm+10; if(t>23*60+50) t=23*60+50;
                        const ts = `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
                        setNewRecordForm({...newRecordForm, nextTime: ts, nextReservationDate: newRecordForm.nextDate && ts ? `${newRecordForm.nextDate}T${ts}` : ''});
                      }} className="shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center text-sm font-bold hover:opacity-70" style={{ borderColor: c.borderLight, color: c.textLight }}>+</button>
                    </div>
                    {showNextTimePicker && (
                      <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 50, marginTop: 4 }}>
                        <div className="rounded-2xl border p-3 shadow-xl" style={{ background: c.surface, borderColor: c.borderLight, width: 260 }}>
                          <div className="flex gap-1 mb-3 p-1 rounded-lg" style={{ background: c.primaryLight + '40' }}>
                            {(['AM','PM'] as const).map(p => (
                              <button key={p} type="button" onClick={() => setNextTimePeriod(p)}
                                className="flex-1 py-1.5 rounded-md text-xs font-semibold" style={{ border: 'none', cursor: 'pointer', background: nextTimePeriod===p ? c.primary : 'transparent', color: nextTimePeriod===p ? c.textOnPrimary : c.textLight }}>
                                {p==='AM'?'\uC624\uC804':'\uC624\uD6C4'}
                              </button>
                            ))}
                          </div>
                          <div className="grid grid-cols-4 gap-1">
                            {nextTimeSlots.filter(t => { const h=parseInt(t); return nextTimePeriod==='AM'?h<12:h>=12; }).map(t => {
                              const h=parseInt(t.split(':')[0]), m=t.split(':')[1];
                              const label = `${h>12?h-12:h===0?12:h}:${m}`;
                              const sel = newRecordForm.nextTime===t;
                              return (
                                <button key={t} type="button" onClick={() => {
                                  setNewRecordForm({...newRecordForm, nextTime: t, nextReservationDate: newRecordForm.nextDate ? `${newRecordForm.nextDate}T${t}` : ''});
                                  setShowNextTimePicker(false);
                                }} className="py-1.5 rounded-md text-[11px]" style={{ border: 'none', cursor: 'pointer', fontWeight: sel?700:400, background: sel?c.primary:'transparent', color: sel?c.textOnPrimary:c.text }}
                                  onMouseEnter={e => { if(!sel) e.currentTarget.style.background=c.primaryLight; }}
                                  onMouseLeave={e => { if(!sel) e.currentTarget.style.background='transparent'; }}>
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}</div>
                </div>
              </div>
              )})()}

              {/* 고객상태 */}
              <div><label className="text-xs font-medium block mb-1.5" style={{ color: c.textLight }}>{'\uACE0\uAC1D\uC0C1\uD0DC'}</label>
                <Input value={newRecordForm.skinCondition} onChange={e => setNewRecordForm({...newRecordForm, skinCondition: e.target.value})} placeholder={'\uC608: \uAC74\uC870\uD568, \uBBFC\uAC10\uC131, T\uC874 \uC720\uBD84 \uB4F1 \uACE0\uAC1D \uC0C1\uD0DC \uAE30\uB85D'} className="rounded-xl" /></div>

              {/* 상세시술별 시술내용 */}
              {(() => {
                const selectedResv = reservations.find((r: any) => r.id === newRecordForm.reservationId);
                const treatments = selectedResv?.menu?.menuTreatments?.map((mt: any) => mt.treatment) || [];
                if (treatments.length === 0 && !selectedResv) return (
                  <div><label className="text-xs font-medium block mb-1.5" style={{ color: c.textLight }}>{'\uC2DC\uC220 \uB0B4\uC6A9'}</label>
                    <Textarea value={newRecordForm.content} onChange={e => setNewRecordForm({...newRecordForm, content: e.target.value})} placeholder={'\uC2DC\uC220 \uACB0\uACFC, \uD2B9\uC774\uC0AC\uD56D \uB4F1 \uAC04\uB2E8 \uBA54\uBAA8...'} rows={2} className="rounded-xl" /></div>
                );
                const notes = newRecordForm.treatmentNotes || {};
                return (
                  <div className="space-y-3">
                    <label className="text-xs font-medium block" style={{ color: c.textLight }}><Sparkles className="w-3 h-3 inline mr-1" />{'\uC0C1\uC138\uC2DC\uC220 \uB0B4\uC6A9'}</label>
                    {treatments.map((t: any) => {
                      const tName = t.category?.name ? `${t.category.name} > ${t.name}` : t.name;
                      return (
                        <div key={t.id} className="rounded-xl p-3" style={{ backgroundColor: '#fff', border: `1px solid ${c.borderLight}` }}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold" style={{ backgroundColor: c.primaryLight, color: c.primary }}>{tName}</span>
                          </div>
                          <Textarea
                            value={notes[t.id] || ''}
                            onChange={e => setNewRecordForm({...newRecordForm, treatmentNotes: {...notes, [t.id]: e.target.value}})}
                            placeholder={`${t.name} \uC2DC\uC220 \uB0B4\uC6A9...`}
                            rows={1} className="rounded-lg text-sm" />
                        </div>
                      );
                    })}
                    <div><label className="text-xs font-medium block mb-1.5" style={{ color: c.textLight }}>{'\uAE30\uD0C0 \uBA54\uBAA8'}</label>
                      <Input value={newRecordForm.generalNote || ''} onChange={e => setNewRecordForm({...newRecordForm, generalNote: e.target.value})} placeholder={'\uCD94\uAC00 \uD2B9\uC774\uC0AC\uD56D...'} className="rounded-xl" /></div>
                  </div>
                );
              })()}

              {/* 사진 등록 */}
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: c.textLight }}><Camera className="w-3 h-3 inline mr-1" />{'\uC0AC\uC9C4 \uB4F1\uB85D'}</label>
                <div className="flex flex-wrap gap-2">
                  {newRecordPhotos.map((p, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border" style={{ borderColor: c.borderLight }}>
                      <img src={p.url} alt={p.type} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 inset-x-0 py-0.5 text-center text-[9px] font-bold text-white" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,.6))' }}>{p.type}</div>
                      <button onClick={() => setNewRecordPhotos(prev => prev.filter((_, j) => j !== i))} className="absolute top-0.5 right-0.5 bg-white/80 rounded-full p-0.5"><X className="w-3 h-3 text-red-500" /></button>
                    </div>
                  ))}
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-black/3 transition" style={{ borderColor: c.borderLight }}>
                    <ImagePlus className="w-5 h-5 mb-0.5" style={{ color: c.textLight }} />
                    <span className="text-[9px]" style={{ color: c.textLight }}>BEFORE</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={e => handlePhotoUpload(e, 'BEFORE')} />
                  </label>
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-black/3 transition" style={{ borderColor: c.borderLight }}>
                    <ImagePlus className="w-5 h-5 mb-0.5" style={{ color: c.textLight }} />
                    <span className="text-[9px]" style={{ color: c.textLight }}>AFTER</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={e => handlePhotoUpload(e, 'AFTER')} />
                  </label>
                  {uploadingPhoto && <div className="w-20 h-20 rounded-xl flex items-center justify-center" style={{ backgroundColor: c.primaryLight + '30' }}>
                    <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: c.primary, borderTopColor: 'transparent' }} />
                  </div>}
                </div>
              </div>

              {/* 이전 시술 기록 */}
              <div>
                <label className="text-xs font-medium block mb-2" style={{ color: c.textLight }}>
                  <FileText className="w-3 h-3 inline mr-1" />{'\uC774\uC804 \uC2DC\uC220 \uAE30\uB85D'} <span className="opacity-60">({records.length})</span>
                </label>
                {records.length > 0 ? (
                  <div className="rounded-xl border overflow-hidden" style={{ borderColor: c.borderLight, backgroundColor: '#fff' }}>
                    <div className="max-h-[200px] overflow-y-auto divide-y" style={{ borderColor: c.borderLight }}>
                      {records.map((rec: any) => {
                        const mName = rec.reservation?.menu?.name || '\uC218\uB3D9 \uAE30\uB85D';
                        return (
                          <div key={rec.id} className="px-4 py-3 hover:bg-black/[.02] transition">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium" style={{ color: c.text }}>{mName}</span>
                              {rec.sessionNumber && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8' }}>
                                  {rec.sessionNumber}{rec.reservation?.menu?.sessions ? `/${rec.reservation.menu.sessions}` : ''}{'\uD68C\uCC28'}
                                </span>
                              )}
                              <span className="text-[10px] ml-auto" style={{ color: c.textLight }}>{formatDate(rec.createdAt)}</span>
                            </div>
                            {(rec.content || rec.skinCondition) && (
                              <div className="text-[11px] mt-1 line-clamp-1" style={{ color: c.textLight }}>
                                {rec.skinCondition && <span>{'\uACE0\uAC1D\uC0C1\uD0DC'}: {rec.skinCondition}</span>}
                                {rec.skinCondition && rec.content && ' \u00B7 '}
                                {rec.content}
                              </div>
                            )}
                            {rec.photos && rec.photos.length > 0 && (
                              <div className="flex gap-1 mt-1.5">
                                {rec.photos.slice(0, 4).map((p: any) => (
                                  <div key={p.id} className="w-10 h-10 rounded-lg overflow-hidden border" style={{ borderColor: c.borderLight }}>
                                    <img src={p.url} alt={p.type} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                                {rec.photos.length > 4 && <span className="text-[10px] self-end" style={{ color: c.textLight }}>+{rec.photos.length - 4}</span>}
                              </div>
                            )}
                            {rec.nextReservationDate && (
                              <div className="text-[10px] mt-1 font-medium" style={{ color: '#7C3AED' }}>{'\uB2E4\uC74C\uC608\uC57D'}: {formatDateTime(rec.nextReservationDate)}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border p-4 text-center" style={{ borderColor: c.borderLight, backgroundColor: '#fff' }}>
                    <p className="text-xs" style={{ color: c.textLight }}>{'\uC774\uC804 \uC2DC\uC220 \uAE30\uB85D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4'}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setIsAddingRecord(false); setNewRecordPhotos([]); }} className="rounded-xl">{'\uCDE8\uC18C'}</Button>
                <button onClick={handleAddRecord} className="px-5 py-2 rounded-xl text-sm font-medium" style={{ backgroundColor: c.primary, color: c.textOnPrimary }}>{'\uC800\uC7A5'}</button>
              </div>
            </div>
          )}

          {records.length > 0 ? records.map((record, idx) => {
            const isExpanded = expandedRecordId === record.id;
            const isEditing = editingRecordId === record.id;
            const menuName = record.reservation?.menu?.name || '\uC218\uB3D9 \uAE30\uB85D';
            const staffName = record.staff?.user?.name || '\uBBF8\uC9C0\uC815';
            const content = record.content || '';
            const isAuto = !!record.reservationId;
            const statusText = content === '\uC608\uC57D \uCDE8\uC18C' ? '\uCDE8\uC18C' : content === '\uB2F9\uC77C \uB178\uC1FC' ? '\uB178\uC1FC' : content === '\uC2DC\uC220 \uC644\uB8CC' ? '\uC644\uB8CC' : '';

            return (
              <div key={record.id} className="rounded-2xl overflow-hidden transition-all"
                style={{ border: `1px solid ${isExpanded ? c.primary + '40' : c.borderLight}`, boxShadow: isExpanded ? `0 4px 20px ${c.primary}10` : 'none' }}>
                <div className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-black/[.02] transition"
                  onClick={() => { if (!isEditing) setExpandedRecordId(isExpanded ? null : record.id); }}>
                  <div className="flex flex-col items-center gap-1 mr-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusText === '\uCDE8\uC18C' ? '#EF4444' : statusText === '\uB178\uC1FC' ? '#F59E0B' : c.primary }} />
                    {idx < records.length - 1 && <div className="w-0.5 h-6" style={{ backgroundColor: c.borderLight }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: c.text }}>{menuName}</span>
                      {statusText && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                          style={{ backgroundColor: statusText === '\uCDE8\uC18C' ? '#FEE2E2' : statusText === '\uB178\uC1FC' ? '#FEF3C7' : '#D1FAE5', color: statusText === '\uCDE8\uC18C' ? '#DC2626' : statusText === '\uB178\uC1FC' ? '#D97706' : '#059669' }}>
                          {statusText}
                        </span>
                      )}
                      {record.sessionNumber && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold" style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8' }}>
                          {record.sessionNumber}{record.reservation?.menu?.sessions ? `/${record.reservation.menu.sessions}` : ''}{'\uD68C\uCC28'}
                        </span>
                      )}
                      {isAuto && <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ backgroundColor: c.primaryLight, color: c.primary }}>{'\uC790\uB3D9'}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: c.textLight }}>
                      <span>{formatDate(record.createdAt)}</span><span>{'\u00B7'}</span><span>{'\uB2F4\uB2F9'}: {staffName}</span>
                      {record.nextReservationDate && (
                        <><span>{'\u00B7'}</span><span className="font-medium" style={{ color: '#7C3AED' }}>{'\uB2E4\uC74C\uC608\uC57D'}: {formatDateTime(record.nextReservationDate)}</span></>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {isExpanded ? <ChevronUp className="w-5 h-5" style={{ color: c.textLight }} /> : <ChevronDown className="w-5 h-5" style={{ color: c.textLight }} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t" style={{ borderColor: c.borderLight, backgroundColor: c.primaryLight + '15' }}>
                    {isEditing ? (
                      <div className="space-y-4 mt-3">
                        <div><label className="text-xs font-medium block mb-1.5" style={{ color: c.textLight }}>{'\uACE0\uAC1D\uC0C1\uD0DC'}</label>
                          <Input value={recordForm.skinCondition} onChange={e => setRecordForm({...recordForm, skinCondition: e.target.value})} placeholder={'\uC608: \uAC74\uC870\uD568, \uBBFC\uAC10\uC131, T\uC874 \uC720\uBD84'} className="rounded-xl" /></div>
                        {record.reservation?.menu?.menuTreatments?.length > 0 ? (
                          <div className="space-y-3">
                            <label className="text-xs font-medium block" style={{ color: c.textLight }}><Sparkles className="w-3 h-3 inline mr-1" />{'\uC0C1\uC138\uC2DC\uC220 \uB0B4\uC6A9'}</label>
                            {record.reservation.menu.menuTreatments.map((mt: any) => {
                              const t = mt.treatment;
                              const tName = t?.category?.name ? `${t.category.name} > ${t.name}` : t?.name || '';
                              // content에서 해당 시술 내용 파싱
                              const contentStr = recordForm.content || '';
                              const regex = new RegExp(`\\[${tName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\n?([\\s\\S]*?)(?=\\n\\[|$)`);
                              const match = contentStr.match(regex);
                              const tNote = match ? match[1].trim() : '';
                              return (
                                <div key={t?.id || mt.id} className="rounded-xl p-3" style={{ backgroundColor: '#fff', border: `1px solid ${c.borderLight}` }}>
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold mb-1.5 inline-block" style={{ backgroundColor: c.primaryLight, color: c.primary }}>{tName}</span>
                                  <Textarea value={tNote} onChange={e => {
                                    const newContent = contentStr.includes(`[${tName}]`)
                                      ? contentStr.replace(regex, `[${tName}]\n${e.target.value}`)
                                      : (contentStr ? contentStr + `\n\n[${tName}]\n${e.target.value}` : `[${tName}]\n${e.target.value}`);
                                    setRecordForm({...recordForm, content: newContent});
                                  }} placeholder={`${t?.name} \uC2DC\uC220 \uB0B4\uC6A9...`} rows={1} className="rounded-lg text-sm" />
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div><label className="text-xs font-medium block mb-1.5" style={{ color: c.textLight }}>{'\uC2DC\uC220 \uB0B4\uC6A9'}</label>
                            <Textarea value={recordForm.content} onChange={e => setRecordForm({...recordForm, content: e.target.value})} placeholder={'\uC2DC\uC220 \uACB0\uACFC, \uD2B9\uC774\uC0AC\uD56D \uB4F1 \uAC04\uB2E8 \uBA54\uBAA8...'} rows={2} className="rounded-xl" /></div>
                        )}
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingRecordId(null)} className="rounded-xl">{'\uCDE8\uC18C'}</Button>
                          <button onClick={() => handleUpdateRecord(record.id)} className="px-4 py-1.5 rounded-xl text-sm font-medium" style={{ backgroundColor: c.primary, color: c.textOnPrimary }}>{'\uC800\uC7A5'}</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 mt-3 relative">
                        <button className="absolute top-0 right-0 p-1.5 rounded-lg hover:bg-white transition" style={{ color: c.textLight }}
                          onClick={e => { e.stopPropagation(); setRecordForm({ skinCondition: record.skinCondition || '', productsUsed: record.productsUsed || '', content: record.content || '', managementData: record.managementData || {} }); setEditingRecordId(record.id); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <div className="grid grid-cols-1 gap-3 pr-8">
                          {record.skinCondition && (
                            <div className="rounded-xl p-3" style={{ backgroundColor: 'white', border: `1px solid ${c.borderLight}` }}>
                              <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: c.primary }}>{'\uACE0\uAC1D\uC0C1\uD0DC'}</div>
                              <div className="text-sm" style={{ color: c.text }}>{record.skinCondition}</div>
                            </div>
                          )}
                          {record.reservation?.menu?.menuTreatments?.length > 0 && (
                            <div className="rounded-xl p-3" style={{ backgroundColor: 'white', border: `1px solid ${c.borderLight}` }}>
                              <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: c.primary }}>{'\uC0C1\uC138\uC2DC\uC220'}</div>
                              <div className="flex flex-wrap gap-1.5">
                                {record.reservation.menu.menuTreatments.map((mt: any) => (
                                  <span key={mt.treatment?.id || mt.id} className="px-2 py-0.5 rounded-md text-[11px] font-medium" style={{ backgroundColor: c.primaryLight, color: c.primary }}>
                                    {mt.treatment?.category?.name ? `${mt.treatment.category.name} > ` : ''}{mt.treatment?.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {record.content && !['\uC2DC\uC220 \uC644\uB8CC','\uC608\uC57D \uCDE8\uC18C','\uB2F9\uC77C \uB178\uC1FC'].includes(record.content) && (
                            <div className="rounded-xl p-3" style={{ backgroundColor: 'white', border: `1px solid ${c.borderLight}` }}>
                              <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: c.primary }}>{'\uC2DC\uC220 \uB0B4\uC6A9'}</div>
                              <div className="text-sm whitespace-pre-wrap" style={{ color: c.text }}>{record.content}</div>
                            </div>
                          )}
                        </div>
                        {/* Management Data */}
                        {record.managementData && Object.keys(record.managementData).length > 0 && (
                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#F59E0B' }}>{'\uAD00\uB9AC\uD56D\uBAA9'}</div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {Object.entries(record.managementData).map(([key, val]) => (
                                <div key={key} className="rounded-lg p-2.5" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}>
                                  <div className="text-[10px] font-semibold mb-0.5" style={{ color: '#D97706' }}>{key}</div>
                                  <div className="text-sm font-medium" style={{ color: '#92400E' }}>{val as string || '-'}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {record.photos?.length > 0 && (
                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: c.primary }}>{'\uC804\uD6C4 \uC0AC\uC9C4'}</div>
                            <div className="flex gap-3">
                              {record.photos.map((photo: any) => (
                                <div key={photo.id} className="relative w-24 h-24 rounded-xl overflow-hidden shadow-sm border" style={{ borderColor: c.borderLight }}>
                                  <img src={photo.url} alt={photo.type} className="object-cover w-full h-full" />
                                  <div className="absolute bottom-0 inset-x-0 py-0.5 text-center text-[10px] font-bold text-white" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,.6))' }}>
                                    {photo.type === 'BEFORE' ? 'BEFORE' : 'AFTER'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: c.primaryLight + '20' }}>
              <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: c.borderLight }} />
              <p className="text-sm" style={{ color: c.textLight }}>{'\uC2DC\uC220 \uAE30\uB85D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4'}</p>
              <p className="text-xs mt-1" style={{ color: c.textLight }}>{'\uC608\uC57D\uC774 \uC644\uB8CC\uB418\uBA74 \uC790\uB3D9\uC73C\uB85C \uAE30\uB85D\uB429\uB2C8\uB2E4'}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Reservations */}
      {activeTab === 'reservations' && (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${c.borderLight}` }}>
          {reservations.length > 0 ? reservations.map((res, idx) => {
            const statusColor = getStatusColor(res.status);
            const statusLabel = getStatusLabel(res.status);
            return (
              <div key={res.id} className="px-5 py-4 flex items-center justify-between transition hover:bg-black/[.02]"
                style={{ borderBottom: idx < reservations.length - 1 ? `1px solid ${c.borderLight}` : 'none' }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: statusColor + '15' }}>
                    <Calendar className="w-4 h-4" style={{ color: statusColor }} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: c.text }}>{formatDateTime(res.startTime)}</div>
                    <div className="text-xs mt-0.5" style={{ color: c.textLight }}>{res.menu?.name || '\uBA54\uB274\uC5C6\uC74C'} {'\u00B7'} {'\uB2F4\uB2F9'}: {res.staff?.user?.name || '\uBBF8\uC9C0\uC815'}</div>
                  </div>
                </div>
                <Badge variant="outline" className="rounded-lg text-xs font-semibold"
                  style={{ borderColor: statusColor, color: statusColor, backgroundColor: statusColor + '10' }}>
                  {statusLabel}
                </Badge>
              </div>
            );
          }) : (
            <div className="text-center py-16">
              <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: c.borderLight }} />
              <p className="text-sm" style={{ color: c.textLight }}>{'\uC608\uC57D \uB0B4\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4'}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Purchases */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold" style={{ color: c.text }}>
            <ClipboardList className="w-5 h-5 inline mr-2" style={{ color: c.primary }} />{'\uAD6C\uB9E4\uB0B4\uC5ED'}
          </h3>

          {purchaseList.length > 0 ? (
            <>
              {/* 요약 */}
              <div className="rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <span className="text-sm font-medium" style={{ color: '#166534' }}>{'\uCD1D'} {purchaseList.length}{'\uAC74 \uAD6C\uB9E4'}</span>
                <span className="text-lg font-bold" style={{ color: '#166534' }}>{'\u20A9'}{purchaseList.reduce((s, p) => s + p.price, 0).toLocaleString()}</span>
              </div>

              {/* 리스트 */}
              <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${c.borderLight}` }}>
                {purchaseList.map((p, idx) => (
                  <div key={p.id} className="px-5 py-4 flex items-center gap-4 transition hover:bg-black/[.02]"
                    style={{ borderBottom: idx < purchaseList.length - 1 ? `1px solid ${c.borderLight}` : 'none' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: c.primaryLight + '30' }}>
                      <Sparkles className="w-4 h-4" style={{ color: c.primary }} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm" style={{ color: c.text }}>{p.menuName}</div>
                      <div className="text-xs mt-0.5" style={{ color: c.textLight }}>
                        {formatDateTime(p.date)} {'\u00B7'} {p.duration}{'\uBD84'} {p.staffName && `\u00B7 ${p.staffName}`}
                      </div>
                    </div>
                    <span className="text-sm font-bold" style={{ color: c.text }}>{'\u20A9'}{p.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: c.primaryLight + '20' }}>
              <ClipboardList className="w-12 h-12 mx-auto mb-3" style={{ color: c.borderLight }} />
              <p className="text-sm" style={{ color: c.textLight }}>{'\uAD6C\uB9E4 \uB0B4\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4'}</p>
              <p className="text-xs mt-1" style={{ color: c.textLight }}>{'\uC2DC\uC220 \uC644\uB8CC \uC2DC \uC790\uB3D9 \uAE30\uB85D\uB429\uB2C8\uB2E4'}</p>
            </div>
          )}
        </div>
      )}

      {/* Custom Tabs */}
      {sortedTabs.map(tab => {
        const tabId = `custom_${tab.name}`;
        if (activeTab !== tabId) return null;
        const isEditing = editingTabId === tab.name;
        const isMemoStyle = tab.fields.length === 1;

        return (
          <div key={tabId} className="rounded-2xl p-6" style={{ border: `1px solid ${c.borderLight}` }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: c.text }}>
                {isMemoStyle ? <MessageSquare className="w-5 h-5" style={{ color: c.primary }} /> : <Droplets className="w-5 h-5" style={{ color: c.primary }} />}
                {tab.name}
              </h3>
              {!isEditing && (
                <button onClick={() => { setEditingTabId(tab.name); const form: Record<string, string> = {}; tab.fields.forEach(f => form[f] = customData[f] || ''); setTabForm(form); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                  style={{ color: c.primary, border: `1px solid ${c.primary}30` }}>
                  <Pencil className="w-3 h-3" /> {'\uC218\uC815'}
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                {tab.fields.map(fn => (
                  <div key={fn}>
                    {isMemoStyle ? (
                      <Textarea value={tabForm[fn] || ''} onChange={e => setTabForm({...tabForm, [fn]: e.target.value})}
                        placeholder={`${fn} \uC785\uB825`} rows={8} className="rounded-xl" />
                    ) : (
                      <>
                        <label className="text-xs font-medium block mb-1.5" style={{ color: c.textLight }}>{fn}</label>
                        <Input value={tabForm[fn] || ''} onChange={e => setTabForm({...tabForm, [fn]: e.target.value})}
                          placeholder={`${fn} \uC785\uB825`} className="rounded-xl" />
                      </>
                    )}
                  </div>
                ))}
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setEditingTabId(null)} className="rounded-xl">{'\uCDE8\uC18C'}</Button>
                  <button onClick={handleSaveTabData} className="px-5 py-2 rounded-xl text-sm font-medium" style={{ backgroundColor: c.primary, color: c.textOnPrimary }}>{'\uC800\uC7A5'}</button>
                </div>
              </div>
            ) : isMemoStyle ? (
              <div className="min-h-[150px] whitespace-pre-wrap text-sm rounded-xl p-4" style={{ color: c.text, backgroundColor: c.primaryLight + '20' }}>
                {customData[tab.fields[0]] || '\uC785\uB825\uB41C \uB0B4\uC6A9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tab.fields.map(fn => (
                  <div key={fn} className="rounded-xl p-4" style={{ backgroundColor: c.primaryLight + '30' }}>
                    <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: c.primary }}>{fn}</div>
                    <div className="text-sm font-medium" style={{ color: c.text }}>{customData[fn] || '\uBBF8\uC785\uB825'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>

    {/* Tab/Field Management Modal */}
    {showFieldsModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowFieldsModal(false)}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: c.primaryLight + '30' }}>
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: c.text }}>
              <Settings className="w-5 h-5" style={{ color: c.primary }} />{'\uD0ED / \uD56D\uBAA9 \uAD00\uB9AC'}
            </h3>
            <button onClick={() => setShowFieldsModal(false)} className="p-1 rounded-lg hover:bg-black/5">
              <X className="w-5 h-5" style={{ color: c.textLight }} />
            </button>
          </div>

          <div className="px-6 py-4 max-h-[450px] overflow-y-auto">
            {editTabs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: c.textLight }}>{'\uB4F1\uB85D\uB41C \uD0ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4'}</p>
                <p className="text-xs mt-1" style={{ color: c.textLight }}>{'\uC544\uB798\uC5D0\uC11C \uD0ED\uC744 \uCD94\uAC00\uD574\uC8FC\uC138\uC694'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {editTabs.map((tab, ti) => (
                  <div key={ti} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${editingModalTabIdx === ti ? c.primary + '50' : c.borderLight}` }}>
                    <div className="flex items-center gap-2 px-4 py-3 group" style={{ backgroundColor: editingModalTabIdx === ti ? c.primaryLight + '40' : c.primaryLight + '15' }}>
                      <GripVertical className="w-4 h-4 shrink-0" style={{ color: c.borderLight }} />
                      {editingModalTabIdx === ti ? (
                        <Input value={tab.name} onChange={e => renameTab(ti, e.target.value)} className="h-7 text-sm font-semibold rounded-lg flex-1" />
                      ) : (
                        <span className="flex-1 text-sm font-semibold cursor-pointer" style={{ color: c.text }}
                          onClick={() => setEditingModalTabIdx(editingModalTabIdx === ti ? null : ti)}>
                          {tab.name}
                          <span className="text-xs font-normal ml-2" style={{ color: c.textLight }}>{tab.fields.length}{'\uAC1C \uD56D\uBAA9'}</span>
                        </span>
                      )}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => moveTab(ti, -1)} disabled={ti === 0} className="p-1 rounded hover:bg-white disabled:opacity-30" style={{ color: c.textLight }}><ChevronUp className="w-3.5 h-3.5" /></button>
                        <button onClick={() => moveTab(ti, 1)} disabled={ti === editTabs.length - 1} className="p-1 rounded hover:bg-white disabled:opacity-30" style={{ color: c.textLight }}><ChevronDown className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setEditingModalTabIdx(editingModalTabIdx === ti ? null : ti)} className="p-1 rounded hover:bg-white" style={{ color: c.textLight }}><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => removeTab(ti)} className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    {editingModalTabIdx === ti && (
                      <div className="px-4 py-3 space-y-2 bg-white">
                        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: c.textLight }}>{'\uD56D\uBAA9 \uBAA9\uB85D'}</div>
                        {tab.fields.map((f, fi) => (
                          <div key={fi} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: c.primaryLight + '15' }}>
                            <span className="flex-1 text-xs" style={{ color: c.text }}>{f}</span>
                            <button onClick={() => removeFieldFromTab(ti, fi)} className="p-0.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                          </div>
                        ))}
                        <div className="flex gap-2 mt-2">
                          <Input value={newFieldName} onChange={e => setNewFieldName(e.target.value)} placeholder={'\uC0C8 \uD56D\uBAA9\uBA85'} className="h-8 text-xs rounded-lg"
                            onKeyDown={e => { if (e.key === 'Enter') addFieldToTab(ti); }} />
                          <button onClick={() => addFieldToTab(ti)} disabled={!newFieldName.trim()}
                            className="shrink-0 px-3 py-1 rounded-lg text-xs font-medium disabled:opacity-40"
                            style={{ backgroundColor: c.primary, color: c.textOnPrimary }}>{'\uCD94\uAC00'}</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: c.borderLight }}>
              <Input value={newTabName} onChange={e => setNewTabName(e.target.value)}
                placeholder={'\uC0C8 \uD0ED \uC774\uB984 (\uC608: \uD53C\uBD80\uC815\uBCF4, \uC0C1\uB2F4\uAE30\uB85D)'} className="rounded-xl text-sm"
                onKeyDown={e => { if (e.key === 'Enter') addTab(); }} />
              <button onClick={addTab} disabled={!newTabName.trim()}
                className="shrink-0 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40 transition"
                style={{ backgroundColor: c.primary, color: c.textOnPrimary }}>
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ backgroundColor: '#fafafa' }}>
            <Button variant="outline" onClick={() => setShowFieldsModal(false)} className="rounded-xl">{'\uCDE8\uC18C'}</Button>
            <button onClick={saveTabs} className="px-5 py-2 rounded-xl text-sm font-medium"
              style={{ backgroundColor: c.primary, color: c.textOnPrimary }}>{'\uC800\uC7A5'}</button>
          </div>
        </div>
      </div>
    )}

    {/* 고객 정보 수정 모달 */}
    {showEditProfile && (
      <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowEditProfile(false)}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="relative w-[90%] max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ background: c.surface }}
          onClick={e => e.stopPropagation()}
          onPaste={e => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
              if (items[i].type.startsWith('image/')) {
                e.preventDefault();
                const file = items[i].getAsFile();
                if (file) {
                  setUploadingProfilePhoto(true);
                  const formData = new FormData();
                  formData.append('file', file);
                  fetch('/api/upload', { method: 'POST', body: formData })
                    .then(r => r.ok ? r.json() : null)
                    .then(d => { if (d?.url) setEditProfileForm(prev => ({ ...prev, profileImage: d.url })); })
                    .finally(() => setUploadingProfilePhoto(false));
                }
                break;
              }
            }
          }}
        >
          {/* 헤더 */}
          <div style={{
            padding: '20px 24px 16px',
            background: `linear-gradient(135deg, ${c.primary}12 0%, ${c.primaryLight}18 100%)`,
            borderBottom: `1px solid ${c.borderLight}`,
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div style={{
                  width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `linear-gradient(135deg, ${c.primary}, ${c.primaryLight || c.primary}cc)`,
                }}>
                  <Pencil style={{ width: 16, height: 16, color: 'white' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text }}>고객 정보 수정</h3>
                  <p style={{ fontSize: 11, color: c.textLight }}>기본 정보를 수정합니다</p>
                </div>
              </div>
              <button onClick={() => setShowEditProfile(false)} style={{ padding: 4, cursor: 'pointer', background: 'none', border: 'none' }}>
                <X style={{ width: 18, height: 18, color: c.textLight }} />
              </button>
            </div>
          </div>

          {/* 폼 */}
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '60vh', overflowY: 'auto' }}>
            {/* 프로필 사진 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => profilePhotoRef.current?.click()}>
                {editProfileForm.profileImage ? (
                  <img src={editProfileForm.profileImage} alt="" style={{ width: 64, height: 64, borderRadius: 16, objectFit: 'cover', border: `2px solid ${c.borderLight}` }} />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, background: c.primary, color: c.textOnPrimary }}>
                    {editProfileForm.name?.charAt(0) || '?'}
                  </div>
                )}
                <div style={{
                  position: 'absolute', bottom: -4, right: -4, width: 24, height: 24, borderRadius: '50%',
                  background: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid white', boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                }}>
                  <Camera style={{ width: 12, height: 12, color: 'white' }} />
                </div>
                {uploadingProfilePhoto && (
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 16, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 20, height: 20, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  </div>
                )}
              </div>
              <input ref={profilePhotoRef} type="file" accept="image/*" hidden onChange={handleProfilePhotoUpload} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: c.textLight }}>프로필 사진</div>
                <div style={{ fontSize: 11, color: c.textLight, opacity: 0.7, marginTop: 2 }}>클릭하여 변경</div>
                {editProfileForm.profileImage && (
                  <button onClick={() => setEditProfileForm(prev => ({ ...prev, profileImage: '' }))}
                    style={{ fontSize: 11, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4, padding: 0 }}>
                    사진 삭제
                  </button>
                )}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <User style={{ width: 13, height: 13 }} /> 이름 *
              </label>
              <Input value={editProfileForm.name} onChange={e => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                className="rounded-xl" placeholder="고객 이름" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar style={{ width: 13, height: 13 }} /> 생년월일
                {bdYear && bdMonth && bdDay && (() => {
                  const today = new Date();
                  const bd = new Date(Number(bdYear), Number(bdMonth) - 1, Number(bdDay));
                  let age = today.getFullYear() - bd.getFullYear();
                  if (today.getMonth() < bd.getMonth() || (today.getMonth() === bd.getMonth() && today.getDate() < bd.getDate())) age--;
                  return <span style={{ fontSize: 11, fontWeight: 500, color: c.primary, marginLeft: 4 }}>({age}세)</span>;
                })()}
              </label>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  id="bd-year"
                  value={bdYear} placeholder="YYYY"
                  maxLength={4}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setBdYear(v);
                    if (v.length === 4) document.getElementById('bd-month')?.focus();
                  }}
                  onPaste={e => {
                    const text = e.clipboardData.getData('text').trim();
                    const digits = text.replace(/\D/g, '');
                    // 8자리: 19900101
                    if (digits.length === 8) {
                      e.preventDefault();
                      setBdYear(digits.slice(0, 4));
                      setBdMonth(digits.slice(4, 6));
                      setBdDay(digits.slice(6, 8));
                      document.getElementById('bd-day')?.focus();
                      return;
                    }
                    // 구분자 포함: 1990-01-01, 1990/01/01, 1990.01.01
                    const parts = text.split(/[-/.]/);
                    if (parts.length === 3 && parts[0].length === 4) {
                      e.preventDefault();
                      setBdYear(parts[0]);
                      setBdMonth(parts[1].padStart(2, '0'));
                      setBdDay(parts[2].padStart(2, '0'));
                      document.getElementById('bd-day')?.focus();
                      return;
                    }
                  }}
                  style={{ width: 70, padding: '8px 10px', borderRadius: 10, border: `1px solid ${c.borderLight}`, fontSize: 14, textAlign: 'center', outline: 'none' }}
                />
                <span style={{ color: c.textLight, fontWeight: 600 }}>/</span>
                <input
                  id="bd-month"
                  value={bdMonth} placeholder="MM"
                  maxLength={2}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                    setBdMonth(v);
                    if (v.length === 2) document.getElementById('bd-day')?.focus();
                  }}
                  onKeyDown={e => { if (e.key === 'Backspace' && !bdMonth) document.getElementById('bd-year')?.focus(); }}
                  style={{ width: 50, padding: '8px 10px', borderRadius: 10, border: `1px solid ${c.borderLight}`, fontSize: 14, textAlign: 'center', outline: 'none' }}
                />
                <span style={{ color: c.textLight, fontWeight: 600 }}>/</span>
                <input
                  id="bd-day"
                  value={bdDay} placeholder="DD"
                  maxLength={2}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                    setBdDay(v);
                  }}
                  onKeyDown={e => { if (e.key === 'Backspace' && !bdDay) document.getElementById('bd-month')?.focus(); }}
                  style={{ width: 50, padding: '8px 10px', borderRadius: 10, border: `1px solid ${c.borderLight}`, fontSize: 14, textAlign: 'center', outline: 'none' }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Phone style={{ width: 13, height: 13 }} /> 전화번호
              </label>
              <Input value={editProfileForm.phone} onChange={e => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
                  let formatted = raw;
                  if (raw.length > 7) formatted = `${raw.slice(0,3)}-${raw.slice(3,7)}-${raw.slice(7)}`;
                  else if (raw.length > 3) formatted = `${raw.slice(0,3)}-${raw.slice(3)}`;
                  setEditProfileForm({ ...editProfileForm, phone: formatted });
                }}
                className="rounded-xl" placeholder="010-0000-0000" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Mail style={{ width: 13, height: 13 }} /> 이메일
              </label>
              <Input value={editProfileForm.email} onChange={e => setEditProfileForm({ ...editProfileForm, email: e.target.value })}
                className="rounded-xl" placeholder="email@example.com" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <FileText style={{ width: 13, height: 13 }} /> 메모
              </label>
              <Textarea value={editProfileForm.memo} onChange={e => setEditProfileForm({ ...editProfileForm, memo: e.target.value })}
                className="rounded-xl" placeholder="고객 메모" rows={3} />
            </div>
          </div>

          {/* 버튼 */}
          <div style={{ padding: '0 24px 20px', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setShowEditProfile(false)} className="rounded-xl">취소</Button>
            <button onClick={saveEditProfile} disabled={!editProfileForm.name.trim()}
              className="px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 transition"
              style={{ backgroundColor: c.primary, color: c.textOnPrimary }}>
              저장
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
