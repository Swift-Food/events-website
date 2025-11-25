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
import { TicketType, FormField } from "@/types/event";
import { GOOGLE_MAPS_CONFIG } from "@/constants/google-maps";
import { loadGoogleMapsScript } from "@/utils/google-maps-loader";
import {
  eventService,
  CreateEventDto,
  EventStatus,
  QuestionType,
  CreateEventTicketDto,
} from "@/services/event.service";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/authContext";

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

function EventCreationForm() {
  const {
    eventName,
    setEventName,
    description,
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
    addTicketType,
    updateTicketType,
    deleteTicketType,
    requireApproval,
    setRequireApproval,
    capacity,
    setCapacity,
    formFields,
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

  // Address-related state (local UI only)
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [addressValidationError, setAddressValidationError] = useState<
    string | null
  >(null);

  // Google Places Autocomplete refs
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const locationInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleCreateEvent = async () => {
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

    setIsSubmitting(true);

    try {
      // Map frontend ticket types to API format
      const ticketsPayload: CreateEventTicketDto[] = ticketTypes.map(
        (ticket) => ({
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
        })
      );

      const eventData: CreateEventDto = {
        name: eventName,
        description: description || "",
        eventImage: coverPreview || undefined,
        eventColor: "#6366f1",
        ownerEventUserId: eventUser.id,
        startDateTime: start,
        endDateTime: end,
        status: EventStatus.DRAFT,
        isPrivate: false,
        addressData: {
          name: eventName,
          addressLine1: addressLine1,
          addressLine2: addressLine2 || undefined,
          city: city,
          zipcode: postcode,
          location: {
            latitude: latitude,
            longitude: longitude,
          },
        },
        categoryIds: [],
        eventUrl: undefined,
        tickets: ticketsPayload.length > 0 ? ticketsPayload : undefined,
      };
      console.log("Event Data payload: ", eventData)

      const response = await eventService.createEvent(eventData);

      if (response.success) {
        toast.success("Event created successfully!");
        clearForm();
        router.push(`/events/${response.event.id}`); 
      }
    } catch (error: any) {
      console.error("Error creating event:", error);

      if (error.response?.status === 401) {
        toast.error("Please log in to create an event");
        router.push("/auth");
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to create event. Please try again.");
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
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
      setCoverPreview(croppedImage);
      setIsCropModalOpen(false);
      setImageToCrop(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (e) {
      console.error("Error cropping image:", e);
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

  const handleSaveTicket = (ticket: TicketType) => {
    if (ticketToEdit) {
      updateTicketType(ticket);
    } else {
      addTicketType(ticket);
    }
  };

  const handleDeleteTicket = (ticketId: string) => {
    if (confirm("Are you sure you want to delete this ticket type?")) {
      deleteTicketType(ticketId);
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
        <section className="flex flex-col gap-5 rounded-3xl bg-card-background backdrop-blur-2xl shadow-2xl shadow-white/5 p-7 lg:w-96 lg:shrink-0 lg:sticky lg:top-20 lg:self-start sm:flex-row lg:flex-col">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-card-background backdrop-blur-sm shadow-lg  sm:flex-1 sm:basis-0 lg:w-full lg:flex-none">
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
                className="rounded-full bg-primary/90 backdrop-blur-md px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-xl transition-all hover:bg-primary hover:scale-105 cursor-pointer"
              >
                Change cover
              </label>
              {coverPreview && (
                <button
                  type="button"
                  onClick={handleImageRemove}
                  className="rounded-full bg-white/20 backdrop-blur-md px-5 py-2.5 text-sm font-medium text-foreground shadow-xl transition-all hover:bg-white/30 hover:scale-105"
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
          <div className="rounded-2xl bg-card-secondary-background backdrop-blur-xl text-sm sm:flex-1 lg:flex-none lg:aspect-auto">
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
            <button
              type="button"
              onClick={handleClearForm}
              className="flex items-center gap-2 rounded-2xl bg-red-500/10 backdrop-blur-md px-5 py-3 text-red-400 transition-all hover:bg-red-500/20 hover:scale-105 shadow-lg cursor-pointer"
              title="Clear entire form"
            >
              <Trash2 className="h-5 w-5" />
              <span className="hidden sm:inline font-medium">Clear Form</span>
            </button>
          </div>

          <div className="rounded-3xl bg-card-background backdrop-blur-xl p-6 shadow-xl">
            <div className="flex gap-5">
              <div className="flex flex-col items-center py-3">
                <div className="h-3.5 w-3.5 rounded-full bg-primary shadow-lg shadow-primary/50"></div>
                <div className="my-2 w-0.5 flex-1 rounded-full bg-primary/30"></div>
                <div className="h-3.5 w-3.5 rounded-full bg-primary/30 shadow-md"></div>
              </div>

              <div className="flex flex-1 flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="text-sm font-medium text-muted-foreground sm:w-14">
                    Start
                  </label>
                  <input
                    type="datetime-local"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="flex-1 rounded-xl bg-input-background px-4 py-3.5 text-foreground outline-none shadow-inner"
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
                    className="flex-1 rounded-xl bg-input-background px-4 py-3.5 text-foreground outline-none shadow-inner"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDescriptionClick}
            className="flex w-full items-center justify-center gap-3 rounded-3xl bg-card-background backdrop-blur-xl px-6 py-4 text-foreground text-base transition-all hover:bg-white/15 font-semibold shadow-xl cursor-pointer"
          >
            <Edit className="h-5 w-5" />
            <span>Edit Description</span>
          </button>

          <div className="rounded-3xl bg-card-background backdrop-blur-xl p-6 shadow-xl">
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
                    className="w-full rounded-xl bg-input-background px-4 py-3.5 text-foreground outline-none placeholder:text-muted-foreground/40 shadow-inner border-2 border-transparent focus:border-primary transition-all"
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
                    className="w-full rounded-xl bg-input-background px-4 py-3.5 text-foreground outline-none placeholder:text-muted-foreground/40 shadow-inner"
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
                    className="w-full rounded-xl bg-input-background px-4 py-3.5 text-foreground outline-none placeholder:text-muted-foreground/40 shadow-inner"
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
                      className="w-full rounded-xl bg-input-background px-4 py-3.5 text-foreground outline-none placeholder:text-muted-foreground/40 shadow-inner"
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
                      className="w-full rounded-xl bg-input-background px-4 py-3.5 text-foreground outline-none placeholder:text-muted-foreground/40 shadow-inner"
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

          <div className="rounded-3xl bg-card-background backdrop-blur-xl p-6 space-y-5 shadow-xl">
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
                className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:scale-105"
              >
                <Plus className="h-4 w-4" />
                Add Ticket
              </button>
            </div>

            {/* List of Ticket Types */}
            {ticketTypes.length > 0 && isTicketListExpanded && (
              <div className="space-y-3">
                {ticketTypes.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="rounded-2xl bg-card-secondary-background backdrop-blur-xl p-4 shadow-lg"
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
                  className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:scale-105"
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
                      className="rounded-2xl bg-card-secondary-background backdrop-blur-xl p-4 shadow-lg"
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
                className={`h-7 w-14 rounded-full transition-all shadow-inner ${
                  requireApproval
                    ? "bg-primary shadow-lg shadow-primary/30"
                    : "bg-card-secondary-background"
                }`}
              >
                <span
                  className={`block h-6 w-6 rounded-full transition-all shadow-lg ${
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
            onClick={handleCreateEvent}
            disabled={isSubmitting}
            className="w-full rounded-full bg-primary py-5 text-center text-lg font-bold text-primary-foreground transition-all hover:shadow-2xl hover:shadow-primary/50 hover:scale-[1.02] shadow-xl shadow-primary/30 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating Event..." : "Create Event"}
          </button>
        </section>
      </div>

      {isCropModalOpen && imageToCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-card-background backdrop-blur-2xl p-8 text-foreground shadow-2xl">
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
                  className="flex-1 rounded-full bg-card-background backdrop-blur-md py-4 text-center font-semibold text-foreground transition-all hover:bg-white/15 shadow-lg hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCropSave}
                  className="flex-1 rounded-full bg-primary py-4 text-center font-bold text-primary-foreground transition-all hover:shadow-2xl hover:shadow-primary/30 hover:scale-105 shadow-xl"
                >
                  Save
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

export default function EventCreationPage() {
  return (
    <EventCreationProvider>
      <EventCreationForm />
    </EventCreationProvider>
  );
}
