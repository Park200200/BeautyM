import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await prisma.shop.findUnique({
    where: { slug: shopSlug },
    include: { subscription: { include: { plan: true } } },
  });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  return NextResponse.json({
    id: shop.id,
    name: shop.name,
    slug: shop.slug,
    phone: shop.phone,
    address: shop.address,
    description: shop.description,
    businessHours: shop.businessHours,
    logoUrl: shop.logoUrl,
    ownerName: shop.ownerName,
    ownerTitle: shop.ownerTitle,
    ownerPhone: shop.ownerPhone,
    bizNumber: shop.bizNumber,
    bizType: shop.bizType,
    bizCategory: shop.bizCategory,
    taxEmail: shop.taxEmail,
    bizLicenseUrl: shop.bizLicenseUrl,
    planName: shop.subscription?.plan.name || 'Free',
    pointRate: shop.pointRate,
    gradeSettings: shop.gradeSettings,
    paymentRates: shop.paymentRates,
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  try {
    const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const body = await req.json();
    const allowed = ['name', 'phone', 'address', 'description', 'businessHours', 'logoUrl',
      'ownerName', 'ownerTitle', 'ownerPhone', 'bizNumber', 'bizType', 'bizCategory', 'taxEmail', 'bizLicenseUrl', 'pointRate', 'gradeSettings', 'paymentRates'];

    const data: Record<string, any> = {};
    for (const key of allowed) {
      if (key in body) data[key] = body[key];
    }

    const updated = await prisma.shop.update({ where: { id: shop.id }, data });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: '\uC218\uC815 \uC2E4\uD328' }, { status: 500 });
  }
}
