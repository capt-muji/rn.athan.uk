/**
 * The location and heading boundary: what the compass asks the phone for, and what it does with a refusal
 */

import * as Location from 'expo-location';

import { hasLocationPermission, readPosition, requestLocationPermission, watchHeading } from '../qibla';

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

  it('answers true when the request ends granted', async () => {
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValueOnce(permission(true));

    await expect(requestLocationPermission()).resolves.toBe(true);
  });

  it('answers false when the request is refused', async () => {
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValueOnce(permission(false));

    await expect(requestLocationPermission()).resolves.toBe(false);
  });

  it('answers false when the request throws', async () => {
    mockLocation.requestForegroundPermissionsAsync.mockRejectedValueOnce(new Error('unavailable'));

    await expect(requestLocationPermission()).resolves.toBe(false);
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

  it('answers null when the position cannot be read', async () => {
    mockLocation.getCurrentPositionAsync.mockRejectedValueOnce(new Error('timeout'));

    await expect(readPosition()).resolves.toBeNull();
  });
});

describe('watchHeading', () => {
  beforeEach(() => jest.clearAllMocks());

  /** Hands back the listener expo-location was given, so a test can feed it readings */
  const captureListener = () => {
    const remove = jest.fn();
    let listener!: Location.LocationHeadingCallback;

    mockLocation.watchHeadingAsync.mockImplementationOnce(async (given) => {
      listener = given;
      return { remove };
    });

    return { remove, emit: (trueHeading: number) => listener({ trueHeading, magHeading: 0, accuracy: 3 }) };
  };

  it('reports a heading the phone gives', async () => {
    const heard: number[] = [];
    const stream = captureListener();

    await watchHeading((heading) => heard.push(heading));
    stream.emit(118.99);

    expect(heard).toHaveLength(1);
    expect(heard[0]).toBeCloseTo(118.99, 6);
  });

  // Android's calcTrueNorth keeps the sign of the dividend, so declination west of zero yields a negative bearing
  it('turns the negative heading Android reports into a compass bearing', async () => {
    const heard: number[] = [];
    const stream = captureListener();

    await watchHeading((heading) => heard.push(heading));
    stream.emit(-3);

    expect(heard).toHaveLength(1);
    expect(heard[0]).toBeCloseTo(357, 6);
  });

  // -1 means "no fix yet", and normalising it first would draw it as 359 deg: a confident arrow pointing nowhere
  it('ignores the not-ready reading rather than drawing it', async () => {
    const heard: number[] = [];
    const stream = captureListener();

    await watchHeading((heading) => heard.push(heading));
    stream.emit(-1);

    expect(heard).toEqual([]);
  });

  it('stops the stream when the caller lets go', async () => {
    const stream = captureListener();

    const stop = await watchHeading(() => {});
    stop();

    expect(stream.remove).toHaveBeenCalledTimes(1);
  });
});
