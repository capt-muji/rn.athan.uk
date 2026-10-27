/**
 * The prebuild pin that locks the Duo's tall presentation: every window answers the portrait
 * pair through the AppDelegate gate, while the plist scopes the full-screen key to iPhone and
 * declares all four iPad orientations for the keyless build's validation (plugins/duoTallCanvas.js)
 */

const { readFileSync } = require('node:fs');

const { editAppDelegate, editFullScreenKeys } = require('../duoTallCanvas') as {
  editAppDelegate: (contents: string) => string;
  editFullScreenKeys: (plist: Record<string, unknown>) => Record<string, unknown>;
};

// Literals of the repo's own template shape, not the plugin's exports: comparing the surgery
// against its own words would prove nothing
const PORTRAIT_PAIR = ['UIInterfaceOrientationPortrait', 'UIInterfaceOrientationPortraitUpsideDown'];
const IPAD_ALL_FOUR = [
  'UIInterfaceOrientationPortrait',
  'UIInterfaceOrientationPortraitUpsideDown',
  'UIInterfaceOrientationLandscapeLeft',
  'UIInterfaceOrientationLandscapeRight',
];
const GATE_MASK = 'return [.portrait, .portraitUpsideDown]';
const GATE_SELECTOR = 'supportedInterfaceOrientationsFor window: UIWindow?';
const NEXT_CLASS = 'class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {';

/** The Expo AppDelegate template abridged to the markers the surgery keys on; the real product
 * also carries the factory vars and a launch body, which the markers alone never touch */
const appDelegateFixture = (extra = '') =>
  [
    'internal import Expo',
    'import React',
    'import ReactAppDependencyProvider',
    '',
    '@main',
    'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {',
    '  var window: UIWindow?',
    '',
    '  public override func application(',
    '    _ application: UIApplication,',
    '    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil',
    '  ) -> Bool {',
    '    return super.application(application, didFinishLaunchingWithOptions: launchOptions)',
    '  }',
    extra,
    '}',
    '',
    NEXT_CLASS,
    '  // Extension point for config-plugins',
    '',
    '  override func sourceURL(for bridge: RCTBridge) -> URL? {',
    '    bridge.bundleURL ?? bundleURL()',
    '  }',
    '}',
    '',
  ].join('\n');

describe('the AppDelegate portrait gate', () => {
  it('inserts the gate inside class AppDelegate', () => {
    const edited = editAppDelegate(appDelegateFixture());

    expect(edited).toContain(GATE_SELECTOR);
    expect(edited).toContain(GATE_MASK);
    expect(edited.indexOf(GATE_MASK)).toBeLessThan(edited.indexOf(NEXT_CLASS));
    expect(edited.indexOf(GATE_MASK)).toBeGreaterThan(edited.indexOf('class AppDelegate:'));
  });

  it('leaves ReactNativeDelegate untouched', () => {
    const edited = editAppDelegate(appDelegateFixture());

    expect(edited).toContain('override func sourceURL(for bridge: RCTBridge) -> URL? {');
    expect(edited.match(new RegExp(GATE_SELECTOR.replace(/[()]/g, '\\$&'), 'g'))).toHaveLength(1);
  });

  it('is idempotent', () => {
    const once = editAppDelegate(appDelegateFixture());

    expect(editAppDelegate(once)).toBe(once);
  });

  it('pins the Mac window at the content cap with no resize and no full screen', () => {
    const edited = editAppDelegate(appDelegateFixture());

    expect(edited).toContain('applicationDidBecomeActive');
    expect(edited).toContain('ProcessInfo.processInfo.isiOSAppOnMac');
    expect(edited).toContain('CGSize(width: 500, height: 932)');
    expect(edited).toContain('minimumSize = phone');
    expect(edited).toContain('maximumSize = phone');
    expect(edited).toContain('allowsFullScreen = false');
    expect(edited.indexOf('macWindowPinned')).toBeGreaterThan(edited.indexOf('class AppDelegate:'));
  });

  it('throws on a warm AppDelegate that carries the old gate without the pin', () => {
    const warm = appDelegateFixture().replace(
      NEXT_CLASS,
      `  public override func application(
    _ application: UIApplication,
    supportedInterfaceOrientationsFor window: UIWindow?
  ) -> UIInterfaceOrientationMask {
    ${GATE_MASK}
  }
}

${NEXT_CLASS}`
    );

    expect(() => editAppDelegate(warm)).toThrow();
  });

  it('throws when the template no longer carries the class-close marker', () => {
    const drifted = appDelegateFixture().replace(`}\n\n${NEXT_CLASS}`, '}\n\nstruct SomethingElse {');

    expect(() => editAppDelegate(drifted)).toThrow();
  });

  it('still inserts when a template ships its own orientation override', () => {
    // A template-provided selector must not read as the gate already present: the sentinel keys on
    // the gate's own mask, never on the selector
    const withTemplateOverride = appDelegateFixture(
      [
        '  public override func application(',
        '    _ application: UIApplication,',
        '    supportedInterfaceOrientationsFor window: UIWindow?',
        '  ) -> UIInterfaceOrientationMask {',
        '    return super.application(application, supportedInterfaceOrientationsFor: window)',
        '  }',
      ].join('\n')
    );

    const edited = editAppDelegate(withTemplateOverride);

    expect(edited).toContain(GATE_MASK);
    expect(edited.match(new RegExp(GATE_SELECTOR.replace(/[()]/g, '\\$&'), 'g'))).toHaveLength(2);
  });
});

describe('the full-screen keys', () => {
  it('scopes the discrete-resize request to iPhone and drops the unscoped key', () => {
    const edited = editFullScreenKeys({ UIRequiresFullScreen: true });

    expect(edited.UIRequiresFullScreen).toBeUndefined();
    expect(edited['UIRequiresFullScreen~iphone']).toBe(true);
  });

  it('declares all four iPad orientations, which a keyless build needs to validate', () => {
    const edited = editFullScreenKeys({
      'UISupportedInterfaceOrientations~ipad': ['UIInterfaceOrientationLandscapeLeft'],
    });

    expect(edited['UISupportedInterfaceOrientations~ipad']).toEqual(IPAD_ALL_FOUR);
  });

  it('leaves the phone array alone so the tall presentation keeps its portrait opt-in', () => {
    const edited = editFullScreenKeys({ UISupportedInterfaceOrientations: PORTRAIT_PAIR });

    expect(edited.UISupportedInterfaceOrientations).toEqual(PORTRAIT_PAIR);
    expect(JSON.stringify(edited.UISupportedInterfaceOrientations)).not.toContain('Landscape');
  });
});

describe('the app.json wiring', () => {
  it('carries the plugin with no portraitOnlyIpad beside it', () => {
    const plugins = JSON.parse(readFileSync('app.json', 'utf8')).expo.plugins as unknown[];

    const names = plugins.map((plugin) => (Array.isArray(plugin) ? plugin[0] : plugin));
    expect(names).toContain('./plugins/duoTallCanvas');
    expect(names).not.toContain('./plugins/portraitOnlyIpad');
  });

  it('declares no requireFullScreen, which would re-freeze the Mac and iPad window', () => {
    const ios = JSON.parse(readFileSync('app.json', 'utf8')).expo.ios;

    expect(ios.requireFullScreen).toBeUndefined();
  });
});
