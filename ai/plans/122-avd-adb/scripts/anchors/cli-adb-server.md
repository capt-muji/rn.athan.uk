    /** Execute an ADB command with given args. */ async runDeviceQueryAsync(args, operation, signal, waitLimitMs = DEVICE_QUERY_WAIT_LIMIT_MS) {
        const adb = this.getAdbExecutablePath();
        // NOTE(@kitten): We removed start-server/stop-server calls,
        // because each command already negotiates the server automatically
        (0, _events.event)('adb_server_run', {
            command: [
                adb,
                ...args
            ].join(' ')
        });
        const result = await this.resolveAdbPromise((0, _adbProcess.runBoundedAdbDeviceQueryAsync)(adb, args, operation, waitLimitMs, signal));
        assertValidAdbUserOutput(result);
        return result.stdout;
    }
