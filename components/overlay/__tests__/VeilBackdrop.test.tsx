/**
 * The veil behind the overlay: out of sight while the overlay is closed, in sight while it is open
 */

import { act, render, screen } from '@testing-library/react-native';
import { Dimensions, StyleSheet } from 'react-native';

import { showLondonDay } from '@/__tests__/harness';
import { COLORS, SIZE } from '@/shared/constants';
import { DESIGN } from '@/shared/design';
import { ScheduleType } from '@/shared/types';
import { openOverlay } from '@/stores/overlay';

import VeilBackdrop from '../VeilBackdrop';

// The glow's colour prop is the order's subject (T-515), so the veil's handoff is recorded
// while the real Glow still renders for the offset reads below - the SVG gradient's own
// host props do not survive serialization to assert on
const glowColors: string[] = [];

jest.mock('@/components/ui', () => {
  const actual = jest.requireActual<typeof import('@/components/ui')>('@/components/ui');
  const ActualGlow = actual.Glow;
  return {
    ...actual,
    Glow: (props: React.ComponentProps<typeof ActualGlow>) => {
      glowColors.push(props.color);
      return <ActualGlow {...props} />;
    },
  };
});

describe('the veil on Friday 11 September 2026 at 14:00', () => {
  it('stays out of sight while the overlay is closed', async () => {
    showLondonDay('2026-09-11', '14:00');

    await render(<VeilBackdrop />);

    expect(screen.root).not.toBeVisible();
  });

  // T-515 (owner order 2026-10-30): the veil's glow matches exactly the navy-blue top colour of
  // the resting page's gradient - one constant both readers paint - so the colour is pinned now
  it.each([ScheduleType.Standard, ScheduleType.Extra])(
    'comes into sight when the overlay opens on the %s list',
    async (type) => {
      showLondonDay('2026-09-11', '14:00');
      await render(<VeilBackdrop />);

      await act(() => openOverlay(type, 1));

      expect(screen.root).toBeVisible();
    }
  );

  it.each([ScheduleType.Standard, ScheduleType.Extra])(
    "glows the resting gradient's own top colour on the %s list, unconverted",
    async (type) => {
      glowColors.length = 0;
      showLondonDay('2026-09-11', '14:00');
      await render(<VeilBackdrop />);

      await act(() => openOverlay(type, 1));

      expect(glowColors.at(-1)).toBe(COLORS.gradient.screen.start);
      expect(COLORS.gradient.screen.start).toBe(DESIGN.bgStart);
    }
  );

  // The per-list glow constants the gradient-matching order left dead (T-515)
  it('carries no glow constants of its own', () => {
    expect(COLORS).not.toHaveProperty('glow');
  });

  // R4.1: the glow is centred in window space, so its offset rides a transform under the veil's
  // left-to-right containing view rather than a swappable inset
  it('holds the glow at its measured offset through a transform, with no left key', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<VeilBackdrop />);

    const glow = screen.container.queryAll((node) => node.type === 'RNSVGSvgView')[0];
    const style = StyleSheet.flatten(glow.props.style) as { left?: unknown; transform?: { translateX?: number }[] };
    const { width } = Dimensions.get('window');
    const columnWidth = Math.min(width, SIZE.contentMaxWidth);

    expect(style.transform?.[0]).toEqual({ translateX: width / 2 - columnWidth });
    expect(style.left).toBeUndefined();
  });
});
