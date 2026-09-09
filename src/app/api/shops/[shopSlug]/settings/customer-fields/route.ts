import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  const { shopSlug } = await params;
  
  try {
    const shop = await prisma.shop.findUnique({
      where: { slug: shopSlug },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const defaultFields = [
      { name: '피부정보', sortOrder: 0, fields: ['피부타입', '알레르기'] },
      { name: '메모', sortOrder: 1, fields: ['메모'] }
    ];

    const fields = shop.customerFields 
      ? JSON.parse(shop.customerFields as string) 
      : defaultFields;

    return NextResponse.json({ fields });
  } catch (error) {
    console.error('Failed to fetch customer fields:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  const { shopSlug } = await params;
  
  try {
    const body = await request.json();
    const { fields } = body;

    if (!Array.isArray(fields)) {
      return NextResponse.json({ error: 'Invalid fields format' }, { status: 400 });
    }

    // Validation: 탭 이름 중복 체크
    const tabNames = new Set();
    for (const tab of fields) {
      if (!tab.name || typeof tab.name !== 'string' || tab.name.trim() === '') {
        return NextResponse.json({ error: 'Tab name cannot be empty' }, { status: 400 });
      }
      if (tabNames.has(tab.name)) {
        return NextResponse.json({ error: `Duplicate tab name: ${tab.name}` }, { status: 400 });
      }
      tabNames.add(tab.name);

      // fields 배열 기본값 처리
      if (!Array.isArray(tab.fields)) {
        tab.fields = [tab.name];
      }
    }

    const updatedShop = await prisma.shop.update({
      where: { slug: shopSlug },
      data: {
        customerFields: JSON.stringify(fields)
      }
    });

    return NextResponse.json({ fields: JSON.parse(updatedShop.customerFields as string) });
  } catch (error) {
    console.error('Failed to update customer fields:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
