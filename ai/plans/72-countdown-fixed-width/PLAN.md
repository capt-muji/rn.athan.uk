# Ticket 72: Countdown timer: fixed-width sections, dim colons and zero-hours, English reverts to letters

| Brief | Countdown timer: fixed-width sections, dim colons and zero-hours, English reverts to letters (the queue row 72 cell is the spec) |
| --- | --- |
| Planned at | `a63a8a96`, version 2.0.195, 2026-10-13 |
| Planned by | Planning session 2026-10-13 (the owner away; her recorded rulings are the interview) |
| Needs first | nothing (63 DONE) |
| Parent | none |
| Group | the countdown components and the time formatters, row 63's ground. Disjoint from the widget rows 67 and 69: no widget file is edited |
| Batch budget | 4 (one step per batch; every step dispatches alone) |
| Session budget | 9 |
| Steps count | 4 (three code, one device) |
| Device | OnePlus 3T, mock build (`3T_SERIAL`) |
| Owner decisions still needed | none at execution. Four planner rulings in section 2.1 carry an explicit audit-veto note |

## 1. Goal

Row 63 made every countdown surface render numbers and colons in all six languages. The
owner tested the Arabic face on 2026-10-13 and ruled row 72: English goes back to the
lettered design that worked before row 63, byte for byte, while every other language keeps
the colon-only format and gains her new fixed-width, dim-ruled treatment.

Her four rules, quoted from the queue row 72 cell (2026-10-13):

