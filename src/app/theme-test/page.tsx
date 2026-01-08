"use client";

import { useState } from "react";
import {
  Calendar,
  CalendarPlus,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  User,
  ChevronUp,
  ChevronDown,
  Palette,
  RotateCcw,
} from "lucide-react";

// Types for theme settings
interface ThemeSettings {
  pageBackground: string;
  cardBackground: string;
  mainTextColor: string;
  subTextColor: string;
  borderColor: string;
  borderEnabled: boolean;
  primaryColor: string;
}

const defaultTheme: ThemeSettings = {
  pageBackground: "rgba(34, 34, 34, 1)",
  cardBackground: "rgba(42, 42, 42, 1)",
  mainTextColor: "rgba(237, 237, 237, 1)",
  subTextColor: "rgba(153, 153, 153, 1)",
  borderColor: "rgba(64, 64, 64, 1)",
  borderEnabled: true,
  primaryColor: "rgba(59, 130, 246, 1)",
};

// Helper to parse any color format to RGBA components
function parseColor(color: string): { r: number; g: number; b: number; a: number } {
  // Handle rgba format
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]),
      g: parseInt(rgbaMatch[2]),
      b: parseInt(rgbaMatch[3]),
      a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1,
    };
  }
  // Handle hex format
  const hex = color.replace("#", "");
  if (hex.length >= 6) {
    return {
      r: parseInt(hex.substring(0, 2), 16) || 0,
      g: parseInt(hex.substring(2, 4), 16) || 0,
      b: parseInt(hex.substring(4, 6), 16) || 0,
      a: 1,
    };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}

// Helper to convert RGBA components to hex
function rgbaToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// Color input component with RGBA support
function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { r, g, b, a } = parseColor(value);
  const hexColor = rgbaToHex(r, g, b);

  const handleColorPickerChange = (hex: string) => {
    const parsed = parseColor(hex);
    onChange(`rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${a})`);
  };

  const handleHexInputChange = (inputHex: string) => {
    const cleanHex = inputHex.startsWith("#") ? inputHex : `#${inputHex}`;
    if (cleanHex.length === 7) {
      const parsed = parseColor(cleanHex);
      onChange(`rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${a})`);
    }
  };

  const handleAlphaChange = (newAlpha: number) => {
    onChange(`rgba(${r}, ${g}, ${b}, ${newAlpha})`);
  };

  return (
    <div className="space-y-1">
      {label && <label className="block text-xs font-medium text-white/70">{label}</label>}
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={hexColor}
          onChange={(e) => handleColorPickerChange(e.target.value)}
          className="h-6 w-8 cursor-pointer rounded border border-white/20 bg-transparent"
        />
        <input
          type="text"
          defaultValue={hexColor}
          key={hexColor}
          onBlur={(e) => handleHexInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleHexInputChange(e.currentTarget.value);
            }
          }}
          className="w-[70px] rounded border border-white/20 bg-white/5 px-1.5 py-0.5 text-[10px] text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none font-mono"
          placeholder="#000000"
        />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={a}
          onChange={(e) => handleAlphaChange(parseFloat(e.target.value))}
          className="w-12 accent-blue-500"
        />
        <span className="w-7 text-[10px] text-white/50 text-right">{Math.round(a * 100)}%</span>
      </div>
    </div>
  );
}

