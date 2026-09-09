'use client';

import { useThemeStore } from '@/stores/theme-store';
import { getThemeList } from '@/lib/themes';

/**
 * 테마 전환 스위처
 * 사이드바 하단이나 설정 페이지에서 사용
 */
export default function ThemeSwitcher() {
  const { themeId, setTheme, theme } = useThemeStore();
  const themes = getThemeList();

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">테마</p>
      <div className="flex flex-wrap gap-2">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            title={`${t.name} — ${t.description}`}
            className={`group relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
              themeId === t.id
                ? 'scale-110 shadow-lg ring-2 ring-offset-1'
                : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'
            }`}
            style={{
              backgroundColor: t.primary,
              borderColor: themeId === t.id ? t.primary : undefined,
              // @ts-expect-error ring color
              '--tw-ring-color': themeId === t.id ? `${t.primary}40` : undefined,
            }}
          >
            {themeId === t.id && (
              <span className="text-xs text-white font-bold">✓</span>
            )}
            {/* 툴팁 */}
            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
              {t.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * 컴팩트 테마 전환 (드롭다운용)
 */
export function ThemeSwitcherCompact() {
  const { themeId, setTheme } = useThemeStore();
  const themes = getThemeList();

  return (
    <div className="flex items-center gap-1.5">
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          title={t.name}
          className={`h-5 w-5 rounded-full border transition-all ${
            themeId === t.id
              ? 'border-white scale-125 ring-2 ring-white/30'
              : 'border-transparent opacity-60 hover:opacity-100'
          }`}
          style={{ backgroundColor: t.primary }}
        />
      ))}
    </div>
  );
}
