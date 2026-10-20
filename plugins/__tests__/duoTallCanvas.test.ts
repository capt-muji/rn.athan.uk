/**
 * The prebuild pin that locks the Duo's tall presentation: the portrait pair declared on every
 * surface and answered for every window, so the inner display's per-pose presentation never
 * includes a wide layout (plugins/duoTallCanvas.js)
 */

const { readFileSync } = require('node:fs');

const { editAppDelegate, editInfoPlist } = require('../duoTallCanvas') as {
  editAppDelegate: (contents: string) => string;
  editInfoPlist: (plist: Record<string, unknown>) => Record<string, unknown>;
};

// Literals of the repo's own template shape, not the plugin's exports: comparing the surgery
// against its own words would prove nothing
const PORTRAIT_PAIR = ['UIInterfaceOrientationPortrait', 'UIInterfaceOrientationPortraitUpsideDown'];
const GATE_MASK = 'return [.portrait, .portraitUpsideDown]';
const GATE_SELECTOR = 'supportedInterfaceOrientationsFor window: UIWindow?';
const NEXT_CLASS = 'class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {';

/** The AppDelegate prebuild product's shape, read from the Expo template this repo prebuilds */
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

describe('the Info.plist portrait pin', () => {
  it('pins both orientation arrays to the portrait pair and keeps the full-screen key', () => {
    const edited = editInfoPlist({
      UISupportedInterfaceOrientations: [
        'UIInterfaceOrientationPortrait',
        'UIInterfaceOrientationLandscapeLeft',
        'UIInterfaceOrientationLandscapeRight',
      ],
      'UISupportedInterfaceOrientations~ipad': ['UIInterfaceOrientationLandscapeLeft'],
      UIRequiresFullScreen: false,
    });

    expect(edited.UISupportedInterfaceOrientations).toEqual(PORTRAIT_PAIR);
    expect(edited['UISupportedInterfaceOrientations~ipad']).toEqual(PORTRAIT_PAIR);
    expect(edited.UIRequiresFullScreen).toBe(true);
  });

  it('never declares a landscape value', () => {
    const edited = editInfoPlist({});

    expect(JSON.stringify(edited)).not.toContain('Landscape');
  });
});

describe('the app.json wiring', () => {
  it('seats the plugin directly after portraitOnlyIpad', () => {
    const plugins = JSON.parse(readFileSync('app.json', 'utf8')).expo.plugins as unknown[];

    const names = plugins.map((plugin) => (Array.isArray(plugin) ? plugin[0] : plugin));
    expect(names.indexOf('./plugins/duoTallCanvas')).toBe(names.indexOf('./plugins/portraitOnlyIpad') + 1);
  });
});
