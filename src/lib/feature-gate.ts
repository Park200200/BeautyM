// BeautyM - Feature Gate
// 모듈 활성화 여부 및 용량 한도 체크 유틸리티

import { ModuleId, ShopFeatureConfig } from '@/types/modules';

interface ShopFeature {
  moduleId: string;
  isEnabled: boolean;
  config: ShopFeatureConfig | null;
}

export type FeatureCheckResult =
  | { allowed: true }
  | { allowed: false; reason: 'disabled'; message: string }
  | { allowed: false; reason: 'limit_exceeded'; message: string };

/**
 * 특정 모듈이 매장에서 활성화되어 있는지 체크
 */
export function checkModuleEnabled(
  shopFeatures: ShopFeature[],
  moduleId: ModuleId
): FeatureCheckResult {
  const feature = shopFeatures.find((f) => f.moduleId === moduleId);

  if (!feature || !feature.isEnabled) {
    return {
      allowed: false,
      reason: 'disabled',
      message: '이 기능은 현재 비활성 상태입니다. 본사에 문의하세요.',
    };
  }

  return { allowed: true };
}

/**
 * 용량 한도 체크 (직원 수, 고객 수, 매장 수 등)
 */
export function checkCapacityLimit(
  shopFeatures: ShopFeature[],
  moduleId: ModuleId,
  configKey: keyof ShopFeatureConfig,
  currentCount: number
): FeatureCheckResult {
  const feature = shopFeatures.find((f) => f.moduleId === moduleId);

  if (!feature || !feature.isEnabled) {
    return {
      allowed: false,
      reason: 'disabled',
      message: '이 기능은 현재 비활성 상태입니다. 본사에 문의하세요.',
    };
  }

  const config = feature.config;
  if (!config) return { allowed: true };

  const limit = config[configKey] as number | undefined;
  
  // -1은 무제한
  if (limit === undefined || limit === -1) {
    return { allowed: true };
  }

  if (currentCount >= limit) {
    const limitLabels: Record<string, string> = {
      maxCustomers: '고객',
      maxStaff: '직원',
      maxBranches: '매장',
    };
    const label = limitLabels[configKey as string] || configKey;
    return {
      allowed: false,
      reason: 'limit_exceeded',
      message: `${label} 수 한도(${limit}명)에 도달했습니다. 본사에 문의하세요.`,
    };
  }

  return { allowed: true };
}

/**
 * 모듈의 세부 설정값 조회
 */
export function getModuleConfig<T = unknown>(
  shopFeatures: ShopFeature[],
  moduleId: ModuleId,
  configKey: string,
  defaultValue: T
): T {
  const feature = shopFeatures.find((f) => f.moduleId === moduleId);
  if (!feature?.config) return defaultValue;
  
  const value = (feature.config as Record<string, unknown>)[configKey];
  return (value as T) ?? defaultValue;
}
