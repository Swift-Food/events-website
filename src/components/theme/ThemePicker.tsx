"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import type { EventThemeConfig, BackgroundType } from "@/types/event/theme";
import {
  SINGLE_COLOR_PALETTES,
  MULTI_COLOR_PALETTES,
  PALETTE_MAP,
  SHADER_PRESETS,
  LANDSCAPE_OPTIONS,
  PATTERN_OPTIONS,
  getPatternCSS,
  parseColor,
} from "@/lib/theme-presets";

interface ThemePickerProps {
  theme: EventThemeConfig;
  onChange: (theme: EventThemeConfig) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const BG_TYPES: { type: BackgroundType; label: string }[] = [
  { type: "solid", label: "Solid" },
  { type: "landscape", label: "Landscape" },
  { type: "shader", label: "Shader" },
  { type: "pattern", label: "Pattern" },
];

export default function ThemePicker({
  theme,
  onChange,
  isOpen,
  onToggle,
}: ThemePickerProps) {
  const [palettePage, setPalettePage] = useState<0 | 1>(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleTypeChange = (type: BackgroundType) => {
    const updated: EventThemeConfig = { ...theme, type };
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

  const currentPalette = PALETTE_MAP[theme.colorPalette] ?? PALETTE_MAP["default"];

  // Sync scroll position to page indicator
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const page = el.scrollLeft > el.clientWidth * 0.5 ? 1 : 0;
    setPalettePage(page as 0 | 1);
  }, []);

  // Scroll to page when dot is tapped
  const scrollToPage = (page: 0 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: page * el.clientWidth, behavior: "smooth" });
  };

  // Snap scroll ref listener
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const paletteLabels = ["Monotone", "Themes"] as const;

  // Scrollable two-page colour row
  const renderPaletteRow = () => (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground shrink-0">
          {paletteLabels[palettePage]}
        </span>
        <div className="flex gap-1">
          {paletteLabels.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollToPage(i as 0 | 1)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                palettePage === i ? "bg-foreground" : "bg-foreground/25"
              }`}
              aria-label={paletteLabels[i]}
            />
          ))}
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
      >
        {/* Page 1: Monotone */}
        <div className="flex gap-2 shrink-0 w-full snap-start py-1 pr-2">
          {SINGLE_COLOR_PALETTES.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange({ ...theme, colorPalette: preset.id })}
              className={`flex flex-col items-center gap-1 shrink-0 rounded-lg p-1.5 transition-all ${
                theme.colorPalette === preset.id
                  ? "ring-2 ring-primary/60"
                  : "hover:bg-foreground/5"
              }`}
            >
              <div className="flex h-7 w-14 rounded overflow-hidden">
                {preset.colors.map((color, i) => (
                  <div
                    key={i}
                    className="flex-1"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground truncate w-14 text-center">
                {preset.name}
              </span>
            </button>
          ))}
        </div>
        {/* Page 2: Themes */}
        <div className="flex gap-2 shrink-0 w-full snap-start py-1 pr-2">
          {MULTI_COLOR_PALETTES.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange({ ...theme, colorPalette: preset.id })}
              className={`flex flex-col items-center gap-1 shrink-0 rounded-lg p-1.5 transition-all ${
                theme.colorPalette === preset.id
                  ? "ring-2 ring-primary/60"
                  : "hover:bg-foreground/5"
              }`}
            >
              <div className="flex h-7 w-14 rounded overflow-hidden">
                {preset.colors.map((color, i) => (
                  <div
                    key={i}
                    className="flex-1"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground truncate w-14 text-center">
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Backdrop overlay - closes picker on tap */}
      {isOpen && (
        <div
          className="fixed inset-0"
          style={{ zIndex: 39 }}
          onClick={onToggle}
        />
      )}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300"
        style={{ transform: isOpen ? "translateY(0)" : "translateY(100%)" }}
      >
      <div className="bg-white/35 backdrop-blur-md border-t border-white/10 rounded-t-2xl">
        {/* Drag handle */}
        <div
          className="mx-auto flex justify-center cursor-pointer pt-2 pb-1"
          onClick={onToggle}
        >
          <div className="w-10 h-1 rounded-full bg-foreground/30" />
        </div>
        {/* Background type tabs */}
        <div className="flex gap-1 px-4 py-2 overflow-x-auto border-b border-white/10">
          {BG_TYPES.map(({ type, label }) => (
            <button
              key={type}
              type="button"
              onClick={() => handleTypeChange(type)}
              className={`shrink-0 rounded-xl px-4 py-1.5 text-sm font-medium transition-all ${
                theme.type === type
                  ? "bg-foreground/15 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Options area */}
        <div className="px-4 py-3 space-y-3">
          {/* Type-specific options row */}
          {theme.type === "landscape" && (
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Landscape</span>
              <div className="flex gap-2 overflow-x-auto py-1">
                {LANDSCAPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...theme,
                        image: opt.id,
                        imageOpacity: theme.imageOpacity ?? 0.4,
                      })
                    }
                    className={`relative shrink-0 w-20 h-14 rounded-lg overflow-hidden transition-all ${
                      theme.image === opt.id
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
                    <span className="absolute bottom-0 inset-x-0 bg-black/50 text-[9px] text-white text-center py-0.5">
                      {opt.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {theme.type === "shader" && (
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Shader</span>
              <div className="flex gap-3 overflow-x-auto py-1">
                {SHADER_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      onChange({ ...theme, shaderPreset: preset.id })
                    }
                    className={`flex flex-col items-center gap-1.5 shrink-0 rounded-lg p-2 transition-all ${
                      theme.shaderPreset === preset.id
                        ? "ring-2 ring-primary/60"
                        : "hover:bg-foreground/5"
                    }`}
                  >
                    <div className="flex gap-0.5">
                      {[preset.color1, preset.color2, preset.color3].map(
                        (c, i) => (
                          <div
                            key={i}
                            className="h-6 w-6 rounded-full"
                            style={{ backgroundColor: c }}
                          />
                        )
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {theme.type === "pattern" && (
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Pattern</span>
              <div className="flex gap-2 overflow-x-auto py-1">
                {PATTERN_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChange({ ...theme, pattern: opt.id })}
                    className={`flex flex-col items-center gap-1 shrink-0 rounded-lg p-2 transition-all ${
                      theme.pattern === opt.id
                        ? "ring-2 ring-primary/60"
                        : "hover:bg-foreground/5"
                    }`}
                  >
                    <div
                      className="h-12 w-12 rounded"
                      style={{
                        backgroundColor: currentPalette.palette.pageBackground,
                        backgroundImage: (() => {
                          const { r, g, b } = parseColor(currentPalette.palette.mainTextColor);
                          return getPatternCSS(opt.id, {
                            ...currentPalette.palette,
                            mainTextColor: `rgba(${r}, ${g}, ${b}, 1)`,
                          });
                        })(),
                        backgroundRepeat: "repeat",
                      }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {opt.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Colour palette row - shown for all types except shader */}
          {theme.type !== "shader" && renderPaletteRow()}
        </div>
      </div>
    </div>
    </>
  );
}
