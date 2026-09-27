# Plan: Session 29. D6. Help: one modal answering "why did I not hear the athan?"

| Field | Value |
| --- | --- |
| Brief | `ai/prompts/help-faq-sheet.md`, with the owner's 2026-09-27 amendments in section 2.1 |
| Planned at | `a3f8812c` (version 1.29.7), 2026-09-27 |
| Planned by | Planning session on 2026-09-27 |
| Needs first | 28 |
| Steps | 2, each one branch, one commit, one version |
| Device | iOS simulator only (owner, 2026-09-27: the physical phones are unplugged) |
| Owner decisions still needed | None (every one was taken while planning; see section 2) |

## 1. Goal

Four separate causes of a silent phone have each been chased as their own defect across several sessions, and
three of them cannot be fixed in code at all: they are OS settings only the user can change. So the app stops
trying to fix them silently and explains them instead. When this plan is DONE, Settings' "About" card is called
"Other" and carries a **Help** row beneath What's new, opening a modal that answers ten questions in
platform-aware words, with a button on each answer that has a settings screen to open, and a **Close** button.
The owner would notice by opening Settings, tapping Help, reading the answers, scrolling them on a small screen,
and pressing Close. A Help item also joins the What's New archive, parked until the store release stamps it.

The owner's rules that apply:

🐋  "I have decided to make it a modal. It needs to be quite long, but take it to consideration, the different
screen sizes and the button should say close. And Feel free to add more Q and A options there as well."
(owner, 2026-09-27)

🐋  "Keep comments very compact and very small, only write the why, not the how not the what, because the last 2
should be evident in the code base." (owner, 2026-09-27)

🐋  "Do all your testing on the simulator. Don't bother on the real phones. In fact, I'm just disconnecting the
real phone. Now, do all your testing on iOS simulator." (owner, 2026-09-27)

🐋  "and then also add this new feature into the what's new section as well." (owner, 2026-09-27)

Plus the standing rules: visuals are settled and only the owner changes them, so this plan adds new surfaces and
changes no existing pixel; the writing style in `ai/AGENTS.md` section 8 governs every word a user reads (no em
dashes, no arrows, no exclamation marks, no emoji, short full sentences); comments explain why only; and
**this page cannot lie**, so every claim it makes is one an earlier session measured.

## 2. Decisions

### 2.1 Taken

1. **It is a MODAL, not a second bottom sheet** (owner, 2026-09-27, overriding the brief's "Where it lives"
   section, which chose a sheet). The brief's reasoning was consistency with `Sound.tsx`'s `stackBehavior='push'`;
   the owner overrode it directly. Recorded here and in `ai/prompts/README.md`.
2. **The card reuses `components/modals/Modal.tsx` untouched.** It already centres, caps at
   `SIZE.modal.maxWidth` (400), takes `LAYOUT.modal.width` (85%), carries `accessibilityViewIsModal`, and matches
   the sheets' motion. Rejected: a new card, which would duplicate the backdrop, the motion and the a11y
   attribute, and drift from the other two modals.
3. **The answers scroll inside the card, capped at 55% of the window height** (planner, from the owner's
   "quite long" plus "different screen sizes"). A `ScrollView` whose `maxHeight` is
   `height * ANSWERS_HEIGHT_SHARE` keeps the card and its Close button on screen on the shortest phone this app
   supports while letting a tall screen show more without changing the layout. Rejected: a fixed pixel height,
   which either clips on a small screen or wastes a large one; and no scrolling at all, which pushes Close off
   screen with ten answers.
4. **The button says "Close"** (owner, 2026-09-27). It takes the same shape as What's New's Continue button,
   so the three modals' primary buttons stay identical.
5. **Ten questions, not the brief's five** (owner: 🐋  "Feel free to add more Q and A options there as well").
   The five from the brief, reordered so background activity sits second, plus five more, each answerable from
   something an earlier session measured: a reboot clearing alarms (Android only, `ai/AGENTS.md` [2026-09-23]),
   a quiet athan from the alarm volume (Android only, session 27 finding 3), a stale widget and the 3-day
   horizon (session 20), how far ahead alerts reach (session 28), and how to change the athan sound. Nothing is
   claimed that no session measured.
6. **The content is platform-aware, and two questions exist on one platform only** (brief's "Care" section:
   "iOS and Android differ on every one of the five"). `shared/help.ts` holds one entry per question with an
   `ios` and an `android` answer, and `null` where the question does not arise on that platform. So iOS gets 8
   topics and Android 10.
