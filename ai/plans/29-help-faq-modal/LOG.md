# Execution log: Session 29

## Pre-flight

`bash $TMPDIR/preflight-29.sh 1` ended `PREFLIGHT OK`. All eight anchors counted 1 at `f77ea6e9`, and
`package.json` read 1.29.8. Row 29 set to IN PROGRESS.

## Step 1: The Help modal and its content

Branch `feat/29-help-modal`.

### Red

Measured before the change, as the plan predicted:

- `shared/__tests__/help.test.ts`: `Cannot find module '../help' from 'shared/__tests__/help.test.ts'`
- `components/modals/__tests__/Help.test.tsx`: suite failed to run, no `../Help`
- `device/__tests__/androidChannelUpdate.test.ts`: three failures,
  `TypeError: (0 , _notifications.openAppSettings) is not a function`
- `__tests__/app/index.test.tsx`: `Tests: 3 failed, 37 passed, 40 total`, the three being
  `shows Help when the settings sheet asks for it`, `closes Help when Close is pressed` and
  `holds the update prompt back while Help is showing`
- `stores/__tests__/ui.test.ts`: failed on the `popupHelpEnabledAtom` import

### Green

| Command | Result |
| --- | --- |
| `npx jest shared/__tests__/help.test.ts --selectProjects=unit` | `Tests: 11 passed, 11 total` |
| `npx jest device/__tests__/androidChannelUpdate.test.ts stores/__tests__/ui.test.ts --selectProjects=unit` | `Tests: 48 passed, 48 total` |
| `npx jest components/modals/__tests__/Help.test.tsx --selectProjects=components` | `Tests: 10 passed, 10 total` |
| `npx jest __tests__/app/index.test.tsx --selectProjects=components` | `Tests: 40 passed, 40 total` |
| `npx tsc --noEmit` | exit 0 |
| `npx biome check . --error-on-warnings` | exit 0, 349 files |

**One plan figure corrected.** The step file predicted `42 passed` for `__tests__/app/index.test.tsx`. The file's
own baseline on `uat-2` is 37, measured by restoring it from `git show uat-2:` and running it, so this step's
three tests make 40. The step file now says 40 and names the 37 it builds on. The 42 was a stale figure carried
from an earlier draft of the spike; nothing in the code was wrong.

### Breaks

`bash ai/plans/29-help-faq-modal/scripts/breaks-1.sh` ended `ALL AS EXPECTED: 1`. All 13 caught against the code
this session wrote, not the spike's.

### Commit

`8ce3b205`, version 1.29.9. Hook reported `Tests: 4747 passed, 4747 total` and
`Statements 100% (4381/4381)`, `Branches 100% (1954/1954)`, `Functions 100% (910/910)`,
`Lines 100% (3947/3947)`.

### Review

One round, clean. Read `git show 8ce3b205` back cold against the step's 15 points. Also verified mechanically
that all 17 user-facing strings the step specifies appear in `shared/help.ts` byte for byte, by extracting them
from the step file and searching the source: 17 checked, 0 missing. No finding, so no fix was applied.

Merged at `259d694a`.

## Step 2: The Other card, the Help row and the What's New item

Branch `feat/29-help-row`.

### Red

`keeps Help reachable on a release with no notes to show` and
`closes itself, then opens Help once the close has had time to finish` both failed with
`Unable to find an element with role: button, name: Help`. The file's other 13 tests passed:
`Tests: 2 failed, 13 passed, 15 total`.

The plan predicted the first would fail on `Unable to find an element with text: Other`. It failed on the Help
button instead, because that assertion comes first in the test. Same test, same cause, so this is the plan's
expected red reached by the earlier of its two assertions.

### Green

| Command | Result |
| --- | --- |
| `npx jest components/sheets/screens/__tests__/Settings.test.tsx --selectProjects=components` | `Tests: 15 passed, 15 total` |
| `npx jest shared/__tests__/whatsNew.test.ts --selectProjects=unit` | `Tests: 49 passed, 49 total` |
| `npx tsc --noEmit` | exit 0 |
| `npx biome check . --error-on-warnings` | exit 0 |

### Breaks

`ALL AS EXPECTED: 1`, all 8 caught.

### Review

One round, clean, against the step's 12 points. Merged at `1ab21ce7`.

## Step 3: the owner's redesign, taken on the simulator

Branch `feat/29-help-polish`. Specified in `steps/3-help-polish.md`, which records all 14 owner decisions with
their words. The owner read the shipped modal on the simulator and rejected the copy and the layout:
🐋  "Again, all of this is so much text. It's just like 1 page of black text."

### What changed

The app's name is gone from every user-facing string; two questions are cut; questions became causes with a dot;
guidance became numbered steps; answers are capped at 160 characters; the card takes nearly the whole screen
with a divider under the title and between each question; Close is full width.

`Modal` gained `wide`, `divider` and `icon`, all optional and defaulting off, so the update prompt and What's New
are byte-identical in behaviour. That default is now pinned by
`components/modals/__tests__/Modal.test.tsx`'s `stays a compact card, and rules nothing off, unless asked`,
which reads `width: '85%'`.

### Green

| Command | Result |
| --- | --- |
| `npx jest shared/__tests__/help.test.ts --selectProjects=unit` | `Tests: 16 passed, 16 total` |
| `npx jest components/modals/__tests__/Help.test.tsx --selectProjects=components` | `Tests: 12 passed, 12 total` |
| `npx jest components/modals/__tests__/{Modal,Update,WhatsNew}.test.tsx --selectProjects=components` | `Tests: 15 passed, 15 total`, unchanged by the new props |
| Coverage of the three changed files | 100% statements, branches, functions, lines |
| `npx tsc --noEmit`, `npx biome check . --error-on-warnings` | both exit 0 |

### Breaks

`ALL AS EXPECTED: 1`, all 10 caught, but only after two real corrections:

1. **Break 7 did not apply.** The bullet `•` is multi-byte UTF-8, and `perl -0pi` without `-CSD` cannot match a
   `\x{2022}` literal, so the substitution silently changed nothing and printed `BREAK NOT APPLIED`. The helper
   now runs `perl -CSD`. **A break that quietly matches nothing is worse than no break**, which is exactly why
   `BREAK NOT APPLIED` counts as a failure.
2. **Break 10 was NOT CAUGHT, and it was right not to be.** Making `wide` and `divider` default to `true` would
   silently widen the update prompt and What's New, and no test looked at either card's width. That is a real
   gap this session introduced by adding the props, so the guard test above was written. The break is now caught.
