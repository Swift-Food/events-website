"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronRight, HelpCircle } from "lucide-react";

interface TourStep {
  target: string;
  title: string;
  description: string;
  tab?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "edit-button",
    title: "Edit Your Event",
    description: "Customize your event details — name, date, location, tickets, and more.",
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
  const setTabRef = useRef(setTab);
  const lastTabRef = useRef<string | null>(null);

  // Keep ref in sync without triggering re-renders
  useEffect(() => {
    setTabRef.current = setTab;
  }, [setTab]);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const timer = setTimeout(() => setIsActive(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const measureTarget = useCallback(() => {
    const step = TOUR_STEPS[currentStep];
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) return;

    // Scroll the element into view (especially for horizontally scrollable tab bars)
    el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });

    // Re-measure after scroll settles
    const rect = el.getBoundingClientRect();
    setTargetRect(rect);

    const spaceBelow = window.innerHeight - rect.bottom;
    setTooltipPosition(spaceBelow > 200 ? "bottom" : "top");
  }, [currentStep]);

  useEffect(() => {
    if (!isActive) return;

    const step = TOUR_STEPS[currentStep];
    if (step.tab && step.tab !== lastTabRef.current) {
      lastTabRef.current = step.tab;
      setTabRef.current(step.tab);
    }

    // Initial measure after tab switch
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        measureTarget();
      });
    });

    // Re-measure after smooth scroll settles
    const scrollTimer = setTimeout(() => measureTarget(), 350);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(scrollTimer);
    };
  }, [isActive, currentStep, measureTarget]);

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
    lastTabRef.current = "overview";
    setTabRef.current("overview");
  };

  const handleSkip = () => {
    handleComplete();
  };

  useEffect(() => {
    const handleRestart = () => {
      localStorage.removeItem(STORAGE_KEY);
      setCurrentStep(0);
      lastTabRef.current = null;
      setTabRef.current("overview");
      setTimeout(() => setIsActive(true), 300);
    };
    window.addEventListener("restart-onboarding-tour", handleRestart);
    return () => window.removeEventListener("restart-onboarding-tour", handleRestart);
  }, []);

  if (!isActive || !targetRect) return null;

  const padding = 8;
  const highlightStyle = {
    position: "fixed" as const,
    left: targetRect.left - padding,
    top: targetRect.top - padding,
    width: targetRect.width + padding * 2,
    height: targetRect.height + padding * 2,
    borderRadius: "16px",
    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.45), 0 0 0 3px rgba(59, 130, 246, 0.8), 0 0 15px 2px rgba(59, 130, 246, 0.4)",
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
      <div
        className="fixed inset-0 z-[9997]"
        onClick={handleSkip}
      />

      <div style={highlightStyle} />

      <div style={tooltipStyle} className="w-[300px]">
        <div className="bg-card-background border border-white/10 rounded-2xl shadow-2xl p-5">
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

          <h3 className="text-sm font-semibold text-foreground mb-1">
            {step.title}
          </h3>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            {step.description}
          </p>

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
