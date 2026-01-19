// Event Notification types

export enum EventNotificationType {
  // Follower notifications
  FOLLOW_REQUEST = 'follow_request',
  NEW_FOLLOWER = 'new_follower',
  FOLLOW_ACCEPTED = 'follow_accepted',
  FOLLOWED_USER_ATTENDING = 'followed_user_attending',
  FOLLOWED_USER_NEW_EVENT = 'followed_user_new_event',
  // Attendee notifications
  WAITLIST_PROMOTED = 'waitlist_promoted',
  EVENT_CANCELLED = 'event_cancelled',
  EVENT_DETAILS_CHANGED = 'event_details_changed',
  TICKET_CONFIRMED = 'ticket_confirmed',
  // Organizer notifications
  NEW_REGISTRATION = 'new_registration',
  REGISTRATION_SUMMARY = 'registration_summary',
  COLLABORATOR_INVITE = 'collaborator_invite',
  COLLABORATOR_ACCEPTED = 'collaborator_accepted',
  // Payment & alerts
  PENDING_PAYMENT_REMINDER = 'pending_payment_reminder',
  WAITLIST_PRESSURE_ALERT = 'waitlist_pressure_alert',
  // Group purchase notifications
  GROUP_TICKET_INVITE = 'group_ticket_invite',
  GROUP_INVITE_ACCEPTED = 'group_invite_accepted',
  GROUP_INVITE_DECLINED = 'group_invite_declined',
  GROUP_KICKED = 'group_kicked',
  GROUP_DISSOLVED = 'group_dissolved',
  GROUP_EXPIRED = 'group_expired',
  GROUP_PURCHASE_COMPLETE = 'group_purchase_complete',
}

export enum NotificationActionType {
  VIEW_PROFILE = 'view_profile',
  VIEW_EVENT = 'view_event',
  VIEW_TICKET = 'view_ticket',
  VIEW_DASHBOARD = 'view_dashboard',
  VIEW_ATTENDEE = 'view_attendee',
  VIEW_COLLABORATORS = 'view_collaborators',
  ACCEPT_FOLLOW = 'accept_follow',
  REJECT_FOLLOW = 'reject_follow',
  ACCEPT_COLLAB = 'accept_collab',
  REJECT_COLLAB = 'reject_collab',
  COMPLETE_PAYMENT = 'complete_payment',
  // Group purchase actions
  ACCEPT_GROUP_INVITE = 'accept_group_invite',
  DECLINE_GROUP_INVITE = 'decline_group_invite',
  VIEW_GROUP = 'view_group',
}

// Related user data for display
export interface RelatedUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  profilePicture: string | null;
  username: string;
}

// Related event data for display
export interface RelatedEvent {
  id: string;
  name: string;
  eventImage: string | null;
}

// Response for a single notification
export interface EventNotificationResponse {
  id: string;
  type: EventNotificationType;
  title: string;
  body: string | null;
  availableActions: NotificationActionType[];
  relatedEventId: string | null;
  relatedUserId: string | null;
  relatedTicketId: string | null;
  relatedCollaboratorId: string | null;
  relatedGroupSessionId: string | null;
  relatedUser?: RelatedUser;
  relatedEvent?: RelatedEvent;
  readAt: string | null;
  createdAt: string;
}

// Paginated list response
export interface NotificationListResponse {
  notifications: EventNotificationResponse[];
  total: number;
  skip: number;
  take: number;
  unreadCount: number;
}

// Action response
export interface NotificationActionResponse {
  success: boolean;
  message: string;
  redirectTo?: string;
}

// Unread count response
export interface UnreadCountResponse {
  count: number;
}

// Mark as read response
export interface MarkAsReadResponse {
  success: boolean;
  readAt: string;
}

// Mark all as read response
export interface MarkAllAsReadResponse {
  success: boolean;
  markedCount: number;
}

// Delete notification response
export interface DeleteNotificationResponse {
  success: boolean;
}

// Query params for fetching notifications
export interface NotificationQueryParams {
  skip?: number;
  take?: number;
  type?: EventNotificationType;
  unreadOnly?: boolean;
}
