/**
 * Event theme type definitions
 *
 * The event stores lightweight string references (palette ID, background type, etc.)
 * All actual color values live in src/lib/theme-presets.ts as the single source of truth.
 */

export type BackgroundType = 'solid' | 'landscape' | 'shader' | 'pattern';

/** Stored on the event - just references, no raw color values */
export interface EventThemeConfig {
  type: BackgroundType;
  colorPalette: string;
  /** landscape only: "desert", "lake", "mountain", "night-sky", "ocean" */
  image?: string;
  /** landscape only: 0-1 */
  imageOpacity?: number;
  /** shader only: "unicorn", "peach", "desert", "arctic", "dusk", "sky", "midnight", "aquarium" */
  shaderPreset?: string;
  /** pattern only: "dots", "grid", "stripes", "checkers", "crosses" */
  pattern?: string;
}

/** Resolved color values for rendering */
export interface ColorPalette {
  pageBackground: string;
  cardBackground: string;
  cardSecondaryBackground: string;
  mainTextColor: string;
  subTextColor: string;
  primaryColor: string;
  borderEnabled: boolean;
  borderColor: string;
}

/** Palette preset with preview swatches */
export interface PalettePreset {
  id: string;
  name: string;
  /** 3 swatch hex colors for the picker preview (or 2 for single-color) */
  colors: [string, string, string] | [string, string];
  palette: ColorPalette;
}

/** Shader gradient preset (includes its own fixed palette) */
export interface ShaderPreset {
  id: string;
  name: string;
  color1: string;
  color2: string;
  color3: string;
  palette: ColorPalette;
}

/** Landscape background option */
export interface LandscapeOption {
  id: string;
  name: string;
  /** Filename under /Landscape theme/ */
  filename: string;
}

/** Pattern background option */
export interface PatternOption {
  id: string;
  name: string;
}
