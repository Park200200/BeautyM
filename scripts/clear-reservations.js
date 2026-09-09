const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const result = await p.reservation.deleteMany();
  console.log('예약 삭제 완료:', result.count, '건');
}

main().catch(console.error).finally(() => p.$disconnect());
