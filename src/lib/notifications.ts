import prisma from '@/lib/prisma';

// 알림 생성 헬퍼
export async function createNotification({
  shopId,
  recipientId,
  reservationId,
  type,
  title,
  content,
}: {
  shopId: string;
  recipientId?: string;
  reservationId?: string;
  type: string;
  title: string;
  content: string;
}) {
  try {
    await prisma.notificationLog.create({
      data: {
        shopId,
        recipientId: recipientId || null,
        reservationId: reservationId || null,
        channel: 'IN_APP',
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

// 예약 확인 알림
export async function notifyReservationCreated(shopId: string, reservation: any) {
  const customerName = reservation.customer?.user?.name || '고객';
  const menuName = reservation.menu?.name || '시술';
  const startTime = new Date(reservation.startTime);
  const dateStr = startTime.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
  const timeStr = startTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });

  await createNotification({
    shopId,
    recipientId: reservation.customerId,
    reservationId: reservation.id,
    type: 'RESERVATION',
    title: '예약이 확인되었습니다',
    content: `${customerName}님의 ${menuName} 예약이 ${dateStr} ${timeStr}에 확정되었습니다.`,
  });
}

// 결제 완료 알림
export async function notifyPaymentCompleted(shopId: string, payment: any, customerName: string, menuName: string) {
  const amount = payment.amount || 0;

  await createNotification({
    shopId,
    recipientId: payment.reservation?.customerId,
    reservationId: payment.reservationId,
    type: 'PAYMENT',
    title: '결제가 완료되었습니다',
    content: `${customerName}님의 ${menuName} 결제 ${amount.toLocaleString()}원이 완료되었습니다.`,
  });
}

// 쿠폰 발급 알림
export async function notifyCouponIssued(shopId: string, memberId: string, customerName: string, couponName: string) {
  await createNotification({
    shopId,
    recipientId: memberId,
    type: 'MEMBERSHIP',
    title: '새 쿠폰이 발급되었습니다',
    content: `${customerName}님께 "${couponName}" 쿠폰이 발급되었습니다. 멤버십에서 확인해보세요!`,
  });
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
