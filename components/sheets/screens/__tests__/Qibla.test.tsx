/**
 * The qibla sheet: what it draws, when it arms the sensors, and the one tap the user feels per crossing
 */

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import type React from 'react';
import { Dimensions, Linking, StyleSheet } from 'react-native';
import * as Reanimated from 'react-native-reanimated';

import type { FusedHeading } from '@/modules/qiblaheading';
import logger from '@/shared/logger';
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

/** The ceiling as a LITERAL, because a test spending the constant it guards moves with it and guards nothing */
const CEILING_MS = 3000;

/** The ceiling a phone on Google's fused sensor waits for a wave, as a literal for the same reason */
const WAVE_CEILING_MS = 10_000;

/** How long a fused sensor that has delivered nothing is waited on, as a literal for the same reason */
const FUSED_SILENCE_MS = 3000;

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
 * Timers are faked BEFORE the open, because the ceiling counts from the first heading reading: a start taken off
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

    expect(screen.getByText('Just a moment')).toBeOnTheScreen();
    expect(screen.getByText('Hold flat and turn slowly')).toBeOnTheScreen();
  });

  it('caps both subtitles at one line, so the header keeps its height', async () => {
    await render(<QiblaSheet />);

    expect(screen.getByText('Just a moment').props.numberOfLines).toBe(1);
    expect(screen.getByText('Hold flat and turn slowly').props.numberOfLines).toBe(1);
  });

  // An absolutely positioned child contributes NO width, so whichever line is taken out of flow cannot widen
  // the container. Leaving the SHORTER line in flow shrink-wraps the column to it and truncates the longer one
  // to an ellipsis, which is what the owner saw: "it says hold the phone flat and dot dot dot".
  it('leaves the longer subtitle in flow, so neither line is truncated', async () => {
    await render(<QiblaSheet />);

    const position = (text: string) =>
      (StyleSheet.flatten(screen.getByText(text).props.style) as { position?: string }).position;

    expect(position('Hold flat and turn slowly')).toBeUndefined();
    expect(position('Just a moment')).toBe('absolute');
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

    // London's qibla is 118.9 degrees, so a phone facing 95 leaves the marker 23.9 degrees clockwise of the arrow
    expect(Number.parseFloat(swing.rotate)).toBeCloseTo(23.9, 1);
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

  // This screen must never lock: a phone can sit outside the bar indefinitely, and one may never report at all
  it('draws at the ceiling when the phone never vouches for its heading', async () => {
    await openSheet();
    await reportBareHeadings(118);

    await act(async () => {
      jest.advanceTimersByTime(CEILING_MS);
    });
    await reportBareHeadings(118);

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });

  it('holds one millisecond short of the ceiling, so an unsure phone is never drawn sooner than it used to be', async () => {
    await openSheet();
    await reportBareHeadings(118);

    await act(async () => {
      jest.advanceTimersByTime(CEILING_MS - 1);
    });
    await reportBareHeadings(118);

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  it('draws at the ceiling on a phone reporting itself outside the bar, rather than refusing it for ever', async () => {
    await openSheet();
    await reportAccuracy(25.4);
    await reportBareHeadings(118);

    await act(async () => {
      jest.advanceTimersByTime(CEILING_MS);
    });
    await reportBareHeadings(118);

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });

  // Counted across the gap, the ceiling would fire the instant the stream returned, on its first reading back
  it('restarts the ceiling after a dropped reading, rather than firing the moment the stream returns', async () => {
    await openSheet();
    await reportBareHeadings(118);
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await reportLostHeadings();
    await reportBareHeadings(118);
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    await reportBareHeadings(118);

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
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

  it('waits out the ceiling again after the heading is genuinely lost, rather than drawing the stream straight back', async () => {
    await openSheet();
    await reportBareHeadings(95);
    await act(async () => {
      jest.advanceTimersByTime(CEILING_MS);
    });
    await reportBareHeadings(95);
    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();

    await reportLostHeadings();
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    // The loss outlasted the grace window, so a fresh reading the phone has not vouched for must not bring the
    // dial straight back
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

  // Counted from the last visit's first reading, the ceiling would already have passed when this one began
  it('starts the ceiling afresh on each visit, rather than counting from the last one', async () => {
    await openSheet();
    await reportBareHeadings(118);
    await act(async () => {
      jest.advanceTimersByTime(CEILING_MS);
    });
    await fireEvent(screen.getByText('Qibla'), 'dismiss');

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await reportBareHeadings(118);

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
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
 * Nothing measures the wave there and no timer runs beside the compass: reading the accelerometer to verify the
 * gesture cost the compass its own accuracy. The phone's certainty decides, and the ceiling means the wait FAILS
 * OPEN: a user who ignores the invitation still gets a compass.
 */
describe('the wait before the compass is drawn', () => {
  it('shows the invitation while the phone has not yet vouched for its heading', async () => {
    await openSheet();

    await reportBareHeadings(95);
    await act(async () => {
      jest.advanceTimersByTime(CEILING_MS / 4);
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

  // Warm and certain both hold on the confirming reading here, and warm must win: nothing arrived to announce
  it('fires no arrival haptic when the phone also vouches for its heading on the confirming reading', async () => {
    await openSheet();
    await reportHeadings(95);
    await fireEvent(screen.getByText('Qibla'), 'dismiss');
    jest.mocked(Haptics.notificationAsync).mockClear();

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await reportWarmConfirmation(95, 7);
    await reportAccuracy(CERTAIN);
    await reportWarmConfirmation(95, 1);

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
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
    await reportHeadings(200);

    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
  });

  // The pair is what gives the test above meaning: a suppression that fired never would pass it too
  it('fires the arrival haptic on a reopen the phone had to vouch for, because the compass did arrive', async () => {
    await openSheet();
    await reportHeadings(95);
    await fireEvent(screen.getByText('Qibla'), 'dismiss');
    jest.mocked(Haptics.notificationAsync).mockClear();

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await reportHeadings(200);

    expect(Haptics.notificationAsync).toHaveBeenCalled();
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
  // The readings start with the watch, not with the fix, so a slow position read must not add its own length to
  // the wait
  it('starts the ceiling at the first reading, rather than restarting it when the fix lands', async () => {
    mockState.releasePosition = () => undefined;
    jest.useFakeTimers();
    await render(<QiblaSheet />);
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});

    await reportBareHeadings(140);
    await act(async () => {
      jest.advanceTimersByTime(CEILING_MS);
    });
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

describe('the ceiling an Android phone waits for a wave', () => {
  // This screen must never lock: a user may be unable to wave, and a phone's attitude may never move
  it('draws an unwaved phone at the ceiling', async () => {
    await openFusedSheet();
    await reportFused(...heldStill(95));

    await act(async () => {
      jest.advanceTimersByTime(WAVE_CEILING_MS);
    });
    await reportFused(...heldStill(95));

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });

  it('holds one millisecond short of the ceiling', async () => {
    await openFusedSheet();
    await reportFused(...heldStill(95));

    await act(async () => {
      jest.advanceTimersByTime(WAVE_CEILING_MS - 1);
    });
    await reportFused(...heldStill(95));

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  // The iPhone's ceiling is 3000ms, and drawing on it here would hand an unwaved phone its compass in a third of
  // the time the wave is given
  it('does not draw at the shorter ceiling a phone without the sensor waits', async () => {
    await openFusedSheet();
    await reportFused(...heldStill(95));

    await act(async () => {
      jest.advanceTimersByTime(CEILING_MS);
    });
    await reportFused(...heldStill(95));

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  it('starts the ceiling afresh on each visit, rather than counting from the last one', async () => {
    await openFusedSheet();
    await reportFused(...heldStill(95));
    await act(async () => {
      jest.advanceTimersByTime(WAVE_CEILING_MS);
    });
    await fireEvent(screen.getByText('Qibla'), 'dismiss');

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await reportFused(...heldStill(95));

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
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

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });

  // Every wave ends in an arrival, so the user is told by feel each time, where a warm reopen on a phone without
  // the sensor is told nothing
  it('announces the compass after every wave, a reopen included', async () => {
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
  // The line a mock build leaves in the phone's log, which is how a wave that would not open is diagnosed
  it('records a wave, with the turns that made it', async () => {
    await openFusedSheet();

    await reportFused(...waved(8));

    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith('QIBLA: compass drawn on the fused sensor', {
      waved: true,
      turns: 8,
      waitedMs: 0,
    });
  });

  it('records the ceiling, with the turns that fell short of a wave', async () => {
    await openFusedSheet();
    await reportFused(...waved(3));

    await act(async () => {
      jest.advanceTimersByTime(WAVE_CEILING_MS);
    });
    await reportFused({ headingDegrees: 95, attitude: tipped(3 * 31) });

    expect(logger.info).toHaveBeenCalledWith('QIBLA: compass drawn on the fused sensor', {
      waved: false,
      turns: 3,
      waitedMs: WAVE_CEILING_MS,
    });
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

  // A native side out of step with this code could send no attitude at all. Reading one that is not there would
  // throw before the heading was judged, on every sample, and the hint would never clear
  it('still draws the heading at the ceiling when the attitude is missing altogether', async () => {
    const bare = { headingDegrees: 95 } as FusedHeading;
    await openFusedSheet();
    await reportFused(bare);

    await act(async () => {
      jest.advanceTimersByTime(WAVE_CEILING_MS);
    });
    await reportFused(bare);

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });

  // The heading itself is sound, so the ceiling must still be reached: a wave that can never be counted must not
  // become a compass that can never be drawn
  it('still draws the heading at the ceiling', async () => {
    await openFusedSheet();
    await reportFused(garbled(95));

    await act(async () => {
      jest.advanceTimersByTime(WAVE_CEILING_MS);
    });
    await reportFused(garbled(95));

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
    expect(logger.info).toHaveBeenCalledWith('QIBLA: compass drawn on the fused sensor', {
      waved: false,
      turns: undefined,
      waitedMs: WAVE_CEILING_MS,
    });
  });
});

describe('an Android phone whose fused sensor reports itself and delivers nothing', () => {
  // A Play services too old to carry the sensor still reports it. Every wait on this screen is counted from a
  // reading, so a sensor that never sends one would leave the hint up for ever
  it('hands the visit to the platform heading once the sensor has been silent for three seconds', async () => {
    await openFusedSheet();
    expect(qiblaDevice.watchHeading).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(FUSED_SILENCE_MS);
    });

    expect(qiblaDevice.watchHeading).toHaveBeenCalledTimes(1);
    expect(mockStopFused).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      'QIBLA: the fused sensor delivered nothing, reading the platform heading instead'
    );
  });

  it('keeps waiting on the sensor one millisecond short of that', async () => {
    await openFusedSheet();

    await act(async () => {
      jest.advanceTimersByTime(FUSED_SILENCE_MS - 1);
    });

    expect(qiblaDevice.watchHeading).not.toHaveBeenCalled();
    expect(mockStopFused).not.toHaveBeenCalled();
  });

  it('never gives up on a sensor that has delivered a sample, however long it then takes', async () => {
    await openFusedSheet();
    await act(async () => {
      jest.advanceTimersByTime(FUSED_SILENCE_MS - 1);
    });
    await reportFused(...heldStill(95));

    await act(async () => {
      jest.advanceTimersByTime(FUSED_SILENCE_MS * 3);
    });

    expect(qiblaDevice.watchHeading).not.toHaveBeenCalled();
    expect(mockStopFused).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('starts nothing after the sheet has closed', async () => {
    await openFusedSheet();
    await fireEvent(screen.getByText('Qibla'), 'dismiss');

    await act(async () => {
      jest.advanceTimersByTime(FUSED_SILENCE_MS);
    });

    expect(qiblaDevice.watchHeading).not.toHaveBeenCalled();
  });

  // The visit runs on as a phone without the sensor does: no wave is asked for, and the shorter ceiling draws
  it('draws the compass at the platform heading’s own ceiling, with no wave asked for', async () => {
    await openFusedSheet();
    await act(async () => {
      jest.advanceTimersByTime(FUSED_SILENCE_MS);
    });
    await reportBareHeadings(118);

    await act(async () => {
      jest.advanceTimersByTime(CEILING_MS);
    });
    await reportBareHeadings(118);

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });

  it('holds one millisecond short of that ceiling', async () => {
    await openFusedSheet();
    await act(async () => {
      jest.advanceTimersByTime(FUSED_SILENCE_MS);
    });
    await reportBareHeadings(118);

    await act(async () => {
      jest.advanceTimersByTime(CEILING_MS - 1);
    });
    await reportBareHeadings(118);

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  it('stops the platform heading it fell back to when the sheet closes', async () => {
    await openFusedSheet();
    await act(async () => {
      jest.advanceTimersByTime(FUSED_SILENCE_MS);
    });
    expect(mockUnwatch).not.toHaveBeenCalled();

    await fireEvent(screen.getByText('Qibla'), 'dismiss');

    expect(mockUnwatch).toHaveBeenCalledTimes(1);
    // The silent sensor was stopped when the visit fell back, and is not stopped a second time by the close
    expect(mockStopFused).toHaveBeenCalledTimes(1);
  });

  // watchHeadingAsync is asynchronous, so the watch can finish setting up after the cleanup has already run
  it('stops a fallback watch that finished setting up after the sheet had closed', async () => {
    mockState.releaseWatch = () => undefined;
    await openFusedSheet();
    await act(async () => {
      jest.advanceTimersByTime(FUSED_SILENCE_MS);
    });

    await fireEvent(screen.getByText('Qibla'), 'dismiss');
    await act(async () => {
      mockState.releaseWatch?.();
    });

    expect(mockUnwatch).toHaveBeenCalledTimes(1);
  });

  // The sheet is open again by the time the watch arrives, so "is the sheet open" would wrongly keep it: it belongs
  // to a visit that is over, and kept, it would read the magnetometer beside the new visit's sensor
  it('stops a fallback watch that finished setting up after the sheet had closed and opened again', async () => {
    mockState.releaseWatch = () => undefined;
    await openFusedSheet();
    await act(async () => {
      jest.advanceTimersByTime(FUSED_SILENCE_MS);
    });
    await fireEvent(screen.getByText('Qibla'), 'dismiss');
    const releaseFirstVisitsWatch = mockState.releaseWatch;

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await act(async () => {
      releaseFirstVisitsWatch?.();
    });

    expect(mockUnwatch).toHaveBeenCalledTimes(1);
  });

  it('tries the sensor afresh on the next open, rather than writing the phone off', async () => {
    await openFusedSheet();
    await act(async () => {
      jest.advanceTimersByTime(FUSED_SILENCE_MS);
    });
    await fireEvent(screen.getByText('Qibla'), 'dismiss');

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await reportFused(...waved(8));

    expect(qiblaHeading.hasFusedHeading).toHaveBeenCalledTimes(2);
    expect(qiblaHeading.watchFusedHeading).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });

  // The position read outlasts the three seconds of silence, so the open's own last steps run AFTER the visit
  // has fallen back. What they store must not displace the platform heading's stop, or the magnetometer would stay
  // armed for the life of the process
  it('still stops the platform heading when the open that fell back was slow to read the position', async () => {
    mockState.fused = true;
    mockState.releasePosition = () => undefined;
    jest.useFakeTimers();
    await render(<QiblaSheet />);
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await act(async () => {
      jest.advanceTimersByTime(FUSED_SILENCE_MS);
    });
    await act(async () => {
      mockState.releasePosition?.();
    });

    await fireEvent(screen.getByText('Qibla'), 'dismiss');

    expect(mockUnwatch).toHaveBeenCalledTimes(1);
  });
});

describe('a phone without the fused sensor, three seconds into an open', () => {
  // The wait for a first fused sample belongs to a fused phone alone. Armed here, it would stop the accuracy watch
  // and start a second heading watch on every open of every other phone
  it('has given up on nothing: one heading watch, the accuracy watch still running, no fallback recorded', async () => {
    await openSheet();
    await reportBareHeadings(118);

    await act(async () => {
      jest.advanceTimersByTime(FUSED_SILENCE_MS * 2);
    });

    expect(qiblaDevice.watchHeading).toHaveBeenCalledTimes(1);
    expect(mockStopAccuracy).not.toHaveBeenCalled();
    expect(mockUnwatch).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
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

  it('waits on the sensor once, so one silence means one fallback', async () => {
    mockState.fused = true;
    jest.useFakeTimers();
    await render(<QiblaSheet />);
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});

    await act(async () => {
      jest.advanceTimersByTime(FUSED_SILENCE_MS);
    });

    expect(qiblaDevice.watchHeading).toHaveBeenCalledTimes(1);
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

  // The first open had already given up on a silent sensor and fallen back when the second one arrived
  it('stops the platform heading the first open had fallen back to', async () => {
    mockState.fused = true;
    jest.useFakeTimers();
    await render(<QiblaSheet />);
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await act(async () => {
      jest.advanceTimersByTime(FUSED_SILENCE_MS);
    });
    expect(mockUnwatch).not.toHaveBeenCalled();

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});

    expect(mockUnwatch).toHaveBeenCalledTimes(1);
  });

  it('stops a platform heading the first open was still setting up when the second arrived', async () => {
    mockState.fused = true;
    mockState.releaseWatch = () => undefined;
    jest.useFakeTimers();
    await render(<QiblaSheet />);
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await act(async () => {
      jest.advanceTimersByTime(FUSED_SILENCE_MS);
    });
    const releaseFirstOpensWatch = mockState.releaseWatch;

    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await act(async () => {
      releaseFirstOpensWatch?.();
    });

    expect(mockUnwatch).toHaveBeenCalledTimes(1);
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
