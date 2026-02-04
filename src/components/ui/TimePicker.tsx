"use client";

import { useRef, useEffect } from "react";

interface TimePickerProps {
  selectedTime: { hour: number; minute: number } | null;
  onSelect: (hour: number, minute: number) => void;
}

export default function TimePicker({ selectedTime, onSelect }: TimePickerProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Generate times in 30-minute increments (00:00, 00:30, 01:00, etc.)
  const times: { hour: number; minute: number }[] = [];
  for (let h = 0; h < 24; h++) {
    times.push({ hour: h, minute: 0 });
    times.push({ hour: h, minute: 30 });
  }

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  };

  const isSelected = (hour: number, minute: number) => {
    if (!selectedTime) return false;
    // Round selected minute to nearest 30
    const roundedMinute = selectedTime.minute < 15 ? 0 : selectedTime.minute < 45 ? 30 : 0;
    const adjustedHour = selectedTime.minute >= 45 ? (selectedTime.hour + 1) % 24 : selectedTime.hour;
    return adjustedHour === hour && roundedMinute === minute;
  };

  // Scroll to selected time on mount
  useEffect(() => {
    if (selectedTime && listRef.current) {
      const roundedMinute = selectedTime.minute < 15 ? 0 : selectedTime.minute < 45 ? 30 : 0;
      const adjustedHour = selectedTime.minute >= 45 ? (selectedTime.hour + 1) % 24 : selectedTime.hour;
      const element = listRef.current.querySelector(
        `[data-time="${adjustedHour}-${roundedMinute}"]`
      );
      if (element) {
        element.scrollIntoView({ block: "center", behavior: "instant" });
      }
    }
  }, []);

  const handleTimeClick = (hour: number, minute: number) => {
    onSelect(hour, minute);
  };

  return (
    <div className="py-2">
      <div
        ref={listRef}
        className="h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
      >
        <div className="px-1.5">
          {times.map(({ hour, minute }) => {
            const selected = isSelected(hour, minute);
            return (
              <button
                key={`${hour}-${minute}`}
                type="button"
                data-time={`${hour}-${minute}`}
                onClick={() => handleTimeClick(hour, minute)}
                className={`
                  w-full py-2 px-2 text-center text-sm font-medium transition-all rounded-md mb-0.5
                  ${selected
                    ? "bg-accent-dark text-white"
                    : "text-white hover:bg-white/10"
                  }
                `}
              >
                {formatTime(hour, minute)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
