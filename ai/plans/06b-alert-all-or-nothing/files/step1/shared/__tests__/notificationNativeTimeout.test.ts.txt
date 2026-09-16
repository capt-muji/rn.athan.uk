/**
 * withNativeTimeout in shared/notifications.ts: a call into the notification system that does not answer
 *
 * The scheduling queue waits for every piece of work it started, so one native call that never answers would stop the
 * app arming or cancelling anything for the rest of the process, with the bell already showing what the user picked.
 * After 15 seconds the call is treated as refused (owner, 2026-09-16).
 */

import { setNotificationChannelAsync } from 'expo-notifications';
import { Platform } from 'react-native';

import { initializeNotifications, withNativeTimeout } from '@/shared/notifications';

jest.mock('@/shared/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  isProd: () => false,
  isPreview: () => false,
  isTest: () => true,
}));

const FAJR_ID = 'athan_standard_fajr_2026-09-16';
const ISHA_ID = 'athan_standard_isha_2026-09-16';

const neverAnswers = () => new Promise<never>(() => undefined);

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  Platform.OS = 'ios';
});

afterEach(() => {
  jest.useRealTimers();
  Platform.OS = 'ios';
  (setNotificationChannelAsync as jest.Mock).mockReset().mockResolvedValue(undefined);
});

// The fifteen-second limit is written out here rather than read from the module: these two tests are what
// pins it (owner, 2026-09-16)
describe('a call into the notification system', () => {
  it('gives back what the call answered', async () => {
    await expect(withNativeTimeout(Promise.resolve(FAJR_ID), `arming ${FAJR_ID}`)).resolves.toBe(FAJR_ID);
  });

  it("gives back the phone's own refusal rather than a timeout", async () => {
    const refusal = Object.assign(new Error('Failed to cancel notification.'), {
      code: 'ERR_NOTIFICATIONS_FAILED_TO_CANCEL',
    });

    await expect(withNativeTimeout(Promise.reject(refusal), `cancelling ${FAJR_ID}`)).rejects.toBe(refusal);
  });

  it('answers a call that lands one millisecond before the limit', async () => {
    let land!: (value: string) => void;
    const work = new Promise<string>((resolve) => {
      land = resolve;
    });
    const raced = withNativeTimeout(work, `arming ${FAJR_ID}`);

    await jest.advanceTimersByTimeAsync(14_999);
    land(FAJR_ID);

    await expect(raced).resolves.toBe(FAJR_ID);
  });

  it('refuses a call that has not answered by the limit, naming what it was doing', async () => {
    const raced = withNativeTimeout(new Promise<string>(() => undefined), `cancelling ${ISHA_ID}`);
    // The expectation is taken BEFORE the clock moves: it is what handles the rejection, and a rejection with no
    // handler yet fails the suite as an unhandled rejection
    const refused = expect(raced).rejects.toThrow(
      `NOTIFICATION SYSTEM: cancelling ${ISHA_ID} did not answer in 15000 ms`
    );

    await jest.advanceTimersByTimeAsync(15_000);

    await refused;
  });

  it('keeps the refusal when the call lands after the limit', async () => {
    let land!: (value: string) => void;
    const work = new Promise<string>((resolve) => {
      land = resolve;
    });
    const raced = withNativeTimeout(work, `arming ${FAJR_ID}`);
    const refused = expect(raced).rejects.toThrow('did not answer');

    await jest.advanceTimersByTimeAsync(15_000);
    land(FAJR_ID);

    await refused;
  });

  it.each([
    { outcome: 'answered', work: () => Promise.resolve(FAJR_ID) },
    { outcome: 'was refused', work: () => Promise.reject(new Error('Failed to schedule notification.')) },
  ])('leaves no timer armed once the call $outcome', async ({ work }) => {
    // A reschedule makes about fifty of these calls, so a timer left armed by each would sit on the phone for
    // fifteen seconds after every pass
    await withNativeTimeout(work(), `arming ${FAJR_ID}`).catch(() => undefined);

    expect(jest.getTimerCount()).toBe(0);
  });
});

describe('start-up when an Android channel never answers', () => {
  it('still refreshes the notifications', async () => {
    // initializeNotifications awaits all three channel calls before it checks the permission and refreshes. A channel
    // decides how a notification sounds, never whether it fires, so losing one must not cost the refresh: the launch
    // and the return from the background are two of the three events on which a refused prayer is put right again
    Platform.OS = 'android';
    (setNotificationChannelAsync as jest.Mock).mockImplementation(neverAnswers);
    const refresh = jest.fn(async () => undefined);
    const started = initializeNotifications(async () => true, refresh);

    await jest.advanceTimersByTimeAsync(15_000);
    await started;

    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
