/**
 * The drawn map: what a person sees of the streets and the qibla across them
 */

import { render, screen } from '@testing-library/react-native';

import QiblaMap from '@/components/qibla/QiblaMap';
import type { StreetShape } from '@/hooks/useQiblaMap';

const HERE = { latitude: 51.5074, longitude: -0.1278 };

/** A road running north from a point a given number of thousandths of a degree east of the user */
const road = (east: number): StreetShape => ({
  points: [
    { latitude: HERE.latitude - 0.001, longitude: HERE.longitude + east },
    { latitude: HERE.latitude + 0.001, longitude: HERE.longitude + east },
  ],
});

describe('the qibla map', () => {
  it('draws a line for every road it is given', async () => {
    await render(<QiblaMap here={HERE} bearing={119} roads={[road(0), road(0.0003), road(0.0006), road(0.0009)]} />);

    expect(screen.getByTestId('qibla-streets').children).toHaveLength(4);
  });

  it('draws nothing where there are no roads, rather than failing', async () => {
    await render(<QiblaMap here={HERE} bearing={119} roads={[]} />);

    expect(screen.getByTestId('qibla-streets').children).toHaveLength(0);
  });

  it('draws the qibla ray', async () => {
    await render(<QiblaMap here={HERE} bearing={119} roads={[road(0)]} />);

    expect(screen.getByTestId('qibla-ray')).toBeTruthy();
  });

  it('marks where the user is standing, which is where the ray begins', async () => {
    await render(<QiblaMap here={HERE} bearing={119} roads={[road(0)]} />);

    expect(screen.getByTestId('qibla-here')).toBeTruthy();
  });

  it('draws the ray down and to the right for a qibla to the south east', async () => {
    await render(<QiblaMap here={HERE} bearing={119} roads={[]} />);

    const ray = screen.getByTestId('qibla-ray').props;

    expect(Number(ray.x2)).toBeGreaterThan(Number(ray.x1));
    expect(Number(ray.y2)).toBeGreaterThan(Number(ray.y1));
  });

  it('draws the ray straight up for a qibla due north', async () => {
    await render(<QiblaMap here={HERE} bearing={0} roads={[]} />);

    const ray = screen.getByTestId('qibla-ray').props;

    expect(Number(ray.x2)).toBeCloseTo(Number(ray.x1), 4);
    expect(Number(ray.y2)).toBeLessThan(Number(ray.y1));
  });
});
