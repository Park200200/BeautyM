'use client';

import { ReactNode, useEffect } from 'react';
import { useShopStore } from '@/stores/shop-store';
import { ModuleId } from '@/types/modules';

interface EnabledModule {
  moduleId: string;
  name: string;
  icon: string;
  target: string;
  config: Record<string, unknown> | null;
  isEnabled: boolean;
}

interface ShopProviderProps {
  children: ReactNode;
  shop: {
    shopId: string;
    shopSlug: string;
    shopName: string;
    planName: string;
  };
  user: {
    userId: string;
    memberId: string;
    userName: string;
    userProfileImage?: string | null;
    userRole: 'OWNER' | 'STAFF' | 'CUSTOMER';
  };
  enabledModules: EnabledModule[];
  accessibleModuleIds: ModuleId[];
}

export default function ShopProvider({
  children,
  shop,
  user,
  enabledModules,
  accessibleModuleIds,
}: ShopProviderProps) {
  const { setShop, setUser, setEnabledModules, setAccessibleModuleIds } =
    useShopStore();

  useEffect(() => {
    setShop(shop);
    setUser(user);
    setEnabledModules(enabledModules);
    setAccessibleModuleIds(accessibleModuleIds);
  }, [shop, user, enabledModules, accessibleModuleIds, setShop, setUser, setEnabledModules, setAccessibleModuleIds]);

  return <>{children}</>;
}
