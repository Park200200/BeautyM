// BeautyM - 가입 신청 상태 변경 API (승인/거절) - 상세 프로세스
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    const registration = await prisma.shopRegistration.findUnique({ where: { id } });
    if (!registration) {
      return NextResponse.json({ error: '신청을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (registration.status !== 'PENDING') {
      return NextResponse.json({ error: '이미 처리된 신청입니다.' }, { status: 400 });
    }

    // =============================================
    // 거절 처리
    // =============================================
    if (action === 'reject') {
      const { rejectionType, rejectedReason, salesPerson, reviewedBy } = body;

      await prisma.shopRegistration.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionType: rejectionType || null,
          rejectedReason: rejectedReason || null,
          salesPerson: salesPerson || null,
          reviewedBy: reviewedBy || null,
          reviewedAt: new Date(),
          isReusable: true, // 영업자료 재활용 가능
          notifiedAt: new Date(), // 알림 발송 시각 기록
        },
      });

      return NextResponse.json({
        success: true,
        message: `"${registration.shopName}" 신청이 거절되었습니다. 거절 알림이 발송되었습니다.`,
        notification: {
          type: 'REJECTION',
          to: registration.email,
          phone: registration.phone,
          shopName: registration.shopName,
          rejectionType,
          rejectedReason,
        },
      });
    }

    // =============================================
    // 승인 처리 (PENDING_SETUP 상태로 전환)
    // =============================================
    if (action === 'approve') {
      const { approvalType, salesPerson, reviewedBy } = body;

      // 이메일 중복 확인
      const existingUser = await prisma.user.findUnique({
        where: { email: registration.email },
      });
      if (existingUser) {
        return NextResponse.json({ error: '이미 등록된 이메일입니다.' }, { status: 409 });
      }

      // slug 생성
      const slug = registration.shopName
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        || `shop-${Date.now()}`;
      const existingShop = await prisma.shop.findUnique({ where: { slug } });
      const finalSlug = existingShop ? `${slug}-${Date.now().toString(36)}` : slug;

      const passwordHash = await bcrypt.hash('owner1234', 10);

      // 트랜잭션: 매장+원장 생성 (구독은 미설정 상태)
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: registration.ownerName,
            email: registration.email,
            phone: registration.phone,
            passwordHash,
            globalRole: 'USER',
          },
        });

        const shop = await tx.shop.create({
          data: {
            name: registration.shopName,
            slug: finalSlug,
            phone: registration.phone,
            address: registration.address || null,
            bizNumber: registration.bizNumber || null,
            bizType: registration.bizType || null,
            bizCategory: registration.bizCategory || null,
            taxEmail: registration.taxEmail || null,
            bizLicenseUrl: registration.bizLicenseUrl || null,
            isActive: false, // 구독 설정 전까지 비활성
          },
        });

        await tx.shopMember.create({
          data: { userId: user.id, shopId: shop.id, role: 'OWNER' },
        });

        // 기본 모듈 레코드 생성 (모두 비활성)
        const allModules = await tx.featureModule.findMany();
        for (const mod of allModules) {
          await tx.shopFeature.create({
            data: { shopId: shop.id, moduleId: mod.id, isEnabled: false },
          });
        }

        // 신청 상태 → PENDING_SETUP (구독 설정 대기)
        await tx.shopRegistration.update({
          where: { id },
          data: {
            status: 'PENDING_SETUP',
            approvalType: approvalType || null,
            salesPerson: salesPerson || null,
            reviewedBy: reviewedBy || null,
            reviewedAt: new Date(),
            createdShopId: shop.id,
          },
        });

        return { shop, user };
      });

      return NextResponse.json({
        success: true,
        message: `"${registration.shopName}" 매장이 생성되었습니다. 구독 설정을 진행하세요.`,
        shopId: result.shop.id,
        shopSlug: result.shop.slug,
        registrationId: id,
      });
    }

    // =============================================
    // 구독 설정 완료 (PENDING_SETUP → APPROVED)
    // =============================================
    if (action === 'completeSetup') {
      const { planId } = body;

      if (!registration.createdShopId) {
        return NextResponse.json({ error: '생성된 매장이 없습니다.' }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        // 구독 생성
        if (planId) {
          const plan = await tx.plan.findUnique({ where: { id: planId } });
          if (plan) {
            // 기존 구독 삭제 후 재생성
            await tx.subscription.deleteMany({ where: { shopId: registration.createdShopId! } });
            await tx.subscription.create({
              data: {
                shopId: registration.createdShopId!,
                planId: plan.id,
                status: 'ACTIVE',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            });

            // 플랜에 따른 모듈 활성화
            const planModules = await tx.planModule.findMany({ where: { planId } });
            const allFeatures = await tx.shopFeature.findMany({ where: { shopId: registration.createdShopId! } });
            for (const feat of allFeatures) {
              const shouldEnable = planModules.some((pm) => pm.moduleId === feat.moduleId);
              await tx.shopFeature.update({
                where: { id: feat.id },
                data: { isEnabled: shouldEnable },
              });
            }
          }
        }

        // 매장 활성화
        await tx.shop.update({
          where: { id: registration.createdShopId! },
          data: { isActive: true },
        });

        // 최종 승인 완료
        await tx.shopRegistration.update({
          where: { id },
          data: {
            status: 'APPROVED',
            notifiedAt: new Date(),
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: `구독 설정이 완료되었습니다. 매장이 활성화되고 승인 알림이 발송되었습니다.`,
        notification: {
          type: 'APPROVAL',
          to: registration.email,
          phone: registration.phone,
          shopName: registration.shopName,
        },
      });
    }

    return NextResponse.json({ error: '유효하지 않은 action' }, { status: 400 });
  } catch (error) {
    console.error('Registration action error:', error);
    return NextResponse.json({ error: '처리 실패' }, { status: 500 });
  }
}
