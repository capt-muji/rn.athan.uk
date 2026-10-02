/**
 * The qibla sheet: what it draws, when it arms the sensors, and the one tap the user feels per crossing
 */

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import type React from 'react';
import { Dimensions, Linking, StyleSheet } from 'react-native';
import * as Reanimated from 'react-native-reanimated';

import { SETTLE_MIN_READINGS, SETTLE_WINDOW_MS } from '@/shared/qiblaSettle';

import QiblaSheet from '../Qibla';

// Babel hoists jest.mock above these, so the names must carry the `mock` prefix to be reachable from the factory
const mockWatchers: ((reading: { trueHeading: number }) => void)[] = [];
const mockUnwatch = jest.fn();

const mockState = {
  granted: true,
  position: { latitude: 51.475, longitude: -0.2015 },
  place: 'London, United Kingdom' as string | null,
  /** Held open so a test can dismiss the sheet mid-await, which is the race the hook guards */
  releasePermission: null as (() => void) | null,
  releasePosition: null as (() => void) | null,
  releasePlace: null as (() => void) | null,
  releaseWatch: null as (() => void) | null,
};

// The diagnostic module, so this suite can prove the shipped build never reaches it. The factory builds its own
// mock because babel hoists it above every declaration in this file
jest.mock('@/modules/qiblaheading', () => ({ watchQiblaDiagnostic: jest.fn(() => jest.fn()) }));

/**
 * The calibration gate's state, which this suite SETS rather than earns.
 *
 * The gate reads the accelerometer through `useAnimatedReaction`, which runs on the UI runtime and which no
 * test can drive: `hooks/__tests__/useQiblaShake.test.tsx` owns proving a wave is judged correctly. What this
 * suite tests is what the SHEET does with the answer, so it hands the answer over directly.
 */
const mockShake = { hasWaved: false, notify: null as (() => void) | null };

