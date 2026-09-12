'use client';
import { useState, useEffect, useCallback, useRef, use } from 'react';
import { createPortal } from 'react-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Clock, User, RefreshCw, Sparkles, ClipboardList, ChevronDown, CalendarDays, Check, X, UserX, Play, Undo2 } from 'lucide-react';

interface ReservationEvent {
  id: string;
  customerId?: string | null;
  menuId?: string;
  customer?: { user?: { name: string; phone?: string | null; profileImage?: string | null; birthday?: string | null; gender?: string | null } };
  menu?: { id?: string; name: string; managementFields?: string | null };
  staff?: { user?: { name: string } };
  startTime: string;
  endTime: string;
  status: string;
  currentSession?: number;
  totalSessions?: number;
}

interface DaySummary {
  count: number;
  firstTime: string;
  lastTime: string;
  freeH: number;
  freeM: number;
  workH: number;
  workM: number;
}

interface CalEvent {
  id: string; title: string; start: string; end: string;
  backgroundColor: string; borderColor: string; textColor: string;
  extendedProps: { menu: string; customer: string; phone: string; staff: string; status: string; session: string; customerId: string; menuName: string; profileImage: string; birthday: string; gender: string };
}

export default function CalendarPage({ params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = use(params);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [rawEvents, setRawEvents] = useState<ReservationEvent[]>([]);
  const [mounted, setMounted] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<{ id: string; menu: string; customer: string; phone: string; staff: string; status: string; session: string; start: string; end: string; customerId: string; menuName: string; profileImage: string; birthday: string; gender: string; eventDate?: string; managementFields?: string[] } | null>(null);
  const [treatmentData, setTreatmentData] = useState<Record<string, string>>({});
  const [treatmentMemo, setTreatmentMemo] = useState('');
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const [historyTab, setHistoryTab] = useState<'menu' | 'all'>('menu');
  const [activeDate, setActiveDate] = useState<string>(''); // 클릭한 날짜 (YYYY-MM-DD)
  const [popupDate, setPopupDate] = useState<string | null>(null); // 월간 클릭 팝업
  const calendarRef = useRef<FullCalendar>(null);
  const store = useThemeStore();
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;
  const mob = useIsMobile();

  const OPEN_HOUR = 8;
  const CLOSE_HOUR = 22;

  // 매장 영업시간 + 휴무일
  const [closedDays, setClosedDays] = useState<string[]>([]); // 요일별 정기휴무 ['sun']
  const [holidays, setHolidays] = useState<string[]>([]); // 특정 날짜 휴무 ['2026-09-15']

  // 실제 영업시간 (효율 계산용)
  const [bizOpen, setBizOpen] = useState(10);
  const [bizClose, setBizClose] = useState(20);

  useEffect(() => {
    fetch(`/api/shops/${shopSlug}/settings`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.businessHours) return;
        try {
          const bh = JSON.parse(d.businessHours);
          const closed: string[] = [];
          const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
          dayKeys.forEach(k => { if (bh[k]?.closed) closed.push(k); });
          setClosedDays(closed);
          if (Array.isArray(bh._holidays)) setHolidays(bh._holidays);
          // 영업시간 추출 (첫 번째 영업일 기준)
          const firstOpen = dayKeys.find(k => bh[k] && !bh[k].closed);
          if (firstOpen && bh[firstOpen]) {
            setBizOpen(parseInt(bh[firstOpen].open?.split(':')[0] || '10'));
            setBizClose(parseInt(bh[firstOpen].close?.split(':')[0] || '20'));
          }
        } catch {}
      }).catch(() => {});
  }, [shopSlug]);

  // 날짜가 휴무일인지 체크
  const isHoliday = useCallback((dateStr: string) => {
    if (holidays.includes(dateStr)) return true;
    const d = new Date(dateStr + 'T00:00:00');
    const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return closedDays.includes(dayKeys[d.getDay()]);
  }, [closedDays, holidays]);

  const fmtPhone = (ph: string) => {
    const n = ph.replace(/\D/g, '');
    if (n.startsWith('02')) return n.length === 10 ? `${n.slice(0,2)}-${n.slice(2,6)}-${n.slice(6)}` : `${n.slice(0,2)}-${n.slice(2,5)}-${n.slice(5)}`;
    if (n.length === 11) return `${n.slice(0,3)}-${n.slice(3,7)}-${n.slice(7)}`;
    if (n.length === 10) return `${n.slice(0,3)}-${n.slice(3,6)}-${n.slice(6)}`;
    return ph;
  };

  // 상태별 컬러 (좌측 바 + 연한 배경)
  const STATUS_COLORS: Record<string, { bar: string; bg: string; text: string }> = {
    CONFIRMED: { bar: c.primary, bg: `${c.primary}18`, text: c.text },
    PENDING:   { bar: '#F59E0B', bg: '#FEF3C7',  text: '#92400E' },
    COMPLETED: { bar: '#6B7280', bg: '#F3F4F6',  text: '#374151' },
    CANCELLED: { bar: '#EF4444', bg: '#FEE2E2',  text: '#991B1B' },
    NO_SHOW:   { bar: '#DC2626', bg: '#FEE2E2',  text: '#991B1B' },
    REQUESTED: { bar: '#3B82F6', bg: '#DBEAFE',  text: '#1E40AF' },
    IN_PROGRESS: { bar: '#F59E0B', bg: '#FEF3C7', text: '#92400E' },
  };

  const fetchReservations = useCallback(() => {
    fetch(`/api/shops/${shopSlug}/reservations`)
      .then(res => res.json())
      .then(data => {
        if (data.reservations) {
          setRawEvents(data.reservations);
          setEvents(data.reservations
            .filter((r: ReservationEvent) => r.status !== 'CANCELLED')
            .map((r: ReservationEvent) => {
            const sc = STATUS_COLORS[r.status] || STATUS_COLORS.CONFIRMED;
            const custName = r.customer?.user?.name || '미정';
            const custPhone = r.customer?.user?.phone || '';
            const menuName = r.menu?.name || '';
            const staffName = r.staff?.user?.name || '';
            const session = `${r.currentSession || 1}/${r.totalSessions || 1}`;
            let mgmtFields: string[] = [];
            try { if (r.menu?.managementFields) mgmtFields = typeof r.menu.managementFields === 'string' ? JSON.parse(r.menu.managementFields) : r.menu.managementFields; } catch {}
            let mgmtData: Record<string, string> = {};
            try { const rec = (r as any).records?.[0]; if (rec?.managementData) mgmtData = typeof rec.managementData === 'string' ? JSON.parse(rec.managementData) : rec.managementData; } catch {}
            return {
              id: r.id,
              title: menuName,
              start: r.startTime, end: r.endTime,
              backgroundColor: sc.bg, borderColor: sc.bar, textColor: sc.text,
              extendedProps: { menu: menuName, customer: custName, phone: custPhone, staff: staffName, status: r.status, session, customerId: r.customerId || '', menuName, profileImage: r.customer?.user?.profileImage || '', birthday: r.customer?.user?.birthday || '', gender: r.customer?.user?.gender || '', menuId: r.menuId || '', managementFields: mgmtFields, managementData: mgmtData },
            };
          }));
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopSlug]);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);

  // 예약 상태 변경
  const changeReservationStatus = useCallback(async (reservationId: string, newStatus: string, cancelReason?: string) => {
    try {
      const bodyData: any = { status: newStatus };
      if (cancelReason) bodyData.cancelReason = cancelReason;

      const res = await fetch(`/api/shops/${shopSlug}/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });
      if (res.ok) {
        // 팝업 상태만 즉시 반영
        setSelectedEvent(prev => prev ? { ...prev, status: newStatus } : null);

        const calApi = calendarRef.current?.getApi();
        if (newStatus === 'CANCELLED') {
          // 취소 → 캘린더에서 이벤트 제거
          if (calApi) {
            const fcEvent = calApi.getEventById(reservationId);
            if (fcEvent) fcEvent.remove();
          }
          // 팝업 닫기
          setTimeout(() => setSelectedEvent(null), 500);
        } else if (newStatus === 'CONFIRMED') {
          // 되돌리기 → 전체 리로드하여 이벤트 복원
          fetchReservations();
        } else {
          // FC 이벤트 속성 직접 변경
          const sc = STATUS_COLORS[newStatus] || STATUS_COLORS.CONFIRMED;
          if (calApi) {
            const fcEvent = calApi.getEventById(reservationId);
            if (fcEvent) {
              fcEvent.setProp('backgroundColor', sc.bg);
              fcEvent.setProp('borderColor', sc.bar);
              fcEvent.setProp('textColor', sc.text);
              fcEvent.setExtendedProp('status', newStatus);
            }
          }
        }
      }
    } catch (e) {
      console.error('상태 변경 실패:', e);
    }
  }, [shopSlug, fetchReservations]);

  // 일별 요약 맵
  const summaryMap = useCallback((): Record<string, DaySummary> => {
    const dayMap: Record<string, ReservationEvent[]> = {};
    rawEvents
      .filter((r) => r.status !== 'CANCELLED')
      .forEach((r) => {
        // KST(UTC+9) 보정된 날짜 키 사용
        const d = new Date(new Date(r.startTime).getTime() + 9 * 60 * 60 * 1000);
        const day = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
        if (!dayMap[day]) dayMap[day] = [];
        dayMap[day].push(r);
      });

    const result: Record<string, DaySummary> = {};
    Object.entries(dayMap).forEach(([date, evts]) => {
      const starts = evts.map((e) => new Date(e.startTime).getTime());
      const ends = evts.map((e) => new Date(e.endTime).getTime());
      const first = new Date(Math.min(...starts));
      const last = new Date(Math.max(...ends));

      const totalMin = (bizClose - bizOpen) * 60;
      const sorted = evts
        .map((e) => ({ s: new Date(e.startTime), e: new Date(e.endTime) }))
        .sort((a, b) => a.s.getTime() - b.s.getTime());
      const merged: { s: Date; e: Date }[] = [];
      for (const slot of sorted) {
        if (merged.length && slot.s <= merged[merged.length - 1].e) {
          merged[merged.length - 1].e = new Date(Math.max(merged[merged.length - 1].e.getTime(), slot.e.getTime()));
        } else {
          merged.push({ s: new Date(slot.s), e: new Date(slot.e) });
        }
      }
      const busyMin = merged.reduce((sum, m) => sum + (m.e.getTime() - m.s.getTime()) / 60000, 0);
      const freeMin = Math.max(0, totalMin - busyMin);

      const fmt = (d: Date) => {
        const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
        return `${kst.getUTCHours()}:${String(kst.getUTCMinutes()).padStart(2, '0')}`;
      };

      const workMin = Math.round((last.getTime() - first.getTime()) / 60000);

      result[date] = {
        count: evts.length,
        firstTime: fmt(first),
        lastTime: fmt(last),
        freeH: Math.floor(freeMin / 60),
        freeM: Math.round(freeMin % 60),
        workH: Math.floor(workMin / 60),
        workM: Math.round(workMin % 60),
      };
    });
    return result;
  }, [rawEvents, bizClose, bizOpen]);

  // 월간 뷰 날짜 셀에 요약 주입
  const handleDayCellDidMount = useCallback((arg: { date: Date; el: HTMLElement; view: { type: string } }) => {
    if (arg.view.type !== 'dayGridMonth') return;

    // FC의 data-date 속성은 항상 YYYY-MM-DD 로컬 날짜 (타임존 안전)
    const dateStr = arg.el.getAttribute('data-date') || `${arg.date.getFullYear()}-${String(arg.date.getMonth() + 1).padStart(2, '0')}-${String(arg.date.getDate()).padStart(2, '0')}`;
    const map = summaryMap();
    const s = map[dateStr];

    const existing = arg.el.querySelector('.bm-day-summary');
    if (existing) existing.remove();

    arg.el.style.cursor = 'pointer';
    arg.el.style.position = 'relative';

    // 기존 커스텀 배지 모두 제거 (중복 방지)
    arg.el.querySelectorAll('.bm-holiday-badge, .bm-today-badge').forEach(e => e.remove());
    // 숨겨진 dayTop 복원
    const restoredDayTop = arg.el.querySelector('.fc-daygrid-day-top') as HTMLElement;
    if (restoredDayTop) restoredDayTop.style.display = '';

    // 오늘 판단 (문자열 비교 — 타임존 안전)
    const todayStr = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; })();
    const isToday = dateStr === todayStr;
    const holiday = isHoliday(dateStr);

    if (holiday || isToday) {
      // dayTop(FC 기본 날짜 영역) 전체를 숨기고 pill로 대체
      const dayTop = arg.el.querySelector('.fc-daygrid-day-top') as HTMLElement;
      if (dayTop) dayTop.style.display = 'none';

      const dayText = dateStr.split('-')[2].replace(/^0/, '');
      const pill = document.createElement('div');
      pill.className = holiday ? 'bm-holiday-badge' : 'bm-today-badge';
      const fs = mob ? '9px' : '11px';
      pill.style.cssText = `position:absolute;top:2px;right:2px;display:inline-flex;align-items:center;gap:0;border-radius:20px;padding:2px 6px;white-space:nowrap;z-index:6;`;

      if (holiday) {
        arg.el.style.background = 'repeating-linear-gradient(135deg, transparent, transparent 6px, rgba(200,200,200,0.13) 6px, rgba(200,200,200,0.13) 7px)';
        pill.style.background = '#FFF5F5';
        let html = '';
        if (isToday) {
          html += `<span style="font-size:${fs};font-weight:700;color:#3B82F6;padding:0 5px;">Today</span>`;
          html += `<span style="color:#D1D5DB;font-size:10px;">|</span>`;
        }
        html += `<span style="font-size:${fs};font-weight:700;color:#EF4444;padding:0 5px;">휴무</span>`;
        html += `<span style="color:#D1D5DB;font-size:10px;">|</span>`;
        html += `<span style="font-size:${fs};font-weight:600;color:#EF4444;padding:0 5px;">${dayText}일</span>`;
        pill.innerHTML = html;
      } else {
        pill.style.background = '#F0F7FF';
        pill.innerHTML = `<span style="font-size:${fs};font-weight:700;color:#3B82F6;padding:0 5px;">Today</span><span style="color:#D1D5DB;font-size:10px;">|</span><span style="font-size:${fs};font-weight:600;color:#3B82F6;padding:0 5px;">${dayText}일</span>`;
      }
      arg.el.appendChild(pill);
    }

    if (!s) {
      // 근무일인데 예약 없는 날 — 시각적 표시
      if (!holiday) {
        arg.el.style.background = 'rgba(148,163,184,0.06)';
        const emptyBadge = document.createElement('div');
        emptyBadge.className = 'bm-day-summary';
        emptyBadge.style.cssText = `position:absolute;bottom:50%;left:50%;transform:translate(-50%,50%);display:flex;flex-direction:column;align-items:center;gap:4px;pointer-events:none;opacity:0.5;`;
        emptyBadge.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${mob ? 16 : 24}" height="${mob ? 16 : 24}" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span style="font-size:${mob ? '8px' : '10px'};color:#94A3B8;font-weight:600;">예약 없음</span>
        `;
        arg.el.appendChild(emptyBadge);
      }
      return;
    }

    const totalMin = (bizClose - bizOpen) * 60;
    const busyMin = totalMin - (s.freeH * 60 + s.freeM);
    const util = Math.round((busyMin / totalMin) * 100);
    // 5단계 효율 구간: 색상, 배경색, 라벨
    const UTIL_LEVELS = [
      { min: 0,  max: 20,  color: '#93C5FD', bg: 'rgba(147,197,253,0.10)', label: '여유' },
      { min: 20, max: 40,  color: '#6EE7B7', bg: 'rgba(110,231,183,0.10)', label: '보통' },
      { min: 40, max: 60,  color: '#FCD34D', bg: 'rgba(252,211,77,0.12)',  label: '적정' },
      { min: 60, max: 80,  color: '#FB923C', bg: 'rgba(251,146,60,0.12)',  label: '바쁨' },
      { min: 80, max: 101, color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   label: '풀' },
    ];
    const level = UTIL_LEVELS.find(l => util >= l.min && util < l.max) || UTIL_LEVELS[4];
    const utilColor = level.color;
    const cellBg = level.bg;
    const fmtT = (t: string) => { const p = t.split(':'); return `${p[0].padStart(2,'0')}:${p[1]}`; };
    const workStr = `${String(s.workH).padStart(2,'0')}:${String(s.workM).padStart(2,'0')}`;

    // 셀 배경색 적용
    arg.el.style.background = cellBg;

    // 꽉 찬 날 (90% 이상) — 만석 배지
    if (util >= 90) {
      const fullBadge = document.createElement('div');
      fullBadge.style.cssText = `position:absolute;top:2px;left:2px;background:#EF4444;color:#fff;font-size:${mob ? '7px' : '9px'};font-weight:800;padding:1px 6px;border-radius:10px;z-index:5;letter-spacing:1px;`;
      fullBadge.textContent = util >= 100 ? '만석' : '마감임박';
      arg.el.appendChild(fullBadge);
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'bm-day-summary';
    wrapper.style.cssText = `
      position:absolute; bottom:4px; left:4px; right:4px;
      display:flex; flex-direction:column; gap:2px;
      pointer-events:none; font-size:9px; line-height:1.3;
    `;

    // 실제 %만큼 채워지는 단일 프로그레스 바
    const barWidth = Math.min(util, 100);
    const barHtml = `<div style="width:${barWidth}%;height:100%;background:${utilColor};border-radius:3px;transition:width 0.3s;"></div>`;

    // 아이콘 SVG (모바일용)
    const ico = (path: string, color: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
    const icoBook = ico('M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', c.primary);
    const icoStart = ico('M12 2v20M2 12l10-10M22 12l-10-10', '#10B981');
    const icoEnd = ico('M18 6L6 18M6 6l12 12', '#EF4444');
    const icoWork = ico('M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2', '#6366F1');
    const icoEff = ico('M18 20V10M12 20V4M6 20v-6', utilColor);

    const lbl = (icon: string, label: string) => mob ? icon : `<span>${label}</span>`;

    wrapper.innerHTML = `
      <div style="display:flex;justify-content:space-between;font-weight:700;color:${c.primary};align-items:center">
        ${lbl(icoBook, '예약')}<span>${s.count}건</span>
      </div>
      <div style="display:flex;justify-content:space-between;color:${c.textLight};align-items:center">
        ${lbl(icoStart, '시작')}<span>${fmtT(s.firstTime)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;color:${c.textLight};align-items:center">
        ${lbl(icoEnd, '종료')}<span>${fmtT(s.lastTime)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;color:${c.text};align-items:center">
        ${lbl(icoWork, '근무')}<span>${workStr}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        ${lbl(icoEff, '효율')}
        <span style="font-weight:800;color:${utilColor};font-size:10px">${util}% <span style="font-size:8px;font-weight:600;opacity:0.8">${level.label}</span></span>
      </div>
      <div style="width:100%;height:6px;border-radius:3px;background:${c.borderLight};overflow:hidden;margin-top:2px;">
        ${barHtml}
      </div>
    `;

    arg.el.appendChild(wrapper);
  }, [summaryMap, c.primary, c.primaryLight, c.textOnPrimary, c.borderLight, c.text, c.textLight, bizClose, bizOpen, mob, isHoliday]);

  // 주간/일간 요일 헤더에 뱃지+바 주입
  const injectHeaderSummary = useCallback((el: HTMLElement, dateStr: string) => {
    const existing = el.querySelector('.bm-header-summary');
    if (existing) existing.remove();
    const existingBadge = el.querySelector('.bm-count-badge');
    if (existingBadge) existingBadge.remove();

    // 휴무일이면 휴무 뱃지만 표시
    if (isHoliday(dateStr)) {
      const badge = document.createElement('div');
      badge.className = 'bm-header-summary';
      badge.style.cssText = 'display:flex;align-items:center;justify-content:center;padding:4px 0;';
      badge.innerHTML = `<span style="font-size:10px;font-weight:700;color:#EF4444;background:rgba(239,68,68,0.08);padding:1px 8px;border-radius:10px;letter-spacing:1px;">휴무</span>`;
      el.appendChild(badge);
      return;
    }

    const map = summaryMap();
    const s = map[dateStr];
    if (!s) return;

    const totalMin = (bizClose - bizOpen) * 60;
    const busyMin = totalMin - (s.freeH * 60 + s.freeM);
    const util = Math.round((busyMin / totalMin) * 100);
    const UTIL_LEVELS = [
      { min: 0,  max: 20,  color: '#93C5FD', label: '여유' },
      { min: 20, max: 40,  color: '#6EE7B7', label: '보통' },
      { min: 40, max: 60,  color: '#FCD34D', label: '적정' },
      { min: 60, max: 80,  color: '#FB923C', label: '바쁨' },
      { min: 80, max: 101, color: '#EF4444', label: '풀' },
    ];
    const level = UTIL_LEVELS.find(l => util >= l.min && util < l.max) || UTIL_LEVELS[4];
    const barWidth = Math.min(util, 100);

    const wrapper = document.createElement('div');
    wrapper.className = 'bm-header-summary';
    wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:3px;padding:4px 8px 6px;';

    // 건수를 요일 아래에 표시
    const cushion = el.querySelector('.fc-col-header-cell-cushion') as HTMLElement;
    if (cushion && !el.querySelector('.bm-count-badge')) {
      cushion.style.cssText += ';display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:2px;';
      const countBadge = document.createElement('span');
      countBadge.className = 'bm-count-badge';
      countBadge.style.cssText = `font-size:10px;font-weight:700;color:${c.textOnPrimary};background:${c.primary};border-radius:8px;padding:0 5px;`;
      countBadge.textContent = `${s.count}건`;
      cushion.appendChild(countBadge);
    }

    wrapper.innerHTML = `
      <div style="display:inline-flex;align-items:center;gap:4px;color:${c.textLight};font-size:9px;font-weight:400;">
        ${s.firstTime}~${s.lastTime}
      </div>
      <div style="display:flex;align-items:center;gap:4px;width:90%;">
        <div style="flex:1;height:6px;border-radius:3px;background:${c.borderLight};overflow:hidden;">
          <div style="width:${barWidth}%;height:100%;background:${level.color};border-radius:3px;"></div>
        </div>
        <span style="font-size:9px;font-weight:700;color:${level.color};white-space:nowrap;">${util}%</span>
      </div>
    `;
    el.appendChild(wrapper);
  }, [summaryMap, c.primary, c.primaryLight, c.textOnPrimary, c.borderLight, bizClose, bizOpen, isHoliday]);

  const handleDayHeaderDidMount = useCallback((arg: { date: Date; el: HTMLElement; view: { type: string } }) => {
    if (arg.view.type === 'dayGridMonth') return;
    const dateStr = `${arg.date.getFullYear()}-${String(arg.date.getMonth() + 1).padStart(2, '0')}-${String(arg.date.getDate()).padStart(2, '0')}`;
    injectHeaderSummary(arg.el, dateStr);

    // 클릭 시 해당 날짜 컬럼 활성화
    arg.el.style.cursor = 'pointer';
    arg.el.onclick = () => {
      setActiveDate(prev => prev === dateStr ? '' : dateStr);
    };
  }, [injectHeaderSummary]);

  // rawEvents 변경 시 기존 셀+헤더에 요약 재주입
  useEffect(() => {
    if (rawEvents.length === 0) return;
    // 월간 셀
    const cells = document.querySelectorAll('.fc-daygrid-day');
    cells.forEach((el) => {
      const dateStr = (el as HTMLElement).dataset.date;
      if (!dateStr) return;
      handleDayCellDidMount({
        date: new Date(dateStr + 'T00:00:00'),
        el: el as HTMLElement,
        view: { type: 'dayGridMonth' },
      });
    });
    // 주간/일간 헤더
    const headers = document.querySelectorAll('.fc-col-header-cell');
    headers.forEach((el) => {
      const dateStr = (el as HTMLElement).dataset.date;
      if (!dateStr) return;
      injectHeaderSummary(el as HTMLElement, dateStr);
    });
    // 주간/일간 뷰 td 셀에 휴무 배경 적용
    const tdCells = document.querySelectorAll('.fc-timegrid-col[data-date]');
    tdCells.forEach((el) => {
      const dateStr = (el as HTMLElement).dataset.date;
      if (!dateStr) return;
      if (isHoliday(dateStr)) {
        (el as HTMLElement).style.background = 'repeating-linear-gradient(135deg, transparent, transparent 8px, rgba(239,68,68,0.04) 8px, rgba(239,68,68,0.04) 9px)';
      }
    });
  }, [rawEvents, handleDayCellDidMount, injectHeaderSummary, isHoliday]);

  // 헤더 렌더링 후 뱃지 동기화
  useEffect(() => {
    const timer = setTimeout(() => {
      const badges = document.querySelectorAll('.bm-count-badge') as NodeListOf<HTMLElement>;
      if (badges.length === 0) return;

      // 1) 모두 row(한 줄)로 리셋
      const cushions: HTMLElement[] = [];
      badges.forEach(badge => {
        const parent = badge.parentElement as HTMLElement;
        if (parent) {
          parent.style.flexDirection = 'row';
          cushions.push(parent);
        }
      });

      // 2) 리플로우 강제 → 실제 높이 측정
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      document.body.offsetHeight;

      // 3) 한 줄 기준 높이 측정 (가장 작은 cushion 높이가 한 줄)
      let minH = Infinity;
      cushions.forEach(c => { if (c.offsetHeight < minH) minH = c.offsetHeight; });

      // 4) 어떤 cushion이든 한 줄보다 높으면 → 줄바꿈 발생
      let anyWrapped = false;
      cushions.forEach(c => { if (c.offsetHeight > minH + 4) anyWrapped = true; });

      // 5) 하나라도 줄바꿈이면 모두 column
      if (anyWrapped) {
        cushions.forEach(c => { c.style.flexDirection = 'column'; });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [rawEvents]);

  // 겹치는 이벤트 → 뱃지 클릭으로 수동 전환
  const overlapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setupOverlap = useCallback((force = true) => {
    if (overlapTimerRef.current) clearTimeout(overlapTimerRef.current);

    overlapTimerRef.current = setTimeout(() => {
      // force가 아닌 경우, 이미 겹침 처리가 되어있으면 건너뜀
      if (!force && document.querySelectorAll('.bm-overlap-badge').length > 0) return;

      document.querySelectorAll('.bm-overlap-badge,.bm-overlap-content').forEach(el => el.remove());

      // 이전 setupOverlap에서 변형된 harness만 복원 (data-bm-overlap 마킹된 것)
      const modified = document.querySelectorAll('.fc-timegrid-event-harness[data-bm-overlap]');
      modified.forEach(h => {
        const el = h as HTMLElement;
        el.style.display = el.getAttribute('data-bm-orig-display') || '';
        el.style.inset = el.getAttribute('data-bm-orig-inset') || '';
        el.style.width = el.getAttribute('data-bm-orig-width') || '';
        el.style.height = el.getAttribute('data-bm-orig-height') || '';
        el.style.zIndex = el.getAttribute('data-bm-orig-z') || '';
        el.removeAttribute('data-bm-overlap');
        el.removeAttribute('data-bm-orig-display');
        el.removeAttribute('data-bm-orig-inset');
        el.removeAttribute('data-bm-orig-width');
        el.removeAttribute('data-bm-orig-height');
        el.removeAttribute('data-bm-orig-z');
        const ev = el.querySelector('.fc-timegrid-event') as HTMLElement;
        if (ev) {
          ev.style.height = '';
          ev.style.minHeight = '';
          ev.style.position = '';
          ev.style.overflow = '';
        }
        const main = el.querySelector('.fc-event-main') as HTMLElement;
        if (main) main.style.display = '';
      });

      // 복원 후 DOM 리플로우를 기다린 다음 겹침 감지
      const runDetection = () => {
      const harnesses = document.querySelectorAll('.fc-timegrid-event-harness') as NodeListOf<HTMLElement>;
      if (!harnesses.length) return;

      type HInfo = { el: HTMLElement; col: string; top: number; bottom: number; };
      const infos: HInfo[] = [];
      harnesses.forEach(h => {
        const col = h.closest('.fc-timegrid-col')?.getAttribute('data-date') || '';
        const insetStr = h.style.inset || '';
        const topPx = parseFloat(insetStr.split(' ')[0]) || 0;
        const height = h.getBoundingClientRect().height;
        if (height > 0) infos.push({ el: h, col, top: topPx, bottom: topPx + height });
      });

      const groups: HInfo[][] = [];
      const used = new Set<number>();
      for (let i = 0; i < infos.length; i++) {
        if (used.has(i)) continue;
        const group = [infos[i]];
        used.add(i);
        for (let j = i + 1; j < infos.length; j++) {
          if (used.has(j)) continue;
          if (infos[i].col !== infos[j].col) continue;
          const ov = group.some(g => g.top < infos[j].bottom - 1 && infos[j].top < g.bottom - 1);
          if (ov) { group.push(infos[j]); used.add(j); }
        }
        if (group.length > 1) groups.push(group);
      }

      if (groups.length === 0) return;

      groups.forEach(group => {
        group.sort((a, b) => a.top - b.top);
        const main = group[0];
        const mainEvent = main.el.querySelector('.fc-timegrid-event') as HTMLElement;
        if (!mainEvent) return;

        const groupMinTop = Math.min(...group.map(g => g.top));
        const groupMaxBottom = Math.max(...group.map(g => g.bottom));
        const groupHeight = groupMaxBottom - groupMinTop;

        // FC 이벤트 객체 매핑
        const api = calendarRef.current?.getApi();
        const allFcEvents = api?.getEvents() || [];
        const colDate = group[0].col;

        type OverlapItem = { content: string; relTop: number; height: number; el?: HTMLElement; eventData?: typeof allFcEvents[0]; };
        const items: OverlapItem[] = [];
        const usedIds = new Set<string>();

        group.forEach((info, idx) => {
          const eventMain = info.el.querySelector('.fc-event-main');
          const htmlContent = eventMain?.innerHTML || '';

          // 콘텐츠에서 시간 추출 (예: "8:30 - 9:15")
          const timeMatch = htmlContent.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
          let matchedEvent: typeof allFcEvents[0] | undefined;

          if (timeMatch) {
            const startH = parseInt(timeMatch[1]);
            const startM = parseInt(timeMatch[2]);
            matchedEvent = allFcEvents.find(ev => {
              if (!ev.start || usedIds.has(ev.id)) return false;
              const d = ev.start;
              const evDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              if (evDate !== colDate) return false;
              // KST 보정: UTC+9
              const kstH = (d.getUTCHours() + 9) % 24;
              const kstM = d.getUTCMinutes();
              return kstH === startH && kstM === startM;
            });
          }
          if (matchedEvent) usedIds.add(matchedEvent.id);

          if (eventMain) {
            items.push({
              content: htmlContent,
              relTop: info.top - groupMinTop,
              height: info.bottom - info.top,
              eventData: matchedEvent,
            });
          }
          if (idx === 0) {
            // 원래 스타일 저장
            info.el.setAttribute('data-bm-overlap', '1');
            info.el.setAttribute('data-bm-orig-inset', info.el.style.inset || '');
            info.el.setAttribute('data-bm-orig-width', info.el.style.width || '');
            info.el.setAttribute('data-bm-orig-height', info.el.style.height || '');
            info.el.setAttribute('data-bm-orig-z', info.el.style.zIndex || '');
            info.el.style.inset = `${groupMinTop}px 0px auto 0px`;
            info.el.style.width = '100%';
            info.el.style.height = `${groupHeight}px`;
            info.el.style.zIndex = '15';
            mainEvent.style.height = '100%';
            mainEvent.style.minHeight = '100%';
            mainEvent.style.position = 'relative';
            mainEvent.style.overflow = 'hidden';
            const origMain = mainEvent.querySelector('.fc-event-main') as HTMLElement;
            if (origMain) origMain.style.display = 'none';
          } else {
            info.el.setAttribute('data-bm-overlap', '1');
            info.el.setAttribute('data-bm-orig-display', info.el.style.display || '');
            info.el.style.display = 'none';
          }
        });

        if (items.length <= 1) return;

        let current = 0;

        // 아이템 클릭 → 상세 팝업
        const openDetail = (item: OverlapItem) => {
          const ev = item.eventData;
          if (!ev) return;
          const p = ev.extendedProps;
          const fmt = (d: Date | null) => d ? `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}` : '';
           setSelectedEvent({
            id: ev.id,
            menu: p.menu, customer: p.customer, phone: p.phone,
            staff: p.staff, status: p.status, session: p.session,
            start: fmt(ev.start), end: fmt(ev.end),
            customerId: p.customerId, menuName: p.menuName,
            profileImage: p.profileImage, birthday: p.birthday, gender: p.gender,
            eventDate: ev.start?.toISOString() || '',
            managementFields: p.managementFields || [],
            managementData: p.managementData || {},
          });
          setHistoryTab('menu');
        };

        const contentWrap = document.createElement('div');
        contentWrap.className = 'bm-overlap-content';
        contentWrap.style.cssText = `position:absolute;top:0;left:0;right:0;bottom:0;`;

        const badgeH = 22; // 중복 뱃지 높이
        items.forEach((item, idx) => {
          const div = document.createElement('div');
          const topOffset = idx === 0 ? item.relTop + badgeH : item.relTop;
          div.style.cssText = `
            position:absolute;top:${topOffset}px;left:0;right:0;
            height:${item.height - (idx === 0 ? badgeH : 0)}px;box-sizing:border-box;
            padding:2px 6px;overflow:hidden;cursor:pointer;
            transition:all 0.3s ease;
          `;
          div.innerHTML = item.content;
          const textH = 52; // 텍스트 3줄 높이(시간+메뉴+고객)
          if (idx === 0) {
            div.style.background = `linear-gradient(to bottom, #fff ${textH}px, rgba(255,255,255,0.6) ${textH + 10}px, rgba(255,255,255,0) ${textH + 40}px)`;
            div.style.zIndex = '5';
            div.style.opacity = '1';
            div.style.fontWeight = '700';
            div.style.borderRadius = '4px';
          } else {
            div.style.background = 'transparent';
            div.style.zIndex = '1';
            div.style.opacity = '0.3';
            div.style.fontWeight = '400';
          }
          // 클릭: 활성→상세팝업, 비활성→활성으로 전환
          div.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (idx === current) {
              openDetail(item);
            } else {
              current = idx;
              updateActive();
              topBadge.textContent = `중복(${current + 1}/${items.length})건`;
            }
          });
          contentWrap.appendChild(div);
          item.el = div;
        });

        mainEvent.appendChild(contentWrap);

        const textH = 52;
        const updateActive = () => {
          items.forEach((item, idx) => {
            if (!item.el) return;
            const isActive = idx === current;
            // 첫 번째 아이템은 항상 뱃지 아래
            const needOffset = idx === 0;
            item.el.style.top = `${item.relTop + (needOffset ? badgeH : 0)}px`;
            item.el.style.height = `${item.height - (needOffset ? badgeH : 0)}px`;
            item.el.style.background = isActive
              ? `linear-gradient(to bottom, #fff ${textH}px, rgba(255,255,255,0.6) ${textH + 10}px, rgba(255,255,255,0) ${textH + 40}px)`
              : 'transparent';
            item.el.style.zIndex = isActive ? '5' : '1';
            item.el.style.opacity = isActive ? '1' : '0.3';
            item.el.style.fontWeight = isActive ? '700' : '400';
            item.el.style.borderRadius = isActive ? '4px' : '0';
          });
        };

        const topBadge = document.createElement('div');
        topBadge.className = 'bm-overlap-badge';
        topBadge.style.cssText = `position:absolute;top:2px;right:2px;background:#EF4444;color:#fff;font-size:9px;font-weight:800;padding:2px 8px;border-radius:8px;z-index:12;cursor:pointer;user-select:none;transition:transform 0.15s;`;
        topBadge.textContent = `중복(1/${items.length})건`;
        topBadge.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          current = (current + 1) % items.length;
          updateActive();
          topBadge.textContent = `중복(${current + 1}/${items.length})건`;
          topBadge.style.transform = 'scale(0.9)';
          setTimeout(() => { topBadge.style.transform = 'scale(1)'; }, 150);
        });
        mainEvent.appendChild(topBadge);
      });
      }; // end runDetection

      // 복원이 필요했으면 rAF 후 감지, 아니면 즉시 감지
      if (modified.length > 0) {
        requestAnimationFrame(() => requestAnimationFrame(runDetection));
      } else {
        runDetection();
      }
    }, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // 첫 시도: force로 실행 (기존 겹침 제거 후 재감지)
    const t1 = setTimeout(() => setupOverlap(true), 300);
    // 이후 재시도: 이미 성공했으면 건너뜀
    const retries = [800, 1500, 2500].map(ms =>
      setTimeout(() => setupOverlap(false), ms)
    );
    return () => {
      if (overlapTimerRef.current) clearTimeout(overlapTimerRef.current);
      clearTimeout(t1);
      retries.forEach(t => clearTimeout(t));
    };
  }, [events, setupOverlap]);

  // 건수 뱃지 줄바꿈 동기화: 하나라도 줄바꿈이면 모두 줄바꿈
  const syncBadgeLayout = useCallback(() => {
    const doSync = () => {
      const badges = document.querySelectorAll('.bm-count-badge') as NodeListOf<HTMLElement>;
      if (badges.length === 0) return;

      const cushions: HTMLElement[] = [];
      badges.forEach(badge => {
        const parent = badge.parentElement as HTMLElement;
        if (parent) {
          parent.style.flexDirection = 'row';
          cushions.push(parent);
        }
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      document.body.offsetHeight;

      let minH = Infinity;
      cushions.forEach(c => { if (c.offsetHeight < minH) minH = c.offsetHeight; });

      let anyWrapped = false;
      cushions.forEach(c => { if (c.offsetHeight > minH + 4) anyWrapped = true; });

      if (anyWrapped) {
        cushions.forEach(c => { c.style.flexDirection = 'column'; });
      }
    };
    // 즉시 + 딜레이 두 번 실행 (헤더 렌더링 타이밍 보장)
    doSync();
    setTimeout(doSync, 300);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const adjustColWidths = useCallback(() => { syncBadgeLayout(); }, [syncBadgeLayout]);

  // 윈도우 리사이즈 시 뱃지 동기화
  useEffect(() => {
    const handleResize = () => syncBadgeLayout();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [syncBadgeLayout]);

  // dateClick: 싱글클릭 → 셀 강조, 더블클릭 → 일간 뷰
  const lastClickRef = useRef<{ date: string; time: number }>({ date: '', time: 0 });
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDateClick = useCallback((info: { dateStr: string; view: { type: string } }) => {
    const now = Date.now();
    const last = lastClickRef.current;
    const isDoubleClick = last.date === info.dateStr && (now - last.time) < 350;
    lastClickRef.current = { date: info.dateStr, time: now };

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }

    if (isDoubleClick) {
      // 더블클릭 → 일간 뷰
      setPopupDate(null);
      const api = calendarRef.current?.getApi();
      if (api) {
        api.changeView('timeGridDay', info.dateStr);
        setActiveDate('');
      }
    } else {
      // 싱글클릭
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        if (info.view.type === 'dayGridMonth') {
          // 월간 뷰 → 팝업
          setPopupDate(prev => prev === info.dateStr ? null : info.dateStr);
          setActiveDate(info.dateStr);
        } else {
          // 주간/일간 → 셀 강조만
          setActiveDate(prev => prev === info.dateStr ? '' : info.dateStr);
        }
      }, 300);
    }
  }, []);

  // 클릭한 날짜 컬럼/셀 활성화
  useEffect(() => {
    // 주간 뷰
    const allTh = document.querySelectorAll('.fc-col-header-cell');
    const allTd = document.querySelectorAll('.fc-timegrid-col');
    allTh.forEach(el => el.classList.remove('bm-col-active'));
    allTd.forEach(el => el.classList.remove('bm-col-active'));
    // 월간 뷰
    const allDayCells = document.querySelectorAll('.fc-daygrid-day');
    allDayCells.forEach(el => el.classList.remove('bm-cell-active'));

    if (!activeDate) return;

    allTh.forEach(el => {
      if ((el as HTMLElement).dataset.date === activeDate) el.classList.add('bm-col-active');
    });
    allTd.forEach(el => {
      if ((el as HTMLElement).dataset.date === activeDate) el.classList.add('bm-col-active');
    });
    allDayCells.forEach(el => {
      if ((el as HTMLElement).dataset.date === activeDate) el.classList.add('bm-cell-active');
    });
  }, [activeDate]);

  // 선택 회원의 방문 이력 (고객ID 기반)
  const customerHistory = selectedEvent
    ? rawEvents
        .filter((r) => r.customerId && r.customerId === selectedEvent.customerId && r.status !== 'CANCELLED')
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    : [];
  // 해당 시술만 필터
  const menuHistory = selectedEvent
    ? customerHistory.filter((r) => r.menu?.name === selectedEvent.menuName)
    : [];

  const STATUS_LABEL: Record<string, string> = {
    CONFIRMED: '확정', PENDING: '대기', COMPLETED: '완료', CANCELLED: '취소', NO_SHOW: '노쇼', REQUESTED: '요청', IN_PROGRESS: '시술중',
  };

  return (
    <div style={{ display: 'flex', flexDirection: mob ? 'column' : 'row', gap: mob ? 10 : 16 }}>
      {/* 캘린더 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="rounded-2xl border overflow-hidden" style={{ background: c.surface, borderColor: c.borderLight }}>
          <style>{`
            @keyframes bm-pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.6; transform: scale(0.95); }
            }
            @keyframes bm-fade-in {
              from { opacity: 0; transform: translateY(4px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .fc {
              --fc-border-color: ${c.borderLight};
              --fc-today-bg-color: transparent;
              --fc-page-bg-color: transparent;
              --fc-neutral-bg-color: ${c.secondaryLight};
              --fc-event-border-color: transparent;
              font-family: 'Pretendard','Noto Sans KR',sans-serif;
            }
            /* 월간 뷰: 오늘 셀 기본 스타일 완전 제거 (커스텀 pill 사용) */
            .fc-dayGridMonth-view .fc-day-today { background:transparent!important; }
            .fc-dayGridMonth-view .fc-day-today .fc-daygrid-day-number,
            .fc-dayGridMonth-view .fc-day-today a.fc-daygrid-day-number,
            .fc-dayGridMonth-view .fc-day-today .fc-daygrid-day-top a,
            .fc-dayGridMonth-view .fc-day-today .fc-daygrid-day-top .fc-daygrid-day-number { display:none!important; }
            .fc-dayGridMonth-view .fc-day-today .fc-daygrid-day-frame { background:transparent!important; }
            /* 주간 뷰: 오늘 컬럼 넓고 밝게, 나머지 좁고 약간 어둡게 */
            .fc-timeGridWeek-view .fc-col-header-cell { position:relative; }
            .fc-timeGridWeek-view th.fc-day-today::before {
              content:'✦ TODAY ✦'; display:block; position:absolute; top:0; left:0; right:0;
              background:linear-gradient(135deg, ${c.primary}, ${c.primary}DD); color:#fff;
              font-size:11px; font-weight:900; letter-spacing:2px;
              text-align:center; padding:4px 0; z-index:5;
              box-shadow: 0 3px 10px ${c.primary}60;
            }
            .fc-timeGridWeek-view .fc-day-today .fc-col-header-cell-cushion { color:${c.primary}!important; font-weight:800!important; font-size:13px!important; padding-top:24px!important; }
            .fc-timeGridWeek-view td.fc-day-today,
            .fc-timeGridWeek-view th.fc-day-today { background:transparent!important; opacity:1!important; }
            .fc-timeGridWeek-view td.fc-day-today .fc-timegrid-event { opacity:1!important; }
            .fc-timeGridWeek-view td:not(.fc-day-today):not(.fc-timegrid-axis),
            .fc-timeGridWeek-view th:not(.fc-day-today):not(.fc-timegrid-axis) { opacity:1!important; }
            .fc-timeGridWeek-view td:not(.fc-day-today) .fc-timegrid-event { opacity:1!important; }
            /* 날짜 클릭 시 해당 컬럼 활성화 */
            .fc-timeGridWeek-view th.bm-col-active,
            .fc-timeGridWeek-view td.bm-col-active { opacity:1!important; background:#fff!important; }
            .fc-timeGridWeek-view th.bm-col-active .fc-col-header-cell-cushion { color:${c.primary}!important; font-weight:800!important; }
            /* 오늘 컬럼 너비 확대 (colgroup) */
            .fc-timeGridWeek-view table { table-layout:fixed!important; }
            .fc-timeGridWeek-view .fc-timegrid-axis { width:52px!important; min-width:52px!important; max-width:52px!important; }
            .fc-timeGridWeek-view col { width:12%!important; }
            .fc-timeGridWeek-view .fc-scrollgrid-sync-table col:nth-child(2),
            .fc-timeGridWeek-view .fc-col-header col:nth-child(2) { width:12%!important; }
            .fc-timeGridWeek-view th.fc-day-today,
            .fc-timeGridWeek-view td.fc-day-today { width:20%!important; min-width:20%!important; }
            .fc .fc-toolbar { padding:16px 20px 12px; margin-bottom:0!important; gap:12px; }
            .fc .fc-toolbar-title { font-size:18px!important; font-weight:700!important; color:${c.text}!important; }
            .fc .fc-button {
              border:1px solid ${c.borderLight}!important; background:transparent!important;
              color:${c.text}!important; font-size:12px!important; font-weight:500!important;
              padding:6px 14px!important; border-radius:8px!important; box-shadow:none!important;
              transition:all .15s!important; text-transform:none!important;
            }
            .fc .fc-button:hover { background:${c.primaryLight}!important; border-color:${c.primary}!important; color:${c.primary}!important; }
            .fc .fc-button-active { background:${c.primary}!important; border-color:${c.primary}!important; color:${c.textOnPrimary}!important; }
            .fc .fc-button-active:hover { background:${c.primary}!important; color:${c.textOnPrimary}!important; }
            .fc .fc-prev-button,.fc .fc-next-button { padding:6px 8px!important; border-radius:8px!important; }
            .fc .fc-today-button { border-radius:8px!important; }
            .fc .fc-today-button:disabled { opacity:.4!important; }
            .fc .fc-col-header-cell { padding:10px 0!important; background:${c.secondaryLight}!important; border-color:${c.borderLight}!important; }
            .fc .fc-col-header-cell-cushion { font-size:12px!important; font-weight:600!important; color:${c.textLight}!important; text-decoration:none!important; }
            .fc .fc-day-sun .fc-col-header-cell-cushion { color:#EF4444!important; }
            .fc .fc-day-sat .fc-col-header-cell-cushion { color:#3B82F6!important; }
            .fc .fc-daygrid-day-number { font-size:13px!important; font-weight:500!important; color:${c.text}!important; padding:6px 8px!important; text-decoration:none!important; }
            .fc .fc-day-today {
              background: linear-gradient(135deg, ${c.primaryLight}90 0%, ${c.primaryLight}50 100%)!important;
            }
            .fc .fc-day-today .fc-daygrid-day-number {
              background:${c.primary}!important; color:${c.textOnPrimary}!important;
              border-radius:8px!important; padding:2px 10px!important;
              font-weight:800!important; font-size:14px!important;
              margin:4px 4px 0!important; display:inline-block!important;
              box-shadow: 0 2px 8px ${c.primary}50;
            }
            .fc .fc-day-today .fc-daygrid-day-top::after {
              content:'TODAY'; display:block;
              font-size:9px; font-weight:800; letter-spacing:1px;
              color:${c.primary}; padding:0 8px; margin-top:2px;
            }
            .fc .fc-day-sun .fc-daygrid-day-number { color:#EF4444!important; }
            .fc .fc-day-sat .fc-daygrid-day-number { color:#3B82F6!important; }
            .fc .fc-event { border-radius:6px!important; border:none!important; border-left:3px solid!important; cursor:pointer!important; overflow:hidden!important; }
            .fc .fc-timegrid-event .fc-event-main { padding:4px 8px!important; overflow:hidden!important; }
            .fc .fc-timegrid-event { overflow:hidden!important; }
            .fc .fc-timegrid-slot-label-cushion { font-size:11px!important; color:${c.textLight}!important; }
            .fc .fc-timegrid-slot { height:56px!important; }
            .fc .fc-timegrid-now-indicator-line { display:none!important; }
            .fc .fc-timegrid-now-indicator-arrow { display:none!important; }
            .fc .fc-scroller::-webkit-scrollbar { width:4px; }
            .fc .fc-scroller::-webkit-scrollbar-thumb { background:${c.borderLight}; border-radius:4px; }
            .fc .fc-day-other .fc-daygrid-day-number { opacity:.3!important; }
            .fc .fc-day-other .bm-day-summary { display:none!important; }
            .fc td,.fc th { border-color:${c.borderLight}!important; }
            .fc .fc-daygrid-day-frame { min-height:140px!important; }
            .fc-dayGridMonth-view .fc-daygrid-event-harness { display:none!important; }
            .fc-dayGridMonth-view .fc-daygrid-more-link { display:none!important; }
            .fc-dayGridMonth-view .fc-daygrid-day-events { display:none!important; }
            /* 월간 뷰: 클릭한 셀 활성화 */
            .fc-dayGridMonth-view .fc-daygrid-day.bm-cell-active {
              background:#fff!important; opacity:1!important;
              z-index:10; position:relative;
              box-shadow: inset 0 0 0 2px ${c.primary}, 0 4px 16px rgba(0,0,0,.1);
              transition: all .2s ease;
            }
            .fc-dayGridMonth-view .fc-daygrid-day.bm-cell-active .bm-day-summary {
              transform: scale(1.1); transform-origin: center bottom;
            }
            .fc-dayGridMonth-view .fc-daygrid-day.bm-cell-active .fc-daygrid-day-number {
              color:${c.primary}!important; font-weight:800!important; font-size:15px!important;
            }
            .fc-dayGridMonth-view:has(.bm-cell-active) .fc-daygrid-day:not(.bm-cell-active) {
              opacity:.5!important; transition: opacity .2s;
            }
            .bm-popup-scroll::-webkit-scrollbar { display:none!important; width:0!important; }
            @media (max-width:768px) {
              .fc .fc-toolbar {
                flex-direction:row!important; flex-wrap:nowrap!important;
                gap:4px!important; padding:8px 10px 6px!important;
                align-items:center!important; justify-content:space-between!important;
              }
              .fc .fc-toolbar-chunk { display:flex; gap:3px; align-items:center; flex-shrink:0; }
              .fc .fc-toolbar-chunk:nth-child(2) { flex:1; min-width:0; justify-content:center; }
              .fc .fc-toolbar-title { font-size:13px!important; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
              .fc .fc-button { font-size:10px!important; padding:4px 7px!important; border-radius:6px!important; }
              .fc .fc-prev-button,.fc .fc-next-button { padding:4px 5px!important; }
              .fc .fc-today-button { font-size:9px!important; padding:3px 6px!important; }
              .fc .fc-col-header-cell { padding:6px 0!important; }
              .fc .fc-col-header-cell-cushion { font-size:10px!important; }
              .fc .fc-daygrid-day-number { font-size:11px!important; padding:3px 5px!important; }
              .fc .fc-daygrid-day-frame { min-height:100px!important; }
              .fc .fc-day-today .fc-daygrid-day-number { font-size:11px!important; padding:2px 6px!important; margin:2px 2px 0!important; }
              .fc .fc-day-today .fc-daygrid-day-top::after { font-size:7px!important; }
              .bm-day-summary { bottom:2px!important; left:2px!important; right:2px!important; gap:1px!important; font-size:7px!important; }
              .bm-day-summary > div:last-child { height:2px!important; }
              .fc .fc-timegrid-slot { height:40px!important; }
              .fc .fc-timegrid-slot-label-cushion { font-size:9px!important; }
              .fc .fc-timegrid-event .fc-event-main { padding:2px 4px!important; }
              .fc-timeGridWeek-view col { width:auto!important; }
              .fc-timeGridWeek-view .fc-scrollgrid-sync-table col:nth-child(2),
              .fc-timeGridWeek-view .fc-col-header col:nth-child(2) { width:auto!important; }
              .fc-timeGridWeek-view th.fc-day-today,
              .fc-timeGridWeek-view td.fc-day-today { width:auto!important; min-width:auto!important; }
              .fc-timeGridWeek-view .fc-timegrid-axis { width:36px!important; min-width:36px!important; max-width:36px!important; }
              .fc-timeGridWeek-view th.fc-day-today::before { font-size:8px!important; letter-spacing:1px!important; padding:2px 0!important; }
              .fc-timeGridWeek-view .fc-day-today .fc-col-header-cell-cushion { padding-top:18px!important; font-size:10px!important; }
              .bm-header-summary { gap:2px!important; margin-top:2px!important; }
              .bm-header-summary > div:first-child { font-size:8px!important; padding:1px 4px!important; }
              .bm-header-summary > div:last-child { height:2px!important; }
            }
            /* 주간 뷰 이벤트 선명도 개선 */
            .fc-timeGridWeek-view .fc-timegrid-event .fc-event-main {
              padding:3px 5px!important;
              font-size:11px!important;
            }
            .fc-timeGridWeek-view .fc-timegrid-event {
              border-radius:6px!important;
              border-width:0!important;
              border-left:3px solid rgba(0,0,0,0.15)!important;
              box-shadow:0 1px 3px rgba(0,0,0,0.08)!important;
            }
          `}</style>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={mob ? 'timeGridDay' : 'dayGridMonth'}
            locale="ko"
            headerToolbar={mob
              ? { left: 'prev,next,today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGrid3Day,timeGridDay' }
              : { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGrid3Day,timeGridDay' }
            }
            views={{
              dayGridMonth: {
                dayHeaderFormat: { weekday: 'short' },
              },
              timeGridWeek: {
                dayHeaderFormat: { weekday: 'short', day: 'numeric', omitCommas: true },
              },
              timeGrid3Day: {
                type: 'timeGrid',
                duration: { days: 3 },
                buttonText: '삼일',
                dayHeaderFormat: { weekday: 'short', day: 'numeric', omitCommas: true },
              },
              timeGridDay: {
                dayHeaderFormat: { weekday: 'short', day: 'numeric', omitCommas: true },
              },
            }}
            buttonText={mob
              ? { today: '오늘', month: '당월', week: '칠일', day: '당일' }
              : { today: '오늘', month: '당월', week: '칠일', day: '당일' }
            }
            titleFormat={{ month: 'long', day: 'numeric' }}
            slotLabelFormat={{ hour: 'numeric', minute: '2-digit', hour12: true }}
            events={events}
            height="auto"
            nowIndicator editable={false}
            allDaySlot={false}
            slotMinTime="08:00:00" slotMaxTime="22:00:00" scrollTime="09:00:00"
            expandRows stickyHeaderDates firstDay={0} eventDisplay="block"
            dayCellDidMount={handleDayCellDidMount}
            dayHeaderDidMount={handleDayHeaderDidMount}
            fixedWeekCount={false}
            datesSet={() => { adjustColWidths(); setupOverlap(true); setTimeout(() => setupOverlap(false), 800); }}
            dateClick={handleDateClick}
            navLinks
            navLinkDayClick={(date) => {
              const api = calendarRef.current?.getApi();
              if (api) api.changeView('timeGridDay', date);
            }}
            eventClick={(info) => {
              const p = info.event.extendedProps;
              const fmt = (d: Date | null) => d ? `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}` : '';
              setSelectedEvent({
                id: info.event.id,
                menu: p.menu, customer: p.customer, phone: p.phone,
                staff: p.staff, status: p.status, session: p.session,
                start: fmt(info.event.start), end: fmt(info.event.end),
                customerId: p.customerId, menuName: p.menuName,
                profileImage: p.profileImage, birthday: p.birthday, gender: p.gender,
                eventDate: info.event.start?.toISOString() || '',
                managementFields: p.managementFields || [],
                managementData: p.managementData || {},
              });
              setHistoryTab('menu');
            }}
            eventContent={(arg) => {
              const p = arg.event.extendedProps;
              const fmt = (d: Date | null) => {
                if (!d) return '';
                return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
              };
              const start = arg.event.start ? fmt(arg.event.start) : '';
              const end = arg.event.end ? fmt(arg.event.end) : '';
              const phone = p.phone ? fmtPhone(p.phone) : '';
              const isSelected = selectedEvent?.id === arg.event.id;
              const statusMap: Record<string, string> = { PENDING: '대기', REQUESTED: '요청', IN_PROGRESS: '시술중', COMPLETED: '완료', CANCELLED: '취소', NO_SHOW: '노쇼' };
              const statusLabel = statusMap[p.status] || '';
              const sc = STATUS_COLORS[p.status] || STATUS_COLORS.CONFIRMED;

              if (mob) {
                return {
                  html: `
                    <div style="display:flex;flex-direction:column;gap:0;padding:1px 0;overflow:hidden;${isSelected ? 'opacity:1;' : ''}">
                      <div style="font-size:9px;opacity:.6;font-weight:500">${start}-${end}</div>
                      <div style="font-size:10px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.menu}</div>
                      <div style="font-size:9px;opacity:.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.customer}</div>
                    </div>
                  `
                };
              }

              return {
                html: `
                  <div style="display:flex;flex-direction:column;gap:1px;padding:2px 0;overflow:hidden;${isSelected ? 'opacity:1;' : ''}">
                    <div style="font-size:11px;opacity:.7;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${start} - ${end}${statusLabel ? ` <span style="font-size:9px;font-weight:700;padding:1px 4px;border-radius:3px;background:${sc.bar};color:#fff;margin-left:3px">${statusLabel}</span>` : ''}</div>
                    <div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.menu} <span style="font-weight:500;opacity:.7">(${p.session})</span></div>
                    <div style="font-size:11px;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.customer}${phone ? ' ' + phone : ''}</div>
                  </div>
                `
              };
            }}
          />
        </div>
      </div>

      {/* 월간 날짜 클릭 팝업 */}
      {popupDate && (() => {
        const map = summaryMap();
        const s = map[popupDate];
        const d = new Date(popupDate + 'T00:00:00');
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        const dateLabel = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${dayNames[d.getDay()]})`;
        const dayEvents = rawEvents
          .filter(r => {
            const sd = new Date(r.startTime);
            const localDate = `${sd.getFullYear()}-${String(sd.getMonth() + 1).padStart(2, '0')}-${String(sd.getDate()).padStart(2, '0')}`;
            return localDate === popupDate && r.status !== 'CANCELLED';
          })
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        const fmtTime = (iso: string) => { const dt = new Date(iso); return `${dt.getHours()}:${String(dt.getMinutes()).padStart(2, '0')}`; };

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => { setPopupDate(null); setActiveDate(''); }}>
            {/* 블러 배경 */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} />
            {/* 팝업 */}
            <div
              style={{
                position: 'relative', width: '60%', maxWidth: 520, minWidth: 300,
                maxHeight: '70vh', overflow: 'hidden',
                background: c.surface, borderRadius: 20,
                boxShadow: '0 20px 60px rgba(0,0,0,0.25)', padding: 0,
                display: 'flex', flexDirection: 'column',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${c.borderLight}`, flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: c.text }}>{dateLabel}</div>
                  <button onClick={() => { setPopupDate(null); setActiveDate(''); }}
                    style={{ background: 'none', border: 'none', fontSize: 20, color: c.textLight, cursor: 'pointer', padding: 4 }}>✕</button>
                </div>
              </div>

              {/* 요약 정보 */}
              {(() => {
                const totalMin = (bizClose - bizOpen) * 60;
                const busyMin = s ? totalMin - (s.freeH * 60 + s.freeM) : 0;
                const util = s ? Math.round((busyMin / totalMin) * 100) : 0;
                const workStr = s ? `${String(s.workH).padStart(2,'0')}:${String(s.workM).padStart(2,'0')}` : '-';
                const UTIL_LEVELS = [
                  { min: 0,  max: 20,  color: '#93C5FD', label: '여유' },
                  { min: 20, max: 40,  color: '#6EE7B7', label: '보통' },
                  { min: 40, max: 60,  color: '#FCD34D', label: '적정' },
                  { min: 60, max: 80,  color: '#FB923C', label: '바쁨' },
                  { min: 80, max: 101, color: '#EF4444', label: '풀' },
                ];
                const level = UTIL_LEVELS.find(l => util >= l.min && util < l.max) || UTIL_LEVELS[4];
                const items = [
                  { label: '예약', value: s ? `${s.count}건` : '0건', color: c.primary },
                  { label: '시작', value: s ? s.firstTime : '-', color: c.text },
                  { label: '종료', value: s ? s.lastTime : '-', color: c.text },
                  { label: '근무', value: workStr, color: c.text },
                  { label: '효율', value: `${util}% ${level.label}`, color: level.color },
                ];
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, padding: '16px 24px', flexShrink: 0 }}>
                    {items.map((item, i) => (
                      <div key={i} style={{ background: c.secondaryLight, borderRadius: 12, padding: '10px 6px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: c.textLight, fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: item.color }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* 예약 리스트 - 이 영역만 스크롤 */}
              {dayEvents.length > 0 && (
                <div style={{ padding: '0 24px 20px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: c.textLight, marginBottom: 8, flexShrink: 0 }}>예약 목록</div>
                  <div
                    className="bm-popup-scroll"
                    style={{
                      display: 'flex', flexDirection: 'column', gap: 6,
                      flex: 1, minHeight: 0, overflowY: 'auto',
                      scrollbarWidth: 'none', msOverflowStyle: 'none',
                      cursor: 'grab',
                      paddingRight: 2,
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
                    {dayEvents.map(ev => {
                      const sc = STATUS_COLORS[ev.status] || STATUS_COLORS.CONFIRMED;
                      return (
                        <div key={ev.id} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 12px', borderRadius: 10, border: `1px solid ${c.borderLight}`,
                          background: 'white', cursor: 'pointer', flexShrink: 0,
                        }}
                        onClick={() => {
                          setPopupDate(null); setActiveDate('');
                          const api = calendarRef.current?.getApi();
                          if (api) api.changeView('timeGridDay', popupDate);
                        }}>
                          <div style={{ width: 4, height: 36, borderRadius: 2, background: sc.bar, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {ev.menu?.name || '시술'}
                            </div>
                            <div style={{ fontSize: 11, color: c.textLight }}>
                              {fmtTime(ev.startTime)} - {fmtTime(ev.endTime)} · {ev.customer?.user?.name || '미정'} · {ev.staff?.user?.name || ''}
                            </div>
                          </div>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                            background: sc.bg, color: sc.text,
                          }}>{STATUS_LABEL[ev.status] || ev.status}</span>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={() => {
                    setPopupDate(null); setActiveDate('');
                    const api = calendarRef.current?.getApi();
                    if (api) api.changeView('timeGridDay', popupDate);
                  }} style={{
                    width: '100%', marginTop: 12, padding: '10px', borderRadius: 10,
                    background: c.primary, color: c.textOnPrimary,
                    fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', flexShrink: 0,
                  }}>일간 뷰에서 자세히 보기</button>
                </div>
              )}
              {dayEvents.length === 0 && (
                <div style={{ padding: '20px 24px 28px', textAlign: 'center', color: c.textLight, fontSize: 13 }}>
                  예약이 없습니다
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* 회원 상세 패널 */}
      {selectedEvent && (() => {
        const panelContent = (() => {
          const sc = STATUS_COLORS[selectedEvent.status] || STATUS_COLORS.CONFIRMED;
          let age = '';
          if (selectedEvent.birthday) {
            const bd = new Date(selectedEvent.birthday); const now = new Date();
            let a = now.getFullYear() - bd.getFullYear();
            if (now.getMonth() < bd.getMonth() || (now.getMonth() === bd.getMonth() && now.getDate() < bd.getDate())) a--;
            age = `만 ${a}세`;
          }
          const genderLabel = selectedEvent.gender === 'FEMALE' ? '여' : selectedEvent.gender === 'MALE' ? '남' : '';
          const infoParts = [age, genderLabel].filter(Boolean).join(' · ');

          const historyItem = (h: ReservationEvent, showMenu: boolean) => {
            const d = new Date(h.startTime);
            const dateStr = `${d.getMonth()+1}.${d.getDate()}`;
            const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
            const isCurrent = h.id === selectedEvent.id;
            const hsc = STATUS_COLORS[h.status] || STATUS_COLORS.CONFIRMED;
            return (
              <div key={h.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderRadius: 10, background: isCurrent ? `${c.primary}08` : 'transparent', border: isCurrent ? `1.5px solid ${c.primary}25` : '1.5px solid transparent', gap: 10, transition: 'all .15s' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: hsc.text, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: c.text }}>{dateStr} <span style={{ fontWeight: 400, color: c.textLight }}>{time}</span></div>
                  {showMenu && <div style={{ fontSize: 11, color: c.textLight, marginTop: 1 }}>{h.menu?.name}</div>}
                </div>
                <div style={{ fontSize: 11, color: c.textLight, flexShrink: 0 }}>{h.staff?.user?.name || ''}</div>
                <div style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: hsc.bg, color: hsc.text, flexShrink: 0 }}>{STATUS_LABEL[h.status] || h.status}</div>
              </div>
            );
          };

          return (
          <>
            {/* 닫기 */}
            <button onClick={() => setSelectedEvent(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: c.textLight, padding: 4, lineHeight: 1, zIndex: 1 }}>✕</button>

            {/* 프로필 헤더 */}
            <div style={{ padding: '20px 24px 16px', display: 'flex', alignItems: 'center', gap: 14, background: `linear-gradient(180deg, ${c.primaryLight}40 0%, transparent 100%)` }}>
              {selectedEvent.profileImage ? (
                <img src={selectedEvent.profileImage} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `2px solid ${c.surface}`, boxShadow: '0 3px 10px rgba(0,0,0,0.1)' }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${c.primary}, ${c.primary}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', boxShadow: '0 3px 10px rgba(0,0,0,0.1)' }}>{selectedEvent.customer.charAt(0)}</div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: c.text, letterSpacing: -0.3 }}>{selectedEvent.customer}</div>
                <div style={{ fontSize: 12, color: c.textLight, marginTop: 2 }}>{selectedEvent.phone ? fmtPhone(selectedEvent.phone) : ''}</div>
                {infoParts && <div style={{ fontSize: 11, color: c.textLight, marginTop: 1 }}>{infoParts}</div>}
              </div>
            </div>

            {/* 선택된 예약 카드 */}
            <div style={{ padding: '0 20px', marginTop: -4 }}>
              <div style={{ borderRadius: 14, padding: '14px 18px', background: c.surface, border: `1px solid ${c.borderLight}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: c.text, flex: 1 }}>{selectedEvent.menu}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: c.primary }}>{selectedEvent.session}회</span>
                  <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 8, padding: '3px 10px', background: sc.bg, color: sc.text }}>{STATUS_LABEL[selectedEvent.status] || selectedEvent.status}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: c.textLight }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock style={{ width: 12, height: 12 }} />{selectedEvent.start} - {selectedEvent.end}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User style={{ width: 12, height: 12 }} /><span style={{ color: c.text, fontWeight: 500 }}>{selectedEvent.staff || '-'}</span></div>
                </div>

                {/* 상태 변경 버튼 */}
                {(() => {
                  const evDate = selectedEvent.eventDate ? new Date(selectedEvent.eventDate) : null;
                  const today = new Date();
                  const isToday = evDate ? evDate.toDateString() === today.toDateString() : false;
                  const isPast = evDate ? evDate < today && !isToday : false;
                  const isFuture = evDate ? evDate > today && !isToday : false;
                  const allButtons = [
                    { key: 'CONFIRMED', label: '확정', bg: `${c.primary}15`, activeBg: c.primary, color: c.primary },
                    { key: 'IN_PROGRESS', label: '시술중', bg: '#FEF3C7', activeBg: '#F59E0B', color: '#92400E' },
                    { key: 'COMPLETED', label: '완료', bg: '#F0FDF4', activeBg: '#22C55E', color: '#166534' },
                    { key: 'CANCELLED', label: '취소', bg: '#FEE2E2', activeBg: '#EF4444', color: '#991B1B' },
                    { key: 'NO_SHOW', label: '노쇼', bg: '#FEE2E2', activeBg: '#DC2626', color: '#991B1B' },
                  ];
                  // 과거: 완료/취소/노쇼, 당일: 완료/취소/노쇼 (시술중은 자동), 미래: 변경/취소
                  const pastBtns = allButtons.filter(b => ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(b.key));
                  const todayBtns = allButtons.filter(b => ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(b.key));

                  if (isFuture && !(selectedEvent.status === 'CANCELLED' || selectedEvent.status === 'NO_SHOW')) {
                    // 미래: 변경 + 취소
                    return (
                      <div style={{ display: 'flex', gap: 5, marginTop: 10 }}>
                        <button
                          onClick={async () => {
                            const newDate = prompt('변경할 날짜를 입력하세요 (예: 2026-09-20):');
                            if (!newDate) return;
                            const newTime = prompt('변경할 시작 시간을 입력하세요 (예: 14:00):');
                            if (!newTime) return;
                            const [h, m] = newTime.split(':').map(Number);
                            const start = new Date(`${newDate}T${newTime}:00+09:00`);
                            // 기존 duration 계산
                            const oldStart = new Date(selectedEvent.eventDate);
                            const duration = selectedEvent.end && selectedEvent.start
                              ? (() => { const [sh,sm] = selectedEvent.start.split(':').map(Number); const [eh,em] = selectedEvent.end.split(':').map(Number); return (eh*60+em) - (sh*60+sm); })()
                              : 60;
                            const end = new Date(start.getTime() + duration * 60000);
                            try {
                              const res = await fetch(`/api/shops/${shopSlug}/reservations/${selectedEvent.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ startTime: start.toISOString(), endTime: end.toISOString() }),
                              });
                              if (res.ok) {
                                alert('예약이 변경되었습니다.');
                                setSelectedEvent(null);
                                fetchReservations();
                              }
                            } catch (e) { console.error(e); }
                          }}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${c.primary}`, background: c.primary, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <CalendarDays style={{ width: 13, height: 13 }} /> 변경
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('취소 사유를 입력해주세요:');
                            if (reason === null) return;
                            changeReservationStatus(selectedEvent.id, 'CANCELLED', reason || undefined);
                          }}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', background: '#FEE2E2', color: '#991B1B', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          취소
                        </button>
                      </div>
                    );
                  }

                  const buttons = isPast ? pastBtns : todayBtns;

                  if (selectedEvent.status === 'CANCELLED' || selectedEvent.status === 'NO_SHOW') {
                    return (
                      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                        <div style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: '#FEE2E2', color: '#991B1B', fontSize: 12, fontWeight: 700, textAlign: 'center' }}>
                          {selectedEvent.status === 'CANCELLED' ? '✕ 취소됨' : '✕ 노쇼'}
                        </div>
                        <button
                          onClick={() => {
                            if (confirm('이 예약을 "확정" 상태로 되돌리시겠습니까?\n(자동 생성된 시술카드가 삭제됩니다)')) {
                              changeReservationStatus(selectedEvent.id, 'CONFIRMED');
                            }
                          }}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${c.primary}`, background: '#fff', color: c.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <Undo2 style={{ width: 13, height: 13 }} /> 되돌리기
                        </button>
                      </div>
                    );
                  }

                  // 완료 상태: 시술 내용 표시 (읽기 전용)
                  if (selectedEvent.status === 'COMPLETED' && !showTreatmentForm) {
                    const mgmt = selectedEvent.managementData || {};
                    const fields = Object.entries(mgmt).filter(([k]) => k !== '_memo');
                    const memo = mgmt._memo || '';
                    const hasData = fields.length > 0 || memo;
                    return (
                      <div style={{ marginTop: 10 }}>
                        {hasData ? (
                          <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '12px 14px', border: '1.5px solid #86EFAC' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                              <ClipboardList style={{ width: 13, height: 13 }} /> 시술 내용
                            </div>
                            {fields.map(([key, val]) => (
                              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#15803D', minWidth: 70 }}>{key}</span>
                                <span style={{ fontSize: 12, color: '#166534' }}>{String(val)}</span>
                              </div>
                            ))}
                            {memo && (
                              <div style={{ fontSize: 12, color: '#166534', background: '#DCFCE7', borderRadius: 6, padding: '6px 8px', marginTop: fields.length > 0 ? 6 : 0 }}>
                                📝 {memo}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ background: '#F3F4F6', borderRadius: 10, padding: '10px 14px', textAlign: 'center', color: '#6B7280', fontSize: 12 }}>
                            시술 내용이 기록되지 않았습니다
                          </div>
                        )}
                      </div>
                    );
                  }

                  // 시술중/완료 상태이거나 폼 표시 상태: 시술 내용 입력 폼
                  if ((selectedEvent.status === 'IN_PROGRESS' || showTreatmentForm) && !isPast) {
                    const fields = selectedEvent.managementFields || [];
                    return (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ background: '#FEF3C7', borderRadius: 10, padding: '12px 14px', border: '1.5px solid #F59E0B' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <ClipboardList style={{ width: 13, height: 13 }} /> 시술 내용 기록
                          </div>
                          {fields.length > 0 && fields.map((field: string) => (
                            <div key={field} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <label style={{ fontSize: 12, fontWeight: 600, color: '#78350F', minWidth: 70 }}>{field}</label>
                              <input
                                value={treatmentData[field] || ''}
                                onChange={e => setTreatmentData(prev => ({ ...prev, [field]: e.target.value }))}
                                placeholder={`${field} 입력`}
                                style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 12, outline: 'none' }}
                              />
                            </div>
                          ))}
                          <textarea
                            value={treatmentMemo}
                            onChange={e => setTreatmentMemo(e.target.value)}
                            placeholder="추가 메모 (예: 좌측 볼 집중 관리)"
                            rows={2}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 12, resize: 'vertical', outline: 'none', marginTop: fields.length > 0 ? 4 : 0, boxSizing: 'border-box' }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
                          <button
                            onClick={async () => {
                              if (!confirm('시술을 완료 처리하시겠습니까?')) return;
                              const mgmtData = { ...treatmentData, _memo: treatmentMemo };
                              try {
                                const res = await fetch(`/api/shops/${shopSlug}/reservations/${selectedEvent.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'COMPLETED', managementData: mgmtData }),
                                });
                                if (res.ok) {
                                  setSelectedEvent(prev => prev ? { ...prev, status: 'COMPLETED' } : null);
                                  const calApi = calendarRef.current?.getApi();
                                  if (calApi) {
                                    const fcEvent = calApi.getEventById(selectedEvent.id);
                                    if (fcEvent) {
                                      const sc = STATUS_COLORS.COMPLETED;
                                      fcEvent.setProp('backgroundColor', sc.bg);
                                      fcEvent.setProp('borderColor', sc.bar);
                                      fcEvent.setProp('textColor', sc.text);
                                      fcEvent.setExtendedProp('status', 'COMPLETED');
                                    }
                                  }
                                  setTreatmentData({});
                                  setTreatmentMemo('');
                                  setShowTreatmentForm(false);
                                }
                              } catch (e) { console.error(e); }
                            }}
                            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', background: '#22C55E', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <Check style={{ width: 13, height: 13 }} /> 완료
                          </button>
                          <button
                            onClick={() => { setShowTreatmentForm(false); }}
                            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', color: '#6B7280', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            닫기
                          </button>
                        </div>
                      </div>
                    );
                  }

                  const btnIcon: Record<string, any> = {
                    IN_PROGRESS: <Play style={{ width: 11, height: 11 }} />,
                    COMPLETED: <Check style={{ width: 11, height: 11 }} />,
                    CANCELLED: <X style={{ width: 11, height: 11 }} />,
                    NO_SHOW: <UserX style={{ width: 11, height: 11 }} />,
                  };

                  return (
                  <div style={{ display: 'flex', gap: 5, marginTop: 10, flexWrap: 'wrap' }}>
                    {buttons.map(s => {
                      const isActive = selectedEvent.status === s.key;
                      return (
                        <button key={s.key}
                          onClick={() => {
                            if (isActive) return;
                            if (s.key === 'CANCELLED') {
                              const reason = prompt('취소 사유를 입력해주세요:');
                              if (reason === null) return;
                              changeReservationStatus(selectedEvent.id, 'CANCELLED', reason || undefined);
                            } else if (s.key === 'NO_SHOW') {
                              if (!confirm('이 예약을 "노쇼" 상태로 변경하시겠습니까?')) return;
                              changeReservationStatus(selectedEvent.id, 'NO_SHOW');
                            } else if (s.key === 'COMPLETED') {
                              // 완료 → 폼 표시
                              setTreatmentData({});
                              setTreatmentMemo('');
                              setShowTreatmentForm(true);
                            } else {
                              changeReservationStatus(selectedEvent.id, s.key);
                            }
                          }}
                          style={{
                            flex: 1, minWidth: 50, padding: '6px 4px', borderRadius: 8, border: 'none', cursor: isActive ? 'default' : 'pointer',
                            fontSize: 11, fontWeight: 700, transition: 'all .2s',
                            background: isActive ? s.activeBg : s.bg,
                            color: isActive ? '#fff' : s.color,
                            opacity: isActive ? 1 : 0.8,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                          }}>
                          {isActive && '✓ '}{btnIcon[s.key]}{s.label}
                        </button>
                      );
                    })}
                  </div>
                  );
                })()}
              </div>
            </div>

            {/* 시술 이력 */}
            <div style={{ padding: '0 20px', marginTop: 4 }}>
              <div onClick={() => setHistoryTab(historyTab === 'menu' ? 'all' : 'menu')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', cursor: 'pointer', userSelect: 'none', borderRadius: 10, background: historyTab === 'menu' ? c.primary : '#EBEDF0', border: `1.5px solid ${historyTab === 'menu' ? c.primary : '#D1D5DB'}`, transition: 'all .2s' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: historyTab === 'menu' ? '#fff' : '#4B5563', display: 'flex', alignItems: 'center', gap: 5, transition: 'color .15s' }}>
                  <Sparkles style={{ width: 14, height: 14 }} /> {selectedEvent.menuName} 이력
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: historyTab === 'menu' ? 'rgba(255,255,255,0.25)' : '#D1D5DB', color: historyTab === 'menu' ? '#fff' : '#374151' }}>{menuHistory.length}건</span>
                  <ChevronDown style={{ width: 14, height: 14, color: historyTab === 'menu' ? '#fff' : '#6B7280', transition: 'transform .2s', transform: historyTab === 'menu' ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </div>
              </div>
              {historyTab === 'menu' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 220, overflowY: 'auto', padding: '6px 0 8px', borderBottom: `1px solid ${c.borderLight}` }}>
                  {menuHistory.length > 0 ? menuHistory.map(h => historyItem(h, false)) : (
                    <div style={{ fontSize: 12, color: c.textLight, textAlign: 'center', padding: 16 }}>이력 없음</div>
                  )}
                </div>
              )}
            </div>

            {/* 전체 방문 이력 */}
            <div style={{ padding: '6px 20px 20px' }}>
              <div onClick={() => setHistoryTab(historyTab === 'all' ? 'menu' : 'all')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', cursor: 'pointer', userSelect: 'none', borderRadius: 10, background: historyTab === 'all' ? c.primary : '#EBEDF0', border: `1.5px solid ${historyTab === 'all' ? c.primary : '#D1D5DB'}`, transition: 'all .2s' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: historyTab === 'all' ? '#fff' : '#4B5563', display: 'flex', alignItems: 'center', gap: 5, transition: 'color .15s' }}>
                  <ClipboardList style={{ width: 14, height: 14 }} /> 전체 방문 이력
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: historyTab === 'all' ? 'rgba(255,255,255,0.25)' : '#D1D5DB', color: historyTab === 'all' ? '#fff' : '#374151' }}>{customerHistory.length}건</span>
                  <ChevronDown style={{ width: 14, height: 14, color: historyTab === 'all' ? '#fff' : '#6B7280', transition: 'transform .2s', transform: historyTab === 'all' ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </div>
              </div>
              {historyTab === 'all' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 220, overflowY: 'auto', padding: '6px 0 8px' }}>
                  {customerHistory.length > 0 ? customerHistory.map(h => historyItem(h, true)) : (
                    <div style={{ fontSize: 12, color: c.textLight, textAlign: 'center', padding: 16 }}>이력 없음</div>
                  )}
                </div>
              )}
            </div>
          </>
          );
        })();
        if (mob) return createPortal(<>
          <div onClick={() => setSelectedEvent(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9998 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 'calc(100dvh - 56px)', overflowY: 'auto', background: c.surface, borderRadius: '20px 20px 0 0', zIndex: 9999, boxShadow: '0 -10px 40px rgba(0,0,0,0.15)', animation: 'slideUp .25s ease-out' }}>
            <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: '#D1D5DB' }} /></div>
            {panelContent}
          </div>
        </>, document.body);
        return createPortal(<>
          <div onClick={() => setSelectedEvent(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 9998 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 380, maxHeight: '80vh', overflowY: 'auto', background: c.surface, borderRadius: 20, zIndex: 9999, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', animation: 'fadeIn .2s ease-out' }}>
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.95)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}`}</style>
            {panelContent}
          </div>
        </>, document.body);
      })()}
    </div>
  );
}