7. **Two deep links, both already proven in this codebase.** `openDndAccessSettings` in
   `device/notifications.ts` (session 27, Android only), and a new `openAppSettings` wrapping
   `Linking.openSettings()`, the same call `showSettingsDialog` in `hooks/useNotification.ts` already makes.
   Rejected: putting the `Linking` call in the component, because every other platform call in this app goes
   through `device/`.
8. **The Help row lives in a card renamed "Other", and only the What's new ROW is gated on
   `VISIBLE_WHATS_NEW`** (brief: "`VISIBLE_WHATS_NEW` being null must not hide Help"). Today that constant gates
   the whole card.
9. **The Help row reuses the What's new row's styles and its 150ms close-then-open handler.** The `?` glyph is
   drawn as text inside the existing circular `infoButton`, the way the `♪` glyph already is beside Change athan.
   Rejected: a new SVG asset, because one glyph does not earn a file, and `assets/icons/svg/` has no `?`.
10. **The What's New item is PARKED at `version: null`** (owner asked for the item; the archive's own rule,
    `shared/whatsNew.ts` lines 65 to 73, is that whether a release gets a modal is the owner's editorial call,
    stamped at the store release). Adding it stamped would announce it from the next local build.
11. **No physical-device proof. The iOS simulator is the whole device proof** (owner, 2026-09-27). Section 7
    gives it. The Android-only content is proven by the suites, which run both platforms.
12. **No `logger` call in the Help path.** Nothing here can fail in a way a log would explain: the two openers
    already log their own failures.

### 2.2 The executor must not decide

1. **Any anchor count other than 1.** STOP. Ask: "Anchor `<file>` for step `<k>` counts `<n>`, not 1. The plan
   is stale. Shall I mark the row NEEDS REPLAN?"
2. **A test failing that the plan does not expect.** STOP. Ask: "`<test name>` failed with `<the exact line>`,
   which the plan does not predict. What should it be?"
3. **A break printing `BREAK NOT APPLIED`.** STOP. Ask: "Break `<label>` changed nothing, so it proves nothing.
   The plan's substitution does not match the code. How should it be fixed?"
4. **A review finding that section 10 does not answer and that does not meet all three conditions in
   `EXECUTOR-BRIEF.md` section 4, item 8.** STOP and give the finding in your own words.
5. **Anything the step does not answer.** STOP. Ask: "The plan does not say `<X>`. What should it be?"
6. **Any wording change to a string a user reads.** Every such string is given verbatim in this plan. STOP.
   Ask: "The plan's text for `<question>` reads `<text>`. You asked for different words. What should it say?"
7. **Anything touching visuals beyond the new surfaces, prayer times, `releases.json`, `uat` or EAS.** STOP.
8. **A claim the Help content would make that no session measured.** STOP. Ask: "Answer `<question>` would
   claim `<X>`, which no session measured. Shall it be dropped?"

## 3. Pre-flight

Save to `$TMPDIR/preflight-29.sh` and run `bash $TMPDIR/preflight-29.sh <k>`, where `<k>` is the first step in
section 6's checklist not ticked DONE (1 for a new plan).

```bash
#!/usr/bin/env bash
set -u
STEP="${1:?usage: preflight-29.sh <step>}"
REPO=/Users/muji/repos/rn.athan.uk
PLAN="$REPO/ai/plans/29-help-faq-modal"
fail() { echo "PREFLIGHT FAILED: $*"; exit 1; }

cd "$REPO" || fail "checkout missing"
[ "$(git rev-parse --show-toplevel)" = "$REPO" ] || fail "wrong checkout"
[ "$(git branch --show-current)" = "uat-2" ] || fail "not on uat-2"

DIRTY=$(git status --porcelain | grep -v -E 'ai/plans/README\.md|ai/plans/29-help-faq-modal/(PLAN|LOG)\.md' || true)
[ -z "$DIRTY" ] || fail "tree holds more than the plan files: $DIRTY"

git fetch -q origin uat-2 || fail "fetch failed"
git merge-base --is-ancestor origin/uat-2 uat-2 || fail "uat-2 is behind origin/uat-2"

echo "package.json version: $(node -p 'require("./package.json").version')"

grep -q '^| 28 | D3. Rolling buffer' ai/plans/README.md || fail "row 28 missing"
grep '^| 28 | D3. Rolling buffer' ai/plans/README.md | grep -q 'DONE' || fail "row 28 is not DONE"

count() {
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2"
}
check() {
  n=$(count "$PLAN/scripts/anchors/$1" "$REPO/$2")
  echo "anchor $1 in $2: $n"
  [ "$n" = "1" ] || fail "anchor $1 counts $n, not 1 (NEEDS REPLAN)"
}

if [ "$STEP" -le 1 ]; then
  check 1-1.txt components/modals/Modal.tsx
  check 1-2.txt stores/ui.ts
  check 1-3.txt stores/ui.ts
  check 1-4.txt app/index.tsx
  check 1-5.txt components/modals/index.ts
fi
if [ "$STEP" -le 2 ]; then
  check 2-1.txt components/sheets/screens/Settings.tsx
  check 2-2.txt components/sheets/screens/Settings.tsx
  check 2-3.txt shared/whatsNew.ts
fi

xcrun simctl list devices available | grep -q 'iPhone' || fail "no iOS simulator available"
echo "PREFLIGHT OK"
```

