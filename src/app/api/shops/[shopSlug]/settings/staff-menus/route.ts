import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 직원별 메뉴 매핑 조회
export async function GET(req: NextRequest, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const staffMembers = await prisma.shopMember.findMany({
    where: { shopId: shop.id, role: { in: ['OWNER', 'STAFF'] } },
    select: {
      id: true,
      isActive: true,
      user: { select: { name: true } },
      staffMenus: { select: { menuId: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const menus = await prisma.menu.findMany({
    where: { shopId: shop.id, isActive: true },
    select: { id: true, name: true, categoryId: true, price: true, duration: true },
    orderBy: { name: 'asc' },
  });

  const categories = await prisma.category.findMany({
    where: { shopId: shop.id },
    select: { id: true, name: true },
    orderBy: { sortOrder: 'asc' },
  });

  return NextResponse.json({
    staff: staffMembers.map(s => ({
      id: s.id,
      name: s.user.name,
      isActive: s.isActive,
      menuIds: s.staffMenus.map(sm => sm.menuId),
    })),
    menus,
    categories,
  });
}

// 직원별 메뉴 매핑 저장
export async function PUT(req: NextRequest, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const { staffId, menuIds } = body as { staffId: string; menuIds: string[] };

  if (!staffId || !Array.isArray(menuIds)) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  // 기존 매핑 삭제 후 새로 생성
  await prisma.staffMenu.deleteMany({ where: { staffId } });

  if (menuIds.length > 0) {
    await prisma.staffMenu.createMany({
      data: menuIds.map(menuId => ({ staffId, menuId })),
    });
  }

  return NextResponse.json({ success: true });
}
