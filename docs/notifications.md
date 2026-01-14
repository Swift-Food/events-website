# Notifications System - Frontend Implementation Guide

## API Base URL

```
/notifications
```

All endpoints require JWT authentication.

---

## Endpoints

### GET /notifications

Fetch paginated notifications.

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `skip` | number | 0 | Offset |
| `take` | number | 20 | Limit (max 50) |
| `type` | string | - | Filter by type (optional) |
| `unreadOnly` | boolean | false | Only unread |

**Response:**
```typescript
{
  notifications: EventNotificationResponse[];
  total: number;
  skip: number;
  take: number;
  unreadCount: number;
}
```

### GET /notifications/unread-count

**Response:**
```typescript
{ count: number }
```

### POST /notifications/:id/read

Mark single notification as read.

**Response:**
```typescript
{ success: boolean; readAt: string }
```

### POST /notifications/read-all

Mark all as read.

**Response:**
```typescript
{ success: boolean; markedCount: number }
```

### DELETE /notifications/:id

Delete/dismiss notification.

**Response:**
```typescript
{ success: boolean }
```

---

## Notification Response Shape

```typescript
interface EventNotificationResponse {
  id: string;
  type: EventNotificationType;
  title: string;
  body: string | null;
  availableActions: NotificationActionType[];
  relatedEventId: string | null;
  relatedUserId: string | null;           // EventUser ID (for follow actions)
  relatedTicketId: string | null;
  relatedCollaboratorId: string | null;   // For collaborator actions
  relatedUser?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profilePicture: string | null;
    username: string;
  };
  relatedEvent?: {
    id: string;
    name: string;
    eventImage: string | null;
  };
  readAt: string | null;
  createdAt: string;
}
```

---

## Notification Types & Actions

### Follower Notifications

| Type | Title Example | Actions | Metadata Used |
|------|---------------|---------|---------------|
| `follow_request` | "John Doe wants to follow you" | `accept_follow`, `reject_follow`, `view_profile` | `relatedUser` |
| `new_follower` | "John Doe started following you" | `view_profile` | `relatedUser` |
| `follow_accepted` | "John Doe accepted your follow request" | `view_profile` | `relatedUser` |
| `followed_user_attending` | "John Doe is going to Tech Meetup" | `view_event` | `relatedUser`, `relatedEvent` |
| `followed_user_new_event` | "John Doe created a new event" | `view_event` | `relatedUser`, `relatedEvent` |

### Attendee Notifications

| Type | Title Example | Actions | Metadata Used |
|------|---------------|---------|---------------|
| `ticket_confirmed` | "Ticket confirmed!" | `view_ticket` | `relatedEvent`, `relatedTicketId` |
| `waitlist_promoted` | "You're off the waitlist!" | `view_ticket` | `relatedEvent`, `relatedTicketId` |
| `event_cancelled` | "Tech Meetup has been cancelled" | `view_event` | `relatedEvent` |
| `event_details_changed` | "Tech Meetup details updated" | `view_event` | `relatedEvent` |
| `pending_payment_reminder` | "Complete your payment" | `complete_payment` | `relatedEvent`, `relatedTicketId` |

### Organizer Notifications

| Type | Title Example | Actions | Metadata Used |
|------|---------------|---------|---------------|
| `new_registration` | "New registration from John Doe" | `view_attendee`, `view_dashboard` | `relatedUser`, `relatedEvent` |
| `registration_summary` | "5 new registrations" | `view_dashboard` | `relatedEvent` |
| `collaborator_invite` | "You've been invited to collaborate" | `accept_collab`, `reject_collab`, `view_event` | `relatedEvent`, `relatedCollaboratorId` (internal) |
| `collaborator_accepted` | "John Doe accepted your invite" | `view_collaborators` | `relatedUser`, `relatedEvent` |
| `waitlist_pressure_alert` | "5 people waiting" | `view_dashboard` | `relatedEvent` |

---

## Action Handling

Actions are **NOT** handled by the notifications API. The frontend must call the appropriate endpoint directly.

**Important:** The `availableActions` array contains ALL actions for that notification. Render all of them - for example, `follow_request` has `[accept_follow, reject_follow, view_profile]` so you show Accept button, Reject button, AND a View Profile link.

### Action → Endpoint Mapping

| Action | Endpoint | Notes |
|--------|----------|-------|
| `view_profile` | Navigate to `/u/{username}` | Use `relatedUser.username` |
| `view_event` | Navigate to `/events/{id}` | Use `relatedEventId` |
| `view_ticket` | Navigate to `/tickets/{id}` | Use `relatedTicketId` |
| `view_dashboard` | Navigate to `/events/{id}/dashboard` | Use `relatedEventId` |
| `view_attendee` | Navigate to `/events/{id}/dashboard/attendees` | Use `relatedEventId` |
| `view_collaborators` | Navigate to `/events/{id}/dashboard/team` | Use `relatedEventId` |
| `accept_follow` | `POST /event-users/follow-requests/user/{userId}/accept` | Use `relatedUserId` |
| `reject_follow` | `DELETE /event-users/follow-requests/user/{userId}` | Use `relatedUserId` |
| `accept_collab` | `POST /events/collaborators/{collaboratorId}/accept` | Use `relatedCollaboratorId` |
| `reject_collab` | `DELETE /events/collaborators/{collaboratorId}/reject` | Use `relatedCollaboratorId` |
| `complete_payment` | Navigate to `/payments/ticket/{ticketId}` | Use `relatedTicketId` |

### Handling Actions

All actionable notifications include the ID needed to execute the action. One API call each:

