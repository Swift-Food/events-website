# Event Page Theming Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add per-event theming (color palettes, landscape backgrounds, shader gradients, SVG patterns) to the event page, with a slide-up theme editor in the event creation/update flow.

**Architecture:** The event stores lightweight string references (palette ID, background type, pattern name, etc.) - not raw color values. All preset definitions live in frontend constants (`src/lib/theme-presets.ts`) as the single source of truth. The event page resolves these IDs into actual colors/settings at render time. The creation form gets a slide-up theme panel with background type selector and color palette picker.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, `@shadergradient/react` (lazy-loaded), Sonner (toasts)

---

## Data Model

### What the event stores (lightweight references)

The `eventTheme` field on the event is a small JSON string with only IDs/names:

```typescript
// Stored on the event - just references, no color values
export interface EventThemeConfig {
  type: 'solid' | 'landscape' | 'shader' | 'pattern';
  colorPalette: string;          // preset ID e.g. "midnight", "matcha", "slate"
  // Background-type-specific (only the relevant fields are present)
  image?: string;                // landscape only: "desert", "lake", "mountain", "night-sky", "ocean"
  imageOpacity?: number;         // landscape only: 0-1
  shaderPreset?: string;         // shader only: "aurora", "sunset", etc.
  pattern?: string;              // pattern only: "dots", "grid", "stripes", "checkers", "crosses"
}
```

Example stored values:
```json
{ "type": "solid", "colorPalette": "midnight" }
{ "type": "landscape", "image": "ocean", "imageOpacity": 0.4, "colorPalette": "beach" }
{ "type": "shader", "shaderPreset": "aurora", "colorPalette": "arctic" }
{ "type": "pattern", "pattern": "dots", "colorPalette": "matcha" }
```

### Frontend preset definitions (single source of truth)

All actual color values, shader configs, and pattern SVGs live in `src/lib/theme-presets.ts`:

```typescript
// Color palette definition - the actual colors for rendering
export interface ColorPalette {
  pageBackground: string;
  cardBackground: string;
  cardSecondaryBackground: string;
  mainTextColor: string;
  subTextColor: string;
  primaryColor: string;
  borderEnabled: boolean;
  borderColor: string;
}

// Palette preset with preview swatches
export interface PalettePreset {
  id: string;                       // e.g. "midnight" - matches EventThemeConfig.colorPalette
  name: string;                     // e.g. "Midnight" - display name
  colors: [string, string, string]; // 3 swatch hex colors for the picker preview
  palette: ColorPalette;            // full resolved colors
}

// Shader gradient preset
export interface ShaderPreset {
  id: string;       // e.g. "aurora" - matches EventThemeConfig.shaderPreset
  name: string;     // e.g. "Aurora"
  color1: string;
  color2: string;
  color3: string;
}

// Landscape option
export interface LandscapeOption {
  id: string;       // e.g. "ocean" - matches EventThemeConfig.image
  name: string;     // e.g. "Ocean"
  filename: string; // e.g. "Ocean.jpg" - path under /Landscape theme/
}

// Pattern option
export interface PatternOption {
  id: string;       // e.g. "dots" - matches EventThemeConfig.pattern
  name: string;     // e.g. "Dots"
}
```

### Resolution flow (event page)

```
Event record: { type: "pattern", pattern: "dots", colorPalette: "matcha" }
       ↓
Frontend lookup: PALETTE_MAP["matcha"] → full ColorPalette with all rgba values
                 PATTERN_MAP["dots"] → SVG generator function
       ↓
Pattern color: derived from palette.mainTextColor at 15% opacity (no extra config)
Background color: palette.pageBackground
       ↓
Render
```

### Color Mapping

### Color Mapping

**Multi-color palettes** use 3 colors:

| Swatch position | Role |
|---|---|
| Color 1 (left) | `mainTextColor` + `primaryColor` |
| Color 2 (middle) | `cardBackground` |
| Color 3 (right) | `pageBackground` |

Derived values:
- `cardSecondaryBackground` = color 2 at ~50% opacity
- `subTextColor` = color 1 at ~60-70% opacity
- `borderColor` = color 2 at ~30% opacity
- `borderEnabled` = false (default for all presets)

