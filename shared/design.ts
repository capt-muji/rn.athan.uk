import { Platform } from 'react-native';

// The tail is per-platform: the same hex reads pinker on Android's panel
export const IOS_TAIL = '#7117c9';
export const ANDROID_TAIL = '#4c16ca';

export const tailFor = (os: string) => (os === 'android' ? ANDROID_TAIL : IOS_TAIL);

// The full-screen solids sit between the navy top and the gradient's middle
export const rootBgFor = (os: string) => (os === 'android' ? '#17146a' : '#1e1a6a');

// T-374's landed design token: hand-frozen, nothing generates it. Every
// visual role of the standard schedule reads this. dim is the ONE dim ink.
export const DESIGN = {
  bgStart: '#05134a',
  bgEnd: '#36208a',
  bgTail: tailFor(Platform?.OS ?? 'ios'),
  dim: '#4a47ae',
  label: '#4060ae',
  bright: '#f2f5f9',
  pill: '#2439f5',
  pillExtras: '#8d0ca0',
  pillShadow: '#111d89',
  pillShadowExtras: '#570962',
  dot: '#db98dc',
  iconSettings: 'rgba(200, 176, 255, 0.71)',
  settingsBg: 'rgba(105, 65, 198, 0.51)',
  settingsBorder: 'rgba(116, 80, 207, 0.68)',
  settingsShadow: '#27035c',
  rootBg: rootBgFor(Platform?.OS ?? 'ios'),
};
