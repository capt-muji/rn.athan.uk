/**
 * Unit tests for components/warmup/IdleLadder.tsx
 *
 * The mount point's contracts: it renders the stage's own consumers — the rehearsal exists only while its stage is
 * the current one — and every mount asks the store to arm the ladder, whose once-per-process latch is the store's
 * own contract (stores/warmup.test.ts). The rehearsal itself is stubbed with a mount ledger: its legs are
 * EntranceRehearsal.test.tsx's.
 */

import { act, render } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai/vanilla';

import IdleLadder from '@/components/warmup/IdleLadder';
import { __resetWarmupForTests, beginIdleLadder, WARMUP_STAGE, warmupStageAtom } from '@/stores/warmup';

jest.mock('@/shared/perf', () => ({ perfMark: jest.fn(), perfMeasure: jest.fn() }));
jest.mock('@/shared/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock('@/stores/warmup', () => {
  const actual = jest.requireActual<typeof import('@/stores/warmup')>('@/stores/warmup');
  return { ...actual, beginIdleLadder: jest.fn() };
});
jest.mock('@/components/warmup/EntranceRehearsal', () => {
  const { useEffect } = require('react');
  const ledger = { mounted: false };
  const Rig = () => {
    useEffect(() => {
      ledger.mounted = true;
      return () => {
        ledger.mounted = false;
      };
    }, []);
    return null;
  };
  return { __esModule: true, default: Rig, ledger };
});
jest.mock('@/components/warmup/SheetWarmup', () => {
  const { useEffect } = require('react');
  const ledger = { mounted: false };
  const Warmup = () => {
    useEffect(() => {
      ledger.mounted = true;
      return () => {
        ledger.mounted = false;
      };
    }, []);
    return null;
  };
  return { __esModule: true, default: Warmup, ledger };
});

const rehearsalMounted = () => jest.requireMock('@/components/warmup/EntranceRehearsal').ledger.mounted;
const warmupMounted = () => jest.requireMock('@/components/warmup/SheetWarmup').ledger.mounted;

const setStage = async (stage: number) => {
  await act(async () => {
    getDefaultStore().set(warmupStageAtom, stage);
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  __resetWarmupForTests();
});

describe('the idle ladder mount point', () => {
  it('renders nothing before the ladder starts', async () => {
    await setStage(WARMUP_STAGE.NOT_STARTED);
    await render(<IdleLadder />);

    expect(rehearsalMounted()).toBe(false);
  });

  it('renders the entrance rehearsal while its stage is the current one, then the warm bodies for the session', async () => {
    await setStage(WARMUP_STAGE.REHEARSAL);
    await render(<IdleLadder />);
    expect(rehearsalMounted()).toBe(true);
    expect(warmupMounted()).toBe(false);

    await setStage(WARMUP_STAGE.SHEET_BODIES);
    expect(rehearsalMounted()).toBe(false);
    expect(warmupMounted()).toBe(true);

    await setStage(WARMUP_STAGE.COMPLETE);
    expect(warmupMounted()).toBe(true);
  });

  it('asks the store to arm on every mount, and re-renders never ask again', async () => {
    const view = await render(<IdleLadder />);
    await view.rerender(<IdleLadder />);
    expect(beginIdleLadder).toHaveBeenCalledTimes(1);

    view.unmount();
    await render(<IdleLadder />);
    expect(beginIdleLadder).toHaveBeenCalledTimes(2);
  });
});
