"use client";

import { useState, useEffect, useRef } from "react";
import { Link2, Loader2, CheckCircle2, AlertCircle, X, Sparkles } from "lucide-react";
import { useEventCreation } from "@/context/EventCreationContext";
import { EventFormat } from "@/types/event/status";
import { toast } from "sonner";

interface ImportEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ImportStatus = "idle" | "loading" | "success" | "error";

interface ImportedEventData {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: {
    name?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  };
  image?: string;
  url?: string;
  eventFormat?: "IN_PERSON" | "VIRTUAL" | "BOTH";
}

// UK Postcode regex pattern
const UK_POSTCODE_REGEX = /\b([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})\b/i;

// Extract postcode from address string and return cleaned address + postcode
function extractPostcode(address: string): { cleanedAddress: string; postcode: string | null } {
  const match = address.match(UK_POSTCODE_REGEX);
  if (match) {
    const postcode = match[1].toUpperCase();
    // Remove the postcode and any trailing comma/spaces from the address
    const cleanedAddress = address
      .replace(UK_POSTCODE_REGEX, "")
      .replace(/,\s*$/, "")
      .replace(/\s+/g, " ")
      .trim();
    return { cleanedAddress, postcode };
  }
  return { cleanedAddress: address, postcode: null };
}

export default function ImportEventModal({ isOpen, onClose }: ImportEventModalProps) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [importedData, setImportedData] = useState<ImportedEventData | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const {
    setEventName,
    setDescription,
    setStart,
    setEnd,
    setVenueName,
    setAddressLine1,
    setCity,
    setPostcode,
    setLatitude,
    setLongitude,
    setCoverPreview,
    setEventFormat,
    clearForm,
  } = useEventCreation();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setUrl("");
      setStatus("idle");
      setErrorMessage("");
      setImportedData(null);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const fetchEventData = async () => {
    if (!url.trim()) {
      setErrorMessage("Please enter a URL");
      setStatus("error");
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      setErrorMessage("Please enter a valid URL");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/import-event?url=${encodeURIComponent(url)}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch event data");
      }

      const data = await response.json();

      // Check if we got any useful data
      const hasData = data.name || data.description || data.startDate || data.location?.name || data.image;

      if (!hasData) {
        throw new Error("Could not extract event details from this page");
      }

      setImportedData(data);
      setStatus("success");
    } catch (error) {
      console.error("Import error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to import event");
      setStatus("error");
    }
  };

  const applyImportedData = () => {
    if (!importedData) return;

    // Clear the form first to remove any existing data (including default tickets)
    clearForm();

    if (importedData.name) {
      setEventName(importedData.name);
    }

    if (importedData.description) {
      setDescription(importedData.description);
    }

    if (importedData.startDate) {
      const startDate = new Date(importedData.startDate);
      const formattedStart = startDate.toISOString().slice(0, 16);
      setStart(formattedStart);
    }

    if (importedData.endDate) {
      const endDate = new Date(importedData.endDate);
      const formattedEnd = endDate.toISOString().slice(0, 16);
      setEnd(formattedEnd);
    }

    if (importedData.location) {
      if (importedData.location.name) {
        setVenueName(importedData.location.name);
      }

      // Handle address and try to extract postcode if not provided
      let addressToSet = importedData.location.address || "";
      let postcodeToSet = importedData.location.postalCode || "";

      // If no postcode but we have an address, try to extract postcode from it
      if (!postcodeToSet && addressToSet) {
        const { cleanedAddress, postcode } = extractPostcode(addressToSet);
        if (postcode) {
          addressToSet = cleanedAddress;
          postcodeToSet = postcode;
        }
      }

      // Also check venue name for postcode if still not found
      if (!postcodeToSet && importedData.location.name) {
        const { postcode } = extractPostcode(importedData.location.name);
        if (postcode) {
          postcodeToSet = postcode;
        }
      }

      if (addressToSet) {
        setAddressLine1(addressToSet);
      }
      if (importedData.location.city) {
        setCity(importedData.location.city);
      }
      if (postcodeToSet) {
        setPostcode(postcodeToSet);
      }
      if (importedData.location.latitude && importedData.location.longitude) {
        setLatitude(importedData.location.latitude);
        setLongitude(importedData.location.longitude);
      }
    }

    if (importedData.image) {
      setCoverPreview(importedData.image);
    }

    // Set event format
    if (importedData.eventFormat) {
      const formatMap: Record<string, EventFormat> = {
        "IN_PERSON": EventFormat.IN_PERSON,
        "VIRTUAL": EventFormat.VIRTUAL,
        "BOTH": EventFormat.BOTH,
      };
      setEventFormat(formatMap[importedData.eventFormat]);
    }

    toast.success("Event details imported!");
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && status !== "loading") {
      fetchEventData();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md rounded-2xl bg-card-background border border-white/10 shadow-2xl shadow-black/50 overflow-hidden"
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Import Event</h2>
              <p className="text-sm text-muted-foreground">Paste a link to auto-fill details</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-4">
          {/* URL Input */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Link2 className="h-4 w-4" />
            </div>
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (status === "error") {
                  setStatus("idle");
                  setErrorMessage("");
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Paste event URL..."
              disabled={status === "loading"}
              className="w-full rounded-xl bg-card-secondary-background pl-10 pr-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 border border-white/10 focus:border-primary/50 transition-all disabled:opacity-50"
            />
          </div>

          {/* Loading State */}
          {status === "loading" && (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Fetching event details...</p>
                  <p className="text-xs text-muted-foreground mt-0.5">This may take a moment</p>
                </div>
              </div>
              <div className="mt-4 space-y-2.5">
                <div className="h-4 bg-white/5 rounded-md w-3/4 animate-pulse" />
                <div className="h-3 bg-white/5 rounded-md w-1/2 animate-pulse" />
                <div className="h-3 bg-white/5 rounded-md w-2/3 animate-pulse" />
              </div>
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">Import failed</p>
                  <p className="text-xs text-red-400/80 mt-0.5">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {status === "success" && importedData && (
            <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-400">Data found!</p>
                  {importedData.name && (
                    <p className="text-sm text-foreground font-medium mt-1.5 truncate">
                      {importedData.name}
                    </p>
                  )}
                  {importedData.startDate && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(importedData.startDate).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                  {importedData.location?.name && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {importedData.location.name}
                    </p>
                  )}
                  {!importedData.name && !importedData.startDate && !importedData.location?.name && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {importedData.description ? "Description" : ""}
                      {importedData.image ? (importedData.description ? ", Image" : "Image") : ""} found
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            onClick={status === "success" ? applyImportedData : fetchEventData}
            disabled={status === "loading" || (!url.trim() && status !== "success")}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </span>
            ) : status === "success" ? (
              "Apply to Form"
            ) : (
              "Import Event"
            )}
          </button>

          {/* Warning note */}
          <p className="text-xs text-center text-muted-foreground">
            Imported data may be incomplete. Verify all fields, particularly the description. Tickets are not imported.
          </p>
        </div>
      </div>
    </div>
  );
}
