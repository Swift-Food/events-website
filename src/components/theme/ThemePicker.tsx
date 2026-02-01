"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Palette } from "lucide-react";
import type { EventThemeConfig, BackgroundType } from "@/types/event/theme";
import {
  SINGLE_COLOR_PALETTES,
  MULTI_COLOR_PALETTES,
  PALETTE_MAP,
} from "@/lib/theme-presets";
import LandscapeOptions from "./LandscapeOptions";
import ShaderOptions from "./ShaderOptions";
import PatternOptions from "./PatternOptions";

interface ThemePickerProps {
  theme: EventThemeConfig;
  onChange: (theme: EventThemeConfig) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const BACKGROUND_TYPES: { type: BackgroundType; label: string; emoji: string }[] = [
  { type: "solid", label: "Solid", emoji: "🎨" },
  { type: "landscape", label: "Landscape", emoji: "🏔️" },
  { type: "shader", label: "Shader", emoji: "✨" },
  { type: "pattern", label: "Pattern", emoji: "🔲" },
];

export default function ThemePicker({
  theme,
  onChange,
  isOpen,
  onToggle,
}: ThemePickerProps) {
  const [paletteTab, setPaletteTab] = useState<"single" | "multi">("single");
  const currentPalette = PALETTE_MAP[theme.colorPalette];

  const handleTypeChange = (type: BackgroundType) => {
    const updated: EventThemeConfig = { ...theme, type };
    // Set sensible defaults when switching type
    if (type === "landscape" && !updated.image) {
      updated.image = "ocean";
      updated.imageOpacity = 0.4;
    }
    if (type === "shader" && !updated.shaderPreset) {
      updated.shaderPreset = "aurora";
    }
    if (type === "pattern" && !updated.pattern) {
      updated.pattern = "dots";
    }
    onChange(updated);
  };

  const handlePaletteChange = (paletteId: string) => {
    onChange({ ...theme, colorPalette: paletteId });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300"
      style={{ transform: isOpen ? "translateY(0)" : "translateY(100%)" }}
    >
      {/* Toggle button - always visible above the panel */}
      <button
        type="button"
        onClick={onToggle}
        className="mx-auto flex items-center gap-2 rounded-t-xl bg-card-background/80 backdrop-blur-md px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card-background/90"
        style={{ marginBottom: "-1px" }}
      >
        <Palette className="h-4 w-4" />
        <span>Theme</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronUp className="h-4 w-4" />
        )}
      </button>

      {/* Panel body */}
      <div className="bg-card-background/80 backdrop-blur-md border-t border-foreground/10 max-h-[70vh] overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-5 space-y-5">
          {/* Background type selector */}
          <div>
            <p className="text-xs uppercase tracking-widest font-medium text-muted-foreground/60 mb-3">
              Background
            </p>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {BACKGROUND_TYPES.map(({ type, label, emoji }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeChange(type)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl px-5 py-3 text-sm font-medium transition-all shrink-0 ${
                    theme.type === type
                      ? "bg-primary/20 text-primary ring-2 ring-primary/40"
                      : "bg-card-secondary-background text-muted-foreground hover:bg-card-secondary-background/80"
                  }`}
                >
                  <span className="text-lg">{emoji}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Type-specific options */}
          {theme.type === "landscape" && (
            <LandscapeOptions
              selected={theme.image}
              opacity={theme.imageOpacity}
              onChange={(image, opacity) =>
                onChange({ ...theme, image, imageOpacity: opacity })
              }
            />
          )}
          {theme.type === "shader" && (
            <ShaderOptions
              selected={theme.shaderPreset}
              onChange={(presetId) =>
                onChange({ ...theme, shaderPreset: presetId })
              }
            />
          )}
          {theme.type === "pattern" && (
            <PatternOptions
              selected={theme.pattern}
              onChange={(pattern) => onChange({ ...theme, pattern })}
            />
          )}

          {/* Color palette picker */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <p className="text-xs uppercase tracking-widest font-medium text-muted-foreground/60">
                  Colour
                </p>
                {currentPalette && (
                  <span className="text-xs text-muted-foreground">
                    {currentPalette.name}
                  </span>
                )}
              </div>
              <div className="flex rounded-lg bg-card-secondary-background overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPaletteTab("single")}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    paletteTab === "single"
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Single
                </button>
                <button
                  type="button"
                  onClick={() => setPaletteTab("multi")}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    paletteTab === "multi"
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Multi
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {(paletteTab === "single"
                ? SINGLE_COLOR_PALETTES
                : MULTI_COLOR_PALETTES
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePaletteChange(preset.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all ${
                    theme.colorPalette === preset.id
                      ? "ring-2 ring-primary/60 bg-primary/10"
                      : "hover:bg-card-secondary-background/50"
                  }`}
                >
                  <div className="flex h-8 w-full rounded-lg overflow-hidden">
                    {preset.colors.map((color, i) => (
                      <div
                        key={i}
                        className="flex-1"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground truncate w-full text-center">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
