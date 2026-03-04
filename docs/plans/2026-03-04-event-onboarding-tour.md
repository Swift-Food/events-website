# Event Onboarding Tour Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a 4-step guided onboarding tour to the event management page that triggers once after event creation, highlighting Edit, Guests, Team, and Catering features.

**Architecture:** Custom `EventOnboardingTour` component with spotlight overlay (box-shadow cutout), tooltip positioning via `getBoundingClientRect()`, step state machine, and localStorage persistence. The tour component receives a `setTab` callback to auto-switch tabs during the tour. Target elements are identified via `data-tour` attributes.

**Tech Stack:** React, Tailwind CSS, localStorage, lucide-react icons

---

### Task 1: Create the EventOnboardingTour Component

**Files:**
- Create: `src/components/event-management/EventOnboardingTour.tsx`

**Step 1: Create the tour component**

```tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronRight, HelpCircle } from "lucide-react";

interface TourStep {
  target: string; // data-tour attribute value
  title: string;
  description: string;
  tab?: string; // tab to switch to before highlighting
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "edit-button",
    title: "Edit Your Event",
    description: "Customize your event details — name, date, location, tickets, and more.",
    tab: "overview",
  },
  {
    target: "tab-guests",
    title: "Manage Guests",
    description: "View RSVPs, approve guests, and track check-ins.",
    tab: "guests",
  },
  {
    target: "tab-team",
    title: "Build Your Team",
    description: "Add collaborators and scanners to help manage your event.",
    tab: "team",
  },
  {
    target: "tab-catering",
    title: "Order Catering",
    description: "Browse and order catering packages for your event.",
    tab: "catering",
  },
];

const STORAGE_KEY = "event-onboarding-seen";

interface EventOnboardingTourProps {
  setTab: (tab: string) => void;
}

export function EventOnboardingTour({ setTab }: EventOnboardingTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<"top" | "bottom">("bottom");
  const rafRef = useRef<number>(0);

  // Check localStorage on mount
  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      // Small delay to let the page render first
      const timer = setTimeout(() => setIsActive(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const measureTarget = useCallback(() => {
    const step = TOUR_STEPS[currentStep];
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    setTargetRect(rect);

    // Position tooltip above or below based on available space
    const spaceBelow = window.innerHeight - rect.bottom;
    setTooltipPosition(spaceBelow > 200 ? "bottom" : "top");
  }, [currentStep]);

  // Switch tab and measure target when step changes
  useEffect(() => {
    if (!isActive) return;

    const step = TOUR_STEPS[currentStep];
    if (step.tab) {
      setTab(step.tab);
    }

    // Wait for DOM update after tab switch
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        measureTarget();
      });
    });

    return () => cancelAnimationFrame(rafRef.current);
  }, [isActive, currentStep, setTab, measureTarget]);

  // Re-measure on resize/scroll
  useEffect(() => {
    if (!isActive) return;
    const handleResize = () => measureTarget();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [isActive, measureTarget]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsActive(false);
    setTab("overview");
  };

  const handleSkip = () => {
    handleComplete();
  };

  // Public method to restart tour (called via ref or event)
  useEffect(() => {
    const handleRestart = () => {
      localStorage.removeItem(STORAGE_KEY);
      setCurrentStep(0);
      setTab("overview");
      setTimeout(() => setIsActive(true), 300);
    };
    window.addEventListener("restart-onboarding-tour", handleRestart);
    return () => window.removeEventListener("restart-onboarding-tour", handleRestart);
  }, [setTab]);

  if (!isActive || !targetRect) return null;

  const padding = 8;
  const highlightStyle = {
    position: "fixed" as const,
    left: targetRect.left - padding,
    top: targetRect.top - padding,
    width: targetRect.width + padding * 2,
    height: targetRect.height + padding * 2,
    borderRadius: "16px",
    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.7)",
    zIndex: 9998,
    pointerEvents: "none" as const,
  };

  const tooltipStyle: React.CSSProperties = {
    position: "fixed",
    left: Math.max(16, Math.min(targetRect.left, window.innerWidth - 320)),
    zIndex: 9999,
    ...(tooltipPosition === "bottom"
      ? { top: targetRect.bottom + padding + 12 }
      : { bottom: window.innerHeight - targetRect.top + padding + 12 }),
  };

  const step = TOUR_STEPS[currentStep];

  return (
    <>
      {/* Backdrop - clickable to skip */}
      <div
        className="fixed inset-0 z-[9997]"
        onClick={handleSkip}
      />

      {/* Spotlight highlight */}
      <div style={highlightStyle} />

      {/* Tooltip */}
      <div style={tooltipStyle} className="w-[300px]">
        <div className="bg-card-background border border-white/10 rounded-2xl shadow-2xl p-5">
          {/* Step counter */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground">
              {currentStep + 1} of {TOUR_STEPS.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <h3 className="text-sm font-semibold text-foreground mb-1">
            {step.title}
          </h3>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            {step.description}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip tour
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
            >
              {currentStep === TOUR_STEPS.length - 1 ? "Done" : "Next"}
              {currentStep < TOUR_STEPS.length - 1 && (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/** Replay button component for the page header */
export function TourReplayButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("restart-onboarding-tour"))}
      className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
      title="Replay onboarding tour"
    >
      <HelpCircle className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Tour</span>
    </button>
  );
}
```

**Step 2: Verify file was created**

Run: `ls src/components/event-management/EventOnboardingTour.tsx`
Expected: File exists

**Step 3: Commit**

