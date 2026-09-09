import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MODULE_REGISTRY } from '@/lib/modules';

function getDefaultConfig() {
  return MODULE_REGISTRY
    .filter(m => m.target === 'ADMIN')
    .map(m => ({
      moduleId: m.id,
      name: m.name,
      visible: true,
      sortOrder: m.sortOrder,
    }));
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  try {
    const { shopSlug } = await params;
    const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    let config = getDefaultConfig();
    if (shop.sidebarConfig) {
      try { config = JSON.parse(shop.sidebarConfig); } catch {}
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Failed to get sidebar config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  try {
    const { shopSlug } = await params;
    const body = await request.json();
    const { config } = body;

    const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    if (!Array.isArray(config)) {
      return NextResponse.json({ error: 'config must be an array' }, { status: 400 });
    }

    await prisma.shop.update({
      where: { slug: shopSlug },
      data: { sidebarConfig: JSON.stringify(config) },
    });

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Failed to save sidebar config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
