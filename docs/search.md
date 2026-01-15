# Search - Frontend Implementation Guide

## Endpoints Overview

| Endpoint | Use Case |
|----------|----------|
| `/search/unified` | All (events + calendars + users) |
| `/search/unified?type=events` | Events only |
| `/search/unified?type=calendars` | Calendars only |
| `/search/unified?type=users` | Users only |
| `/search/unified?type=events,calendars` | Events + Calendars |
| `/search/unified?type=events,users` | Events + Users |
| `/search/users` | Users only (legacy endpoint) |

The `type` param accepts comma-separated values: `events`, `calendars`, `users`.
Default (no type): returns all three.

---

## Unified Search

### GET /search/unified?q=query

**Query Params:**
| Param | Type | Default |
|-------|------|---------|
| `q` | string | required |
| `type` | string | `events,calendars,users` |
| `skip` | number | 0 |
| `take` | number | 10 (max 50) |

**Response:**
```typescript
{
  events?: { items: EventResponseDto[]; total: number };
  calendars?: { items: CalendarSearchResult[]; total: number };
  users?: { items: UserSearchResult[]; total: number };
  query: string;
  skip: number;
  take: number;
}
```

Only requested types are included in the response.

---

## Examples

### All Results (default)
```
GET /search/unified?q=music
```
Returns events, calendars, and users matching "music".

### Events Only
```
GET /search/unified?q=concert&type=events
```
Response contains only `events` field.

### Events + Calendars
```
GET /search/unified?q=jazz&type=events,calendars
```
Response contains `events` and `calendars` fields.

### Users Only
```
GET /search/unified?q=john&type=users
```
Response contains only `users` field.

---

## Response Types

```typescript
interface CalendarSearchResult {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  isPrivate: boolean;
  ownerUsername: string;
}

interface UserSearchResult {
  id: string;
  firstName: string | null;
  lastName: string | null;
  organizationName: string | null;
  profilePicture: string | null;
  username: string;
  followerCount: number;
  followStatus?: 'following' | 'pending' | 'not_following';
}
```

Types exported from `@/types/search`.

---

## Navigation

| Type | Route |
|------|-------|
| Event | `/events/{id}` |
| Calendar | `/calendars/{id}` |
| User | `/u/{username}` |

---

## Notes

- No auth required, but authenticated users get `followStatus` on user results
- Only published public events and public calendars returned
- Users searched by username only
- Handle 429 (rate limit) gracefully
