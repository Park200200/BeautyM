const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const s = await p.shop.findUnique({ where: { slug: 'glow-skin' } });
  const total = await p.notificationLog.count({ where: { shopId: s.id } });
  const unread = await p.notificationLog.count({ where: { shopId: s.id, readAt: null } });
  const read = total - unread;
  console.log(`총: ${total}, 안읽음: ${unread}, 읽음: ${read}`);
  const list = await p.notificationLog.findMany({ where: { shopId: s.id }, orderBy: { createdAt: 'desc' }, select: { title: true, channel: true, readAt: true } });
  list.forEach((n, i) => console.log(`  ${i + 1}. [${n.channel}] ${n.title} - ${n.readAt ? '읽음' : '안읽음'}`));
  await p.$disconnect();
})();
