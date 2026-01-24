// =============================================================================
// PRAYER NAMES
// =============================================================================

/**
 * English names for the 6 standard daily prayers
 * Order matches UI display sequence (Fajr → Sunrise → Dhuhr → Asr → Magrib → Isha)
 */
export const PRAYERS_ENGLISH = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Magrib', 'Isha'];

/**
 * Arabic names for the 6 standard daily prayers
 * Must align 1:1 with PRAYERS_ENGLISH for correct bilingual display
 */
export const PRAYERS_ARABIC = ['الفجر', 'الشروق', 'الظهر', 'العصر', 'المغرب', 'العشاء'];

// =============================================================================
// SPECIAL PRAYERS (EXTRAS)
// =============================================================================

/**
 * English names for 5 special/blessed prayer times
 * Order: Midnight, Last Third, Suhoor, Duha, Istijaba
 * Note: Istijaba only displays on Fridays
 */
export const EXTRAS_ENGLISH = ['Midnight', 'Last Third', 'Suhoor', 'Duha', 'Istijaba'];

/**
 * Arabic names for 5 special prayer times
 * Must align 1:1 with EXTRAS_ENGLISH for correct bilingual display
 */
export const EXTRAS_ARABIC = ['نصف الليل', 'آخر ثلث', 'السحور', 'الضحى', 'استجابة'];

/**
 * Index position of Istijaba prayer in EXTRAS arrays (0-indexed: 4)
 * Used for special handling: Istijaba notifications only scheduled on Fridays
 */
export const ISTIJABA_INDEX = 4;

/**
 * Human-readable explanations for each extra prayer
 * Used in PrayerExplanation overlay to provide context to users
 * Order aligns with EXTRAS arrays
 */
export const EXTRAS_EXPLANATIONS = [
  'Halfway between Magrib and Fajr',
  'Start of the last third of the night',
  '20 mins before Fajr',
  '20 mins after Sunrise',
  '1 hour before Magrib (Fridays only)',
] as const;

// =============================================================================
// NOTIFICATION CONFIGURATION
// =============================================================================

/**
 * Number of days ahead to schedule notifications (2-day rolling buffer)
 * Ensures notifications are always queued ahead without overwhelming the system
 */
export const NOTIFICATION_ROLLING_DAYS = 2;

/**
 * Hours between automatic notification refreshes
 * Notifications rescheduled when this interval elapses and app enters foreground
 */
export const NOTIFICATION_REFRESH_HOURS = 12;

// =============================================================================
// TIME CALCULATIONS
// =============================================================================

/**
 * Minute offsets for calculating special prayer times
 * Positive values = add minutes, negative = subtract from base prayer time
 * Used in shared/time.ts adjustTime() calculations
 */
export const TIME_ADJUSTMENTS = {
  lastThird: 0, // start of the last third of the night
  suhoor: -20, // minutes before Fajr
  duha: 20, // minutes after Sunrise
  istijaba: -60, // 1 hour before Magrib (Fridays only)
};

/**
 * Time-related constants in milliseconds
 * Used for time-based calculations (buffer checking, duration computations)
 */
export const TIME_CONSTANTS = {
  ONE_DAY_MS: 24 * 60 * 60 * 1000,
} as const;

/**
 * Islamic day boundary configuration
 * Defines when early morning prayers belong to previous Islamic day
 */
export const ISLAMIC_DAY = {
  /** Hour threshold for early morning (6am). Prayers before this hour may belong to previous Islamic day */
  EARLY_MORNING_CUTOFF_HOUR: 6,
} as const;

// =============================================================================
// UI TEXT & TYPOGRAPHY
// =============================================================================

/**
 * Global text styling configuration
 * Font family (Roboto) and size hierarchy for consistent typography across app
 */
export const TEXT = {
  family: {
    /** Regular weight font for body text */
    regular: 'Roboto-Regular',
    /** Medium weight font for emphasis text */
    medium: 'Roboto-Medium',
  },
  /** Base font size for prayer names and time displays */
  size: 18,
  /** Secondary font size for auxiliary text */
  sizeSmall: 16,
  /** Large font size for countdown prayer name (size + 8) */
  sizeLarge: 26,
  /** Title font size for modal headers (size + 2) */
  sizeTitle: 20,
  /** Heading font size for error screens */
  sizeHeading: 28,
  /** Detail font size for small text (sizeSmall - 2) */
  sizeDetail: 14,
  /** Arabic explanation font size */
  sizeArabic: 15,
  /** Line height presets */
  lineHeight: {
    /** Default line height for body text */
    default: 22,
    /** Line height for Arabic text */
    arabic: 24,
  },
  /** Letter spacing presets */
  letterSpacing: {
    /** Default letter spacing */
    default: 0.2,
    /** Wide letter spacing for titles */
    wide: 0.3,
  },
};

