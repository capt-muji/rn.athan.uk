/**
 * The info card's background lift (owner order 2026-10-30): brighter to read on glass, still
 * dull, the outline it replaces gone
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

/** The outline era's card: the background the owner could not see on glass */
const SUPERSEDED = { r: 17, g: 7, b: 44 } as const;

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

const luminanceOf = ({ r, g, b }: Channels) => {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

describe('the info card background lift (owner order 2026-10-30)', () => {
  it('is brighter in every channel than the card it replaces, and only a touch', () => {
    const elevated = channelsOf(COLORS.surface.elevated);

    for (const channel of ['r', 'g', 'b'] as const) {
      expect(elevated[channel]).toBeGreaterThan(SUPERSEDED[channel]);
      expect(elevated[channel] - SUPERSEDED[channel]).toBeLessThanOrEqual(15);
    }
  });

  it('stays the dull violet navy the card always wore', () => {
    const elevated = channelsOf(COLORS.surface.elevated);

    expect(hueOf(elevated)).toBeGreaterThanOrEqual(250);
    expect(hueOf(elevated)).toBeLessThanOrEqual(280);
    expect(saturationOf(elevated)).toBeLessThan(0.9);
    expect(luminanceOf(elevated)).toBeLessThan(0.08);
  });

  it('leans at the navy the resting gradient itself paints at its top', () => {
    expect(COLORS.gradient.screen.start).toBe(DESIGN.bgStart);
    expect(channelsOf(COLORS.gradient.screen.start)).toEqual({ r: 5, g: 19, b: 74, a: 1 });
  });
});

describe('the info card outline (owner order 2026-10-30)', () => {
  it('is gone: no outline token survives the lift that replaced it', () => {
    expect(COLORS.surface).not.toHaveProperty('elevatedOutline');
  });
});

describe("the separator's own token", () => {
  it("keeps the old border value: the separator line's pixels do not move", () => {
    expect(COLORS.surface.elevatedBorder).toBe('rgba(45, 22, 106, 0.29)');
  });
});
