const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // 매장 조회
  const shops = await p.shop.findMany({ select: { id: true, slug: true, name: true } });
  console.log('매장:', JSON.stringify(shops, null, 2));

  // 멤버 조회 (customer, staff)
  const shop = shops[0];
  if (!shop) { console.log('매장 없음'); return; }

  const members = await p.shopMember.findMany({
    where: { shopId: shop.id },
    select: { id: true, role: true, user: { select: { name: true } } },
  });
  console.log('멤버:', JSON.stringify(members, null, 2));

  const menus = await p.menu.findMany({
    where: { shopId: shop.id },
    select: { id: true, name: true, duration: true },
  });
  console.log('메뉴:', JSON.stringify(menus, null, 2));
}

main().catch(console.error).finally(() => p.$disconnect());
