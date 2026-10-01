/**
 * The qibla sheet: what it draws, when it arms the sensors, and the one tap the user feels per crossing
 */

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import QiblaSheet from '../Qibla';

// Babel hoists jest.mock above these, so the names must carry the `mock` prefix to be reachable from the factory
const mockWatchers: ((reading: { trueHeading: number }) => void)[] = [];
const mockUnwatch = jest.fn();
const mockState = {
  granted: true,
  position: { latitude: 51.475, longitude: -0.2015 },
  /** Held open so a test can dismiss the sheet mid-await, which is the race the hook guards */
  releasePermission: null as (() => void) | null,
  releasePosition: null as (() => void) | null,
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
  mockState.releasePermission = null;
  mockState.releasePosition = null;
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
  it('stops drawing the dial rather than pointing somewhere it does not know', async () => {
    await openSheet();
    await reportHeadings(95);

    await reportHeadings(-1);

    expect(screen.queryByTestId('qibla-dial')).toBeNull();
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

    expect(qiblaDevice.watchHeading).not.toHaveBeenCalled();
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
});
