const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

const PORTRAIT_PAIR = ['UIInterfaceOrientationPortrait', 'UIInterfaceOrientationPortraitUpsideDown'];

// The inner display presents per pose and ignores any app orientation answer (Tech Talks 111461),
// granting the full canvas only for a pose the plist declares (row 271 measured landscape spanning
// the wide hold under a four-orientation plist). Declaring the portrait pair alone is therefore the
// tall presentation's opt-in and the wide hold's lock: held tall the portrait window spans edge to
// edge, held wide the system keeps its centered letterbox. Everywhere else the delegate gate below
// answers the portrait pair for every window, so no surface ever lays out wide.
const GATE_MASK = 'return [.portrait, .portraitUpsideDown]';

const GATE_SOURCE = `  public override func application(
    _ application: UIApplication,
    supportedInterfaceOrientationsFor window: UIWindow?
  ) -> UIInterfaceOrientationMask {
    ${GATE_MASK}
  }
`;

const CLASS_CLOSE = `}

${'class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {'}`;

const editAppDelegate = (contents) => {
  if (contents.includes(GATE_MASK)) return contents;
  if (!contents.includes(CLASS_CLOSE)) {
    throw new Error('duoTallCanvas: the AppDelegate class-close marker moved; read the new template');
  }
  return contents.replace(CLASS_CLOSE, `\n${GATE_SOURCE}\n${CLASS_CLOSE}`);
};

const editInfoPlist = (plist) => {
  plist.UISupportedInterfaceOrientations = PORTRAIT_PAIR;
  plist['UISupportedInterfaceOrientations~ipad'] = PORTRAIT_PAIR;
  // TN3192 deprecated UIRequiresFullScreen: unscoped, it freezes the Designed-for-iPad window
  // on a Mac and opts the iPad out of resizable windows. iPhone-scoped it survives as the iOS 27
  // discrete-scene-resize request, which is the tall canvas's presentation (Tech Talks 111461),
  // so the phone fleet answers exactly as before.
  delete plist.UIRequiresFullScreen;
  plist['UIRequiresFullScreen~iphone'] = true;
  return plist;
};

const withDuoTallCanvas = (config) =>
  withAppDelegate(withInfoPlist(config, editInfoPlist), (cfg) => {
    cfg.modResults.contents = editAppDelegate(cfg.modResults.contents);
    return cfg;
  });

module.exports = withDuoTallCanvas;
module.exports.editAppDelegate = editAppDelegate;
module.exports.editInfoPlist = editInfoPlist;
