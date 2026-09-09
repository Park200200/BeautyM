import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind CSS 클래스 병합 유틸리티
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 전화번호 포맷팅 (010-1234-5678)
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

/**
 * 금액 포맷팅 (1,000원)
 */
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

/**
 * 날짜 포맷팅 (2024-01-15)
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 날짜+시간 포맷팅 (2024-01-15 14:30)
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * 시간만 포맷팅 (14:30)
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * 분 → "1시간 30분" 변환
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}시간 ${mins}분`;
  if (hours > 0) return `${hours}시간`;
  return `${mins}분`;
}

/**
 * 예약 상태 한글 라벨
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    REQUESTED: '예약요청',
    PENDING: '대기상태',
    CONFIRMED: '예약확정',
    IN_PROGRESS: '시술진행',
    COMPLETED: '시술완료',
    CANCELLED: '예약취소',
    NO_SHOW: '당일노쇼',
  };
  return labels[status] || status;
}

/**
 * 예약 상태 색상
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    REQUESTED: 'bg-orange-100 text-orange-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    NO_SHOW: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * 멤버 등급 색상
 */
export function getGradeColor(grade: string): string {
  const colors: Record<string, string> = {
    일반: 'bg-gray-100 text-gray-700',
    실버: 'bg-slate-100 text-slate-700',
    골드: 'bg-amber-100 text-amber-700',
    VIP: 'bg-purple-100 text-purple-700',
  };
  return colors[grade] || 'bg-gray-100 text-gray-700';
}

/**
 * 슬러그 생성 (URL용)
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
