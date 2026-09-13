import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopSlug: string; customerId: string }> }
) {
  const { shopSlug, customerId } = await params;

  try {
    const shop = await prisma.shop.findUnique({ where: { slug: shopSlug }, select: { id: true } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const logs = await prisma.notificationLog.findMany({
      where: {
        shopId: shop.id,
        recipientId: customerId,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Failed to fetch notification logs:', error);
    return NextResponse.json([], { status: 200 });
  }
}
