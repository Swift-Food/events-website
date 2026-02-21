import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { EventLocationResponseDto } from "@/types/location";

interface SquareLocationCardProps {
  location: EventLocationResponseDto;
  size?: number;
}

export default function SquareLocationCard({ location, size }: SquareLocationCardProps) {
  const eventCount = location.eventCount ?? 0;

  return (
    <Link
      href={`/locations/${location.id}`}
      className={`group relative block overflow-hidden rounded-2xl ${!size ? "w-full aspect-square" : ""}`}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Background Image or Fallback */}
      {location.image ? (
        <Image
          src={location.image}
          alt={location.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
          <MapPin className="h-12 w-12 text-white/30" />
        </div>
      )}

      {/* Gradient Overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[60%]"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
        }}
      />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="text-white text-base font-semibold line-clamp-2">
          {location.name}
        </h3>
        <p className="text-white/70 text-sm mt-0.5">
          {eventCount} event{eventCount !== 1 ? "s" : ""}
        </p>
      </div>
    </Link>
  );
}
