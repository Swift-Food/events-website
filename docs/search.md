# Search - Frontend Implementation Guide

## Endpoints Overview

| Endpoint | Use Case |
|----------|----------|
| `/search/unified` | Events + Calendars (default) |
| `/search/unified?type=events` | Events only |
| `/search/unified?type=calendars` | Calendars only |
| `/search/users` | People only |

---

## Events + Calendars (Combined)

### GET /search/unified?q=query

**Query Params:**
| Param | Type | Default |
|-------|------|---------|
| `q` | string | required |
| `skip` | number | 0 |
| `take` | number | 10 (max 50) |

**Response:**
```typescript
{
  events: { items: EventResponseDto[]; total: number };
  calendars: { items: CalendarSearchResult[]; total: number };
  query: string;
  skip: number;
  take: number;
}
```

---

## Events Only

### GET /search/unified?type=events

**Query Params:**
| Param | Type | Default |
|-------|------|---------|
| `q` | string | required |
| `type` | string | 'events' |
| `skip` | number | 0 |
| `take` | number | 10 (max 50) |

**Response:**
```typescript
{
  events: { items: EventResponseDto[]; total: number };
  query: string;
  skip: number;
  take: number;
}
```

---

## Calendars Only

### GET /search/unified?type=calendars

**Query Params:**
| Param | Type | Default |
|-------|------|---------|
| `q` | string | required |
| `type` | string | 'calendars' |
| `skip` | number | 0 |
| `take` | number | 10 (max 50) |

**Response:**
```typescript
{
  calendars: { items: CalendarSearchResult[]; total: number };
  query: string;
  skip: number;
  take: number;
}
```

---

## People Only

### GET /search/users

**Query Params:**
| Param | Type | Default |
|-------|------|---------|
| `q` | string | required |
| `skip` | number | 0 |
| `take` | number | 10 (max 50) |

**Response:**
```typescript
{
  users: UserSearchResult[];
  total: number;
  skip: number;
  take: number;
  query: string;
}
```

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
