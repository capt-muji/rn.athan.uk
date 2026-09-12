/**
 * Android cold-launch re-arm gate (audit finding 59)
 *
 * Separate file, like widgetPlatform.test.ts: the react-native mock is
 * overridden per file, and this behaviour is defined entirely by Platform.OS.
 *
 * A force-stop cancels every alarm the app has armed but leaves
 * `preference_last_notification_schedule_check` alone, so `refreshNotifications`
 * reads a recent timestamp and skips. Observed on the OnePlus 3T: one armed Fajr
 * alert, force-stop, then three cold launches that never restored it. The gate is
 * therefore reopened on every Android cold launch rather than conditionally,
 * because the loss is not detectable — expo-notifications answers
 * `getAllScheduledNotificationsAsync` from a SharedPreferences store a force-stop
 * does not clear.
 */

const ANDROID = { Platform: { OS: 'android', select: (o: { android?: unknown }) => o.android } };
const IOS = { Platform: { OS: 'ios', select: (o: { ios?: unknown }) => o.ios } };

const GATE_KEY = 'preference_last_notification_schedule_check';

const loadWith = (platform: unknown) => {
  let store!: ReturnType<typeof import('jotai/vanilla').getDefaultStore>;
  let gateAtom!: import('jotai').WritableAtom<number, [number], void>;
  let reopen!: () => void;

  jest.isolateModules(() => {
    jest.doMock('react-native', () => platform);
    const jotai = require('jotai/vanilla');
    const notifications = require('@/stores/notifications');
    store = jotai.getDefaultStore();
    gateAtom = notifications.lastNotificationScheduleAtom;
    reopen = notifications.reopenRefreshGateOnColdLaunch;
  });

  return { store, gateAtom, reopen };
};

describe('reopenRefreshGateOnColdLaunch', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('react-native');
  });

  it('clears the gate on Android so the cold launch re-arms', () => {
    const { store, gateAtom, reopen } = loadWith(ANDROID);
    store.set(gateAtom, Date.now());
    expect(store.get(gateAtom)).toBeGreaterThan(0);

    reopen();

    expect(store.get(gateAtom)).toBe(0);
  });

  it('leaves the gate alone on iOS, where pending notifications survive termination', () => {
    const { store, gateAtom, reopen } = loadWith(IOS);
    const stamped = Date.now();
    store.set(gateAtom, stamped);

    reopen();

    expect(store.get(gateAtom)).toBe(stamped);
  });

  it('names the key it clears, so the MMKV write is the same one the gate reads', () => {
    const { store, gateAtom, reopen } = loadWith(ANDROID);
    store.set(gateAtom, Date.now());

    reopen();

    // RESET routes through the storage adapter's removeItem, so the key is gone
    // from MMKV as well as from the atom
    const Database = require('@/stores/database');
    expect(Database.database.contains(GATE_KEY)).toBe(false);
  });
});
