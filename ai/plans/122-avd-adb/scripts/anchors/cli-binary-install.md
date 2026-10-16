    if (options.binary) {
        // Attempt to install the APK from the file path
        const binaryPath = _path().default.join(options.binary);
        if (!_fs().default.existsSync(binaryPath)) {
            throw new _errors.CommandError(`The path to the custom Android binary does not exist: ${binaryPath}`);
        }
        _log.Log.log(_chalk().default.gray`\u203A Installing ${binaryPath}`);
        await props.device.installAppAsync(binaryPath);
    } else {
        await installAppAsync(androidProjectRoot, props);
