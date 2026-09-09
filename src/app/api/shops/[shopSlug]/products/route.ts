import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const url = new URL(req.url);
  const category = url.searchParams.get('category');
  const lowStock = url.searchParams.get('lowStock');

  const products = await prisma.product.findMany({
    where: {
      shopId: shop.id,
      ...(category ? { category } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  // 재고 부족 별도 필터 (SQLite에서 필드 비교 불가하여 앱단 처리)
  const filtered = lowStock === 'true'
    ? products.filter(p => p.stock <= p.minStock)
    : products;

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))] as string[];

  return NextResponse.json({ products: filtered, categories });
}

export async function POST(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  try {
    const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const body = await req.json();
    const { name, category, stock, minStock, costPrice, sellPrice, supplier } = body;

    if (!name) return NextResponse.json({ error: '\uC81C\uD488\uBA85\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694' }, { status: 400 });

    const product = await prisma.product.create({
      data: {
        shopId: shop.id,
        name,
        category: category || null,
        supplier: supplier || null,
        stock: stock || 0,
        minStock: minStock || 0,
        costPrice: costPrice || 0,
        sellPrice: sellPrice || 0,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Product create error:', error);
    return NextResponse.json({ error: '\uC81C\uD488 \uB4F1\uB85D \uC2E4\uD328' }, { status: 500 });
  }
}
