/**
 * The qibla bearing, and the angle maths the compass needle turns on
 *
 * The bearing is validated three ways, because correctness here cannot be checked by inspection: against a published
 * theodolite survey, against independently published values, and against thirteen geometric invariants that separate a
 * great-circle implementation from the rhumb-line and flat-map ones a published study found in a quarter of shipped
 * qibla apps.
 */

import {
  dialAngleFromYaw,
  headingFromYaw,
  KAABA,
  normaliseHeading,
  qiblaBearing,
  shortestDelta,
  unwrapAngle,
} from '../qibla';

/** Every fixture below is quoted to 4dp, so a bound tighter than the quoting would test the quoting */
const SURVEY_TOLERANCE = 0.05;

describe('qiblaBearing', () => {
  describe('against a published theodolite survey', () => {
    // Universiti Teknologi Malaysia, Johor Bahru, surveyed by theodolite and solar observation and published in
    // IJARPED 13(4) at 292 deg 57' 44". The coordinates are recorded beside the value because a fixture whose input is
    // unrecorded cannot be reproduced, and the assertion is against the SURVEY rather than any recomputation of ours.
    it('matches the UTM Johor Bahru survey to better than a twentieth of a degree', () => {
      const surveyed = 292.9622;

      const computed = qiblaBearing({ latitude: 1.5595, longitude: 103.6381 });

      expect(Math.abs(computed - surveyed)).toBeLessThan(SURVEY_TOLERANCE);
    });
  });

  describe('against independently published values', () => {
    const published: Array<[string, number, number, number]> = [
      ['London', 51.5074, -0.1278, 118.99],
      ['New York', 40.7128, -74.006, 58.48],
      ['Jakarta', -6.2088, 106.8456, 295.15],
      ['Sydney', -33.8688, 151.2093, 277.5],
      ['Istanbul', 41.0082, 28.9784, 151.6],
      ['Toronto', 43.6532, -79.3832, 54.6],
      ['Kuala Lumpur', 3.139, 101.6869, 292.5],
      ['Cape Town', -33.9249, 18.4241, 23.4],
      ['Cairo', 30.0444, 31.2357, 136.1],
    ];

    it.each(published)('points from %s at the published bearing', (_city, latitude, longitude, expected) => {
      const computed = qiblaBearing({ latitude, longitude });

      expect(Math.abs(computed - expected)).toBeLessThan(SURVEY_TOLERANCE);
    });
  });

  describe('the geometric invariants', () => {
    // THE HEADLINE. A flat-map or rhumb-line formula returns exactly 90 or 270 from the Kaaba's own latitude, because
    // on those models due east stays due east. The great circle does not, and the gap is 3.65 deg at the nearer
    // sample. In the IJARPED study this single property separated the 15 correct apps from the 5 wrong ones.
    it('does not return due east or due west from the Kaaba own latitude', () => {
      const east = qiblaBearing({ latitude: KAABA.latitude, longitude: 20 });
      const west = qiblaBearing({ latitude: KAABA.latitude, longitude: 50 });

      expect(east).toBeCloseTo(86.3477, 3);
      expect(west).toBeCloseTo(271.8622, 3);
    });

    it('points due south from anywhere on the Kaaba meridian to its north', () => {
      expect(qiblaBearing({ latitude: 40, longitude: KAABA.longitude })).toBeCloseTo(180, 6);
    });

    it('points due north from anywhere on the Kaaba meridian to its south', () => {
      expect(qiblaBearing({ latitude: 0, longitude: KAABA.longitude })).toBeCloseTo(0, 6);
    });

    it('is symmetric about the Kaaba meridian', () => {
      const degreesWest = 19.8261818;
      const west = qiblaBearing({ latitude: KAABA.latitude, longitude: KAABA.longitude - degreesWest });
      const east = qiblaBearing({ latitude: KAABA.latitude, longitude: KAABA.longitude + degreesWest });

      expect(west + east).toBeCloseTo(360, 6);
    });

    // The bearing is computed by adhan from a constant it does not export, so ours is a restatement. A drift of a few
    // thousandths of a degree would be invisible in every other test here, and this is the one that would catch it.
    it('states the same Kaaba position adhan computes from', () => {
      expect(qiblaBearing({ latitude: 40, longitude: KAABA.longitude })).toBeCloseTo(180, 6);
      expect(qiblaBearing({ latitude: 0, longitude: KAABA.longitude })).toBeCloseTo(0, 6);
    });

    // At the pole every direction is south, so the bearing can only be read against the local meridian, and longitude
    // still fixes that meridian. Measured: 0E and 180E give readings a full 180 deg apart, at the pole and near it
    // alike. So the bearing from the pole is the Kaaba's longitude measured from the observer's own, and any claim
    // that it is longitude-independent is false.
    it('is measured against the local meridian at the north pole', () => {
      const fromGreenwich = qiblaBearing({ latitude: 90, longitude: 0 });
      const fromDateline = qiblaBearing({ latitude: 90, longitude: 180 });

      expect(fromGreenwich).toBeCloseTo(180 - KAABA.longitude, 4);
      expect(shortestDelta(fromGreenwich, fromDateline)).toBeCloseTo(180, 4);
    });

    it('always answers inside one turn, over a global sweep', () => {
      for (let latitude = -80; latitude <= 80; latitude += 10) {
        for (let longitude = -180; longitude < 180; longitude += 15) {
          const bearing = qiblaBearing({ latitude, longitude });

          expect(bearing).toBeGreaterThanOrEqual(0);
          expect(bearing).toBeLessThan(360);
          expect(Number.isFinite(bearing)).toBe(true);
        }
      }
    });

    it('is finite at both poles and at the antipode', () => {
      const places = [
        { latitude: 90, longitude: 0 },
        { latitude: -90, longitude: 0 },
        { latitude: -21.4225, longitude: -140.1738 },
      ];

      for (const place of places) {
        expect(Number.isFinite(qiblaBearing(place))).toBe(true);
      }
    });
  });
});