jest.mock('@/hooks/useQiblaShake', () => ({
  useQiblaShake: (active: boolean) => {
    const React = require('react');
    const [, bump] = React.useState(0);
    mockShake.notify = () => bump((count: number) => count + 1);

    // The real hook clears itself whenever the hint UNMOUNTS, so a second open earns its own wave. Mocking that
    // away would let a reopened sheet inherit the first open's gesture and pass a test it should fail
    React.useEffect(
      () => () => {
        mockShake.hasWaved = false;
      },
      []
    );

    return active ? mockShake : { hasWaved: false };
  },
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

/** The sheet arms its sensors on present, which the library reports as a change to index 0 */
const openSheet = async () => {
  await render(<QiblaSheet />);
  await fireEvent(screen.getByText('Qibla'), 'change', 0);
  await act(async () => {});
};

/**
 * Waves the phone until the gate is satisfied, which the compass now waits for.
 *
 * The shake is the owner's entry condition, so almost every assertion about a drawn dial has to perform the
 * gesture first: a heading alone no longer draws anything. Readings are delivered the way the sensor does,
 * each differing from the last, because the reaction skips a repeated value exactly as a real stream never
 * repeats a float.
 */
const performWave = async () => {
  await act(async () => {
    mockShake.hasWaved = true;
    mockShake.notify?.();
  });
};

/**
 * Drives headings through the watch exactly as the platform would.
 *
 * The settling gate draws nothing until the stream has been steady across its whole window, so a reading
 * is preceded by enough steady samples, spread over real time, for the window to span and settle. Without
 * them the sheet correctly refuses to draw and every assertion about the dial is about a blank stage.
 */
const reportHeadings = async (...headings: number[]) => {
  jest.useFakeTimers();
  // The wave gates the compass, so a test asking for a drawn dial has to perform it: these two together are
  // what "the compass is up" now means. A test about the gate itself drives the sensor directly instead
  await performWave();
  for (const trueHeading of headings) {
    for (let i = 0; i < SETTLE_MIN_READINGS; i++) {
      await act(async () => {
        for (const watcher of mockWatchers) watcher({ trueHeading });
        jest.advanceTimersByTime(SETTLE_WINDOW_MS / (SETTLE_MIN_READINGS - 1));
      });
    }
  }
};

/**
 * Drives a lost heading, which both platforms report as -1.
 *
 * Separate from `reportHeadings` and advancing no clock of its own, because the grace window that
 * survives a dropout is counted in real time and these tests drive that clock themselves.
 */
const reportLostHeadings = async (count = 1) => {
  await act(async () => {
    for (let i = 0; i < count; i++) {
      for (const watcher of mockWatchers) watcher({ trueHeading: -1 });
    }
  });
};

beforeEach(() => {
  mockShake.hasWaved = false;
  mockShake.notify = null;
  mockWatchers.length = 0;
  mockUnwatch.mockClear();
  mockState.granted = true;
  mockState.position = { latitude: 51.475, longitude: -0.2015 };
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

    expect(screen.getByText('Turn until it vibrates')).toBeOnTheScreen();
  });
});

// This suite runs the SHIPPED configuration, with the diagnostic flag off. QiblaDiagnostic.test.tsx is its
// opposite half, and neither alone can tell a gated feature from an ungated one.
describe('the diagnostic the shipped build never arms', () => {
  it('reads no diagnostic sensor when the sheet opens, because the flag is off', async () => {
    const { watchQiblaDiagnostic } = jest.requireMock('@/modules/qiblaheading');

    await openSheet();

    expect(watchQiblaDiagnostic).not.toHaveBeenCalled();
  });

  it('draws no readout, so the sheet is the one the owner accepted', async () => {
    await openSheet();

    expect(screen.queryByTestId('qibla-diagnostic')).toBeNull();
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

    expect(qiblaDevice.readPlaceName).toHaveBeenCalledWith({ latitude: 51.475, longitude: -0.2015 });
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

    expect(screen.queryByText(/Wave your phone/)).toBeNull();
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
    // The second open earns its own wave, so the compass and its label wait for the gesture again
    await performWave();

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

describe('the settling gate', () => {
  it('draws nothing on a single reading, however good it looks', async () => {
    await openSheet();

    // One reading cannot span the window, so the stream has not been shown to have converged
    await act(async () => {
      for (const watcher of mockWatchers) watcher({ trueHeading: 118 });
    });

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  // The dial reads the heading off a shared value, so a turn costs no render and the rendered transform cannot
  // see it. Re-rendering publishes the live value into the style, which is how the turn becomes observable
  const liveDialRotation = async (rerender: (ui: React.ReactElement) => Promise<void>) => {
    await rerender(<QiblaSheet />);

    return screen.getByTestId('qibla-dial').props.style.transform[0].rotate;
  };

  it('follows every reading once it has settled, which is the whole point of a compass', async () => {
    const { rerender } = await render(<QiblaSheet />);
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await reportHeadings(95);

    // A TURNING phone is a moving window, so a gate re-tested per reading would drop exactly these updates and
    // the dial would only move when the phone was held still
    await act(async () => {
      for (const watcher of mockWatchers) watcher({ trueHeading: 140 });
    });

    expect(await liveDialRotation(rerender)).toBe('-140deg');
  });

  it('keeps following through a fast sweep, where no window could ever look settled', async () => {
    const { rerender } = await render(<QiblaSheet />);
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});
    await reportHeadings(95);

    // 20 degrees a reading: the window drifts far past the threshold on every one of them
    await act(async () => {
      for (const degrees of [115, 135, 155, 175, 195]) {
        for (const watcher of mockWatchers) watcher({ trueHeading: degrees });
      }
    });

    expect(await liveDialRotation(rerender)).toBe('-195deg');
  });

  it('proves itself again after the heading is genuinely lost, rather than drawing a cold stream', async () => {
    jest.useFakeTimers();
    await openSheet();
    await reportHeadings(95);

    await reportLostHeadings();
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    // The loss outlasted the grace window, so a single fresh reading must not bring the dial straight back
    await act(async () => {
      for (const watcher of mockWatchers) watcher({ trueHeading: 140 });
    });

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
    jest.useRealTimers();
  });

  it('drops readings older than the window, so a slow trickle can never settle', async () => {
    await openSheet();
    jest.useFakeTimers();

    // One reading per window: the trailing window holds exactly one at a time, so the count gate never clears.
    // An untrimmed window would accumulate these and settle on readings minutes apart
    await act(async () => {
      for (let i = 0; i < SETTLE_MIN_READINGS * 2; i++) {
        for (const watcher of mockWatchers) watcher({ trueHeading: 118 });
        jest.advanceTimersByTime(SETTLE_WINDOW_MS + 100);
      }
    });

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
    jest.useRealTimers();
  });

  it('starts the window again after a lost heading, rather than settling on readings from before it', async () => {
    await openSheet();
    jest.useFakeTimers();

    // Half a window, then the stream drops, then half a window: a kept window would total enough to settle
    await act(async () => {
      for (let i = 0; i < 4; i++) {
        for (const watcher of mockWatchers) watcher({ trueHeading: 118 });
        jest.advanceTimersByTime(400);
      }
    });
    await reportLostHeadings();
    await act(async () => {
      for (let i = 0; i < 4; i++) {
        for (const watcher of mockWatchers) watcher({ trueHeading: 118 });
        jest.advanceTimersByTime(400);
      }
    });

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
    jest.useRealTimers();
  });

  it('draws nothing while the stream is still converging, even though it is smooth', async () => {
    await openSheet();
    jest.useFakeTimers();

    // A cold fusion walks toward the truth: quiet between readings and still 20 degrees out, which is
    // exactly the stream a spread gate would have accepted
    await act(async () => {
      for (let i = 0; i < SETTLE_MIN_READINGS * 2; i++) {
        for (const watcher of mockWatchers) watcher({ trueHeading: 118 + 20 * Math.exp(-i / 6) });
        jest.advanceTimersByTime(SETTLE_WINDOW_MS / (SETTLE_MIN_READINGS - 1));
      }
    });

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  it('fires no haptic on a reading it refuses to draw', async () => {
    await openSheet();

    // Dead on the line, so a tap would fire the moment the gate let it through
    await act(async () => {
      for (const watcher of mockWatchers) watcher({ trueHeading: 118.99 });
    });

    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });
});

// The owner's requirement: the wave is the GATE, not decoration. The figure of eight is the standard hard-iron
// re-estimation, and the wait doubles as the time the heading needs to converge behind it
describe('the wave that unlocks the compass', () => {
  /** A settled heading delivered WITHOUT the wave, which is the state the gate exists to refuse */
  const reportHeadingsUnwaved = async (...headings: number[]) => {
    jest.useFakeTimers();
    for (const trueHeading of headings) {
      for (let index = 0; index < SETTLE_MIN_READINGS; index++) {
        await act(async () => {
          for (const watcher of mockWatchers) watcher({ trueHeading });
          jest.advanceTimersByTime(SETTLE_WINDOW_MS / (SETTLE_MIN_READINGS - 1));
        });
      }
    }
  };

  it('keeps the compass shut while the phone has not been waved, however good the heading is', async () => {
    await openSheet();

    await reportHeadingsUnwaved(95);

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
    expect(screen.getByText(/Wave your phone/)).toBeOnTheScreen();
  });

  it('opens the compass once the wave is done and the heading is ready', async () => {
    await openSheet();
    await reportHeadingsUnwaved(95);

    await performWave();

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });

  // The wave alone is not enough either: a dial drawn without a live heading would hold its last angle and
  // quietly point the wrong way, which is the one thing this feature must never do
  it('keeps the compass shut for a wave with no heading behind it', async () => {
    await openSheet();

    await performWave();

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
  });

  // A fresh wave is asked for on every open, because the calibration it performs goes stale with the room
  it('asks for the wave again the next time the sheet is opened', async () => {
    await openSheet();
    await reportHeadings(95);

    await fireEvent(screen.getByText('Qibla'), 'change', -1);
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});

    expect(screen.getByText(/Wave your phone/)).toBeOnTheScreen();
  });
});

describe('the wait before the compass can be drawn', () => {
  /** The travelling dot, which the figure hides from the screen reader, so only a hidden query finds it */
  const waveDot = () => screen.queryByTestId('qibla-wave-phone', { includeHiddenElements: true });

  it('tells the user what to do about it, rather than leaving the stage blank', async () => {
    await openSheet();

    expect(screen.getByText(/Wave your phone in a figure eight/)).toBeOnTheScreen();
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
    expect(screen.getByText(/Wave your phone in a figure eight/)).toBeOnTheScreen();
  });

  // The hint and its looping animation exist only while the wait does: an infinite loop left behind the compass
  // would tick the UI thread for as long as the sheet stayed open
  it('takes the hint and its animation away the moment the compass draws', async () => {
    await openSheet();

    await reportHeadings(95);

    expect(screen.queryByText(/Wave your phone in a figure eight/)).toBeNull();
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

    expect(screen.queryByText(/Wave your phone in a figure eight/)).toBeNull();
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

    expect(screen.getByText(/Wave your phone in a figure eight/)).toBeOnTheScreen();
    jest.useRealTimers();
  });
});

describe('a heading that arrives before the position', () => {
  it('counts toward the settling window while the fix is still being read, rather than being dropped', async () => {
    mockState.releasePosition = () => undefined;
    await render(<QiblaSheet />);
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});

    // Readings arrive while the fix is still being read, and they must fill the window rather than wait for it
    await reportHeadings(140);
    expect(screen.queryByTestId('qibla-dial')).toBeNull();

    await act(async () => {
      mockState.releasePosition?.();
    });
    // One further reading finds a window already settled, so the compass appears immediately
    await act(async () => {
      for (const watcher of mockWatchers) watcher({ trueHeading: 140 });
    });

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });
});