An anchor count other than 1 means NEEDS REPLAN. Any other failure means STOP.

## 4. Background the executor needs

### Code map

| File | What it does | This plan |
| --- | --- | --- |
| `components/modals/Modal.tsx` | The white card every modal opens in: backdrop, slide-in motion, `accessibilityViewIsModal`, title above children | Read only. Anchor `1-1.txt` proves its width cap and padding are what the new modal inherits |
| `components/modals/WhatsNew.tsx` | The What's New modal: version, item list, Continue button | Read only. The new modal copies its button shape |
| `components/modals/Update.tsx` | The update prompt | Read only |
| `components/modals/index.ts` | Barrel for the three modals | Step 1 adds `ModalHelp` |
| `components/modals/Help.tsx` | Does not exist | Step 1 creates it |
| `shared/help.ts` | Does not exist | Step 1 creates it: the content and the platform split |
| `device/notifications.ts` | Notification scheduling plus `openDndAccessSettings` (session 27) | Step 1 adds `openAppSettings` |
| `stores/ui.ts` | Ephemeral and persisted UI atoms, and the sheet and popup actions | Step 1 adds `popupHelpEnabledAtom` and `setPopupHelpEnabled` |
| `app/index.tsx` | The launch screen; mounts the two modals behind `chromeDeferred` | Step 1 mounts the Help modal and gates the update nag on it |
| `components/sheets/screens/Settings.tsx` | The settings sheet, including the About card gated on `VISIBLE_WHATS_NEW` | Step 2 renames the card and adds the Help row |
| `shared/whatsNew.ts` | The What's New archive and its display rules | Step 2 adds one parked item |
| `hooks/useWindowDimensions.ts` | Re-exports React Native's live hook | Read only. Step 1's modal reads `height` from it |

### Anchors

Each is stored in full under `ai/plans/29-help-faq-modal/scripts/anchors/`, verified to count exactly 1 at
`a3f8812c`. The line numbers are a hint only; find each place by its text.

| Anchor | File | Line at Planned at | What it locates |
| --- | --- | --- | --- |
| `1-1.txt` | `components/modals/Modal.tsx` | 70 | The card's `modal` style, proving the width cap the new modal inherits |
| `1-2.txt` | `stores/ui.ts` | 81 | The What's New atom, above which the Help atom goes |
| `1-3.txt` | `stores/ui.ts` | 196 | The What's New setter, above which the Help setter goes |
| `1-4.txt` | `app/index.tsx` | 221 | The update prompt's mount and its gate |
| `1-5.txt` | `components/modals/index.ts` | 1 | The modal barrel |
| `2-1.txt` | `components/sheets/screens/Settings.tsx` | 123 | The About card's comment, gate and title |
| `2-2.txt` | `components/sheets/screens/Settings.tsx` | 136 | The What's new row's tail and the card's close |
| `2-3.txt` | `shared/whatsNew.ts` | 106 | The last archive item, after which the Help item goes |

### How the pieces interact

| Event | Order |
| --- | --- |
| Tap Help in Settings | `handleHelpPress` fires a Medium haptic, dismisses the settings sheet, then after 150ms sets `popupHelpEnabledAtom` true. The 150ms is what the What's new row already uses, so the sheet's close animation finishes before the modal slides in |
| The modal mounts | `app/index.tsx` renders `<ModalHelp>` behind `chromeDeferred`, which is true from one frame after the first content commit. `Modal` returns `null` while `visible` is false, so nothing is drawn until the atom flips |
| Press Close | `handleCloseHelp` sets the atom false; `Modal` unmounts through its exit animation |
| An answer's button | Calls `openAppSettings` or `openDndAccessSettings`. Both are `async` and swallow their own failure, and neither is awaited by the component, because nothing on screen changes either way |
| The update nag | Already held back while What's New shows. Step 1 adds Help to that gate, so the nag cannot stack on either |

