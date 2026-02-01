"use client";

import { PATTERN_OPTIONS, getPatternCSS, PALETTE_MAP } from "@/lib/theme-presets";

interface PatternOptionsProps {
  selected?: string;
  onChange: (pattern: string) => void;
}

// Neutral palette for preview thumbnails
const PREVIEW_PALETTE = PALETTE_MAP["default"].palette;

export default function PatternOptions({
  selected,
  onChange,
}: PatternOptionsProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-widest font-medium text-muted-foreground/60">
        Pattern
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {PATTERN_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`flex flex-col items-center gap-1.5 shrink-0 rounded-xl p-3 transition-all ${
              selected === opt.id
                ? "ring-2 ring-primary/60 bg-primary/10"
                : "bg-card-secondary-background hover:bg-card-secondary-background/80"
            }`}
          >
            <div
              className="h-12 w-12 rounded-lg"
              style={{
                backgroundColor: PREVIEW_PALETTE.pageBackground,
                backgroundImage: getPatternCSS(opt.id, PREVIEW_PALETTE),
                backgroundRepeat: "repeat",
              }}
            />
            <span className="text-xs text-muted-foreground">{opt.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