**Single-color palettes** use 2 colors (pastel/light themes):

| Swatch position | Role |
|---|---|
| Lighter color (top) | `pageBackground` at 100% opacity |
| Darker color (bottom) | `cardBackground` at 48% opacity |

Fixed derived values:
- `cardSecondaryBackground` = `#ffffff` at 48% opacity
- `mainTextColor` = `#000000` at 58% opacity
- `subTextColor` = `#000000` at 58% opacity
- `primaryColor` = `#000000` at 58% opacity
- `borderColor` = `#ffffff` at 0% opacity (invisible)
- `borderEnabled` = false

### Preset Palettes

Two categories (displayed as tabs in the picker):

**Single-color palettes** (minimal, pastel - light backgrounds with dark text):
- `default` (Default): bg=`#222222`, card=`#2a2a2a` - current site dark theme (exception: light text)
- `sky`: bg=`#a1bdf6`, card=`#87aaf2`
- `peach`: bg=`#ffbee0`, card=`#f89bcc`
- `lime`: bg=`#f6e57d`, card=`#fcd905`
- `tangerine`: bg=`#fbb858`, card=`#ff9806`
- `lavender`: bg=`#d9bef5`, card=`#caa2f4`
- `sage`: bg=`#c3e26c`, card=`#9acb12`

**Multi-color palettes** (from reference image):
- `matcha`: `#f9c8db`, `#7b9d2f`, `#5f7b24`
- `desert`: `#ff6d2a`, `#ffc2b3`, `#ffe9bd`
- `arctic`: `#1c4074`, `#c6dcda`, `#f8f5e6`
- `meadow`: `#0e8622`, `#cee29a`, `#ddf2eb`
- `dusk`: `#402c61`, `#92475c`, `#f3a39c`
- `beach`: `#2e80e4`, `#afcff6`, `#f8e6a8`
- `garden`: `#929124`, `#f6c9dd`, `#d0e3f4`
- `midnight`: `#ececec`, `#596394`, `#1c275f`

### Shader Gradient Presets

Pre-defined 3-color combos (same waterPlane effect as landing page, only colors differ):

- `aurora`: `#b8e7f5`, `#d9ccff`, `#faf9f6`
- `sunset`: `#ff6d2a`, `#ffc2b3`, `#1c275f`
- `ocean`: `#0e8622`, `#2e80e4`, `#afcff6`
- `lavender`: `#d9ccff`, `#f9c8db`, `#f8f5e6`
- `fire`: `#ff6d2a`, `#f3a39c`, `#ffe9bd`
- `forest`: `#5f7b24`, `#7b9d2f`, `#ddf2eb`

---

## Tasks

### Task 1: Define theme types and preset data

**Files:**
- Create: `src/types/event/theme.ts`
- Create: `src/lib/theme-presets.ts`
- Modify: `src/types/event/index.ts` (re-export theme types)

**Step 1: Create theme type definitions**

Create `src/types/event/theme.ts` with:
- `EventThemeConfig` interface (the lightweight stored config with string references)
- `ColorPalette` interface (the resolved color values)
- `PalettePreset`, `ShaderPreset`, `LandscapeOption`, `PatternOption` interfaces
- `BackgroundType` = `'solid' | 'landscape' | 'shader' | 'pattern'`

**Step 2: Create preset data file**

