import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const customers = await prisma.shopMember.findMany({
    where: { shopId: shop.id, role: 'CUSTOMER' },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ customers });
}

export async function POST(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  try {
    const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop) return NextResponse.json({ error: '\uB9E4\uC7A5\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4' }, { status: 404 });

    const body = await req.json();
    const { name, phone, email, memo, birthday, profileImage } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: '\uC774\uB984\uACFC \uC804\uD654\uBC88\uD638\uB294 \uD544\uC218\uC785\uB2C8\uB2E4' }, { status: 400 });
    }

    // 기존 유저 확인 (전화번호로)
    let user = await prisma.user.findUnique({ where: { phone } });

    if (user) {
      // 이미 해당 매장 고객인지 확인
      const existingMember = await prisma.shopMember.findFirst({
        where: { userId: user.id, shopId: shop.id, role: 'CUSTOMER' },
      });
      if (existingMember) {
        return NextResponse.json({ error: '\uC774\uBBF8 \uB4F1\uB85D\uB41C \uACE0\uAC1D\uC785\uB2C8\uB2E4' }, { status: 409 });
      }
      // 기존 유저에 birthday, profileImage 업데이트
      if (birthday || profileImage) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            ...(birthday && { birthday: new Date(birthday) }),
            ...(profileImage && { profileImage }),
          },
        });
      }
    } else {
      // 새 유저 생성
      user = await prisma.user.create({
        data: {
          name,
          phone,
          email: email || null,
          authType: 'PHONE',
          globalRole: 'USER',
          birthday: birthday ? new Date(birthday) : null,
          profileImage: profileImage || null,
        },
      });
    }

    // ShopMember 생성
    const member = await prisma.shopMember.create({
      data: {
        userId: user.id,
        shopId: shop.id,
        role: 'CUSTOMER',
        memo: memo || null,
      },
      include: { user: true },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create customer:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: '\uC774\uBBF8 \uB4F1\uB85D\uB41C \uC804\uD654\uBC88\uD638 \uB610\uB294 \uC774\uBA54\uC77C\uC785\uB2C8\uB2E4' }, { status: 409 });
    }
    return NextResponse.json({ error: '\uACE0\uAC1D \uB4F1\uB85D \uC2E4\uD328' }, { status: 500 });
  }
}
