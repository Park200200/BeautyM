'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { Settings, Store, Phone, MapPin, FileText, Clock, Camera, User, Building, Mail, CreditCard, Save, CheckCircle, Upload, X, Eye } from 'lucide-react';

type ShopSettings = {
  name: string; phone: string; address: string; description: string;
  businessHours: string; logoUrl: string;
  ownerName: string; ownerTitle: string; ownerPhone: string;
  bizNumber: string; bizType: string; bizCategory: string; taxEmail: string; bizLicenseUrl: string;
  planName: string; pointRate: number; gradeSettings: string; paymentRates: string;
};
type GradeSetting = { threshold: number; pointRate: number; discount: number };
type PayRates = { CARD: number; CASH: number; TRANSFER: number };

const DEFAULT_HOURS = {
  mon: { open: '10:00', close: '20:00', closed: false },
  tue: { open: '10:00', close: '20:00', closed: false },
  wed: { open: '10:00', close: '20:00', closed: false },
  thu: { open: '10:00', close: '20:00', closed: false },
  fri: { open: '10:00', close: '20:00', closed: false },
  sat: { open: '10:00', close: '18:00', closed: false },
  sun: { open: '00:00', close: '00:00', closed: true },
};
const DAY_LABELS: Record<string, string> = { mon: '월', tue: '화', wed: '수', thu: '목', fri: '금', sat: '토', sun: '일' };