1. ENGLISH REVERTS COMPLETELY — the English countdown styling returns pixel-perfect to how
   it worked before row 63 changed it: the lettered design (h/m/s), nothing touched, nothing
   re-designed. The revert covers everything row 63 changed about the English time rendering
   (the two schedule countdowns, the overlay timer, the ago badge, the reminder titles and
   channel labels), and the acceptance bar is byte-identical rendering to the pre-63 state
   (the reference sha is the uat commit before row 63's first step landed, pinned below).
2. NON-ENGLISH LAYOUT — every other language keeps the colon-only format, and the TIME AGO
   badge below every prayer row in both schedules follows the same approach: numerals only,
   no letters, matching the timer's treatment; each colon gains a small gap on both sides
   (two colons, four gaps, a little gap, not a wide space); the timer is three fixed-width
   sections, hours : minutes : seconds, each ALWAYS double digits (05 not 5, 00 when spent)
   so digit changes never shift anything on the screen.
3. NON-ENGLISH COLOUR — a section renders white while its value is above zero; when a
   section reaches 00 it stays visible as 00 and fades to the app's dim styling, the same
   bright-to-dim treatment a prayer row takes when it cascades from next to passed; the
   hours are never hidden as they are under English, they clamp to a dim 00; the colons are
   ALWAYS dim, regardless of how much time remains (11:55:33 shows three white numbers and
   two dim colons).
4. SCOPE — rules 2 and 3 style the non-English locales only; ar's double digits are Eastern
   Arabic-Indic per row 57.

When DONE: under `en` every surface listed in rule 1 renders the exact bytes of the
reference commit `194ed701` (uat at 2.0.128, the parent of row 63's first-step merge
`49c58aea`). Under `ar`, `ms`, `so`, `hi` and `th` the timer renders `HH:MM` with seconds
hidden and `HH:MM:SS` with seconds shown, every group double-digit, zero groups and colons
dim, colons gapped; the ago badge keeps row 63's colon shapes with gapped colons. The owner
notices the Arabic timer reading `٠١:٣٢:٠٥` with dim colons, and the English timer reading
`1h 32m` again.

The owner's rules that apply: visuals are settled and this change is her own ruling, quoted
above; countdown rounds up and 0s never displays (the display contract is untouched); no
`Platform` checks in the countdown path (the branch keys on the active locale, the same
module state `localiseDigits` reads); animated components render their settled state on the
first frame; tests never read the real clock.

## 2. Decisions

### 2.1 Taken

| ID | Decision | Who, when | Recorded |
| --- | --- | --- | --- |
| D72.1 | The reference sha for the English revert is `194ed701` (uat at 2.0.128), the parent of row 63's first-step merge `49c58aea` (2.0.129). Byte-identical is proven by pinning the en outputs to the reference commit's own test values, quoted in step 1 | Planner, 2026-10-13, from the row 63 version ladder in git | This table and step 1 |
| D72.2 | The en revert restores the reference `formatTime` and `formatTimeAgo` bodies verbatim as private en branches (`formatTimeLettered`, `formatTimeAgoLettered`), including `DurationLabels`, `durationLabels()` and the `intervalToDuration` import; the public formatters branch on `currentLocaleId() === 'en'` | Planner, from rule 1 | Step 1 contracts |
| D72.3 | The non-en timer shapes: seconds hidden `HH:MM`, seconds shown `HH:MM:SS`, every group `pad2`, zero and negative clamp to `00:00:00`. This supersedes row 63's D75 shapes (unpadded hours, `M:SS` under the hour) for the five non-en locales only. AUDIT-VETO: seconds stay hidden by preference; the owner may rule three sections at all times at audit | Planner, from rules 2 and 3 | Step 1 contracts |
| D72.4 | The colon gap renders as U+2009 thin spaces around the colon inside its own text node (`\u2009:\u2009`), on the timer and the ago badge. A row-of-siblings layout was rejected: RTL child order flips under ar, the pill loses colour inheritance, and screen readers fragment the utterance | Planner, from rule 2's "little gap, not a wide space" | Step 2 contracts. AUDIT-VETO: the gap width is a thin space; the owner may rule it wider or narrower at audit |
| D72.5 | The dim colour pair is the row-cascade pair: `COLORS.text.muted` dim, `COLORS.text.primary` bright (`components/prayer/Prayer.tsx:52-60`), animated with `useDerivedColor` over `ANIMATION.durationSlow`, the cascade's own 1000 ms fade. A section mounts settled and animates only on a zero-state change | Planner, from rule 3's "the same bright-to-dim treatment" | Step 2 contracts. AUDIT-VETO: the fade duration; `ANIMATION.durationFade` (150 ms) is the one-line alternative |
| D72.6 | The ago badge keeps row 63's colon shapes (`0:02`, `1:30`) with no fixed width and no per-section colour: rule 2's three-section rule describes the timer, and rule 2's own verb for the badge is "keeps". The badge gains the colon gap only | Planner, from rules 2 and 4 | Step 1 and step 2. AUDIT-VETO: fixed-width badge hours would be `pad2(hours)` in `formatTimeAgo`'s non-en branch |
| D72.7 | Non-en reminder titles and channel labels keep row 63's copy byte for byte (`العصر بعد ١٥` unchanged); en reverts to `{name} in {n}m` and `{name} in {n}m Reminder` | Planner, from rules 1, 2 and 4 | Step 3 |
| D72.8 | Strings that are not all-digit colon shapes (`en` lettered strings, the held `--:--`) render through today's single-node path in every locale, with today's styles | Planner, from rule 1 and the settled-visuals rule | Step 2 contracts. AUDIT-VETO: the held display keeps today's primary colour; the owner may rule it dim at audit |

### 2.2 The executor must not decide

- Any surface not named in section 6. A widget file that seems to need a change is a STOP:
  rows 67 and 69 own the widgets, and R6.4 forbids widget edits here.
- Any new colour token, any new spacing constant, any other fade duration.
- Anything about the countdown's timing, tick cadence or rounding model
  (`getSecondsRemaining`, the wall-clock ticker): this ticket changes rendering only.
- Any catalog value beyond the two en values in step 3. The five non-en catalogs are
  read-only in this ticket.

## 3. Pre-flight

`scripts/preflight-72.sh`, committed in this folder. The executor saves a copy to
`$TMPDIR` and runs `bash $TMPDIR/preflight-72.sh` with the repository root as the working
directory, passing the step's own anchor names as arguments (each step's Anchor check names
them; the script checks all 17 when called with no arguments). It checks: `uat` checked
out, clean tree, `origin/uat` merged in, `package.json` version at 2.0.195 or higher, and
every named anchor under `scripts/anchors/` counting exactly 1 in its source file. It ends
`PREFLIGHT OK`.

## 4. Background the executor needs

Code map (anchors under `scripts/anchors/`, named in brackets):

