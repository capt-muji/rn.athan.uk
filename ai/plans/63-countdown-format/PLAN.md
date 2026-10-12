# Ticket 63: Countdown format: numbers and colons only, every language

| Brief | Countdown format: numbers and colons only, every language (app side; widgets excluded by D77) |
| --- | --- |
| Planned at | `fc1e3b89`, version 2.0.122, 2026-10-12 |
| Planned by | Planning session 2026-10-12 (`ses_ece9ac3caffeym5d3jqeXzUh3K`) |
| Needs first | nothing (57 DONE) |
| Parent | none |
| Group | app time format and reminder copy (`shared/time.ts`, `shared/i18n/*.ts` reminder keys). Disjoint from rows 67 and 68: no widget file is edited |
| Batch budget | 4 (steps 1 and 2; the device step dispatches alone) |
| Session budget | 7 |
| Steps count | 3 (two code, one device) |
| Device | OnePlus 3T, mock build (`3T_SERIAL`) |
| Owner decisions still needed | none. D75 to D77 taken 2026-10-12; planner rulings derive from them in section 2.1 |

## 1. Goal

Today the app's countdown surfaces render unit letters: the hero countdown and the
overlay countdown read `1h 32m`, `9m 59s`, `45s`; the ago badge under a prayer row
reads `Dhuhr 58m ago`; reminder notifications are titled `Fajr in 5m` and the
reminder channel is named `Fajr in 15m Reminder`. The owner's ruling: numbers and
colons only, in every language, because letters on a timer read wrong in Arabic and
most languages while digits and colons stay clean in all six.

When DONE: the hero and overlay countdowns (both schedules) render `H:MM`, or
`H:MM:SS` over an hour and `M:SS` under it while seconds show; the ago badge
renders `H:MM` and keeps the catalog word for `now`; reminder titles and channel
labels carry the bare number with no unit word in all six locales; Eastern
Arabic-Indic digits still render under `ar`. The owner notices the hero reading
`0:42` where it read `42m`.

The owner's rules that apply: no pixel changes beyond this ruled format change;
an alert does exactly what its bell shows; the API is the source of truth for
prayer times (untouched here); tests never read the real clock; visuals are
settled, and this change is her own ruling, quoted in section 2.

## 2. Decisions

### 2.1 Taken

