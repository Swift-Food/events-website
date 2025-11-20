"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface EventCreationContextType {
  // Event details
  eventName: string;
  setEventName: (value: string) => void;
  start: string;
  setStart: (value: string) => void;
  end: string;
  setEnd: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;

  // Ticketing
  tickets: "free" | "paid";
  setTickets: (value: "free" | "paid") => void;
  ticketPrice: string;
  setTicketPrice: (value: string) => void;
  requireApproval: boolean;
  setRequireApproval: (value: boolean) => void;
  capacity: string;
  setCapacity: (value: string) => void;

  // Cover image
  coverPreview: string | null;
  setCoverPreview: (value: string | null) => void;
  coverName: string;
  setCoverName: (value: string) => void;

  // Form actions
  clearForm: () => void;
}

const EventCreationContext = createContext<EventCreationContextType | undefined>(
  undefined
);

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

  // Event details
  const [eventName, setEventName] = useState("");
  const [start, setStart] = useState(defaultTimes.start);
  const [end, setEnd] = useState(defaultTimes.end);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  // Ticketing
  const [tickets, setTickets] = useState<"free" | "paid">("free");
  const [ticketPrice, setTicketPrice] = useState("25");
  const [requireApproval, setRequireApproval] = useState(false);
  const [capacity, setCapacity] = useState("Unlimited");

  // Cover image
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverName, setCoverName] = useState("invite-cover.png");

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
    setCoverPreview(null);
    setCoverName("invite-cover.png");
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
        coverPreview,
        setCoverPreview,
        coverName,
        setCoverName,
        clearForm,
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
