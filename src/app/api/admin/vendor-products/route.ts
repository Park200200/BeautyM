import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.vendorProduct.findMany({
      include: { vendor: { select: { id: true, name: true, category: true } } },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json(products);
  } catch (e) {
    return NextResponse.json({ error: '조회 실패' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const product = await prisma.vendorProduct.create({
      data: {
        vendorId: body.vendorId,
        name: body.name,
        description: body.description || null,
        detailDesc: body.detailDesc || null,
        category: body.category || null,
        brand: body.brand || null,
        spec: body.spec || null,
        price: parseFloat(body.price) || 0,
        discountPrice: body.discountPrice ? parseFloat(body.discountPrice) : null,
        unit: body.unit || null,
        sku: body.sku || null,
        stock: parseInt(body.stock) || 0,
        imageUrl: body.imageUrl || null,
        tags: body.tags || null,
        displayOrder: parseInt(body.displayOrder) || 0,
        isDisplayed: body.isDisplayed !== false,
      },
      include: { vendor: { select: { id: true, name: true, category: true } } },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: '등록 실패' }, { status: 500 });
  }
}
