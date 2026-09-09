// BeautyM - 가입 신청 API
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 가입 신청 목록 조회 (본사용)
export async function GET() {
  try {
    const registrations = await prisma.shopRegistration.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(registrations);
  } catch (error) {
    console.error('Registration list error:', error);
    return NextResponse.json({ error: '조회 실패' }, { status: 500 });
  }
}

// 가입 신청 등록 (공개 - 랜딩페이지에서 호출)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { shopName, ownerName, phone, email, planId, address, memo } = body;

    if (!shopName || !ownerName || !phone || !email) {
      return NextResponse.json({ error: '필수 항목을 입력하세요.' }, { status: 400 });
    }

    // 중복 신청 확인
    const existing = await prisma.shopRegistration.findFirst({
      where: { email, status: 'PENDING' },
    });
    if (existing) {
      return NextResponse.json({ error: '이미 접수된 신청이 있습니다.' }, { status: 409 });
    }

    const registration = await prisma.shopRegistration.create({
      data: {
        shopName,
        ownerName,
        phone,
        email,
        planId: planId || null,
        address: address || null,
        memo: memo || null,
      },
    });

    return NextResponse.json({
      success: true,
      id: registration.id,
      message: '가입 신청이 접수되었습니다. 본사에서 검토 후 연락드리겠습니다.',
    });
  } catch (error) {
    console.error('Registration create error:', error);
    return NextResponse.json({ error: '신청 실패' }, { status: 500 });
  }
}
