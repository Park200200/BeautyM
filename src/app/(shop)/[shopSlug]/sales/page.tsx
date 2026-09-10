'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { TrendingUp, Calendar, CreditCard, Users, Package, Clock, ChevronLeft, ChevronRight, Banknote, Wallet, ArrowUpRight, ArrowDownRight, X, Printer, Plus, Receipt } from 'lucide-react';

type SalesData = {
  summary: { totalRevenue: number; completedCount: number; totalPayments: number; totalDiscount: number; totalPointUsed: number; paymentCount: number };
  methodSummary: Record<string, number>;
  staffSummary: { name: string; count: number; revenue: number }[];
  menuSummary: { name: string; count: number; revenue: number }[];
  hourly: Record<number, number>;
  daily: Record<string, number>;
  reservations: { id: string; startTime: string; customerName: string; staffName: string; menuName: string; price: number; paymentMethod: string | null; paymentAmount: number | null }[];
};

type UnpaidReservation = {
  id: string; startTime: string; status: string;
  customer?: { user: { name: string } };
  staff?: { user: { name: string } };
  menu?: { name: string; price: number; duration: number };
};

const METHOD_LABELS: Record<string, string> = {
  CARD: '카드', CASH: '현금', TRANSFER: '계좌이체', POINT: '포인트', MIXED: '복합결제', PG_ONLINE: '온라인PG',
};

