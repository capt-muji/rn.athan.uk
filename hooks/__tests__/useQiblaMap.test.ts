/**
 * The Qibla screen's state: what it shows before, during and after the map is read
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';

import { readPosition } from '@/device/qibla';
import { tilesAround } from '@/device/tiles';
import { decodeVectorTile } from '@/shared/vectorTile';

import { mountHook } from './hookHarness';

jest.mock('react', () => require('./hookHarness').react);
jest.mock('@/device/qibla', () => ({ readPosition: jest.fn() }));
jest.mock('@/device/tiles', () => ({ tilesAround: jest.fn() }));

const { useQiblaMap } = require('@/hooks/useQiblaMap') as typeof import('@/hooks/useQiblaMap');

const mockReadPosition = readPosition as jest.MockedFunction<typeof readPosition>;
const mockTilesAround = tilesAround as jest.MockedFunction<typeof tilesAround>;

const LONDON_TILE = { zoom: 15, x: 16372, y: 10896 };
/** The tile's own centre, which is where the real-tile fixtures place the user */
const LONDON = { latitude: 51.505325, longitude: -0.126343 };

const realLondonTile = () => {
  const compressed = readFileSync(join(__dirname, '..', '..', 'shared', '__tests__', 'fixtures', 'London.mvt.gz'));

  return { address: LONDON_TILE, layers: decodeVectorTile(new Uint8Array(gunzipSync(compressed))) };
};

const mount = () => mountHook(() => useQiblaMap(), undefined);

describe('the qibla map state', () => {
  // Both reads are module mocks rather than spies, so nothing in the harness clears them between tests
  beforeEach(() => {
    mockReadPosition.mockReset();
    mockTilesAround.mockReset();
  });

  it('starts by looking, before anything is read', () => {
    expect(mount().result.state).toEqual({ status: 'looking' });
  });

  it('reads nothing until it is asked to, because every sheet is mounted from launch', () => {
    mount();

    expect(mockReadPosition).not.toHaveBeenCalled();
    expect(mockTilesAround).not.toHaveBeenCalled();
  });

  it('names Whitehall and its turn once the tiles arrive', async () => {
    mockReadPosition.mockResolvedValue(LONDON);
    mockTilesAround.mockResolvedValue([realLondonTile()]);
    const hook = mount();

    await hook.result.start();

    const state = hook.result.state;
    if (state.status !== 'ready') throw new Error(`expected ready, got ${state.status}`);
    expect(state.answer.street.name).toBe('Whitehall');
    expect(Math.round(state.answer.turn)).toBe(53);
    expect(state.answer.side).toBe('left');
  });

  it('carries the roads it drew from the same tiles it read', async () => {
    mockReadPosition.mockResolvedValue(LONDON);
    mockTilesAround.mockResolvedValue([realLondonTile()]);
    const hook = mount();

    await hook.result.start();

    const state = hook.result.state;
    if (state.status !== 'ready') throw new Error(`expected ready, got ${state.status}`);
    expect(state.roads.length).toBeGreaterThan(10);
    expect(state.roads[0].points.length).toBeGreaterThan(1);
  });

  it('says the location is unavailable when no position comes back', async () => {
    mockReadPosition.mockResolvedValue(null);
    const hook = mount();

    await hook.result.start();

    expect(hook.result.state).toEqual({ status: 'unavailable' });
    expect(mockTilesAround).not.toHaveBeenCalled();
  });

  it('draws no rail line, so the picture holds only what a person can see', async () => {
    // A synthetic tile, because the real London tile's own rail lines all fall outside the drawn radius
    // 800 tile units is about 149 m, over the 40 m a street must span to be named
    const line = [
      { x: 2048, y: 1648 },
      { x: 2048, y: 2048 },
      { x: 2048, y: 2448 },
    ];
    mockReadPosition.mockResolvedValue(LONDON);
    mockTilesAround.mockResolvedValue([
      {
        address: LONDON_TILE,
        layers: {
          roads: {
            name: 'roads',
            extent: 4096,
            features: [
              { tags: { name: 'Jubilee Line', kind: 'rail', kind_detail: 'subway' }, parts: [line] },
              { tags: { name: 'Whitehall', kind: 'major_road', kind_detail: 'primary' }, parts: [line] },
            ],
          },
        },
      },
    ]);
    const hook = mount();

    await hook.result.start();

    const state = hook.result.state;
    if (state.status !== 'ready') throw new Error(`expected ready, got ${state.status}`);
    expect(state.roads).toHaveLength(1);
  });

  it('draws the tiles that have roads and skips the ones that do not', async () => {
    // A 3 by 3 grid at the coast holds tiles of open water, which carry no roads layer at all
    const tile = realLondonTile();
    mockReadPosition.mockResolvedValue(LONDON);
    mockTilesAround.mockResolvedValue([{ address: { zoom: 15, x: 16371, y: 10896 }, layers: {} }, tile]);
    const hook = mount();

    await hook.result.start();

    const state = hook.result.state;
    if (state.status !== 'ready') throw new Error(`expected ready, got ${state.status}`);
    expect(state.roads.length).toBeGreaterThan(10);
  });

  it('says there is no map here when the archive gave nothing', async () => {
    mockReadPosition.mockResolvedValue(LONDON);
    mockTilesAround.mockResolvedValue([]);
    const hook = mount();

    await hook.result.start();

    expect(hook.result.state).toEqual({ status: 'nomap' });
  });

  it('says there is no map here when the tiles hold no usable street', async () => {
    mockReadPosition.mockResolvedValue(LONDON);
    mockTilesAround.mockResolvedValue([
      { address: LONDON_TILE, layers: { roads: { name: 'roads', extent: 4096, features: [] } } },
    ]);
    const hook = mount();

    await hook.result.start();

    expect(hook.result.state).toEqual({ status: 'nomap' });
  });

  it('says there is no map here when the tiles carry no roads layer at all', async () => {
    mockReadPosition.mockResolvedValue(LONDON);
    mockTilesAround.mockResolvedValue([{ address: LONDON_TILE, layers: {} }]);
    const hook = mount();

    await hook.result.start();

    expect(hook.result.state).toEqual({ status: 'nomap' });
  });

  it('goes back to looking while a second read is in flight', async () => {
    mockReadPosition.mockResolvedValue(null);
    const hook = mount();
    await hook.result.start();
    expect(hook.result.state).toEqual({ status: 'unavailable' });

    let seenWhileReading: string | null = null;
    mockReadPosition.mockImplementation(async () => {
      seenWhileReading = hook.result.state.status;
      return null;
    });
    await hook.result.start();

    expect(seenWhileReading).toBe('looking');
  });
});
