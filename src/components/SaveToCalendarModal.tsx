"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Calendar, Loader2, Check, Plus, ChevronRight } from "lucide-react";
import { calendarService } from "@/services/calendar.service";
import { Calendar as CalendarType } from "@/types/calendar";
import { toast } from "sonner";
import Image from "next/image";

interface SaveToCalendarModalProps {
  eventId: string;
  eventName: string;
  onClose: () => void;
}

export default function SaveToCalendarModal({
  eventId,
  eventName,
  onClose,
}: SaveToCalendarModalProps) {
  const router = useRouter();
  const [calendars, setCalendars] = useState<CalendarType[]>([]);
  const [addedCalendarIds, setAddedCalendarIds] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [myCalendars, eventCalendars] = await Promise.all([
          calendarService.getMyCalendars(),
          calendarService.getCalendarsForEvent(eventId),
        ]);

        setCalendars(myCalendars);
        setAddedCalendarIds(new Set(eventCalendars.map((c) => c.id)));
      } catch (error) {
        console.error("Failed to fetch calendars:", error);
        toast.error("Failed to load calendars");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  const handleToggleCalendar = async (calendarId: string) => {
    const isAdded = addedCalendarIds.has(calendarId);
    setProcessingId(calendarId);

    try {
      if (isAdded) {
        await calendarService.removeEventFromCalendar(calendarId, eventId);
        setAddedCalendarIds((prev) => {
          const next = new Set(prev);
          next.delete(calendarId);
          return next;
        });
        toast.success("Event removed from calendar");
      } else {
        await calendarService.addEventToCalendar(calendarId, { eventId });
        setAddedCalendarIds((prev) => new Set(prev).add(calendarId));
        toast.success("Event added to calendar");
      }
    } catch (error: any) {
      console.error("Failed to update calendar:", error);
      if (error.response?.status === 403) {
        toast.error("You don't have permission to modify this calendar");
      } else {
        toast.error(
          error.response?.data?.message || "Failed to update calendar"
        );
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateCalendar = () => {
    onClose();
    router.push("/calendars/create");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card-background border border-white/10 shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-foreground">
              Save to Calendar
            </h2>
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {eventName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground ml-3 shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : calendars.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-foreground font-medium mb-1">
                No calendars yet
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Create a calendar to save events
              </p>
              <button
                onClick={handleCreateCalendar}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary/80"
              >
                <Plus className="h-4 w-4" />
                Create Calendar
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {calendars.map((calendar) => {
                const isAdded = addedCalendarIds.has(calendar.id);
                const isProcessing = processingId === calendar.id;

                return (
                  <button
                    key={calendar.id}
                    onClick={() => handleToggleCalendar(calendar.id)}
                    disabled={isProcessing}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isAdded
                        ? "border-primary/50 bg-primary/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {/* Calendar Image/Color */}
                    <div
                      className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg"
                      style={{
                        backgroundColor: calendar.calendarColor || "#6366f1",
                      }}
                    >
                      {calendar.calendarImage ? (
                        <Image
                          src={calendar.calendarImage}
                          alt={calendar.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Calendar className="h-5 w-5 text-white/50" />
                        </div>
                      )}
                    </div>

                    {/* Calendar Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-medium text-foreground truncate">
                        {calendar.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {calendar.subscriberCount || 0} subscribers
                      </p>
                    </div>

                    {/* Status */}
                    <div className="shrink-0">
                      {isProcessing ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      ) : isAdded ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20">
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Create new calendar option */}
              <button
                onClick={handleCreateCalendar}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-white/20 bg-transparent hover:bg-white/5 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20">
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">
                    Create new calendar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Organize your saved events
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-white/5 px-4 py-2.5 font-medium text-foreground transition-colors hover:bg-white/10"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
