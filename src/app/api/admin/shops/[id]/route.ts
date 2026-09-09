// BeautyM - 매장 상세 API
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 매장 상세 조회
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shop = await prisma.shop.findUnique({
      where: { id },
      include: {
        subscription: { include: { plan: true } },
        members: { include: { user: true } },
        features: { include: { module: true } },
      },
    });

    if (!shop) {
      return NextResponse.json({ error: '매장을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      phone: shop.phone,
      address: shop.address,
      description: shop.description,
      bizNumber: shop.bizNumber,
      bizType: shop.bizType,
      bizCategory: shop.bizCategory,
      taxEmail: shop.taxEmail,
      bizLicenseUrl: shop.bizLicenseUrl,
      isActive: shop.isActive,
      createdAt: shop.createdAt,
      subscription: shop.subscription ? {
        id: shop.subscription.id,
        planId: shop.subscription.planId,
        planName: shop.subscription.plan.name,
        planPrice: shop.subscription.plan.price,
        status: shop.subscription.status,
        currentPeriodEnd: shop.subscription.currentPeriodEnd,
      } : null,
      members: shop.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        phone: m.user.phone,
        role: m.role,
        isActive: m.isActive,
        createdAt: m.createdAt,
      })),
      features: shop.features.map((f) => ({
        id: f.id,
        moduleId: f.moduleId,
        moduleName: f.module.name,
        moduleDescription: f.module.description,
        isEnabled: f.isEnabled,
        config: f.config ? JSON.parse(f.config) : null,
      })),
    });
  } catch (error) {
    console.error('Shop detail error:', error);
    return NextResponse.json({ error: '조회 실패' }, { status: 500 });
  }
}

// 매장 정보 수정
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    // 기본 정보 수정
    if (action === 'updateInfo') {
      const { name, phone, ownerName, ownerTitle, ownerPhone, salesPerson, address, bizNumber, bizType, bizCategory, taxEmail, isActive } = body;
      await prisma.shop.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(phone !== undefined && { phone }),
          ...(ownerName !== undefined && { ownerName }),
          ...(ownerTitle !== undefined && { ownerTitle }),
          ...(ownerPhone !== undefined && { ownerPhone }),
          ...(salesPerson !== undefined && { salesPerson }),
          ...(address !== undefined && { address }),
          ...(bizNumber !== undefined && { bizNumber }),
          ...(bizType !== undefined && { bizType }),
          ...(bizCategory !== undefined && { bizCategory }),
          ...(taxEmail !== undefined && { taxEmail }),
          ...(isActive !== undefined && { isActive }),
        },
      });
      return NextResponse.json({ success: true, message: '매장 정보가 수정되었습니다.' });
    }

    // 구독 정보 직접 수정 (가격, 상태, 결제일)
    if (action === 'updateSubscription') {
      const { price, status, periodEnd } = body;
      const existing = await prisma.subscription.findUnique({ where: { shopId: id } });
      if (!existing) {
        return NextResponse.json({ error: '구독 정보가 없습니다.' }, { status: 404 });
      }

      // 플랜 가격 수정
      if (price !== undefined) {
        await prisma.plan.update({
          where: { id: existing.planId },
          data: { price: parseInt(price) },
        });
      }

      // 구독 상태/결제일 수정
      await prisma.subscription.update({
        where: { shopId: id },
        data: {
          ...(status && { status }),
          ...(periodEnd && { currentPeriodEnd: new Date(periodEnd) }),
        },
      });

      return NextResponse.json({ success: true, message: '구독 정보가 수정되었습니다.' });
    }

    // 플랜 변경
    if (action === 'changePlan') {
      const { planId } = body;
      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan) return NextResponse.json({ error: '플랜을 찾을 수 없습니다.' }, { status: 404 });

      const existing = await prisma.subscription.findUnique({ where: { shopId: id } });
      if (existing) {
        await prisma.subscription.update({
          where: { shopId: id },
          data: {
            planId,
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      } else {
        await prisma.subscription.create({
          data: {
            shopId: id, planId, status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }

      // 플랜에 따른 모듈 자동 활성화
      const planModules = await prisma.planModule.findMany({ where: { planId } });
      const allFeatures = await prisma.shopFeature.findMany({ where: { shopId: id } });
      for (const feature of allFeatures) {
        const shouldEnable = planModules.some((pm) => pm.moduleId === feature.moduleId);
        await prisma.shopFeature.update({
          where: { id: feature.id },
          data: { isEnabled: shouldEnable },
        });
      }

      return NextResponse.json({ success: true, message: `플랜이 "${plan.name}"으로 변경되었습니다.` });
    }

    // 모듈 ON/OFF 토글
    if (action === 'toggleModule') {
      const { featureId, isEnabled } = body;
      await prisma.shopFeature.update({
        where: { id: featureId },
        data: { isEnabled },
      });
      return NextResponse.json({ success: true });
    }

    // 모듈 설정(용량) 변경
    if (action === 'updateModuleConfig') {
      const { featureId, config } = body;
      await prisma.shopFeature.update({
        where: { id: featureId },
        data: { config: JSON.stringify(config) },
      });
      return NextResponse.json({ success: true, message: '설정이 저장되었습니다.' });
    }

    return NextResponse.json({ error: '유효하지 않은 action' }, { status: 400 });
  } catch (error) {
    console.error('Shop update error:', error);
    return NextResponse.json({ error: '수정 실패' }, { status: 500 });
  }
}
