const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const shop = await prisma.shop.findUnique({ where: { slug: 'glow-skin' } });
  if (!shop) { console.log('Shop not found'); return; }

  const products = [
    { name: '\uC544\uC774\uD06C\uB9BC \uC218\uBD84 \uD06C\uB9BC', category: '\uD654\uC7A5\uD488', supplier: '\uCF54\uC2A4\uC54C\uC5D1\uC2A4', stock: 25, minStock: 5, costPrice: 15000, sellPrice: 35000 },
    { name: '\uBE44\uD0C0\uBBFC C \uC138\uB7FC', category: '\uD654\uC7A5\uD488', supplier: '\uB354\uB9C8\uCF54\uC2A4', stock: 18, minStock: 5, costPrice: 22000, sellPrice: 48000 },
    { name: '\uC120\uD06C\uB9BC SPF50+', category: '\uD654\uC7A5\uD488', supplier: '\uCF54\uC2A4\uC54C\uC5D1\uC2A4', stock: 30, minStock: 10, costPrice: 8000, sellPrice: 22000 },
    { name: '\uD074\uB80C\uC9D5 \uD3FC', category: '\uD654\uC7A5\uD488', supplier: '\uBDF0\uD2F0\uB9C8\uD2B8', stock: 12, minStock: 3, costPrice: 5000, sellPrice: 15000 },
    { name: '\uD544\uB9C1 \uB9C8\uC2A4\uD06C \uD329 (10\uB9E4)', category: '\uC18C\uBAA8\uD488', supplier: '\uBDF0\uD2F0\uB9C8\uD2B8', stock: 8, minStock: 10, costPrice: 12000, sellPrice: 25000 },
    { name: '\uC77C\uD68C\uC6A9 \uC2A4\uD3FC\uC9C0 (100\uB9E4)', category: '\uC18C\uBAA8\uD488', supplier: '\uBA54\uB514\uCF00\uC5B4', stock: 45, minStock: 20, costPrice: 3000, sellPrice: 0 },
    { name: '\uC5D0\uC13C\uC15C \uC624\uC77C', category: '\uC2DC\uC220\uC7AC\uB8CC', supplier: '\uC544\uB85C\uB9C8\uC6D0', stock: 15, minStock: 5, costPrice: 18000, sellPrice: 0 },
    { name: '\uAC08\uBC14\uB2C9 \uC804\uB958 \uC824', category: '\uC2DC\uC220\uC7AC\uB8CC', supplier: '\uB354\uB9C8\uCF54\uC2A4', stock: 3, minStock: 5, costPrice: 28000, sellPrice: 0 },
    { name: '\uC77C\uD68C\uC6A9 \uBA74\uBD09 \uD0C0\uC62C (200\uB9E4)', category: '\uC18C\uBAA8\uD488', supplier: '\uBA54\uB514\uCF00\uC5B4', stock: 60, minStock: 20, costPrice: 8000, sellPrice: 0 },
    { name: '\uB808\uD2F0\uB180 \uD06C\uB9BC', category: '\uD654\uC7A5\uD488', supplier: '\uCF54\uC2A4\uC54C\uC5D1\uC2A4', stock: 2, minStock: 5, costPrice: 35000, sellPrice: 68000 },
  ];

  for (const p of products) {
    await prisma.product.create({
      data: { shopId: shop.id, ...p },
    });
  }

  console.log(`${products.length}개 샘플 제품 등록 완료`);
}

main()
  .catch(console.error)
  .finally(() => prisma[String.fromCharCode(36) + 'disconnect']());
