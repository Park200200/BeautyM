import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

// 로그인 사용자의 shopMember ID 조회
async function getMyMemberId(shopId: string): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('beautym-session');
    if (!session?.value) return null;
    const parsed = JSON.parse(session.value);
    const member = await prisma.shopMember.findFirst({
      where: { shopId, userId: parsed.userId },
    });
    return member?.id || null;
  } catch { return null; }
}

export async function GET(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const myMemberId = await getMyMemberId(shop.id);

  // 관리자(OWNER/STAFF): 본인 대상 알림 + 수신자 없는 전체 알림
  // recipientId가 null인 알림 = 매장 전체 공지 (시스템 알림 등)
  const whereFilter = myMemberId
    ? { shopId: shop.id, OR: [{ recipientId: myMemberId }, { recipientId: null }] }
    : { shopId: shop.id };

  const notifications = await prisma.notificationLog.findMany({
    where: whereFilter,
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { member: { include: { user: true } } },
  });

  const unreadCount = await prisma.notificationLog.count({
    where: { ...whereFilter, readAt: null },
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
        title: title || '알림',
        content: content || '',
        status: 'SENT',
      },
    });
    return NextResponse.json(noti, { status: 201 });
  } catch (error) {
    console.error('Notification create error:', error);
    return NextResponse.json({ error: '생성 실패' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  try {
    const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const myMemberId = await getMyMemberId(shop.id);
    const body = await req.json();
    const { action, notificationId } = body;

    // 모두 읽음 - 본인 관련 알림만
    if (action === 'readAll') {
      const whereFilter = myMemberId
        ? { shopId: shop.id, readAt: null, OR: [{ recipientId: myMemberId }, { recipientId: null }] }
        : { shopId: shop.id, readAt: null };
      await prisma.notificationLog.updateMany({
        where: whereFilter,
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
    return NextResponse.json({ error: '처리 실패' }, { status: 500 });
  }
}
