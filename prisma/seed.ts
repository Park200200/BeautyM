// BeautyM - 시드 데이터
// 데모 매장, 사용자, 플랜, 모듈 등 초기 데이터 생성

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 시드 데이터 생성 시작...');

  // ============================================
  // 1. 기능 모듈 등록
  // ============================================
  const modules = [
    { id: 'reservation', name: '예약 관리', description: '캘린더, 예약 CRUD, 상태 관리', icon: '📅', target: 'ADMIN', sortOrder: 1 },
    { id: 'customer', name: '고객 관리', description: 'CRM, 시술 이력, 메모', icon: '👤', target: 'ADMIN', sortOrder: 2 },
    { id: 'menu', name: '시술 메뉴', description: '메뉴/카테고리 등록·관리', icon: '📋', target: 'ADMIN', sortOrder: 3 },
    { id: 'sales', name: '매출/정산', description: 'POS, 일일 정산, 월별 리포트', icon: '💰', target: 'ADMIN', sortOrder: 4 },
    { id: 'staff', name: '직원 관리', description: '스케줄, 실적, 권한', icon: '👩‍💼', target: 'ADMIN', sortOrder: 5 },
    { id: 'inventory', name: '재고 관리', description: '제품, 입출고, 재고 알림', icon: '📦', target: 'ADMIN', sortOrder: 6 },
    { id: 'membership', name: '멤버십', description: '등급, 포인트, 쿠폰', icon: '🎁', target: 'ADMIN', sortOrder: 7 },
    { id: 'portfolio', name: '포트폴리오', description: '시술 전후 사진, 리뷰', icon: '📸', target: 'ADMIN', sortOrder: 8 },
    { id: 'dashboard', name: '대시보드', description: '매출 차트, 통계 요약', icon: '📊', target: 'ADMIN', sortOrder: 9 },
    { id: 'website', name: '고객 웹사이트', description: '예약 페이지, 간편 로그인, 마이페이지', icon: '🌐', target: 'CUSTOMER', sortOrder: 10 },
    { id: 'notification', name: '알림', description: '카카오 알림톡, SMS, 푸시', icon: '🔔', target: 'ADMIN', sortOrder: 11 },
    { id: 'multi_branch', name: '다중 매장', description: '지점 통합 관리', icon: '🏬', target: 'ADMIN', sortOrder: 12 },
    { id: 'ai_analytics', name: 'AI 분석', description: '재방문 예측, 추천 시술', icon: '🤖', target: 'ADMIN', sortOrder: 13 },
  ];

  for (const mod of modules) {
    await prisma.featureModule.upsert({
      where: { id: mod.id },
      update: mod,
      create: mod,
    });
  }
  console.log('  ✅ 기능 모듈 13개 등록 완료');

  // ============================================
  // 2. 플랜 등록
  // ============================================
  const freePlan = await prisma.plan.upsert({
    where: { id: 'plan_free' },
    update: {},
    create: {
      id: 'plan_free',
      name: 'Free',
      price: 0,
      description: '1인 사업장, 테스트용',
    },
  });

  const standardPlan = await prisma.plan.upsert({
    where: { id: 'plan_standard' },
    update: {},
    create: {
      id: 'plan_standard',
      name: 'Standard',
      price: 29000,
      description: '고객 무제한, 매출/멤버십',
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { id: 'plan_pro' },
    update: {},
    create: {
      id: 'plan_pro',
      name: 'Pro',
      price: 69000,
      description: '직원 관리, 재고 관리',
    },
  });

  const enterprisePlan = await prisma.plan.upsert({
    where: { id: 'plan_enterprise' },
    update: {},
    create: {
      id: 'plan_enterprise',
      name: 'Enterprise',
      price: 149000,
      description: '다중 매장, AI 분석',
    },
  });
  console.log('  ✅ 플랜 4개 등록 완료');

  // ============================================
  // 3. 플랜별 기본 모듈 설정
  // ============================================
  const freeModules = ['reservation', 'customer', 'menu', 'website'];
  const standardModules = [...freeModules, 'sales', 'membership', 'portfolio', 'dashboard', 'notification'];
  const proModules = [...standardModules, 'staff', 'inventory'];
  const enterpriseModules = [...proModules, 'multi_branch', 'ai_analytics'];

  const planModuleConfigs: Record<string, Record<string, string>> = {
    plan_free: { customer: '{"maxCustomers":20}', staff: '{"maxStaff":1}', multi_branch: '{"maxBranches":1}', website: '{"allowCustomDomain":false}' },
    plan_standard: { customer: '{"maxCustomers":-1}', staff: '{"maxStaff":1}', multi_branch: '{"maxBranches":1}', website: '{"allowCustomDomain":false}', notification: '{"smsProvider":"both"}' },
    plan_pro: { customer: '{"maxCustomers":-1}', staff: '{"maxStaff":10}', multi_branch: '{"maxBranches":1}', website: '{"allowCustomDomain":false}', notification: '{"smsProvider":"both"}' },
    plan_enterprise: { customer: '{"maxCustomers":-1}', staff: '{"maxStaff":-1}', multi_branch: '{"maxBranches":5}', website: '{"allowCustomDomain":true}', notification: '{"smsProvider":"both"}' },
  };

  const planModuleMap = {
    plan_free: freeModules,
    plan_standard: standardModules,
    plan_pro: proModules,
    plan_enterprise: enterpriseModules,
  };

  for (const [planId, moduleIds] of Object.entries(planModuleMap)) {
    for (const moduleId of moduleIds) {
      const defaultConfig = planModuleConfigs[planId]?.[moduleId] || null;
      await prisma.planModule.upsert({
        where: { planId_moduleId: { planId, moduleId } },
        update: { defaultConfig },
        create: { planId, moduleId, isDefault: true, defaultConfig },
      });
    }
  }
  console.log('  ✅ 플랜별 기본 모듈 설정 완료');

  // ============================================
  // 4. SuperAdmin 사용자 생성
  // ============================================
  const adminPasswordHash = await bcrypt.hash('admin1234', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@beautym.com' },
    update: {},
    create: {
      name: '관리자',
      email: 'admin@beautym.com',
      passwordHash: adminPasswordHash,
      globalRole: 'SUPER_ADMIN',
      authType: 'EMAIL',
    },
  });
  console.log('  ✅ SuperAdmin 생성 완료 (admin@beautym.com / admin1234)');

  // ============================================
  // 5. 데모 매장 생성
  // ============================================
  const ownerPasswordHash = await bcrypt.hash('owner1234', 10);
  const ownerUser = await prisma.user.upsert({
    where: { email: 'owner@demo.com' },
    update: {},
    create: {
      name: '김미영',
      email: 'owner@demo.com',
      phone: '01012345678',
      passwordHash: ownerPasswordHash,
      globalRole: 'USER',
      authType: 'EMAIL',
      isPhoneVerified: true,
    },
  });

  const demoShop = await prisma.shop.upsert({
    where: { slug: 'glow-skin' },
    update: {},
    create: {
      name: '글로우 스킨케어',
      slug: 'glow-skin',
      phone: '02-1234-5678',
      address: '서울시 강남구 테헤란로 123',
      description: '피부관리 전문 에스테틱',
      businessHours: JSON.stringify({
        mon: { open: '10:00', close: '20:00' },
        tue: { open: '10:00', close: '20:00' },
        wed: { open: '10:00', close: '20:00' },
        thu: { open: '10:00', close: '20:00' },
        fri: { open: '10:00', close: '20:00' },
        sat: { open: '10:00', close: '18:00' },
        sun: null,
      }),
      isActive: true,
    },
  });
  console.log('  ✅ 데모 매장 "글로우 스킨케어" 생성 완료');

  // 매장 구독 (Pro 플랜 — 직원관리 포함)
  await prisma.subscription.upsert({
    where: { shopId: demoShop.id },
    update: {},
    create: {
      shopId: demoShop.id,
      planId: proPlan.id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // 매장 기능 활성화 (Pro 기본 모듈)
  for (const moduleId of proModules) {
    const defaultConfig = planModuleConfigs.plan_pro?.[moduleId] || null;
    await prisma.shopFeature.upsert({
      where: { shopId_moduleId: { shopId: demoShop.id, moduleId } },
      update: {},
      create: {
        shopId: demoShop.id,
        moduleId,
        isEnabled: true,
        config: defaultConfig,
        enabledBy: superAdmin.id,
      },
    });
  }

  // 비활성 모듈도 등록 (UI에서 잠금 표시용)
  const disabledModules = enterpriseModules.filter((m) => !proModules.includes(m));
  for (const moduleId of disabledModules) {
    await prisma.shopFeature.upsert({
      where: { shopId_moduleId: { shopId: demoShop.id, moduleId } },
      update: {},
      create: {
        shopId: demoShop.id,
        moduleId,
        isEnabled: false,
        config: null,
      },
    });
  }

  // 원장 멤버 등록
  const ownerMember = await prisma.shopMember.upsert({
    where: { userId_shopId: { userId: ownerUser.id, shopId: demoShop.id } },
    update: {},
    create: {
      userId: ownerUser.id,
      shopId: demoShop.id,
      role: 'OWNER',
      specialties: '피부관리, 안티에이징',
      isActive: true,
    },
  });

  // ============================================
  // 6. 데모 직원 생성
  // ============================================
  const staffPasswordHash = await bcrypt.hash('staff1234', 10);
  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@demo.com' },
    update: {},
    create: {
      name: '이수진',
      email: 'staff@demo.com',
      phone: '01098765432',
      passwordHash: staffPasswordHash,
      globalRole: 'USER',
      authType: 'EMAIL',
      isPhoneVerified: true,
    },
  });

  const staffMember = await prisma.shopMember.upsert({
    where: { userId_shopId: { userId: staffUser.id, shopId: demoShop.id } },
    update: {},
    create: {
      userId: staffUser.id,
      shopId: demoShop.id,
      role: 'STAFF',
      specialties: '피부관리, 왁싱',
      isActive: true,
    },
  });

  // 직원 권한 설정 (예약, 고객, 메뉴만 허용)
  const staffAllowedModules = ['reservation', 'customer', 'menu'];
  for (const moduleId of standardModules) {
    await prisma.staffPermission.upsert({
      where: { memberId_moduleId: { memberId: staffMember.id, moduleId } },
      update: {},
      create: {
        memberId: staffMember.id,
        moduleId,
        isAllowed: staffAllowedModules.includes(moduleId),
      },
    });
  }
  console.log('  ✅ 데모 직원 "이수진" 생성 완료');

  // ============================================
  // 7. 데모 고객 생성
  // ============================================
  const customerPin = await bcrypt.hash('1234', 10);
  const customers = [
    { name: '박지현', phone: '01011112222' },
    { name: '최서연', phone: '01033334444' },
    { name: '정다은', phone: '01055556666' },
  ];

  for (const cust of customers) {
    const user = await prisma.user.upsert({
      where: { phone: cust.phone },
      update: {},
      create: {
        name: cust.name,
        phone: cust.phone,
        simplePin: customerPin,
        globalRole: 'USER',
        authType: 'PHONE',
        isPhoneVerified: true,
      },
    });

    await prisma.shopMember.upsert({
      where: { userId_shopId: { userId: user.id, shopId: demoShop.id } },
      update: {},
      create: {
        userId: user.id,
        shopId: demoShop.id,
        role: 'CUSTOMER',
        skinType: ['건성', '지성', '복합성'][Math.floor(Math.random() * 3)],
        memberGrade: '일반',
        totalPoints: Math.floor(Math.random() * 5000),
        totalSpent: Math.floor(Math.random() * 500000),
        visitCount: Math.floor(Math.random() * 10) + 1,
        isActive: true,
      },
    });
  }
  console.log('  ✅ 데모 고객 3명 생성 완료');

  // ============================================
  // 8. 데모 시술 메뉴 생성
  // ============================================
  const skinCareCategory = await prisma.category.upsert({
    where: { shopId_name: { shopId: demoShop.id, name: '피부관리' } },
    update: {},
    create: { shopId: demoShop.id, name: '피부관리', sortOrder: 1 },
  });

  const waxingCategory = await prisma.category.upsert({
    where: { shopId_name: { shopId: demoShop.id, name: '왁싱' } },
    update: {},
    create: { shopId: demoShop.id, name: '왁싱', sortOrder: 2 },
  });

  const bodyCategory = await prisma.category.upsert({
    where: { shopId_name: { shopId: demoShop.id, name: '바디관리' } },
    update: {},
    create: { shopId: demoShop.id, name: '바디관리', sortOrder: 3 },
  });

  const toningCategory = await prisma.category.upsert({
    where: { shopId_name: { shopId: demoShop.id, name: '토닝' } },
    update: {},
    create: { shopId: demoShop.id, name: '토닝', sortOrder: 4 },
  });

  const menuItems = [
    { name: '기본 피부관리', description: '클렌징 + 각질 제거 + 수분팩', price: 80000, duration: 60, categoryId: skinCareCategory.id },
    { name: '프리미엄 피부관리', description: '기본 관리 + 초음파 + 고농축 앰플', price: 150000, duration: 90, categoryId: skinCareCategory.id },
    { name: '안티에이징 관리', description: '리프팅 + 콜라겐 관리 + LED', price: 200000, duration: 120, categoryId: skinCareCategory.id },
    { name: '여드름 관리', description: '여드름 압출 + 진정 관리 + MTS', price: 120000, duration: 90, categoryId: skinCareCategory.id },
    { name: '브라질리언 왁싱', description: '비키니 라인 왁싱', price: 50000, duration: 30, categoryId: waxingCategory.id },
    { name: '다리 왁싱', description: '하프 / 풀 다리 왁싱', price: 60000, duration: 45, categoryId: waxingCategory.id },
    { name: '바디 슬리밍', description: '복부 + 허벅지 슬리밍 관리', price: 100000, duration: 60, categoryId: bodyCategory.id },
    { name: '등 관리', description: '등 클렌징 + 각질 제거 + 마사지', price: 90000, duration: 60, categoryId: bodyCategory.id },
  ];

  for (const item of menuItems) {
    await prisma.menu.create({
      data: {
        shopId: demoShop.id,
        ...item,
        isActive: true,
        isPublic: true,
      },
    });
  }
  console.log('  ✅ 데모 시술 메뉴 8개 생성 완료');

  // 8-2. 상세 시술(Treatment) 등록
  const catMap: Record<string, string> = {
    '피부관리': skinCareCategory.id,
    '왁싱': waxingCategory.id,
    '바디관리': bodyCategory.id,
    '토닝': toningCategory.id,
  };

  const treatmentData = [
    { cat: '피부관리', name: '딥 클렌징', duration: 30, features: '모공 속 노폐물 제거, 버블 클렌저 사용', equipment: 'AHA/BHA 필링젤, 스팀기' },
    { cat: '피부관리', name: '각질 제거', duration: 20, features: '효소필링으로 묵은 각질 제거', equipment: '효소필링, 곡물스크럽' },
    { cat: '피부관리', name: '수분 팩', duration: 30, features: '히알루론산 고농축 수분공급', equipment: '히알루론산 마스크팩, 에센스' },
    { cat: '피부관리', name: '초음파 관리', duration: 40, features: '초음파 진동으로 깊은 영양 전달', equipment: '초음파기, 앰플' },
    { cat: '피부관리', name: '고농축 앰플 관리', duration: 30, features: '비타민C, 나이아신아마이드 앰플 도포', equipment: '더마스탬프, 앰플세트' },
    { cat: '피부관리', name: '리프팅 관리', duration: 50, features: 'RF 고주파로 탄력 개선', equipment: 'RF기기, 리프팅크림' },
    { cat: '피부관리', name: '콜라겐 관리', duration: 40, features: '콜라겐 시트 + 이온토포레시스', equipment: '콜라겐마스크, 갈바닉기기' },
    { cat: '피부관리', name: 'LED 관리', duration: 20, features: '적색/근적외선 LED로 재생 촉진', equipment: 'LED마스크 (레드630nm)' },
    { cat: '피부관리', name: '여드름 압출', duration: 40, features: '전문 압출 + 진정 관리', equipment: '압출기, 진정팩, 소독솔루션' },
    { cat: '피부관리', name: 'MTS 관리', duration: 50, features: '미세 바늘로 피부 재생 유도', equipment: 'MTS롤러, 성장인자앰플' },
    { cat: '피부관리', name: '미백 관리', duration: 45, features: '비타민C 이온도입 + 미백 마스크', equipment: '이온토포레시스, 미백앰플' },
    { cat: '피부관리', name: '모공 관리', duration: 35, features: '모공 축소 + 피지 조절', equipment: '아쿠아필, 모공수축팩' },
    { cat: '왁싱', name: '페이스 왁싱', duration: 15, features: '인중, 이마, 볼 잔털 제거', equipment: '하드왁스, 우드스틱' },
    { cat: '왁싱', name: '겨드랑이 왁싱', duration: 15, features: '겨드랑이 제모', equipment: '소프트왁스, 스트립' },
    { cat: '왁싱', name: '팔 왁싱', duration: 25, features: '팔 전체 제모', equipment: '소프트왁스, 스트립' },
    { cat: '왁싱', name: '하프 다리 왁싱', duration: 30, features: '무릎 하단 제모', equipment: '소프트왁스, 스트립' },
    { cat: '왁싱', name: '풀 다리 왁싱', duration: 45, features: '다리 전체 제모', equipment: '소프트왁스, 대형스트립' },
    { cat: '왁싱', name: '브라질리언 왁싱', duration: 30, features: '비키니 라인 정밀 제모', equipment: '하드왁스, 진정로션' },
    { cat: '왁싱', name: '등 왁싱', duration: 40, features: '등 전체 제모', equipment: '소프트왁스, 스트립' },
    { cat: '바디관리', name: '복부 슬리밍', duration: 40, features: '고주파 + 석션으로 복부 라인 관리', equipment: 'RF기기, 슬리밍크림' },
    { cat: '바디관리', name: '허벅지 슬리밍', duration: 40, features: '셀룰라이트 감소 + 라인 정리', equipment: 'RF기기, 엔더몰로지' },
    { cat: '바디관리', name: '등 클렌징', duration: 30, features: '등 각질 제거 + 트러블 관리', equipment: '스크럽제, AHA 토너' },
    { cat: '바디관리', name: '등 마사지', duration: 40, features: '딥티슈 마사지로 근육 이완', equipment: '마사지오일, 핫스톤' },
    { cat: '바디관리', name: '전신 아로마 마사지', duration: 60, features: '스웨디시 기법 전신 이완', equipment: '아로마오일 (라벤더/유칼립투스)' },
    { cat: '바디관리', name: '팔 관리', duration: 30, features: '팔뚝 라인 관리 + 보습', equipment: 'RF기기, 보습크림' },
    { cat: '바디관리', name: '힙업 관리', duration: 35, features: 'EMS + 고주파 엉덩이 탄력', equipment: 'EMS기기, RF기기' },
    { cat: '토닝', name: '레이저 토닝', duration: 30, features: '기미/잡티 감소, 피부톤 개선', equipment: 'Nd:YAG 레이저' },
    { cat: '토닝', name: '제네시스 토닝', duration: 25, features: '롱펄스 레이저로 홍조/모공 개선', equipment: '제네시스 레이저' },
    { cat: '토닝', name: '피코 토닝', duration: 20, features: '피코초 레이저로 색소 파괴', equipment: '피코슈어/피코웨이 레이저' },
    { cat: '토닝', name: 'IPL 광선 치료', duration: 30, features: '색소/혈관 병변 치료', equipment: 'IPL 기기' },
    { cat: '토닝', name: '아쿠아필 토닝', duration: 40, features: '수분공급 + 피부결 정돈', equipment: '아쿠아필 기기, 세럼' },
    { cat: '토닝', name: '울쎄라 리프팅', duration: 45, features: 'HIFU 초음파로 깊은 리프팅', equipment: '울쎄라/더블로 기기' },
  ];

  for (let i = 0; i < treatmentData.length; i++) {
    const t = treatmentData[i];
    const categoryId = catMap[t.cat];
    if (!categoryId) continue;
    const existing = await prisma.treatment.findFirst({ where: { shopId: demoShop.id, categoryId, name: t.name } });
    if (!existing) {
      await prisma.treatment.create({
        data: { shopId: demoShop.id, categoryId, name: t.name, duration: t.duration, features: t.features, equipment: t.equipment, sortOrder: i },
      });
    }
  }
  console.log('  ✅ 상세 시술 32개 등록 완료');

  // ============================================
  // 9. 데모 예약 생성 (리얼 데모용 대량 데이터)
  // ============================================
  // 기존 예약 전부 삭제
  await prisma.reservation.deleteMany({ where: { shopId: demoShop.id } });

  const allCustomers = await prisma.shopMember.findMany({
    where: { shopId: demoShop.id, role: 'CUSTOMER' },
  });
  const allMenus = await prisma.menu.findMany({
    where: { shopId: demoShop.id },
  });
  const staffMembers = [ownerMember, staffMember];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 메모 풀 (다양한 케이스)
  const memos = [
    '피부가 건조한 편이라 수분 관리 집중',
    '첫 방문 고객 - 피부 상담 후 진행',
    '알레르기 있음 (라텍스) 주의',
    '지난번 시술 후 만족, 동일 코스 요청',
    '결혼식 2주 전, 집중 관리 원함',
    '직장인, 점심시간 활용 방문',
    '친구 소개로 방문 (김○○ 소개)',
    '민감성 피부 - 저자극 제품 사용',
    '등 부위 트러블 심함, 진정 관리 우선',
    '시술 후 홍조 주의, 쿨링 충분히',
    '임산부 - 안전한 제품만 사용',
    '이전 매장에서 왁싱 경험 있음',
    '생일 이벤트 쿠폰 적용 요청',
    '포인트 사용 희망 (5만원)',
    null, null, null, null, null, null,  // 메모 없는 케이스 (60% 확률)
  ];

  // seeded random (일관된 결과)
  let seed = 42;
  const seededRandom = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  // 매장 영업시간에서 휴무 요일 + 특정 휴일 읽기
  const shopData = await prisma.shop.findUnique({ where: { slug: 'glow-skin' }, select: { businessHours: true } });
  const closedDayIndices: number[] = [0]; // 기본: 일요일
  const specificHolidays: string[] = [];
  if (shopData?.businessHours) {
    try {
      const bh = JSON.parse(shopData.businessHours);
      const dayMap: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
      const cleared: number[] = [];
      for (const [key, idx] of Object.entries(dayMap)) {
        if (bh[key]?.closed) cleared.push(idx);
      }
      if (cleared.length > 0) {
        closedDayIndices.length = 0;
        closedDayIndices.push(...cleared);
      }
      if (Array.isArray(bh._holidays)) specificHolidays.push(...bh._holidays);
    } catch {}
  }
  console.log(`  📅 휴무 요일: [${closedDayIndices.map(i => ['일','월','화','수','목','금','토'][i]).join(',')}], 특정 휴일: [${specificHolidays.join(',')}]`);

  // 과거 30일 ~ 미래 20일
  let totalReservations = 0;
  for (let dayOffset = -30; dayOffset <= 20; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);

    // 정기 휴무 요일 또는 특정 휴일 → 스킵
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (closedDayIndices.includes(date.getDay())) continue;
    if (specificHolidays.includes(dateStr)) continue;

    // 하루 예약 건수: 2~13 랜덤
    const dailyCount = Math.floor(seededRandom() * 12) + 2; // 2~13

    // 가능한 시작시간 슬롯 (08:00~20:00, 30분 단위)
    const slots: number[] = [];
    for (let h = 8; h < 20; h++) {
      slots.push(h * 60);
      slots.push(h * 60 + 30);
    }
    // 슬롯 셔플
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }

    const usedSlots = slots.slice(0, dailyCount);
    usedSlots.sort((a, b) => a - b);

    for (let k = 0; k < usedSlots.length; k++) {
      const customer = allCustomers[Math.floor(seededRandom() * allCustomers.length)];
      const menu = allMenus[Math.floor(seededRandom() * allMenus.length)];
      const staff = staffMembers[Math.floor(seededRandom() * staffMembers.length)];

      const startMin = usedSlots[k];
      const startTime = new Date(date);
      startTime.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + menu.duration);

      // 상태 결정: 과거=COMPLETED(80%)/NO_SHOW(10%)/CANCELLED(10%), 오늘=CONFIRMED, 미래=CONFIRMED(60%)/REQUESTED(30%)/PENDING(10%)
      let status: string;
      if (dayOffset < 0) {
        const r = seededRandom();
        status = r < 0.80 ? 'COMPLETED' : r < 0.90 ? 'NO_SHOW' : 'CANCELLED';
      } else if (dayOffset === 0) {
        const r = seededRandom();
        status = r < 0.7 ? 'CONFIRMED' : 'COMPLETED';
      } else {
        const r = seededRandom();
        status = r < 0.60 ? 'CONFIRMED' : r < 0.90 ? 'REQUESTED' : 'PENDING';
      }

      const memo = memos[Math.floor(seededRandom() * memos.length)];
      const source = seededRandom() < 0.3 ? 'WEBSITE' : 'ADMIN';

      await prisma.reservation.create({
        data: {
          shopId: demoShop.id,
          customerId: customer.id,
          staffId: staff.id,
          menuId: menu.id,
          startTime,
          endTime,
          status,
          source,
          memo,
        },
      });
      totalReservations++;
    }
  }
  console.log(`  ✅ 데모 예약 ${totalReservations}개 생성 완료 (일요일 휴무 제외, 일별 2~13건)`);

  // ── 포트폴리오 샘플 데이터 ──
  const portfolioSamples = [
    {
      title: '기본 피부관리 - 수분 집중 케어',
      category: '피부관리',
      description: '건조한 피부에 수분을 집중 공급하여 촉촉하고 건강한 피부로 개선. 총 5회 시술 후 결과입니다.',
      staffName: '김원장',
      beforeImage: 'https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&h=500&fit=crop&crop=face',
      afterImage: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=500&fit=crop&crop=face',
    },
    {
      title: '안티에이징 관리 - 주름 개선',
      category: '피부관리',
      description: '눈가, 이마 주름을 집중 관리하여 탄력 있는 피부로 개선. 고주파 + 리프팅 병행 시술.',
      staffName: '김원장',
      beforeImage: 'https://images.unsplash.com/photo-1594824476967-48c8b964f137?w=400&h=500&fit=crop&crop=face',
      afterImage: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400&h=500&fit=crop&crop=face',
    },
    {
      title: '브라질리언 왁싱 - 깔끔한 라인',
      category: '왁싱',
      description: '위생적인 브라질리언 왁싱 시술. 피부 자극 최소화, 깔끔한 마무리.',
      staffName: '이수진',
      beforeImage: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400&h=500&fit=crop&crop=face',
      afterImage: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=500&fit=crop&crop=face',
    },
    {
      title: '프리미엄 바디 관리 - 셀룰라이트 개선',
      category: '바디관리',
      description: '허벅지, 복부 셀룰라이트 집중 관리. 림프 순환 + 고주파 병행 8회 프로그램.',
      staffName: '이수진',
      beforeImage: 'https://images.unsplash.com/photo-1573461160327-b450ce3d8e7f?w=400&h=500&fit=crop&crop=face',
      afterImage: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=400&h=500&fit=crop&crop=face',
    },
    {
      title: '여드름 피부 집중 관리',
      category: '피부관리',
      description: '여드름성 피부의 진정 및 재생 관리. LED + 살리실산 필링 + 앰플 집중 투여.',
      staffName: '김원장',
      beforeImage: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&h=500&fit=crop&crop=face',
      afterImage: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=500&fit=crop&crop=face',
    },
    {
      title: '등 관리 - 트러블 개선',
      category: '바디관리',
      description: '등 부위 트러블 및 색소침착 개선. 딥클렌징 + 진정 관리 6회 코스.',
      staffName: '이수진',
      beforeImage: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=400&h=500&fit=crop&crop=face',
      afterImage: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&h=500&fit=crop&crop=face',
    },
  ];

  for (let i = 0; i < portfolioSamples.length; i++) {
    const s = portfolioSamples[i];
    await prisma.portfolio.upsert({
      where: { id: `portfolio-sample-${i + 1}` },
      update: {},
      create: {
        id: `portfolio-sample-${i + 1}`,
        shopId: demoShop.id,
        title: s.title,
        category: s.category,
        description: s.description,
        staffName: s.staffName,
        beforeImage: s.beforeImage,
        afterImage: s.afterImage,
        isPublic: true,
        sortOrder: i,
      },
    });
  }
  console.log('  ✅ 포트폴리오 샘플 6개 생성 완료');

  console.log('\n🎉 시드 데이터 생성 완료!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 SuperAdmin: admin@beautym.com / admin1234');
  console.log('📧 매장 원장:  owner@demo.com / owner1234');
  console.log('📧 매장 직원:  staff@demo.com / staff1234');
  console.log('📱 고객:       01011112222 / 1234 (PIN)');
  console.log('🏪 매장 슬러그: glow-skin');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ 시드 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
