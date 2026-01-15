// Base User interface
export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  adminMode: boolean;
}

export interface EventUser {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  allowEmailNotifications: boolean;
  allowTicketReminders: boolean;
  bio: string | null;
  createdAt: string;
  linkedinUrl: string | null;
  instagramUrl: string | null;
  organizationName: string | null;
  stripeAccountId: string | null;
  stripeOnboardingComplete: boolean;
  totalEventsAttended: number;
  totalEventsCreated: number;
  totalRevenue: string;
  user: User;
  twitterHandle: string | null;
  updatedAt: string;
  website: string | null;
  googleId: string | null;
  isGoogleUser: boolean;
  // Follower system
  followerCount: number;
  followingCount: number;
  // Privacy settings (only visible to profile owner)
  isProfilePublic?: boolean;
  autoAcceptFollowers?: boolean;
  showEventAttendance?: boolean;
  notifyFollowedUserEvents?: boolean;
  // Email preferences
  allowEventUpdateEmails?: boolean;
  allowWaitlistEmails?: boolean;
  allowCollaboratorEmails?: boolean;
}

export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email: string;
  createdAt: string;
  eventUser: EventUser | null;
  googleId?: string | null;
  isGoogleUser?: boolean;
  profilePicture?: string;
}

// Auth DTOs
export interface LoginDto {
  email: string;
  password: string;
  inviteToken?: string;
  inviteType?: 'collaborator' | 'ticket';
}

export type LoginResponse =
  | TokenPair
  | {
      success: boolean;
      needsVerification: boolean;
      message: string;
      userId: string;
      email: string;
    };

export interface LoginErrorResponse {
  needsVerification?: boolean;
  message: string;
  email?: string;
}

export interface RegisterDto {
  email: string;
  username: string;
  password: string;
  organizationName?: string;
  firstName?: string;
  lastName?: string;
  inviteToken?: string;
  inviteType?: 'collaborator' | 'ticket';
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  userId: string;
}

export interface VerifyEmailDto {
  email: string;
  code: string;
  organizationName?: string;
  firstName?: string;
  lastName?: string;
  inviteToken?: string;
  inviteType?: 'collaborator' | 'ticket';
}

export type VerifyEmailResponse = TokenPair;

export interface GoogleLoginDto {
  idToken: string;
  inviteToken?: string;
  inviteType?: 'collaborator' | 'ticket';
}

export interface GoogleRegisterDto {
  idToken: string;
  inviteToken?: string;
  inviteType?: 'collaborator' | 'ticket';
}

// JWT Payload interface
export interface JWTPayload {
  sub: string; // user id
  email: string;
  verified: boolean;
  iat?: number;
  exp?: number;
}

// Auth Context State
export interface AuthState {
  user: User | null;
  eventUser: EventUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
