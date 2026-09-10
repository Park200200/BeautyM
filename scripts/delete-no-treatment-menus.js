const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const shop = await p.shop.findUnique({ where: { slug: 'glow-skin' } });
  const menus = await p.menu.findMany({
    where: { shopId: shop.id },
    include: { menuTreatments: true, _count: { select: { reservations: true } } },
    orderBy: { createdAt: 'asc' },
  });

  // 이름별 그룹핑
  const byName = {};
  for (const m of menus) {
    if (!byName[m.name]) byName[m.name] = [];
    byName[m.name].push(m);
  }

  let deleted = 0;
  for (const [name, items] of Object.entries(byName)) {
    if (items.length <= 1) {
      // 중복 아님 - 시술 없으면 삭제
      if (items[0].menuTreatments.length === 0 && items[0]._count.reservations === 0) {
        await p.menu.delete({ where: { id: items[0].id } });
        console.log(`✅ 삭제: ${name} (시술 없음, 예약 없음)`);
        deleted++;
      }
      continue;
    }

    // 중복 있음 - 시술 있는 것 유지, 없는 것 삭제
    const withTreat = items.filter(m => m.menuTreatments.length > 0);
    const withoutTreat = items.filter(m => m.menuTreatments.length === 0);

    console.log(`\n📋 ${name}: ${items.length}개 중복 (시술있음: ${withTreat.length}, 없음: ${withoutTreat.length})`);

    for (const m of withoutTreat) {
      // 예약이 있으면 시술 있는 메뉴로 이관
      if (m._count.reservations > 0 && withTreat.length > 0) {
        await p.reservation.updateMany({
          where: { menuId: m.id },
          data: { menuId: withTreat[0].id },
        });
        console.log(`  ↪️ ${m._count.reservations}건 예약 이관 → ${withTreat[0].id}`);
      }
      // 결제 연결된 예약 확인
      const payments = await p.payment.findMany({
        where: { reservation: { menuId: m.id } },
      });
      
      await p.menu.delete({ where: { id: m.id } });
      console.log(`  ✅ 삭제: ${name} (ID: ${m.id.slice(0,8)}...)`);
      deleted++;
    }
  }

  console.log(`\n🎉 총 ${deleted}개 삭제 완료`);
  
  // 남은 메뉴 확인
  const remaining = await p.menu.findMany({
    where: { shopId: shop.id },
    include: { menuTreatments: true },
  });
  console.log(`\n남은 메뉴 ${remaining.length}개:`);
  for (const m of remaining) {
    console.log(`  ${m.name} - 시술 ${m.menuTreatments.length}개`);
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
