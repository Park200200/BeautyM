import './booking.css';

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
