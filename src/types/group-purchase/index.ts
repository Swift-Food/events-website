// Group Purchase Types for invite-based group ticket purchasing

import { EventUser } from "../user";

// Enums matching backend
export enum GroupPurchaseSessionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  DISSOLVED = 'dissolved',
}

export enum GroupPurchaseInviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  KICKED = 'kicked',
}

// Mutual follow user (for invite search)
export interface MutualFollowUser {
  id: string; // EventUser ID
  firstName: string | null;
  lastName: string | null;
  username: string;
  profilePicture: string | null;
  email: string;
}

export interface MutualFollowsResponse {
  mutualFollows: MutualFollowUser[];
  total: number;
}

// Group Purchase Session
export interface GroupPurchaseSessionDto {
  id: string;
  eventTicketId: string;
  leaderEventUserId: string;
  leader: EventUser;
  totalSlots: number;
  status: GroupPurchaseSessionStatus;
  expiresAt: string;
  createdAt: string;
  completedAt: string | null;
  groupPurchaseId: string | null;
  eventTicket: {
    id: string;
    name: string;
    price: number;
    event: {
      id: string;
      name: string;
      eventImage: string | null;
      startDateTime: string;
    };
  };
}

// Group Purchase Invite
export interface GroupPurchaseInviteDto {
  id: string;
  sessionId: string;
  invitedEventUserId: string;
  invitedEventUser: EventUser;
  status: GroupPurchaseInviteStatus;
  invitedAt: string;
  respondedAt: string | null;
}

// Member in session details
export interface GroupPurchaseMemberDto {
  eventUser: EventUser;
  status: 'leader' | GroupPurchaseInviteStatus;
  invitedAt?: string;
  respondedAt?: string | null;
}

// Session details response
export interface GroupPurchaseSessionDetailsDto {
  session: GroupPurchaseSessionDto;
  members: GroupPurchaseMemberDto[];
  acceptedCount: number;
  pendingCount: number;
  timeRemaining: number; // milliseconds
  canComplete: boolean;
}

// My sessions response
export interface MyGroupSessionsDto {
  asLeader: GroupPurchaseSessionDto[];
  asMember: GroupPurchaseSessionDetailsDto[];
}

// Request DTOs

export interface CreateGroupPurchaseSessionDto {
  eventTicketId: string;
  totalSlots: number;
  invitedEventUserIds: string[];
}

export interface CreateGroupPurchaseSessionResponseDto {
  success: boolean;
  message: string;
  sessionId: string;
  expiresAt: string;
}

export interface InviteMoreMembersDto {
  eventUserIds: string[];
}

export interface RespondToInviteDto {
  accept: boolean;
}

export interface CompleteGroupPurchaseDto {
  questionAnswers?: Record<string, any>;
}

export interface CompleteGroupPurchaseResponseDto {
  success: boolean;
  message: string;
  groupPurchaseId: string;
  requiresPayment: boolean;
  clientSecret?: string;
  amount?: number;
  currency?: string;
  tickets: {
    id: string;
    guestFirstName: string | null;
    guestLastName: string | null;
    guestEmail: string | null;
    isPrimaryTicket: boolean;
    status: string;
    qrCode: string | null;
    checkInCode: string | null;
  }[];
}

// Generic action response
export interface GroupPurchaseActionResponseDto {
  success: boolean;
  message: string;
}
