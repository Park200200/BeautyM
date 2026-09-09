'use client';

import { useEffect, useState } from 'react';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';

/**
 * 테마 초기화 Provider
 * Hydration 불일치를 방지하기 위해 마운트 후에만 테마 적용
 */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { theme } = useThemeStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const c = theme.colors;

    root.style.setProperty('--brand-primary', c.primary);
    root.style.setProperty('--brand-primary-light', c.primaryLight);
    root.style.setProperty('--brand-primary-dark', c.primaryDark);
    root.style.setProperty('--brand-secondary', c.secondary);
    root.style.setProperty('--brand-secondary-light', c.secondaryLight);
    root.style.setProperty('--brand-accent', c.accent);
    root.style.setProperty('--brand-text', c.text);
    root.style.setProperty('--brand-text-light', c.textLight);
    root.style.setProperty('--brand-text-on-primary', c.textOnPrimary);
    root.style.setProperty('--brand-background', c.background);
    root.style.setProperty('--brand-surface', c.surface);
    root.style.setProperty('--brand-surface-hover', c.surfaceHover);
    root.style.setProperty('--brand-border', c.border);
    root.style.setProperty('--brand-border-light', c.borderLight);
    root.style.setProperty('--brand-sidebar', c.sidebar);
    root.style.setProperty('--brand-sidebar-text', c.sidebarText);
    root.style.setProperty('--brand-sidebar-active', c.sidebarActive);
    root.style.setProperty('--brand-sidebar-hover', c.sidebarHover);
    root.style.setProperty('--brand-hero-gradient', theme.heroGradient);
    root.style.setProperty('--brand-card-shadow', theme.cardShadow);
    root.style.setProperty('--brand-button-radius', theme.buttonRadius);
  }, [theme, mounted]);

  // 마운트 전에는 기본 테마의 정적 값으로 렌더링 (서버와 동일)
  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