Create `src/lib/theme-presets.ts` with:
- `DEFAULT_THEME_CONFIG: EventThemeConfig` = `{ type: 'solid', colorPalette: 'default' }`
- `SINGLE_COLOR_PALETTES: PalettePreset[]` - minimal pastel palettes. Each has 2 colors (lighter + darker shade). Fixed mapping: `pageBackground` = lighter at 100%, `cardBackground` = darker at 48%, `cardSecondaryBackground` = #ffffff at 48%, `mainTextColor` = #000000 at 58%, `subTextColor` = #000000 at 58%, `primaryColor` = #000000 at 58%, `borderColor` = #ffffff at 0%. The `default` palette is the exception (dark theme with light text).
- `MULTI_COLOR_PALETTES: PalettePreset[]` - the 8 palettes from the reference image. 3 colors: color1=mainTextColor+primaryColor, color2=cardBackground, color3=pageBackground. `cardSecondaryBackground` = color2 at 50% opacity, `subTextColor` = color1 at 65% opacity, `borderColor` = color2 at 30% opacity
- `ALL_PALETTES: PalettePreset[]` - combined list
- `PALETTE_MAP: Record<string, PalettePreset>` - lookup by ID for O(1) resolution
- `SHADER_PRESETS: ShaderPreset[]` - 6 shader gradient presets
- `SHADER_MAP: Record<string, ShaderPreset>` - lookup by ID
- `LANDSCAPE_OPTIONS: LandscapeOption[]` - 5 landscape images
- `LANDSCAPE_MAP: Record<string, LandscapeOption>` - lookup by ID
- `PATTERN_OPTIONS: PatternOption[]` - 5 patterns
- SVG pattern generator functions (`generateDots`, `generateGrid`, `generateStripes`, `generateCheckers`, `generateCrosses`) from user's specification
- `getPatternCSS(patternId: string, palette: ColorPalette): string` - returns the CSS `background-image` value, using `palette.mainTextColor` at 15% opacity for the pattern color and `palette.pageBackground` for the background
- `resolveTheme(config: EventThemeConfig): { palette: ColorPalette; shader?: ShaderPreset; landscape?: LandscapeOption }` - master resolver function

**Step 3: Re-export from index**

Add `export * from './theme';` to `src/types/event/index.ts`.

**Step 4: Commit**
```bash
git add src/types/event/theme.ts src/lib/theme-presets.ts src/types/event/index.ts
git commit -m "feat: add event theme type definitions and preset data"
```

---

### Task 2: Add theme state to EventCreationContext

**Files:**
- Modify: `src/context/EventCreationContext.tsx`

**Step 1: Add theme imports and state**

Import `EventThemeConfig` and `DEFAULT_THEME_CONFIG` at top of file.

Add to `EventCreationContextType` interface:
```typescript
eventTheme: EventThemeConfig;
setEventTheme: Dispatch<SetStateAction<EventThemeConfig>>;
```

Add to `EventDraft` type:
```typescript
eventTheme: EventThemeConfig;
```

**Step 2: Add useState for theme**

After existing state declarations (~line 306):
```typescript
const [eventTheme, setEventTheme] = useState<EventThemeConfig>(
  storedDraft.eventTheme ?? DEFAULT_THEME_CONFIG
);
```

**Step 3: Add to persistence payload**

Add `eventTheme` to the `persistEventDraft` payload object and its dependency array.

**Step 4: Add to clearForm**

Add `setEventTheme(DEFAULT_THEME_CONFIG);` to `clearForm()`.

**Step 5: Add to provider value**

Add `eventTheme, setEventTheme` to the `<EventCreationContext.Provider value={...}>`.

**Step 6: Commit**
```bash
git add src/context/EventCreationContext.tsx
git commit -m "feat: add eventTheme state to EventCreationContext"
```

---

### Task 3: Add theme field to DTOs

**Files:**
- Modify: `src/types/event/request/event.dto.ts`
- Modify: `src/types/event/response/event.dto.ts`

**Step 1: Add theme to request DTOs**

In `CreateEventDto`, add:
```typescript
eventTheme?: string; // JSON-stringified EventThemeConfig
```

In `UpdateEventDto`, add the same field.

**Step 2: Add theme to response DTO**

In `EventResponseDto`, add:
```typescript
eventTheme?: string | null; // JSON-stringified EventThemeConfig from backend
```

**Step 3: Commit**
```bash
git add src/types/event/request/event.dto.ts src/types/event/response/event.dto.ts
git commit -m "feat: add eventTheme field to event DTOs"
```

---

### Task 4: Create the EventThemeProvider context

**Files:**
- Create: `src/context/EventThemeContext.tsx`

This context wraps the event detail page. It parses the event's theme JSON, resolves preset IDs to actual colors, and provides the resolved values.

**Step 1: Create the provider**

