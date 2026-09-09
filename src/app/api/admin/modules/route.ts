// BeautyM - 모듈 마스터 관리 API (FeatureModule CRUD)
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 전체 모듈 목록 + 사용 매장 수
export async function GET() {
  try {
    const modules = await prisma.featureModule.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { shopFeatures: { where: { isEnabled: true } } } },
      },
    });

    const total = await prisma.shop.count();

    return NextResponse.json({
      modules: modules.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        icon: m.icon,
        target: m.target,
        configSchema: m.configSchema,
        sortOrder: m.sortOrder,
        activeCount: m._count.shopFeatures,
      })),
      totalShops: total,
    });
  } catch (error) {
    console.error('Module list error:', error);
    return NextResponse.json({ error: '조회 실패' }, { status: 500 });
  }
}

// 모듈 추가
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, icon, target, configSchema, sortOrder } = body;

    if (!name) {
      return NextResponse.json({ error: '모듈명은 필수입니다.' }, { status: 400 });
    }

    const mod = await prisma.featureModule.create({
      data: {
        name,
        description: description || '',
        icon: icon || 'Box',
        target: target || 'SHOP',
        configSchema: configSchema || null,
        sortOrder: sortOrder ?? 99,
      },
    });

    // 기존 전체 매장에 비활성 상태로 추가
    const shops = await prisma.shop.findMany({ select: { id: true } });
    for (const shop of shops) {
      await prisma.shopFeature.create({
        data: { shopId: shop.id, moduleId: mod.id, isEnabled: false },
      });
    }

    return NextResponse.json({ success: true, module: mod });
  } catch (error) {
    console.error('Module create error:', error);
    return NextResponse.json({ error: '생성 실패' }, { status: 500 });
  }
}

// 모듈 수정/삭제
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, action, ...data } = body;

    if (action === 'update') {
      const updated = await prisma.featureModule.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.icon !== undefined && { icon: data.icon }),
          ...(data.target !== undefined && { target: data.target }),
          ...(data.sortOrder !== undefined && { sortOrder: parseInt(data.sortOrder) }),
        },
      });
      return NextResponse.json({ success: true, module: updated });
    }

    if (action === 'delete') {
      await prisma.shopFeature.deleteMany({ where: { moduleId: id } });
      await prisma.planModule.deleteMany({ where: { moduleId: id } });
      await prisma.featureModule.delete({ where: { id } });
      return NextResponse.json({ success: true, message: '모듈이 삭제되었습니다.' });
    }

    return NextResponse.json({ error: '유효하지 않은 action' }, { status: 400 });
  } catch (error) {
    console.error('Module action error:', error);
    return NextResponse.json({ error: '처리 실패' }, { status: 500 });
  }
}
