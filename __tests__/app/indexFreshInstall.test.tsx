/**
 * The launch screen on a fresh install, in a file of its own: the upgrade check runs once per process
 * (handleAppUpgrade in stores/version.ts), so a fresh install is only modelled by a process's first launch
 */

import { act, render, screen } from '@testing-library/react-native';

import { london, saveLondonDays } from '@/__tests__/harness';
import { mockExpoConfig, resetMockExpoConfig } from '@/shared/__mocks__/expo-constants';

import Index from '../../app/index';

// What a release announces is the owner's editorial choice, made again every release, so the
// suite announces a release of its own
jest.mock('@/shared/whatsNew', () => ({
  ...jest.requireActual('@/shared/whatsNew'),
  __esModule: true,
  currentVisibleWhatsNew: () => ({
    version: '2.0.0',
    items: [{ title: 'Tablet support', body: 'Athan now supported on tablets', version: '2.0.0' }],
  }),
}));

const RELEASE = '2.0.0';

/** A frame and the macrotask after it, which is when the prompts mount */
const FIRST_FRAME_MS = 50;

afterEach(() => {
  resetMockExpoConfig();
});

describe("What's New on a fresh install of release 2.0.0, Friday 11 September 2026 at 14:00", () => {
  it('announces nothing once the first launch is serving days', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    mockExpoConfig.version = RELEASE;
    saveLondonDays();
    await render(<Index />);

    await act(() => jest.advanceTimersByTime(FIRST_FRAME_MS));

    expect(screen.getByRole('button', { name: 'Isha notification: off' })).toBeOnTheScreen();
    expect(screen.queryByText("What's New")).not.toBeOnTheScreen();
  });
});
