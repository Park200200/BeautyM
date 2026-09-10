'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Bell, CheckCheck, Calendar, CreditCard, Users, Gift, AlertCircle, Megaphone, Clock } from 'lucide-react';

type Noti = {
  id: string; type: string; channel?: string; title: string; content: string;
  readAt: string | null; createdAt: string;
  member?: { user: { name: string } } | null;
};

const CHANNEL_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  IN_APP: { label: '앱', color: '#6B7280', bg: '#F3F4F6' },
  EMAIL: { label: '이메일', color: '#3B82F6', bg: '#DBEAFE' },
  SMS: { label: 'SMS', color: '#10B981', bg: '#D1FAE5' },
  KAKAO: { label: '카카오톡', color: '#F59E0B', bg: '#FEF3C7' },
};

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  RESERVATION: { icon: Calendar, color: '#3B82F6', bg: '#DBEAFE' },
  PAYMENT: { icon: CreditCard, color: '#10B981', bg: '#D1FAE5' },
  CUSTOMER: { icon: Users, color: '#8B5CF6', bg: '#EDE9FE' },
  MEMBERSHIP: { icon: Gift, color: '#F59E0B', bg: '#FEF3C7' },
  SYSTEM: { icon: AlertCircle, color: '#6B7280', bg: '#F3F4F6' },
  CAMPAIGN: { icon: Megaphone, color: '#EC4899', bg: '#FCE7F3' },
  REMINDER: { icon: Clock, color: '#EF4444', bg: '#FEE2E2' },
};

export default function NotificationsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const shopSlug = params.shopSlug as string;
  const mob = useIsMobile();
  const store = useThemeStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;

  const [notifications, setNotifications] = useState<Noti[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const filter = searchParams.get('filter') === 'unread' ? 'unread' : 'all';

  const fetchNoti = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/notifications`);
      if (res.ok) {
        const d = await res.json();
        setNotifications(d.notifications || []);
        setUnreadCount(d.unreadCount || 0);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchNoti(); }, [shopSlug]);

  const markRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await fetch(`/api/shops/${shopSlug}/notifications`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read', notificationId: id }),
      });
    } catch (e) { fetchNoti(); }
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    setUnreadCount(0);
    try {
      await fetch(`/api/shops/${shopSlug}/notifications`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'readAll' }),
      });
    } catch (e) { fetchNoti(); }
  };

  const filtered = filter === 'unread' ? notifications.filter(n => !n.readAt) : notifications;

  const timeAgo = (s: string) => {
    const diff = (Date.now() - new Date(s).getTime()) / 1000;
    if (diff < 60) return '방금';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
  };

  if (!mounted) return null;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: mob ? '14px 12px' : '20px 16px' }}>
      {/* 모두 읽음 */}
      {unreadCount > 0 && (
        <div style={{ marginBottom: 16 }}>
          <button onClick={markAllRead} style={{ padding: mob ? '5px 10px' : '6px 12px', borderRadius: 8, fontSize: mob ? 11 : 12, fontWeight: 600, color: c.primary, background: c.primaryLight + '20', border: `1px solid ${c.primary}30`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCheck style={{ width: 12, height: 12 }} /> 모두 읽음
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: c.textLight }}>로딩 중...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: c.textLight }}>
          <Bell style={{ width: 40, height: 40, color: c.borderLight, margin: '0 auto 10px' }} />
          <div>알림이 없습니다</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map(n => {
            const tc = TYPE_CONFIG[n.type] || TYPE_CONFIG.SYSTEM;
            const Icon = tc.icon;
            const isUnread = !n.readAt;
            return (
              <div key={n.id} onClick={() => isUnread && markRead(n.id)}
                style={{ display: 'flex', gap: mob ? 10 : 12, padding: mob ? '10px 12px' : '12px 14px', borderRadius: 12, background: isUnread ? `${tc.bg}40` : 'white', border: `1px solid ${isUnread ? tc.color + '30' : c.borderLight}`, cursor: isUnread ? 'pointer' : 'default', transition: 'all .2s' }}>
                <div style={{ width: mob ? 32 : 36, height: mob ? 32 : 36, borderRadius: mob ? 8 : 10, background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon style={{ width: mob ? 15 : 16, height: mob ? 15 : 16, color: tc.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: mob ? 12.5 : 13, fontWeight: isUnread ? 700 : 500, color: c.text }}>{n.title}</span>
                      {(() => { const ch = CHANNEL_BADGE[n.channel || 'IN_APP'] || CHANNEL_BADGE.IN_APP; return (
                        <span style={{ fontSize: 9, fontWeight: 600, color: ch.color, background: ch.bg, padding: '1px 6px', borderRadius: 6 }}>{ch.label}</span>
                      ); })()}
                    </div>
                    {isUnread && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />}
                  </div>
                  <div style={{ fontSize: mob ? 11.5 : 12, color: c.textLight, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.content}</div>
                  <div style={{ fontSize: mob ? 9.5 : 10, color: c.textLight, marginTop: 3 }}>{timeAgo(n.createdAt)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
