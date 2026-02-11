"use client";

import Image from "next/image";
import { EventResponseDto } from "@/types/event";
import { isVirtualEvent, isHybridEvent } from "@/types/event/status";
import type { ColorPalette } from "@/types/event/theme";
import type { EmbedSection } from "./EmbedClient";
import {
 Calendar,
 Clock,
 MapPin,
 User,
 Video,
 Tag,
 Ticket,
 ExternalLink,
 Globe,
} from "lucide-react";
import EmbedThemeStyles from "./EmbedThemeStyles";

interface EmbedFullPageLayoutProps {
 event: EventResponseDto;
 sections: Set<EmbedSection>;
 eventPageUrl: string;
 palette: ColorPalette;
 hasVisualTheme?: boolean;
}

function formatDate(date: string | Date): string {
 return new Date(date).toLocaleDateString("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
 });
}

function formatTime(date: string | Date): string {
 return new Date(date).toLocaleTimeString("en-US", {
  hour: "numeric",
  minute: "2-digit",
 });
}

function isSameDay(date1: string | Date, date2: string | Date): boolean {
 const d1 = new Date(date1);
 const d2 = new Date(date2);
 return (
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate()
 );
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

export default function EmbedFullPageLayout({
 event,
 sections,
 eventPageUrl,
 palette,
}: EmbedFullPageLayoutProps) {
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
  const parts = [
   event.address.name,
   event.address.addressLine1,
   event.address.city,
  ].filter(Boolean);
  return parts.join(", ") || null;
 })();

 const locationShort = (() => {
  if (isVirtual) return "Online Event";
  if (!event.address) return null;
  return [event.address.name, event.address.city].filter(Boolean).join(", ") || null;
 })();

 return (
  <>
    <EmbedThemeStyles palette={palette} />
   <div className="mx-auto max-w-6xl px-6 py-4">
    {/* Main Content - Responsive Layout (mirroring EventClient) */}
     <div className="flex flex-col gap-6 sm:flex-row-reverse">

      {/* Right Column - Image and Sidebar */}
      <section className="flex flex-col gap-6 sm:w-56 md:w-72 lg:w-96 sm:shrink-0">
       <div className="flex flex-col gap-6">

       {/* Image */}
       {showSection("image") && (
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-card-background">
         {event.eventImage ? (
          <Image
           src={event.eventImage}
           alt={event.name}
           fill
           className="object-cover"
           priority
          />
         ) : (
          <div className="flex h-full items-center justify-center bg-card-background">
           <Calendar className="h-24 w-24 text-muted-foreground/30" />
          </div>
         )}
        </div>
       )}

        {/* Title & Categories - Mobile only */}
        <div className="block sm:hidden">
         <h1 className="mb-4 text-2xl font-bold tracking-tight text-foreground">
         {event.name}
        </h1>

        {/* Categories - Mobile */}
        {showSection("categories") &&
         event.categories &&
         event.categories.length > 0 && (
           <div className="flex flex-wrap gap-2">
           {event.categories.map((category) => (
            <span
             key={category.id}
             className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-foreground"
            >
             {category.name}
            </span>
           ))}
          </div>
         )}

        {/* Organizer - Mobile */}
        {showSection("organizer") && (
         <>
          <div className="mt-6 h-px bg-foreground/10" />
           <div className="py-4 flex items-center gap-3">
           {profilePicture ? (
            <Image
             src={profilePicture}
             alt={ownerName}
             width={48}
             height={48}
             className="rounded-full"
             unoptimized
            />
           ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/10">
             <User className="h-6 w-6 text-muted-foreground" />
            </div>
           )}
           <div>
            <p className="font-semibold text-foreground">{ownerName}</p>
            <p className="text-sm text-muted-foreground">Organizer</p>
           </div>
          </div>
          <div className="h-px bg-foreground/10" />
         </>
        )}
       </div>

       {/* Date & Time Card */}
       {showSection("time") && (
        <div className="rounded-xl bg-card-background backdrop-blur-sm p-4 sm:p-6">
         <h3 className="mb-4 text-lg font-semibold text-foreground">
          Date & Time
         </h3>
         <div className="flex gap-4">
          {isSameDay(event.startDateTime, event.endDateTime) ? (
           <>
            <div className="flex flex-col items-center py-1">
             <div className="h-3 w-3 rounded-full bg-primary shadow-lg shadow-primary/50" />
            </div>
            <div className="flex-1">
             <p className="font-medium text-foreground">
              {formatDate(event.startDateTime)}
             </p>
             <p className="text-sm text-muted-foreground">
              {formatTime(event.startDateTime)} -{" "}
              {formatTime(event.endDateTime)}
             </p>
            </div>
           </>
          ) : (
           <>
            <div className="flex flex-col items-center py-1">
             <div className="h-3 w-3 rounded-full bg-primary shadow-lg shadow-primary/50" />
             <div className="my-2 w-0.5 flex-1 rounded-full bg-primary/30" />
             <div className="h-3 w-3 rounded-full bg-primary/30 shadow-md" />
            </div>
            <div className="flex-1">
             <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
               Start
              </p>
              <p className="font-medium text-foreground">
               {formatDate(event.startDateTime)}
              </p>
              <p className="text-sm text-muted-foreground">
               {formatTime(event.startDateTime)}
              </p>
             </div>
             <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
               End
              </p>
              <p className="font-medium text-foreground">
               {formatDate(event.endDateTime)}
              </p>
              <p className="text-sm text-muted-foreground">
               {formatTime(event.endDateTime)}
              </p>
             </div>
            </div>
           </>
          )}
         </div>
        </div>
       )}

       {/* Location Card */}
       {showSection("location") && (
        <div className="rounded-xl bg-card-background backdrop-blur-sm overflow-hidden">
         {isVirtual ? (
          <div className="p-4 sm:p-6">
           <div className="h-32 w-full bg-primary/10 rounded-lg flex flex-col items-center justify-center gap-2 mb-4">
            <Video className="h-8 w-8 text-primary" />
            <span className="text-sm font-medium text-primary">
             Online Event
            </span>
           </div>
           <p className="text-sm text-muted-foreground">
            Meeting link available on the event page
           </p>
          </div>
         ) : event.address ? (
          <div className="p-4">
           <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
             {event.address.name && event.address.name !== event.name && (
              <h3 className="font-semibold text-foreground mb-1">
               {event.address.name}
              </h3>
             )}
             <p className="text-sm text-muted-foreground">
              {[
               event.address.addressLine1,
               event.address.addressLine2,
               event.address.city,
               event.address.zipcode,
              ]
               .filter(Boolean)
               .join(", ")}
             </p>
            </div>
           </div>
           {isHybrid && (
            <div className="mt-3 pt-3 border-t border-foreground/10">
             <p className="text-sm text-primary flex items-center gap-1">
              <Video className="h-4 w-4" />
              Also available online
             </p>
            </div>
           )}
          </div>
         ) : (
          <div className="p-4 sm:p-6">
           <div className="h-32 w-full bg-card-secondary-background rounded-lg flex flex-col items-center justify-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Location TBD</span>
           </div>
          </div>
         )}
        </div>
       )}
      </div>
     </section>

     {/* Left Column - Main Content */}
     <section className="flex-1 space-y-6">
       {/* Title and Categories - Desktop only */}
        <div className="hidden sm:block sm:pt-4 md:pt-6">
         <h1 className="mb-4 text-2xl md:text-3xl lg:text-5xl font-bold tracking-tight text-foreground">
        {event.name}
       </h1>

       {showSection("categories") &&
        event.categories &&
        event.categories.length > 0 && (
         <div className="flex flex-wrap gap-2">
          {event.categories.map((category) => (
           <span
            key={category.id}
            className="rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-foreground"
           >
            {category.name}
           </span>
          ))}
         </div>
        )}

       {/* Organizer - Desktop */}
       {showSection("organizer") && (
        <>
         <div className="mt-8 h-px bg-foreground/10" />
         <div className="py-6 flex items-center gap-3">
          {profilePicture ? (
           <Image
            src={profilePicture}
            alt={ownerName}
            width={48}
            height={48}
            className="rounded-full"
            unoptimized
           />
          ) : (
           <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/10">
            <User className="h-6 w-6 text-muted-foreground" />
           </div>
          )}
          <div>
           <p className="font-semibold text-foreground">{ownerName}</p>
           <p className="text-sm text-muted-foreground">Organizer</p>
          </div>
         </div>
         <div className="h-px bg-foreground/10" />
        </>
       )}
      </div>

      {/* Tickets */}
      {showSection("tickets") &&
       event.eventTickets &&
       event.eventTickets.length > 0 && (
        <div className="rounded-xl bg-card-background backdrop-blur-sm p-4 sm:p-6">
         <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-foreground">Tickets</h2>
         </div>
         <div className="space-y-2 sm:space-y-3">
          {event.eventTickets
           .filter((ticket) => !ticket.isPrivate)
           .map((ticket) => (
            <div
             key={ticket.id}
             className="flex items-center justify-between gap-2 sm:gap-4 rounded-xl p-3 sm:p-4 bg-card-secondary-background border-2 border-transparent"
            >
             <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-semibold text-foreground">
               {ticket.name}
              </h3>
              {ticket.description && (
               <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                {ticket.description}
               </p>
              )}
              {ticket.isSoldOut && (
               <span className="text-xs text-amber-400 font-medium">
                Sold out
               </span>
              )}
              {ticket.isNearlySoldOut && !ticket.isSoldOut && (
               <span className="text-xs text-orange-500 font-medium">
                Selling fast
               </span>
              )}
             </div>
             <p className="text-base sm:text-xl font-bold text-foreground shrink-0">
              {Number(ticket.price) === 0
               ? "Free"
               : `\u00A3${Number(ticket.price).toFixed(2)}`}
             </p>
            </div>
           ))}
         </div>

         {/* CTA */}
         {showSection("cta") && (
          <a
           href={eventPageUrl}
           target="_blank"
           rel="noopener noreferrer"
           className="w-full mt-4 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/80 flex items-center justify-center gap-2"
          >
           {event.acceptingNewTickets ? "Register on Prismo" : "View Event"}
           <ExternalLink className="h-4 w-4" />
          </a>
         )}
        </div>
       )}

      {/* Description */}
      {showSection("description") && (
       <div className="py-6">
        <h2 className="mb-4 text-lg font-semibold text-muted-foreground">
         About this event
        </h2>
        {event.description ? (
         <div
          className="tiptap-editor tiptap-view-mode themed-event"
          dangerouslySetInnerHTML={{ __html: event.description }}
         />
        ) : (
         <p className="text-muted-foreground">No description provided.</p>
        )}
       </div>
      )}
     </section>
    </div>
   </div>
  </>
 );
}
