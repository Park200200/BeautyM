import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopSlug: string; menuId: string }> }
) {
  try {
    const { shopSlug, menuId } = await params;

    const shop = await prisma.shop.findUnique({
      where: { slug: shopSlug },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const menu = await prisma.menu.findUnique({
      where: { id: menuId, shopId: shop.id },
      include: { category: true }
    });

    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }

    let parsedFields = null;
    if (menu.managementFields) {
      try {
        parsedFields = JSON.parse(menu.managementFields);
      } catch (e) {
        parsedFields = null;
      }
    }

    return NextResponse.json({
      ...menu,
      managementFields: parsedFields
    });
  } catch (error) {
    console.error('Failed to get menu:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ shopSlug: string; menuId: string }> }
) {
  try {
    const { shopSlug, menuId } = await params;
    const body = await request.json();
    const { name, price, duration, categoryId, managementFields, description, sessions, sessionInterval, isActive, isPublic, treatmentIds } = body;

    const shop = await prisma.shop.findUnique({
      where: { slug: shopSlug },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const existingMenu = await prisma.menu.findUnique({
      where: { id: menuId, shopId: shop.id },
    });

    if (!existingMenu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (price !== undefined) data.price = price;
    if (duration !== undefined) data.duration = duration;
    if (sessions !== undefined) data.sessions = sessions;
    if (sessionInterval !== undefined) data.sessionInterval = sessionInterval;
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (description !== undefined) data.description = description;
    if (isActive !== undefined) data.isActive = isActive;
    if (isPublic !== undefined) data.isPublic = isPublic;
    if (managementFields !== undefined) data.managementFields = managementFields ? JSON.stringify(managementFields) : null;

    const updatedMenu = await prisma.menu.update({
      where: { id: menuId },
      data,
    });

    // Sync treatments
    if (treatmentIds !== undefined) {
      await prisma.menuTreatment.deleteMany({ where: { menuId } });
      if (Array.isArray(treatmentIds) && treatmentIds.length > 0) {
        await prisma.menuTreatment.createMany({
          data: treatmentIds.map((tid: string, i: number) => ({ menuId, treatmentId: tid, sortOrder: i }))
        });
      }
    }

    return NextResponse.json(updatedMenu);
  } catch (error) {
    console.error('Failed to update menu:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ shopSlug: string; menuId: string }> }
) {
  try {
    const { shopSlug, menuId } = await params;

    const shop = await prisma.shop.findUnique({
      where: { slug: shopSlug },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const existingMenu = await prisma.menu.findUnique({
      where: { id: menuId, shopId: shop.id },
    });

    if (!existingMenu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }

    await prisma.menu.delete({
      where: { id: menuId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete menu:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
