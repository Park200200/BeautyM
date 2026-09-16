import { NextResponse } from 'next/server';

// 본사 공지사항 (추후 DB 모델로 전환 가능)
const NOTICES = [
  {
    id: 'n1', title: '9월 신제품 입고 안내', category: '신제품',
    content: '안녕하세요, BeautyM 본사입니다.\n\n9월 신제품이 입고되었습니다.\n\n1. 아쿠아 히알루론 수분크림 50ml - 코스알엑스\n2. 일회용 마이크로니들 패치 세트 - 메디팜\n\n상품 구매 메뉴에서 확인하시고 주문해 주세요.\n감사합니다.',
    date: '2026-09-15', isImportant: true,
  },
  {
    id: 'n2', title: '추석 연휴 배송 일정 안내', category: '배송',
    content: '추석 연휴 기간(9/26~9/29) 동안 배송이 중단됩니다.\n\n9월 24일(수)까지 주문하시면 연휴 전 배송 가능합니다.\n연휴 후 첫 배송은 9월 30일(화)입니다.\n\n감사합니다.',
    date: '2026-09-14', isImportant: true,
  },
  {
    id: 'n3', title: '10월 프로모션 안내', category: '이벤트',
    content: '10월 한 달간 전 품목 10% 할인 프로모션을 진행합니다.\n\n기간: 2026년 10월 1일 ~ 10월 31일\n대상: 전 거래처 상품\n할인: 정가 대비 10% 추가 할인\n\n많은 이용 부탁드립니다.',
    date: '2026-09-13', isImportant: false,
  },
  {
    id: 'n4', title: '시스템 점검 안내 (9/20)', category: '시스템',
    content: '시스템 안정화를 위한 정기 점검이 예정되어 있습니다.\n\n일시: 2026년 9월 20일(토) 02:00~06:00\n영향: 해당 시간 동안 서비스 이용이 제한될 수 있습니다.\n\n불편을 드려 죄송합니다.',
    date: '2026-09-10', isImportant: false,
  },
];

export async function GET() {
  return NextResponse.json(NOTICES);
}
