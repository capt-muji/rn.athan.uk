# Upgrades & audit — programme brief

**Opened:** 2026-09-12, by the owner, immediately after the uat-2 programme closed.

`uat-2` is **not** merged into `uat`, and will not be for a while. The owner deferred
that deliberately to fit this work in first: *"I don't want to merge UAT 2 into UAT for
a little while longer... I've thought of some more things we want to address."*

## What changed in the owner's standing instructions (2026-09-12)

Three reversals. Each supersedes something written down earlier, so read them before
trusting any older document.

1. **Package upgrades are now IN SCOPE.** This reverses the constraint in
   `ai/features/uat-2/AUDIT-BRIEF.md` ("No package upgrades. The owner deferred them:
   if it works, it works"). Owner: *"this sounds like a good time to upgrade packages"*.
   That brief has been corrected, but older session prompts may still repeat the old
   rule — this brief wins.
2. **Task 16 (countdown tip clamp, visual confirmation) is CLOSED**, no work remaining.
   Owner checked it on device: *"the tip is fine. you can leave it."*
3. **Tasks 23–24 (merge `uat-2` → `uat`, then refresh the alarm-clock backport) are
   DEFERRED**, not cancelled, and still require the owner's explicit word.

## The arc — four sessions

The owner asked for this to be split because long single sessions kept compacting.
Each session ends by handing the owner a paste-block for the next.

| # | Session | Prompt | Touches code? |
|---|---|---|---|
| 1 | Upgrade research → ranked plan | `ai/prompts/upgrade-research.md` | **No** |
| 2 | Upgrade execution, one package at a time | written at the end of S1 | Yes |
| 3 | Code audit: findings (task 19) | `ai/features/uat-2/AUDIT-BRIEF.md` | **No** |
| 4 | Code audit: changes (task 20), one at a time | written at the end of S3 | Yes |

Why split here specifically: S1 fills its context with changelogs and will compact —
that is fine, because its entire output is a file. S2 needs a clean context for device
work. S3 wants fresh eyes on code it has not just been editing. S4 needs the
one-change-at-a-time discipline that a tired context stops honouring.

After all four: merge `uat-2` → `uat` on the owner's word, then the backport, and only
then the v2.0 global expansion (a much larger research-led programme the owner has
already flagged as its own multi-session effort).

## Version inventory at the time of writing

`package.json` @ 1.24.34. The headline gaps:

- **react 19.2.3** — 19.3 released 2026-09-09, the reason this programme exists.
- react-native 0.86.3, expo ~57.0.21, expo-router ~57.0.20, typescript ~7.0.2,
  jotai 2.20.3, react-native-mmkv 4.3.2, biome 2.5.11, jest ^30.4.2.
- **Already current, do not "upgrade" again:** `react-native-reanimated` **4.6.0** and
  `react-native-worklets` **0.12.2**. An older plan document recommends moving to
  exactly these versions; that work is DONE. Anything still outstanding from that plan
  is app-code, not a version bump (`Countdown.tsx` resync gap, `Ago.tsx`,
  `Navigation.tsx` dot opacity, the mid-bounce guard in `useAlertSwapBounce.ts`).

`ai/AGENTS.md` §2 "Stack & Versions" is **already drifted** from `package.json` (it
lists expo 57.0.17, expo-notifications ~57.0.15, expo-router ~57.0.17, expo-widgets
~57.0.15, @expo/ui ~57.0.14). Refreshing that table is a deliverable of session 2, not
an optional tidy.

## Upstream watch — verified 2026-09-12, do not re-derive

The owner believed three tracked PRs had merged and that they fixed the iOS widgets.
The actual position, checked against the GitHub API and the installed source:

| Item | Reality |
|---|---|
| **#49244** widget view identity | **Closed UNMERGED** 2026-09-11. Maintainer: *"we decided to take a different approach"* |
| **#49810** widget view identity | **MERGED 2026-09-11** by jakex7 — the replacement. **Unreleased**, sits above `58.0.0` in the changelog → **SDK 58 line**, not a 57.0.x patch |
| **#49687** Android alarmClock delivery | Merged 2026-09-08. Android notifications, *not* widgets. Already adopted on `experiment/alarmclock-backport` |
| **#48786** | Not a PR — an **open issue**: `[expo-background-task] iOS getStatusAsync() never reads the real Background App Refresh permission`. Touches our background path |
| **#50038** | Merged: Android Gradle failure when no Android widget configured. Only matters if Android widgets are ever configured |

**The iOS widgets cannot be fixed by upgrading within the 57.x line.** Installed
`expo-widgets@57.0.18` still contains the root cause — `DynamicView.swift:26`,
`let uuid = NodeIdentityWrapper(id: UUID())` under a `TODO(@jakex7)` calling it a hack —
and 57.0.16/17/18 each record "no user-facing changes". The `widgets` flag stays OFF.

Two routes, owner's choice, neither belonging to sessions 1–4:

1. **Wait for SDK 58.** Clean, no patch to carry, but couples the widget fix to a whole
   SDK migration.
2. **patch-package backport of #49810** onto the installed 57.0.18. ISSUES.md G.1
   already sanctions this shape ("merged-but-unreleased past ~a week... human-approved"),
   and the clock started 2026-09-11. It is a full session: backport, EAS dev build, then
   the G.1 acceptance protocol on the XS (all 8 home kinds render and hold ≥10 min, zero
   `cpu_resource` reports, zero watchdog lines).

## Device policy — the OnePlus 3T only

Owner, 2026-09-12: *"literally all your testing on the 1+3T... that's really the one
that's the baseline model. The iPhone XS works perfectly fine. It's a faster phone."*
The XS was connected for the widget work and then **deliberately disconnected** once
that turned out to be blocked upstream, specifically so testing time does not double.

Test on **`3T_SERIAL` (OnePlus 3T, Android 9, SD820)** and nothing else. It is the
slowest device in the fleet, which makes it the most *sensitive* one, not merely the
cheapest to cover: every real defect this programme has found surfaced there because it
is slow. #34 only reproduces because the post-paint refresh beats the API fetch on that
hardware — on a fast phone the race is always won and the bug is invisible. Likewise the
3.1 s TLS provider install (#21/#32) and the 6.2 s cold `Displayed` are 3T-only
phenomena. "It works on the XS" has never been evidence of anything.

The wider fleet (XS, S23, 8T, Find X8, 5T) is deferred. The XS's only outstanding role
is the G.1 widget acceptance protocol, which is blocked upstream anyway.

## Standing constraints (all still live)

- **Never commit the API key.** It lives in the session scratchpad and reaches builds
  through `EXPO_PUBLIC_API_KEY` only. The owner has said this more times than any other
  instruction.
- **This app is an alarm clock.** A prayer time two minutes wrong is a bug; a
  notification on the wrong night is a serious one. Correctness of *times* outranks
  performance, tidiness and novelty. Judge every upgrade by that.
- **Nothing may assume London.** v2.0 goes global. `PRAYER_TIMEZONE` in
  `shared/constants.ts` is the single setting.
- **One change at a time**, measured before and after, verified on the device.
- Version bump in `app.json` **and** `package.json` on every commit; commit prefix
  `X.Y.Z - `. Keep `android/app/build.gradle` `versionName` in step or the next build
  reports the wrong version on device (AGENTS.md calls this "the app-info lie").
- Feature branches off `uat-2`, merged back with `--no-ff`. **Never commit to `uat`**
  without the owner's explicit word.
- **Git writes are authorised** for these autonomous sessions — commit, push, and merge
  into `uat-2`. This is an owner override of `ai/AGENTS.md` §7 ("Never Do: Git write
  operations"), the same override recorded in `ai/prompts/next-session-bugs.md`.
- **The "sleep ≤ 15 s" rule in AGENTS.md §7 does NOT apply to Claude models.** Owner,
  2026-09-12: *"Feel free to sleep more than 15 seconds, that rule was for a different
  model. I want you to work however you want to work... But only for yourself. Not for
  other models. As in, not for non-Claude models."* Fable 5.1, Opus 5, Sonnet 5 and
  Haiku are all Claude, so these sessions are exempt — use whatever wait actually suits
  the work (a 35 s settle after an app launch, a long build poll). AGENTS.md §7 stays as
  written because it still governs non-Claude models; do not "fix" it.

## Read the gotchas before building — they are not optional

`e2e/README.md` §Gotchas. On 2026-09-12 three of its entries were re-discovered the
expensive way because the list was not read first, costing a full device run:

- A **non-prod build serves `MOCK_DATA_SIMPLE`** and writes mock prayer times into the
  device's own MMKV cache, outliving the build that caused it. The tell is
  `fajr: addMinutes(-3)` — a "Fajr" three minutes before the clock is the mock.
- **Gradle marks the JS bundle task UP-TO-DATE on env-only changes**, so restarting the
  daemon is not enough. Delete `index.android.bundle` and verify by md5; `app.config`
  regenerates independently, so a correct version in the APK proves nothing about the
  JavaScript inside it.
- **`--verbose` prints no test names here.** Confirm a test actually ran with
  `yarn jest <file> -t "<phrase>"`, never by a rising total.

## Model

The owner asked for planning on **Fable 5.1 at max effort**, and explicitly does not
want to drop below the Opus 5 max-effort bar they have been using. There is no
published equivalence table between the two models' effort ladders — max is the top of
the ladder in both, which is the closest honest answer. Sessions 2 and 4 touch prayer
times and notification scheduling, where the correctness bar is highest.

## Update log

**2026-09-12:** Programme opened. Brief written, session 1 prompt at
`ai/prompts/upgrade-research.md`, uat-2 tracker and audit brief corrected.
