import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const menus = await prisma.menu.findMany({
    where: { shopId: shop.id },
    orderBy: { name: 'asc' },
    include: { category: true, menuTreatments: { include: { treatment: { include: { category: true } } }, orderBy: { sortOrder: 'asc' } } }
  });

  const parsedMenus = menus.map(menu => {
    let parsedFields = null;
    if (menu.managementFields) {
      try {
        parsedFields = JSON.parse(menu.managementFields);
      } catch (e) {
        parsedFields = null;
      }
    }
    return {
      ...menu,
      managementFields: parsedFields
    };
  });

  return NextResponse.json({ menus: parsedMenus });
}

export async function POST(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  try {
    const { shopSlug } = await params;
    const body = await req.json();
    const { name, price, duration, categoryId, managementFields, description, sessions, sessionInterval, treatmentIds } = body;

    const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const menu = await prisma.menu.create({
      data: {
        shopId: shop.id,
        name,
        price,
        duration,
        sessions: sessions || null,
        sessionInterval: sessionInterval || null,
        categoryId,
        description,
        managementFields: managementFields ? JSON.stringify(managementFields) : null,
      }
    });

    // Create treatment links
    if (Array.isArray(treatmentIds) && treatmentIds.length > 0) {
      await prisma.menuTreatment.createMany({
        data: treatmentIds.map((tid: string, i: number) => ({ menuId: menu.id, treatmentId: tid, sortOrder: i }))
      });
    }

    return NextResponse.json({ menu });
  } catch (error) {
    console.error('Failed to create menu:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