- `shared/time.ts` — owns both formatters and the new splitters.
  - `pad2` at `:22` pads a number to two digits; `localiseDigits` maps Latin digits to
    Eastern Arabic-Indic under `ar` and is identity in the other five locales.
  - `formatTime` [`time-format-core`] is row 63's colon composer: `H:MM`, `H:MM:SS` over an
    hour, `M:SS` under it. Row 72 splits it into the en branch (the reference lettered
    algorithm restored) and the non-en branch (the fixed-width composer, D72.3).
  - `formatTimeAgo` [`time-ago`] is row 63's colon "ago" composer. Row 72 splits it the same
    way: en returns to the reference lettered shapes, non-en keeps these colon shapes (D72.6).
  - `getSecondsRemaining`'s body and the wall-clock ticker are untouched; only their
    docblocks' quoted display strings revert to the reference wording (R6.4).
- `stores/countdown.ts:90-96` [`display-atom`] — `makeCountdownDisplayAtom` renders
  `formatTime(seconds, !showSeconds)` into `standardCountdownDisplayAtom` and
  `extraCountdownDisplayAtom`. No code change: the strings change because the formatter
  changed. `formatTimeSecondsAware` is untouched (R6.4).
- `components/countdown/Countdown.tsx` [`hero-render`] — the one render component for both
  schedule heroes and, through the ADR-014 countdown merge, the overlay timer: while the
  overlay is open the page countdown atom itself carries the selected prayer's countdown.
  Today one `Animated.Text` renders `{displayTime}`. Row 72 branches: `en` keeps this exact
  render; the other five locales render the string's sections as nested text nodes with
  per-group colours and dim gapped colons (step 2).
- `components/prayer/Ago.tsx` [`ago-render`] — the badge, rendered once per page by
  `app/Screen.tsx:43` (`{showTimePassed && <PrayerAgo type={type} />}`), shared by both
  schedules. The pill is one `Animated.Text`; the string comes from `usePrayerAgo`. Row 72
  splits the string on its single colon under non-en and renders the gap node between the
  halves (step 2). Its colour hooks are untouched.
- `hooks/usePrayerAgo.ts` — composes `t('time.now')` / `t('time.ago', { name, duration })`.
  No code change; the docblock's example strings revert to the reference wording.
- `hooks/useAnimation.ts:128-134` [`derived-color`] — `useDerivedColor` interpolates a
  target 0-to-1 between two colours; `useDerivedProgress` snaps the first evaluation, which
  is what keeps the first frame settled (R3.4).
- `components/prayer/Prayer.tsx:52-60` [`cascade-pair`] — the row cascade the owner named:
  `useDerivedColor` between `COLORS.text.muted` and `COLORS.text.primary`. The timer's
  sections reuse this exact pair (D72.5).
- `shared/i18n/locale.ts` — `currentLocaleId()` returns the active locale id;
  `setActiveLocale` switches it. This is the same module state `localiseDigits` reads, so
  the formatter branch and the digit map can never disagree.
- `shared/i18n/en.ts` [`en-reminder`, `en-channel`] — the two values step 3 reverts.
  The five non-en catalogs keep row 63's values (D72.7).
- `scripts/catalog-lock.mjs` / `yarn i18n:lock` — an `en` value change trips
  `shared/__tests__/catalogLock.test.ts` until the lock is re-taken. `yarn i18n:export`
  writes the gitignored `shared/i18n/dist/en.json`; its jest trace naming
  `Object.exit (shared/__tests__/i18nBridge.test.ts)` is expected, and the written file is
  the proof.

Existing tests and what each proves:

- `shared/__tests__/time.test.ts` — every branch of both formatters, the JSDoc example
  contract, and the `ar` digit branches (D57). Row 72 rewrites the en expectations to the
  reference values and the `ar` expectations to the fixed-width shapes, and adds
  `splitColonSections` coverage.
- `stores/__tests__/countdown.test.ts` [`countdown-pin`] — the display atom's rendered
  string, minute-band stability, `ar` digits, the last-10-minutes rule, the ADR-014 overlay
  target. `stores/__tests__/schedule.test.ts` [`schedule-pin`] — the R11/R12 display table.
- `hooks/__tests__/useCountdown.test.ts` [`usecountdown-pin`] — the hero hook's display
  pass-through. `hooks/__tests__/usePrayerAgo.test.ts` mocks `formatTimeAgo`, so it pins
  composition, not formats, and needs no change.
- `components/countdown/__tests__/Countdown.test.tsx` [`hero-pin`] — the rendered hero
  string under `en` and `ar`, the overlay target, the held `--:--`.