export default function SalesPage() {
  const mob = useIsMobile();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopSlug = params.shopSlug as string;
  const store = useThemeStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;

  const [period, setPeriod] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);

  // 결제 모달
  const [showPayModal, setShowPayModal] = useState(false);
  const [allUnpaid, setAllUnpaid] = useState<UnpaidReservation[]>([]);
  const [unpaidList, setUnpaidList] = useState<UnpaidReservation[]>([]);
  const [selectedResv, setSelectedResv] = useState<UnpaidReservation | null>(null);
  const [payForm, setPayForm] = useState({ method: 'CARD', discount: 0, pointUsed: 0 });
  const [paying, setPaying] = useState(false);
  const [payCustomerId, setPayCustomerId] = useState<string>('');
  const [payCustomerSearch, setPayCustomerSearch] = useState('');
  const [payCustomers, setPayCustomers] = useState<{id:string; user:{name:string; phone?:string|null}}[]>([]);
  const [showQuickReg, setShowQuickReg] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickRegistering, setQuickRegistering] = useState(false);
  const [payMenus, setPayMenus] = useState<{id:string; name:string; price:number; duration:number; category?:string}[]>([]);
  const [directMenu, setDirectMenu] = useState<{id:string; name:string; price:number; duration:number} | null>(null);

  // 고객 멤버십 정보
  type MemberInfo = { grade: string; points: number; visitCount: number; totalSpent: number };
  type ShopPointSettings = { pointRate: number; paymentRates: { CARD: number; CASH: number; TRANSFER: number }; gradeSettings: Record<string, { threshold: number; pointRate: number; discount: number }> };
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
  const [shopPointSettings, setShopPointSettings] = useState<ShopPointSettings | null>(null);

  // 영수증 모달
  const [receiptData, setReceiptData] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const params = period === 'daily'
        ? `period=daily&date=${selectedDate}`
        : `period=monthly&month=${selectedMonth}`;
      const res = await fetch(`/api/shops/${shopSlug}/sales?${params}`);
      if (res.ok) setData(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchSales(); }, [shopSlug, period, selectedDate, selectedMonth]);

  // 헤더의 결제등록 탭 클릭 시 ?pay=1로 진입 → 모달 열기
  useEffect(() => {
    if (searchParams.get('pay') === '1') {
      openPayModal();
      router.replace(`/${shopSlug}/sales`);
    }
  }, [searchParams]);

  const fmtPrice = (n: number) => n.toLocaleString() + '\uC6D0';
  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    const h = d.getHours();
    const m = d.getMinutes();
    return `${h < 12 ? '\uC624\uC804' : '\uC624\uD6C4'} ${h > 12 ? h - 12 : h}:${String(m).padStart(2, '0')}`;
  };

  const changeDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const changeMonth = (delta: number) => {
    const parts = selectedMonth.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1 + delta, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  // 미결제 예약 조회
  const openPayModal = async () => {
    try {
      const [resRes, setRes, custRes, menuRes] = await Promise.all([
        fetch(`/api/shops/${shopSlug}/reservations`),
        fetch(`/api/shops/${shopSlug}/settings`),
        fetch(`/api/shops/${shopSlug}/customers`),
        fetch(`/api/shops/${shopSlug}/menus`),
      ]);
      if (resRes.ok) {
        const d = await resRes.json();
        const unpaid = (d.reservations || []).filter((r: any) =>
          (r.status === 'COMPLETED' || r.status === 'IN_PROGRESS' || r.status === 'CONFIRMED') && !r.payment
        );
        setAllUnpaid(unpaid);
        setUnpaidList([]); // 고객 선택 전에는 비워둠
      }
      if (setRes.ok) {
        const sd = await setRes.json();
        const pr = sd.paymentRates ? (typeof sd.paymentRates === 'string' ? JSON.parse(sd.paymentRates) : sd.paymentRates) : { CARD: 3, CASH: 5, TRANSFER: 4 };
        const gs = sd.gradeSettings ? (typeof sd.gradeSettings === 'string' ? JSON.parse(sd.gradeSettings) : sd.gradeSettings) : {};
        setShopPointSettings({ pointRate: sd.pointRate || 3, paymentRates: pr, gradeSettings: gs });
      }
      if (custRes.ok) {
        const cd = await custRes.json();
        setPayCustomers(cd.customers || []);
      }
      if (menuRes.ok) {
        const md = await menuRes.json();
        setPayMenus((md.menus || md || []).map((m: any) => ({ id: m.id, name: m.name, price: m.price, duration: m.duration, category: m.category?.name || '' })));
      }
      setPayCustomerId('');
      setPayCustomerSearch('');
      setSelectedResv(null);
      setDirectMenu(null);
      setMemberInfo(null);
      setPayForm({ method: 'CARD', discount: 0, pointUsed: 0 });
      setShowPayModal(true);
    } catch (e) { console.error(e); }
  };

  // 고객 선택 시 해당 고객의 미결제 예약만 필터링 + 멤버십 조회
  const selectPayCustomer = async (custId: string, custName: string) => {
    setPayCustomerId(custId);
    setPayCustomerSearch('');
    setShowQuickReg(false);
    const filtered = allUnpaid.filter((r: any) => r.customer?.user?.name === custName);
    setUnpaidList(filtered);
    setSelectedResv(null);
    setDirectMenu(null);
    setPayForm({ method: 'CARD', discount: 0, pointUsed: 0 });
    // 고객 멤버십 정보 조회
    setMemberInfo(null);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/customers`);
      if (res.ok) {
        const data = await res.json();
        const customers = data.customers || data || [];
        const found = customers.find((c: any) => c.id === custId || c.user?.name === custName);
        if (found) {
          setMemberInfo({
            grade: found.memberGrade || found.grade || 'NORMAL',
            points: found.totalPoints || found.points || 0,
            visitCount: found.visitCount || 0,
            totalSpent: found.totalSpent || 0,
          });
        }
      }
    } catch { /* ignore */ }
  };

  // 빠른 고객 등록 (이름+전화번호만)
  const quickRegisterCustomer = async () => {
    if (!quickName.trim() && !quickPhone.trim()) return;
    setQuickRegistering(true);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: quickName.trim() || '미입력',
          phone: quickPhone.trim() || '',
        }),
      });
      if (res.ok) {
        const newCust = await res.json();
        const custId = newCust.id || newCust.customer?.id;
        const custName = quickName.trim() || '미입력';
        // 고객 목록에 추가
        setPayCustomers(prev => [...prev, { id: custId, user: { name: custName, phone: quickPhone.trim() || null } }]);
        selectPayCustomer(custId, custName);
        setQuickName('');
        setQuickPhone('');
        setShowQuickReg(false);
      }
    } catch (e) { console.error(e); }
    setQuickRegistering(false);
  };

  // 예약 선택 시 고객 멤버십 정보 조회
  const selectReservation = async (r: UnpaidReservation) => {
    setSelectedResv(r);
    setPayForm({ method: 'CARD', discount: 0, pointUsed: 0 });
    setMemberInfo(null);
    // 고객 멤버십 조회
    try {
      const res = await fetch(`/api/shops/${shopSlug}/customers`);
      if (res.ok) {
        const data = await res.json();
        const customers = data.customers || data || [];
        const custName = r.customer?.user?.name;
        const found = customers.find((c: any) => c.user?.name === custName);
        if (found) {
          setMemberInfo({
            grade: found.memberGrade || found.grade || 'NORMAL',
            points: found.totalPoints || found.points || 0,
            visitCount: found.visitCount || 0,
            totalSpent: found.totalSpent || 0,
          });
        }
      }
    } catch { /* ignore */ }
  };

  // 결제 처리
  const handlePayment = async () => {
    if (!selectedResv && !directMenu) return;
    setPaying(true);
    try {
      const menuPrice = selectedResv ? (selectedResv.menu?.price || 0) : (directMenu?.price || 0);
      const amount = menuPrice - payForm.discount - payForm.pointUsed;
      const body: any = {
        amount: Math.max(0, amount),
        discount: payForm.discount,
        pointUsed: payForm.pointUsed,
        method: payForm.method,
      };
      if (selectedResv) {
        body.reservationId = selectedResv.id;
      } else if (directMenu) {
        body.menuId = directMenu.id;
        body.customerId = payCustomerId;
      }
      const res = await fetch(`/api/shops/${shopSlug}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const paymentData = await res.json();
        setShowPayModal(false);
        setReceiptData(paymentData);
        setShowReceipt(true);
        fetchSales();
      }
    } catch (e) { console.error(e); }
    setPaying(false);
  };

  // 영수증 인쇄
  const printReceipt = () => {
    if (!receiptRef.current) return;
    const win = window.open('', '_blank', 'width=350,height=600');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>\uC601\uC218\uC99D</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Malgun Gothic', sans-serif; width: 280px; margin: 0 auto; padding: 16px 8px; }
      .center { text-align: center; } .bold { font-weight: 700; }
      .line { border-top: 1px dashed #999; margin: 8px 0; }
      .row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 12px; }
      h2 { font-size: 16px; margin-bottom: 4px; }
      .small { font-size: 11px; color: #666; }
      @media print { body { width: 100%; } }
    </style></head><body>${receiptRef.current.innerHTML}
    <script>window.onload=function(){window.print();}<\/script></body></html>`);
    win.document.close();
  };

  if (!mounted) return null;

  const cardStyle = { background: 'white', borderRadius: 14, padding: mob ? '12px 14px' : '16px 20px', border: `1px solid ${c.borderLight}` } as const;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: mob ? '10px' : '20px 16px' }}>
      {/* Period Toggle + Date Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: `1px solid ${c.borderLight}` }}>
          {(['daily', 'monthly'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ padding: mob ? '6px 12px' : '7px 16px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: period === p ? c.primary : 'white', color: period === p ? c.textOnPrimary : c.textLight }}>
              {p === 'daily' ? '일간' : '월간'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => period === 'daily' ? changeDate(-1) : changeMonth(-1)}
            style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${c.borderLight}`, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft style={{ width: 16, height: 16, color: c.textLight }} />
          </button>
          <span style={{ fontSize: mob ? 13 : 14, fontWeight: 600, color: c.text, minWidth: mob ? 100 : 120, textAlign: 'center' }}>
            {period === 'daily'
              ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
              : new Date(selectedMonth + '-01T00:00:00').toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
            }
          </span>
          <button onClick={() => period === 'daily' ? changeDate(1) : changeMonth(1)}
            style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${c.borderLight}`, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRight style={{ width: 16, height: 16, color: c.textLight }} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: c.textLight }}>{'로딩 중...'}</div>
      ) : !data ? (
        <div style={{ textAlign: 'center', padding: 60, color: c.textLight }}>{'데이터를 불러올 수 없습니다'}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: mob ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: mob ? 8 : 10 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 11, color: c.textLight, marginBottom: 6 }}>{'총 매출'}</div>
              <div style={{ fontSize: mob ? 17 : 22, fontWeight: 800, color: c.primary }}>{fmtPrice(data.summary.totalRevenue)}</div>
              <div style={{ fontSize: mob ? 10 : 11, color: c.textLight, marginTop: 4 }}>{data.summary.completedCount}{'건 완료'}</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 11, color: c.textLight, marginBottom: 6 }}>{'결제 금액'}</div>
              <div style={{ fontSize: mob ? 17 : 22, fontWeight: 800, color: c.text }}>{fmtPrice(data.summary.totalPayments)}</div>
              <div style={{ fontSize: mob ? 10 : 11, color: c.textLight, marginTop: 4 }}>{data.summary.paymentCount}{'건 결제'}</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 11, color: c.textLight, marginBottom: 6 }}>{'할인'}</div>
              <div style={{ fontSize: mob ? 17 : 22, fontWeight: 800, color: '#EF4444' }}>-{fmtPrice(data.summary.totalDiscount)}</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 11, color: c.textLight, marginBottom: 6 }}>{'포인트 사용'}</div>
              <div style={{ fontSize: mob ? 17 : 22, fontWeight: 800, color: '#F59E0B' }}>-{fmtPrice(data.summary.totalPointUsed)}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 12 }}>
            {/* 결제 수단별 */}
            <div style={cardStyle}>
              <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CreditCard style={{ width: 15, height: 15, color: c.primary }} /> {'결제 수단별'}
              </div>
              {Object.keys(data.methodSummary).length === 0 ? (
                <div style={{ fontSize: 12, color: c.textLight }}>{'결제 데이터 없음'}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.entries(data.methodSummary).map(([method, amount]) => (
                    <div key={method} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: c.text }}>{METHOD_LABELS[method] || method}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{fmtPrice(amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 담당자별 */}
            <div style={cardStyle}>
              <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users style={{ width: 15, height: 15, color: c.primary }} /> {'담당자별 매출'}
              </div>
              {data.staffSummary.length === 0 ? (
                <div style={{ fontSize: 12, color: c.textLight }}>{'데이터 없음'}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.staffSummary.map((s, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: c.text }}>{s.name} <span style={{ fontSize: 11, color: c.textLight }}>({s.count}{'건'})</span></span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{fmtPrice(s.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 메뉴별 매출 */}
          <div style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Package style={{ width: 15, height: 15, color: c.primary }} /> {'메뉴별 매출'}
            </div>
            {data.menuSummary.length === 0 ? (
              <div style={{ fontSize: 12, color: c.textLight }}>{'데이터 없음'}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.menuSummary.map((m, i) => {
                  const maxRev = data.menuSummary[0]?.revenue || 1;
                  const pct = (m.revenue / maxRev) * 100;
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: c.text }}>{m.name} <span style={{ fontSize: 11, color: c.textLight }}>({m.count}{'건'})</span></span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{fmtPrice(m.revenue)}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: c.primaryLight }}>
                        <div style={{ height: '100%', borderRadius: 3, background: c.primary, width: `${pct}%`, transition: 'width .3s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 시간대별 매출 (일간만) */}
          {period === 'daily' && Object.keys(data.hourly).length > 0 && (
            <div style={cardStyle}>
              <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock style={{ width: 15, height: 15, color: c.primary }} /> {'시간대별 매출'}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: mob ? 1 : 2, height: mob ? 70 : 100, padding: '0 2px' }}>
                {Array.from({ length: 14 }, (_, i) => i + 8).map(hour => {
                  const amount = data.hourly[hour] || 0;
                  const maxHour = Math.max(...Object.values(data.hourly), 1);
                  const pct = (amount / maxHour) * 100;
                  return (
                    <div key={hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <div style={{ width: '100%', maxWidth: mob ? 16 : 28, height: `${Math.max(pct, 3)}%`, background: amount > 0 ? c.primary : c.primaryLight, borderRadius: '4px 4px 0 0', transition: 'height .3s' }}
                        title={`${hour}시: ${fmtPrice(amount)}`} />
                      <span style={{ fontSize: mob ? 8 : 9, color: c.textLight }}>{hour}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 상세 리스트 */}
          <div style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 12 }}>{'\uC2DC\uC220 \uC644\uB8CC \uB0B4\uC5ED'}</div>
            {data.reservations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, fontSize: 12, color: c.textLight }}>{'\uC644\uB8CC\uB41C \uC2DC\uC220\uC774 \uC5C6\uC2B5\uB2C8\uB2E4'}</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${c.borderLight}` }}>
                      <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, fontWeight: 600, color: c.textLight }}>{'\uC2DC\uAC04'}</th>
                      <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, fontWeight: 600, color: c.textLight }}>{'\uACE0\uAC1D'}</th>
                      <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, fontWeight: 600, color: c.textLight }}>{'\uBA54\uB274'}</th>
                      <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, fontWeight: 600, color: c.textLight }}>{'\uB2F4\uB2F9\uC790'}</th>
                      <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: 11, fontWeight: 600, color: c.textLight }}>{'\uAE08\uC561'}</th>
                      <th style={{ textAlign: 'center', padding: '8px 10px', fontSize: 11, fontWeight: 600, color: c.textLight }}>{'\uACB0\uC81C'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.reservations.map(r => (
                      <tr key={r.id} style={{ borderBottom: `1px solid ${c.borderLight}10` }}>
                        <td style={{ padding: '8px 10px', color: c.text, whiteSpace: 'nowrap' }}>{fmtTime(r.startTime)}</td>
                        <td style={{ padding: '8px 10px', color: c.text }}>{r.customerName}</td>
                        <td style={{ padding: '8px 10px', color: c.text }}>{r.menuName}</td>
                        <td style={{ padding: '8px 10px', color: c.textLight }}>{r.staffName}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: c.text }}>{fmtPrice(r.price)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          {r.paymentMethod ? (
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 600, background: '#DBEAFE', color: '#1D4ED8' }}>
                              {METHOD_LABELS[r.paymentMethod] || r.paymentMethod}
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 600, background: '#FEF3C7', color: '#D97706' }}>{'\uBBF8\uACB0\uC81C'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 결제 등록 모달 */}
      {showPayModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: mob ? 10 : 0 }}
          onClick={() => setShowPayModal(false)}>
          <div style={{ background: 'white', borderRadius: 16, padding: mob ? '18px 16px' : '24px 28px', width: mob ? '95vw' : '100%', maxWidth: 500, maxHeight: mob ? '90vh' : '85vh', overflowY: 'auto', position: 'relative' }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowPayModal(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: c.textLight }}>
              <X style={{ width: 18, height: 18 }} />
            </button>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Receipt style={{ width: 18, height: 18, color: c.primary }} /> {'결제 등록'}
            </h3>

            {/* 고객 선택 */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'block', marginBottom: 6 }}>{'고객 선택'}</label>
              {payCustomerId ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${c.primary}`, background: c.primaryLight + '30' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: c.text, flex: 1 }}>
                    {payCustomers.find(cu => cu.id === payCustomerId)?.user?.name || '-'}
                    <span style={{ fontSize: 11, color: c.textLight, marginLeft: 8 }}>
                      {payCustomers.find(cu => cu.id === payCustomerId)?.user?.phone || ''}
                    </span>
                  </span>
                  <button onClick={() => { setPayCustomerId(''); setUnpaidList([]); setSelectedResv(null); setMemberInfo(null); }}
                    style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: `1px solid ${c.borderLight}`, background: 'white', cursor: 'pointer', color: c.textLight }}>
                    {'변경'}
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    placeholder="고객 이름 또는 전화번호 검색"
                    value={payCustomerSearch}
                    onChange={e => {
                      const raw = e.target.value;
                      const digits = raw.replace(/[^0-9]/g, '');
                      // 숫자만 입력된 경우 전화번호 자동 포맷팅
                      if (digits.length > 0 && digits.length === raw.replace(/[-\s]/g, '').length) {
                        let formatted = digits;
                        if (digits.length <= 3) formatted = digits;
                        else if (digits.length <= 7) formatted = digits.slice(0, 3) + '-' + digits.slice(3);
                        else formatted = digits.slice(0, 3) + '-' + digits.slice(3, 7) + '-' + digits.slice(7, 11);
                        setPayCustomerSearch(formatted);
                      } else {
                        setPayCustomerSearch(raw);
                      }
                      setShowQuickReg(false);
                    }}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${c.borderLight}`, fontSize: 13, outline: 'none' }}
                  />
                  {(() => {
                    const q = payCustomerSearch.trim().toLowerCase();
                    const qDigits = q.replace(/[-\s]/g, '');
                    const isPhone = /^\d[\d-]*$/.test(q) && qDigits.length >= 2;
                    const filtered = q
                      ? payCustomers.filter(cu => {
                          if (isPhone) {
                            const custPhone = (cu.user?.phone || '').replace(/[-\s]/g, '');
                            return custPhone.includes(qDigits);
                          }
                          return cu.user?.name?.toLowerCase().includes(q) || (cu.user?.phone || '').replace(/[-\s]/g, '').includes(qDigits);
                        })
                      : payCustomers;

                    // 검색 결과가 있으면 목록 표시
                    if (q && filtered.length > 0) return (
                      <div style={{ maxHeight: 150, overflowY: 'auto', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {filtered.map(cu => (
                          <div key={cu.id}
                            onClick={() => selectPayCustomer(cu.id, cu.user?.name || '')}
                            style={{ padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, display: 'flex', justifyContent: 'space-between', background: '#f9f9f9' }}>
                            <span style={{ fontWeight: 600, color: c.text }}>{cu.user?.name}</span>
                            <span style={{ fontSize: 11, color: c.textLight }}>{cu.user?.phone || ''}</span>
                          </div>
                        ))}
                        <button onClick={() => {
                          setShowQuickReg(true);
                          if (isPhone) { setQuickName(''); setQuickPhone(q); } else { setQuickName(q); setQuickPhone(''); }
                        }}
                          style={{ marginTop: 4, padding: '8px', borderRadius: 8, border: `1.5px dashed ${c.primary}`, background: c.primaryLight + '20', color: c.primary, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          + 신규 고객 등록
                        </button>
                      </div>
                    );

                    // 검색 결과 없음
                    if (filtered.length === 0 && q) return (
                      <div style={{ marginTop: 6 }}>
                        <div style={{ padding: 10, textAlign: 'center', fontSize: 12, color: c.textLight }}>{'검색 결과가 없습니다'}</div>
                        {!showQuickReg ? (
                          <button onClick={() => {
                            setShowQuickReg(true);
                            if (isPhone) { setQuickName(''); setQuickPhone(q); } else { setQuickName(q); setQuickPhone(''); }
                          }}
                            style={{ width: '100%', padding: '10px', borderRadius: 10, border: `1.5px dashed ${c.primary}`, background: c.primaryLight + '20', color: c.primary, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            + 신규 고객 등록
                          </button>
                        ) : null}
                      </div>
                    );

                    // 초기 상태 (검색어 없음)
                    if (!q && payCustomers.length > 0) return (
                      <div>
                        <div style={{ fontSize: 11, color: c.textLight, marginTop: 4, paddingLeft: 4 }}>{'이름 또는 전화번호로 검색하세요'}</div>
                        {!showQuickReg && (
                          <button onClick={() => { setShowQuickReg(true); setQuickName(''); setQuickPhone(''); }}
                            style={{ width: '100%', marginTop: 6, padding: '10px', borderRadius: 10, border: `1.5px dashed ${c.primary}`, background: c.primaryLight + '20', color: c.primary, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            + 신규 고객 등록
                          </button>
                        )}
                      </div>
                    );
                    return null;
                  })()}

                  {/* 빠른 등록 폼 */}
                  {showQuickReg && (
                    <div style={{ marginTop: 6, padding: 14, borderRadius: 10, border: `1.5px solid ${c.primary}`, background: c.primaryLight + '15' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 10 }}>{'신규 고객 빠른 등록'}</div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <input type="text" placeholder="이름" value={quickName} onChange={e => setQuickName(e.target.value)}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${c.borderLight}`, fontSize: 13, outline: 'none' }} />
                        <input type="text" placeholder="전화번호" value={quickPhone}
                          onChange={e => {
                            const raw = e.target.value;
                            const digits = raw.replace(/[^0-9]/g, '');
                            if (digits.length <= 3) setQuickPhone(digits);
                            else if (digits.length <= 7) setQuickPhone(digits.slice(0, 3) + '-' + digits.slice(3));
                            else setQuickPhone(digits.slice(0, 3) + '-' + digits.slice(3, 7) + '-' + digits.slice(7, 11));
                          }}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${c.borderLight}`, fontSize: 13, outline: 'none' }} />
                      </div>
                      {/* 전화번호 입력 중 기존 고객 매칭 */}
                      {quickPhone.replace(/[-\s]/g, '').length >= 4 && (() => {
                        const phoneDigits = quickPhone.replace(/[-\s]/g, '');
                        const matched = payCustomers.filter(cu => (cu.user?.phone || '').replace(/[-\s]/g, '').includes(phoneDigits));
                        if (matched.length === 0) return null;
                        return (
                          <div style={{ marginBottom: 8, padding: 8, borderRadius: 8, background: '#FEF3C7', fontSize: 12 }}>
                            <div style={{ fontWeight: 600, color: '#D97706', marginBottom: 4 }}>{'이미 등록된 번호입니다'}</div>
                            {matched.map(cu => (
                              <div key={cu.id}
                                onClick={() => selectPayCustomer(cu.id, cu.user?.name || '')}
                                style={{ padding: '6px 10px', borderRadius: 6, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', background: 'white', marginTop: 3 }}>
                                <span style={{ fontWeight: 600, color: c.text }}>{cu.user?.name}</span>
                                <span style={{ color: c.textLight }}>{cu.user?.phone}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                      <div style={{ fontSize: 11, color: c.textLight, marginBottom: 8 }}>{'이름 또는 전화번호 중 하나만 입력해도 등록 가능합니다'}</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setShowQuickReg(false)}
                          style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${c.borderLight}`, background: 'white', fontSize: 12, cursor: 'pointer', color: c.textLight }}>
                          {'취소'}
                        </button>
                        <button onClick={quickRegisterCustomer} disabled={quickRegistering || (!quickName.trim() && !quickPhone.trim())}
                          style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: c.primary, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: quickRegistering || (!quickName.trim() && !quickPhone.trim()) ? 0.5 : 1 }}>
                          {quickRegistering ? '등록 중...' : '등록 후 선택'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 미결제 예약 선택 (고객 선택 후에만 표시) */}
            {payCustomerId && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'block', marginBottom: 6 }}>{'미결제 예약 선택'}</label>
              {unpaidList.length === 0 ? (
                <div>
                  <div style={{ padding: 12, textAlign: 'center', color: c.textLight, fontSize: 13, background: '#f9f9f9', borderRadius: 10, marginBottom: 10 }}>{'미결제 예약이 없습니다'}</div>
                  {/* 시술 메뉴 직접 선택 */}
                  <label style={{ fontSize: 12, fontWeight: 600, color: c.textLight, display: 'block', marginBottom: 6 }}>{'시술 메뉴 직접 선택'}</label>
                  {directMenu ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${c.primary}`, background: c.primaryLight + '30' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: c.text, flex: 1 }}>
                        {directMenu.name}
                        <span style={{ fontSize: 11, color: c.textLight, marginLeft: 8 }}>{fmtPrice(directMenu.price)} · {directMenu.duration}분</span>
                      </span>
                      <button onClick={() => { setDirectMenu(null); setPayForm({ method: 'CARD', discount: 0, pointUsed: 0 }); }}
                        style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: `1px solid ${c.borderLight}`, background: 'white', cursor: 'pointer', color: c.textLight }}>
                        {'변경'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
                      {payMenus.map(m => (
                        <div key={m.id}
                          onClick={() => { setDirectMenu(m); setSelectedResv(null); setPayForm({ method: 'CARD', discount: 0, pointUsed: 0 }); }}
                          style={{ padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13, border: `1.5px solid ${c.borderLight}`, background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 600, color: c.text }}>{m.name}</div>
                            {m.category && <span style={{ fontSize: 10, color: c.textLight }}>{m.category}</span>}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, color: c.primary, fontSize: 13 }}>{fmtPrice(m.price)}</div>
                            <div style={{ fontSize: 10, color: c.textLight }}>{m.duration}분</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                  {unpaidList.map(r => (
                    <div key={r.id}
                      onClick={() => { selectReservation(r); setDirectMenu(null); }}
                      style={{
                        padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13,
                        border: `1.5px solid ${selectedResv?.id === r.id ? c.primary : c.borderLight}`,
                        background: selectedResv?.id === r.id ? c.primaryLight + '30' : 'white',
                      }}>
                      <div style={{ fontWeight: 600, color: c.text }}>{r.customer?.user?.name || '-'} · {r.menu?.name || '-'}</div>
                      <div style={{ fontSize: 11, color: c.textLight, marginTop: 2 }}>
                        {new Date(r.startTime).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} {fmtTime(r.startTime)} · {r.staff?.user?.name || '미지정'} · {fmtPrice(r.menu?.price || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}

            {(selectedResv || directMenu) && (() => {
              const menuPrice = selectedResv ? (selectedResv.menu?.price || 0) : (directMenu?.price || 0);
              return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* 금액 정보 */}
                <div style={{ padding: 14, borderRadius: 10, background: '#f9f9f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span>{'시술 금액'}</span>
                    <span style={{ fontWeight: 700 }}>{fmtPrice(menuPrice)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span>{'할인'}</span>
                    <span style={{ color: '#EF4444' }}>-{fmtPrice(payForm.discount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span>{'포인트 사용'}</span>
                    <span style={{ color: '#F59E0B' }}>-{fmtPrice(payForm.pointUsed)}</span>
                  </div>
                  <div style={{ borderTop: `1px solid ${c.borderLight}`, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800 }}>
                    <span>{'결제 금액'}</span>
                    <span style={{ color: c.primary }}>{fmtPrice(Math.max(0, menuPrice - payForm.discount - payForm.pointUsed))}</span>
                  </div>
                </div>

                {/* 회원 등급 / 포인트 정보 */}
                {memberInfo && shopPointSettings && (() => {
                  const GRADE_LABELS: Record<string, string> = { NORMAL: '일반', SILVER: '실버', GOLD: '골드', VIP: 'VIP', '일반': '일반', '실버': '실버', '골드': '골드' };
                  const GRADE_COLORS: Record<string, string> = { NORMAL: '#9CA3AF', SILVER: '#94A3B8', GOLD: '#F59E0B', VIP: '#8B5CF6', '일반': '#9CA3AF', '실버': '#94A3B8', '골드': '#F59E0B' };
                  // 등급키를 영문/한글 모두 시도
                  const gradeKey = memberInfo.grade;
                  const GRADE_MAP: Record<string, string> = { '일반': 'NORMAL', '실버': 'SILVER', '골드': 'GOLD', NORMAL: 'NORMAL', SILVER: 'SILVER', GOLD: 'GOLD', VIP: 'VIP' };
                  const normalizedGrade = GRADE_MAP[gradeKey] || 'NORMAL';
                  const gs = shopPointSettings.gradeSettings[normalizedGrade] || shopPointSettings.gradeSettings[gradeKey];
                  const gradeDiscount = gs?.discount || 0;
                  const gradePointRate = gs?.pointRate || shopPointSettings.pointRate;
                  const methodKey = payForm.method as 'CARD' | 'CASH' | 'TRANSFER';
                  const methodRate = shopPointSettings.paymentRates[methodKey] || 0;
                  const payAmount = Math.max(0, menuPrice - payForm.discount - payForm.pointUsed);
                  const methodPoints = Math.floor(payAmount * methodRate / 100);
                  const gradePoints = Math.floor(payAmount * gradePointRate / 100);
                  const earnPoints = methodPoints + gradePoints;
                  const autoDiscount = gradeDiscount > 0 ? Math.floor(menuPrice * gradeDiscount / 100) : 0;
                  
                  return (
                    <div style={{ padding: 14, borderRadius: 10, border: `1px solid ${c.primaryLight}`, background: `${c.primaryLight}20` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: c.text }}>회원 정보</span>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                            background: GRADE_COLORS[gradeKey] || GRADE_COLORS[normalizedGrade] || '#9CA3AF', color: 'white',
                          }}>{GRADE_LABELS[gradeKey] || GRADE_LABELS[normalizedGrade] || gradeKey}</span>
                        </div>
                        <span style={{ fontSize: 11, color: c.textLight }}>방문 {memberInfo.visitCount}회</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                        <div style={{ background: 'white', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: c.textLight, fontWeight: 600, marginBottom: 2 }}>현재 포인트</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: c.primary }}>{memberInfo.points.toLocaleString()}P</div>
                        </div>
                        <div style={{ background: 'white', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: c.textLight, fontWeight: 600, marginBottom: 2 }}>적립 예정</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#10B981' }}>+{earnPoints.toLocaleString()}P</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                          <span style={{ color: c.textLight }}>결제수단 적립률 ({METHOD_LABELS[payForm.method] || payForm.method})</span>
                          <span style={{ fontWeight: 700, color: c.text }}>{methodRate}% <span style={{ color: '#10B981' }}>({Math.floor(payAmount * methodRate / 100).toLocaleString()}P)</span></span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                          <span style={{ color: c.textLight }}>등급 적립률 ({GRADE_LABELS[gradeKey] || GRADE_LABELS[normalizedGrade] || gradeKey})</span>
                          <span style={{ fontWeight: 700, color: c.text }}>{gradePointRate}% <span style={{ color: '#10B981' }}>({Math.floor(payAmount * gradePointRate / 100).toLocaleString()}P)</span></span>
                        </div>
                        {gradeDiscount > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                            <span style={{ color: '#F59E0B', fontWeight: 600 }}>등급 할인 ({gradeDiscount}%)</span>
                            <span style={{ fontWeight: 700, color: '#EF4444' }}>-{autoDiscount.toLocaleString()}원</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* 할인 / 포인트 */}
                <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: c.textLight, display: 'block', marginBottom: 4 }}>{'할인 금액'}</label>
                    <input type="text" value={payForm.discount ? payForm.discount.toLocaleString() : ''}
                      onChange={e => { const v = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0; setPayForm({...payForm, discount: v}); }}
                      placeholder="0" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${c.borderLight}`, fontSize: 13, outline: 'none', textAlign: 'right' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: c.textLight, display: 'block', marginBottom: 4 }}>{'포인트 사용'}</label>
                    <input type="text" value={payForm.pointUsed ? payForm.pointUsed.toLocaleString() : ''}
                      onChange={e => { const v = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0; setPayForm({...payForm, pointUsed: v}); }}
                      placeholder="0" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${c.borderLight}`, fontSize: 13, outline: 'none', textAlign: 'right' }} />
                  </div>
                </div>

                {/* 결제 수단 */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: c.textLight, display: 'block', marginBottom: 6 }}>{'결제 수단'}</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {Object.entries(METHOD_LABELS).map(([key, label]) => (
                      <button key={key} onClick={() => setPayForm({...payForm, method: key})}
                        style={{
                          padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          border: `1.5px solid ${payForm.method === key ? c.primary : c.borderLight}`,
                          background: payForm.method === key ? c.primaryLight + '40' : 'white',
                          color: payForm.method === key ? c.primary : c.textLight,
                        }}>{label}</button>
                    ))}
                  </div>
                </div>

                <button onClick={handlePayment} disabled={paying}
                  style={{ padding: '10px', borderRadius: 10, fontSize: 14, fontWeight: 700, border: 'none', background: c.primary, color: c.textOnPrimary, cursor: 'pointer', opacity: paying ? 0.6 : 1, marginTop: 4 }}>
                  {paying ? '처리 중...' : '결제 완료'}
                </button>
              </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 영수증 모달 */}
      {showReceipt && receiptData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: mob ? 10 : 0 }}
          onClick={() => setShowReceipt(false)}>
          <div style={{ background: 'white', borderRadius: 16, padding: mob ? '18px 16px' : '24px', width: mob ? '92vw' : '100%', maxWidth: 360, position: 'relative' }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowReceipt(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: c.textLight }}>
              <X style={{ width: 18, height: 18 }} />
            </button>

            {/* 영수증 내용 */}
            <div ref={receiptRef}>
              <div className="center" style={{ textAlign: 'center', marginBottom: 12 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800 }}>{receiptData.shop?.name || '\uB9E4\uC7A5\uBA85'}</h2>
                <div style={{ fontSize: 11, color: '#666' }}>{'\uC601\uC218\uC99D'}</div>
              </div>
              <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />
              <div style={{ fontSize: 12, marginBottom: 4 }}>{'\uB0A0\uC9DC'}: {new Date(receiptData.paidAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div style={{ fontSize: 12, marginBottom: 4 }}>{'\uACE0\uAC1D'}: {receiptData.reservation?.customer?.user?.name || '-'}</div>
              <div style={{ fontSize: 12, marginBottom: 4 }}>{'\uB2F4\uB2F9'}: {receiptData.reservation?.staff?.user?.name || '\uBBF8\uC9C0\uC815'}</div>
              <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '2px 0' }}>
                <span>{receiptData.reservation?.menu?.name}</span>
                <span style={{ fontWeight: 700 }}>{fmtPrice(receiptData.reservation?.menu?.price || 0)}</span>
              </div>
              <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />
              {receiptData.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0' }}>
                  <span>{'\uD560\uC778'}</span><span>-{fmtPrice(receiptData.discount)}</span>
                </div>
              )}
              {receiptData.pointUsed > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0' }}>
                  <span>{'\uD3EC\uC778\uD2B8'}</span><span>-{fmtPrice(receiptData.pointUsed)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, padding: '6px 0', borderTop: '1px solid #333', marginTop: 4 }}>
                <span>{'\uACB0\uC81C \uAE08\uC561'}</span><span>{fmtPrice(receiptData.amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0', color: '#666' }}>
                <span>{'\uACB0\uC81C \uC218\uB2E8'}</span><span>{METHOD_LABELS[receiptData.method] || receiptData.method}</span>
              </div>
              <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />
              <div style={{ textAlign: 'center', fontSize: 11, color: '#999' }}>{'\uAC10\uC0AC\uD569\uB2C8\uB2E4'}</div>
            </div>

            {/* 인쇄 버튼 */}
            <button onClick={printReceipt}
              style={{ width: '100%', marginTop: 16, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: `1px solid ${c.borderLight}`, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: c.text }}>
              <Printer style={{ width: 14, height: 14 }} /> {'\uC601\uC218\uC99D \uC778\uC1C4'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
