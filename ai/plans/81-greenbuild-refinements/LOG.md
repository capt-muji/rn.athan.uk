# Ticket 81 ledger

## Planning (2026-10-13)

Planned from uat 742186fa (2.0.239), ticket 79's DONE merge. The owner was
unavailable by her instruction; her rulings come from queue row 81 and her
session messages. All 17 anchors counted 1 at the planned-at sha. Blast
radius measured: only Time.test.tsx queries rendered times by text, so the
time-column split touches one suite. Both schedules share Screen, List and
Ago, so item (e) holds by construction (D81.6). Every visual figure the owner
did not pin is a recorded default under her dev-build read (D81.1, D81.3,
D81.5).

## Ticket 81

Step entries open `### Step <NN> — <state>` and end `session: <ses_id>`.

Grill round 1 (2026-10-14, 13 findings: seven must, four should, two nice).
Applied: the third Ago sentence literal (line 62) and Screen.test's three
badge-sentence literals (lines 26, 47, 58) joined step 4's red set and file
list; break-step2's ar substitution re-indented to the object's two spaces;
break-step3 and break-step4 restructured into restored single-substitution
phases with the opacity flipped to 1 rather than deleted; step 1 extends the
CountdownSection.dim doc line; the session plan names two executor sessions
(steps 1 and 2, then 3 to 5); step 2's GAP_COLON instruction cites the
constant directly; steps 3 and 4 predict only the observable red lines; the
List test's title dropped its both-schedules claim. Rejected: adding
android/app/build.gradle to the add-by-name lists (the whole /android tree is
gitignored, .gitignore:14, and the executor contract edits it on disk without
adding it - the same finding ticket 79's grill made and its audit rejected),
and a component-level guard for the ar timer size (a module-scope style is
unreachable from a test without the fresh-React dance the test README
reserves for platform switches; the map pin and the break's map phase guard
the ruled number).

Owner ruling, 2026-10-14 00:15: the nightly cleanup around 00:00 is none of
the work's concern. Work runs straight through it; at most a commit avoids the
23:59 to 00:02 minute, and a wiped node_modules is a yarn install, not a stop.
The 30-minute commit block (23:45 to 00:15) is removed from
.opencode/agents/athan-executor.md, ai/AGENTS.md and the planner skill in the
READY commit.

### Step 1 — done

Branch `feat/81-seconds-bright` off `uat` (`c2ea0d48`, 2.0.241). Preflight
`PREFLIGHT OK`, both anchors count 1. Red matched the plan's line exactly: the
new test failed `Expected: false Received: true` on its first assertion
(`splitColonSections('00:01:00')?.[4].dim`), 1 failed / 133 passed / 134
total, no other test moved. Change contract applied verbatim: the seconds
carve in `splitColonSections` with its comment, and the `CountdownSection.dim`
doc line. Green: the suite 134 passed / 134 total, `npx tsc --noEmit` exit 0,
`npx biome check . --error-on-warnings` exit 0. Version 2.0.242 set in
`app.json` (first), `package.json` and `android/app/build.gradle`, all three
matching, under the version lock (origin/uat held at 2.0.239, the number
free).

session: ses_ec8723c63ffehAF73Q6q2sJym7
