"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ChevronDown, Maximize2 } from "lucide-react";
import type { EventThemeConfig, BackgroundType } from "@/types/event/theme";
import {
  ALL_PALETTES,
  PALETTE_MAP,
  SHADER_PRESETS,
  LANDSCAPE_OPTIONS,
  PATTERN_OPTIONS,
  getPatternCSS,
  parseColor,
} from "@/lib/theme-presets";

interface InlineThemePickerProps {
  theme: EventThemeConfig;
  onChange: (theme: EventThemeConfig) => void;
  onPreview: () => void;
}

const TYPE_PREVIEWS: {
  type: BackgroundType;
  label: string;
}[] = [
  { type: "solid", label: "Solid" },
  { type: "landscape", label: "Landscape" },
  { type: "shader", label: "Shader" },
  { type: "pattern", label: "Pattern" },
];

export default function InlineThemePicker({
  theme,
  onChange,
  onPreview,
}: InlineThemePickerProps) {
  const [colorOpen, setColorOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const colorRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLDivElement>(null);

  const currentPalette = PALETTE_MAP[theme.colorPalette] ?? PALETTE_MAP["default"];

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
  };

  const getStyleOptions = () => {
    switch (theme.type) {
      case "landscape":
        return LANDSCAPE_OPTIONS.map((o) => ({ id: o.id, name: o.name }));
      case "shader":
        return SHADER_PRESETS.map((s) => ({ id: s.id, name: s.name }));
      case "pattern":
        return PATTERN_OPTIONS.map((p) => ({ id: p.id, name: p.name }));
      default:
        return [];
    }
  };

  const getCurrentStyleLabel = () => {
    switch (theme.type) {
      case "landscape":
        return LANDSCAPE_OPTIONS.find((o) => o.id === theme.image)?.name ?? "Ocean";
      case "shader":
        return SHADER_PRESETS.find((s) => s.id === theme.shaderPreset)?.name ?? "Aurora";
      case "pattern":
        return PATTERN_OPTIONS.find((p) => p.id === theme.pattern)?.name ?? "Dots";
      default:
        return "—";
    }
  };

  const handleStyleSelect = (id: string) => {
    switch (theme.type) {
      case "landscape":
        onChange({ ...theme, image: id, imageOpacity: theme.imageOpacity ?? 0.4 });
        break;
      case "shader":
        onChange({ ...theme, shaderPreset: id });
        break;
      case "pattern":
        onChange({ ...theme, pattern: id });
        break;
    }
    setStyleOpen(false);
  };

  const styleOptions = getStyleOptions();
  const hasStyleOptions = styleOptions.length > 0;

  const renderTypeThumbnail = (type: BackgroundType) => {
    const palette = currentPalette;
    switch (type) {
      case "solid":
        return (
          <div
            className="w-full h-full rounded-lg"
            style={{ backgroundColor: palette.palette.pageBackground }}
          />
        );
      case "landscape": {
        const img = LANDSCAPE_OPTIONS.find((o) => o.id === (theme.image ?? "ocean")) ?? LANDSCAPE_OPTIONS[4];
        const isDefault = (theme.colorPalette ?? "default") === "default";
        return (
          <div className="relative w-full h-full rounded-lg overflow-hidden">
            <Image
              src={`/Landscape theme/${img.filename}`}
              alt={img.name}
              fill
              className="object-cover"
              sizes="120px"
            />
            {!isDefault && (
              <div
                className="absolute inset-0"
                style={{ backgroundColor: palette.palette.pageBackground, opacity: 0.5 }}
              />
            )}
          </div>
        );
      }
      case "shader": {
        const shader = SHADER_PRESETS.find((s) => s.id === (theme.shaderPreset ?? "unicorn")) ?? SHADER_PRESETS[0];
        return (
          <div
            className="w-full h-full rounded-lg"
            style={{
              background: `linear-gradient(135deg, ${shader.color1}, ${shader.color2}, ${shader.color3})`,
            }}
          />
        );
      }
      case "pattern": {
        const { r, g, b } = parseColor(palette.palette.mainTextColor);
        const patternCss = getPatternCSS(theme.pattern ?? "dots", {
          ...palette.palette,
          mainTextColor: `rgba(${r}, ${g}, ${b}, 1)`,
        });
        return (
          <div
            className="w-full h-full rounded-lg"
            style={{
              backgroundColor: palette.palette.pageBackground,
              backgroundImage: patternCss,
              backgroundRepeat: "repeat",
            }}
          />
        );
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Appearance</h3>
        <button
          type="button"
          onClick={onPreview}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          Preview
        </button>
      </div>

      {/* Type preview thumbnails */}
      <div className="flex gap-3 overflow-x-auto p-1 pb-2 scrollbar-dark">
        {TYPE_PREVIEWS.map(({ type, label }) => (
          <button
            key={type}
            type="button"
            onClick={() => handleTypeChange(type)}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <div
              className={`w-[100px] h-[68px] rounded-lg overflow-hidden transition-all ${
                theme.type === type
                  ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                  : "opacity-60 hover:opacity-90"
              }`}
            >
              {renderTypeThumbnail(type)}
            </div>
            <span
              className={`text-xs ${
                theme.type === type
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Selector rows */}
      <div className="grid grid-cols-2 gap-3">
        {/* Colour selector */}
        <div className="relative" ref={colorRef}>
          <button
            type="button"
            onClick={() => { setColorOpen(!colorOpen); setStyleOpen(false); }}
            className="flex items-center gap-2.5 w-full rounded-xl bg-card-background px-3 py-2.5 text-left transition-colors hover:bg-card-background/80"
          >
            <div className="flex h-7 w-7 rounded-full overflow-hidden shrink-0">
              {currentPalette.colors.map((color, i) => (
                <div key={i} className="flex-1" style={{ backgroundColor: color }} />
              ))}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Colour</p>
              <p className="text-sm font-medium text-foreground truncate">
                {currentPalette.name}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>

          {colorOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setColorOpen(false)} />
              <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl bg-card-background border border-foreground/10 shadow-lg max-h-60 overflow-y-auto">
                {ALL_PALETTES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onChange({ ...theme, colorPalette: p.id });
                      setColorOpen(false);
                    }}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors hover:bg-foreground/5 ${
                      theme.colorPalette === p.id ? "bg-foreground/10" : ""
                    }`}
                  >
                    <div className="flex h-5 w-10 rounded overflow-hidden shrink-0">
                      {p.colors.map((color, i) => (
                        <div key={i} className="flex-1" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <span className="text-sm text-foreground">{p.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Style selector */}
        <div className="relative" ref={styleRef}>
          <button
            type="button"
            onClick={() => {
              if (hasStyleOptions) {
                setStyleOpen(!styleOpen);
                setColorOpen(false);
              }
            }}
            className={`flex items-center gap-2.5 w-full rounded-xl bg-card-background px-3 py-2.5 text-left transition-colors ${
              hasStyleOptions
                ? "hover:bg-card-background/80 cursor-pointer"
                : "opacity-50 cursor-default"
            }`}
          >
            <div className="h-7 w-7 rounded-full bg-foreground/10 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Style</p>
              <p className="text-sm font-medium text-foreground truncate">
                {hasStyleOptions ? getCurrentStyleLabel() : "—"}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>

          {styleOpen && hasStyleOptions && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setStyleOpen(false)} />
              <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl bg-card-background border border-foreground/10 shadow-lg max-h-60 overflow-y-auto">
                {styleOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleStyleSelect(opt.id)}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors hover:bg-foreground/5 ${
                      (theme.type === "landscape" && theme.image === opt.id) ||
                      (theme.type === "shader" && theme.shaderPreset === opt.id) ||
                      (theme.type === "pattern" && theme.pattern === opt.id)
                        ? "bg-foreground/10"
                        : ""
                    }`}
                  >
                    <span className="text-sm text-foreground">{opt.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
