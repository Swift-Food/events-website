"use client";

import { forwardRef } from "react";
import { useEventCreation } from "@/context/EventCreationContext";

interface OrganizerTermsCheckboxProps {
  error?: string;
  onClearError?: () => void;
}

const OrganizerTermsCheckbox = forwardRef<
  HTMLDivElement,
  OrganizerTermsCheckboxProps
>(({ error, onClearError }, ref) => {
  const { acceptedOrganizerTerms, setAcceptedOrganizerTerms } =
    useEventCreation();

  return (
    <div
      ref={ref}
      className={`rounded-xl backdrop-blur-xl px-4 py-3 ${error ? "bg-red-950 border border-red-500/30" : "bg-card-background"}`}
    >
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={acceptedOrganizerTerms}
          onChange={(e) => {
            setAcceptedOrganizerTerms(e.target.checked);
            if (error && onClearError) {
              onClearError();
            }
          }}
          className={`h-3 w-3 rounded bg-card-secondary-background text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer flex-shrink-0 ${error ? "border-red-400" : "border-foreground/20"}`}
        />
        <span
          className={`text-sm ${error ? "text-red-400" : "text-muted-foreground"}`}
        >
          I agree to the{" "}
          <a
            href="/terms/organizer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            Organiser Terms and Conditions
          </a>
          {error && (
            <span className="block mt-1 text-red-400 text-xs">{error}</span>
          )}
        </span>
      </label>
    </div>
  );
});

OrganizerTermsCheckbox.displayName = "OrganizerTermsCheckbox";

export default OrganizerTermsCheckbox;
