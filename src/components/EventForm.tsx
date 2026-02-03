/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Edit, Trash2, Plus, ChevronDown, ChevronUp, MapPin, X, HelpCircle, MessageSquare, AlignLeft, CircleDot, CheckSquare, Eye, EyeOff, Tags, Download, Shuffle, Ticket, Lock, UserCheck } from "lucide-react";
import DateTimePicker from "@/components/ui/DateTimePicker";
import EventDescriptionModal from "@/components/event-edit/EventDescriptionModal";
import TicketTypeModal from "@/components/event-edit/TicketTypeModal";
import FormFieldModal from "@/components/event-edit/FormFieldModal";
import LocationModal, { LocationEditMode } from "@/components/event-edit/LocationModal";
import { VenueCard, VirtualLinkCard } from "@/components/event-edit/LocationCards";
import CategoryModal from "@/components/event-edit/CategoryModal";
import ImportEventModal from "@/components/event-edit/ImportEventModal";
import EventCoverPicker from "@/components/event-edit/EventCoverPicker";
import GoogleMap from "@/components/GoogleMap";
import {
  EventCreationProvider,
  useEventCreation,
} from "@/context/EventCreationContext";
import { resolveTheme, getThemeCSSVariables, PALETTE_MAP, SHADER_MAP, LANDSCAPE_MAP, ALL_PALETTES, SHADER_PRESETS, LANDSCAPE_OPTIONS, PATTERN_OPTIONS, getPatternPreviewCSS } from "@/lib/theme-presets";
import type { EventThemeConfig, BackgroundType } from "@/types/event/theme";
import ThemePicker from "@/components/theme/ThemePicker";
import InlineThemePicker from "@/components/theme/InlineThemePicker";
import EventThemeBackground from "@/components/theme/EventThemeBackground";
import { TicketType, UpdateEventDto, EventStatus } from "@/types";
import { FormField } from "@/types";
import { EventCategoryResponseDto } from "@/types/category";
import { EventFormat } from "@/types/event/status";
import { eventService } from "@/services/event.service";
import { imageService } from "@/services/image.service";
import { paymentService } from "@/services/payment.service";
import { categoriesApi } from "@/services/categories";
import { eventCoverService } from "@/services/event-cover.service";
import { useCategoriesContext } from "@/lib/categories-context";
import { CreateEventDto, QuestionType, CreateEventTicketDto } from "@/types";
import type { EventTicketResponseDto, QuestionBlock } from "@/types/event-ticket/response/ticket.dto";
import type { StripeConnectStatus } from "@/types/payment";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/authContext";
import { AlertTriangle, ExternalLink } from "lucide-react";

// UK Postcode validation regex
const UK_POSTCODE_REGEX = /^([A-Z]{1,2}\d{1,2}[A-Z]?)\s?(\d[A-Z]{2})$/i;

const validateUKPostcode = (postcode: string): boolean => {
  if (!postcode) return false;
  return UK_POSTCODE_REGEX.test(postcode.trim());
};

