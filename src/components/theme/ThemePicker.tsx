"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { X, Layers, Palette, Zap } from "lucide-react";
import type { EventThemeConfig, BackgroundType } from "@/types/event/theme";
import {
  SINGLE_COLOR_PALETTES,
  MULTI_COLOR_PALETTES,
  SHADER_PRESETS,
  LANDSCAPE_OPTIONS,
  PATTERN_OPTIONS,
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

  const isDetailsDisabled = theme.type === "solid";
  const isPaletteDisabled = theme.type === "shader";

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
        className="relative w-full bg-black/40 backdrop-blur-2xl border-t border-white/10 shadow-[0_-32px_64px_rgba(0,0,0,0.5)] overflow-hidden rounded-t-[2.5rem] md:rounded-t-[3rem] pointer-events-auto"
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

        <div className="max-w-[1800px] mx-auto p-6 md:p-10 lg:p-14 pb-28 md:pb-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <div>
              <h2 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-1">
                Customizer
              </h2>
              <div className="h-0.5 md:h-1 w-12 bg-white/20 rounded-full" />
            </div>
            <button
              type="button"
              onClick={onToggle}
              className="p-2 md:p-3 rounded-full hover:bg-white/5 transition-colors group"
            >
              <X className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
            </button>
          </div>

          {/* Content: 3-column grid on desktop, tabbed on mobile */}
          <div className={`md:grid ${isPaletteDisabled ? "md:grid-cols-[240px_1fr]" : "md:grid-cols-[240px_1fr_1.5fr]"} gap-16 lg:gap-24 items-start`}>
            {/* Column 1: Base Style Selection */}
            <div
              className={`${
                activeMobileTab === "base" ? "block" : "hidden"
              } md:block space-y-6`}
            >
              <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] block mb-4 md:mb-6">
                Base Style
              </label>
              <div className="grid grid-cols-2 gap-4">
                {BG_TYPES.map(({ type, label }) => {
                  const isActive = theme.type === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleTypeChange(type)}
                      className="flex flex-col items-center gap-2.5 group w-full"
                    >
                      <div
                        className={`relative w-full aspect-[4/3] rounded-[1.5rem] overflow-hidden border-2 transition-all duration-300 ${
                          isActive
                            ? "border-white ring-4 md:ring-8 ring-white/5 shadow-2xl scale-105 z-10"
                            : "border-white/5 hover:border-white/10"
                        }`}
                      >
                        {getBgPreview(type)}
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-widest ${
                          isActive
                            ? "text-white"
                            : "text-zinc-600 group-hover:text-zinc-400"
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
              } ${isPaletteDisabled ? "md:hidden" : "md:block"} space-y-6 md:border-l md:border-white/5 md:pl-16 overflow-hidden`}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] transition-opacity duration-300">
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
                  <div className="min-w-full snap-start px-1">
                    <div className="grid grid-cols-4 grid-rows-2 gap-y-6 gap-x-6 py-2">
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
                            className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center p-0.5 border-2 transition-all ${
                              theme.colorPalette === preset.id
                                ? "border-white ring-4 md:ring-8 ring-white/10"
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
                            theme.colorPalette === preset.id ? "text-white font-semibold" : "text-zinc-500"
                          }`}>
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Page 2: Themes */}
                  <div className="min-w-full snap-start px-1">
                    <div className="grid grid-cols-4 grid-rows-2 gap-y-6 gap-x-6 py-2">
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
                            className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center p-0.5 border-2 transition-all ${
                              theme.colorPalette === preset.id
                                ? "border-white ring-4 md:ring-8 ring-white/10"
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
                            theme.colorPalette === preset.id ? "text-white font-semibold" : "text-zinc-500"
                          }`}>
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Page dots */}
                <div className="flex justify-center gap-3 mt-12">
                  {[0, 1].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => scrollToPage(p as 0 | 1)}
                      className={`h-2 rounded-full transition-all duration-500 ease-out ${
                        palettePage === p
                          ? "w-10 bg-white"
                          : "w-2 bg-zinc-800 hover:bg-zinc-600"
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
              } md:block space-y-6 md:border-l md:border-white/5 md:pl-16`}
            >
              <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] block mb-6">
                {theme.type === "solid"
                  ? "Solid Detail"
                  : `${theme.type.charAt(0).toUpperCase() + theme.type.slice(1)} Styles`}
              </label>

              <div className="min-h-[220px]">
                {/* Landscape options */}
                {theme.type === "landscape" && (
                  <div className="grid grid-cols-3 gap-4">
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
                        className="flex flex-col items-center gap-2 group"
                      >
                        <div
                          className={`relative w-full aspect-square rounded-[1.5rem] overflow-hidden border-2 transition-all ${
                            theme.image === opt.id
                              ? "border-white shadow-2xl scale-105 z-10 ring-4 md:ring-8 ring-white/5"
                              : "border-white/5 opacity-40 group-hover:opacity-100"
                          }`}
                        >
                          <Image
                            src={`/Landscape theme/${opt.filename}`}
                            alt={opt.name}
                            fill
                            className="object-cover"
                            sizes="120px"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${
                          theme.image === opt.id ? "text-white" : "text-zinc-600 group-hover:text-zinc-400"
                        }`}>
                          {opt.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Shader options */}
                {theme.type === "shader" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {SHADER_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() =>
                          onChange({ ...theme, shaderPreset: preset.id })
                        }
                        className={`px-6 md:px-8 py-4 md:py-6 rounded-[1.5rem] md:rounded-[2rem] border text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-between group h-20 md:h-24 ${
                          theme.shaderPreset === preset.id
                            ? "bg-white text-zinc-950 border-white shadow-2xl ring-4 md:ring-8 ring-white/5"
                            : "bg-white/5 border-white/5 text-zinc-500 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {preset.name}
                        <div className="flex -space-x-2 md:-space-x-3">
                          {[preset.color1, preset.color2, preset.color3].map(
                            (c, i) => (
                              <div
                                key={i}
                                className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-zinc-950 shadow-lg"
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
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {PATTERN_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChange({ ...theme, pattern: opt.id })}
                        className={`px-6 py-5 rounded-[1.5rem] border text-[11px] font-bold uppercase tracking-[0.2em] transition-all ${
                          theme.pattern === opt.id
                            ? "bg-white text-zinc-950 border-white shadow-2xl ring-4 md:ring-8 ring-white/5"
                            : "bg-white/5 border-white/5 text-zinc-500 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Solid - empty state */}
                {theme.type === "solid" && (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 md:p-10 bg-white/5 rounded-[2rem] md:rounded-[2.5rem] border border-dashed border-white/10">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/5 flex items-center justify-center mb-5 border border-white/5 shadow-inner">
                      <svg
                        className="w-6 h-6 md:w-8 md:h-8 text-zinc-400"
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
                    <p className="text-[10px] md:text-xs text-zinc-400 font-bold uppercase tracking-[0.3em]">
                      Pure Color Active
                    </p>
                    <p className="hidden md:block text-[11px] text-zinc-600 mt-3 max-w-[200px] leading-relaxed">
                      Solid backgrounds are minimalist and focus entirely on your
                      content.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="fixed bottom-0 inset-x-0 md:hidden bg-[#121214] border-t border-white/5 px-6 py-4 flex items-center justify-between z-[110]">
          <button
            type="button"
            onClick={() => setActiveMobileTab("base")}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeMobileTab === "base" ? "text-white" : "text-zinc-600"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                activeMobileTab === "base" ? "bg-white/10" : ""
              }`}
            >
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">
              Base
            </span>
          </button>

          <button
            type="button"
            onClick={() => !isPaletteDisabled && setActiveMobileTab("palette")}
            disabled={isPaletteDisabled}
            className={`flex flex-col items-center gap-1 transition-all ${
              isPaletteDisabled
                ? "opacity-20 grayscale cursor-not-allowed"
                : activeMobileTab === "palette"
                ? "text-white"
                : "text-zinc-600"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                activeMobileTab === "palette" ? "bg-white/10" : ""
              }`}
            >
              <Palette className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">
              Palette
            </span>
          </button>

          <button
            type="button"
            onClick={() => !isDetailsDisabled && setActiveMobileTab("details")}
            disabled={isDetailsDisabled}
            className={`flex flex-col items-center gap-1 transition-all ${
              isDetailsDisabled
                ? "opacity-20 grayscale cursor-not-allowed"
                : activeMobileTab === "details"
                ? "text-white"
                : "text-zinc-600"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                activeMobileTab === "details" ? "bg-white/10" : ""
              }`}
            >
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">
              Details
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
