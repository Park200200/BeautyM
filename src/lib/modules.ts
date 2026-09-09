// BeautyM - 모듈 레지스트리
// 시스템의 모든 기능 모듈을 정의하고 관리하는 중앙 레지스트리

import { FeatureModuleDefinition, ModuleId } from '@/types/modules';

/**
 * 13개 기능 모듈 정의
 * 본사가 매장별로 ON/OFF하고 세부 설정을 조정할 수 있는 단위
 */
export const MODULE_REGISTRY: FeatureModuleDefinition[] = [
  {
    id: 'reservation',
    name: '예약 관리',
    description: '캘린더, 예약 CRUD, 상태 관리',
    icon: 'CalendarCheck',
    target: 'ADMIN',
    configFields: [],
    sortOrder: 1,
  },
  {
    id: 'customer',
    name: '고객 관리',
    description: 'CRM, 시술 이력, 메모',
    icon: 'UserRound',
    target: 'ADMIN',
    configFields: [
      {
        key: 'maxCustomers',
        label: '최대 고객 수',
        type: 'number',
        defaultValue: 50,
      },
    ],
    sortOrder: 2,
  },
  {
    id: 'menu',
    name: '시술 메뉴',
    description: '메뉴/카테고리 등록·관리',
    icon: 'ClipboardList',
    target: 'ADMIN',
    configFields: [],
    sortOrder: 3,
  },
  {
    id: 'sales',
    name: '매출/정산',
    description: 'POS, 일일 정산, 월별 리포트',
    icon: 'TrendingUp',
    target: 'ADMIN',
    configFields: [],
    sortOrder: 4,
  },
  {
    id: 'staff',
    name: '직원 관리',
    description: '스케줄, 실적, 권한',
    icon: 'UsersRound',
    target: 'ADMIN',
    configFields: [
      {
        key: 'maxStaff',
        label: '최대 직원 수',
        type: 'number',
        defaultValue: 1,
      },
    ],
    sortOrder: 5,
  },
  {
    id: 'inventory',
    name: '재고 관리',
    description: '제품, 입출고, 재고 알림',
    icon: 'Package',
    target: 'ADMIN',
    configFields: [],
    sortOrder: 6,
  },
  {
    id: 'membership',
    name: '멤버십',
    description: '등급, 포인트, 쿠폰',
    icon: 'Gift',
    target: 'ADMIN',
    configFields: [],
    sortOrder: 7,
  },
  {
    id: 'portfolio',
    name: '포트폴리오',
    description: '시술 전후 사진, 리뷰',
    icon: 'Camera',
    target: 'ADMIN',
    configFields: [],
    sortOrder: 8,
  },
  {
    id: 'dashboard',
    name: '대시보드',
    description: '매출 차트, 통계 요약',
    icon: 'LayoutDashboard',
    target: 'ADMIN',
    configFields: [],
    sortOrder: 9,
  },
  {
    id: 'website',
    name: '고객 웹사이트',
    description: '예약 페이지, 간편 로그인, 마이페이지',
    icon: 'Globe',
    target: 'CUSTOMER',
    configFields: [
      {
        key: 'allowCustomDomain',
        label: '커스텀 도메인 허용',
        type: 'boolean',
        defaultValue: false,
      },
    ],
    sortOrder: 10,
  },
  {
    id: 'notification',
    name: '알림',
    description: '카카오 알림톡, SMS, 푸시',
    icon: 'Bell',
    target: 'ADMIN',
    configFields: [
      {
        key: 'smsProvider',
        label: '알림 채널',
        type: 'select',
        defaultValue: 'both',
        options: [
          { label: '카카오 알림톡만', value: 'kakao' },
          { label: 'SMS만', value: 'sms' },
          { label: '카카오 + SMS', value: 'both' },
        ],
      },
    ],
    sortOrder: 11,
  },
  {
    id: 'multi_branch',
    name: '다중 매장',
    description: '지점 통합 관리',
    icon: 'Building2',
    target: 'ADMIN',
    configFields: [
      {
        key: 'maxBranches',
        label: '최대 매장 수',
        type: 'number',
        defaultValue: 1,
      },
    ],
    sortOrder: 12,
  },
  {
    id: 'ai_analytics',
    name: 'AI 분석',
    description: '재방문 예측, 추천 시술',
    icon: 'BrainCircuit',
    target: 'ADMIN',
    configFields: [],
    sortOrder: 13,
  },
];

/**
 * 플랜별 기본 모듈 구성 (신규 가입 시 자동 적용)
 */
export const PLAN_DEFAULT_MODULES: Record<string, ModuleId[]> = {
  free: ['reservation', 'customer', 'menu', 'website'],
  standard: [
    'reservation',
    'customer',
    'menu',
    'sales',
    'membership',
    'portfolio',
    'dashboard',
    'website',
    'notification',
  ],
  pro: [
    'reservation',
    'customer',
    'menu',
    'sales',
    'staff',
    'inventory',
    'membership',
    'portfolio',
    'dashboard',
    'website',
    'notification',
  ],
  enterprise: [
    'reservation',
    'customer',
    'menu',
    'sales',
    'staff',
    'inventory',
    'membership',
    'portfolio',
    'dashboard',
    'website',
    'notification',
    'multi_branch',
    'ai_analytics',
  ],
};

/**
 * 플랜별 기본 세부 설정값
 */
export const PLAN_DEFAULT_CONFIG: Record<string, Record<string, unknown>> = {
  free: {
    maxCustomers: 20,
    maxStaff: 1,
    maxBranches: 1,
    allowCustomDomain: false,
  },
  standard: {
    maxCustomers: -1, // 무제한
    maxStaff: 1,
    maxBranches: 1,
    allowCustomDomain: false,
    smsProvider: 'both',
  },
  pro: {
    maxCustomers: -1,
    maxStaff: 10,
    maxBranches: 1,
    allowCustomDomain: false,
    smsProvider: 'both',
  },
  enterprise: {
    maxCustomers: -1,
    maxStaff: -1,
    maxBranches: 5,
    allowCustomDomain: true,
    smsProvider: 'both',
  },
};

/**
 * 모듈 ID로 모듈 정의 조회
 */
export function getModuleById(id: ModuleId): FeatureModuleDefinition | undefined {
  return MODULE_REGISTRY.find((m) => m.id === id);
}

/**
 * 관리 모듈만 필터링
 */
export function getAdminModules(): FeatureModuleDefinition[] {
  return MODULE_REGISTRY.filter((m) => m.target === 'ADMIN');
}

/**
 * 고객 모듈만 필터링
 */
export function getCustomerModules(): FeatureModuleDefinition[] {
  return MODULE_REGISTRY.filter((m) => m.target === 'CUSTOMER');
}

/**
 * 사이드바 메뉴 생성용 — 모듈 ID를 경로로 매핑
 */
export const MODULE_ROUTES: Record<ModuleId, string> = {
  reservation: '/reservations',
  customer: '/customers',
  menu: '/menus',
  sales: '/sales',
  staff: '/staff',
  inventory: '/inventory',
  membership: '/membership',
  portfolio: '/portfolio',
  dashboard: '/dashboard',
  website: '/website',
  notification: '/notifications',
  multi_branch: '/branches',
  ai_analytics: '/analytics',
};
