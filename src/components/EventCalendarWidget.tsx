"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface EventCalendarWidgetProps {
  /** Dates that have events (will be normalized to date-only for comparison) */
  eventDates: Date[];
  /** Currently selected date for filtering, or null */
  selectedDate: Date | null;
  /** Called when a date is clicked */
  onDateSelect: (date: Date | null) => void;
}

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function EventCalendarWidget({
  eventDates,
  selectedDate,
  onDateSelect,
}: EventCalendarWidgetProps) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(selectedDate || today);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Build a set of date keys that have events for fast lookup
  const eventDateSet = useMemo(() => {
    const set = new Set<string>();
    for (const d of eventDates) {
      const date = new Date(d);
      set.add(toDateKey(date));
    }
    return set;
  }, [eventDates]);

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();

  // Monday-first (0 = Monday, 6 = Sunday)
  const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const totalCells = Math.ceil((startingDayOfWeek + daysInMonth) / 7) * 7;
  const nextMonthDays = totalCells - (startingDayOfWeek + daysInMonth);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const getDateForCell = (day: number, monthOffset: number): Date => {
    let m = month + monthOffset;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    else if (m > 11) { m = 0; y += 1; }
    return new Date(y, m, day);
  };

  const isSelected = (day: number, monthOffset: number) => {
    if (!selectedDate) return false;
    const d = getDateForCell(day, monthOffset);
    return toDateKey(d) === toDateKey(selectedDate);
  };

  const isToday = (day: number, monthOffset: number) => {
    const d = getDateForCell(day, monthOffset);
    return toDateKey(d) === toDateKey(today);
  };

  const hasEvent = (day: number, monthOffset: number) => {
    const d = getDateForCell(day, monthOffset);
    return eventDateSet.has(toDateKey(d));
  };

  const handleClick = (day: number, monthOffset: number) => {
    const d = getDateForCell(day, monthOffset);
    // Toggle off if clicking the already-selected date
    if (selectedDate && toDateKey(d) === toDateKey(selectedDate)) {
      onDateSelect(null);
    } else {
      onDateSelect(d);
    }

    // Navigate to month if clicking a date from another month
    if (monthOffset !== 0) {
      setViewDate(d);
    }
  };

  // Build grid cells
  type DayCell = { day: number; monthOffset: number };
  const days: DayCell[] = [];
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    days.push({ day: prevMonthLastDay - i, monthOffset: -1 });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, monthOffset: 0 });
  }
  for (let i = 1; i <= nextMonthDays; i++) {
    days.push({ day: i, monthOffset: 1 });
  }

  return (
    <div className="rounded-xl border border-white/10 bg-card-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span className="text-sm font-semibold text-foreground">
          {MONTHS[month]} {year}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 px-3">
        {DAYS.map((day, index) => (
          <div
            key={`${day}-${index}`}
            className={`h-7 flex items-center justify-center text-xs font-medium ${
              index >= 5 ? "text-muted-foreground/60" : "text-muted-foreground"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5 px-3 pb-3">
        {days.map((cell, index) => {
          const { day, monthOffset } = cell;
          const isOtherMonth = monthOffset !== 0;
          const selected = isSelected(day, monthOffset);
          const todayDate = isToday(day, monthOffset);
          const eventDay = hasEvent(day, monthOffset);

          return (
            <button
              key={`${monthOffset}-${day}`}
              type="button"
              onClick={() => handleClick(day, monthOffset)}
              className={`
                relative h-8 w-full rounded-md text-xs font-medium transition-all
                flex items-center justify-center cursor-pointer
                ${selected
                  ? "bg-primary text-white"
                  : isOtherMonth
                    ? "text-muted-foreground/40 hover:bg-white/5"
                    : "text-foreground hover:bg-white/10"
                }
                ${todayDate && !selected ? "ring-1 ring-primary/50" : ""}
              `}
            >
              {day}
              {/* Event dot indicator */}
              {eventDay && !selected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
              )}
              {eventDay && selected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-white" />
              )}
            </button>
          );
        })}
      </div>

      {/* Active filter indicator */}
      {selectedDate && (
        <div className="border-t border-white/10 px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Showing events on{" "}
            <span className="text-foreground font-medium">
              {selectedDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: selectedDate.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
              })}
            </span>
          </span>
          <button
            type="button"
            onClick={() => onDateSelect(null)}
            className="p-1 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
