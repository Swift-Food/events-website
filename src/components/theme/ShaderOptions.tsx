"use client";

import { SHADER_PRESETS } from "@/lib/theme-presets";

interface ShaderOptionsProps {
  selected?: string;
  onChange: (presetId: string) => void;
}

export default function ShaderOptions({
  selected,
  onChange,
}: ShaderOptionsProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-widest font-medium text-muted-foreground/60">
        Shader
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {SHADER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onChange(preset.id)}
            className={`flex flex-col items-center gap-1.5 shrink-0 rounded-xl p-3 transition-all ${
              selected === preset.id
                ? "ring-2 ring-primary/60 bg-primary/10"
                : "bg-card-secondary-background hover:bg-card-secondary-background/80"
            }`}
          >
            <div className="flex gap-1">
              {[preset.color1, preset.color2, preset.color3].map((c, i) => (
                <div
                  key={i}
                  className="h-6 w-6 rounded-full"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {preset.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
