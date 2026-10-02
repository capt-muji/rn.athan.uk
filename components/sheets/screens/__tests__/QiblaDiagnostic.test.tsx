/**
 * The qibla sheet with the diagnostic flag ON, which is the only build that reads the native module.
 *
 * `Qibla.test.tsx` covers the shipped configuration, where the flag is off and nothing here renders or
 * arms. This suite is its opposite half: the readout, its placeholders, and the watch being torn down
 * with the sheet. The mock is hoisted above the imports on purpose, because `flags.ts` is read once at
 * module evaluation and ESM imports are hoisted, so setting the variable in the file body would run
 * after the sheet has captured `FEATURE_FLAGS`.
 */

jest.mock('@/shared/flags', () => ({ FEATURE_FLAGS: { qiblaDiagnostic: true } }));

import { act, fireEvent, render, screen } from '@testing-library/react-native';

import type { QiblaDiagnostic } from '@/modules/qiblaheading';

import QiblaSheet from '../Qibla';

// Babel hoists jest.mock above these, so the names must carry the `mock` prefix to be reachable
const mockDiagnosticWatchers: ((reading: QiblaDiagnostic) => void)[] = [];
const mockStopDiagnostic = jest.fn();
const mockHeadingWatchers: ((reading: { trueHeading: number }) => void)[] = [];

jest.mock('@/modules/qiblaheading', () => ({
  watchQiblaDiagnostic: jest.fn((onReading: (reading: QiblaDiagnostic) => void) => {
    mockDiagnosticWatchers.push(onReading);
    return mockStopDiagnostic;
  }),
}));

jest.mock('@/device/qibla', () => ({
  requestQiblaPermission: jest.fn(async () => true),
  readPosition: jest.fn(async () => ({ latitude: 51.475, longitude: -0.2015 })),
  readPlaceName: jest.fn(async () => 'London, United Kingdom'),
  watchHeading: jest.fn(async (onReading: (reading: { trueHeading: number }) => void) => {
    mockHeadingWatchers.push(onReading);
    return jest.fn();
  }),
}));

jest.mock('@/stores/ui', () => ({ setQiblaSheetModal: jest.fn() }));

/** The sheet arms its sensors on present, which the library reports as a change to index 0 */
const openSheet = async () => {
  await render(<QiblaSheet />);
  await fireEvent(screen.getByText('Qibla'), 'change', 0);
  await act(async () => {});
};

beforeEach(() => {
  mockDiagnosticWatchers.length = 0;
  mockHeadingWatchers.length = 0;
  mockStopDiagnostic.mockClear();
});

describe('the diagnostic readout', () => {
  it('renders before any reading arrives, so the sheet never resizes under the user', async () => {
    await openSheet();

    expect(screen.getByTestId('qibla-diagnostic')).toBeOnTheScreen();
    expect(screen.getByText('accuracy -')).toBeOnTheScreen();
    expect(screen.getByText('wants calibration -')).toBeOnTheScreen();
    expect(screen.getByText('fused heading -')).toBeOnTheScreen();
    expect(screen.getByText('fused error -')).toBeOnTheScreen();
  });

  // The iOS half: the degrees expo-location buckets away, negatives included
  it('shows the accuracy in degrees to one decimal place', async () => {
    await openSheet();

    await act(async () => {
      mockDiagnosticWatchers[0]({ accuracyDegrees: 12.34, wantsCalibration: true });
    });

    expect(screen.getByText('accuracy 12.3')).toBeOnTheScreen();
    expect(screen.getByText('wants calibration true')).toBeOnTheScreen();
  });

  // Apple's own "this reading is invalid" signal, which the bucketing makes unrecoverable from JS
  it('shows a negative accuracy rather than hiding it', async () => {
    await openSheet();

    await act(async () => {
      mockDiagnosticWatchers[0]({ accuracyDegrees: -1 });
    });

    expect(screen.getByText('accuracy -1.0')).toBeOnTheScreen();
  });

  it('shows the fused heading and its cone when FOP supplies both', async () => {
    await openSheet();

    await act(async () => {
      mockDiagnosticWatchers[0]({ fusedHeadingDegrees: 118.99, fusedErrorDegrees: 7.5 });
    });

    expect(screen.getByText('fused heading 119.0')).toBeOnTheScreen();
    expect(screen.getByText('fused error 7.5')).toBeOnTheScreen();
  });

  // The cone is optional per sample, so a reading without one must not print a fabricated number
  it('leaves the cone as a placeholder on a sample that carries none', async () => {
    await openSheet();

    await act(async () => {
      mockDiagnosticWatchers[0]({ fusedHeadingDegrees: 200 });
    });

    expect(screen.getByText('fused heading 200.0')).toBeOnTheScreen();
    expect(screen.getByText('fused error -')).toBeOnTheScreen();
  });
});

describe('arming and disarming the diagnostic', () => {
  it('starts one watch when the sheet opens', async () => {
    await openSheet();

    expect(mockDiagnosticWatchers).toHaveLength(1);
  });

  // The sensors would otherwise run for the life of the process, which every sheet in this app mounts into
  it('stops the watch when the sheet closes', async () => {
    await openSheet();

    await fireEvent(screen.getByText('Qibla'), 'dismiss');

    expect(mockStopDiagnostic).toHaveBeenCalled();
  });
});
