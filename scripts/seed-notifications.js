const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const shop = await p.shop.findUnique({ where: { slug: 'glow-skin' } });
  const now = new Date();
  const samples = [
    { type: 'RESERVATION', title: '\uC2E0\uADDC \uC608\uC57D', content: '\uAE40\uC218\uC9C4\uB2D8\uC774 9/10 14:00 \uC5BC\uAD74 \uAD00\uB9AC\uB97C \uC608\uC57D\uD588\uC2B5\uB2C8\uB2E4.', mins: 5 },
    { type: 'PAYMENT', title: '\uACB0\uC81C \uC644\uB8CC', content: '\uBC15\uC601\uD76C\uB2D8 \uACB0\uC81C 150,000\uC6D0 (\uCE74\uB4DC)', mins: 15 },
    { type: 'CUSTOMER', title: '\uC2E0\uADDC \uACE0\uAC1D \uB4F1\uB85D', content: '\uC774\uC9C0\uC5F0\uB2D8\uC774 \uC2E0\uADDC \uACE0\uAC1D\uC73C\uB85C \uB4F1\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4.', mins: 30 },
    { type: 'MEMBERSHIP', title: '\uB4F1\uAE09 \uC2B9\uAE09', content: '\uCD5C\uBBF8\uC601\uB2D8\uC774 \uC2E4\uBC84 \uB4F1\uAE09\uC73C\uB85C \uC2B9\uAE09\uB418\uC5C8\uC2B5\uB2C8\uB2E4.', mins: 60 },
    { type: 'RESERVATION', title: '\uC608\uC57D \uCDE8\uC18C', content: '\uC815\uD604\uC8FC\uB2D8\uC774 9/9 11:00 \uC608\uC57D\uC744 \uCDE8\uC18C\uD588\uC2B5\uB2C8\uB2E4.', mins: 90 },
    { type: 'SYSTEM', title: '\uC7AC\uACE0 \uBD80\uC871 \uC54C\uB9BC', content: '\uD788\uC54C\uB8E8\uB860\uC0B0 \uC138\uB7FC \uC7AC\uACE0\uAC00 3\uAC1C \uBBF8\uB9CC\uC785\uB2C8\uB2E4.', mins: 120 },
    { type: 'PAYMENT', title: '\uACB0\uC81C \uC644\uB8CC', content: '\uAE40\uBBF8\uC815\uB2D8 \uACB0\uC81C 89,000\uC6D0 (\uD604\uAE08)', mins: 180 },
    { type: 'REMINDER', title: '\uC608\uC57D \uB9AC\uB9C8\uC778\uB354', content: '\uB0B4\uC77C \uC608\uC57D 3\uAC74\uC774 \uC788\uC2B5\uB2C8\uB2E4. (10:00, 14:00, 16:00)', mins: 240, readAt: now },
    { type: 'CAMPAIGN', title: '\uCE84\uD398\uC778 \uBC1C\uC1A1 \uC644\uB8CC', content: '\uCD94\uC11D \uD560\uC778 \uC774\uBCA4\uD2B8 \uBB38\uC790 32\uAC74 \uBC1C\uC1A1 \uC644\uB8CC', mins: 300, readAt: now },
    { type: 'CUSTOMER', title: '\uACE0\uAC1D \uC0DD\uC77C', content: '\uC624\uB298 \uC0DD\uC77C\uC778 \uACE0\uAC1D: \uBC15\uC601\uD76C\uB2D8, \uAE40\uC218\uC9C4\uB2D8', mins: 360, readAt: now },
  ];
  for (const s of samples) {
    const createdAt = new Date(now.getTime() - s.mins * 60000);
    await p.notificationLog.create({
      data: {
        shopId: shop.id,
        channel: 'IN_APP',
        type: s.type,
        title: s.title,
        content: s.content,
        status: 'SENT',
        readAt: s.readAt || null,
        createdAt,
      },
    });
  }
  console.log('10 notification samples created');
  await p.$disconnect();
})();
