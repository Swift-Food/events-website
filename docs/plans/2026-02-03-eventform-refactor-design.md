# EventForm.tsx Refactor Design

## Problem
`EventForm.tsx` is ~2,480 lines with ~70 state variables and ~25 handlers. It's difficult to navigate, test, and maintain.

## Goals
- Reduce cognitive load
- Enable component reuse
- Improve testability

## Approach
Hybrid: Extract major UI sections as components that use `EventCreationContext` directly, plus custom hooks for complex logic.

---

## File Structure

```
src/components/
├── EventForm.tsx                    # Slim orchestrator (~150 lines)
├── event-form/
│   ├── hooks/
│   │   ├── useImageCropper.ts       # Image selection, crop state, save/cancel
│   │   ├── useStripeConnect.ts      # Stripe status, onboarding, refresh
│   │   └── useEventValidation.ts    # Validation logic and error state
│   │
│   ├── sections/
│   │   ├── EventCoverSection.tsx    # Cover preview + change/randomize buttons
│   │   ├── EventThemeSection.tsx    # Theme preview + randomize
│   │   ├── EventNameInput.tsx       # Title input with char counter
│   │   ├── EventDateTimeSection.tsx # Start/end pickers with timeline
│   │   ├── EventCategoriesSection.tsx
│   │   ├── EventLocationSection.tsx # Location button, cards, map
│   │   ├── EventSettingsCard.tsx    # Private/approval toggles
│   │   ├── TicketTypesSection.tsx   # Ticket list + questions (edit mode)
│   │   ├── EventVisibilityToggle.tsx # Publish/unpublish (edit mode)
│   │   └── OrganizerTermsCheckbox.tsx # Terms (create mode)
│   │
│   └── ImageCropModal.tsx           # Cropping modal UI
│
├── event-edit/                      # (existing - keep as-is)
│   ├── CategoryModal.tsx
│   ├── EventCoverPicker.tsx
│   └── ... other existing modals
```

---

## Custom Hooks

### useImageCropper.ts
```typescript
interface UseImageCropperReturn {
  isCropModalOpen: boolean;
  imageToCrop: string | null;
  crop: { x: number; y: number };
  zoom: number;
  isUploading: boolean;
  handleImageSelect: (file: File) => void;
  setCrop: (crop: { x: number; y: number }) => void;
  setZoom: (zoom: number) => void;
  onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
  handleSave: () => Promise<void>;
  handleCancel: () => void;
  fileInputRef: RefObject<HTMLInputElement>;
}
```

### useStripeConnect.ts
```typescript
interface UseStripeConnectReturn {
  status: StripeConnectStatus | null;
  isLoading: boolean;
  isStartingOnboarding: boolean;
  startOnboarding: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}
```

### useEventValidation.ts
```typescript
interface UseEventValidationReturn {
  errors: ValidationErrors;
  validate: () => boolean;
  clearError: (field: keyof ValidationErrors) => void;
  clearAllErrors: () => void;
  refs: {
    eventName: RefObject<HTMLInputElement>;
    startTime: RefObject<HTMLDivElement>;
    endTime: RefObject<HTMLDivElement>;
    location: RefObject<HTMLDivElement>;
    stripeConnect: RefObject<HTMLDivElement>;
    organizerTerms: RefObject<HTMLDivElement>;
  };
}
```

---

## Section Components

### EventCoverSection.tsx (~80 lines)
- Cover image preview or placeholder
- "Change cover" button → opens EventCoverPicker
- Shuffle button for random cover
- Hidden file input
- Props: `onImageSelect`, `isCoverPickerOpen`, `setIsCoverPickerOpen`

### EventThemeSection.tsx (~120 lines)
- Theme preview button with palette thumbnail
- Randomize theme button
- Conditional: InlineThemePicker vs expandable picker
- Props: `showLiveTheme`, `isThemePickerOpen`, `setIsThemePickerOpen`

### EventNameInput.tsx (~40 lines)
- Text input with 80-char max
- Character counter
- Validation error styling
- Props: `error`, `onClearError`

### EventDateTimeSection.tsx (~80 lines)
- Timeline visual (dots + connecting line)
- Start DateTimePicker
- End DateTimePicker
- Props: `errors`, `onClearError`

### EventCategoriesSection.tsx (~80 lines)
- Category selection button
- Selected categories display
- CategoryModal trigger
- Uses context for selectedCategoryIds

### EventLocationSection.tsx (~150 lines)
- "Add Event Location" button
- VenueCard (when venue exists)
- VirtualLinkCard (when virtual link exists)
- GoogleMap (when coordinates exist)
- LocationModal management
- Props: `errors`, `onClearError`

### EventSettingsCard.tsx (~60 lines)
- Tickets info row (create mode only)
- Private event toggle
- Require approval toggle
- Props: `isCreateMode`

### TicketTypesSection.tsx (~250 lines)
- Add Ticket button
- Stripe Connect warning
- Ticket list with collapse/expand
- Per-ticket questions management
- Props: `stripeConnect` hook return

### EventVisibilityToggle.tsx (~50 lines)
- Published/Draft indicator
- Publish/Unpublish button
- Props: `eventStatus`, `onPublishToggle`, `isPublishLoading`

### OrganizerTermsCheckbox.tsx (~40 lines)
- Checkbox with terms link
- Validation error display
- Props: `error`, `onClearError`

### ImageCropModal.tsx (~100 lines)
- Cropper component
- Zoom slider
- Cancel/Save buttons
- Props: all from useImageCropper

---

## Migration Order

### Phase 1: Hooks (no JSX changes)
1. useStripeConnect
2. useEventValidation
3. useImageCropper

### Phase 2: Simple Sections
4. OrganizerTermsCheckbox
5. EventVisibilityToggle
6. EventNameInput
7. EventSettingsCard

### Phase 3: Medium Sections
8. EventDateTimeSection
9. EventCategoriesSection
10. ImageCropModal
11. EventCoverSection
12. EventThemeSection

### Phase 4: Complex Sections
13. EventLocationSection
14. TicketTypesSection

### Phase 5: Cleanup
15. Remove unused imports from EventForm.tsx
16. Remove unused variables (the TypeScript warnings)

---

## Testing Strategy

Each hook gets unit tests:
- `useStripeConnect.test.ts` - mock paymentService
- `useEventValidation.test.ts` - test validation rules
- `useImageCropper.test.ts` - mock imageService

Section components can be tested with mocked context:
- Render with EventCreationProvider
- Verify correct display based on context state
- Verify handlers are called correctly
