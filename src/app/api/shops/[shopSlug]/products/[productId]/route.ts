import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: Promise<{ shopSlug: string; productId: string }> }) {
  const { shopSlug, productId } = await params;
  try {
    const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.shopId !== shop.id) return NextResponse.json({ error: '\uC81C\uD488\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4' }, { status: 404 });

    const body = await req.json();
    const { name, category, stock, minStock, costPrice, sellPrice, stockDelta, supplier } = body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (category !== undefined) data.category = category || null;
    if (supplier !== undefined) data.supplier = supplier || null;
    if (stock !== undefined) data.stock = stock;
    if (minStock !== undefined) data.minStock = minStock;
    if (costPrice !== undefined) data.costPrice = costPrice;
    if (sellPrice !== undefined) data.sellPrice = sellPrice;
    if (stockDelta !== undefined) data.stock = { increment: stockDelta };

    const updated = await prisma.product.update({ where: { id: productId }, data });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Product update error:', error);
    return NextResponse.json({ error: '\uC218\uC815 \uC2E4\uD328' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ shopSlug: string; productId: string }> }) {
  const { shopSlug, productId } = await params;
  try {
    const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.shopId !== shop.id) return NextResponse.json({ error: '\uC81C\uD488\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4' }, { status: 404 });

    await prisma.product.delete({ where: { id: productId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Product delete error:', error);
    return NextResponse.json({ error: '\uC0AD\uC81C \uC2E4\uD328' }, { status: 500 });
  }
}
