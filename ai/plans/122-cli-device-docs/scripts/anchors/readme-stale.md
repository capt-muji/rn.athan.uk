- **`expo run:android --device` takes a device NAME, not an adb serial**: with
  a serial it prebuilds, then fails, and a `| tail` pipe reports exit 0.
  Build with `./gradlew assembleRelease` + `adb install -r`, and check
  `dumpsys package com.mugtaba.athan | grep versionName` before measuring.
