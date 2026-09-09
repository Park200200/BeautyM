// BeautyM - 모듈 타입 정의

export type ModuleId =
  | 'reservation'
  | 'customer'
  | 'menu'
  | 'sales'
  | 'staff'
  | 'inventory'
  | 'membership'
  | 'portfolio'
  | 'dashboard'
  | 'website'
  | 'notification'
  | 'multi_branch'
  | 'ai_analytics';

export type ModuleTarget = 'ADMIN' | 'CUSTOMER';

export interface ModuleConfigField {
  key: string;
  label: string;
  type: 'number' | 'boolean' | 'select';
  defaultValue: number | boolean | string;
  options?: { label: string; value: string | number }[];
}

export interface FeatureModuleDefinition {
  id: ModuleId;
  name: string;
  description: string;
  icon: string;
  target: ModuleTarget;
  configFields: ModuleConfigField[];
  sortOrder: number;
}

export interface ShopFeatureConfig {
  maxCustomers?: number;
  maxStaff?: number;
  maxBranches?: number;
  allowCustomDomain?: boolean;
  smsProvider?: 'kakao' | 'sms' | 'both';
  [key: string]: unknown;
}

export type UserRole = 'SUPER_ADMIN' | 'USER';
export type ShopMemberRole = 'OWNER' | 'STAFF' | 'CUSTOMER';
export type AuthType = 'EMAIL' | 'PHONE';
export type SkinType = '건성' | '지성' | '복합성' | '민감성';
export type MemberGrade = '일반' | '실버' | '골드' | 'VIP';

export type ReservationStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type ReservationSource = 'ADMIN' | 'WEBSITE';

export type PaymentMethod =
  | 'CARD'
  | 'CASH'
  | 'TRANSFER'
  | 'POINT'
  | 'MIXED'
  | 'PG_ONLINE';

export type PgStatus = 'PENDING' | 'DONE' | 'CANCELLED' | 'REFUNDED';

export type NotificationType =
  | 'RESERVATION_CONFIRM'
  | 'RESERVATION_REMIND'
  | 'COMPLETE'
  | 'BIRTHDAY'
  | 'REVISIT'
  | 'MARKETING';

export type NotificationChannel = 'KAKAO' | 'SMS' | 'PUSH';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

export type AnnouncementType = 'URGENT' | 'NORMAL' | 'INFO';
export type TargetScope = 'ALL' | 'SELECTED' | 'REGION';

export type CampaignStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'SENDING'
  | 'COMPLETED'
  | 'CANCELLED';

export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
export type PointHistoryType = 'EARN' | 'USE';
export type RecordPhotoType = 'BEFORE' | 'AFTER';
