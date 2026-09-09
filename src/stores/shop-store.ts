// BeautyM - Zustand 매장 스토어
// 현재 매장 정보, 활성 모듈, 사용자 권한 관리

import { create } from 'zustand';
import { ModuleId } from '@/types/modules';

interface EnabledModule {
  moduleId: string;
  name: string;
  icon: string;
  target: string;
  config: Record<string, unknown> | null;
  isEnabled: boolean;
}

interface ShopState {
  // 매장 정보
  shopId: string | null;
  shopSlug: string | null;
  shopName: string | null;
  planName: string | null;

  // 사용자 정보
  userId: string | null;
  memberId: string | null;
  userName: string | null;
  userProfileImage: string | null;
  userRole: 'OWNER' | 'STAFF' | 'CUSTOMER' | null;

  // 모듈 상태
  enabledModules: EnabledModule[];
  accessibleModuleIds: ModuleId[];

  // 사이드바
  isSidebarOpen: boolean;

  // Actions
  setShop: (shop: {
    shopId: string;
    shopSlug: string;
    shopName: string;
    planName: string;
  }) => void;
  setUser: (user: {
    userId: string;
    memberId: string;
    userName: string;
    userProfileImage?: string | null;
    userRole: 'OWNER' | 'STAFF' | 'CUSTOMER';
  }) => void;
  setEnabledModules: (modules: EnabledModule[]) => void;
  setAccessibleModuleIds: (ids: ModuleId[]) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  reset: () => void;
}

export const useShopStore = create<ShopState>((set) => ({
  shopId: null,
  shopSlug: null,
  shopName: null,
  planName: null,
  userId: null,
  memberId: null,
  userName: null,
  userProfileImage: null,
  userRole: null,
  enabledModules: [],
  accessibleModuleIds: [],
  isSidebarOpen: true,

  setShop: (shop) =>
    set({
      shopId: shop.shopId,
      shopSlug: shop.shopSlug,
      shopName: shop.shopName,
      planName: shop.planName,
    }),

  setUser: (user) =>
    set({
      userId: user.userId,
      memberId: user.memberId,
      userName: user.userName,
      userProfileImage: user.userProfileImage || null,
      userRole: user.userRole,
    }),

  setEnabledModules: (modules) => set({ enabledModules: modules }),
  setAccessibleModuleIds: (ids) => set({ accessibleModuleIds: ids }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  reset: () =>
    set({
      shopId: null,
      shopSlug: null,
      shopName: null,
      planName: null,
      userId: null,
      memberId: null,
      userName: null,
      userProfileImage: null,
      userRole: null,
      enabledModules: [],
      accessibleModuleIds: [],
    }),
}));
