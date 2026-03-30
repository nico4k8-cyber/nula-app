/**
 * Design Tokens for ПАРАДОКС v2
 * Единая система цветов, размеров, типографии, отступов
 */

// ═══ ЦВЕТА ═══
export const COLORS = {
  // Primary (зелёный - для успеха)
  primary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    900: '#14532d',
  },

  // Secondary (синий - для действий)
  secondary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    900: '#082f49',
  },

  // Accent (оранжевый - для фокуса)
  accent: {
    50: '#fff7ed',
    100: '#fee2e2',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    900: '#7c2d12',
  },

  // Neutral (серая палитра)
  neutral: {
    0: '#ffffff',
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Status
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Background
  bg: {
    light: '#ffffff',
    soft: '#f9fafb',
    muted: '#f3f4f6',
  },
};

// ═══ ТИПОГРАФИЯ ═══
export const TYPOGRAPHY = {
  // Font families
  family: {
    sans: 'system-ui, -apple-system, sans-serif',
    mono: 'Menlo, monospace',
  },

  // Font sizes
  size: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '28px',
    '4xl': '32px',
  },

  // Font weights
  weight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// ═══ SPACING ═══
export const SPACING = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
};

// ═══ РАЗМЕРЫ КОМПОНЕНТОВ ═══
export const SIZE = {
  // Кнопки
  button: {
    sm: {
      height: '32px',
      padding: `${SPACING[2]} ${SPACING[3]}`,
      fontSize: TYPOGRAPHY.size.sm,
    },
    base: {
      height: '44px',
      padding: `${SPACING[3]} ${SPACING[4]}`,
      fontSize: TYPOGRAPHY.size.base,
    },
    lg: {
      height: '48px',
      padding: `${SPACING[4]} ${SPACING[6]}`,
      fontSize: TYPOGRAPHY.size.lg,
    },
  },

  // Touch-safe минимум (WCAG)
  touchTarget: '44px',

  // Input fields
  input: {
    height: '44px',
    borderRadius: '8px',
  },
};

// ═══ BORDER RADIUS ═══
export const BORDER_RADIUS = {
  none: '0',
  sm: '4px',
  base: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};

// ═══ SHADOWS ═══
export const SHADOWS = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

// ═══ BREAKPOINTS ═══
export const BREAKPOINTS = {
  sm: '640px',  // мобила
  md: '768px',  // планшет
  lg: '1024px', // десктоп
  xl: '1280px',
};

// ═══ ANIMATIONS ═══
export const ANIMATIONS = {
  duration: {
    fast: '150ms',
    base: '250ms',
    slow: '400ms',
    slower: '600ms',
  },

  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    linear: 'linear',
  },
};

// ═══ Z-INDEX STACK ═══
export const ZINDEX = {
  hide: -1,
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  backdrop: 40,
  modal: 50,
  toast: 60,
  tooltip: 70,
};

// ═══ CONVENIENCE STYLE OBJECTS ═══
export const STYLES = {
  // Flex центрирование
  flexCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Абсолютное позиционирование покрытие
  cover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Скрытие текста (ellipsis)
  ellipsis: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  // Скрытие элемента (screen readers только)
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    borderWidth: 0,
  },
};
