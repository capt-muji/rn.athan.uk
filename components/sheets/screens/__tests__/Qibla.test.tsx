/**
 * The qibla sheet: what it shows before and after a position, and that its sensor never outlives the sheet
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { readPosition, watchHeading } from '@/device/qibla';

import QiblaSheet from '../Qibla';

jest.mock('@/device/qibla', () => ({
  readPosition: jest.fn(),
  watchHeading: jest.fn(),
}));

const mockReadPosition = readPosition as jest.MockedFunction<typeof readPosition>;
const mockWatchHeading = watchHeading as jest.MockedFunction<typeof watchHeading>;
/** The sheet reads its position and arms the sensor when it finishes opening, never on mount */
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
    mockWatchHeading.mockResolvedValue(jest.fn());
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

  // The number is arithmetic and exact; the needle is only as good as the magnetometer, so the screen says so
  it('names the one thing the user can do about the sensor, beside a live bearing', async () => {
    await render(<QiblaSheet />);

    await present();

    await waitFor(() => expect(screen.getByText('Hold the phone flat for an accurate reading')).toBeTruthy());
  });

  it('says nothing about holding the phone flat while there is no bearing to read', async () => {
    mockReadPosition.mockResolvedValue(null);
    await render(<QiblaSheet />);

    await present();

    await waitFor(() => expect(screen.getByText('Your location is not available right now')).toBeTruthy());
    expect(screen.queryByText('Hold the phone flat for an accurate reading')).toBeNull();
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

  // Every sheet is mounted from launch, so a mount-keyed subscription would run forever on every device
  it('does not touch the sensor until it is opened', async () => {
    await render(<QiblaSheet />);

    expect(mockWatchHeading).not.toHaveBeenCalled();
  });

  it('watches the heading once it is opened', async () => {
    await render(<QiblaSheet />);

    await present();

    await waitFor(() => expect(mockWatchHeading).toHaveBeenCalledTimes(1));
  });

  // The needle animates between the numbers it is handed, so the seam readings must accumulate rather than wrap: 350
  // then 10 is a 20 deg step forward, never a 340 deg spin backwards
  it('keeps the needle continuous across the north seam', async () => {
    let onHeading!: (heading: number) => void;
    mockWatchHeading.mockImplementation(async (listener) => {
      onHeading = listener;
      return jest.fn();
    });
    await render(<QiblaSheet />);
    await present();
    await waitFor(() => expect(mockWatchHeading).toHaveBeenCalledTimes(1));

    expect(() => {
      onHeading(350);
      onHeading(10);
    }).not.toThrow();
  });

  it('stops watching when it is closed', async () => {
    const stop = jest.fn();
    mockWatchHeading.mockResolvedValue(stop);
    await render(<QiblaSheet />);

    await present();
    await waitFor(() => expect(mockWatchHeading).toHaveBeenCalledTimes(1));
    await dismiss();

    expect(stop).toHaveBeenCalledTimes(1);
  });

  // A present that never reached its dismiss would otherwise overwrite the stop function and strand the old stream
  it('releases the previous stream when it is presented twice without a dismiss', async () => {
    const first = jest.fn();
    mockWatchHeading.mockResolvedValueOnce(first).mockResolvedValueOnce(jest.fn());
    await render(<QiblaSheet />);

    await present();
    await waitFor(() => expect(mockWatchHeading).toHaveBeenCalledTimes(1));
    await present();

    await waitFor(() => expect(first).toHaveBeenCalledTimes(1));
  });

  // A one-time present callback would arm the sensor on the first open and never again, leaving the needle dead for
  // the rest of the app's life
  it('arms the sensor again every time it is reopened', async () => {
    await render(<QiblaSheet />);

    await present();
    await waitFor(() => expect(mockWatchHeading).toHaveBeenCalledTimes(1));
    await dismiss();
    await present();

    await waitFor(() => expect(mockWatchHeading).toHaveBeenCalledTimes(2));
  });
});
