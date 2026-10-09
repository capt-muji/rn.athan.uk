/**
 * The veil behind the overlay: out of sight while the overlay is closed, in sight while it is open
 */

import { act, render, screen } from '@testing-library/react-native';

import { showLondonDay } from '@/__tests__/harness';
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
});
