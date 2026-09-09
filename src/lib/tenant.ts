// BeautyM - 테넌트 컨텍스트 관리
// 현재 요청의 매장(테넌트) 정보를 관리

import prisma from '@/lib/prisma';

export interface TenantContext {
  shopId: string;
  shopSlug: string;
  shopName: string;
}

/**
 * 슬러그로 매장 조회
 */
export async function getShopBySlug(slug: string) {
  return prisma.shop.findUnique({
    where: { slug },
    include: {
      subscription: {
        include: { plan: true },
      },
      features: true,
    },
  });
}

/**
 * 매장의 활성화된 모듈 목록 조회
 */
export async function getEnabledModules(shopId: string) {
  const features = await prisma.shopFeature.findMany({
    where: { shopId, isEnabled: true },
    include: { module: true },
    orderBy: { module: { sortOrder: 'asc' } },
  });

  return features.map((f) => ({
    moduleId: f.moduleId,
    name: f.module.name,
    icon: f.module.icon,
    target: f.module.target,
    config: f.config ? JSON.parse(f.config) : null,
    isEnabled: f.isEnabled,
  }));
}

/**
 * 매장의 모든 기능 상태 조회 (활성 + 비활성 포함)
 */
export async function getAllShopFeatures(shopId: string) {
  const features = await prisma.shopFeature.findMany({
    where: { shopId },
    include: { module: true },
    orderBy: { module: { sortOrder: 'asc' } },
  });

  return features.map((f) => ({
    moduleId: f.moduleId,
    name: f.module.name,
    icon: f.module.icon,
    description: f.module.description,
    target: f.module.target,
    config: f.config ? JSON.parse(f.config) : null,
    isEnabled: f.isEnabled,
  }));
}

/**
 * 직원의 권한 목록 조회
 */
export async function getStaffPermissions(memberId: string) {
  return prisma.staffPermission.findMany({
    where: { memberId },
    include: { module: true },
  });
}
