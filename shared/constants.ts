export const PRAYERS_ENGLISH = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Magrib", "Isha"];
export const PRAYERS_ARABIC = ["الفجر", "الشروق", "الظهر", "العصر", "المغرب", "العشاء"];

export const EXTRAS_ENGLISH = ["Duha", "Last Third"];
export const EXTRAS_ARABIC = ["الضحى", "آخر ثلث"];

export const TEXT = {
  famiy: {
    regular: 'Roboto',
    medium: 'Roboto-Medium',
  },
  size: 18,
  sizeSmall: 16,
  opacity: 0.65,
  opacityHigher: 0.75,
};

export const SCREEN = {
  paddingHorizontal: 15,
};

export const COLORS = {
  primary: '#005dd5',
  standardActiveBackground: '#005dd5',
  extraActiveBackground: '#a800bf',
  primaryShadow: '#1e114e',
  textPrimary: '#ffffff',
  textSecondary: '#8BA3C7',
  textTransparent: '#aab8cd',
  gradientStart: '#031a4c',
  gradientEnd: '#5b1eaa',
  transparentBlack: '#000000bf'
};

export const ANIMATION = {
  duration: 200,
  durationSlow: 1000,
  overlayDelay: 150,
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
      glow: 1,
    },
  },
};

export const PRAYER = {
  height: 60,
  shadow: {
    shadowColor: '#0a296a',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  borderRadius: 7,
};
