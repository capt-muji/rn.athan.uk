/**
 * The JS binding of the native switch-cover module (modules/switchcover): the cover is shown and
 * hidden through the native side when the build carries it, and every export is inert when it
 * does not, which is every iOS build and every Jest suite
 */

import type * as Binding from '../switchCover';

/** The native side, recording what the binding asks of it */
const nativeSide = () => {
  const show = jest.fn(async () => {});
  const hide = jest.fn(async () => {});

  return { native: { show, hide }, show, hide };
};

/** One cover's face, in the loader's own values */
const coverOptions = (): Binding.SwitchCoverOptions => ({
  backgroundColor: '#2c1c77',
  spinnerColor: '#8d73ff',
  spinnerSizeDp: 20,
  lineText: 'جارٍ ضبط اللغة العربية',
  lineColor: '#ffffff',
  lineSizeDp: 18,
  lineMarginTopDp: 40,
  lineMaxWidthDp: 260,
});

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

  return require('../switchCover') as typeof Binding;
};

/** The binding on a build whose native side is the given one, or none */
const bindingOver = (native: object | null): typeof Binding => {
  requireOptionalNativeModule.mockReset();
  requireOptionalNativeModule.mockImplementation((name: string) => (name === 'SwitchCover' ? native : null));

  return loadBinding({ requireOptionalNativeModule });
};

describe('finding the native module', () => {
  it('asks expo for the module by its own name', () => {
    bindingOver(nativeSide().native).showSwitchCover(coverOptions());

    expect(requireOptionalNativeModule).toHaveBeenCalledWith('SwitchCover');
  });

  it('looks the module up once, however often it is shown and hidden', async () => {
    const binding = bindingOver(nativeSide().native);

    await binding.showSwitchCover(coverOptions());
    await binding.hideSwitchCover();
    await binding.showSwitchCover(coverOptions());

    expect(requireOptionalNativeModule).toHaveBeenCalledTimes(1);
  });

  it('keeps an absent module absent, rather than asking again on every call', async () => {
    const binding = bindingOver(null);

    await binding.showSwitchCover(coverOptions());
    await binding.hideSwitchCover();

    expect(requireOptionalNativeModule).toHaveBeenCalledTimes(1);
  });
});

describe('showing the cover', () => {
  it('hands the cover options to the native side untouched', async () => {
    const side = nativeSide();
    const options = coverOptions();

    await bindingOver(side.native).showSwitchCover(options);

    expect(side.show).toHaveBeenCalledTimes(1);
    expect(side.show).toHaveBeenCalledWith(options);
    // The emitter reads its own receiver, so a method lifted off the native side would pass here and fail on a phone
    expect(side.show.mock.contexts[0]).toBe(side.native);
  });

  it('resolves having shown nothing on a build whose native side is missing', async () => {
    await expect(bindingOver(null).showSwitchCover(coverOptions())).resolves.toBeUndefined();
  });

  it('resolves having shown nothing under an expo too old to look an optional module up', async () => {
    await expect(loadBinding({}).showSwitchCover(coverOptions())).resolves.toBeUndefined();
  });
});

describe('hiding the cover', () => {
  it('asks the native side to hide the cover', async () => {
    const side = nativeSide();

    await bindingOver(side.native).hideSwitchCover();

    expect(side.hide).toHaveBeenCalledTimes(1);
    expect(side.hide.mock.contexts[0]).toBe(side.native);
  });

  it('resolves having hidden nothing on a build whose native side is missing', async () => {
    await expect(bindingOver(null).hideSwitchCover()).resolves.toBeUndefined();
  });
});
