"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Calendar } from "lucide-react";
import CalendarPicker from "./CalendarPicker";
import TimePicker from "./TimePicker";

interface DateTimePickerProps {
  value: string; // ISO format: "2024-01-15T14:30"
  onChange: (value: string) => void;
  minDate?: Date;
  error?: boolean;
  placeholder?: string;
}

export default function DateTimePicker({
  value,
  onChange,
  minDate,
  error,
  placeholder = "Select date & time",
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<"date" | "time">("date");
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const selectedDate = value ? new Date(value) : null;

  // Client-side only
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate dropdown position and update on scroll
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      // For date picker, align with the card (triggerRef). For time picker, align with time button.
      const ref = activeView === "date"
        ? triggerRef.current
        : (timeButtonRef.current || triggerRef.current);

      if (ref) {
        const rect = ref.getBoundingClientRect();

        setDropdownPosition({
          top: rect.bottom + 8,
          left: rect.left,
        });
      }
    };

    updatePosition();

    // Scroll dropdown into view if needed
    setTimeout(() => {
      dropdownRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 10);

    // Update position on scroll
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, activeView]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideTrigger = triggerRef.current?.contains(target);
      const clickedInsideDropdown = dropdownRef.current?.contains(target);

      if (!clickedInsideTrigger && !clickedInsideDropdown) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Use setTimeout to avoid the click that opened the dropdown from immediately closing it
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).toUpperCase();
  };

  const handleDateSelect = (date: Date) => {
    const hours = selectedDate?.getHours() ?? 12;
    const minutes = selectedDate?.getMinutes() ?? 0;
    date.setHours(hours, minutes, 0, 0);

    const isoString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    onChange(isoString);
    // Switch to time picker after selecting date
    setActiveView("time");
  };

  const handleTimeSelect = (hour: number, minute: number) => {
    const date = selectedDate ? new Date(selectedDate) : new Date();
    date.setHours(hour, minute, 0, 0);

    const isoString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    onChange(isoString);
  };

  const handleDateClick = () => {
    setActiveView("date");
    setIsOpen(true);
  };

  const handleTimeClick = () => {
    setActiveView("time");
    setIsOpen(true);
  };

  const dropdown = isOpen && mounted ? (
    <div
      ref={dropdownRef}
      style={{
        position: "fixed",
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: activeView === "time" ? 100 : 280,
        zIndex: 99999,
      }}
      className="rounded-2xl bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden"
    >
      {activeView === "date" ? (
        <CalendarPicker
          selectedDate={selectedDate}
          onSelect={handleDateSelect}
          minDate={minDate}
        />
      ) : (
        <TimePicker
          selectedTime={
            selectedDate
              ? { hour: selectedDate.getHours(), minute: selectedDate.getMinutes() }
              : null
          }
          onSelect={handleTimeSelect}
        />
      )}
    </div>
  ) : null;

  return (
    <>
      <div ref={triggerRef}>
        {/* Display */}
        <div
          className={`flex items-center gap-3 rounded-xl bg-card-background px-4 py-3.5 ${
            error ? "ring-2 ring-red-400/50" : ""
          }`}
        >
          <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 flex items-center gap-1.5">
            {selectedDate ? (
              <>
                <button
                  type="button"
                  onClick={handleDateClick}
                  className="text-foreground hover:text-primary transition-colors font-medium"
                >
                  {formatDate(selectedDate)}
                </button>
                <span className="text-muted-foreground">,</span>
                <button
                  ref={timeButtonRef}
                  type="button"
                  onClick={handleTimeClick}
                  className="text-foreground hover:text-primary transition-colors font-medium"
                >
                  {formatTime(selectedDate)}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleDateClick}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {placeholder}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Portal dropdown */}
      {mounted && createPortal(dropdown, document.body)}
    </>
  );
}
