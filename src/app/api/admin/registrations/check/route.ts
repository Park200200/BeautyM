import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 신청 확인 API (공개 - 전화번호 또는 사업자등록번호로 조회)
export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone');
  const bizNumber = req.nextUrl.searchParams.get('bizNumber');

  if (!phone && !bizNumber) {
    return NextResponse.json({ error: '전화번호 또는 사업자등록번호를 입력하세요' }, { status: 400 });
  }

  const where: any = { AND: [] };
  if (phone) where.AND.push({ phone: { contains: phone } });
  if (bizNumber) where.AND.push({ bizNumber: { contains: bizNumber } });

  const registrations = await prisma.shopRegistration.findMany({
    where,
    select: {
      shopName: true,
      ownerName: true,
      planId: true,
      status: true,
      createdAt: true,
      reviewedAt: true,
      rejectedReason: true,
      rejectionType: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return NextResponse.json(registrations);
}
