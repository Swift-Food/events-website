import type {
  EventThemeConfig,
  ColorPalette,
  PalettePreset,
  ShaderPreset,
  LandscapeOption,
  PatternOption,
} from "@/types/event/theme";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse any color string (hex or rgba) into RGBA components */
export function parseColor(color: string): {
  r: number;
  g: number;
  b: number;
  a: number;
} {
  const rgbaMatch = color.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/
  );
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]),
      g: parseInt(rgbaMatch[2]),
      b: parseInt(rgbaMatch[3]),
      a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1,
    };
  }
  const hex = color.replace("#", "");
  if (hex.length >= 6) {
    return {
      r: parseInt(hex.substring(0, 2), 16) || 0,
      g: parseInt(hex.substring(2, 4), 16) || 0,
      b: parseInt(hex.substring(4, 6), 16) || 0,
      a: 1,
    };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}

function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = parseColor(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ---------------------------------------------------------------------------
// Default theme
// ---------------------------------------------------------------------------

export const DEFAULT_THEME_CONFIG: EventThemeConfig = {
  type: "solid",
  colorPalette: "default",
};

// ---------------------------------------------------------------------------
// Single-color palettes (pastel / light backgrounds with dark text)
// ---------------------------------------------------------------------------

function singleColorPalette(
  id: string,
  name: string,
  bgHex: string,
  cardHex: string
): PalettePreset {
  return {
    id,
    name,
    colors: [bgHex, cardHex],
    palette: {
      pageBackground: hexToRgba(bgHex, 1),
      cardBackground: hexToRgba(cardHex, 0.48),
      cardSecondaryBackground: "rgba(255, 255, 255, 0.48)",
      mainTextColor: "rgba(0, 0, 0, 0.9)",
      subTextColor: "rgba(0, 0, 0, 0.9)",
      primaryColor: "rgba(255, 255, 255, 1)",
      primaryForegroundColor: "rgba(0, 0, 0, 0.8)",
      borderEnabled: false,
      borderColor: "rgba(255, 255, 255, 0)",
    },
  };
}

export const SINGLE_COLOR_PALETTES: PalettePreset[] = [
  // "default" is the exception - dark theme with light text
  {
    id: "default",
    name: "Default",
    colors: ["#222222", "#2a2a2a"],
    palette: {
      pageBackground: "rgba(34, 34, 34, 1)",
      cardBackground: "rgba(17, 17, 17, 1)",
      cardSecondaryBackground: "rgba(255, 255, 255, 0.05)",
      mainTextColor: "rgba(237, 237, 237, 1)",
      subTextColor: "rgba(153, 153, 153, 1)",
      primaryColor: "rgba(59, 130, 246, 1)",
      primaryForegroundColor: "rgba(255, 255, 255, 1)",
      borderEnabled: false,
      borderColor: "rgba(64, 64, 64, 1)",
    },
  },
  singleColorPalette("sky", "Sky", "#a1bdf6", "#87aaf2"),
  singleColorPalette("peach", "Peach", "#ffbee0", "#f89bcc"),
  singleColorPalette("lime", "Lime", "#f6e57d", "#fcd905"),
  singleColorPalette("tangerine", "Tangerine", "#fbb858", "#ff9806"),
  singleColorPalette("lavender", "Lavender", "#d9bef5", "#caa2f4"),
  singleColorPalette("sage", "Sage", "#c3e26c", "#9acb12"),
];

// ---------------------------------------------------------------------------
// Multi-color palettes (3 colors)
// ---------------------------------------------------------------------------

function multiColorPalette(
  id: string,
  name: string,
  color1: string,
  color2: string,
  color3: string
): PalettePreset {
  return {
    id,
    name,
    colors: [color1, color2, color3],
    palette: {
      pageBackground: hexToRgba(color3, 1),
      cardBackground: hexToRgba(color2, 1),
      cardSecondaryBackground: "rgba(255, 255, 255, 0.15)",
      mainTextColor: hexToRgba(color1, 1),
      subTextColor: hexToRgba(color1, 0.65),
      primaryColor: hexToRgba(color1, 1),
      primaryForegroundColor: hexToRgba(color3, 1),
      borderEnabled: false,
      borderColor: hexToRgba(color2, 0.3),
    },
  };
}

export const MULTI_COLOR_PALETTES: PalettePreset[] = [
  multiColorPalette("matcha", "Matcha", "#f9c8db", "#7b9d2f", "#5f7b24"),
  multiColorPalette("desert", "Desert", "#ff6d2a", "#ffc2b3", "#ffe9bd"),
  multiColorPalette("arctic", "Arctic", "#1c4074", "#c6dcda", "#f8f5e6"),
  multiColorPalette("meadow", "Meadow", "#0e8622", "#cee29a", "#ddf2eb"),
  multiColorPalette("dusk", "Dusk", "#402c61", "#92475c", "#f3a39c"),
  multiColorPalette("beach", "Beach", "#2e80e4", "#afcff6", "#f8e6a8"),
  multiColorPalette("garden", "Garden", "#929124", "#f6c9dd", "#d0e3f4"),
  multiColorPalette("midnight", "Midnight", "#ececec", "#596394", "#1c275f"),
];

// ---------------------------------------------------------------------------
// Combined + lookup
// ---------------------------------------------------------------------------

export const ALL_PALETTES: PalettePreset[] = [
  ...SINGLE_COLOR_PALETTES,
  ...MULTI_COLOR_PALETTES,
];

export const PALETTE_MAP: Record<string, PalettePreset> = Object.fromEntries(
  ALL_PALETTES.map((p) => [p.id, p])
);

// ---------------------------------------------------------------------------
// Shader gradient presets
// ---------------------------------------------------------------------------

const SHADER_PALETTE_LIGHT: Omit<ColorPalette, "primaryColor"> = {
  pageBackground: "transparent",
  cardBackground: "rgba(255, 255, 255, 0.22)",
  cardSecondaryBackground: "rgba(255, 255, 255, 0.2)",
  mainTextColor: "rgba(0, 0, 0, 0.75)",
  subTextColor: "rgba(0, 0, 0, 0.5)",
  primaryForegroundColor: "rgba(255, 255, 255, 1)",
  borderEnabled: false,
  borderColor: "rgba(0, 0, 0, 0.08)",
};

const SHADER_PALETTE_DARK: Omit<ColorPalette, "primaryColor"> = {
  pageBackground: "transparent",
  cardBackground: "rgba(0, 0, 0, 0.25)",
  cardSecondaryBackground: "rgba(0, 0, 0, 0.15)",
  mainTextColor: "rgba(255, 255, 255, 0.9)",
  subTextColor: "rgba(255, 255, 255, 0.6)",
  primaryForegroundColor: "rgba(255, 255, 255, 1)",
  borderEnabled: false,
  borderColor: "rgba(255, 255, 255, 0.1)",
};

function shaderPreset(
  id: string,
  name: string,
  color1: string,
  color2: string,
  color3: string,
  dark: boolean,
  primaryColor: string
): ShaderPreset {
  const base = dark ? SHADER_PALETTE_DARK : SHADER_PALETTE_LIGHT;
  return { id, name, color1, color2, color3, palette: { ...base, primaryColor } };
}

export const SHADER_PRESETS: ShaderPreset[] = [
  shaderPreset("unicorn", "Unicorn", "#b8e7f5", "#d9ccff", "#faf9f6", false, "#4a3d8f"),
  shaderPreset("peach", "Peach", "#f9c8db", "#cee29a", "#ddf2eb", false, "#5a7a2e"),
  shaderPreset("desert", "Desert", "#ff6d2a", "#afcff6", "#f8e6a9", false, "#d4440f"),
  shaderPreset("arctic", "Arctic", "#1c4074", "#c6dcda", "#f8f5e6", false, "#1c4074"),
  shaderPreset("dusk", "Dusk", "#402c61", "#92475c", "#f3a39c", false, "#402c61"),
  shaderPreset("sky", "Sky", "#2e80e4", "#afcff6", "#f8e6a9", false, "#1a5fb4"),
  shaderPreset("midnight", "Midnight", "#1c275f", "#596394", "#ececec", true, "#8090c0"),
  shaderPreset("aquarium", "Aquarium", "#a3d6b4", "#cddbf9", "#99b0ed", false, "#3a6b8c"),
];

export const SHADER_MAP: Record<string, ShaderPreset> = Object.fromEntries(
  SHADER_PRESETS.map((s) => [s.id, s])
);

// ---------------------------------------------------------------------------
// Landscape options
// ---------------------------------------------------------------------------

export const LANDSCAPE_OPTIONS: LandscapeOption[] = [
  { id: "desert", name: "Desert", filename: "Desert.jpg" },
  { id: "lake", name: "Lake", filename: "Lake.jpg" },
  { id: "mountain", name: "Mountain", filename: "Mountain.jpg" },
  { id: "night-sky", name: "Night Sky", filename: "Night Sky.jpg" },
  { id: "ocean", name: "Ocean", filename: "Ocean.jpg" },
  { id: "city", name: "City", filename: "City.jpg" },
];

export const LANDSCAPE_MAP: Record<string, LandscapeOption> = Object.fromEntries(
  LANDSCAPE_OPTIONS.map((l) => [l.id, l])
);

// ---------------------------------------------------------------------------
// Pattern options + SVG generators
// ---------------------------------------------------------------------------

export const PATTERN_OPTIONS: PatternOption[] = [
  { id: "dots", name: "Dots" },
  { id: "grid", name: "Grid" },
  { id: "stripes", name: "Stripes" },
  { id: "checkers", name: "Checkers" },
  { id: "crosses", name: "Crosses" },
];

function svgDataUrl(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function generateDots(color: string): string {
  return `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><circle cx='15' cy='15' r='4' fill='${color}'/><circle cx='45' cy='15' r='4' fill='${color}'/><circle cx='0' cy='45' r='4' fill='${color}'/><circle cx='30' cy='45' r='4' fill='${color}'/><circle cx='60' cy='45' r='4' fill='${color}'/></svg>`;
}

function generateGrid(color: string): string {
  return `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><path d='M40 0 L40 40 M0 40 L40 40' fill='none' stroke='${color}' stroke-width='1'/></svg>`;
}

function generateStripes(color: string): string {
  return `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'><rect x='8' y='0' width='4' height='20' fill='${color}'/></svg>`;
}

function generateCheckers(color1: string, color2: string): string {
  return `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><rect x='0' y='0' width='40' height='40' fill='${color1}'/><rect x='40' y='40' width='40' height='40' fill='${color1}'/><rect x='40' y='0' width='40' height='40' fill='${color2}'/><rect x='0' y='40' width='40' height='40' fill='${color2}'/></svg>`;
}

function generateCrosses(color: string): string {
  // Two crosses in a 60x60 tile, staggered: one at (15,15) and one offset at (45,45)
  return `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><path d='M13 9 L17 9 L17 13 L21 13 L21 17 L17 17 L17 21 L13 21 L13 17 L9 17 L9 13 L13 13 Z' fill='${color}'/><path d='M43 39 L47 39 L47 43 L51 43 L51 47 L47 47 L47 51 L43 51 L43 47 L39 47 L39 43 L43 43 Z' fill='${color}'/></svg>`;
}

/** Darken a color by converting to HSL, reducing lightness, and boosting saturation */
function darkenColor(r: number, g: number, b: number, amount: number, alpha: number): string {
  let rr = r / 255, gg = g / 255, bb = b / 255;
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6;
    else if (max === gg) h = ((bb - rr) / d + 2) / 6;
    else h = ((rr - gg) / d + 4) / 6;
  }
  const newL = Math.max(l * amount, 0.08);
  const newS = Math.min(s * 1.4, 1);
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q = newL < 0.5 ? newL * (1 + newS) : newL + newS - newL * newS;
  const p = 2 * newL - q;
  return `rgba(${Math.round(hue2rgb(p, q, h + 1/3) * 255)}, ${Math.round(hue2rgb(p, q, h) * 255)}, ${Math.round(hue2rgb(p, q, h - 1/3) * 255)}, ${alpha})`;
}

/** Returns { backgroundImage, backgroundSize } for a pattern preview thumbnail (sizes are factors of 32 so they tile cleanly in a 32×32 swatch) */
export function getPatternPreviewCSS(patternId: string, palette: ColorPalette): { backgroundImage: string; backgroundSize: string } {
  const { r, g, b } = parseColor(palette.pageBackground);
  const c = darkenColor(r, g, b, 0.6, 0.45);
  const encode = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  switch (patternId) {
    case "dots":
      return {
        backgroundImage: encode(`<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'><circle cx='4' cy='4' r='2' fill='${c}'/><circle cx='12' cy='12' r='2' fill='${c}'/></svg>`),
        backgroundSize: "16px 16px",
      };
    case "grid":
      return {
        backgroundImage: encode(`<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'><path d='M8 0V8H0' fill='none' stroke='${c}' stroke-width='0.5'/></svg>`),
        backgroundSize: "8px 8px",
      };
    case "stripes":
      return {
        backgroundImage: encode(`<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'><rect x='2' y='0' width='3' height='8' fill='${c}'/></svg>`),
        backgroundSize: "8px 8px",
      };
    case "checkers": {
      const bgColor = darkenColor(r, g, b, 0.88, 0.25);
      return {
        backgroundImage: encode(`<svg xmlns='http://www.w3.org/2000/svg' width='2' height='2' viewBox='0 0 2 2'><rect x='0' y='0' width='1' height='1' fill='${c}'/><rect x='1' y='1' width='1' height='1' fill='${c}'/><rect x='1' y='0' width='1' height='1' fill='${bgColor}'/><rect x='0' y='1' width='1' height='1' fill='${bgColor}'/></svg>`),
        backgroundSize: "16px 16px",
      };
    }
    case "crosses":
      return {
        backgroundImage: encode(`<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 60 60'><path d='M13 9L17 9L17 13L21 13L21 17L17 17L17 21L13 21L13 17L9 17L9 13L13 13Z' fill='${c}'/><path d='M43 39L47 39L47 43L51 43L51 47L47 47L47 51L43 51L43 47L39 47L39 43L43 43Z' fill='${c}'/></svg>`),
        backgroundSize: "32px 32px",
      };
    default:
      return { backgroundImage: "none", backgroundSize: "auto" };
  }
}

/** Returns the CSS `background-image` value for a pattern */
export function getPatternCSS(patternId: string, palette: ColorPalette): string {
  const { r, g, b } = parseColor(palette.pageBackground);
  const patternColor = darkenColor(r, g, b, 0.6, 0.2);

  let svg: string;
  switch (patternId) {
    case "dots":
      svg = generateDots(patternColor);
      break;
    case "grid":
      svg = generateGrid(patternColor);
      break;
    case "stripes":
      svg = generateStripes(patternColor);
      break;
    case "checkers": {
      const bgColor = darkenColor(r, g, b, 0.88, 0.25);
      svg = generateCheckers(patternColor, bgColor);
      break;
    }
    case "crosses":
      svg = generateCrosses(patternColor);
      break;
    default:
      return "none";
  }
  return svgDataUrl(svg);
}

// ---------------------------------------------------------------------------
// Master resolver
// ---------------------------------------------------------------------------

export function resolveTheme(config: EventThemeConfig): {
  palette: ColorPalette;
  shader?: ShaderPreset;
  landscape?: LandscapeOption;
} {
  const shader = config.shaderPreset ? SHADER_MAP[config.shaderPreset] : undefined;

  // Shader type uses the shader preset's built-in palette
  const basePalette =
    config.type === "shader" && shader
      ? shader.palette
      : (PALETTE_MAP[config.colorPalette] ?? PALETTE_MAP["default"]).palette;

  // For solid type with default palette, make page background transparent
  // so the layout gradient shows through.
  let palette = basePalette;
  if (config.type === "solid" && (config.colorPalette ?? "default") === "default") {
    palette = {
      ...basePalette,
      pageBackground: "transparent",
    };
  }

  // For landscape themes, adjust backgrounds so the image shows through.
  if (config.type === "landscape") {
    const isDefault = (config.colorPalette ?? "default") === "default";
    const withAlpha = (color: string, alpha: number) => {
      const { r, g, b } = parseColor(color);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    palette = {
      ...basePalette,
      pageBackground: isDefault ? "transparent" : basePalette.pageBackground,
      // cardBackground: "rgba(255, 255, 255, 0.25)",
      // cardSecondaryBackground: "rgba(255, 255, 255, 0.25)",
      cardBackground: withAlpha(basePalette.cardBackground, 0.5),
      cardSecondaryBackground: withAlpha(basePalette.cardSecondaryBackground, 0.20),
      ...(isDefault && {
        cardBackground: "rgba(255, 255, 255, 0.15)",
        cardSecondaryBackground: "rgba(255, 255, 255, 0.08)",
        mainTextColor: "rgba(0, 0, 0, 0.75)",
        subTextColor: "rgba(0, 0, 0, 0.5)",
        primaryColor: "rgba(0, 0, 0, 0.7)",
        borderColor: "rgba(0, 0, 0, 0.1)",
      }),
    };
  }

  return {
    palette,
    shader,
    landscape: config.image ? LANDSCAPE_MAP[config.image] : undefined,
  };
}

// ---------------------------------------------------------------------------
// CSS variable overrides for live preview
// ---------------------------------------------------------------------------

/**
 * Returns a React CSSProperties object that overrides Tailwind v4's
 * --color-* CSS variables based on the resolved palette. Apply this
 * to a wrapper div and all child Tailwind classes (bg-background,
 * text-foreground, etc.) automatically pick up the theme colors.
 */
export function getThemeCSSVariables(
  palette: ColorPalette
): Record<string, string> {
  return {
    "--color-background": palette.pageBackground,
    "--color-card-background": palette.cardBackground,
    "--color-card-secondary-background": palette.cardSecondaryBackground,
    "--color-foreground": palette.mainTextColor,
    "--color-muted-foreground": palette.subTextColor,
    "--color-primary": palette.primaryColor,
    "--color-primary-foreground": palette.primaryForegroundColor,
    "--color-border": palette.borderColor,
  };
}
