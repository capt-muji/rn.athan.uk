# Next session: the patches we carry, one line of qibla copy, and a repository hygiene check

Written on 2026-10-07 at the close of session 53, for a session that starts with no memory of it. It is row 54 in
`ai/plans/README.md`, and the owner wants it run next, ahead of row 18.

**How it starts.** The owner types: *"Run row 54. Read `ai/plans/NEXT-SESSION-PATCHES-AND-COPY.md` and do it."*
The usual programme applies: plan, execute and audit in one session, every commit through the hook, 100% coverage,
nothing pushed that he has not asked for.

**Read first, in this order:** `ai/AGENTS.md` (the rule on personal and device identifiers, and the Recent Decisions
entry dated 2026-10-07), this file, then `ai/plans/53-qibla-accuracy-gate/AUDIT.md`.

---

## 1. What the owner asked

1. **About the three patches in `patches/`:** what each one is for, whether the app works with and without it,
   whether that was ever tested both ways, and whether a pull request upstream exists or is needed. He believes one
   is already open for `expo-background-task`, and that the `expo-widgets` change may already be in SDK 58.
2. **About the `expo-location` patch in particular:** whether it is specific to a qibla, in which case upstream
   would not want it, or a fix for something broken for every user, and whether it could cause a regression for
   others.
3. **One line of copy on the qibla sheet:** *Just a moment* reads as a loading screen. It is to say
   *Follow below instructions*.
4. **Repository hygiene:** the rule headed "Keep the repository free of personal and device identifiers" in
   `ai/AGENTS.md`.

He asked that the first three wait for this session.

---

## 2. Job A: the three patches. Establish each with evidence, then act

`patches/` holds three files, applied by `patch-package` on every `yarn install` (`package.json`, `postinstall`). A
fresh clone therefore works with no manual step. **Session 53 read only the `expo-location` patch.** The other two
are unread here, and nothing below about them is known: it is what to find out.

