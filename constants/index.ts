export const ENGLISH: Readonly<string[]> = ["Fajr", "Sunrise", "Duha", "Dhuhr", "Asr", "Magrib", "Isha"];
export const ARABIC: Readonly<string[]> = ["العشاء", "المغرب", "العصر", "الظهر", "الضحى", "الشروق", "الفجر"].reverse();

export const TEXT = {
  famiy: {
    regular: 'Roboto',
    medium: 'Roboto-Medium',
  },
  size: 18,
  opacity: 0.65,
  transparent: 0.5,
};

export const SCREEN = {
  paddingHorizontal: 15,
};

export const COLORS = {
  primary: '#0d6cda',
  primaryShadow: '#0a296a',
  textPrimary: '#ffffff',
  textSecondary: '#8BA3C7',
  textTransparent: '#aab8cd',
  gradientStart: '#031a4c',
  gradientEnd: '#5b1eaa',
  transparentBlack: '#000000bf'
};

export const ANIMATION = {
  duration: 200,
};

export const OVERLAY = {
  closeThreshold: 2000,
   zindexes: {
    overlay: 1,
    background: -999,
    off: {
      timer: 999,
      glow: 998,
      longDate: -1,
      prayerNotSelected: -1,
      activeBackground: -2,
    },
    on: {
      timer: 999,
      glow: 998,
      longDate: -1,
      activeBackground: 2,
      prayerSelected: 3,
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
  borderRadius: 8,
};