```typescript
async function handleNotificationAction(
  notification: EventNotificationResponse,
  action: NotificationActionType
) {
  switch (action) {
    // Follow actions - use relatedUserId (the EventUser ID)
    case 'accept_follow':
      await api.post(`/event-users/follow-requests/user/${notification.relatedUserId}/accept`);
      break;
    case 'reject_follow':
      await api.delete(`/event-users/follow-requests/user/${notification.relatedUserId}`);
      break;

    // Collaborator actions - use relatedCollaboratorId
    case 'accept_collab':
      await api.post(`/events/collaborators/${notification.relatedCollaboratorId}/accept`);
      break;
    case 'reject_collab':
      await api.delete(`/events/collaborators/${notification.relatedCollaboratorId}/reject`);
      break;

    // Navigation actions - just navigate, no API call
    case 'view_profile':
      router.push(`/u/${notification.relatedUser?.username}`);
      break;
    case 'view_event':
      router.push(`/events/${notification.relatedEventId}`);
      break;
    case 'view_ticket':
      router.push(`/tickets/${notification.relatedTicketId}`);
      break;
    case 'view_dashboard':
      router.push(`/events/${notification.relatedEventId}/dashboard`);
      break;
    case 'view_attendee':
      router.push(`/events/${notification.relatedEventId}/dashboard/attendees`);
      break;
    case 'view_collaborators':
      router.push(`/events/${notification.relatedEventId}/dashboard/team`);
      break;
    case 'complete_payment':
      router.push(`/payments/ticket/${notification.relatedTicketId}`);
      break;
  }

  // Mark as read after action
  await api.post(`/notifications/${notification.id}/read`);
}
```

---

## UI Recommendations

### Notification List Item

For actionable notifications (`follow_request`, `collaborator_invite`), show BOTH action buttons AND navigation:

```
┌─────────────────────────────────────────────────────────┐
│ [Avatar]  Title (clickable → view_profile)   2h ago  •  │
│           Body text here                                │
│           [Accept] [Reject] [View Profile]              │
└─────────────────────────────────────────────────────────┘
```

For non-actionable notifications, show navigation only:

```
┌─────────────────────────────────────────────────────────┐
│ [Avatar]  Title                              2h ago  •  │
│           Body text here                                │
│           [View Event]                                  │
└─────────────────────────────────────────────────────────┘
```

- Avatar/title can be clickable as the primary navigation action
- Render ALL buttons from `availableActions` array - don't pick one or the other
- Show blue dot if `readAt === null`
- Format `createdAt` as relative time

### Polling

```typescript
// Poll unread count every 30s for badge
setInterval(async () => {
  const { count } = await api.get('/notifications/unread-count');
  setBadgeCount(count);
}, 30000);
```

### Infinite Scroll

```typescript
const [notifications, setNotifications] = useState([]);
const [skip, setSkip] = useState(0);
const take = 20;

async function loadMore() {
  const { notifications: batch } = await api.get('/notifications', {
    params: { skip, take }
  });
  setNotifications(prev => [...prev, ...batch]);
  setSkip(prev => prev + take);
}
```

---

## Types (copy to frontend)

```typescript
enum EventNotificationType {
  FOLLOW_REQUEST = 'follow_request',
  NEW_FOLLOWER = 'new_follower',
  FOLLOW_ACCEPTED = 'follow_accepted',
  FOLLOWED_USER_ATTENDING = 'followed_user_attending',
  FOLLOWED_USER_NEW_EVENT = 'followed_user_new_event',
  WAITLIST_PROMOTED = 'waitlist_promoted',
  EVENT_CANCELLED = 'event_cancelled',
  EVENT_DETAILS_CHANGED = 'event_details_changed',
  TICKET_CONFIRMED = 'ticket_confirmed',
  NEW_REGISTRATION = 'new_registration',
  REGISTRATION_SUMMARY = 'registration_summary',
  COLLABORATOR_INVITE = 'collaborator_invite',
  COLLABORATOR_ACCEPTED = 'collaborator_accepted',
  PENDING_PAYMENT_REMINDER = 'pending_payment_reminder',
  WAITLIST_PRESSURE_ALERT = 'waitlist_pressure_alert',
}

enum NotificationActionType {
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
}
```

Types are already exported from `@/types/notification`.

---

## Email Preferences

Users can control which emails they receive via their profile settings.

### Available Preferences

| Preference | Description | Default |
|------------|-------------|---------|
| `allowEmailNotifications` | Master toggle for all emails | true |
| `allowTicketReminders` | Event reminder emails | true |
| `allowEventUpdateEmails` | Event detail changes (date, time, location) | true |
| `allowWaitlistEmails` | Waitlist notifications | true |
| `allowCollaboratorEmails` | Collaborator invites and updates | true |
| `notifyFollowedUserEvents` | When followed users create events | true |

### Update Preferences

```
PATCH /event-users/me
```

**Request Body:**
```typescript
{
  allowEmailNotifications?: boolean;
  allowTicketReminders?: boolean;
  allowEventUpdateEmails?: boolean;
  allowWaitlistEmails?: boolean;
  allowCollaboratorEmails?: boolean;
  notifyFollowedUserEvents?: boolean;
}
```

**Response:**
```typescript
{
  success: boolean;
  eventUser: EventUserResponse;
}
```

### UI Recommendation

Group preferences in settings page:

```
Email Notifications
├── [ ] Master toggle (allowEmailNotifications)
│
├── Events
│   ├── [ ] Event reminders
│   ├── [ ] Event updates (date/time/location changes)
│   └── [ ] Waitlist notifications
│
├── Social
│   └── [ ] When people I follow create events
│
└── Organizer
    └── [ ] Collaborator invites
```

When master toggle is OFF, disable all other toggles visually.
