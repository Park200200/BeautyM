import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 딜러 수정
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const dealer = await prisma.dealer.update({ where: { id }, data: body });
    return NextResponse.json({ success: true, dealer });
  } catch (error) {
    console.error('Dealer update error:', error);
    return NextResponse.json({ error: '수정 실패' }, { status: 500 });
  }
}

// 딜러 삭제
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.dealer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Dealer delete error:', error);
    return NextResponse.json({ error: '삭제 실패' }, { status: 500 });
  }
}
