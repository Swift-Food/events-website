"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import type { EventThemeConfig, ColorPalette } from "@/types/event/theme";
import type { ShaderPreset, LandscapeOption } from "@/types/event/theme";
import { getPatternCSS } from "@/lib/theme-presets";

const ShaderBackgroundInner = dynamic(
  () => import("./ShaderBackgroundInner"),
  { ssr: false }
);

interface EventThemeBackgroundProps {
  config: EventThemeConfig;
  palette: ColorPalette;
  shader?: ShaderPreset;
  landscape?: LandscapeOption;
}

export default function EventThemeBackground({
  config,
  palette,
  shader,
  landscape,
}: EventThemeBackgroundProps) {
  if (config.type === "solid") {
    return null;
  }

  return (
    <div className="fixed inset-0 z-0">
      {config.type === "landscape" && landscape && (
        <Image
          src={`/Landscape theme/${landscape.filename}`}
          alt={landscape.name}
          fill
          className="object-cover"
          style={{ opacity: config.imageOpacity ?? 0.4 }}
          priority
        />
      )}

      {config.type === "shader" && shader && (
        <ShaderBackgroundInner preset={shader} />
      )}

      {config.type === "pattern" && config.pattern && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: palette.pageBackground,
            backgroundImage: getPatternCSS(config.pattern, palette),
            backgroundRepeat: "repeat",
          }}
        />
      )}
    </div>
  );
}
