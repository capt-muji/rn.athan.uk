/**
 * The RTL boundary relaunch (stores/language.ts): crossing between an LTR and an
 * RTL locale converges first, then forces the new direction and reloads the app;
 * a same-direction switch does neither (D59, R1.2, R2.1, R2.2)
 */

import * as Updates from 'expo-updates';
import { getDefaultStore } from 'jotai';
import { I18nManager } from 'react-native';

import { setActiveLocale } from '@/shared/i18n/locale';
import { commitLanguagePreference, languagePreferenceAtom, lastArmedLanguageAtom } from '@/stores/language';
import { rescheduleAllForLanguageChange } from '@/stores/notifications';

// The lock's queueing has its own suite (notificationSchedulingLock); here it must
// only pass the operation through, so the wrapper spy sees every call
jest.mock('@/stores/notifications', () => ({
  rescheduleAllForLanguageChange: jest.fn(),
  withSchedulingLock: (operation: () => Promise<unknown>) => operation(),
}));

const store = getDefaultStore();
const reschedule = jest.mocked(rescheduleAllForLanguageChange);
const reloadAsync = jest.mocked(Updates.reloadAsync);
const allowRTL = jest.mocked(I18nManager.allowRTL);
const forceRTL = jest.mocked(I18nManager.forceRTL);

reschedule.mockResolvedValue(true);

// The unit project sets no clearMocks, so without this the second and third cases
// inherit the first's calls
beforeEach(() => {
  jest.clearAllMocks();
  store.set(lastArmedLanguageAtom, '');
  store.set(languagePreferenceAtom, '');
});

it('crossing to ar converges, then forces RTL and relaunches', async () => {
  await commitLanguagePreference('ar');
  expect(reloadAsync).toHaveBeenCalledTimes(1);
  const arm = reschedule.mock.invocationCallOrder.at(-1)!;
  const allow = allowRTL.mock.invocationCallOrder.at(-1)!;
  const force = forceRTL.mock.invocationCallOrder.at(-1)!;
  expect(allow).toBeGreaterThan(arm);
  expect(force).toBeGreaterThan(allow);
  expect(forceRTL).toHaveBeenLastCalledWith(true);
});

it('crossing back to en forces LTR and relaunches', async () => {
  store.set(languagePreferenceAtom, 'ar');
  setActiveLocale('ar');
  await commitLanguagePreference('en');
  expect(reloadAsync).toHaveBeenCalledTimes(1);
  expect(forceRTL).toHaveBeenLastCalledWith(false);
});

it('a same-direction switch never relaunches', async () => {
  await commitLanguagePreference('ms');
  expect(reloadAsync).not.toHaveBeenCalled();
  expect(forceRTL).not.toHaveBeenCalled();
});