| ID | Decision | Who, when | Recorded |
| --- | --- | --- | --- |
| D75 | Always `H:MM`: 42 min renders `0:42`, 92 min `1:32`, zero and negative clamp `0:00`. Seconds shown: `H:MM:SS` over an hour (`1:32:05`), `M:SS` under (`9:45`). Ago badge same shapes; the word `now` stays (a word, not a unit letter) | Owner, 2026-10-12, question round in the planning session | This table |
| D76 | Reminder notification titles and the reminder channel label drop the unit word in all six languages: `Fajr in 5`, channel `Fajr in 5 Reminder` | Owner, 2026-10-12, same round | This table |
| D77 | Widgets are untouched by this ticket. The widget countdown label job is split to its own queue row (69). Only the app changes: both schedule countdowns, the overlay, the ago badge, reminder titles | Owner, 2026-10-12, in-session message | This table and the queue |
| P1 | The seconds cutoff boundary renders `9:59` at 599 s and `0:10` at 600 s under `hideSeconds`: the ruled shapes flip there and a comment pins why | Planner, from D75 | Step 1 |
| P2 | `formatTime`'s `forceHideSeconds` parameter is deleted. No production caller passes it (grep of the repo finds callers only in `shared/__tests__/time.test.ts`), and its old meaning, seconds rendering alone as `45s`, has no colon analogue | Planner, from D75 | Step 1 |
| P3 | Catalog keys `duration.h`, `duration.m`, `duration.s` stay. `widgetStrings()` in `shared/widgetTimeline.ts:61` bakes them into the Android snapshot, and D77 forbids widget edits. `duration.now` stays and gains the app as its reader | Planner, from D77 | Step 1 |
| P4 | `reminder.unitMinutes` (`min`, the reminder sheet's picker label) is unchanged: a settings label, not a timer | Planner, from D75 | Section 6 scope |
| P5 | `notification.now` (`{name} now`) and the `time.ago` template words are unchanged: words, not unit letters | Planner, from D75 | Section 6 scope |

### 2.2 The executor must not decide

- Any surface not named in section 6. A widget file that seems to need a change is
  a STOP: D77 excluded widgets, and row 69 owns them.
- Any new string value. Every value the change writes is in this plan.
- Anything about the countdown's timing, tick cadence or rounding model
  (`getSecondsRemaining`, the wall-clock ticker): this ticket changes rendering
  strings only.

## 3. Pre-flight

`scripts/preflight-63.sh`, committed in this folder. The executor saves a copy to
`$TMPDIR` and runs `bash $TMPDIR/preflight-63.sh` with the repository root as the
working directory. It checks: `uat` checked out, clean tree,
`origin/uat` merged in, `package.json` version at 2.0.122 or higher, and every
anchor under `scripts/anchors/` counting exactly 1 in its source file. It ends
`PREFLIGHT OK`.

## 4. Background the executor needs

Code map (anchors under `scripts/anchors/`, named in brackets):

- `shared/time.ts` — owns both formatters.
  - `DurationLabels` and `durationLabels()` read `duration.h/m/s/now` from the
    catalog [`time-labels`]. After this ticket they are deleted; the widget
    snapshot keeps its own copy in `widgetStrings()`, which D77 leaves alone (P3).
  - `formatTime` builds `1h 32m` style parts and joins them with spaces
    [`time-format-core`]. Its `labels` parameter defaults to `durationLabels()`;
    no caller outside the test passes it. `intervalToDuration` from `date-fns`
    becomes unused by the rewrite [`time-imports`].
  - `formatTimeAgo` builds `2m`, `1h 30m`, or the `now` word
    [`time-ago`]. Called only by `calculatePrayerAgo` in
    `hooks/usePrayerAgo.ts:35`, which changes nothing itself.
- `stores/countdown.ts:96` — `formatTimeSecondsAware` calls
  `formatTime(seconds, !showSeconds)`. The store code does not change: the display
  atoms (`standardCountdownDisplayAtom`, `extraCountdownDisplayAtom`) already
  carry whatever string `formatTime` emits, and `components/countdown/Countdown.tsx`
  renders that string for the hero on both schedules. The overlay countdown is the
  same atom (ADR-014 countdown merge), so one formatter change covers hero,
  overlay and both schedules.
- `components/prayer/Ago.tsx` — renders `prayerAgo` from `usePrayerAgo`; the
  string is `t('time.ago', { name, duration })` with `duration` from
  `formatTimeAgo`. Only the `duration` substring changes.
- `shared/notifications.ts:182` — reminder title from
  `t('notification.reminder', { name, n: intervalMinutes })`;
  `:513` — channel name from `t('channel.reminder', ...)`. The code does not
  change; the catalog values do (D76).
- Six catalogs carry the two reminder keys; `en` [`en-notification`,
  `en-channel`] and `ar` [`ar-notification`, `ar-channel`] are anchored; the other
  four carry the pairs listed verbatim in step 2.
- `scripts/catalog-lock.mjs` writes `shared/i18n/catalog-lock.json`, one sha256 of
  the `en` catalog per translated locale (D49). Any `en` value change trips
  `shared/__tests__/catalogLock.test.ts` until `yarn i18n:lock` re-takes it.
- `scripts/i18n-export.mjs` (`yarn i18n:export`) writes the gitignored
  `shared/i18n/dist/en.json`. It runs the bridge test file, which writes the file
  and calls `process.exit(0)`; jest then prints a failure trace naming
  `Object.exit (shared/__tests__/i18nBridge.test.ts:38)`. That trace is expected;
  the proof of the command is the written file's content.

Existing tests and what each proves:

- `shared/__tests__/time.test.ts` — every branch of both formatters, the JSDoc
  example contract, and the `ar` digit branches (D57).
- `stores/__tests__/countdown.test.ts` — the display atom's rendered string,
  minute-band stability, `ar` digits, and the last-10-minutes rule
  [`countdown-pin`, `countdown-ar-pin`].
- `stores/__tests__/schedule.test.ts` — overlay-open display strings in the
  R11/R12 table [`schedule-pin`].
- `components/countdown/__tests__/Countdown.test.tsx` — the rendered hero string
  [`hero-pin`]; `__tests__/app/Screen.test.tsx` — the rendered ago badge
  [`screen-pin`]; `components/prayer/__tests__/Ago.test.tsx` — the badge's words
  and visibility [`ago-pin`].
- `shared/__tests__/notifications.test.ts` — reminder titles and channel names,
  `en` and `ar` [`notif-pin`]; `shared/__tests__/prayerIdContract.test.ts` — the
  frozen channel-name format [`contract-pin`]; `shared/__tests__/i18nBridge.test.ts`
  — the interpolation pins [`bridge-pin`].

Why the obvious fix is wrong: editing the catalog's `duration.h/m/s` values to
empty strings would keep the space-joined parts (`1 32`), trip the parity and lock
gates, and touch the widget snapshot's source keys (P3). The formatters themselves
change.

Concurrency: both formatters are pure functions on the JS thread. `formatTime` is
called from Jotai display-atom selectors recomputed on the wall-clock ticker's
store writes; `formatTimeAgo` from a hook's state computation. No timer, no
shared mutable state, no worklet is involved. No new interleaving exists.

Proof (scratch worktree, deleted before this plan merged): the four proof cases
failed red with `Expected: "1:32" / Received: "1h 32m"`, `Expected: "1:01:05" /
Received: "1h 1m 5s"`, `Expected: "0:00" / Received: "0s"`, `Expected: "0:02" /
Received: "2m"`; after the change they passed; `tsc` flagged only the deleted
parameter's three-arg test calls; Biome flagged only the now-unused
`intervalToDuration` import; the full suite enumerated exactly the ten suites
named in the steps; `yarn i18n:lock` re-took five locales and the lock suite
passed; `yarn i18n:export` wrote `"notification.reminder": "{name} in {n}"` into
the gitignored `dist/en.json`.

## 5. Design

The approach: rewrite both formatters as pure digit-and-colon composers, delete
the label machinery from `shared/time.ts`, and edit twelve catalog values. The
display atoms, hooks and components keep their code; their strings change because
the formatter changed.

The invariant, one sentence a test can check: `formatTime` and `formatTimeAgo`
emit only digits, `:` and (for `formatTimeAgo` under 60 s) the `duration.now`
word, in every branch, under every locale.

Alternatives rejected: emptying the unit catalog values (breaks parts joining,
parity and the widget keys, P3); an `Intl.DurationFormat` call (not available in
Hermes at the pinned runtime and gives locale letters, against D75); changing the
components (they render strings they do not compose).

**Acceptance criteria:**

- [R1.1] WHEN `formatTime` renders seconds hidden THE SYSTEM SHALL emit `H:MM`
  with a zero-padded minute group and an unpadded hour group (`0:42`, `1:32`,
  `25:00`)
- [R1.2] WHEN `formatTime` renders seconds shown THE SYSTEM SHALL emit `H:MM:SS`
  over an hour (`1:01:05`) and `M:SS` under it (`9:45`, `0:45`)
- [R1.3] WHEN `formatTime` receives zero or negative seconds THE SYSTEM SHALL emit `0:00`
- [R1.4] WHEN the countdown display atoms render under `ar` THE SYSTEM SHALL draw Eastern Arabic-Indic digits with the colon bytes unchanged (`١:٠١`)
- [R2.1] WHEN `formatTimeAgo` renders under 60 s THE SYSTEM SHALL emit the
  catalog's `duration.now` word for the active locale
- [R2.2] WHEN `formatTimeAgo` renders 60 s or more THE SYSTEM SHALL emit `H:MM`
  with a zero-padded minute group (`0:02`, `1:30`, `2:00`)
- [R3.1] WHEN a reminder notification is composed THE SYSTEM SHALL title it from
  `notification.reminder` with no unit token after `{n}` in all six locales
  (`Fajr in 5`)
- [R3.2] WHEN the reminder channel is created THE SYSTEM SHALL name it from
  `channel.reminder` with no unit token after `{n}` in all six locales (`Fajr in
  15 Reminder`)
- [R4.1] WHEN this ticket's commits land THE SYSTEM SHALL contain no change under
  `widgets/`, `shared/widgetTimeline.ts` or `shared/widgetTypes.ts`
- [R4.2] WHEN the `en` catalog changes THE SYSTEM SHALL carry a re-taken
  `shared/i18n/catalog-lock.json` in the same commit, and
  `grep '"notification.reminder"' shared/i18n/dist/en.json` prints
  `"{name} in {n}"`

Design review: the shapes were ruled by the owner (D75, D76); the boundary flip
at 599 s to 600 s is pinned by a test with a comment (P1); the deletions
(`DurationLabels`, `durationLabels`, the third parameter, the `date-fns` import)
are each watched by `tsc`, Biome or an existing test; the catalog edits are
twelve exact string replacements, each of which the executor counts with
`grep -F` before replacing, stopping on any count other than 1.

## 6. Steps

Checklist:

1. Step 1 — the colon formatters and the app-side test sweep
   (`steps/1-colon-formatters.md`)
2. Step 2 — reminder titles, channel labels, catalog lock
   (`steps/2-reminder-copy.md`)
3. Step 3 — device proof on the 3T (`steps/3-device-proof.md`)

Scope guard for every step: the files a step lists are the only files it touches.
`reminder.unitMinutes`, `notification.now`, `time.now`, `time.ago` values, every
`widgets/` file, `shared/widgetTimeline.ts` and `shared/widgetTypes.ts` are out
(P3, P4, P5, D77).

## 7. Device proof

Step 3 builds the mock (`$HOME/athan-gitree/BUILD.md` recipe through
`build-mock.zsh`), installs on the 3T (`3T_SERIAL`), and reads the hero countdown
inside the mock's final window (Asr lands 60 to 119 s after each download, so the
hero sits in the seconds-showing band): the hero renders `0:0X`, never `Xs`. The
ago badge renders `now` or `0:0X ... ago` under the previous prayer.
`dumpsys notification` names the reminder channel label `... in 5 Reminder` where
a reminder channel exists. Evidence transcribed under
`$HOME/athan-gitree/sessions/63/`. No clock change runs, so no alarm dump is
required; if any clock change becomes needed, `dumpsys alarm` is read first and
the unexplained app alarm at `when 2104803640505` is named.

