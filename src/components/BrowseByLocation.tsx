"use client";

import { useState, useEffect } from "react";
import { continentsApi } from "@/services/locations";
import { EventContinentResponseDto } from "@/types/location";
import SquareLocationCard from "@/components/SquareLocationCard";

const sortContinentsForDiscover = (
  continents: EventContinentResponseDto[]
) => {
  return [...continents].sort((a, b) => {
    const aIsEurope = a.name.trim().toLowerCase() === "europe";
    const bIsEurope = b.name.trim().toLowerCase() === "europe";

    if (aIsEurope && !bIsEurope) return -1;
    if (!aIsEurope && bIsEurope) return 1;

    return 0;
  });
};

export default function BrowseByLocation() {
  const [continents, setContinents] = useState<EventContinentResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeContinentId, setActiveContinentId] = useState<string | null>(null);

  useEffect(() => {
    const fetchContinents = async () => {
      try {
        setLoading(true);
        const data = await continentsApi.findAll();
        const populatedContinents = sortContinentsForDiscover(
          data.filter((c) => c.locations.length > 0)
        );
        setContinents(populatedContinents);
        setActiveContinentId((currentId) =>
          currentId && populatedContinents.some((continent) => continent.id === currentId)
            ? currentId
            : populatedContinents[0]?.id ?? null
        );
      } catch (err) {
        console.error("Failed to fetch continents:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContinents();
  }, []);

  if (!loading && continents.length === 0) return null;

  const activeContinent =
    continents.find((continent) => continent.id === activeContinentId) ??
    continents[0];

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-4 discover-section-header">
        Browse by Location
      </h2>

      {loading ? (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 w-28 flex-shrink-0 rounded-full skeleton-shimmer" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-[72px] rounded-lg skeleton-shimmer" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div
            className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            role="tablist"
            aria-label="Browse locations by region"
          >
            {continents.map((continent) => {
              const isActive = continent.id === activeContinent?.id;

              return (
                <button
                  key={continent.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveContinentId(continent.id)}
                  className={`flex-shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-white/20 bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.14)]"
                      : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  {continent.name}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
            {activeContinent?.locations.map((location) => (
              <div key={location.id}>
                <SquareLocationCard location={location} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