- `__tests__/app/Screen.test.tsx` [`screen-pin`] and
  `components/prayer/__tests__/Ago.test.tsx` — the badge's words and visibility.
- `shared/__tests__/notifications.test.ts` [`notif-pin`],
  `shared/__tests__/prayerIdContract.test.ts` [`contract-pin`],
  `shared/__tests__/i18nBridge.test.ts` [`bridge-pin`] — the reminder copy pins step 3
  reverts for `en` and guards for the other five.

Why the obvious fix is wrong: a git revert of row 63's commits would resurrect the lettered
design in all six languages and delete the colon composer the non-en locales must keep. The
revert is surgical: en branches, en catalog values, en test expectations only.

Concurrency: both formatters and both splitters are pure functions on the JS thread, called
from Jotai display-atom selectors recomputed on the wall-clock ticker's store writes and
from a hook's state computation. The section render adds nested text nodes inside the
existing `Animated.Text`; the per-section colour rides the existing `useDerivedColor`
pattern the prayer rows use. No timer, no worklet, no shared mutable state, no new
interleaving.

Proof (scratch worktree at `194ed701` and at HEAD, deleted before this plan merged): the
reference file's own test values were extracted as the en byte table; the fixed-width
composer was exercised against the ar table below; `splitColonSections` was dry-run against
`'01:32'` (two bright groups), `'00:42:05'` (dim hours group), `'٠١:٣٢:٠٥'`,
`'--:--'` (null), `'1h 1m'` (null), `'1:'` (null); `useDerivedProgress`'s first-evaluation
snap confirmed at `hooks/useAnimation.ts:108-113`.

## 5. Design

The approach: the two formatters become locale-dispatching pairs — the reference lettered
bodies restored verbatim for `en`, fixed-width colon composers for the five other locales —
and the render components split the display string into coloured sections with dim gapped
colons under non-en. Two pure splitters in `shared/time.ts` do the string work; the
components only render what the splitters decide.

The invariant, one sentence a test can check: under `en` every countdown surface emits the
bytes of reference `194ed701`, and under the five other locales `formatTime` emits only
double-digit groups and colons while the timer renders zero groups and every colon dim with
a U+2009 gap on each colon.

Alternatives rejected: a git revert of row 63 (restores letters everywhere, deletes the
composer rule 2 keeps); an `Intl.DurationFormat` call (letters, against rule 2; unavailable
in Hermes at the pinned runtime); sibling text nodes in a row for the gap (RTL child order
flips, the pill loses colour inheritance, screen readers fragment the utterance, D72.4);
a seconds-display toggle change (the showSeconds preference and the 599 s cutoff are row
63's settled contract).

Concurrency trace: no new timers or subscriptions. The display atoms recompute per wall
second exactly as today; the section render is a pure function of the string; the colour
hooks animate on their 0-to-1 targets only (R3.5). Language switches remount the tree
(`localeVersionAtom`, R3.1 of row 39) and RTL crossings relaunch (row 68), so a locale read
at render time is always the locale in force.

Design review: the en byte table is quoted from the reference commit's own passing tests, so
byte-identity is checked against the reference, not against memory; the fixed-width shapes
are fully tabulated; the splitters' guards are total (every non-conforming input returns
null and falls through to today's render); the widget surface is excluded by criterion and
by pre-flight file list.

**Acceptance criteria:**

- [R1.1] WHEN `formatTime` renders under `en` THE SYSTEM SHALL emit the lettered strings
  pinned from reference `194ed701` for every input in step 1's table (`0s`, `45s`, `59s`,
  `5s`, `1m`, `1m 1s`, `1m 30s`, `9m 59s`, `1h`, `1h 1m 5s`, `2h`, `25h`, `23h 59m 59s`,
  `24h`, `25h 1m 1s`, `1h 1m`, `10m`, `2m`)
- [R1.2] WHEN `formatTimeAgo` renders under `en` THE SYSTEM SHALL emit the lettered strings
  pinned from reference `194ed701` (`now`, `1m`, `2m`, `59m`, `1h`, `1h 30m`, `2h`, `2h 1m`)
- [R1.3] WHEN the countdown display atoms and the R11/R12 table render under `en` THE SYSTEM SHALL emit the reference display strings (`1h 1m`, `1h`, `45s`, `1s`, `23h 54m`, `16h 55m`, `2h 5m`, `6h 12m`, `0s`)
- [R1.4] WHEN the hero countdown renders under `en` THE SYSTEM SHALL render one text node
  with no section styling and no gap nodes, the reference render
