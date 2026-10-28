const { withAppDelegate, withFinalizedMod } = require('expo/config-plugins');
const { default: plist } = require('@expo/plist');
const { readFile, writeFile } = require('node:fs/promises');
const path = require('node:path');

// The inner display presents per pose and ignores any app orientation answer (Tech Talks 111461),
// granting the full canvas only for a pose the plist declares (row 271 measured landscape spanning
// the wide hold under a four-orientation plist). Declaring the portrait pair alone is therefore the
// tall presentation's opt-in and the wide hold's lock: held tall the portrait window spans edge to
// edge, held wide the system keeps its centered letterbox. Everywhere else two carriers hold the
// portrait pair for every window: the delegate gate below for the classic life cycle, and the
// root view controller the scene life cycle actually reads. iPadOS 27 overrides both carriers
// and lays the iPad window wide through device rotation (T-401's measured finding), so the
// wide-iPad posture is an open owner ruling, not a solved surface.
const GATE_MASK = 'return [.portrait, .portraitUpsideDown]';
const PIN_FLAG = 'macWindowPinned';
const CARRIER_CLASS_NAME = 'PortraitWindowController';

// The gate answers the portrait pair for every window; the pin freezes the Mac window at the
// layout's own content cap so the desktop app reads as a phone: no tall or sideways resize,
// no full screen. TN3192's sizeRestrictions are the sanctioned replacement for the deprecated
// full-screen key both Mac defects traced to.
const APPDELEGATE_BLOCK = `  private var ${PIN_FLAG} = false

  public override func applicationDidBecomeActive(_ application: UIApplication) {
    super.applicationDidBecomeActive(application)
    guard !${PIN_FLAG}, ProcessInfo.processInfo.isiOSAppOnMac, let scene = window?.windowScene else { return }
    // 500 is SIZE.contentMaxWidth, the tablet cap the centered column already honors
    let phone = CGSize(width: 500, height: 821)
    scene.sizeRestrictions?.minimumSize = phone
    scene.sizeRestrictions?.maximumSize = phone
    scene.sizeRestrictions?.allowsFullScreen = false
    window?.frame = CGRect(origin: window?.frame.origin ?? .zero, size: phone)
    ${PIN_FLAG} = true
  }

  public override func application(
    _ application: UIApplication,
    supportedInterfaceOrientationsFor window: UIWindow?
  ) -> UIInterfaceOrientationMask {
    ${GATE_MASK}
  }
`;

const CLASS_CLOSE = `}

${'class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {'}`;

const NEXT_CLASS = 'class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {';

const SCENE_MARKER = `@objc(SceneDelegate)
class SceneDelegate: ExpoAppSceneDelegate {
  // Extension point for config plugins.
}`;

// iPadOS 27 resolves windowing orientation itself and overrides the root view controller's
// portrait answer at runtime (T-401: the pair read back as the landscape mask under rotation,
// and the geometry re-request below measured ignored against a rotated scene). The request
// stays pending the owner's open ruling; no measured surface honors it, and it does not hold
// the iPad's posture.
const SCENE_BLOCK = `@objc(SceneDelegate)
class SceneDelegate: ExpoAppSceneDelegate {
  // Extension point for config plugins.

  // The conformance is inherited from ExpoAppSceneDelegate, so Swift gives this method no
  // implicit @objc and UIKit's respondsToSelector read it absent until the attribute was
  // added by hand (T-401, measured on the rig). The selector itself is API_DEPRECATED
  // since iOS 26 (successor windowScene:didUpdateEffectiveGeometry:); it still measured
  // firing on the iPadOS 27 rig, but once Apple stops calling it this half goes silent -
  // the same silent no-op shape T-401 hunted.
  @objc public func windowScene(
    _ windowScene: UIWindowScene,
    didUpdateCoordinateSpace previousCoordinateSpace: UICoordinateSpace,
    interfaceOrientation previousInterfaceOrientation: UIInterfaceOrientation,
    traitCollection previousTraitCollection: UITraitCollection
  ) {
    guard
      windowScene.interfaceOrientation.isLandscape || previousInterfaceOrientation.isLandscape
    else { return }
    windowScene.requestGeometryUpdate(.iOS(interfaceOrientations: [.portrait, .portraitUpsideDown]))
  }
}`;

const editSceneDelegate = (contents) => {
  if (contents.includes('requestGeometryUpdate')) {
    if (contents.includes('API_DEPRECATED')) return contents;
    throw new Error("duoTallCanvas: the SceneDelegate carries a previous release's scene block; run prebuild --clean");
  }
  if (!contents.includes(SCENE_MARKER)) {
    throw new Error('duoTallCanvas: the SceneDelegate marker moved; read the new template');
  }
  return contents
    .replace('internal import Expo', 'internal import Expo\nimport UIKit')
    .replace(SCENE_MARKER, SCENE_BLOCK);
};

