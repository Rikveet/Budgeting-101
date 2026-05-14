// ─────────────────────────────────────────────
//  DESIGN TOKENS
//  Clean, modern financial app aesthetic
// ─────────────────────────────────────────────

export const Colors = {
  // Brand
  primary: '#6C63FF',       // deep indigo-violet
  primaryLight: '#EEF0FF',
  primaryDark: '#4B44CC',

  // Semantic
  income: '#34C78A',
  incomeLight: '#E8FBF3',
  expense: '#FF5C6A',
  expenseLight: '#FFF0F1',
  warning: '#FF5C6A',
  warningBg: '#FFF0F1',
  warningBorder: '#FFB3B9',

  // Neutrals
  background: '#F7F8FC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#E8EAF0',
  borderLight: '#F0F2F7',

  // Text
  textPrimary: '#1A1D2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Account type colours
  accountSavings: '#34C78A',
  accountCredit: '#FF6B9D',
  accountFriend: '#FFB347',

  // Calendar
  calendarToday: '#6C63FF',
  calendarSelected: '#6C63FF',
  calendarHasTransaction: '#34C78A',
  calendarWarning: '#FF5C6A',

  // Misc
  shadow: 'rgba(26, 29, 46, 0.08)',
  overlay: 'rgba(26, 29, 46, 0.5)',
};

export const Typography = {
  // Font families — use system fonts that look great on iOS & Android
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },

  // Scale
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 28,
    '3xl': 34,
  },

  // Weight
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },

  // Line height multipliers
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 56,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 999,
};

export const Shadow = {
  sm: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
};

// ─────────────────────────────────────────────
//  ACCOUNT COLOURS (preset palette)
// ─────────────────────────────────────────────

export const ACCOUNT_COLOR_PRESETS = [
  '#6C63FF', '#34C78A', '#FF6B9D', '#FFB347',
  '#45B7D1', '#FF5C6A', '#98D8C8', '#C7B8EA',
  '#F7DC6F', '#AED6F1', '#F0B27A', '#82E0AA',
];