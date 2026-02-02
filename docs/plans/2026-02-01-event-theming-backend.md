# Event Page Theming - Backend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add backend support for storing and serving per-event theme configuration as a lightweight JSON string.

**Architecture:** Add a nullable `eventTheme` TEXT column to the event table. The stored value is a small JSON object containing only string references (preset IDs, background type, pattern name) - not raw color values. The backend treats it as an opaque string. All color resolution happens on the frontend.

**Tech Stack:** NestJS, TypeORM, PostgreSQL (assumed)

---

## What gets stored

The `eventTheme` column holds a compact JSON string like:

```json
{"type":"solid","colorPalette":"midnight"}
```

```json
{"type":"landscape","image":"ocean","imageOpacity":0.4,"colorPalette":"beach"}
```

```json
{"type":"shader","shaderPreset":"aurora","colorPalette":"arctic"}
```

```json
{"type":"pattern","pattern":"dots","colorPalette":"matcha"}
```

Typical size: 30-80 bytes. No color values, no nested objects - just IDs that the frontend resolves against its preset constants.

---

## Tasks

### Task 1: Create database migration

**Files:**
- Create: `src/migrations/XXXXXX-AddEventTheme.ts`

**Step 1: Generate or create migration**

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventTheme1706745600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "events" ADD COLUMN "event_theme" TEXT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "events" DROP COLUMN "event_theme"`
    );
  }
}
```

**Step 2: Run migration**
```bash
npm run migration:run
```

**Step 3: Commit**
```bash
git add src/migrations/
git commit -m "feat: add event_theme column migration"
```

---

### Task 2: Update Event entity

**Files:**
- Modify: `src/features/event-management/events/entities/event.entity.ts`

**Step 1: Add column to entity**

```typescript
@Column({ type: 'text', nullable: true, name: 'event_theme' })
eventTheme: string | null;
```

**Step 2: Commit**
```bash
git add src/features/event-management/events/entities/event.entity.ts
git commit -m "feat: add eventTheme column to Event entity"
```

---

### Task 3: Update Create Event DTO

**Files:**
- Modify: `src/features/event-management/events/dto/create-event.dto.ts`

**Step 1: Add field with validation**

```typescript
@IsOptional()
@IsString()
@MaxLength(500) // These are tiny JSON strings (~30-80 bytes)
eventTheme?: string;
```

**Step 2: Commit**
```bash
git add src/features/event-management/events/dto/create-event.dto.ts
git commit -m "feat: add eventTheme to CreateEventDto"
```

---

### Task 4: Update Update Event DTO

**Files:**
- Modify: `src/features/event-management/events/dto/update-event.dto.ts`

**Step 1: Add field with validation**

```typescript
@IsOptional()
@IsString()
@MaxLength(500)
eventTheme?: string;
```

**Step 2: Commit**
```bash
git add src/features/event-management/events/dto/update-event.dto.ts
git commit -m "feat: add eventTheme to UpdateEventDto"
```

---

### Task 5: Update Response DTO / Serialization

**Files:**
- Modify: `src/features/event-management/events/dto/response.dto.ts`

**Step 1: Include eventTheme in response mapping**

```typescript
eventTheme: event.eventTheme ?? null,
```

Or if using class-transformer:
```typescript
@Expose()
eventTheme: string | null;
```

**Step 2: Commit**
```bash
git add src/features/event-management/events/dto/response.dto.ts
git commit -m "feat: include eventTheme in event response DTO"
```

---

### Task 6: Update Event Service (create & update)

**Files:**
- Modify: `src/features/event-management/events/events.service.ts`

**Step 1: Handle eventTheme in create**

```typescript
const event = this.eventRepository.create({
  ...existingFields,
  eventTheme: dto.eventTheme ?? null,
});
```

**Step 2: Handle eventTheme in update**

```typescript
if (dto.eventTheme !== undefined) {
  event.eventTheme = dto.eventTheme;
}
```

**Step 3: Optional JSON validation**

```typescript
if (dto.eventTheme) {
  try {
    JSON.parse(dto.eventTheme);
  } catch {
    throw new BadRequestException('eventTheme must be valid JSON');
  }
}
```

**Step 4: Commit**
```bash
git add src/features/event-management/events/events.service.ts
git commit -m "feat: handle eventTheme in event create and update service"
```

---

### Task 7: Verify retrieval includes theme

**Files:**
- Check: `src/features/event-management/events/events.service.ts` (findById, findAll)

**Step 1: Ensure column is selected**

If queries use explicit `select` clauses, add `eventTheme`. If using `find()` without select, it's included automatically.

**Step 2: Smoke test**

```bash
# Create event with theme
curl -X POST /api/events \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","eventTheme":"{\"type\":\"solid\",\"colorPalette\":\"midnight\"}",...}'

# Verify it comes back
curl /api/events/{id}
# Should include: "eventTheme": "{\"type\":\"solid\",\"colorPalette\":\"midnight\"}"
```

**Step 3: Commit if changes needed**
```bash
git add src/features/event-management/events/
git commit -m "feat: verify eventTheme included in event queries"
```

---

## Summary

| Change | Description |
|--------|------------|
| Migration | Add `event_theme TEXT NULL` column |
| Entity | Add `@Column` for `eventTheme` |
| Create DTO | Optional string, max 500 chars |
| Update DTO | Optional string, max 500 chars |
| Response DTO | Expose `eventTheme` in response |
| Service | Pass through on create/update, validate JSON |

The backend is intentionally thin. It stores ~50 bytes of preset references per event. The frontend's `src/lib/theme-presets.ts` is the single source of truth for what `"midnight"` or `"dots"` actually means in terms of colors and rendering.
