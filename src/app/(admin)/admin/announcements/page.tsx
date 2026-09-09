'use client';

import { useState, useEffect } from 'react';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { Plus, Send, Eye, Pencil, Trash2, Megaphone, BellRing } from 'lucide-react';

export default function AnnouncementsPage() {
  const [mounted, setMounted] = useState(false);
  const store = useThemeStore();
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;

  const announcements = [
    { id: 1, title: '9월 시스템 점검 안내', type: '공지', target: '전체', status: '게시중', date: '2026-09-05', views: 18 },
    { id: 2, title: '신규 AI 분석 기능 출시!', type: '광고', target: '유료 매장', status: '게시중', date: '2026-09-03', views: 12 },
    { id: 3, title: 'Pro 플랜 30% 할인 이벤트', type: '광고', target: 'Free/Standard', status: '예약', date: '2026-09-10', views: 0 },
    { id: 4, title: '8월 결제 안내', type: '공지', target: '전체', status: '종료', date: '2026-08-25', views: 22 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
          style={{ background: c.primary, color: c.textOnPrimary }}
        >
          <Plus className="h-4 w-4" />
          새 공지/광고
        </button>
      </div>

      <div className="grid gap-4">
        {announcements.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-xl border p-5 transition-all"
            style={{ background: c.surface, borderColor: c.borderLight }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{
                  background: item.type === '공지' ? '#DBEAFE' : c.primaryLight,
                  color: item.type === '공지' ? '#2563EB' : c.primary,
                }}
              >
                {item.type === '공지' ? <BellRing className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}
              </div>
              <div>
                <p className="font-medium" style={{ color: c.text }}>{item.title}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs" style={{ color: c.textLight }}>{item.date}</span>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ background: c.primaryLight, color: c.primary }}
                  >
                    {item.target}
                  </span>
                  <span className={`text-xs font-medium ${
                    item.status === '게시중' ? 'text-green-600' : item.status === '예약' ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    ● {item.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs" style={{ color: c.textLight }}>
                <Eye className="h-3 w-3" /> {item.views}
              </span>
              <button className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: c.textLight }}
                onMouseEnter={(e) => (e.currentTarget.style.background = c.surfaceHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors text-red-400"
                onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
