/**
 * The qibla sheet: what it draws, when it arms the sensors, and the one tap the user feels per crossing
 */

import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import type React from 'react';
import { Dimensions, Linking, StyleSheet } from 'react-native';
import * as Reanimated from 'react-native-reanimated';

import type { FusedHeading } from '@/modules/qiblaheading';
import logger from '@/shared/logger';
import * as qiblaSettle from '@/shared/qiblaSettle';
import { WARM_CONFIRM_READINGS } from '@/shared/qiblaSettle';
import type { Attitude } from '@/shared/qiblaWaveGate';

import QiblaSheet from '../Qibla';

// Babel hoists jest.mock above these, so the names must carry the `mock` prefix to be reachable from the factory
const mockWatchers: ((reading: { trueHeading: number }) => void)[] = [];
const mockUnwatch = jest.fn();
const mockAccuracyWatchers: ((accuracyDegrees: number) => void)[] = [];
const mockStopAccuracy = jest.fn();
const mockFusedWatchers: ((reading: FusedHeading) => void)[] = [];
const mockStopFused = jest.fn();

/** What the owner's iPhone reported indoors, off its cable, in degrees: inside the bar */
const CERTAIN = 12.5;

/**
 * How long the hint must have been up for the compass's arrival to be felt, as a LITERAL: a test spending the constant
 * it guards moves with it and guards nothing
 */
const ANNOUNCE_AFTER_MS = 1000;

/** How long a phone may go without finding north before the user is told so, as a literal for the same reason */
const LOST_AFTER_MS = 5000;

/** Far longer than any wait this screen has ever counted, for proving that waiting alone draws nothing */
const A_LONG_WAIT_MS = 60_000;

const mockState = {
  /** Whether the phone carries Google's fused sensor, which decides who reads the heading. False is an iPhone */
  fused: false,
  granted: true,
  position: { latitude: 51.5074, longitude: -0.1278 },
  place: 'London, United Kingdom' as string | null,
  /** Held open so a test can dismiss the sheet mid-await, which is the race the hook guards */
  releasePermission: null as (() => void) | null,
  releasePosition: null as (() => void) | null,
  releasePlace: null as (() => void) | null,
  releaseWatch: null as (() => void) | null,
};

// The native heading module: the iPhone's own accuracy, which its gate decides on, and Google's fused sensor, which
// is an Android phone's only reader. Each test reports what the phone says by hand
jest.mock('@/modules/qiblaheading', () => ({
  hasFusedHeading: jest.fn(() => mockState.fused),
  watchFusedHeading: jest.fn((onReading: (reading: FusedHeading) => void) => {
    mockFusedWatchers.push(onReading);
    return mockStopFused;
  }),
  watchHeadingAccuracy: jest.fn((onReading: (accuracyDegrees: number) => void) => {
    mockAccuracyWatchers.push(onReading);
    return mockStopAccuracy;
  }),
}));

// The platform the sheet reaches the moment it presents
jest.mock('@/device/qibla', () => ({
  requestQiblaPermission: jest.fn(async () => {
    if (mockState.releasePermission) await new Promise<void>((resolve) => (mockState.releasePermission = resolve));
    return mockState.granted;
  }),
  readPosition: jest.fn(async () => {
    if (mockState.releasePosition) await new Promise<void>((resolve) => (mockState.releasePosition = resolve));
    return mockState.position;
  }),
  readPlaceName: jest.fn(async () => {
    if (mockState.releasePlace) await new Promise<void>((resolve) => (mockState.releasePlace = resolve));
    return mockState.place;
  }),
  watchHeading: jest.fn(async (onReading: (reading: { trueHeading: number }) => void) => {
    if (mockState.releaseWatch) await new Promise<void>((resolve) => (mockState.releaseWatch = resolve));
    mockWatchers.push(onReading);
    return mockUnwatch;
  }),
}));

const qiblaDevice = jest.requireMock('@/device/qibla');
const qiblaHeading = jest.requireMock('@/modules/qiblaheading');

/**
 * The sheet arms its sensors on present, which the library reports as a change to index 0.
 *
 * Timers are faked BEFORE the open, because every wait on this screen is counted from the open: a start taken off
 * the real clock could never be advanced by a test.
 */
const openSheet = async () => {
  jest.useFakeTimers();
  await render(<QiblaSheet />);
  await fireEvent(screen.getByText('Qibla'), 'change', 0);
  await act(async () => {});
};

/** Delivers how far out the phone says its own heading may be, in degrees, to the live watch only */
const reportAccuracy = async (accuracyDegrees: number) => {
  const watcher = mockAccuracyWatchers[mockAccuracyWatchers.length - 1];

  await act(async () => {
    watcher(accuracyDegrees);
  });
};

/**
 * Delivers headings the phone has NOT vouched for, moving no clock.
 *
 * Neither path through the gate is helped along, so a test built on this alone shows what the gate itself decides.
 */
const reportBareHeadings = async (...headings: number[]) => {
  // The LIVE watcher only: mockWatchers keeps every open's subscription, and a torn-down watch is never called
  const watcher = mockWatchers[mockWatchers.length - 1];

  await act(async () => {
    for (const trueHeading of headings) watcher({ trueHeading });
  });
};

/**
 * Drives headings the compass will draw, as a phone in daily use delivers them: it vouches for its heading first.
 *
 * Without that the sheet correctly refuses to draw, and every assertion about the dial is about a blank stage.
 */
const reportHeadings = async (...headings: number[]) => {
  await reportAccuracy(CERTAIN);
  await reportBareHeadings(...headings);
};

/**
 * Drives a lost heading, which both platforms report as -1.
 *
 * It advances no clock of its own, because the grace window that survives a dropout is counted in real time and
 * these tests drive that clock themselves.
 */
const reportLostHeadings = async (count = 1) => {
  await act(async () => {
    for (let i = 0; i < count; i++) {
      for (const watcher of mockWatchers) watcher({ trueHeading: -1 });
    }
  });
};

/**
 * Drives exactly the readings a warm reopen is confirmed by, advancing NO clock.
 *
 * Advancing none, and reporting no certainty, is the point: a warm reopen must draw on agreement alone, so a helper
 * that moved the clock or vouched for the heading could not tell the warm path from the ordinary gate.
 */
const reportWarmConfirmation = async (trueHeading: number, count = WARM_CONFIRM_READINGS) => {
  // The LIVE watcher only: mockWatchers keeps every open's subscription, so notifying all of them would
  // deliver one reading per past visit and a test counting readings would be counting opens
  const watcher = mockWatchers[mockWatchers.length - 1];

  await act(async () => {
    for (let i = 0; i < count; i++) watcher({ trueHeading });
  });
};

/** A phone lying flat, which is where every wave below starts */
const FLAT: Attitude = [0, 0, 0, 1];

/** The attitude of that phone tipped this many degrees about its long axis */
const tipped = (degrees: number): Attitude => {
  const half = (degrees * Math.PI) / 360;

  return [0, Math.sin(half), 0, Math.cos(half)];
};

/** Opens the sheet on an Android phone that carries Google's fused sensor */
const openFusedSheet = async () => {
  mockState.fused = true;
  await openSheet();
};

/** Delivers samples of Google's fused sensor to the live watch only, moving no clock */
const reportFused = async (...readings: FusedHeading[]) => {
  const watcher = mockFusedWatchers[mockFusedWatchers.length - 1];

  await act(async () => {
    for (const reading of readings) watcher(reading);
  });
};

/** What the sensor delivers from a phone held still: one heading and one attitude, as often as asked */
const heldStill = (headingDegrees: number, count = 1): FusedHeading[] =>
  Array.from({ length: count }, () => ({ headingDegrees, attitude: FLAT }));

/**
 * What the sensor delivers from a phone waved through this many turns.
 *
 * Each sample is tipped a LITERAL 31 degrees on from the last, one over the 30 a turn must reach, so the count of
 * turns is the count of samples after the first and a test spends none of the constants it guards.
 */
const waved = (turns: number, headingDegrees = 95): FusedHeading[] =>
  Array.from({ length: turns + 1 }, (_, turn) => ({ headingDegrees, attitude: tipped(turn * 31) }));

/** How much of a subtitle line shows: the two are stacked, and only this tells them apart on screen */
const subtitleOpacity = (text: string) =>
  (StyleSheet.flatten(screen.getByText(text).props.style) as { opacity?: number }).opacity;

