const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 기존 데이터 삭제
  await prisma.shopRegistration.deleteMany();

  await prisma.shopRegistration.createMany({
    data: [
      // 신규 대기 3건
      { shopName: '뷰티앤유 성수', ownerName: '한소희', phone: '010-1234-5678', email: 'han@beauty.com', address: '서울시 성동구 성수동 123', bizNumber: '123-45-67890', bizType: '서비스업', bizCategory: '피부관리', memo: 'Pro 플랜 희망합니다', status: 'PENDING' },
      { shopName: '스킨마스터 판교', ownerName: '윤서아', phone: '010-2345-6789', email: 'yoon@skinmaster.com', address: '경기도 성남시 분당구 판교역로 1', bizNumber: '234-56-78901', bizType: '서비스업', bizCategory: '에스테틱', memo: '직원 5명 규모입니다', salesPerson: '박민수', status: 'PENDING' },
      { shopName: '글래머 뷰티라운지', ownerName: '정예린', phone: '010-3456-7890', email: 'jung@glamour.kr', address: '서울시 강남구 신사동 456', bizNumber: '345-67-89012', bizType: '서비스업', bizCategory: '피부관리', taxEmail: 'tax@glamour.kr', salesPerson: '김지훈', status: 'PENDING' },
      // 거절 (영업자료) 2건
      { shopName: '에스테틱 블룸', ownerName: '김나연', phone: '010-5678-9012', email: 'kim@bloom.co.kr', address: '부산시 해운대구 우동 321', status: 'REJECTED', rejectionType: '지역제한', rejectedReason: '현재 부산 지역은 서비스 준비 중입니다. 2분기 내 확대 예정.', salesPerson: '이상호', reviewedBy: '관리자', reviewedAt: new Date('2026-09-04'), notifiedAt: new Date('2026-09-04'), isReusable: true },
      { shopName: '더마케어 일산', ownerName: '최수진', phone: '010-6789-0123', email: 'choi@derma.co.kr', address: '경기도 고양시 일산서구', status: 'REJECTED', rejectionType: '서류미비', rejectedReason: '사업자등록증 미첨부. 재신청 안내 완료.', salesPerson: '박민수', reviewedBy: '관리자', reviewedAt: new Date('2026-09-03'), notifiedAt: new Date('2026-09-03'), isReusable: true },
    ],
  });
  console.log('샘플 데이터 재생성 완료!');
}
main().finally(() => prisma.$disconnect());
