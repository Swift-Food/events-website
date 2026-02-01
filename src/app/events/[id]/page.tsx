import { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventResponseDto, EventStatus } from "@/types/event";
import { EventThemeProvider } from "@/context/EventThemeContext";
import EventClient from "./EventClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Fetch event data server-side
async function getEvent(eventId: string): Promise<EventResponseDto | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`,
      {
        cache: "no-store", // Always fetch fresh data
      }
    );

    if (!res.ok) {
      if (res.status === 404) {
        return null;
      }
      throw new Error("Failed to fetch event");
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching event:", error);
    return null;
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    return {
      title: "Event Not Found",
    };
  }

  const description = event.description
    ? event.description.replace(/<[^>]*>/g, "").substring(0, 160)
    : `Join ${event.name} - an exciting event you won't want to miss!`;

  return {
    title: event.name,
    description,
    openGraph: {
      title: event.name,
      description,
      images: event.eventImage ? [event.eventImage] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: event.name,
      description,
      images: event.eventImage ? [event.eventImage] : [],
    },
  };
}

export default async function EventPage({ params }: PageProps) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    notFound();
  }

  // Generate JSON-LD structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    description: event.description
      ? event.description.replace(/<[^>]*>/g, "").substring(0, 200)
      : undefined,
    startDate: new Date(event.startDateTime).toISOString(),
    endDate: new Date(event.endDateTime).toISOString(),
    eventStatus:
      event.status === EventStatus.CANCELLED
        ? "https://schema.org/EventCancelled"
        : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: event.address
      ? {
          "@type": "Place",
          name: event.address.name || event.name,
          address: {
            "@type": "PostalAddress",
            streetAddress: [
              event.address.addressLine1,
              event.address.addressLine2,
            ]
              .filter(Boolean)
              .join(", "),
            addressLocality: event.address.city,
            postalCode: event.address.zipcode,
            addressCountry: "GB",
          },
          ...(event.address.location?.latitude &&
          event.address.location?.longitude
            ? {
                geo: {
                  "@type": "GeoCoordinates",
                  latitude: event.address.location.latitude,
                  longitude: event.address.location.longitude,
                },
              }
            : {}),
        }
      : undefined,
    image: event.eventImage || undefined,
    organizer: event.owner?.user
      ? {
          "@type": "Person",
          name:
            [event.owner.firstName, event.owner.lastName]
              .filter(Boolean)
              .join(" ") ||
            event.owner.user.username ||
            "Event Organizer",
        }
      : undefined,
    offers:
      event.eventTickets && event.eventTickets.length > 0
        ? event.eventTickets.map((ticket) => ({
            "@type": "Offer",
            name: ticket.name,
            price: Number(ticket.price),
            priceCurrency: "GBP",
            availability:
              !ticket.isSoldOut && ticket.isAvailable
                ? "https://schema.org/InStock"
                : "https://schema.org/SoldOut",
            url: `${process.env.NEXT_PUBLIC_APP_URL}/events/${id}`,
          }))
        : undefined,
  };

  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EventThemeProvider themeJson={event.eventTheme}>
        <EventClient initialEvent={event} eventId={id} />
      </EventThemeProvider>
    </>
  );
}
