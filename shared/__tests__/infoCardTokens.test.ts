/**
 * The info card's own colour tokens (T-515): the background's measured lean toward the
 * resting gradient's navy top, and the outline's faint-but-vibrant purple
 */

import { COLORS } from '@/shared/constants';
import { DESIGN } from '@/shared/design';

type Channels = { r: number; g: number; b: number; a: number };

/** Hex or rgba channels, the same parse BackgroundGradients runs on the gradient's stops */
const channelsOf = (color: string): Channels => {
  if (color.startsWith('#')) {
    const n = Number.parseInt(color.slice(1), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  const [r, g, b, a = 1] = (color.match(/[\d.]+/g) ?? []).map(Number);
  return { r, g, b, a };
};

/** The pre-lean card, rgb(18, 6, 42): the background the owner liked, kept as the derivation's base */
const ELEVATED_BEFORE = { r: 18, g: 6, b: 42 } as const;

/** The owner's step: around 5 percent, one linear step per channel toward the navy top */
const LEAN = 0.05;

const navy = channelsOf(COLORS.gradient.screen.start);

const hueOf = ({ r, g, b }: Channels) => {
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return 0;
  if (max === r) return ((60 * (g - b)) / d + 360) % 360;
  if (max === g) return (60 * (b - r)) / d + 120;
  return (60 * (r - g)) / d + 240;
};

const saturationOf = ({ r, g, b }: Channels) => {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  return max === min ? 0 : (max - min) / (1 - Math.abs(max + min - 1));
};

describe('the info card background lean (owner order 2026-10-30)', () => {
  it("is the old background moved 5 percent toward the gradient's navy top", () => {
    const step = (old: number, toward: number) => Math.round(old + (toward - old) * LEAN);
    const elevated = channelsOf(COLORS.surface.elevated);

    expect(elevated.r).toBe(step(ELEVATED_BEFORE.r, navy.r));
    expect(elevated.g).toBe(step(ELEVATED_BEFORE.g, navy.g));
    expect(elevated.b).toBe(step(ELEVATED_BEFORE.b, navy.b));
  });

  it('stays a touch: every channel within 2 counts of the old background', () => {
    const elevated = channelsOf(COLORS.surface.elevated);

    expect(Math.abs(elevated.r - ELEVATED_BEFORE.r)).toBeLessThanOrEqual(2);
    expect(Math.abs(elevated.g - ELEVATED_BEFORE.g)).toBeLessThanOrEqual(2);
    expect(Math.abs(elevated.b - ELEVATED_BEFORE.b)).toBeLessThanOrEqual(2);
  });

  it('leans at the navy the resting gradient itself paints at its top', () => {
    expect(COLORS.gradient.screen.start).toBe(DESIGN.bgStart);
    expect(navy).toEqual({ r: 5, g: 19, b: 74, a: 1 });
  });
});

describe('the info card outline (owner order 2026-10-30)', () => {
  it("carries the old border's own faintness on a vibrant purple hue", () => {
    const outline = channelsOf(COLORS.surface.elevatedOutline);
    const border = channelsOf(COLORS.surface.elevatedBorder);

    expect(outline.a).toBe(border.a);
    expect(hueOf(outline)).toBeGreaterThanOrEqual(250);
    expect(hueOf(outline)).toBeLessThanOrEqual(290);
    expect(saturationOf(outline)).toBeGreaterThanOrEqual(0.6);
  });
});

describe("the separator's own token", () => {
  it("keeps the old border value: the separator line's pixels do not move", () => {
    expect(COLORS.surface.elevatedBorder).toBe('rgba(45, 22, 106, 0.29)');
  });
});
