/**
 * The Suhoor row's fasting indicator: the bordered identity cluster rides the
 * extras Suhoor row's bell only while the selection is not Every day, follows
 * the committed selection atoms live, reads a stored pair off the six sets
 * first, and sinks with the row it rides through the overlay veil. The circles
 * are SVG, drawn white-first: the white circle beneath at the left, the
 * regimen on top at the right, a lone identity in the pair's right slot.
 */

import { act, render, screen } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';
import { StyleSheet } from 'react-native';
import type { TestInstance } from 'test-renderer';

import { seedPagerPage, showLondonDay } from '@/__tests__/harness';
import { AlertType, ScheduleType } from '@/shared/types';
import {
  extraPrayerAlertAtoms,
  fastingModeAtom,
  fastingWhiteDaysAtom,
  getPrayerAlertAtom,
} from '@/stores/notifications';

import FastingBellCluster from '../FastingBellCluster';
import Prayer from '../Prayer';

const SUHOOR = 2;
const DUHA = 3;

const store = getDefaultStore();

const GREEN = 'rgba(74, 222, 128, 1)';
const DAWOOD = 'rgba(255, 222, 5, 1)';
const WHITE = 'rgba(255, 255, 255, 1)';
// #1B1967, the rings' deep background shade, as RNSVG resolves it at render
const RING = 'rgba(27, 25, 103, 1)';

type FlatStyle = Record<string, unknown>;

const flat = (node: TestInstance): FlatStyle => (StyleSheet.flatten(node.props.style) ?? {}) as FlatStyle;

interface RingDotProps {
  fill: string | { payload: number };
  r: number;
  stroke: string | { payload: number };
  strokeWidth: number;
}

/** A color prop as the app's own string: RNSVG resolves it into an ARGB payload at render */
const colorOf = (value: string | { payload: number }): string => {
  if (typeof value === 'string') return value;
  const argb = value.payload >>> 0;
  return `rgba(${(argb >>> 16) & 255}, ${(argb >>> 8) & 255}, ${argb & 255}, ${((argb >>> 24) & 255) / 255})`;
};

/** The bordered circles in draw order: fill, radius, ring color, ring weight */
const circles = (root: TestInstance) =>
  root
    .queryAll((node) => node.type === 'RNSVGCircle')
    .map((node) => {
      const props = node.props as RingDotProps;
      return { ...props, fill: colorOf(props.fill), stroke: colorOf(props.stroke) };
    });

/** The overlap wrappers' left offsets, in draw order (the later circle is on top) */
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

/** The Suhoor row's own at-time alert: the bell the cluster rides */
const suhoorBell = (alert: AlertType) =>
  act(() => {
    store.set(getPrayerAlertAtom(ScheduleType.Extra, SUHOOR), alert);
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
  store.set(getPrayerAlertAtom(ScheduleType.Extra, SUHOOR), AlertType.Sound);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('the extras Suhoor row under a regimen selection', () => {
  it('draws the identities white-first: white beneath at the left, the regimen on top at the right', async () => {
    await arm('muhammad', true);
    await renderSuhoorRow();

    // The harness-approved anchor: 25 from the row's start, 10 down, in the bell's own box
    expect(cluster()).toHaveStyle({ position: 'absolute', top: 10, start: 25 });
    const dots = circles(cluster());
    expect(dots.map((dot) => dot.fill)).toEqual([WHITE, GREEN]);
    for (const dot of dots) {
      // The ring straddles the path, so the outer edge lands on 8.5
      expect(dot.r).toBe(3.5);
      expect(dot.stroke).toBe(RING);
      expect(dot.strokeWidth).toBe(1.5);
    }
    expect(
      cluster()
        .queryAll((node) => node.type === 'RNSVGSvgView')
        .map((node) => node.props.width)
    ).toEqual([8.5, 8.5]);
    // Forty percent into each other: the second circle sits 8.5 * 0.6 to the right
    expect(ringLefts(cluster())).toEqual([0, 5.1]);
  });

  it("draws one circle for a lone regimen, in the pair's own right slot", async () => {
    await arm('dawood', false);
    await renderSuhoorRow();

    const dots = circles(cluster());
    expect(dots.map((dot) => dot.fill)).toEqual([DAWOOD]);
    expect(dots[0]).toMatchObject({ r: 3.5, stroke: RING, strokeWidth: 1.5 });
    expect(ringLefts(cluster())).toEqual([5.1]);
    // The lone circle keeps the pair's footprint, so the bell's corner never moves
    const wrappers = cluster().queryAll((node) => flat(node).width === 13.6);
    expect(wrappers).toHaveLength(1);
    expect(flat(wrappers[0]).height).toBe(8.5);
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
    expect(circles(cluster()).map((dot) => dot.fill)).toEqual([WHITE, GREEN]);

    await arm('dawood', false);
    expect(circles(cluster()).map((dot) => dot.fill)).toEqual([DAWOOD]);

    await arm('everyDay', false);
    expect(screen.queryByTestId('fasting-bell-cluster')).toBeNull();
  });
});

describe("the Suhoor row's bell under an off at-time alert", () => {
  // Nothing is scheduled under an off alert, so nothing draws: the bell tells
  // one truth (owner report 2026-11-08)
  it.each([
    ['Muhammad', 'muhammad', false],
    ['Dawood', 'dawood', false],
    ['White days', 'whiteDays', false],
    ['Muhammad with the white-days add-on', 'muhammad', true],
  ])('draws no cluster under %s', async (_label, mode, whiteDaysAddOn) => {
    await arm(mode, whiteDaysAddOn);
    await suhoorBell(AlertType.Off);
    await renderSuhoorRow();

    expect(screen.queryByTestId('fasting-bell-cluster')).toBeNull();
  });

  it('clears the cluster the moment the alert goes off, and mounts it settled when it returns', async () => {
    await arm('muhammad', true);
    await renderSuhoorRow();
    expect(circles(cluster()).map((dot) => dot.fill)).toEqual([WHITE, GREEN]);

    await suhoorBell(AlertType.Off);
    expect(screen.queryByTestId('fasting-bell-cluster')).toBeNull();

    await suhoorBell(AlertType.Silent);
    expect(circles(cluster()).map((dot) => dot.fill)).toEqual([WHITE, GREEN]);
  });

  it("reads the Suhoor row's own alert, not another extras row's", async () => {
    for (const atom of extraPrayerAlertAtoms) store.set(atom, AlertType.Sound);
    await arm('dawood', false);

    await suhoorBell(AlertType.Off);
    await renderSuhoorRow();

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
