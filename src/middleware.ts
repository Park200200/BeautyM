// BeautyM - Next.js Middleware
// 인증 및 라우트 보호

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 인증 없이 접근 가능한 경로
const publicPaths = [
  '/',
  '/auth/login',
  '/auth/register',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/admin/registrations', // 온라인 가입 신청 (공개)
];

// 정적 파일 패턴
const staticPaths = [
  '/_next',
  '/favicon.ico',
  '/images',
  '/manifest.json',
  '/sw.js',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 파일은 통과
  if (staticPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 공개 경로는 통과
  if (publicPaths.some((p) => pathname === p)) {
    return NextResponse.next();
  }

  // API 경로 중 공개 경로는 통과
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // 고객 웹사이트 경로 (/s/[shopSlug])는 별도 인증 체계
  if (pathname.startsWith('/s/')) {
    return NextResponse.next();
  }

  // 세션 쿠키 확인
  const session = request.cookies.get('beautym-session');

  if (!session) {
    // 로그인 페이지로 리다이렉트
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 경로에 미들웨어 적용:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
