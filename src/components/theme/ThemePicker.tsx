"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import type { EventThemeConfig, BackgroundType } from "@/types/event/theme";
import {
  SINGLE_COLOR_PALETTES,
  MULTI_COLOR_PALETTES,
  SHADER_PRESETS,
  LANDSCAPE_OPTIONS,
  PATTERN_OPTIONS,
  PALETTE_MAP,
} from "@/lib/theme-presets";

interface ThemePickerProps {
  theme: EventThemeConfig;
  onChange: (theme: EventThemeConfig) => void;
  isOpen: boolean;
  onToggle: () => void;
}

type MobileTab = "base" | "palette" | "details";

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
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>("base");
  const scrollRef = useRef<HTMLDivElement>(null);
  const page0Ref = useRef<HTMLDivElement>(null);
  const page1Ref = useRef<HTMLDivElement>(null);

  const handleTypeChange = (type: BackgroundType) => {
    const updated: EventThemeConfig = { ...theme, type };
    if (type === "landscape" && !updated.image) {
      updated.image = "ocean";
      updated.imageOpacity = 0.4;
    }
    if (type === "shader" && !updated.shaderPreset) {
      updated.shaderPreset = "unicorn";
    }
    if (type === "pattern" && !updated.pattern) {
      updated.pattern = "dots";
    }
    onChange(updated);
    // If switching to solid and on details tab, move to base
    if (type === "solid" && activeMobileTab === "details") {
      setActiveMobileTab("base");
    }
    // If switching to shader and on palette tab, move to base
    if (type === "shader" && activeMobileTab === "palette") {
      setActiveMobileTab("base");
    }
  };

  // Scroll to page when dot is tapped
  const scrollToPage = (page: 0 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: page * el.clientWidth, behavior: "smooth" });
  };

  const isPaletteDisabled = theme.type === "shader";

  // Track which page is visible using IntersectionObserver
  useEffect(() => {
    const container = scrollRef.current;
    const p0 = page0Ref.current;
    const p1 = page1Ref.current;
    if (!container || !p0 || !p1) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            setPalettePage(entry.target === p0 ? 0 : 1);
          }
        }
      },
      { root: container, threshold: 0.5 }
    );

    observer.observe(p0);
    observer.observe(p1);
    return () => observer.disconnect();
  }, [isOpen, activeMobileTab, isPaletteDisabled]);

  const currentPalette = (PALETTE_MAP[theme.colorPalette] ?? PALETTE_MAP["default"]).palette;

  // Derive a darker, saturated shade from the page background for pattern previews
  const getPatternColor = () => {
    const m = currentPalette.pageBackground.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
    if (!m) return "rgba(0,0,0,0.2)";
    let r = Number(m[1]), g = Number(m[2]), b = Number(m[3]);
    // Convert to HSL to darken while preserving hue/saturation
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    // Darken: reduce lightness, boost saturation
    const newL = Math.max(l * 0.45, 0.08);
    const newS = Math.min(s * 1.4, 1);
    // HSL to RGB
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q2 = newL < 0.5 ? newL * (1 + newS) : newL + newS - newL * newS;
    const p2 = 2 * newL - q2;
    const rr = Math.round(hue2rgb(p2, q2, h + 1/3) * 255);
    const gg = Math.round(hue2rgb(p2, q2, h) * 255);
    const bb = Math.round(hue2rgb(p2, q2, h - 1/3) * 255);
    return `rgba(${rr}, ${gg}, ${bb}, 0.45)`;
  };

  // Returns { backgroundImage, backgroundSize } for seamless tiling in preview squares
  const getPatternPreviewBg = (patternId: string): { backgroundImage: string; backgroundSize: string } => {
    const c = getPatternColor();
    const encode = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    switch (patternId) {
      case "dots":
        // Staggered dots: 2 dots per tile (one top-left, one center), tiles 6x6
        return {
          backgroundImage: encode(`<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'><circle cx='5' cy='5' r='2.5' fill='${c}'/><circle cx='15' cy='15' r='2.5' fill='${c}'/></svg>`),
          backgroundSize: "16.666% 16.666%",
        };
      case "grid":
        // Lines on right and bottom edges, tiles 4x4
        return {
          backgroundImage: encode(`<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'><path d='M10 0V10H0' fill='none' stroke='${c}' stroke-width='0.5'/></svg>`),
          backgroundSize: "25% 25%",
        };
      case "stripes":
        // Vertical stripe centered, tiles 5 across
        return {
          backgroundImage: encode(`<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'><rect x='3' y='0' width='4' height='10' fill='${c}'/></svg>`),
          backgroundSize: "20% 20%",
        };
      case "checkers": {
        // 2x2 checker per tile, tiles 4x4 (8 squares across)
        const m2 = currentPalette.pageBackground.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
        const c2 = m2
          ? `rgba(${Math.round(Number(m2[1]) * 0.88)}, ${Math.round(Number(m2[2]) * 0.88)}, ${Math.round(Number(m2[3]) * 0.88)}, 1)`
          : currentPalette.cardBackground;
        return {
          backgroundImage: encode(`<svg xmlns='http://www.w3.org/2000/svg' width='2' height='2' viewBox='0 0 2 2'><rect x='0' y='0' width='1' height='1' fill='${c}'/><rect x='1' y='1' width='1' height='1' fill='${c}'/><rect x='1' y='0' width='1' height='1' fill='${c2}'/><rect x='0' y='1' width='1' height='1' fill='${c2}'/></svg>`),
          backgroundSize: "25% 25%",
        };
      }
      case "crosses":
        // Staggered crosses: 2 per tile offset, tiles 3x3
        return {
          backgroundImage: encode(`<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><path d='M13 9L17 9L17 13L21 13L21 17L17 17L17 21L13 21L13 17L9 17L9 13L13 13Z' fill='${c}'/><path d='M43 39L47 39L47 43L51 43L51 47L47 47L47 51L43 51L43 47L39 47L39 43L43 43Z' fill='${c}'/></svg>`),
          backgroundSize: "33.333% 33.333%",
        };
      default:
        return { backgroundImage: "none", backgroundSize: "auto" };
    }
  };

  // Background type preview thumbnails
  const getBgPreview = (type: BackgroundType) => {
    switch (type) {
      case "solid":
        // Meadow palette preview
        return (
          <div className="w-full h-full flex">
            <div className="flex-1" style={{ backgroundColor: "#0e8622" }} />
            <div className="flex-1" style={{ backgroundColor: "#cee29a" }} />
            <div className="flex-1" style={{ backgroundColor: "#ddf2eb" }} />
          </div>
        );
      case "landscape":
        // Lake image
        return (
          <Image
            src="/Landscape theme/Lake.jpg"
            alt="Landscape"
            fill
            className="object-cover"
            sizes="120px"
          />
        );
      case "shader":
        // Unicorn shader colors
        return (
          <div
            className="w-full h-full"
            style={{
              background: "linear-gradient(135deg, #b8e7f5 0%, #d9ccff 50%, #faf9f6 100%)",
            }}
          />
        );
      case "pattern":
        // Crosses pattern on Desert palette background
        return (
          <div
            className="w-full h-full"
            style={{
              backgroundColor: "#ffe9bd",
              backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
                "<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><path d='M13 9 L17 9 L17 13 L21 13 L21 17 L17 17 L17 21 L13 21 L13 17 L9 17 L9 13 L13 13 Z' fill='rgba(255,109,42,0.35)'/><path d='M43 39 L47 39 L47 43 L51 43 L51 47 L47 47 L47 51 L43 51 L43 47 L39 47 L39 43 L43 43 Z' fill='rgba(255,109,42,0.35)'/></svg>"
              )}")`,
              backgroundRepeat: "repeat",
            }}
          />
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end pointer-events-none">
      {/* Invisible backdrop for click-to-close */}
      <div
        className="absolute inset-0 pointer-events-auto"
        onClick={onToggle}
      />

      {/* Customizer Tray */}
      <div
        className="relative w-full max-h-[60vh] overflow-y-auto bg-black/60 backdrop-blur-md border-t border-white/10 rounded-t-[2.0rem] lg:rounded-t-[2rem] pointer-events-auto"
        style={{
          animation: "themePickerSlideUp 500ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        <style jsx>{`
          @keyframes themePickerSlideUp {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }
        `}</style>

        <div className="max-w-[1800px] mx-auto p-4 lg:p-6 xl:p-8 pb-6">
          {/* Header */}
          {/* <div className="flex items-center justify-between mb-4 lg:mb-6">
            <div>
              <h2 className="text-[10px] lg:text-[11px] font-black uppercase tracking-[0.4em] text-zinc-300 mb-1">
                Customizer
              </h2>
              <div className="h-0.5 lg:h-1 w-12 bg-white/20 rounded-full" />
            </div>
            <button
              type="button"
              onClick={onToggle}
              className="p-2 lg:p-3 rounded-full hover:bg-white/5 transition-colors group"
            >
              <X className="w-5 h-5 text-zinc-300 group-hover:text-white transition-colors" />
            </button>
          </div> */}

          {/* Mobile Tab Buttons */}
          <div className="flex gap-2 mb-4 lg:hidden">
            {([
              { key: "base" as MobileTab, label: "Base" },
              { key: "palette" as MobileTab, label: "Palette", disabled: isPaletteDisabled },
              { key: "details" as MobileTab, label: "Style", disabled: theme.type === "solid" },
            ]).map(({ key, label, disabled }) => (
              <button
                key={key}
                type="button"
                onClick={() => !disabled && setActiveMobileTab(key)}
                disabled={disabled}
                className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                  disabled
                    ? "opacity-20 cursor-not-allowed text-zinc-500"
                    : activeMobileTab === key
                    ? "bg-white text-zinc-950"
                    : "bg-white/10 text-zinc-300 hover:bg-white/15"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Content: 3-column grid on desktop, tabbed on mobile */}
          <div className={`lg:grid ${isPaletteDisabled ? "lg:grid-cols-[220px_1fr]" : "lg:grid-cols-[220px_1fr_1.5fr]"} gap-8 xl:gap-12 items-start`}>
            {/* Column 1: Base Style Selection */}
            <div
              className={`${
                activeMobileTab === "base" ? "block" : "hidden"
              } lg:block space-y-3`}
            >
              <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em] block mb-3">
                Base Style
              </label>
              <div className="grid grid-cols-4 lg:grid-cols-2 gap-3">
                {BG_TYPES.map(({ type, label }) => {
                  const isActive = theme.type === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleTypeChange(type)}
                      className="flex flex-col items-center gap-1.5 lg:gap-2.5 group w-full"
                    >
                      <div
                        className={`relative w-full aspect-[4/3] rounded-xl lg:rounded-[1.5rem] overflow-hidden border-2 transition-all duration-300 ${
                          isActive
                            ? "border-white ring-2 lg:ring-8 ring-white/5 shadow-2xl scale-105 z-10"
                            : "border-white/5 hover:border-white/10"
                        }`}
                      >
                        {getBgPreview(type)}
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-widest ${
                          isActive
                            ? "text-white"
                            : "text-zinc-400 group-hover:text-zinc-200"
                        }`}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Color Palette Selection (hidden for shader) */}
            <div
              className={`${
                isPaletteDisabled
                  ? "hidden"
                  : activeMobileTab === "palette"
                  ? "block"
                  : "hidden"
              } ${isPaletteDisabled ? "lg:hidden" : "lg:block"} space-y-3 lg:border-l lg:border-white/5 lg:pl-8`}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em] transition-opacity duration-300">
                    {palettePage === 0 ? "Monotone" : "Themes"} Palette
                  </label>
                </div>

                <div
                  ref={scrollRef}
                  className="flex overflow-x-auto snap-x snap-mandatory"
                  style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    WebkitOverflowScrolling: "touch",
                    scrollBehavior: "smooth",
                  }}
                >
                  {/* Page 1: Monotone */}
                  <div ref={page0Ref} className="min-w-full snap-start px-4 lg:px-6">
                    <div className="grid grid-cols-4 grid-rows-2 gap-y-4 gap-x-4 py-4 lg:py-6">
                      {SINGLE_COLOR_PALETTES.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() =>
                            onChange({ ...theme, colorPalette: preset.id })
                          }
                          className="flex flex-col items-center gap-1.5 transition-all hover:scale-110 active:scale-95 mx-auto"
                        >
                          <div
                            className={`w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center p-0.5 border-2 transition-all ${
                              theme.colorPalette === preset.id
                                ? "border-white ring-4 lg:ring-8 ring-white/10"
                                : "border-transparent"
                            }`}
                          >
                            <div className="w-full h-full rounded-full overflow-hidden flex transform -rotate-45 shadow-inner">
                              {preset.colors.map((color, i) => (
                                <div
                                  key={i}
                                  className="flex-1 h-full"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </div>
                          <span className={`text-[10px] truncate w-14 text-center ${
                            theme.colorPalette === preset.id ? "text-white font-semibold" : "text-zinc-400"
                          }`}>
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Page 2: Themes */}
                  <div ref={page1Ref} className="min-w-full snap-start px-4 lg:px-6">
                    <div className="grid grid-cols-4 grid-rows-2 gap-y-4 gap-x-4 py-4 lg:py-6">
                      {MULTI_COLOR_PALETTES.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() =>
                            onChange({ ...theme, colorPalette: preset.id })
                          }
                          className="flex flex-col items-center gap-1.5 transition-all hover:scale-110 active:scale-95 mx-auto"
                        >
                          <div
                            className={`w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center p-0.5 border-2 transition-all ${
                              theme.colorPalette === preset.id
                                ? "border-white ring-4 lg:ring-8 ring-white/10"
                                : "border-transparent"
                            }`}
                          >
                            <div className="w-full h-full rounded-full overflow-hidden flex transform -rotate-45 shadow-inner">
                              {preset.colors.map((color, i) => (
                                <div
                                  key={i}
                                  className="flex-1 h-full"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </div>
                          <span className={`text-[10px] truncate w-14 text-center ${
                            theme.colorPalette === preset.id ? "text-white font-semibold" : "text-zinc-400"
                          }`}>
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Page dots */}
                <div className="flex justify-center gap-3 mt-6">
                  {[0, 1].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => scrollToPage(p as 0 | 1)}
                      className={`h-2 rounded-full transition-all duration-500 ease-out ${
                        palettePage === p
                          ? "w-10 bg-white"
                          : "w-3 bg-zinc-400 hover:bg-zinc-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Column 3: Detail Style Options */}
            <div
              className={`${
                activeMobileTab === "details" ? "block" : "hidden"
              } lg:block space-y-3 lg:border-l lg:border-white/5 lg:pl-8`}
            >
              <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em] block mb-3">
                {theme.type === "solid"
                  ? "Solid Detail"
                  : `${theme.type.charAt(0).toUpperCase() + theme.type.slice(1)} Styles`}
              </label>

              <div className="min-h-[180px]">
                {/* Landscape options */}
                {theme.type === "landscape" && (
                  <div className="grid grid-cols-3 gap-3">
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
                        className="flex flex-col items-center gap-1.5 group"
                      >
                        <div
                          className={`relative w-full aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all ${
                            theme.image === opt.id
                              ? "border-white shadow-2xl scale-105 z-10 ring-4 ring-white/10"
                              : "border-white/5 opacity-50 group-hover:opacity-100"
                          }`}
                        >
                          <Image
                            src={`/Landscape theme/${opt.filename}`}
                            alt={opt.name}
                            fill
                            className="object-cover"
                            sizes="100px"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${
                          theme.image === opt.id ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                        }`}>
                          {opt.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Shader options */}
                {theme.type === "shader" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {SHADER_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() =>
                          onChange({ ...theme, shaderPreset: preset.id })
                        }
                        className={`px-4 lg:px-6 py-3 lg:py-4 rounded-[1.25rem] lg:rounded-[1.5rem] border text-[11px] lg:text-[12px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-between group h-16 lg:h-18 ${
                          theme.shaderPreset === preset.id
                            ? "bg-white text-zinc-950 border-white shadow-2xl ring-4 lg:ring-8 ring-white/5"
                            : "bg-white/5 border-white/5 text-zinc-300 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {preset.name}
                        <div className="flex -space-x-2 lg:-space-x-3">
                          {[preset.color1, preset.color2, preset.color3].map(
                            (c, i) => (
                              <div
                                key={i}
                                className="w-6 h-6 lg:w-8 lg:h-8 rounded-full shadow-lg"
                                style={{
                                  backgroundColor: c,
                                  zIndex: 3 - i,
                                }}
                              />
                            )
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Pattern options */}
                {theme.type === "pattern" && (
                  <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-3 gap-3">
                    {PATTERN_OPTIONS.map((opt) => {
                      const isActive = theme.pattern === opt.id;
                      const patternStyle = getPatternPreviewBg(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => onChange({ ...theme, pattern: opt.id })}
                          className="flex flex-col items-center gap-1.5 group"
                        >
                          <div
                            className={`relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                              isActive
                                ? "border-white shadow-2xl scale-105 z-10 ring-4 ring-white/10"
                                : "border-white/10 opacity-60 group-hover:opacity-100"
                            }`}
                            style={{
                              backgroundColor: currentPalette.pageBackground,
                              backgroundImage: patternStyle.backgroundImage,
                              backgroundSize: patternStyle.backgroundSize,
                              backgroundRepeat: "repeat",
                            }}
                          />
                          <span className={`text-[9px] font-bold uppercase tracking-widest ${
                            isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                          }`}>
                            {opt.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Solid - empty state */}
                {theme.type === "solid" && (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4 lg:p-6 bg-white/5 rounded-[1.5rem] lg:rounded-[2rem] border border-dashed border-white/10">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-white/5 flex items-center justify-center mb-3 border border-white/5 shadow-inner">
                      <svg
                        className="w-6 h-6 lg:w-8 lg:h-8 text-zinc-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    </div>
                    <p className="text-[10px] lg:text-xs text-zinc-300 font-bold uppercase tracking-[0.3em]">
                      Pure Color Active
                    </p>
                    <p className="hidden lg:block text-[11px] text-zinc-400 mt-3 max-w-[200px] leading-relaxed">
                      Solid backgrounds are minimalist and focus entirely on your
                      content.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
