/**
 * The location and heading boundary: what the compass asks the phone for, and what it does with a refusal
 */

import * as Location from 'expo-location';
import { Linking } from 'react-native';

import {
  hasLocationPermission,
  openLocationSettings,
  readDeclination,
  readPosition,
  requestLocationPermission,
} from '../qibla';

const mockLocation = Location as jest.Mocked<typeof Location>;

/** The permission module answers with more fields than this boundary reads, so the unread ones are filled here once */
const permission = (granted: boolean) =>
  ({
    granted,
    status: granted ? 'granted' : 'denied',
    canAskAgain: true,
    expires: 'never',
  }) as Awaited<ReturnType<typeof Location.getForegroundPermissionsAsync>>;

/** Likewise the position: only the two coordinates are read, and the rest exist to satisfy the platform type */
const position = (latitude: number, longitude: number) =>
  ({
    coords: { latitude, longitude, altitude: 0, accuracy: 100, altitudeAccuracy: 0, heading: 0, speed: 0 },
    timestamp: 0,
  }) as Awaited<ReturnType<typeof Location.getCurrentPositionAsync>>;

describe('hasLocationPermission', () => {
  beforeEach(() => jest.clearAllMocks());

  it('answers true while the permission is granted', async () => {
    mockLocation.getForegroundPermissionsAsync.mockResolvedValueOnce(permission(true));

    await expect(hasLocationPermission()).resolves.toBe(true);
  });

  it('answers false while it is not', async () => {
    mockLocation.getForegroundPermissionsAsync.mockResolvedValueOnce(permission(false));

    await expect(hasLocationPermission()).resolves.toBe(false);
  });

  // An iOS one-time grant reverts on its own, so a cached answer goes stale with nothing to announce it
  it('asks the phone on every call rather than remembering', async () => {
    await hasLocationPermission();
    await hasLocationPermission();

    expect(mockLocation.getForegroundPermissionsAsync).toHaveBeenCalledTimes(2);
  });

  it('answers false when the permission cannot be read', async () => {
    mockLocation.getForegroundPermissionsAsync.mockRejectedValueOnce(new Error('no provider'));

    await expect(hasLocationPermission()).resolves.toBe(false);
  });
});

describe('requestLocationPermission', () => {
  beforeEach(() => jest.clearAllMocks());

  it('answers granted when the request ends granted', async () => {
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValueOnce(permission(true));

    await expect(requestLocationPermission()).resolves.toEqual({ granted: true, canAskAgain: true });
  });

  it('answers refused, and whether asking again could ever work', async () => {
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValueOnce(permission(false));

    await expect(requestLocationPermission()).resolves.toEqual({ granted: false, canAskAgain: true });
  });

  // Android shows the dialog again after ONE refusal, so a re-ask is a real prompt and not a silent no-op
  it('reports that asking again can still work after a first refusal', async () => {
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValueOnce(permission(false));

    const { canAskAgain } = await requestLocationPermission();

    expect(canAskAgain).toBe(true);
  });

  // Leaving the Android 12+ toggle on Approximate grants coarse alone, which the compass fully supports: coarse is
  // about 3 km and the qibla needs 10 km to move half a degree
  it('counts an approximate grant as granted', async () => {
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValueOnce(permission(true));

    const { granted } = await requestLocationPermission();

    expect(granted).toBe(true);
  });

  // A permanent refusal makes every later request a silent no-op, so the caller must be told to stop asking
  it('reports that asking again cannot work once the refusal is permanent', async () => {
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValueOnce({
      ...permission(false),
      canAskAgain: false,
    });

    await expect(requestLocationPermission()).resolves.toEqual({ granted: false, canAskAgain: false });
  });

  it('answers refused and final when the request throws', async () => {
    mockLocation.requestForegroundPermissionsAsync.mockRejectedValueOnce(new Error('unavailable'));

    await expect(requestLocationPermission()).resolves.toEqual({ granted: false, canAskAgain: false });
  });
});

describe('openLocationSettings', () => {
  beforeEach(() => jest.clearAllMocks());

  it('opens the app settings page', async () => {
    await openLocationSettings();

    expect(Linking.openSettings).toHaveBeenCalledTimes(1);
  });

  // The caller has nothing to fall back on, so a failure to open must not take the app down with it
  it('does not throw when settings cannot open', async () => {
    (Linking.openSettings as jest.Mock).mockRejectedValueOnce(new Error('no activity'));

    await expect(openLocationSettings()).resolves.toBeUndefined();
  });
});

describe('readPosition', () => {
  beforeEach(() => jest.clearAllMocks());

  it('answers the coordinates the phone reports', async () => {
    mockLocation.getCurrentPositionAsync.mockResolvedValueOnce(position(51.5074, -0.1278));

    await expect(readPosition()).resolves.toEqual({ latitude: 51.5074, longitude: -0.1278 });
  });

  // 10 km of position error moves the qibla by half a degree, so anything finer spends battery for nothing
  it('asks for city accuracy rather than the finest the phone offers', async () => {
    await readPosition();

    expect(mockLocation.getCurrentPositionAsync).toHaveBeenCalledWith({ accuracy: Location.Accuracy.Balanced });
  });

  // A stale fix draws a confidently wrong arrow, which is worse than no arrow: a traveller who has just landed would
  // be pointed at the qibla for the country they left
  it('answers null when the position cannot be read, rather than an older one', async () => {
    mockLocation.getCurrentPositionAsync.mockRejectedValueOnce(new Error('LocationUnavailable'));

    await expect(readPosition()).resolves.toBeNull();
    expect(mockLocation.getLastKnownPositionAsync).not.toHaveBeenCalled();
  });
});

describe('readDeclination', () => {
  beforeEach(() => jest.clearAllMocks());

  // The fused sensor is magnetic-referenced, so this gap is the whole correction that makes the needle point true
  it('reports the gap between the magnetic and true headings', async () => {
    mockLocation.getHeadingAsync.mockResolvedValueOnce({ trueHeading: 120.2, magHeading: 119, accuracy: 3 });

    await expect(readDeclination()).resolves.toBeCloseTo(1.2, 6);
  });

  // Declination is negative across the Americas, and a correction that cannot go negative would bend every bearing
  it('reports a westward declination as negative', async () => {
    mockLocation.getHeadingAsync.mockResolvedValueOnce({ trueHeading: 105, magHeading: 119, accuracy: 3 });

    await expect(readDeclination()).resolves.toBeCloseTo(-14, 6);
  });

  // The gap is a turn, not a subtraction: 359 to 1 is two degrees east, never 358 west
  it('takes the short way round the wrap', async () => {
    mockLocation.getHeadingAsync.mockResolvedValueOnce({ trueHeading: 1, magHeading: 359, accuracy: 3 });

    await expect(readDeclination()).resolves.toBeCloseTo(2, 6);
  });

  // -1 is the platform's "no fix yet", and treating it as a bearing would bend the needle by a whole degree
  it('corrects nothing when the platform has no true heading', async () => {
    mockLocation.getHeadingAsync.mockResolvedValueOnce({ trueHeading: -1, magHeading: 119, accuracy: 0 });

    await expect(readDeclination()).resolves.toBe(0);
  });

  it('corrects nothing when the read throws', async () => {
    mockLocation.getHeadingAsync.mockRejectedValueOnce(new Error('no sensor'));

    await expect(readDeclination()).resolves.toBe(0);
  });
});
