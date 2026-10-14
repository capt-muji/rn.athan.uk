# Step 3: simulator visual proof, ar and en

Requirements: R1.1, R1.2, R2.1
Weight: 3

Anchor check: none beyond the pre-flight (this step changes no source under anchor
protection).

Goal: read the two fixed surfaces with eyes on glass, dev/mock build only, and
transcribe the readings. This step dispatches alone (device weight).

Branch: `ticket/76`.

Files: `ai/plans/76-ar-digits-qibla-copy/LOG.md` (the readings), `app.json`,
`package.json` (the evidence commit).

Setup, before anything else:

```bash
cd "$HOME/athan-gitree/run-76"
[ -e node_modules ] || ln -s "$HOME/repos/rn.athan.uk/node_modules" node_modules
npx @expo/agent-cli status          # expected: the project brief; no EAS anything
npx @expo/agent-cli smoke --ios     # expected: dev server up, the simulator app loads
```

Never `--eas`, never `deploy`, never `agents:setup`, never `skills:sync`, never
`smoke --android` (a phone may be connected). If smoke fails, follow D76.6: record the
failing output in LOG.md, mark this step BLOCKED-on-environment, and go to step 4.

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
3. Back on the schedules under ar: open the Extras list, press the Suhoor row: the
   info box appears. Read its sentence: expected `٢٠ دقيقة قبل الفجر` with
   Arabic-Indic ٢٠ and no Latin digit. Press Duha too: expected `٢٠ دقيقة بعد
   الشروق`.
4. Under en (switch back through Settings, Language, English): Settings, Qibla. Read
   the subtitle in both states: expected `Follow below instructions` then
   `Hold flat and turn slowly`, both full, no trailing dots, icon at the row's end.
   This reading is qualitative: the structural en invariants are what step 1's tests
   prove; here the eyes confirm nothing looks rebuilt.
5. Transcribe every reading into LOG.md under this step's heading, naming for each
   what was read and from which screen state. No screenshot, recording or device
   identifier is committed; the simulator is a simulator.

Break script: none (a reading step; its failure mode is the smoke failure above).

Version and commit: 2.0.604 in both files, with the LOG.md readings staged in the same
commit. Commit message:
`2.0.604 - docs(qibla): the ar subtitle, the ar info-box digits and the en header read on the iOS simulator, dev/mock`.

Merge: none this run.

Done when: the four readings (or their recorded blockers) are in LOG.md and the commit
is on `ticket/76` at 2.0.604.
