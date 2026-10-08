<div align="center">
  <img src="./assets/icons/svg/masjid.svg" width="100" height="100" alt="Mosque icon" />
</div>

# Athan.uk

A React Native app for Muslim prayer times in London, UK.

Web: [athan.uk](https://athan.uk) | iOS: [ios.athan.uk](https://ios.athan.uk) | Android: [athan.uk](https://athan.uk)

## Features

- Six daily prayers plus five extra times (Midnight, Last Third, Suhoor, Duha, Friday Istijaba) with a live countdown to the next prayer.
- The schedule rolls over after the last prayer of the day instead of midnight. Tomorrow sits one swipe away.
- Fully offline after the first sync. The whole year is cached in MMKV, and an unreadable time shows `--:--`, never a guess.
- Notifications: selectable athan audio (32 public recordings, each credited in the picker), two reminder slots per prayer, a 64-request scheduling budget and deterministic IDs so alarms never double-fire.
- Home screen and Lock Screen widgets on iOS and Android: Light and Dark variants, self-refreshing, minute-ceil countdown labels. Widgets need a development or production build (iOS 16.4+), not Expo Go.
- Qibla compass on a flat world map: a north-locked dial that taps when you line up with Makkah, drawing only headings the phone has vouched for.
- Settings: large overlay font, Hijri date, Arabic prayer names, seconds, seasonal decorations, countdown bar, color picker.

Prayer times come from [London Prayer Times](https://www.londonprayertimes.com/). Reminder audio is recorded in-house. The Audacity projects for every athan and reminder sound are on the [releases page](https://github.com/capt-muji/rn.athan.uk/releases).

## Known limitations

- On some Android phones (ColorOS / OxygenOS), at-time alerts can arrive about a minute late. The fix is built and proven on test devices; it ships with the next store release.

## Upcoming

- [ ] Store release carrying the exact-alarm fix for ColorOS / OxygenOS phones (waits on the SDK 58 stable re-pin)

## Athan audio sources

Every selectable athan sound comes from a public recording:

<details>
<summary>The 32 recordings</summary>

1. [Athan 1](https://www.youtube.com/watch?v=_FLhwe8lk14)
2. [Athan 2](https://youtu.be/GwRoKbB-aWo)
3. [Athan 3](https://youtu.be/pY_7ahJV8Qo)
4. [Athan 4](https://www.youtube.com/watch?v=EwCb9d-aYsw)
5. [Athan 5](https://www.youtube.com/watch?v=MaEzj5eRmjc)
6. [Athan 6](https://www.youtube.com/watch?v=iaWZ_3D6vOQ)
7. [Athan 7](https://www.youtube.com/watch?v=qijUyKRiaHw)
8. [Athan 8](https://www.tiktok.com/@sy._454/video/7478742017174965526)
9. [Athan 9](https://vm.tiktok.com/ZN8eTKymA)
10. [Athan 10](https://vm.tiktok.com/ZN8ewBrH3)
11. [Athan 11](https://vm.tiktok.com/ZN8dJroHG)
12. [Athan 12](https://vm.tiktok.com/ZN8RxBFGL)
13. [Athan 13](https://www.youtube.com/watch?v=vS0zBleiJuk)
14. [Athan 14](https://www.youtube.com/watch?v=LxchYJnAY6c)
15. [Athan 15](https://www.youtube.com/watch?v=LSPXGersP-k)
16. [Athan 16](https://www.youtube.com/watch?v=uSU_perLUC4)
17. [Athan 17](https://www.youtube.com/watch?v=IqwB9fS8vdo&list=PLN-zlYr1ZP07sMCdy-qToyZ2HQTwDU0iz&index=6)
18. [Athan 18](https://www.youtube.com/watch?v=G96FEkkFCzg)
19. [Athan 19](https://www.youtube.com/watch?v=aB-1qzmtxaA)
20. [Athan 20](https://vm.tiktok.com/ZN8ewMvhL)
21. [Athan 21](https://vm.tiktok.com/ZN8ewVELB)
22. [Athan 22](https://www.youtube.com/watch?v=4_LN0hznp-A)
23. [Athan 23](https://www.youtube.com/watch?v=9Y-8AtTDx20)
24. [Athan 24](https://www.youtube.com/watch?v=eLGZQpfGEh8)
25. [Athan 25](https://youtu.be/4POoJPsLuz0)
26. [Athan 26](https://www.youtube.com/watch?v=CcAqiX3SNIo)
27. [Athan 27](https://www.dailymotion.com/video/x8gmb7b)
28. [Athan 28](https://www.youtube.com/watch?v=WVLSfmZcsp0)
29. [Athan 29](https://www.youtube.com/watch?v=keTILkYmLJM)
30. [Athan 30](https://www.youtube.com/watch?v=a1U-G2DnC_4)
31. [Athan 31](https://www.youtube.com/watch?v=eRqwFHzJrGc&list=PLN-zlYr1ZP07sMCdy-qToyZ2HQTwDU0iz&index=13)
32. [Athan 32](https://www.youtube.com/watch?v=j-G8vgDpxiI)

</details>

## Stack

- Expo SDK 58 (preview), React Native 0.88, React 19
- TypeScript, strict mode
- Expo Router, Jotai, MMKV, Reanimated 4
- date-fns and date-fns-tz, with every date in the London timezone
- Biome for lint and format, Jest at 100% coverage, Pino for logging
- Native modules in `modules/`: qibla heading (Google Fused Orientation on Android, Core Location on iOS), TLS 1.3 for Android 9 and below, Android widget self-refresh

## Repository layout

```
app/         Expo Router entry points and navigation
components/  UI components (prayer, countdown, overlay, sheets, modals)
hooks/       useQibla, useCountdown, useSchedule
stores/      Jotai atoms (schedule, notifications, countdown, sync, widgets)
shared/      utilities: constants, prayer, time, notifications, qibla, whatsNew
widgets/     iOS widget layouts and the Android Glance layout
modules/     native Expo modules: qiblaheading, tls13, widgetrefresh
device/      platform code: notifications, listeners, updates, tasks
api/         prayer times client; mocks/ holds dev and test data
e2e/         Maestro flows, device atlas, frame audit, baseline compare
```

`patches/` holds patch-package patches. `ai/` holds the agent guide and the session programme. `android/` and `ios/` are generated by `npx expo prebuild` and stay git-ignored.

## Development

Prerequisites: Node.js 24+, Yarn, Xcode with an iOS simulator, Android Studio.

| Command | Purpose |
| --- | --- |
| `yarn reset` | clean, install, set up husky, start Metro |
| `yarn ios` / `yarn android` | build and run on the simulator or emulator |
| `yarn validate` | tsc, Biome and the full Jest suite with coverage: the before-done gate |
| `yarn format` | Biome format and lint fixes |
| `yarn test:tz` | the Jest suite across four timezones, for anything touching dates |
| `yarn check:device <serial>` | audit scheduled alarms on a connected Android phone |
| `build-prod.zsh` / `build-mock.zsh` | local device builds carrying env vars and prebuild order |
| `maestro test e2e/flows/<flow>.yaml` | run a UI flow (needs `export PATH="$HOME/.maestro/bin:$PATH"`) |

Add a dependency with `npx expo install <package>`, never with `--fix`. This project intentionally runs newer jest and typescript than Expo pins.

## Testing

- Jest runs two projects: logic suites (`.ts`) and component suites (`.tsx`) with React Native Testing Library.
- Coverage holds at 100%, enforced by global thresholds on statements, branches, functions and lines. A change covers every line it touches, red before green.
- Tests never read the real clock. Time is mocked with `jest.useFakeTimers({ now })`.
- Date work runs `yarn test:tz` across the timezone matrix.
- `e2e/README.md` documents the Maestro flows, the measurement scripts and their gotchas.

## Release ritual (What's New)

Every store release, edit `WHATS_NEW` in `shared/whatsNew.ts`:

1. Stamp the items shipping in this release with the release version. One to four user-facing items only: new abilities, removals, behavior changes users notice. No technical work.
2. Bump `WHATS_NEW.version` to the store version being submitted. The modal shows nothing unless it equals the installed version.
3. Ship silent when nothing is stamped: leave the version stamps behind, or set `WHATS_NEW` to null.

A contract test (`shared/__tests__/whatsNew.test.ts`) guards the shape. `EXPO_PUBLIC_WHATS_NEW_PREVIEW=1` in `.env` forces the modal on cold launch in dev builds.

## Further reading

- [ai/AGENTS.md](ai/AGENTS.md): the full development protocol.
- [ai/plans/README.md](ai/plans/README.md): the session queue and briefs.
