/**
 * The pill behind the next prayer: when it shows, and the shadow it carries only where Android can draw one
 */

import { act, render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { showLondonDay } from '@/__tests__/harness';
import { ScheduleType } from '@/shared/types';
import { openOverlay } from '@/stores/overlay';

import ActiveBackground from '../ActiveBackground';

const FAJR = 0;

// Puts back the platform and version an Android test sets
afterEach(() => jest.restoreAllMocks());

describe('the pill on Friday 11 September 2026 at 14:00', () => {
  it.each([ScheduleType.Standard, ScheduleType.Extra])(
    'shows the pill on the %s list while a prayer on it is next',
    async (type) => {
      showLondonDay('2026-09-11', '14:00');

      await render(<ActiveBackground type={type} />);

      expect(screen.root).toBeVisible();
    }
  );

  it('fades while the overlay shows another row of its list', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<ActiveBackground type={ScheduleType.Standard} />);

    await act(() => openOverlay(ScheduleType.Standard, FAJR));

    expect(screen.root).not.toBeVisible();
  });
});

describe('the Standard pill on Saturday 12 September 2026 at 22:00, before a day not stored', () => {
  it('fades, with no prayer on its list still to come', async () => {
    showLondonDay('2026-09-12', '22:00');

    await render(<ActiveBackground type={ScheduleType.Standard} />);

    expect(screen.root).not.toBeVisible();
  });
});

describe('the pill on Android, Friday 11 September 2026 at 14:00', () => {
  // Android 9 drops a view that has rounded corners and a box shadow together, and the pill has rounded corners
  it('carries no shadow on API 28', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    jest.spyOn(Platform, 'Version', 'get').mockReturnValue(28);
    showLondonDay('2026-09-11', '14:00');

    await render(<ActiveBackground type={ScheduleType.Standard} />);

    expect(screen.root).not.toHaveStyle({ boxShadow: expect.anything() });
  });

  it.each([ScheduleType.Standard, ScheduleType.Extra])(
    'carries its shadow on the %s list from API 29',
    async (type) => {
      jest.replaceProperty(Platform, 'OS', 'android');
      jest.spyOn(Platform, 'Version', 'get').mockReturnValue(29);
      showLondonDay('2026-09-11', '14:00');

      await render(<ActiveBackground type={type} />);

      expect(screen.root).toHaveStyle({ boxShadow: expect.any(String) });
    }
  );
});