// Mock event data
const mockEvent = {
  name: "Summer Music Festival 2025",
  eventImage: null,
  eventColor: "#8b5cf6",
  startDateTime: new Date("2025-07-15T18:00:00"),
  endDateTime: new Date("2025-07-15T23:00:00"),
  description: `<h2>Join us for an unforgettable night!</h2>
    <p>Experience the best live music performances under the summer sky. This year's festival features amazing artists from around the world.</p>
    <h3>What to expect:</h3>
    <ul>
      <li>Live performances from top artists</li>
      <li>Food trucks and refreshments</li>
      <li>VIP lounge access for premium tickets</li>
      <li>Meet and greet opportunities</li>
    </ul>
    <p>Don't miss out on this incredible event!</p>`,
  categories: [
    { id: "1", name: "Music" },
    { id: "2", name: "Festival" },
  ],
  subcategories: [{ id: "3", name: "Live Performance", categoryId: "1" }],
  address: {
    name: "Central Park Amphitheater",
    addressLine1: "123 Park Avenue",
    city: "New York",
    zipcode: "10001",
    isObscured: false,
    location: { latitude: 40.7829, longitude: -73.9654 },
  },
  owner: {
    id: "owner-1",
    firstName: "John",
    lastName: "Smith",
    user: {
      id: "user-1",
      username: "johnsmith",
      profilePicture: null,
    },
  },
  attendeesCount: 1247,
  viewCount: 8934,
  eventTickets: [
    {
      id: "ticket-1",
      name: "General Admission",
      price: 49.99,
      quantityLeft: 250,
      isAvailable: true,
    },
    {
      id: "ticket-2",
      name: "VIP Experience",
      price: 149.99,
      quantityLeft: 45,
      isAvailable: true,
    },
    {
      id: "ticket-3",
      name: "Early Bird Special",
      price: 29.99,
      quantityLeft: 0,
      isAvailable: true,
    },
  ],
  isPrivate: false,
  format: "IN_PERSON",
};

