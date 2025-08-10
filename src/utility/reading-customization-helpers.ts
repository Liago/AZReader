/**
 * Utility functions for reading customization
 */

// Font size mappings between pixels and Tailwind tokens
export const FONT_SIZE_MAP = {
  'xs': 12,
  'sm': 14,
  'base': 16,
  'lg': 18,
  'xl': 20,
  '2xl': 24
} as const;

export const REVERSE_FONT_SIZE_MAP = {
  12: 'xs' as const,
  14: 'sm' as const,
  16: 'base' as const,
  18: 'lg' as const,
  20: 'xl' as const,
  24: '2xl' as const
};

export type FontSize = keyof typeof FONT_SIZE_MAP;
export type FontSizePixels = keyof typeof REVERSE_FONT_SIZE_MAP;

// Width category mappings
export const WIDTH_CATEGORIES = {
  narrow: 35,
  medium: 42,
  wide: 50
} as const;

export type WidthCategory = keyof typeof WIDTH_CATEGORIES;

/**
 * Convert font size from Tailwind token to pixels
 */
export const fontSizeToPixels = (size: FontSize): number => {
  return FONT_SIZE_MAP[size] || 16;
};

/**
 * Convert font size from pixels to Tailwind token
 */
export const pixelsToFontSize = (pixels: number): FontSize => {
  const clampedPixels = Math.max(12, Math.min(24, Math.round(pixels)));
  return REVERSE_FONT_SIZE_MAP[clampedPixels as FontSizePixels] || 'base';
};

/**
 * Get width category from numeric value
 */
export const getWidthCategory = (value: number): WidthCategory => {
  if (value <= 38) return 'narrow';
  if (value <= 44) return 'medium';
  return 'wide';
};

/**
 * Get numeric width value from category
 */
export const getWidthValue = (category: WidthCategory): number => {
  return WIDTH_CATEGORIES[category];
};

/**
 * Validate and clamp spacing value
 */
export const clampSpacing = (value: number): number => {
  return Math.max(1.2, Math.min(2.0, value));
};

/**
 * Validate and clamp width value
 */
export const clampWidth = (value: number): number => {
  return Math.max(35, Math.min(50, value));
};

/**
 * Validate and clamp font size in pixels
 */
export const clampFontSizePixels = (value: number): number => {
  return Math.max(12, Math.min(24, Math.round(value)));
};