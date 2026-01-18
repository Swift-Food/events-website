"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Link, Video } from "lucide-react";
import { useEventCreation } from "@/context/EventCreationContext";
import { GOOGLE_MAPS_CONFIG } from "@/constants/google-maps";
import { loadGoogleMapsScript } from "@/utils/google-maps-loader";

// UK Postcode validation regex
const UK_POSTCODE_REGEX = /^([A-Z]{1,2}\d{1,2}[A-Z]?)\s?(\d[A-Z]{2})$/i;

const validateUKPostcode = (postcode: string): boolean => {
  if (!postcode) return false;
  return UK_POSTCODE_REGEX.test(postcode.trim());
};

// URL detection
const isLikelyUrl = (input: string): boolean => {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return false;
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('www.') ||
    trimmed.includes('zoom.us') ||
    trimmed.includes('meet.google.com') ||
    trimmed.includes('teams.microsoft.com') ||
    trimmed.includes('webex.com') ||
    /^[a-z0-9-]+\.[a-z]{2,}/.test(trimmed)
  );
};

// Ensure URL has protocol
const normalizeUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return 'https://' + trimmed;
  }
  return trimmed;
};

export type LocationEditMode = { type: 'venue' } | { type: 'virtual' } | null;

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  editMode?: LocationEditMode;
}

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

  // Input state
  const [inputValue, setInputValue] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Local state for venue edit mode
  const [localVenueName, setLocalVenueName] = useState(venueName);
  const [localAddressLine1, setLocalAddressLine1] = useState(addressLine1);
  const [localAddressLine2, setLocalAddressLine2] = useState(addressLine2);
  const [localCity, setLocalCity] = useState(city);
  const [localPostcode, setLocalPostcode] = useState(postcode);
  const [localLatitude, setLocalLatitude] = useState<number | null>(latitude);
  const [localLongitude, setLocalLongitude] = useState<number | null>(longitude);

  // Validation error
  const [validationError, setValidationError] = useState<string | null>(null);

  // Google services refs
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      // For virtual edit mode, initialize with existing URL
      if (editMode?.type === 'virtual') {
        setInputValue(virtualMeetingUrl);
      } else {
        setInputValue("");
      }
      setPredictions([]);
      setValidationError(null);
      setHighlightedIndex(-1);
      setLocalVenueName(venueName);
      setLocalAddressLine1(addressLine1);
      setLocalAddressLine2(addressLine2);
      setLocalCity(city);
      setLocalPostcode(postcode);
      setLocalLatitude(latitude);
      setLocalLongitude(longitude);

      // Focus input after a short delay
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, editMode, venueName, addressLine1, addressLine2, city, postcode, latitude, longitude, virtualMeetingUrl]);

  // Reset highlighted index when predictions change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [predictions, inputValue]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (target.closest('[data-location-trigger]')) return;
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Initialize Google Places services
  useEffect(() => {
    if (!isOpen) return;

    const initializeServices = async () => {
      await loadGoogleMapsScript();

      if (window.google?.maps?.places) {
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();

        // Create a dummy div for PlacesService
        const dummyDiv = document.createElement('div');
        placesServiceRef.current = new google.maps.places.PlacesService(dummyDiv);
      }
    };

    initializeServices();
  }, [isOpen]);

  // Fetch predictions when input changes (debounced)
  useEffect(() => {
    if (!inputValue.trim() || isLikelyUrl(inputValue) || editMode?.type === 'virtual') {
      setPredictions([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      if (autocompleteServiceRef.current && sessionTokenRef.current) {
        setIsLoadingPredictions(true);

        autocompleteServiceRef.current.getPlacePredictions(
          {
            input: inputValue,
            componentRestrictions: { country: GOOGLE_MAPS_CONFIG.COUNTRY_RESTRICTION },
            sessionToken: sessionTokenRef.current,
          },
          (results, status) => {
            setIsLoadingPredictions(false);
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              setPredictions(results as PlacePrediction[]);
            } else {
              setPredictions([]);
            }
          }
        );
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue, editMode]);

  // Handle selecting a place prediction
  const handleSelectPlace = useCallback((prediction: PlacePrediction) => {
    if (!placesServiceRef.current) return;

    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ["address_components", "formatted_address", "geometry", "name"],
        sessionToken: sessionTokenRef.current!,
      },
      (place, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !place) return;

        // Reset session token after successful place details request
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();

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

        const lat = place.geometry?.location?.lat() ?? null;
        const lng = place.geometry?.location?.lng() ?? null;

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

        // If in venue edit mode, update local state
        if (editMode?.type === 'venue') {
          setLocalVenueName(buildingName);
          setLocalAddressLine1(addressL1);
          setLocalAddressLine2(addressL2);
          setLocalCity(cityName);
          setLocalPostcode(postcodeValue);
          setLocalLatitude(lat);
          setLocalLongitude(lng);
          setInputValue("");
          setPredictions([]);
          return;
        }

        // Otherwise save directly and close
        setVenueName(buildingName);
        setAddressLine1(addressL1);
        setAddressLine2(addressL2);
        setCity(cityName);
        setPostcode(postcodeValue);
        setLatitude(lat);
        setLongitude(lng);

        const fullAddress = [addressL1, addressL2, cityName, postcodeValue].filter(Boolean).join(", ");
        setLocation(fullAddress);

        onClose();
      }
    );
  }, [editMode, onClose, setAddressLine1, setAddressLine2, setCity, setLatitude, setLocation, setLongitude, setPostcode, setVenueName]);

  // Handle selecting virtual link option
  const handleSelectVirtualLink = useCallback(() => {
    const url = normalizeUrl(inputValue);
    setVirtualMeetingUrl(url);
    onClose();
  }, [inputValue, onClose, setVirtualMeetingUrl]);

  // Handle "Use [text]" option for manual entry
  const handleUseAsManualEntry = useCallback(() => {
    // Open venue edit mode with the text as venue name
    setLocalVenueName(inputValue);
    setInputValue("");
    setPredictions([]);
  }, [inputValue]);

  // Handle "Add Virtual Link" button
  const handleAddVirtualLinkClick = useCallback(() => {
    setInputValue("https://");
    inputRef.current?.focus();
  }, []);

  // Save venue (for edit mode)
  const handleSaveVenue = useCallback(() => {
    if (!localAddressLine1 || !localCity || !localPostcode) {
      setValidationError("Please complete all required address fields");
      return;
    }

    if (!validateUKPostcode(localPostcode)) {
      setValidationError("Please enter a valid UK postcode");
      return;
    }

    setVenueName(localVenueName);
    setAddressLine1(localAddressLine1);
    setAddressLine2(localAddressLine2);
    setCity(localCity);
    setPostcode(localPostcode);
    setLatitude(localLatitude);
    setLongitude(localLongitude);

    const fullAddress = [localAddressLine1, localAddressLine2, localCity, localPostcode].filter(Boolean).join(", ");
    setLocation(fullAddress);

    onClose();
  }, [localAddressLine1, localAddressLine2, localCity, localLatitude, localLongitude, localPostcode, localVenueName, onClose, setAddressLine1, setAddressLine2, setCity, setLatitude, setLocation, setLongitude, setPostcode, setVenueName]);

  // Save virtual link (for edit mode)
  const handleSaveVirtualLink = useCallback(() => {
    const url = normalizeUrl(inputValue);
    if (!url || url === 'https://') {
      setValidationError("Please enter a virtual meeting URL");
      return;
    }
    setVirtualMeetingUrl(url);
    onClose();
  }, [inputValue, onClose, setVirtualMeetingUrl]);

  // Build list of selectable options for keyboard navigation
  const getSelectableOptions = useCallback(() => {
    const isUrlInput = isLikelyUrl(inputValue);
    const options: { type: string; data?: PlacePrediction }[] = [];

    if (isUrlInput && !editMode) {
      // URL option
      options.push({ type: 'virtual-link' });
    } else if (predictions.length > 0) {
      // Place predictions
      predictions.forEach((p) => options.push({ type: 'prediction', data: p }));
      // "Use as text" option
      if (inputValue.trim() && !editMode) {
        options.push({ type: 'use-text' });
      }
    } else if (!inputValue.trim() && !editMode) {
      // Virtual options when empty
      options.push({ type: 'add-virtual-link' });
    } else if (inputValue.trim() && !isUrlInput && predictions.length === 0 && !editMode) {
      // No results - show "use as text"
      options.push({ type: 'use-text' });
    }

    return options;
  }, [inputValue, predictions, editMode]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const options = getSelectableOptions();
    const optionCount = options.length;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        onClose();
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (optionCount > 0) {
          setHighlightedIndex((prev) => (prev + 1) % optionCount);
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (optionCount > 0) {
          setHighlightedIndex((prev) => (prev - 1 + optionCount) % optionCount);
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < optionCount) {
          const option = options[highlightedIndex];
          switch (option.type) {
            case 'virtual-link':
              handleSelectVirtualLink();
              break;
            case 'prediction':
              if (option.data) handleSelectPlace(option.data);
              break;
            case 'use-text':
              handleUseAsManualEntry();
              break;
            case 'add-virtual-link':
              handleAddVirtualLinkClick();
              break;
          }
        } else if (editMode?.type === 'virtual') {
          handleSaveVirtualLink();
        }
        break;
    }
  }, [getSelectableOptions, highlightedIndex, onClose, handleSelectVirtualLink, handleSelectPlace, handleUseAsManualEntry, handleAddVirtualLinkClick, editMode, handleSaveVirtualLink]);

  if (!isOpen) return null;

  const isUrlInput = isLikelyUrl(inputValue);
  const showVirtualOptions = !inputValue.trim() && !editMode;
  const showPredictions = predictions.length > 0 && !isUrlInput;
  const showUrlOption = isUrlInput && !editMode;
  const showUseAsText = inputValue.trim() && !isUrlInput && predictions.length > 0 && !editMode;
  const showNoResultsUseText = !isLoadingPredictions && inputValue.trim() && !isUrlInput && predictions.length === 0 && !editMode;

  // Calculate option indices for highlighting
  let optionIndex = 0;

  // Virtual Link Edit Mode
  if (editMode?.type === 'virtual') {
    return (
      <div
        ref={dropdownRef}
        className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl bg-card-background/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden"
      >
        <div className="p-3">
          {/* URL Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter virtual meeting link..."
            className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/50 border-b border-white/10 pb-3"
            autoFocus
          />

          {validationError && (
            <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-xs text-red-400">{validationError}</p>
            </div>
          )}

          {/* Preview */}
          {inputValue && (
            <button
              type="button"
              onClick={handleSaveVirtualLink}
              className="w-full mt-3 flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
            >
              <Video className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Virtual</p>
                <p className="text-xs text-muted-foreground truncate">
                  {normalizeUrl(inputValue)}
                </p>
              </div>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Venue Edit Mode
  if (editMode?.type === 'venue') {
    return (
      <div
        ref={dropdownRef}
        className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl bg-card-background/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden"
      >
        <div className="p-3 max-h-[70vh] overflow-y-auto">
          {/* Search Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for a new location..."
            className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/50"
            autoFocus
          />

          {validationError && (
            <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-xs text-red-400">{validationError}</p>
            </div>
          )}

          {/* Predictions */}
          {showPredictions && (
            <div className="mt-2">
              {predictions.map((prediction, idx) => (
                <button
                  key={prediction.place_id}
                  type="button"
                  onClick={() => handleSelectPlace(prediction)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                    highlightedIndex === idx ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {prediction.structured_formatting.main_text}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {prediction.structured_formatting.secondary_text}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-white/10 my-2"></div>

          {/* Manual Address Form */}
          <div className="space-y-3">
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

            {localPostcode && (
              <div>
                {validateUKPostcode(localPostcode) ? (
                  <p className="text-xs text-green-400">Valid UK postcode</p>
                ) : (
                  <p className="text-xs text-red-400">Please enter a valid UK postcode</p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleSaveVenue}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default Search Mode
  return (
    <div
      ref={dropdownRef}
      className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl bg-card-background/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden"
    >
      <div className="p-3">
        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter location or virtual link"
          className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/50"
          autoFocus
        />
      </div>

      {validationError && (
        <div className="mx-3 mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-xs text-red-400">{validationError}</p>
        </div>
      )}

      {/* URL Option - when URL is detected */}
      {showUrlOption && (
        <div className="px-1 pb-2">
          <button
            type="button"
            onClick={handleSelectVirtualLink}
            onMouseEnter={() => setHighlightedIndex(0)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left ${
              highlightedIndex === 0 ? 'bg-white/10' : 'hover:bg-white/5'
            }`}
          >
            <Video className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Virtual</p>
              <p className="text-xs text-muted-foreground truncate">{normalizeUrl(inputValue)}</p>
            </div>
          </button>
        </div>
      )}

      {/* Place Predictions */}
      {showPredictions && (
        <div className="px-1 pb-2">
          {predictions.map((prediction) => {
            const currentIndex = optionIndex++;
            return (
              <button
                key={prediction.place_id}
                type="button"
                onClick={() => handleSelectPlace(prediction)}
                onMouseEnter={() => setHighlightedIndex(currentIndex)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left ${
                  highlightedIndex === currentIndex ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {prediction.structured_formatting.main_text}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {prediction.structured_formatting.secondary_text}
                  </p>
                </div>
              </button>
            );
          })}

          {/* Use as text option */}
          {showUseAsText && (() => {
            const currentIndex = optionIndex++;
            return (
              <button
                type="button"
                onClick={handleUseAsManualEntry}
                onMouseEnter={() => setHighlightedIndex(currentIndex)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left ${
                  highlightedIndex === currentIndex ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Use &quot;{inputValue}&quot;
                </p>
              </button>
            );
          })()}
        </div>
      )}

      {/* Virtual Options - shown when input is empty */}
      {showVirtualOptions && (
        <div className="border-t border-white/10">
          <div className="px-4 py-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Virtual Options
            </p>
          </div>
          <div className="px-1 pb-2">
            <button
              type="button"
              onClick={handleAddVirtualLinkClick}
              onMouseEnter={() => setHighlightedIndex(0)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left ${
                highlightedIndex === 0 ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              <Link className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Add Virtual Link</p>
            </button>
          </div>
          <div className="px-4 pb-3">
            <p className="text-xs text-muted-foreground">
              If you have a virtual event link, you can enter or paste it above.
            </p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoadingPredictions && inputValue.trim() && !isUrlInput && (
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground">Searching...</p>
        </div>
      )}

      {/* No results */}
      {showNoResultsUseText && (
        <div className="px-1 pb-2">
          <button
            type="button"
            onClick={handleUseAsManualEntry}
            onMouseEnter={() => setHighlightedIndex(0)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left ${
              highlightedIndex === 0 ? 'bg-white/10' : 'hover:bg-white/5'
            }`}
          >
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Use &quot;{inputValue}&quot;
            </p>
          </button>
        </div>
      )}
    </div>
  );
}
