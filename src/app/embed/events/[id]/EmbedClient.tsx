"use client";

import { useEffect, useRef, useMemo } from "react";
import { EventResponseDto } from "@/types/event";
import { useEventTheme } from "@/context/EventThemeContext";
import { getThemeCSSVariables } from "@/lib/theme-presets";
import type { ColorPalette } from "@/types/event/theme";
import EventThemeBackground from "@/components/theme/EventThemeBackground";
import EmbedCardLayout from "./EmbedCardLayout";
import EmbedBannerLayout from "./EmbedBannerLayout";

const LIGHT_PALETTE: ColorPalette = {
 pageBackground: "#ffffff",
 cardBackground: "#f9fafb",
 cardSecondaryBackground: "#f3f4f6",
 mainTextColor: "#111827",
 subTextColor: "#6b7280",
 primaryColor: "#7c3aed",
 primaryForegroundColor: "#ffffff",
 borderEnabled: true,
 borderColor: "#e5e7eb",
};

const DARK_PALETTE: ColorPalette = {
 pageBackground: "#0a0a0a",
 cardBackground: "#18181b",
 cardSecondaryBackground: "#27272a",
 mainTextColor: "#fafafa",
 subTextColor: "#a1a1aa",
 primaryColor: "#a78bfa",
 primaryForegroundColor: "#ffffff",
 borderEnabled: true,
 borderColor: "#3f3f46",
};

export type EmbedSection =
 | "image"
 | "time"
 | "organizer"
 | "location"
 | "description"
 | "categories"
 | "tickets"
 | "cta";

const ALL_SECTIONS: EmbedSection[] = [
 "image",
 "time",
 "organizer",
 "location",
 "description",
 "categories",
 "tickets",
 "cta",
];

interface EmbedClientProps {
 event: EventResponseDto;
 layout: string;
 show: string;
 theme: string;
}

export default function EmbedClient({
 event,
 layout,
 show,
 theme,
}: EmbedClientProps) {
 const containerRef = useRef<HTMLDivElement>(null);
 const { config: themeConfig, palette: eventPalette, shader, landscape } = useEventTheme();
 const useEventThemeBackground = theme === "event";

 const visibleSections = useMemo<Set<EmbedSection>>(() => {
  if (!show || show === "all") return new Set(ALL_SECTIONS);
  const parts = show.split(",").map((s) => s.trim()) as EmbedSection[];
  return new Set(parts.filter((s) => ALL_SECTIONS.includes(s)));
 }, [show]);

 const activePalette = useMemo(() => {
  if (theme === "light") return LIGHT_PALETTE;
  if (theme === "dark") return DARK_PALETTE;
  return eventPalette;
 }, [theme, eventPalette]);

 const cssVars = useMemo(
  () => getThemeCSSVariables(activePalette),
  [activePalette]
 );

 // Set body background to match the active palette so no dark gaps appear
 useEffect(() => {
  document.documentElement.style.backgroundColor = activePalette.pageBackground;
  document.body.style.backgroundColor = activePalette.pageBackground;
 }, [activePalette.pageBackground]);

 // Send height to parent for auto-resize
 useEffect(() => {
  const sendHeight = () => {
   if (!containerRef.current) return;
   const height = containerRef.current.scrollHeight;
   window.parent.postMessage(
    {
     type: "prismo-embed-resize",
     height,
     eventId: event.id,
    },
    "*"
   );
  };

  sendHeight();

  const observer = new ResizeObserver(sendHeight);
  if (containerRef.current) {
   observer.observe(containerRef.current);
  }

  return () => observer.disconnect();
 }, [event.id]);

 // Build event page URL
 const eventPageUrl = typeof window !== "undefined"
  ? `${window.location.origin.replace("/embed", "")}/events/${event.eventUrl || event.id}`
  : `/events/${event.eventUrl || event.id}`;

 const isCard = layout !== "banner";

 return (
  <div
   ref={containerRef}
   style={{
    ...(cssVars as React.CSSProperties),
    backgroundColor: activePalette.pageBackground,
   }}
   className="relative overflow-hidden rounded-xl font-sans"
  >
   {/* Theme background — rendered behind content */}
   {useEventThemeBackground && (
    <EventThemeBackground
     config={themeConfig}
     palette={activePalette}
     shader={shader}
     landscape={landscape}
    />
   )}

   {/* Content sits above the background */}
   <div className="relative z-10">
    {isCard ? (
     <EmbedCardLayout
      event={event}
      sections={visibleSections}
      eventPageUrl={eventPageUrl}
      palette={activePalette}
      hasVisualTheme={useEventThemeBackground && themeConfig.type !== "solid"}
     />
    ) : (
     <EmbedBannerLayout
      event={event}
      sections={visibleSections}
      eventPageUrl={eventPageUrl}
      palette={activePalette}
      hasVisualTheme={useEventThemeBackground && themeConfig.type !== "solid"}
     />
    )}

    {/* Powered by Prismo */}
    <div className="flex justify-center py-2">
     <a
      href="https://prismo.live"
      target="_blank"
      rel="noopener noreferrer"
      className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
     >
      Powered by Prismo
     </a>
    </div>
   </div>
  </div>
 );
}
