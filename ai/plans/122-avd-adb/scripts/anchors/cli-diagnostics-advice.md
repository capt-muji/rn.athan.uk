function getAdvice(error, device) {
    const advice = [];
    if (error instanceof _adbProcess.AdbProcessError && error.spawnFailed) {
        advice.push('Check that Android SDK Platform-Tools is installed and ADB is available.');
    }
    if (device?.state === 'offline' && device.type === 'emulator') {
        advice.push('Wait until ADB reports the emulator as ready, then try again.');
    } else if (device?.state === 'offline') {
        advice.push(`Reconnect ${device.pid ? `device ${device.pid}` : 'the device'} and try again.`);
    } else if (device?.state === 'unauthorized') {
        advice.push('Authorize this computer on the device, then try again: https://expo.fyi/authorize-android-device');
