/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState } from "react";

type Timezone = {
  label: string;
  value: string;
};

const timezones: Timezone[] = [
  { label: "GMT+00:00 London", value: "Europe/London" },
  { label: "GMT-05:00 New York", value: "America/New_York" },
  { label: "GMT+01:00 Berlin", value: "Europe/Berlin" },
  { label: "GMT+08:00 Singapore", value: "Asia/Singapore" },
];

export default function EventCreationPage() {
  const [eventName, setEventName] = useState("");
  const [start, setStart] = useState("2025-11-20T15:00");
  const [end, setEnd] = useState("2025-11-20T16:00");
  const [timezone, setTimezone] = useState<Timezone>(timezones[0]);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState(
    ",kasdla asdlkjasdlkasd kaSlkdasd kj"
  );
  const [tickets, setTickets] = useState<"free" | "paid">("free");
  const [ticketPrice, setTicketPrice] = useState("25");
  const [requireApproval, setRequireApproval] = useState(false);
  const [capacity, setCapacity] = useState("Unlimited");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverName, setCoverName] = useState("invite-cover.png");

  const formatDate = (value: string) => {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }).format(new Date(value));
    } catch {
      return "Select date";
    }
  };

  const formattedStart = useMemo(() => formatDate(start), [start]);
  const formattedEnd = useMemo(() => formatDate(end), [end]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectURL = URL.createObjectURL(file);
    setCoverPreview(objectURL);
    setCoverName(file.name);
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-background px-6 py-12">
      <div className="flex w-full max-w-5xl flex-col gap-8 rounded-3xl bg-[#2a2a2d] p-8 text-white shadow-2xl lg:flex-row">
        <section className="flex flex-col gap-4 rounded-2xl bg-[#1f1f21] p-6 lg:w-80 lg:shrink-0">
          <div className="relative aspect-3/4 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#111]">
            {coverPreview ? (
              <img
                src={coverPreview}
                alt="Event cover"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#f9f8f6] text-black">
                <span className="text-3xl font-serif">You Are Invited</span>
                <span className="text-sm text-black/60">
                  Upload a cover image
                </span>
              </div>
            )}
            <label
              htmlFor="cover-upload"
              className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-black shadow-lg transition hover:bg-white"
            >
              Change cover
            </label>
            <input
              id="cover-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleImageChange}
            />
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#131315] p-4 text-sm">
            <div className="flex items-center justify-between text-white/70">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/40">
                  Starts
                </p>
                <p className="text-base text-white">{formattedStart}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-white/40">
                  Ends
                </p>
                <p className="text-base text-white">{formattedEnd}</p>
              </div>
            </div>
            <div className="mt-3 text-xs text-white/50">{timezone.label}</div>
            <div className="mt-4 text-xs text-white/60">
              Cover: <span className="text-white">{coverName}</span>
            </div>
          </div>
        </section>

        <section className="flex-1 space-y-6">
          <div className="space-y-1">
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Event Name"
              className="w-full bg-transparent text-4xl font-semibold text-white outline-none placeholder:text-white/30"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#1f1f21] p-4">
              <label className="text-sm text-white/50">Start</label>
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="mt-2 w-full rounded-xl bg-white/5 px-3 py-2 text-white outline-none"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#1f1f21] p-4">
              <label className="text-sm text-white/50">End</label>
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="mt-2 w-full rounded-xl bg-white/5 px-3 py-2 text-white outline-none"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#1f1f21] p-4">
            <label className="text-sm text-white/50">Timezone</label>
            <select
              value={timezone.value}
              onChange={(e) =>
                setTimezone(
                  timezones.find((tz) => tz.value === e.target.value) ||
                    timezones[0]
                )
              }
              className="mt-2 w-full rounded-xl bg-white/5 px-3 py-2 text-white outline-none"
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value} className="text-black">
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#1f1f21] p-4">
            <label className="text-sm text-white/50">Add Event Location</label>
            <input
              type="text"
              placeholder="Offline location or virtual link"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-2 w-full rounded-xl bg-white/5 px-3 py-2 text-white outline-none"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#1f1f21] p-4">
            <label className="text-sm text-white/50">Event Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2 w-full rounded-xl bg-white/5 px-3 py-2 text-white outline-none"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#1f1f21] p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Tickets</p>
                <p className="text-xs text-white/50">
                  {tickets === "free" ? "Free" : `$${ticketPrice}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTickets("free")}
                  className={`rounded-full px-4 py-2 text-sm ${
                    tickets === "free"
                      ? "bg-white text-black"
                      : "bg-white/10 text-white/70"
                  }`}
                >
                  Free
                </button>
                <button
                  type="button"
                  onClick={() => setTickets("paid")}
                  className={`rounded-full px-4 py-2 text-sm ${
                    tickets === "paid"
                      ? "bg-white text-black"
                      : "bg-white/10 text-white/70"
                  }`}
                >
                  Paid
                </button>
              </div>
            </div>
            {tickets === "paid" && (
              <input
                type="number"
                min={1}
                value={ticketPrice}
                onChange={(e) => setTicketPrice(e.target.value)}
                className="w-full rounded-xl bg-white/5 px-3 py-2 text-white outline-none"
                placeholder="Ticket price"
              />
            )}
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div>
                <p className="text-sm font-medium">Require approval</p>
                <p className="text-xs text-white/50">
                  Attendees must be approved
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRequireApproval((prev) => !prev)}
                className={`h-6 w-12 rounded-full border border-transparent transition ${
                  requireApproval ? "bg-white" : "bg-white/10"
                }`}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-black transition ${
                    requireApproval ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div>
                <p className="text-sm font-medium">Capacity</p>
                <p className="text-xs text-white/50">{capacity}</p>
              </div>
              <input
                type="text"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-40 rounded-xl bg-white/5 px-3 py-2 text-right text-white outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            className="w-full rounded-full bg-white py-4 text-center text-base font-semibold text-black transition hover:bg-white/80"
          >
            Create Event
          </button>
        </section>
      </div>
    </div>
  );
}
