"use client";

import { useEffect, useRef, useMemo } from "react";
import { EventResponseDto } from "@/types/event";
import { useEventTheme } from "@/context/EventThemeContext";
import { getThemeCSSVariables } from "@/lib/theme-presets";
import type { ColorPalette } from "@/types/event/theme";
import EventThemeBackground from "@/components/theme/EventThemeBackground";
import { ExternalLink } from "lucide-react";
import EmbedCardLayout from "./EmbedCardLayout";
import EmbedFullPageLayout from "./EmbedFullPageLayout";

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

 // Override global overflow:hidden so embed pages can scroll when viewed directly.
 // Inject a <style> tag for maximum specificity — inline style overrides can lose to
 // CSS-in-JS or late-loading stylesheets.
 useEffect(() => {
  const style = document.createElement("style");
  style.textContent = `
   html, body {
    overflow: auto !important;
    height: auto !important;
    overscroll-behavior: auto !important;
   }
  `;
  document.head.appendChild(style);
  return () => { style.remove(); };
 }, []);

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

 const isFullPage = layout === "full";

  return (
   <div
    ref={containerRef}
     style={{
      ...(cssVars as React.CSSProperties),
      backgroundColor: activePalette.pageBackground,
      ...(!isFullPage ? { height: "100vh", overflow: "hidden" } : {}),
     }}
     className={`relative font-sans ${isFullPage ? "" : "overflow-hidden rounded-xl"}`}
    >
     {/* Theme background */}
     {useEventThemeBackground && (
     <EventThemeBackground
      config={themeConfig}
      palette={activePalette}
      shader={shader}
      landscape={landscape}
     />
    )}

     {/* Content sits above the background */}
     <div className={`relative z-10 ${isFullPage ? "" : "h-[100vh] overflow-hidden"}`}>
    {isFullPage ? (
     <EmbedFullPageLayout
      event={event}
      sections={visibleSections}
      eventPageUrl={eventPageUrl}
      palette={activePalette}
      hasVisualTheme={useEventThemeBackground && themeConfig.type !== "solid"}
     />
    ) : (
     <EmbedCardLayout
      event={event}
      sections={visibleSections}
      eventPageUrl={eventPageUrl}
      palette={activePalette}
      hasVisualTheme={useEventThemeBackground && themeConfig.type !== "solid"}
     />
    )}

    {/* Footer bar — only for full page layout */}
    {isFullPage && (
     <div
      className="flex items-center justify-between px-4 py-2"
      style={{ borderTop: `1px solid ${activePalette.borderEnabled ? activePalette.borderColor : 'transparent'}` }}
     >
      <a
       href="https://prismo.live"
       target="_blank"
       rel="noopener noreferrer"
       className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
      >
       <div
        className="h-4 w-4 shrink-0"
        style={{
         backgroundColor: activePalette.subTextColor,
         WebkitMaskImage: "url(/logo.svg)",
         WebkitMaskSize: "contain",
         WebkitMaskRepeat: "no-repeat",
         WebkitMaskPosition: "center",
         maskImage: "url(/logo.svg)",
         maskSize: "contain",
         maskRepeat: "no-repeat",
         maskPosition: "center",
        } as React.CSSProperties}
        role="img"
        aria-label="Prismo logo"
       />
       <span
        className="text-xs font-normal"
        style={{
         color: activePalette.subTextColor,
         fontFamily: "var(--font-satoshi), sans-serif",
        }}
       >
        PRISMO
       </span>
      </a>
      <a
       href={eventPageUrl}
       target="_blank"
       rel="noopener noreferrer"
       className="flex items-center gap-1 text-[11px] font-medium transition-opacity hover:opacity-80"
       style={{ color: activePalette.primaryColor }}
      >
       View Full Event Page
       <ExternalLink className="h-3 w-3" />
      </a>
     </div>
    )}
   </div>
  </div>
 );
}
