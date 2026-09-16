'use client';

import { useState, useEffect, useCallback } from 'react';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { Megaphone, Calendar, ChevronRight, Circle, CheckCircle2 } from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  content: string;
  category: string;
  date: string;
  isImportant: boolean;
}

const READ_KEY = 'beautym_read_notices';

function getReadIds(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(READ_KEY) || '[]'); } catch { return []; }
}

function markAsRead(id: string) {
  const ids = getReadIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem(READ_KEY, JSON.stringify(ids));
    // 사이드바 뱃지 업데이트를 위한 이벤트
    window.dispatchEvent(new Event('notice-read-changed'));
  }
}

function markAsUnread(id: string) {
  const ids = getReadIds().filter(rid => rid !== id);
  localStorage.setItem(READ_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event('notice-read-changed'));
}

export default function ShopNoticePage() {
  const [mounted, setMounted] = useState(false);
  const store = useThemeStore();
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;

  const [notices, setNotices] = useState<Notice[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshReadIds = useCallback(() => setReadIds(getReadIds()), []);

  useEffect(() => {
    fetch('/api/admin/notices').then(r => r.json()).then(data => {
      setNotices(data);
      setLoading(false);
    }).catch(() => setLoading(false));
    refreshReadIds();
  }, [refreshReadIds]);

  const handleSelectNotice = (notice: Notice) => {
    setSelectedNotice(notice);
    markAsRead(notice.id);
    refreshReadIds();
  };

  const toggleRead = (e: React.MouseEvent, notice: Notice) => {
    e.stopPropagation();
    if (readIds.includes(notice.id)) {
      markAsUnread(notice.id);
    } else {
      markAsRead(notice.id);
    }
    refreshReadIds();
  };

  const unreadCount = notices.filter(n => !readIds.includes(n.id)).length;

  const categoryColors: Record<string, string> = {
    '신제품': '#3B82F6', '배송': '#F59E0B', '이벤트': '#EC4899', '시스템': '#6B7280',
  };

  if (!mounted || loading) return <div className="p-6 text-center text-sm" style={{ color: c?.textLight }}>로딩 중...</div>;

  return (
    <div className="p-4 md:p-6 space-y-4" style={{ color: c.text }}>
      {selectedNotice ? (
        <div className="max-w-3xl mx-auto">
          <button onClick={() => setSelectedNotice(null)}
            className="flex items-center gap-1 text-sm mb-4 hover:underline" style={{ color: c.primary }}>
            <ChevronRight className="w-4 h-4 rotate-180" /> 목록으로
          </button>
          <div className="rounded-2xl border p-6" style={{ borderColor: c.borderLight, background: c.surface }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full"
                style={{ background: categoryColors[selectedNotice.category] || c.primary }}>{selectedNotice.category}</span>
              {selectedNotice.isImportant && <span className="text-[10px] font-bold text-red-500 px-2 py-0.5 rounded-full bg-red-50">중요</span>}
              <span className="text-xs ml-auto" style={{ color: c.textLight }}>{selectedNotice.date}</span>
            </div>
            <h2 className="text-lg font-bold mb-4" style={{ color: c.text }}>{selectedNotice.title}</h2>
            <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: c.text }}>
              {selectedNotice.content}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 mb-3 text-xs" style={{ color: c.textLight }}>
              <Circle className="w-3 h-3 fill-blue-500 text-blue-500" />
              <span>읽지 않은 공지 <strong style={{ color: c.primary }}>{unreadCount}</strong>건</span>
              <button onClick={() => { notices.forEach(n => markAsRead(n.id)); refreshReadIds(); }}
                className="ml-auto text-xs px-2 py-1 rounded-lg" style={{ color: c.primary, background: c.primaryLight }}>
                모두 읽음 처리
              </button>
            </div>
          )}
          <div className="space-y-2">
            {notices.map(notice => {
              const isRead = readIds.includes(notice.id);
              return (
                <div key={notice.id} onClick={() => handleSelectNotice(notice)}
                  className="rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md flex items-start gap-3"
                  style={{
                    borderColor: notice.isImportant ? c.primary : c.borderLight,
                    background: isRead ? c.surface : c.primaryLight,
                    borderLeftWidth: notice.isImportant ? '4px' : '1px',
                    opacity: isRead ? 0.75 : 1,
                  }}>
                  {/* 읽음/안읽음 토글 */}
                  <button onClick={(e) => toggleRead(e, notice)} className="mt-0.5 flex-shrink-0" title={isRead ? '안읽음으로 표시' : '읽음으로 표시'}>
                    {isRead ? (
                      <CheckCircle2 className="w-5 h-5" style={{ color: c.borderLight }} />
                    ) : (
                      <Circle className="w-5 h-5 fill-blue-500 text-blue-500" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full"
                        style={{ background: categoryColors[notice.category] || c.primary }}>{notice.category}</span>
                      {notice.isImportant && <span className="text-[10px] font-bold text-red-500">중요</span>}
                      <div className="flex items-center gap-1 ml-auto text-xs" style={{ color: c.textLight }}>
                        <Calendar className="w-3 h-3" />
                        {notice.date}
                      </div>
                    </div>
                    <h3 className={`text-sm ${isRead ? 'font-medium' : 'font-bold'}`} style={{ color: c.text }}>{notice.title}</h3>
                    <p className="text-xs mt-1 line-clamp-1" style={{ color: c.textLight }}>
                      {notice.content.split('\n')[0]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
