// BeautyM - 플랜 목록 API
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { price: 'asc' },
      select: { id: true, name: true, price: true, description: true },
    });
    return NextResponse.json(plans);
  } catch {
    return NextResponse.json({ error: '플랜 조회 실패' }, { status: 500 });
  }
}
