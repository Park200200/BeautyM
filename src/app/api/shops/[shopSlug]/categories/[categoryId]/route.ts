import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ shopSlug: string; categoryId: string }> }
) {
  try {
    const { shopSlug, categoryId } = await params;
    const body = await request.json();
    const { name, sortOrder } = body;

    const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (sortOrder !== undefined) data.sortOrder = sortOrder;

    const category = await prisma.category.update({
      where: { id: categoryId },
      data,
    });

    return NextResponse.json(category);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Category name already exists' }, { status: 409 });
    }
    console.error('Failed to update category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ shopSlug: string; categoryId: string }> }
) {
  try {
    const { shopSlug, categoryId } = await params;

    const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    // 소속 메뉴의 categoryId를 null로
    await prisma.menu.updateMany({
      where: { categoryId },
      data: { categoryId: null },
    });

    await prisma.category.delete({ where: { id: categoryId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
