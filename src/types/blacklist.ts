// types/blacklist.ts

export enum BlacklistAppealStatus {
  NONE = 'none',
  PENDING = 'pending',
  APPROVED = 'approved',
  DENIED = 'denied',
}

// ============ Request DTOs ============

export interface BlacklistUserDto {
  blockedUserId?: string;
  blockedEmail?: string;
  reason: string;
}

export interface BlacklistUserItem {
  userId?: string;
  email?: string;
}

export interface BulkBlacklistDto {
  users: BlacklistUserItem[];
  reason: string;
}

export interface SubmitAppealDto {
  appealMessage: string;
}

export interface AppealResponseDto {
  responseMessage: string;
}

// ============ Response DTOs ============

export interface BlacklistStatusDto {
  isBlacklisted: boolean;
  reason?: string;
  blacklistId?: string;
  canAppeal: boolean;
  appealStatus?: BlacklistAppealStatus;
  appealMessage?: string;
  appealResponseMessage?: string;
}

export interface BlacklistUserInfoDto {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
}

export interface BlacklistEntryDto {
  id: string;
  eventId: string | null;
  blockedUserId: string | null;
  blockedEmail: string | null;
  blockedUser?: BlacklistUserInfoDto;
  reason: string;
  appealStatus: BlacklistAppealStatus;
  appealMessage: string | null;
  appealResponseMessage: string | null;
  appealedAt: string | null;
  appealResolvedAt: string | null;
  isActive: boolean;
  createdAt: string;
  hadTicketCancelled: boolean;
}

export interface EventBlacklistListDto {
  blacklist: BlacklistEntryDto[];
  total: number;
  pendingAppealsCount: number;
}

export interface BlacklistActionResultDto {
  success: boolean;
  message: string;
  ticketCancelled?: boolean;
  ticketRefunded?: boolean;
  refundAmount?: number;
  emailSent?: boolean;
  blacklistId?: string;
}

export interface BulkBlacklistResultDto {
  success: boolean;
  message: string;
  blacklisted: number;
  failed: number;
  ticketsCancelled: number;
  ticketsRefunded: number;
  totalRefundAmount: number;
  errors: string[];
}
