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
    const { status, managementData, cancelReason, startTime, endTime, staffId } = body;

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

    // 예약 변경(날짜/시간/담당자) - status 없이 호출 시
    if (!status && (startTime || staffId)) {
      const updateData: any = {};
      if (startTime) updateData.startTime = new Date(startTime);
      if (endTime) updateData.endTime = new Date(endTime);
      if (staffId) updateData.staffId = staffId;
      const updated = await prisma.reservation.update({
        where: { id: reservationId },
        data: updateData,
        include: { customer: true, staff: { include: { user: true } }, menu: true },
      });
      return NextResponse.json(updated);
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

      // 2. 되돌리기: CONFIRMED으로 복원 시 기존 자동생성 시술카드 삭제
      if (status === 'CONFIRMED' && existingReservation.customerRecord) {
        const autoContents = ['시술 완료', '예약 취소', '당일 노쇼'];
        const content = existingReservation.customerRecord.content || '';
        if (autoContents.some(ac => content.startsWith(ac))) {
          await tx.customerRecord.delete({ where: { id: existingReservation.customerRecord.id } });
          // 완료→되돌리기 시 방문횟수 복원
          if (content.startsWith('시술 완료')) {
            await tx.shopMember.update({
              where: { id: existingReservation.customerId },
              data: { visitCount: { decrement: 1 } }
            });
          }
        }
      }

      // 3. Automatic record logic
      if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status) && !existingReservation.customerRecord) {
        let content = '';
        if (status === 'COMPLETED') content = '시술 완료';
        else if (status === 'CANCELLED') content = cancelReason ? `예약 취소: ${cancelReason}` : '예약 취소';
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
