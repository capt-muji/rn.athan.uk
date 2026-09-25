/**
 * The lock screen card toggle in the settings sheet.
 *
 * Separate file: the flag and Platform.OS are both read at module scope, so
 * the Android-with-the-flag-on build is the only one that can show this row
 * and it cannot be arranged inside the main suite.
 */

jest.mock('@/shared/flags', () => ({
  FEATURE_FLAGS: { widgets: false, androidWidgets: false, androidLockCard: true },
}));

import { fireEvent, render, screen } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';
import { Platform } from 'react-native';

import { london } from '@/__tests__/harness';
import { lockCardEnabledAtom } from '@/stores/ui';

import SettingsSheet from '../Settings';

jest.mock('@/shared/whatsNew', () => ({ VISIBLE_WHATS_NEW: null }));

const store = getDefaultStore();

describe('the lock screen card toggle on Android', () => {
  beforeEach(() => {
    Platform.OS = 'android';
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
  });

  it('shows the row and flips the preference when it is pressed', async () => {
    store.set(lockCardEnabledAtom, false);

    await render(<SettingsSheet />);
    await fireEvent.press(screen.getByText('Show lock screen card'));

    expect(store.get(lockCardEnabledAtom)).toBe(true);
  });

  it('hides the row on iOS, where the Lock Screen widget carries the same content', async () => {
    Platform.OS = 'ios';

    await render(<SettingsSheet />);

    expect(screen.queryByText('Show lock screen card')).not.toBeOnTheScreen();
  });
});
