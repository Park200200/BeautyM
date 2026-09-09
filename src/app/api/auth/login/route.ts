import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // 사용자 조회
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 비밀번호 확인
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 소속 매장 조회 (첫 번째 매장)
    const member = await prisma.shopMember.findFirst({
      where: { userId: user.id, isActive: true },
      include: { shop: true },
    });

    // SuperAdmin의 경우 첫 번째 매장으로 이동
    let shopSlug = member?.shop?.slug;
    if (!shopSlug && user.globalRole === 'SUPER_ADMIN') {
      const firstShop = await prisma.shop.findFirst({
        where: { isActive: true },
      });
      shopSlug = firstShop?.slug || '';
    }

    // 세션 쿠키 설정
    const sessionData = JSON.stringify({
      userId: user.id,
      globalRole: user.globalRole,
      shopSlug,
    });

    const response = NextResponse.json({
      success: true,
      shopSlug: shopSlug || '',
      globalRole: user.globalRole,
    });

    response.cookies.set('beautym-session', sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7일
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
