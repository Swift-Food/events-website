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
    // Default palette uses transparent bg so the layout gradient shows through
    if ((config.colorPalette ?? "default") === "default") {
      return null;
    }
    // Non-default palettes render their own solid background
    return (
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ backgroundColor: palette.pageBackground }}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ backgroundColor: palette.pageBackground }}
    >
      {config.type === "landscape" && landscape && (
        <Image
          src={`/Landscape theme/${landscape.filename}`}
          alt={landscape.name}
          fill
          className="object-cover"
          style={{ opacity: (config.colorPalette ?? "default") === "default" ? 1 : (config.imageOpacity ?? 0.4), filter: "blur(0px)", scale: "1.00" }}
          priority
        />
      )}

      {config.type === "shader" && shader && (
        <>
          {/* Static gradient placeholder — visible immediately while shader loads */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${shader.color1} 0%, ${shader.color2} 50%, ${shader.color3} 100%)`,
            }}
          />
          <ShaderBackgroundInner preset={shader} />
        </>
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
