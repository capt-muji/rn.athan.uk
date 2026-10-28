const { withAppDelegate, withDangerousMod } = require('expo/config-plugins');
const { default: plist } = require('@expo/plist');
const { readFile, writeFile } = require('node:fs/promises');
const path = require('node:path');

// The inner display presents per pose and ignores any app orientation answer (Tech Talks 111461),
// granting the full canvas only for a pose the plist declares (row 271 measured landscape spanning
// the wide hold under a four-orientation plist). Declaring the portrait pair alone is therefore the
// tall presentation's opt-in and the wide hold's lock: held tall the portrait window spans edge to
// edge, held wide the system keeps its centered letterbox. Everywhere else two carriers hold the
// portrait pair for every window: the delegate gate below for the classic life cycle, and the
// root view controller the scene life cycle actually reads, so no surface ever lays out wide.
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
  // Extension point for config plugins
}`;

// iPadOS 27 resolves windowing orientation itself and overrides the root view controller's
// portrait answer at runtime (T-401: the pair read back as the landscape mask under rotation),
// so the posture holds only by re-requesting portrait geometry whenever the system lays the
// scene out wide.
const SCENE_BLOCK = `@objc(SceneDelegate)
class SceneDelegate: ExpoAppSceneDelegate {
  // Extension point for config plugins.

  // The conformance is inherited from ExpoAppSceneDelegate, so Swift gives this method no
  // implicit @objc and UIKit's respondsToSelector read it absent until the attribute was
  // added by hand (T-401, measured on the rig).
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
  if (contents.includes('requestGeometryUpdate')) return contents;
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
  if (contents.includes(PIN_FLAG) || contents.includes(CARRIER_CLASS_NAME)) return contents;
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

const withDuoTallCanvas = (config) =>
  withDangerousMod(
    withDangerousMod(
      withAppDelegate(config, (cfg) => {
        cfg.modResults.contents = editAppDelegate(cfg.modResults.contents);
        return cfg;
      }),
      'duoTallCanvasSceneDelegate',
      async (cfg) => {
        const delegatePath = path.join(cfg.modRequest.platformProjectRoot, cfg.name, 'SceneDelegate.swift');
        await writeFile(delegatePath, editSceneDelegate(await readFile(delegatePath, 'utf8')));
        return cfg;
      }
    ),
    'duoTallCanvasFullScreen',
    async (cfg) => {
      // The prebuild's orientation pass writes the plist after every withInfoPlist edit here,
      // so these keys ride a file edit that runs after all base mods.
      const plistPath = path.join(cfg.modRequest.platformProjectRoot, cfg.name, 'Info.plist');
      const infoPlist = plist.parse(await readFile(plistPath, 'utf8'));
      await writeFile(plistPath, plist.build(editFullScreenKeys(infoPlist)));
      return cfg;
    }
  );

module.exports = withDuoTallCanvas;
module.exports.editAppDelegate = editAppDelegate;
module.exports.editSceneDelegate = editSceneDelegate;
module.exports.editFullScreenKeys = editFullScreenKeys;
