/**
 * The Suhoor row's fasting indicator: the bordered identity cluster rides the
 * extras Suhoor row's bell only while the selection is not Every day, follows
 * the committed selection atoms live, reads a stored pair off the six sets
 * first, and sinks with the row it rides through the overlay veil.
 */

import { act, render, screen } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';
import { StyleSheet } from 'react-native';
import type { TestInstance } from 'test-renderer';

import { seedPagerPage, showLondonDay } from '@/__tests__/harness';
import { ScheduleType } from '@/shared/types';
import { fastingModeAtom, fastingWhiteDaysAtom } from '@/stores/notifications';

import FastingBellCluster from '../FastingBellCluster';
import Prayer from '../Prayer';

const SUHOOR = 2;
const DUHA = 3;

const store = getDefaultStore();

const GREEN = 'rgba(74, 222, 128, 1)';
const CYAN = 'rgba(34, 211, 238, 1)';
const WHITE = 'rgba(255, 255, 255, 1)';

type FlatStyle = Record<string, unknown>;

const flat = (node: TestInstance): FlatStyle => (StyleSheet.flatten(node.props.style) ?? {}) as FlatStyle;

/** The bordered circles in render order: fill, ring weight, ring color, size */
const ringDots = (root: TestInstance) =>
  root.queryAll((node) => flat(node).borderWidth !== undefined).map((node) => flat(node));

/** The overlap wrappers' left offsets, in render order (the later circle is on top) */
const ringLefts = (root: TestInstance) =>
  root
    .queryAll((node) => flat(node).position === 'absolute' && flat(node).top === undefined)
    .map((node) => flat(node).left);

const cluster = () => screen.getByTestId('fasting-bell-cluster');

const arm = (mode: string, whiteDaysAddOn: boolean) =>
  act(() => {
    store.set(fastingModeAtom, mode);
    store.set(fastingWhiteDaysAtom, whiteDaysAddOn);
  });

const renderSuhoorRow = async () => {
  const view = await render(<Prayer type={ScheduleType.Extra} index={SUHOOR} />);
  await act(() => jest.runAllTimersAsync());
  return view;
};

beforeEach(() => {
  seedPagerPage(0);
  showLondonDay('2026-09-11', '12:00');
  store.set(fastingModeAtom, 'everyDay');
  store.set(fastingWhiteDaysAtom, false);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('the extras Suhoor row under a regimen selection', () => {
  it('draws the armed identities bordered, the white circle right and drawn last', async () => {
    await arm('muhammad', true);
    await renderSuhoorRow();

    const dots = ringDots(cluster());
    // The harness-approved anchor: 25 from the row's start, 10 down, in the bell's own box
    expect(cluster()).toHaveStyle({ position: 'absolute', top: 10, start: 25 });
    expect(dots.map((style) => style.backgroundColor)).toEqual([GREEN, WHITE]);
    for (const style of dots) {
      expect(style.borderWidth).toBe(2);
      expect(style.borderColor).toBe('#1B1967');
      expect(style.width).toBe(8.5);
      expect(style.height).toBe(8.5);
    }
    // Forty percent into each other: the second circle sits 8.5 * 0.6 to the right
    expect(ringLefts(cluster())).toEqual([0, 5.1]);
  });

  it('draws one circle for a lone regimen, no partner to overlap', async () => {
    await arm('dawood', false);
    await renderSuhoorRow();

    expect(ringDots(cluster()).map((style) => style.backgroundColor)).toEqual([CYAN]);
    expect(ringLefts(cluster())).toEqual([]);
  });
});

describe('the row the cluster rides', () => {
  it('draws nothing on Every day', async () => {
    await renderSuhoorRow();

    expect(screen.queryByTestId('fasting-bell-cluster')).toBeNull();
  });

  it('reads a stored every-day pair with the add-on bit as Every day', async () => {
    await arm('everyDay', true);
    await renderSuhoorRow();

    expect(screen.queryByTestId('fasting-bell-cluster')).toBeNull();
  });

  it('carries no cluster on any other row, extras or standard', async () => {
    await arm('muhammad', true);
    await render(<Prayer type={ScheduleType.Extra} index={DUHA} />);
    await render(<Prayer type={ScheduleType.Standard} index={0} />);

    expect(screen.queryByTestId('fasting-bell-cluster')).toBeNull();
  });
});

describe('the committed selection flowing onto the row', () => {
  it('re-arms the cluster as the stored selection changes, and clears it on Every day', async () => {
    await renderSuhoorRow();
    expect(screen.queryByTestId('fasting-bell-cluster')).toBeNull();

    await arm('muhammad', true);
    expect(ringDots(cluster()).map((style) => style.backgroundColor)).toEqual([GREEN, WHITE]);

    await arm('dawood', false);
    expect(ringDots(cluster()).map((style) => style.backgroundColor)).toEqual([CYAN]);

    await arm('everyDay', false);
    expect(screen.queryByTestId('fasting-bell-cluster')).toBeNull();
  });
});

describe('the overlay veil over the cluster', () => {
  // The row's content cut (display none) is Prayer's own suite; what pins here
  // is the veil target itself - the cluster is dots, not text, so it sinks
  // through the wrapper's opacity exactly as the bell it rides does
  it('sinks while its row is veiled and rises back with it', async () => {
    await arm('muhammad', true);

    const veiled = await render(<FastingBellCluster hidden={true} />);
    expect(screen.getByTestId('fasting-bell-cluster')).toHaveStyle({ opacity: 0 });

    veiled.unmount();
    await render(<FastingBellCluster hidden={false} />);
    expect(screen.getByTestId('fasting-bell-cluster')).toHaveStyle({ opacity: 1 });
  });
});
