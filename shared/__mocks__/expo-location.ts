/** Mirrors the shape `device/qibla.ts` uses, so a suite drives the permission and heading paths without a sensor */

export enum Accuracy {
  Lowest = 1,
  Low = 2,
  Balanced = 3,
  High = 4,
  Highest = 5,
  BestForNavigation = 6,
}

export interface LocationHeadingObject {
  trueHeading: number;
  magHeading: number;
  accuracy: number;
}

export type LocationHeadingCallback = (heading: LocationHeadingObject) => void;

const GRANTED = { granted: true, status: 'granted', canAskAgain: true, expires: 'never' };

export const getForegroundPermissionsAsync = jest.fn(async () => GRANTED);
export const requestForegroundPermissionsAsync = jest.fn(async () => GRANTED);
export const getCurrentPositionAsync = jest.fn(async () => ({
  coords: {
    latitude: 51.5074,
    longitude: -0.1278,
    altitude: 0,
    accuracy: 100,
    altitudeAccuracy: 0,
    heading: 0,
    speed: 0,
  },
  timestamp: 0,
}));
export const getLastKnownPositionAsync = jest.fn(async () => ({
  coords: {
    latitude: 51.5074,
    longitude: -0.1278,
    altitude: 0,
    accuracy: 100,
    altitudeAccuracy: 0,
    heading: 0,
    speed: 0,
  },
  timestamp: 0,
}));
export const watchHeadingAsync = jest.fn(async (_listener: LocationHeadingCallback) => ({ remove: jest.fn() }));
export const getHeadingAsync = jest.fn(
  async (): Promise<LocationHeadingObject> => ({ trueHeading: 120.2, magHeading: 119, accuracy: 3 })
);
