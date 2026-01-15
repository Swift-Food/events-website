"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import type { Dispatch, SetStateAction } from "react";
import { TicketType } from "@/types";
import { FormField } from "@/types";
import { EventFormat } from "@/types/event/status";

interface EventCreationContextType {
  // Event details
  eventName: string;
  setEventName: Dispatch<SetStateAction<string>>;
  start: string;
  setStart: Dispatch<SetStateAction<string>>;
  end: string;
  setEnd: Dispatch<SetStateAction<string>>;
  location: string;
  setLocation: Dispatch<SetStateAction<string>>;
  description: string;
  setDescription: Dispatch<SetStateAction<string>>;

  // Event format
  eventFormat: EventFormat | null;
  setEventFormat: Dispatch<SetStateAction<EventFormat | null>>;
  virtualMeetingUrl: string;
  setVirtualMeetingUrl: Dispatch<SetStateAction<string>>;

  // Event visibility
  isPrivate: boolean;
  setIsPrivate: Dispatch<SetStateAction<boolean>>;
  hideFullAddress: boolean;
  setHideFullAddress: Dispatch<SetStateAction<boolean>>;

  // Address details
  venueName: string;
  setVenueName: Dispatch<SetStateAction<string>>;
  addressLine1: string;
  setAddressLine1: Dispatch<SetStateAction<string>>;
  addressLine2: string;
  setAddressLine2: Dispatch<SetStateAction<string>>;
  city: string;
  setCity: Dispatch<SetStateAction<string>>;
  postcode: string;
  setPostcode: Dispatch<SetStateAction<string>>;
  latitude: number | null;
  setLatitude: Dispatch<SetStateAction<number | null>>;
  longitude: number | null;
  setLongitude: Dispatch<SetStateAction<number | null>>;

  // Ticketing
  ticketTypes: TicketType[];
  setTicketTypes: Dispatch<SetStateAction<TicketType[]>>;
  addTicketType: (ticket: TicketType) => void;
  updateTicketType: (ticket: TicketType) => void;
  deleteTicketType: (ticketId: string) => void;
  requireApproval: boolean;
  setRequireApproval: Dispatch<SetStateAction<boolean>>;
  capacity: string;
  setCapacity: Dispatch<SetStateAction<string>>;
  isUnlimitedCapacity: boolean;
  setIsUnlimitedCapacity: Dispatch<SetStateAction<boolean>>;
  hasWaitingList: boolean;
  setHasWaitingList: Dispatch<SetStateAction<boolean>>;
  capacityNumber: string;
  setCapacityNumber: Dispatch<SetStateAction<string>>;

  // Form fields
  formFields: FormField[];
  setFormFields: Dispatch<SetStateAction<FormField[]>>;
  addFormField: (field: FormField) => void;
  updateFormField: (field: FormField) => void;
  deleteFormField: (fieldId: string) => void;

  // Cover image
  coverPreview: string | null;
  setCoverPreview: Dispatch<SetStateAction<string | null>>;
  coverName: string;
  setCoverName: Dispatch<SetStateAction<string>>;

  // Categories
  selectedCategoryIds: string[];
  setSelectedCategoryIds: Dispatch<SetStateAction<string[]>>;
  selectedSubcategoryIds: string[];
  setSelectedSubcategoryIds: Dispatch<SetStateAction<string[]>>;

  // Organiser terms acceptance
  acceptedOrganizerTerms: boolean;
  setAcceptedOrganizerTerms: Dispatch<SetStateAction<boolean>>;

  // External event import
  externalEventUrl: string;
  setExternalEventUrl: Dispatch<SetStateAction<string>>;

  // Form actions
  clearForm: () => void;
  persistEventDraft: () => void;
}

const EventCreationContext = createContext<
  EventCreationContextType | undefined
>(undefined);

const STORAGE_KEY = "eventCreationDraft";

type EventDraft = {
  eventName: string;
  start: string;
  end: string;
  location: string;
  description: string;
  eventFormat: EventFormat | null;
  virtualMeetingUrl: string;
  isPrivate: boolean;
  hideFullAddress: boolean;
  venueName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  latitude: number | null;
  longitude: number | null;
  ticketTypes: TicketType[];
  requireApproval: boolean;
  capacity: string;
  isUnlimitedCapacity: boolean;
  hasWaitingList: boolean;
  capacityNumber: string;
  formFields: FormField[];
  coverPreview: string | null;
  coverName: string;
  selectedCategoryIds: string[];
  selectedSubcategoryIds: string[];
  acceptedOrganizerTerms: boolean;
  externalEventUrl: string;
};

