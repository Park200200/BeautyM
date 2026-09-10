// 상세 시술(Treatment) 데이터 영구 저장 스크립트
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const shop = await prisma.shop.findUnique({ where: { slug: 'glow-skin' } });
  if (!shop) { console.log('❌ 매장 없음'); return; }

  // 카테고리 조회/생성
  const categories = [
    { name: '피부관리', sortOrder: 1 },
    { name: '왁싱', sortOrder: 2 },
    { name: '바디관리', sortOrder: 3 },
    { name: '토닝', sortOrder: 4 },
  ];

  const catMap = {};
  for (const cat of categories) {
    const c = await prisma.category.upsert({
      where: { shopId_name: { shopId: shop.id, name: cat.name } },
      update: { sortOrder: cat.sortOrder },
      create: { shopId: shop.id, name: cat.name, sortOrder: cat.sortOrder },
    });
    catMap[cat.name] = c.id;
  }
  console.log('✅ 카테고리 4개 등록:', Object.keys(catMap));

  // 상세 시술 데이터
  const treatments = [
    // ===== 피부관리 =====
    { category: '피부관리', name: '딥 클렌징', duration: 30, features: '모공 속 노폐물 제거, 버블 클렌저 사용', equipment: 'AHA/BHA 필링젤, 스팀기' },
    { category: '피부관리', name: '각질 제거', duration: 20, features: '효소필링으로 묵은 각질 제거', equipment: '효소필링, 곡물스크럽' },
    { category: '피부관리', name: '수분 팩', duration: 30, features: '히알루론산 고농축 수분공급', equipment: '히알루론산 마스크팩, 에센스' },
    { category: '피부관리', name: '초음파 관리', duration: 40, features: '초음파 진동으로 깊은 영양 전달', equipment: '초음파기, 앰플' },
    { category: '피부관리', name: '고농축 앰플 관리', duration: 30, features: '비타민C, 나이아신아마이드 앰플 도포', equipment: '더마스탬프, 앰플세트' },
    { category: '피부관리', name: '리프팅 관리', duration: 50, features: 'RF 고주파로 탄력 개선', equipment: 'RF기기, 리프팅크림' },
    { category: '피부관리', name: '콜라겐 관리', duration: 40, features: '콜라겐 시트 + 이온토포레시스', equipment: '콜라겐마스크, 갈바닉기기' },
    { category: '피부관리', name: 'LED 관리', duration: 20, features: '적색/근적외선 LED로 재생 촉진', equipment: 'LED마스크 (레드630nm)' },
    { category: '피부관리', name: '여드름 압출', duration: 40, features: '전문 압출 + 진정 관리', equipment: '압출기, 진정팩, 소독솔루션' },
    { category: '피부관리', name: 'MTS 관리', duration: 50, features: '미세 바늘로 피부 재생 유도', equipment: 'MTS롤러, 성장인자앰플' },
    { category: '피부관리', name: '미백 관리', duration: 45, features: '비타민C 이온도입 + 미백 마스크', equipment: '이온토포레시스, 미백앰플' },
    { category: '피부관리', name: '모공 관리', duration: 35, features: '모공 축소 + 피지 조절', equipment: '아쿠아필, 모공수축팩' },

    // ===== 왁싱 =====
    { category: '왁싱', name: '페이스 왁싱', duration: 15, features: '인중, 이마, 볼 잔털 제거', equipment: '하드왁스, 우드스틱' },
    { category: '왁싱', name: '겨드랑이 왁싱', duration: 15, features: '겨드랑이 제모', equipment: '소프트왁스, 스트립' },
    { category: '왁싱', name: '팔 왁싱', duration: 25, features: '팔 전체 제모', equipment: '소프트왁스, 스트립' },
    { category: '왁싱', name: '하프 다리 왁싱', duration: 30, features: '무릎 하단 제모', equipment: '소프트왁스, 스트립' },
    { category: '왁싱', name: '풀 다리 왁싱', duration: 45, features: '다리 전체 제모', equipment: '소프트왁스, 대형스트립' },
    { category: '왁싱', name: '브라질리언 왁싱', duration: 30, features: '비키니 라인 정밀 제모', equipment: '하드왁스, 진정로션' },
    { category: '왁싱', name: '등 왁싱', duration: 40, features: '등 전체 제모', equipment: '소프트왁스, 스트립' },

    // ===== 바디관리 =====
    { category: '바디관리', name: '복부 슬리밍', duration: 40, features: '고주파 + 석션으로 복부 라인 관리', equipment: 'RF기기, 슬리밍크림' },
    { category: '바디관리', name: '허벅지 슬리밍', duration: 40, features: '셀룰라이트 감소 + 라인 정리', equipment: 'RF기기, 엔더몰로지' },
    { category: '바디관리', name: '등 클렌징', duration: 30, features: '등 각질 제거 + 트러블 관리', equipment: '스크럽제, AHA 토너' },
    { category: '바디관리', name: '등 마사지', duration: 40, features: '딥티슈 마사지로 근육 이완', equipment: '마사지오일, 핫스톤' },
    { category: '바디관리', name: '전신 아로마 마사지', duration: 60, features: '스웨디시 기법 전신 이완', equipment: '아로마오일 (라벤더/유칼립투스)' },
    { category: '바디관리', name: '팔 관리', duration: 30, features: '팔뚝 라인 관리 + 보습', equipment: 'RF기기, 보습크림' },
    { category: '바디관리', name: '힙업 관리', duration: 35, features: 'EMS + 고주파 엉덩이 탄력', equipment: 'EMS기기, RF기기' },

    // ===== 토닝 =====
    { category: '토닝', name: '레이저 토닝', duration: 30, features: '기미/잡티 감소, 피부톤 개선', equipment: 'Nd:YAG 레이저' },
    { category: '토닝', name: '제네시스 토닝', duration: 25, features: '롱펄스 레이저로 홍조/모공 개선', equipment: '제네시스 레이저' },
    { category: '토닝', name: '피코 토닝', duration: 20, features: '피코초 레이저로 색소 파괴', equipment: '피코슈어/피코웨이 레이저' },
    { category: '토닝', name: 'IPL 광선 치료', duration: 30, features: '색소/혈관 병변 치료', equipment: 'IPL 기기' },
    { category: '토닝', name: '아쿠아필 토닝', duration: 40, features: '수분공급 + 피부결 정돈', equipment: '아쿠아필 기기, 세럼' },
    { category: '토닝', name: '울쎄라 리프팅', duration: 45, features: 'HIFU 초음파로 깊은 리프팅', equipment: '울쎄라/더블로 기기' },
  ];

  let count = 0;
  for (const t of treatments) {
    const categoryId = catMap[t.category];
    if (!categoryId) continue;

    // 이미 존재하면 업데이트, 없으면 생성
    const existing = await prisma.treatment.findFirst({
      where: { shopId: shop.id, categoryId, name: t.name },
    });

    if (existing) {
      await prisma.treatment.update({
        where: { id: existing.id },
        data: { duration: t.duration, features: t.features, equipment: t.equipment, sortOrder: count },
      });
    } else {
      await prisma.treatment.create({
        data: {
          shopId: shop.id,
          categoryId,
          name: t.name,
          duration: t.duration,
          features: t.features || null,
          equipment: t.equipment || null,
          sortOrder: count,
        },
      });
    }
    count++;
  }
  console.log(`✅ 상세 시술 ${count}개 등록/업데이트 완료`);

  // 메뉴에 시술 연결 (MenuTreatment)
  const menuLinks = [
    { menuName: '기본 피부관리', treatments: ['딥 클렌징', '각질 제거', '수분 팩'] },
    { menuName: '프리미엄 피부관리', treatments: ['딥 클렌징', '각질 제거', '초음파 관리', '고농축 앰플 관리'] },
    { menuName: '안티에이징 관리', treatments: ['리프팅 관리', '콜라겐 관리', 'LED 관리'] },
    { menuName: '여드름 관리', treatments: ['여드름 압출', 'MTS 관리', 'LED 관리'] },
    { menuName: '브라질리언 왁싱', treatments: ['브라질리언 왁싱'] },
    { menuName: '다리 왁싱', treatments: ['하프 다리 왁싱', '풀 다리 왁싱'] },
    { menuName: '바디 슬리밍', treatments: ['복부 슬리밍', '허벅지 슬리밍'] },
    { menuName: '등 관리', treatments: ['등 클렌징', '등 마사지'] },
  ];

  let linkCount = 0;
  for (const link of menuLinks) {
    const menu = await prisma.menu.findFirst({ where: { shopId: shop.id, name: link.menuName } });
    if (!menu) continue;

    for (let i = 0; i < link.treatments.length; i++) {
      const treatment = await prisma.treatment.findFirst({
        where: { shopId: shop.id, name: link.treatments[i] },
      });
      if (!treatment) continue;

      await prisma.menuTreatment.upsert({
        where: { menuId_treatmentId: { menuId: menu.id, treatmentId: treatment.id } },
        update: { sortOrder: i },
        create: { menuId: menu.id, treatmentId: treatment.id, sortOrder: i },
      });
      linkCount++;
    }
  }
  console.log(`✅ 메뉴-시술 연결 ${linkCount}개 완료`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
