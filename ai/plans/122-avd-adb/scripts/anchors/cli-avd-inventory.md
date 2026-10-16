async function listAvdsAsync() {
    const { stdout } = await (0, _spawnasync().default)(whichEmulator(), [
        '-list-avds'
    ]);
    return stdout.split(/\r?\n/).filter(Boolean)/**
       * AVD IDs cannot contain spaces. This removes extra info lines from the output. e.g.
       * "INFO    | Storing crashdata in: /tmp/android-brent/emu-crash-34.1.18.db
       */ .filter((name)=>!name.trim().includes(' ')).map((name)=>({
            name,
            type: 'emulator',
            isBooted: false,
            isAuthorized: true,
            isLaunchable: true
        }));