// =============================================================================
// SCREEN LAYOUT
// =============================================================================

/**
 * Screen-level layout padding constants
 * Ensures consistent spacing and alignment across all screens
 */
export const SCREEN = {
  /** Horizontal padding for screen edges */
  paddingHorizontal: 12,
  /** Top padding for screen content */
  paddingTop: 17,
};

// =============================================================================
// SPACING
// =============================================================================

/**
 * Spacing constants for margins, paddings, and gaps
 * Use semantic names for consistent spacing across components
 */
export const SPACING = {
  /** Extra small spacing (4px) - tiny margins */
  xs: 4,
  /** Small spacing (8px) - small gaps, margins */
  sm: 8,
  /** Medium spacing (12px) - default padding, matches SCREEN.paddingHorizontal */
  md: 12,
  /** Large spacing (16px) - countdown margins */
  lg: 16,
  /** Extra large spacing (20px) - prayer padding */
  xl: 20,
  /** 2x Extra large spacing (24px) - modal padding */
  xxl: 24,
  /** 3x Extra large spacing (30px) - bottom sheet padding */
  xxxl: 30,
  /** Section spacing (50px) - large section margins */
  section: 50,
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================

/**
 * Border radius presets for consistent rounded corners
 * Range from subtle rounding to fully circular (pill) shapes
 */
export const RADIUS = {
  /** Extra small radius (2px) - countdown bar */
  xs: 2,
  /** Small radius (5px) - error button */
  sm: 5,
  /** Medium radius (8px) - prayer rows, info boxes, buttons */
  md: 8,
  /** Large radius (10px) - modal buttons */
  lg: 10,
  /** Extra large radius (12px) - toggles, color picker panels */
  xl: 12,
  /** 2x Extra large radius (16px) - modals */
  xxl: 16,
  /** Sheet radius (24px) - bottom sheets */
  sheet: 24,
  /** Rounded radius (50px) - rounded elements like alert popup */
  rounded: 50,
  /** Pill radius (999px) - fully rounded pill shapes */
  pill: 999,
} as const;

// =============================================================================
// SHADOWS
// =============================================================================

/**
 * Shadow presets for elevation effects
 * Each preset includes offset, opacity, and radius for consistent shadows
 */
export const SHADOW = {
  /** Prayer row shadow */
  prayer: {
    shadowOffset: { width: 1, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  /** Settings button shadow */
  button: {
    shadowOffset: { width: 1, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  /** Modal shadow */
  modal: {
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.75,
    shadowRadius: 35,
  },
  /** Masjid icon shadow */
  masjid: {
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  /** Color picker modal shadow (upward) */
  colorPickerModal: {
    shadowOffset: { width: 0, height: -50 },
    shadowOpacity: 0.25,
    shadowRadius: 150,
  },
} as const;

// =============================================================================
// COMPONENT SIZES
// =============================================================================

/**
 * Fixed dimensions for UI components
 * Use for consistent sizing across the app
 */
export const SIZE = {
  /** Icon wrapper dimensions */
  iconWrapper: {
    /** Small icon wrapper (24px) */
    sm: 24,
    /** Medium icon wrapper (26px) */
    md: 26,
  },
  /** Toggle switch dimensions */
  toggle: {
    /** Toggle width */
    width: 44,
    /** Toggle height */
    height: 24,
    /** Toggle dot size */
    dotSize: 20,
    /** Toggle dot translateX when active */
    translateX: 18,
  },
  /** Navigation dot diameter */
  navigationDot: 6,
  /** Masjid icon dimensions */
  masjid: {
    width: 45,
    height: 45,
  },
  /** Settings button size */
  settingsButton: 43,
  /** Button heights */
  buttonHeight: {
    /** Small button height */
    sm: 24,
    /** Medium button height */
    md: 40,
  },
  /** Maximum screen content width */
  screenMaxWidth: 700,
} as const;

// =============================================================================
// PLATFORM-SPECIFIC
// =============================================================================

/**
 * Platform-specific styling adjustments
 * Use with Platform.OS checks for cross-platform consistency
 */
export const PLATFORM = {
  /** Android-specific values */
  android: {
    /** Bottom padding for screens */
    bottomPadding: 15,
    /** Navigation bar bottom padding */
    navigationBottomPadding: 40,
  },
} as const;

// =============================================================================
// COLOR PALETTE
// =============================================================================

/**
 * Application color palette
 * Organized by semantic role: text, surface, interactive, icons, etc.
 */
export const COLORS = {
  // ───────────────────────────────────────────────────────────────────────────
  // TEXT HIERARCHY
  // ───────────────────────────────────────────────────────────────────────────
  text: {
    /** Primary text: active prayers, main content */
    primary: '#ffffff',
    /** Secondary text: labels, descriptions */
    secondary: 'rgba(160, 200, 255, 0.54)',
    /** Muted text: inactive prayers, timestamps */
    muted: 'rgba(138, 169, 214, 0.38)',
    /** Disabled/hint text */
    disabled: 'rgba(146, 211, 255, 0.65)',
    /** Emphasis text: info box titles */
    emphasis: 'rgba(224, 231, 255, 1)',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // SURFACES & BACKGROUNDS
  // ───────────────────────────────────────────────────────────────────────────
  surface: {
    /** Bottom sheet background */
    sheet: '#0b183a',
    /** Bottom sheet border */
    sheetBorder: '#0f1d46',
    /** Bottom sheet backdrop overlay */
    backdrop: '#000116',
    /** Elevated surface (info boxes, modals) */
    elevated: 'rgba(18, 6, 42, 1)',
    /** Elevated surface border */
    elevatedBorder: 'rgba(45, 22, 106, 0.29)',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // GRADIENTS
  // ───────────────────────────────────────────────────────────────────────────
  gradient: {
    /** Main screen background gradient */
    screen: { start: '#031a4c', end: '#5b1eaa' },
    /** Overlay background gradient */
    overlay: { start: '#110022', end: '#000000' },
  },

  // ───────────────────────────────────────────────────────────────────────────
  // INTERACTIVE ELEMENTS (toggles, selections)
  // ───────────────────────────────────────────────────────────────────────────
  interactive: {
    /** Active toggle/selection background */
    active: '#5015b5',
    /** Active toggle/selection border */
    activeBorder: '#672bcf',
    /** Inactive toggle background */
    inactive: '#303f6c',
    /** Inactive toggle border */
    inactiveBorder: '#3b3977',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // ICONS
  // ───────────────────────────────────────────────────────────────────────────
  icon: {
    /** Primary icon fill color */
    primary: 'rgba(165, 180, 252, 1)',
    /** Icon wrapper background */
    background: 'rgba(99, 102, 241, 0.2)',
    /** Muted icon color */
    muted: 'rgba(177, 143, 255, 0.46)',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // BORDERS & DIVIDERS
  // ───────────────────────────────────────────────────────────────────────────
  border: {
    /** Subtle separator lines (6% opacity) */
    subtle: 'rgba(255, 255, 255, 0.06)',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // SHADOWS
  // ───────────────────────────────────────────────────────────────────────────
  shadow: {
    /** Active prayer shadow */
    prayer: '#081a76',
    /** Settings button shadow */
    button: '#27035c',
    /** Alert popup shadow */
    alert: '#010931',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // FEEDBACK STATES
  // ───────────────────────────────────────────────────────────────────────────
  feedback: {
    /** Success/recent state (bright blue-white) */
    success: '#d5e8ff',
    /** Warning state (countdown < 10%) */
    warning: '#ff0080',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // GLOWS & EFFECTS
  // ───────────────────────────────────────────────────────────────────────────
  glow: {
    /** Purple glow for overlay component */
    overlay: '#8000ff',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // PRAYER-SPECIFIC
  // ───────────────────────────────────────────────────────────────────────────
  prayer: {
    /** Active prayer highlight background */
    activeBackground: '#0847e5',
  },

  prayerAgo: {
    /** Prayer ago badge text */
    text: 'rgba(160, 200, 255, 0.50)',
    /** Background gradient for prayer ago badge */
    gradient: {
      start: 'rgba(99, 169, 255, 0.06)',
      end: 'rgba(141, 121, 255, 0.18)',
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  // COMPONENT-SPECIFIC
  // ───────────────────────────────────────────────────────────────────────────
  /** Settings button (transparent style) */
  settingsButton: {
    background: 'rgba(105, 65, 198, 0.29)',
    border: 'rgba(91, 51, 184, 0.46)',
  },

  /** Countdown bar */
  countdown: {
    background: 'rgba(126, 189, 241, 0.19)',
  },

  /** Color picker */
  colorPicker: {
    buttonBackground: 'rgba(79, 126, 180, 0.24)',
  },

  /** Modal/dialog specific colors */
  modal: {
    /** Modal shadow color */
    shadow: '#113f9b',
    /** Save button text */
    saveText: 'rgba(230, 220, 255, 1)',
    /** Save button background */
    saveBackground: 'rgba(80, 21, 181, 0.65)',
    /** Save button border */
    saveBorder: 'rgba(103, 43, 207, 0.75)',
  },

  /** Error screen colors */
  error: {
    /** Error screen button background */
    buttonBackground: '#030005',
  },

  /** Masjid icon */
  masjid: {
    /** Golden glow/shadow color */
    glow: '#EF9C29',
  },

  /** Navigation colors */
  navigation: {
    /** Navigation background (matches gradient.screen.start) */
    background: '#031a4c',
    /** Root layout background */
    rootBackground: '#2c1c77',
    /** Loading spinner color */
    activityIndicator: '#8d73ff',
    /** Navigation dot color */
    dot: '#cf98f4',
  },

  /** Light mode colors (system modals, update dialogs) */
  light: {
    /** Light background */
    background: '#ffffff',
    /** Primary dark text */
    text: '#1a1a1a',
    /** Secondary text */
    textSecondary: '#344e5c',
    /** Cancel button background */
    buttonCancel: '#f5f5f5',
    /** Primary button background */
    buttonPrimary: '#000000',
    /** Modal backdrop overlay */
    backdrop: 'rgba(0, 0, 0, 0.75)',
    /** Modal shadow */
    shadow: '#12001e',
  },
};

// =============================================================================
// ANIMATION TIMING
// =============================================================================

/**
 * Animation timing constants
 * Durations for different animation speeds, delays for cascade effects, debounce intervals
 */
export const ANIMATION = {
  /** Standard animation duration (fast transitions) in milliseconds */
  duration: 200,
  /** Slow animation duration for deliberate movements */
  durationSlow: 1000,
  /** Delay between consecutive prayer animations during cascade effect */
  cascadeDelay: 150,
  /** Duration for modal/popup open/close animations */
  popupDuration: 500,
  /** Debounce interval for rapid user interactions */
  debounce: 450,
};

// =============================================================================
// OVERLAY LAYERING
// =============================================================================

/**
 * Z-index layering configuration for overlay components
 * Ensures proper visual stacking order (popup > overlay > content > glow)
 */
export const OVERLAY = {
  zindexes: {
    /** Popup/z-modal layer (highest) */
    popup: 1000,
    /** Main overlay layer */
    overlay: 2,
    /** Glow effect layer (behind overlay) */
    glow: -1,
  },
};

// =============================================================================
// COMPONENT STYLES
// =============================================================================

/**
 * Dimension constants for UI components
 * Fixed heights, padding, border radius, and shadow configurations
 */
export const STYLES = {
  countdown: {
    /** Fixed height of countdown component in pixels */
    height: 60,
  },
  prayer: {
    /** Fixed height of each prayer row component */
    height: 57,
    padding: {
      /** Left padding for prayer row text */
      left: 20,
      /** Right padding for prayer row text */
      right: 20,
    },
    border: {
      /** Border radius for prayer row containers */
      borderRadius: 8,
    },
    shadow: {
      /** Shadow offset for active prayer background elevation */
      shadowOffset: { width: 1, height: 10 },
      /** Shadow opacity for active prayer background */
      shadowOpacity: 0.5,
      /** Shadow blur radius for active prayer background */
      shadowRadius: 10,
    },
  },
};

// =============================================================================
// ARABIC EXPLANATIONS
// =============================================================================

/**
 * Arabic translations of extra prayer explanations
 * Used in bilingual UI displays
 */
export const EXTRAS_EXPLANATIONS_ARABIC = [
  'نصف الليل بين المغرب والفجر',
  'عند بداية الثلث الأخير من الليل',
  '20 دقيقة قبل الفجر',
  '20 دقيقة بعد الشروق',
  'ساعة قبل المغرب (الجمعة فقط)',
] as const;
