    static async resolveFromNameAsync(query) {
        const devices = await (0, _getDevices.getDevicesAsync)();
        const device = devices.find((device)=>device.pid === query) ?? devices.find((device)=>device.name === query);
        if (!device) {
            const message = [
                `No connected Android device or emulator matched "${query}" by serial or name.`,
                'Available devices:',
                ...devices.map((device)=>`  ${device.name} (${device.pid ?? 'not attached'}, ${device.type})`),
                'Pass a device serial from `adb devices` or a name from the list above to --device.'
            ].join('\n');
            throw new _errors.CommandError('BAD_ARGS', message);
        }
        return AndroidDeviceManager.resolveAsync({
            device,
