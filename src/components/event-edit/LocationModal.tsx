"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Video, Users, Link } from "lucide-react";
import { useEventCreation } from "@/context/EventCreationContext";
import { GOOGLE_MAPS_CONFIG } from "@/constants/google-maps";
import { loadGoogleMapsScript } from "@/utils/google-maps-loader";
import { EventFormat } from "@/types/event/status";

// UK Postcode validation regex
const UK_POSTCODE_REGEX = /^([A-Z]{1,2}\d{1,2}[A-Z]?)\s?(\d[A-Z]{2})$/i;

const validateUKPostcode = (postcode: string): boolean => {
  if (!postcode) return false;
  return UK_POSTCODE_REGEX.test(postcode.trim());
};

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LocationModal({ isOpen, onClose }: LocationModalProps) {
  const {
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
    eventFormat,
    setEventFormat,
    virtualMeetingUrl,
    setVirtualMeetingUrl,
    hideFullAddress,
    setHideFullAddress,
  } = useEventCreation();

  // Local state for editing
  const [localEventFormat, setLocalEventFormat] = useState(eventFormat);
  const [localVirtualMeetingUrl, setLocalVirtualMeetingUrl] = useState(virtualMeetingUrl);
  const [localVenueName, setLocalVenueName] = useState(venueName);
  const [localAddressLine1, setLocalAddressLine1] = useState(addressLine1);
  const [localAddressLine2, setLocalAddressLine2] = useState(addressLine2);
  const [localCity, setLocalCity] = useState(city);
  const [localPostcode, setLocalPostcode] = useState(postcode);
  const [localLatitude, setLocalLatitude] = useState<number | null>(latitude);
  const [localLongitude, setLocalLongitude] = useState<number | null>(longitude);
  const [localHideFullAddress, setLocalHideFullAddress] = useState(hideFullAddress);
  const [addressValidationError, setAddressValidationError] = useState<string | null>(null);

  // Google Places Autocomplete refs
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const locationInputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Update local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalEventFormat(eventFormat);
      setLocalVirtualMeetingUrl(virtualMeetingUrl);
      setLocalVenueName(venueName);
      setLocalAddressLine1(addressLine1);
      setLocalAddressLine2(addressLine2);
      setLocalCity(city);
      setLocalPostcode(postcode);
      setLocalLatitude(latitude);
      setLocalLongitude(longitude);
      setLocalHideFullAddress(hideFullAddress);
      setAddressValidationError(null);
    }
  }, [isOpen, eventFormat, virtualMeetingUrl, venueName, addressLine1, addressLine2, city, postcode, latitude, longitude, hideFullAddress]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        // Check if click is on the parent button (which has its own toggle logic)
        if (target.closest('[data-location-trigger]')) {
          return;
        }
        // Check if click is on Google Places autocomplete dropdown
        if (target.closest('.pac-container')) {
          return;
        }
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Check if physical location fields should be shown
  const showPhysicalLocation = localEventFormat === EventFormat.IN_PERSON || localEventFormat === EventFormat.BOTH;

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!isOpen || !showPhysicalLocation) {
      // Clean up when closing or switching to virtual-only
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
      return;
    }

    const initializeAutocomplete = () => {
      if (!locationInputRef.current || !window.google?.maps?.places) return;

      // Clean up any existing instance first
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }

      autocompleteRef.current = new google.maps.places.Autocomplete(
        locationInputRef.current,
        {
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
          bounds: {
            north: 51.6723,
            south: 51.3844,
            east: 0.1485,
            west: -0.3514,
          },
          strictBounds: false,
        }
      );

      autocompleteRef.current.addListener("place_changed", handlePlaceSelect);
    };

    // Small delay to ensure the input is mounted
    const timeoutId = setTimeout(() => {
      loadGoogleMapsScript().then(initializeAutocomplete);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [isOpen, showPhysicalLocation]);

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current?.getPlace();
    if (!place) return;

    // Clear all fields first
    setLocalVenueName("");
    setLocalAddressLine1("");
    setLocalAddressLine2("");
    setLocalCity("");
    setLocalPostcode("");
    setLocalLatitude(null);
    setLocalLongitude(null);

    // Clear the search input
    if (locationInputRef.current) {
      locationInputRef.current.value = "";
    }

    let street = "";
    let cityName = "";
    let postcodeValue = "";
    let country = "";
    let buildingName = "";

    // Get the place name
    if (place.name) {
      buildingName = place.name;
    }

    // Parse address components
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
        if (types.includes("premise") && !buildingName) {
          buildingName = component.long_name;
        }
      });
    }

    if (place.geometry?.location) {
      setLocalLatitude(place.geometry.location.lat());
      setLocalLongitude(place.geometry.location.lng());
    }

    // Validate UK address
    if (country && country !== "GB") {
      setAddressValidationError(
        "Sorry, we only support addresses within the United Kingdom."
      );
    } else {
      setAddressValidationError(null);
    }

    // Set venue name
    if (buildingName) {
      setLocalVenueName(buildingName);
    }

    // Update address fields
    if (buildingName && !street) {
      setLocalAddressLine1(buildingName);
    } else if (street) {
      setLocalAddressLine1(street.trim());
      if (buildingName && !street.includes(buildingName)) {
        setLocalAddressLine2(buildingName);
      }
    }

    setLocalCity(cityName);
    setLocalPostcode(postcodeValue);
  };

  const handleSave = () => {
    // Validate format is selected
    if (localEventFormat === null) {
      setAddressValidationError("Please select an event format");
      return;
    }

    // Validate virtual meeting URL for virtual/hybrid events
    if (
      (localEventFormat === EventFormat.VIRTUAL || localEventFormat === EventFormat.BOTH) &&
      !localVirtualMeetingUrl.trim()
    ) {
      setAddressValidationError("Please enter a virtual meeting URL");
      return;
    }

    // Validate address for in-person/hybrid events
    if (localEventFormat === EventFormat.IN_PERSON || localEventFormat === EventFormat.BOTH) {
      if (!localAddressLine1 || !localCity || !localPostcode) {
        setAddressValidationError("Please complete all required address fields");
        return;
      }

      if (!validateUKPostcode(localPostcode)) {
        setAddressValidationError("Please enter a valid UK postcode");
        return;
      }

      // Require latitude/longitude to ensure address was selected from Google autocomplete
      if (localLatitude === null || localLongitude === null) {
        setAddressValidationError("Please select an address from the search suggestions to ensure accurate location");
        return;
      }
    }

    // Save event format and virtual URL to context
    setEventFormat(localEventFormat);
    setVirtualMeetingUrl(localVirtualMeetingUrl);

    // Save address to context (only if in-person or both)
    if (localEventFormat === EventFormat.IN_PERSON || localEventFormat === EventFormat.BOTH) {
      setVenueName(localVenueName);
      setAddressLine1(localAddressLine1);
      setAddressLine2(localAddressLine2);
      setCity(localCity);
      setPostcode(localPostcode);
      setLatitude(localLatitude);
      setLongitude(localLongitude);
      setHideFullAddress(localHideFullAddress);

      // Update the full location string
      const fullAddress = [localAddressLine1, localAddressLine2, localCity, localPostcode]
        .filter(Boolean)
        .join(", ");
      setLocation(fullAddress);
    } else {
      // Clear address fields for virtual-only events
      setVenueName("");
      setAddressLine1("");
      setAddressLine2("");
      setCity("");
      setPostcode("");
      setLatitude(null);
      setLongitude(null);
      setLocation("");
      setHideFullAddress(false);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl bg-card-background/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden"
    >
      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Event Format Selector */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">
            Event Format
          </label>
          <div className="flex rounded-lg overflow-hidden bg-card-secondary-background border border-white/10">
            <button
              type="button"
              onClick={() => setLocalEventFormat(EventFormat.IN_PERSON)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 transition-all ${
                localEventFormat === EventFormat.IN_PERSON
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">In Person</span>
            </button>
            <button
              type="button"
              onClick={() => setLocalEventFormat(EventFormat.VIRTUAL)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 transition-all ${
                localEventFormat === EventFormat.VIRTUAL
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Video className="h-4 w-4" />
              <span className="text-sm font-medium">Virtual</span>
            </button>
            <button
              type="button"
              onClick={() => setLocalEventFormat(EventFormat.BOTH)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 transition-all ${
                localEventFormat === EventFormat.BOTH
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Both</span>
            </button>
          </div>
        </div>

        {addressValidationError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{addressValidationError}</p>
          </div>
        )}

        {/* Virtual Meeting URL (for Virtual and Both events) */}
        {(localEventFormat === EventFormat.VIRTUAL || localEventFormat === EventFormat.BOTH) && (
          <div className="border-t border-white/10 pt-4">
            {/* Label for Both/Hybrid events */}
            {localEventFormat === EventFormat.BOTH && (
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Virtual Meeting</span>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>
            )}
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Meeting URL <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-2 rounded-lg bg-card-secondary-background px-3 py-2 border border-white/10 focus-within:border-primary/50 transition-all">
              <Link className="h-4 w-4 text-muted-foreground" />
              <input
                type="url"
                value={localVirtualMeetingUrl}
                onChange={(e) => setLocalVirtualMeetingUrl(e.target.value)}
                placeholder="https://zoom.us/j/... or Google Meet link"
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Zoom, Google Meet, Teams, or any meeting URL
            </p>
          </div>
        )}

        {/* Physical Location (for In Person and Both events) */}
        {showPhysicalLocation && (
          <>
            {/* Divider for Both/Hybrid events */}
            {localEventFormat === EventFormat.BOTH && (
              <div className="flex items-center gap-3 pt-2">
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Physical Venue</span>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>
            )}

            <div className={localEventFormat === EventFormat.BOTH ? "" : "border-t border-white/10 pt-4"}>
              {/* Google Places Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  ref={locationInputRef}
                  type="text"
                  placeholder="Search for a location"
                  className="w-full rounded-lg bg-card-secondary-background pl-10 pr-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 border border-white/10 focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-3">
              {/* Venue Name */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Venue Name (Optional)
                </label>
                <input
                  type="text"
                  value={localVenueName}
                  onChange={(e) => setLocalVenueName(e.target.value)}
                  placeholder="e.g., UCL Student Centre"
                  className="w-full rounded-lg bg-card-secondary-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 border border-white/10 focus:border-primary/50 transition-all"
                />
              </div>

              {/* Address Line 1 */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Address Line 1 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={localAddressLine1}
                  onChange={(e) => {
                    setLocalAddressLine1(e.target.value);
                    // Clear lat/lng when manually editing - requires re-selection from autocomplete
                    setLocalLatitude(null);
                    setLocalLongitude(null);
                  }}
                  placeholder="Street address"
                  className="w-full rounded-lg bg-card-secondary-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 border border-white/10 focus:border-primary/50 transition-all"
                />
              </div>

              {/* Address Line 2 */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  value={localAddressLine2}
                  onChange={(e) => setLocalAddressLine2(e.target.value)}
                  placeholder="Apartment, suite, building, etc."
                  className="w-full rounded-lg bg-card-secondary-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 border border-white/10 focus:border-primary/50 transition-all"
                />
              </div>

              {/* City and Postcode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    City <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={localCity}
                    onChange={(e) => {
                      setLocalCity(e.target.value);
                      // Clear lat/lng when manually editing - requires re-selection from autocomplete
                      setLocalLatitude(null);
                      setLocalLongitude(null);
                    }}
                    placeholder="City"
                    className="w-full rounded-lg bg-card-secondary-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 border border-white/10 focus:border-primary/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Postcode <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={localPostcode}
                    onChange={(e) => {
                      setLocalPostcode(e.target.value.toUpperCase());
                      // Clear lat/lng when manually editing - requires re-selection from autocomplete
                      setLocalLatitude(null);
                      setLocalLongitude(null);
                    }}
                    placeholder="e.g., SW1A 1AA"
                    className="w-full rounded-lg bg-card-secondary-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 border border-white/10 focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              {/* Validation feedback */}
              <div className="space-y-1">
                {localPostcode && (
                  <div>
                    {validateUKPostcode(localPostcode) ? (
                      <p className="text-xs text-green-400">Valid UK postcode</p>
                    ) : (
                      <p className="text-xs text-red-400">Please enter a valid UK postcode</p>
                    )}
                  </div>
                )}
                {localAddressLine1 && (
                  <div>
                    {localLatitude !== null && localLongitude !== null ? (
                      <p className="text-xs text-green-400">Location verified via Google</p>
                    ) : (
                      <p className="text-xs text-amber-400">Please select an address from the search suggestions above</p>
                    )}
                  </div>
                )}
              </div>

              {/* Hide Full Address Toggle */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Hide Full Address
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Only reveal after registration
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLocalHideFullAddress((prev) => !prev)}
                  className={`h-6 w-11 rounded-full transition-all ${
                    localHideFullAddress
                      ? "bg-primary"
                      : "bg-card-secondary-background"
                  }`}
                >
                  <span
                    className={`block h-5 w-5 rounded-full transition-all ${
                      localHideFullAddress
                        ? "translate-x-5 bg-primary-foreground"
                        : "translate-x-0.5 bg-foreground"
                    }`}
                  />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
