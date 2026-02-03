"use client";

import { useState, forwardRef } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import LocationModal, {
  LocationEditMode,
} from "@/components/event-edit/LocationModal";
import {
  VenueCard,
  VirtualLinkCard,
} from "@/components/event-edit/LocationCards";
import GoogleMap from "@/components/GoogleMap";
import { useEventCreation } from "@/context/EventCreationContext";

interface LocationErrors {
  eventFormat?: string;
  virtualMeetingUrl?: string;
  addressLine1?: string;
  city?: string;
  postcode?: string;
}

interface EventLocationSectionProps {
  errors?: LocationErrors;
  onClearErrors?: () => void;
}

const EventLocationSection = forwardRef<
  HTMLDivElement,
  EventLocationSectionProps
>(({ errors, onClearErrors }, ref) => {
  const {
    virtualMeetingUrl,
    setVirtualMeetingUrl,
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
    setLocation,
    hideFullAddress,
    setHideFullAddress,
  } = useEventCreation();

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationEditMode, setLocationEditMode] =
    useState<LocationEditMode>(null);

  const hasError =
    errors?.eventFormat ||
    errors?.virtualMeetingUrl ||
    errors?.addressLine1 ||
    errors?.city ||
    errors?.postcode;

  return (
    <div ref={ref} className="space-y-3">
      {/* Location validation errors indicator */}
      {hasError && (
        <div className="p-3 bg-red-950 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400 font-medium">
            Please complete the location details:
          </p>
          <ul className="text-xs text-red-400/80 mt-1 list-disc list-inside">
            {errors?.eventFormat && <li>{errors.eventFormat}</li>}
            {errors?.virtualMeetingUrl && <li>{errors.virtualMeetingUrl}</li>}
            {errors?.addressLine1 && <li>{errors.addressLine1}</li>}
            {errors?.city && <li>{errors.city}</li>}
            {errors?.postcode && <li>{errors.postcode}</li>}
          </ul>
        </div>
      )}

      {/* Main Location Button - always visible at top */}
      <div className="relative">
        <button
          type="button"
          data-location-trigger
          onClick={() => {
            if (!locationEditMode) {
              setIsLocationModalOpen(!isLocationModalOpen);
            }
            if (hasError && onClearErrors) {
              onClearErrors();
            }
          }}
          className={`flex w-full items-center gap-3 rounded-xl bg-card-background hover:bg-card-background/85 backdrop-blur-xl px-4 py-3 text-foreground transition-all cursor-pointer ${hasError ? "ring-2 ring-red-400/50" : ""}`}
        >
          <MapPin
            className={`h-5 w-5 ${hasError ? "text-red-400" : "text-muted-foreground"}`}
          />
          <div className="flex-1 text-left">
            <p
              className={`text-sm font-medium ${hasError ? "text-red-400" : "text-foreground"}`}
            >
              Add Event Location
            </p>
            <p
              className={`text-xs ${hasError ? "text-red-400/80" : "text-muted-foreground"}`}
            >
              Physical location or virtual link
            </p>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform ${isLocationModalOpen && !locationEditMode ? "rotate-180" : ""}`}
          />
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

      {/* Virtual Link Card */}
      {virtualMeetingUrl && (
        <div className="relative">
          <VirtualLinkCard
            virtualMeetingUrl={virtualMeetingUrl}
            onEdit={() => {
              setLocationEditMode({ type: "virtual" });
              setIsLocationModalOpen(true);
            }}
            onDelete={() => {
              setVirtualMeetingUrl("");
            }}
          />
          {/* Edit Modal for Virtual Link */}
          {isLocationModalOpen && locationEditMode?.type === "virtual" && (
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
      {(addressLine1 ||
        (venueName && latitude !== null) ||
        (city && latitude !== null)) && (
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
              setLocationEditMode({ type: "venue" });
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
          {isLocationModalOpen && locationEditMode?.type === "venue" && (
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
  );
});

EventLocationSection.displayName = "EventLocationSection";

export default EventLocationSection;
