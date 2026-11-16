/**
 * The radial glow: how large it is drawn on a phone, on a window wider than the content column, at a set size,
 * and the ink and stop curve its fade rides (owner order 2026-10-31)
 */

import { act, render, screen } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { Stop } from 'react-native-svg';

import { COLORS, GLOW, SIZE } from '@/shared/constants';

import Glow from '../Glow';

// Stop renders null (its data rides the gradient), so the falloff is read at the call site
jest.mock('react-native-svg', () => ({
  __esModule: true,
  ...jest.requireActual<typeof import('react-native-svg')>('react-native-svg'),
  Stop: jest.fn(() => null),
}));

// The window as the platform reports it; only its width decides the glow
const resizeWindow = (width: number) =>
  act(() => Dimensions.set({ window: { width, height: 1000, scale: 3, fontScale: 1 } }));

// The glow has no role, label or text to be found by, so it is read as the root of what it renders

describe('the radial glow', () => {
  it('spans a multiple of the window width on a phone', async () => {
    await resizeWindow(390);

    await render(<Glow color='#8000ff' style={{}} />);

    expect(screen.root).toHaveProp('width', 390 * GLOW.sizeFactor);
    expect(screen.root).toHaveProp('height', 390 * GLOW.sizeFactor);
  });

  it('spans the same multiple of the content column on a window wider than the column', async () => {
    await resizeWindow(1024);

    await render(<Glow color='#8000ff' style={{}} />);

    expect(screen.root).toHaveProp('width', SIZE.contentMaxWidth * GLOW.sizeFactor);
    expect(screen.root).toHaveProp('height', SIZE.contentMaxWidth * GLOW.sizeFactor);
  });

  it('draws at the size its caller sets, whatever the window', async () => {
    await resizeWindow(1024);

    await render(<Glow color='#8000ff' style={{}} size={200} />);

    expect(screen.root).toHaveProp('width', 200);
    expect(screen.root).toHaveProp('height', 200);
  });

  // The rim must sink into the veil: a sparse stop table banding into grey at the edges was
  // the owner's 2026-10-30 reading, so the falloff is pinned stop by stop. The 2026-10-31 pass
  // kept the curve and densified the mid-band (15 percent runs down to 12) with the tail eased
  // a touch, so neither renderer spends a long span in the muddy mid-alphas
  it('fades on a dense accelerating curve that reaches nothing at the rim', async () => {
    await resizeWindow(390);

    await render(<Glow color={COLORS.gradient.overlay.glow} style={{}} baseOpacity={1} />);

    const calls = (Stop as unknown as jest.Mock).mock.calls.map(([{ offset, stopColor, stopOpacity }]) => [
      offset,
      stopColor,
      stopOpacity,
    ]);

    expect(calls).toEqual([
      ['0%', '#2514a0', 0.75],
      ['12%', '#2514a0', 0.62],
      ['24%', '#2514a0', 0.485],
      ['36%', '#2514a0', 0.36],
      ['48%', '#2514a0', 0.26],
      ['60%', '#2514a0', 0.175],
      ['72%', '#2514a0', 0.105],
      ['84%', '#2514a0', 0.05],
      ['93%', '#2514a0', 0.015],
      ['100%', '#2514a0', 0],
    ]);
  });

  // The owner's 2026-10-31 tint: the navy's hue bent a hint toward the veil top's purple
  // (228 to 247 degrees), saturation and lightness held. Pinned as a literal plus shape,
  // so a future nudge is deliberate: hue inside the band and on its blue side of the old
  // navy to veil-purple midpoint (249), saturation high enough to stay vibrant, lightness
  // low enough to stay deep but high enough to read on glass
  it('glows the shipped deep blue-violet, one ink for both platforms', () => {
    expect(COLORS.gradient.overlay.glow).toBe('#2514a0');

    const [h, s, l] = hslOf(COLORS.gradient.overlay.glow);
    expect(h).toBeGreaterThan(240);
    expect(h).toBeLessThanOrEqual(249);
    expect(s).toBeGreaterThanOrEqual(0.75);
    expect(l).toBeGreaterThan(0.3);
    expect(l).toBeLessThanOrEqual(0.4);
  });
});

// The brief's own axes: hue decides the blue-purple bend, saturation the vibrancy, lightness the depth
const hslOf = (hex: string): [number, number, number] => {
  const n = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  return [(h + 360) % 360, s, l];
};
