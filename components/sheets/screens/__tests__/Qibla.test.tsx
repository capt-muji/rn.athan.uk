/**
 * The qibla sheet: what it shows before and after a position, and that its needle reads the fused sensor
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { readDeclination, readPosition } from '@/device/qibla';

import QiblaSheet from '../Qibla';

jest.mock('@/device/qibla', () => ({
  readPosition: jest.fn(),
  readDeclination: jest.fn(),
}));

/** Nothing delivers sensor samples off a device, so the yaw the sheet reads is driven from here */
const mockYaw = { value: 0 };

jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual<typeof import('react-native-reanimated')>('react-native-reanimated/mock');

  return {
    ...actual,
    IOSReferenceFrame: { XTrueNorthZVertical: 3 },
    SensorType: { ROTATION: 5 },
    useAnimatedReaction: (prepare: () => number, react: (value: number) => void) => react(prepare()),
    useAnimatedSensor: () => ({ sensor: { value: { yaw: mockYaw.value } }, unregister: jest.fn(), isAvailable: true }),
  };
});

const mockReadPosition = readPosition as jest.MockedFunction<typeof readPosition>;
const mockReadDeclination = readDeclination as jest.MockedFunction<typeof readDeclination>;

const HINT = 'Point the top of the phone at the marker. Move away from metal and magnets if it will not settle.';

/** The sheet reads its position when it finishes opening, never on mount */
const present = async () => {
  await act(async () => {
    fireEvent(screen.getByText('Qibla'), 'change', 0);
  });
};

const dismiss = async () => {
  await act(async () => {
    fireEvent(screen.getByText('Qibla'), 'dismiss');
  });
};

describe('the qibla sheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReadPosition.mockResolvedValue({ latitude: 51.5074, longitude: -0.1278 });
    mockReadDeclination.mockResolvedValue(1.2);
  });

  it('says it is looking before a position arrives', async () => {
    await render(<QiblaSheet />);

    expect(screen.getByText('Finding your position')).toBeTruthy();
  });

  it('shows the bearing to the Kaaba once the position is known', async () => {
    await render(<QiblaSheet />);

    await present();

    await waitFor(() => expect(screen.getByText('119° from north')).toBeTruthy());
  });

  // A dial drawn before the bearing arrives would point somewhere, and anywhere it pointed would be a guess
  it('draws no dial until the position is known', async () => {
    await render(<QiblaSheet />);

    expect(screen.queryByTestId('qibla-face')).toBeNull();
  });

  it('draws the dial once the position is known', async () => {
    await render(<QiblaSheet />);

    await present();

    await waitFor(() => expect(screen.getByTestId('qibla-face')).toBeTruthy());
  });

  it('names the one thing the user can do about the needle, beside a live bearing', async () => {
    await render(<QiblaSheet />);

    await present();

    await waitFor(() => expect(screen.getByText(HINT)).toBeTruthy());
  });

  // The hint tells the user how to aim a needle, so it says nothing while there is no needle to aim
  it('says nothing about aiming the phone while there is no bearing to read', async () => {
    mockReadPosition.mockResolvedValue(null);
    await render(<QiblaSheet />);

    await present();

    await waitFor(() => expect(screen.getByText('Your location is not available right now')).toBeTruthy());
    expect(screen.queryByText(HINT)).toBeNull();
  });

  // Saying "finding" forever is a lie the user cannot act on, so a failed read names what happened
  it('says so when the position cannot be read', async () => {
    mockReadPosition.mockResolvedValue(null);
    await render(<QiblaSheet />);

    await present();

    await waitFor(() => expect(screen.getByText('Your location is not available right now')).toBeTruthy());
  });

  it('goes back to looking when it is reopened after a failure', async () => {
    mockReadPosition.mockResolvedValueOnce(null);
    await render(<QiblaSheet />);
    await present();
    await waitFor(() => expect(screen.getByText('Your location is not available right now')).toBeTruthy());

    await dismiss();
    await present();

    await waitFor(() => expect(screen.getByText('119° from north')).toBeTruthy());
  });

  // Every sheet is mounted from launch, so a mount-keyed read would run forever on every device
  it('does not read the position until it is opened', async () => {
    await render(<QiblaSheet />);

    expect(mockReadPosition).not.toHaveBeenCalled();
  });

  // iOS reports yaw from true north already, so correcting it again would bend the needle by twice the declination
  it('does not correct the declination on iOS', async () => {
    Platform.OS = 'ios';
    await render(<QiblaSheet />);

    await present();

    await waitFor(() => expect(screen.getByText('119° from north')).toBeTruthy());
    expect(mockReadDeclination).not.toHaveBeenCalled();
  });

  // The reaction that turns a sensor sample into the dial's angle is the one line a device would otherwise own
  it('feeds the dial from the sensor yaw', async () => {
    mockYaw.value = -Math.PI / 2;
    await render(<QiblaSheet />);

    await present();

    await waitFor(() => expect(screen.getByTestId('qibla-face')).toBeTruthy());
  });

  describe('on android, where the sensor is magnetic-referenced', () => {
    beforeEach(() => {
      Platform.OS = 'android';
    });

    afterEach(() => {
      Platform.OS = 'ios';
    });

    // Without this correction every needle is off by the local declination, which is over 20 degrees in places
    it('corrects the declination once it is opened', async () => {
      await render(<QiblaSheet />);

      await present();

      await waitFor(() => expect(mockReadDeclination).toHaveBeenCalledTimes(1));
    });

    // A user who travels crosses into a different declination, so a reopen must not reuse the last one
    it('corrects the declination again every time it is reopened', async () => {
      await render(<QiblaSheet />);
      await present();
      await waitFor(() => expect(mockReadDeclination).toHaveBeenCalledTimes(1));

      await dismiss();
      await present();

      await waitFor(() => expect(mockReadDeclination).toHaveBeenCalledTimes(2));
    });
  });
});
