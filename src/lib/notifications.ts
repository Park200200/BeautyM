import prisma from '@/lib/prisma';
import { sendEmail, reservationEmailHtml, paymentEmailHtml, couponEmailHtml } from '@/lib/email';

// 알림 생성 헬퍼
export async function createNotification({
  shopId,
  recipientId,
  reservationId,
  type,
  title,
  content,
  channel = 'IN_APP',
}: {
  shopId: string;
  recipientId?: string;
  reservationId?: string;
  type: string;
  title: string;
  content: string;
  channel?: string;
}) {
  try {
    await prisma.notificationLog.create({
      data: {
        shopId,
        recipientId: recipientId || null,
        reservationId: reservationId || null,
        channel,
        type,
        title,
        content,
        status: 'SENT',
        sentAt: new Date(),
      },
    });
  } catch (e) {
    console.error('알림 생성 실패:', e);
  }
}

// 고객 이메일 조회 헬퍼
async function getCustomerEmail(memberId: string): Promise<string | null> {
  try {
    const member = await prisma.shopMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    });
    return member?.user?.email || null;
  } catch { return null; }
}

// 매장명 조회 헬퍼
async function getShopName(shopId: string): Promise<string> {
  try {
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    return shop?.name || '뷰티 매장';
  } catch { return '뷰티 매장'; }
}

// 예약 확인 알림
export async function notifyReservationCreated(shopId: string, reservation: any) {
  const customerName = reservation.customer?.user?.name || '고객';
  const menuName = reservation.menu?.name || '시술';
  const startTime = new Date(reservation.startTime);
  const dateStr = startTime.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
  const timeStr = startTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });

  // 인앱 알림
  await createNotification({
    shopId,
    recipientId: reservation.customerId,
    reservationId: reservation.id,
    type: 'RESERVATION',
    title: '예약이 확인되었습니다',
    content: `${customerName}님의 ${menuName} 예약이 ${dateStr} ${timeStr}에 확정되었습니다.`,
  });

  // 이메일 알림
  if (reservation.customerId) {
    const email = await getCustomerEmail(reservation.customerId);
    const shopName = await getShopName(shopId);
    if (email) {
      const sent = await sendEmail({
        to: email,
        subject: `[${shopName}] 예약이 확인되었습니다`,
        html: reservationEmailHtml(customerName, menuName, dateStr, timeStr, shopName),
      });
      if (sent) {
        await createNotification({
          shopId, recipientId: reservation.customerId, reservationId: reservation.id,
          type: 'RESERVATION', title: '예약 확인 이메일 발송', content: `${email}로 예약 확인 이메일이 발송되었습니다.`, channel: 'EMAIL',
        });
      }
    }
  }
}

// 결제 완료 알림
export async function notifyPaymentCompleted(shopId: string, payment: any, customerName: string, menuName: string) {
  const amount = payment?.amount || 0;
  const customerId = payment?.reservation?.customerId;

  // 인앱 알림
  await createNotification({
    shopId,
    recipientId: customerId,
    reservationId: payment?.reservationId,
    type: 'PAYMENT',
    title: '결제가 완료되었습니다',
    content: `${customerName}님의 ${menuName} 결제 ${amount.toLocaleString()}원이 완료되었습니다.`,
  });

  // 이메일 알림
  if (customerId) {
    const email = await getCustomerEmail(customerId);
    const shopName = await getShopName(shopId);
    if (email) {
      const sent = await sendEmail({
        to: email,
        subject: `[${shopName}] 결제가 완료되었습니다`,
        html: paymentEmailHtml(customerName, menuName, amount, shopName),
      });
      if (sent) {
        await createNotification({
          shopId, recipientId: customerId, reservationId: payment?.reservationId,
          type: 'PAYMENT', title: '결제 완료 이메일 발송', content: `${email}로 결제 완료 이메일이 발송되었습니다.`, channel: 'EMAIL',
        });
      }
    }
  }
}

// 쿠폰 발급 알림
export async function notifyCouponIssued(shopId: string, memberId: string, customerName: string, couponName: string) {
  // 인앱 알림
  await createNotification({
    shopId,
    recipientId: memberId,
    type: 'MEMBERSHIP',
    title: '새 쿠폰이 발급되었습니다',
    content: `${customerName}님께 "${couponName}" 쿠폰이 발급되었습니다. 멤버십에서 확인해보세요!`,
  });

  // 이메일 알림
  const email = await getCustomerEmail(memberId);
  const shopName = await getShopName(shopId);
  if (email) {
    const sent = await sendEmail({
      to: email,
      subject: `[${shopName}] 새 쿠폰이 발급되었습니다`,
      html: couponEmailHtml(customerName, couponName, shopName),
    });
    if (sent) {
      await createNotification({
        shopId, recipientId: memberId,
        type: 'MEMBERSHIP', title: '쿠폰 발급 이메일 발송', content: `${email}로 쿠폰 발급 이메일이 발송되었습니다.`, channel: 'EMAIL',
      });
    }
  }
}

// 포인트 적립 알림
export async function notifyPointEarned(shopId: string, memberId: string, customerName: string, points: number) {
  await createNotification({
    shopId,
    recipientId: memberId,
    type: 'MEMBERSHIP',
    title: '포인트가 적립되었습니다',
    content: `${customerName}님께 ${points.toLocaleString()}P가 적립되었습니다.`,
  });
}
