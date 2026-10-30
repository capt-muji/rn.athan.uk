/**
 * The screen's background gradient, which has no behaviour of its own beyond filling the screen
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react-native';
import { Platform, StyleSheet } from 'react-native';

import { COLORS } from '@/shared/constants';
import { ANDROID_TAIL, DESIGN, IOS_TAIL } from '@/shared/design';

import BackgroundGradients from '../BackgroundGradients';

// the native gradient receives packed ARGB numbers, so the assertions do too
const argb = (hex: string) => 0xff000000 + Number.parseInt(hex.slice(1), 16);
// Android's processColor hands the same packing to Java as a signed int
const argbSigned = (hex: string) => argb(hex) | 0;

// the two-stage ramp's middle stop: the journey end and the tail meet halfway
const blend = (a: string, b: string) => {
  const pair = (hex: string) => {
    const n = Number.parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const [x, y] = [pair(a), pair(b)];
  return `#${x
    .map((v, i) =>
      Math.round((v + y[i]) / 2)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`;
};

describe('the background gradient behind the pager', () => {
  // Filling the screen is a layout rule the app keeps, not a design value
  it('fills the whole screen, visibly, with nothing on it to read or press', async () => {
    await render(<BackgroundGradients />);

    expect(screen.root).toBeVisible();
    expect(screen.root).toHaveStyle(StyleSheet.absoluteFill);
    expect(screen.root).toBeEmptyElement();
  });

  // The landed design's own ramp, on its real token: dark stop, journey end,
  // the halfway blend, then the purple hint strongest at the bottom corner
  it('eases the tail colour in over the lower journey on iOS', async () => {
    const tree = await render(<BackgroundGradients />);
    const gradient = tree.root as NonNullable<typeof tree.root>;

    expect(gradient.props.colors).toEqual([
      argb(DESIGN.bgStart),
      argb(DESIGN.bgEnd),
      argb(blend(DESIGN.bgEnd, IOS_TAIL)),
      argb(IOS_TAIL),
    ]);
    expect(gradient.props.locations).toEqual([0, 0.7, 0.87, 1]);
  });

  // Android drops the eased body band and runs navy straight to the tail
  it('runs navy straight to the tail on Android, with no body stop', async () => {
    Platform.OS = 'android';
    try {
      const tree = await render(<BackgroundGradients />);
      const gradient = tree.root as NonNullable<typeof tree.root>;

      expect(gradient.props.colors).toEqual([argbSigned(COLORS.gradient.screen.start), argbSigned(ANDROID_TAIL)]);
      expect(gradient.props.locations).toEqual([0, 1]);
    } finally {
      Platform.OS = 'ios';
    }
  });

  // The axis is pinned at the source: corner to corner, the true diagonal
  // (owner order 2026-10-26, T-375 - reverting the 75% bend)
  it('aims the gradient axis corner to corner', () => {
    const source = readFileSync(join(__dirname, '../BackgroundGradients.tsx'), 'utf8');

    expect(source).toContain('start={{ x: 0, y: 0 }}');
    expect(source).toContain('end={{ x: 1, y: 1 }}');
  });

  // The token is hand-frozen: this pins the stops the ramp consumes, so a typo
  // in design.ts reddens here instead of shipping
  it('carries the owner-picked palette stops', () => {
    expect(DESIGN.bgStart).toBe('#05134a');
    expect(DESIGN.bgEnd).toBe('#36208a');
    expect(DESIGN.bgTail).toBe('#7117c9');
    expect(COLORS.gradient.screen.start).toBe(DESIGN.bgStart);
    expect(COLORS.gradient.screen.end).toBe(DESIGN.bgEnd);
  });
});
