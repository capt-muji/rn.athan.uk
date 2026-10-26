/**
 * The one-dim sweep: every dimmed-text surface resolves to the single dim
 * token, and the shared-label pair resolves to the label token - so no surface
 * can carry its own shade, and a typo in the hand-frozen design token reddens
 * here instead of shipping (the ticket's own acceptance wording).
 */

import { COLORS } from '@/shared/constants';
import { DESIGN } from '@/shared/design';

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

  it('carries the owner-picked palette, hand-frozen', () => {
    expect(DESIGN).toEqual({
      bgStart: '#05134a',
      bgEnd: '#36208a',
      bgTail: '#7117c9',
      dim: '#485396',
      label: '#4060ae',
      bright: '#f2f5f9',
      pill: '#2439f5',
      pillExtras: '#8d0ca0',
      pillShadow: '#111d89',
      pillShadowExtras: '#570962',
      settingsShadow: '#27035c',
      dot: '#db98dc',
      iconSettings: 'rgba(188, 176, 221, 0.62)',
      settingsBg: 'rgba(103, 65, 190, 0.58)',
      settingsBorder: 'rgba(115, 79, 186, 0.66)',
      rootBg: '#05134a',
    });
  });
});
