export const PRAYERS_ENGLISH = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Magrib', 'Isha'];
export const PRAYERS_ARABIC = ['الفجر', 'الشروق', 'الظهر', 'العصر', 'المغرب', 'العشاء'];
export const PRAYER_INDEX_ISHA = 5;
export const PRAYERS_LENGTH_FAJR_TO_ISHA = 6; // TODO: remove this

export const EXTRAS_ENGLISH = ['Last Third', 'Suhoor', 'Duha', 'Istijaba'];
export const EXTRAS_ARABIC = ['آخر ثلث', 'السحور', 'الضحى', 'استجابة'];

export const TIME_ADJUSTMENTS = { suhoor: -45, duha: 20, istijaba: -59 };

export const TEXT = {
  famiy: {
    regular: 'Roboto',
    medium: 'Roboto-Medium',
  },
  size: 18,
  sizeSmall: 16,
  sizeSmaller: 14,
  opacity: 0.5,
  opacityHigher: 0.75,
};

export const SCREEN = {
  paddingHorizontal: 12,
};

export const COLORS = {
  gradientScreen1Start: '#031a4c',
  gradientScreen1End: '#5b1eaa',

  gradientScreen2Start: '#140B5D',
  gradientScreen2End: '#150020',

  activePrayer: '#ffffff',
  inactivePrayer: '#8aa9d662',

  activeBackground: '#0847e5',
  standardActiveBackgroundShadow: '#081a76',
  extraActiveBackgroundShadow: '#061e5b',

  textSecondary: '#a0c8ff89',
};

export const ANIMATION = {
  duration: 200,
  durationSlow: 1000,
  durationSlower: 1500,
  durationSlowest: 2250,
  overlayDelay: 150,
  cascadeDelay: 150,
  popupDuration: 1500,
};

export const OVERLAY = {
  closeThreshold: 2000,
  zindexes: {
    overlay: 2,
    background: -999,
    off: {
      countdown: 999,
      prayerNotSelected: -1,
      activeBackground: -2,
      longDate: -3,
      glow: -3,
    },
    on: {
      countdown: 999,
      prayerSelected: 4,
      longDate: -1,
      glow: 0,
    },
  },
};

export const STYLES = {
  prayer: {
    height: 57,
    padding: {
      left: 20,
      right: 20,
    },
    // active prayer - common properties
    shadow: {
      shadowOffset: { width: 1, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
    },
  },
};
