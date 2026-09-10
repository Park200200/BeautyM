import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.FROM_EMAIL || 'BeautyM <noreply@beautym.shop>';

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!resend) {
    console.log(`[EMAIL 미설정] To: ${to}, Subject: ${subject}`);
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
    if (error) {
      console.error('이메일 발송 실패:', error);
      return false;
    }
    console.log(`✅ 이메일 발송: ${to}`);
    return true;
  } catch (e) {
    console.error('이메일 발송 에러:', e);
    return false;
  }
}

// 예약 확인 이메일 템플릿
export function reservationEmailHtml(customerName: string, menuName: string, dateStr: string, timeStr: string, shopName: string) {
  return `
  <div style="max-width:480px;margin:0 auto;font-family:'Apple SD Gothic Neo',sans-serif;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #f0e4e0">
    <div style="background:linear-gradient(135deg,#E8B4B8,#D4A0A5);padding:24px 20px;text-align:center">
      <h1 style="margin:0;color:#fff;font-size:18px">💆 예약이 확인되었습니다</h1>
    </div>
    <div style="padding:24px 20px">
      <p style="color:#333;font-size:15px;margin:0 0 16px"><strong>${customerName}</strong>님, 예약이 확정되었습니다.</p>
      <div style="background:#FFF5F5;border-radius:12px;padding:16px;margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="color:#999;font-size:13px">시술</span>
          <span style="font-weight:700;font-size:14px;color:#333">${menuName}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="color:#999;font-size:13px">날짜</span>
          <span style="font-weight:600;font-size:14px;color:#333">${dateStr}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:#999;font-size:13px">시간</span>
          <span style="font-weight:600;font-size:14px;color:#333">${timeStr}</span>
        </div>
      </div>
      <p style="color:#999;font-size:12px;text-align:center;margin:16px 0 0">📍 ${shopName}</p>
    </div>
    <div style="background:#f9f5f4;padding:16px;text-align:center">
      <p style="color:#999;font-size:11px;margin:0">BeautyM 뷰티 매장 관리</p>
    </div>
  </div>`;
}

// 결제 완료 이메일 템플릿
export function paymentEmailHtml(customerName: string, menuName: string, amount: number, shopName: string) {
  return `
  <div style="max-width:480px;margin:0 auto;font-family:'Apple SD Gothic Neo',sans-serif;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #D1FAE5">
    <div style="background:linear-gradient(135deg,#34D399,#10B981);padding:24px 20px;text-align:center">
      <h1 style="margin:0;color:#fff;font-size:18px">💳 결제가 완료되었습니다</h1>
    </div>
    <div style="padding:24px 20px">
      <p style="color:#333;font-size:15px;margin:0 0 16px"><strong>${customerName}</strong>님, 감사합니다.</p>
      <div style="background:#ECFDF5;border-radius:12px;padding:16px;margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="color:#065F46;font-size:13px">시술</span>
          <span style="font-weight:700;font-size:14px;color:#333">${menuName}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:#065F46;font-size:13px">결제 금액</span>
          <span style="font-weight:800;font-size:16px;color:#059669">${amount.toLocaleString()}원</span>
        </div>
      </div>
      <p style="color:#999;font-size:12px;text-align:center;margin:16px 0 0">📍 ${shopName}</p>
    </div>
    <div style="background:#f0fdf4;padding:16px;text-align:center">
      <p style="color:#999;font-size:11px;margin:0">BeautyM 뷰티 매장 관리</p>
    </div>
  </div>`;
}

// 쿠폰 발급 이메일 템플릿
export function couponEmailHtml(customerName: string, couponName: string, shopName: string) {
  return `
  <div style="max-width:480px;margin:0 auto;font-family:'Apple SD Gothic Neo',sans-serif;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #FEF3C7">
    <div style="background:linear-gradient(135deg,#FBBF24,#F59E0B);padding:24px 20px;text-align:center">
      <h1 style="margin:0;color:#fff;font-size:18px">🎟️ 새 쿠폰이 도착했습니다</h1>
    </div>
    <div style="padding:24px 20px">
      <p style="color:#333;font-size:15px;margin:0 0 16px"><strong>${customerName}</strong>님께 쿠폰이 발급되었습니다!</p>
      <div style="background:#FFFBEB;border-radius:12px;padding:20px;text-align:center;margin-bottom:16px;border:2px dashed #F59E0B">
        <p style="margin:0;font-size:18px;font-weight:800;color:#92400E">${couponName}</p>
      </div>
      <p style="color:#999;font-size:12px;text-align:center;margin:16px 0 0">📍 ${shopName}</p>
    </div>
    <div style="background:#fffdf7;padding:16px;text-align:center">
      <p style="color:#999;font-size:11px;margin:0">BeautyM 뷰티 매장 관리</p>
    </div>
  </div>`;
}
