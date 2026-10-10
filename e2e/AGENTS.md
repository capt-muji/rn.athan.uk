# e2e rules, loaded on touching e2e files

Read `e2e/README.md` in full before measuring anything. The traps that cost real time:

- **Metro is env-blind.** Any `EXPO_PUBLIC_*` change needs the Metro cache AND the generated
  Android bundle deleted, or the stale transform ships. `assets/app.config` regenerating
  proves nothing: a build can report the new version while running old JavaScript.
- **Local builds serve the mock API** and write mock times into the dev MMKV cache: alarm
  and prayer-time checks are void until a production build refetches. Asr a minute or two
  after launch is the mock, not a bug.
- **A passing Jest count can hide skipped tests.** Confirm a specific test ran with
  `-t "<phrase>"` and read the `N passed, M skipped` line.
- **Android 9 AX dumps are stale.** Live text via Maestro `hierarchy` or pixels, never
  `uiautomator dump` text.
- **Idle is measured past the mock window**: at least 5.5 minutes after cold launch,
  daytime only. Between 00:00 and 06:00 the mock Isha rolls early.
- `expo run:android --device` takes a device NAME, not a serial. Build with
  `./gradlew assembleRelease` and `adb install -r`.
- Force-stop before every scripted Maestro flow. One BACK per open sheet. Verify toggled
  prefs from pixels. For app work outside flows, the executor rule governs: press HOME, then
  `am kill`, never force-stop (it has hung the phone).
- Coordinates live in `device-atlas-<model>.md`, measured once and replayed. Only what
  Maestro and the automation cannot reach belongs there.
- Scripts measure, an image-capable worker interprets frames. Never infer visuals from
  pixels alone.
