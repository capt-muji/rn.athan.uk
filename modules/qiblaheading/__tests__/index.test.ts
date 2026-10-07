/**
 * The JS binding of the native heading module (modules/qiblaheading).
 *
 * The sheet's suite mocks this module away, so its own coverage lives here: each platform's native side must be
 * reached when the phone carries it, and every export must be inert when it does not.
 */

import type * as Binding from '../index';

type Listener = (payload: unknown) => void;

/** One platform's native side, recording what the binding asks of it and holding the listener it subscribes */
const nativeSide = (carries: 'fused' | 'accuracy', available = true) => {
  const listeners = new Map<string, Listener>();
  const remove = jest.fn();
  const addListener = jest.fn((event: string, listener: Listener) => {
    listeners.set(event, listener);

    return { remove };
  });
  const isAvailable = jest.fn(() => available);
  const start = jest.fn(async () => true);
  const stop = jest.fn(async () => {});
  const native =
    carries === 'fused'
      ? {
          addListener,
          isFusedOrientationAvailable: isAvailable,
          startFusedOrientation: start,
          stopFusedOrientation: stop,
        }
      : {
          addListener,
          isHeadingAccuracyAvailable: isAvailable,
          startHeadingAccuracy: start,
          stopHeadingAccuracy: stop,
        };

  return { native, listeners, remove, addListener, start, stop };
};

const requireOptionalNativeModule = jest.fn();

/**
 * Loads a fresh copy of the binding against the given expo.
 *
 * The binding looks its native module up once and keeps it, so each test needs its own copy: the registry is reset
 * rather than isolated, because the lookup is lazy and runs after an isolated block would have closed.
 */
const loadBinding = (expo: object): typeof Binding => {
  jest.resetModules();
  jest.doMock('expo', () => expo);

  return require('../index') as typeof Binding;
};

/** The binding on a phone whose build carries the given native module, or none */
const bindingOver = (native: object | null): typeof Binding => {
  requireOptionalNativeModule.mockReset();
  requireOptionalNativeModule.mockImplementation((name: string) => (name === 'ExpoQiblaHeading' ? native : null));

  return loadBinding({ requireOptionalNativeModule });
};

describe('finding the native module', () => {
  it('asks expo for the module by its own name', () => {
    bindingOver(nativeSide('fused').native).hasFusedHeading();

    expect(requireOptionalNativeModule).toHaveBeenCalledWith('ExpoQiblaHeading');
  });

  it('looks the module up once, however often it is used', () => {
    const binding = bindingOver(nativeSide('fused').native);

    binding.hasFusedHeading();
    binding.hasFusedHeading();
    binding.watchFusedHeading(jest.fn())();

    expect(requireOptionalNativeModule).toHaveBeenCalledTimes(1);
  });

  it('keeps an absent module absent, rather than asking again on every call', () => {
    const binding = bindingOver(null);

    binding.hasFusedHeading();
    binding.hasFusedHeading();

    expect(requireOptionalNativeModule).toHaveBeenCalledTimes(1);
  });
});

describe('whether the phone carries Google’s fused sensor', () => {
  it('says yes on an Android phone whose native side reports it', () => {
    expect(bindingOver(nativeSide('fused').native).hasFusedHeading()).toBe(true);
  });

  // No Play services, or one of the three sensors Google fuses is missing
  it('says no on an Android phone whose native side reports it cannot', () => {
    expect(bindingOver(nativeSide('fused', false).native).hasFusedHeading()).toBe(false);
  });

  it('says no on an iPhone, whose native side has no such sensor to ask about', () => {
    expect(bindingOver(nativeSide('accuracy').native).hasFusedHeading()).toBe(false);
  });

  it('says no on a build whose native side is missing', () => {
    expect(bindingOver(null).hasFusedHeading()).toBe(false);
  });

  it('says no under an expo too old to look an optional module up', () => {
    expect(loadBinding({}).hasFusedHeading()).toBe(false);
  });
});

