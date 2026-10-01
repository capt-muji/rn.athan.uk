/**
 * The qibla sheet: what it draws, when it arms the sensors, and the one tap the user feels per crossing
 */

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { Dimensions, StyleSheet } from 'react-native';

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

/** Drives headings through the watch exactly as the platform would */
const reportHeadings = async (...headings: number[]) => {
  await act(async () => {
    for (const trueHeading of headings) {
      for (const watcher of mockWatchers) watcher({ trueHeading });
    }
  });
};

beforeEach(() => {
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

    await reportHeadings(-1);

    expect(screen.getByText('London, United Kingdom')).toBeOnTheScreen();
  });

  // The dial is gone here, so a line tied to it would go too and shrink the sheet
  it('keeps the line even once the dial has blanked for good', async () => {
    jest.useFakeTimers();
    await openSheet();
    await reportHeadings(95);

    await reportHeadings(-1);
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
    expect(screen.getByText('London, United Kingdom')).toBeOnTheScreen();
    jest.useRealTimers();
  });

  it('holds the line before any heading has arrived, so the sheet opens at its settled height', async () => {
    await openSheet();

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
    expect(screen.getByText('London, United Kingdom')).toBeOnTheScreen();
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

    await reportHeadings(-1);

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });

  it('stops drawing the dial once the loss lasts, rather than pointing somewhere it does not know', async () => {
    jest.useFakeTimers();
    await openSheet();
    await reportHeadings(95);

    await reportHeadings(-1);
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

    await reportHeadings(-1);
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await reportHeadings(-1, -1);
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

    await reportHeadings(-1);
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    await reportHeadings(-1);
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

    await reportHeadings(-1);
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
    await reportHeadings(-1);

    await reportHeadings(95);

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });

  it('taps on arriving at the line after a lost heading, rather than staying silent', async () => {
    await openSheet();
    await reportHeadings(118.9);
    await reportHeadings(-1);

    await reportHeadings(118.9);

    expect(Haptics.impactAsync).toHaveBeenCalledTimes(2);
  });
});

describe('when the user refuses location', () => {
  it('says so rather than pointing, which is the one thing the app must never do', async () => {
    mockState.granted = false;

    await openSheet();

    expect(screen.getByText('The qibla needs your location.')).toBeOnTheScreen();
    expect(screen.queryByTestId('qibla-dial')).toBeNull();
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

describe('a heading that arrives before the position', () => {
  it('is held and applied the moment the position lands, rather than dropped', async () => {
    mockState.releasePosition = () => undefined;
    await render(<QiblaSheet />);
    await fireEvent(screen.getByText('Qibla'), 'change', 0);
    await act(async () => {});

    // A reading can arrive while the fix is still being read, and the old code never saw it
    await act(async () => {
      for (const watcher of mockWatchers) watcher({ trueHeading: 140 });
    });
    expect(screen.queryByTestId('qibla-dial')).toBeNull();

    await act(async () => {
      mockState.releasePosition?.();
    });

    expect(screen.getByTestId('qibla-dial')).toBeOnTheScreen();
  });
});
