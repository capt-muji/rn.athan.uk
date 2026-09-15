/**
 * The error screen: its Refresh button is the way out of a launch that failed
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Updates from 'expo-updates';

import { clearUpgradeCache } from '@/stores/version';

import ErrorScreen from '../Error';

// Refresh wipes the cache and restarts the app, so both calls are observed instead of run
jest.mock('expo-updates', () => ({ reloadAsync: jest.fn(() => Promise.resolve()) }));
jest.mock('@/stores/version', () => ({ clearUpgradeCache: jest.fn() }));

describe('the error screen after a launch that failed', () => {
  it('clears the cached data before reloading the app when Refresh is pressed', async () => {
    await render(<ErrorScreen />);

    await fireEvent.press(screen.getByText('Refresh'));

    expect(clearUpgradeCache).toHaveBeenCalledTimes(1);
    expect(Updates.reloadAsync).toHaveBeenCalledTimes(1);
    const [clearedAt] = jest.mocked(clearUpgradeCache).mock.invocationCallOrder;
    const [reloadedAt] = jest.mocked(Updates.reloadAsync).mock.invocationCallOrder;
    expect(clearedAt).toBeLessThan(reloadedAt);
  });
});