Nothing here is concurrent with scheduling, the prayer data or the widgets. The modal reads no prayer data and
writes no preference.

### Existing tests over this code

| Suite | What it proves |
| --- | --- |
| `components/modals/__tests__/Modal.test.tsx` | The card shows nothing while invisible, and its title and children while visible |
| `components/modals/__tests__/WhatsNew.test.tsx` | The What's New modal's version, items, badges and Continue |
| `components/sheets/screens/__tests__/Settings.test.tsx` | The athan and What's new rows, every display toggle, the decorations season, the music glyph's per-platform size. Its `jest.mock('@/shared/whatsNew')` replaces the module with a getter, so a release with and without notes are both testable |
| `__tests__/app/index.test.tsx` | The launch screen: What's New's showing and closing, the update prompt and its What's New gate, the settling window |
| `stores/__tests__/ui.test.ts` | Each atom's default and each action's write. Its `mockDefaultStoreSet` observes the write rather than reading the atom back |
| `device/__tests__/androidChannelUpdate.test.ts` | `updateAndroidChannel` per sound index, and `openDndAccessSettings` on Android, on a phone without the screen, and on iOS |
| `shared/__tests__/whatsNew.test.ts` | The display rules, and the archive's shape, limits and per-item validity. Its content contract iterates `WHATS_NEW.items`, so a new item is covered by the existing `it.each` rows automatically |

### Why the obvious simple fix is wrong

Putting the content inline in the component would be shorter by one file and untestable as content: a
platform-aware list of ten answers, two of which exist on one platform only, is a rule
(`getHelpTopics(os)`) rather than markup, and a `unit` suite can check that rule in milliseconds while a
`components` suite pays a render for every assertion. The split also keeps `Platform.OS` read in exactly one
place, the component, so `shared/help.ts` stays pure and needs no platform harness.

## 5. Design

**The chosen approach.** One pure content module plus one presentational modal. `shared/help.ts` owns the
questions, the two answers each, and which deep link each offers; `components/modals/Help.tsx` renders the
platform's topics inside the existing `Modal`, in a height-capped `ScrollView`, with a Close button.

**The invariant, as one sentence a test can check:** every topic `getHelpTopics(os)` returns for a platform is
rendered, in order, with a button for each action it declares and none for the answers that declare none, and
`dndAccess` is offered on Android only.

**Alternatives rejected.**

| Alternative | Why not |
| --- | --- |
| A second bottom sheet, as the brief specified | The owner chose a modal on 2026-09-27 |
| A new card component instead of reusing `Modal` | Duplicates the backdrop, motion and `accessibilityViewIsModal`, and drifts from the other two modals |
| Content inline in the component | The platform split is a rule; a pure module tests it without a render, and keeps `Platform.OS` in one place |
| A fixed pixel height for the answers | Clips on a small screen or wastes a large one. A share of the window height answers both |
| One set of words for both platforms | The brief forbids it: "Do not write one set of words and hope." The settings, the names and even the mechanisms differ |
| Reading live DND, silent and background state to show status rows | CLOSED by the owner on 2026-09-26 (`27-silent-mode-bypass/FINDINGS.md`): the reads are unavailable or hardcoded, and the panel would rot. Explaining is the remedy |
| Stamping the What's New item with a version now | The archive's own rule leaves that to the store release. A stamped item announces itself from the next local build |

**The concurrency trace.** Nothing in this plan is concurrent. The modal's only writes are one boolean atom in
each direction; the two openers are fire-and-forget platform calls that log their own failures. No caller of
`refreshNotifications`, the background task, the alert sheet commit or the widget push is touched, and no
scheduling path reads the new atom.

**Built and measured before it was specified.** The whole change was built in a scratch worktree at `a3f8812c`,
with `node_modules` symlinked, and then deleted. What it reported, and what this plan therefore promises:

| Measurement | Result |
| --- | --- |
| `npx tsc --noEmit` | exits 0 |
| `npx biome check . --error-on-warnings` | exits 0 |
| `yarn validate` | `Test Suites: 173 passed`, `Tests: 2 skipped, 4750 passed, 4752 total`, and 100% on statements, branches, functions and lines |
| Step 1's 13 breaks | all caught, `ALL AS EXPECTED: 1` |
| Step 2's 8 breaks | all caught, `ALL AS EXPECTED: 1` |
| The two new suites' reds | `Cannot find module '../help'` and `Cannot find module '../Help'` |