```bash
git add src/components/event-management/EventOnboardingTour.tsx
git commit -m "feat: add EventOnboardingTour component with spotlight overlay and tooltip"
```

---

### Task 2: Add data-tour Attributes to Target Elements

**Files:**
- Modify: `src/components/event-management/tabs/OverviewTab.tsx:556-558` — Add `data-tour="edit-button"` to Edit button
- Modify: `src/app/(main)/event-management/[id]/page.tsx:387-400` — Add `data-tour` attributes to tab buttons

**Step 1: Add data-tour to Edit button in OverviewTab**

In `src/components/event-management/tabs/OverviewTab.tsx`, find the Edit button (line 556-562):

```tsx
// BEFORE:
              <button
                onClick={onEditClick}
                className="flex items-center gap-2 rounded-xl bg-white/5 px-3 sm:px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/10"
              >
```

```tsx
// AFTER:
              <button
                data-tour="edit-button"
                onClick={onEditClick}
                className="flex items-center gap-2 rounded-xl bg-white/5 px-3 sm:px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/10"
              >
```

**Step 2: Add data-tour to tab buttons in the event management page**

In `src/app/(main)/event-management/[id]/page.tsx`, find the tab button rendering (line 387-400):

```tsx
// BEFORE:
        <button
         key={tab.id}
         onClick={() => setTab(tab.id)}
         className={`relative shrink-0 whitespace-nowrap pb-3 text-sm font-medium transition-colors ${
```

```tsx
// AFTER:
        <button
         key={tab.id}
         data-tour={`tab-${tab.id}`}
         onClick={() => setTab(tab.id)}
         className={`relative shrink-0 whitespace-nowrap pb-3 text-sm font-medium transition-colors ${
```

This automatically generates `data-tour="tab-guests"`, `data-tour="tab-team"`, `data-tour="tab-catering"`, etc. for all tabs.

**Step 3: Commit**

```bash
git add src/components/event-management/tabs/OverviewTab.tsx src/app/\(main\)/event-management/\[id\]/page.tsx
git commit -m "feat: add data-tour attributes to Edit button and tab navigation"
```

---

### Task 3: Integrate Tour and Replay Button into Event Management Page

**Files:**
- Modify: `src/app/(main)/event-management/[id]/page.tsx:12-21` — Add imports
- Modify: `src/app/(main)/event-management/[id]/page.tsx:372-379` — Add replay button next to Preview button
- Modify: `src/app/(main)/event-management/[id]/page.tsx:445-446` — Render tour component before closing div

**Step 1: Add imports**

In `src/app/(main)/event-management/[id]/page.tsx`, add after the existing tab imports (line 31):

```tsx
import { EventOnboardingTour, TourReplayButton } from "@/components/event-management/EventOnboardingTour";
```

**Step 2: Add TourReplayButton next to the Preview button**

Find the Preview button area (line 372-379). Add the TourReplayButton before the Preview button:

```tsx
// BEFORE:
      {/* Preview Button - Desktop only */}
      <button
       onClick={() => router.push(`/events/${eventId}`)}

// AFTER:
      <div className="flex items-center gap-2">
       <TourReplayButton />
       {/* Preview Button - Desktop only */}
       <button
        onClick={() => router.push(`/events/${eventId}`)}
        className="hidden sm:flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-400 transition-colors hover:bg-purple-500/20"
       >
        <Eye className="h-4 w-4" />
        Preview
       </button>
      </div>
```

Note: Remove the closing `</button>` duplication — the Preview button's closing tag stays, we just wrap in a flex container.

**Step 3: Render EventOnboardingTour at the end of the page**

Find line ~445-446 (after CateringTab and EmbedTab rendering, before `{/* Edit Event Slide-out Modal */}`):

```tsx
// Add before the Edit Event Slide-out Modal comment:
      <EventOnboardingTour setTab={(tab) => setTab(tab as TabType)} />
```

**Step 4: Build and verify**

Run: `npm run build` (or `next build`)
Expected: No TypeScript errors, clean build

**Step 5: Commit**

```bash
git add src/app/\(main\)/event-management/\[id\]/page.tsx
git commit -m "feat: integrate onboarding tour and replay button into event management page"
```

---

### Task 4: Manual Testing & Polish

**Step 1: Clear localStorage and test the tour**

1. Open browser dev tools → Application → Local Storage
2. Remove `event-onboarding-seen` key
3. Navigate to an event management page
4. Verify: Tour starts after ~600ms delay
5. Verify: Step 1 highlights the Edit button with tooltip below/above it
6. Click "Next" → Verify: Tab switches to Guests, highlights Guests tab
7. Click "Next" → Verify: Tab switches to Team, highlights Team tab
8. Click "Next" → Verify: Tab switches to Catering, highlights Catering tab
9. Click "Done" → Verify: Tour closes, returns to Overview tab
10. Refresh page → Verify: Tour does NOT show again

**Step 2: Test replay button**

1. Click the "Tour" button in the page header
2. Verify: Tour restarts from step 1

**Step 3: Test Skip**

1. Clear localStorage again
2. Refresh page → Tour starts
3. Click "Skip tour" → Verify: Tour closes, returns to Overview
4. Refresh → Verify: Tour doesn't show again

**Step 4: Test responsive behavior**

1. Resize browser window to mobile width
2. Verify: Tooltip stays within viewport bounds
3. Verify: Spotlight correctly follows the target element

**Step 5: Fix any positioning or style issues found during testing**

**Step 6: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: polish onboarding tour positioning and edge cases"
```
