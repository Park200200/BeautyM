'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, getThemeList, DEFAULT_THEME_ID } from '@/lib/themes';
import {
  CalendarCheck,
  UserRound,
  TrendingUp,
  UsersRound,
  Gift,
  Package,
  LayoutDashboard,
  Globe,
  Bell,
} from 'lucide-react';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const store = useThemeStore();
  const themes = getThemeList();
  const router = useRouter();
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => setMounted(true), []);

  // 마운트 전에는 기본 테마 사용 (서버 렌더링과 동일)
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const themeId = mounted ? store.themeId : DEFAULT_THEME_ID;
  const setTheme = store.setTheme;
  const c = theme.colors;

  const handleDemoLogin = async () => {
    setLoggingIn(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'owner@demo.com', password: 'owner1234' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.shopSlug) router.push(`/${data.shopSlug}/dashboard`);
        else router.push('/');
      }
    } catch (e) { console.error(e); }
    finally { setLoggingIn(false); }
  };

  const iconClass = 'h-7 w-7';

  const features = [
    { icon: <CalendarCheck className={iconClass} />, name: '스마트 예약', desc: '온라인 예약부터 일정 관리까지, 더 이상 전화 예약에 매달리지 마세요.' },
    { icon: <UserRound className={iconClass} />, name: '고객 관리', desc: '피부 타입, 시술 이력, 선호도까지 — 고객 한 명 한 명을 기억합니다.' },
    { icon: <TrendingUp className={iconClass} />, name: '매출 분석', desc: '일별, 월별, 관리사별 매출을 한눈에. 데이터로 성장하세요.' },
    { icon: <UsersRound className={iconClass} />, name: '직원 관리', desc: '스케줄, 실적, 권한까지 — 팀을 효율적으로 운영하세요.' },
    { icon: <Gift className={iconClass} />, name: '멤버십', desc: '포인트, 쿠폰, 등급 시스템으로 단골 고객을 만드세요.' },
    { icon: <Package className={iconClass} />, name: '재고 관리', desc: '제품 입출고부터 재고 알림까지, 빈틈없는 관리.' },
    { icon: <LayoutDashboard className={iconClass} />, name: '대시보드', desc: '오늘의 예약, 매출, 핵심 지표를 한 화면에서 확인하세요.' },
    { icon: <Globe className={iconClass} />, name: '고객 웹사이트', desc: '내 매장만의 예약 페이지를 고객에게 제공하세요.' },
    { icon: <Bell className={iconClass} />, name: '스마트 알림', desc: '카카오 알림톡, SMS로 예약 확인과 마케팅 메시지를 보내세요.' },
  ];

  const plans = [
    {
      name: 'Free',
      price: '무료',
      desc: '시작해보세요',
      features: ['예약 관리', '고객 관리 (20명)', '시술 메뉴', '고객 웹사이트'],
    },
    {
      name: 'Standard',
      price: '29,000원',
      period: '/월',
      desc: '성장하는 매장',
      features: ['Free 기능 전부', '고객 수 무제한', '매출/정산', '멤버십/포트폴리오', '대시보드', '알림톡/SMS'],
    },
    {
      name: 'Pro',
      price: '69,000원',
      period: '/월',
      desc: '팀과 함께',
      features: ['Standard 기능 전부', '직원 관리 (10명)', '직원별 권한 설정', '재고 관리'],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: '149,000원',
      period: '/월',
      desc: '프랜차이즈',
      features: ['Pro 기능 전부', '다중 매장 (5개)', 'AI 분석', '커스텀 도메인', '직원 무제한'],
    },
  ];

  return (
    <div style={{ background: c.background, color: c.text }}>
      {/* 네비게이션 */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-md"
        style={{ background: `${c.background}ee`, borderBottom: `1px solid ${c.borderLight}` }}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{theme.logo.icon}</span>
            <span className="text-xl font-bold">
              <span style={{ color: theme.logo.brandColor }}>Beauty</span>
              <span style={{ color: theme.logo.accentColor }}>M</span>
            </span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm transition-colors hover:opacity-70">기능</a>
            <a href="#pricing" className="text-sm transition-colors hover:opacity-70">가격</a>
            <Link href="/auth/login" className="text-sm transition-colors hover:opacity-70">로그인</Link>
            <button
              onClick={handleDemoLogin}
              disabled={loggingIn}
              className="px-5 py-2 text-sm font-semibold transition-all hover:opacity-90"
              style={{
                background: c.primary,
                color: c.textOnPrimary,
                borderRadius: theme.buttonRadius,
                border: 'none', cursor: 'pointer',
                opacity: loggingIn ? 0.6 : 1,
              }}
            >
              {loggingIn ? '로그인 중...' : '무료 시작'}
            </button>
          </div>
        </div>
      </nav>

      <main>
        {/* 히어로 */}
        <section
          className="relative overflow-hidden px-4 pb-20 pt-16 md:pb-32 md:pt-24"
          style={{ background: theme.heroGradient }}
        >
          <div className="container mx-auto flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
            <div className="max-w-xl text-center lg:text-left">
              <div
                className="mb-6 inline-block px-4 py-1.5 text-xs font-medium"
                style={{
                  background: c.primaryLight,
                  color: c.primary,
                  borderRadius: theme.buttonRadius,
                }}
              >
                뷰티샵 전문 관리 솔루션
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
                아름다움을 관리하는{' '}
                <span style={{ color: c.primary }}>가장 스마트한</span> 방법
              </h1>
              <p className="mt-6 text-lg leading-relaxed" style={{ color: c.textLight }}>
                예약부터 고객관리, 매출분석, 직원관리까지 —<br />
                하나의 솔루션으로 매장 운영의 모든 것을 관리하세요.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <button
                  onClick={handleDemoLogin}
                  disabled={loggingIn}
                  className="px-8 py-3.5 text-center text-sm font-semibold transition-all hover:shadow-lg disabled:opacity-60"
                  style={{
                    background: c.primary,
                    color: c.textOnPrimary,
                    borderRadius: theme.buttonRadius,
                    boxShadow: `0 8px 30px ${c.primary}40`,
                    border: 'none', cursor: loggingIn ? 'wait' : 'pointer',
                  }}
                >
                  {loggingIn ? '로그인 중...' : '무료로 시작하기'}
                </button>
                <Link
                  href="#features"
                  className="border px-8 py-3.5 text-center text-sm font-semibold transition-all hover:bg-opacity-10"
                  style={{
                    borderColor: c.primary,
                    color: c.primary,
                    borderRadius: theme.buttonRadius,
                  }}
                >
                  기능 둘러보기
                </Link>
              </div>
            </div>

            {/* 히어로 비주얼 — 대시보드 미리보기 */}
            <div
              className="relative w-full max-w-lg rounded-2xl border p-6 lg:max-w-xl"
              style={{
                background: c.surface,
                borderColor: c.borderLight,
                boxShadow: `0 20px 60px ${c.primary}15`,
              }}
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <span className="ml-2 text-xs" style={{ color: c.textLight }}>dashboard</span>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  {['오늘 예약 12건', '매출 ₩580,000', '신규 고객 +3'].map((text) => (
                    <div
                      key={text}
                      className="rounded-lg p-3 text-center"
                      style={{ background: c.primaryLight }}
                    >
                      <p className="text-xs" style={{ color: c.textLight }}>
                        {text.split(' ')[0]} {text.split(' ')[1]}
                      </p>
                      <p className="mt-1 text-lg font-bold" style={{ color: c.primary }}>
                        {text.split(' ').slice(-1)[0]}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg p-4" style={{ background: c.secondaryLight }}>
                  <div className="flex items-center justify-between text-xs" style={{ color: c.textLight }}>
                    <span className="flex items-center gap-1"><CalendarCheck className="h-3.5 w-3.5" /> 다음 예약</span>
                    <span>14:30</span>
                  </div>
                  <p className="mt-1 text-sm font-medium">김지연 — 수분관리 60분</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 기능 소개 */}
        <section id="features" className="px-4 py-20" style={{ background: c.background }}>
          <div className="container mx-auto">
            <div className="text-center">
              <h2 className="text-3xl font-bold md:text-4xl">
                매장 운영에 필요한 <span style={{ color: c.primary }}>모든 것</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg" style={{ color: c.textLight }}>
                복잡한 매장 운영을 심플하게. BeautyM 하나로 해결하세요.
              </p>
            </div>
            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.name}
                  className="group relative overflow-hidden rounded-2xl border p-8 text-center transition-all duration-300 hover:-translate-y-1.5"
                  style={{
                    background: c.surface,
                    borderColor: c.borderLight,
                    boxShadow: theme.cardShadow,
                  }}
                >
                  {/* 원형 아이콘 */}
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110"
                    style={{ background: c.primaryLight, color: c.primary }}
                  >
                    {f.icon}
                  </div>

                  {/* 제목 + 설명 */}
                  <h3 className="text-lg font-bold">{f.name}</h3>
                  <p className="mx-auto mt-2.5 max-w-[260px] text-sm leading-relaxed" style={{ color: c.textLight }}>
                    {f.desc}
                  </p>

                  {/* 하단 액센트 라인 */}
                  <div
                    className="absolute bottom-0 left-1/2 h-[3px] w-0 -translate-x-1/2 transition-all duration-300 group-hover:w-1/2"
                    style={{ background: c.primary, borderRadius: '3px 3px 0 0' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 가격 */}
        <section id="pricing" className="px-4 py-20" style={{ background: c.secondaryLight }}>
          <div className="container mx-auto">
            <div className="text-center">
              <h2 className="text-3xl font-bold md:text-4xl">
                합리적인 <span style={{ color: c.primary }}>가격</span>
              </h2>
              <p className="mt-4" style={{ color: c.textLight }}>
                매장 규모에 맞는 플랜을 선택하세요.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className="relative rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: plan.popular ? c.primary : c.surface,
                    borderColor: plan.popular ? c.primary : c.borderLight,
                    color: plan.popular ? c.textOnPrimary : c.text,
                    boxShadow: plan.popular
                      ? `0 12px 40px ${c.primary}30`
                      : theme.cardShadow,
                  }}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-1 text-xs font-bold"
                      style={{ color: c.primary }}
                    >
                      인기
                    </span>
                  )}
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <div className="mt-3">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-sm opacity-70">{plan.period}</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm opacity-70">{plan.desc}</p>
                  <ul className="mt-6 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <span className={plan.popular ? 'text-white' : ''} style={{ color: plan.popular ? undefined : c.primary }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/auth/register"
                    className="mt-6 block w-full border py-2.5 text-center text-sm font-semibold transition-all"
                    style={{
                      borderRadius: theme.buttonRadius,
                      background: plan.popular ? 'white' : 'transparent',
                      color: plan.popular ? c.primary : c.primary,
                      borderColor: plan.popular ? 'white' : c.primary,
                    }}
                  >
                    시작하기
                  </Link>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-sm" style={{ color: c.textLight }}>
              * 플랜은 기본 구성이며, 본사가 매장별로 자유롭게 모듈을 조정할 수 있습니다.
            </p>
          </div>
        </section>

        {/* 테마 프리뷰 */}
        <section className="px-4 py-16" style={{ background: c.background }}>
          <div className="container mx-auto text-center">
            <h2 className="text-2xl font-bold">🎨 테마 미리보기</h2>
            <p className="mt-2 text-sm" style={{ color: c.textLight }}>
              클릭하면 전체 페이지가 즉시 변경됩니다
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex items-center gap-3 rounded-xl border-2 px-5 py-3 transition-all hover:scale-105 ${
                    themeId === t.id ? 'scale-105 shadow-lg' : 'opacity-80'
                  }`}
                  style={{
                    borderColor: themeId === t.id ? t.primary : c.borderLight,
                    background: c.surface,
                  }}
                >
                  <div
                    className="h-8 w-8 rounded-full"
                    style={{ background: t.primary }}
                  />
                  <div className="text-left">
                    <p className="text-sm font-bold">{t.name}</p>
                    <p className="text-xs" style={{ color: c.textLight }}>{t.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="border-t px-4 py-12" style={{ borderColor: c.borderLight }}>
        <div className="container mx-auto text-center text-sm" style={{ color: c.textLight }}>
          <div className="mb-4 flex items-center justify-center gap-2">
            <span className="text-xl">{theme.logo.icon}</span>
            <span className="font-bold">
              <span style={{ color: theme.logo.brandColor }}>Beauty</span>
              <span style={{ color: theme.logo.accentColor }}>M</span>
            </span>
          </div>
          <p>© 2026 BeautyM. 피부관리샵/에스테틱 전문 종합 관리 솔루션</p>
        </div>
      </footer>
    </div>
  );
}
