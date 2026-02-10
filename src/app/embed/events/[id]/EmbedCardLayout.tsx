"use client";

import Image from "next/image";
import { EventResponseDto } from "@/types/event";
import { isVirtualEvent, isHybridEvent } from "@/types/event/status";
import type { ColorPalette } from "@/types/event/theme";
import type { EmbedSection } from "./EmbedClient";
import {
 Calendar,
 MapPin,
 User,
 ExternalLink,
 Video,
 Globe,
 Ticket,
} from "lucide-react";

interface EmbedCardLayoutProps {
 event: EventResponseDto;
 sections: Set<EmbedSection>;
 eventPageUrl: string;
 palette: ColorPalette;
 hasVisualTheme?: boolean;
}

function formatDateShort(date: string | Date): string {
 const d = new Date(date);
 return d.toLocaleDateString("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
 });
}

function formatTime(date: string | Date): string {
 const d = new Date(date);
 return d.toLocaleTimeString("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
 });
}

function stripHtml(html: string): string {
 return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

function getPriceRange(
 tickets?: EventResponseDto["eventTickets"]
): string | null {
 if (!tickets || tickets.length === 0) return null;

 const publicTickets = tickets.filter((t) => !t.isPrivate);
 if (publicTickets.length === 0) return null;

 const prices = publicTickets.map((t) => parseFloat(t.price) || 0);
 const min = Math.min(...prices);
 const max = Math.max(...prices);

 if (max === 0) return "Free";
 if (min === 0 && max > 0) return `Free - \u00A3${max.toFixed(2)}`;
 if (min === max) return `\u00A3${min.toFixed(2)}`;
 return `\u00A3${min.toFixed(2)} - \u00A3${max.toFixed(2)}`;
}

export default function EmbedCardLayout({
 event,
 sections,
 eventPageUrl,
 palette,
 hasVisualTheme = false,
}: EmbedCardLayoutProps) {
 const showSection = (s: EmbedSection) => sections.has(s);
 const priceRange = getPriceRange(event.eventTickets);

 const isVirtual = isVirtualEvent(event.format);
 const isHybrid = isHybridEvent(event.format);

 const ownerName =
  event.owner?.organizationName ||
  [event.owner?.firstName, event.owner?.lastName].filter(Boolean).join(" ") ||
  "Organizer";

 const profilePicture = event.owner?.user?.profilePicture;

 const locationText = (() => {
  if (isVirtual) return "Online Event";
  if (!event.address) return null;
  const parts = [event.address.name, event.address.city].filter(Boolean);
  return parts.join(", ") || null;
 })();

 return (
   <div
    className="relative flex h-[100vh] overflow-hidden rounded-xl border"
    style={{
     backgroundColor: palette.cardBackground,
     borderColor: palette.borderEnabled ? palette.borderColor : "transparent",
    }}
   >
     {/* Left: Image — responsive square */}
     {showSection("image") && (
      <a
       href={eventPageUrl}
       target="_blank"
       rel="noopener noreferrer"
       className="relative block shrink-0 aspect-square w-[100px] sm:w-[140px]"
      >
       {event.eventImage ? (
        <div className="relative h-full w-full overflow-hidden">
         <Image
          src={event.eventImage}
          alt={event.name}
          fill
          className="object-cover transition-transform duration-300 hover:scale-105"
          sizes="140px"
         />
        </div>
       ) : (
        <div
         className="h-full w-full"
         style={{
          backgroundColor: event.eventColor || palette.primaryColor,
         }}
        />
       )}
      </a>
     )}

    {/* Center: Details column */}
    <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
     {/* Top: info, pushed down to center */}
     <div className="flex flex-1 flex-col justify-center gap-1.5">
      {/* Date & Time */}
      {showSection("time") && (
       <div
        className="flex items-center gap-1.5 text-xs"
        style={{ color: palette.subTextColor }}
       >
        <Calendar className="h-3 w-3 shrink-0" style={{ color: palette.primaryColor }} />
        <span>
         {formatDateShort(event.startDateTime)} &middot;{" "}
         {formatTime(event.startDateTime)} - {formatTime(event.endDateTime)}
        </span>
       </div>
      )}

      {/* Title */}
      <a
       href={eventPageUrl}
       target="_blank"
       rel="noopener noreferrer"
       className="block"
      >
       <h2
        className="text-sm font-bold font-heading leading-tight hover:underline line-clamp-2"
        style={{ color: palette.mainTextColor }}
       >
        {event.name}
       </h2>
      </a>

      {/* Organizer */}
      {showSection("organizer") && (
       <div className="flex items-center gap-1.5">
        {profilePicture ? (
         <Image
          src={profilePicture}
          alt={ownerName}
          width={16}
          height={16}
          className="rounded-full object-cover"
         />
        ) : (
         <div
          className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-semibold"
          style={{
           backgroundColor: palette.primaryColor,
           color: palette.primaryForegroundColor,
          }}
         >
          {ownerName.charAt(0).toUpperCase()}
         </div>
        )}
        <span
         className="text-[11px] font-medium truncate"
         style={{ color: palette.subTextColor }}
        >
         {ownerName}
        </span>
       </div>
      )}

      {/* Location */}
      {showSection("location") && locationText && (
       <div
        className="flex items-center gap-1.5 text-xs"
        style={{ color: palette.subTextColor }}
       >
        {isVirtual ? (
         <Video className="h-3 w-3 shrink-0" style={{ color: palette.primaryColor }} />
        ) : (
         <MapPin className="h-3 w-3 shrink-0" style={{ color: palette.primaryColor }} />
        )}
        <span className="truncate text-[11px]">{locationText}</span>
        {isHybrid && (
         <span
          className="ml-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium"
          style={{
           backgroundColor: palette.cardSecondaryBackground,
           color: palette.primaryColor,
          }}
         >
          <Globe className="h-2 w-2" />
          Hybrid
         </span>
        )}
       </div>
      )}
     </div>

     {/* Bottom: Price + CTA, always stuck to bottom */}
     {(showSection("tickets") || showSection("cta")) && (
      <div className="flex items-center gap-2 pt-1.5">
       {showSection("tickets") && priceRange && (
        <div
         className="flex items-center gap-1 text-xs font-medium"
         style={{ color: palette.mainTextColor }}
        >
         <Ticket className="h-3 w-3" style={{ color: palette.primaryColor }} />
         <span className="text-[11px]">{priceRange}</span>
        </div>
       )}
       {showSection("cta") && (
        <a
         href={eventPageUrl}
         target="_blank"
         rel="noopener noreferrer"
         className="ml-auto flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-opacity hover:opacity-90"
         style={{
          backgroundColor: palette.primaryColor,
          color: palette.primaryForegroundColor,
         }}
        >
         {event.acceptingNewTickets ? "Register" : "View"}
         <ExternalLink className="h-3 w-3" />
        </a>
       )}
      </div>
     )}
    </div>

    {/* Prismo logo — top right */}
    <a
     href="https://prismo.live"
     target="_blank"
     rel="noopener noreferrer"
     className="absolute top-1.5 right-2 flex items-center gap-1 transition-opacity hover:opacity-80"
    >
     <div
      className="h-3 w-3 shrink-0"
      style={{
       backgroundColor: palette.subTextColor,
       opacity: 0.4,
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
      className="text-[9px] font-normal"
      style={{
       color: palette.subTextColor,
       opacity: 0.4,
       fontFamily: "var(--font-satoshi), sans-serif",
      }}
     >
      PRISMO
     </span>
    </a>
   </div>
 );
}
