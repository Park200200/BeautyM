import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopSlug: string; reservationId: string }> }
) {
  try {
    const { shopSlug, reservationId } = await params;

    const shop = await prisma.shop.findUnique({
      where: { slug: shopSlug },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        customer: true,
        staff: {
          include: { user: true }
        },
        menu: true,
        customerRecord: true,
      },
    });

    if (!reservation || reservation.shopId !== shop.id) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    let parsedMenu = undefined;
    if (reservation.menu) {
      let parsedFields = null;
      if (reservation.menu.managementFields) {
        try {
          parsedFields = JSON.parse(reservation.menu.managementFields);
        } catch(e) {
          parsedFields = null;
        }
      }
      parsedMenu = { ...reservation.menu, managementFields: parsedFields };
    }

    return NextResponse.json({
      ...reservation,
      menu: parsedMenu
    });
  } catch (error) {
    console.error('Failed to get reservation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ shopSlug: string; reservationId: string }> }
) {
  try {
    const { shopSlug, reservationId } = await params;
    const body = await request.json();
    const { status, managementData } = body;

    const shop = await prisma.shop.findUnique({
      where: { slug: shopSlug },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const existingReservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        customerRecord: true,
      }
    });

    if (!existingReservation || existingReservation.shopId !== shop.id) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    const updatedReservation = await prisma.$transaction(async (tx) => {
      // 1. Update status
      const res = await tx.reservation.update({
        where: { id: reservationId },
        data: { status },
        include: {
          customer: true,
          staff: { include: { user: true } },
          menu: true,
        }
      });

      // 2. Automatic record logic
      if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status) && !existingReservation.customerRecord) {
        let content = '';
        if (status === 'COMPLETED') content = '시술 완료';
        else if (status === 'CANCELLED') content = '예약 취소';
        else if (status === 'NO_SHOW') content = '당일 노쇼';

        const recordData: any = {
          shopId: shop.id,
          customerId: existingReservation.customerId,
          staffId: existingReservation.staffId,
          reservationId: existingReservation.id,
          content,
        };

        if (status === 'COMPLETED' && managementData) {
          recordData.managementData = JSON.stringify(managementData);
        }

        await tx.customerRecord.create({
          data: recordData
        });

        if (status === 'COMPLETED') {
          // Increase visitCount
          await tx.shopMember.update({
            where: { id: existingReservation.customerId },
            data: { visitCount: { increment: 1 } }
          });
        }
      }

      return res;
    });

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error('Failed to update reservation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
