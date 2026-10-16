function resolveAdbEndpoint(environment = process.env) {
    const socket = environment.ADB_SERVER_SOCKET;
    if (socket) {
        return parseServerSocket(socket);
    }
    const address = environment.ANDROID_ADB_SERVER_ADDRESS;
    const port = parsePort(environment.ANDROID_ADB_SERVER_PORT) ?? DEFAULT_ADB_PORT;
    const host = address || DEFAULT_ADB_HOST;
    const source = address ? 'ANDROID_ADB_SERVER_ADDRESS' : environment.ANDROID_ADB_SERVER_PORT ? 'ANDROID_ADB_SERVER_PORT' : 'default';
    return tcpEndpoint(host, port, source);
}
