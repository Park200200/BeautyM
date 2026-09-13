import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 딜러 수정
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();

    // 숫자 필드 변환
    const data: any = { ...body };
    if ('discountRate' in data) data.discountRate = data.discountRate ? parseFloat(data.discountRate) : 0;
    if ('commissionRate' in data) data.commissionRate = data.commissionRate ? parseFloat(data.commissionRate) : 0;
    // 빈 문자열 → null
    for (const key of ['contactName', 'phone', 'email', 'company', 'discountCode', 'bankName', 'bankAccount', 'bankHolder', 'terms', 'memo']) {
      if (key in data && typeof data[key] === 'string') data[key] = data[key].trim() || null;
    }

    const dealer = await prisma.dealer.update({ where: { id }, data });
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
