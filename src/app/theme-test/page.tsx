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
  Ticket,
  ChartNoAxesGantt,
  Plus,
  Trash2,
  GripVertical,
  Repeat,
} from "lucide-react";

// Types for gradient settings
interface GradientStop {
  id: string;
  color: string;
  position: number; // 0-100 percentage
}

interface GradientSettings {
  enabled: boolean;
  type: "linear" | "radial";
  angle: number; // 0-360 degrees
  useKeyword: boolean; // use keyword direction instead of angle
  keyword: "to top" | "to right" | "to bottom" | "to left" | "to top right" | "to top left" | "to bottom right" | "to bottom left";
  repeating: boolean;
  stops: GradientStop[];
}

// Types for theme settings
interface ThemeSettings {
  pageBackground: string;
  pageBackgroundGradient: GradientSettings;
  cardBackground: string;
  cardSecondaryBackground: string;
  mainTextColor: string;
  subTextColor: string;
  borderColor: string;
  borderEnabled: boolean;
  primaryColor: string;
}

const defaultGradient: GradientSettings = {
  enabled: false,
  type: "linear",
  angle: 180,
  useKeyword: false,
  keyword: "to bottom",
  repeating: false,
  stops: [
    { id: "stop-1", color: "rgba(34, 34, 34, 1)", position: 0 },
    { id: "stop-2", color: "rgba(51, 51, 51, 1)", position: 100 },
  ],
};

