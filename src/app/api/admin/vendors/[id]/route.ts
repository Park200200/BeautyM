import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const vendor = await prisma.vendor.update({
      where: { id },
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
    return NextResponse.json(vendor);
  } catch (e) {
    return NextResponse.json({ error: '수정 실패' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.vendor.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: '삭제 실패' }, { status: 500 });
  }
}