- [R1.5] WHEN the ago badge renders under `en` THE SYSTEM SHALL render one text node
  reading `Dhuhr 58m ago` shapes with no gap node, the reference render
- [R2.1] WHEN `formatTime` renders seconds hidden under a non-`en` locale THE SYSTEM SHALL emit `HH:MM`
  with hours and minutes both double-digit (`01:32`, `00:42`, `25:00`)
- [R2.2] WHEN `formatTime` renders seconds shown under a non-`en` locale THE SYSTEM SHALL emit `HH:MM:SS`
  with all three groups double-digit (`01:32:05`, `00:42:05`, `00:09:59`)
- [R2.3] WHEN `formatTime` receives zero or negative seconds under a non-`en` locale THE SYSTEM SHALL emit
  the all-zero shown shape `00:00:00`
- [R2.4] WHEN the countdown display atoms render under `ar` THE SYSTEM SHALL draw Eastern
  Arabic-Indic digits with the ASCII colon bytes unchanged (`٠١:٠١`, `٠٢:٥٩:٠٠`)
- [R2.5] WHEN `formatTimeAgo` renders 60 s or more under a non-`en` locale THE SYSTEM SHALL keep row
  63's colon shapes (`0:02`, `1:30`, `2:00`, `2:01`)
- [R3.1] WHEN a timer section's group carries a non-zero digit under a non-`en` locale THE SYSTEM SHALL render it (the colour verified by step 4's transcription; the jest mock cannot read an animated colour)
  in `COLORS.text.primary`
- [R3.2] WHEN a timer section's group is all zeros under a non-`en` locale THE SYSTEM SHALL keep the (colour likewise step 4's transcription)
  group visible and render it in `COLORS.text.muted`, hours included
- [R3.3] WHEN the timer renders under a non-`en` locale THE SYSTEM SHALL render every colon
  in `COLORS.text.muted` regardless of remaining time
- [R3.4] WHEN a section text mounts under a non-`en` locale THE SYSTEM SHALL render its
  settled colour on the first frame
- [R3.5] IF a section's zero state changes THE SYSTEM SHALL animate its colour between
  `COLORS.text.muted` and `COLORS.text.primary` over `ANIMATION.durationSlow` and change
  nothing else
- [R4.1] WHEN the timer renders under a non-`en` locale THE SYSTEM SHALL render each colon
  as U+2009, `:`, U+2009 inside its dim text node
- [R4.2] WHEN the ago badge renders a string carrying exactly one colon under a non-`en` locale THE SYSTEM SHALL render
  that colon as U+2009, `:`, U+2009 inside its own node
- [R4.3] IF the timer's display string is not an all-digit colon shape (`en` lettered strings, `--:--`) THE SYSTEM SHALL render
  it as today's single text node with no gap
  nodes and no section styling, in every locale
- [R4.4] WHEN the ago badge renders a string with no colon or more than one THE SYSTEM SHALL render it
  as today's single text node
- [R5.1] WHEN `splitColonSections` receives a 2 or 3 group string whose groups are all digits, Latin or Eastern Arabic-Indic THE SYSTEM SHALL return
  alternating group and colon
  entries with `dim` true exactly on the all-zero groups and on the colons
- [R5.2] IF a group is empty, carries a non-digit, or the group count is not 2 or 3 THE SYSTEM SHALL return null

- [R6.1] WHEN a reminder notification is titled or a reminder channel named under `en` THE SYSTEM SHALL read `{name}
  in {n}m` and `{name} in {n}m Reminder`, the reference bytes
- [R6.2] WHEN a reminder title or channel label is composed under a non-`en` locale THE SYSTEM SHALL keep row
  63's copy byte-identical (`العصر بعد ١٥` unchanged)
- [R6.3] WHEN the `en` catalog changes THE SYSTEM SHALL carry a re-taken
  `shared/i18n/catalog-lock.json` in the same commit
- [R6.4] WHEN this ticket's commits land THE SYSTEM SHALL contain no change under
  `widgets/`, in `shared/widgetTimeline.ts` or `shared/widgetTypes.ts`, or to
  `getSecondsRemaining`'s body, the wall-clock ticker, or `formatTimeSecondsAware`
