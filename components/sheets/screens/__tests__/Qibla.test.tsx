/**
 * The qibla sheet: what it draws, when it arms the sensors, and the one tap the user feels per crossing
 */

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import type React from 'react';
import { Dimensions, Linking, StyleSheet } from 'react-native';
import * as Reanimated from 'react-native-reanimated';

import type { QiblaDiagnostic } from '@/modules/qiblaheading';
import { WARM_CONFIRM_READINGS } from '@/shared/qiblaSettle';

import QiblaSheet from '../Qibla';

// Babel hoists jest.mock above these, so the names must carry the `mock` prefix to be reachable from the factory
const mockWatchers: ((reading: { trueHeading: number }) => void)[] = [];
const mockUnwatch = jest.fn();
const mockAccuracyWatchers: ((reading: QiblaDiagnostic) => void)[] = [];
const mockStopAccuracy = jest.fn();

/** What the owner's iPhone reported indoors, off its cable: inside the bar */
const CERTAIN: QiblaDiagnostic = { accuracyDegrees: 12.5, wantsCalibration: false };

/** The ceiling as a LITERAL, because a test spending the constant it guards moves with it and guards nothing */
const CEILING_MS = 3000;

const mockState = {
  granted: true,
  position: { latitude: 51.5074, longitude: -0.1278 },
  place: 'London, United Kingdom' as string | null,
  /** Held open so a test can dismiss the sheet mid-await, which is the race the hook guards */
  releasePermission: null as (() => void) | null,
  releasePosition: null as (() => void) | null,
  releasePlace: null as (() => void) | null,
  releaseWatch: null as (() => void) | null,
};

// What the phone says about its own heading, which the gate decides on, so each test reports it by hand
jest.mock('@/modules/qiblaheading', () => ({
  watchQiblaDiagnostic: jest.fn((onReading: (reading: QiblaDiagnostic) => void) => {
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

/** Delivers what the phone says about its own heading, to the live watch only */
const reportAccuracy = async (reading: QiblaDiagnostic) => {
  const watcher = mockAccuracyWatchers[mockAccuracyWatchers.length - 1];

  await act(async () => {
    watcher(reading);
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

beforeEach(() => {
  mockWatchers.length = 0;
  mockUnwatch.mockClear();
  mockAccuracyWatchers.length = 0;
  mockStopAccuracy.mockClear();
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
    const { watchQiblaDiagnostic } = jest.requireMock('@/modules/qiblaheading');

    await openSheet();

    expect(watchQiblaDiagnostic).toHaveBeenCalledTimes(1);
  });

  // The sensors would otherwise run for the life of the process, which every sheet in this app mounts into
  it('stops the accuracy watch when the sheet closes', async () => {
    await openSheet();

    await fireEvent(screen.getByText('Qibla'), 'dismiss');

    expect(mockStopAccuracy).toHaveBeenCalledTimes(1);
  });

  it('arms no accuracy watch when the user refused location, having no compass to gate', async () => {
    const { watchQiblaDiagnostic } = jest.requireMock('@/modules/qiblaheading');
    mockState.granted = false;

    await openSheet();

    expect(watchQiblaDiagnostic).not.toHaveBeenCalled();
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

    await reportAccuracy({ accuracyDegrees, wantsCalibration: false });
    await reportBareHeadings(118);

    expect(screen.queryByTestId('qibla-dial') !== null).toBe(draws);
  });

  // Apple's sentinel for a heading it considers invalid, which a bare comparison against the bar would open on
  it('refuses a negative accuracy, which is the phone disowning its own heading', async () => {
    await openSheet();

    await reportAccuracy({ accuracyDegrees: -1, wantsCalibration: true });
    await reportBareHeadings(118);

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  it('draws on the error cone Android reports, which arrives under another name', async () => {
    await openSheet();

    await reportAccuracy({ fusedHeadingDegrees: 118, fusedErrorDegrees: 9 });
    await reportBareHeadings(118);

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });

  // Android attaches its cone to SOME samples only, so the sample after a good one usually carries none
  it('keeps the last certainty through a sample that carries no cone', async () => {
    await openSheet();

    await reportAccuracy({ fusedHeadingDegrees: 118, fusedErrorDegrees: 9 });
    await reportAccuracy({ fusedHeadingDegrees: 119 });
    await reportBareHeadings(118);

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });

  it('takes a sample that carries no cone as silence, never as certainty', async () => {
    await openSheet();

    await reportAccuracy({ fusedHeadingDegrees: 118 });
    await reportBareHeadings(118);

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  it('decides on the latest report, so a phone grown unsure is not drawn on what it said before', async () => {
    await openSheet();

    await reportAccuracy(CERTAIN);
    await reportAccuracy({ accuracyDegrees: 40, wantsCalibration: false });
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
    await reportAccuracy({ accuracyDegrees: 25.4, wantsCalibration: false });
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

    await reportAccuracy({ accuracyDegrees: 40, wantsCalibration: false });
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
 * The wait the user sees, and what decides its length.
 *
 * NOTHING measures the wave and no timer runs beside the compass: reading the accelerometer to verify the gesture
 * cost the compass its own accuracy. The phone's certainty decides, and the ceiling means the wait FAILS OPEN: a
 * user who ignores the invitation still gets a compass.
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
