import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopSlug: string; customerId: string; recordId: string }> }
) {
  try {
    const { shopSlug, customerId, recordId } = await params;

    const shop = await prisma.shop.findUnique({
      where: { slug: shopSlug },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const record = await prisma.customerRecord.findUnique({
      where: { id: recordId },
      include: {
        reservation: {
          include: { menu: true },
        },
        staff: {
          include: { user: true },
        },
        photos: true,
      },
    });

    if (!record || record.shopId !== shop.id || record.customerId !== customerId) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

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

    return NextResponse.json({
      ...record,
      managementData: parsedManagementData,
      reservation: parsedReservation,
    });
  } catch (error) {
    console.error('Failed to get customer record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ shopSlug: string; customerId: string; recordId: string }> }
) {
  try {
    const { shopSlug, customerId, recordId } = await params;
    const body = await request.json();
    const { content, skinCondition, productsUsed, managementData } = body;

    const shop = await prisma.shop.findUnique({
      where: { slug: shopSlug },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const existingRecord = await prisma.customerRecord.findUnique({
      where: { id: recordId },
    });

    if (!existingRecord || existingRecord.shopId !== shop.id || existingRecord.customerId !== customerId) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const updatedRecord = await prisma.customerRecord.update({
      where: { id: recordId },
      data: {
        content,
        skinCondition,
        productsUsed,
        managementData: managementData ? JSON.stringify(managementData) : null,
      },
      include: {
        staff: {
          include: { user: true },
        },
        photos: true,
      }
    });

    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error('Failed to update customer record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ shopSlug: string; customerId: string; recordId: string }> }
) {
  try {
    const { shopSlug, customerId, recordId } = await params;

    const shop = await prisma.shop.findUnique({
      where: { slug: shopSlug },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const existingRecord = await prisma.customerRecord.findUnique({
      where: { id: recordId },
    });

    if (!existingRecord || existingRecord.shopId !== shop.id || existingRecord.customerId !== customerId) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.recordPhoto.deleteMany({
        where: { recordId: recordId }
      }),
      prisma.customerRecord.delete({
        where: { id: recordId }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete customer record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
