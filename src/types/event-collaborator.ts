// types/event-collaborator.ts

import { EventUser } from "./user";

/**
 * Collaborator Role Enum
 * Defines the permission levels for event collaborators
 */
export enum CollaboratorRole {
  /** Full admin access - can manage other collaborators */
  COLLABORATOR_ADMIN = "admin",

  /** Standard collaborator - can view and manage event data */
  COLLABORATOR = "scanner",
}

/**
 * Event Role Enum (for authorization)
 * Matches backend EventRole enum
 */
export enum EventRole {
  /** Event creator/owner - full control */
  HOST = "host",

  /** Admin collaborator - can manage other collaborators */
  COLLABORATOR_ADMIN = "collaborator_admin",

  /** Standard collaborator - can view and edit event */
  COLLABORATOR = "collaborator",
}

// Backend Response DTOs - Must match backend exactly

/**
 * Collaborator response from backend
 * Matches: CollaboratorResponseDto from backend
 */
export interface CollaboratorResponseDto {
  id: string;
  role: CollaboratorRole;
  inviteAccepted: boolean;
  createdAt: Date;

  // For accepted collaborators
  eventUserId?: string | null;
  eventUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    organizationName?: string;
  };

  // For pending collaborators
  pendingEmail?: string | null;
}

/**
 * Response when inviting a collaborator by email
 * Matches: InviteCollaboratorResponseDto from backend
 */
export interface InviteCollaboratorResponseDto {
  success: boolean;
  message: string;
  invitationId: string;
  inviteToken?: string;
}

/**
 * Response when generating an invite link
 * Matches: GenerateInviteLinkResponseDto from backend
 */
export interface GenerateInviteLinkResponseDto {
  success: boolean;
  inviteLink: string;
  token: string;
  expiresAt?: Date;
  role: CollaboratorRole;
}

/**
 * Response when accepting an invitation
 * Matches: AcceptInviteResponseDto from backend
 */
export interface AcceptInviteResponseDto {
  success: boolean;
  message: string;
  event: {
    id: string;
    name: string;
    description: string;
    startDateTime: Date;
    endDateTime: Date;
  };
  role: CollaboratorRole;
  requiresLogin: boolean;
}

/**
 * Response for collaborator list endpoint
 * Matches: CollaboratorListResponseDto from backend
 */
export interface CollaboratorListResponseDto {
  success: boolean;
  collaborators: CollaboratorResponseDto[];
  total: number;
  accepted: number;
  pending: number;
}

/**
 * Preview invitation details (for public preview endpoint)
 */
export interface InvitationPreviewDto {
  success: boolean;
  message?: string;
  event?: {
    id: string;
    name: string;
    description: string;
    startDateTime: Date;
    endDateTime: Date;
    eventImage: string | null;
  };
  role?: CollaboratorRole;
  alreadyAccepted?: boolean;
}

// Request DTOs

/**
 * Invite a collaborator by email
 * Matches: InviteCollaboratorByEmailDto from backend
 */
export interface InviteCollaboratorByEmailDto {
  email: string;
  role: CollaboratorRole;
}

/**
 * Generate a shareable invite link
 * Matches: GenerateInviteLinkDto from backend
 */
export interface GenerateInviteLinkDto {
  role: CollaboratorRole;
  expiresInDays?: number; // Optional: Link expiration in days (default: 7)
}

/**
 * Accept an invitation
 * Matches: AcceptInviteDto from backend
 */
export interface AcceptInviteDto {
  token: string;
}

/**
 * Update collaborator role
 * Matches: UpdateCollaboratorRoleDto from backend
 */
export interface UpdateCollaboratorRoleDto {
  role: CollaboratorRole;
}

// Other response types

export interface CollaboratorActionResponseDto {
  success: boolean;
  message: string;
}
