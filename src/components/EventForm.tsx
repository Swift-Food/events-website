/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Edit, Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import EventDescriptionModal from "@/components/event-edit/EventDescriptionModal";
import CapacityModal from "@/components/event-edit/CapacityModal";
import TicketTypeModal from "@/components/event-edit/TicketTypeModal";
import FormFieldModal from "@/components/event-edit/FormFieldModal";
import {
  EventCreationProvider,
  useEventCreation,
} from "@/context/EventCreationContext";
import { TicketType, UpdateEventDto } from "@/types";
import { FormField } from "@/types";
import { GOOGLE_MAPS_CONFIG } from "@/constants/google-maps";
import { loadGoogleMapsScript } from "@/utils/google-maps-loader";
import { eventService } from "@/services/event.service";
import { eventTicketService } from "@/services/event-ticket.service";
import { imageService } from "@/services/image.service";
import { paymentService } from "@/services/payment.service";
import { CreateEventDto, QuestionType, CreateEventTicketDto } from "@/types";
import type { EventTicketResponseDto, QuestionBlock } from "@/types/event-ticket/response/ticket.dto";
import type { StripeConnectStatus } from "@/types/payment";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/authContext";
import { AlertTriangle, ExternalLink } from "lucide-react";

// Load Google Maps script
declare global {
  interface Window {
    initAutocomplete?: () => void;
  }
}

// UK Postcode validation regex
const UK_POSTCODE_REGEX = /^([A-Z]{1,2}\d{1,2}[A-Z]?)\s?(\d[A-Z]{2})$/i;

const validateUKPostcode = (postcode: string): boolean => {
  if (!postcode) return false;
  return UK_POSTCODE_REGEX.test(postcode.trim());
};

interface EventFormProps {
  mode: "create" | "edit";
  eventId?: string;
  initialData?: any; // You can type this better based on your event structure
}