- [R7.1] WHEN the mock build runs under `ar` on the 3T inside the final 599 s THE SYSTEM SHALL show the
  hero as three double-digit groups with dim colons and a dim `٠٠` hours group
- [R7.2] WHEN the mock build runs under `ar` on the 3T outside the final 599 s THE SYSTEM SHALL show the
  hero as two double-digit groups with white hours
- [R7.3] WHEN the mock build runs under `en` on the 3T THE SYSTEM SHALL show the lettered
  hero (`Xh Ym`) and the lettered ago badge (`Xm ago`)
- [R7.4] WHEN the mock build runs under `ar` on the 3T after a prayer has passed THE SYSTEM SHALL show the
  ago badge's colon with the thin-space gaps

## 6. Steps

Checklist:

1. Step 1 — the locale-dispatching formatters, the splitters, the full en pin sweep,
   component strings included (`steps/1-formatters-and-pins.md`)
2. Step 2 — the section render: colours, dim colons, gaps (`steps/2-render-treatment.md`)
3. Step 3 — the en reminder copy revert and the catalog lock
   (`steps/3-reminder-copy-en.md`)
4. Step 4 — device proof on the 3T (`steps/4-device-proof.md`)

Scope guard for every step: the files a step lists are the only files it touches. Every
`widgets/` file, `shared/widgetTimeline.ts`, `shared/widgetTypes.ts`, the five non-en
catalogs, `getSecondsRemaining`'s body, the ticker and `formatTimeSecondsAware` are out
(R6.4, D72.7). Step 1 carries every en string rewrite the commit needs to keep the full
suite green under the pre-commit hook; step 2 carries only the new section and gap tests.

## 7. Device proof

Step 4 builds the mock (`$HOME/athan-gitree/BUILD.md` recipe through `build-mock.zsh`,
ends `BUILD-MOCK OK`), checks `aapt2 dump badging <apk> | grep "^package"` prints the
fleettest id, and installs on the 3T (`3T_SERIAL`). The checks, each transcribed into
`$HOME/athan-gitree/sessions/72/` and `LOG.md`:

1. Under `ar`, inside the mock's final window (Asr lands 60 to 119 s after each download):
   the hero reads three double-digit groups, the hours group dim `٠٠`, the colons dim and
   gapped (R7.1, R4.1 on device). A screenshot is read by the reader itself or `vision`;
   the transcription is the record, never the file.
2. Under `ar`, with the clock moved past the final window (next prayer more than 599 s
   away): the hero reads two double-digit groups with white hours (R7.2). Before any clock
   change, read `dumpsys alarm` and name the unexplained app alarm at
   the app alarm at an epoch years in the future is the known mock fixture (recorded at `when 2104803640505` on 2026-10-12); any other unexplained app alarm is a STOP. Restore automatic time afterwards.
3. Under `en`: the hero reads `Xh Ym` and the ago badge reads `Xm ago` (R7.3).
4. Under `ar`, just after a prayer passes: the ago badge colon carries the gaps (R7.4).
5. After the switch to `en`: `dumpsys notification` names the reminder channel
   `... in 5m Reminder` where a reminder channel exists (R6.1 on device). The ar-to-en
   switch is an RTL crossing and relaunches the app (row 68); wait out the relaunch before
   reading.

No clock change runs in check 1, 3 or 4; if any clock change becomes needed anywhere, read
`dumpsys alarm` first and compare against the expected alarms, stopping on an unexplained
one.

## 8. Records

The findings text the executor appends to `LOG.md` under `## Ticket 72 (2026-10-13)`:

```
English reverted byte-for-byte to the reference 194ed701 face: the lettered formatTime and
formatTimeAgo restored as the en branches, the en reminder title and channel label restored,
the en test pins back on the reference values. The five other locales render the fixed-width
timer (HH:MM hidden, HH:MM:SS shown, every group double-digit, zero and negative clamped to
00:00:00) with dim zero groups, always-dim gapped colons, and the row-63 ago shapes with
gapped colons; ar draws Eastern Arabic-Indic digits. Widgets, the non-en catalogs and the
display contract untouched. Catalog lock re-taken; dist regenerated.
```

The queue cell status the lead applies on DONE: `DONE <date>, audited:` followed by the
findings text above, condensed to the queue's sentence shape.

