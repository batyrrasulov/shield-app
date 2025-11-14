/**
 * design stuff
 * colors extracted from figma designs
 */

import { Platform } from 'react-native';

export const Colors = {
  // primary palette
  primary: '#3D5A6C',        // dark slate blue-gray
  secondary: '#D4A855',      // warm gold/amber
  accent: '#E8D9FF',         // light lavender for cards
  
  // background colors
  background: '#3D5A6C',     // main dark background
  surface: '#FFFFFF',        // white cards/surfaces
  surfaceDark: '#4A5D6B',    // slightly lighter dark surface
  
  // txt colors
  text: '#FFFFFF',           // white text on dark
  textDark: '#000000',       // dark text on light
  textGray: '#6B7280',       // gray secondary text
  
  // status colors
  success: '#00D96F',        // green
  error: '#CD7672',          // coral red
  info: '#00D4FF',           // cyan blue
  
  // ui elements
  border: '#E5E7EB',         // light gray borders
  disabled: '#9CA3AF',       // disabled state
  
  // avatar/profile colors
  avatarBg: '#E8D9FF',       // lavender avatar background
  avatarText: '#6B7280',     // gray avatar text
  
  // theme variants
  light: {
    text: '#000000',
    background: '#FFFFFF',
    tint: '#3D5A6C',
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#3D5A6C',
    card: '#FFFFFF',
    border: '#E5E7EB',
  },
  dark: {
    text: '#FFFFFF',
    background: '#3D5A6C',
    tint: '#D4A855',
    icon: '#FFFFFF',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#D4A855',
    card: '#4A5D6B',
    border: '#6B7280',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
