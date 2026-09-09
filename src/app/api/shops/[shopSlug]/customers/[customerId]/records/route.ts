import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopSlug: string; customerId: string }> }
) {
  try {
    const { shopSlug, customerId } = await params;

    const shop = await prisma.shop.findUnique({
      where: { slug: shopSlug },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const records = await prisma.customerRecord.findMany({
      where: {
        shopId: shop.id,
        customerId: customerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        reservation: {
          include: { menu: { include: { menuTreatments: { include: { treatment: { include: { category: true } } } } } } },
        },
        staff: {
          include: { user: true },
        },
        photos: true,
      },
    });

    const parsedRecords = records.map(record => {
      let parsedManagementData = null;
      if (record.managementData) {
        try {
          parsedManagementData = JSON.parse(record.managementData);
        } catch (e) {
          parsedManagementData = null;
        }
      }

      let parsedMenu = undefined;
      if (record.reservation?.menu) {
        let parsedFields = null;
        if (record.reservation.menu.managementFields) {
          try {
            parsedFields = JSON.parse(record.reservation.menu.managementFields);
          } catch(e) {
            parsedFields = null;
          }
        }
        parsedMenu = { ...record.reservation.menu, managementFields: parsedFields };
      }

      const parsedReservation = record.reservation ? { ...record.reservation, menu: parsedMenu } : null;

      return {
        ...record,
        managementData: parsedManagementData,
        reservation: parsedReservation,
      };
    });

    return NextResponse.json(parsedRecords);
  } catch (error) {
    console.error('Failed to get customer records:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopSlug: string; customerId: string }> }
) {
  try {
    const { shopSlug, customerId } = await params;
    const body = await request.json();
    const { content, skinCondition, productsUsed, staffId, managementData, sessionNumber, nextReservationDate, reservationId, photos } = body;

    const shop = await prisma.shop.findUnique({
      where: { slug: shopSlug },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const record = await prisma.customerRecord.create({
      data: {
        shopId: shop.id,
        customerId,
        staffId: staffId || null,
        content: content || null,
        skinCondition: skinCondition || null,
        productsUsed: productsUsed || null,
        managementData: managementData ? JSON.stringify(managementData) : null,
        sessionNumber: sessionNumber ? parseInt(sessionNumber) : null,
        nextReservationDate: nextReservationDate ? new Date(nextReservationDate) : null,
        reservationId: reservationId || null,
        photos: photos && photos.length > 0 ? {
          create: photos.map((p: { url: string; type: string }) => ({ url: p.url, type: p.type || 'BEFORE' }))
        } : undefined,
      },
      include: {
        staff: {
          include: { user: true },
        },
        photos: true,
      }
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Failed to create customer record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