// The scene life cycle resolves the window's orientation from the root view controller, never
// from the AppDelegate gate, so the stock factory controller's all-answer is what laid iPad
// windows wide (T-401: the scene rotated landscapeRight under a portrait-only gate).
const CARRIER_CLASS = `class ${CARRIER_CLASS_NAME}: UIViewController {
  override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
    [.portrait, .portraitUpsideDown]
  }
}

`;

const CARRIER_OVERRIDE = `

  override func createRootViewController() -> UIViewController {
    ${CARRIER_CLASS_NAME}()
  }`;

const editAppDelegate = (contents) => {
  if (contents.includes(CARRIER_CLASS_NAME)) return contents;
  if (contents.includes(PIN_FLAG)) {
    throw new Error(
      "duoTallCanvas: the AppDelegate carries a previous release's pin without the carrier; run prebuild --clean"
    );
  }
  if (contents.includes(GATE_MASK)) {
    throw new Error(
      'duoTallCanvas: the AppDelegate carries the old gate without the Mac window pin; run prebuild --clean'
    );
  }
  if (!contents.includes(CLASS_CLOSE)) {
    throw new Error('duoTallCanvas: the AppDelegate class-close marker moved; read the new template');
  }
  // The class-close replacement rewrites the same span the delegate anchor lives in, so the
  // override insertion must run second or the class-close marker stops matching.
  const withGate = contents.replace(CLASS_CLOSE, `\n${APPDELEGATE_BLOCK}\n${CLASS_CLOSE}`);
  return withGate.replace(NEXT_CLASS, `${CARRIER_CLASS}${NEXT_CLASS}${CARRIER_OVERRIDE}`);
};

const IPAD_ALL_FOUR = [
  'UIInterfaceOrientationPortrait',
  'UIInterfaceOrientationPortraitUpsideDown',
  'UIInterfaceOrientationLandscapeLeft',
  'UIInterfaceOrientationLandscapeRight',
];

// TN3192: the unscoped key froze the Designed-for-iPad window on the Mac and is Apple's deprecated
// opt-out, while iPhone-scoped it survives as the iOS 27 discrete-scene-resize request, which is
// the tall canvas's presentation, so the phone fleet answers exactly as before. The iPad array
// carries all four because the keyless build validates only with them declared; the delegate gate
// above, not the plist, keeps every window portrait.
const editFullScreenKeys = (infoPlist) => {
  delete infoPlist.UIRequiresFullScreen;
  infoPlist['UIRequiresFullScreen~iphone'] = true;
  infoPlist['UISupportedInterfaceOrientations~ipad'] = IPAD_ALL_FOUR;
  return infoPlist;
};

// Both file edits ride finalized mods, not dangerous ones: dangerous mods sort FIRST in this
// SDK's mod compiler (before the generated tree exists to read), and the old calls passed
// (name, fn) where the API destructures [platform, action], so the actions were undefined and
// the mods never ran at all - the fossil plist drift traced to exactly that.
const withDuoTallCanvas = (config) =>
  withFinalizedMod(
    withFinalizedMod(
      withAppDelegate(config, (cfg) => {
        cfg.modResults.contents = editAppDelegate(cfg.modResults.contents);
        return cfg;
      }),
      [
        'ios',
        async (cfg) => {
          // prebuild strips non-alphanumerics from the app directory name, so a
          // suffixed build's "Athan BGTest" lives at AthanBGTest on disk. The regex
          // matches prebuild's directory naming for ASCII names; a non-ASCII
          // EXPO_NAME_SUFFIX would also need prebuild's NFKD combining-mark fold,
          // which every fleettest suffix in this repo is ASCII enough to skip
          const delegatePath = path.join(
            cfg.modRequest.platformProjectRoot,
            cfg.name.replace(/[^A-Za-z0-9]/g, ''),
            'SceneDelegate.swift'
          );
          await writeFile(delegatePath, editSceneDelegate(await readFile(delegatePath, 'utf8')));
          return cfg;
        },
      ]
    ),
    [
      'ios',
      async (cfg) => {
        const plistPath = path.join(
          cfg.modRequest.platformProjectRoot,
          cfg.name.replace(/[^A-Za-z0-9]/g, ''),
          'Info.plist'
        );
        const infoPlist = plist.parse(await readFile(plistPath, 'utf8'));
        await writeFile(plistPath, plist.build(editFullScreenKeys(infoPlist)));
        return cfg;
      },
    ]
  );

module.exports = withDuoTallCanvas;
module.exports.editAppDelegate = editAppDelegate;
module.exports.editSceneDelegate = editSceneDelegate;
module.exports.editFullScreenKeys = editFullScreenKeys;
