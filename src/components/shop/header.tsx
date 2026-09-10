'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useShopStore } from '@/stores/shop-store';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Menu, Bell, CalendarDays, Users, Scissors, Receipt, UserCog, Package, CreditCard, Image, LayoutDashboard, Settings, BellRing, Store, List, Plus, Building2, BrainCircuit, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const PAGE_MAP: Record<string, { label: string; icon: typeof CalendarDays }> = {
  'reservations': { label: '예약 관리', icon: CalendarDays },
  'calendar': { label: '예약 관리', icon: CalendarDays },
  'customers': { label: '고객 관리', icon: Users },
  'menus': { label: '시술 관리', icon: Scissors },
  'sales': { label: '매출/정산', icon: Receipt },
  'staff': { label: '직원 관리', icon: UserCog },
  'inventory': { label: '재고 관리', icon: Package },
  'membership': { label: '멤버십', icon: CreditCard },
  'portfolio': { label: '포트폴리오', icon: Image },
  'dashboard': { label: '대시보드', icon: LayoutDashboard },
  'notifications': { label: '알림', icon: BellRing },
  'branches': { label: '다중 매장', icon: Building2 },
  'analytics': { label: 'AI 분석', icon: BrainCircuit },
  'settings': { label: '설정', icon: Settings },
};

