# Event Onboarding Tour Design

## Summary

A 4-step sequential guided tour that triggers once after an event is created and the user lands on the event management page. Uses a spotlight overlay with tooltip popovers. Steps auto-switch tabs when relevant.

## Tour Steps

| # | Target (`data-tour`) | Tab Switch | Title | Description |
|---|---|---|---|---|
| 1 | `edit-button` | stays on overview | "Edit Your Event" | "Customize your event details — name, date, location, tickets, and more." |
| 2 | `tab-guests` | switch to guests | "Manage Guests" | "View RSVPs, approve guests, and track check-ins." |
| 3 | `tab-team` | switch to team | "Build Your Team" | "Add collaborators and scanners to help manage your event." |
| 4 | `tab-catering` | switch to catering | "Order Catering" | "Browse and order catering packages for your event." |

## Approach

Custom component — no external dependencies. Matches existing dark theme with Tailwind.

### Spotlight Overlay

Full-screen fixed overlay using a positioned highlight element with massive `box-shadow` spread to dim everything except the target. Target rect measured via `getBoundingClientRect()` on elements with `data-tour` attributes.

### Tooltip

Positioned above or below target based on viewport space. Contains:
- Title + description
- Step counter ("1 of 4")
- Skip button (left) + Next/Done button (right)

### Tab Switching

Before highlighting tab-targeted steps, calls `setTab()` prop, then uses `requestAnimationFrame` to wait for DOM update before measuring positions.

### Persistence

- `localStorage.setItem("event-onboarding-seen", "true")` on completion or skip
- Checked on mount; only shows if not set
- Replay button (help icon) in page header resets the flag

## Files

- **Create:** `src/components/event-management/EventOnboardingTour.tsx`
- **Modify:** `src/app/(main)/event-management/[id]/page.tsx` — render tour, add `data-tour` attrs to tab buttons, add replay button
- **Modify:** `src/components/event-management/tabs/OverviewTab.tsx` — add `data-tour="edit-button"` to Edit button

## Visual Style

- Overlay: `bg-black/60 backdrop-blur-sm`
- Tooltip: `bg-card-background border border-white/10 rounded-2xl shadow-2xl`
- Next button: `bg-primary text-primary-foreground rounded-xl`
- Skip: `text-muted-foreground` text button
