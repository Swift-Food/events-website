import { MetadataRoute } from "next";
import { EventListResponseDto, EventStatus } from "@/types/event";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://example.com";

async function getPublishedEvents(): Promise<EventListResponseDto | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events?status=${EventStatus.PUBLISHED}&take=1000`,
      {
        next: { revalidate: 3600 }, // Revalidate every hour
      }
    );

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching events for sitemap:", error);
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/events`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
  ];

  // Dynamic event pages
  const eventsData = await getPublishedEvents();
  const eventPages: MetadataRoute.Sitemap =
    eventsData?.events?.map((event) => ({
      url: `${BASE_URL}/events/${event.id}`,
      lastModified: new Date(event.updatedAt || event.createdAt),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })) || [];

  return [...staticPages, ...eventPages];
}
