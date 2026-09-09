const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const shopId = 'cmtqry7j9001mgh64fj0r0e75'; // 글로우 스킨케어

  const customers = [
    'cmtqry7t20038gh642pyyryho', // 박지현
    'cmtqry7te003bgh64f7v7zi3w', // 최서연
    'cmtqry7tn003egh64ocpvdbgs', // 정다은
  ];
  const staff = 'cmtqry7oe002jgh64xrmrz3cv'; // 이수진
  const menus = [
    { id: 'cmtqry7u9003mgh64zw8rn2zw', dur: 60 },  // 기본 피부관리
    { id: 'cmtqry7ud003ogh640074ypcn', dur: 90 },  // 프리미엄 피부관리
    { id: 'cmtqry7ui003qgh64fsoaxcy1', dur: 120 }, // 안티에이징
    { id: 'cmtqry7um003sgh64qb4ukq9b', dur: 90 },  // 여드름 관리
    { id: 'cmtqry7uq003ugh64elyjwveq', dur: 30 },  // 브라질리언 왁싱
    { id: 'cmtqry7uu003wgh64n08n3nyi', dur: 45 },  // 다리 왁싱
  ];

  const reservations = [];

  // 9월 1일 ~ 30일 예약 생성
  const schedule = [
    // [day, [[startHour, menuIdx, custIdx], ...]]
    [1, [[10, 0, 0], [11, 4, 1], [14, 1, 2]]],
    [2, [[9, 2, 0], [11, 0, 1], [13, 3, 2], [15, 5, 0]]],
    [3, [[10, 1, 1], [13, 0, 2]]],
    [4, [[9, 0, 0], [10, 4, 1], [11, 1, 2], [14, 3, 0], [16, 0, 1]]],
    [5, [[10, 2, 2], [13, 1, 0], [15, 5, 1]]],
    [6, [[9, 0, 0], [10, 1, 1], [12, 3, 2], [14, 0, 0], [16, 4, 1], [17, 5, 2]]],
    [7, []],  // 일요일 휴무
    [8, [[10, 0, 0], [11, 1, 1], [14, 2, 2], [17, 4, 0]]],
    [9, [[9, 3, 1], [11, 0, 2], [13, 1, 0], [15, 0, 1], [16, 5, 2]]],
    [10, [[10, 0, 0], [14, 1, 1]]],
    [11, [[9, 2, 2], [11, 4, 0], [12, 0, 1], [14, 3, 2], [16, 1, 0], [18, 0, 1]]],
    [12, [[10, 1, 0], [12, 0, 2], [14, 5, 1]]],
    [13, [[9, 0, 0], [10, 3, 1], [12, 1, 2], [14, 0, 0], [15, 4, 1]]],
    [14, []],  // 일요일
    [15, [[10, 2, 0], [13, 0, 1], [15, 1, 2], [17, 5, 0]]],
    [16, [[9, 0, 0], [10, 1, 1], [11, 4, 2], [13, 3, 0], [15, 0, 1], [16, 5, 2], [18, 0, 0]]],
    [17, [[10, 0, 1], [14, 1, 2]]],
    [18, [[9, 2, 0], [11, 0, 1], [13, 3, 2], [15, 1, 0]]],
    [19, [[10, 0, 0], [11, 5, 1], [13, 0, 2]]],
    [20, [[9, 1, 0], [11, 0, 1], [13, 4, 2], [14, 3, 0], [16, 0, 1], [17, 5, 2]]],
    [21, []],  // 일요일
    [22, [[10, 0, 0], [11, 1, 1], [14, 0, 2], [16, 4, 0]]],
    [23, [[9, 2, 1], [11, 3, 2], [13, 0, 0], [14, 1, 1], [16, 0, 2]]],
    [24, [[10, 0, 0], [14, 5, 1]]],
    [25, [[9, 1, 2], [11, 0, 0], [13, 3, 1], [15, 0, 2], [17, 4, 0]]],
    [26, [[10, 0, 1], [12, 1, 2], [14, 0, 0]]],
    [27, [[9, 2, 0], [11, 0, 1], [13, 1, 2], [15, 3, 0], [16, 5, 1], [18, 0, 2]]],
    [28, []],  // 일요일
    [29, [[10, 0, 0], [11, 1, 1], [14, 3, 2]]],
    [30, [[9, 0, 0], [10, 4, 1], [11, 1, 2], [13, 0, 0], [15, 3, 1]]],
  ];

  const statuses = ['CONFIRMED', 'CONFIRMED', 'CONFIRMED', 'COMPLETED', 'PENDING'];

  for (const [day, slots] of schedule) {
    for (const [hour, menuIdx, custIdx] of slots) {
      const menu = menus[menuIdx];
      const start = new Date(2026, 8, day, hour, 0, 0); // 9월
      const end = new Date(start.getTime() + menu.dur * 60000);
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      reservations.push({
        shopId,
        customerId: customers[custIdx],
        staffId: staff,
        menuId: menu.id,
        startTime: start,
        endTime: end,
        status,
        source: Math.random() > 0.3 ? 'ADMIN' : 'WEBSITE',
      });
    }
  }

  const result = await p.reservation.createMany({ data: reservations });
  console.log('샘플 예약 생성 완료:', result.count, '건');
}

main().catch(console.error).finally(() => p.$disconnect());