// Validation errors interface
interface ValidationErrors {
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

interface EventFormProps {
  mode: "create" | "edit";
  eventId?: string;
  initialData?: any; // You can type this better based on your event structure
  eventStatus?: EventStatus;
  onPublishToggle?: () => void;
  isPublishLoading?: boolean;
  onSaveSuccess?: () => void;
  /** When true, edit mode renders identically to the create page (full theme preview + bottom-sheet picker). */
  fullPage?: boolean;
}

function EventFormInner({ mode, eventId, initialData, eventStatus, onPublishToggle, isPublishLoading, onSaveSuccess, fullPage }: EventFormProps) {
  const {
    eventName,
    setEventName,
    description,
    setDescription,
    start,
    setStart,
    end,
    setEnd,
    location,
    setLocation,
    eventFormat,
    setEventFormat,
    virtualMeetingUrl,
    setVirtualMeetingUrl,
    isPrivate,
    setIsPrivate,
    hideFullAddress,
    setHideFullAddress,
    venueName,
    setVenueName,
    addressLine1,
    setAddressLine1,
    addressLine2,
    setAddressLine2,
    city,
    setCity,
    postcode,
    setPostcode,
    latitude,
    setLatitude,
    longitude,
    setLongitude,
    ticketTypes,
    setTicketTypes,
    addTicketType,
    updateTicketType,
    deleteTicketType,
    requireApproval,
    setRequireApproval,
    formFields,
    setFormFields,
    addFormField,
    updateFormField,
    deleteFormField,
    coverPreview,
    setCoverPreview,
    coverName,
    setCoverName,
    selectedCategoryIds,
    setSelectedCategoryIds,
    selectedSubcategoryIds,
    setSelectedSubcategoryIds,
    acceptedOrganizerTerms,
    setAcceptedOrganizerTerms,
    externalEventUrl,
    eventTheme,
    setEventTheme,
    clearForm,
  } = useEventCreation();

  // Theme
  const isCreateMode = mode === "create";
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const showLiveTheme = isCreateMode || !!fullPage;
  const resolvedTheme = useMemo(() => resolveTheme(eventTheme), [eventTheme]);
  const themeCSSVars = useMemo(
    () => (showLiveTheme ? getThemeCSSVariables(resolvedTheme.palette) : {}),
    [resolvedTheme.palette, showLiveTheme]
  );

  // Apply theme CSS variables to document root so navbar inherits them
  useEffect(() => {
    if (!showLiveTheme) return;
    const root = document.documentElement;
    const entries = Object.entries(themeCSSVars);
    entries.forEach(([key, value]) => root.style.setProperty(key, value));
    return () => {
      entries.forEach(([key]) => root.style.removeProperty(key));
    };
  }, [themeCSSVars, showLiveTheme]);

  // Local state for UI only
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [isTicketTypeModalOpen, setIsTicketTypeModalOpen] = useState(false);
  const [ticketToEdit, setTicketToEdit] = useState<TicketType | null>(null);
  const [isTicketListExpanded, setIsTicketListExpanded] = useState(true);
  const [collapsedTickets, setCollapsedTickets] = useState<Set<string>>(new Set());
  const [isFormFieldModalOpen, setIsFormFieldModalOpen] = useState(false);
  const [fieldToEdit, setFieldToEdit] = useState<FormField | null>(null);
  const [activeTicketIdForQuestions, setActiveTicketIdForQuestions] = useState<string | null>(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationEditMode, setLocationEditMode] = useState<LocationEditMode>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCoverPickerOpen, setIsCoverPickerOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Refs for validation scroll
  const eventNameRef = useRef<HTMLInputElement | null>(null);
  const startTimeRef = useRef<HTMLDivElement | null>(null);
  const endTimeRef = useRef<HTMLDivElement | null>(null);
  const locationRef = useRef<HTMLDivElement | null>(null);
  const stripeConnectRef = useRef<HTMLDivElement | null>(null);
  const organizerTermsRef = useRef<HTMLDivElement | null>(null);

  const { user, eventUser, isAuthenticated } = useAuth();
  const { categories: categoriesWithSubs } = useCategoriesContext();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [originalTickets, setOriginalTickets] = useState<TicketType[]>([]);
  const [stripeConnectStatus, setStripeConnectStatus] = useState<StripeConnectStatus | null>(null);
  const [isLoadingStripeStatus, setIsLoadingStripeStatus] = useState(false);
  const [isStartingOnboarding, setIsStartingOnboarding] = useState(false);

  // Categories state
  const [availableCategories, setAvailableCategories] = useState<EventCategoryResponseDto[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  console.log("Ticket Types: ", ticketTypes);

  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);

  // Auto-infer eventFormat based on what's been added
  useEffect(() => {
    const hasVenue = Boolean(addressLine1 && city && postcode);
    const hasVirtualLink = Boolean(virtualMeetingUrl);

    let inferredFormat: EventFormat | null = null;
    if (hasVenue && hasVirtualLink) {
      inferredFormat = EventFormat.BOTH;
    } else if (hasVenue) {
      inferredFormat = EventFormat.IN_PERSON;
    } else if (hasVirtualLink) {
      inferredFormat = EventFormat.VIRTUAL;
    }

    if (inferredFormat !== eventFormat) {
      setEventFormat(inferredFormat);
    }
  }, [addressLine1, city, postcode, virtualMeetingUrl]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const categories = await categoriesApi.findAll();
        setAvailableCategories(categories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        toast.error("Failed to load categories");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Preselect a random cover image on mount (create mode only, no existing cover)
  useEffect(() => {
    if (mode !== "create" || coverPreview) return;

    const preselectRandomCover = async () => {
      try {
        const allCovers = await eventCoverService.getAll();
        const categories = Object.keys(allCovers);
        if (categories.length === 0) return;
        const randomCategory =
          categories[Math.floor(Math.random() * categories.length)];
        const images = allCovers[randomCategory];
        if (!images || images.length === 0) return;
        const randomImage = images[Math.floor(Math.random() * images.length)];
        setCoverPreview(randomImage);
        setCoverName("gallery-cover.png");
      } catch (error) {
        console.error("Failed to preselect random cover:", error);
      }
    };

    preselectRandomCover();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Load initial data for edit mode
  useEffect(() => {
    if (mode === "edit" && initialData && !isInitialDataLoaded) {
      // Basic event info
      setEventName(initialData.name || "");
      setDescription(initialData.description || "");

      // Format datetime strings for datetime-local input
      const formatDateTimeForInput = (dateStr: string | Date) => {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setStart(formatDateTimeForInput(initialData.startDateTime));
      setEnd(formatDateTimeForInput(initialData.endDateTime));

      // Private event and approval settings
      setIsPrivate(initialData.isPrivate || false);
      setRequireApproval(initialData.requiresApproval || false);
      setHideFullAddress(initialData.hideFullAddress || false);

      // Event format
      setEventFormat(initialData.format || EventFormat.IN_PERSON);
      setVirtualMeetingUrl(initialData.virtualMeetingUrl || "");

      // Address data
      if (initialData.address) {
        setVenueName(initialData.address.name || "");
        setAddressLine1(initialData.address.addressLine1 || "");
        setAddressLine2(initialData.address.addressLine2 || "");
        setCity(initialData.address.city || "");
        setPostcode(initialData.address.zipcode || "");

        if (initialData.address.location) {
          setLatitude(initialData.address.location.latitude);
          setLongitude(initialData.address.location.longitude);
        }
      }

      // Theme
      if (initialData.eventTheme) {
        try {
          const parsed = JSON.parse(initialData.eventTheme);
          setEventTheme(parsed);
        } catch {
          // Keep default theme if parsing fails
        }
      }

      // Cover image
      setCoverPreview(initialData.eventImage || null);
      if (initialData.eventImage) {
        setCoverName("event-cover.png");
      }

      // Load categories (store category IDs)
      if (initialData.categories && initialData.categories.length > 0) {
        const categoryIds = initialData.categories.map((cat: any) => cat.id as string);
        setSelectedCategoryIds(categoryIds);
      }

      // Load subcategories (store subcategory IDs)
      if (initialData.subcategories && initialData.subcategories.length > 0) {
        const subcategoryIds = initialData.subcategories.map((sub: any) => sub.id as string);
        setSelectedSubcategoryIds(subcategoryIds);
      }

      // Load tickets with their questions
      if (initialData.eventTickets && initialData.eventTickets.length > 0) {
        const ticketsToLoad = initialData.eventTickets.map((ticket: EventTicketResponseDto, index: number) => {
          const price = parseFloat(ticket.price) || 0;

          // Map question form for this ticket
          const questionForm = (ticket.questionForm || []).map(
            (question: QuestionBlock, qIndex: number) => {
              let fieldType: "short-text" | "long-text" | "single-select" | "multi-select" = "short-text";
              if (question.type === "longText") fieldType = "long-text";
              else if (question.type === "singleSelect") fieldType = "single-select";
              else if (question.type === "multiSelect") fieldType = "multi-select";
              else if (question.type === "shortText") fieldType = "short-text";

              return {
                id: `field-${qIndex}`,
                question: question.question,
                type: fieldType,
                options: question.options || [],
                required: question.required,
              };
            }
          );

          return {
            id: ticket.id || `ticket-${index}`,
            name: ticket.name,
            description: ticket.description || "",
            isFree: price === 0,
            price: price,
            isSingleUse: ticket.isSingleUse ?? true,
            quantity: ticket.quantityTotal || 100,
            questionForm: questionForm,
            maxGroupSize: ticket.maxGroupSize ?? 1,
          };
        });

        // Set tickets directly (replaces existing tickets)
        setTicketTypes(ticketsToLoad);
        // Store original tickets for comparison in edit mode
        setOriginalTickets(ticketsToLoad);
      }

      // Mark as loaded to prevent re-loading
      setIsInitialDataLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialData, isInitialDataLoaded]);

  const formatDate = (value: string) => {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }).format(new Date(value));
    } catch {
      return "Select date";
    }
  };

  const formattedStart = useMemo(() => formatDate(start), [start]);
  const formattedEnd = useMemo(() => formatDate(end), [end]);

  // Auto-update end date if start date is after end date
  useEffect(() => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate >= endDate) {
      // Set end to 1 hour after start
      const newEnd = new Date(startDate.getTime() + 60 * 60 * 1000);
      const formatDateTime = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };
      setEnd(formatDateTime(newEnd));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start]);

  // Check if user has any paid tickets
  const hasPaidTickets = useMemo(() => {
    return ticketTypes.some((ticket) => !ticket.isFree && ticket.price > 0);
  }, [ticketTypes]);

  // Fetch Stripe Connect status when user is authenticated
  useEffect(() => {
    const fetchStripeStatus = async () => {
      if (!isAuthenticated || !eventUser) return;

      setIsLoadingStripeStatus(true);
      try {
        const status = await paymentService.getStripeConnectStatus();
        setStripeConnectStatus(status);
      } catch (error) {
        console.error("Error fetching Stripe Connect status:", error);
      } finally {
        setIsLoadingStripeStatus(false);
      }
    };

    fetchStripeStatus();
  }, [isAuthenticated, eventUser]);

  // Handle starting Stripe Connect onboarding
  const handleStartStripeOnboarding = async () => {
    setIsStartingOnboarding(true);
    try {
      const response = await paymentService.startStripeConnectOnboarding();
      if (response.onboardingUrl) {
        window.open(response.onboardingUrl, "_blank");
        toast.success("Complete the setup in the new tab, then return here");
      }
    } catch (error: any) {
      console.error("Error starting Stripe onboarding:", error);
      toast.error(error.response?.data?.message || "Failed to start payment setup");
    } finally {
      setIsStartingOnboarding(false);
    }
  };

  // Refresh Stripe Connect status (after user returns from onboarding)
  const handleRefreshStripeStatus = async () => {
    setIsLoadingStripeStatus(true);
    try {
      const status = await paymentService.getStripeConnectStatus();
      setStripeConnectStatus(status);
      if (status.onboardingComplete) {
        toast.success("Payment setup complete! You can now create paid tickets.");
      }
    } catch (error) {
      console.error("Error refreshing Stripe status:", error);
    } finally {
      setIsLoadingStripeStatus(false);
    }
  };

  // Helper to map frontend field types to backend QuestionType
  const mapFieldTypeToQuestionType = (fieldType: string): QuestionType => {
    switch (fieldType) {
      case "short-text":
        return QuestionType.SHORT_TEXT;
      case "long-text":
        return QuestionType.LONG_TEXT;
      case "single-select":
        return QuestionType.SINGLE_SELECT;
      case "multi-select":
        return QuestionType.MULTI_SELECT;
      default:
        return QuestionType.SHORT_TEXT;
    }
  };

  const handleSubmit = async () => {
    // Collect all validation errors
    const errors: ValidationErrors = {};

    // Validate event name
    if (!eventName.trim()) {
      errors.eventName = "Event name is required";
    }

    // Validate start time
    if (!start) {
      errors.startTime = "Start time is required";
    } else if (!externalEventUrl && new Date(start) < new Date()) {
      errors.startTime = "Start time must be in the future";
    }

    // Validate end time
    if (!end) {
      errors.endTime = "End time is required";
    }

    // Validate end time is after start time
    if (start && end && new Date(start) >= new Date(end)) {
      errors.endTime = "End time must be after start time";
    }

    // Validate event format is selected
    if (eventFormat === null) {
      errors.eventFormat = "Event format is required";
    }

    // Validate virtual meeting URL for virtual/hybrid events
    if (
      (eventFormat === EventFormat.VIRTUAL || eventFormat === EventFormat.BOTH) &&
      !virtualMeetingUrl.trim()
    ) {
      errors.virtualMeetingUrl = "Virtual meeting URL is required";
    }

    // Validate location for in-person/hybrid events
    if (eventFormat === EventFormat.IN_PERSON || eventFormat === EventFormat.BOTH) {
      if (!addressLine1) {
        errors.addressLine1 = "Address is required";
      }
      if (!city) {
        errors.city = "City is required";
      }
      if (!postcode) {
        errors.postcode = "Postcode is required";
      } else if (!validateUKPostcode(postcode)) {
        errors.postcode = "Please enter a valid UK postcode";
      }
    }

    // Check Stripe Connect for paid tickets
    if (hasPaidTickets && (!stripeConnectStatus || !stripeConnectStatus.onboardingComplete)) {
      errors.stripeConnect = "Payment setup required for paid tickets";
    }

    // Check organizer terms (create mode only)
    if (mode === "create" && !acceptedOrganizerTerms) {
      errors.organizerTerms = "You must accept the organizer terms";
    }

    // Set validation errors state
    setValidationErrors(errors);

    // If there are validation errors, show summary and return
    if (Object.keys(errors).length > 0) {
      const errorMessages: string[] = [];
      if (errors.eventName) errorMessages.push("Event Name");
      if (errors.startTime) errorMessages.push("Start Time");
      if (errors.endTime) errorMessages.push("End Time");
      if (errors.eventFormat) errorMessages.push("Event Format/Location");
      if (errors.virtualMeetingUrl) errorMessages.push("Virtual Meeting URL");
      if (errors.addressLine1) errorMessages.push("Address");
      if (errors.city) errorMessages.push("City");
      if (errors.postcode) errorMessages.push("Postcode");
      if (errors.stripeConnect) errorMessages.push("Payment Setup");
      if (errors.organizerTerms) errorMessages.push("Organizer Terms");

      toast.error(`Please complete the following: ${errorMessages.join(", ")}`);

      // Scroll to the first field with an error
      const scrollToFirstError = () => {
        if (errors.eventName && eventNameRef.current) {
          eventNameRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (errors.startTime && startTimeRef.current) {
          startTimeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (errors.endTime && endTimeRef.current) {
          endTimeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if ((errors.eventFormat || errors.virtualMeetingUrl || errors.addressLine1 || errors.city || errors.postcode) && locationRef.current) {
          locationRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (errors.stripeConnect && stripeConnectRef.current) {
          stripeConnectRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (errors.organizerTerms && organizerTermsRef.current) {
          organizerTermsRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      };

      // Small delay to ensure DOM has updated with error styles
      setTimeout(scrollToFirstError, 100);
      return;
    }

    // Check authentication using auth context
    if (!isAuthenticated || !eventUser) {
      toast.error("Please log in to create an event");
      router.push("/auth");
      return;
    }

    setIsSubmitting(true);

    try {
      // Map tickets to API format
      const ticketsPayload = ticketTypes.map((ticket) => ({
        id: mode === "edit" && originalTickets.some(t => t.id === ticket.id) ? ticket.id : undefined,
        name: ticket.name,
        description: ticket.description || "",
        price: ticket.isFree ? 0 : ticket.price,
        isPaid: !ticket.isFree,
        isSingleUse: ticket.isSingleUse ?? true,
        quantityTotal: ticket.quantity || 100,
        questionForm: (ticket.questionForm || []).map((field) => ({
          question: field.question,
          type: mapFieldTypeToQuestionType(field.type),
          options: field.options,
          required: field.required,
        })),
        isPrivate: false,
        maxGroupSize: ticket.maxGroupSize ?? 1,
      }));

      // Prepare event data WITH tickets
      // Only send location fields relevant to the selected format
      const eventData: CreateEventDto | UpdateEventDto = {
        name: eventName,
        description: description || "",
        eventImage: coverPreview || undefined,
        eventColor: resolvedTheme.palette.primaryColor,
        eventTheme: JSON.stringify(eventTheme),
        ownerEventUserId: eventUser.id,
        startDateTime: start,
        endDateTime: end,
        isPrivate: isPrivate,
        requiresApproval: requireApproval,
        // Only include hideFullAddress for in-person/hybrid events
        hideFullAddress: (eventFormat === EventFormat.IN_PERSON || eventFormat === EventFormat.BOTH)
          ? hideFullAddress
          : undefined,
        format: eventFormat ?? undefined,
        // Only include virtualMeetingUrl for virtual/hybrid events
        virtualMeetingUrl: (eventFormat === EventFormat.VIRTUAL || eventFormat === EventFormat.BOTH)
          ? (virtualMeetingUrl || undefined)
          : undefined,
        // Only include addressData for in-person/hybrid events
        addressData: (eventFormat === EventFormat.IN_PERSON || eventFormat === EventFormat.BOTH)
          ? {
              name: venueName || undefined,
              addressLine1: addressLine1,
              addressLine2: addressLine2 || undefined,
              city: city,
              zipcode: postcode,
              location:
                latitude !== null && longitude !== null
                  ? { latitude, longitude }
                  : undefined,
            }
          : undefined,
        categoryIds: selectedCategoryIds,
        subcategoryIds: selectedSubcategoryIds,
        eventUrl: undefined,
        tickets: ticketsPayload,
        externalEventUrl: externalEventUrl || undefined,
      };

      let createdOrUpdatedEventId: string;

      if (mode === "create") {
        // Create event with tickets
        const response = await eventService.createEvent(eventData as CreateEventDto);
        if (response.success) {
          createdOrUpdatedEventId = response.event.id;
          toast.success("Event created successfully!");
          clearForm();
          router.push(`/event-management/${createdOrUpdatedEventId}`);
        }
      } else {
        // Edit mode - update event with tickets
        if (!eventId) {
          toast.error("Event ID is missing");
          return;
        }
        const response = await eventService.updateEvent(eventId, eventData);
        if (response.success) {
          toast.success("Event updated successfully!");
          if (onSaveSuccess) {
            onSaveSuccess();
          } else {
            router.push(`/event-management/${eventId}`);
          }
        }
      }
    } catch (error: any) {
      console.error(
        `Error ${mode === "create" ? "creating" : "updating"} event:`,
        error
      );

      if (error.response?.status === 401) {
        toast.error("Please log in to manage events");
        router.push("/auth");
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(
          `Failed to ${
            mode === "create" ? "create" : "update"
          } event. Please try again.`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectURL = URL.createObjectURL(file);
    setImageToCrop(objectURL);
    setCoverName(file.name);
    setIsCropModalOpen(true);
  };

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error("Failed to create blob");
        }
        const croppedImageUrl = URL.createObjectURL(blob);
        resolve(croppedImageUrl);
      }, "image/jpeg");
    });
  };

  const handleCropSave = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    try {
      setIsUploadingImage(true);

      // First, crop the image locally
      const croppedImageBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);

      // Upload the cropped image to the server
      const uploadedImageUrl = await imageService.uploadImageFromBlob(
        croppedImageBlob,
        coverName
      );

      // Store the server URL instead of the blob URL
      setCoverPreview(uploadedImageUrl);
      toast.success("Image uploaded successfully!");

      setIsCropModalOpen(false);
      setImageToCrop(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (e) {
      console.error("Error uploading image:", e);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCropCancel = () => {
    setIsCropModalOpen(false);
    setImageToCrop(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCoverSelect = (imageUrl: string) => {
    setCoverPreview(imageUrl);
    setCoverName("gallery-cover.png");
  };

  const handleRandomizeCover = async () => {
    try {
      const allCovers = await eventCoverService.getAll();
      const categories = Object.keys(allCovers);
      if (categories.length === 0) return;
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      const images = allCovers[randomCategory];
      if (!images || images.length === 0) return;
      const randomImage = images[Math.floor(Math.random() * images.length)];
      setCoverPreview(randomImage);
      setCoverName("gallery-cover.png");
    } catch (error) {
      console.error("Failed to randomize cover:", error);
      toast.error("Failed to randomize cover");
    }
  };

  // const handleImageRemove = () => {
  //   setCoverPreview(null);
  //   setCoverName("invite-cover.png");
  //   if (fileInputRef.current) {
  //     fileInputRef.current.value = "";
  //   }
  // };

  const handleDescriptionClick = () => {
    setIsDescriptionModalOpen(true);
  };

  const handleAddTicketClick = () => {
    setTicketToEdit(null);
    setIsTicketTypeModalOpen(true);
  };

  const handleEditTicketClick = (ticket: TicketType) => {
    setTicketToEdit(ticket);
    setIsTicketTypeModalOpen(true);
  };

  const handleSaveTicket = (ticket: TicketType) => {
    // Just update local state - actual save happens when clicking Create/Update Event
    if (ticketToEdit) {
      updateTicketType(ticket);
    } else {
      addTicketType(ticket);
    }
  };

  const handleDeleteTicket = (ticketId: string) => {
    const ticketToDelete = ticketTypes.find(t => t.id === ticketId);
    if (!ticketToDelete) return;

    const ticketName = ticketToDelete.name;

    if (confirm(`Are you sure you want to remove "${ticketName}"?`)) {
      deleteTicketType(ticketId);
    }
  };

  const toggleTicketCollapse = (ticketId: string) => {
    setCollapsedTickets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
      }
      return newSet;
    });
  };

  // Question type helpers
  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case "short-text":
        return <MessageSquare className="h-3.5 w-3.5" />;
      case "long-text":
        return <AlignLeft className="h-3.5 w-3.5" />;
      case "single-select":
        return <CircleDot className="h-3.5 w-3.5" />;
      case "multi-select":
        return <CheckSquare className="h-3.5 w-3.5" />;
      default:
        return <HelpCircle className="h-3.5 w-3.5" />;
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "short-text":
        return "Short Text";
      case "long-text":
        return "Long Text";
      case "single-select":
        return "Single Select";
      case "multi-select":
        return "Multi Select";
      default:
        return type;
    }
  };

  // Question management handlers (per-ticket)
  const handleAddQuestion = (ticketId: string) => {
    setActiveTicketIdForQuestions(ticketId);
    setFieldToEdit(null);
    setEditingQuestionIndex(null);
    setIsFormFieldModalOpen(true);
  };

  const handleEditQuestion = (ticketId: string, questionIndex: number) => {
    const ticket = ticketTypes.find((t) => t.id === ticketId);
    if (!ticket || !ticket.questionForm || !ticket.questionForm[questionIndex]) return;

    const question = ticket.questionForm[questionIndex];
    setActiveTicketIdForQuestions(ticketId);
    setFieldToEdit({ ...question, id: `question-${questionIndex}` });
    setEditingQuestionIndex(questionIndex);
    setIsFormFieldModalOpen(true);
  };

  const handleSaveQuestion = (field: FormField) => {
    if (!activeTicketIdForQuestions) return;

    const ticket = ticketTypes.find((t) => t.id === activeTicketIdForQuestions);
    if (!ticket) return;

    const currentQuestions = ticket.questionForm || [];

    // Check for duplicate question (case-insensitive comparison)
    const normalizedNewQuestion = field.question.trim().toLowerCase();
    const isDuplicate = currentQuestions.some((q, idx) => {
      // If editing, exclude the current question from duplicate check
      if (editingQuestionIndex !== null && idx === editingQuestionIndex) {
        return false;
      }
      return q.question.trim().toLowerCase() === normalizedNewQuestion;
    });

    if (isDuplicate) {
      toast.error("This question already exists for this ticket");
      return;
    }

    let updatedQuestions: FormField[];
    if (editingQuestionIndex !== null) {
      // Editing existing question
      updatedQuestions = currentQuestions.map((q, idx) =>
        idx === editingQuestionIndex ? field : q
      );
    } else {
      // Adding new question
      updatedQuestions = [...currentQuestions, field];
    }

    // Update the ticket with new questions
    updateTicketType({
      ...ticket,
      questionForm: updatedQuestions,
    });

    setIsFormFieldModalOpen(false);
    setActiveTicketIdForQuestions(null);
    setFieldToEdit(null);
    setEditingQuestionIndex(null);
  };

  const handleDeleteQuestion = (ticketId: string, questionIndex: number) => {
    const ticket = ticketTypes.find((t) => t.id === ticketId);
    if (!ticket || !ticket.questionForm) return;

    const question = ticket.questionForm[questionIndex];
    const confirmed = confirm(
      `Are you sure you want to delete the question "${question.question}"?`
    );
    if (!confirmed) return;

    const updatedQuestions = ticket.questionForm.filter((_, idx) => idx !== questionIndex);
    updateTicketType({
      ...ticket,
      questionForm: updatedQuestions,
    });
  };

  const handleMoveQuestion = (ticketId: string, fromIndex: number, direction: "up" | "down") => {
    const ticket = ticketTypes.find((t) => t.id === ticketId);
    if (!ticket || !ticket.questionForm) return;

    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= ticket.questionForm.length) return;

    const reorderedQuestions = [...ticket.questionForm];
    [reorderedQuestions[fromIndex], reorderedQuestions[toIndex]] =
      [reorderedQuestions[toIndex], reorderedQuestions[fromIndex]];

    updateTicketType({
      ...ticket,
      questionForm: reorderedQuestions,
    });
  };

  const handleClearForm = () => {
    if (
      confirm(
        "Are you sure you want to clear the entire form? This action cannot be undone."
      )
    ) {
      clearForm();
      // Also clear local file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div
      className={`relative flex min-h-[calc(100vh-64px)] justify-center px-3 md:px-6 pb-4 transition-colors duration-300 ${
        ""
      }`}
      style={showLiveTheme ? (themeCSSVars as React.CSSProperties) : undefined}
    >
      {/* Theme background layer for landscape/shader/pattern */}
      {showLiveTheme && (
        <EventThemeBackground
          config={eventTheme}
          palette={resolvedTheme.palette}
          shader={resolvedTheme.shader}
          landscape={resolvedTheme.landscape}
        />
      )}

      <div className="relative z-10 flex w-full max-w-5xl flex-col gap-6 text-foreground md:flex-row">
        <section className="flex flex-col gap-5 rounded-3xl md:p-7 md:w-80 lg:w-96 md:shrink-0">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-card-background backdrop-blur-sm">
            {coverPreview ? (
              <img
                src={coverPreview}
                alt="Event cover"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-card-background">
                <span className="text-3xl font-serif text-foreground">
                  You Are Invited
                </span>
                <span className="text-sm text-muted-foreground">
                  Upload a cover image
                </span>
              </div>
            )}
            <div className="absolute bottom-4 right-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleRandomizeCover}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/90 backdrop-blur-md text-primary-foreground transition-all hover:bg-primary hover:scale-105 cursor-pointer"
                aria-label="Randomize cover"
              >
                <Shuffle className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsCoverPickerOpen(true)}
                className="rounded-full bg-primary/90 backdrop-blur-md px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary hover:scale-105 cursor-pointer"
              >
                Change cover
              </button>
            </div>
            <input
              id="cover-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              ref={fileInputRef}
              onChange={handleImageChange}
            />
          </div>
          {/* <div className="rounded-2xl bg-card-background backdrop-blur-xl text-sm sm:flex-1 lg:flex-none lg:aspect-auto">
            <div className="p-5">
              <div className="flex items-center justify-between text-muted-foreground">
                <div>
                  <p className="text-xs uppercase tracking-widest font-medium text-muted-foreground/60">
                    Starts
                  </p>
                  <p className="text-base font-semibold text-foreground mt-1">
                    {formattedStart}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-widest font-medium text-muted-foreground/60">
                    Ends
                  </p>
                  <p className="text-base font-semibold text-foreground mt-1">
                    {formattedEnd}
                  </p>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-foreground/10 text-xs text-muted-foreground">
                <span className="font-medium">Cover:</span>{" "}
                <span className="text-foreground font-medium">{coverName}</span>
              </div>
            </div>
          </div> */}
          {/* Theme Row */}
          {showLiveTheme ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsThemePickerOpen(!isThemePickerOpen)}
                className="flex flex-1 items-center gap-3 rounded-xl bg-card-background hover:bg-card-background/85 backdrop-blur-xl px-4 py-3 text-foreground transition-all cursor-pointer"
              >
                <div className="flex h-8 w-8 rounded-lg overflow-hidden shrink-0">
                  {eventTheme.type === "shader" ? (
                    (() => {
                      const shader = SHADER_MAP[eventTheme.shaderPreset ?? ""];
                      return shader ? (
                        <div className="flex items-center justify-center w-full h-full" style={{ background: resolvedTheme.palette.pageBackground }}>
                          <div className="flex -space-x-1.5">
                            {[shader.color1, shader.color2, shader.color3].map((c, i) => (
                              <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: c, zIndex: 3 - i }} />
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()
                  ) : eventTheme.type === "pattern" ? (
                    (() => {
                      const patternStyle = getPatternPreviewCSS(eventTheme.pattern ?? "dots", resolvedTheme.palette);
                      return (
                        <div
                          className="w-full h-full"
                          style={{
                            backgroundColor: resolvedTheme.palette.pageBackground,
                            backgroundImage: patternStyle.backgroundImage,
                            backgroundSize: patternStyle.backgroundSize,
                            backgroundRepeat: "repeat",
                          }}
                        />
                      );
                    })()
                  ) : eventTheme.type === "landscape" ? (
                    (() => {
                      const landscape = LANDSCAPE_MAP[eventTheme.image ?? ""];
                      return landscape ? (
                        <img
                          src={`/Landscape theme/${landscape.filename}`}
                          alt={landscape.name}
                          className="w-full h-full object-cover"
                        />
                      ) : null;
                    })()
                  ) : (
                    (PALETTE_MAP[eventTheme.colorPalette]?.colors ?? ["#222", "#2a2a2a"]).map(
                      (color, i) => (
                        <div key={i} className="flex-1" style={{ backgroundColor: color }} />
                      )
                    )
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-base font-semibold text-foreground">Theme</p>
                  <p className="text-sm text-muted-foreground">
                    {PALETTE_MAP[eventTheme.colorPalette]?.name ?? "Default"} &middot;{" "}
                    {eventTheme.type.charAt(0).toUpperCase() + eventTheme.type.slice(1)}
                  </p>
                </div>
                {isThemePickerOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  const types: BackgroundType[] = ["solid", "landscape", "shader", "pattern"];
                  const type = types[Math.floor(Math.random() * types.length)];
                  const palette = ALL_PALETTES[Math.floor(Math.random() * ALL_PALETTES.length)];
                  const config: EventThemeConfig = { type, colorPalette: palette.id };
                  switch (type) {
                    case "landscape":
                      config.image = LANDSCAPE_OPTIONS[Math.floor(Math.random() * LANDSCAPE_OPTIONS.length)].id;
                      config.imageOpacity = 0.4;
                      break;
                    case "shader":
                      config.shaderPreset = SHADER_PRESETS[Math.floor(Math.random() * SHADER_PRESETS.length)].id;
                      break;
                    case "pattern":
                      config.pattern = PATTERN_OPTIONS[Math.floor(Math.random() * PATTERN_OPTIONS.length)].id;
                      break;
                  }
                  setEventTheme(config);
                }}
                className="flex w-14 shrink-0 items-center justify-center self-stretch rounded-xl bg-card-background hover:bg-card-background/85 backdrop-blur-xl text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                aria-label="Randomize theme"
              >
                <Shuffle className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <InlineThemePicker
              theme={eventTheme}
              onChange={setEventTheme}
              onPreview={() => router.push(`/event-management/${eventId}/edit`)}
            />
          )}
        </section>

        <section className="flex-1 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <input
                ref={eventNameRef}
                type="text"
                value={eventName}
                onChange={(e) => {
                  setEventName(e.target.value.slice(0, 80));
                  if (validationErrors.eventName) {
                    setValidationErrors(prev => ({ ...prev, eventName: undefined }));
                  }
                }}
                placeholder="Event Name"
                maxLength={80}
                className={`w-full bg-transparent text-3xl md:text-5xl font-bold text-foreground outline-none placeholder:text-muted-foreground/90 ${validationErrors.eventName ? "text-red-400 placeholder:text-red-400/40" : ""}`}
              />
              <div className={`text-xs ${validationErrors.eventName ? "text-red-400" : eventName.length >= 80 ? "text-amber-400" : "text-muted-foreground"}`}>
                {validationErrors.eventName || `${eventName.length}/80 characters`}
              </div>
            </div>
            {mode === "create" && (
              <button
                type="button"
                onClick={handleClearForm}
                className="rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                title="Clear form"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Import Event Section - Only shown in create mode */}
          {mode === "create" && (
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="flex w-full items-center gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 px-4 py-3 transition-all"
            >
              <Download className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-sm text-muted-foreground">
                Have an event on Eventbrite, Meetup, Luma, or elsewhere? <span className="text-primary font-medium">Import it</span>
              </span>
            </button>
          )}

          <div className="rounded-xl backdrop-blur-xl pl-4 py-4">
            <div className="flex gap-5">
              <div className="flex flex-col items-center py-3">
                <div className="h-3.5 w-3.5 rounded-full bg-primary"></div>
                <div className="my-2 w-0.5 flex-1 rounded-full bg-primary/30"></div>
                <div className="h-3.5 w-3.5 rounded-full bg-primary/30"></div>
              </div>

              <div className="flex flex-1 flex-col gap-4">
                <div ref={startTimeRef} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className={`text-sm font-medium sm:w-14 ${validationErrors.startTime ? "text-red-400" : "text-muted-foreground"}`}>
                    Start
                  </label>
                  <div className="flex-1">
                    <DateTimePicker
                      value={start}
                      onChange={(value) => {
                        setStart(value);
                        if (validationErrors.startTime) {
                          setValidationErrors(prev => ({ ...prev, startTime: undefined }));
                        }
                      }}
                      minDate={externalEventUrl ? undefined : new Date()}
                      error={!!validationErrors.startTime}
                      placeholder="Select start date & time"
                    />
                    {validationErrors.startTime && (
                      <p className="text-xs text-red-400 mt-1">{validationErrors.startTime}</p>
                    )}
                  </div>
                </div>

                <div ref={endTimeRef} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className={`text-sm font-medium sm:w-14 ${validationErrors.endTime ? "text-red-400" : "text-muted-foreground"}`}>
                    End
                  </label>
                  <div className="flex-1">
                    <DateTimePicker
                      value={end}
                      onChange={(value) => {
                        setEnd(value);
                        if (validationErrors.endTime) {
                          setValidationErrors(prev => ({ ...prev, endTime: undefined }));
                        }
                      }}
                      error={!!validationErrors.endTime}
                      placeholder="Select end date & time"
                    />
                    {validationErrors.endTime && (
                      <p className="text-xs text-red-400 mt-1">{validationErrors.endTime}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDescriptionClick}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-card-background hover:bg-card-background/85 backdrop-blur-xl px-6 py-3 text-foreground text-base transition-all font-semibold cursor-pointer"
          >
            <Edit className="h-5 w-5" />
            <span>Edit Description</span>
          </button>

          {/* Event Categories */}
          <div className="space-y-4">
            <div className="relative">
              <button
                type="button"
                data-category-trigger
                onClick={() => setIsCategoryModalOpen(!isCategoryModalOpen)}
                className="flex w-full items-center gap-3 rounded-xl bg-card-background hover:bg-card-background/85 backdrop-blur-xl px-4 py-3 text-foreground transition-all cursor-pointer"
              >
                <Tags className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 text-left">
                  {loadingCategories ? (
                    <>
                      <p className="text-base font-semibold text-foreground">
                        Event Categories
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-primary"></div>
                        <span className="text-sm text-muted-foreground">Loading...</span>
                      </div>
                    </>
                  ) : selectedCategoryIds.length > 0 || selectedSubcategoryIds.length > 0 ? (
                    <>
                      <p className="text-base font-semibold text-foreground">
                        {selectedCategoryIds.length} {selectedCategoryIds.length === 1 ? 'Category' : 'Categories'}
                        {selectedSubcategoryIds.length > 0 && `, ${selectedSubcategoryIds.length} ${selectedSubcategoryIds.length === 1 ? 'Subcategory' : 'Subcategories'}`}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {categoriesWithSubs
                          .filter((cat) => selectedCategoryIds.includes(cat.id))
                          .map((cat) => {
                            const categoryName = cat.name.charAt(0).toUpperCase() + cat.name.slice(1).toLowerCase();
                            const selectedSubs = (cat.subcategories || [])
                              .filter((sub) => selectedSubcategoryIds.includes(sub.id))
                              .map((sub) => sub.name.charAt(0).toUpperCase() + sub.name.slice(1).toLowerCase());
                            if (selectedSubs.length > 0) {
                              return `${categoryName} (${selectedSubs.join(', ')})`;
                            }
                            return categoryName;
                          })
                          .join(', ')}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-base font-semibold text-foreground">
                        Event Categories
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Select categories to help people discover your event
                      </p>
                    </>
                  )}
                </div>
                {selectedCategoryIds.length > 0 || selectedSubcategoryIds.length > 0 ? (
                  <div
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCategoryIds([]);
                      setSelectedSubcategoryIds([]);
                    }}
                    className="p-1 rounded-full hover:bg-white/10 transition-all"
                  >
                    <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                  </div>
                ) : (
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isCategoryModalOpen ? 'rotate-180' : ''}`} />
                )}
              </button>

              {/* Category Dropdown */}
              <CategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                availableCategories={availableCategories}
                selectedCategoryIds={selectedCategoryIds}
                setSelectedCategoryIds={setSelectedCategoryIds}
                selectedSubcategoryIds={selectedSubcategoryIds}
                setSelectedSubcategoryIds={setSelectedSubcategoryIds}
              />
            </div>
          </div>

          {/* Event Location & Format */}
          <div ref={locationRef} className="space-y-3">
            {/* Location validation errors indicator */}
            {(validationErrors.eventFormat || validationErrors.virtualMeetingUrl || validationErrors.addressLine1 || validationErrors.city || validationErrors.postcode) && (
              <div className="p-3 bg-red-950 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400 font-medium">Please complete the location details:</p>
                <ul className="text-xs text-red-400/80 mt-1 list-disc list-inside">
                  {validationErrors.eventFormat && <li>{validationErrors.eventFormat}</li>}
                  {validationErrors.virtualMeetingUrl && <li>{validationErrors.virtualMeetingUrl}</li>}
                  {validationErrors.addressLine1 && <li>{validationErrors.addressLine1}</li>}
                  {validationErrors.city && <li>{validationErrors.city}</li>}
                  {validationErrors.postcode && <li>{validationErrors.postcode}</li>}
                </ul>
              </div>
            )}

            {/* Main Location Button - always visible at top */}
            {(() => {
              const hasError = validationErrors.eventFormat || validationErrors.virtualMeetingUrl || validationErrors.addressLine1 || validationErrors.city || validationErrors.postcode;

              return (
                <div className="relative">
                  <button
                    type="button"
                    data-location-trigger
                    onClick={() => {
                      if (!locationEditMode) {
                        setIsLocationModalOpen(!isLocationModalOpen);
                      }
                      if (hasError) {
                        setValidationErrors(prev => ({
                          ...prev,
                          eventFormat: undefined,
                          virtualMeetingUrl: undefined,
                          addressLine1: undefined,
                          city: undefined,
                          postcode: undefined,
                        }));
                      }
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl bg-card-background hover:bg-card-background/85 backdrop-blur-xl px-4 py-3 text-foreground transition-all cursor-pointer ${hasError ? "ring-2 ring-red-400/50" : ""}`}
                  >
                    <MapPin className={`h-5 w-5 ${hasError ? "text-red-400" : "text-muted-foreground"}`} />
                    <div className="flex-1 text-left">
                      <p className={`text-base font-semibold ${hasError ? "text-red-400" : "text-foreground"}`}>
                        Add Event Location
                      </p>
                      <p className={`text-sm ${hasError ? "text-red-400/80" : "text-muted-foreground"}`}>
                        Physical location or virtual link
                      </p>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isLocationModalOpen && !locationEditMode ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Location Modal - for adding new */}
                  {isLocationModalOpen && !locationEditMode && (
                    <LocationModal
                      isOpen={isLocationModalOpen}
                      onClose={() => setIsLocationModalOpen(false)}
                      editMode={null}
                    />
                  )}
                </div>
              );
            })()}

            {/* Virtual Link Card */}
            {virtualMeetingUrl && (
              <div className="relative">
                <VirtualLinkCard
                  virtualMeetingUrl={virtualMeetingUrl}
                  onEdit={() => {
                    setLocationEditMode({ type: 'virtual' });
                    setIsLocationModalOpen(true);
                  }}
                  onDelete={() => {
                    setVirtualMeetingUrl("");
                  }}
                />
                {/* Edit Modal for Virtual Link */}
                {isLocationModalOpen && locationEditMode?.type === 'virtual' && (
                  <LocationModal
                    isOpen={isLocationModalOpen}
                    onClose={() => {
                      setIsLocationModalOpen(false);
                      setLocationEditMode(null);
                    }}
                    editMode={locationEditMode}
                  />
                )}
              </div>
            )}

            {/* Venue Card - show if we have addressLine1 OR (venueName/city with coordinates) */}
            {(addressLine1 || (venueName && latitude !== null) || (city && latitude !== null)) && (
              <div className="relative">
                <VenueCard
                  venueName={venueName}
                  addressLine1={addressLine1}
                  addressLine2={addressLine2}
                  city={city}
                  postcode={postcode}
                  latitude={latitude}
                  longitude={longitude}
                  hideFullAddress={hideFullAddress}
                  onToggleHideAddress={() => setHideFullAddress(!hideFullAddress)}
                  onEdit={() => {
                    setLocationEditMode({ type: 'venue' });
                    setIsLocationModalOpen(true);
                  }}
                  onDelete={() => {
                    setVenueName("");
                    setAddressLine1("");
                    setAddressLine2("");
                    setCity("");
                    setPostcode("");
                    setLatitude(null);
                    setLongitude(null);
                    setLocation("");
                  }}
                />
                {/* Edit Modal for Venue */}
                {isLocationModalOpen && locationEditMode?.type === 'venue' && (
                  <LocationModal
                    isOpen={isLocationModalOpen}
                    onClose={() => {
                      setIsLocationModalOpen(false);
                      setLocationEditMode(null);
                    }}
                    editMode={locationEditMode}
                  />
                )}
              </div>
            )}

            {/* Google Map - shown when we have coordinates */}
            {latitude !== null && longitude !== null && !isLocationModalOpen && (
              <GoogleMap
                latitude={latitude}
                longitude={longitude}
                title={venueName || addressLine1 || city || "Event Location"}
                className="h-48 w-full rounded-xl"
              />
            )}
          </div>

          {/* Event Settings Card */}
          <div className="rounded-xl bg-card-background backdrop-blur-xl px-4 py-2">
            {/* Tickets info - Create mode only */}
            {isCreateMode && (
              <div className="flex items-start gap-2.5">
                <Ticket className="h-4 w-4 text-muted-foreground mt-2.5 flex-shrink-0" />
                <div className="flex-1 py-2 border-b border-foreground/10">
                  <p className="text-sm font-medium text-foreground">Tickets</p>
                  <p className="text-xs text-muted-foreground">
                    Default &quot;General Admission&quot; ticket · Edit after creating
                  </p>
                </div>
              </div>
            )}

            {/* Private Event Toggle */}
            <div className="flex items-center gap-2.5">
              <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 flex items-center justify-between py-2 border-b border-foreground/10">
                <p className="text-sm font-medium text-foreground">Private Event</p>
                <button
                  type="button"
                  onClick={() => setIsPrivate((prev) => !prev)}
                  className={`h-5 w-10 rounded-full transition-all ${isPrivate ? "bg-primary" : "bg-card-secondary-background"}`}
                >
                  <span className={`block h-4 w-4 rounded-full transition-all ${isPrivate ? "translate-x-5.5 bg-primary-foreground" : "translate-x-0.5 bg-foreground"}`} />
                </button>
              </div>
            </div>

            {/* Require Approval Toggle */}
            <div className="flex items-center gap-2.5">
              <UserCheck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 flex items-center justify-between py-2">
                <p className="text-sm font-medium text-foreground">Require Approval</p>
                <button
                  type="button"
                  onClick={() => setRequireApproval((prev) => !prev)}
                  className={`h-5 w-10 rounded-full transition-all ${requireApproval ? "bg-primary" : "bg-card-secondary-background"}`}
                >
                  <span className={`block h-4 w-4 rounded-full transition-all ${requireApproval ? "translate-x-5.5 bg-primary-foreground" : "translate-x-0.5 bg-foreground"}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Ticket Types Card - Edit mode only */}
          {!isCreateMode && (
            <div className="rounded-xl bg-card-background backdrop-blur-xl px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-foreground">
                    Ticket Types
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {ticketTypes.length === 0
                      ? "No tickets added"
                      : `${ticketTypes.length} ticket type${
                          ticketTypes.length > 1 ? "s" : ""
                        }`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddTicketClick}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80"
                >
                  <Plus className="h-4 w-4" />
                  Add Ticket
                </button>
              </div>

              {/* Stripe Connect Warning for Paid Tickets */}
              {hasPaidTickets && stripeConnectStatus && !stripeConnectStatus.onboardingComplete && (
              <div ref={stripeConnectRef} className={`mt-5 rounded-2xl p-4 ${validationErrors.stripeConnect ? "bg-red-950 border border-red-500/30" : "bg-amber-950 border border-amber-500/30"}`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${validationErrors.stripeConnect ? "text-red-400" : "text-amber-400"}`} />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${validationErrors.stripeConnect ? "text-red-400" : "text-amber-400"}`}>
                      Payment Setup Required
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      To create events with paid tickets, you need to complete Stripe payment setup first.
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        type="button"
                        onClick={handleStartStripeOnboarding}
                        disabled={isStartingOnboarding}
                        className="flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-black transition-all hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isStartingOnboarding ? (
                          "Opening..."
                        ) : (
                          <>
                            Set Up Payments
                            <ExternalLink className="h-4 w-4" />
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleRefreshStripeStatus}
                        disabled={isLoadingStripeStatus}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isLoadingStripeStatus ? "Checking..." : "I've completed setup"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

              {/* List of Ticket Types */}
              {ticketTypes.length > 0 && isTicketListExpanded && (
                <div className="mt-5 space-y-3">
                {ticketTypes.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="rounded-xl bg-card-secondary-background backdrop-blur-xl overflow-hidden"
                  >
                    {/* Ticket Header */}
                    <div className="flex items-start justify-between gap-3 p-4">
                      <button
                        type="button"
                        onClick={() => toggleTicketCollapse(ticket.id)}
                        className="p-1 rounded-md hover:bg-white/10 transition-colors mt-0.5"
                        aria-label={collapsedTickets.has(ticket.id) ? "Expand ticket" : "Collapse ticket"}
                      >
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${collapsedTickets.has(ticket.id) ? "-rotate-90" : ""}`} />
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-base font-semibold text-foreground">
                            {ticket.name}
                          </p>
                          {ticket.isSingleUse && (
                            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                              Single-use
                            </span>
                          )}
                        </div>
                        {(ticket.maxGroupSize || 1) > 1 && (
                          <span className="inline-block rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400 mt-1">
                            Groups
                          </span>
                        )}
                        {ticket.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {ticket.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <p className="text-sm font-medium text-foreground">
                            {ticket.isFree
                              ? "Free"
                              : `£${ticket.price.toFixed(2)}`}
                          </p>
                          <span className="text-muted-foreground">•</span>
                          <p className="text-sm text-muted-foreground">
                            {ticket.quantity >= 100000 ? "Unlimited" : `${ticket.quantity.toLocaleString()} available`}
                          </p>
                          {collapsedTickets.has(ticket.id) && ticket.questionForm && ticket.questionForm.length > 0 && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <p className="text-sm text-muted-foreground">
                                {ticket.questionForm.length} question{ticket.questionForm.length > 1 ? "s" : ""}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditTicketClick(ticket)}
                          className="rounded-full p-2 transition-all hover:bg-white/10"
                          aria-label="Edit ticket"
                        >
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTicket(ticket.id)}
                          className="rounded-full p-2 transition-all hover:bg-red-500/20"
                          aria-label="Delete ticket"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    </div>

                    {/* Registration Questions - hidden when collapsed */}
                    {!collapsedTickets.has(ticket.id) && (
                    <div className="border-t border-foreground/10 bg-card-background/50 px-2 py-2 md:px-4 md:py-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">
                            Registration Questions ({ticket.questionForm?.length || 0})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddQuestion(ticket.id)}
                          className="flex items-center gap-1.5 rounded-md bg-primary/20 px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/30"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Question
                        </button>
                      </div>
                      {ticket.questionForm && ticket.questionForm.length > 0 ? (
                        <div className="space-y-2">
                          {ticket.questionForm.map((question, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-2 sm:gap-3 rounded-md bg-card-background p-3 group"
                            >
                              {/* Mobile ordering buttons - left side, vertically stacked */}
                              <div className="flex flex-col gap-0.5 sm:hidden">
                                <button
                                  type="button"
                                  onClick={() => handleMoveQuestion(ticket.id, index, "up")}
                                  disabled={index === 0}
                                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Move up"
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveQuestion(ticket.id, index, "down")}
                                  disabled={index === (ticket.questionForm?.length || 0) - 1}
                                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Move down"
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="flex items-center justify-center rounded bg-primary/10 p-1.5 text-primary">
                                {getQuestionTypeIcon(question.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm text-foreground">{question.question}</p>
                                  {question.required && (
                                    <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-xs text-red-400">
                                      Required
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {getQuestionTypeLabel(question.type)}
                                    {question.options && question.options.length > 0 && (
                                      <> • {question.options.length} options</>
                                    )}
                                  </span>
                                </div>
                              </div>

                              {/* Action buttons - edit/delete always, ordering on desktop only */}
                              <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                {/* Desktop ordering buttons */}
                                <button
                                  type="button"
                                  onClick={() => handleMoveQuestion(ticket.id, index, "up")}
                                  disabled={index === 0}
                                  className="hidden sm:block rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                  title="Move up"
                                >
                                  <ChevronUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveQuestion(ticket.id, index, "down")}
                                  disabled={index === (ticket.questionForm?.length || 0) - 1}
                                  className="hidden sm:block rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                  title="Move down"
                                >
                                  <ChevronDown className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEditQuestion(ticket.id, index)}
                                  className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                                  title="Edit question"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteQuestion(ticket.id, index)}
                                  className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-red-500/20 hover:text-red-400"
                                  title="Delete question"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          No questions added yet
                        </p>
                      )}
                    </div>
                    )}
                  </div>
                ))}
              </div>
            )}

