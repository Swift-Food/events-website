"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, MapPin, Video, Link, X } from "lucide-react";
import { useEventCreation } from "@/context/EventCreationContext";
import { GOOGLE_MAPS_CONFIG } from "@/constants/google-maps";
import { loadGoogleMapsScript } from "@/utils/google-maps-loader";

// UK Postcode validation regex
const UK_POSTCODE_REGEX = /^([A-Z]{1,2}\d{1,2}[A-Z]?)\s?(\d[A-Z]{2})$/i;

const validateUKPostcode = (postcode: string): boolean => {
  if (!postcode) return false;
  return UK_POSTCODE_REGEX.test(postcode.trim());
};

// URL detection patterns
const URL_PATTERNS = /^(https?:\/\/|www\.)|^(zoom\.us|meet\.google\.com|teams\.microsoft\.com|webex\.com)/i;

const isLikelyUrl = (input: string): boolean => {
  const trimmed = input.trim();
  if (!trimmed) return false;
  return URL_PATTERNS.test(trimmed) || trimmed.includes('.com/') || trimmed.includes('.co/');
};

// Detect platform from URL
const detectPlatform = (url: string): string => {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('zoom.us')) return 'Zoom';
  if (lowerUrl.includes('meet.google.com')) return 'Google Meet';
  if (lowerUrl.includes('teams.microsoft.com')) return 'Microsoft Teams';
  if (lowerUrl.includes('webex.com')) return 'Webex';
  return 'Virtual Meeting';
};

// Truncate URL for display
const truncateUrl = (url: string, maxLength: number = 45): string => {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + "...";
};

export type LocationEditMode = { type: 'venue' } | { type: 'virtual' } | null;

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  editMode?: LocationEditMode;
}

type ModalView = 'search' | 'manual-address' | 'virtual-link';

