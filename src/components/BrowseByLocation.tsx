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
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-[72px] rounded-lg skeleton-shimmer"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
            {locations.map((location) => (
              <div key={location.id}>
                <SquareLocationCard location={location} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
