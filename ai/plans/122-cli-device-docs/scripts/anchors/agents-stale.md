- **Idle is measured past the mock window**: at least 5.5 minutes after cold launch,
  daytime only. Between 00:00 and 06:00 the mock Isha rolls early.
- `expo run:android --device` takes a device NAME, not a serial. Build with
  `./gradlew assembleRelease` and `adb install -r`.
