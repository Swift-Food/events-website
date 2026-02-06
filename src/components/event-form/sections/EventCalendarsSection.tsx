"use client";

import { useState, useEffect, useRef } from "react";
import { CalendarDays, ChevronDown, X, Check } from "lucide-react";
import { useEventCreation } from "@/context/EventCreationContext";
import { calendarService } from "@/services/calendar.service";
import { Calendar } from "@/types/calendar";
import { useAuth } from "@/lib/auth/authContext";

export default function EventCalendarsSection() {
  const { selectedCalendarIds, setSelectedCalendarIds } = useEventCreation();
  const { isAuthenticated } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCalendars = async () => {
      try {
        setLoading(true);
        const data = await calendarService.getMyCalendars();
        setCalendars(data);
      } catch (error) {
        console.error("Failed to fetch calendars:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendars();
  }, [isAuthenticated]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const toggleCalendar = (id: string) => {
    setSelectedCalendarIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const selectedNames = calendars
    .filter((c) => selectedCalendarIds.includes(c.id))
    .map((c) => c.name);

  if (!isAuthenticated || calendars.length === 0) return null;

  return (
    <div className="relative w-fit" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl bg-card-background hover:bg-card-background/85 backdrop-blur-xl px-3 py-2 text-foreground transition-all cursor-pointer"
      >
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        {loading ? (
          <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-primary" />
        ) : selectedCalendarIds.length > 0 ? (
          <span className="text-sm font-medium text-foreground">
            {selectedNames.join(", ")}
          </span>
        ) : (
          <span className="text-sm font-medium text-foreground">
            Add to Calendars
          </span>
        )}
        {selectedCalendarIds.length > 0 ? (
          <div
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCalendarIds([]);
            }}
            className="p-0.5 rounded-full hover:bg-white/10 transition-all"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </div>
        ) : (
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-48 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-card-background backdrop-blur-xl shadow-lg">
          {calendars.map((calendar) => {
            const isSelected = selectedCalendarIds.includes(calendar.id);
            return (
              <button
                key={calendar.id}
                type="button"
                onClick={() => toggleCalendar(calendar.id)}
                className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-all cursor-pointer"
              >
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: calendar.calendarColor || "#6366f1" }}
                />
                <span className="flex-1 text-left text-sm text-foreground truncate">
                  {calendar.name}
                </span>
                {isSelected && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