```typescript
"use client";
import { createContext, useContext, useMemo } from "react";
import { EventThemeConfig, ColorPalette } from "@/types/event/theme";
import { DEFAULT_THEME_CONFIG, resolveTheme, PALETTE_MAP } from "@/lib/theme-presets";
import type { ShaderPreset, LandscapeOption } from "@/types/event/theme";

interface EventThemeContextType {
  config: EventThemeConfig;
  palette: ColorPalette;
  shader?: ShaderPreset;
  landscape?: LandscapeOption;
}

const EventThemeContext = createContext<EventThemeContextType | null>(null);

export function EventThemeProvider({
  themeJson,
  children,
}: {
  themeJson?: string | null;
  children: React.ReactNode;
}) {
  const value = useMemo<EventThemeContextType>(() => {
    let config: EventThemeConfig;
    try {
      config = themeJson ? JSON.parse(themeJson) : DEFAULT_THEME_CONFIG;
    } catch {
      config = DEFAULT_THEME_CONFIG;
    }
    const resolved = resolveTheme(config);
    return { config, ...resolved };
  }, [themeJson]);

  return (
    <EventThemeContext.Provider value={value}>
      {children}
    </EventThemeContext.Provider>
  );
}

export function useEventTheme() {
  const ctx = useContext(EventThemeContext);
  if (!ctx) throw new Error("useEventTheme must be within EventThemeProvider");
  return ctx;
}
```

**Step 2: Commit**
```bash
git add src/context/EventThemeContext.tsx
git commit -m "feat: add EventThemeProvider context for event page theming"
```

---

### Task 5: Create theme background renderer component

**Files:**
- Create: `src/components/theme/EventThemeBackground.tsx`
- Create: `src/components/theme/ShaderBackgroundInner.tsx`

This renders the page background based on `config.type`.

**Step 1: Create ShaderBackgroundInner (lazy-loaded)**

Separate file so `@shadergradient/react` + Three.js is only bundled when shader type is used:

```typescript
"use client";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";
import type { ShaderPreset } from "@/types/event/theme";

export default function ShaderBackgroundInner({ preset }: { preset: ShaderPreset }) {
  return (
    <ShaderGradientCanvas>
      <ShaderGradient
        animate="on"
        brightness={1.2}
        color1={preset.color1}
        color2={preset.color2}
        color3={preset.color3}
        // ... same static props as landing page (waterPlane, etc.)
      />
    </ShaderGradientCanvas>
  );
}
```

**Step 2: Create EventThemeBackground**

Uses `useEventTheme()` to get config + resolved values. Renders as a fixed positioned background layer:

- `solid`: nothing extra (page background color handles it via palette)
- `landscape`: `<Image>` with the resolved filename, `opacity` from `config.imageOpacity`
- `shader`: `dynamic(() => import('./ShaderBackgroundInner'), { ssr: false })` - lazy loaded
- `pattern`: `<div>` with inline CSS using `getPatternCSS(config.pattern, palette)` for `backgroundImage`, and `palette.pageBackground` for `backgroundColor`

**Step 3: Commit**
```bash
git add src/components/theme/EventThemeBackground.tsx src/components/theme/ShaderBackgroundInner.tsx
git commit -m "feat: add EventThemeBackground with lazy-loaded shader support"
```

---

### Task 6: Create theme-aware style injector component

**Files:**
- Create: `src/components/theme/EventThemeStyles.tsx`

This injects a `<style>` tag that styles the description HTML based on the resolved palette.

**Step 1: Create the component**

Uses `useEventTheme()` to get palette. Outputs a `<style>` tag with `.themed-event` scoped selectors for:
- Description headings (h1-h3): `palette.mainTextColor`
- Paragraphs, list items: `palette.mainTextColor` at 90% opacity
- Blockquotes: `palette.subTextColor`, left border from `palette.borderColor`
- Links: `palette.primaryColor`
- Code blocks: `palette.cardSecondaryBackground`
- HR: `palette.borderColor`

Matches the pattern in `src/app/theme-test/page.tsx:1184-1243`.

**Step 2: Commit**
```bash
git add src/components/theme/EventThemeStyles.tsx
git commit -m "feat: add EventThemeStyles component for description theming"
```

