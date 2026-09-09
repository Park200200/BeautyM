'use client';

import { useState, useEffect } from 'react';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { Search } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';

export default function UsersPage() {
  const [mounted, setMounted] = useState(false);
  const store = useThemeStore();
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;
  const mob = useIsMobile();

  const users = [
    { name: '김미영', email: 'owner@demo.com', role: 'OWNER', shop: '글로우 스킨케어', status: '활성', lastLogin: '2026-09-07' },
    { name: '박서연', email: 'park@demo.com', role: 'OWNER', shop: '뷰티라운지 강남', status: '활성', lastLogin: '2026-09-06' },
    { name: '이관리', email: 'staff@demo.com', role: 'STAFF', shop: '글로우 스킨케어', status: '활성', lastLogin: '2026-09-07' },
    { name: '이수진', email: 'lee@demo.com', role: 'OWNER', shop: '에스테틱 수', status: '활성', lastLogin: '2026-09-05' },
    { name: '최은하', email: 'choi@demo.com', role: 'OWNER', shop: '더마뷰티', status: '활성', lastLogin: '2026-09-07' },
    { name: '정다영', email: 'jung@demo.com', role: 'OWNER', shop: '스킨랩 홍대', status: '비활성', lastLogin: '2026-08-10' },
  ];

  const [search, setSearch] = useState('');
  const filtered = users.filter((u) => u.name.includes(search) || u.email.includes(search) || u.shop.includes(search));

  return (
    <div className="space-y-4">
      <div className="relative" style={{ maxWidth: mob ? '100%' : 320 }}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: c.textLight }} />
        <input type="text" placeholder="이름, 이메일, 매장 검색..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border py-2 pl-10 pr-4 text-sm outline-none"
          style={{ borderColor: c.border, background: c.surface, color: c.text }} />
      </div>

      {mob ? (
        /* 모바일: 카드 리스트 */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((u) => (
            <div key={u.email} style={{ background: c.surface, borderRadius: 12, border: `1px solid ${c.borderLight}`, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: c.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: c.primary }}>
                    {u.name[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: c.textLight }}>{u.email}</div>
                  </div>
                </div>
                <span className={`text-xs font-medium ${u.status === '활성' ? 'text-green-600' : 'text-gray-400'}`}>● {u.status}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: u.role === 'OWNER' ? c.primaryLight : '#F3F4F6', color: u.role === 'OWNER' ? c.primary : '#6B7280', fontWeight: 600 }}>
                  {u.role === 'OWNER' ? '원장' : '직원'}
                </span>
                <span style={{ fontSize: 11, color: c.text }}>{u.shop}</span>
                <span style={{ fontSize: 10, color: c.textLight, marginLeft: 'auto' }}>최근 {u.lastLogin}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 데스크탑: 테이블 */
        <div className="rounded-xl border overflow-hidden" style={{ background: c.surface, borderColor: c.borderLight }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: c.secondaryLight, borderBottom: `1px solid ${c.borderLight}` }}>
                <th className="px-4 py-3 text-left font-medium" style={{ color: c.textLight }}>이름</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: c.textLight }}>이메일</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: c.textLight }}>역할</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: c.textLight }}>소속 매장</th>
                <th className="px-4 py-3 text-center font-medium" style={{ color: c.textLight }}>상태</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: c.textLight }}>최근 로그인</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.email} style={{ borderBottom: `1px solid ${c.borderLight}` }}>
                  <td className="px-4 py-3 font-medium" style={{ color: c.text }}>{u.name}</td>
                  <td className="px-4 py-3" style={{ color: c.textLight }}>{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ background: u.role === 'OWNER' ? c.primaryLight : '#F3F4F6', color: u.role === 'OWNER' ? c.primary : '#6B7280' }}>
                      {u.role === 'OWNER' ? '원장' : '직원'}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: c.text }}>{u.shop}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium ${u.status === '활성' ? 'text-green-600' : 'text-gray-500'}`}>● {u.status}</span>
                  </td>
                  <td className="px-4 py-3" style={{ color: c.textLight }}>{u.lastLogin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
