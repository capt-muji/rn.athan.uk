/**
 * The RTL boundary relaunch (stores/language.ts): crossing between an LTR and an
 * RTL locale converges first, then forces the new direction and reloads the app;
 * a same-direction switch does neither (D59, R1.2, R2.1, R2.2)
 */

import * as Updates from 'expo-updates';
import { getDefaultStore } from 'jotai';
import { I18nManager } from 'react-native';

import { setActiveLocale } from '@/shared/i18n/locale';
import logger from '@/shared/logger';
import {
  commitLanguagePreference,
  consumeRelaunchHandoff,
  languagePreferenceAtom,
  lastArmedLanguageAtom,
  relaunchHandoffAtom,
} from '@/stores/language';
import { rescheduleAllForLanguageChange } from '@/stores/notifications';

jest.mock('@/shared/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

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
// inherit the first's calls and the first's forced direction
beforeEach(() => {
  forceRTL(false);
  jest.clearAllMocks();
  store.set(lastArmedLanguageAtom, '');
  store.set(languagePreferenceAtom, '');
  store.set(relaunchHandoffAtom, '');
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
  forceRTL(true); // the app is currently forced RTL, as the ar crossing left it
  await commitLanguagePreference('en');
  expect(reloadAsync).toHaveBeenCalledTimes(1);
  expect(forceRTL).toHaveBeenLastCalledWith(false);
});

it('a same-direction switch never relaunches', async () => {
  await commitLanguagePreference('ms');
  expect(reloadAsync).not.toHaveBeenCalled();
  expect(forceRTL).not.toHaveBeenCalled();
});

it('a refused relaunch logs and leaves the direction forced for the next launch', async () => {
  reloadAsync.mockRejectedValueOnce(new Error('reload refused'));
  await expect(commitLanguagePreference('ar')).resolves.toBeUndefined();
  expect(forceRTL).toHaveBeenLastCalledWith(true);
  expect(jest.mocked(logger.warn)).toHaveBeenCalledWith(
    'LANGUAGE: relaunch failed after the RTL flip',
    expect.objectContaining({ error: expect.any(Error) })
  );
});

describe('the relaunch handoff', () => {
  it('writes the marker before the reload so the next context can consume it', async () => {
    let markerAtReload = 'unset';
    reloadAsync.mockImplementationOnce(() => {
      markerAtReload = store.get(relaunchHandoffAtom);
      return Promise.resolve();
    });

    await commitLanguagePreference('ar');

    expect(Number.parseInt(markerAtReload, 10)).not.toBeNaN();
    expect(store.get(relaunchHandoffAtom)).toBe(markerAtReload);
  });

  it('clears the marker when the relaunch is refused, so a later cold launch reopens the gate', async () => {
    reloadAsync.mockRejectedValueOnce(new Error('reload refused'));

    await expect(commitLanguagePreference('ar')).resolves.toBeUndefined();

    expect(store.get(relaunchHandoffAtom)).toBe('');
  });

  it('consumes the marker exactly once: true then cleared, false when none was held', () => {
    jest.useFakeTimers({ now: 100_000 });

    try {
      store.set(relaunchHandoffAtom, '99000');

      expect(consumeRelaunchHandoff()).toBe(true);
      expect(store.get(relaunchHandoffAtom)).toBe('');
      expect(consumeRelaunchHandoff()).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });

  it('ignores and clears a stale marker, so one stranded by a dead process cannot skip a cold launch reopen', () => {
    jest.useFakeTimers({ now: 61_000 });

    try {
      store.set(relaunchHandoffAtom, '0');

      expect(consumeRelaunchHandoff()).toBe(false);
      expect(store.get(relaunchHandoffAtom)).toBe('');
    } finally {
      jest.useRealTimers();
    }
  });

  it('treats a non-numeric marker as no handoff: cleared and refused', () => {
    store.set(relaunchHandoffAtom, 'ar');

    expect(consumeRelaunchHandoff()).toBe(false);
    expect(store.get(relaunchHandoffAtom)).toBe('');
  });

  it('marks nothing on a same-direction switch', async () => {
    await commitLanguagePreference('ms');

    expect(store.get(relaunchHandoffAtom)).toBe('');
  });

  it('writes no marker when the cap fired, so the unhealthy relaunch keeps the full pass and its sweep', async () => {
    try {
      jest.useFakeTimers({ now: 0 });
      let release!: (armed: boolean) => void;
      const held = new Promise<boolean>((resolve) => {
        release = resolve;
      });
      reschedule.mockImplementationOnce(() => held);

      const committed = commitLanguagePreference('ar');
      await jest.advanceTimersByTimeAsync(10_001);
      release(true);
      await committed;

      expect(store.get(relaunchHandoffAtom)).toBe('');
    } finally {
      jest.useRealTimers();
    }
  });
});
