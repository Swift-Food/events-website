"use client";

import { useState, useEffect } from "react";
import { locationsApi } from "@/services/locations";
import { EventLocationResponseDto } from "@/types/location";
import Link from "next/link";
import { MapPin } from "lucide-react";

export default function BrowseByLocation() {
  const [locations, setLocations] = useState<EventLocationResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const data = await locationsApi.findAll();
        setLocations(data);
      } catch (err) {
        console.error("Failed to fetch locations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  if (!loading && locations.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-4 discover-section-header">
        Browse by Location
      </h2>

      {loading ? (
        <div className="flex gap-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-9 w-28 flex-shrink-0 rounded-full skeleton-shimmer"
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto pb-2 -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex gap-2 flex-wrap sm:flex-wrap">
            {locations.map((location) => (
              <Link
                key={location.id}
                href={`/locations/${location.id}`}
                className="inline-flex flex-col items-start gap-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground transition-colors hover:bg-white/10 hover:border-white/20 flex-shrink-0"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{location.name}</span>
                </div>
                <span className="text-muted-foreground text-xs pl-[calc(0.875rem+0.5rem)]">
                  {location.eventCount} {location.eventCount === 1 ? "Event" : "Events"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
