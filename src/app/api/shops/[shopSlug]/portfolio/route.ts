import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const items = await prisma.portfolio.findMany({
    where: { shopId: shop.id },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  const categories = [...new Set(items.map(i => i.category).filter(Boolean))];
  return NextResponse.json({ items, categories });
}

export async function POST(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  try {
    const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const body = await req.json();
    const { title, category, description, beforeImage, afterImage, staffName, isPublic } = body;
    if (!title) return NextResponse.json({ error: '\uC81C\uBAA9\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694' }, { status: 400 });

    const item = await prisma.portfolio.create({
      data: { shopId: shop.id, title, category: category || null, description: description || null, beforeImage: beforeImage || null, afterImage: afterImage || null, staffName: staffName || null, isPublic: isPublic ?? true },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Portfolio create error:', error);
    return NextResponse.json({ error: '\uC0DD\uC131 \uC2E4\uD328' }, { status: 500 });
  }
}
