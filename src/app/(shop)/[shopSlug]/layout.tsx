import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getEnabledModules, getAllShopFeatures, getStaffPermissions } from '@/lib/tenant';
import { getAccessibleModules } from '@/lib/permission-gate';
import { ModuleId } from '@/types/modules';
import ShopProvider from '@/components/shop/shop-provider';
import Sidebar from '@/components/shop/sidebar';
import Header from '@/components/shop/header';

export default async function ShopLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ shopSlug: string }>;
}) {
  const { shopSlug } = await params;

  // 1. 세션 확인
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('beautym-session');
  if (!sessionCookie) redirect('/auth/login');

  let session;
  try {
    session = JSON.parse(sessionCookie.value);
  } catch {
    redirect('/auth/login');
  }

  // 2. 사용자 조회
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });
  if (!user) redirect('/auth/login');

  // 3. 매장 조회
  const shop = await prisma.shop.findUnique({
    where: { slug: shopSlug },
    include: {
      subscription: { include: { plan: true } },
    },
  });
  if (!shop) redirect('/');

  // 4. 매장 멤버십 확인
  const member = await prisma.shopMember.findUnique({
    where: { userId_shopId: { userId: user.id, shopId: shop.id } },
  });

  // SuperAdmin은 멤버십 없이도 접근 가능
  if (!member && user.globalRole !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const role = user.globalRole === 'SUPER_ADMIN'
    ? 'OWNER' as const
    : (member?.role as 'OWNER' | 'STAFF' | 'CUSTOMER') || 'STAFF';

  // 5. 활성 모듈 조회
  const enabledModules = await getEnabledModules(shop.id);
  const enabledModuleIds = enabledModules.map((m) => m.moduleId) as ModuleId[];

  // 6. 접근 가능한 모듈 계산
  let accessibleModuleIds: ModuleId[];
  if (role === 'OWNER' || user.globalRole === 'SUPER_ADMIN') {
    accessibleModuleIds = enabledModuleIds;
  } else if (member) {
    const permissions = await getStaffPermissions(member.id);
    accessibleModuleIds = getAccessibleModules(
      role,
      enabledModuleIds,
      permissions
    );
  } else {
    accessibleModuleIds = [];
  }

  // 7. 전체 모듈 상태 (비활성 포함 — 사이드바 잠금 표시용)
  const allFeatures = await getAllShopFeatures(shop.id);

  return (
    <ShopProvider
      shop={{
        shopId: shop.id,
        shopSlug: shop.slug,
        shopName: shop.name,
        planName: shop.subscription?.plan.name || 'Free',
      }}
      user={{
        userId: user.id,
        memberId: member?.id || '',
        userName: user.name,
        userProfileImage: user.profileImage,
        userRole: role,
      }}
      enabledModules={allFeatures}
      accessibleModuleIds={accessibleModuleIds}
    >
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <style>{`
            .bm-main-scroll::-webkit-scrollbar { display:none!important; width:0!important; }
            .bm-main-scroll { scrollbar-width:none; -ms-overflow-style:none; }
          `}</style>
          <main className="bm-main-scroll flex-1 overflow-y-auto p-2 sm:p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </ShopProvider>
  );
}