Docs commit message: `<VERSION> - docs(plans): ticket 72 READY: countdown fixed-width
spec, 4 steps`.

## LOG.md ledger contract

Every step entry in `LOG.md` opens with the heading `### Step <NN> — <state>` and ends with
a line `session: <ses_id>`. Planning sections use `## Planning (<date>)` and
`## Ticket <N>`.

## 9. Push

None. The executor worker never pushes. The lead pushes after the reviews pass.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| `catalogLock.test.ts` fails after step 3 | The lock was not re-taken | Run `yarn i18n:lock`, confirm `git diff shared/i18n/catalog-lock.json` shows five changed hashes, re-run the suite |
| `yarn i18n:export` prints a jest trace naming `Object.exit (i18nBridge.test.ts)` | Expected: the bridge writes the file, then exits | Verify `grep '"notification.reminder"' shared/i18n/dist/en.json` prints `"{name} in {n}m"`; that grep is the pass check, not the exit code |
| A widget suite fails after any step | A widget file was edited against R6.4 | Revert the widget edit; rows 67 and 69 own them. `STOP:` if the step's files alone cannot go green |
| `notifications.test.ts` fails on `'العصر بعد ١٥'` | The ar value was "fixed" against D72.7 | Restore the ar value; it must not change (R6.2) |
| The pre-flight reports an anchor count of 2 | A ticket landed that duplicated the anchored text | Return `NEEDS_CONTEXT: NEEDS REPLAN, <anchor and count>`; never repair an anchor |
| A test the plan did not name fails after the rewrites | A display pin this plan missed | Return `NEEDS_CONTEXT: NEEDS REPLAN, <the failing test and its expectation>`; the sweep lists every known pin |
| The thin space renders as tofu on the 3T | The device font lacks U+2009 | Apply the anticipated fix below, rerun the failing checks, record in `LOG.md` |

Anticipated review fixes, word for word:

- A stale comment in `Countdown.tsx` or `shared/time.ts` still saying the hero renders one
  string: rewrite the comment to the two-branch render.
- The docblock example lines in `hooks/usePrayerAgo.ts` left reading `10:15`: restore the
  reference wording `Dhuhr 10h 15m ago` and `Asr 2h 30m ago`.
- The owner vetoes the gap width at audit: in `Countdown.tsx`'s colon node and `Ago.tsx`'s
  gap node, replace each `'\u2009'` with `'\u2009\u2009'` (or with a single U+200A), and
  update the two component pins to match.
- The owner vetoes the 1000 ms fade at audit: in `CountdownSectionText`, change
  `ANIMATION.durationSlow` to `ANIMATION.durationFade`.
- The owner rules the ago badge fixed-width after all: in `formatTimeAgo`'s non-en branch,
  wrap the hours group in `pad2`, and update the ago pins to the `٠٠:٠٢` shapes.
- The ar channel label regression: `shared/__tests__/notifications.test.ts:317` must stay
  `'العصر بعد ١٥'`; restore it if touched.

Restore lists: step 1 reverts `shared/time.ts`, `hooks/usePrayerAgo.ts`,
`shared/__tests__/time.test.ts`, `stores/__tests__/countdown.test.ts`,
`stores/__tests__/schedule.test.ts`, `hooks/__tests__/useCountdown.test.ts`,
`components/countdown/__tests__/Countdown.test.tsx`,
`components/prayer/__tests__/Ago.test.tsx`, `__tests__/app/Screen.test.tsx`; step 2 reverts
`components/countdown/Countdown.tsx`, `components/prayer/Ago.tsx` and the ar/section
additions in the three component test files; step 3 reverts
`shared/i18n/en.ts`, `shared/i18n/catalog-lock.json`,
`shared/__tests__/notifications.test.ts`, `shared/__tests__/prayerIdContract.test.ts`,
`shared/__tests__/i18nBridge.test.ts`; step 4 changes no repository file.

## 11. Subagents

Planning: `explore` workers answer fact questions, `athan-plan-griller` grills the draft.
Delivery: the lead dispatches the `athan-executor` and `athan-reviewer` workers. Every
worker may call `vision` for an image it cannot see. Nothing else, ever.

## 12. Report to the owner

Plain sentences on what changed and what was proven, the progress table, the decisions
waiting on the owner (the four audit-veto rulings in section 2.1: gap width, fade duration,
badge fixed width, held-display colour), the four-line handoff.
