import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: Promise<{ shopSlug: string; portfolioId: string }> }) {
  const { shopSlug, portfolioId } = await params;
  try {
    const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const body = await req.json();
    const { title, category, description, beforeImage, afterImage, staffName, isPublic } = body;

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (category !== undefined) data.category = category || null;
    if (description !== undefined) data.description = description || null;
    if (beforeImage !== undefined) data.beforeImage = beforeImage || null;
    if (afterImage !== undefined) data.afterImage = afterImage || null;
    if (staffName !== undefined) data.staffName = staffName || null;
    if (isPublic !== undefined) data.isPublic = isPublic;

    const item = await prisma.portfolio.update({ where: { id: portfolioId }, data });
    return NextResponse.json(item);
  } catch (error) {
    console.error('Portfolio update error:', error);
    return NextResponse.json({ error: '\uC218\uC815 \uC2E4\uD328' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ shopSlug: string; portfolioId: string }> }) {
  const { portfolioId } = await params;
  try {
    await prisma.portfolio.delete({ where: { id: portfolioId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '\uC0AD\uC81C \uC2E4\uD328' }, { status: 500 });
  }
}
