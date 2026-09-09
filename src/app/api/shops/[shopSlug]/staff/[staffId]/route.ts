import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: Promise<{ shopSlug: string; staffId: string }> }) {
  const { shopSlug, staffId } = await params;
  try {
    const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const member = await prisma.shopMember.findUnique({ where: { id: staffId } });
    if (!member || member.shopId !== shop.id) {
      return NextResponse.json({ error: '\uC9C1\uC6D0\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4' }, { status: 404 });
    }

    const body = await req.json();
    const { specialties, isActive, role, jobTitle, name, phone, email, profileImage } = body;

    // User 정보 수정
    const userData: any = {};
    if (name !== undefined) userData.name = name;
    if (phone !== undefined) userData.phone = phone;
    if (email !== undefined) userData.email = email || null;
    if (profileImage !== undefined) userData.profileImage = profileImage || null;
    if (Object.keys(userData).length > 0) {
      await prisma.user.update({ where: { id: member.userId }, data: userData });
    }

    const updated = await prisma.shopMember.update({
      where: { id: staffId },
      data: {
        ...(specialties !== undefined && { specialties }),
        ...(isActive !== undefined && { isActive }),
        ...(role !== undefined && { role }),
        ...(jobTitle !== undefined && { jobTitle }),
      },
      include: { user: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Staff update error:', error);
    return NextResponse.json({ error: '\uC218\uC815 \uC2E4\uD328' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ shopSlug: string; staffId: string }> }) {
  const { shopSlug, staffId } = await params;
  try {
    const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const member = await prisma.shopMember.findUnique({ where: { id: staffId } });
    if (!member || member.shopId !== shop.id) {
      return NextResponse.json({ error: '\uC9C1\uC6D0\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4' }, { status: 404 });
    }
    if (member.role === 'OWNER') {
      return NextResponse.json({ error: '\uC6D0\uC7A5\uB2D8\uC740 \uC0AD\uC81C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4' }, { status: 403 });
    }

    await prisma.shopMember.delete({ where: { id: staffId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Staff delete error:', error);
    return NextResponse.json({ error: '\uC0AD\uC81C \uC2E4\uD328' }, { status: 500 });
  }
}
