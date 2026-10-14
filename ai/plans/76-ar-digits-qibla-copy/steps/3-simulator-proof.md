# Step 3: simulator visual proof, ar and en

Requirements: R1.1, R1.2, R2.1, R3.1
Weight: 3

Anchor check: none beyond the pre-flight (this step changes no source under anchor
protection).

Goal: read the three fixed surfaces with eyes on glass, dev/mock build only, and
transcribe the readings. This step dispatches alone (device weight).

Branch: `ticket/76`.

Files: `ai/plans/76-ar-digits-qibla-copy/LOG.md` (the readings), `app.json`,
`package.json` (the evidence commit).

Setup, before anything else:

```bash
cd "$HOME/athan-gitree/run-76"
[ -e node_modules ] || ln -s "$HOME/repos/rn.athan.uk/node_modules" node_modules
npx @expo/agent-cli status          # expected: the project brief; no EAS anything
```

Measured environment (2026-10-14): one booted simulator, named Athan-77 (iOS 18.5),
likely another ticket's session, and the smoke default port 8081 may be held by a
foreign dev server. So: run smoke with an explicit free port
(`npx @expo/agent-cli smoke --ios --port 8092`), and when the only reachable
simulator is another ticket's busy one, create a dedicated one and boot it before
smoke:

```bash
xcrun simctl create Athan-76 'iPhone 16' 18.5   # prints the new device id; boot it:
xcrun simctl boot <id> && open -a Simulator
npx @expo/agent-cli smoke --ios --port 8092      # expected: app boots, error window clean
```

Never `--eas`, never `deploy`, never `agents:setup`, never `skills:sync`, never
`smoke --android` (a phone may be connected). Never the owner's iPhone XS (her run
order). If smoke fails on both the existing and a fresh simulator, follow D76.6: record
the failing output in LOG.md, mark this step BLOCKED-on-environment, and go to step 4.

Readings, driven with the agent-device MCP against the simulator (press, wait for
settle, then read the live text from the snapshot; transcribe, never screenshot into
git):

1. Under ar: Settings, Language, choose the Arabic row (the language-switch path of
   `e2e/flows/` names it العربية). The app relaunches itself on the RTL boundary
   (row 68's D59); wait for the settled Arabic face.
2. Settings, Qibla: the sheet opens. Read the subtitle line under the title while the
   calibration hint is up: expected the full waiting sentence `اتبع التعليمات
   أدناه`, no trailing dots. Then wait for the compass to arrive (the simulator
   delivers heading data; poll the snapshot at 15-second intervals, never longer).
   Read the subtitle again: expected the full ready sentence `امسكه أفقيًا ودُر
   ببطء`, no trailing dots. If the simulator never vouches a heading within two
   minutes of polling, record that and rely on the en reading plus the structural
   tests; the ar ready-line reading then falls to the owner's QA (D76.6).
3. The compass ring under ar (step 2b, the owner's 2026-10-14 rebuild): read the four
   cardinals on the dial. Expected the LATIN numbers 0 at north, 90 at east, 180 at
   south and 270 at west, each with a small degree circle at its top right, and no
   Arabic letter (ش ق ج غ) on the ring.
4. Back on the schedules under ar: open the Extras list, press the Suhoor row: the
   info box appears. Read its sentence: expected `٢٠ دقيقة قبل الفجر` with
   Arabic-Indic ٢٠ and no Latin digit. Press Duha too: expected `٢٠ دقيقة بعد
   الشروق`.
5. Under en (switch back through Settings, Language, English): Settings, Qibla. Read
   the subtitle in both states: expected `Follow below instructions` then
   `Hold flat and turn slowly`, both full, no trailing dots, icon at the row's end.
   Read the ring too: expected the same four numbers 0, 90, 180, 270 with their degree
   circles, identical to the ar read. These readings are qualitative: the structural
   invariants are what steps 1, 2 and 2b's tests prove; here the eyes confirm nothing
   looks rebuilt.
6. Transcribe every reading into LOG.md under this step's heading, naming for each
   what was read and from which screen state. No screenshot, recording or device
   identifier is committed; the simulator is a simulator.

Break script: none (a reading step; its failure mode is the smoke failure above).

Version and commit: 2.0.607 in both files, with the LOG.md readings staged in the same
commit. Commit message:
`2.0.607 - docs(qibla): the ar subtitle, the ar info-box digits, the rebuilt compass ring and the en header read on the iOS simulator, dev/mock`.

Merge: none this run.

Done when: the readings (or their recorded blockers) are in LOG.md and the commit is on
`ticket/76` at 2.0.607.