// Helper to format a Date to datetime-local input format
const formatDateTime = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Helper to get default start/end times (tomorrow at noon, for 2 hours)
const getDefaultTimes = () => {
  const now = new Date();
  // Default to tomorrow at 12:00 PM
  const start = new Date(now.getTime());
  start.setDate(start.getDate() + 1); // Tomorrow
  start.setHours(12, 0, 0, 0); // Noon
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

  return {
    start: formatDateTime(start),
    end: formatDateTime(end),
  };
};

// Check if a date string is valid and optionally in the future
const isValidDate = (dateStr: string | undefined, requireFuture: boolean = true): boolean => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  if (requireFuture) {
    return date > new Date();
  }
  return true;
};

// Default ticket for new events
const getDefaultTicket = (): TicketType => ({
  id: `ticket-${Date.now()}`,
  name: "General Admission",
  description: "",
  isFree: true,
  price: 0,
  isSingleUse: true,
  quantity: 100000, // Unlimited by default
  questionForm: [],
});

export function EventCreationProvider({
  children,
  disablePersistence = false
}: {
  children: ReactNode;
  disablePersistence?: boolean;
}) {
  const defaultTimes = getDefaultTimes();

  const loadDraft = () => {
    if (typeof window === "undefined" || disablePersistence) {
      return {};
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as Partial<EventDraft>) : {};
    } catch (error) {
      console.warn("Failed to parse event draft", error);
      return {};
    }
  };

  const storedDraft = useMemo<Partial<EventDraft>>(() => loadDraft(), [disablePersistence]);

  // Event details
  const [eventName, setEventName] = useState(storedDraft.eventName ?? "");
  // Allow past dates only if this is an imported event (has externalEventUrl)
  const isImportedEvent = !!storedDraft.externalEventUrl;
  const [start, setStart] = useState(
    isValidDate(storedDraft.start, !isImportedEvent) ? storedDraft.start! : defaultTimes.start
  );
  const [end, setEnd] = useState(
    isValidDate(storedDraft.end, !isImportedEvent) ? storedDraft.end! : defaultTimes.end
  );
  const [location, setLocation] = useState(storedDraft.location ?? "");
  const [description, setDescription] = useState(storedDraft.description ?? "");

  // Event format
  const [eventFormat, setEventFormat] = useState<EventFormat | null>(
    storedDraft.eventFormat ?? null
  );
  const [virtualMeetingUrl, setVirtualMeetingUrl] = useState(
    storedDraft.virtualMeetingUrl ?? ""
  );

  // Event visibility
  const [isPrivate, setIsPrivate] = useState(
    storedDraft.isPrivate ?? false
  );
  const [hideFullAddress, setHideFullAddress] = useState(
    storedDraft.hideFullAddress ?? false
  );

  // Address details
  const [venueName, setVenueName] = useState(storedDraft.venueName ?? "");
  const [addressLine1, setAddressLine1] = useState(storedDraft.addressLine1 ?? "");
  const [addressLine2, setAddressLine2] = useState(storedDraft.addressLine2 ?? "");
  const [city, setCity] = useState(storedDraft.city ?? "");
  const [postcode, setPostcode] = useState(storedDraft.postcode ?? "");
  const [latitude, setLatitude] = useState<number | null>(storedDraft.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(storedDraft.longitude ?? null);

  // Ticketing
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>(
    storedDraft.ticketTypes && storedDraft.ticketTypes.length > 0
      ? storedDraft.ticketTypes
      : [getDefaultTicket()]
  );
  const [requireApproval, setRequireApproval] = useState(
    storedDraft.requireApproval ?? false
  );
  const [capacity, setCapacity] = useState(storedDraft.capacity ?? "Unlimited");
  const [isUnlimitedCapacity, setIsUnlimitedCapacity] = useState(
    storedDraft.isUnlimitedCapacity ?? true
  );
  const [hasWaitingList, setHasWaitingList] = useState(
    storedDraft.hasWaitingList ?? false
  );
  const [capacityNumber, setCapacityNumber] = useState(
    storedDraft.capacityNumber ?? "100"
  );

  // Form fields
  const [formFields, setFormFields] = useState<FormField[]>(
    storedDraft.formFields ?? []
  );

  // Cover image
  const [coverPreview, setCoverPreview] = useState<string | null>(
    typeof storedDraft.coverPreview === "string"
      ? storedDraft.coverPreview
      : null
  );
  const [coverName, setCoverName] = useState(
    storedDraft.coverName ?? "invite-cover.png"
  );

  // Categories
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    storedDraft.selectedCategoryIds ?? []
  );
  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState<string[]>(
    storedDraft.selectedSubcategoryIds ?? []
  );

  // Organiser terms acceptance
  const [acceptedOrganizerTerms, setAcceptedOrganizerTerms] = useState(
    storedDraft.acceptedOrganizerTerms ?? false
  );

  // External event import
  const [externalEventUrl, setExternalEventUrl] = useState(
    storedDraft.externalEventUrl ?? ""
  );

  // Ticket management functions
  const addTicketType = useCallback((ticket: TicketType) => {
    setTicketTypes((prev) => [...prev, ticket]);
  }, []);

  const updateTicketType = useCallback((ticket: TicketType) => {
    setTicketTypes((prev) =>
      prev.map((t) => (t.id === ticket.id ? ticket : t))
    );
  }, []);

  const deleteTicketType = useCallback((ticketId: string) => {
    setTicketTypes((prev) => prev.filter((t) => t.id !== ticketId));
  }, []);

  // Form field management functions
  const addFormField = useCallback((field: FormField) => {
    setFormFields((prev) => [...prev, field]);
  }, []);

  const updateFormField = useCallback((field: FormField) => {
    setFormFields((prev) =>
      prev.map((f) => (f.id === field.id ? field : f))
    );
  }, []);

  const deleteFormField = useCallback((fieldId: string) => {
    setFormFields((prev) => prev.filter((f) => f.id !== fieldId));
  }, []);

  const persistEventDraft = useCallback(() => {
    if (typeof window === "undefined" || disablePersistence) {
      return;
    }

    const payload: EventDraft = {
      eventName,
      start,
      end,
      location,
      description,
      eventFormat,
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
      requireApproval,
      capacity,
      isUnlimitedCapacity,
      hasWaitingList,
      capacityNumber,
      formFields,
      coverPreview,
      coverName,
      selectedCategoryIds,
      selectedSubcategoryIds,
      acceptedOrganizerTerms,
      externalEventUrl,
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn("Failed to save event draft to storage", error);
    }
  }, [
    disablePersistence,
    capacity,
    capacityNumber,
    coverName,
    coverPreview,
    description,
    end,
    eventName,
    eventFormat,
    virtualMeetingUrl,
    isPrivate,
    hideFullAddress,
    hasWaitingList,
    isUnlimitedCapacity,
    location,
    requireApproval,
    start,
    ticketTypes,
    formFields,
    venueName,
    addressLine1,
    addressLine2,
    city,
    postcode,
    latitude,
    longitude,
    selectedCategoryIds,
    selectedSubcategoryIds,
    acceptedOrganizerTerms,
    externalEventUrl,
  ]);

  useEffect(() => {
    if (!disablePersistence) {
      persistEventDraft();
    }
  }, [persistEventDraft, disablePersistence]);

  const clearForm = () => {
    const newTimes = getDefaultTimes();
    setEventName("");
    setStart(newTimes.start);
    setEnd(newTimes.end);
    setLocation("");
    setDescription("");
    setEventFormat(null);
    setVirtualMeetingUrl("");
    setIsPrivate(false);
    setHideFullAddress(false);
    setVenueName("");
    setAddressLine1("");
    setAddressLine2("");
    setCity("");
    setPostcode("");
    setLatitude(null);
    setLongitude(null);
    setTicketTypes([getDefaultTicket()]);
    setRequireApproval(false);
    setCapacity("Unlimited");
    setIsUnlimitedCapacity(true);
    setHasWaitingList(false);
    setCapacityNumber("100");
    setFormFields([]);
    setCoverPreview(null);
    setCoverName("invite-cover.png");
    setSelectedCategoryIds([]);
    setSelectedSubcategoryIds([]);
    setAcceptedOrganizerTerms(false);
    setExternalEventUrl("");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <EventCreationContext.Provider
      value={{
        eventName,
        setEventName,
        start,
        setStart,
        end,
        setEnd,
        location,
        setLocation,
        description,
        setDescription,
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
        capacity,
        setCapacity,
        isUnlimitedCapacity,
        setIsUnlimitedCapacity,
        hasWaitingList,
        setHasWaitingList,
        capacityNumber,
        setCapacityNumber,
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
        setExternalEventUrl,
        clearForm,
        persistEventDraft,
      }}
    >
      {children}
    </EventCreationContext.Provider>
  );
}

export function useEventCreation() {
  const context = useContext(EventCreationContext);
  if (context === undefined) {
    throw new Error(
      "useEventCreation must be used within an EventCreationProvider"
    );
  }
  return context;
}
