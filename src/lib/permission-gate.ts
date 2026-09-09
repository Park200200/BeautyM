// BeautyM - Permission Gate
// 직원별 메뉴 접근 권한 체크 유틸리티

import { ModuleId } from '@/types/modules';

interface StaffPermission {
  moduleId: string;
  isAllowed: boolean;
}

export type PermissionCheckResult =
  | { allowed: true }
  | { allowed: false; message: string };

/**
 * 직원이 특정 모듈에 접근 권한이 있는지 체크
 * Owner는 항상 허용, Staff만 체크
 */
export function checkStaffPermission(
  role: 'OWNER' | 'STAFF' | 'CUSTOMER',
  permissions: StaffPermission[],
  moduleId: ModuleId
): PermissionCheckResult {
  // Owner는 모든 모듈 접근 가능
  if (role === 'OWNER') {
    return { allowed: true };
  }

  // Customer는 관리 모듈 접근 불가
  if (role === 'CUSTOMER') {
    return {
      allowed: false,
      message: '접근 권한이 없습니다.',
    };
  }

  // Staff는 원장이 부여한 권한만
  const permission = permissions.find((p) => p.moduleId === moduleId);

  if (!permission || !permission.isAllowed) {
    return {
      allowed: false,
      message: '이 메뉴에 대한 접근 권한이 없습니다. 원장에게 문의하세요.',
    };
  }

  return { allowed: true };
}

/**
 * 직원의 접근 가능한 모듈 목록 필터링
 * Owner는 활성화된 모든 모듈, Staff는 허용된 모듈만
 */
export function getAccessibleModules(
  role: 'OWNER' | 'STAFF' | 'CUSTOMER',
  enabledModuleIds: ModuleId[],
  permissions: StaffPermission[]
): ModuleId[] {
  if (role === 'OWNER') {
    return enabledModuleIds;
  }

  if (role === 'STAFF') {
    const allowedModuleIds = permissions
      .filter((p) => p.isAllowed)
      .map((p) => p.moduleId);

    return enabledModuleIds.filter((id) =>
      allowedModuleIds.includes(id)
    );
  }

  return [];
}