describe('watching Google’s fused sensor', () => {
  it('subscribes to the fused samples and starts the sensor', () => {
    const side = nativeSide('fused');

    bindingOver(side.native).watchFusedHeading(jest.fn());

    expect(side.addListener).toHaveBeenCalledTimes(1);
    expect(side.addListener).toHaveBeenCalledWith('onFusedOrientation', expect.any(Function));
    expect(side.start).toHaveBeenCalledTimes(1);
  });

  // Started first, the sensor's opening sample would arrive with nothing listening
  it('subscribes before it starts the sensor, so the first sample has somewhere to land', () => {
    const side = nativeSide('fused');

    bindingOver(side.native).watchFusedHeading(jest.fn());

    expect(side.addListener.mock.invocationCallOrder[0]).toBeLessThan(side.start.mock.invocationCallOrder[0]);
  });

  // The emitter reads its own receiver, so a listener added through a method lifted off the native side would fail
  // on a phone while passing against a plain function. The start and the stop are called there for the same care
  it('calls each of the native side\u2019s methods on the native side itself', () => {
    const side = nativeSide('fused');

    bindingOver(side.native).watchFusedHeading(jest.fn())();

    expect(side.addListener.mock.contexts[0]).toBe(side.native);
    expect(side.start.mock.contexts[0]).toBe(side.native);
    expect(side.stop.mock.contexts[0]).toBe(side.native);
  });

  it('passes each sample on as the sensor gave it, heading and attitude alike', () => {
    const side = nativeSide('fused');
    const onReading = jest.fn();
    bindingOver(side.native).watchFusedHeading(onReading);

    const sample = { headingDegrees: 118.99, attitude: [0, 0, 0.5, 0.866] };
    side.listeners.get('onFusedOrientation')?.(sample);

    expect(onReading).toHaveBeenCalledTimes(1);
    expect(onReading).toHaveBeenCalledWith(sample);
  });

  it('removes the subscription and stops the sensor when its returned function is called', () => {
    const side = nativeSide('fused');
    const stopWatching = bindingOver(side.native).watchFusedHeading(jest.fn());

    expect(side.remove).not.toHaveBeenCalled();
    expect(side.stop).not.toHaveBeenCalled();
    stopWatching();

    expect(side.remove).toHaveBeenCalledTimes(1);
    expect(side.stop).toHaveBeenCalledTimes(1);
  });

  // The native stop ends whichever watch is running, so a second call would end one a later open had started
  it('stops once, however often its returned function is called', () => {
    const side = nativeSide('fused');
    const stopWatching = bindingOver(side.native).watchFusedHeading(jest.fn());

    stopWatching();
    stopWatching();

    expect(side.remove).toHaveBeenCalledTimes(1);
    expect(side.stop).toHaveBeenCalledTimes(1);
  });

  it('arms nothing on an Android phone that cannot run the sensor', () => {
    const side = nativeSide('fused', false);

    const stopWatching = bindingOver(side.native).watchFusedHeading(jest.fn());
    stopWatching();

    expect(side.addListener).not.toHaveBeenCalled();
    expect(side.start).not.toHaveBeenCalled();
    expect(side.stop).not.toHaveBeenCalled();
  });

  it('arms nothing on an iPhone', () => {
    const side = nativeSide('accuracy');

    const stopWatching = bindingOver(side.native).watchFusedHeading(jest.fn());
    stopWatching();

    expect(side.addListener).not.toHaveBeenCalled();
    expect(side.start).not.toHaveBeenCalled();
  });

  it('does nothing on a build whose native side is missing', () => {
    expect(() => bindingOver(null).watchFusedHeading(jest.fn())()).not.toThrow();
  });
});

