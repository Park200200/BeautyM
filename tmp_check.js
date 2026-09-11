const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const shop = await p.shop.findFirst({ select: { businessHours: true } });
  const bh = JSON.parse(shop.businessHours);
  console.log('영업시간 설정:');
  Object.entries(bh).forEach(([k, v]) => console.log(`  ${k}:`, JSON.stringify(v)));
  
  // 9/11 요일 확인
  const d = new Date('2026-09-11T00:00:00+09:00');
  const days = ['일','월','화','수','목','금','토'];
  console.log(`\n9월 11일 = ${days[d.getDay()]}요일 (index: ${d.getDay()})`);
  
  await p.$disconnect();
})();
