/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit, Download } from "lucide-react";
import {
  EventCreationProvider,
  useEventCreation,
} from "@/context/EventCreationContext";
import {
  resolveTheme,
  getThemeCSSVariables,
} from "@/lib/theme-presets";
import EventThemeBackground from "@/components/theme/EventThemeBackground";
import ThemePicker from "@/components/theme/ThemePicker";
import EventDescriptionModal from "@/components/event-edit/EventDescriptionModal";
import ImportEventModal from "@/components/event-edit/ImportEventModal";
import EventCoverPicker from "@/components/event-edit/EventCoverPicker";
import { EventStatus, UpdateEventDto } from "@/types";
import { EventFormat } from "@/types/event/status";
import { eventService } from "@/services/event.service";
import { eventCoverService } from "@/services/event-cover.service";
import { CreateEventDto, QuestionType } from "@/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/authContext";

// Extracted hooks
import {
  useStripeConnect,
  useEventValidation,
  useImageCropper,
} from "@/components/event-form/hooks";

// Extracted sections
import {
  EventCoverSection,
  EventThemeSection,
  EventNameInput,
  EventDateTimeSection,
  EventCategoriesSection,
  EventLocationSection,
  EventSettingsCard,
  TicketTypesSection,
  EventVisibilityToggle,
  OrganizerTermsCheckbox,
} from "@/components/event-form/sections";

// Extracted modal
import ImageCropModal from "@/components/event-form/ImageCropModal";

interface EventFormProps {
  mode: "create" | "edit";
  eventId?: string;
  initialData?: any;
  eventStatus?: EventStatus;
  onPublishToggle?: () => void;
  isPublishLoading?: boolean;
  onSaveSuccess?: () => void;
  fullPage?: boolean;
}

