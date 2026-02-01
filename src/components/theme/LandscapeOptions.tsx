"use client";

import Image from "next/image";
import { LANDSCAPE_OPTIONS } from "@/lib/theme-presets";

interface LandscapeOptionsProps {
  selected?: string;
  opacity?: number;
  onChange: (image: string, opacity: number) => void;
}

export default function LandscapeOptions({
  selected,
  opacity = 0.4,
  onChange,
}: LandscapeOptionsProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-widest font-medium text-muted-foreground/60">
        Landscape
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {LANDSCAPE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id, opacity)}
            className={`relative shrink-0 w-20 h-14 rounded-lg overflow-hidden transition-all ${
              selected === opt.id
                ? "ring-2 ring-primary/60"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            <Image
              src={`/Landscape theme/${opt.filename}`}
              alt={opt.name}
              fill
              className="object-cover"
              sizes="80px"
            />
            <span className="absolute bottom-0 inset-x-0 bg-black/50 text-[10px] text-white text-center py-0.5">
              {opt.name}
            </span>
          </button>
        ))}
      </div>

      {/* Opacity slider */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground w-14 shrink-0">
          Opacity
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(opacity * 100)}
          onChange={(e) =>
            onChange(selected ?? "ocean", Number(e.target.value) / 100)
          }
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground w-8 text-right">
          {Math.round(opacity * 100)}%
        </span>
      </div>
    </div>
  );
}
