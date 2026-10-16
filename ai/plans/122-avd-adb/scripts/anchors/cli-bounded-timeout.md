    if (params.waitLimitMs != null) {
        cleanupWaitLimitMs = Math.min(ADB_SUBPROCESS_CLEANUP_WAIT_LIMIT_MS, Math.max(1, Math.floor(params.waitLimitMs / 4)));
        // The public wait limit covers both command execution and reaping its child.
        waitLimitSignal = AbortSignal.timeout(Math.max(1, params.waitLimitMs - cleanupWaitLimitMs));
        operationSignal = operationSignal ? AbortSignal.any([
            operationSignal,
            waitLimitSignal
        ]) : waitLimitSignal;
    }
    try {
        return operationSignal ? await raceWithSignal(spawnPromise, operationSignal) : await spawnPromise;
