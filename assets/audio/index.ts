import { bundleDirectory } from 'expo-file-system/legacy';
import { Platform } from 'react-native';

// Whole-second clip lengths (rounded), parallel to the sheet's rows. The sound
// sheet shows these the instant a row is tapped so the countdown appears in the
// same frame as the icon flip; live player status takes over once the clip
// loads (same rounding, seamless handover). Regenerate if any athan
// mp3 is ever replaced.
export const ATHAN_DURATION_SECONDS = [
  28, 30, 28, 29, 30, 24, 30, 30, 30, 30, 21, 25, 25, 20, 30, 30, 30, 30, 30, 19, 26, 30, 30, 30, 30, 30, 30, 30, 30,
  30, 21, 25,
];

/** How many athan rows the sound sheet offers, parallel to ATHAN_DURATION_SECONDS */
export const ATHAN_COUNT = ATHAN_DURATION_SECONDS.length;

/**
 * The preview player's source for an athan row. Every mp3 rides the build once: the copy the
 * OS's notifications read, which the expo-notifications config ships (Android's res/raw, iOS's
 * bundle root). The sheet's player reads that same copy instead of a second Metro asset copy.
 *
 * Android names its res/raw resource bare: expo-audio resolves a schemeless name through
 * getIdentifier(name, "raw", pkg), and a name carrying ".mp3" returns 0, which falls back to a
 * broken file path. iOS hands AVURLAsset the URL as given, so it needs the absolute file URL.
 */
export const athanPreviewSource = (index: number): string => {
  const name = `athan${index + 1}`;
  return Platform.OS === 'android' ? name : `file://${bundleDirectory}${name}.mp3`;
};
