import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const vendors = await prisma.vendor.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(vendors);
  } catch (e) {
    return NextResponse.json({ error: '조회 실패' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const vendor = await prisma.vendor.create({
      data: {
        name: body.name,
        contactName: body.contactName || null,
        phone: body.phone || null,
        email: body.email || null,
        category: body.category || null,
        bizNumber: body.bizNumber || null,
        bankInfo: body.bankInfo || null,
        terms: body.terms || null,
        memo: body.memo || null,
      },
    });
    return NextResponse.json(vendor, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: '등록 실패' }, { status: 500 });
  }
}