---

### Task 7: Apply theming to EventClient.tsx

**Files:**
- Modify: `src/app/events/[id]/EventClient.tsx`

This is the largest task. Replace Tailwind color classes with inline styles driven by the resolved palette. Follow the exact same pattern as `theme-test/page.tsx`.

**Step 1: Wrap with EventThemeProvider**

Wrap content with `<EventThemeProvider themeJson={event.eventTheme}>`.

**Step 2: Add EventThemeBackground and EventThemeStyles**

Place `<EventThemeBackground />` as a fixed background layer.
Place `<EventThemeStyles />` for description styling.

**Step 3: Add a hook call to get resolved palette**

```typescript
const { palette, config } = useEventTheme();
```

Create helper functions (same as theme-test page):
```typescript
const primaryParsed = parseColor(palette.primaryColor);
const primaryWithAlpha = (alpha: number) => `rgba(${primaryParsed.r}, ...${alpha})`;
const mainTextParsed = parseColor(palette.mainTextColor);
const mainTextWithAlpha = (alpha: number) => `rgba(${mainTextParsed.r}, ...${alpha})`;
const borderStyle = palette.borderEnabled ? `1px solid ${palette.borderColor}` : "none";
```

**Step 4: Replace page background**

`<div className="min-h-screen bg-background">` -> `style={{ backgroundColor: config.type === 'solid' ? palette.pageBackground : 'transparent' }}` (non-solid types use the background component instead).

**Step 5: Replace card backgrounds**

All `bg-card-background` -> `style={{ backgroundColor: palette.cardBackground }}`
All `bg-card-secondary-background` -> `style={{ backgroundColor: palette.cardSecondaryBackground }}`

**Step 6: Replace text colors**

All `text-foreground` -> `style={{ color: palette.mainTextColor }}`
All `text-muted-foreground` -> `style={{ color: palette.subTextColor }}`

**Step 7: Replace primary/accent colors**

`bg-primary` buttons, dots, accent elements -> `style={{ backgroundColor: palette.primaryColor }}`

**Step 8: Replace borders**

Elements with `border` classes -> `style={{ border: borderStyle }}`

**Step 9: Apply themed description class**

Change the description `<div>` to include `themed-event` class.

**Step 10: Commit**
```bash
git add src/app/events/[id]/EventClient.tsx
git commit -m "feat: apply per-event theming to EventClient page"
```

---

### Task 8: Create the ThemePicker slide-up panel component

**Files:**
- Create: `src/components/theme/ThemePicker.tsx`

This is the bottom slide-up modal shown during event creation (matching the reference screenshot).

**Step 1: Create the component**

Props:
```typescript
interface ThemePickerProps {
  theme: EventThemeConfig;
  onChange: (theme: EventThemeConfig) => void;
  isOpen: boolean;
  onToggle: () => void;
}
```

Layout structure:
- Fixed at bottom, slides up/down with CSS transform
- Toggle button above: palette icon + "Theme" + chevron
- **Top section**: horizontal scroll of background type cards
  - 4 cards: Solid, Landscape, Shader, Pattern
  - Each card is a small thumbnail with a label. Selected gets a ring.
  - When selected, type-specific options appear inline below (see Task 9)
- **Bottom section**: "Colour" row with colour dot + palette name + chevron dropdown
  - Clicking opens palette selection panel
  - Two sub-tabs: "Single" and "Multi"
  - Grid of `PalettePreset` items, each showing:
    - 3-color swatch strip (the `colors` array)
    - Preset name below
  - Selected palette gets a ring/highlight
  - Selecting a palette updates `theme.colorPalette` to the preset ID

**Step 2: Commit**
```bash
git add src/components/theme/ThemePicker.tsx
git commit -m "feat: add ThemePicker slide-up panel component"
```

---

### Task 9: Create background-type-specific option components

**Files:**
- Create: `src/components/theme/LandscapeOptions.tsx`
- Create: `src/components/theme/ShaderOptions.tsx`
- Create: `src/components/theme/PatternOptions.tsx`

**Step 1: LandscapeOptions**

