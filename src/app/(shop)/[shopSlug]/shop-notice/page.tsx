'use client';

import { useState, useEffect } from 'react';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { Megaphone, Calendar, ChevronRight } from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  content: string;
  category: string;
  date: string;
  isImportant: boolean;
}

export default function ShopNoticePage() {
  const [mounted, setMounted] = useState(false);
  const store = useThemeStore();
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;

  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  // 샘플 공지사항
  const notices: Notice[] = [
    {
      id: '1', title: '9월 신제품 입고 안내', category: '신제품',
      content: '안녕하세요, BeautyM 본사입니다.\n\n9월 신제품이 입고되었습니다.\n\n1. 아쿠아 히알루론 수분크림 50ml - 코스알엑스\n2. 일회용 마이크로니들 패치 세트 - 메디팜\n\n상품 구매 메뉴에서 확인하시고 주문해 주세요.\n감사합니다.',
      date: '2026-09-15', isImportant: true,
    },
    {
      id: '2', title: '추석 연휴 배송 일정 안내', category: '배송',
      content: '추석 연휴 기간(9/26~9/29) 동안 배송이 중단됩니다.\n\n9월 24일(수)까지 주문하시면 연휴 전 배송 가능합니다.\n연휴 후 첫 배송은 9월 30일(화)입니다.\n\n감사합니다.',
      date: '2026-09-14', isImportant: true,
    },
    {
      id: '3', title: '10월 프로모션 안내', category: '이벤트',
      content: '10월 한 달간 전 품목 10% 할인 프로모션을 진행합니다.\n\n기간: 2026년 10월 1일 ~ 10월 31일\n대상: 전 거래처 상품\n할인: 정가 대비 10% 추가 할인\n\n많은 이용 부탁드립니다.',
      date: '2026-09-13', isImportant: false,
    },
    {
      id: '4', title: '시스템 점검 안내 (9/20)', category: '시스템',
      content: '시스템 안정화를 위한 정기 점검이 예정되어 있습니다.\n\n일시: 2026년 9월 20일(토) 02:00~06:00\n영향: 해당 시간 동안 서비스 이용이 제한될 수 있습니다.\n\n불편을 드려 죄송합니다.',
      date: '2026-09-10', isImportant: false,
    },
  ];

  const categoryColors: Record<string, string> = {
    '신제품': '#3B82F6', '배송': '#F59E0B', '이벤트': '#EC4899', '시스템': '#6B7280',
  };

  return (
    <div className="p-4 md:p-6 space-y-4" style={{ color: c.text }}>
      {selectedNotice ? (
        // 상세 보기
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
        // 목록
        <div className="max-w-3xl mx-auto space-y-3">
          {notices.map(notice => (
            <div key={notice.id} onClick={() => setSelectedNotice(notice)}
              className="rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md"
              style={{ borderColor: notice.isImportant ? c.primary : c.borderLight, background: c.surface,
                borderLeftWidth: notice.isImportant ? '4px' : '1px' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full"
                  style={{ background: categoryColors[notice.category] || c.primary }}>{notice.category}</span>
                {notice.isImportant && <span className="text-[10px] font-bold text-red-500">중요</span>}
                <div className="flex items-center gap-1 ml-auto text-xs" style={{ color: c.textLight }}>
                  <Calendar className="w-3 h-3" />
                  {notice.date}
                </div>
              </div>
              <h3 className="text-sm font-bold" style={{ color: c.text }}>{notice.title}</h3>
              <p className="text-xs mt-1 line-clamp-2" style={{ color: c.textLight }}>
                {notice.content.split('\n')[0]}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
