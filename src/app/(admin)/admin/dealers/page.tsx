'use client';

import { useState, useEffect } from 'react';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { Plus, Search, X, Handshake, Phone, Mail, Building2, Tag, Percent, Landmark, FileText, MessageSquare, Edit2, Trash2, ToggleLeft, ToggleRight, Copy } from 'lucide-react';

type Dealer = {
  id: string; name: string; contactName?: string; phone?: string; email?: string; company?: string;
  discountCode?: string; discountRate?: number; commissionRate?: number;
  bankName?: string; bankAccount?: string; bankHolder?: string;
  terms?: string; memo?: string; isActive: boolean; createdAt: string;
};

export default function DealersPage() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Dealer | null>(null);
  const [form, setForm] = useState({
    name: '', contactName: '', phone: '', email: '', company: '',
    discountCode: '', discountRate: '', commissionRate: '',
    bankName: '', bankAccount: '', bankHolder: '', terms: '', memo: '',
  });
  const [error, setError] = useState('');

  const [mounted, setMounted] = useState(false);
  const store = useThemeStore();
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;

  const fetchDealers = async () => {
    const res = await fetch('/api/admin/dealers');
    const data = await res.json();
    setDealers(data);
    setLoading(false);
  };

  useEffect(() => { fetchDealers(); }, []);

  const handlePhone = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 11);
    let f = nums;
    if (nums.length > 3 && nums.length <= 7) f = `${nums.slice(0,3)}-${nums.slice(3)}`;
    else if (nums.length > 7) f = `${nums.slice(0,3)}-${nums.slice(3,7)}-${nums.slice(7)}`;
    setForm({ ...form, phone: f });
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', contactName: '', phone: '', email: '', company: '', discountCode: '', discountRate: '', commissionRate: '', bankName: '', bankAccount: '', bankHolder: '', terms: '', memo: '' });
    setError('');
    setShowForm(true);
  };

  const openEdit = (d: Dealer) => {
    setEditing(d);
    setForm({
      name: d.name, contactName: d.contactName || '', phone: d.phone || '', email: d.email || '', company: d.company || '',
      discountCode: d.discountCode || '', discountRate: String(d.discountRate || ''), commissionRate: String(d.commissionRate || ''),
      bankName: d.bankName || '', bankAccount: d.bankAccount || '', bankHolder: d.bankHolder || '', terms: d.terms || '', memo: d.memo || '',
    });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('딜러명을 입력하세요'); return; }
    setError('');
    const url = editing ? `/api/admin/dealers/${editing.id}` : '/api/admin/dealers';
    const method = editing ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    if (res.ok) { setShowForm(false); fetchDealers(); }
    else setError(data.error || '오류가 발생했습니다');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    await fetch(`/api/admin/dealers/${id}`, { method: 'DELETE' });
    fetchDealers();
  };

  const toggleActive = async (d: Dealer) => {
    await fetch(`/api/admin/dealers/${d.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !d.isActive }) });
    fetchDealers();
  };

  const filtered = dealers.filter(d =>
    !search || d.name.includes(search) || d.discountCode?.includes(search.toUpperCase()) || d.contactName?.includes(search) || d.company?.includes(search)
  );

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: `1.5px solid ${c.borderLight}`, borderRadius: 10, fontSize: 13, outline: 'none' };
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: c.textLight, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 };

  return (
    <div>
      {/* 상단 바 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ position: 'relative', width: 260 }}>
          <Search style={{ width: 14, height: 14, color: c.textLight, position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="딜러명, 코드, 담당자 검색..."
            style={{ ...inputStyle, paddingLeft: 30, width: '100%' }} />
        </div>
        <button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: c.primary, color: c.textOnPrimary, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Plus style={{ width: 15, height: 15 }} /> 딜러 등록
        </button>
      </div>

      {/* 딜러 목록 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: c.textLight }}>로딩 중...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: c.textLight }}>
          <Handshake style={{ width: 40, height: 40, margin: '0 auto 12px', color: c.borderLight }} />
          <div style={{ fontSize: 14 }}>등록된 딜러가 없습니다</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map(d => (
            <div key={d.id} style={{ background: c.surface, borderRadius: 14, padding: '16px 20px', border: `1px solid ${c.borderLight}`, opacity: d.isActive ? 1 : 0.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: c.text }}>{d.name}</span>
                    {d.company && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: c.primaryLight, color: c.primary, fontWeight: 600 }}>{d.company}</span>}
                    {!d.isActive && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: '#FEE2E2', color: '#DC2626', fontWeight: 600 }}>비활성</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 12, color: c.textLight }}>
                    {d.contactName && <span>{d.contactName}</span>}
                    {d.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Phone style={{ width: 10, height: 10 }} />{d.phone}</span>}
                    {d.email && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Mail style={{ width: 10, height: 10 }} />{d.email}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => toggleActive(d)} title={d.isActive ? '비활성화' : '활성화'} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: c.textLight }}>
                    {d.isActive ? <ToggleRight style={{ width: 18, height: 18, color: c.primary }} /> : <ToggleLeft style={{ width: 18, height: 18 }} />}
                  </button>
                  <button onClick={() => openEdit(d)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: c.textLight }}><Edit2 style={{ width: 14, height: 14 }} /></button>
                  <button onClick={() => handleDelete(d.id)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><Trash2 style={{ width: 14, height: 14 }} /></button>
                </div>
              </div>

              {/* 할인코드/할인율 */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {d.discountCode && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#FEF3C7', borderRadius: 8 }}>
                    <Tag style={{ width: 12, height: 12, color: '#92400E' }} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#92400E', letterSpacing: 1 }}>{d.discountCode}</span>
                    <button onClick={() => { navigator.clipboard.writeText(d.discountCode!); }} style={{ padding: 2, background: 'none', border: 'none', cursor: 'pointer' }}><Copy style={{ width: 10, height: 10, color: '#92400E' }} /></button>
                  </div>
                )}
                {(d.discountRate ?? 0) > 0 && (
                  <span style={{ padding: '6px 12px', background: '#D1FAE5', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#065F46' }}>할인율 {d.discountRate}%</span>
                )}
                {(d.commissionRate ?? 0) > 0 && (
                  <span style={{ padding: '6px 12px', background: '#DBEAFE', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#1E40AF' }}>수수료 {d.commissionRate}%</span>
                )}
              </div>

              {/* 계좌 + 거래조건 */}
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: c.textLight }}>
                {d.bankName && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Landmark style={{ width: 11, height: 11 }} /> {d.bankName} {d.bankAccount} {d.bankHolder && `(${d.bankHolder})`}
                  </span>
                )}
              </div>
              {d.terms && (
                <div style={{ marginTop: 6, padding: '8px 12px', background: '#F9FAFB', borderRadius: 8, fontSize: 12, color: '#374151', lineHeight: 1.6 }}>
                  <span style={{ fontWeight: 700, color: c.textLight, marginRight: 4 }}>거래조건:</span>{d.terms}
                </div>
              )}
              {d.memo && (
                <div style={{ marginTop: 4, fontSize: 11, color: c.textLight }}>메모: {d.memo}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 등록/수정 모달 */}
      {showForm && (
        <>
          <div onClick={() => setShowForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto', background: c.surface, borderRadius: 20, zIndex: 201, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', scrollbarWidth: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: c.text }}>{editing ? '딜러 수정' : '딜러 등록'}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X style={{ width: 20, height: 20, color: c.textLight }} /></button>
            </div>

            {/* 기본 정보 */}
            <div style={{ fontSize: 12, fontWeight: 800, color: c.primary, marginBottom: 10 }}>딜러 정보</div>
            <div style={{ marginBottom: 12 }}>
              <div style={labelStyle}><Handshake style={{ width: 12, height: 12, color: c.primary }} /> 딜러명 *</div>
              <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="딜러/에이전트 이름" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <div style={labelStyle}>담당자명</div>
                <input style={inputStyle} value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} placeholder="담당자" />
              </div>
              <div>
                <div style={labelStyle}><Building2 style={{ width: 12, height: 12, color: c.primary }} /> 소속 회사</div>
                <input style={inputStyle} value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="소속 회사" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div>
                <div style={labelStyle}><Phone style={{ width: 12, height: 12, color: c.primary }} /> 연락처</div>
                <input style={inputStyle} value={form.phone} onChange={e => handlePhone(e.target.value)} placeholder="010-0000-0000" inputMode="tel" />
              </div>
              <div>
                <div style={labelStyle}><Mail style={{ width: 12, height: 12, color: c.primary }} /> 이메일</div>
                <input style={inputStyle} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
              </div>
            </div>

            {/* 할인/수수료 */}
            <div style={{ fontSize: 12, fontWeight: 800, color: c.primary, marginBottom: 10 }}>할인코드 / 수수료</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div>
                <div style={labelStyle}><Tag style={{ width: 12, height: 12, color: '#92400E' }} /> 할인코드</div>
                <input style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }} value={form.discountCode} onChange={e => setForm({ ...form, discountCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) })} placeholder="DEAL2024" />
              </div>
              <div>
                <div style={labelStyle}><Percent style={{ width: 12, height: 12, color: '#065F46' }} /> 할인율 (%)</div>
                <input style={inputStyle} type="number" value={form.discountRate} onChange={e => setForm({ ...form, discountRate: e.target.value })} placeholder="10" min="0" max="100" />
              </div>
              <div>
                <div style={labelStyle}><Percent style={{ width: 12, height: 12, color: '#1E40AF' }} /> 수수료 (%)</div>
                <input style={inputStyle} type="number" value={form.commissionRate} onChange={e => setForm({ ...form, commissionRate: e.target.value })} placeholder="5" min="0" max="100" />
              </div>
            </div>

            {/* 계좌 정보 */}
            <div style={{ fontSize: 12, fontWeight: 800, color: c.primary, marginBottom: 10 }}>계좌 정보</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div>
                <div style={labelStyle}><Landmark style={{ width: 12, height: 12, color: c.primary }} /> 은행명</div>
                <input style={inputStyle} value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} placeholder="국민은행" />
              </div>
              <div>
                <div style={labelStyle}>계좌번호</div>
                <input style={inputStyle} value={form.bankAccount} onChange={e => setForm({ ...form, bankAccount: e.target.value })} placeholder="000-000-000000" />
              </div>
              <div>
                <div style={labelStyle}>예금주</div>
                <input style={inputStyle} value={form.bankHolder} onChange={e => setForm({ ...form, bankHolder: e.target.value })} placeholder="예금주명" />
              </div>
            </div>

            {/* 거래조건/메모 */}
            <div style={{ fontSize: 12, fontWeight: 800, color: c.primary, marginBottom: 10 }}>거래조건 / 메모</div>
            <div style={{ marginBottom: 12 }}>
              <div style={labelStyle}><FileText style={{ width: 12, height: 12, color: c.primary }} /> 거래조건</div>
              <textarea style={{ ...inputStyle, resize: 'none' }} value={form.terms} onChange={e => setForm({ ...form, terms: e.target.value })} placeholder="거래 조건을 입력하세요 (예: 월말 정산, 건당 수수료 등)" rows={3} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={labelStyle}><MessageSquare style={{ width: 12, height: 12, color: c.primary }} /> 메모</div>
              <textarea style={{ ...inputStyle, resize: 'none' }} value={form.memo} onChange={e => setForm({ ...form, memo: e.target.value })} placeholder="기타 메모" rows={2} />
            </div>

            {error && <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 12 }}>{error}</div>}

            <button onClick={handleSubmit} style={{ width: '100%', padding: 12, background: c.primary, color: c.textOnPrimary, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {editing ? '수정 완료' : '딜러 등록'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
