/**
 * The one file that touches expo-location: what it asks the user for, and what it passes on untouched
 */

import * as Location from 'expo-location';

import { readPlaceName, readPosition, requestQiblaPermission, watchHeading } from '@/device/qibla';

// The platform this file exists to wrap, so the suite owns what it answers
jest.mock('expo-location', () => ({
  Accuracy: { Lowest: 1 },
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
  watchHeadingAsync: jest.fn(),
}));

const mockLocation = Location as jest.Mocked<typeof Location>;

const coordsOf = (latitude: number, longitude: number) =>
  ({ coords: { latitude, longitude } }) as Location.LocationObject;

// This project does not clear mocks between tests, and a call count is what several of these assert on
beforeEach(() => jest.clearAllMocks());

describe('asking for permission', () => {
  /** What the platform reports when nothing has been granted yet and the user can still be asked */
  const notYetAsked = { granted: false, canAskAgain: true } as Location.LocationPermissionResponse;

  it('asks for foreground location, which is what both the position and the heading need', async () => {
    mockLocation.getForegroundPermissionsAsync.mockResolvedValue(notYetAsked);
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
      granted: true,
    } as Location.LocationPermissionResponse);

    await expect(requestQiblaPermission()).resolves.toBe(true);
    expect(mockLocation.requestForegroundPermissionsAsync).toHaveBeenCalled();
  });

  it('answers false when the user refuses', async () => {
    mockLocation.getForegroundPermissionsAsync.mockResolvedValue(notYetAsked);
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
      granted: false,
    } as Location.LocationPermissionResponse);

    await expect(requestQiblaPermission()).resolves.toBe(false);
  });

  // Prompting outright re-asks on every single open, which is what the owner saw on the S23
  it('never prompts again once the permission is already granted', async () => {
    mockLocation.getForegroundPermissionsAsync.mockResolvedValue({
      granted: true,
    } as Location.LocationPermissionResponse);

    await expect(requestQiblaPermission()).resolves.toBe(true);
    expect(mockLocation.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  });

  // A user who refused permanently must be left alone rather than prompted at every visit
  it('does not prompt when the platform says it may not ask again', async () => {
    mockLocation.getForegroundPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: false,
    } as Location.LocationPermissionResponse);

    await expect(requestQiblaPermission()).resolves.toBe(false);
    expect(mockLocation.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  });

  it('never asks for background location or any motion permission', async () => {
    mockLocation.getForegroundPermissionsAsync.mockResolvedValue(notYetAsked);
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
      granted: true,
    } as Location.LocationPermissionResponse);

    await requestQiblaPermission();

    expect(Object.keys(mockLocation)).not.toContain('requestBackgroundPermissionsAsync');
  });
});

describe('reading the position', () => {
  it('serves the cached fix, so the compass draws at once rather than waiting on a new one', async () => {
    mockLocation.getLastKnownPositionAsync.mockResolvedValue(coordsOf(51.475, -0.2015));

    await expect(readPosition()).resolves.toEqual({ latitude: 51.475, longitude: -0.2015 });
    expect(mockLocation.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('falls back to a fresh fix at the coarsest accuracy, because 3 km moves the qibla under 0.15 degrees', async () => {
    mockLocation.getLastKnownPositionAsync.mockResolvedValue(null);
    mockLocation.getCurrentPositionAsync.mockResolvedValue(coordsOf(40.7128, -74.006));

    await expect(readPosition()).resolves.toEqual({ latitude: 40.7128, longitude: -74.006 });
    expect(mockLocation.getCurrentPositionAsync).toHaveBeenCalledWith({ accuracy: Location.Accuracy.Lowest });
  });

  it('carries only the two numbers the bearing needs, and nothing else the platform reported', async () => {
    mockLocation.getLastKnownPositionAsync.mockResolvedValue({
      coords: { latitude: 1, longitude: 2, altitude: 99, accuracy: 5 },
    } as Location.LocationObject);

    await expect(readPosition()).resolves.toEqual({ latitude: 1, longitude: 2 });
  });
});

describe('naming the position', () => {
  const london = { latitude: 51.475, longitude: -0.2015 };

  it('names the place from the address the platform returns', async () => {
    mockLocation.reverseGeocodeAsync.mockResolvedValue([
      { city: 'London', country: 'United Kingdom' } as Location.LocationGeocodedAddress,
    ]);

    await expect(readPlaceName(london)).resolves.toBe('London, United Kingdom');
    expect(mockLocation.reverseGeocodeAsync).toHaveBeenCalledWith(london);
  });

  // The geocoder is network-backed on both platforms, so it fails offline and is rate-limited. The compass works
  // without it, and a thrown error here would cost the user their bearing
  it('answers null when the geocoder throws, rather than failing the compass with it', async () => {
    mockLocation.reverseGeocodeAsync.mockRejectedValue(new Error('offline'));

    await expect(readPlaceName(london)).resolves.toBeNull();
  });

  it('answers null when the platform knows the coordinates but can name nothing there', async () => {
    mockLocation.reverseGeocodeAsync.mockResolvedValue([]);

    await expect(readPlaceName(london)).resolves.toBeNull();
  });

  it('reads the first address, which is the one the platform ranks best', async () => {
    mockLocation.reverseGeocodeAsync.mockResolvedValue([
      { city: 'Makkah', country: 'Saudi Arabia' } as Location.LocationGeocodedAddress,
      { city: 'Jeddah', country: 'Saudi Arabia' } as Location.LocationGeocodedAddress,
    ]);

    await expect(readPlaceName(london)).resolves.toBe('Makkah, Saudi Arabia');
  });
});

describe('watching the heading', () => {
  it('reports each heading the platform gives', async () => {
    const onReading = jest.fn();
    mockLocation.watchHeadingAsync.mockImplementation(async (callback) => {
      callback({ trueHeading: 42, magHeading: 40, accuracy: 3 });
      return { remove: jest.fn() } as unknown as Location.LocationSubscription;
    });

    await watchHeading(onReading);

    expect(onReading).toHaveBeenCalledWith({ trueHeading: 42 });
  });

  // Core Location's own fused value: a correction of our own is what shipped a reading 90 degrees out
  it('passes trueHeading on untouched, adding no axis, frame or declination term', async () => {
    const onReading = jest.fn();
    mockLocation.watchHeadingAsync.mockImplementation(async (callback) => {
      callback({ trueHeading: 271.5, magHeading: 268, accuracy: 1 });
      return { remove: jest.fn() } as unknown as Location.LocationSubscription;
    });

    await watchHeading(onReading);

    expect(onReading).toHaveBeenCalledWith({ trueHeading: 271.5 });
  });

  it('passes the no-fix sentinel through rather than hiding it, so the screen can go quiet', async () => {
    const onReading = jest.fn();
    mockLocation.watchHeadingAsync.mockImplementation(async (callback) => {
      callback({ trueHeading: -1, magHeading: -1, accuracy: 0 });
      return { remove: jest.fn() } as unknown as Location.LocationSubscription;
    });

    await watchHeading(onReading);

    expect(onReading).toHaveBeenCalledWith({ trueHeading: -1 });
  });

  it('stops the watch when its returned function is called, which is what disarms the magnetometer', async () => {
    const remove = jest.fn();
    mockLocation.watchHeadingAsync.mockResolvedValue({ remove } as unknown as Location.LocationSubscription);

    const unwatch = await watchHeading(jest.fn());
    unwatch();

    expect(remove).toHaveBeenCalled();
  });
});
