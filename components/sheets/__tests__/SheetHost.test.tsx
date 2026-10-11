/**
 * The sheet host (refresh 3): the sheet layer survives the locale remount. The
 * remount key sits on the screen tree and the width measurement, so a presented
 * sheet stays mounted through a switch mid-apply (D51) while the host's locale
 * subscription re-renders the sheets in place (R3.1, R5.2)
 */

import { act, render } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';

import { localeVersionAtom } from '@/shared/i18n/locale';

import { SheetHost } from '../SheetHost';

// The sheet screens carry their own modal machinery; the suite observes the
// host's mount discipline, not the sheets' content
jest.mock('../screens/Alert', () => {
  const { useEffect } = require('react');
  const counts = { mounts: 0, renders: 0 };
  const Screen = () => {
    counts.renders += 1;
    useEffect(() => {
      counts.mounts += 1;
    }, []);
    return null;
  };
  return { __esModule: true, default: Screen, counts };
});
jest.mock('../screens/Language', () => {
  const { useEffect } = require('react');
  const counts = { mounts: 0, renders: 0 };
  const Screen = () => {
    counts.renders += 1;
    useEffect(() => {
      counts.mounts += 1;
    }, []);
    return null;
  };
  return { __esModule: true, default: Screen, counts };
});
jest.mock('../screens/Qibla', () => {
  const { useEffect } = require('react');
  const counts = { mounts: 0, renders: 0 };
  const Screen = () => {
    counts.renders += 1;
    useEffect(() => {
      counts.mounts += 1;
    }, []);
    return null;
  };
  return { __esModule: true, default: Screen, counts };
});
jest.mock('../screens/Settings', () => {
  const { useEffect } = require('react');
  const counts = { mounts: 0, renders: 0 };
  const Screen = () => {
    counts.renders += 1;
    useEffect(() => {
      counts.mounts += 1;
    }, []);
    return null;
  };
  return { __esModule: true, default: Screen, counts };
});
jest.mock('../screens/Sound', () => {
  const { useEffect } = require('react');
  const counts = { mounts: 0, renders: 0 };
  const Screen = () => {
    counts.renders += 1;
    useEffect(() => {
      counts.mounts += 1;
    }, []);
    return null;
  };
  return { __esModule: true, default: Screen, counts };
});

type ScreenName = 'Alert' | 'Language' | 'Qibla' | 'Settings' | 'Sound';
type ScreenCounts = { mounts: number; renders: number };

/** The five sheets' shared mount ledger, in the order the host renders them */
const SCREENS: readonly ScreenName[] = ['Sound', 'Settings', 'Language', 'Alert', 'Qibla'];

const countsFor = (name: ScreenName): ScreenCounts => jest.requireMock(`../screens/${name}`).counts;

describe('the sheet host', () => {
  it('renders nothing before the launch chrome defer', async () => {
    const rendered = await render(<SheetHost deferred={false} />);

    expect(rendered.toJSON()).toBeNull();
    for (const name of SCREENS) {
      expect(countsFor(name).mounts).toBe(0);
    }
  });

  it('re-renders the five sheets on a locale bump without unmounting any', async () => {
    await render(<SheetHost deferred={true} />);

    // The ledgers are live module state, so the baseline copies the numbers
    const rendersBefore = SCREENS.map((name) => countsFor(name).renders);
    for (const name of SCREENS) {
      const counts = countsFor(name);
      expect(counts.mounts).toBe(1);
      expect(counts.renders).toBeGreaterThanOrEqual(1);
    }

    await act(() => {
      getDefaultStore().set(localeVersionAtom, (version) => version + 1);
    });

    for (const [index, name] of SCREENS.entries()) {
      const counts = countsFor(name);
      expect(counts.mounts).toBe(1);
      expect(counts.renders).toBeGreaterThan(rendersBefore[index]);
    }
  });
});
