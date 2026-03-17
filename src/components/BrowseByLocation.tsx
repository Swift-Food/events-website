"use client";

import { useState, useEffect } from "react";
import { continentsApi } from "@/services/locations";
import { EventContinentResponseDto } from "@/types/location";
import SquareLocationCard from "@/components/SquareLocationCard";

export default function BrowseByLocation() {
  const [continents, setContinents] = useState<EventContinentResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContinents = async () => {
      try {
        setLoading(true);
        const data = await continentsApi.findAll();
        setContinents(data.filter((c) => c.locations.length > 0));
      } catch (err) {
        console.error("Failed to fetch continents:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContinents();
  }, []);

  if (!loading && continents.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-4 discover-section-header">
        Browse by Location
      </h2>

      {loading ? (
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-[72px] rounded-lg skeleton-shimmer"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {continents.map((continent) => (
            <div key={continent.id}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {continent.name}
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
                {continent.locations.map((location) => (
                  <div key={location.id}>
                    <SquareLocationCard location={location} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
