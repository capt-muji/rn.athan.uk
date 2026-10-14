/**
 * The language commit's guards: a second pick while one converges is refused,
 * and a starved non-crossing pass cannot hold the loader past the cap (audit 86)
 */

import { getDefaultStore } from 'jotai';

import { setActiveLocale } from '@/shared/i18n/locale';
import logger from '@/shared/logger';
import {
  commitLanguagePreference,
  languageCommitBusyAtom,
  languagePreferenceAtom,
  lastArmedLanguageAtom,
  pendingLanguageAtom,
} from '@/stores/language';
import { rescheduleAllForLanguageChange } from '@/stores/notifications';

// The lock's queueing has its own suite (notificationSchedulingLock); here it must
// only pass the operation through, so the commit's own guards are what the tests see
jest.mock('@/stores/notifications', () => ({
  rescheduleAllForLanguageChange: jest.fn(),
  withSchedulingLock: (operation: () => Promise<unknown>) => operation(),
}));

const store = getDefaultStore();
const rescheduleMock = jest.mocked(rescheduleAllForLanguageChange);

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(logger, 'warn').mockImplementation(() => {});
  setActiveLocale('en');
  store.set(lastArmedLanguageAtom, '');
  store.set(languagePreferenceAtom, '');
});

afterEach(() => {
  setActiveLocale('en');
});

describe('commitLanguagePreference', () => {
  it('refuses a second commit while one is in flight', async () => {
    store.set(lastArmedLanguageAtom, 'en');
    const resolvers: Array<(value: boolean) => void> = [];
    rescheduleMock.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolvers.push(resolve);
        })
    );

    const first = commitLanguagePreference('ms');
    const second = commitLanguagePreference('so');
    for (const resolve of resolvers) resolve(true);
    await Promise.all([first, second]);

    expect(rescheduleMock).toHaveBeenCalledTimes(1);
    expect(store.get(languagePreferenceAtom)).toBe('ms');
    expect(store.get(languageCommitBusyAtom)).toBe(false);
    expect(store.get(pendingLanguageAtom)).toBe(null);
  });

  it('caps a starved non-crossing convergence and proceeds', async () => {
    jest.useFakeTimers();
    try {
      store.set(lastArmedLanguageAtom, 'en');
      rescheduleMock.mockImplementation(() => new Promise<boolean>(() => {}));

      const run = commitLanguagePreference('ms');
      const settled = expect(run).resolves.toBeUndefined();
      await jest.advanceTimersByTimeAsync(10_000);
      await settled;

      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('LANGUAGE:'));
      expect(store.get(languageCommitBusyAtom)).toBe(false);
      expect(store.get(pendingLanguageAtom)).toBe(null);
    } finally {
      jest.useRealTimers();
    }
  });
});
