import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 할인코드 검증 API (공개)
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.json({ error: '코드를 입력하세요' }, { status: 400 });

  const dealer = await prisma.dealer.findUnique({
    where: { discountCode: code.toUpperCase() },
    select: { name: true, discountRate: true, isActive: true },
  });

  if (!dealer || !dealer.isActive) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ valid: true, dealerName: dealer.name, discountRate: dealer.discountRate });
}
