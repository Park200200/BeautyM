import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopSlug: string; customerId: string }> }
) {
  const { shopSlug, customerId } = await params;
  
  try {
    const customer = await prisma.shopMember.findFirst({
      where: { 
        id: customerId,
        shop: { slug: shopSlug }
      },
      include: {
        user: true,
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const parsedCustomer = {
      ...customer,
      customData: customer.customData ? JSON.parse(customer.customData as string) : {}
    };

    return NextResponse.json(parsedCustomer);
  } catch (error) {
    console.error('Failed to fetch customer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ shopSlug: string; customerId: string }> }
) {
  const { customerId } = await params;
  
  try {
    const body = await request.json();
    const { skinType, allergies, memo, customData, name, phone, email, birthday, profileImage } = body;

    // shopMember에서 userId 가져오기
    const member = await prisma.shopMember.findUnique({ where: { id: customerId }, select: { userId: true } });
    if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // User 정보 업데이트 (이름, 전화, 이메일, 생년월일, 프로필사진)
    if (name !== undefined || phone !== undefined || email !== undefined || birthday !== undefined || profileImage !== undefined) {
      await prisma.user.update({
        where: { id: member.userId },
        data: {
          ...(name !== undefined && { name }),
          ...(phone !== undefined && { phone }),
          ...(email !== undefined && { email }),
          ...(birthday !== undefined && { birthday: birthday ? new Date(birthday) : null }),
          ...(profileImage !== undefined && { profileImage }),
        },
      });
    }

    const updated = await prisma.shopMember.update({
      where: { id: customerId },
      data: {
        skinType: skinType !== undefined ? skinType : undefined,
        allergies: allergies !== undefined ? allergies : undefined,
        memo: memo !== undefined ? memo : undefined,
        customData: customData !== undefined ? JSON.stringify(customData) : undefined,
      },
      include: { user: true },
    });

    const parsedUpdated = {
      ...updated,
      customData: updated.customData ? JSON.parse(updated.customData as string) : {}
    };

    return NextResponse.json(parsedUpdated);
  } catch (error) {
    console.error('Failed to update customer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
