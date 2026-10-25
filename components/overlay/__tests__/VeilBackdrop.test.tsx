/**
 * The veil behind the overlay: out of sight while the overlay is closed, in sight while it is open
 */

import { act, render, screen } from '@testing-library/react-native';
import { Dimensions, StyleSheet } from 'react-native';

import { showLondonDay } from '@/__tests__/harness';
import { SIZE } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { openOverlay } from '@/stores/overlay';

import VeilBackdrop from '../VeilBackdrop';

describe('the veil on Friday 11 September 2026 at 14:00', () => {
  it('stays out of sight while the overlay is closed', async () => {
    showLondonDay('2026-09-11', '14:00');

    await render(<VeilBackdrop />);

    expect(screen.root).not.toBeVisible();
  });

  // The glow's colour differs between the lists; that is a design value, so only the veil coming into sight is pinned
  it.each([ScheduleType.Standard, ScheduleType.Extra])(
    'comes into sight when the overlay opens on the %s list',
    async (type) => {
      showLondonDay('2026-09-11', '14:00');
      await render(<VeilBackdrop />);

      await act(() => openOverlay(type, 1));

      expect(screen.root).toBeVisible();
    }
  );

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
