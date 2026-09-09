import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - 시술 상세 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopSlug: string; treatmentId: string }> }
) {
  try {
    const { shopSlug, treatmentId } = await params;

    const shop = await prisma.shop.findUnique({
      where: { slug: shopSlug },
    });

    if (!shop) {
      return NextResponse.json({ error: '매장을 찾을 수 없습니다.' }, { status: 404 });
    }

    const treatment = await prisma.treatment.findFirst({
      where: { id: treatmentId, shopId: shop.id },
      include: {
        category: true,
        menuTreatments: {
          include: {
            menu: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });

    if (!treatment) {
      return NextResponse.json({ error: '시술 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    let parsedPhotos = null;
    if (treatment.photos) {
      try {
        parsedPhotos = JSON.parse(treatment.photos);
      } catch {
        parsedPhotos = treatment.photos;
      }
    }

    const formattedTreatment = {
      ...treatment,
      photos: parsedPhotos,
    };

    return NextResponse.json({
      ...formattedTreatment,
      treatment: formattedTreatment,
    });
  } catch (error) {
    console.error('시술 상세 조회 실패:', error);
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
  }
}

// PATCH - 시술 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ shopSlug: string; treatmentId: string }> }
) {
  try {
    const { shopSlug, treatmentId } = await params;
    const body = await request.json();
    const { categoryId, name, duration, features, equipment, photos, sortOrder } = body;

    const shop = await prisma.shop.findUnique({
      where: { slug: shopSlug },
    });

    if (!shop) {
      return NextResponse.json({ error: '매장을 찾을 수 없습니다.' }, { status: 404 });
    }

    const existingTreatment = await prisma.treatment.findFirst({
      where: { id: treatmentId, shopId: shop.id },
    });

    if (!existingTreatment) {
      return NextResponse.json({ error: '시술 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    // categoryId 변경 시 매장 내 유효한 카테고리인지 확인
    if (categoryId !== undefined && categoryId !== existingTreatment.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, shopId: shop.id },
      });
      if (!category) {
        return NextResponse.json({ error: '해당 매장의 유효한 카테고리를 찾을 수 없습니다.' }, { status: 404 });
      }
    }

    const data: Record<string, any> = {};
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (name !== undefined) data.name = name.trim();
    if (duration !== undefined) data.duration = Number(duration);
    if (features !== undefined) data.features = features;
    if (equipment !== undefined) data.equipment = equipment;
    if (photos !== undefined) {
      data.photos = photos ? (typeof photos === 'string' ? photos : JSON.stringify(photos)) : null;
    }
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);

    const updatedTreatment = await prisma.treatment.update({
      where: { id: treatmentId },
      data,
      include: {
        category: true,
      },
    });

    let parsedPhotos = null;
    if (updatedTreatment.photos) {
      try {
        parsedPhotos = JSON.parse(updatedTreatment.photos);
      } catch {
        parsedPhotos = updatedTreatment.photos;
      }
    }

    const formattedTreatment = {
      ...updatedTreatment,
      photos: parsedPhotos,
    };

    return NextResponse.json({
      ...formattedTreatment,
      treatment: formattedTreatment,
    });
  } catch (error) {
    console.error('시술 수정 실패:', error);
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
  }
}

// DELETE - 시술 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ shopSlug: string; treatmentId: string }> }
) {
  try {
    const { shopSlug, treatmentId } = await params;

    const shop = await prisma.shop.findUnique({
      where: { slug: shopSlug },
    });

    if (!shop) {
      return NextResponse.json({ error: '매장을 찾을 수 없습니다.' }, { status: 404 });
    }

    const existingTreatment = await prisma.treatment.findFirst({
      where: { id: treatmentId, shopId: shop.id },
    });

    if (!existingTreatment) {
      return NextResponse.json({ error: '시술 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 연결된 MenuTreatment cascade 삭제
    await prisma.menuTreatment.deleteMany({
      where: { treatmentId },
    });

    await prisma.treatment.delete({
      where: { id: treatmentId },
    });

    return NextResponse.json({ success: true, message: '시술이 삭제되었습니다.' });
  } catch (error) {
    console.error('시술 삭제 실패:', error);
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
  }
}