describe('normaliseHeading', () => {
  // Android's calcTrueNorth uses Kotlin's %, which keeps the dividend's sign, so it emits a NEGATIVE heading wherever
  // magnetic declination is negative. That is most of the Americas, and it is indistinguishable from the -1
  // no-permission sentinel to any code that merely tests for a negative number.
  it.each([
    ['New York', -3, 357],
    ['Seattle', -10.6, 349.4],
    ['Cape Town', -20.6, 339.4],
  ])('turns the negative heading Android reports in %s into a compass bearing', (_place, reported, expected) => {
    expect(normaliseHeading(reported)).toBeCloseTo(expected, 6);
  });

  it('leaves a heading that is already in range untouched', () => {
    expect(normaliseHeading(10.3)).toBeCloseTo(10.3, 6);
  });

  it('wraps a heading at or past a full turn', () => {
    expect(normaliseHeading(360)).toBeCloseTo(0, 6);
    expect(normaliseHeading(540)).toBeCloseTo(180, 6);
  });
});

describe('shortestDelta', () => {
  // A naive difference sends the needle the long way round: 359 to 1 travels -358 deg, a visible full spin.
  it.each([
    [359, 1, 2],
    [350, 10, 20],
    [10, 350, -20],
    [0, 180, 180],
    [90, 90, 0],
  ])('turns from %s to %s the short way', (from, to, expected) => {
    expect(shortestDelta(from, to)).toBeCloseTo(expected, 6);
  });

  it('never asks for more than half a turn', () => {
    for (let from = 0; from < 360; from += 7) {
      for (let to = 0; to < 360; to += 11) {
        expect(Math.abs(shortestDelta(from, to))).toBeLessThanOrEqual(180);
      }
    }
  });
});

describe('unwrapAngle', () => {
  // The animated value must stay continuous, because withTiming interpolates between the numbers it is given: handing
  // it a wrapped heading makes it travel the long way however correct that heading is.
  it('carries the accumulated angle past a full turn rather than wrapping it', () => {
    expect(unwrapAngle(359, 1)).toBeCloseTo(361, 6);
  });

  it('carries it below zero in the other direction', () => {
    expect(unwrapAngle(1, 359)).toBeCloseTo(-1, 6);
  });

  it('stays continuous around repeated crossings', () => {
    const samples = [350, 10, 350, 10, 350];
    let current = 350;

    for (const sample of samples) {
      const next = unwrapAngle(current, sample);

      expect(Math.abs(next - current)).toBeLessThanOrEqual(180);
      current = next;
    }
  });
});

describe('headingFromYaw', () => {
  // Reanimated negates the platform azimuth so its axes match iOS, so a positive turn arrives as a negative yaw
  it('turns the sensor yaw into a compass bearing', () => {
    expect(headingFromYaw(-Math.PI / 2, 0)).toBeCloseTo(90, 6);
  });

  it('reads a yaw of zero as north', () => {
    expect(headingFromYaw(0, 0)).toBeCloseTo(0, 6);
  });

  // On Android the correction is the declination, which is what makes a magnetic reading point true
  it('adds an eastward declination', () => {
    expect(headingFromYaw(-Math.PI / 2, 1.2)).toBeCloseTo(91.2, 6);
  });

  it('subtracts a westward declination', () => {
    expect(headingFromYaw(-Math.PI / 2, -14)).toBeCloseTo(76, 6);
  });

  // On iOS the correction is 190, read off the dial: a flat phone aimed at 118.9 degrees reports a yaw of about 71
  it.each([
    [71.1, 118.9],
    [0, 190],
    [90, 100],
    [190, 0],
  ])('turns an iOS yaw of %s into a bearing of %s', (yaw, expected) => {
    expect(headingFromYaw((yaw * Math.PI) / 180, 190)).toBeCloseTo(expected, 1);
  });

  // A bearing that leaves the turn would spin the dial the long way round, so the wrap is closed at both ends
  it('wraps a correction past north back into a bearing', () => {
    expect(headingFromYaw(-Math.PI, 181)).toBeCloseTo(1, 6);
  });

  it('wraps a correction below north back into a bearing', () => {
    expect(headingFromYaw(0, -1)).toBeCloseTo(359, 6);
  });
});

describe('dialAngleFromYaw', () => {
  it('turns a sensor sample into a dial angle', () => {
    expect(dialAngleFromYaw(0, -Math.PI / 2, 0)).toBeCloseTo(90, 6);
  });

  // The dial interpolates between the numbers it is given, so a wrapped angle would spin it the long way round
  it('stays continuous across the north seam', () => {
    expect(dialAngleFromYaw(350, -(10 * Math.PI) / 180, 0)).toBeCloseTo(370, 6);
  });

  it('carries the declination through', () => {
    expect(dialAngleFromYaw(0, -Math.PI / 2, 1.2)).toBeCloseTo(91.2, 6);
  });
});
