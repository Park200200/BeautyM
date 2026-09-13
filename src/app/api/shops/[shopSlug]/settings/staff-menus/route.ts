import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 직원별 사이드바 메뉴 접근 권한 조회
export async function GET(req: NextRequest, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const staffMembers = await prisma.shopMember.findMany({
    where: { shopId: shop.id, role: { in: ['OWNER', 'STAFF'] } },
    select: {
      id: true,
      userId: true,
      role: true,
      isActive: true,
      allowedModules: true,
      user: { select: { name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({
    staff: staffMembers.map(s => ({
      id: s.id,
      userId: s.userId,
      name: s.user.name,
      role: s.role,
      isActive: s.isActive,
      allowedModules: s.allowedModules ? JSON.parse(s.allowedModules) : null,
    })),
  });
}

// 직원별 사이드바 메뉴 접근 권한 저장
export async function PUT(req: NextRequest, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const { staffId, allowedModules } = body as { staffId: string; allowedModules: string[] | null };

  if (!staffId) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  await prisma.shopMember.update({
    where: { id: staffId },
    data: {
      allowedModules: allowedModules && allowedModules.length > 0 ? JSON.stringify(allowedModules) : null,
    },
  });

  return NextResponse.json({ success: true });
}
