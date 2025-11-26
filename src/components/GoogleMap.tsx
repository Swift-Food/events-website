"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { loadGoogleMapsScript } from "@/utils/google-maps-loader";

interface GoogleMapProps {
  latitude?: number;
  longitude?: number;
  title?: string;
  className?: string;
}

export default function GoogleMap({
  latitude,
  longitude,
  title = "Event Location",
  className = "",
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  // Check if coordinates are valid - memoized to avoid recalculating on every render
  const hasValidCoordinates = useMemo(() => {
    if (latitude === undefined || longitude === undefined) {
      console.log("[GoogleMap] No coordinates provided");
      return false;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      console.log("[GoogleMap] Invalid coordinates (NaN)");
      return false;
    }

    // Check for 0,0 (often a default/invalid value)
    if (lat === 0 && lng === 0) {
      console.log("[GoogleMap] Invalid coordinates (0, 0)");
      return false;
    }

    return true;
  }, [latitude, longitude]);

  useEffect(() => {
    const initMap = async () => {
      try {
        // Validate coordinates first
        if (!hasValidCoordinates) {
          setIsLoading(false);
          return;
        }

        const lat = Number(latitude);
        const lng = Number(longitude);

        console.log("[GoogleMap] Initializing map with coordinates:", {
          latitude: lat,
          longitude: lng,
        });

        // Load Google Maps script
        await loadGoogleMapsScript();
        console.log("[GoogleMap] Google Maps script loaded successfully");

        // Wait a bit for the ref to be attached
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (!mapRef.current) {
          console.log("[GoogleMap] Map ref not available");
          setIsLoading(false);
          return;
        }

        // Create the map
        await createMap(lat, lng);
        console.log("[GoogleMap] Map created successfully");
        setIsLoading(false);
      } catch (err) {
        console.error("[GoogleMap] Failed to load Google Maps:", err);
        setError("Failed to load map");
        setIsLoading(false);
      }
    };

    const createMap = async (lat: number, lng: number) => {
      if (!mapRef.current) return;

      // Create map (default to 0,0 if coordinates not provided)
      const mapOptions: google.maps.MapOptions = {
        center: { lat: latitude ?? 0, lng: longitude ?? 0 },
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: "all",
            elementType: "geometry",
            stylers: [{ color: "#242f3e" }],
          },
          {
            featureType: "all",
            elementType: "labels.text.stroke",
            stylers: [{ color: "#242f3e" }],
          },
          {
            featureType: "all",
            elementType: "labels.text.fill",
            stylers: [{ color: "#746855" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#17263c" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#38414e" }],
          },
          {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#212a37" }],
          },
          {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9ca5b3" }],
          },
          {
            featureType: "poi",
            elementType: "geometry",
            stylers: [{ color: "#283d6a" }],
          },
          {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#263c3f" }],
          },
          {
            featureType: "transit",
            elementType: "geometry",
            stylers: [{ color: "#2f3948" }],
          },
        ],
      };

      const map = new google.maps.Map(mapRef.current, mapOptions);
      mapInstanceRef.current = map;

      // Create marker
      const marker = new google.maps.Marker({
        position: { lat: latitude ?? 0, lng: longitude ?? 0 },
        map,
        title,
        animation: google.maps.Animation.DROP,
      });
      markerRef.current = marker;

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="color: #000; font-weight: 500; padding: 4px;">${title}</div>`,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });
    };

    initMap();

    // Cleanup
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [latitude, longitude, title]);

  // Don't render if no valid coordinates
  if (!hasValidCoordinates) {
    return null;
  }

  // Show error state
  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-white/10 bg-card-background ${className}`}
      >
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      <div ref={mapRef} className="h-full w-full" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-white/10 bg-card-background">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}
