import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

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

interface NormalizedEventData {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: {
    name?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  };
  image?: string;
  url?: string;
  eventFormat?: "IN_PERSON" | "VIRTUAL" | "BOTH";
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

function extractOgTags($: ReturnType<typeof cheerio.load>): NormalizedEventData {
  const result: NormalizedEventData = {};

  // Core OG tags
  const ogTitle = $('meta[property="og:title"]').attr("content");
  const ogDesc = $('meta[property="og:description"]').attr("content");
  const ogImage = $('meta[property="og:image"]').attr("content");
  const ogUrl = $('meta[property="og:url"]').attr("content");

  if (ogTitle) result.name = ogTitle;
  if (ogDesc) result.description = ogDesc;
  if (ogImage) result.image = ogImage;
  if (ogUrl) result.url = ogUrl;

  // Fallback to <title> tag
  if (!result.name) {
    const title = $("title").text().trim();
    if (title) result.name = title;
  }

  // Fallback to meta description
  if (!result.description) {
    const metaDesc = $('meta[name="description"]').attr("content");
    if (metaDesc) result.description = metaDesc;
  }

  // Event-specific meta properties (some platforms emit these)
  const startTime =
    $('meta[property="event:start_time"]').attr("content") ||
    $('meta[property="og:event:start_time"]').attr("content");
  if (startTime) result.startDate = startTime;

  const endTime =
    $('meta[property="event:end_time"]').attr("content") ||
    $('meta[property="og:event:end_time"]').attr("content");
  if (endTime) result.endDate = endTime;

  // Location from og:locality / og:region (less common but used by some sites)
  const ogLocality = $('meta[property="og:locality"]').attr("content") ||
    $('meta[property="place:location:locality"]').attr("content");
  if (ogLocality) {
    result.location = result.location || {};
    result.location.city = ogLocality;
  }

  return result;
}

// Common placeholder texts that platforms use to hide real addresses
const PLACEHOLDER_ADDRESS_PATTERNS = [
  /register to see address/i,
  /rsvp to see address/i,
  /sign up to see/i,
  /address revealed/i,
  /to be announced/i,
  /tba/i,
  /tbd/i,
];

function isPlaceholderAddress(address: string): boolean {
  return PLACEHOLDER_ADDRESS_PATTERNS.some(pattern => pattern.test(address.trim()));
}

// Try to extract city from location name like "London, England" or "New York, NY"
function extractCityFromLocationName(name: string): string | undefined {
  if (!name) return undefined;

  // Common patterns: "City, Country/State" or just "City"
  const parts = name.split(",").map(p => p.trim());
  if (parts.length >= 1 && parts[0]) {
    // Return first part as city (e.g., "London" from "London, England")
    return parts[0];
  }
  return undefined;
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
        // Skip placeholder addresses like "Register to See Address"
        if (!isPlaceholderAddress(loc.address)) {
          locationData.address = loc.address;
        }
      } else {
        locationData.address = loc.address.streetAddress;
        locationData.city = loc.address.addressLocality;
        locationData.postalCode = loc.address.postalCode;
      }
    }

    // If we don't have a city from the structured address, try to extract from location.name
    // e.g., "London, England" -> city: "London"
    if (!locationData.city && loc.name) {
      locationData.city = extractCityFromLocationName(loc.name);
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

function extractFromDom($: ReturnType<typeof cheerio.load>): NormalizedEventData {
  const result: NormalizedEventData = {};

  // 1. <time datetime=""> elements for dates
  const dateTimes: string[] = [];
  $("time[datetime]").each((_, el) => {
    const dt = $(el).attr("datetime");
    if (dt) dateTimes.push(dt);
  });
  if (dateTimes.length >= 1) result.startDate = dateTimes[0];
  if (dateTimes.length >= 2) result.endDate = dateTimes[1];

  // 2. Heading tags for event name
  const h1 = $("h1").first().text().trim();
  if (h1) {
    result.name = h1;
  } else {
    const h2 = $("h2").first().text().trim();
    if (h2) result.name = h2;
  }

  // 3. Common CMS field classes

  // Drupal
  const drupalVenue = $(".field--name-field-event-venue").first().text().trim();
  if (drupalVenue) {
    result.location = result.location || {};
    result.location.name = drupalVenue;
  }

  const drupalLocation = $(".field--name-field-event-location, .field--name-field-location").first().text().trim();
  if (drupalLocation) {
    result.location = result.location || {};
    if (!result.location.address) result.location.address = drupalLocation;
  }

  // WordPress (The Events Calendar & common patterns)
  const wpVenue = $(".tribe-venue, .event-venue, .venue-name, .tribe-venue-name").first().text().trim();
  if (wpVenue && !result.location?.name) {
    result.location = result.location || {};
    result.location.name = wpVenue;
  }

  const wpAddress = $(".tribe-venue-address, .tribe-street-address, .event-address, .venue-address").first().text().trim();
  if (wpAddress && !result.location?.address) {
    result.location = result.location || {};
    result.location.address = wpAddress;
  }

  // Squarespace
  const sqDate = $(".eventitem-column-date, .event-date").first().text().trim();
  if (sqDate && !result.startDate) result.startDate = sqDate;

  const sqLocation = $(".eventitem-column-location, .event-location").first().text().trim();
  if (sqLocation && !result.location?.name) {
    result.location = result.location || {};
    result.location.name = sqLocation;
  }

  // <address> elements
  const addressEl = $("address").first().text().trim();
  if (addressEl && !result.location?.address) {
    result.location = result.location || {};
    result.location.address = addressEl;
  }

  // 4. Description from common content patterns
  if (!result.description) {
    const descSelectors = [
      ".event-description",
      ".event-content",
      ".event-details",
      ".tribe-events-single-event-description",
      '[itemprop="description"]',
      "article p",
    ];

    for (const selector of descSelectors) {
      const el = $(selector).first();
      const text = el.text().trim();
      if (text && text.length > 20) {
        result.description = text.substring(0, 2000);
        break;
      }
    }
  }

  // 5. Structured <dl> with dt/dd pairs for labeled fields
  $("dl").each((_, dl) => {
    $(dl).find("dt").each((_, dt) => {
      const label = $(dt).text().trim().toLowerCase();
      const value = $(dt).next("dd").text().trim();
      if (!value) return;

      if (/\b(date|when|time|starts?)\b/.test(label) && !result.startDate) {
        result.startDate = value;
      } else if (/\b(end|ends|until)\b/.test(label) && !result.endDate) {
        result.endDate = value;
      } else if (/\b(location|where|venue|place|address)\b/.test(label) && !result.location?.name) {
        result.location = result.location || {};
        result.location.name = value;
      }
    });
  });

  // 6. List items and spans with "Label: Value" patterns
  $("li, .detail-item, .event-meta-item, .event-info-item").each((_, el) => {
    const text = $(el).text().trim();
    const labelMatch = text.match(
      /^(date|time|when|starts?|location|where|venue|place|address)\s*[:：]\s*(.+)/i
    );
    if (!labelMatch) return;
    const [, label, value] = labelMatch;
    const lowerLabel = label.toLowerCase();

    if (/^(date|time|when|starts?)$/.test(lowerLabel) && !result.startDate) {
      result.startDate = value.trim();
    } else if (/^(location|where|venue|place|address)$/.test(lowerLabel) && !result.location?.name) {
      result.location = result.location || {};
      result.location.name = value.trim();
    }
  });

  return result;
}

function hasMinimumData(data: NormalizedEventData): boolean {
  return Boolean(data.name && data.startDate);
}

function mergeEventData(...layers: NormalizedEventData[]): NormalizedEventData {
  const result: NormalizedEventData = {};

  for (const layer of layers) {
    if (!result.name && layer.name) result.name = layer.name;
    if (!result.description && layer.description) result.description = layer.description;
    if (!result.startDate && layer.startDate) result.startDate = layer.startDate;
    if (!result.endDate && layer.endDate) result.endDate = layer.endDate;
    if (!result.image && layer.image) result.image = layer.image;
    if (!result.url && layer.url) result.url = layer.url;
    if (!result.eventFormat && layer.eventFormat) result.eventFormat = layer.eventFormat;

    if (layer.location) {
      result.location = result.location || {};
      if (!result.location.name && layer.location.name) result.location.name = layer.location.name;
      if (!result.location.address && layer.location.address) result.location.address = layer.location.address;
      if (!result.location.city && layer.location.city) result.location.city = layer.location.city;
      if (!result.location.postalCode && layer.location.postalCode) result.location.postalCode = layer.location.postalCode;
      if (result.location.latitude == null && layer.location.latitude != null) result.location.latitude = layer.location.latitude;
      if (result.location.longitude == null && layer.location.longitude != null) result.location.longitude = layer.location.longitude;
    }
  }

  return result;
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
    const $ = cheerio.load(html);

    // Layer 1: JSON-LD (highest fidelity)
    const jsonLd = extractJsonLd(html);
    const jsonLdResult = normalizeEventData(jsonLd || {}, {}, url);

    // Layer 2: OG meta tags (always run — cheap and fills gaps like image)
    const ogResult = extractOgTags($);

    // Merge JSON-LD + OG so far
    let merged = mergeEventData(jsonLdResult, ogResult);

    // Layer 3: DOM parsing (only if we still lack name + date)
    if (!hasMinimumData(merged)) {
      const domResult = extractFromDom($);
      merged = mergeEventData(merged, domResult);
    }

    // Ensure URL is always set
    if (!merged.url) merged.url = url;

    return NextResponse.json(merged);
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
