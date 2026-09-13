'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'next/navigation';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, User, Phone as PhoneIcon, Scissors, Clock, Coins, UserCog, StickyNote, MapPin, X, Plus, Search, ClipboardCheck, FileText, ListFilter, CheckCircle2, Clock4, CircleCheck, CircleX, UserX } from 'lucide-react';
import { getStatusLabel, getStatusColor, formatDateTime, formatDuration } from '@/lib/utils';
import Link from 'next/link';

type Reservation = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  source?: string | null;
  memo?: string | null;
  currentSession?: number;
  totalSessions?: number;
  customer?: { createdAt?: string; user?: { name: string; phone?: string | null; profileImage?: string | null } } | null;
  staff?: { user?: { name: string; profileImage?: string | null } } | null;
  menu?: {
    name: string; duration: number; price?: number;
    managementFields?: string | null;
    menuTreatments?: { treatment: { name: string; processSteps?: string | null } }[];
  } | null;
  customerRecord?: { managementData?: string | null; content?: string | null } | null;
};

const STATUS_FILTERS = [
  { key: 'ALL', label: '전체', icon: ListFilter },
  { key: 'CONFIRMED', label: '확정', icon: CheckCircle2 },
  { key: 'PENDING', label: '요청', icon: Clock4 },
  { key: 'COMPLETED', label: '완료', icon: CircleCheck },
  { key: 'CANCELLED', label: '취소', icon: CircleX },
  { key: 'NO_SHOW', label: '노쇼', icon: UserX },
];