beforeEach(() => {
  mockWatchers.length = 0;
  mockUnwatch.mockClear();
  mockAccuracyWatchers.length = 0;
  mockStopAccuracy.mockClear();
  mockFusedWatchers.length = 0;
  mockStopFused.mockClear();
  mockState.fused = false;
  mockState.granted = true;
  mockState.position = { latitude: 51.5074, longitude: -0.1278 };
  mockState.place = 'London, United Kingdom';
  mockState.releasePermission = null;
  mockState.releasePosition = null;
  mockState.releasePlace = null;
  mockState.releaseWatch = null;
});

describe('the qibla sheet before it is opened', () => {
  it('reads no sensor until the sheet is presented', async () => {
    await render(<QiblaSheet />);

    expect(qiblaDevice.requestQiblaPermission).not.toHaveBeenCalled();
    expect(qiblaDevice.watchHeading).not.toHaveBeenCalled();
  });

  it('tells the user what to do without naming a number to read', async () => {
    await render(<QiblaSheet />);

    expect(screen.getByText('Hold flat and turn slowly')).toBeOnTheScreen();
  });

  // Both lines are mounted the whole time and cross-faded, so the header keeps one height: a swap in place
  // would resize it mid-fade, and the words must change on the same flag the compass does
  it('carries both subtitles, so the change costs a fade rather than a resize', async () => {
    await render(<QiblaSheet />);

    expect(screen.getByText('Follow below instructions')).toBeOnTheScreen();
    expect(screen.getByText('Hold flat and turn slowly')).toBeOnTheScreen();
  });

  it('caps both subtitles at one line, so the header keeps its height', async () => {
    await render(<QiblaSheet />);

    expect(screen.getByText('Follow below instructions').props.numberOfLines).toBe(1);
    expect(screen.getByText('Hold flat and turn slowly').props.numberOfLines).toBe(1);
  });

  // An absolutely positioned child contributes NO width, so the line taken out of flow cannot widen the container.
  // Leaving the NARROWER line in flow shrink-wraps the column to it and cuts the wider one to an ellipsis. Measured
  // in the bundled font at the subtitle's size: 158.6dp for the line in flow against 150.4dp for the other
  it('leaves the wider subtitle in flow, so neither line is truncated', async () => {
    await render(<QiblaSheet />);

    const position = (text: string) =>
      (StyleSheet.flatten(screen.getByText(text).props.style) as { position?: string }).position;

    expect(position('Follow below instructions')).toBeUndefined();
    expect(position('Hold flat and turn slowly')).toBe('absolute');
  });

  it('shows the line that asks the user to act while the hint is up', async () => {
    await render(<QiblaSheet />);

    expect(subtitleOpacity('Follow below instructions')).toBe(1);
    expect(subtitleOpacity('Hold flat and turn slowly')).toBe(0);
  });
});

describe('the accuracy watch the gate decides on', () => {
  it('arms one accuracy watch when the sheet opens', async () => {
    await openSheet();

    expect(qiblaHeading.watchHeadingAccuracy).toHaveBeenCalledTimes(1);
  });

  // That sensor is an Android phone's reader, and a second reader beside the compass degrades the compass
  it('never starts Google\u2019s fused sensor on a phone that does not carry it', async () => {
    await openSheet();

    expect(qiblaHeading.watchFusedHeading).not.toHaveBeenCalled();
  });

  // The sensors would otherwise run for the life of the process, which every sheet in this app mounts into
  it('stops the accuracy watch when the sheet closes', async () => {
    await openSheet();

    await fireEvent(screen.getByText('Qibla'), 'dismiss');

    expect(mockStopAccuracy).toHaveBeenCalledTimes(1);
  });

  it('arms no accuracy watch when the user refused location, having no compass to gate', async () => {
    mockState.granted = false;

    await openSheet();

    expect(qiblaHeading.watchHeadingAccuracy).not.toHaveBeenCalled();
  });
});

