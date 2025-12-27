/**
 * Color Palette for Smart Parking App
 * Primary Colors: Blue #3B82F6, Purple #A855F7
 * Status Colors: Green #16A34A, Red #DC2626, Orange #EA580C
 * Neutral Colors: Gray 50 #F9FAFB, Gray 100 #F3F4F6, Gray 900 #111827, White #FFFFFF
 */

import { Platform } from 'react-native';

// Primary Colors
export const PrimaryBlue = '#3B82F6'; // blue-500
export const PrimaryPurple = '#A855F7'; // purple-500
export const Purple600 = '#9333EA'; // purple-600 for gradient

// Status Colors
export const SuccessGreen = '#16A34A'; // green-600
export const ErrorRed = '#DC2626'; // red-600
export const WarningOrange = '#EA580C'; // orange-600

// Neutral Colors
export const Gray50 = '#F9FAFB';
export const Gray100 = '#F3F4F6';
export const Gray900 = '#111827';
export const White = '#FFFFFF';

// Accent Colors (Light backgrounds for icons)
export const Blue100 = '#DBEAFE';
export const Purple100 = '#F3E8FF';
export const Green100 = '#DCFCE7';

export const Colors = {
  light: {
    text: Gray900,
    background: Gray50,
    tint: PrimaryBlue,
    icon: '#6B7280',
    tabIconDefault: '#6B7280',
    tabIconSelected: PrimaryBlue,
    // Status colors
    success: SuccessGreen,
    error: ErrorRed,
    warning: WarningOrange,
    // Card backgrounds
    cardBackground: White,
    cardBackgroundAlt: Gray100,
  },
  dark: {
    text: '#F9FAFB',
    background: '#111827',
    tint: PrimaryBlue,
    icon: '#9CA3AF',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: PrimaryBlue,
    // Status colors
    success: SuccessGreen,
    error: ErrorRed,
    warning: WarningOrange,
    // Card backgrounds
    cardBackground: '#1F2937',
    cardBackgroundAlt: '#374151',
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
