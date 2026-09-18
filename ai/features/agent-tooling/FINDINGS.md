# Agent tooling findings (session 13, 2026-09-18)

`ai/plans/SDK58-PROGRAMME.md` §13, measured against this repository at `1.27.235`. Zero
app-code changes. Command outputs are verbatim; the logs also live in
`~/athan-device-sweep/session13/`. The planning session ran the same two commands on
2026-09-18 as the baseline: status identical, smoke `passed` in 450.7 s with the first
build at 413.8 s.

## Commands run

### `npx -y @expo/agent-cli@1.0.16 status` (exit 0)

```
project     athan · SDK 58.0.0-preview.3 · CNG · dev client · no web
expo go     not compatible (14 reasons)
freshness   ios      local stale · eas unknown
            android  local stale · eas unknown
            no recorded build
            EAS was not asked — pass --explain
dev server  not running (http://127.0.0.1:8081)
device      android 8f7ada76
auth        mugtaba · per expo whoami
next        npx @expo/agent-cli dev --ios → dev-client-stale: expo prebuild --platform ios (+1 more step)
build       local · this machine has Xcode — Xcode 27.0 at /Applications/Xcode.app/Contents/Developer.
```

Fixed lines the plan predicted: `project`, `expo go`, `auth`, `build`. Varying lines:
`freshness`, `dev server`, `device`, `next`.

### `npx -y @expo/agent-cli@1.0.16 smoke --ios` (exit 0)

```
… Looking for a dev server
… Starting a dev server for this run
Building the ios development build first, on this machine. This project has none for its current fingerprint, and a native build takes some minutes — nothing is stuck.
… Waiting for the bundler — a first build takes a while (up to 3m)
… Checking that this project's own code compiles for ios (up to 3m)
… Building and installing this project's development build — a native build takes some minutes (up to 30m)
… Looking for an app attached to the dev server
… Opening the app on the device, and waiting for it to attach (up to 2m)
… Asking the app whether its runtime answers
… Watching what the app reports
… Taking the picture
smoke       passed
dev server  http://127.0.0.1:8081 · via lock, started by this run
            ok                start-dev-server 322.4s · started for this run at http://127.0.0.1:8081, and stopped again afterwards
            ok                dev-server 18ms · the dev server started above answered
            ok                bundler-ready 1ms
            ok                bundle 1.0s
            ok                install-app 59.3s · installed the app on AB4F4466-05CC-4C7F-A451-187E1DC6C6A0, and left it there
            ok                app 5.2s · opened athan:// to connect one
            skipped           reload · this run opened the app, so it already fetched the bundle the dev server is serving
            skipped           route · no --route was given, so the app was read where it already was
            ok                runtime 270ms
            ok                errors 3.1s
            ok                screenshot 555ms
screenshot  /Users/muji/repos/rn.athan.uk/.expo/agent-cli/smoke-2026-09-18T18-36-30-679Z.png
environment started the dev server · stopped again
took        394.6s

Suggested next:
  npx @expo/agent-cli typecheck                                                          — Nothing threw and the bundle compiled, which is not the same as the types being right — a value that is undefined renders rather than throwing.
  open /Users/muji/repos/rn.athan.uk/.expo/agent-cli/smoke-2026-09-18T18-36-30-679Z.png  — The picture of the screen this run took, which is the half of "does it work" that no exit code answers.
```

Built the dev client when needed, opened the app through the athan:// link, read zero runtime errors over the 3-second window, and stopped the dev server it had started.

## Not run, on purpose

| Command | Reason |
| --- | --- |
| `agents:setup` | writes user-home and project instruction files; OpenCode's and Claude's configuration and a managed `AGENTS.md` block are off limits |
| `skills:sync` | creates skill symlinks under `.agents/skills/`, repo content beyond this session |
| `status --explain`, `status --build`, `--assert` | they ask EAS for build state; EAS stays read-only and unbothered |
| every `--eas` flag | routes to EAS Simulator/Build and spends credits; a session is billed until `simulator:stop` |
| `deploy` | ships to EAS Hosting |
| `smoke --android` | the connected OnePlus 3T would be the target, and it holds the owner's installed app |
| `new`, `install`, `doctor`, `typecheck`, `runtime:*`, `navigate`, `dev` | outside the brief's two commands |

## Machine notes

- The local Android debug-build path fails today (measured by the planning session on the
  `athan_test_avd` emulator, 2026-09-18, both attempts preserved in the session record):
  `npx expo run:android --variant debug` first fails at
  `Failed to apply plugin 'com.android.internal.version-check'` because the generated
  wrapper pins Gradle 9.3.1 while AGP demands at least 9.4.1; with the wrapper moved to
  9.4.1 it fails at `Cannot add extension with name 'kotlin', as there is an extension
  already registered with that name`. The wrapper was put back to 9.3.1. This blocks any
  local Android dev build from the main checkout and is why the dev-launcher verification
  ran on the iOS simulator. Not fixed here; whoever owns the local Android build path
  (the SDK 58 stable re-pin session at the latest) picks it up.
- The iOS build smoke drives leaves `ios/Pods` and Xcode build artifacts in place, so later
  smoke runs are incremental and faster than the 450.7 s baseline.

## Rulings (autonomous, 2026-09-18; the owner was away)

1. **Adopt, narrowly.** `status` and `smoke` are documented in `ai/AGENTS.md` §6 and the
   root `AGENTS.md` routing table; nothing is installed or hooked. Four commands are
   forbidden in sessions: `agents:setup`, `skills:sync`, `deploy`, every `--eas` flag; and
   `smoke --android` is forbidden while the 3T is connected. Revisit at the SDK 58 stable
   re-pin (session 16).
2. **No devDependency.** npx keeps the experimental CLI opt-in per session. Revisit at
   session 16.
3. **iOS simulator is the verification platform.** The 3T holds the owner's app; the smoke
   run builds the dev client on the simulator anyway; the Android form is source-verified
   (`DevLauncherController.kt` parses the same flags; the manifest registers `athan` and
   `exp+athan`) and its local build path is blocked (machine notes).
4. **These findings live here**, per the moonsighting `ai/features/` precedent.
5. **Out of scope:** everything in the not-run table.

The owner can overturn any ruling by editing this file and `ai/AGENTS.md` §6.

## Dev-launcher URL verification

<written by step 2>
