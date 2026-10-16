async function getDevicesAsync() {
    const bootedDevices = await (0, _adb.waitForAttachedDevicesAsync)();
    // NOTE(@kitten): We don't assume AVD must succeed or be present, and still allow
    // devices to be discovered and move on
    let data;
    try {
        data = await (0, _emulator.listAvdsAsync)();
    } catch (error) {
        if (!bootedDevices.length) {
            throw new _errors.CommandError('ANDROID_AVD_DISCOVERY', formatNoDevicesMessage(error instanceof Error ? error.message : String(error)));
        }
        data = [];
    }
    const allDevices = mergeDevices(bootedDevices, data);
