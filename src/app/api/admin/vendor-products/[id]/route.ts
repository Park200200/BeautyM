import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const product = await prisma.vendorProduct.update({
      where: { id },
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
        imageUrl: body.imageUrl || null,
        images: body.images || null,
        tags: body.tags || null,
        displayOrder: parseInt(body.displayOrder) || 0,
        isDisplayed: body.isDisplayed !== false,
      },
    });
    return NextResponse.json(product);
  } catch (e) {
    return NextResponse.json({ error: '수정 실패' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.vendorProduct.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: '삭제 실패' }, { status: 500 });
  }
}