function EventFormInner({ mode, eventId, initialData }: EventFormProps) {
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
    capacity,
    setCapacity,
    formFields,
    setFormFields,
    addFormField,
    updateFormField,
    deleteFormField,
    coverPreview,
    setCoverPreview,
    coverName,
    setCoverName,
    clearForm,
  } = useEventCreation();

  // Local state for UI only
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
  const [isTicketTypeModalOpen, setIsTicketTypeModalOpen] = useState(false);
  const [ticketToEdit, setTicketToEdit] = useState<TicketType | null>(null);
  const [isTicketListExpanded, setIsTicketListExpanded] = useState(true);
  const [isFormFieldModalOpen, setIsFormFieldModalOpen] = useState(false);
  const [fieldToEdit, setFieldToEdit] = useState<FormField | null>(null);
  const [isFormFieldListExpanded, setIsFormFieldListExpanded] = useState(true);
  const [isLocationExpanded, setIsLocationExpanded] = useState(true);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user, eventUser, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [originalTickets, setOriginalTickets] = useState<TicketType[]>([]);
  const [stripeConnectStatus, setStripeConnectStatus] = useState<StripeConnectStatus | null>(null);
  const [isLoadingStripeStatus, setIsLoadingStripeStatus] = useState(false);
  const [isStartingOnboarding, setIsStartingOnboarding] = useState(false);

  console.log("Ticket Types: ", ticketTypes);
  // Address-related state (local UI only)
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [addressValidationError, setAddressValidationError] = useState<
    string | null
  >(null);

  // Google Places Autocomplete refs
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const locationInputRef = useRef<HTMLInputElement | null>(null);

  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);

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

      // Address data
      if (initialData.address) {
        setAddressLine1(initialData.address.addressLine1 || "");
        setAddressLine2(initialData.address.addressLine2 || "");
        setCity(initialData.address.city || "");
        setPostcode(initialData.address.zipcode || "");

        if (initialData.address.location) {
          setLatitude(initialData.address.location.latitude);
          setLongitude(initialData.address.location.longitude);
        }
      }

      // Cover image
      setCoverPreview(initialData.eventImage || null);
      if (initialData.eventImage) {
        setCoverName("event-cover.png");
      }

      // Load tickets
      if (initialData.eventTickets && initialData.eventTickets.length > 0) {
        const ticketsToLoad = initialData.eventTickets.map((ticket: EventTicketResponseDto, index: number) => {
          const price = parseFloat(ticket.price) || 0;
          return {
            id: ticket.id || `ticket-${index}`,
            name: ticket.name,
            description: ticket.description || "",
            isFree: price === 0,
            price: price,
            isSingleUse: ticket.isSingleUse ?? true,
            quantity: ticket.quantityTotal || 100,
          };
        });

        // Set tickets directly (replaces existing tickets)
        setTicketTypes(ticketsToLoad);
        // Store original tickets for comparison in edit mode
        setOriginalTickets(ticketsToLoad);

        // Load form fields from the first ticket's question form
        const firstTicket = initialData.eventTickets[0];
        if (firstTicket.questionForm && firstTicket.questionForm.length > 0) {
          const fieldsToLoad = firstTicket.questionForm.map(
            (question: QuestionBlock, index: number) => {
              // Map backend question type to frontend field type
              let fieldType:
                | "short-text"
                | "long-text"
                | "single-select"
                | "multi-select" = "short-text";
              if (question.type === "longText") fieldType = "long-text";
              else if (question.type === "singleSelect")
                fieldType = "single-select";
              else if (question.type === "multiSelect")
                fieldType = "multi-select";
              else if (question.type === "shortText") fieldType = "short-text";

              return {
                id: `field-${index}`,
                question: question.question,
                type: fieldType,
                options: question.options || [],
                required: question.required,
              };
            }
          );

          // Set form fields directly (replaces existing fields)
          setFormFields(fieldsToLoad);
        }
      }

      // Set capacity (sum of all ticket quantities)
      if (initialData.eventTickets && initialData.eventTickets.length > 0) {
        const totalCapacity = initialData.eventTickets.reduce(
          (sum: number, ticket: EventTicketResponseDto) => sum + (ticket.quantityTotal || 0),
          0
        );
        setCapacity(totalCapacity.toString());
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

  // Initialize Google Places Autocomplete
  useEffect(() => {
    const initializeAutocomplete = () => {
      if (!locationInputRef.current || !window.google?.maps?.places) return;

      autocompleteRef.current = new google.maps.places.Autocomplete(
        locationInputRef.current,
        {
          // Remove types restriction to allow both addresses and establishments
          componentRestrictions: {
            country: GOOGLE_MAPS_CONFIG.COUNTRY_RESTRICTION,
          },
          fields: [
            "address_components",
            "formatted_address",
            "geometry",
            "name",
            "place_id",
          ],
          // Bias results towards London (good for UCL and other UK universities)
          bounds: {
            north: 51.6723,
            south: 51.3844,
            east: 0.1485,
            west: -0.3514,
          },
          strictBounds: false, // Allow results outside bounds but prioritize within
        }
      );

      autocompleteRef.current.addListener("place_changed", handlePlaceSelect);
    };

    loadGoogleMapsScript().then(initializeAutocomplete);

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current?.getPlace();
    if (!place) return;

    // Store place_id for validation
    if (place.place_id) {
      setSelectedPlaceId(place.place_id);
    }

    let street = "";
    let cityName = "";
    let postcodeValue = "";
    let country = "";
    let buildingName = "";

    // Get the place name (for establishments like "Roberts Building")
    if (place.name) {
      buildingName = place.name;
    }

    // Parse address components if available
    if (place.address_components) {
      place.address_components.forEach((component) => {
        const types = component.types;

        if (types.includes("street_number")) {
          street = component.long_name + " ";
        }
        if (types.includes("route")) {
          street += component.long_name;
        }
        if (types.includes("locality") || types.includes("postal_town")) {
          cityName = component.long_name;
        }
        if (types.includes("postal_code")) {
          postcodeValue = component.long_name;
        }
        if (types.includes("country")) {
          country = component.short_name;
        }
        // Also check for premise (building name in address components)
        if (types.includes("premise") && !buildingName) {
          buildingName = component.long_name;
        }
      });
    }

    if (place.geometry?.location) {
      setLatitude(place.geometry.location.lat());
      setLongitude(place.geometry.location.lng());
    }

    // Validate if address is in UK
    if (country && country !== "GB") {
      setAddressValidationError(
        "Sorry, we only support addresses within the United Kingdom."
      );
    } else {
      setAddressValidationError(null);
    }

    // Update address fields
    // For establishments, use the building name if street is empty
    if (buildingName && !street) {
      setAddressLine1(buildingName);
    } else if (street) {
      setAddressLine1(street.trim());
      // Put building name in address line 2 if it exists and is different from street
      if (buildingName && !street.includes(buildingName)) {
        setAddressLine2(buildingName);
      }
    }

    setCity(cityName);
    setPostcode(postcodeValue);

    // Update location field with formatted address or name
    if (place.formatted_address) {
      setLocation(place.formatted_address);
    } else if (buildingName) {
      setLocation(buildingName);
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

  // Update location when address fields change
  useEffect(() => {
    if (addressLine1 || city || postcode) {
      const fullAddress = [addressLine1, addressLine2, city, postcode]
        .filter(Boolean)
        .join(", ");
      if (fullAddress) {
        setLocation(fullAddress);
      }
    }
  }, [addressLine1, addressLine2, city, postcode, setLocation]);

  // Handle ticket operations (only for CREATE mode, since EDIT mode handles tickets immediately)
  const handleTicketOperations = async (eventId: string) => {
    const errors: string[] = [];

    // Only handle ticket creation for CREATE mode
    // In EDIT mode, tickets are created/updated/deleted immediately via handleSaveTicket/handleDeleteTicket
    if (mode === "create") {
      // Map frontend ticket types to API format
      const mapTicketToPayload = (ticket: TicketType): CreateEventTicketDto => ({
        id: ticket.id,
        eventId: eventId,
        name: ticket.name,
        description: ticket.description || "",
        price: ticket.isFree ? 0 : ticket.price,
        isPaid: !ticket.isFree,
        isSingleUse: ticket.isSingleUse ?? true,
        quantityTotal: ticket.quantity || 100,
        questionForm: formFields.map((field) => ({
          question: field.question,
          type: mapFieldTypeToQuestionType(field.type),
          options: field.options,
          required: field.required,
        })),
        isPrivate: false,
      });

      // Create all tickets for new event
      for (const ticket of ticketTypes) {
        try {
          await eventTicketService.createTicket(mapTicketToPayload(ticket));
        } catch (error: any) {
          console.error(`Failed to create ticket ${ticket.name}:`, error);
          errors.push(`Failed to create ticket "${ticket.name}"`);
        }
      }
    }

    return errors;
  };

  const handleSubmit = async () => {
    // Validation
    if (!eventName.trim()) {
      toast.error("Please enter an event name");
      return;
    }

    if (!start || !end) {
      toast.error("Please select start and end times");
      return;
    }

    if (new Date(start) >= new Date(end)) {
      toast.error("End time must be after start time");
      return;
    }

    if (!addressLine1 || !city || !postcode) {
      toast.error("Please complete the event location");
      return;
    }

    if (!validateUKPostcode(postcode)) {
      toast.error("Please enter a valid UK postcode");
      return;
    }

    // Check authentication using auth context
    if (!isAuthenticated || !eventUser) {
      toast.error("Please log in to create an event");
      router.push("/auth");
      return;
    }

    // Check Stripe Connect for paid tickets
    if (hasPaidTickets && (!stripeConnectStatus || !stripeConnectStatus.onboardingComplete)) {
      toast.error("Please complete payment setup before creating events with paid tickets");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare event data WITHOUT tickets (tickets will be managed separately)
      const eventData: CreateEventDto | UpdateEventDto = {
        name: eventName,
        description: description || "",
        eventImage: coverPreview || undefined,
        eventColor: "#6366f1",
        ownerEventUserId: eventUser.id,
        startDateTime: start,
        endDateTime: end,
        isPrivate: false,
        addressData: {
          name: eventName,
          addressLine1: addressLine1,
          addressLine2: addressLine2 || undefined,
          city: city,
          zipcode: postcode,
          location:
            latitude !== null && longitude !== null
              ? { latitude, longitude }
              : undefined,
        },
        categoryIds: [],
        eventUrl: undefined,
        // DO NOT include tickets in event payload
      };

      let createdOrUpdatedEventId: string;

      if (mode === "create") {
        // Create event first
        const response = await eventService.createEvent(eventData as CreateEventDto);
        if (response.success) {
          createdOrUpdatedEventId = response.event.id;

          // Then create tickets
          const ticketErrors = await handleTicketOperations(createdOrUpdatedEventId);

          if (ticketErrors.length > 0) {
            toast.warning(`Event created, but some tickets failed: ${ticketErrors.join(", ")}`);
          } else {
            toast.success("Event and tickets created successfully!");
          }

          clearForm();
          router.push(`/events/${createdOrUpdatedEventId}`);
        }
      } else {
        // Edit mode - use update API
        if (!eventId) {
          toast.error("Event ID is missing");
          return;
        }
        console.log("event data", JSON.stringify(eventData));
        const response = await eventService.updateEvent(eventId, eventData);
        if (response.success) {
          // In edit mode, tickets are already handled immediately via handleSaveTicket/handleDeleteTicket
          toast.success("Event updated successfully!");
          router.push(`/events/${eventId}`);
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

  const handleImageRemove = () => {
    setCoverPreview(null);
    setCoverName("invite-cover.png");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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

  const handleSaveTicket = async (ticket: TicketType) => {
    const isExistingTicket = ticketToEdit && originalTickets.some(t => t.id === ticket.id);

    // Map ticket to API format
    const mapTicketToPayload = (t: TicketType): CreateEventTicketDto => ({
      id: t.id,
      eventId: eventId,
      name: t.name,
      description: t.description || "",
      price: t.isFree ? 0 : t.price,
      isPaid: !t.isFree,
      isSingleUse: t.isSingleUse ?? true,
      quantityTotal: t.quantity || 100,
      questionForm: formFields.map((field) => ({
        question: field.question,
        type: mapFieldTypeToQuestionType(field.type),
        options: field.options,
        required: field.required,
      })),
      isPrivate: false,
    });

    if (mode === "edit" && eventId) {
      // In edit mode, make immediate backend calls
      try {
        if (ticketToEdit && isExistingTicket) {
          // Update existing ticket
          await eventTicketService.updateTicket(ticket.id, mapTicketToPayload(ticket));
          updateTicketType(ticket);
          // Update in originalTickets too
          setOriginalTickets(prev => prev.map(t => t.id === ticket.id ? ticket : t));
          toast.success(`"${ticket.name}" updated successfully`);
        } else {
          // Create new ticket
          const response = await eventTicketService.createTicket(mapTicketToPayload(ticket));
          // Update the ticket with the backend-generated ID if needed
          const ticketWithId = { ...ticket, id: response.id };
          addTicketType(ticketWithId);
          // Also add to originalTickets since it now exists in backend
          setOriginalTickets(prev => [...prev, ticketWithId]);
          toast.success(`"${ticket.name}" created successfully`);
        }
      } catch (error: any) {
        console.error("Failed to save ticket:", error);
        toast.error(error.response?.data?.message || `Failed to save "${ticket.name}"`);
        return; // Don't update state if backend call failed
      }
    } else {
      // In create mode, just update state (tickets will be created when event is created)
      if (ticketToEdit) {
        updateTicketType(ticket);
      } else {
        addTicketType(ticket);
      }
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    const ticketToDelete = ticketTypes.find(t => t.id === ticketId);
    if (!ticketToDelete) return;

    const ticketName = ticketToDelete.name;
    const isExistingTicket = originalTickets.some(t => t.id === ticketId);

    const message = mode === "edit" && isExistingTicket
      ? `Are you sure you want to delete "${ticketName}"? This action cannot be undone.`
      : `Are you sure you want to remove "${ticketName}"?`;

    if (confirm(message)) {
      // If in edit mode and this is an existing ticket (not newly added), delete it from backend
      if (mode === "edit" && isExistingTicket) {
        try {
          await eventTicketService.deleteTicket(ticketId);
          // Remove from frontend state after successful backend deletion
          deleteTicketType(ticketId);
          // Also remove from originalTickets so it won't be processed again on save
          setOriginalTickets(prev => prev.filter(t => t.id !== ticketId));
          toast.success(`"${ticketName}" deleted successfully`);
        } catch (error: any) {
          console.error(`Failed to delete ticket ${ticketId}:`, error);
          toast.error(error.response?.data?.message || `Failed to delete "${ticketName}"`);
        }
      } else {
        // In create mode, just remove from state
        deleteTicketType(ticketId);
        toast.success(`"${ticketName}" removed`);
      }
    }
  };

  const handleAddFormFieldClick = () => {
    setFieldToEdit(null);
    setIsFormFieldModalOpen(true);
  };

  const handleEditFormFieldClick = (field: FormField) => {
    setFieldToEdit(field);
    setIsFormFieldModalOpen(true);
  };

  const handleSaveFormField = (field: FormField) => {
    if (fieldToEdit) {
      updateFormField(field);
    } else {
      addFormField(field);
    }
  };

  const handleDeleteFormField = (fieldId: string) => {
    if (confirm("Are you sure you want to delete this form field?")) {
      deleteFormField(fieldId);
    }
  };

  const handleClearForm = () => {
    if (
      confirm(
        "Are you sure you want to clear the entire form? This action cannot be undone."
      )
    ) {
      clearForm();
      // Also clear local file input and address-related state
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (locationInputRef.current) {
        locationInputRef.current.value = "";
      }
      setSelectedPlaceId(null);
      setAddressValidationError(null);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] justify-center bg-background px-6 py-12">
      <div className="flex w-full max-w-6xl flex-col gap-6 text-foreground lg:flex-row">
        <section className="flex flex-col gap-5 rounded-3xl  p-7 lg:w-96 lg:shrink-0 lg:sticky lg:top-20 lg:self-start sm:flex-row lg:flex-col">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-card-background backdrop-blur-sm  sm:flex-1 sm:basis-0 lg:w-full lg:flex-none">
            {coverPreview ? (
              <img
                src={coverPreview}
                alt="Event cover"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted">
                <span className="text-3xl font-serif text-foreground">
                  You Are Invited
                </span>
                <span className="text-sm text-muted-foreground">
                  Upload a cover image
                </span>
              </div>
            )}
            <div className="absolute bottom-4 right-4 flex flex-wrap gap-2">
              <label
                htmlFor="cover-upload"
                className="rounded-full bg-primary/90 backdrop-blur-md px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary hover:scale-105 cursor-pointer"
              >
                Change cover
              </label>
              {coverPreview && (
                <button
                  type="button"
                  onClick={handleImageRemove}
                  className="rounded-full bg-white/20 backdrop-blur-md px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-white/30 hover:scale-105"
                >
                  Remove
                </button>
              )}
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
          <div className="rounded-2xl bg-card-background backdrop-blur-xl text-sm sm:flex-1 lg:flex-none lg:aspect-auto">
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
          </div>
        </section>

        <section className="flex-1 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Event Name"
                className="w-full bg-transparent text-3xl md:text-5xl font-bold text-foreground outline-none placeholder:text-muted-foreground/40"
              />
            </div>
            {mode === "create" && (
              <button
                type="button"
                onClick={handleClearForm}
                className="flex items-center gap-2 rounded-2xl bg-red-500/10 backdrop-blur-md px-5 py-3 text-red-400 transition-all hover:bg-red-500/20 hover:scale-105 cursor-pointer"
                title="Clear entire form"
              >
                <Trash2 className="h-5 w-5" />
                <span className="hidden sm:inline font-medium">Clear Form</span>
              </button>
            )}
          </div>

          <div className="rounded-xl backdrop-blur-xl px-4 py-4">
            <div className="flex gap-5">
              <div className="flex flex-col items-center py-3">
                <div className="h-3.5 w-3.5 rounded-full bg-primary"></div>
                <div className="my-2 w-0.5 flex-1 rounded-full bg-primary/30"></div>
                <div className="h-3.5 w-3.5 rounded-full bg-primary/30"></div>
              </div>

              <div className="flex flex-1 flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="text-sm font-medium text-muted-foreground sm:w-14">
                    Start
                  </label>
                  <input
                    type="datetime-local"
                    value={start}
                    min={new Date().toISOString().slice(0, 16)}
                    onChange={(e) => setStart(e.target.value)}
                    className="flex-1 rounded-xl bg-input-background px-4 py-3.5 text-foreground outline-none"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="text-sm font-medium text-muted-foreground sm:w-14">
                    End
                  </label>
                  <input
                    type="datetime-local"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="flex-1 rounded-xl bg-input-background px-4 py-3.5 text-foreground outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDescriptionClick}
            className="flex w-full items-center justify-center gap-3 rounded-3xl bg-card-background backdrop-blur-xl px-6 py-4 text-foreground text-base transition-all hover:bg-white/15 font-semibold cursor-pointer"
          >
            <Edit className="h-5 w-5" />
            <span>Edit Description</span>
          </button>

          <div className="rounded-3xl bg-card-background backdrop-blur-xl p-6">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setIsLocationExpanded(!isLocationExpanded)}
              role="button"
              aria-label={
                isLocationExpanded ? "Collapse location" : "Expand location"
              }
            >
              <label className="text-base text-foreground font-semibold cursor-pointer">
                Event Location
              </label>
              <div className="rounded-full p-2">
                {isLocationExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Display full address when collapsed */}
            {!isLocationExpanded && location && (
              <div className="mt-3 p-3 bg-card-secondary-background rounded-xl">
                <p className="text-sm text-foreground font-medium">
                  {location}
                </p>
              </div>
            )}

            {/* Show all fields when expanded */}
            {isLocationExpanded && (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Search for a building, venue, or address - or enter details
                  manually
                </p>

                {/* Google Places Autocomplete Search */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Search Location
                  </label>
                  <input
                    ref={locationInputRef}
                    type="text"
                    placeholder="Search for building, venue, or address..."
                    className="w-full rounded-xl bg-input-background px-4 py-3.5 text-foreground outline-none placeholder:text-muted-foreground/40 border-2 border-transparent focus:border-primary transition-all"
                  />
                  {addressValidationError && (
                    <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <p className="text-sm text-red-400">
                        {addressValidationError}
                      </p>
                    </div>
                  )}
                </div>

                {/* Address Line 1 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="Street address"
                    className="w-full rounded-xl bg-input-background px-4 py-3.5 text-foreground outline-none placeholder:text-muted-foreground/40"
                  />
                </div>

                {/* Address Line 2 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="Apartment, suite, building, etc."
                    className="w-full rounded-xl bg-input-background px-4 py-3.5 text-foreground outline-none placeholder:text-muted-foreground/40"
                  />
                </div>

                {/* City and Postcode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="w-full rounded-xl bg-input-background px-4 py-3.5 text-foreground outline-none placeholder:text-muted-foreground/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Postcode
                    </label>
                    <input
                      type="text"
                      value={postcode}
                      onChange={(e) =>
                        setPostcode(e.target.value.toUpperCase())
                      }
                      onBlur={(e) => {
                        // Validate on blur
                        const value = e.target.value.trim();
                        if (value && !validateUKPostcode(value)) {
                          // Could add error state here if needed
                        }
                      }}
                      placeholder="e.g., SW1A 1AA"
                      className="w-full rounded-xl bg-input-background px-4 py-3.5 text-foreground outline-none placeholder:text-muted-foreground/40"
                    />
                    {postcode && validateUKPostcode(postcode) && (
                      <p className="mt-1 text-sm text-green-400">
                        ✓ Valid UK postcode
                      </p>
                    )}
                    {postcode && !validateUKPostcode(postcode) && (
                      <p className="mt-1 text-sm text-red-400">
                        Please enter a valid UK postcode
                      </p>
                    )}
                  </div>
                </div>

                {/* Display full formatted address */}
                {location && (
                  <div className="mt-4 p-3 bg-card-secondary-background rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">
                      Full Address:
                    </p>
                    <p className="text-sm text-foreground font-medium">
                      {location}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="rounded-3xl bg-card-background backdrop-blur-xl p-6 space-y-5">
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
                className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105"
              >
                <Plus className="h-4 w-4" />
                Add Ticket
              </button>
            </div>

            {/* Stripe Connect Warning for Paid Tickets */}
            {hasPaidTickets && stripeConnectStatus && !stripeConnectStatus.onboardingComplete && (
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-400">
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
              <div className="space-y-3">
                {ticketTypes.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="rounded-2xl bg-card-secondary-background backdrop-blur-xl p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
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
                            {ticket.quantity.toLocaleString()} available
                          </p>
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
                  </div>
                ))}
              </div>
            )}

            {/* Expand/Collapse Button */}
            {ticketTypes.length > 0 && (
              <button
                type="button"
                onClick={() => setIsTicketListExpanded(!isTicketListExpanded)}
                className="w-full flex justify-center pt-3 pb-1 transition-all hover:bg-white/5 rounded-xl cursor-pointer"
                aria-label={
                  isTicketListExpanded
                    ? "Collapse ticket list"
                    : "Expand ticket list"
                }
              >
                {isTicketListExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            )}

            <div className="pt-5 border-t border-foreground/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-foreground">
                    Form Fields
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formFields.length === 0
                      ? "No form fields added"
                      : `${formFields.length} field${
                          formFields.length > 1 ? "s" : ""
                        }`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddFormFieldClick}
                  className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105"
                >
                  <Plus className="h-4 w-4" />
                  Add Field
                </button>
              </div>

              {/* List of Form Fields */}
              {formFields.length > 0 && isFormFieldListExpanded && (
                <div className="space-y-3 mt-5">
                  {formFields.map((field) => (
                    <div
                      key={field.id}
                      className="rounded-2xl bg-card-secondary-background backdrop-blur-xl p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-base font-semibold text-foreground">
                              {field.question}
                            </p>
                            {field.required && (
                              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                                Required
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {field.type === "short-text" && "Short Text"}
                            {field.type === "long-text" && "Long Text"}
                            {field.type === "single-select" && "Single Select"}
                            {field.type === "multi-select" && "Multi Select"}
                          </p>
                          {field.options && field.options.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {field.options.map((option, idx) => (
                                <span
                                  key={idx}
                                  className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-foreground"
                                >
                                  {option}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditFormFieldClick(field)}
                            className="rounded-full p-2 transition-all hover:bg-white/10"
                            aria-label="Edit field"
                          >
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFormField(field.id)}
                            className="rounded-full p-2 transition-all hover:bg-red-500/20"
                            aria-label="Delete field"
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Expand/Collapse Button */}
              {formFields.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setIsFormFieldListExpanded(!isFormFieldListExpanded)
                  }
                  className="w-full flex justify-center pt-3 pb-1 transition-all hover:bg-white/5 rounded-xl cursor-pointer"
                  aria-label={
                    isFormFieldListExpanded
                      ? "Collapse form field list"
                      : "Expand form field list"
                  }
                >
                  {isFormFieldListExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              )}
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-foreground/10">
              <div>
                <p className="text-base font-semibold text-foreground">
                  Require Approval
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Attendees must be approved
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRequireApproval((prev) => !prev)}
                className={`h-7 w-14 rounded-full transition-all ${
                  requireApproval
                    ? "bg-primary"
                    : "bg-card-secondary-background"
                }`}
              >
                <span
                  className={`block h-6 w-6 rounded-full transition-all ${
                    requireApproval
                      ? "translate-x-7 bg-primary-foreground"
                      : "translate-x-0.5 bg-foreground"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between pt-5 border-t border-foreground/10">
              <div>
                <p className="text-base font-semibold text-foreground">
                  Capacity
                </p>
                <p className="text-sm text-muted-foreground mt-1">{capacity}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCapacityModalOpen(true)}
                className="rounded-full p-2 transition-all hover:bg-card-background"
                aria-label="Edit capacity settings"
              >
                <Edit className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full rounded-full bg-primary py-5 text-center text-lg font-bold text-primary-foreground transition-all hover:scale-[1.02] hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
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

      <CapacityModal
        isOpen={isCapacityModalOpen}
        onClose={() => setIsCapacityModalOpen(false)}
      />

      <TicketTypeModal
        isOpen={isTicketTypeModalOpen}
        onClose={() => setIsTicketTypeModalOpen(false)}
        onSave={handleSaveTicket}
        ticketToEdit={ticketToEdit}
      />

      <FormFieldModal
        isOpen={isFormFieldModalOpen}
        onClose={() => setIsFormFieldModalOpen(false)}
        onSave={handleSaveFormField}
        fieldToEdit={fieldToEdit}
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
