import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// 공개 API: 매장 기본 정보 + 카테고리 + 메뉴 목록
export async function GET(req: NextRequest, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;

  const shop = await prisma.shop.findUnique({
    where: { slug: shopSlug },
    select: {
      id: true, name: true, slug: true, description: true, logoUrl: true,
      phone: true, address: true, businessHours: true,
    },
  });

  if (!shop || !shop) {
    return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
  }

  // 활성 + 공개 메뉴
  const menus = await prisma.menu.findMany({
    where: { shopId: shop.id, isActive: true, isPublic: true },
    select: {
      id: true, name: true, description: true, price: true, duration: true,
      sessions: true, sessionInterval: true, photos: true, categoryId: true,
      menuTreatments: {
        select: { treatment: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // 카테고리
  const categories = await prisma.category.findMany({
    where: { shopId: shop.id },
    select: { id: true, name: true, sortOrder: true },
    orderBy: { sortOrder: 'asc' },
  });

  // 포트폴리오 (공개)
  const portfolios = await prisma.portfolio.findMany({
    where: { shopId: shop.id, isPublic: true },
    select: { id: true, title: true, beforeImage: true, afterImage: true, description: true },
    take: 6,
    orderBy: { createdAt: 'desc' },
  });

  // 리뷰 (공개)
  const reviews = await prisma.review.findMany({
    where: { shopId: shop.id, isPublic: true },
    select: { id: true, rating: true, content: true, createdAt: true, customer: { select: { user: { select: { name: true } } } } },
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  // 직원 목록 (공개)
  const staff = await prisma.shopMember.findMany({
    where: { shopId: shop.id, role: { in: ['OWNER', 'STAFF'] }, isActive: true },
    select: { id: true, specialties: true, jobTitle: true, user: { select: { name: true, profileImage: true } } },
  });

  return NextResponse.json({ shop, menus, categories, portfolios, reviews, staff });
}
