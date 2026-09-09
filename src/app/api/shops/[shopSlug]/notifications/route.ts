import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const notifications = await prisma.notificationLog.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { member: { include: { user: true } } },
  });

  const unreadCount = await prisma.notificationLog.count({
    where: { shopId: shop.id, readAt: null },
  });

  return NextResponse.json({ notifications, unreadCount });
}

export async function POST(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  try {
    const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const body = await req.json();
    const { type, title, content, recipientId } = body;

    const noti = await prisma.notificationLog.create({
      data: {
        shopId: shop.id,
        recipientId: recipientId || null,
        channel: 'IN_APP',
        type: type || 'SYSTEM',
        title: title || '\uC54C\uB9BC',
        content: content || '',
        status: 'SENT',
      },
    });
    return NextResponse.json(noti, { status: 201 });
  } catch (error) {
    console.error('Notification create error:', error);
    return NextResponse.json({ error: '\uC0DD\uC131 \uC2E4\uD328' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  try {
    const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const body = await req.json();
    const { action, notificationId } = body;

    if (action === 'readAll') {
      await prisma.notificationLog.updateMany({
        where: { shopId: shop.id, readAt: null },
        data: { readAt: new Date() },
      });
    } else if (action === 'read' && notificationId) {
      await prisma.notificationLog.update({
        where: { id: notificationId },
        data: { readAt: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '\uCC98\uB9AC \uC2E4\uD328' }, { status: 500 });
  }
}
