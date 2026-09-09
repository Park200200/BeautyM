// BeautyM - 테마 스토어
// 전역 테마 상태 관리

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BrandTheme, getTheme, DEFAULT_THEME_ID } from '@/lib/themes';

interface ThemeState {
  themeId: string;
  theme: BrandTheme;
  setTheme: (themeId: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeId: DEFAULT_THEME_ID,
      theme: getTheme(DEFAULT_THEME_ID),
      setTheme: (themeId: string) => {
        const theme = getTheme(themeId);
        set({ themeId, theme });

        // CSS 변수 업데이트
        if (typeof document !== 'undefined') {
          applyThemeToDOM(theme);
        }
      },
    }),
    {
      name: 'beautym-theme',
      onRehydrateStorage: () => (state) => {
        // 저장된 테마가 있으면 DOM에 적용
        if (state && typeof document !== 'undefined') {
          applyThemeToDOM(state.theme);
        }
      },
    }
  )
);

function applyThemeToDOM(theme: BrandTheme) {
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
}
