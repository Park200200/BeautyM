// BeautyM - 매장 관리 API (본사 관리자용)
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// 매장 목록 조회
export async function GET() {
  try {
    const shops = await prisma.shop.findMany({
      include: {
        subscription: { include: { plan: true } },
        members: { include: { user: true } },
        features: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = shops.map((shop) => ({
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      phone: shop.phone,
      address: shop.address,
      isActive: shop.isActive,
      createdAt: shop.createdAt,
      plan: shop.subscription?.plan?.name || 'Free',
      planId: shop.subscription?.planId,
      status: shop.subscription?.status || 'NONE',
      owner: shop.members.find((m) => m.role === 'OWNER')
        ? {
            name: shop.members.find((m) => m.role === 'OWNER')!.user.name,
            email: shop.members.find((m) => m.role === 'OWNER')!.user.email,
          }
        : null,
      memberCount: shop.members.filter((m) => m.role !== 'CUSTOMER').length,
      customerCount: shop.members.filter((m) => m.role === 'CUSTOMER').length,
      moduleCount: shop.features.filter((f) => f.isEnabled).length,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Shop list error:', error);
    return NextResponse.json({ error: '매장 목록 조회 실패' }, { status: 500 });
  }
}

// 매장 수동 등록
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { shopName, ownerName, ownerEmail, ownerPhone, planId, address, phone,
      bizNumber, bizType, bizCategory, taxEmail, bizLicenseUrl } = body;

    // 유효성 검증
    if (!shopName || !ownerName || !ownerEmail) {
      return NextResponse.json({ error: '필수 항목을 입력하세요.' }, { status: 400 });
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({ where: { email: ownerEmail } });
    if (existingUser) {
      return NextResponse.json({ error: '이미 등록된 이메일입니다.' }, { status: 409 });
    }

    // slug 생성
    const slug = shopName
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      || `shop-${Date.now()}`;

    // 슬러그 중복 체크
    const existingShop = await prisma.shop.findUnique({ where: { slug } });
    const finalSlug = existingShop ? `${slug}-${Date.now().toString(36)}` : slug;

    // 기본 비밀번호: owner1234
    const passwordHash = await bcrypt.hash('owner1234', 10);

    // 트랜잭션으로 매장+원장+구독+모듈 일괄 생성
    const result = await prisma.$transaction(async (tx) => {
      // 1. 원장 계정 생성
      const user = await tx.user.create({
        data: {
          name: ownerName,
          email: ownerEmail,
          phone: ownerPhone || null,
          passwordHash,
          globalRole: 'USER',
        },
      });

      // 2. 매장 생성
      const shop = await tx.shop.create({
        data: {
          name: shopName,
          slug: finalSlug,
          phone: phone || null,
          address: address || null,
          bizNumber: bizNumber || null,
          bizType: bizType || null,
          bizCategory: bizCategory || null,
          taxEmail: taxEmail || null,
          bizLicenseUrl: bizLicenseUrl || null,
          isActive: true,
        },
      });

      // 3. 원장을 매장 멤버로 등록
      await tx.shopMember.create({
        data: {
          userId: user.id,
          shopId: shop.id,
          role: 'OWNER',
        },
      });

      // 4. 구독 설정
      if (planId) {
        const plan = await tx.plan.findUnique({ where: { id: planId } });
        if (plan) {
          await tx.subscription.create({
            data: {
              shopId: shop.id,
              planId: plan.id,
              status: 'ACTIVE',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
        }
      }

      // 5. 기본 모듈 활성화 (플랜에 따라)
      const planModules = planId
        ? await tx.planModule.findMany({ where: { planId } })
        : [];
      
      const allModules = await tx.featureModule.findMany();
      for (const mod of allModules) {
        const isEnabled = planModules.some((pm) => pm.moduleId === mod.id);
        await tx.shopFeature.create({
          data: {
            shopId: shop.id,
            moduleId: mod.id,
            isEnabled,
          },
        });
      }

      return { shop, user };
    });

    return NextResponse.json({
      success: true,
      shopId: result.shop.id,
      shopSlug: result.shop.slug,
      message: `매장 "${shopName}"이 등록되었습니다. 초기 비밀번호: owner1234`,
    });
  } catch (error) {
    console.error('Shop create error:', error);
    return NextResponse.json({ error: '매장 등록 실패' }, { status: 500 });
  }
}
