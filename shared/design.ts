import { Platform } from 'react-native';

// The purple hint: iOS renders the interpolation cooler, Android pinker, so
// the tail is per-platform (owner order 2026-10-26: Android keeps iOS's
// lightness and saturation with the hue rotated blue to cancel the panel's
// pink shift)
export const IOS_TAIL = '#7117c9';
export const ANDROID_TAIL = '#4c16ca';
const os = Platform?.OS ?? 'ios';

// T-374's landed design token: the one-dim system the owner picked on
// 2026-10-26 (round 10, final-05). Every visual role of the standard schedule
// reads this; the values are hand-frozen, nothing generates them.
//
// The gradient runs top-left to bottom-right, its bright end aimed at the
// bottom's 75% mark; the tail eases in over the journey's lower reaches,
// strongest at the bottom. dim is the ONE dim ink: every dimmed name, time,
// bell and the time-ago chip read it; label serves the prayer name above the
// countdown and the location line.
export const DESIGN = {
  bgStart: '#05134a',
  bgEnd: '#36208a',
  bgTail: os === 'android' ? ANDROID_TAIL : IOS_TAIL,
  dim: '#46469b',
  label: '#4060ae',
  bright: '#f2f5f9',
  pill: '#2439f5',
  pillExtras: '#8d0ca0',
  pillShadow: '#111d89',
  pillShadowExtras: '#570962',
  settingsShadow: '#27035c',
  dot: '#db98dc',
  // The settings chrome: the original neumorphic trio, restored verbatim on
  // both platforms (owner order 2026-10-26: the redrawn values read too bright
  // and too grey - "what we had before")
  iconSettings: 'rgba(200, 176, 255, 0.71)',
  settingsBg: 'rgba(105, 65, 198, 0.51)',
  settingsBorder: 'rgba(116, 80, 207, 0.68)',
  rootBg: '#05134a',
};
