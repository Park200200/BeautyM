const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const shop = await p.shop.findUnique({ where: { slug: 'glow-skin' } });
  if (!shop) { console.log('매장 없음'); return; }

  const customers = await p.shopMember.findMany({
    where: { shopId: shop.id, role: 'CUSTOMER' },
    include: { user: true },
    take: 4,
  });

  const now = Date.now();
  const min = 60000;
  const hour = 3600000;

  const samples = [
    { type: 'RESERVATION', channel: 'IN_APP', title: '예약이 확인되었습니다', content: `${customers[0]?.user?.name || '박정훈'}님의 기본 피부관리 예약이 9월 11일 (목) 오후 2:00에 확정되었습니다.`, ago: 5 * min },
    { type: 'RESERVATION', channel: 'EMAIL', title: '예약 확인 이메일 발송', content: `${customers[0]?.user?.email || 'park@email.com'}로 예약 확인 이메일이 발송되었습니다.`, ago: 5 * min },
    { type: 'PAYMENT', channel: 'IN_APP', title: '결제가 완료되었습니다', content: `${customers[1]?.user?.name || '정다운'}님의 프리미엄 피부관리 결제 150,000원이 완료되었습니다.`, ago: 30 * min },
    { type: 'PAYMENT', channel: 'EMAIL', title: '결제 완료 이메일 발송', content: `${customers[1]?.user?.email || 'jung@email.com'}로 결제 완료 이메일이 발송되었습니다.`, ago: 30 * min },
    { type: 'MEMBERSHIP', channel: 'IN_APP', title: '새 쿠폰이 발급되었습니다', content: `${customers[2]?.user?.name || '최서연'}님께 "첫 방문 10% 할인" 쿠폰이 발급되었습니다.`, ago: 1 * hour },
    { type: 'MEMBERSHIP', channel: 'EMAIL', title: '쿠폰 발급 이메일 발송', content: `${customers[2]?.user?.email || 'choi@email.com'}로 쿠폰 발급 이메일이 발송되었습니다.`, ago: 1 * hour },
    { type: 'MEMBERSHIP', channel: 'IN_APP', title: '포인트가 적립되었습니다', content: `${customers[0]?.user?.name || '박정훈'}님께 2,400P가 적립되었습니다.`, ago: 2 * hour },
    { type: 'RESERVATION', channel: 'IN_APP', title: '예약이 확인되었습니다', content: `${customers[3]?.user?.name || '박지현'}님의 안티에이징 관리 예약이 9월 12일 (금) 오전 10:30에 확정되었습니다.`, ago: 3 * hour },
    { type: 'REMINDER', channel: 'IN_APP', title: '내일 예약이 있습니다', content: `${customers[1]?.user?.name || '정다운'}님의 내일 오후 3:00 여드름 관리 예약을 확인해주세요.`, ago: 5 * hour },
    { type: 'SYSTEM', channel: 'IN_APP', title: '시스템 업데이트 완료', content: '알림 시스템이 업데이트되었습니다. 이메일/SMS/카카오톡 발송 기능이 추가되었습니다.', ago: 8 * hour },
  ];

  for (const s of samples) {
    await p.notificationLog.create({
      data: {
        shopId: shop.id,
        recipientId: customers[0]?.id || null,
        channel: s.channel,
        type: s.type,
        title: s.title,
        content: s.content,
        status: 'SENT',
        sentAt: new Date(now - s.ago),
        createdAt: new Date(now - s.ago),
      },
    });
  }
  console.log(`✅ 샘플 알림 ${samples.length}개 생성 완료`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
