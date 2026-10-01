/**
 * The one file that touches expo-location: what it asks the user for, and what it passes on untouched
 */

import * as Location from 'expo-location';

import { readPosition, requestQiblaPermission, watchHeading } from '@/device/qibla';

// The platform this file exists to wrap, so the suite owns what it answers
jest.mock('expo-location', () => ({
  Accuracy: { Lowest: 1 },
  requestForegroundPermissionsAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  watchHeadingAsync: jest.fn(),
}));

const mockLocation = Location as jest.Mocked<typeof Location>;

const coordsOf = (latitude: number, longitude: number) =>
  ({ coords: { latitude, longitude } }) as Location.LocationObject;

describe('asking for permission', () => {
  it('asks for foreground location, which is what both the position and the heading need', async () => {
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
      granted: true,
    } as Location.LocationPermissionResponse);

    await expect(requestQiblaPermission()).resolves.toBe(true);
    expect(mockLocation.requestForegroundPermissionsAsync).toHaveBeenCalled();
  });

  it('answers false when the user refuses', async () => {
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
      granted: false,
    } as Location.LocationPermissionResponse);

    await expect(requestQiblaPermission()).resolves.toBe(false);
  });

  it('never asks for background location or any motion permission', async () => {
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
