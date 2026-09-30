/**
 * The qibla sheet: what it shows at each stage, and that no reading on it comes from a sensor
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { readPosition } from '@/device/qibla';
import { tilesAround } from '@/device/tiles';
import { decodeVectorTile } from '@/shared/vectorTile';

import QiblaSheet from '../Qibla';

jest.mock('@/device/qibla', () => ({ readPosition: jest.fn() }));
jest.mock('@/device/tiles', () => ({ tilesAround: jest.fn() }));

const mockReadPosition = readPosition as jest.MockedFunction<typeof readPosition>;
const mockTilesAround = tilesAround as jest.MockedFunction<typeof tilesAround>;

const LONDON_TILE = { zoom: 15, x: 16372, y: 10896 };
/** The tile's own centre, which is the position the real-tile fixture is keyed to */
const LONDON = { latitude: 51.505325, longitude: -0.126343 };

const realLondonTile = () => {
  const path = join(__dirname, '..', '..', '..', '..', 'shared', '__tests__', 'fixtures', 'London.mvt.gz');

  return { address: LONDON_TILE, layers: decodeVectorTile(new Uint8Array(gunzipSync(readFileSync(path)))) };
};

/** The sheet reads its position when it finishes opening, never on mount */
const present = async () => {
  await render(<QiblaSheet />);
  await act(async () => {
    fireEvent(screen.getByText('Qibla'), 'change', 0);
  });
};

describe('the qibla sheet', () => {
  beforeEach(() => {
    mockReadPosition.mockReset();
    mockTilesAround.mockReset();
  });

  it('reads no position until it is opened, because every sheet is mounted from launch', async () => {
    await render(<QiblaSheet />);

    expect(mockReadPosition).not.toHaveBeenCalled();
    expect(mockTilesAround).not.toHaveBeenCalled();
  });

  it('states the qibla against a street once the map is ready', async () => {
    mockReadPosition.mockResolvedValue(LONDON);
    mockTilesAround.mockResolvedValue([realLondonTile()]);

    await present();

    await waitFor(() => {
      expect(screen.getByText('Stand along Whitehall, then turn 53 degrees to the left.')).toBeTruthy();
    });
  });

  it('draws the map beside the sentence, which is what resolves its direction', async () => {
    mockReadPosition.mockResolvedValue(LONDON);
    mockTilesAround.mockResolvedValue([realLondonTile()]);

    await present();

    await waitFor(() => {
      expect(screen.getByTestId('qibla-ray')).toBeTruthy();
    });
  });

  it('says the location is unavailable when no position comes back', async () => {
    mockReadPosition.mockResolvedValue(null);

    await present();

    await waitFor(() => {
      expect(screen.getByText('Your location is not available right now')).toBeTruthy();
    });
    expect(screen.queryByTestId('qibla-ray')).toBeNull();
  });

  it('says there is no map data when no street is usable', async () => {
    mockReadPosition.mockResolvedValue(LONDON);
    mockTilesAround.mockResolvedValue([]);

    await present();

    await waitFor(() => {
      expect(screen.getByText('No map data for this spot')).toBeTruthy();
    });
    expect(screen.queryByTestId('qibla-ray')).toBeNull();
  });

  it('says it is finding the position before anything has arrived', async () => {
    mockReadPosition.mockReturnValue(new Promise(() => {}));

    await present();

    expect(screen.getByText('Finding your position')).toBeTruthy();
  });
});