describe('watching the iPhone’s own heading accuracy', () => {
  it('subscribes to the accuracy readings and starts them', () => {
    const side = nativeSide('accuracy');

    bindingOver(side.native).watchHeadingAccuracy(jest.fn());

    expect(side.addListener).toHaveBeenCalledTimes(1);
    expect(side.addListener).toHaveBeenCalledWith('onHeadingAccuracy', expect.any(Function));
    expect(side.start).toHaveBeenCalledTimes(1);
  });

  it('subscribes before it starts the readings', () => {
    const side = nativeSide('accuracy');

    bindingOver(side.native).watchHeadingAccuracy(jest.fn());

    expect(side.addListener.mock.invocationCallOrder[0]).toBeLessThan(side.start.mock.invocationCallOrder[0]);
  });

  it('calls each of the native side\u2019s methods on the native side itself', () => {
    const side = nativeSide('accuracy');

    bindingOver(side.native).watchHeadingAccuracy(jest.fn())();

    expect(side.addListener.mock.contexts[0]).toBe(side.native);
    expect(side.start.mock.contexts[0]).toBe(side.native);
    expect(side.stop.mock.contexts[0]).toBe(side.native);
  });

  // Apple's reading carries the heading too, which the sheet already has from elsewhere
  it('passes on the accuracy in degrees and nothing else the reading carried', () => {
    const side = nativeSide('accuracy');
    const onReading = jest.fn();
    bindingOver(side.native).watchHeadingAccuracy(onReading);

    side.listeners.get('onHeadingAccuracy')?.({
      trueHeading: 118.99,
      magneticHeading: 118.2,
      accuracyDegrees: 12.5,
      wantsCalibration: false,
    });

    expect(onReading).toHaveBeenCalledTimes(1);
    expect(onReading).toHaveBeenCalledWith(12.5);
  });

  // Apple's sentinel for a heading it considers invalid, which the gate must be able to see
  it('passes a negative accuracy on untouched', () => {
    const side = nativeSide('accuracy');
    const onReading = jest.fn();
    bindingOver(side.native).watchHeadingAccuracy(onReading);

    side.listeners.get('onHeadingAccuracy')?.({ accuracyDegrees: -1 });

    expect(onReading).toHaveBeenCalledWith(-1);
  });

  it('removes the subscription and stops the readings when its returned function is called', () => {
    const side = nativeSide('accuracy');
    const stopWatching = bindingOver(side.native).watchHeadingAccuracy(jest.fn());

    expect(side.remove).not.toHaveBeenCalled();
    expect(side.stop).not.toHaveBeenCalled();
    stopWatching();

    expect(side.remove).toHaveBeenCalledTimes(1);
    expect(side.stop).toHaveBeenCalledTimes(1);
  });

  it('stops once, however often its returned function is called', () => {
    const side = nativeSide('accuracy');
    const stopWatching = bindingOver(side.native).watchHeadingAccuracy(jest.fn());

    stopWatching();
    stopWatching();

    expect(side.remove).toHaveBeenCalledTimes(1);
    expect(side.stop).toHaveBeenCalledTimes(1);
  });

  it('arms nothing on an iPhone that cannot report a heading', () => {
    const side = nativeSide('accuracy', false);

    const stopWatching = bindingOver(side.native).watchHeadingAccuracy(jest.fn());
    stopWatching();

    expect(side.addListener).not.toHaveBeenCalled();
    expect(side.start).not.toHaveBeenCalled();
    expect(side.stop).not.toHaveBeenCalled();
  });

  it('arms nothing on an Android phone', () => {
    const side = nativeSide('fused');

    const stopWatching = bindingOver(side.native).watchHeadingAccuracy(jest.fn());
    stopWatching();

    expect(side.addListener).not.toHaveBeenCalled();
    expect(side.start).not.toHaveBeenCalled();
  });

  it('does nothing on a build whose native side is missing', () => {
    expect(() => bindingOver(null).watchHeadingAccuracy(jest.fn())()).not.toThrow();
  });
});
