"use client";

import { useState, useEffect } from "react";
import { locationsApi } from "@/services/locations";
import { EventLocationResponseDto } from "@/types/location";
import SquareLocationCard from "@/components/SquareLocationCard";

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="aspect-square skeleton-shimmer rounded-xl"
            />
          ))}
        </div>
      ) : (
        <>
          {/* Mobile: horizontal scroll */}
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {locations.map((location) => (
              <div key={location.id} className="flex-shrink-0 discover-card">
                <SquareLocationCard location={location} size={200} />
              </div>
            ))}
          </div>
          {/* Desktop: responsive grid */}
          <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {locations.map((location) => (
              <div key={location.id} className="discover-card">
                <SquareLocationCard location={location} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
