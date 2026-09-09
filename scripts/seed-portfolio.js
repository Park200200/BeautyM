const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const shop = await p.shop.findUnique({ where: { slug: 'glow-skin' } });
  const samples = [
    { title: '\uC5BC\uAD74 \uB9AC\uD504\uD305 \uC2DC\uC220', category: '\uD53C\uBD80\uAD00\uB9AC', description: '\uCF5C\uB77C\uACA0 \uC0DD\uC131\uC744 \uCD09\uC9C4\uD558\uC5EC \uD53C\uBD80 \uD0C4\uB825\uC744 \uD68C\uBCF5\uD558\uB294 \uC2DC\uC220\uC785\uB2C8\uB2E4.', staffName: '\uAE40\uC6D0\uC7A5', isPublic: true },
    { title: '\uBBF8\uBC31 \uAD00\uB9AC \uCF54\uC2A4', category: '\uD53C\uBD80\uAD00\uB9AC', description: '\uBE44\uD0C0\uBBFC C \uC774\uC628\uD1A0\uD3EC\uB808\uC2DC\uC2A4\uB85C \uD53C\uBD80 \uD1A4 \uAC1C\uC120', staffName: '\uBC15\uAD00\uB9AC\uC0AC', isPublic: true },
    { title: '\uC5EC\uB4DC\uB984 \uC9C4\uC815 \uAD00\uB9AC', category: '\uD53C\uBD80\uAD00\uB9AC', description: '\uC5EC\uB4DC\uB984 \uD2B8\uB7EC\uBE14\uC744 \uD574\uACB0\uD558\uB294 \uC9C4\uC815 \uC804\uBB38 \uAD00\uB9AC', staffName: '\uAE40\uC6D0\uC7A5', isPublic: true },
    { title: '\uB525 \uD074\uB80C\uC9D5 \uC2DC\uC220', category: '\uD53C\uBD80\uAD00\uB9AC', description: '\uBAA8\uACF5 \uC18D \uD53C\uC9C0\uC640 \uB178\uD3D0\uBB3C\uC744 \uC81C\uAC70\uD558\uB294 \uC2EC\uCE35 \uD074\uB80C\uC9D5', staffName: '\uBC15\uAD00\uB9AC\uC0AC', isPublic: true },
    { title: '\uBC14\uB514 \uC288\uB9BC \uB9C8\uC0AC\uC9C0', category: '\uBC14\uB514\uAD00\uB9AC', description: '\uC804\uC2E0 \uC21C\uD658\uC744 \uCD09\uC9C4\uD558\uB294 \uBC14\uB514 \uC288\uB9BC \uD504\uB85C\uADF8\uB7A8', staffName: '\uAE40\uC6D0\uC7A5', isPublic: true },
    { title: '\uBE0C\uB77C\uC9C8\uB9AC\uC548 \uC655\uC2A4', category: '\uC655\uC2F1', description: '\uC804\uBB38 \uC655\uC2A4\uB85C \uBD80\uB4DC\uB7EC\uC6B4 \uD53C\uBD80 \uC644\uC131', staffName: '\uBC15\uAD00\uB9AC\uC0AC', isPublic: true },
    { title: '\uC544\uCFE0\uC544\uD544 \uC218\uBD84\uAD00\uB9AC', category: '\uD53C\uBD80\uAD00\uB9AC', description: '\uAC74\uC870\uD55C \uD53C\uBD80\uC5D0 \uC218\uBD84\uC744 \uACF5\uAE09\uD558\uB294 \uC544\uCFE0\uC544\uD544 \uC2DC\uC220', staffName: '\uAE40\uC6D0\uC7A5', isPublic: true },
    { title: 'LED \uD1A0\uB2DD \uC2DC\uC220', category: '\uD1A0\uB2DD', description: 'LED \uAD11\uC120 \uCE58\uB8CC\uB85C \uD53C\uBD80 \uC7AC\uC0DD\uACFC \uD0C4\uB825 \uAC1C\uC120', staffName: '\uBC15\uAD00\uB9AC\uC0AC', isPublic: true },
    { title: '\uB4F1 \uAD00\uB9AC \uC2DC\uC220', category: '\uBC14\uB514\uAD00\uB9AC', description: '\uB4F1 \uBD80\uC704 \uC9D1\uC911 \uAD00\uB9AC\uB85C \uB9E4\uB044\uB7EC\uC6B4 \uB4F1\uB77C\uC778 \uC644\uC131', staffName: '\uAE40\uC6D0\uC7A5', isPublic: false },
    { title: '\uC545\uC560\uC720 \uD544\uB9C1', category: '\uD53C\uBD80\uAD00\uB9AC', description: '\uC545\uC560\uC720 \uD544\uB9C1\uC73C\uB85C \uAC01\uC9C8 \uC81C\uAC70 \uBC0F \uD53C\uBD80\uACB0 \uAC1C\uC120', staffName: '\uBC15\uAD00\uB9AC\uC0AC', isPublic: true },
  ];
  for (const s of samples) {
    await p.portfolio.create({ data: { shopId: shop.id, ...s } });
  }
  console.log('10 portfolio samples created');
  await p.$disconnect();
})();
