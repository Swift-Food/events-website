"use client";

import Image from "next/image";
import { EventResponseDto, EventFormat } from "@/types/event";
import { isVirtualEvent, isHybridEvent } from "@/types/event/status";
import type { ColorPalette } from "@/types/event/theme";
import type { EmbedSection } from "./EmbedClient";
import {
 Calendar,
 Clock,
 MapPin,
 User,
 Tag,
 Ticket,
 ExternalLink,
 Video,
 Globe,
} from "lucide-react";

interface EmbedCardLayoutProps {
 event: EventResponseDto;
 sections: Set<EmbedSection>;
 eventPageUrl: string;
 palette: ColorPalette;
 hasVisualTheme?: boolean;
}

function formatDate(date: string | Date): string {
 const d = new Date(date);
 return d.toLocaleDateString("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
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
 const plainDescription = event.description
  ? stripHtml(event.description)
  : "";

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
   className="overflow-hidden rounded-xl border"
   style={{
    backgroundColor: palette.cardBackground,
    borderColor: palette.borderEnabled ? palette.borderColor : "transparent",
   }}
  >
   {/* Event Image */}
   {showSection("image") && (
    <a
     href={eventPageUrl}
     target="_blank"
     rel="noopener noreferrer"
     className="block"
    >
     {event.eventImage ? (
      <div className="relative aspect-[16/9] w-full overflow-hidden">
       <Image
        src={event.eventImage}
        alt={event.name}
        fill
        className="object-cover transition-transform duration-300 hover:scale-105"
        sizes="400px"
       />
      </div>
     ) : (
      <div
       className="aspect-[16/9] w-full"
       style={{ backgroundColor: event.eventColor || palette.primaryColor }}
      />
     )}
    </a>
   )}

   {/* Content */}
   <div className="p-4 space-y-3">
    {/* Date & Time */}
    {showSection("time") && (
     <div className="flex items-center gap-3 text-xs" style={{ color: palette.subTextColor }}>
      <div className="flex items-center gap-1.5">
       <Calendar className="h-3.5 w-3.5 shrink-0" style={{ color: palette.primaryColor }} />
       <span>{formatDate(event.startDateTime)}</span>
      </div>
      <div className="flex items-center gap-1.5">
       <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: palette.primaryColor }} />
       <span>
        {formatTime(event.startDateTime)} - {formatTime(event.endDateTime)}
       </span>
      </div>
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
      className="text-base font-bold font-heading leading-tight hover:underline"
      style={{ color: palette.mainTextColor }}
     >
      {event.name}
     </h2>
    </a>

    {/* Organizer */}
    {showSection("organizer") && (
     <div className="flex items-center gap-2">
      {profilePicture ? (
       <Image
        src={profilePicture}
        alt={ownerName}
        width={20}
        height={20}
        className="rounded-full object-cover"
       />
      ) : (
       <div
        className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold"
        style={{
         backgroundColor: palette.primaryColor,
         color: palette.primaryForegroundColor,
        }}
       >
        {ownerName.charAt(0).toUpperCase()}
       </div>
      )}
      <span
       className="text-xs font-medium"
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
       <Video className="h-3.5 w-3.5 shrink-0" style={{ color: palette.primaryColor }} />
      ) : (
       <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: palette.primaryColor }} />
      )}
      <span className="truncate">{locationText}</span>
      {isHybrid && (
       <span
        className="ml-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
        style={{
         backgroundColor: palette.cardSecondaryBackground,
         color: palette.primaryColor,
        }}
       >
        <Globe className="h-2.5 w-2.5" />
        Hybrid
       </span>
      )}
     </div>
    )}

    {/* Description */}
    {showSection("description") && plainDescription && (
     <p
      className="text-xs leading-relaxed line-clamp-3"
      style={{ color: palette.subTextColor }}
     >
      {plainDescription}
     </p>
    )}

    {/* Categories */}
    {showSection("categories") && event.categories && event.categories.length > 0 && (
     <div className="flex flex-wrap gap-1.5">
      {event.categories.slice(0, 3).map((cat) => (
       <span
        key={cat.id}
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
        style={{
         backgroundColor: palette.cardSecondaryBackground,
         color: palette.subTextColor,
         border: palette.borderEnabled ? `1px solid ${palette.borderColor}` : "none",
        }}
       >
        <Tag className="h-2.5 w-2.5" />
        {cat.name}
       </span>
      ))}
      {event.categories.length > 3 && (
       <span
        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
        style={{ color: palette.subTextColor }}
       >
        +{event.categories.length - 3} more
       </span>
      )}
     </div>
    )}

    {/* Tickets / Price */}
    {showSection("tickets") && priceRange && (
     <div
      className="flex items-center gap-1.5 text-xs font-medium"
      style={{ color: palette.mainTextColor }}
     >
      <Ticket className="h-3.5 w-3.5" style={{ color: palette.primaryColor }} />
      <span>{priceRange}</span>
     </div>
    )}

    {/* CTA Button */}
    {showSection("cta") && (
     <a
      href={eventPageUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
      style={{
       backgroundColor: palette.primaryColor,
       color: palette.primaryForegroundColor,
      }}
     >
      {event.acceptingNewTickets ? "Register" : "View Event"}
      <ExternalLink className="h-3.5 w-3.5" />
     </a>
    )}
   </div>
  </div>
 );
}
