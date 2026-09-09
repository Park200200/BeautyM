'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useShopStore } from '@/stores/shop-store';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { cn } from '@/lib/utils';
import { MODULE_REGISTRY, MODULE_ROUTES } from '@/lib/modules';
import ThemeSwitcher from '@/components/theme-switcher';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  PanelLeftClose, PanelLeftOpen, Lock, Settings,
  CalendarCheck, UserRound, ClipboardList, TrendingUp,
  UsersRound, Package, Gift, Camera, LayoutDashboard,
  Globe, Bell, Building2, BrainCircuit,
  Pencil, X, ChevronUp, ChevronDown, GripVertical, RotateCcw,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  CalendarCheck, UserRound, ClipboardList, TrendingUp,
  UsersRound, Package, Gift, Camera, LayoutDashboard,
  Globe, Bell, Building2, BrainCircuit,
};

type SidebarItem = { moduleId: string; name: string; visible: boolean; sortOrder: number };

export default function Sidebar() {
  const pathname = usePathname();
  const { shopSlug, shopName, planName, accessibleModuleIds, enabledModules, isSidebarOpen, toggleSidebar } = useShopStore();
  const [mounted, setMounted] = useState(false);
  const store = useThemeStore();
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;

  const adminModules = MODULE_REGISTRY.filter((m) => m.target === 'ADMIN');
  const [collapsed, setCollapsed] = useState(false);

  // Sidebar config
  const [sidebarConfig, setSidebarConfig] = useState<SidebarItem[] | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editConfig, setEditConfig] = useState<SidebarItem[]>([]);

  const fetchConfig = useCallback(async () => {
    if (!shopSlug) return;
    try {
      const res = await fetch(`/api/shops/${shopSlug}/settings/sidebar`);
      if (res.ok) { const d = await res.json(); setSidebarConfig(d.config); }
    } catch (e) { console.error(e); }
  }, [shopSlug]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  // Get ordered modules based on config
  const getOrderedModules = () => {
    if (!sidebarConfig) return adminModules;
    return [...sidebarConfig]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(item => {
        const mod = adminModules.find(m => m.id === item.moduleId);
        if (!mod) return null;
        return { ...mod, name: item.name, _visible: item.visible };
      })
      .filter(Boolean) as (typeof adminModules[0] & { _visible: boolean })[];
  };

  const isVisible = (moduleId: string) => {
    if (!sidebarConfig) return true;
    const item = sidebarConfig.find(s => s.moduleId === moduleId);
    return item ? item.visible : true;
  };

  const getDisplayName = (moduleId: string, defaultName: string) => {
    if (!sidebarConfig) return defaultName;
    const item = sidebarConfig.find(s => s.moduleId === moduleId);
    return item ? item.name : defaultName;
  };

  // Edit modal
  const openEdit = () => {
    const config = sidebarConfig || adminModules.map(m => ({ moduleId: m.id, name: m.name, visible: true, sortOrder: m.sortOrder }));
    setEditConfig(config.map(c => ({...c})));
    setShowEditModal(true);
  };

  const moveItem = (i: number, dir: -1 | 1) => {
    const a = [...editConfig]; const t = i + dir;
    if (t < 0 || t >= a.length) return;
    [a[i], a[t]] = [a[t], a[i]];
    setEditConfig(a.map((x, j) => ({...x, sortOrder: j})));
  };

  const toggleVisible = (i: number) => {
    const a = [...editConfig]; a[i] = {...a[i], visible: !a[i].visible};
    setEditConfig(a);
  };

  const renameMod = (i: number, name: string) => {
    const a = [...editConfig]; a[i] = {...a[i], name};
    setEditConfig(a);
  };

  const resetToDefault = () => {
    setEditConfig(adminModules.map(m => ({ moduleId: m.id, name: m.name, visible: true, sortOrder: m.sortOrder })));
  };

  const saveConfig = async () => {
    try {
      const res = await fetch(`/api/shops/${shopSlug}/settings/sidebar`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: editConfig })
      });
      if (res.ok) { setSidebarConfig(editConfig); setShowEditModal(false); }
    } catch (e) { console.error(e); }
  };

  // Render menu item
  const renderMenuItem = (module: typeof adminModules[0], opts: { collapsed: boolean; onClick?: () => void }) => {
    const moduleId = module.id as keyof typeof MODULE_ROUTES;
    const isEnabled = enabledModules.some(m => m.moduleId === module.id && m.isEnabled);
    const isAccessible = accessibleModuleIds.includes(module.id);
    const route = `/${shopSlug}${MODULE_ROUTES[moduleId]}`;
    const isActive = pathname?.startsWith(route);
    const displayName = getDisplayName(module.id, module.name);

    if (!isVisible(module.id)) return null;

    if (!isEnabled) return (
      <li key={module.id}>
        <div className={cn('flex cursor-not-allowed items-center rounded-lg py-2.5 transition-colors', opts.collapsed ? 'justify-center px-2' : 'px-3')}
          style={{ color: `${c.sidebarText}40` }} title={opts.collapsed ? `${displayName} (\uC7A0\uAE08)` : '\uD50C\uB79C \uC5C5\uADF8\uB808\uC774\uB4DC \uD544\uC694'}>
          <Lock className="h-4 w-4 flex-shrink-0" />
          {!opts.collapsed && <span className="ml-3 text-sm">{displayName}</span>}
        </div>
      </li>
    );

    if (!isAccessible) return (
      <li key={module.id}>
        <div className={cn('flex cursor-not-allowed items-center rounded-lg py-2.5 transition-colors', opts.collapsed ? 'justify-center px-2' : 'px-3')}
          style={{ color: `${c.sidebarText}60` }} title={opts.collapsed ? displayName : '\uC811\uADFC \uAD8C\uD55C \uC5C6\uC74C'}>
          {(() => { const Icon = ICON_MAP[module.icon]; return Icon ? <Icon className="h-5 w-5 flex-shrink-0" /> : null; })()}
          {!opts.collapsed && <span className="ml-3 text-sm">{displayName}</span>}
        </div>
      </li>
    );

    return (
      <li key={module.id}>
        <Link href={route} onClick={opts.onClick}
          className={cn('flex items-center rounded-lg py-2.5 text-sm transition-all duration-200', opts.collapsed ? 'justify-center px-2' : 'px-3')}
          style={{ background: isActive ? c.sidebarActive : 'transparent', color: isActive ? c.textOnPrimary : c.sidebarText }}
          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = c.sidebarHover; }}
          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
          title={opts.collapsed ? displayName : undefined}>
          {(() => { const Icon = ICON_MAP[module.icon]; return Icon ? <Icon className="h-5 w-5 flex-shrink-0" /> : null; })()}
          {!opts.collapsed && <span className="ml-3">{displayName}</span>}
        </Link>
      </li>
    );
  };

  const orderedModules = getOrderedModules();

  return (
    <>
      {/* Desktop */}
      <aside className={cn('hidden lg:flex flex-col flex-shrink-0 h-screen transition-all duration-300 ease-in-out overflow-hidden border-r', collapsed ? 'w-[72px]' : 'w-64')}
        style={{ background: c.sidebar, borderColor: c.borderLight }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${c.sidebarHover}` }}>
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-2xl">{theme.logo.icon}</span>
              <div className="min-w-0">
                <p className="truncate font-bold" style={{ color: c.sidebarText }}>{shopName || '\uB9E4\uC7A5'}</p>
                <p className="truncate text-xs" style={{ color: `${c.sidebarText}99` }}>{planName || 'Free'} {'\uD50C\uB79C'}</p>
              </div>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{ color: c.sidebarText }}
            onMouseEnter={e => e.currentTarget.style.background = c.sidebarHover}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            title={collapsed ? '\uBA54\uB274 \uD3BC\uCE58\uAE30' : '\uBA54\uB274 \uC811\uAE30'}>
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          <ul className="space-y-0.5 px-2">
            {orderedModules.map(module => renderMenuItem(module, { collapsed }))}
          </ul>
          <div className="mt-3 px-2 pt-3" style={{ borderTop: `1px solid ${c.sidebarHover}` }}>
            <Link href={`/${shopSlug}/settings`}
              className={cn('flex items-center rounded-lg py-2.5 text-sm transition-all duration-200', collapsed ? 'justify-center px-2' : 'px-3')}
              style={{ background: pathname?.startsWith(`/${shopSlug}/settings`) ? c.sidebarActive : 'transparent', color: pathname?.startsWith(`/${shopSlug}/settings`) ? c.textOnPrimary : c.sidebarText }}
              onMouseEnter={e => { if (!pathname?.startsWith(`/${shopSlug}/settings`)) e.currentTarget.style.background = c.sidebarHover; }}
              onMouseLeave={e => { if (!pathname?.startsWith(`/${shopSlug}/settings`)) e.currentTarget.style.background = 'transparent'; }}
              title={collapsed ? '\uC124\uC815' : undefined}>
              <Settings className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="ml-3">{'\uC124\uC815'}</span>}
            </Link>
          </div>
        </nav>

        {!collapsed && (
          <div className="p-4 space-y-3" style={{ borderTop: `1px solid ${c.sidebarHover}` }}>
            <button onClick={openEdit}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs transition-colors"
              style={{ color: `${c.sidebarText}80` }}
              onMouseEnter={e => e.currentTarget.style.background = c.sidebarHover}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Pencil className="w-3.5 h-3.5" /> {'\uBA54\uB274 \uD3B8\uC9D1'}
            </button>
            <ThemeSwitcher />
            <p className="text-xs" style={{ color: `${c.sidebarText}60` }}>&copy; BeautyM</p>
          </div>
        )}
      </aside>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={toggleSidebar} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col animate-in slide-in-from-left duration-300" style={{ background: c.sidebar }}>
            <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${c.sidebarHover}` }}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{theme.logo.icon}</span>
                <div>
                  <p className="font-bold" style={{ color: c.sidebarText }}>{shopName || '\uB9E4\uC7A5'}</p>
                  <p className="text-xs" style={{ color: `${c.sidebarText}99` }}>{planName || 'Free'} {'\uD50C\uB79C'}</p>
                </div>
              </div>
              <button onClick={toggleSidebar} className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ color: c.sidebarText }}>{'\u2715'}</button>
            </div>
            <nav className="flex-1 overflow-y-auto py-3">
              <ul className="space-y-0.5 px-2">
                {orderedModules.map(module => renderMenuItem(module, { collapsed: false, onClick: toggleSidebar }))}
              </ul>
            </nav>
            <div className="p-4 space-y-3" style={{ borderTop: `1px solid ${c.sidebarHover}` }}>
              <button onClick={() => { toggleSidebar(); setTimeout(openEdit, 300); }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs transition-colors"
                style={{ color: `${c.sidebarText}80` }}>
                <Pencil className="w-3.5 h-3.5" /> {'\uBA54\uB274 \uD3B8\uC9D1'}
              </button>
              <ThemeSwitcher />
              <p className="text-xs" style={{ color: `${c.sidebarText}60` }}>&copy; BeautyM</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setShowEditModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: c.primaryLight + '30' }}>
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: c.text }}>
                <Pencil className="w-5 h-5" style={{ color: c.primary }} />{'\uBA54\uB274 \uD3B8\uC9D1'}
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={resetToDefault} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-black/5" style={{ color: c.textLight }} title={'\uAE30\uBCF8\uAC12 \uBCF5\uC6D0'}>
                  <RotateCcw className="w-3.5 h-3.5" /> {'\uCD08\uAE30\uD654'}
                </button>
                <button onClick={() => setShowEditModal(false)} className="p-1 rounded-lg hover:bg-black/5">
                  <X className="w-5 h-5" style={{ color: c.textLight }} />
                </button>
              </div>
            </div>

            <div className="px-6 py-4 max-h-[450px] overflow-y-auto space-y-2">
              {editConfig.map((item, i) => {
                const mod = adminModules.find(m => m.id === item.moduleId);
                const Icon = mod ? ICON_MAP[mod.icon] : null;
                return (
                  <div key={item.moduleId} className="flex items-center gap-2 px-3 py-2.5 rounded-xl group"
                    style={{ backgroundColor: item.visible ? c.primaryLight + '15' : '#f3f4f6', border: `1px solid ${item.visible ? c.borderLight : '#e5e7eb'}`, opacity: item.visible ? 1 : 0.5 }}>
                    <GripVertical className="w-4 h-4 shrink-0" style={{ color: c.borderLight }} />
                    {Icon && <Icon className="w-4 h-4 shrink-0" style={{ color: item.visible ? c.primary : '#9ca3af' }} />}
                    <Input value={item.name} onChange={e => renameMod(i, e.target.value)}
                      className="h-7 text-sm font-medium rounded-lg border-0 bg-transparent px-1 focus-visible:ring-1 flex-1" />
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveItem(i, -1)} disabled={i === 0} className="p-0.5 rounded hover:bg-white disabled:opacity-30" style={{ color: c.textLight }}>
                        <ChevronUp className="w-3.5 h-3.5" /></button>
                      <button onClick={() => moveItem(i, 1)} disabled={i === editConfig.length - 1} className="p-0.5 rounded hover:bg-white disabled:opacity-30" style={{ color: c.textLight }}>
                        <ChevronDown className="w-3.5 h-3.5" /></button>
                    </div>
                    <Switch checked={item.visible} onCheckedChange={() => toggleVisible(i)} />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ backgroundColor: '#fafafa' }}>
              <Button variant="outline" onClick={() => setShowEditModal(false)} className="rounded-xl">{'\uCDE8\uC18C'}</Button>
              <button onClick={saveConfig} className="px-5 py-2 rounded-xl text-sm font-medium"
                style={{ backgroundColor: c.primary, color: c.textOnPrimary }}>{'\uC800\uC7A5'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
