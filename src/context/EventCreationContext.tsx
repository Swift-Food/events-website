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
import { TicketType, FormField } from "@/types/event";

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

  // Address details
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
};

// Helper to get default start/end times
const getDefaultTimes = () => {
  const now = new Date();
  const start = new Date(now.getTime());
  start.setMinutes(0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour later

  const formatDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return {
    start: formatDateTime(start),
    end: formatDateTime(end),
  };
};

export function EventCreationProvider({ children }: { children: ReactNode }) {
  const defaultTimes = getDefaultTimes();

  const loadDraft = () => {
    if (typeof window === "undefined") {
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

  const storedDraft = useMemo<Partial<EventDraft>>(() => loadDraft(), []);

  // Event details
  const [eventName, setEventName] = useState(storedDraft.eventName ?? "");
  const [start, setStart] = useState(storedDraft.start ?? defaultTimes.start);
  const [end, setEnd] = useState(storedDraft.end ?? defaultTimes.end);
  const [location, setLocation] = useState(storedDraft.location ?? "");
  const [description, setDescription] = useState(storedDraft.description ?? "");

  // Address details
  const [addressLine1, setAddressLine1] = useState(storedDraft.addressLine1 ?? "");
  const [addressLine2, setAddressLine2] = useState(storedDraft.addressLine2 ?? "");
  const [city, setCity] = useState(storedDraft.city ?? "");
  const [postcode, setPostcode] = useState(storedDraft.postcode ?? "");
  const [latitude, setLatitude] = useState<number | null>(storedDraft.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(storedDraft.longitude ?? null);

  // Ticketing
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>(
    storedDraft.ticketTypes ?? []
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
    if (typeof window === "undefined") {
      return;
    }

    const payload: EventDraft = {
      eventName,
      start,
      end,
      location,
      description,
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
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn("Failed to save event draft to storage", error);
    }
  }, [
    capacity,
    capacityNumber,
    coverName,
    coverPreview,
    description,
    end,
    eventName,
    hasWaitingList,
    isUnlimitedCapacity,
    location,
    requireApproval,
    start,
    ticketTypes,
    formFields,
    addressLine1,
    addressLine2,
    city,
    postcode,
    latitude,
    longitude,
  ]);

  useEffect(() => {
    persistEventDraft();
  }, [persistEventDraft]);

  const clearForm = () => {
    const newTimes = getDefaultTimes();
    setEventName("");
    setStart(newTimes.start);
    setEnd(newTimes.end);
    setLocation("");
    setDescription("");
    setAddressLine1("");
    setAddressLine2("");
    setCity("");
    setPostcode("");
    setLatitude(null);
    setLongitude(null);
    setTicketTypes([]);
    setRequireApproval(false);
    setCapacity("Unlimited");
    setIsUnlimitedCapacity(true);
    setHasWaitingList(false);
    setCapacityNumber("100");
    setFormFields([]);
    setCoverPreview(null);
    setCoverName("invite-cover.png");
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
