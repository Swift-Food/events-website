import Link from "next/link";
import Image from "next/image";
import { Building2 } from "lucide-react";
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
      className="group flex min-h-[72px] w-full items-center gap-3 rounded-2xl p-2 transition-all duration-300 hover:translateY(-1px) hover:bg-white/[0.08]"
      style={size ? { width: size, minWidth: size } : undefined}
    >
      <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e84c67] transition-transform duration-300 group-hover:scale-105">
        {location.image ? (
          <Image
            src={location.image}
            alt={location.name}
            fill
            className="object-cover"
            sizes="44px"
          />
        ) : (
          <Building2 className="h-5 w-5 text-white" strokeWidth={2.1} />
        )}
      </div>

      <div className="min-w-0">
        <h3 className="truncate text-[0.95rem] font-semibold leading-none tracking-[-0.03em] text-white sm:text-[1.1rem]">
          {location.name}
        </h3>
        <p className="mt-1 text-sm font-medium tracking-[-0.02em] text-white/58 sm:text-[0.95rem]">
          {eventCount} Event{eventCount !== 1 ? "s" : ""}
        </p>
      </div>
    </Link>
  );
}
