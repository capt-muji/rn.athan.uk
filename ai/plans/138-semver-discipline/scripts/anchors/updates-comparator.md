    const installedVersion = getInstalledVersion();
    const storeVersion = await getStoreVersion();

    if (storeVersion === false) {
      stampFailure();
      return false;
    }

    setPopupUpdateLastCheck(now);

    if (!installedVersion || !storeVersion) return false;

    return isNewerVersion(installedVersion, storeVersion);
