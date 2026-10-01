/**
 * The great-circle bearing to the Kaaba, which is the one number the whole feature rests on
 */

import { type Coordinates, KAABA, qiblaBearing } from '@/shared/qiblaGeometry';

const LONDON: Coordinates = { latitude: 51.475, longitude: -0.2015 };
const NEW_YORK: Coordinates = { latitude: 40.7128, longitude: -74.006 };
const LOS_ANGELES: Coordinates = { latitude: 34.0522, longitude: -118.2437 };
const JAKARTA: Coordinates = { latitude: -6.2088, longitude: 106.8456 };
const SYDNEY: Coordinates = { latitude: -33.8688, longitude: 151.2093 };
const CAIRO: Coordinates = { latitude: 30.0444, longitude: 31.2357 };

describe('the qibla bearing', () => {
  // A spread of cities rather than London alone: a qibla NORTH of east is the case a flat-map straight line gets
  // 71 degrees wrong, and London would never have shown it
  it.each([
    ['London', LONDON, 118.8756],
    ['New York', NEW_YORK, 58.4817],
    ['Los Angeles', LOS_ANGELES, 23.8571],
    ['Jakarta', JAKARTA, 295.1517],
    ['Sydney', SYDNEY, 277.4996],
    ['Cairo', CAIRO, 136.1373],
  ])('reads %s as %p degrees', (_city, from, expected) => {
    expect(qiblaBearing(from)).toBeCloseTo(expected, 3);
  });

  it('answers 0 to under 360 rather than a negative angle west of Makkah', () => {
    const bearing = qiblaBearing(LOS_ANGELES);

    expect(bearing).toBeGreaterThanOrEqual(0);
    expect(bearing).toBeLessThan(360);
  });

  it('stays inside a full turn at every longitude, so no reading can be negative', () => {
    for (let longitude = -180; longitude < 180; longitude += 5) {
      const bearing = qiblaBearing({ latitude: 40, longitude });

      expect(bearing).toBeGreaterThanOrEqual(0);
      expect(bearing).toBeLessThan(360);
    }
  });

  it('points due north from straight south of the Kaaba, on its own meridian', () => {
    expect(qiblaBearing({ latitude: KAABA.latitude - 10, longitude: KAABA.longitude })).toBeCloseTo(0, 6);
  });

  it('points due south from straight north of the Kaaba, on its own meridian', () => {
    expect(qiblaBearing({ latitude: KAABA.latitude + 10, longitude: KAABA.longitude })).toBeCloseTo(180, 6);
  });

  it('holds the Kaaba at the coordinates five sources agree on', () => {
    expect(KAABA).toEqual({ latitude: 21.4225, longitude: 39.8262 });
  });

  // 10 km of position error moves the bearing under half a degree, which is why a coarse fix is enough
  it('barely moves for a position 10 km out, so the coarsest fix the platform offers is enough', () => {
    const nearby = { latitude: LONDON.latitude + 0.09, longitude: LONDON.longitude };

    expect(qiblaBearing(nearby)).toBeCloseTo(qiblaBearing(LONDON), 0);
  });
});
