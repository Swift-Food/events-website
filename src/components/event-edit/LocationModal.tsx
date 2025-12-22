"use client";

import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { useEventCreation } from "@/context/EventCreationContext";
import { GOOGLE_MAPS_CONFIG } from "@/constants/google-maps";
import { loadGoogleMapsScript } from "@/utils/google-maps-loader";

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
  } = useEventCreation();

  // Local state for editing
  const [localVenueName, setLocalVenueName] = useState(venueName);
  const [localAddressLine1, setLocalAddressLine1] = useState(addressLine1);
  const [localAddressLine2, setLocalAddressLine2] = useState(addressLine2);
  const [localCity, setLocalCity] = useState(city);
  const [localPostcode, setLocalPostcode] = useState(postcode);
  const [localLatitude, setLocalLatitude] = useState<number | null>(latitude);
  const [localLongitude, setLocalLongitude] = useState<number | null>(longitude);
  const [addressValidationError, setAddressValidationError] = useState<string | null>(null);

  // Google Places Autocomplete refs
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const locationInputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Update local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalVenueName(venueName);
      setLocalAddressLine1(addressLine1);
      setLocalAddressLine2(addressLine2);
      setLocalCity(city);
      setLocalPostcode(postcode);
      setLocalLatitude(latitude);
      setLocalLongitude(longitude);
      setAddressValidationError(null);
    }
  }, [isOpen, venueName, addressLine1, addressLine2, city, postcode, latitude, longitude]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Check if click is on the parent button (which has its own toggle logic)
        const target = event.target as HTMLElement;
        if (!target.closest('[data-location-trigger]')) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!isOpen) return;

    const initializeAutocomplete = () => {
      if (!locationInputRef.current || !window.google?.maps?.places) return;

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

    loadGoogleMapsScript().then(initializeAutocomplete);

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isOpen]);

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
    // Validate required fields
    if (!localAddressLine1 || !localCity || !localPostcode) {
      setAddressValidationError("Please complete all required address fields");
      return;
    }

    if (!validateUKPostcode(localPostcode)) {
      setAddressValidationError("Please enter a valid UK postcode");
      return;
    }

    // Save to context
    setVenueName(localVenueName);
    setAddressLine1(localAddressLine1);
    setAddressLine2(localAddressLine2);
    setCity(localCity);
    setPostcode(localPostcode);
    setLatitude(localLatitude);
    setLongitude(localLongitude);

    // Update the full location string
    const fullAddress = [localAddressLine1, localAddressLine2, localCity, localPostcode]
      .filter(Boolean)
      .join(", ");
    setLocation(fullAddress);

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl bg-card-background/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden"
    >
      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Google Places Search */}
        <div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={locationInputRef}
              type="text"
              placeholder="Enter location or virtual link"
              className="w-full rounded-lg bg-card-secondary-background pl-10 pr-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 border border-white/10 focus:border-primary/50 transition-all"
            />
          </div>
        </div>

        {addressValidationError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{addressValidationError}</p>
          </div>
        )}

        <div className="border-t border-white/10 pt-4 space-y-3">
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
              onChange={(e) => setLocalAddressLine1(e.target.value)}
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
                onChange={(e) => setLocalCity(e.target.value)}
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
                onChange={(e) => setLocalPostcode(e.target.value.toUpperCase())}
                placeholder="e.g., SW1A 1AA"
                className="w-full rounded-lg bg-card-secondary-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 border border-white/10 focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          {/* Postcode validation feedback */}
          {localPostcode && (
            <div>
              {validateUKPostcode(localPostcode) ? (
                <p className="text-xs text-green-400">Valid UK postcode</p>
              ) : (
                <p className="text-xs text-red-400">Please enter a valid UK postcode</p>
              )}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            Save Location
          </button>
        </div>
      </div>
    </div>
  );
}
