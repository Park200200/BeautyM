const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const shop = await p.shop.findUnique({ where: { slug: 'glow-skin' } });
  const customers = await p.shopMember.findMany({
    where: { shopId: shop.id, role: 'CUSTOMER' },
    include: { user: true },
    take: 4,
  });

  const now = Date.now();
  const min = 60000;
  const hour = 3600000;

  const samples = [
    { type: 'RESERVATION', channel: 'SMS', title: '예약 확인 문자 발송', content: `010-6381-2233으로 예약 확인 문자가 발송되었습니다.`, ago: 10 * min },
    { type: 'RESERVATION', channel: 'KAKAO', title: '예약 확인 카카오톡 발송', content: `${customers[0]?.user?.name || '박정훈'}님께 카카오 알림톡이 발송되었습니다.`, ago: 10 * min },
    { type: 'PAYMENT', channel: 'SMS', title: '결제 완료 문자 발송', content: `010-5555-6666으로 결제 완료 안내 문자가 발송되었습니다.`, ago: 45 * min },
    { type: 'PAYMENT', channel: 'KAKAO', title: '결제 완료 카카오톡 발송', content: `${customers[1]?.user?.name || '정다운'}님께 결제 완료 카카오 알림톡이 발송되었습니다.`, ago: 45 * min },
    { type: 'MEMBERSHIP', channel: 'KAKAO', title: '쿠폰 발급 카카오톡 발송', content: `${customers[2]?.user?.name || '최서연'}님께 "재방문 20% 할인" 쿠폰 카카오 알림톡이 발송되었습니다.`, ago: 2 * hour },
    { type: 'REMINDER', channel: 'SMS', title: '예약 리마인드 문자 발송', content: `010-1111-2222로 내일 예약 리마인드 문자가 발송되었습니다.`, ago: 4 * hour },
  ];

  // 대표(OWNER) memberId 조회
  const owner = await p.shopMember.findFirst({ where: { shopId: shop.id, role: 'OWNER' } });

  for (const s of samples) {
    await p.notificationLog.create({
      data: {
        shopId: shop.id,
        recipientId: owner?.id || null,
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
  console.log(`✅ 문자/카톡 샘플 ${samples.length}개 생성 완료`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