## 8. Records

The findings text the executor appends to `LOG.md` under
`## Ticket 63 (2026-10-12)`:

```
Colon formats landed: formatTime renders H:MM, H:MM:SS over an hour and M:SS
under it while seconds show, clamping zero and negative to 0:00; formatTimeAgo
renders H:MM and keeps the duration.now word; reminder titles and channel labels
carry the bare number in all six locales. DurationLabels, durationLabels, the
forceHideSeconds parameter and the date-fns import are deleted from shared/time.ts.
Widgets untouched (D77). Catalog lock re-taken; dist regenerated.
```

The queue cell the lead applies on DONE:

```
DONE <date>, audited: the app's countdowns, ago badge, reminder titles and channel
labels render numbers and colons with no unit letters in all six languages (D75,
D76); widgets untouched (D77), their countdown label job is row 69.
```

The queue row the planning commit already inserted after row 68 (row 69, the
widget half D77 split out, carrying the colon-format scope and the
`WidgetStrings` unit-field question); the READY docs commit only updates row
63's own cell and needs no queue insertion:

```
| 69 | Widget countdown labels: numbers and colons | Split from row 63 by D77 (2026-10-12): the Android widget's ALabel renders `1h 12m` from the snapshot's `strings`; this job moves it to the colon format (`0:42`, `1:12`, `2:00`), decides whether the unit fields retire from `WidgetStrings` (shape and fallback work), and re-tests the v1 fallback words. Group: widget props and modules, serialized with rows 67 and 68 | NOT PLANNED | nothing |
```