Props: `{ selected?: string; opacity?: number; onChange: (image: string, opacity: number) => void }`

Shows 5 landscape thumbnails (Desert, Lake, Mountain, Night Sky, Ocean) in a horizontal scroll. Each is a small `<Image>` from `/Landscape theme/`. Selected gets ring. Opacity slider (0-100%) below.

**Step 2: ShaderOptions**

Props: `{ selected?: string; onChange: (presetId: string) => void }`

Shows shader presets as small cards each displaying 3 color circles side-by-side. Selected gets ring. Preset name below each.

**Step 3: PatternOptions**

Props: `{ selected?: string; onChange: (pattern: string) => void }`

Shows 5 pattern type cards (dots, grid, stripes, checkers, crosses). Each renders a small preview using the SVG generator against a neutral background. Selected gets ring. No separate color pickers - colors come from the selected palette automatically.

**Step 4: Commit**
```bash
git add src/components/theme/LandscapeOptions.tsx src/components/theme/ShaderOptions.tsx src/components/theme/PatternOptions.tsx
git commit -m "feat: add background type option components for theme picker"
```

---

### Task 10: Integrate ThemePicker into EventForm

**Files:**
- Modify: `src/components/EventForm.tsx`

**Step 1: Add ThemePicker import and rendering**

Import `ThemePicker` and add local state `isThemePickerOpen`.

Render `<ThemePicker>` at the bottom of the form, wired to `eventTheme` and `setEventTheme` from `useEventCreation()`.

**Step 2: Add a theme preview row in the form**

Below the cover image section, add a clickable row showing:
- A small square thumbnail previewing the current background type (solid color swatch, landscape mini image, shader color dots, pattern SVG preview)
- "Theme" label + the display name of the current palette (e.g. "Midnight")
- A shuffle icon button that picks a random palette + background combo

Clicking the row toggles `isThemePickerOpen`.

**Step 3: Include theme in submission payload**

At `EventForm.tsx:576`, replace:
```typescript
eventColor: "#6366f1",
```
With:
```typescript
eventColor: resolveTheme(eventTheme).palette.primaryColor,
eventTheme: JSON.stringify(eventTheme),
```

Import `resolveTheme` from `@/lib/theme-presets`.

**Step 4: For edit mode, parse initial theme**

When `initialData` is provided (edit mode), parse `initialData.eventTheme` JSON string and call `setEventTheme()` with the resulting `EventThemeConfig`.

**Step 5: Commit**
```bash
git add src/components/EventForm.tsx
git commit -m "feat: integrate ThemePicker into event creation/update form"
```

---

### Task 11: Handle theme in event edit flow

**Files:**
- Modify: `src/app/event-management/[eventId]/edit/page.tsx` (or wherever the edit form loads initial data)

**Step 1: Pass theme to context**

When loading event data for editing, ensure `eventTheme` from the API response is parsed and set into `EventCreationContext` via `setEventTheme()`.

**Step 2: Commit**
```bash
git add src/app/event-management/
git commit -m "feat: load existing theme when editing events"
```

---

### Task 12: Visual testing and polish

**Files:**
- Various theme components

**Step 1: Test all 4 background types on the event page**

Verify each renders correctly:
- Solid: palette `pageBackground` as solid color
- Landscape: correct image, opacity overlay, readable text
- Shader: animated gradient with correct 3 colors, lazy loaded (check no Three.js bundle on non-shader events)
- Pattern: correct SVG pattern, derived pattern color at 15% opacity

**Step 2: Test all palette presets**

Verify each palette applies readable text over its background. Check card contrast.

**Step 3: Test unknown/missing theme gracefully**

Events without `eventTheme` (or with `null`) should render with `DEFAULT_THEME_CONFIG` (current site dark theme). Events with an unrecognized palette ID should fallback to default.

**Step 4: Test theme persistence**

Create event with theme -> verify theme appears on event page. Edit event -> verify theme loads in picker.

**Step 5: Test mobile responsiveness**

ThemePicker slide-up panel works on mobile. Background renders correctly on small screens.

**Step 6: Commit any fixes**
```bash
git add -A
git commit -m "fix: polish event theming visual edge cases"
```
