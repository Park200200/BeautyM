import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 딜러 목록 조회
export async function GET() {
  try {
    const dealers = await prisma.dealer.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(dealers);
  } catch (error) {
    console.error('Dealer list error:', error);
    return NextResponse.json({ error: '조회 실패' }, { status: 500 });
  }
}

// 딜러 등록
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, contactName, phone, email, company, discountCode, discountRate, commissionRate, bankName, bankAccount, bankHolder, terms, memo } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: '딜러명을 입력하세요' }, { status: 400 });
    }

    if (discountCode) {
      const existing = await prisma.dealer.findUnique({ where: { discountCode } });
      if (existing) {
        return NextResponse.json({ error: '이미 사용중인 할인코드입니다' }, { status: 409 });
      }
    }

    const dealer = await prisma.dealer.create({
      data: {
        name: name.trim(),
        contactName: contactName?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        company: company?.trim() || null,
        discountCode: discountCode?.trim() || null,
        discountRate: discountRate ? parseFloat(discountRate) : 0,
        commissionRate: commissionRate ? parseFloat(commissionRate) : 0,
        bankName: bankName?.trim() || null,
        bankAccount: bankAccount?.trim() || null,
        bankHolder: bankHolder?.trim() || null,
        terms: terms?.trim() || null,
        memo: memo?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, dealer });
  } catch (error) {
    console.error('Dealer create error:', error);
    return NextResponse.json({ error: '등록 실패' }, { status: 500 });
  }
}