**Three defects the spike found, which the plan now prevents:**

1. **`it.each(['ios', 'android'])` over `Platform.OS` fails tsc**: `error TS2322: Type 'string' is not assignable
   to type '"android" | "ios" | ...'`. The step files say `as const` every time, and a green Jest run does not
   catch it, because Jest only transforms.
2. **A break exposed a missing test.** Flipping `{action ? (` to `{true ? (` rendered a button on all nine
   answers instead of three, and every test still passed: the suite asserted which buttons existed, never how
   many. A counting test was added, and the break is caught. **The break is what found it, which is the whole
   reason breaks are written before the code is trusted.**
3. **`UNSAFE_getByType` and `root.findByType` do not exist in React Native Testing Library 14.** Both throw
   `is not a function`. `screen.root`'s prototype offers `queryAll` alone, and a `ScrollView` renders as the
   host type `RCTScrollView`, so the step specifies that query.

**The design review** (planning session, 2026-09-27, read cold against the code map and the brief). What it
found, and what changed:

1. **The brief's claim that Android "still plays through the switch in most cases since 1.28.47" is false**, and
   the brief itself contradicts it two files later. Session 27's own conclusion is that
   `NotificationManagerService` gates channel sound on ringer mode BEFORE reading the channel's
   `AudioAttributes`, so no configuration sounds through silent mode. Writing the brief's sentence would have
   made this page lie on its most sensitive answer. The answer now says plainly that no app setting can play
   through it, on both platforms.
2. **"Notifications are turned off" and "background activity is off" are not equally likely**, and the brief's
   order put background second only by accident. Kept second deliberately: it is the one failure a user cannot
   see, and session 27 records the 8T going silent that way for 18 app opens.
3. **`Linking.openSettings()` had no `device/` wrapper**, so the component would have been the first in this
   codebase to call a platform API directly. Added `openAppSettings` beside `openDndAccessSettings`, which also
   gives it the same swallow-and-log failure shape.
4. **The update nag could stack on Help.** `app/index.tsx` already gates it on `whatsNewVisible`; Help needed
   the same gate or a user opening Help within the first 24 hours of a new store version could get the nag on
   top of it.
5. **Ten answers do not fit a phone.** The card is `LAYOUT.modal.width` (85%) and capped at 400, with
   `SPACING.xxl` padding: ten questions and answers is far past a small screen's height, and without scrolling
   the Close button leaves the screen. Hence the capped `ScrollView`, which is also what the owner's "different
   screen sizes" asks for.
6. **A `HelpTopic`'s `action` is optional, so the component must not index the label map with `undefined`.**
   Destructuring the topic and branching on `action` before the lookup keeps that impossible without a cast.

## 6. Steps

- [ ] Step 1: The Help modal and its content (specified)
- [ ] Step 2: The Other card, the Help row and the What's New item (specified)

---

### Step 1: The Help modal and its content

0. **Anchor check.** Run, from `/Users/muji/repos/rn.athan.uk`:

   ```bash
   bash $TMPDIR/preflight-29.sh 1
   ```

   Every anchor line must print `1`, and the script must end `PREFLIGHT OK`. Any count other than 1 means
   NEEDS REPLAN.

1. **Goal:** a Help modal, mounted on the launch screen, that answers the platform's questions and opens the
   settings screen each answer names.

2. **Branch:** `git checkout -b feat/29-help-modal uat-2`

