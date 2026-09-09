'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getStatusLabel, getStatusColor, formatDateTime, formatDuration } from '@/lib/utils';
import { CalendarDays, Plus, Search } from 'lucide-react';
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
  customer?: { user?: { name: string; phone?: string | null } } | null;
  staff?: { user?: { name: string } } | null;
  menu?: { name: string; duration: number; price?: number } | null;
};

const STATUS_FILTERS = [
  { key: 'ALL', label: '전체' },
  { key: 'CONFIRMED', label: '확정' },
  { key: 'PENDING', label: '대기' },
  { key: 'COMPLETED', label: '완료' },
  { key: 'CANCELLED', label: '취소' },
  { key: 'NO_SHOW', label: '노쇼' },
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
    <div style={{ maxWidth: 960, margin: '0 auto', padding: mob ? '14px 12px' : '20px 16px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)' }}>
      <style>{`.bm-resv-scroll::-webkit-scrollbar { display:none!important; width:0!important; }`}</style>
      {/* 상태 필터: 가로 스크롤 */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 14,
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 4,
          scrollbarWidth: 'none',
        }}
      >
        {STATUS_FILTERS.map((f) => {
          const count = f.key === 'ALL' ? reservations.length : reservations.filter((r) => r.status === f.key).length;
          const isSelected = statusFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              style={{
                flexShrink: 0,
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
              style={{
                ...card,
                padding: '13px 14px',
              }}
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
        /* 데스크톱 테이블 형태 */
        <div style={{ ...card, overflow: 'hidden' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>날짜/시간</TableHead>
                <TableHead>고객명</TableHead>
                <TableHead>시술명</TableHead>
                <TableHead>담당 관리사</TableHead>
                <TableHead>소요시간</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>출처</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((res) => (
                <TableRow key={res.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    {formatDateTime(res.startTime)}
                  </TableCell>
                  <TableCell>{res.customer?.user?.name || '미지정'}</TableCell>
                  <TableCell>{res.menu?.name || '-'}</TableCell>
                  <TableCell>{res.staff?.user?.name || '미배정'}</TableCell>
                  <TableCell className="text-gray-500">
                    {res.menu ? formatDuration(res.menu.duration) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(res.status)}>
                      {getStatusLabel(res.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {res.source === 'WEBSITE' ? '온라인' : '관리자'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      </div>
    </div>
  );
}
