import { useState, useRef, useCallback } from "react";
import { EventFormat } from "@/types/event/status";
import type { StripeConnectStatus } from "@/types/payment";

// UK Postcode validation regex
const UK_POSTCODE_REGEX = /^([A-Z]{1,2}\d{1,2}[A-Z]?)\s?(\d[A-Z]{2})$/i;

const validateUKPostcode = (postcode: string): boolean => {
  if (!postcode) return false;
  return UK_POSTCODE_REGEX.test(postcode.trim());
};

export interface ValidationErrors {
  eventName?: string;
  startTime?: string;
  endTime?: string;
  eventFormat?: string;
  virtualMeetingUrl?: string;
  addressLine1?: string;
  city?: string;
  postcode?: string;
  stripeConnect?: string;
  organizerTerms?: string;
}

interface ValidationData {
  eventName: string;
  start: string;
  end: string;
  eventFormat: EventFormat | null;
  virtualMeetingUrl: string;
  addressLine1: string;
  city: string;
  postcode: string;
  hasPaidTickets: boolean;
  stripeConnectStatus: StripeConnectStatus | null;
  acceptedOrganizerTerms: boolean;
  isCreateMode: boolean;
  externalEventUrl?: string;
}

interface UseEventValidationReturn {
  errors: ValidationErrors;
  setErrors: React.Dispatch<React.SetStateAction<ValidationErrors>>;
  validate: (data: ValidationData) => ValidationErrors;
  clearError: (field: keyof ValidationErrors) => void;
  clearAllErrors: () => void;
  clearLocationErrors: () => void;
  scrollToFirstError: (errors: ValidationErrors) => void;
  refs: {
    eventName: React.RefObject<HTMLInputElement | null>;
    startTime: React.RefObject<HTMLDivElement | null>;
    endTime: React.RefObject<HTMLDivElement | null>;
    location: React.RefObject<HTMLDivElement | null>;
    stripeConnect: React.RefObject<HTMLDivElement | null>;
    organizerTerms: React.RefObject<HTMLDivElement | null>;
  };
}

export function useEventValidation(): UseEventValidationReturn {
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Refs for scroll-to-error
  const refs = {
    eventName: useRef<HTMLInputElement>(null),
    startTime: useRef<HTMLDivElement>(null),
    endTime: useRef<HTMLDivElement>(null),
    location: useRef<HTMLDivElement>(null),
    stripeConnect: useRef<HTMLDivElement>(null),
    organizerTerms: useRef<HTMLDivElement>(null),
  };

  const validate = useCallback((data: ValidationData): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    // Validate event name
    if (!data.eventName.trim()) {
      newErrors.eventName = "Event name is required";
    }

    // Validate start time
    if (!data.start) {
      newErrors.startTime = "Start time is required";
    } else if (!data.externalEventUrl && new Date(data.start) < new Date()) {
      newErrors.startTime = "Start time must be in the future";
    }

    // Validate end time
    if (!data.end) {
      newErrors.endTime = "End time is required";
    }

    // Validate end time is after start time
    if (data.start && data.end && new Date(data.start) >= new Date(data.end)) {
      newErrors.endTime = "End time must be after start time";
    }

    // Validate event format is selected
    if (data.eventFormat === null) {
      newErrors.eventFormat = "Event format is required";
    }

    // Validate virtual meeting URL for virtual/hybrid events
    if (
      (data.eventFormat === EventFormat.VIRTUAL ||
        data.eventFormat === EventFormat.BOTH) &&
      !data.virtualMeetingUrl.trim()
    ) {
      newErrors.virtualMeetingUrl = "Virtual meeting URL is required";
    }

    // Validate location for in-person/hybrid events
    if (
      data.eventFormat === EventFormat.IN_PERSON ||
      data.eventFormat === EventFormat.BOTH
    ) {
      if (!data.addressLine1) {
        newErrors.addressLine1 = "Address is required";
      }
      if (!data.city) {
        newErrors.city = "City is required";
      }
      if (!data.postcode) {
        newErrors.postcode = "Postcode is required";
      } else if (!validateUKPostcode(data.postcode)) {
        newErrors.postcode = "Please enter a valid UK postcode";
      }
    }

    // Check Stripe Connect for paid tickets
    if (
      data.hasPaidTickets &&
      (!data.stripeConnectStatus ||
        !data.stripeConnectStatus.onboardingComplete)
    ) {
      newErrors.stripeConnect = "Payment setup required for paid tickets";
    }

    // Check organizer terms (create mode only)
    if (data.isCreateMode && !data.acceptedOrganizerTerms) {
      newErrors.organizerTerms = "You must accept the organizer terms";
    }

    return newErrors;
  }, []);

  const clearError = useCallback((field: keyof ValidationErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearLocationErrors = useCallback(() => {
    setErrors((prev) => ({
      ...prev,
      eventFormat: undefined,
      virtualMeetingUrl: undefined,
      addressLine1: undefined,
      city: undefined,
      postcode: undefined,
    }));
  }, []);

  const scrollToFirstError = useCallback(
    (validationErrors: ValidationErrors) => {
      const scrollToRef = (ref: React.RefObject<HTMLElement | null>) => {
        ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      };

      if (validationErrors.eventName && refs.eventName.current) {
        scrollToRef(refs.eventName);
      } else if (validationErrors.startTime && refs.startTime.current) {
        scrollToRef(refs.startTime);
      } else if (validationErrors.endTime && refs.endTime.current) {
        scrollToRef(refs.endTime);
      } else if (
        (validationErrors.eventFormat ||
          validationErrors.virtualMeetingUrl ||
          validationErrors.addressLine1 ||
          validationErrors.city ||
          validationErrors.postcode) &&
        refs.location.current
      ) {
        scrollToRef(refs.location);
      } else if (validationErrors.stripeConnect && refs.stripeConnect.current) {
        scrollToRef(refs.stripeConnect);
      } else if (
        validationErrors.organizerTerms &&
        refs.organizerTerms.current
      ) {
        scrollToRef(refs.organizerTerms);
      }
    },
    [refs],
  );

  return {
    errors,
    setErrors,
    validate,
    clearError,
    clearAllErrors,
    clearLocationErrors,
    scrollToFirstError,
    refs,
  };
}