// 예약 섹션 탭 정의
interface SubTab { label: string; icon: typeof List; path: string; key: string }

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { shopSlug, userName, userRole, userProfileImage, toggleSidebar } = useShopStore();
  const mob = useIsMobile();

  const [mounted, setMounted] = useState(false);
  const [notiCount, setNotiCount] = useState(0);
  const [notiList, setNotiList] = useState<any[]>([]);
  const [showNotiPanel, setShowNotiPanel] = useState(false);
  const store = useThemeStore();
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;

  // 알림 카운트 + 목록 폴링
  const fetchNoti = async () => {
    if (!shopSlug) return;
    try {
      const res = await fetch(`/api/shops/${shopSlug}/notifications`);
      if (res.ok) { const d = await res.json(); setNotiCount(d.unreadCount || 0); setNotiList(d.notifications || []); }
    } catch {}
  };
  useEffect(() => {
    fetchNoti();
    const interval = setInterval(fetchNoti, 30000);
    return () => clearInterval(interval);
  }, [shopSlug]);

  const toggleNotiPanel = () => { setShowNotiPanel(p => !p); };

  const markRead = async (id: string) => {
    setNotiList(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
    setNotiCount(prev => Math.max(0, prev - 1));
    try { await fetch(`/api/shops/${shopSlug}/notifications`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'read', notificationId: id }) }); } catch {}
  };

  const markAllRead = async () => {
    setNotiList(prev => prev.map(n => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    setNotiCount(0);
    try { await fetch(`/api/shops/${shopSlug}/notifications`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'readAll' }) }); } catch {}
  };

  const timeAgo = (s: string) => {
    const diff = (Date.now() - new Date(s).getTime()) / 1000;
    if (diff < 60) return '\uBC29\uAE08';
    if (diff < 3600) return `${Math.floor(diff / 60)}\uBD84 \uC804`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}\uC2DC\uAC04 \uC804`;
    return `${Math.floor(diff / 86400)}\uC77C \uC804`;
  };

  const NOTI_COLORS: Record<string, { color: string; bg: string }> = {
    RESERVATION: { color: '#3B82F6', bg: '#DBEAFE' },
    PAYMENT: { color: '#10B981', bg: '#D1FAE5' },
    CUSTOMER: { color: '#8B5CF6', bg: '#EDE9FE' },
    MEMBERSHIP: { color: '#F59E0B', bg: '#FEF3C7' },
    SYSTEM: { color: '#6B7280', bg: '#F3F4F6' },
    CAMPAIGN: { color: '#EC4899', bg: '#FCE7F3' },
    REMINDER: { color: '#EF4444', bg: '#FEE2E2' },
  };

  // 현재 페이지명 추출
  const segments = pathname.split('/').filter(Boolean);
  const lastSeg = segments[segments.length - 1] || '';
  const secondLast = segments.length >= 2 ? segments[segments.length - 2] : '';
  const pageInfo = PAGE_MAP[lastSeg] || PAGE_MAP[secondLast] || null;
  const PageIcon = pageInfo?.icon || Store;
  const pageLabel = pageInfo?.label || '';

  // 예약 섹션 탭
  const isReservationSection = lastSeg === 'reservations' || lastSeg === 'calendar' || secondLast === 'reservations';
  const reservationTabs: SubTab[] = shopSlug ? [
    { label: '리스트', icon: List, path: `/${shopSlug}/reservations`, key: 'reservations' },
    { label: '캘린더', icon: CalendarDays, path: `/${shopSlug}/reservations/calendar`, key: 'calendar' },
    { label: '예약등록', icon: Plus, path: `/${shopSlug}/reservations/new`, key: 'new' },
  ] : [];

  const activeTab = lastSeg === 'calendar' ? 'calendar' : lastSeg === 'new' ? 'new' : 'reservations';

  // 시술관리 섹션 탭
  const isMenuSection = lastSeg === 'menus' || lastSeg === 'categories' || secondLast === 'menus';
  const menuTabs: SubTab[] = shopSlug ? [
    { label: '뷰티 상품', icon: List, path: `/${shopSlug}/menus`, key: 'menus' },
    { label: '시술 상세', icon: List, path: `/${shopSlug}/menus/categories`, key: 'categories' },
    { label: '+ 추가', icon: Plus, path: `/${shopSlug}/menus?new=1`, key: 'new' },
  ] : [];
  const activeMenuTab = lastSeg === 'categories' ? 'categories' : 'menus';

  // 고객관리 섹션 탭
  const isCustomerSection = lastSeg === 'customers' || secondLast === 'customers';
  const customerTabs: SubTab[] = shopSlug ? [
    { label: '고객 리스트', icon: List, path: `/${shopSlug}/customers`, key: 'customers' },
    { label: '고객등록', icon: Plus, path: `/${shopSlug}/customers?new=1`, key: 'new' },
  ] : [];
  const activeCustomerTab = 'customers';

  // 매출/정산 섹션 탭
  const isSalesSection = lastSeg === 'sales' || secondLast === 'sales';
  const salesTabs: SubTab[] = shopSlug ? [
    { label: '매출 현황', icon: List, path: `/${shopSlug}/sales`, key: 'sales' },
    { label: '+ 결제 등록', icon: Plus, path: `/${shopSlug}/sales?pay=1`, key: 'pay' },
  ] : [];
  const activeSalesTab = 'sales';

  // 직원관리 섹션 탭
  const isStaffSection = lastSeg === 'staff' || secondLast === 'staff';
  const staffTabs: SubTab[] = shopSlug ? [
    { label: '직원 리스트', icon: List, path: `/${shopSlug}/staff`, key: 'staff' },
    { label: '+ 직원 등록', icon: Plus, path: `/${shopSlug}/staff?new=1`, key: 'new' },
  ] : [];
  const activeStaffTab = 'staff';

  // 재고관리 섹션 탭
  const isInventorySection = lastSeg === 'inventory' || secondLast === 'inventory';
  const inventoryTabs: SubTab[] = shopSlug ? [
    { label: '재고 현황', icon: List, path: `/${shopSlug}/inventory`, key: 'inventory' },
    { label: '+ 제품 등록', icon: Plus, path: `/${shopSlug}/inventory?new=1`, key: 'new' },
  ] : [];
  const activeInventoryTab = 'inventory';

  // 알림 섹션 탭
  const isNotiSection = lastSeg === 'notifications' || secondLast === 'notifications';
  const notiTabs: SubTab[] = shopSlug ? [
    { label: '전체', icon: List, path: `/${shopSlug}/notifications`, key: 'all' },
    { label: '안 읽음', icon: List, path: `/${shopSlug}/notifications?filter=unread`, key: 'unread' },
  ] : [];
  const activeNotiTab = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('filter') === 'unread' ? 'unread' : 'all';

  // 다중매장 섹션 - 매장 수 표시
  const isBranchesSection = lastSeg === 'branches' || secondLast === 'branches';
  const [branchCount, setBranchCount] = useState(0);
  useEffect(() => {
    if (isBranchesSection && shopSlug) {
      fetch(`/api/shops/${shopSlug}/multi-shop`).then(r => r.ok ? r.json() : null).then(d => {
        if (d?.shops) setBranchCount(d.shops.length);
      }).catch(() => {});
    }
  }, [isBranchesSection, shopSlug]);

  // 포트폴리오 섹션 탭
  const isPortfolioSection = lastSeg === 'portfolio' || secondLast === 'portfolio';
  const portfolioTabs: SubTab[] = shopSlug ? [
    { label: '포트폴리오', icon: List, path: `/${shopSlug}/portfolio`, key: 'portfolio' },
    { label: '포트폴리오등록', icon: Plus, path: `/${shopSlug}/portfolio?new=1`, key: 'new' },
  ] : [];
  const activePortfolioTab = 'portfolio';

  // 멤버십 섹션 탭
  const isMembershipSection = lastSeg === 'membership' || secondLast === 'membership';
  const membershipTabs: SubTab[] = shopSlug ? [
    { label: '멤버십 현황', icon: List, path: `/${shopSlug}/membership`, key: 'membership' },
    { label: '포인트 설정', icon: List, path: `/${shopSlug}/membership?settings=1`, key: 'settings' },
  ] : [];
  const activeMembershipTab = 'membership';

  // 서브탭 스크롤 컴포넌트
  const ScrollableTabs = useCallback(({ tabs: tabList, activeKey, colors }: { tabs: SubTab[]; activeKey: string; colors: typeof c }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(false);
    const dragState = useRef({ isDown: false, startX: 0, scrollLeft: 0 });

    const check = () => {
      const el = scrollRef.current;
      if (!el) return;
      setCanLeft(el.scrollLeft > 2);
      setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
    };

    useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;
      const t = setTimeout(check, 100);
      el.addEventListener('scroll', check);
      const ro = new ResizeObserver(check);
      ro.observe(el);
      return () => { clearTimeout(t); el.removeEventListener('scroll', check); ro.disconnect(); };
    }, []);

    return (
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginLeft: 4, flex: 1, minWidth: 0 }}>
        {canLeft && (
          <button onClick={() => scrollRef.current?.scrollBy({ left: -100, behavior: 'smooth' })}
            style={{
              position: 'absolute', left: 0, zIndex: 2,
              width: 22, height: 22, borderRadius: '50%', border: `1px solid ${colors.borderLight}`,
              background: colors.surface, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', flexShrink: 0,
            }}>
            <ChevronLeft style={{ width: 12, height: 12, color: colors.primary }} />
          </button>
        )}
        {canRight && (
          <button onClick={() => scrollRef.current?.scrollBy({ left: 100, behavior: 'smooth' })}
            style={{
              position: 'absolute', right: 0, zIndex: 2,
              width: 22, height: 22, borderRadius: '50%', border: `1px solid ${colors.borderLight}`,
              background: colors.surface, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', flexShrink: 0,
            }}>
            <ChevronRight style={{ width: 12, height: 12, color: colors.primary }} />
          </button>
        )}
        <div ref={scrollRef}
          style={{
            display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch', userSelect: 'none',
            paddingLeft: canLeft ? 24 : 0, paddingRight: canRight ? 24 : 0,
            transition: 'padding .2s',
          }}
          onMouseDown={e => {
            const el = scrollRef.current;
            if (!el) return;
            dragState.current = { isDown: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
          }}
          onMouseLeave={() => { dragState.current.isDown = false; }}
          onMouseUp={() => { dragState.current.isDown = false; }}
          onMouseMove={e => {
            if (!dragState.current.isDown) return;
            e.preventDefault();
            const el = scrollRef.current;
            if (!el) return;
            el.scrollLeft = dragState.current.scrollLeft - (e.pageX - el.offsetLeft - dragState.current.startX);
          }}
        >
          <style>{`div[style*="scrollbarWidth"]::-webkit-scrollbar{display:none!important;width:0!important}`}</style>
          {tabList.map((tab) => {
            const isActive = activeKey === tab.key;
            const TabIcon = tab.icon;
            return (
              <Link key={tab.key} href={tab.path} style={{ flexShrink: 0 }}>
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  whiteSpace: 'nowrap',
                  background: isActive ? colors.primary : 'transparent',
                  color: isActive ? colors.textOnPrimary : colors.textLight,
                  border: isActive ? 'none' : `1px solid ${colors.borderLight}`,
                  cursor: 'pointer', transition: 'all .15s',
                }}>
                  <TabIcon style={{ width: 14, height: 14 }} />
                  {tab.label}
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth/login');
  };

  return (
    <header
      className="flex h-14 items-center justify-between border-b px-4 lg:px-6"
      style={{ background: c.surface, borderColor: c.borderLight }}
    >
      {/* 왼쪽: 페이지명 + 탭 */}
      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
          <PageIcon className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" style={{ color: c.primary }} />
          <h1 className="text-sm md:text-lg font-semibold truncate" style={{ color: c.text }}>
            {pageLabel}
          </h1>
        </div>

        {/* 서브 탭 */}
        {isReservationSection && <ScrollableTabs tabs={reservationTabs} activeKey={activeTab} colors={c} />}

        {isMenuSection && <ScrollableTabs tabs={menuTabs} activeKey={activeMenuTab} colors={c} />}
        {isCustomerSection && <ScrollableTabs tabs={customerTabs} activeKey={activeCustomerTab} colors={c} />}
        {isSalesSection && <ScrollableTabs tabs={salesTabs} activeKey={activeSalesTab} colors={c} />}
        {isStaffSection && <ScrollableTabs tabs={staffTabs} activeKey={activeStaffTab} colors={c} />}
        {isInventorySection && <ScrollableTabs tabs={inventoryTabs} activeKey={activeInventoryTab} colors={c} />}
        {isNotiSection && <ScrollableTabs tabs={notiTabs} activeKey={activeNotiTab} colors={c} />}

        {isBranchesSection && branchCount > 0 && (
          <span style={{ marginLeft: 6, fontSize: 12, color: c.textLight, fontWeight: 400 }}>
            {branchCount}개 매장
          </span>
        )}

        {lastSeg === 'analytics' && (
          <span style={{ marginLeft: 6, fontSize: 12, color: c.textLight, fontWeight: 400 }}>
            데이터 기반 인사이트와 추천
          </span>
        )}

        {isPortfolioSection && <ScrollableTabs tabs={portfolioTabs} activeKey={activePortfolioTab} colors={c} />}
        {isMembershipSection && <ScrollableTabs tabs={membershipTabs} activeKey={activeMembershipTab} colors={c} />}
      </div>

      {/* 오른쪽: 알림 + 사용자 */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div style={{ position: 'relative' }}>
          <Button variant="ghost" size="icon" className="relative" onClick={toggleNotiPanel}>
            <Bell className="h-5 w-5" style={{ color: c.textLight }} />
            {notiCount > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-white"
                style={{ background: '#EF4444' }}
              >
                {notiCount > 9 ? '9+' : notiCount}
              </span>
            )}
          </Button>

          {/* 알림 드롭다운 패널 */}
          {showNotiPanel && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setShowNotiPanel(false)} />
              <div style={{
                position: mob ? 'fixed' : 'absolute',
                top: mob ? 56 : '100%',
                left: mob ? '50%' : 'auto',
                right: mob ? 'auto' : 0,
                transform: mob ? 'translateX(-50%)' : 'none',
                marginTop: mob ? 0 : 8,
                width: mob ? '95vw' : 360,
                maxHeight: mob ? '75vh' : 480,
                background: 'white',
                borderRadius: 14,
                border: `1px solid ${c.borderLight}`,
                boxShadow: '0 8px 30px rgba(0,0,0,.12)',
                zIndex: 999,
                overflow: 'hidden',
              }}>
                {/* 헤더 */}
                <div style={{ padding: '14px 16px', borderBottom: `1px solid ${c.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: c.text }}>{'\uC54C\uB9BC'} {notiCount > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: 'white', background: '#EF4444', padding: '1px 6px', borderRadius: 8, marginLeft: 4 }}>{notiCount}</span>}</span>
                  {notiCount > 0 && (
                    <button onClick={markAllRead} style={{ fontSize: 11, color: c.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{'\uBAA8\uB450 \uC77D\uC74C'}</button>
                  )}
                </div>

                {/* 알림 목록 */}
                <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                  {notiList.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: c.textLight, fontSize: 13 }}>{'\uC54C\uB9BC\uC774 \uC5C6\uC2B5\uB2C8\uB2E4'}</div>
                  ) : (
                    notiList.slice(0, 8).map(n => {
                      const nc = NOTI_COLORS[n.type] || NOTI_COLORS.SYSTEM;
                      const isUnread = !n.readAt;
                      return (
                        <div key={n.id}
                          onClick={() => { if (isUnread) markRead(n.id); }}
                          style={{ padding: '10px 16px', borderBottom: `1px solid ${c.borderLight}10`, background: isUnread ? `${nc.bg}50` : 'transparent', cursor: isUnread ? 'pointer' : 'default', transition: 'background .15s', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: nc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: nc.color }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 12, fontWeight: isUnread ? 700 : 500, color: c.text }}>{n.title}</span>
                              {isUnread && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />}
                            </div>
                            <div style={{ fontSize: 11, color: c.textLight, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{n.content}</div>
                            <div style={{ fontSize: 9, color: c.textLight, marginTop: 2 }}>{timeAgo(n.createdAt)}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* 전체보기 */}
                <div style={{ padding: '10px 16px', borderTop: `1px solid ${c.borderLight}`, textAlign: 'center' }}>
                  <button onClick={() => { setShowNotiPanel(false); router.push(`/${shopSlug}/notifications`); }}
                    style={{ fontSize: 12, fontWeight: 600, color: c.primary, background: 'none', border: 'none', cursor: 'pointer' }}>
                    {'\uC804\uCCB4 \uC54C\uB9BC \uBCF4\uAE30'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                {userProfileImage && <AvatarImage src={userProfileImage} alt={userName || ''} style={{ objectFit: 'cover' }} />}
                <AvatarFallback style={{ background: c.primaryLight, color: c.primary }}>
                  {userName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium" style={{ color: c.text }}>{userName}</p>
                <p className="text-xs" style={{ color: c.textLight }}>
                  {userRole === 'OWNER' ? '원장님' : '관리사님'}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>프로필</DropdownMenuItem>
            <DropdownMenuItem>설정</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