3. **Files:**
   - `shared/help.ts` (new)
   - `shared/__tests__/help.test.ts` (new)
   - `components/modals/Help.tsx` (new)
   - `components/modals/__tests__/Help.test.tsx` (new)
   - `components/modals/index.ts`
   - `device/notifications.ts`
   - `device/__tests__/androidChannelUpdate.test.ts`
   - `stores/ui.ts`
   - `stores/__tests__/ui.test.ts`
   - `app/index.tsx`
   - `__tests__/app/index.test.tsx`
   - `app.json`, `package.json` (version)

   Nothing else may change, apart from `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.

4. **Tests first (red).** Write these suites before the change. The full test specification is in
   `steps/1-help-modal.md` part 4.

   Command:

   ```bash
   npx jest shared/__tests__/help.test.ts device/__tests__/androidChannelUpdate.test.ts stores/__tests__/ui.test.ts --watchman=false --selectProjects=unit
   npx jest components/modals/__tests__/Help.test.tsx __tests__/app/index.test.tsx --watchman=false --selectProjects=components
   ```

   Expected before the change: `shared/__tests__/help.test.ts` and
   `components/modals/__tests__/Help.test.tsx` both fail to run, with
   `Cannot find module '../help' from 'shared/__tests__/help.test.ts'` and
   `Cannot find module '../Help' from 'components/modals/__tests__/Help.test.tsx'`. The three edited suites fail
   on the names they import: `openAppSettings`, `popupHelpEnabledAtom`, `setPopupHelpEnabled`. If any of them
   passes, STOP.

5. **Change.** The contracts are in `steps/1-help-modal.md` part 5.

6. **Green.** The same two commands; every named test passes. Then `npx tsc --noEmit` and
   `npx biome check . --error-on-warnings`, both exiting 0.

7. **Breaks.** `scripts/breaks-1.sh`, run with `bash ai/plans/29-help-faq-modal/scripts/breaks-1.sh` from the
   repository root. It must end `ALL AS EXPECTED: 1`.

8. **Version and commit.** See `steps/1-help-modal.md` part 8.

9. **Review.** See `steps/1-help-modal.md` part 9.

10. **Merge.**
    `git checkout uat-2 && git merge --no-ff feat/29-help-modal -m "Merge feat/29-help-modal into uat-2: the Help modal, its content and its two settings links"`

11. **Done when:**
    - `npx jest components/modals/__tests__/Help.test.tsx --watchman=false --selectProjects=components` prints
      `Tests:       10 passed, 10 total`;
    - `bash ai/plans/29-help-faq-modal/scripts/breaks-1.sh` ends `ALL AS EXPECTED: 1`;
    - `git log --oneline -1 uat-2` names the merge above.

---

### Step 2: The Other card, the Help row and the What's New item

0. **Anchor check.** Run `bash $TMPDIR/preflight-29.sh 2`. Every anchor must print `1`.

1. **Goal:** Settings' About card becomes "Other" and carries a Help row beneath What's new, which stays
   reachable on a silent release; the archive gains a parked Help item.

2. **Branch:** `git checkout -b feat/29-help-row uat-2`

3. **Files:**
   - `components/sheets/screens/Settings.tsx`
   - `components/sheets/screens/__tests__/Settings.test.tsx`
   - `shared/whatsNew.ts`
   - `app.json`, `package.json` (version)

   Nothing else, apart from `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.

4. **Tests first (red).** Specification in `steps/2-help-row.md` part 4. Command:

   ```bash
   npx jest components/sheets/screens/__tests__/Settings.test.tsx --watchman=false --selectProjects=components
   ```

   Expected before the change: `keeps Help reachable on a release with no notes to show` fails with
   `Unable to find an element with text: Other`, and
   `closes itself, then opens Help once the close has had time to finish` fails with
   `Unable to find an element with accessibilityLabel: Help`. Every other test in the file passes. If either
   passes, STOP.

5. **Change.** Contracts in `steps/2-help-row.md` part 5.

6. **Green.** The same command; `Tests:       15 passed, 15 total`. Then `npx tsc --noEmit` and
   `npx biome check . --error-on-warnings`, both exiting 0.

7. **Breaks.** `scripts/breaks-2.sh`, ending `ALL AS EXPECTED: 1`.

8. **Version and commit.** See `steps/2-help-row.md` part 8.

9. **Review.** See `steps/2-help-row.md` part 9.

10. **Merge.**
    `git checkout uat-2 && git merge --no-ff feat/29-help-row -m "Merge feat/29-help-row into uat-2: the Other card, the Help row and the What's New item"`

11. **Done when:**
    - `npx jest components/sheets/screens/__tests__/Settings.test.tsx --watchman=false --selectProjects=components`
      prints `Tests:       15 passed, 15 total`;
    - `bash ai/plans/29-help-faq-modal/scripts/breaks-2.sh` ends `ALL AS EXPECTED: 1`;
    - `node -p "require('./shared/whatsNew.ts')"` is NOT run (it is TypeScript); instead
      `npx jest shared/__tests__/whatsNew.test.ts --watchman=false --selectProjects=unit` prints
      `Tests:       49 passed, 49 total`.

## 7. Device proof

