import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const notice = await prisma.notice.update({
      where: { id },
      data: {
        title: body.title,
        content: body.content,
        category: body.category,
        target: body.target,
        status: body.status,
        isImportant: body.isImportant,
      },
    });
    return NextResponse.json(notice);
  } catch {
    return NextResponse.json({ error: '수정 실패' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.notice.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: '삭제 실패' }, { status: 500 });
  }
}