export default function ThemeTestPage() {
  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);
  const [isEditorOpen, setIsEditorOpen] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const updateTheme = (key: keyof ThemeSettings, value: string | boolean) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const borderStyle = theme.borderEnabled
    ? `1px solid ${theme.borderColor}`
    : "none";

  // Parse primary color for creating tinted backgrounds
  const primaryParsed = parseColor(theme.primaryColor);
  const primaryWithAlpha = (alpha: number) =>
    `rgba(${primaryParsed.r}, ${primaryParsed.g}, ${primaryParsed.b}, ${alpha})`;

  const mainTextParsed = parseColor(theme.mainTextColor);
  const mainTextWithAlpha = (alpha: number) =>
    `rgba(${mainTextParsed.r}, ${mainTextParsed.g}, ${mainTextParsed.b}, ${alpha})`;

  return (
    <div
      className="min-h-screen pb-32 transition-colors duration-200"
      style={{ backgroundColor: theme.pageBackground }}
    >
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Back Button */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            className="flex items-center gap-2 transition-colors hover:opacity-80"
            style={{ color: theme.subTextColor }}
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Events
          </button>
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm"
            style={{
              backgroundColor: primaryWithAlpha(0.2),
              color: theme.primaryColor,
              border: `1px solid ${primaryWithAlpha(0.4)}`,
            }}
          >
            <Palette className="h-4 w-4" />
            Theme Preview Mode
          </div>
        </div>

        {/* Main Content - Responsive Layout */}
        <div className="flex flex-col gap-6 lg:flex-row-reverse">
          {/* Left Column - Image and Sidebar */}
          <section className="flex flex-col gap-6 lg:w-96 lg:shrink-0">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:flex lg:flex-col">
              {/* Image */}
              <div
                className="relative aspect-square w-full overflow-hidden rounded-2xl"
                style={{
                  backgroundColor: theme.cardBackground,
                  border: borderStyle,
                }}
              >
                <div
                  className="flex h-full items-center justify-center"
                  style={{ backgroundColor: mockEvent.eventColor }}
                >
                  <Calendar className="h-24 w-24 text-white/30" />
                </div>
              </div>

              {/* Title on mobile/tablet */}
              <div className="block lg:hidden sm:col-span-1 sm:row-span-1 sm:flex sm:flex-col sm:items-center sm:justify-center">
                <h1
                  className="mb-4 text-2xl sm:text-3xl font-bold tracking-tight sm:text-center"
                  style={{ color: theme.mainTextColor }}
                >
                  {mockEvent.name}
                </h1>
                <div className="flex flex-wrap gap-2 sm:justify-center">
                  {mockEvent.categories.map((category) => (
                    <span
                      key={category.id}
                      className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: mainTextWithAlpha(0.1),
                        color: theme.mainTextColor,
                        border: `1px solid ${mainTextWithAlpha(0.2)}`,
                      }}
                    >
                      {category.name}
                    </span>
                  ))}
                  {mockEvent.subcategories.map((subcategory) => (
                    <span
                      key={subcategory.id}
                      className="rounded-full px-4 py-1.5 text-sm font-medium"
                      style={{
                        backgroundColor: primaryWithAlpha(0.15),
                        color: theme.primaryColor,
                        border: `1px solid ${primaryWithAlpha(0.3)}`,
                      }}
                    >
                      {subcategory.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Date & Time Card */}
              <div
                className="rounded-xl p-4 sm:p-6"
                style={{
                  backgroundColor: theme.cardBackground,
                  border: borderStyle,
                }}
              >
                <h3
                  className="mb-4 text-lg font-semibold"
                  style={{ color: theme.mainTextColor }}
                >
                  Date & Time
                </h3>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center py-1">
                    <div
                      className="h-3 w-3 rounded-full shadow-lg"
                      style={{
                        backgroundColor: theme.primaryColor,
                        boxShadow: `0 0 10px ${primaryWithAlpha(0.5)}`,
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <p
                      className="font-medium"
                      style={{ color: theme.mainTextColor }}
                    >
                      {formatDate(mockEvent.startDateTime)}
                    </p>
                    <p className="text-sm" style={{ color: theme.subTextColor }}>
                      {formatTime(mockEvent.startDateTime)} -{" "}
                      {formatTime(mockEvent.endDateTime)}
                    </p>
                  </div>
                </div>

                <div className="relative mt-4">
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: mainTextWithAlpha(0.08),
                      color: theme.mainTextColor,
                    }}
                  >
                    <CalendarPlus className="h-4 w-4" />
                    Add to Calendar
                  </button>
                </div>
              </div>

              {/* Location Card */}
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  backgroundColor: theme.cardBackground,
                  border: borderStyle,
                }}
              >
                <div
                  className="h-40 w-full flex flex-col items-center justify-center gap-2"
                  style={{ backgroundColor: theme.cardBackground }}
                >
                  <MapPin
                    className="h-5 w-5"
                    style={{ color: theme.subTextColor }}
                  />
                  <span className="text-sm" style={{ color: theme.subTextColor }}>
                    Map Preview
                  </span>
                </div>
                <div className="p-4">
                  <h3
                    className="font-semibold mb-1"
                    style={{ color: theme.mainTextColor }}
                  >
                    {mockEvent.address.name}
                  </h3>
                  <p className="text-sm" style={{ color: theme.subTextColor }}>
                    {mockEvent.address.addressLine1}, {mockEvent.address.city},{" "}
                    {mockEvent.address.zipcode}
                  </p>
                </div>
              </div>
            </div>

            {/* Organizer & Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
              {/* Organizer Card */}
              <div
                className="rounded-xl p-4 sm:p-6"
                style={{
                  backgroundColor: theme.cardBackground,
                  border: borderStyle,
                }}
              >
                <h3
                  className="mb-4 text-lg font-semibold"
                  style={{ color: theme.mainTextColor }}
                >
                  Organized by
                </h3>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: primaryWithAlpha(0.2) }}
                  >
                    <User className="h-6 w-6" style={{ color: theme.primaryColor }} />
                  </div>
                  <div>
                    <p
                      className="font-medium"
                      style={{ color: theme.mainTextColor }}
                    >
                      {mockEvent.owner.firstName} {mockEvent.owner.lastName}
                    </p>
                    <p className="text-sm" style={{ color: theme.subTextColor }}>
                      Organizer
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              <div
                className="rounded-xl p-4 sm:p-6"
                style={{
                  backgroundColor: theme.cardBackground,
                  border: borderStyle,
                }}
              >
                <h3
                  className="mb-4 text-lg font-semibold"
                  style={{ color: theme.mainTextColor }}
                >
                  Event Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-2"
                      style={{ color: theme.subTextColor }}
                    >
                      <Users className="h-5 w-5" />
                      <span>Attendees</span>
                    </div>
                    <span
                      className="font-semibold"
                      style={{ color: theme.mainTextColor }}
                    >
                      {mockEvent.attendeesCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-2"
                      style={{ color: theme.subTextColor }}
                    >
                      <Clock className="h-5 w-5" />
                      <span>Views</span>
                    </div>
                    <span
                      className="font-semibold"
                      style={{ color: theme.mainTextColor }}
                    >
                      {mockEvent.viewCount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Right Column - Main Content */}
          <section className="flex-1 space-y-6">
            {/* Title - Desktop only */}
            <div className="hidden lg:block">
              <h1
                className="mb-4 text-3xl md:text-5xl font-bold tracking-tight"
                style={{ color: theme.mainTextColor }}
              >
                {mockEvent.name}
              </h1>
              <div className="flex flex-wrap gap-2">
                {mockEvent.categories.map((category) => (
                  <span
                    key={category.id}
                    className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: mainTextWithAlpha(0.1),
                      color: theme.mainTextColor,
                      border: `1px solid ${mainTextWithAlpha(0.2)}`,
                    }}
                  >
                    {category.name}
                  </span>
                ))}
                {mockEvent.subcategories.map((subcategory) => (
                  <span
                    key={subcategory.id}
                    className="rounded-full px-4 py-1.5 text-sm font-medium"
                    style={{
                      backgroundColor: primaryWithAlpha(0.15),
                      color: theme.primaryColor,
                      border: `1px solid ${primaryWithAlpha(0.3)}`,
                    }}
                  >
                    {subcategory.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Tickets Section */}
            <div
              className="rounded-xl backdrop-blur-xl p-4 sm:p-6"
              style={{
                backgroundColor: theme.cardBackground,
                border: borderStyle,
              }}
            >
              <h2
                className="text-2xl font-semibold mb-4"
                style={{ color: theme.mainTextColor }}
              >
                Tickets
              </h2>
              <div className="space-y-2 sm:space-y-3">
                {mockEvent.eventTickets.map((ticket) => {
                  const isSoldOut = ticket.quantityLeft <= 0;
                  const isSelected = selectedTicketId === ticket.id;

                  return (
                    <div
                      key={ticket.id}
                      onClick={() => !isSoldOut && setSelectedTicketId(ticket.id)}
                      className={`flex items-center justify-between gap-2 sm:gap-4 rounded-xl p-3 sm:p-4 transition-all ${
                        isSoldOut ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                      }`}
                      style={{
                        backgroundColor: isSelected
                          ? primaryWithAlpha(0.15)
                          : mainTextWithAlpha(0.05),
                        border: isSelected
                          ? `2px solid ${theme.primaryColor}`
                          : `1px solid ${mainTextWithAlpha(0.15)}`,
                      }}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        {!isSoldOut && (
                          <div
                            className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                            style={{
                              borderColor: isSelected
                                ? theme.primaryColor
                                : mainTextWithAlpha(0.4),
                            }}
                          >
                            {isSelected && (
                              <div
                                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full"
                                style={{ backgroundColor: theme.primaryColor }}
                              />
                            )}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3
                            className="text-sm sm:text-base font-semibold break-words"
                            style={{ color: theme.mainTextColor }}
                          >
                            {ticket.name}
                          </h3>
                          <p
                            className="text-xs sm:text-sm"
                            style={{
                              color: isSoldOut
                                ? "#f59e0b"
                                : theme.subTextColor,
                            }}
                          >
                            {isSoldOut
                              ? "Sold out - Join waitlist"
                              : `${ticket.quantityLeft} left`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className="text-base sm:text-xl font-bold"
                          style={{ color: theme.mainTextColor }}
                        >
                          {Number(ticket.price) === 0
                            ? "Free"
                            : `£${Number(ticket.price).toFixed(2)}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                disabled={!selectedTicketId}
                className="w-full mt-4 rounded-xl px-6 py-2 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: theme.primaryColor }}
              >
                {selectedTicketId ? "Register" : "Select a ticket"}
              </button>
            </div>

            {/* Description */}
            <div className="py-6">
              <h2
                className="mb-4 text-lg font-semibold"
                style={{ color: theme.subTextColor }}
              >
                About this event
              </h2>
              <div
                className="prose prose-invert max-w-none"
                style={
                  {
                    "--tw-prose-body": theme.mainTextColor,
                    "--tw-prose-headings": theme.mainTextColor,
                    "--tw-prose-lead": theme.subTextColor,
                    "--tw-prose-links": theme.primaryColor,
                    "--tw-prose-bold": theme.mainTextColor,
                    "--tw-prose-counters": theme.subTextColor,
                    "--tw-prose-bullets": theme.subTextColor,
                    "--tw-prose-hr": theme.borderColor,
                    "--tw-prose-quotes": theme.mainTextColor,
                    "--tw-prose-quote-borders": theme.primaryColor,
                    "--tw-prose-captions": theme.subTextColor,
                    "--tw-prose-code": theme.mainTextColor,
                    "--tw-prose-pre-code": theme.mainTextColor,
                    "--tw-prose-pre-bg": theme.cardBackground,
                    "--tw-prose-th-borders": theme.borderColor,
                    "--tw-prose-td-borders": theme.borderColor,
                  } as React.CSSProperties
                }
                dangerouslySetInnerHTML={{ __html: mockEvent.description }}
              />
            </div>
          </section>
        </div>
      </div>

      {/* Theme Editor Modal - Fixed at bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300"
        style={{
          transform: isEditorOpen ? "translateY(0)" : "translateY(calc(100% - 36px))",
        }}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsEditorOpen(!isEditorOpen)}
          className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-xs font-medium text-white/90 backdrop-blur-xl"
          style={{ backgroundColor: "rgba(20, 20, 20, 0.8)" }}
        >
          <Palette className="h-3 w-3" />
          Theme
          {isEditorOpen ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronUp className="h-3 w-3" />
          )}
        </button>

        {/* Editor Panel */}
        <div
          className="rounded-t-xl shadow-2xl max-h-[40vh] overflow-y-auto backdrop-blur-xl"
          style={{
            backgroundColor: "rgba(15, 15, 15, 0.85)",
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div className="p-4">
            {/* Header with Reset */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white/90">
                Theme Settings
              </h3>
              <button
                onClick={resetTheme}
                className="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            </div>

            {/* Color Controls Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <ColorInput
                label="Page Background"
                value={theme.pageBackground}
                onChange={(v) => updateTheme("pageBackground", v)}
              />

              <ColorInput
                label="Card Background"
                value={theme.cardBackground}
                onChange={(v) => updateTheme("cardBackground", v)}
              />

              <ColorInput
                label="Main Text"
                value={theme.mainTextColor}
                onChange={(v) => updateTheme("mainTextColor", v)}
              />

              <ColorInput
                label="Sub Text"
                value={theme.subTextColor}
                onChange={(v) => updateTheme("subTextColor", v)}
              />

              <ColorInput
                label="Primary/Accent"
                value={theme.primaryColor}
                onChange={(v) => updateTheme("primaryColor", v)}
              />

              <div className="space-y-1">
                <label className="block text-xs font-medium text-white/70">Border</label>
                <div className="flex items-center gap-1.5">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={theme.borderEnabled}
                      onChange={(e) => updateTheme("borderEnabled", e.target.checked)}
                      className="h-3 w-3 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <span className="text-[10px] text-white/50">On</span>
                  </label>
                  {theme.borderEnabled && (
                    <>
                      <input
                        type="color"
                        value={theme.borderColor.startsWith("rgba") ? rgbaToHex(...Object.values(parseColor(theme.borderColor)).slice(0, 3) as [number, number, number]) : theme.borderColor}
                        onChange={(e) => {
                          const parsed = parseColor(e.target.value);
                          const currentAlpha = parseColor(theme.borderColor).a;
                          updateTheme("borderColor", `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${currentAlpha})`);
                        }}
                        className="h-5 w-7 cursor-pointer rounded border border-white/20 bg-transparent"
                      />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={parseColor(theme.borderColor).a}
                        onChange={(e) => {
                          const { r, g, b } = parseColor(theme.borderColor);
                          updateTheme("borderColor", `rgba(${r}, ${g}, ${b}, ${parseFloat(e.target.value)})`);
                        }}
                        className="w-10 accent-blue-500"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