| Patch | What the owner believes | What to establish, with the evidence named |
| --- | --- | --- |
| `expo-background-task+58.0.7.patch` | A PR is already open upstream | Read the patch. Find which session made it (`git log -- patches/`, then that plan's `LOG.md`). Find the upstream PR and its state. If it is merged and released, say which version carries it, and whether the patch can go now or at row 18 |
| `expo-widgets+58.0.5.patch` | It may already be merged in SDK 58 | Read the patch. Compare it against the installed `expo-widgets` and against the latest published one. If upstream already has the change, delete the patch and prove the widgets still build and render |
| `expo-location+58.0.9.patch` | Unsure what it is for, and whether it was tested both ways | The four hunks below |

**The `expo-location` patch, hunk by hunk, as session 53 read it:**

| Hunk | What it changes | What it is for |
| --- | --- | --- |
| Android, the sensor rate | `SENSOR_DELAY_NORMAL` to `SENSOR_DELAY_GAME` for the magnetometer and the accelerometer | A smoother heading |
| Android, the event gate | Removes the rule that a heading is sent only after about 2 degrees of change AND 50ms. The 50ms stays | The 2 degree rule starved a slow, careful turn: under one event a second |
| Android, `expo-module.config.json` | Removes the `publication` block | So the module is compiled from source, which is what lets the Kotlin hunks take effect |
| iOS, the heading filter | `kCLHeadingFilterNone` | The default 1 degree filter rejected every reading of a stationary phone |

**Was it tested with and without? Yes, by session 50**, whose whole purpose was to isolate these changes:
`ai/plans/50-which-patch-fixed-it/VERDICT.md` and `MEASURED.md`. Read both before answering him.

**What session 53 changed about its need, and this is the real question to answer:**

1. **An Android phone that carries Google's fused sensor no longer starts `expo-location`'s heading at all.** So
   the three Android hunks now reach only a phone without that sensor, and such a phone is never drawn a compass
   (`53-qibla-accuracy-gate/steps/5-vouched-or-nothing.md`, part 4.1). **The Android half of the patch may be dead.**
   Prove it either way: build without those hunks, and show a fused phone is unaffected.
2. **The iPhone line is believed still needed,** because the iPhone's heading still comes through `expo-location`.
   It has not been tested with and without since session 50. **The iPhone compass is LOCKED**, so a build without
   the line is a test build only, and it ships only on his word.

**Is it specific to a qibla? No, and say so plainly.** Each hunk corrects something any compass in any app meets:
a heading that stops updating on a slow turn, a stationary phone that gets no readings, and (two more, found by
sessions 48 and 49 and not in the patch) an `onAccuracyChanged` with no sensor-type guard, so the accuracy an app
receives is usually the accelerometer's, and an iOS accuracy in degrees that is bucketed into 0 to 3.

**Would it regress other users? It could, as written.** Removing a filter raises the event rate for every app, which
costs battery and JavaScript time. So what is offered upstream should be an OPTION a caller sets, with today's
behaviour as the default, not a changed default. That is row 51 of the queue, and its evidence is in
`ai/plans/48-qibla-heading-accuracy/`, `49-qibla-native-heading/` and `50-which-patch-fixed-it/`.

**The rule for anything posted upstream** (owner, standing): no app name, no repository link, no device serial, no
secret, and nothing the hygiene rule in `ai/AGENTS.md` excludes.

**What to hand him at the end of Job A:** one table, three rows, with for each patch what it does, whether it is
still needed, whether an upstream PR exists and in what state, and what he should do, if anything.

---

## 3. Job B: one line of copy on the qibla sheet

*Just a moment* becomes ***Follow below instructions***. That wording is his. The reason: the old line reads as a
loading screen, and the screen is now asking the user to do something.

**The compass is LOCKED on both platforms** (`ai/AGENTS.md`, 2026-10-07). This is the ONE change he has approved to
it. Change nothing else on the sheet.

| What | Where |
| --- | --- |
| The line | `QiblaSubtitle` in `components/sheets/screens/Qibla.tsx` |
| The trap | The two subtitles are stacked and cross-faded, and the LONGER one must be the one left in flow, because an absolutely positioned line contributes no width. Its comment and the test *leaves the longer subtitle in flow* explain it. The new line is longer than the old one, so measure the two lines that will now be stacked and keep the wider in flow |
| The tests | Every test in `Qibla.test.tsx` that names *Just a moment*, by text. The one-line cap stays |
| The proof | A build on a phone, read by the session: the line is whole, on one line, and the header does not change height when the compass arrives |

---

## 4. Job C: the repository hygiene check

1. **Check the tracked files against the rule** in `ai/AGENTS.md`, "Keep the repository free of personal and device
   identifiers". Fix what breaks it. Report what was found to the owner in the session, never in a file.
2. **Re-create the build worktrees** under `$HOME/athan-device-sweep/worktrees/` from the current remote before the
   first build. They were made from an earlier state of the branches.
3. **Ask him one thing:** comments in the code that say "the owner" name a role. Does he want them reworded?

---

## 5. What is locked, and what is recorded but not built

- **Both platforms of the qibla compass are locked.** No behaviour changes without his word. Job B is the exception
  he named.
- **Two small defects and three findings are recorded and deliberately unbuilt:**
  `ai/plans/53-qibla-accuracy-gate/AUDIT.md`, findings 7 and 8.
- **The hint's drawing is to be redesigned in a later session**, on his word of 2026-10-06. It is listed in
  `ai/plans/README.md` under what waits on him.

## 6. The phones at the close of session 53

| Phone | Build |
| --- | --- |
| OPPO Find X8 | 1.29.258, production |
| OnePlus 8T | 1.29.258, production |
| OnePlus 3T | 1.29.256, a mock build with invented prayer times |
| Samsung Galaxy S23 | 1.29.256, the same |
| iPhone XS | 1.29.256 |

The compass code in 1.29.256 and 1.29.258 is the same. Everything after 1.29.256 is records and test clean-up.
