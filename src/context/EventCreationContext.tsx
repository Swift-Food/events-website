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

  // Ticketing
  tickets: "free" | "paid";
  setTickets: Dispatch<SetStateAction<"free" | "paid">>;
  ticketPrice: string;
  setTicketPrice: Dispatch<SetStateAction<string>>;
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
  tickets: "free" | "paid";
  ticketPrice: string;
  requireApproval: boolean;
  capacity: string;
  isUnlimitedCapacity: boolean;
  hasWaitingList: boolean;
  capacityNumber: string;
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

  // Ticketing
  const [tickets, setTickets] = useState<"free" | "paid">(
    storedDraft.tickets === "paid" ? "paid" : "free"
  );
  const [ticketPrice, setTicketPrice] = useState(
    storedDraft.ticketPrice ?? "25"
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

  // Cover image
  const [coverPreview, setCoverPreview] = useState<string | null>(
    typeof storedDraft.coverPreview === "string"
      ? storedDraft.coverPreview
      : null
  );
  const [coverName, setCoverName] = useState(
    storedDraft.coverName ?? "invite-cover.png"
  );

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
      tickets,
      ticketPrice,
      requireApproval,
      capacity,
      isUnlimitedCapacity,
      hasWaitingList,
      capacityNumber,
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
    ticketPrice,
    tickets,
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
    setTickets("free");
    setTicketPrice("25");
    setRequireApproval(false);
    setCapacity("Unlimited");
    setIsUnlimitedCapacity(true);
    setHasWaitingList(false);
    setCapacityNumber("100");
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
        tickets,
        setTickets,
        ticketPrice,
        setTicketPrice,
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