function EventFormInner({
  mode,
  eventId,
  initialData,
  eventStatus,
  onPublishToggle,
  isPublishLoading,
  onSaveSuccess,
  fullPage,
}: EventFormProps) {
  const {
    eventName,
    description,
    start,
    end,
    eventFormat,
    setEventFormat,
    virtualMeetingUrl,
    isPrivate,
    hideFullAddress,
    venueName,
    addressLine1,
    addressLine2,
    city,
    postcode,
    latitude,
    longitude,
    ticketTypes,
    setTicketTypes,
    requireApproval,
    coverPreview,
    setCoverPreview,
    setCoverName,
    selectedCategoryIds,
    selectedSubcategoryIds,
    acceptedOrganizerTerms,
    externalEventUrl,
    eventTheme,
    setEventTheme,
    clearForm,
    setEventName,
    setDescription,
    setStart,
    setEnd,
    setIsPrivate,
    setRequireApproval,
    setHideFullAddress,
    setVirtualMeetingUrl,
    setVenueName,
    setAddressLine1,
    setAddressLine2,
    setCity,
    setPostcode,
    setLatitude,
    setLongitude,
    setSelectedCategoryIds,
    setSelectedSubcategoryIds,
  } = useEventCreation();

  const { eventUser, isAuthenticated } = useAuth();
  const router = useRouter();

  // Theme
  const isCreateMode = mode === "create";
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const showLiveTheme = isCreateMode || !!fullPage;
  const resolvedTheme = useMemo(() => resolveTheme(eventTheme), [eventTheme]);
  const themeCSSVars = useMemo(
    () => (showLiveTheme ? getThemeCSSVariables(resolvedTheme.palette) : {}),
    [resolvedTheme.palette, showLiveTheme],
  );

  // Apply theme CSS variables to document root
  useEffect(() => {
    if (!showLiveTheme) return;
    const root = document.documentElement;
    const entries = Object.entries(themeCSSVars);
    entries.forEach(([key, value]) => root.style.setProperty(key, value));
    return () => {
      entries.forEach(([key]) => root.style.removeProperty(key));
    };
  }, [themeCSSVars, showLiveTheme]);

  // Local UI state for modals
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCoverPickerOpen, setIsCoverPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalTickets, setOriginalTickets] = useState<typeof ticketTypes>([]);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);

  // Custom hooks
  const stripeConnect = useStripeConnect({
    isAuthenticated,
    eventUserId: eventUser?.id,
  });

  const validation = useEventValidation();

  const imageCropper = useImageCropper({
    onCropComplete: (imageUrl, imageName) => {
      setCoverPreview(imageUrl);
      setCoverName(imageName);
    },
  });

  // Check if user has any paid tickets
  const hasPaidTickets = useMemo(() => {
    return ticketTypes.some((ticket) => !ticket.isFree && ticket.price > 0);
  }, [ticketTypes]);

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
  }, [addressLine1, city, postcode, virtualMeetingUrl, eventFormat, setEventFormat]);

  // Preselect a random cover image on mount (create mode only)
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
      setEventName(initialData.name || "");
      setDescription(initialData.description || "");

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
      setIsPrivate(initialData.isPrivate || false);
      setRequireApproval(initialData.requiresApproval || false);
      setHideFullAddress(initialData.hideFullAddress || false);
      setEventFormat(initialData.format || EventFormat.IN_PERSON);
      setVirtualMeetingUrl(initialData.virtualMeetingUrl || "");

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

      if (initialData.eventTheme) {
        try {
          const parsed = JSON.parse(initialData.eventTheme);
          setEventTheme(parsed);
        } catch {
          // Keep default theme
        }
      }

      setCoverPreview(initialData.eventImage || null);
      if (initialData.eventImage) {
        setCoverName("event-cover.png");
      }

      if (initialData.categories?.length > 0) {
        setSelectedCategoryIds(initialData.categories.map((cat: any) => cat.id));
      }
      if (initialData.subcategories?.length > 0) {
        setSelectedSubcategoryIds(initialData.subcategories.map((sub: any) => sub.id));
      }

      if (initialData.eventTickets?.length > 0) {
        const ticketsToLoad = initialData.eventTickets.map((ticket: any, index: number) => {
          const price = parseFloat(ticket.price) || 0;
          const questionForm = (ticket.questionForm || []).map((q: any, qIndex: number) => {
            let fieldType: "short-text" | "long-text" | "single-select" | "multi-select" = "short-text";
            if (q.type === "longText") fieldType = "long-text";
            else if (q.type === "singleSelect") fieldType = "single-select";
            else if (q.type === "multiSelect") fieldType = "multi-select";
            return {
              id: `field-${qIndex}`,
              question: q.question,
              type: fieldType,
              options: q.options || [],
              required: q.required,
            };
          });

          return {
            id: ticket.id || `ticket-${index}`,
            name: ticket.name,
            description: ticket.description || "",
            isFree: price === 0,
            price,
            isSingleUse: ticket.isSingleUse ?? true,
            quantity: ticket.quantityTotal || 100,
            questionForm,
            maxGroupSize: ticket.maxGroupSize ?? 1,
          };
        });

        setTicketTypes(ticketsToLoad);
        setOriginalTickets(ticketsToLoad);
      }

      setIsInitialDataLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialData, isInitialDataLoaded]);

  // Auto-update end date if start date is after end date
  useEffect(() => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate >= endDate) {
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

  const mapFieldTypeToQuestionType = (fieldType: string): QuestionType => {
    switch (fieldType) {
      case "short-text": return QuestionType.SHORT_TEXT;
      case "long-text": return QuestionType.LONG_TEXT;
      case "single-select": return QuestionType.SINGLE_SELECT;
      case "multi-select": return QuestionType.MULTI_SELECT;
      default: return QuestionType.SHORT_TEXT;
    }
  };

  const handleSubmit = async () => {
    const errors = validation.validate({
      eventName,
      start,
      end,
      eventFormat,
      virtualMeetingUrl,
      addressLine1,
      city,
      postcode,
      hasPaidTickets,
      stripeConnectStatus: stripeConnect.status,
      acceptedOrganizerTerms,
      isCreateMode,
      externalEventUrl,
    });

    validation.setErrors(errors);

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
      setTimeout(() => validation.scrollToFirstError(errors), 100);
      return;
    }

    if (!isAuthenticated || !eventUser) {
      toast.error("Please log in to create an event");
      router.push("/auth");
      return;
    }

    setIsSubmitting(true);

    try {
      const ticketsPayload = ticketTypes.map((ticket) => ({
        id: mode === "edit" && originalTickets.some((t) => t.id === ticket.id) ? ticket.id : undefined,
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

      const eventData: CreateEventDto | UpdateEventDto = {
        name: eventName,
        description: description || "",
        eventImage: coverPreview || undefined,
        eventColor: resolvedTheme.palette.primaryColor,
        eventTheme: JSON.stringify(eventTheme),
        ownerEventUserId: eventUser.id,
        startDateTime: start,
        endDateTime: end,
        isPrivate,
        requiresApproval: requireApproval,
        hideFullAddress: eventFormat === EventFormat.IN_PERSON || eventFormat === EventFormat.BOTH ? hideFullAddress : undefined,
        format: eventFormat ?? undefined,
        virtualMeetingUrl: eventFormat === EventFormat.VIRTUAL || eventFormat === EventFormat.BOTH ? virtualMeetingUrl || undefined : undefined,
        addressData: eventFormat === EventFormat.IN_PERSON || eventFormat === EventFormat.BOTH ? {
          name: venueName || undefined,
          addressLine1,
          addressLine2: addressLine2 || undefined,
          city,
          zipcode: postcode,
          location: latitude !== null && longitude !== null ? { latitude, longitude } : undefined,
        } : undefined,
        categoryIds: selectedCategoryIds,
        subcategoryIds: selectedSubcategoryIds,
        eventUrl: undefined,
        tickets: ticketsPayload,
        externalEventUrl: externalEventUrl || undefined,
      };

      if (mode === "create") {
        const response = await eventService.createEvent(eventData as CreateEventDto);
        if (response.success) {
          toast.success("Event created successfully!");
          clearForm();
          router.push(`/event-management/${response.event.id}`);
        }
      } else {
        if (!eventId) {
          toast.error("Event ID is missing");
          return;
        }
        const response = await eventService.updateEvent(eventId, eventData);
        if (response.success) {
          toast.success("Event updated successfully!");
          onSaveSuccess?.() ?? router.push(`/event-management/${eventId}`);
        }
      }
    } catch (error: any) {
      console.error(`Error ${mode === "create" ? "creating" : "updating"} event:`, error);
      if (error.response?.status === 401) {
        toast.error("Please log in to manage events");
        router.push("/auth");
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(`Failed to ${mode === "create" ? "create" : "update"} event. Please try again.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearForm = () => {
    if (confirm("Are you sure you want to clear the entire form? This action cannot be undone.")) {
      clearForm();
      if (imageCropper.fileInputRef.current) {
        imageCropper.fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div
      className="relative flex min-h-[calc(100vh-64px)] justify-center px-3 md:px-6 pb-4 transition-colors duration-300"
      style={showLiveTheme ? (themeCSSVars as React.CSSProperties) : undefined}
    >
      {showLiveTheme && (
        <EventThemeBackground
          config={eventTheme}
          palette={resolvedTheme.palette}
          shader={resolvedTheme.shader}
          landscape={resolvedTheme.landscape}
        />
      )}

      <div className="relative z-10 flex w-full max-w-5xl flex-col gap-6 text-foreground md:flex-row">
        {/* Left column - Cover and Theme */}
        <section className="flex flex-col gap-5 rounded-3xl md:p-7 md:w-80 lg:w-96 md:shrink-0">
          <EventCoverSection
            onImageSelect={imageCropper.handleImageSelect}
            onOpenCoverPicker={() => setIsCoverPickerOpen(true)}
            fileInputRef={imageCropper.fileInputRef}
          />
          <EventThemeSection
            showLiveTheme={showLiveTheme}
            isThemePickerOpen={isThemePickerOpen}
            setIsThemePickerOpen={setIsThemePickerOpen}
            onPreview={() => router.push(`/event-management/${eventId}/edit`)}
          />
        </section>

        {/* Right column - Form fields */}
        <section className="flex-1 space-y-3">
          <EventNameInput
            ref={validation.refs.eventName}
            error={validation.errors.eventName}
            onClearError={() => validation.clearError("eventName")}
            showClearButton={isCreateMode}
            onClear={handleClearForm}
          />

          {isCreateMode && (
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="flex w-full items-center gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 px-4 py-3 transition-all"
            >
              <Download className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-sm text-muted-foreground">
                Have an event on Eventbrite, Meetup, Luma, or elsewhere?{" "}
                <span className="text-primary font-medium">Import it</span>
              </span>
            </button>
          )}

          <EventDateTimeSection
            startRef={validation.refs.startTime}
            endRef={validation.refs.endTime}
            startError={validation.errors.startTime}
            endError={validation.errors.endTime}
            onClearStartError={() => validation.clearError("startTime")}
            onClearEndError={() => validation.clearError("endTime")}
          />

          <button
            type="button"
            onClick={() => setIsDescriptionModalOpen(true)}
            className="flex w-full items-center gap-3 rounded-xl bg-card-background hover:bg-card-background/85 backdrop-blur-xl px-4 py-3 text-foreground text-sm transition-all font-medium cursor-pointer"
          >
            <Edit className="h-5 w-5" />
            <span>Edit Description</span>
          </button>

          <EventCategoriesSection />

          <EventLocationSection
            ref={validation.refs.location}
            errors={{
              eventFormat: validation.errors.eventFormat,
              virtualMeetingUrl: validation.errors.virtualMeetingUrl,
              addressLine1: validation.errors.addressLine1,
              city: validation.errors.city,
              postcode: validation.errors.postcode,
            }}
            onClearErrors={validation.clearLocationErrors}
          />

          <EventSettingsCard isCreateMode={isCreateMode} />

          {!isCreateMode && (
            <TicketTypesSection
              ref={validation.refs.stripeConnect}
              stripeConnect={stripeConnect}
              stripeConnectError={validation.errors.stripeConnect}
            />
          )}

          {mode === "edit" && (
            <EventVisibilityToggle
              eventStatus={eventStatus}
              onPublishToggle={onPublishToggle}
              isPublishLoading={isPublishLoading}
            />
          )}

          {isCreateMode && (
            <OrganizerTermsCheckbox
              ref={validation.refs.organizerTerms}
              error={validation.errors.organizerTerms}
              onClearError={() => validation.clearError("organizerTerms")}
            />
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full rounded-lg bg-primary py-2 text-center text-lg font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? `${isCreateMode ? "Creating" : "Updating"} Event...`
              : `${isCreateMode ? "Create" : "Update"} Event`}
          </button>
        </section>
      </div>

      {/* Modals */}
      <ImageCropModal
        isOpen={imageCropper.isCropModalOpen}
        imageToCrop={imageCropper.imageToCrop}
        crop={imageCropper.crop}
        zoom={imageCropper.zoom}
        isUploading={imageCropper.isUploading}
        onCropChange={imageCropper.setCrop}
        onZoomChange={imageCropper.setZoom}
        onCropComplete={imageCropper.onCropAreaComplete}
        onSave={imageCropper.handleSave}
        onCancel={imageCropper.handleCancel}
      />

      <EventDescriptionModal
        isOpen={isDescriptionModalOpen}
        onClose={() => setIsDescriptionModalOpen(false)}
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
        onSelect={(imageUrl) => {
          setCoverPreview(imageUrl);
          setCoverName("gallery-cover.png");
        }}
        onUploadClick={imageCropper.triggerFileInput}
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
