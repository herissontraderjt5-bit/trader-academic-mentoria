export type Role = 'student' | 'admin';

export type Tier = 'Free' | 'VIP' | 'Vitalício';

export type StudentStatus = 'Ativo' | 'Pendente' | 'Bloqueado' | 'Expirado';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: Role;
  tier: Tier;
  status: StudentStatus;
  joinedAt: string;
  expiresAt?: string;
  whatsapp?: string;
  password?: string;
  tradingMarket?: string;
  tradingStyle?: string;
  dailyTarget?: string;
  bio?: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
  customAllowedModuleIds?: string[]; // If defined, overrides tier default
  allowedCertificates?: ('b3' | 'binarias' | 'forex')[]; // Explicitly unlocked certificates by Admin
  referredById?: string;
  referralCode?: string;
  referralBalance?: number;
  totalEarned?: number;
  progress: {
    completedLessonIds: string[];
    lastWatchedLessonId?: string;
    lastWatchedModuleId?: string;
  };
  notes: Record<string, string>; // lessonId -> private note
}

export interface Material {
  id: string;
  title: string;
  url: string;
  type: 'pdf' | 'spreadsheet' | 'link' | 'indicator' | 'image';
  size?: string;
}

export interface CommentReply {
  id: string;
  userName: string;
  userAvatar: string;
  userRole: Role;
  date: string;
  text: string;
}

export interface LessonComment {
  id: string;
  userName: string;
  userAvatar: string;
  userRole: Role;
  date: string;
  text: string;
  likes: number;
  replies?: CommentReply[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  youtubeUrl: string; // YouTube URL or ID
  durationMinutes: number;
  order: number;
  materials?: Material[];
  comments?: LessonComment[];
  keyTakeaways?: string[];
}

export interface Module {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  coverImage: string; // Vertical aspect ratio image (e.g. 600x900)
  category: string;
  order: number;
  requiredTier: Tier;
  price?: number;
  badgeText?: string;
  isNew?: boolean;
  isLiveModule?: boolean;
  lessons: Lesson[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'live' | 'alert' | 'material' | 'update';
  linkText?: string;
  linkUrl?: string;
  isPinned?: boolean;
}

export interface LiveSession {
  id: string;
  title: string;
  date: string;
  time: string;
  topic: string;
  status: 'upcoming' | 'live' | 'ended';
  youtubeUrl?: string;
  zoomUrl?: string;
  instructor: string;
}

export interface TradeJournalEntry {
  id: string;
  date: string;
  asset: 'WIN' | 'WDO' | 'PETR4' | 'VALE3' | 'BTC' | 'EURUSD' | 'XAUUSD' | string;
  type: 'BUY' | 'SELL';
  contracts: number;
  entryPrice: number;
  exitPrice: number;
  resultCurrency: number;
  setupName: string;
  outcome: 'GAIN' | 'LOSS' | 'BE';
  notes: string;
  screenshotUrl?: string;
}

export interface PlatformSettings {
  platformName: string;
  mentorName: string;
  tagline: string;
  supportWhatsapp: string;
  telegramVipUrl: string;
  discordVipUrl: string;
  instagramUrl: string;
  bannerHeadline: string;
  bannerSubtext: string;
  primaryColor: string;
  caktoCheckoutUrl?: string;
  lifetimePrice?: number;
  referralCommissionPercent?: number;
  minWithdrawalAmount?: number;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  pixKeyType: string;
  pixKey: string;
  fullName: string;
  cpf: string;
  status: 'Pendente' | 'Realizado' | 'Cancelado';
  createdAt: string;
  updatedAt?: string;
}