export default function LocationModal({ isOpen, onClose, editMode = null }: LocationModalProps) {
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
    virtualMeetingUrl,
    setVirtualMeetingUrl,
  } = useEventCreation();

  // Determine initial view based on edit mode
  const getInitialView = useCallback((): ModalView => {
    if (editMode?.type === 'venue') return 'manual-address';
    if (editMode?.type === 'virtual') return 'virtual-link';
    return 'search';
  }, [editMode]);

  // Current view state
  const [currentView, setCurrentView] = useState<ModalView>(getInitialView());

  // Search input state
  const [searchInput, setSearchInput] = useState("");
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);

  // Local state for manual address editing
  const [localVenueName, setLocalVenueName] = useState(venueName);
  const [localAddressLine1, setLocalAddressLine1] = useState(addressLine1);
  const [localAddressLine2, setLocalAddressLine2] = useState(addressLine2);
  const [localCity, setLocalCity] = useState(city);
  const [localPostcode, setLocalPostcode] = useState(postcode);
  const [localLatitude, setLocalLatitude] = useState<number | null>(latitude);
  const [localLongitude, setLocalLongitude] = useState<number | null>(longitude);

  // Local state for virtual link
  const [localVirtualUrl, setLocalVirtualUrl] = useState(virtualMeetingUrl);

  // Validation error
  const [validationError, setValidationError] = useState<string | null>(null);

  // Google Places Autocomplete refs
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentView(getInitialView());
      setSearchInput("");
      setDetectedUrl(null);
      setLocalVenueName(venueName);
      setLocalAddressLine1(addressLine1);
      setLocalAddressLine2(addressLine2);
      setLocalCity(city);
      setLocalPostcode(postcode);
      setLocalLatitude(latitude);
      setLocalLongitude(longitude);
      setLocalVirtualUrl(virtualMeetingUrl);
      setValidationError(null);
    }
  }, [isOpen, venueName, addressLine1, addressLine2, city, postcode, latitude, longitude, virtualMeetingUrl, getInitialView]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (target.closest('[data-location-trigger]')) return;
        if (target.closest('.pac-container')) return;
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Initialize Google Places Autocomplete for search view
  useEffect(() => {
    if (!isOpen || currentView !== 'search') {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
      return;
    }

    const initializeAutocomplete = () => {
      if (!searchInputRef.current || !window.google?.maps?.places) return;

      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }

      autocompleteRef.current = new google.maps.places.Autocomplete(
        searchInputRef.current,
        {
          componentRestrictions: { country: GOOGLE_MAPS_CONFIG.COUNTRY_RESTRICTION },
          fields: ["address_components", "formatted_address", "geometry", "name", "place_id"],
          bounds: { north: 51.6723, south: 51.3844, east: 0.1485, west: -0.3514 },
          strictBounds: false,
        }
      );

      autocompleteRef.current.addListener("place_changed", handlePlaceSelect);
    };

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
  }, [isOpen, currentView]);

  // Handle search input changes - detect URLs
  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);

    if (isLikelyUrl(value)) {
      setDetectedUrl(value.trim());
    } else {
      setDetectedUrl(null);
    }
  };

  // Handle place selection from Google autocomplete
  const handlePlaceSelect = () => {
    const place = autocompleteRef.current?.getPlace();
    if (!place) return;

    let street = "";
    let cityName = "";
    let postcodeValue = "";
    let country = "";
    let buildingName = place.name || "";

    if (place.address_components) {
      place.address_components.forEach((component) => {
        const types = component.types;
        if (types.includes("street_number")) street = component.long_name + " ";
        if (types.includes("route")) street += component.long_name;
        if (types.includes("locality") || types.includes("postal_town")) cityName = component.long_name;
        if (types.includes("postal_code")) postcodeValue = component.long_name;
        if (types.includes("country")) country = component.short_name;
        if (types.includes("premise") && !buildingName) buildingName = component.long_name;
      });
    }

    // Validate UK address
    if (country && country !== "GB") {
      setValidationError("Sorry, we only support addresses within the United Kingdom.");
      return;
    }

    // Set coordinates
    const lat = place.geometry?.location?.lat() ?? null;
    const lng = place.geometry?.location?.lng() ?? null;

    // Build address line 1
    let addressL1 = "";
    let addressL2 = "";
    if (buildingName && !street) {
      addressL1 = buildingName;
    } else if (street) {
      addressL1 = street.trim();
      if (buildingName && !street.includes(buildingName)) {
        addressL2 = buildingName;
      }
    }

    // Save directly to context and close
    setVenueName(buildingName);
    setAddressLine1(addressL1);
    setAddressLine2(addressL2);
    setCity(cityName);
    setPostcode(postcodeValue);
    setLatitude(lat);
    setLongitude(lng);

    // Update location string for display
    const fullAddress = [addressL1, addressL2, cityName, postcodeValue].filter(Boolean).join(", ");
    setLocation(fullAddress);

    onClose();
  };

  // Add virtual link from URL confirmation
  const handleAddVirtualLink = () => {
    if (!detectedUrl) return;

    // Ensure URL has protocol
    let url = detectedUrl;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    setVirtualMeetingUrl(url);
    onClose();
  };

  // Cancel URL detection
  const handleCancelUrl = () => {
    setDetectedUrl(null);
    setSearchInput("");
  };

  // Save manual address
  const handleSaveManualAddress = () => {
    // Validate required fields
    if (!localAddressLine1 || !localCity || !localPostcode) {
      setValidationError("Please complete all required address fields");
      return;
    }

    if (!validateUKPostcode(localPostcode)) {
      setValidationError("Please enter a valid UK postcode");
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

    // Update location string
    const fullAddress = [localAddressLine1, localAddressLine2, localCity, localPostcode].filter(Boolean).join(", ");
    setLocation(fullAddress);

    onClose();
  };

  // Save virtual link from focused input
  const handleSaveVirtualLink = () => {
    if (!localVirtualUrl.trim()) {
      setValidationError("Please enter a virtual meeting URL");
      return;
    }

    // Ensure URL has protocol
    let url = localVirtualUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    setVirtualMeetingUrl(url);
    onClose();
  };

  // Get modal title based on current state
  const getModalTitle = () => {
    if (editMode?.type === 'venue') return 'Edit Venue';
    if (editMode?.type === 'virtual') return 'Edit Virtual Link';
    if (currentView === 'manual-address') return 'Enter Address';
    if (currentView === 'virtual-link') return 'Add Virtual Link';
    return 'Location';
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl bg-card-background/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden"
    >
      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">{getModalTitle()}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{validationError}</p>
          </div>
        )}

        {/* Search View */}
        {currentView === 'search' && (
          <>
            {/* Unified Search Input */}
            <div className="relative">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 border transition-all ${
                detectedUrl
                  ? "bg-purple-500/10 border-purple-500/50"
                  : "bg-card-secondary-background border-white/10 focus-within:border-primary/50"
              }`}>
                {detectedUrl ? (
                  <Link className="h-4 w-4 text-purple-400" />
                ) : (
                  <Search className="h-4 w-4 text-muted-foreground" />
                )}
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchInput}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  placeholder="Search venue or paste meeting link..."
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            {/* URL Confirmation Row */}
            {detectedUrl && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <Link className="h-4 w-4 text-purple-400 flex-shrink-0" />
                <span className="flex-1 text-sm text-foreground truncate">
                  {truncateUrl(detectedUrl)}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleCancelUrl}
                    className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddVirtualLink}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                  >
                    Add Link
                  </button>
                </div>
              </div>
            )}

            {/* Divider */}
            {!detectedUrl && (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10"></div>
                  <span className="text-xs font-medium text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-white/10"></div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentView('virtual-link')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-card-secondary-background border border-white/10 hover:bg-white/5 transition-colors"
                  >
                    <Link className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-medium text-foreground">Add Virtual Link</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentView('manual-address')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-card-secondary-background border border-white/10 hover:bg-white/5 transition-colors"
                  >
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Enter Manually</span>
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* Manual Address View */}
        {currentView === 'manual-address' && (
          <div className="space-y-3">
            {/* Back button if not in edit mode */}
            {!editMode && (
              <button
                type="button"
                onClick={() => setCurrentView('search')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                &larr; Back to search
              </button>
            )}

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
                    setLocalLatitude(null);
                    setLocalLongitude(null);
                  }}
                  placeholder="e.g., SW1A 1AA"
                  className="w-full rounded-lg bg-card-secondary-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 border border-white/10 focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            {/* Validation feedback */}
            {localPostcode && (
              <div>
                {validateUKPostcode(localPostcode) ? (
                  <p className="text-xs text-green-400">Valid UK postcode</p>
                ) : (
                  <p className="text-xs text-red-400">Please enter a valid UK postcode</p>
                )}
              </div>
            )}

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSaveManualAddress}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 mt-2"
            >
              {editMode?.type === 'venue' ? 'Save Changes' : 'Add Venue'}
            </button>
          </div>
        )}

        {/* Virtual Link View */}
        {currentView === 'virtual-link' && (
          <div className="space-y-3">
            {/* Back button if not in edit mode */}
            {!editMode && (
              <button
                type="button"
                onClick={() => setCurrentView('search')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                &larr; Back to search
              </button>
            )}

            {/* Virtual Link Input */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Meeting URL <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-2 rounded-lg bg-card-secondary-background px-3 py-2 border border-white/10 focus-within:border-purple-500/50 transition-all">
                <Link className="h-4 w-4 text-purple-400" />
                <input
                  type="url"
                  value={localVirtualUrl}
                  onChange={(e) => setLocalVirtualUrl(e.target.value)}
                  placeholder="https://zoom.us/j/... or Google Meet link"
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Zoom, Google Meet, Teams, or any meeting URL
              </p>
            </div>

            {/* Platform detection preview */}
            {localVirtualUrl && isLikelyUrl(localVirtualUrl) && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <Video className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-muted-foreground">
                  Detected: <span className="text-foreground">{detectPlatform(localVirtualUrl)}</span>
                </span>
              </div>
            )}

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSaveVirtualLink}
              className="w-full rounded-lg bg-purple-500 py-2.5 text-sm font-semibold text-white transition-all hover:bg-purple-600 mt-2"
            >
              {editMode?.type === 'virtual' ? 'Save Changes' : 'Add Virtual Link'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
