"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMapsScript } from "@/utils/google-maps-loader";

interface GoogleMapProps {
  lat: number;
  lng: number;
  title?: string;
  className?: string;
}

export default function GoogleMap({
  lat,
  lng,
  title = "Event Location",
  className = "",
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    const initMap = async () => {
      try {
        // Load Google Maps script
        await loadGoogleMapsScript();
        setIsLoaded(true);

        if (!mapRef.current) return;

        // Create map
        const mapOptions: google.maps.MapOptions = {
          center: { lat, lng },
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
          position: { lat, lng },
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
      } catch (err) {
        console.error("Failed to load Google Maps:", err);
        setError("Failed to load map");
      }
    };

    initMap();

    // Cleanup
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [lat, lng, title]);

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
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-card-background">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}