export default function ReservationsPage() {
  const params = useParams();
  const shopSlug = params.shopSlug as string;
  const mob = useIsMobile();
  const store = useThemeStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const filterDrag = useRef({ isDown: false, startX: 0, scrollLeft: 0 });

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/reservations`);
      if (res.ok) {
        const data = await res.json();
        setReservations(data.reservations || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (shopSlug) fetchReservations();
  }, [shopSlug]);

  if (!mounted) return null;

  const card = { background: 'white', borderRadius: 14, border: `1px solid ${c.borderLight}` } as const;

  const filtered = reservations.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const cName = r.customer?.user?.name?.toLowerCase() || '';
      const sName = r.staff?.user?.name?.toLowerCase() || '';
      const mName = r.menu?.name?.toLowerCase() || '';
      if (!cName.includes(q) && !sName.includes(q) && !mName.includes(q)) return false;
    }
    return true;
  });

  return (
    <>
    <div style={{ maxWidth: 960, margin: '0 auto', padding: mob ? '14px 12px' : '20px 16px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)' }}>
      <style>{`.bm-resv-scroll::-webkit-scrollbar { display:none!important; width:0!important; }`}</style>
      {/* 상태 필터: 좌우 드래그 스크롤 */}
      <div
        ref={filterRef}
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 14,
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 4,
          scrollbarWidth: 'none',
          userSelect: 'none',
          cursor: 'grab',
        }}
        onMouseDown={e => {
          const el = filterRef.current; if (!el) return;
          filterDrag.current = { isDown: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
          el.style.cursor = 'grabbing';
        }}
        onMouseLeave={() => { filterDrag.current.isDown = false; if (filterRef.current) filterRef.current.style.cursor = 'grab'; }}
        onMouseUp={() => { filterDrag.current.isDown = false; if (filterRef.current) filterRef.current.style.cursor = 'grab'; }}
        onMouseMove={e => {
          if (!filterDrag.current.isDown) return; e.preventDefault();
          const el = filterRef.current; if (!el) return;
          el.scrollLeft = filterDrag.current.scrollLeft - (e.pageX - el.offsetLeft - filterDrag.current.startX);
        }}
      >
        {STATUS_FILTERS.map((f) => {
          const count = f.key === 'ALL' ? reservations.length : reservations.filter((r) => r.status === f.key).length;
          const isSelected = statusFilter === f.key;
          const Icon = f.icon;
          return (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              style={{
                flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 4,
                padding: mob ? '5px 12px' : '6px 14px',
                borderRadius: 8,
                fontSize: mob ? 11.5 : 12,
                fontWeight: 600,
                border: `1px solid ${isSelected ? c.primary : c.borderLight}`,
                background: isSelected ? c.primary : 'white',
                color: isSelected ? c.textOnPrimary : c.text,
                cursor: 'pointer',
                transition: 'all .15s',
              }}
            >
              <Icon style={{ width: 13, height: 13 }} />
              {f.label} {count}
            </button>
          );
        })}
      </div>

      {/* 검색 인풋 */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: c.textLight }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="고객명, 시술명, 관리사명 검색"
          style={{
            width: '100%',
            padding: '9px 12px 9px 32px',
            borderRadius: 10,
            border: `1px solid ${c.borderLight}`,
            fontSize: 13,
            outline: 'none',
            background: 'white',
            color: c.text,
          }}
        />
      </div>

      {/* 예약 목록 - 드래그 스크롤 */}
      <div
        className="bm-resv-scroll"
        style={{
          flex: 1, minHeight: 0, overflowY: 'auto',
          scrollbarWidth: 'none', msOverflowStyle: 'none',
          cursor: 'grab',
        }}
        onMouseDown={e => {
          const el = e.currentTarget;
          el.dataset.dragging = 'true';
          el.dataset.startY = String(e.clientY);
          el.dataset.scrollTop = String(el.scrollTop);
          el.style.cursor = 'grabbing';
          el.style.userSelect = 'none';
        }}
        onMouseMove={e => {
          const el = e.currentTarget;
          if (el.dataset.dragging !== 'true') return;
          const dy = e.clientY - Number(el.dataset.startY);
          el.scrollTop = Number(el.dataset.scrollTop) - dy;
        }}
        onMouseUp={e => {
          const el = e.currentTarget;
          el.dataset.dragging = 'false';
          el.style.cursor = 'grab';
          el.style.userSelect = '';
        }}
        onMouseLeave={e => {
          const el = e.currentTarget;
          el.dataset.dragging = 'false';
          el.style.cursor = 'grab';
          el.style.userSelect = '';
        }}
      >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: c.textLight }}>로딩 중...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: c.textLight }}>
          <CalendarDays style={{ width: 40, height: 40, color: c.borderLight, margin: '0 auto 10px' }} />
          <div>예약 내역이 없습니다</div>
        </div>
      ) : mob ? (
        /* 모바일 카드 형태 */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((res) => (
            <div
              key={res.id}
              onClick={() => setSelectedRes(res)}
              style={{
                ...card,
                padding: '13px 14px',
                cursor: 'pointer',
                transition: 'box-shadow .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.text, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CalendarDays style={{ width: 13, height: 13, color: c.primary }} />
                  {formatDateTime(res.startTime)}
                </div>
                <span
                  className={getStatusColor(res.status)}
                  style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}
                >
                  {getStatusLabel(res.status)}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12, padding: '8px 10px', background: '#F9FAFB', borderRadius: 8, marginBottom: 8 }}>
                <div>
                  <span style={{ color: c.textLight, fontSize: 11 }}>고객: </span>
                  <strong style={{ color: c.text }}>{res.customer?.user?.name || '미지정'}</strong>
                </div>
                <div>
                  <span style={{ color: c.textLight, fontSize: 11 }}>담당: </span>
                  <strong style={{ color: c.text }}>{res.staff?.user?.name || '미배정'}</strong>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: c.textLight, fontSize: 11 }}>시술: </span>
                  <strong style={{ color: c.text }}>{res.menu?.name || '-'}</strong>
                  {res.menu?.duration && (
                    <span style={{ color: c.textLight, fontSize: 11, marginLeft: 4 }}>
                      ({formatDuration(res.menu.duration)})
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: c.textLight }}>
                <span>출처: {res.source === 'WEBSITE' ? '온라인' : '매장'}</span>
                {res.currentSession && res.totalSessions ? (
                  <span style={{ fontWeight: 600, color: c.primary }}>
                    회차: {res.currentSession}/{res.totalSessions}회
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 데스크톱 카드 리스트 */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* 헤더 */}
          <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 1.2fr 1fr 80px 72px 60px', gap: 8, padding: '8px 16px', fontSize: 11, fontWeight: 600, color: c.textLight }}>
            <span></span>
            <span>고객</span>
            <span>시술</span>
            <span>담당</span>
            <span style={{ textAlign: 'center' }}>소요</span>
            <span style={{ textAlign: 'center' }}>상태</span>
            <span style={{ textAlign: 'center' }}>출처</span>
          </div>
          {filtered.map((res) => {
            const initial = (res.customer?.user?.name || '?')[0];
            const statusColors: Record<string, string> = {
              CONFIRMED: '#3B82F6', PENDING: '#F59E0B', COMPLETED: '#10B981',
              CANCELLED: '#EF4444', NO_SHOW: '#6B7280',
            };
            const sc = statusColors[res.status] || c.textLight;
            return (
              <div
                key={res.id}
                onClick={() => setSelectedRes(res)}
                style={{
                  display: 'grid', gridTemplateColumns: '44px 1fr 1.2fr 1fr 80px 72px 60px', gap: 8,
                  alignItems: 'center', padding: '10px 16px',
                  background: 'white', borderRadius: 12,
                  border: `1px solid ${c.borderLight}`,
                  cursor: 'pointer', transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = c.primary + '60'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = c.borderLight; }}
              >
                {/* 아바타 */}
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${sc}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: sc, flexShrink: 0 }}>
                  {initial}
                </div>
                {/* 고객 + 날짜 */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{res.customer?.user?.name || '미지정'}</div>
                  <div style={{ fontSize: 11, color: c.textLight, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <CalendarDays style={{ width: 10, height: 10 }} />
                    {formatDateTime(res.startTime)}
                  </div>
                </div>
                {/* 시술 */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{res.menu?.name || '-'}</div>
                  {res.currentSession && res.totalSessions && (
                    <div style={{ fontSize: 10, color: c.primary, fontWeight: 600 }}>{res.currentSession}/{res.totalSessions}회차</div>
                  )}
                </div>
                {/* 담당 */}
                <div style={{ fontSize: 12, color: c.text, display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                  <UserCog style={{ width: 12, height: 12, color: c.textLight, flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{res.staff?.user?.name || '미배정'}</span>
                </div>
                {/* 소요시간 */}
                <div style={{ textAlign: 'center', fontSize: 12, color: c.textLight, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                  <Clock style={{ width: 11, height: 11 }} />
                  {res.menu ? formatDuration(res.menu.duration) : '-'}
                </div>
                {/* 상태 */}
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: sc, background: `${sc}14`, padding: '3px 10px', borderRadius: 20, border: `1px solid ${sc}30` }}>
                    {getStatusLabel(res.status)}
                  </span>
                </div>
                {/* 출처 */}
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 10, color: res.source === 'WEBSITE' ? '#3B82F6' : c.textLight, fontWeight: 600, background: res.source === 'WEBSITE' ? '#EFF6FF' : '#F9FAFB', padding: '2px 8px', borderRadius: 6 }}>
                    {res.source === 'WEBSITE' ? '온라인' : '매장'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>

    {/* 예약 상세 팝업 — Portal로 body에 직접 렌더링 */}
    {selectedRes && createPortal(
      <>
        <div onClick={() => setSelectedRes(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9998 }} />
        <div style={mob ? {
          position: 'fixed', bottom: 0, left: 0, right: 0,
          maxHeight: '85vh', display: 'flex', flexDirection: 'column' as const,
          background: 'white', borderRadius: '20px 20px 0 0', zIndex: 9999,
          boxShadow: '0 -10px 40px rgba(0,0,0,0.15)',
          animation: 'slideUp .25s ease-out',
        } : {
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 420, maxHeight: '80vh', display: 'flex', flexDirection: 'column' as const,
          background: 'white', borderRadius: 16, zIndex: 9999,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}>
          <div style={{ flexShrink: 0, padding: mob ? '8px 16px 0' : '24px 20px 0' }}>
          {mob && <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 12px' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: '#D1D5DB' }} /></div>}
          <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } } .popup-scroll::-webkit-scrollbar { display: none; }`}</style>
          {/* 박스 1: 상태 + 회차 + 고객 프로필 */}
          <div style={{ padding: '16px', background: `linear-gradient(135deg, ${c.primaryLight}, #f0fdf4)`, borderRadius: 14, marginBottom: 10, border: `1px solid ${c.borderLight}` }}>
            {/* 상태 + 회차 + 출처 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span className={getStatusColor(selectedRes.status)} style={{ padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{getStatusLabel(selectedRes.status)}</span>
              {selectedRes.currentSession && selectedRes.totalSessions && <span style={{ fontSize: 12, fontWeight: 600, color: c.primary, background: 'white', padding: '3px 10px', borderRadius: 20, border: `1px solid ${c.primary}30` }}>회차 {selectedRes.currentSession}/{selectedRes.totalSessions}</span>}
              <span style={{ marginLeft: 'auto', fontSize: 11, color: c.textLight, display: 'flex', alignItems: 'center', gap: 3 }}><MapPin style={{ width: 11, height: 11 }} /> {selectedRes.source === 'WEBSITE' ? '온라인' : '매장'}</span>
            </div>
            {/* 고객 프로필 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#e5e7eb', border: '2.5px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                {selectedRes.customer?.user?.profileImage ? (
                  <img src={selectedRes.customer.user.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}><User style={{ width: 24, height: 24, color: c.primary }} /></div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: c.text }}>{selectedRes.customer?.user?.name || '미지정'}</div>
                {selectedRes.customer?.user?.phone && (
                  <div style={{ fontSize: 12, color: c.textLight, display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}><PhoneIcon style={{ width: 11, height: 11 }} /> {selectedRes.customer.user.phone}</div>
                )}
                {selectedRes.customer?.createdAt && (
                  <div style={{ fontSize: 11, color: c.textLight, display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}><CalendarDays style={{ width: 10, height: 10 }} /> 입회 {new Date(selectedRes.customer.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                )}
              </div>
            </div>
          </div>

          {/* 박스 2: 예약 일시 + 담당 관리사 */}
          <div style={{ padding: '14px 16px', background: '#F9FAFB', borderRadius: 14, marginBottom: 10, border: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', gap: 16 }}>
              {/* 예약 일시 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: c.textLight, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, marginBottom: 4 }}><CalendarDays style={{ width: 11, height: 11 }} /> 예약 일시</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{formatDateTime(selectedRes.startTime)}</div>
                {selectedRes.endTime && <div style={{ fontSize: 11, color: c.textLight }}>~ {new Date(selectedRes.endTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 종료</div>}
              </div>
              {/* 구분선 */}
              <div style={{ width: 1, background: '#e5e7eb', alignSelf: 'stretch' }} />
              {/* 담당 관리사 */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#e5e7eb', border: `2px solid ${c.primary}20` }}>
                  {selectedRes.staff?.user?.profileImage ? (
                    <img src={selectedRes.staff.user.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.primaryLight }}><UserCog style={{ width: 18, height: 18, color: c.primary }} /></div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 10, color: c.textLight, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><UserCog style={{ width: 10, height: 10 }} /> 담당</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginTop: 1 }}>{selectedRes.staff?.user?.name || '미배정'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 시술 정보 */}
          <div style={{ padding: '12px 14px', background: '#F9FAFB', borderRadius: 12, border: '1px solid #f3f4f6', marginBottom: 0 }}>
            <div style={{ fontSize: 10, color: c.textLight, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, marginBottom: 4 }}><Scissors style={{ width: 11, height: 11 }} /> 시술 정보</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 4 }}>{selectedRes.menu?.name || '-'}</div>
            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: c.textLight }}>
              {selectedRes.menu?.duration && <span style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#fff', padding: '2px 8px', borderRadius: 6, border: '1px solid #e5e7eb' }}><Clock style={{ width: 11, height: 11 }} /> {formatDuration(selectedRes.menu.duration)}</span>}
              {selectedRes.menu?.price != null && <span style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#fff', padding: '2px 8px', borderRadius: 6, border: '1px solid #e5e7eb' }}><Coins style={{ width: 11, height: 11 }} /> {selectedRes.menu.price.toLocaleString()}원</span>}
            </div>
          </div>
          </div>{/* 고정 영역 끝 */}

          {/* 스크롤 영역 */}
          <div className="popup-scroll" style={{ flex: 1, overflowY: 'auto', padding: mob ? '10px 16px 24px' : '10px 20px 24px', scrollbarWidth: 'none' }}>
          {selectedRes.status === 'COMPLETED' && selectedRes.customerRecord && (() => {
            let mgmt: Record<string, string> = {};
            try { mgmt = typeof selectedRes.customerRecord.managementData === 'string' ? JSON.parse(selectedRes.customerRecord.managementData) : (selectedRes.customerRecord.managementData || {}); } catch {}
            const fields = Object.entries(mgmt).filter(([k]) => !k.startsWith('_'));
            const mgmtMemo = mgmt._memo || '';
            const hasContent = !!selectedRes.customerRecord.content;
            if (fields.length === 0 && !mgmtMemo && !hasContent) return null;

            // processSteps에서 단위 정보 맵핑
            const unitMap: Record<string, string> = {};
            try {
              const mts = selectedRes.menu?.menuTreatments || [];
              for (const mt of mts) {
                if (mt.treatment?.processSteps) {
                  const steps = typeof mt.treatment.processSteps === 'string' ? JSON.parse(mt.treatment.processSteps) : mt.treatment.processSteps;
                  if (Array.isArray(steps)) steps.forEach((s: any) => { if (s.name) unitMap[s.name] = s.unit || ''; });
                }
              }
              if (selectedRes.menu?.managementFields) {
                const parsed = typeof selectedRes.menu.managementFields === 'string' ? JSON.parse(selectedRes.menu.managementFields) : selectedRes.menu.managementFields;
                if (Array.isArray(parsed)) parsed.forEach((s: any) => { if (s.name && !unitMap[s.name]) unitMap[s.name] = s.unit || ''; });
              }
            } catch {}

            // 그룹 빌드
            const groups: { name: string; items: { key: string; val: string; unit: string }[] }[] = [];
            try {
              const mts = selectedRes.menu?.menuTreatments || [];
              for (const mt of mts) {
                if (mt.treatment?.processSteps) {
                  const steps = typeof mt.treatment.processSteps === 'string' ? JSON.parse(mt.treatment.processSteps) : mt.treatment.processSteps;
                  if (Array.isArray(steps) && steps.length > 0) {
                    const tName = mt.treatment.name || '';
                    const items = steps
                      .map((s: any) => {
                        const fullKey = `${tName}__${s.name}`;
                        const val = mgmt[fullKey] ?? mgmt[s.name];
                        if (val === undefined) return null;
                        return { key: s.name, val: String(val), unit: s.unit || '' };
                      })
                      .filter(Boolean) as { key: string; val: string; unit: string }[];
                    if (items.length > 0) groups.push({ name: tName, items });
                  }
                }
              }
            } catch {}
            // 그룹에 포함되지 않은 필드
            const allUsedKeys = new Set<string>();
            groups.forEach(g => g.items.forEach(i => { allUsedKeys.add(i.key); allUsedKeys.add(`${g.name}__${i.key}`); }));
            const ungrouped = fields.filter(([k]) => !allUsedKeys.has(k));
            if (ungrouped.length > 0) groups.push({ name: '', items: ungrouped.map(([k, v]) => ({ key: k.includes('__') ? k.split('__')[1] : k, val: String(v), unit: '' })) });

            return (
              <div style={{ padding: '14px 16px', background: '#F0FDF4', borderRadius: 12, border: '1.5px solid #86EFAC', marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#166534', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                  <ClipboardCheck style={{ width: 13, height: 13 }} /> 관리 내용 기록
                </div>
                {groups.map((group, gi) => (
                  <div key={gi} style={{ marginBottom: gi < groups.length - 1 ? 10 : 0 }}>
                    {group.name && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#15803D', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Scissors style={{ width: 10, height: 10 }} /> {group.name}
                      </div>
                    )}
                    {group.items.map(item => (
                      <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, paddingLeft: group.name ? 8 : 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', minWidth: 80 }}>{item.key}</span>
                        <span style={{ fontSize: 11, color: '#6B7280' }}>=</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#166534', background: 'white', padding: '2px 10px', borderRadius: 6, border: '1px solid #D1FAE5', minWidth: 40, textAlign: 'center' }}>{item.val}</span>
                        {item.unit && <span style={{ fontSize: 11, color: '#6B7280' }}>{item.unit}</span>}
                      </div>
                    ))}
                  </div>
                ))}
                {mgmtMemo && (
                  <div style={{ fontSize: 12, color: '#166534', background: '#DCFCE7', borderRadius: 6, padding: '6px 10px', marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                    <StickyNote style={{ width: 11, height: 11, flexShrink: 0, marginTop: 2 }} /> {mgmtMemo}
                  </div>
                )}
                {hasContent && !mgmtMemo && (
                  <div style={{ fontSize: 12, color: '#166534', background: '#DCFCE7', borderRadius: 6, padding: '6px 10px', marginTop: groups.length > 0 ? 8 : 0, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                    <FileText style={{ width: 11, height: 11, flexShrink: 0, marginTop: 2 }} /> {selectedRes.customerRecord.content}
                  </div>
                )}
              </div>
            );
          })()}

          {/* 메모 */}
          {selectedRes.memo && (
            <div style={{ padding: '12px 14px', background: '#FFFBEB', borderRadius: 12, border: '1px solid #FDE68A', marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: '#92400E', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 3 }}><StickyNote style={{ width: 11, height: 11 }} /> 메모</div>
              <div style={{ fontSize: 13, color: '#78350F', lineHeight: 1.5 }}>{selectedRes.memo}</div>
            </div>
          )}

          <button onClick={() => setSelectedRes(null)} style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: `1px solid ${c.borderLight}`, background: 'white', color: c.text, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>닫기</button>
          </div>{/* 스크롤 영역 끝 */}
        </div>
      </>,
      document.body
    )}
    </>
  );
}
