const DEVICE_DISCOVERY_WAIT_LIMIT_MS = 10_000;
const DEVICE_DISCOVERY_RETRY_DELAY_MS = 200;
const DEVICE_DISCOVERY_RETRY_WINDOW_MS = 2_000;
let _server;
function getServer() {
    _server ??= new _ADBServer.ADBServer();
    return _server;
}
function logUnauthorized(device) {
    _log.warn(`\nThis computer is not authorized for developing on ${_chalk().default.bold(device.name)}. ${_chalk().default.dim((0, _link.learnMore)('https://expo.fyi/authorize-android-device'))}`);
}
async function isPackageInstalledAsync(device, androidPackage, signal) {
    const packages = await getServer().runDeviceQueryAsync(adbShellArgs(device.pid, 'pm', 'list', 'packages', '--user', _env.env.EXPO_ADB_USER, androidPackage), 'package query', signal);