describe('the qibla sheet, opened in London', () => {
  it('draws nothing until the phone reports which way it points', async () => {
    await openSheet();

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  it('draws the compass once a heading arrives', async () => {
    await openSheet();

    await reportHeadings(95);

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });

  it('carries both palettes, so reaching the line costs a fade rather than a redraw', async () => {
    await openSheet();

    await reportHeadings(95);

    expect(screen.getByTestId('qibla-dial-gold')).toBeOnTheScreen();
  });

  it('swaps the subtitle to the compass’s own line once the compass is drawn', async () => {
    await openSheet();

    await reportHeadings(95);

    expect(subtitleOpacity('Hold flat and turn slowly')).toBe(1);
    expect(subtitleOpacity('Follow below instructions')).toBe(0);
  });

  it('asks for the position once, however many headings arrive', async () => {
    await openSheet();

    await reportHeadings(10, 20, 30);

    expect(qiblaDevice.readPosition).toHaveBeenCalledTimes(1);
  });

  // The dial must first-frame at the phone's real heading rather than spinning to it from north. Later readings run
  // the animated path instead, which is a separate branch of the same derived value
  it('first-frames at the phone\u2019s own heading rather than spinning to it from north', async () => {
    await openSheet();

    await reportHeadings(95);

    expect(screen.getByTestId('qibla-dial').props.style).toEqual({ transform: [{ rotate: '-95deg' }] });
  });

  // A square survives any rotation and a building does not. The marker rides the plate out to its bearing and
  // then stands straight back up, so the two rotations must cancel exactly or the Kaaba ends up on its head for
  // whole stretches of the compass, which no assertion on the plate alone can see
  it('leaves the Kaaba standing upright however far the plate has turned', async () => {
    await openSheet();

    await reportHeadings(95);

    const { transform } = screen.getByTestId('qibla-kaaba').props.style;
    const rotations = transform.filter((step: Record<string, string>) => 'rotate' in step);
    const degrees = rotations.map((step: { rotate: string }) => Number.parseFloat(step.rotate));

    expect(degrees).toHaveLength(2);
    expect(degrees[0] + degrees[1]).toBeCloseTo(0, 6);
  });

  it('carries the Kaaba round to the bearing the plate has turned it to', async () => {
    await openSheet();

    await reportHeadings(95);

    const { transform } = screen.getByTestId('qibla-kaaba').props.style;
    const [swing] = transform.filter((step: Record<string, string>) => 'rotate' in step);

    // London's qibla is 119.0 degrees, so a phone facing 95 leaves the marker 24.0 degrees clockwise of the arrow
    expect(Number.parseFloat(swing.rotate)).toBeCloseTo(24.0, 1);
  });

  it('keeps turning for every reading after the first, without ever leaving the dial blank', async () => {
    await openSheet();
    await reportHeadings(95);

    await reportHeadings(140, 200, 310);

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });

  // A re-render while the dial stays mounted, such as the sheet settling to its height, must turn the face to the
  // live heading rather than snap it: the snap is for the first frame alone
  it('turns rather than snaps when the sheet re-renders under a live heading', async () => {
    jest.useFakeTimers();
    const { rerender } = await render(<QiblaSheet />);
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await reportHeadings(95);

    await reportHeadings(140);
    await rerender(<QiblaSheet />);

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });
});

describe('the place the bearing was computed from', () => {
  it('names the place under the compass, so the user can see the fix is their own', async () => {
    await openSheet();

    await reportHeadings(95);

    expect(screen.getByText('London, United Kingdom')).toBeOnTheScreen();
  });

  // The hint asks the user to wave the phone; naming where they are answers a question they have not been asked,
  // and it arrives before the thing it labels
  it('holds the place back until the compass is drawn', async () => {
    await openSheet();

    expect(screen.queryByText('London, United Kingdom')).toBeNull();

    await reportHeadings(95);

    expect(screen.getByText('London, United Kingdom')).toBeOnTheScreen();
  });

  it('asks the platform to name the position it computed the bearing from', async () => {
    await openSheet();

    await reportHeadings(95);

    expect(qiblaDevice.readPlaceName).toHaveBeenCalledWith({ latitude: 51.5074, longitude: -0.1278 });
  });

  it('names the place once, however many headings arrive', async () => {
    await openSheet();

    await reportHeadings(10, 20, 30);

    expect(qiblaDevice.readPlaceName).toHaveBeenCalledTimes(1);
  });

  // The geocoder is network-backed, so it fails offline. The bearing is still correct and must still be drawn
  it('draws the compass with a blank line when the place cannot be named', async () => {
    mockState.place = null;
    await openSheet();

    await reportHeadings(95);

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
    expect(screen.queryByText('London, United Kingdom')).toBeNull();
  });

  it('names the place without the line ever appearing or vanishing', async () => {
    mockState.releasePlace = () => undefined;
    await openSheet();
    await reportHeadings(95);

    await act(async () => {
      mockState.releasePlace?.();
    });

    expect(screen.getByText('London, United Kingdom')).toBeOnTheScreen();
  });

  // The sheet measures its content, so the line's slot must exist from the first frame and never leave
  it('keeps the line through a dropped heading, so the sheet never resizes under the user', async () => {
    await openSheet();
    await reportHeadings(95);

    await reportLostHeadings();

    expect(screen.getByText('London, United Kingdom')).toBeOnTheScreen();
  });

  // The name belongs to the compass, so it goes when the compass does. The LINE stays, holding its height,
  // which is what stops the sheet resizing under the user
  it('takes the name away with the dial, keeping the line that holds its height', async () => {
    jest.useFakeTimers();
    await openSheet();
    await reportHeadings(95);

    await reportLostHeadings();
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
    expect(screen.queryByText('London, United Kingdom')).toBeNull();
    expect(screen.getByTestId('qibla-place')).toBeOnTheScreen();
    jest.useRealTimers();
  });

  it('holds the line before any heading has arrived, so the sheet opens at its settled height', async () => {
    await openSheet();

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
    expect(screen.queryByText('London, United Kingdom')).toBeNull();
    expect(screen.getByTestId('qibla-place')).toBeOnTheScreen();
  });

  it('says nothing when the user refused location, having no position to name', async () => {
    mockState.granted = false;

    await openSheet();

    expect(screen.queryByText('London, United Kingdom')).toBeNull();
    expect(qiblaDevice.readPlaceName).not.toHaveBeenCalled();
  });

  // A network call can resolve long after the sheet closed, and setting state then would warn and leak
  it('drops a name that arrives after the sheet closed', async () => {
    mockState.releasePlace = () => undefined;
    await openSheet();
    await reportHeadings(95);

    await fireEvent(screen.getByText('Qibla'), 'dismiss');
    await act(async () => {
      mockState.releasePlace?.();
    });

    expect(screen.queryByText('London, United Kingdom')).toBeNull();
  });
});

describe('the air around the compass', () => {
  // The whole column must fit the sheet's own 85% cap: a BottomSheetView clamps instead of scrolling, so anything
  // over the cap is taken off the BOTTOM, which ate the place name's padding and put it against the screen edge
  it('keeps the dial short enough for the column to fit the sheet', async () => {
    await openSheet();
    await reportHeadings(95);

    const style = StyleSheet.flatten(screen.getByTestId('qibla-stage').props.style);

    expect(style.height).toBeLessThanOrEqual(Dimensions.get('window').height * 0.45);
  });

  it('leaves real air on both sides rather than collapsing the compass against its neighbours', async () => {
    await openSheet();
    await reportHeadings(95);

    const style = StyleSheet.flatten(screen.getByTestId('qibla-stage').props.style);

    expect(style.marginTop).toBeGreaterThan(0);
    expect(style.marginBottom).toBeGreaterThan(style.marginTop);
  });
});

describe('the haptic a blind user feels', () => {
  it('taps once when the phone turns onto the line', async () => {
    await openSheet();

    await reportHeadings(130, 125, 120, 118.9);

    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
  });

  it('does not tap again while the phone holds on the line', async () => {
    await openSheet();

    await reportHeadings(118.9, 119.1, 118.8, 119.0);

    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
  });

  it('taps again when the phone turns away and comes back', async () => {
    await openSheet();

    await reportHeadings(118.9, 140, 118.9);

    expect(Haptics.impactAsync).toHaveBeenCalledTimes(2);
  });

  it('never taps when the phone faces directly away from Makkah', async () => {
    await openSheet();

    await reportHeadings(298.8, 298.9, 299);

    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });
});

describe('when the phone cannot say which way it points', () => {
  // A settling magnetometer drops the odd reading, and blanking on one is what made the sheet jump
  it('holds the dial through a brief dropout rather than blinking it out', async () => {
    await openSheet();
    await reportHeadings(95);

    await reportLostHeadings();

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });

  it('stops drawing the dial once the loss lasts, rather than pointing somewhere it does not know', async () => {
    jest.useFakeTimers();
    await openSheet();
    await reportHeadings(95);

    await reportLostHeadings();
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
    jest.useRealTimers();
  });

  // A run of dropped readings must not restart the countdown, or a steady stream of them holds a stale dial forever
  it('counts the grace window from the first dropped reading, not the last', async () => {
    jest.useFakeTimers();
    await openSheet();
    await reportHeadings(95);

    await reportLostHeadings();
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await reportLostHeadings(2);
    await act(async () => {
      jest.advanceTimersByTime(800);
    });

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
    jest.useRealTimers();
  });

  it('stays blank when the readings never return, rather than flipping state again', async () => {
    jest.useFakeTimers();
    await openSheet();
    await reportHeadings(95);

    await reportLostHeadings();
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    await reportLostHeadings();
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
    jest.useRealTimers();
  });

  it('keeps the dial when a good reading returns inside the grace window', async () => {
    jest.useFakeTimers();
    await openSheet();
    await reportHeadings(95);

    await reportLostHeadings();
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    await reportHeadings(140);
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
    jest.useRealTimers();
  });

  it('draws the dial again once a real heading returns', async () => {
    await openSheet();
    await reportLostHeadings();

    await reportHeadings(95);

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });

  it('taps on arriving at the line after a lost heading, rather than staying silent', async () => {
    await openSheet();
    await reportHeadings(118.9);
    await reportLostHeadings();

    await reportHeadings(118.9);

    expect(Haptics.impactAsync).toHaveBeenCalledTimes(2);
  });
});

describe('when the user refuses location', () => {
  it('says so rather than pointing, which is the one thing the app must never do', async () => {
    mockState.granted = false;

    await openSheet();

    expect(screen.getByText(/needs location access/)).toBeOnTheScreen();
    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  // Says WHY the app needs it, because a refusal with no reason reads as the app overreaching
  it('explains that the qibla is computed from where the user is', async () => {
    mockState.granted = false;

    await openSheet();

    expect(screen.getByText(/worked out from where you are/)).toBeOnTheScreen();
  });

  // Once refused, the system dialog never appears again, so the app's own settings screen is the only way back
  it('offers the settings screen, which is the only route left after a refusal', async () => {
    mockState.granted = false;

    await openSheet();
    fireEvent.press(screen.getByTestId('qibla-open-settings'));

    expect(Linking.openSettings).toHaveBeenCalledTimes(1);
  });

  // Waving cannot help a sheet that was never given a position, so asking for it would be a lie
  it('asks for no wave, because no gesture can supply a position', async () => {
    mockState.granted = false;

    await openSheet();

    expect(screen.queryByText(/Move your phone like this/)).toBeNull();
  });

  it('reads no position and watches no heading', async () => {
    mockState.granted = false;

    await openSheet();

    expect(qiblaDevice.readPosition).not.toHaveBeenCalled();
    expect(qiblaDevice.watchHeading).not.toHaveBeenCalled();
  });
});

describe('closing the sheet', () => {
  it('stops the heading watch, so the magnetometer is disarmed', async () => {
    await openSheet();

    await fireEvent(screen.getByText('Qibla'), 'dismiss');

    expect(mockUnwatch).toHaveBeenCalled();
  });

  it('asks for nothing more when it closes while the permission prompt is still up', async () => {
    mockState.releasePermission = () => undefined;
    await render(<QiblaSheet />);
    await fireEvent(screen.getByText('Qibla'), 'change', 0);

    await fireEvent(screen.getByText('Qibla'), 'dismiss');
    await act(async () => {
      mockState.releasePermission?.();
    });

    expect(qiblaDevice.readPosition).not.toHaveBeenCalled();
  });

  it('draws nothing when it closes while the position is still being read', async () => {
    mockState.releasePosition = () => undefined;
    await render(<QiblaSheet />);
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});

    await fireEvent(screen.getByText('Qibla'), 'dismiss');
    await act(async () => {
      mockState.releasePosition?.();
    });

    // The watch starts alongside the position read now, so the assertion is that it was torn down again, not that
    // it never started
    expect(mockUnwatch).toHaveBeenCalled();
    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  // watchHeadingAsync is asynchronous, so it can resolve after the cleanup has already run
  it('stops a heading watch that finished setting up after the sheet had already closed', async () => {
    mockState.releaseWatch = () => undefined;
    await render(<QiblaSheet />);
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});

    await fireEvent(screen.getByText('Qibla'), 'dismiss');
    await act(async () => {
      mockState.releaseWatch?.();
    });

    expect(mockUnwatch).toHaveBeenCalled();
  });

  it('arms the sensors again on the next open, rather than staying dead', async () => {
    await openSheet();
    await fireEvent(screen.getByText('Qibla'), 'dismiss');

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});

    expect(qiblaDevice.watchHeading).toHaveBeenCalledTimes(2);
  });

  it('keeps the watch from an open that outlives the sheet, and tears it down', async () => {
    mockState.releaseWatch = () => undefined;
    await render(<QiblaSheet />);
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});

    await fireEvent(screen.getByText('Qibla'), 'dismiss');
    await act(async () => {
      mockState.releaseWatch?.();
    });

    expect(mockUnwatch).toHaveBeenCalled();
  });
});

