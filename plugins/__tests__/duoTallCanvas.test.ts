/**
 * The prebuild pin that locks the Duo's tall presentation: every window answers the portrait
 * pair through the AppDelegate gate on the classic life cycle and through the carrier root view
 * controller on the scene life cycle, while the plist scopes the full-screen key to iPhone and
 * declares all four iPad orientations for the keyless build's validation (plugins/duoTallCanvas.js)
 */

const { readFileSync } = require('node:fs');

const { editAppDelegate, editSceneDelegate, editFullScreenKeys } = require('../duoTallCanvas') as {
  editAppDelegate: (contents: string) => string;
  editSceneDelegate: (contents: string) => string;
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
const SCENE_MARKER = 'class SceneDelegate: ExpoAppSceneDelegate {';

/** The Expo SceneDelegate template abridged to the marker the surgery keys on */
const sceneDelegateFixture = () =>
  [
    'internal import Expo',
    '',
    '@objc(SceneDelegate)',
    SCENE_MARKER,
    '  // Extension point for config plugins',
    '}',
    '',
  ].join('\n');

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

  it('keeps the AppDelegate gate out of ReactNativeDelegate', () => {
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
    expect(edited).toContain('CGSize(width: 500, height: 821)');
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

describe('the scene-path carrier', () => {
  const CARRIER_CLASS = 'class PortraitWindowController: UIViewController {';

  it('overrides the factory root view controller on ReactNativeDelegate', () => {
    const edited = editAppDelegate(appDelegateFixture());

    expect(edited).toContain('override func createRootViewController() -> UIViewController {');
    expect(edited).toContain('PortraitWindowController()');
    expect(edited.indexOf('createRootViewController')).toBeGreaterThan(edited.indexOf(NEXT_CLASS));
    expect(edited.indexOf('createRootViewController')).toBeLessThan(edited.indexOf('override func sourceURL'));
  });

  it('defines the carrier top-level, outside both classes', () => {
    const edited = editAppDelegate(appDelegateFixture());

    const classAt = edited.indexOf(CARRIER_CLASS);
    // Swift has no string literals in this span, so brace depth at the class is nesting depth
    const depth = edited
      .slice(0, classAt)
      .split('')
      .reduce((a, c) => a + (c === '{' ? 1 : c === '}' ? -1 : 0), 0);
    expect(depth).toBe(0);
    expect(classAt).toBeGreaterThan(edited.indexOf(GATE_MASK));
    expect(classAt).toBeLessThan(edited.indexOf(NEXT_CLASS));
  });

  it('answers the portrait pair inside the carrier, never all', () => {
    const edited = editAppDelegate(appDelegateFixture());

    const carrier = edited.slice(edited.indexOf(CARRIER_CLASS), edited.indexOf(NEXT_CLASS));
    expect(carrier).toContain('supportedInterfaceOrientations');
    expect(carrier).toContain('[.portrait, .portraitUpsideDown]');
    expect(carrier).not.toContain('.all');
  });

  it('is idempotent over both insertions', () => {
    const once = editAppDelegate(appDelegateFixture());

    expect(editAppDelegate(once)).toBe(once);
  });

  it('does not duplicate anything onto a warm tree that already carries the carrier alone', () => {
    const warm = appDelegateFixture().replace(
      'internal import Expo',
      `internal import Expo

class PortraitWindowController: UIViewController {
  override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
    [.portrait, .portraitUpsideDown]
  }
}`
    );

    expect(editAppDelegate(warm)).toBe(warm);
  });
});

describe('the scene geometry re-request', () => {
  it('imports UIKit beside the internal Expo import', () => {
    const edited = editSceneDelegate(sceneDelegateFixture());

    expect(edited).toContain('import UIKit');
    expect(edited.indexOf('import UIKit')).toBeGreaterThan(edited.indexOf('internal import Expo'));
  });

  it('rides the windowScene selector UIKit actually calls, with the previous values', () => {
    const edited = editSceneDelegate(sceneDelegateFixture());

    expect(edited).toContain('@objc public func windowScene(');
    expect(edited).toContain('didUpdateCoordinateSpace previousCoordinateSpace:');
    expect(edited).toContain('interfaceOrientation previousInterfaceOrientation:');
    expect(edited).not.toContain('func scene(');
  });

  it('re-requests portrait geometry when the scene lays out wide', () => {
    const edited = editSceneDelegate(sceneDelegateFixture());

    expect(edited).toContain(
      'windowScene.interfaceOrientation.isLandscape || previousInterfaceOrientation.isLandscape'
    );
    expect(edited).toContain('requestGeometryUpdate(.iOS(interfaceOrientations: [.portrait, .portraitUpsideDown]))');
    expect(edited.indexOf('requestGeometryUpdate')).toBeGreaterThan(edited.indexOf(SCENE_MARKER));
  });

  it('is idempotent', () => {
    const once = editSceneDelegate(sceneDelegateFixture());

    expect(editSceneDelegate(once)).toBe(once);
  });

  it('throws when the template no longer carries the scene marker', () => {
    expect(() => editSceneDelegate(sceneDelegateFixture().replace(SCENE_MARKER, 'class Other: NSObject {'))).toThrow();
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
