import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const notices = await prisma.notice.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(notices);
  } catch {
    return NextResponse.json({ error: '조회 실패' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const notice = await prisma.notice.create({
      data: {
        title: body.title,
        content: body.content,
        category: body.category || '공지',
        target: body.target || '전체',
        status: body.status || '게시중',
        isImportant: body.isImportant || false,
      },
    });
    return NextResponse.json(notice, { status: 201 });
  } catch {
    return NextResponse.json({ error: '등록 실패' }, { status: 500 });
  }
}
