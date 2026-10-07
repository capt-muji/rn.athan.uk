# Agent tooling: `@expo/agent-cli` and the dev-launcher URL

Measured on 2026-09-18 with `@expo/agent-cli` 1.0.16 against this repository at 1.27.235, on the
iOS simulator. `ai/AGENTS.md` section 6 carries the day to day guidance. This file holds the rulings
and the numbers behind it.

## Rulings in force

| # | Ruling | Revisit |
| --- | --- | --- |
| 1 | Use two commands only: `status` and `smoke --ios`. Nothing is installed or hooked | at the SDK 58 stable re-pin |
| 2 | Not a devDependency. Run it through `npx @expo/agent-cli@latest <command>` | at the SDK 58 stable re-pin |
| 3 | The iOS simulator is the verification platform for the dev loop | when a local Android debug build works again |
| 4 | The owner can overturn any ruling by editing this file and `ai/AGENTS.md` section 6 | |

## Forbidden in a session

`ai/AGENTS.md` section 6 lists the forbidden commands and why. Three more are off limits because they
ask EAS for build state: `status --explain`, `status --build` and `--assert`.

Not evaluated: `new`, `install`, `doctor`, `typecheck`, `runtime:*`, `navigate`, `dev`.

## Measured results

| Command | Exit | Result |
| --- | --- | --- |
| `npx -y @expo/agent-cli@1.0.16 status` | 0 | one screen: project, SDK, CNG and dev client, Expo Go compatibility, build freshness, dev server, connected device, auth, next step, local build ability. Starts nothing |
| `npx -y @expo/agent-cli@1.0.16 smoke --ios` | 0 | `smoke passed`, zero runtime errors over a 3 second window |

`status` lines that stay fixed between runs: `project`, `expo go`, `auth`, `build`. Lines that vary:
`freshness`, `dev server`, `device`, `next`.

| `smoke --ios` timing | Seconds |
| --- | --- |
| Whole run, dev client built in the run | 394.6 |
| Of which starting the dev server and building | 322.4 |
| Of which installing the app | 59.3 |
| Earlier run on a clean machine | 450.7, first build 413.8 |

- `smoke --ios` starts its own dev server, builds the dev client when none is recorded for the
  fingerprint, opens the app through `athan://`, reads runtime errors, takes one picture under
  `.expo/agent-cli/` and stops the server it started.
- It leaves `ios/Pods` and the Xcode build products in place, so later runs are incremental.

## Local Android debug build: blocked when measured

`npx expo run:android --variant debug` failed on 2026-09-18 on an emulator, in two ways.

| Wrapper | Failure |
| --- | --- |
| Gradle 9.3.1, as generated | `Failed to apply plugin 'com.android.internal.version-check'`: AGP demands at least 9.4.1 |
| Gradle 9.4.1 | `Cannot add extension with name 'kotlin', as there is an extension already registered with that name` |

The wrapper stays at 9.3.1. Nobody has fixed or re-measured this. The SDK 58 stable re-pin is the
latest point at which it is picked up. Re-measure before relying on it either way.

## Dev-launcher launch URL

`ai/AGENTS.md` section 6 holds the link's shape and its flags. These facts are recorded only here,
read on the iOS simulator dev build.

| Fact | Evidence |
| --- | --- |
| `disableFab=1` persists | `EXDevMenuShowFloatingActionButton` reads `false` after the flagged link and after a plain relaunch |
| `disableAutoLaunch=1` persists | `EXDevMenuShowsAtLaunch` reads `false`, same two reads |
| The flagged link finishes onboarding | `EXDevMenuIsOnboardingFinished` reads `true` |
| A fresh install opens the dev menu's onboarding sheet on a plain link | the sheet shows until onboarding is finished; the app still loads behind it |
