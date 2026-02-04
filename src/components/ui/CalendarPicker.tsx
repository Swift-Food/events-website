"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarPickerProps {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
  minDate?: Date;
}

// Monday-first week
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function CalendarPicker({ selectedDate, onSelect, minDate }: CalendarPickerProps) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(selectedDate || today);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();

  // Get day of week, adjusted for Monday start (0 = Monday, 6 = Sunday)
  const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

  // Get previous month's last days
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  // Get number of days to show from next month
  const totalCells = Math.ceil((startingDayOfWeek + daysInMonth) / 7) * 7;
  const nextMonthDays = totalCells - (startingDayOfWeek + daysInMonth);

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const isDateDisabled = (date: Date) => {
    if (!minDate) return false;
    const min = new Date(minDate);
    min.setHours(0, 0, 0, 0);
    const check = new Date(date);
    check.setHours(0, 0, 0, 0);
    return check < min;
  };

  const isSelectedDate = (day: number, monthOffset: number = 0) => {
    if (!selectedDate) return false;
    const checkMonth = month + monthOffset;
    const checkYear = monthOffset === -1 && month === 0 ? year - 1 :
                      monthOffset === 1 && month === 11 ? year + 1 : year;
    const adjustedMonth = monthOffset === -1 && month === 0 ? 11 :
                          monthOffset === 1 && month === 11 ? 0 : checkMonth;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === adjustedMonth &&
      selectedDate.getFullYear() === checkYear
    );
  };

  const isToday = (day: number, monthOffset: number = 0) => {
    const checkMonth = month + monthOffset;
    const checkYear = monthOffset === -1 && month === 0 ? year - 1 :
                      monthOffset === 1 && month === 11 ? year + 1 : year;
    const adjustedMonth = monthOffset === -1 && month === 0 ? 11 :
                          monthOffset === 1 && month === 11 ? 0 : checkMonth;
    return (
      today.getDate() === day &&
      today.getMonth() === adjustedMonth &&
      today.getFullYear() === checkYear
    );
  };

  const handleDateClick = (day: number, monthOffset: number = 0) => {
    let newYear = year;
    let newMonth = month + monthOffset;

    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }

    const newDate = new Date(newYear, newMonth, day);
    if (isDateDisabled(newDate)) return;

    // Preserve time from selected date if it exists
    if (selectedDate) {
      newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
    }
    onSelect(newDate);
  };

  // Build calendar grid with previous, current, and next month days
  type DayCell = { day: number; monthOffset: number };
  const days: DayCell[] = [];

  // Previous month days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    days.push({ day: prevMonthLastDay - i, monthOffset: -1 });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, monthOffset: 0 });
  }

  // Next month days
  for (let i = 1; i <= nextMonthDays; i++) {
    days.push({ day: i, monthOffset: 1 });
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-base font-semibold text-white">
          {MONTHS[month]}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-white/60" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((day, index) => (
          <div
            key={`${day}-${index}`}
            className={`h-8 flex items-center justify-center text-sm font-medium ${
              index >= 5 ? "text-white/40" : "text-white/60"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((cell, index) => {
          const { day, monthOffset } = cell;
          const isOtherMonth = monthOffset !== 0;

          let dateToCheck: Date;
          if (monthOffset === -1) {
            dateToCheck = new Date(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1, day);
          } else if (monthOffset === 1) {
            dateToCheck = new Date(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1, day);
          } else {
            dateToCheck = new Date(year, month, day);
          }

          const disabled = isDateDisabled(dateToCheck);
          const selected = isSelectedDate(day, monthOffset);
          const todayDate = isToday(day, monthOffset);
          const isWeekend = index % 7 >= 5;

          return (
            <button
              key={`${monthOffset}-${day}`}
              type="button"
              onClick={() => handleDateClick(day, monthOffset)}
              disabled={disabled}
              className={`
                h-9 w-9 rounded-lg text-sm font-medium transition-all
                flex items-center justify-center
                ${disabled ? "text-white/20 cursor-not-allowed" : "cursor-pointer"}
                ${selected ? "bg-accent-dark text-white" : ""}
                ${!selected && isOtherMonth ? "text-white/30 hover:bg-white/5" : ""}
                ${!selected && !isOtherMonth && !disabled ? (isWeekend ? "text-white/50 hover:bg-white/10" : "text-white hover:bg-white/10") : ""}
                ${todayDate && !selected ? "ring-1 ring-white/30" : ""}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
