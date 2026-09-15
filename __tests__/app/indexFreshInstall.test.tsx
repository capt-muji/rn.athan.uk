/**
 * The launch screen on a fresh install, in a file of its own: the upgrade check runs once per process
 * (handleAppUpgrade in stores/version.ts), so a fresh install is only modelled by a process's first launch
 */

import { act, render, screen } from '@testing-library/react-native';

import { fetchYear } from '@/api/client';
import { london, saveLondonDays } from '@/hooks/__tests__/londonDays';
import { mockExpoConfig, resetMockExpoConfig } from '@/shared/__mocks__/expo-constants';
import type { ISingleApiResponseTransformed } from '@/shared/types';
import * as Database from '@/stores/database';

import Index from '../../app/index';

// Sync downloads the year over the network, so the test decides what the download brings
jest.mock('@/api/client', () => ({
  fetchDay: jest.fn(() => new Promise(() => {})),
  fetchYear: jest.fn(() => new Promise(() => {})),
}));

// What a release announces is the owner's editorial choice, made again every release, so the suite announces a
// release of its own
jest.mock('@/shared/whatsNew', () => ({
  ...jest.requireActual('@/shared/whatsNew'),
  __esModule: true,
  VISIBLE_WHATS_NEW: {
    version: '2.0.0',
    items: [{ title: 'Tablet support', body: 'Athan now supported on tablets', version: '2.0.0' }],
  },
}));

const RELEASE = '2.0.0';

/** A frame and the macrotask after it, which is when the prompts mount */
const FIRST_FRAME_MS = 50;

/** The London days as a download brings them, taken out of storage again so the launch starts without them */
const takeDownloadOfStoredDays = (): ISingleApiResponseTransformed[] => {
  saveLondonDays();
  const days = Database.getAllWithPrefix('prayer_');
  Database.clearPrefix('prayer_');
  return days;
};

afterEach(() => {
  resetMockExpoConfig();
});

describe("What's New on a fresh install of release 2.0.0, Friday 11 September 2026 at 14:00", () => {
  it('announces nothing once the first download has landed', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    mockExpoConfig.version = RELEASE;
    jest.mocked(fetchYear).mockResolvedValueOnce(takeDownloadOfStoredDays());
    await render(<Index />);

    await act(() => jest.advanceTimersByTime(FIRST_FRAME_MS));

    expect(screen.getByRole('button', { name: 'Isha notification: off' })).toBeOnTheScreen();
    expect(screen.queryByText("What's New")).not.toBeOnTheScreen();
  });
});