              {/* Expand/Collapse Button */}
              {ticketTypes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsTicketListExpanded(!isTicketListExpanded)}
                  className="w-full flex items-center justify-center gap-2 py-2 transition-all hover:bg-white/5 rounded-xl cursor-pointer"
                >
                  {isTicketListExpanded ? (
                    <>
                      <span className="text-sm text-muted-foreground">Hide tickets</span>
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-muted-foreground">
                        Show {ticketTypes.length} ticket{ticketTypes.length > 1 ? "s" : ""}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Visibility Toggle - Only shown in edit mode */}
          {mode === "edit" && onPublishToggle && (
            <div className="rounded-xl bg-card-background backdrop-blur-xl p-4 md:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {eventStatus === EventStatus.PUBLISHED ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20">
                      <Eye className="h-5 w-5 text-green-400" />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
                      <EyeOff className="h-5 w-5 text-amber-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {eventStatus === EventStatus.PUBLISHED ? "Published" : "Draft"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {eventStatus === EventStatus.PUBLISHED
                        ? "Visible to everyone"
                        : "Only visible to you"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onPublishToggle}
                  disabled={isPublishLoading}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    eventStatus === EventStatus.PUBLISHED
                      ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                      : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                  }`}
                >
                  {isPublishLoading
                    ? "..."
                    : eventStatus === EventStatus.PUBLISHED
                    ? "Unpublish"
                    : "Publish"}
                </button>
              </div>
            </div>
          )}

          {/* Organiser Terms Checkbox - Only shown in create mode */}
          {mode === "create" && (
            <div ref={organizerTermsRef} className={`rounded-xl backdrop-blur-xl p-4 md:p-5 ${validationErrors.organizerTerms ? "bg-red-950 border border-red-500/30" : "bg-card-background"}`}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedOrganizerTerms}
                  onChange={(e) => {
                    setAcceptedOrganizerTerms(e.target.checked);
                    if (validationErrors.organizerTerms) {
                      setValidationErrors(prev => ({ ...prev, organizerTerms: undefined }));
                    }
                  }}
                  className={`h-5 w-5 rounded bg-card-secondary-background text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer flex-shrink-0 ${validationErrors.organizerTerms ? "border-red-400" : "border-foreground/20"}`}
                />
                <span className={`text-sm ${validationErrors.organizerTerms ? "text-red-400" : "text-muted-foreground"}`}>
                  I agree to the{" "}
                  <a
                    href="/terms/organizer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    Organiser Terms and Conditions
                  </a>
                  {validationErrors.organizerTerms && (
                    <span className="block mt-1 text-red-400 text-xs">{validationErrors.organizerTerms}</span>
                  )}
                </span>
              </label>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full rounded-lg bg-primary py-2 text-center text-lg font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? `${mode === "create" ? "Creating" : "Updating"} Event...`
              : `${mode === "create" ? "Create" : "Update"} Event`}
          </button>
        </section>
      </div>

      {isCropModalOpen && imageToCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-card-background backdrop-blur-2xl p-8 text-foreground">
            <h2 className="mb-6 text-3xl font-bold">Crop Image</h2>

            <div className="relative h-[500px] w-full rounded-2xl bg-black">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="mt-6 flex flex-col gap-5">
              <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md rounded-2xl p-4">
                <label className="text-sm font-semibold text-foreground">
                  Zoom
                </label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleCropCancel}
                  disabled={isUploadingImage}
                  className="flex-1 rounded-full bg-card-background backdrop-blur-md py-4 text-center font-semibold text-foreground transition-all hover:bg-white/15 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCropSave}
                  disabled={isUploadingImage}
                  className="flex-1 rounded-full bg-primary py-4 text-center font-bold text-primary-foreground transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingImage ? "Uploading..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <EventDescriptionModal
        isOpen={isDescriptionModalOpen}
        onClose={() => setIsDescriptionModalOpen(false)}
      />

      <TicketTypeModal
        isOpen={isTicketTypeModalOpen}
        onClose={() => setIsTicketTypeModalOpen(false)}
        onSave={handleSaveTicket}
        ticketToEdit={ticketToEdit}
      />

      <FormFieldModal
        isOpen={isFormFieldModalOpen}
        onClose={() => {
          setIsFormFieldModalOpen(false);
          setActiveTicketIdForQuestions(null);
          setFieldToEdit(null);
          setEditingQuestionIndex(null);
        }}
        onSave={handleSaveQuestion}
        fieldToEdit={fieldToEdit}
      />

      <ImportEventModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {showLiveTheme && (
        <ThemePicker
          theme={eventTheme}
          onChange={setEventTheme}
          isOpen={isThemePickerOpen}
          onToggle={() => setIsThemePickerOpen(!isThemePickerOpen)}
        />
      )}

      <EventCoverPicker
        isOpen={isCoverPickerOpen}
        onClose={() => setIsCoverPickerOpen(false)}
        onSelect={handleCoverSelect}
        onUploadClick={() => fileInputRef.current?.click()}
        currentCover={coverPreview}
      />
    </div>
  );
}

export default function EventForm(props: EventFormProps) {
  return (
    <EventCreationProvider disablePersistence={props.mode === "edit"}>
      <EventFormInner {...props} />
    </EventCreationProvider>
  );
}
