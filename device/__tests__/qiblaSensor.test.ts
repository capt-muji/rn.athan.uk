/**
 * The fused-sensor reader: what it asks the platform for, and what it does when the platform cannot say
 */

import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { IOSReferenceFrame, SensorType, useAnimatedSensor } from 'react-native-reanimated';

import { readDeclination, useOrientationSensor } from '@/device/qiblaSensor';

jest.mock('expo-location', () => ({ getHeadingAsync: jest.fn() }));

jest.mock('react-native-reanimated', () => ({
  useAnimatedSensor: jest.fn(() => ({ sensor: { value: { yaw: 0 } }, unregister: jest.fn(), isAvailable: true })),
  SensorType: { ROTATION: 5 },
  IOSReferenceFrame: { XTrueNorthZVertical: 3 },
}));

const mockLocation = Location as jest.Mocked<typeof Location>;

beforeEach(() => jest.clearAllMocks());

describe('reading the declination on Android, whose sensor reports magnetic north', () => {
  beforeEach(() => {
    Platform.OS = 'android';
  });

  // Taken as the platform's own difference between its two headings, never from a table of ours
  it('reports the gap between the platform\u2019s true and magnetic headings', async () => {
    mockLocation.getHeadingAsync.mockResolvedValue({
      trueHeading: 91.5,
      magHeading: 90,
    } as Location.LocationHeadingObject);

    await expect(readDeclination()).resolves.toBeCloseTo(1.5, 6);
  });

  it('reports a westward declination as negative', async () => {
    mockLocation.getHeadingAsync.mockResolvedValue({
      trueHeading: 88,
      magHeading: 90,
    } as Location.LocationHeadingObject);

    await expect(readDeclination()).resolves.toBeCloseTo(-2, 6);
  });

  // -1 is what the platform reports with no location permission, and correcting by it would be a lie
  it('corrects nothing when the platform cannot give a true heading', async () => {
    mockLocation.getHeadingAsync.mockResolvedValue({
      trueHeading: -1,
      magHeading: 90,
    } as Location.LocationHeadingObject);

    await expect(readDeclination()).resolves.toBe(0);
  });

  it('corrects nothing when the read throws, rather than failing the compass with it', async () => {
    mockLocation.getHeadingAsync.mockRejectedValue(new Error('no compass'));

    await expect(readDeclination()).resolves.toBe(0);
  });
});

describe('the declination on iOS, which CoreMotion has already applied', () => {
  beforeEach(() => {
    Platform.OS = 'ios';
  });

  // XTrueNorthZVertical is already true-north referenced, so adding a declination would count it twice
  it('corrects nothing, and never asks the platform for a heading', async () => {
    await expect(readDeclination()).resolves.toBe(0);
    expect(mockLocation.getHeadingAsync).not.toHaveBeenCalled();
  });
});

describe('arming the orientation sensor', () => {
  it('reads the gyroscope-fused rotation sensor, not a raw magnetometer', () => {
    useOrientationSensor();

    expect(useAnimatedSensor).toHaveBeenCalledWith(SensorType.ROTATION, expect.anything());
  });

  // The default Auto resolves to an arbitrary yaw zero, which is a compass that points at nothing
  it('names the true-north reference frame explicitly rather than taking the default', () => {
    useOrientationSensor();

    expect(useAnimatedSensor).toHaveBeenCalledWith(
      SensorType.ROTATION,
      expect.objectContaining({ iosReferenceFrame: IOSReferenceFrame.XTrueNorthZVertical })
    );
  });

  // expo-location gated its own heading at 50ms and 2 degrees, which is what made a slow turn step
  it('asks for readings at frame rate, so a slow turn is not gated into steps', () => {
    useOrientationSensor();

    const [, config] = (useAnimatedSensor as jest.Mock).mock.calls[0];

    expect(config.interval).toBeLessThanOrEqual(16);
  });

  it('lets the sensor account for a rotated screen, which it cannot otherwise see', () => {
    useOrientationSensor();

    expect(useAnimatedSensor).toHaveBeenCalledWith(
      SensorType.ROTATION,
      expect.objectContaining({ adjustToInterfaceOrientation: true })
    );
  });
});