const defaultTheme: ThemeSettings = {
  pageBackground: "rgba(34, 34, 34, 1)",
  pageBackgroundGradient: defaultGradient,
  cardBackground: "rgba(42, 42, 42, 1)",
  cardSecondaryBackground: "rgba(51, 51, 51, 1)",
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

// Helper to generate CSS gradient string
function generateGradientCSS(gradient: GradientSettings): string {
  if (!gradient.enabled || gradient.stops.length < 2) return "";

  const sortedStops = [...gradient.stops].sort((a, b) => a.position - b.position);
  const stopsCSS = sortedStops.map(stop => `${stop.color} ${stop.position}%`).join(", ");

  const direction = gradient.useKeyword ? gradient.keyword : `${gradient.angle}deg`;
  const prefix = gradient.repeating ? "repeating-" : "";

  return `${prefix}linear-gradient(${direction}, ${stopsCSS})`;
}

// Direction keywords for linear gradient
const directionKeywords = [
  { value: "to top", label: "To Top", angle: 0 },
  { value: "to top right", label: "To Top Right", angle: 45 },
  { value: "to right", label: "To Right", angle: 90 },
  { value: "to bottom right", label: "To Bottom Right", angle: 135 },
  { value: "to bottom", label: "To Bottom", angle: 180 },
  { value: "to bottom left", label: "To Bottom Left", angle: 225 },
  { value: "to left", label: "To Left", angle: 270 },
  { value: "to top left", label: "To Top Left", angle: 315 },
] as const;

// Gradient Editor Component
function GradientEditor({
  gradient,
  onChange,
}: {
  gradient: GradientSettings;
  onChange: (gradient: GradientSettings) => void;
}) {
  const [draggedStop, setDraggedStop] = useState<string | null>(null);

  const updateGradient = (updates: Partial<GradientSettings>) => {
    onChange({ ...gradient, ...updates });
  };

  const addStop = () => {
    const newId = `stop-${Date.now()}`;
    // Find a position between existing stops
    const positions = gradient.stops.map(s => s.position).sort((a, b) => a - b);
    let newPosition = 50;
    if (positions.length >= 2) {
      // Find the largest gap
      let maxGap = 0;
      let gapStart = 0;
      for (let i = 0; i < positions.length - 1; i++) {
        const gap = positions[i + 1] - positions[i];
        if (gap > maxGap) {
          maxGap = gap;
          gapStart = positions[i];
        }
      }
      newPosition = gapStart + maxGap / 2;
    }

    updateGradient({
      stops: [...gradient.stops, { id: newId, color: "rgba(128, 128, 128, 1)", position: newPosition }],
    });
  };

  const removeStop = (id: string) => {
    if (gradient.stops.length <= 2) return; // Need at least 2 stops
    updateGradient({
      stops: gradient.stops.filter(stop => stop.id !== id),
    });
  };

  const updateStop = (id: string, updates: Partial<GradientStop>) => {
    updateGradient({
      stops: gradient.stops.map(stop =>
        stop.id === id ? { ...stop, ...updates } : stop
      ),
    });
  };

  const moveStop = (fromIndex: number, toIndex: number) => {
    const newStops = [...gradient.stops];
    const [removed] = newStops.splice(fromIndex, 1);
    newStops.splice(toIndex, 0, removed);
    updateGradient({ stops: newStops });
  };

  const handleDragStart = (e: React.DragEvent, stopId: string) => {
    setDraggedStop(stopId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedStop || draggedStop === targetId) return;

    const fromIndex = gradient.stops.findIndex(s => s.id === draggedStop);
    const toIndex = gradient.stops.findIndex(s => s.id === targetId);

    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      moveStop(fromIndex, toIndex);
    }
  };

  const handleDragEnd = () => {
    setDraggedStop(null);
  };

  const sortedStops = [...gradient.stops].sort((a, b) => a.position - b.position);
  const previewGradient = generateGradientCSS({ ...gradient, enabled: true });

  return (
    <div className="space-y-3">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={gradient.enabled}
            onChange={(e) => updateGradient({ enabled: e.target.checked })}
            className="h-4 w-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
          />
          <span className="text-xs font-medium text-white/70">Enable Gradient</span>
        </label>
        {gradient.enabled && (
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={gradient.repeating}
              onChange={(e) => updateGradient({ repeating: e.target.checked })}
              className="h-3 w-3 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
            <Repeat className="h-3 w-3 text-white/50" />
            <span className="text-[10px] text-white/50">Repeating</span>
          </label>
        )}
      </div>

      {gradient.enabled && (
        <>
          {/* Gradient Preview */}
          <div
            className="h-8 w-full rounded-lg border border-white/20"
            style={{ background: previewGradient }}
          />

          {/* Direction Controls */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gradient.useKeyword}
                  onChange={(e) => updateGradient({ useKeyword: e.target.checked })}
                  className="h-3 w-3 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                />
                <span className="text-[10px] text-white/50">Use Preset Direction</span>
              </label>
            </div>

            {gradient.useKeyword ? (
              <select
                value={gradient.keyword}
                onChange={(e) => updateGradient({ keyword: e.target.value as GradientSettings["keyword"] })}
                className="w-full rounded border border-white/20 bg-white/5 px-2 py-1 text-xs text-white focus:border-white/40 focus:outline-none"
              >
                {directionKeywords.map(dir => (
                  <option key={dir.value} value={dir.value} className="bg-zinc-800">
                    {dir.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/50 w-10">Angle</span>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={gradient.angle}
                  onChange={(e) => updateGradient({ angle: parseInt(e.target.value) })}
                  className="flex-1 accent-blue-500"
                />
                <input
                  type="number"
                  min="0"
                  max="360"
                  value={gradient.angle}
                  onChange={(e) => updateGradient({ angle: parseInt(e.target.value) || 0 })}
                  className="w-14 rounded border border-white/20 bg-white/5 px-1.5 py-0.5 text-[10px] text-white text-center focus:border-white/40 focus:outline-none"
                />
                <span className="text-[10px] text-white/50">deg</span>
              </div>
            )}
          </div>

          {/* Color Stops */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-white/70">Color Stops</span>
              <button
                onClick={addStop}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {sortedStops.map((stop) => {
                const { r, g, b, a } = parseColor(stop.color);
                const hexColor = rgbaToHex(r, g, b);

                return (
                  <div
                    key={stop.id}
                    onDragOver={(e) => handleDragOver(e, stop.id)}
                    className={`flex items-center gap-1.5 rounded px-1.5 py-1 transition-colors ${
                      draggedStop === stop.id ? "bg-white/20" : "bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, stop.id)}
                      onDragEnd={handleDragEnd}
                      className="cursor-grab active:cursor-grabbing shrink-0 p-0.5 -m-0.5 hover:bg-white/10 rounded"
                    >
                      <GripVertical className="h-3 w-3 text-white/30" />
                    </div>

                    <input
                      type="color"
                      value={hexColor}
                      onChange={(e) => {
                        const parsed = parseColor(e.target.value);
                        updateStop(stop.id, {
                          color: `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${a})`,
                        });
                      }}
                      className="h-5 w-6 cursor-pointer rounded border border-white/20 bg-transparent shrink-0"
                    />

                    <input
                      type="text"
                      defaultValue={hexColor}
                      key={`${stop.id}-${hexColor}`}
                      onBlur={(e) => {
                        const cleanHex = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
                        if (cleanHex.length === 7) {
                          const parsed = parseColor(cleanHex);
                          updateStop(stop.id, {
                            color: `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${a})`,
                          });
                        }
                      }}
                      className="w-16 rounded border border-white/20 bg-white/5 px-1 py-0.5 text-[9px] text-white font-mono focus:border-white/40 focus:outline-none"
                    />

                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={stop.position}
                      onChange={(e) => updateStop(stop.id, { position: parseInt(e.target.value) })}
                      className="w-12 accent-blue-500"
                    />

                    <span className="w-7 text-[9px] text-white/50 text-right">{stop.position}%</span>

                    <button
                      onClick={() => removeStop(stop.id)}
                      disabled={gradient.stops.length <= 2}
                      className="p-0.5 text-white/30 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Mock event data
const mockEvent = {
  name: "Summer Music Festival 2025",
  eventImage: null,
  eventColor: "#8b5cf6",
  startDateTime: new Date("2025-07-15T18:00:00"),
  endDateTime: new Date("2025-07-17T23:00:00"), // Multi-day event
  description: `<h1>Summer Music Festival 2025</h1>
    <p>Experience the <strong>best live music performances</strong> under the summer sky. This year's festival features <em>amazing artists</em> from around the world.</p>

    <h2>Event Highlights</h2>
    <p>Join us for three days of non-stop entertainment. Whether you're a fan of <strong>rock, pop, or electronic music</strong>, we have something for everyone.</p>

    <h3>What's Included</h3>
    <ul>
      <li>Live performances from <strong>top international artists</strong></li>
      <li>Food trucks and <em>craft beverages</em></li>
      <li>VIP lounge access for premium tickets</li>
      <li>Meet and greet opportunities</li>
    </ul>

    <h3>Schedule Overview</h3>
    <ol>
      <li><strong>Day 1:</strong> Opening ceremony and indie bands</li>
      <li><strong>Day 2:</strong> Main stage headliners</li>
      <li><strong>Day 3:</strong> Closing party with special guests</li>
    </ol>

    <hr>

    <blockquote>This festival changed my life. The energy, the music, the people - absolutely incredible!</blockquote>

    <h3>Important Information</h3>
    <p>Please bring your ticket confirmation with code <code>SUMMER2025</code> to the entrance. For more details, visit our <a href="#">official website</a> or contact us at <a href="#">support@festival.com</a>.</p>

    <p><em>Note: This is a rain or shine event. No refunds will be issued for weather-related cancellations.</em></p>`,
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

  const updateTheme = (key: keyof ThemeSettings, value: string | boolean | GradientSettings) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  const updateGradient = (gradient: GradientSettings) => {
    setTheme((prev) => ({ ...prev, pageBackgroundGradient: gradient }));
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

  // Parse colors for creating tinted backgrounds
  const primaryParsed = parseColor(theme.primaryColor);
  const primaryWithAlpha = (alpha: number) =>
    `rgba(${primaryParsed.r}, ${primaryParsed.g}, ${primaryParsed.b}, ${alpha})`;

  const mainTextParsed = parseColor(theme.mainTextColor);
  const mainTextWithAlpha = (alpha: number) =>
    `rgba(${mainTextParsed.r}, ${mainTextParsed.g}, ${mainTextParsed.b}, ${alpha})`;

  const pageBgParsed = parseColor(theme.pageBackground);

  // Generate background style (gradient or solid color)
  const pageBackgroundStyle = theme.pageBackgroundGradient.enabled
    ? { background: generateGradientCSS(theme.pageBackgroundGradient) }
    : { backgroundColor: theme.pageBackground };

  return (
    <div
      className="min-h-screen pb-32 transition-colors duration-200"
      style={pageBackgroundStyle}
    >
      {/* Mock Navbar - matches real Navbar exactly */}
      <header
        className="sticky top-0 z-40 transition-colors duration-200"
        style={{
          backgroundColor: `rgb(${pageBgParsed.r}, ${pageBgParsed.g}, ${pageBgParsed.b})`,
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-lg font-semibold tracking-tight cursor-pointer hover:scale-105 transition-transform duration-200">
              <svg
                width="24"
                height="24"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ color: theme.mainTextColor }}
              >
                <path
                  d="M50 0L93.3 25V75L50 100L6.7 75V25L50 0Z"
                  fill="currentColor"
                />
              </svg>
              <span
                className="hidden sm:inline font-normal"
                style={{ color: theme.mainTextColor }}
              >
                PRISMO
              </span>
            </div>

            {/* Mobile Icon Navigation */}
            <nav className="flex gap-1 sm:hidden">
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:opacity-80"
                style={{ color: theme.mainTextColor }}
              >
                <Ticket className="h-5 w-5" />
              </button>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:opacity-80"
                style={{ color: theme.mainTextColor }}
              >
                <ChartNoAxesGantt className="h-5 w-5" />
              </button>
            </nav>

            {/* Desktop Navigation */}
            <nav className="ml-8 hidden gap-6 text-sm font-medium sm:flex">
              {["Discover", "Tickets", "Manage"].map((link) => (
                <span
                  key={link}
                  className="cursor-pointer transition-colors hover:opacity-80"
                  style={{ color: theme.mainTextColor }}
                >
                  {link}
                </span>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-90 sm:px-5 sm:py-2 sm:text-sm"
              style={{
                backgroundColor: theme.mainTextColor,
                color: theme.pageBackground,
              }}
            >
              Create Event
            </button>
            <button
              className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-80 sm:px-5 sm:py-2 sm:text-sm"
              style={{
                border: `1px solid ${mainTextWithAlpha(0.2)}`,
                color: theme.mainTextColor,
              }}
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

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

              {/* Date & Time Card - Multi-day timeline view */}
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
                    {/* Start dot */}
                    <div
                      className="h-3 w-3 rounded-full shadow-lg"
                      style={{
                        backgroundColor: theme.primaryColor,
                        boxShadow: `0 0 10px ${primaryWithAlpha(0.5)}`,
                      }}
                    />
                    {/* Connecting line */}
                    <div
                      className="my-1 w-0.5 flex-1 rounded-full"
                      style={{ backgroundColor: primaryWithAlpha(0.3) }}
                    />
                    {/* End dot */}
                    <div
                      className="h-3 w-3 rounded-full shadow-md"
                      style={{ backgroundColor: primaryWithAlpha(0.3) }}
                    />
                  </div>
                  <div className="flex-1">
                    {/* Start date */}
                    <div className="mb-3">
                      <p
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: theme.subTextColor }}
                      >
                        Start
                      </p>
                      <p
                        className="font-medium"
                        style={{ color: theme.mainTextColor }}
                      >
                        {formatDate(mockEvent.startDateTime)}
                      </p>
                      <p className="text-sm" style={{ color: theme.subTextColor }}>
                        {formatTime(mockEvent.startDateTime)}
                      </p>
                    </div>
                    {/* End date */}
                    <div>
                      <p
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: theme.subTextColor }}
                      >
                        End
                      </p>
                      <p
                        className="font-medium"
                        style={{ color: theme.mainTextColor }}
                      >
                        {formatDate(mockEvent.endDateTime)}
                      </p>
                      <p className="text-sm" style={{ color: theme.subTextColor }}>
                        {formatTime(mockEvent.endDateTime)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative mt-4">
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: theme.cardSecondaryBackground,
                      color: theme.mainTextColor,
                      border: borderStyle,
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
                  style={{
                    backgroundColor: theme.cardSecondaryBackground,
                    borderBottom: borderStyle,
                  }}
                >
                  <MapPin
                    className="h-5 w-5"
                    style={{ color: theme.subTextColor }}
                  />
                  <span className="text-sm" style={{ color: theme.subTextColor }}>
                    Map Preview (Secondary)
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
                        backgroundColor: theme.cardSecondaryBackground,
                        border: isSelected
                          ? `2px solid ${theme.primaryColor}`
                          : borderStyle,
                      }}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        {!isSoldOut && (
                          <div
                            className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                            style={{
                              borderColor: isSelected
                                ? theme.primaryColor
                                : theme.borderColor,
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
              <style>{`
                .theme-description h1,
                .theme-description h2,
                .theme-description h3 {
                  color: ${theme.mainTextColor};
                  font-weight: 600;
                  margin-top: 1rem;
                  margin-bottom: 0.5rem;
                }
                .theme-description h1 { font-size: 1.5rem; }
                .theme-description h2 { font-size: 1.25rem; }
                .theme-description h3 { font-size: 1.125rem; }
                .theme-description p,
                .theme-description li {
                  color: ${theme.mainTextColor};
                  opacity: 0.9;
                  font-size: 0.875rem;
                  line-height: 1.5rem;
                  margin: 0.375rem 0;
                }
                .theme-description ul {
                  list-style-type: disc;
                  padding-left: 1.25rem;
                  margin: 0.375rem 0;
                }
                .theme-description ol {
                  list-style-type: decimal;
                  padding-left: 1.25rem;
                  margin: 0.375rem 0;
                }
                .theme-description blockquote {
                  border-left: 4px solid ${theme.borderColor};
                  padding-left: 0.875rem;
                  margin: 0.75rem 0;
                  font-style: italic;
                  color: ${theme.subTextColor};
                }
                .theme-description hr {
                  border: none;
                  border-top: 2px solid ${theme.borderColor};
                  margin: 1.25rem 0;
                }
                .theme-description a {
                  color: ${theme.primaryColor};
                  text-decoration: underline;
                }
                .theme-description code {
                  background-color: ${theme.cardSecondaryBackground};
                  padding: 0.125rem 0.25rem;
                  border-radius: 0.25rem;
                  font-family: monospace;
                  font-size: 0.8125rem;
                }
                .theme-description strong {
                  font-weight: 700;
                  color: ${theme.mainTextColor};
                }
                .theme-description em {
                  font-style: italic;
                }
              `}</style>
              <div
                className="theme-description"
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
          transform: isEditorOpen ? "translateY(0)" : "translateY(100%)",
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              <div className={theme.pageBackgroundGradient.enabled ? "opacity-50 pointer-events-none" : ""}>
                <ColorInput
                  label="Page Background"
                  value={theme.pageBackground}
                  onChange={(v) => updateTheme("pageBackground", v)}
                />
              </div>

              <ColorInput
                label="Card Background"
                value={theme.cardBackground}
                onChange={(v) => updateTheme("cardBackground", v)}
              />

              <ColorInput
                label="Card Secondary"
                value={theme.cardSecondaryBackground}
                onChange={(v) => updateTheme("cardSecondaryBackground", v)}
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
                <div className="flex items-center gap-2">
                  <label className="block text-xs font-medium text-white/70">Border</label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={theme.borderEnabled}
                      onChange={(e) => updateTheme("borderEnabled", e.target.checked)}
                      className="h-3 w-3 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <span className="text-[10px] text-white/50">On</span>
                  </label>
                </div>
                {theme.borderEnabled && (
                  <ColorInput
                    label=""
                    value={theme.borderColor}
                    onChange={(v) => updateTheme("borderColor", v)}
                  />
                )}
              </div>
            </div>

            {/* Page Background Gradient */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <h4 className="text-xs font-medium text-white/70 mb-2">Page Background Gradient</h4>
              <GradientEditor
                gradient={theme.pageBackgroundGradient}
                onChange={updateGradient}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