**iOS simulator only** (owner, 2026-09-27: the physical phones are unplugged). No APK, no `devcheck.py`, no
clock change, and therefore no `dumpsys alarm` reading, because nothing in this plan arms, cancels or reads an
alarm: it adds a modal, a settings row and an archive item. The alert paths, the scheduling lock and the widget
pushes are untouched.

Run this after step 2 is merged.

1. **Boot and build.** From `/Users/muji/repos/rn.athan.uk`, in the background with a log:

   ```bash
   xcrun simctl boot "iPhone 17 Pro Max" 2>/dev/null; xcrun simctl bootstatus "iPhone 17 Pro Max" -b
   npx expo run:ios --device "iPhone 17 Pro Max" > $TMPDIR/sim-29.log 2>&1
   ```

   Expected: the log ends with the app launching. A build failure line is a STOP.

2. **Reach the Help modal.** Use `mobile-mcp`: `mobile_list_available_devices`, then
   `mobile_list_elements_on_screen`, then tap the settings button, then the `Help` row. Tapping by ref, not by
   coordinate, because `mobile-mcp` sees this app's own hierarchy (the device-atlas fallback in
   `EXECUTOR-BRIEF.md` section 5 is for screens a structured reader cannot see, which this is not).

3. **The three readings**, each from `mobile_list_elements_on_screen` or one screenshot the executor reads
   itself (or asks `vision`, with the exact question given):
   - **R1. The modal is up and headed Help.** Expect an element with text `Help` and one with text
     `Are notifications turned on for Athan?`. Question for `vision` if needed: "Does this screenshot show a
     white card titled Help with a question about notifications beneath it? Answer yes or no, and quote the
     first question you can read."
   - **R2. Close is on screen, below the answers, without scrolling.** Expect an element with label `Close`.
     Question if needed: "Is there a black button reading Close visible at the bottom of the white card?
     Answer yes or no."
   - **R3. The answers scroll and the Android-only questions are absent.** Scroll the card to its end with
     `mobile_swipe_on_screen`, then read the elements. Expect `Can I change the athan sound?` to be reachable,
     and `I restarted my phone and heard nothing.` to be absent on iOS.

4. **The link, without leaving the proof.** Tap `Open Settings` on the first answer. Expect the iOS Settings app
   to come to the front. Return with `mobile_launch_app` on `com.mugtaba.athan`. This proves the wiring reaches
   the platform; the call itself is already covered by the suites.

5. **Evidence.** Save each element listing and screenshot under `~/athan-device-sweep/session29/`, named
   `r1-modal.*`, `r2-close.*`, `r3-scrolled.*`, `r4-settings.*`.

**The phone left behind:** nothing changes on either physical phone, because neither is used. The simulator is
left booted with the app installed; no automatic-time setting is touched anywhere.

## 8. Records

### Findings text

Append to `ai/features/uat-2/AUDIT-FINDINGS.md`, under the exact heading
`## D6: the Help modal (session 29)`:

```markdown
## D6: the Help modal (session 29)

Settings' About card is now "Other" and carries a Help row beneath What's new, opening a modal that answers
<TOPIC_COUNT_IOS> questions on iOS and <TOPIC_COUNT_ANDROID> on Android. Three of the causes it explains cannot
be fixed in code: they are OS settings only the user can change, which sessions 27 and 25 established and the
owner accepted.

The owner chose a modal over the brief's second bottom sheet (2026-09-27), asked for more questions than the
brief's five, and asked for a Close button and for the card to hold on every screen size. The answers scroll
inside the existing modal card, capped at 55% of the window height.

**The brief's own copy would have made the page lie.** It said Android "still plays through the switch in most
cases since 1.28.47", while session 27's conclusion is the opposite: `NotificationManagerService` gates channel
sound on ringer mode BEFORE it reads the channel's `AudioAttributes`, so no configuration sounds through silent
mode on either platform. The shipped answer says that plainly.

Two questions exist on one platform only, because the cause does: a restart clearing every alarm
(`ai/AGENTS.md` [2026-09-23]) and the athan playing at alarm volume (session 27, open item 3) are Android's.

`VISIBLE_WHATS_NEW` now gates the What's new ROW alone, so a silent release can no longer take Help with it.

Proven on the iOS simulator, the owner having unplugged both phones: the modal opens from the Help row, reads
its first question, keeps Close on screen, scrolls to its last answer, shows neither Android-only question, and
its Open Settings button brings the iOS Settings app to the front. Suite: <TESTS_AFTER>, coverage 100% on all
four measures.
```

### Table rows

The executor sets the `ai/plans/README.md` row 29 status to EXECUTED, keeping the rest of the row.

