/**
 * The JS binding of the native refresh chain (modules/widgetrefresh).
 *
 * The stores suites mock this module away, so its own coverage lives here:
 * the binding must reach the native module when the resolution provides one
 * and stay a silent no-op otherwise (iOS, or a build whose config stripped
 * the widget plugin).
 */

describe('modules/widgetrefresh binding', () => {
  it('calls the native arm once per call, caching the module lookup', () => {
    const nativeArm = jest.fn();
    jest.isolateModules(() => {
      jest.doMock('expo', () => ({
        requireOptionalNativeModule: (name: string) =>
          name === 'ExpoWidgetRefresh' ? { armWidgetRefreshChain: nativeArm } : null,
      }));
      const { armWidgetRefreshChain } = require('../index') as typeof import('../index');
      armWidgetRefreshChain();
      armWidgetRefreshChain();
    });
    expect(nativeArm).toHaveBeenCalledTimes(2);
  });

  it('no-ops when the native module is absent', () => {
    jest.isolateModules(() => {
      jest.doMock('expo', () => ({}));
      const { armWidgetRefreshChain, setLockCard } = require('../index') as typeof import('../index');
      expect(() => armWidgetRefreshChain()).not.toThrow();
      expect(() => setLockCard(true, '{}')).not.toThrow();
    });
  });

  it('passes the lock card setting and snapshot straight through to native', () => {
    const nativeSetLockCard = jest.fn();
    jest.isolateModules(() => {
      jest.doMock('expo', () => ({
        requireOptionalNativeModule: () => ({ setLockCard: nativeSetLockCard }),
      }));
      const { setLockCard } = require('../index') as typeof import('../index');
      setLockCard(true, '{"days":[]}');
      setLockCard(false, null);
    });
    expect(nativeSetLockCard).toHaveBeenNthCalledWith(1, true, '{"days":[]}');
    expect(nativeSetLockCard).toHaveBeenNthCalledWith(2, false, null);
  });
});
