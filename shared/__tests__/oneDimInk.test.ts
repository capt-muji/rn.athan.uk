/**
 * The one-dim sweep: every dimmed-text surface resolves to the single dim
 * token, and the shared-label pair resolves to the label token - so no surface
 * can carry its own shade on iPhone, and a typo in the hand-frozen design token
 * reddens here instead of shipping (the ticket's own acceptance wording). The
 * dim itself forks per platform (dimFor), and the ago text forks inside it on
 * Android - both pinned below.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { COLORS } from '@/shared/constants';
import { ANDROID_DIM, ANDROID_TAIL, DESIGN, dimFor, IOS_DIM, IOS_TAIL, rootBgFor, tailFor } from '@/shared/design';

/** Every role that paints a dimmed surface of the standard schedule */
const DIM_ROLES = {
  'text.muted': COLORS.text.muted,
  'text.rowTime': COLORS.text.rowTime,
  'countdown.timeColon': COLORS.countdown.timeColon,
  'prayerAgo.text': COLORS.prayerAgo.text,
} as const;

/** The pair the owner ruled one ink: the prayer name above the countdown and the location */
const LABEL_ROLES = {
  'text.labelHome': COLORS.text.labelHome,
} as const;

/** The surfaces that carry a shade other than the token: the sweep's findings */
const ownShades = (roles: Record<string, string>, token: string) =>
  Object.entries(roles).filter(([, value]) => value !== token);

describe('the one dim ink', () => {
  it('serves every dimmed-text surface', () => {
    expect(ownShades(DIM_ROLES, DESIGN.dim)).toEqual([]);
  });

  it('serves the shared label pair', () => {
    expect(ownShades(LABEL_ROLES, DESIGN.label)).toEqual([]);
  });

  it('reddens a surface that carries its own shade', () => {
    const planted = { ...DIM_ROLES, 'prayerAgo.text': '#5660a7' };
    expect(ownShades(planted, DESIGN.dim)).toEqual([['prayerAgo.text', '#5660a7']]);
  });

  it('dims per platform: the iPhone pick and the locked Android ink', () => {
    expect(IOS_DIM).toBe('#5254ac');
    expect(ANDROID_DIM).toBe('#4a47ae');
    expect(dimFor('ios')).toBe(IOS_DIM);
    expect(dimFor('android')).toBe(ANDROID_DIM);
  });

  // The pill's wash, pinned so drift reddens - the owner's hand-tuned values
  it('pins the prayer-ago pill wash', () => {
    expect(COLORS.prayerAgo.gradient.start).toBe('rgba(77, 59, 175, 0.15)');
    expect(COLORS.prayerAgo.gradient.end).toBe('rgba(59, 88, 146, 0.25)');
  });

  // The ago text forks by platform: the dim on iPhone, the owner's Android pick there.
  // The fork evaluates at module load, so the pin reads the source the way the solids do
  it('picks the ago text per platform: the dim on iPhone, the owner pick on Android', () => {
    expect(COLORS.prayerAgo.text).toBe(DESIGN.dim);

    const source = readFileSync(join(__dirname, '../constants.ts'), 'utf8');
    expect(source).toContain("text: (Platform?.OS ?? 'ios') === 'android' ? '#4c47ae' : DESIGN.dim");
  });

  // The native-baked solids and the glyph stroke, pinned at the source: no
  // jest render reaches them, so only this stops a tune drifting silently
  it('pins the app.json solids and the settings glyph stroke', () => {
    const appJson = readFileSync(join(__dirname, '../../app.json'), 'utf8');
    const svg = readFileSync(join(__dirname, '../../assets/icons/svg/settings.svg'), 'utf8');

    expect(appJson.match(/"backgroundColor": "#251b74"/g)).toHaveLength(2);
    expect(appJson.match(/"backgroundColor": "#1e1a6a"/g)).toHaveLength(3);
    expect(svg.match(/stroke-width="1.5"/g)).toHaveLength(2);

    // The counts above cannot show where a hex sits, so every backgroundColor
    // field is pinned by place: a tint landing on the root or the adaptive icon
    // leaves them green while the Android window background goes untinted
    const app = JSON.parse(appJson);
    const splash = app.expo.plugins.find(
      (plugin: unknown) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen'
    )[1];
    expect(app.expo.backgroundColor).toBe('#1e1a6a');
    expect(app.expo.ios.backgroundColor).toBe('#1e1a6a');
    expect(app.expo.android.backgroundColor).toBe('#251b74');
    expect(app.expo.android.adaptiveIcon.backgroundColor).toBe('#05134a');
    expect(splash.ios.backgroundColor).toBe('#1e1a6a');
    expect(splash.android.backgroundColor).toBe('#251b74');
  });

  it('carries the owner-picked palette, hand-frozen', () => {
    // jest runs the ios arm; the android arm is pinned through dimFor below
    expect(DESIGN).toEqual({
      bgStart: '#05134a',
      bgEnd: '#36208a',
      bgTail: '#7117c9',
      dim: '#5254ac',
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
      // The iPhone solid stays at the gradient's middle (owner order 2026-10-29)
      rootBg: '#1e1a6a',
    });
  });

  // Both platform arms of the per-platform values, proven directly
  it('serves each platform its own tail and root solid', () => {
    expect(tailFor('android')).toBe('#4c16ca');
    expect(tailFor('ios')).toBe('#7117c9');
    expect(rootBgFor('android')).toBe('#251b74');
    expect(rootBgFor('ios')).toBe('#1e1a6a');
    // The split itself: a collapsed fork would move the iPhone's solid silently
    expect(rootBgFor('android')).not.toBe(rootBgFor('ios'));
  });

  // The tails are pinned per platform: the same hex reads pinker on Android's
  // panel, so Android's sits toward the top colour
  it('pins both platform tails', () => {
    expect(IOS_TAIL).toBe('#7117c9');
    expect(ANDROID_TAIL).toBe('#4c16ca');
  });
});