export default function SettingsPage() {
  const mob = useIsMobile();
  const params = useParams();
  const shopSlug = params.shopSlug as string;
  const store = useThemeStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;

  const [tab, setTab] = useState<'general' | 'business' | 'hours' | 'membership'>('general');
  const [data, setData] = useState<ShopSettings | null>(null);
  const [form, setForm] = useState<ShopSettings | null>(null);
  const [hours, setHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>(DEFAULT_HOURS);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [calMonth, setCalMonth] = useState(new Date());
  const [gradeCriteria, setGradeCriteria] = useState<Record<string, GradeSetting>>({
    '\uC77C\uBC18': { threshold: 0, pointRate: 3, discount: 0 },
    '\uC2E4\uBC84': { threshold: 300000, pointRate: 5, discount: 3 },
    '\uACE8\uB4DC': { threshold: 1000000, pointRate: 7, discount: 5 },
    'VIP': { threshold: 3000000, pointRate: 10, discount: 10 },
  });
  const [payRates, setPayRates] = useState<PayRates>({ CARD: 3, CASH: 5, TRANSFER: 4 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [bizUploading, setBizUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bizFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/shops/${shopSlug}/settings`);
        if (res.ok) {
          const d = await res.json();
          setData(d); setForm(d);
          if (d.businessHours) {
            try {
              const parsed = JSON.parse(d.businessHours);
              const merged: Record<string, any> = {};
              for (const day of Object.keys(DEFAULT_HOURS)) {
                merged[day] = parsed[day] && typeof parsed[day] === 'object'
                  ? { ...DEFAULT_HOURS[day as keyof typeof DEFAULT_HOURS], ...parsed[day] }
                  : { ...DEFAULT_HOURS[day as keyof typeof DEFAULT_HOURS] };
              }
              setHours(merged);
              if (Array.isArray(parsed._holidays)) setHolidays(parsed._holidays);
            } catch {}
          }
          if (d.gradeSettings) { try { setGradeCriteria(JSON.parse(d.gradeSettings)); } catch {} }
          if (d.paymentRates) { try { setPayRates(JSON.parse(d.paymentRates)); } catch {} }
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [shopSlug]);

  const updateForm = (key: string, val: any) => {
    if (form) setForm({ ...form, [key]: val });
  };

  const uploadLogo = async (file: File) => {
    setLogoUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (res.ok) { const d = await res.json(); updateForm('logoUrl', d.url); }
    } catch (e) { console.error(e); }
    setLogoUploading(false);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) { uploadLogo(file); break; }
      }
    }
  };

  const uploadBizLicense = async (file: File) => {
    setBizUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (res.ok) { const d = await res.json(); updateForm('bizLicenseUrl', d.url); }
    } catch (e) { console.error(e); }
    setBizUploading(false);
  };

  const handleBizPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) { uploadBizLicense(file); break; }
      }
    }
  };
  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const body: any = { ...form };
      body.businessHours = JSON.stringify({ ...hours, _holidays: holidays });
      body.gradeSettings = JSON.stringify(gradeCriteria);
      body.paymentRates = JSON.stringify(payRates);
      const res = await fetch(`/api/shops/${shopSlug}/settings`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  if (!mounted) return null;
  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: c.textLight }}>{'\uB85C\uB529 \uC911...'}</div>;
  if (!form) return <div style={{ textAlign: 'center', padding: 80, color: c.textLight }}>{'\uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4'}</div>;

  const card = { background: 'white', borderRadius: 14, border: `1px solid ${c.borderLight}`, padding: mob ? '14px' : '20px 22px' } as const;
  const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${c.borderLight}`, fontSize: 13, outline: 'none', color: c.text } as const;
  const labelStyle = { fontSize: 12, fontWeight: 600 as const, color: c.textLight, marginBottom: 4, display: 'block' as const };

  const fmtComma = (n: number) => n.toLocaleString();
  const parseComma = (s: string) => Number(s.replace(/,/g, '')) || 0;

  const tabs = [
    { key: 'general', label: '일반 정보', icon: Store },
    { key: 'business', label: '사업자 정보', icon: Building },
    { key: 'hours', label: '영업 시간', icon: Clock },
    { key: 'membership', label: '포인트/멤버십', icon: CreditCard },
  ];

  return (
    <div style={{ maxWidth: mob ? '100%' : 720, margin: '0 auto', padding: mob ? '14px 10px' : '20px 16px' }}>
      {/* 탭 + 저장 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, alignItems: 'center', overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: 4 }}>
        {tabs.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: mob ? '6px 12px' : '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, border: `1px solid ${active ? c.primary : c.borderLight}`, background: active ? c.primary : 'white', color: active ? 'white' : c.text, cursor: 'pointer', transition: 'all .15s', flexShrink: 0 }}>
              <Icon style={{ width: 13, height: 13 }} /> {t.label}
            </button>
          );
        })}
        <button onClick={save} disabled={saving}
          style={{ marginLeft: 'auto', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: mob ? '7px 14px' : '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: saved ? '#10B981' : c.primary, color: 'white', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, transition: 'all .2s' }}>
          {saved ? <><CheckCircle style={{ width: 14, height: 14 }} /> {'저장됨'}</> : <><Save style={{ width: 14, height: 14 }} /> {saving ? '저장 중...' : '저장'}</>}
        </button>
      </div>

      {/* 일반 정보 */}
      {tab === 'general' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 16 }}>{'매장 정보'}</h3>

            {/* 로고 */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>{'매장 로고'}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 72, height: 72, borderRadius: 14, border: `2px dashed ${c.borderLight}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', cursor: 'pointer', position: 'relative' }}
                  onClick={() => fileRef.current?.click()} tabIndex={0} onPaste={handlePaste}>
                  {form.logoUrl ? (
                    <img src={form.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Camera style={{ width: 20, height: 20, color: c.textLight }} />
                  )}
                  {logoUploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10 }}>...</div>}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: c.textLight }}>{'클릭 또는 Ctrl+V 붙여넣기'}</div>
                  <div style={{ fontSize: 10, color: c.textLight }}>{'권장 200x200px'}</div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>{'매장명'}</label>
                <input value={form.name} onChange={e => updateForm('name', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{'플랜'}</label>
                <input value={form.planName || ''} readOnly style={{ ...inputStyle, background: '#F3F4F6', cursor: 'not-allowed' }} />
              </div>
              <div>
                <label style={labelStyle}><Phone style={{ width: 11, height: 11, display: 'inline' }} /> {'전화번호'}</label>
                <input value={form.phone || ''} onChange={e => updateForm('phone', e.target.value)} style={inputStyle} placeholder="02-1234-5678" />
              </div>
              <div>
                <label style={labelStyle}><Mail style={{ width: 11, height: 11, display: 'inline' }} /> {'이메일'}</label>
                <input value={form.taxEmail || ''} onChange={e => updateForm('taxEmail', e.target.value)} style={inputStyle} placeholder="shop@email.com" />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}><MapPin style={{ width: 11, height: 11, display: 'inline' }} /> {'주소'}</label>
              <input value={form.address || ''} onChange={e => updateForm('address', e.target.value)} style={inputStyle} placeholder={'매장 주소'} />
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}><FileText style={{ width: 11, height: 11, display: 'inline' }} /> {'매장 소개'}</label>
              <textarea value={form.description || ''} onChange={e => updateForm('description', e.target.value)} rows={3}
                style={{ ...inputStyle, resize: 'vertical' as const }} placeholder={'매장 소개 문구'} />
            </div>
          </div>

          {/* 대표자 */}
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 16 }}>{'대표자 정보'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}><User style={{ width: 11, height: 11, display: 'inline' }} /> {'대표자명'}</label>
                <input value={form.ownerName || ''} onChange={e => updateForm('ownerName', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{'직함'}</label>
                <input value={form.ownerTitle || ''} onChange={e => updateForm('ownerTitle', e.target.value)} style={inputStyle} placeholder={'원장'} />
              </div>
              <div>
                <label style={labelStyle}>{'연락처'}</label>
                <input value={form.ownerPhone || ''} onChange={e => updateForm('ownerPhone', e.target.value)} style={inputStyle} placeholder="010-0000-0000" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 사업자 정보 */}
      {tab === 'business' && (
        <div style={card}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 16 }}>{'사업자 정보'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>{'\uC0AC\uC5C5\uC790\uB4F1\uB85D\uBC88\uD638'}</label>
              <input value={form.bizNumber || ''} onChange={e => updateForm('bizNumber', e.target.value)} style={inputStyle} placeholder="000-00-00000" />
            </div>
            <div>
              <label style={labelStyle}>{'\uC5C5\uD0DC'}</label>
              <input value={form.bizType || ''} onChange={e => updateForm('bizType', e.target.value)} style={inputStyle} placeholder={'\uC11C\uBE44\uC2A4\uC5C5'} />
            </div>
            <div>
              <label style={labelStyle}>{'\uC5C5\uC885'}</label>
              <input value={form.bizCategory || ''} onChange={e => updateForm('bizCategory', e.target.value)} style={inputStyle} placeholder={'\uD53C\uBD80\uBBF8\uC6A9'} />
            </div>
            <div>
              <label style={labelStyle}>{'\uC138\uAE08\uACC4\uC0B0\uC11C \uC774\uBA54\uC77C'}</label>
              <input value={form.taxEmail || ''} onChange={e => updateForm('taxEmail', e.target.value)} style={inputStyle} placeholder="tax@email.com" />
            </div>
          </div>

          {/* 사업자등록증 */}
          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}><FileText style={{ width: 11, height: 11, display: 'inline' }} /> {'\uC0AC\uC5C5\uC790\uB4F1\uB85D\uC99D'}</label>
            {form.bizLicenseUrl ? (
              <div style={{ position: 'relative', borderRadius: 10, border: `1px solid ${c.borderLight}`, overflow: 'hidden', maxWidth: 320 }}>
                <img src={form.bizLicenseUrl} alt="" style={{ width: '100%', maxHeight: 220, objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                  <button onClick={() => window.open(form.bizLicenseUrl, '_blank')}
                    style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(0,0,0,.5)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Eye style={{ width: 14, height: 14, color: 'white' }} />
                  </button>
                  <button onClick={() => updateForm('bizLicenseUrl', '')}
                    style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(220,38,38,.7)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X style={{ width: 14, height: 14, color: 'white' }} />
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ borderRadius: 10, border: `2px dashed ${c.borderLight}`, padding: '24px 16px', textAlign: 'center', cursor: 'pointer', background: '#FAFBFC' }}
                onClick={() => bizFileRef.current?.click()} tabIndex={0} onPaste={handleBizPaste}>
                <Upload style={{ width: 24, height: 24, color: c.textLight, margin: '0 auto 6px' }} />
                <div style={{ fontSize: 12, fontWeight: 600, color: c.textLight }}>{'\uD074\uB9AD\uD558\uC5EC \uC5C5\uB85C\uB4DC \uB610\uB294 Ctrl+V \uBD99\uC5EC\uB123\uAE30'}</div>
                <div style={{ fontSize: 10, color: c.textLight, marginTop: 2 }}>{'JPG, PNG, PDF \uC9C0\uC6D0'}</div>
                {bizUploading && <div style={{ fontSize: 11, color: c.primary, marginTop: 6 }}>{'\uC5C5\uB85C\uB4DC \uC911...'}</div>}
              </div>
            )}
            <input ref={bizFileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadBizLicense(f); }} />
          </div>
        </div>
      )}

      {/* 영업 시간 */}
      {tab === 'hours' && (
        <>
        <div style={card}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 16 }}>{'영업 시간 설정'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(hours).map(([day, h]) => {
              const [openH, openM] = (h.open || '10:00').split(':').map(Number);
              const [closeH, closeM] = (h.close || '20:00').split(':').map(Number);
              const toMin = (hr: number, mn: number) => hr * 60 + mn;
              const fromMin = (t: number) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
              const fmtDisplay = (hr: number, mn: number) => {
                const ap = hr < 12 ? '오전' : '오후';
                const h12 = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
                return `${ap} ${h12}:${String(mn).padStart(2, '0')}`;
              };
              const stepTime = (field: 'open' | 'close', dir: number) => {
                const [hh, mm] = (h[field] || '10:00').split(':').map(Number);
                let t = toMin(hh, mm) + dir * 30;
                t = Math.max(0, Math.min(t, 23 * 60 + 30));
                setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: fromMin(t) } }));
              };
              const btnStyle = { width: mob ? 22 : 26, height: mob ? 22 : 26, borderRadius: 6, border: `1px solid ${c.borderLight}`, background: 'white', cursor: 'pointer', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const, fontSize: mob ? 12 : 14, fontWeight: 600 as const, color: c.primary, transition: 'background .15s' };

              return (
                <div key={day} style={{ display: 'flex', alignItems: mob ? 'flex-start' : 'center', flexDirection: mob ? 'column' : 'row', gap: mob ? 8 : 8, padding: mob ? '8px 10px' : '10px 14px', borderRadius: 12, background: h.closed ? '#F9FAFB' : 'white', border: `1px solid ${c.borderLight}`, opacity: h.closed ? 0.5 : 1, transition: 'opacity .2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: mob ? '100%' : 'auto', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 22, fontSize: 14, fontWeight: 700, color: day === 'sun' ? '#EF4444' : day === 'sat' ? '#3B82F6' : c.text }}>{DAY_LABELS[day]}</span>

                      <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: c.textLight, cursor: 'pointer', minWidth: 44, userSelect: 'none' as const }}>
                        <input type="checkbox" checked={h.closed}
                          onChange={e => setHours(prev => ({ ...prev, [day]: { ...prev[day], closed: e.target.checked } }))}
                          style={{ width: 14, height: 14, accentColor: c.primary, cursor: 'pointer' }} />
                        {'휴무'}
                      </label>
                    </div>
                    {h.closed && mob && <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 600 }}>{'휴무일'}</span>}
                  </div>

                  {!h.closed ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: mob ? 4 : 6, flex: 1, width: mob ? '100%' : 'auto', justifyContent: mob ? 'space-between' : 'flex-start' }}>
                      {/* 시작 시간 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: mob ? 2 : 3 }}>
                        <button type="button" onClick={() => stepTime('open', -1)} style={btnStyle}>−</button>
                        <div style={{ minWidth: mob ? 70 : 90, textAlign: 'center' as const, padding: mob ? '4px 6px' : '5px 10px', borderRadius: 8, border: `1px solid ${c.borderLight}`, fontSize: mob ? 11 : 13, fontWeight: 600, color: c.text, background: '#FAFBFC' }}>
                          {fmtDisplay(openH, openM)}
                        </div>
                        <button type="button" onClick={() => stepTime('open', 1)} style={btnStyle}>+</button>
                      </div>

                      <span style={{ fontSize: 13, color: c.textLight }}>~</span>

                      {/* 종료 시간 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: mob ? 2 : 3 }}>
                        <button type="button" onClick={() => stepTime('close', -1)} style={btnStyle}>−</button>
                        <div style={{ minWidth: mob ? 70 : 90, textAlign: 'center' as const, padding: mob ? '4px 6px' : '5px 10px', borderRadius: 8, border: `1px solid ${c.borderLight}`, fontSize: mob ? 11 : 13, fontWeight: 600, color: c.text, background: '#FAFBFC' }}>
                          {fmtDisplay(closeH, closeM)}
                        </div>
                        <button type="button" onClick={() => stepTime('close', 1)} style={btnStyle}>+</button>
                      </div>
                    </div>
                  ) : (
                    !mob && <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 600 }}>{'휴무일'}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

          {/* 달력 휴무일 설정 */}
          <div style={{ ...card, marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: c.text }}>{'휴무일 설정'}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10, color: c.textLight }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#FEE2E2', border: '1px solid #FCA5A5', display: 'inline-block' }} />{'정기 휴무'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#EF4444', display: 'inline-block' }} />{'특별 휴무'}</span>
              </div>
            </div>

            {(() => {
              const y = calMonth.getFullYear(), m = calMonth.getMonth();
              const firstDay = new Date(y, m, 1).getDay();
              const daysInMonth = new Date(y, m + 1, 0).getDate();
              const today = new Date(); today.setHours(0,0,0,0);
              const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

              const toggleHoliday = (dateStr: string) => {
                setHolidays(prev => prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]);
              };

              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <button type="button" onClick={() => setCalMonth(new Date(y, m - 1, 1))}
                      style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${c.borderLight}`, background: 'white', cursor: 'pointer', fontSize: 14, color: c.textLight }}>{'◀'}</button>
                    <span style={{ fontSize: 14, fontWeight: 700, color: c.text }}>{y}{'년'} {m + 1}{'월'}</span>
                    <button type="button" onClick={() => setCalMonth(new Date(y, m + 1, 1))}
                      style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${c.borderLight}`, background: 'white', cursor: 'pointer', fontSize: 14, color: c.textLight }}>{'▶'}</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: mob ? 1 : 2 }}>
                    {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                      <div key={d} style={{ textAlign: 'center', fontSize: mob ? 10 : 11, fontWeight: 600, color: i === 0 ? '#EF4444' : i === 6 ? '#3B82F6' : c.textLight, padding: mob ? '2px 0' : '4px 0' }}>{d}</div>
                    ))}

                    {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}

                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const dt = new Date(y, m, day);
                      const dow = dt.getDay();
                      const dayKey = dayKeys[dow];
                      const isRegularOff = hours[dayKey]?.closed || false;
                      const isSpecialOff = holidays.includes(dateStr);
                      const isPast = dt < today;
                      const isToday = dt.getTime() === today.getTime();

                      return (
                        <button key={day} type="button"
                          onClick={() => { if (!isPast) toggleHoliday(dateStr); }}
                          style={{
                            width: '100%', aspectRatio: '1', borderRadius: mob ? 6 : 8, border: isToday ? `2px solid ${c.primary}` : '1px solid transparent',
                            background: isSpecialOff ? '#EF4444' : isRegularOff ? '#FEE2E2' : 'transparent',
                            color: isSpecialOff ? 'white' : isRegularOff ? '#DC2626' : isPast ? '#D1D5DB' : dow === 0 ? '#EF4444' : dow === 6 ? '#3B82F6' : c.text,
                            fontSize: mob ? 11 : 12, fontWeight: isToday ? 700 : 500,
                            cursor: isPast ? 'default' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: 0,
                            transition: 'all .15s',
                          }}>
                          {day}
                        </button>
                      );
                    })}
                  </div>

                  {holidays.length > 0 && (
                    <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', marginBottom: 4 }}>{'\uD2B9\uBCC4 \uD734\uBB34\uC77C'} ({holidays.length}{'\uC77C'})</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
                        {holidays.sort().map(d => (
                          <span key={d} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: '#EF4444', color: 'white', cursor: 'pointer' }}
                            onClick={() => toggleHoliday(d)}>
                            {d.slice(5)} ✕
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </>
      )}

      {/* 포인트/멤버십 */}
      {tab === 'membership' && form && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 기본 적립률 */}
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 16 }}>{'\uAE30\uBCF8 \uD3EC\uC778\uD2B8 \uC801\uB9BD\uB960'}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard style={{ width: 14, height: 14, color: c.primary }} />
              <span style={{ fontSize: 13, color: c.text }}>{'\uACB0\uC81C\uAE08\uC561\uC758'}</span>
              <input type="number" value={form.pointRate} onChange={e => updateForm('pointRate', Number(e.target.value))}
                style={{ ...inputStyle, width: 60, textAlign: 'center' as const }} min={0} max={100} />
              <span style={{ fontSize: 13, color: c.text }}>{'% \uC801\uB9BD'}</span>
            </div>
          </div>

          {/* 결제수단별 적립률 */}
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 16 }}>{'결제수단별 적립률'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr 1fr', gap: 12 }}>
              {([['CARD', '카드', '#3B82F6'], ['CASH', '현금', '#10B981'], ['TRANSFER', '계좌이체', '#F59E0B']] as const).map(([key, label, color]) => (
                <div key={key} style={{ padding: '12px 14px', borderRadius: 10, border: `1px solid ${c.borderLight}`, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color, marginBottom: 8 }}>{label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <input type="number" value={payRates[key]} onChange={e => setPayRates(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                      style={{ ...inputStyle, width: 50, textAlign: 'center' as const, fontSize: 16, fontWeight: 700 }} min={0} max={100} />
                    <span style={{ fontSize: 13, color: c.textLight }}>%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 등급별 혜택 */}
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 16 }}>{'등급별 혜택 설정'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(gradeCriteria).map(([grade, settings]) => {
                const gradeColors: Record<string, string> = { '일반': '#9CA3AF', '실버': '#60A5FA', '골드': '#FBBF24', 'VIP': '#F472B6' };
                const gc = gradeColors[grade] || '#9CA3AF';
                return (
                  <div key={grade} style={{ padding: '12px 16px', borderRadius: 10, border: `1px solid ${c.borderLight}`, borderLeft: `4px solid ${gc}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: gc }}>{grade}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ ...labelStyle, fontSize: 10 }}>{'승급 기준 (누적 결제)'}</label>
                        <input value={fmtComma(settings.threshold)}
                          onChange={e => setGradeCriteria(prev => ({ ...prev, [grade]: { ...prev[grade], threshold: parseComma(e.target.value) } }))}
                          style={inputStyle} disabled={grade === '일반'} />
                      </div>
                      <div>
                        <label style={{ ...labelStyle, fontSize: 10 }}>{'적립률 (%)'}</label>
                        <input type="number" value={settings.pointRate}
                          onChange={e => setGradeCriteria(prev => ({ ...prev, [grade]: { ...prev[grade], pointRate: Number(e.target.value) } }))}
                          style={inputStyle} min={0} max={100} />
                      </div>
                      <div>
                        <label style={{ ...labelStyle, fontSize: 10 }}>{'할인율 (%)'}</label>
                        <input type="number" value={settings.discount}
                          onChange={e => setGradeCriteria(prev => ({ ...prev, [grade]: { ...prev[grade], discount: Number(e.target.value) } }))}
                          style={inputStyle} min={0} max={100} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
