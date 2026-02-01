"use client";

import { createContext, useContext, useMemo } from "react";
import type { EventThemeConfig, ColorPalette, ShaderPreset, LandscapeOption } from "@/types/event/theme";
import { DEFAULT_THEME_CONFIG, resolveTheme } from "@/lib/theme-presets";

interface EventThemeContextType {
  config: EventThemeConfig;
  palette: ColorPalette;
  shader?: ShaderPreset;
  landscape?: LandscapeOption;
}

const EventThemeContext = createContext<EventThemeContextType | null>(null);

export function EventThemeProvider({
  themeJson,
  children,
}: {
  themeJson?: string | null;
  children: React.ReactNode;
}) {
  const value = useMemo<EventThemeContextType>(() => {
    let config: EventThemeConfig;
    try {
      config = themeJson ? JSON.parse(themeJson) : DEFAULT_THEME_CONFIG;
    } catch {
      config = DEFAULT_THEME_CONFIG;
    }
    const resolved = resolveTheme(config);
    return { config, ...resolved };
  }, [themeJson]);

  return (
    <EventThemeContext.Provider value={value}>
      {children}
    </EventThemeContext.Provider>
  );
}

export function useEventTheme() {
  const ctx = useContext(EventThemeContext);
  if (!ctx) throw new Error("useEventTheme must be within EventThemeProvider");
  return ctx;
}
