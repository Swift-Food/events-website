import { NextRequest, NextResponse } from "next/server";

interface JsonLdEvent {
  "@type"?: string;
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  eventAttendanceMode?: string;
  location?: {
    "@type"?: string;
    name?: string;
    address?: {
      "@type"?: string;
      streetAddress?: string;
      addressLocality?: string;
      postalCode?: string;
      addressCountry?: string;
    } | string;
    geo?: {
      "@type"?: string;
      latitude?: number | string;
      longitude?: number | string;
    };
    latitude?: number | string;
    longitude?: number | string;
  };
  image?: string | string[] | { url?: string };
  url?: string;
  eventStatus?: string;
  organizer?: {
    name?: string;
  };
}

function extractJsonLd(html: string): JsonLdEvent | null {
  // Find all JSON-LD script tags
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const jsonContent = match[1].trim();
      const data = JSON.parse(jsonContent);

      // Handle array of JSON-LD objects
      if (Array.isArray(data)) {
        const eventData = data.find(
          (item) => item["@type"] === "Event" || item["@type"]?.includes?.("Event")
        );
        if (eventData) return eventData;
      }

      // Handle @graph structure
      if (data["@graph"]) {
        const eventData = data["@graph"].find(
          (item: { "@type"?: string }) =>
            item["@type"] === "Event" || item["@type"]?.includes?.("Event")
        );
        if (eventData) return eventData;
      }

      // Direct Event object
      if (data["@type"] === "Event" || data["@type"]?.includes?.("Event")) {
        return data;
      }
    } catch {
      // Continue to next script tag if parsing fails
      continue;
    }
  }

  return null;
}

function extractMetaTags(html: string): Partial<JsonLdEvent> {
  const result: Partial<JsonLdEvent> = {};

  // Extract Open Graph tags
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  if (ogTitleMatch) result.name = ogTitleMatch[1];

  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  if (ogDescMatch) result.description = ogDescMatch[1];

  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (ogImageMatch) result.image = ogImageMatch[1];

  // Try title tag as fallback
  if (!result.name) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) result.name = titleMatch[1].trim();
  }

  return result;
}

function normalizeEventData(jsonLd: JsonLdEvent, metaTags: Partial<JsonLdEvent>, originalUrl: string) {
  // Get image URL from various formats
  let imageUrl: string | undefined;
  const imgSource = jsonLd.image || metaTags.image;
  if (typeof imgSource === "string") {
    imageUrl = imgSource;
  } else if (Array.isArray(imgSource)) {
    imageUrl = imgSource[0];
  } else if (imgSource && typeof imgSource === "object" && "url" in imgSource) {
    imageUrl = imgSource.url;
  }

  // Parse location
  let locationData: {
    name?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  } | undefined;

  if (jsonLd.location) {
    const loc = jsonLd.location;
    locationData = {
      name: loc.name,
    };

    if (loc.address) {
      if (typeof loc.address === "string") {
        locationData.address = loc.address;
      } else {
        locationData.address = loc.address.streetAddress;
        locationData.city = loc.address.addressLocality;
        locationData.postalCode = loc.address.postalCode;
      }
    }

    // Extract geo coordinates - check both loc.geo and direct loc.latitude/longitude
    let lat: number | undefined;
    let lng: number | undefined;

    if (loc.geo) {
      lat = typeof loc.geo.latitude === "string"
        ? parseFloat(loc.geo.latitude)
        : loc.geo.latitude;
      lng = typeof loc.geo.longitude === "string"
        ? parseFloat(loc.geo.longitude)
        : loc.geo.longitude;
    }

    // Fallback to direct latitude/longitude on location object
    if ((!lat || !lng) && loc.latitude && loc.longitude) {
      lat = typeof loc.latitude === "string"
        ? parseFloat(loc.latitude)
        : loc.latitude;
      lng = typeof loc.longitude === "string"
        ? parseFloat(loc.longitude)
        : loc.longitude;
    }

    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      locationData.latitude = lat;
      locationData.longitude = lng;
    }
  }

  // Clean up description - remove HTML tags if present
  let description = jsonLd.description || metaTags.description;
  if (description) {
    description = description
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();
  }

  // Determine event format from eventAttendanceMode
  // Schema.org values: OfflineEventAttendanceMode, OnlineEventAttendanceMode, MixedEventAttendanceMode
  let eventFormat: "IN_PERSON" | "VIRTUAL" | "BOTH" | undefined;
  if (jsonLd.eventAttendanceMode) {
    const mode = jsonLd.eventAttendanceMode.toLowerCase();
    if (mode.includes("offline") || mode.includes("in-person") || mode.includes("inperson")) {
      eventFormat = "IN_PERSON";
    } else if (mode.includes("online") || mode.includes("virtual")) {
      eventFormat = "VIRTUAL";
    } else if (mode.includes("mixed") || mode.includes("hybrid")) {
      eventFormat = "BOTH";
    }
  }

  // If no explicit mode but we have location data, assume in-person
  if (!eventFormat && locationData?.address) {
    eventFormat = "IN_PERSON";
  }

  return {
    name: jsonLd.name || metaTags.name,
    description,
    startDate: jsonLd.startDate,
    endDate: jsonLd.endDate,
    location: locationData,
    image: imageUrl,
    url: jsonLd.url || originalUrl,
    eventFormat,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  try {
    // Fetch the page with a reasonable timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; EventImporter/1.0)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch page: ${response.status} ${response.statusText}` },
        { status: 502 }
      );
    }

    const html = await response.text();

    // Try to extract JSON-LD first
    const jsonLd = extractJsonLd(html);

    // Also extract meta tags as fallback
    const metaTags = extractMetaTags(html);

    // Normalize and return whatever data we found
    const eventData = normalizeEventData(jsonLd || {}, metaTags, url);

    // Return the data even if incomplete - let the frontend handle what's available
    return NextResponse.json(eventData);
  } catch (error) {
    console.error("Error importing event:", error);

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out. The page took too long to load." }, { status: 504 });
    }

    return NextResponse.json(
      { error: "Failed to import event. Please check the URL and try again." },
      { status: 500 }
    );
  }
}
