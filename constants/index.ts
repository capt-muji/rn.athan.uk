export const ENGLISH: Readonly<string[]> = ["Fajr", "Sunrise", "Duha", "Dhuhr", "Asr", "Magrib", "Isha"];
export const ARABIC: Readonly<string[]> = ["العشاء", "المغرب", "العصر", "الظهر", "الضحى", "الشروق", "الفجر"].reverse();

export const TEXT = {
  size: 16,
} as const;

export const COLORS = {
  primary: '#0d6cda',
  primaryShadow: '#0a296a',
  textPrimary: '#ffffff',
  gradientStart: '#031a4c',
  gradientEnd: '#660ca1',
} as const;