Docs commit message: `<VERSION> - docs(plans): ticket 63 READY: colon countdown
formats, reminder copy, 3 steps`.

## LOG.md ledger contract

Every step entry in `LOG.md` opens with the heading `### Step <NN> — <state>` and
ends with a line `session: <ses_id>`. Planning sections use
`## Planning (<date>)` and `## Ticket <N>`.

## 9. Push

None. The executor worker never pushes. The lead pushes after the reviews pass.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| `catalogLock.test.ts` fails after step 2's catalog edits | The lock was not re-taken | Run `yarn i18n:lock`, confirm `git diff shared/i18n/catalog-lock.json` shows five changed hashes, re-run the suite |
| `yarn i18n:export` prints a jest trace naming `Object.exit (i18nBridge.test.ts:38)` | Expected: the bridge writes the file, then exits | Verify `grep '"notification.reminder"' shared/i18n/dist/en.json` prints `"{name} in {n}"`; that grep is the pass check, not the exit code |
| A widget suite fails after step 1 | A widget file or `widgetStrings()` was edited against D77 | Revert the widget edit; row 69 owns it. `STOP:` if the plan's files alone cannot go green |
| `time.test.ts` fails on an `ar` case with Latin digits in the output | The rewrite skipped `localiseDigits` | Both formatters wrap their composed string in `localiseDigits` exactly once |
| The pre-flight reports an anchor count of 2 | A ticket landed that duplicated the anchored text | Return `NEEDS_CONTEXT: NEEDS REPLAN, <anchor and count>`; never repair an anchor |

Anticipated review fixes, word for word:

- A stale JSDoc line in `formatTime`'s block still naming `forceHideSeconds`:
  delete the line.
- A test comment still saying `1h 1m spans`: rewrite to `1:01 spans`.
- A stale `42s`/`1s` mention left in `getSecondsRemaining`'s docblock: rewrite
  to the colon shapes (the change contract's item 5 names the four).
- The `DurationLabels` mention in `shared/widgetTypes.ts:168` goes stale by
  D77 (step 1 deletes the type); row 69 owns that file, so this ticket does
  not touch it.
- The `duration.*` keys removed from a catalog (P3 violation): restore the keys;
  `widgetStrings()` reads them.

Restore lists: step 1 reverts `shared/time.ts`,
`hooks/usePrayerAgo.ts` and the six test files; step 2
reverts the six catalogs, the three pin suites and `catalog-lock.json`; step 3
changes no repository file.

## 11. Subagents

Planning: `explore` workers answer fact questions, `athan-plan-griller` grills the
draft. Delivery: the lead dispatches the `athan-executor` and `athan-reviewer`
workers. Every worker may call `vision` for an image it cannot see. Nothing else,
ever.

## 12. Report to the owner

Plain sentences on what changed and what was proven, the progress table, the
decisions waiting on the owner (none: D75 to D77 are taken), the four-line
handoff.
