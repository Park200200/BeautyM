import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const staff = await prisma.shopMember.findMany({
    where: { shopId: shop.id, role: { in: ['OWNER', 'STAFF'] } },
    include: {
      user: true,
      reservationsAsStaff: {
        where: { status: 'COMPLETED' },
        select: { id: true, menuId: true, startTime: true, menu: { select: { price: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const result = staff.map(s => ({
    id: s.id,
    userId: s.userId,
    role: s.role,
    specialties: s.specialties,
    jobTitle: s.jobTitle,
    isActive: s.isActive,
    createdAt: s.createdAt,
    user: { name: s.user.name, phone: s.user.phone, email: s.user.email, profileImage: s.user.profileImage },
    stats: {
      completedCount: s.reservationsAsStaff.length,
      totalRevenue: s.reservationsAsStaff.reduce((sum, r) => sum + (r.menu?.price || 0), 0),
    },
  }));

  return NextResponse.json({ staff: result });
}

export async function POST(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  try {
    const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop) return NextResponse.json({ error: '\uB9E4\uC7A5\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4' }, { status: 404 });

    const body = await req.json();
    const { name, phone, email, specialties, role, jobTitle, profileImage } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: '\uC774\uB984\uACFC \uC804\uD654\uBC88\uD638\uB294 \uD544\uC218\uC785\uB2C8\uB2E4' }, { status: 400 });
    }

    let user = await prisma.user.findUnique({ where: { phone } });

    if (user) {
      const existing = await prisma.shopMember.findFirst({
        where: { userId: user.id, shopId: shop.id, role: { in: ['OWNER', 'STAFF'] } },
      });
      if (existing) {
        return NextResponse.json({ error: '\uC774\uBBF8 \uB4F1\uB85D\uB41C \uC9C1\uC6D0\uC785\uB2C8\uB2E4' }, { status: 409 });
      }
      if (profileImage) {
        await prisma.user.update({ where: { id: user.id }, data: { profileImage } });
      }
    } else {
      user = await prisma.user.create({
        data: {
          name,
          phone,
          email: email || null,
          authType: 'PHONE',
          globalRole: 'USER',
          profileImage: profileImage || null,
        },
      });
    }

    const member = await prisma.shopMember.create({
      data: {
        userId: user.id,
        shopId: shop.id,
        role: role || 'STAFF',
        specialties: specialties || null,
        jobTitle: jobTitle || null,
      },
      include: { user: true },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error: any) {
    console.error('Staff create error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: '\uC774\uBBF8 \uB4F1\uB85D\uB41C \uC804\uD654\uBC88\uD638 \uB610\uB294 \uC774\uBA54\uC77C\uC785\uB2C8\uB2E4' }, { status: 409 });
    }
    return NextResponse.json({ error: '\uC9C1\uC6D0 \uB4F1\uB85D \uC2E4\uD328' }, { status: 500 });
  }
}
