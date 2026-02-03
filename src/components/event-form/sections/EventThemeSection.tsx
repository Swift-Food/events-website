"use client";

import { useMemo } from "react";
import { ChevronDown, ChevronUp, Shuffle } from "lucide-react";
import { useEventCreation } from "@/context/EventCreationContext";
import {
  resolveTheme,
  PALETTE_MAP,
  SHADER_MAP,
  LANDSCAPE_MAP,
  ALL_PALETTES,
  SHADER_PRESETS,
  LANDSCAPE_OPTIONS,
  PATTERN_OPTIONS,
  getPatternPreviewCSS,
} from "@/lib/theme-presets";
import type { EventThemeConfig, BackgroundType } from "@/types/event/theme";
import InlineThemePicker from "@/components/theme/InlineThemePicker";

interface EventThemeSectionProps {
  showLiveTheme: boolean;
  isThemePickerOpen: boolean;
  setIsThemePickerOpen: (open: boolean) => void;
  onPreview?: () => void;
}

export default function EventThemeSection({
  showLiveTheme,
  isThemePickerOpen,
  setIsThemePickerOpen,
  onPreview,
}: EventThemeSectionProps) {
  const { eventTheme, setEventTheme } = useEventCreation();
  const resolvedTheme = useMemo(() => resolveTheme(eventTheme), [eventTheme]);

  const handleRandomizeTheme = () => {
    const types: BackgroundType[] = ["solid", "landscape", "shader", "pattern"];
    const type = types[Math.floor(Math.random() * types.length)];
    const palette =
      ALL_PALETTES[Math.floor(Math.random() * ALL_PALETTES.length)];
    const config: EventThemeConfig = {
      type,
      colorPalette: palette.id,
    };
    switch (type) {
      case "landscape":
        config.image =
          LANDSCAPE_OPTIONS[
            Math.floor(Math.random() * LANDSCAPE_OPTIONS.length)
          ].id;
        config.imageOpacity = 0.4;
        break;
      case "shader":
        config.shaderPreset =
          SHADER_PRESETS[Math.floor(Math.random() * SHADER_PRESETS.length)].id;
        break;
      case "pattern":
        config.pattern =
          PATTERN_OPTIONS[Math.floor(Math.random() * PATTERN_OPTIONS.length)]
            .id;
        break;
    }
    setEventTheme(config);
  };

  if (!showLiveTheme && onPreview) {
    return (
      <InlineThemePicker
        theme={eventTheme}
        onChange={setEventTheme}
        onPreview={onPreview}
      />
    );
  }

  if (!showLiveTheme) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setIsThemePickerOpen(!isThemePickerOpen)}
        className="flex flex-1 items-center gap-3 rounded-xl bg-card-background hover:bg-card-background/85 backdrop-blur-xl px-4 py-3 text-foreground transition-all cursor-pointer"
      >
        <div className="flex h-8 w-8 rounded-lg overflow-hidden shrink-0">
          {eventTheme.type === "shader"
            ? (() => {
                const shader = SHADER_MAP[eventTheme.shaderPreset ?? ""];
                return shader ? (
                  <div
                    className="flex items-center justify-center w-full h-full"
                    style={{
                      background: resolvedTheme.palette.pageBackground,
                    }}
                  >
                    <div className="flex -space-x-1.5">
                      {[shader.color1, shader.color2, shader.color3].map(
                        (c, i) => (
                          <div
                            key={i}
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: c, zIndex: 3 - i }}
                          />
                        ),
                      )}
                    </div>
                  </div>
                ) : null;
              })()
            : eventTheme.type === "pattern"
              ? (() => {
                  const patternStyle = getPatternPreviewCSS(
                    eventTheme.pattern ?? "dots",
                    resolvedTheme.palette,
                  );
                  return (
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundColor: resolvedTheme.palette.pageBackground,
                        backgroundImage: patternStyle.backgroundImage,
                        backgroundSize: patternStyle.backgroundSize,
                        backgroundRepeat: "repeat",
                      }}
                    />
                  );
                })()
              : eventTheme.type === "landscape"
                ? (() => {
                    const landscape = LANDSCAPE_MAP[eventTheme.image ?? ""];
                    return landscape ? (
                      <img
                        src={`/Landscape theme/${landscape.filename}`}
                        alt={landscape.name}
                        className="w-full h-full object-cover"
                      />
                    ) : null;
                  })()
                : (
                    PALETTE_MAP[eventTheme.colorPalette]?.colors ?? [
                      "#222",
                      "#2a2a2a",
                    ]
                  ).map((color, i) => (
                    <div
                      key={i}
                      className="flex-1"
                      style={{ backgroundColor: color }}
                    />
                  ))}
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-foreground">Theme</p>
          <p className="text-xs text-muted-foreground">
            {PALETTE_MAP[eventTheme.colorPalette]?.name ?? "Default"} &middot;{" "}
            {eventTheme.type.charAt(0).toUpperCase() + eventTheme.type.slice(1)}
          </p>
        </div>
        {isThemePickerOpen ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      <button
        type="button"
        onClick={handleRandomizeTheme}
        className="flex w-14 shrink-0 items-center justify-center self-stretch rounded-xl bg-card-background hover:bg-card-background/85 backdrop-blur-xl text-muted-foreground hover:text-foreground transition-all cursor-pointer"
        aria-label="Randomize theme"
      >
        <Shuffle className="h-5 w-5" />
      </button>
    </div>
  );
}
