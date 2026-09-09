// BeautyM - 현재 로그인 사용자 정보
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('beautym-session');
    if (!session?.value) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
    }

    const parsed = JSON.parse(session.value);
    const user = await prisma.user.findUnique({
      where: { id: parsed.userId },
      select: { id: true, name: true, email: true, globalRole: true },
    });

    if (!user) {
      return NextResponse.json({ error: '사용자 없음' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: '조회 실패' }, { status: 500 });
  }
}
