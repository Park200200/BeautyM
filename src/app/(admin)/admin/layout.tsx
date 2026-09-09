'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import ThemeSwitcher from '@/components/theme-switcher';
import {
  LayoutDashboard, Building2, CreditCard, ToggleRight, Megaphone,
  Users, BarChart3, LogOut, PanelLeftClose, PanelLeftOpen, ClipboardCheck, Menu, X,
} from 'lucide-react';

const ADMIN_MENUS = [
  { id: 'dashboard', name: '\uB300\uC2DC\uBCF4\uB4DC', icon: LayoutDashboard, href: '/admin/dashboard' },
  { id: 'shops', name: '\uAC70\uB798\uCC98 \uAD00\uB9AC', icon: Building2, href: '/admin/shops' },
  { id: 'registrations', name: '\uAC00\uC785 \uC2E0\uCCAD', icon: ClipboardCheck, href: '/admin/registrations' },
  { id: 'subscriptions', name: '\uAD6C\uB3C5 \uAD00\uB9AC', icon: CreditCard, href: '/admin/subscriptions' },
  { id: 'modules', name: '\uBAA8\uB4C8 \uAD00\uB9AC', icon: ToggleRight, href: '/admin/modules' },
  { id: 'announcements', name: '\uACF5\uC9C0/\uAD11\uACE0', icon: Megaphone, href: '/admin/announcements' },
  { id: 'users', name: '\uC0AC\uC6A9\uC790 \uAD00\uB9AC', icon: Users, href: '/admin/users' },
  { id: 'stats', name: '\uD1B5\uACC4', icon: BarChart3, href: '/admin/stats' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [mounted, setMounted] = useState(false);
  const store = useThemeStore();
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth/login');
  };

  const renderMenu = (opts: { collapsed: boolean; onClick?: () => void }) => (
    <>
      <ul className="space-y-0.5 px-2">
        {ADMIN_MENUS.map((menu) => {
          const isActive = pathname?.startsWith(menu.href);
          const Icon = menu.icon;
          return (
            <li key={menu.id}>
              <Link href={menu.href} onClick={opts.onClick}
                className={`flex items-center rounded-lg py-2.5 text-sm transition-all duration-200 ${opts.collapsed ? 'justify-center px-2' : 'px-3'}`}
                style={{ background: isActive ? c.primary : 'transparent', color: isActive ? c.textOnPrimary : c.sidebarText }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = c.sidebarHover; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                title={opts.collapsed ? menu.name : undefined}>
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!opts.collapsed && <span className="ml-3">{menu.name}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F8F9FA' }}>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col flex-shrink-0 h-screen transition-all duration-300 border-r ${collapsed ? 'w-[72px]' : 'w-64'}`}
        style={{ background: '#FFFFFF', borderColor: c.borderLight }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${c.borderLight}` }}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="text-xl">{theme.logo.icon}</span>
              <div>
                <p className="font-bold text-sm" style={{ color: c.text }}>BeautyM</p>
                <p className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: c.primaryLight, color: c.primary }}>{'\uBCF8\uC0AC \uAD00\uB9AC'}</p>
              </div>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors" style={{ color: c.textLight }}
            onMouseEnter={(e) => (e.currentTarget.style.background = c.surfaceHover)} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">{renderMenu({ collapsed })}</nav>
        <div className="space-y-3 p-4" style={{ borderTop: `1px solid ${c.borderLight}` }}>
          {!collapsed && <ThemeSwitcher />}
          <button onClick={handleLogout} className={`flex items-center rounded-lg py-2 text-sm w-full transition-colors ${collapsed ? 'justify-center px-2' : 'px-3'}`}
            style={{ color: '#EF4444' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            title={collapsed ? '\uB85C\uADF8\uC544\uC6C3' : undefined}>
            <LogOut className="h-5 w-5 flex-shrink-0" />{!collapsed && <span className="ml-3">{'\uB85C\uADF8\uC544\uC6C3'}</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col animate-in slide-in-from-left duration-300" style={{ background: '#FFFFFF' }}>
            <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${c.borderLight}` }}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{theme.logo.icon}</span>
                <div>
                  <p className="font-bold text-sm" style={{ color: c.text }}>BeautyM</p>
                  <p className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: c.primaryLight, color: c.primary }}>{'\uBCF8\uC0AC \uAD00\uB9AC'}</p>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ color: c.textLight }}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-3">{renderMenu({ collapsed: false, onClick: () => setMobileOpen(false) })}</nav>
            <div className="space-y-3 p-4" style={{ borderTop: `1px solid ${c.borderLight}` }}>
              <ThemeSwitcher />
              <button onClick={handleLogout} className="flex items-center rounded-lg py-2 text-sm w-full px-3" style={{ color: '#EF4444' }}>
                <LogOut className="h-5 w-5 flex-shrink-0" /><span className="ml-3">{'\uB85C\uADF8\uC544\uC6C3'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b px-4 lg:px-6"
          style={{ background: c.surface, borderColor: c.borderLight }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg" style={{ color: c.text }}>
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base lg:text-lg font-semibold" style={{ color: c.text }}>
              {ADMIN_MENUS.find((m) => pathname?.startsWith(m.href))?.name || '\uBCF8\uC0AC \uAD00\uB9AC'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: c.primaryLight, color: c.primary }}>A</div>
            <span className="hidden sm:block text-sm font-medium" style={{ color: c.text }}>{'\uAD00\uB9AC\uC790'}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