The auditor, on PASS, adds this line to `ai/prompts/README.md`'s "Closed prompts (index)", in the list's order:

```markdown
- 29. `help-faq-sheet.md` — DONE 2026-09-27 — the Help modal: ten questions answering why an athan was not
  heard, platform-aware, with deep links to the app's own settings and to Android's Do Not Disturb access.
  A MODAL on the owner's ruling, not the brief's second sheet, with a Close button and its answers scrolling
  inside a height-capped card. The brief's Android silent-mode sentence was contradicted by session 27's own
  conclusion and was corrected before it shipped. `VISIBLE_WHATS_NEW` now gates the What's new row alone, so
  Help survives a silent release. Proven on the iOS simulator; both physical phones were unplugged by the owner.
```

### Docs commit

`<VERSION> - docs(plans): session 29 executed: the Help modal, its Settings row and its What's New item`

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session pushes `uat-2`
after a PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

### Symptom table

| Symptom | Cause | Action |
| --- | --- | --- |
| `Cannot find module '@/shared/help'` after step 1's change | The new file is not where the plan names it | Create `shared/help.ts` exactly at that path |
| `HELP_ACTION_LABELS[topic.action]` fails tsc with "undefined cannot be used as an index" | The action was not narrowed before the lookup | Destructure the topic and branch on `action` first, as the contract says. Never add a cast |
| The Close button is off screen in the simulator | The answers are not inside the capped `ScrollView` | Check `maxHeight` is `height * ANSWERS_HEIGHT_SHARE` and the button sits outside the `ScrollView` |
| `Settings.test.tsx` fails on `Unable to find an element with text: About` | An existing test still expects the old card title | The plan changes no such test, so this is a test the plan did not name: STOP and ask |
| Two `Open Settings` buttons make `getByRole` throw "found multiple elements" | Several answers offer the same link | Use `getAllByRole(...)[0]`, as the plan's test row specifies |
| The update prompt appears over Help | The gate was not extended | Add `&& !helpVisible` to `ModalUpdate`'s `visible`, as the contract gives it |
| A break prints `BREAK NOT APPLIED` | The substitution does not match the code written | STOP and ask. Never reshape the code to fit a break |
| Anything else | | `EXECUTOR-BRIEF.md` section 7 |

### Anticipated review fixes

These are the only fixes the executor may make to anything this plan fixes, and they are given word for word:

1. **A comment that states what or how.** Delete it. If the line needs explaining, rename the local or split the
   function, then delete the comment (owner, 2026-09-26).
2. **An import out of Biome's order.** Run `npx biome check --write <file>`.
3. **A `topic.action` read more than once in the JSX.** Destructure `{ question, text, action }` in the `map`
   callback and use the locals.
4. **A test name beginning "should" or "works".** Rewrite it to state the behaviour in the present tense
   (`__tests__/README.md`).

Anything else that meets all three conditions in `EXECUTOR-BRIEF.md` section 4, item 8, the executor applies
itself and records in `LOG.md`. Those three conditions are written there and are never restated here in other
words.

### Stopping part-way

| Step | Restore | Delete |
| --- | --- | --- |
| 1 | `git checkout -- components/modals/index.ts device/notifications.ts device/__tests__/androidChannelUpdate.test.ts stores/ui.ts stores/__tests__/ui.test.ts app/index.tsx __tests__/app/index.test.tsx app.json package.json` | `shared/help.ts`, `shared/__tests__/help.test.ts`, `components/modals/Help.tsx`, `components/modals/__tests__/Help.test.tsx` |
| 2 | `git checkout -- components/sheets/screens/Settings.tsx components/sheets/screens/__tests__/Settings.test.tsx shared/whatsNew.ts app.json package.json` | nothing |

Then `EXECUTOR-BRIEF.md` section 4a, items 3 and 4.

## 11. Subagents in this plan

None, with one conditional exception. The session does its own planning, execution, review and audit (owner,
2026-09-26). If the executor's model cannot see images, the three simulator screenshots in section 7 go to
`vision`, one call each, with the exact question that reading gives. No model is named anywhere.

## 12. Report to the owner

The final message starts with `Execution session` and a `Time:` line from `date '+%H:%M:%S %d.%m.%Y'`, then:

- a few plain sentences on what shipped and what the simulator proved;
- the progress table in `EXECUTOR-BRIEF.md` section 6's format;
- any decision waiting on the owner;
- the four-line handoff from the `athan-next` skill, section 5.
