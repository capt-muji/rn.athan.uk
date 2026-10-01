/**
 * The component that arms the fused sensor: what it reports, and that it reports it on the JS thread
 */

import { act, render } from '@testing-library/react-native';

import QiblaHeadingSource from '../QiblaHeadingSource';

const mockSensor = { value: { yaw: 0 } };

jest.mock('@/device/qiblaSensor', () => ({
  useOrientationSensor: jest.fn(() => ({ sensor: mockSensor, unregister: jest.fn(), isAvailable: true })),
}));

const { useOrientationSensor } = jest.requireMock('@/device/qiblaSensor');

// The config sets clearMocks, which strips this mock's implementation between tests and leaves the component
// destructuring `undefined` on its first line, so it is restored rather than just cleared
beforeEach(() => {
  useOrientationSensor.mockReturnValue({ sensor: mockSensor, unregister: jest.fn(), isAvailable: true });
  mockSensor.value = { yaw: 0 };
});

/** Awaiting the render is what lets a second one in the same file run its effects, as every sheet suite here does */
const arm = async (declination: number, onHeading: (heading: number) => void) => {
  const result = await render(<QiblaHeadingSource declination={declination} onHeading={onHeading} />);
  await act(async () => {});

  return result;
};

describe('arming the sensor', () => {
  // Every sheet in this app mounts at launch, so a hook on the screen would run the gyroscope for the life of the
  // process: this component exists to tie the sensor's life to the compass being on screen
  it('arms the fused sensor while it is mounted', async () => {
    await arm(0, jest.fn());

    expect(useOrientationSensor).toHaveBeenCalled();
  });

  it('draws nothing of its own', async () => {
    const { toJSON } = await arm(0, jest.fn());

    expect(toJSON()).toBeNull();
  });
});

describe('the heading it reports', () => {
  it('converts the sensor yaw into a compass bearing rather than passing the raw value on', async () => {
    const onHeading = jest.fn();
    mockSensor.value = { yaw: -Math.PI / 2 };

    await arm(0, onHeading);

    expect(onHeading).toHaveBeenCalledWith(90);
  });

  it('carries the declination into the reading, which is what takes Android to true north', async () => {
    const onHeading = jest.fn();
    mockSensor.value = { yaw: -Math.PI / 2 };

    await arm(2, onHeading);

    expect(onHeading).toHaveBeenCalledWith(92);
  });

  // The dial would spin backwards without the negation: a sensor yaw runs anticlockwise, a compass bearing clockwise
  it('turns an anticlockwise yaw into a clockwise bearing', async () => {
    const onHeading = jest.fn();
    mockSensor.value = { yaw: Math.PI / 2 };

    await arm(0, onHeading);

    expect(onHeading).toHaveBeenCalledWith(270);
  });

  it('reports a bearing inside the circle, whatever the sensor says', async () => {
    const onHeading = jest.fn();
    mockSensor.value = { yaw: -12 * Math.PI };

    await arm(0, onHeading);

    const [heading] = onHeading.mock.calls[0];
    expect(heading).toBeGreaterThanOrEqual(0);
    expect(heading).toBeLessThan(360);
  });
});