describe('reopening the sheet in the same place', () => {
  it('draws at once from the remembered position rather than going blank for a fresh read', async () => {
    await openSheet();
    await reportHeadings(95);
    await fireEvent(screen.getByText('Qibla'), 'dismiss');

    // The next open's position read hangs, and the compass must still appear from what was remembered
    mockState.releasePosition = () => undefined;
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await reportHeadings(95);

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });

  it('remembers the place with the position, so the label does not blank between opens', async () => {
    await openSheet();
    await reportHeadings(95);
    await fireEvent(screen.getByText('Qibla'), 'dismiss');

    mockState.releasePosition = () => undefined;
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    // The second open earns its own heading: it is cleared on close, so that a reopen cannot flash the last
    // visit's compass before the gate shuts it
    await reportHeadings(95);

    expect(screen.getByText('London, United Kingdom')).toBeOnTheScreen();
  });

  // A remembered null is different from a forgotten one: the geocoder already answered and need not be asked again
  it('reopens with a blank label when the geocoder had found nothing, without asking again', async () => {
    mockState.place = null;
    await openSheet();
    await reportHeadings(95);
    await fireEvent(screen.getByText('Qibla'), 'dismiss');

    mockState.releasePosition = () => undefined;
    qiblaDevice.readPlaceName.mockClear();
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});

    expect(qiblaDevice.readPlaceName).not.toHaveBeenCalled();
  });

  // The read still happens behind the remembered value, and a real move must be honoured when it lands
  it('takes the fresh position once it arrives, recomputing the bearing', async () => {
    await openSheet();
    await reportHeadings(95);
    await fireEvent(screen.getByText('Qibla'), 'dismiss');

    mockState.position = { latitude: 41.0082, longitude: 28.9784 }; // Istanbul, 2500 km away
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});

    expect(qiblaDevice.readPosition).toHaveBeenCalledTimes(2);
    await reportHeadings(95);

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });
});

