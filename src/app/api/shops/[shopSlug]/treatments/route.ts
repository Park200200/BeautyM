import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - 시술 목록 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  try {
    const { shopSlug } = await params;

    const shop = await prisma.shop.findUnique({
      where: { slug: shopSlug },
    });

    if (!shop) {
      return NextResponse.json({ error: '매장을 찾을 수 없습니다.' }, { status: 404 });
    }

    const treatments = await prisma.treatment.findMany({
      where: { shopId: shop.id },
      include: { category: true },
      orderBy: [
        { category: { sortOrder: 'asc' } },
        { sortOrder: 'asc' },
      ],
    });

    const parsedTreatments = treatments.map((treatment) => {
      let parsedPhotos = null;
      if (treatment.photos) {
        try {
          parsedPhotos = JSON.parse(treatment.photos);
        } catch {
          parsedPhotos = treatment.photos;
        }
      }
      return {
        ...treatment,
        photos: parsedPhotos,
      };
    });

    return NextResponse.json({ treatments: parsedTreatments });
  } catch (error) {
    console.error('시술 목록 조회 실패:', error);
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
  }
}

// POST - 시술 생성
export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  try {
    const { shopSlug } = await params;
    const body = await request.json();
    const { categoryId, name, duration, features, equipment, photos, sortOrder } = body;

    const shop = await prisma.shop.findUnique({
      where: { slug: shopSlug },
    });

    if (!shop) {
      return NextResponse.json({ error: '매장을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (!categoryId || !name?.trim()) {
      return NextResponse.json({ error: '카테고리와 시술명은 필수 항목입니다.' }, { status: 400 });
    }

    const category = await prisma.category.findFirst({
      where: { id: categoryId, shopId: shop.id },
    });

    if (!category) {
      return NextResponse.json({ error: '해당 매장의 유효한 카테고리를 찾을 수 없습니다.' }, { status: 404 });
    }

    const treatment = await prisma.treatment.create({
      data: {
        shopId: shop.id,
        categoryId,
        name: name.trim(),
        duration: duration !== undefined ? Number(duration) : 60,
        features: features ?? null,
        equipment: equipment ?? null,
        photos: photos ? (typeof photos === 'string' ? photos : JSON.stringify(photos)) : null,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
      },
      include: {
        category: true,
      },
    });

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

    return NextResponse.json(
      {
        ...formattedTreatment,
        treatment: formattedTreatment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('시술 생성 실패:', error);
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
  }
}
