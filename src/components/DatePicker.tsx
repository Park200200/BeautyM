'use client';

import { useState, useEffect, useRef } from 'react';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';

interface DatePickerProps {
  value: string | Date | null;
  onChange: (value: string | Date | null) => void;
  inline?: boolean;
  colors?: {
    primary: string; primaryLight: string; text: string;
    textLight: string; surface: string; border: string; borderLight: string;
    textOnPrimary: string;
  };
}

export default function DatePicker({ value, onChange, colors, inline }: DatePickerProps) {
  const store = useThemeStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = colors || { ...theme.colors, border: (theme.colors as any).border || theme.colors.borderLight };

  // value를 YYYY-MM-DD 문자열로 정규화
  const valueStr = (() => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    const d = new Date(value);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  })();

  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const d = valueStr ? new Date(valueStr) : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const { year, month } = viewDate;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const days: { day: number; current: boolean; dateStr: string }[] = [];

  // 이전달
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    const m = month === 0 ? 12 : month;
    const y = month === 0 ? year - 1 : year;
    days.push({ day: d, current: false, dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
  }

  // 현재달
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ day: d, current: true, dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
  }

  // 다음달
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 1 : month + 2;
    const y = month === 11 ? year + 1 : year;
    days.push({ day: d, current: false, dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
  }

  const prevMonth = () => setViewDate(month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 });
  const nextMonth = () => setViewDate(month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 });

  const goToday = () => {
    setViewDate({ year: today.getFullYear(), month: today.getMonth() });
    onChange(todayStr);
    setOpen(false);
  };

  const selectDate = (dateStr: string) => {
    onChange(dateStr);
    setOpen(false);
  };

  const displayValue = valueStr
    ? new Date(valueStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : '날짜 선택';

  const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
  const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  const showCalendar = inline || open;

  const calendarPanel = (
    <div className={inline ? 'rounded-2xl border p-4 shadow-xl' : 'absolute left-0 top-full z-50 mt-1 rounded-2xl border p-4 shadow-xl'}
      style={{ background: c.surface, borderColor: c.borderLight, width: 320, minWidth: 320 }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button type="button" onClick={prevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
          style={{ color: c.textLight }}
          onMouseEnter={(e) => { e.currentTarget.style.background = c.primaryLight; e.currentTarget.style.color = c.primary; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.textLight; }}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 19l-7-7 7-7" /></svg>
        </button>
        <p style={{ fontSize: 14, fontWeight: 700, color: c.text }}>
          {year}년 {MONTHS[month]}
        </p>
        <button type="button" onClick={nextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
          style={{ color: c.textLight }}
          onMouseEnter={(e) => { e.currentTarget.style.background = c.primaryLight; e.currentTarget.style.color = c.primary; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.textLight; }}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {/* 요일 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {DAYS.map((d, i) => (
          <div key={d} style={{
            textAlign: 'center', fontSize: 11, fontWeight: 500, padding: '4px 0',
            color: i === 0 ? '#EF4444' : i === 6 ? '#3B82F6' : c.textLight,
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {days.map((d, i) => {
          const isSelected = d.dateStr === valueStr;
          const isToday = d.dateStr === todayStr;
          const dayOfWeek = i % 7;

          return (
            <button key={i} type="button"
              onClick={() => selectDate(d.dateStr)}
              style={{
                display: 'flex', height: 36, width: '100%', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%', fontSize: 12, border: 'none', cursor: 'pointer',
                transition: 'background 0.15s',
                background: isSelected ? c.primary : 'transparent',
                color: isSelected ? c.textOnPrimary
                  : !d.current ? `${c.textLight}60`
                  : dayOfWeek === 0 ? '#EF4444'
                  : dayOfWeek === 6 ? '#3B82F6'
                  : c.text,
                fontWeight: isSelected || isToday ? 700 : 400,
                boxShadow: isToday && !isSelected ? `inset 0 0 0 1.5px ${c.primary}` : 'none',
              }}
              onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = c.primaryLight; }}
              onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
              {d.day}
            </button>
          );
        })}
      </div>

      {/* 하단 */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${c.borderLight}` }}>
        <button type="button" onClick={goToday}
          style={{
            flex: 1, borderRadius: 8, border: `1px solid ${c.primary}`, padding: '6px 0',
            fontSize: 12, fontWeight: 500, color: c.primary, background: 'transparent', cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = c.primaryLight; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
          오늘
        </button>
        {!inline && (
          <button type="button" onClick={() => setOpen(false)}
            style={{
              flex: 1, borderRadius: 8, border: `1px solid ${c.borderLight}`, padding: '6px 0',
              fontSize: 12, fontWeight: 500, color: c.textLight, background: 'transparent', cursor: 'pointer',
            }}>
            닫기
          </button>
        )}
      </div>
    </div>
  );

  if (inline) return calendarPanel;

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full rounded-lg border px-3 py-2 text-sm font-bold text-left outline-none flex items-center justify-between"
        style={{ borderColor: c.border, color: c.text, background: '#FFFFFF' }}>
        <span>{displayValue}</span>
        <svg className="h-4 w-4" style={{ color: c.textLight }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>
      {showCalendar && calendarPanel}
    </div>
  );
}
