"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEventTheme } from "@/context/EventThemeContext";
import { getPatternCSS } from "@/lib/theme-presets";

const ShaderBackgroundInner = dynamic(
  () => import("./ShaderBackgroundInner"),
  { ssr: false }
);

export default function EventThemeBackground() {
  const { config, palette, shader, landscape } = useEventTheme();

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