describe('the gate the compass waits behind', () => {
  it('draws nothing on a heading the phone has not vouched for, however good it looks', async () => {
    await openSheet();

    await reportBareHeadings(118);

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  it('draws on the very next heading once the phone reports a certainty inside the bar', async () => {
    await openSheet();

    await reportAccuracy(CERTAIN);
    await reportBareHeadings(118);

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });

  // reported uncertainty in degrees, whether the compass draws. The bar as literals, each side of it, beside the
  // two readings taken on the owner's iPhone: 12.5 indoors and 25.4 on a cable beside a laptop
  it.each([
    [0, true],
    [12.5, true],
    [15, true],
    [15.1, false],
    [25.4, false],
  ])('given a reported uncertainty of %p degrees, draws the compass at once: %p', async (accuracyDegrees, draws) => {
    await openSheet();

    await reportAccuracy(accuracyDegrees);
    await reportBareHeadings(118);

    expect(screen.queryByTestId('qibla-dial') !== null).toBe(draws);
  });

  // Apple's sentinel for a heading it considers invalid, which a bare comparison against the bar would open on
  it('refuses a negative accuracy, which is the phone disowning its own heading', async () => {
    await openSheet();

    await reportAccuracy(-1);
    await reportBareHeadings(118);

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  it('decides on the latest report, so a phone grown unsure is not drawn on what it said before', async () => {
    await openSheet();

    await reportAccuracy(CERTAIN);
    await reportAccuracy(40);
    await reportBareHeadings(118);

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  // A wrong qibla is worse than none, so a heading the phone never vouches for is never drawn, however long it is
  // waited on. This screen once drew it after three seconds
  it('never draws a heading the phone has not vouched for, however long it is waited on', async () => {
    await openSheet();
    await reportBareHeadings(118);

    await act(async () => {
      jest.advanceTimersByTime(A_LONG_WAIT_MS);
    });
    await reportBareHeadings(118);

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  it('never draws a phone that reports itself outside the bar, however long it is waited on', async () => {
    await openSheet();
    await reportAccuracy(25.4);
    await reportBareHeadings(118);

    await act(async () => {
      jest.advanceTimersByTime(A_LONG_WAIT_MS);
    });
    await reportBareHeadings(118);

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  // The pair is what gives the two tests above meaning: a compass that could never be drawn would pass them too
  it('draws that same phone the moment it reports itself inside the bar, however long it had been waited on', async () => {
    await openSheet();
    await reportAccuracy(25.4);
    await reportBareHeadings(118);
    await act(async () => {
      jest.advanceTimersByTime(A_LONG_WAIT_MS);
    });

    await reportAccuracy(CERTAIN);
    await reportBareHeadings(118);

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });

  // The dial reads the heading off a shared value, so a turn costs no render and the rendered transform cannot
  // see it. Re-rendering publishes the live value into the style, which is how the turn becomes observable
  const liveDialRotation = async (rerender: (ui: React.ReactElement) => Promise<void>) => {
    await rerender(<QiblaSheet />);

    return screen.getByTestId('qibla-dial').props.style.transform[0].rotate;
  };

  // A gate re-tested per reading would drop exactly these updates, and a phone held in a hand drifts in and out
  // of the bar while it is turned
  it('latches once drawn, following every reading even after the phone grows less sure', async () => {
    jest.useFakeTimers();
    const { rerender } = await render(<QiblaSheet />);
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await reportHeadings(95);

    await reportAccuracy(40);
    await reportBareHeadings(140);

    expect(await liveDialRotation(rerender)).toBe('-140deg');
  });

  it('draws nothing after a genuine loss while the phone is unsure of the stream that returned', async () => {
    await openSheet();
    await reportHeadings(95);
    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();

    await reportLostHeadings();
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    // The loss outlasted the grace window, so a reading the phone no longer vouches for must not bring the dial
    // straight back
    await reportAccuracy(40);
    await reportBareHeadings(140);

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  // The pair is what gives the test above meaning: a compass that never returned would pass it too
  it('draws again after a genuine loss once the phone vouches for the stream that returned', async () => {
    await openSheet();
    await reportHeadings(95);

    await reportLostHeadings();
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    await reportHeadings(140);

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });

  // A reading that differs from the remembered heading, so the warm path cannot be what draws it
  it('never draws on a certainty carried over from the last visit', async () => {
    await openSheet();
    await reportHeadings(95);
    await fireEvent(screen.getByText('Qibla'), 'dismiss');

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await reportBareHeadings(200);

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  it('fires no haptic on a reading it refuses to draw', async () => {
    await openSheet();

    // Dead on the line, so a tap would fire the moment the gate let it through
    await reportBareHeadings(118.99);

    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });
});

/**
 * The wait the user sees on a phone WITHOUT Google's fused sensor, and what decides its length.
 *
 * Nothing measures the wave there: reading the accelerometer to verify the gesture cost the compass its own accuracy.
 * The phone's certainty decides, and nothing else does: a phone that never reports itself sure is never drawn.
 */
describe('the wait before the compass is drawn', () => {
  it('shows the invitation while the phone has not yet vouched for its heading', async () => {
    await openSheet();

    await reportBareHeadings(95);
    await act(async () => {
      jest.advanceTimersByTime(750);
    });

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
    expect(screen.getByText(/Move your phone like this/)).toBeOnTheScreen();
  });

  it('draws the compass once the phone vouches for its heading, waved or not', async () => {
    await openSheet();

    await reportHeadings(95);

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });

  it('invites again the next time the sheet is opened', async () => {
    await openSheet();
    await reportHeadings(95);

    await fireEvent(screen.getByText('Qibla'), 'dismiss');
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});

    expect(screen.getByText(/Move your phone like this/)).toBeOnTheScreen();
  });

  /**
   * THE FLASH THE OWNER SAW: the dial for one frame, then the hint, then the dial.
   *
   * `hasHeading` was never cleared when the watch was torn down, so the first frame of the second open was
   * drawn with the last visit's answer. There is no live heading while the watch is down, so reporting one
   * would be a lie in any case.
   */
  it('never draws the compass on the first frame of a reopen, however complete the last visit was', async () => {
    await openSheet();
    await reportHeadings(95);
    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();

    await fireEvent(screen.getByText('Qibla'), 'dismiss');
    await fireEvent(screen.getByText('Qibla'), 'change', 0);

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  it('draws the compass without waiting on the phone when it has not moved since it last drew', async () => {
    await openSheet();
    await reportHeadings(95);
    await fireEvent(screen.getByText('Qibla'), 'dismiss');

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await reportWarmConfirmation(95);

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });

  // One matching reading is noise, not a converged stream, and the count is asserted against a LITERAL: a test
  // spending WARM_CONFIRM_READINGS - 1 readings moves with the constant it is meant to guard, so lowering the
  // constant to 1 would leave it spending 0 and still passing
  it('refuses to draw on a single reading that happens to agree', async () => {
    await openSheet();
    await reportHeadings(95);
    await fireEvent(screen.getByText('Qibla'), 'dismiss');

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await reportWarmConfirmation(95, 1);

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  it('refuses to draw on one reading fewer than the confirmation asks for', async () => {
    await openSheet();
    await reportHeadings(95);
    await fireEvent(screen.getByText('Qibla'), 'dismiss');

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await reportWarmConfirmation(95, WARM_CONFIRM_READINGS - 1);

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  it('still waits on the phone when it was turned while the sheet was closed', async () => {
    await openSheet();
    await reportHeadings(95);
    await fireEvent(screen.getByText('Qibla'), 'dismiss');

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await reportWarmConfirmation(200);

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  it('waits on the phone on a first open, because nothing is remembered to check against', async () => {
    await openSheet();
    await reportWarmConfirmation(95);

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  // The confirmation buffer belongs to ONE visit. Carried across opens, the readings of a visit that refused
  // would be joined by a few from the next and confirm a phone that has since been turned
  it('starts each visit with an empty confirmation, so a refused visit cannot confirm the next one', async () => {
    await openSheet();
    await reportWarmConfirmation(95, WARM_CONFIRM_READINGS - 1);
    await fireEvent(screen.getByText('Qibla'), 'dismiss');
    await reportHeadings(95);
    await fireEvent(screen.getByText('Qibla'), 'dismiss');

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await reportWarmConfirmation(95, 1);

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  // A lost fix may mean the phone was carried, so readings from before the loss must not confirm what comes after
  it('discards the confirmation when the fix is lost, so readings either side of it cannot combine', async () => {
    await openSheet();
    await reportHeadings(95);
    await fireEvent(screen.getByText('Qibla'), 'dismiss');

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await reportWarmConfirmation(95, WARM_CONFIRM_READINGS - 1);
    await reportLostHeadings();
    await reportWarmConfirmation(95, 1);

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  it('fires no arrival haptic on a warm reopen, because nothing arrived', async () => {
    await openSheet();
    await reportHeadings(95);
    await fireEvent(screen.getByText('Qibla'), 'dismiss');
    jest.mocked(Haptics.notificationAsync).mockClear();

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await reportWarmConfirmation(95);

    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });

  // A warm visit leaves its mark in state across the close, so the visit after it must overwrite that mark rather
  // than inherit it, or every arrival after the first warm reopen would be silent
  it('announces a cold arrival on the visit after a warm one', async () => {
    await openSheet();
    await reportHeadings(95);
    await fireEvent(screen.getByText('Qibla'), 'dismiss');
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await reportWarmConfirmation(95);
    await fireEvent(screen.getByText('Qibla'), 'dismiss');
    jest.mocked(Haptics.notificationAsync).mockClear();

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await act(async () => {
      jest.advanceTimersByTime(ANNOUNCE_AFTER_MS);
    });
    await reportHeadings(200);

    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
  });

  // The pair is what gives the test above meaning: a suppression that fired never would pass it too
  it('fires the arrival haptic on a reopen the user had to wait a second for, because the compass did arrive', async () => {
    await openSheet();
    await reportHeadings(95);
    await fireEvent(screen.getByText('Qibla'), 'dismiss');
    jest.mocked(Haptics.notificationAsync).mockClear();

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await act(async () => {
      jest.advanceTimersByTime(ANNOUNCE_AFTER_MS);
    });
    await reportHeadings(200);

    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
  });
});

describe('the arrival the user feels, on a phone without the fused sensor', () => {
  // A phone already sure of itself draws in well under a second, before the hint could be read. Nothing was waited
  // for, so the tap would land as part of the sheet opening
  it('announces nothing when the compass arrives at once', async () => {
    await openSheet();

    await reportHeadings(95);

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });

  it('announces nothing one millisecond short of a second', async () => {
    await openSheet();
    await act(async () => {
      jest.advanceTimersByTime(ANNOUNCE_AFTER_MS - 1);
    });

    await reportHeadings(95);

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });

  it('announces the compass once the hint has been up for a second', async () => {
    await openSheet();
    await act(async () => {
      jest.advanceTimersByTime(ANNOUNCE_AFTER_MS);
    });

    await reportHeadings(95);

    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
  });

  // The hint came back when the heading was lost, so the second is counted from THEN: measured from the open, a
  // compass that returned at once after a long visit would be announced as though it had been waited for
  it('counts the second from when the hint returned, after a heading was lost', async () => {
    await openSheet();
    await reportHeadings(95);
    await act(async () => {
      jest.advanceTimersByTime(A_LONG_WAIT_MS);
    });
    await reportLostHeadings();
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    expect(screen.queryByTestId('qibla-dial')).toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(ANNOUNCE_AFTER_MS - 1);
    });
    await reportHeadings(140);

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });

  // A warm reopen is silent because it is QUICK. One that took a second was waited for like any other arrival
  it('announces a warm reopen whose confirmation took a second to come', async () => {
    await openSheet();
    await reportHeadings(95);
    await fireEvent(screen.getByText('Qibla'), 'dismiss');
    jest.mocked(Haptics.notificationAsync).mockClear();

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await act(async () => {
      jest.advanceTimersByTime(ANNOUNCE_AFTER_MS);
    });
    await reportWarmConfirmation(95);

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
  });

  // Three seconds of a stream that keeps saying it has no heading are three seconds the user waited. Counted from
  // the last such gap instead, the arrival that ends them would pass for a quick one
  it('announces a compass that arrives after seconds of a stream with no heading to give', async () => {
    await openSheet();
    for (let tenth = 0; tenth < 30; tenth++) {
      await reportLostHeadings();
      await act(async () => {
        jest.advanceTimersByTime(100);
      });
    }

    await reportHeadings(95);

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
  });

  it('announces a compass that took a second to return, after a heading was lost', async () => {
    await openSheet();
    await reportHeadings(95);
    await reportLostHeadings();
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    await act(async () => {
      jest.advanceTimersByTime(ANNOUNCE_AFTER_MS);
    });
    await reportHeadings(140);

    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
  });
});

describe('the wait before the compass can be drawn', () => {
  /** The travelling dot, which the figure hides from the screen reader, so only a hidden query finds it */
  const waveDot = () => screen.queryByTestId('qibla-wave-phone', { includeHiddenElements: true });

  it('tells the user what to do about it, rather than leaving the stage blank', async () => {
    await openSheet();

    expect(screen.getByText(/Move your phone like this/)).toBeOnTheScreen();
  });

  // Queried including hidden elements throughout, because the figure is deliberately hidden from the screen
  // reader: a plain query would answer "absent" for a drawing that is on screen
  it('shows the motion as well as naming it, for a user who would not read the line', async () => {
    await openSheet();

    expect(waveDot()).toBeOnTheScreen();
  });

  // A drawn gesture is nothing a screen reader can convey, and each platform's reader reads only its own prop,
  // so a figure carrying one of them is still announced on the other platform
  it.each<[string, string, boolean | string]>([
    ['VoiceOver', 'accessibilityElementsHidden', true],
    ['TalkBack', 'importantForAccessibility', 'no-hide-descendants'],
  ])('hides the drawing from %s while leaving the line readable', async (_reader, prop, hidden) => {
    await openSheet();

    expect(waveDot()?.parent).toHaveProp(prop, hidden);
    expect(screen.getByText(/Move your phone like this/)).toBeOnTheScreen();
  });

  // The hint and its looping animation exist only while the wait does: an infinite loop left behind the compass
  // would tick the UI thread for as long as the sheet stayed open
  it('takes the hint and its animation away the moment the compass draws', async () => {
    await openSheet();

    await reportHeadings(95);

    expect(screen.queryByText(/Move your phone like this/)).toBeNull();
    expect(waveDot()).toBeNull();
  });

  it('arms one looping motion for the hint it shows', async () => {
    const armed = jest.spyOn(Reanimated, 'withRepeat');

    await openSheet();

    expect(armed).toHaveBeenCalledTimes(1);
  });

  // Waving the phone cannot help a sheet that was never given a position, and asking for it would be a lie
  it('says nothing about waving when the user refused location', async () => {
    mockState.granted = false;

    await openSheet();

    expect(screen.queryByText(/Move your phone like this/)).toBeNull();
    expect(waveDot()).toBeNull();
  });

  it('asks again once the heading is lost for good, which is the same wait over', async () => {
    jest.useFakeTimers();
    await openSheet();
    await reportHeadings(95);

    await reportLostHeadings();
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/Move your phone like this/)).toBeOnTheScreen();
    jest.useRealTimers();
  });
});

describe('a heading that arrives before the position', () => {
  // The readings start with the watch, not with the fix, and a bearing cannot be drawn against a position that has
  // not arrived
  it('draws nothing until the position lands, and then draws on the next heading', async () => {
    mockState.releasePosition = () => undefined;
    jest.useFakeTimers();
    await render(<QiblaSheet />);
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});

    await reportHeadings(140);
    expect(screen.queryByTestId('qibla-dial')).toBeNull();

    await act(async () => {
      mockState.releasePosition?.();
    });
    await reportBareHeadings(140);

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });
});

describe('an Android phone that carries Google’s fused sensor', () => {
  // A second reader beside the compass degrades the compass, so there is exactly one
  it('reads the heading from that sensor alone', async () => {
    await openFusedSheet();

    expect(qiblaHeading.watchFusedHeading).toHaveBeenCalledTimes(1);
    expect(qiblaDevice.watchHeading).not.toHaveBeenCalled();
    expect(qiblaHeading.watchHeadingAccuracy).not.toHaveBeenCalled();
  });

  it('starts no sensor when the user refused location, having no compass to draw', async () => {
    mockState.granted = false;

    await openFusedSheet();

    expect(qiblaHeading.watchFusedHeading).not.toHaveBeenCalled();
  });

  it('stops the sensor when the sheet closes', async () => {
    await openFusedSheet();

    expect(mockStopFused).not.toHaveBeenCalled();
    await fireEvent(screen.getByText('Qibla'), 'dismiss');

    expect(mockStopFused).toHaveBeenCalledTimes(1);
  });

  // The watch is held the moment it starts, so a close ends it whichever await the open has reached
  it('stops the sensor at once when the sheet closes while the position is still being read', async () => {
    mockState.fused = true;
    mockState.releasePosition = () => undefined;
    await render(<QiblaSheet />);
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});

    await fireEvent(screen.getByText('Qibla'), 'dismiss');

    expect(mockStopFused).toHaveBeenCalledTimes(1);
  });

  it('draws nothing when it closes while the position is still being read', async () => {
    mockState.fused = true;
    mockState.releasePosition = () => undefined;
    await render(<QiblaSheet />);
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});

    await fireEvent(screen.getByText('Qibla'), 'dismiss');
    await act(async () => {
      mockState.releasePosition?.();
    });

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
    expect(mockStopFused).toHaveBeenCalledTimes(1);
  });

  it('starts the sensor again on the next open, rather than staying dead', async () => {
    await openFusedSheet();
    await fireEvent(screen.getByText('Qibla'), 'dismiss');

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});

    expect(qiblaHeading.watchFusedHeading).toHaveBeenCalledTimes(2);
  });
});

describe('the wave an Android phone waits for', () => {
  it('draws nothing while the phone is held still, however many samples arrive', async () => {
    await openFusedSheet();

    await reportFused(...heldStill(95, 50));

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
    expect(screen.getByText(/Move your phone like this/)).toBeOnTheScreen();
  });

  it('draws the compass on the sample that completes a wave of eight turns', async () => {
    await openFusedSheet();

    await reportFused(...waved(8));

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
    expect(screen.queryByText(/Move your phone like this/)).toBeNull();
  });

  it('draws nothing at seven turns, one short of a wave', async () => {
    await openFusedSheet();

    await reportFused(...waved(7));

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  // What must happen when the phone is only shaken lightly: 200 swings of 28 degrees stay inside the 30 a turn
  // must reach, though they travel 5600 degrees in all
  it('draws nothing for a light shake, however long it goes on', async () => {
    await openFusedSheet();
    const lightShake = Array.from({ length: 200 }, (_, sample) => ({
      headingDegrees: 95,
      attitude: sample % 2 === 0 ? FLAT : tipped(28),
    }));

    await reportFused(...lightShake);

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  it('draws the heading the sensor gave, untouched', async () => {
    await openFusedSheet();

    await reportFused(...waved(8, 95));

    expect(screen.getByTestId('qibla-dial').props.style).toEqual({ transform: [{ rotate: '-95deg' }] });
  });

  // The wave is counted before the reading is judged, so a slow position read cannot cost the user their wave
  it('keeps a wave made while the position was still being read', async () => {
    mockState.fused = true;
    mockState.releasePosition = () => undefined;
    jest.useFakeTimers();
    await render(<QiblaSheet />);
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});

    await reportFused(...waved(8));
    expect(screen.queryByTestId('qibla-dial')).toBeNull();

    await act(async () => {
      mockState.releasePosition?.();
    });
    await reportFused(...heldStill(95));

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });

  // A gate re-tested per sample would drop every reading of a phone the user has stopped waving
  it('latches once drawn, following the heading of a phone that is no longer being waved', async () => {
    mockState.fused = true;
    jest.useFakeTimers();
    const { rerender } = await render(<QiblaSheet />);
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await reportFused(...waved(8, 95));

    await reportFused({ headingDegrees: 140, attitude: tipped(8 * 31) });
    await rerender(<QiblaSheet />);

    expect(screen.getByTestId('qibla-dial').props.style.transform[0].rotate).toBe('-140deg');
  });

  it('taps once when the waved phone turns onto the line', async () => {
    await openFusedSheet();
    await reportFused(...waved(8, 95));

    await reportFused({ headingDegrees: 118.9, attitude: tipped(8 * 31) });

    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
  });

  it('fires no haptic on a sample it refuses to draw', async () => {
    await openFusedSheet();

    // Dead on the line, so a tap would fire the moment the gate let it through
    await reportFused(...heldStill(118.99, 3));

    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });
});

describe('an Android phone that is never waved', () => {
  // A wrong qibla is worse than none, and on this sensor the wave is all that vouches for the heading. This screen
  // once drew an unwaved phone after ten seconds
  it('never draws, however long it is waited on', async () => {
    await openFusedSheet();
    await reportFused(...heldStill(95));

    await act(async () => {
      jest.advanceTimersByTime(A_LONG_WAIT_MS);
    });
    await reportFused(...heldStill(95, 50));

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
    expect(screen.getByText(/Move your phone like this/)).toBeOnTheScreen();
  });

  it('does not let time make up for a wave one turn short', async () => {
    await openFusedSheet();
    await reportFused(...waved(7));

    await act(async () => {
      jest.advanceTimersByTime(A_LONG_WAIT_MS);
    });
    await reportFused({ headingDegrees: 95, attitude: tipped(7 * 31) });

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  // The pair is what gives the two tests above meaning: a compass that could never be drawn would pass them too
  it('draws the moment it is waved, however long it had been waited on', async () => {
    await openFusedSheet();
    await reportFused(...heldStill(95));
    await act(async () => {
      jest.advanceTimersByTime(A_LONG_WAIT_MS);
    });

    await reportFused(...waved(8));

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });
});

describe('reopening the sheet on an Android phone', () => {
  // On a phone without the sensor these same readings draw at once, as a warm reopen. Here every visit earns its
  // own wave, so eight samples at the heading the last visit left must draw nothing
  it('asks for a new wave, however little the phone has moved since it last drew', async () => {
    await openFusedSheet();
    await reportFused(...waved(8, 95));
    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
    await fireEvent(screen.getByText('Qibla'), 'dismiss');

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await reportFused(...heldStill(95, 8));

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
    expect(screen.getByText(/Move your phone like this/)).toBeOnTheScreen();
  });

  // Seven turns in one visit and one in the next are not a wave: carried over, the second visit's first turn
  // would complete it
  it('counts the new wave from nothing, so turns from the last visit cannot complete it', async () => {
    await openFusedSheet();
    await reportFused(...waved(7));
    await fireEvent(screen.getByText('Qibla'), 'dismiss');

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await reportFused(...waved(1));

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  it('draws again once the new visit has had its own wave', async () => {
    await openFusedSheet();
    await reportFused(...waved(8));
    await fireEvent(screen.getByText('Qibla'), 'dismiss');

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await reportFused(...waved(8));

    expect(qiblaHeading.hasFusedHeading).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });

  // A user who is waving is looking at the phone they are moving, not at its screen, so every wave is announced
  // by feel however quickly it was made. On a phone without the sensor an arrival this quick is silent
  it('announces the compass after every wave, however quick, a reopen included', async () => {
    await openFusedSheet();
    await reportFused(...waved(8));
    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
    await fireEvent(screen.getByText('Qibla'), 'dismiss');
    jest.mocked(Haptics.notificationAsync).mockClear();

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await reportFused(...waved(8));

    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
  });
});

describe('what an Android phone records when its compass is drawn', () => {
  // The line a mock build leaves in the phone's log, which is how long the user's own wave took
  it('records how long the wave took, counted from when the hint went up', async () => {
    await openFusedSheet();
    await act(async () => {
      jest.advanceTimersByTime(2500);
    });

    await reportFused(...waved(8));

    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith('QIBLA: compass drawn after a wave', { waitedMs: 2500 });
  });

  it('records nothing while the compass is still waited for, and nothing again once it is drawn', async () => {
    await openFusedSheet();
    await reportFused(...waved(7));
    expect(logger.info).not.toHaveBeenCalled();

    await reportFused(...waved(8), ...heldStill(95, 5));

    expect(logger.info).toHaveBeenCalledTimes(1);
  });

  it('records nothing on a phone without the sensor', async () => {
    await openSheet();

    await reportHeadings(95);

    expect(logger.info).not.toHaveBeenCalled();
  });
});

describe('an Android phone whose sensor sends an attitude that is no attitude', () => {
  /** What the sensor's own class lets through: a quaternion of zeros */
  const garbled = (headingDegrees: number): FusedHeading => ({ headingDegrees, attitude: [0, 0, 0, 0] });

  it('draws nothing for it, however many arrive', async () => {
    await openFusedSheet();

    await reportFused(...Array.from({ length: 50 }, () => garbled(95)));

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  it('counts the wave that follows as though those readings had never arrived', async () => {
    await openFusedSheet();
    await reportFused(...Array.from({ length: 5 }, () => garbled(95)));

    await reportFused(...waved(8));

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });

  // A native side out of step with this code could send no attitude at all. Reading one that is not there would
  // throw on every sample, before the heading was ever judged
  it('is not thrown by a sample with no attitude at all, and counts the wave that follows', async () => {
    await openFusedSheet();
    await reportFused(...Array.from({ length: 5 }, () => ({ headingDegrees: 95 }) as FusedHeading));

    await reportFused(...waved(8));

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });
});

describe('an Android phone whose sheet is opened again before the first open has finished', () => {
  // The permission prompt can outlast a close and a reopen, and both opens then arm a watch
  it('stops the first open’s sensor rather than stranding its listener', async () => {
    mockState.fused = true;
    jest.useFakeTimers();
    await render(<QiblaSheet />);
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});

    expect(qiblaHeading.watchFusedHeading).toHaveBeenCalledTimes(2);
    expect(mockStopFused).toHaveBeenCalledTimes(1);
  });

  // The first open is still reading the position when the sheet closes and opens again. Each read parks its own
  // release, so the first one is kept before the second replaces it, and BOTH are released: the first open's
  // remaining steps are what must leave the second open's sensor alone
  it('keeps the second open’s sensor running when the first open finally finishes', async () => {
    mockState.fused = true;
    mockState.releasePosition = () => undefined;
    jest.useFakeTimers();
    await render(<QiblaSheet />);
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await fireEvent(screen.getByText('Qibla'), 'dismiss');
    const releaseFirstOpensRead = mockState.releasePosition;

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    expect(mockState.releasePosition).not.toBe(releaseFirstOpensRead);
    await act(async () => {
      releaseFirstOpensRead?.();
    });
    await act(async () => {
      mockState.releasePosition?.();
    });
    await reportFused(...waved(8));

    expect(mockStopFused).toHaveBeenCalledTimes(1);
    expect(mockUnwatch).not.toHaveBeenCalled();
    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });
});

describe('leaving the screen on an Android phone', () => {
  it('stops the sensor when the sheet is unmounted while open', async () => {
    mockState.fused = true;
    const { unmount } = await render(<QiblaSheet />);
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});

    await unmount();

    expect(mockStopFused).toHaveBeenCalledTimes(1);
  });
});

describe('when north cannot be found', () => {
  const FIRST_LINE = 'Could not find north';
  const SECOND_LINE = 'Please try standing in a different location';

  const colourOf = (text: string | RegExp) =>
    (StyleSheet.flatten(screen.getByText(text).props.style) as { color?: string }).color;

  // A phone can sit outside the bar for as long as it stays where it is, and waving it there changes nothing. With
  // no ceiling to draw it anyway, the user must be told why the compass is not coming
  it('says so in two lines, once a phone outside the bar has shown the hint for five seconds', async () => {
    await openSheet();
    await reportAccuracy(25.4);
    await reportBareHeadings(118);

    await act(async () => {
      jest.advanceTimersByTime(LOST_AFTER_MS);
    });

    const [first, second] = within(screen.getByTestId('qibla-lost')).getAllByText(/\w/);

    expect(first).toHaveTextContent(FIRST_LINE);
    expect(second).toHaveTextContent(SECOND_LINE);
    expect(screen.getByText(/Move your phone like this/)).toBeOnTheScreen();
    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  // A stream can report that it has no heading over and over, which is exactly the phone that has no north. Each
  // gap must not start the five seconds again, or that phone would never be told
  it('says so at five seconds on a phone whose stream keeps reporting that it has no heading', async () => {
    await openSheet();
    for (let tenth = 0; tenth < 50; tenth++) {
      await reportLostHeadings();
      await act(async () => {
        jest.advanceTimersByTime(100);
      });
    }

    expect(screen.getByTestId('qibla-lost')).toBeOnTheScreen();
  });

  it('says nothing one millisecond sooner', async () => {
    await openSheet();
    await reportAccuracy(25.4);
    await reportBareHeadings(118);

    await act(async () => {
      jest.advanceTimersByTime(LOST_AFTER_MS - 1);
    });

    expect(screen.queryByTestId('qibla-lost')).toBeNull();
    expect(screen.queryByText(FIRST_LINE)).toBeNull();
  });

  // No gyroscope, or no Play services, and no accuracy of its own: nothing on such a phone can vouch for a heading
  it('says so on a phone that never reports anything about its heading at all', async () => {
    await openSheet();

    await act(async () => {
      jest.advanceTimersByTime(LOST_AFTER_MS);
    });

    expect(screen.getByText(FIRST_LINE)).toBeOnTheScreen();
    expect(screen.getByText(SECOND_LINE)).toBeOnTheScreen();
  });

  it('wears the colour of the line that asks for the wave, on both of its lines', async () => {
    await openSheet();
    await act(async () => {
      jest.advanceTimersByTime(LOST_AFTER_MS);
    });

    expect(colourOf(FIRST_LINE)).toBe(colourOf(/Move your phone like this/));
    expect(colourOf(SECOND_LINE)).toBe(colourOf(/Move your phone like this/));
  });

  // Added to the stage's column instead, its arrival would push the hint and its drawing upwards
  it('is laid over the stage rather than added to its column, so the hint does not move when it arrives', async () => {
    await openSheet();
    await act(async () => {
      jest.advanceTimersByTime(LOST_AFTER_MS);
    });

    const style = StyleSheet.flatten(screen.getByTestId('qibla-lost').props.style) as {
      position?: string;
      bottom?: number;
    };

    expect(style.position).toBe('absolute');
    expect(style.bottom).toBe(0);
  });

  // An open that overtakes one whose compass is already drawn starts a wait nothing will end
  it('is never laid over a compass, even when a second open found one already drawn', async () => {
    await openSheet();
    await reportHeadings(95);

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await act(async () => {
      jest.advanceTimersByTime(A_LONG_WAIT_MS);
    });

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
    expect(screen.queryByTestId('qibla-lost')).toBeNull();
  });

  it('is never said once the compass has been drawn', async () => {
    await openSheet();
    await reportHeadings(95);

    await act(async () => {
      jest.advanceTimersByTime(A_LONG_WAIT_MS);
    });

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
    expect(screen.queryByTestId('qibla-lost')).toBeNull();
  });

  it('goes away when the phone comes inside the bar and the compass is drawn', async () => {
    await openSheet();
    await reportAccuracy(25.4);
    await reportBareHeadings(118);
    await act(async () => {
      jest.advanceTimersByTime(LOST_AFTER_MS);
    });
    expect(screen.getByTestId('qibla-lost')).toBeOnTheScreen();

    await reportHeadings(118);

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
    expect(screen.queryByTestId('qibla-lost')).toBeNull();
  });

  // A sheet that was never given a position is waiting on nothing, and is already saying why
  it('is not said when the user refused location', async () => {
    mockState.granted = false;
    await openSheet();

    await act(async () => {
      jest.advanceTimersByTime(A_LONG_WAIT_MS);
    });

    expect(screen.queryByTestId('qibla-lost')).toBeNull();
  });

  it('is forgotten when the sheet closes, and waits its five seconds again on the next open', async () => {
    await openSheet();
    await act(async () => {
      jest.advanceTimersByTime(LOST_AFTER_MS);
    });
    expect(screen.getByTestId('qibla-lost')).toBeOnTheScreen();

    await fireEvent(screen.getByText('Qibla'), 'dismiss');
    expect(screen.queryByTestId('qibla-lost')).toBeNull();

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await act(async () => {
      jest.advanceTimersByTime(LOST_AFTER_MS - 1);
    });
    expect(screen.queryByTestId('qibla-lost')).toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.getByTestId('qibla-lost')).toBeOnTheScreen();
  });

  // The wait must not run on behind a closed sheet: reaching its end there, it would leave the next open beginning
  // with the report already on screen
  it('stops its wait when the sheet closes, so the next open does not begin with it', async () => {
    await openSheet();
    await act(async () => {
      jest.advanceTimersByTime(LOST_AFTER_MS - 1000);
    });
    await fireEvent(screen.getByText('Qibla'), 'dismiss');
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});

    expect(screen.queryByTestId('qibla-lost')).toBeNull();
  });

  // The permission prompt can stay up for as long as the user likes, and nothing is being waited on behind it
  it('starts its wait when location is granted, not while the prompt is still up', async () => {
    mockState.releasePermission = () => undefined;
    jest.useFakeTimers();
    await render(<QiblaSheet />);
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {
      jest.advanceTimersByTime(A_LONG_WAIT_MS);
    });

    await act(async () => {
      mockState.releasePermission?.();
    });

    expect(screen.getByText(/Move your phone like this/)).toBeOnTheScreen();
    expect(screen.queryByTestId('qibla-lost')).toBeNull();
  });

  // Said once, then answered by a compass: when that compass later loses its heading the report must be earned
  // again, not found still standing from before
  it('does not come straight back when a compass drawn after it loses its heading', async () => {
    await openSheet();
    await act(async () => {
      jest.advanceTimersByTime(LOST_AFTER_MS);
    });
    expect(screen.getByTestId('qibla-lost')).toBeOnTheScreen();
    await reportHeadings(95);
    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();

    await reportLostHeadings();
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
    expect(screen.queryByTestId('qibla-lost')).toBeNull();
  });

  // The hint is back, so the same five seconds are owed before the room is blamed for it. The compass stands for
  // a long while first: a wait left running behind it would have ended there, and be found already said
  it('waits its five seconds again after a drawn compass loses its heading', async () => {
    await openSheet();
    await reportHeadings(95);
    await act(async () => {
      jest.advanceTimersByTime(A_LONG_WAIT_MS);
    });
    await reportLostHeadings();
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    expect(screen.queryByTestId('qibla-dial')).toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(LOST_AFTER_MS - 1);
    });
    expect(screen.queryByTestId('qibla-lost')).toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.getByTestId('qibla-lost')).toBeOnTheScreen();
  });

  // Two seconds of the first open and three of the second are not five seconds of waiting
  it('starts its wait afresh when an open overtakes another', async () => {
    await openSheet();
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await act(async () => {
      jest.advanceTimersByTime(LOST_AFTER_MS - 1);
    });
    expect(screen.queryByTestId('qibla-lost')).toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.getByTestId('qibla-lost')).toBeOnTheScreen();
  });

  // A Play services too old to carry the sensor still reports it, and then delivers nothing
  it('is said on an Android phone whose sensor reports itself and delivers nothing', async () => {
    await openFusedSheet();

    await act(async () => {
      jest.advanceTimersByTime(LOST_AFTER_MS);
    });

    expect(screen.getByText(FIRST_LINE)).toBeOnTheScreen();
    expect(screen.getByText(SECOND_LINE)).toBeOnTheScreen();
    // No other heading is started in its place: on this phone nothing could ever draw one
    expect(qiblaDevice.watchHeading).not.toHaveBeenCalled();
  });

  // A slow Play services can deliver its first sample after the five seconds are up. The sensor has not lost north
  // after all, so the report must not stay
  it('is taken back when the sensor’s first sample arrives after it was said', async () => {
    await openFusedSheet();
    await act(async () => {
      jest.advanceTimersByTime(LOST_AFTER_MS);
    });
    expect(screen.getByTestId('qibla-lost')).toBeOnTheScreen();

    await reportFused(...heldStill(95));

    expect(screen.queryByTestId('qibla-lost')).toBeNull();
  });

  // Its sensor has not lost north. All the phone lacks is the wave, and the hint is already asking for that
  it('is never said on an Android phone whose sensor is delivering, however long it goes unwaved', async () => {
    await openFusedSheet();
    await reportFused(...heldStill(95));

    await act(async () => {
      jest.advanceTimersByTime(A_LONG_WAIT_MS);
    });

    expect(screen.queryByTestId('qibla-lost')).toBeNull();
  });

  it('is not said when the sensor’s first sample arrives one millisecond before it would be', async () => {
    await openFusedSheet();
    await act(async () => {
      jest.advanceTimersByTime(LOST_AFTER_MS - 1);
    });

    await reportFused(...heldStill(95));
    await act(async () => {
      jest.advanceTimersByTime(A_LONG_WAIT_MS);
    });

    expect(screen.queryByTestId('qibla-lost')).toBeNull();
  });
});

describe('a reading that arrives after the sheet has closed', () => {
  // A heading watch can outlive the close that should have ended it, when the open that started it was still
  // reading the position. The mock keeps every watcher, so the closed visit's own is still the latest one here
  it('draws nothing, taps nothing and announces nothing, and leaves the next open to earn its own compass', async () => {
    await openSheet();
    await reportHeadings(118.9);
    await fireEvent(screen.getByText('Qibla'), 'dismiss');
    jest.mocked(Haptics.impactAsync).mockClear();
    jest.mocked(Haptics.notificationAsync).mockClear();
    await act(async () => {
      jest.advanceTimersByTime(ANNOUNCE_AFTER_MS);
    });

    await reportWarmConfirmation(118.9);

    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();

    await fireEvent(screen.getByText('Qibla'), 'change', 0);

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });
});

describe('the readings a warm reopen is judged on', () => {
  // Only the latest eight are ever read. A phone that is never sure keeps sending for as long as the sheet is open,
  // and with no ceiling to end that, a list kept whole would be copied in full on every reading
  it('are kept to the latest eight, however many arrive unvouched', async () => {
    const judged = jest.spyOn(qiblaSettle, 'isWarmStream');
    await openSheet();
    await reportHeadings(95);
    await fireEvent(screen.getByText('Qibla'), 'dismiss');
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});

    await reportBareHeadings(...Array.from({ length: 200 }, () => 300));

    expect(judged).toHaveBeenCalledTimes(200);
    expect(judged.mock.calls.at(-1)?.[0]).toHaveLength(8);
    judged.mockRestore();
  });
});
