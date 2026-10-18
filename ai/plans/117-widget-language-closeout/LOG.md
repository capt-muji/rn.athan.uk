# LOG

## Planning (2026-10-18)

## Ticket 117

Session: ses_eb107ebc1ffe2rOoS7HME222Ga (lane 117, planning).

Cold start verified: `uat` HEAD `164df7bd` (2.0.1069), `origin/uat` synced, no lane locks
held, no `lane/117` branch or sibling session on this ticket before the worktree was
created (lane 116's worktree exists beside it; the queue rows it edits are not rows 117 or
69, and merge weather on the queue file is governed by the symptom table).

The frontier worked agent-ruled, ten decisions, recorded in PLAN.md section 2.1
(D117.1 as-found proof, D117.2 3T gallery witness with AVD rehearsal, D117.3 iOS
simulator half, D117.4 French, D117.5 artefact outside the repo, D117.6 row 69 SUPERSEDED,
D117.7 OWNER-LED close, D117.8 lane-run steps 1 to 4, D117.9 no alarm audit,
D117.10 two audit passes).

Facts measured at planning, not ruled: the patch's three features and the four locale
files; the four JS read sites of `__expoWidgetDeviceLocale`; the six-locale native-string
map in `app.json` beside the English base displayNames; the picker mechanics in the 3T
atlas; the local expo clone's remotes and sibling PR branches; the iOS 18.5 simulators
`Athan-76` and `Athan-77`; the version guards' outputs (`VERSIONS OK`, the merge-check
arm being the pre-merge hook's); 2.0.1067 and 2.0.1069 being records merges over 2.0.1066's
audited widget code.

## Planning continued (2026-10-18, resumed)

Session: ses_eb0aa65bdffetdn3tILhH6DwlP (lane 117, third launch; the planning session and the
dispatch turn before it were ended by provider interruptions).

Recovery read: the worktree clean at `9f5e580a` (2.0.1070), `uat` at `164df7bd` (2.0.1069),
no lock held anywhere, no live sibling session on this ticket (the planning session and the
dispatch-before session both idle).

The grill ran twice. The first round returned 19 findings (7 must, 10 should, 2 nice); every
one was applied before the planning commit. The second round, dispatched to verify those
fixes, ended with no findings text (provider interruption), so the lead ran the cold
question-test pass itself: the plan's cross-references, the EARS criteria against the step
contracts, the symptom table against the steps and the three scripts all read consistent,
and `bash scripts/check-plan.sh ai/plans/117-widget-language-closeout` prints `PLAN OK`. One
defect found in the queue edit and fixed here: row 117 carried six cells against the five-column
table (the planning text was appended as a new cell instead of replacing the status cell), which
the board reader would have dropped silently (row 70's recorded gap). The row now reads five
cells with the status READY.

Checklist:

1. [x] Step 1: the 3T as-found proof (lane-run, device)
2. [x] Step 2: the 3T gallery fallback read with AVD rehearsal (lane-run, device)
3. [x] Step 3: the iOS simulator gallery fallback read (lane-run, device)
4. [x] Step 4: the upstream PR preparation, held (lane-run, code outside the repo)
5. [x] Step 5: the records close (executor dispatch, docs)

### Step 1 — as-found proof

Bracket before (`sessions/117/step1-bracket-before.txt`): model `ONEPLUS A3003`, fleettest
`versionName=2.0.1067`, `persist.sys.locale` = `en-US`,
`settings get system system_locales` = `en-US,ar-SD`.

The phone carries two Athan packages, read from `pm list packages` and `dumpsys package`:

- `com.example.athan` at 2.0.908 (production id, installed 2026-10-17), owning the placed
  Next Prayer (Light) widget at bounds [33,110][1047,692].
- `com.example.athan.fleettest` at 2.0.1067 (last updated 2026-10-18 13:19), owning the
  placed Next Prayer (Dark) widget at bounds [33,983][1047,1565]. This is the deliverable
  under proof; the light widget is the older package's face and is not part of it.

Read as found, with one `KEYCODE_HOME` and no launch, tap, install or language switch:

- **Fleettest Next Prayer (Dark) widget, app Arabic.** The prayer list sits on the LEFT:
  the time column occupies x 121 to 211, the Arabic name column x 385 to 474, so every
  row reads time left, name right (Fajr 04:03, Sunrise 05:38, Dhuhr 13:03, Asr 16:58,
  Maghrib 20:19, Isha 21:31). The next-prayer row (Fajr) carries the blue pill with its
  time at the pill's left end and its name at the right. The hero block sits on the
  RIGHT: the name الفجر, the countdown, the time 04:03 beneath it, the weekday الاثنين
  at the foot. This is row 135's mirrored face exactly.
- **Countdown label.** `12 h 52 m`: Latin digits on both groups, lowercase Latin `h` and
  `m`, no Arabic unit letters. The digit and its unit are tight (adjacent text bounds),
  the two groups sit 31 px apart, which is the ruled 12 pt at 420 dpi. Nothing on the
  label is system-formatted and nothing is Arabic-Indic.
- **Scripts.** Names Arabic; row times and the countdown Latin digits (row 88's law).
- The older production-id widget (light) still renders the pre-row-135 face (name left,
  time right, `17د` with the Arabic minute letter). Recorded as the second package's
  state, not as a mismatch against the deliverable.

Bracket after (`sessions/117/step1-bracket-after.txt`): the same model, the same
`versionName=2.0.1067`, and both locale readings unchanged; the post-contact screenshot
(`sessions/117/step1-widget-after.png`) shows both widgets still rendering with the
fleettest countdown advanced from 12 h 53 m to 12 h 52 m.

Verdict: row 135's delivered lettered alignment and mirroring are present on the installed
2.0.1067 fleettest build, and the phone is left exactly as found (same build, app Arabic,
widget placed, device locale and system locales unchanged). No finding against the
deliverable. Evidence under `$HOME/athan-gitree/sessions/117/`; no screenshot committed.

session: ses_eb0aa65bdffetdn3tILhH6DwlP

### Step 2 — gallery read (Android)

Bracket before (`sessions/117/step2-bracket-before.txt`): `ONEPLUS A3003`, fleettest
`versionName=2.0.1067`, `persist.sys.locale` = `en-US`, `system_locales` = `en-US,ar-SD`.

AVD rehearsal (`sessions/117/step2-avd-rehearsal.md`): the locale add, apply and remove
mechanics were measured on `athan-smoke-28` first. The working reorder gesture is
`input draganddrop` (plain `input swipe` never reorders); adding `Français (France)` and
dragging it to the first position applies it live with no reboot, and the removal path is
overflow, "Supprimer", checkbox, trash, confirm.

Witness on the 3T, device locale switched to `fr-FR` (`persist.sys.locale=fr-FR`,
`system_locales=fr-FR,en-US,ar-SD`), read in the widget picker with the app list at its
Athan sections:

- The picker chrome rendered in French throughout ("Langues", "Ajouter une langue",
  "Astuces de l'écran d'accueil", "4 x 2").
- The **Athan** section (production package `com.example.athan`) shows its eight entries
  with the English base display names, in this order: Extra Times (Dark) 3x2, Extra Times
  (Dark) 5x2, Extra Times (Light) 3x2, Extra Times (Light) 5x2, Next Prayer (Dark) 3x2,
  Next Prayer (Dark) 5x2, Next Prayer (Light) 3x2, Next Prayer (Light) 5x2.
- The **Athan BGTest** section (the fleettest package under proof) shows the same eight
  entries, same order, same English base names.
- No entry rendered a French label, and none rendered an Arabic or other localized label:
  `fr` has no `values-fr` resource set, so the lookup falls back to the English base
  `displayName` strings exactly as the committed config predicts.

Restore: overflow, Supprimer, Français checked, trash, OK. Verified:
`persist.sys.locale` = `en-US` again and `system_locales` = `en-US,ar-SD`, both equal to
the bracket-before readings; `diff` of the two bracket files is empty. The launcher
re-created both widgets a few seconds after the final locale change, and the post-restore
screenshot shows the fleettest dark widget still rendering the mirrored face with the
lettered countdown (12 h 44 m) and the older package's light widget still present. Phone
left exactly as found; device lock released.

Verdict: the English base fallback outside the six languages is the observed and intended
shape on Android; it is recorded here as the answer for parked row 130's item (1).
No mismatch, no finding.

session: ses_eb0aa65bdffetdn3tILhH6DwlP

### Step 3 — gallery read (iOS)

Build provenance: the main tree at `07eb5758` (2.0.1076, after the plan's
`164df7bd` anchor), built for the simulator `Athan-77`
(EA160805-8BFC-4747-BF4C-8549980A5118) under `build.lock` via the Xcode MCP
(scheme Athan, 348 s, SUCCEEDED), installed and launched once so the widget
kinds register.

Language: the recorded pre-step `AppleLanguages` was already `("fr-FR", en)`
(`step3-lang-before.txt`; predecessor residue from the dead third launch, which
had begun this step), so the restore target equals the found state. French was
set, the simulator rebooted, and the springboard read back French throughout
(`Données cellulaires`, `Rechercher`, AZERTY keyboard) before the gallery was
opened: long-press wallpaper, `Modifier`, `Ajouter un widget`, search `Athan`,
open the app card.

The card, eight pages, every entry transcribed live:

1. Next Prayer (Light) - "A countdown to the next prayer."
2. Extra Times (Light) - "A countdown to the next extra time."
3. Next Prayer (Light) - "A countdown to the next prayer." (second size)
4. Extra Times (Light) - "A countdown to the next extra time." (second size)
5. Next Prayer (Dark) - "A countdown to the next prayer."
6. Extra Times (Dark) - "A countdown to the next extra time."
7. Next Prayer (Dark) - "A countdown to the next prayer." (second size)
8. Extra Times (Dark) - "A countdown to the next extra time." (second size)

Every display name and description rendered in the English base under a French
system language, exactly as the committed config predicts: the per-locale
native strings exist only for the six supported languages, `fr` has none, and
the bundle's development region is English. The picker chrome itself rendered
in French throughout, so the system language was live. Evidence:
`sessions/117/step3-gallery-fr.png` (never committed).

Restore: `AppleLanguages` written back to the recorded `("fr-FR", en)`, the
simulator shut down, `build.lock` released. No mismatch, no finding: the
English base fallback outside the six languages is the observed and intended
shape on iOS, the answer for parked row 130's item (1) beside step 2's Android
half.

session: ses_eb3c7ecb4ffenw7HZoIA7mTmS9

### Step 4 — upstream preparation held

Base sha: `cac62846e627e6b446ac2ded31adac8c8e9d5dd8` (upstream/main after the
fetch). Branch `feat/widgets-device-locale` in the local clone
`$HOME/athan-gitree/upstream/expo`, exactly one commit:
`b2fd020afa feat(expo-widgets): expose the device locale to widget JS runtimes`.

The diff touches exactly the four specified files (27 insertions, 7 deletions):
the C++ `nativeRender` gains the `locale` parameter and threads it into `render`
whose signature defaults it to the empty string, the global
`__expoWidgetDeviceLocale` set only when the locale is non-empty (the guard);
`WidgetsJSRuntime.kt` imports `android.os.LocaleList` and passes
`LocaleList.getDefault().get(0).language`; the JNI `render`/`nativeRender`
signatures carry `locale`; the iOS `WidgetsJSRuntime.swift` sets the context
global. Reread line by line against the local patch's locale hunks: they match
in intent and shape, the path translation `node_modules/expo-widgets/...` to
`packages/expo-widgets/...` following the sibling PR's pattern. The `openApp`
half and the iOS rtl hunk are excluded as planned.

Description: `$HOME/athan-gitree/upstream/pr-descriptions/widgets-device-locale.md`
(What, Why, How, Testing, Anything else; anonymous, no app name, no serial, no
repo link). Anonymity grep run: clean.

Held state: nothing pushed, nothing filed. The refs comparison
(`step4-refs-before.txt` against `step4-refs-after.txt`) is identical, and both
remotes' ref lists stand unchanged beyond the fetch.

session: ses_eb3c7ecb4ffenw7HZoIA7mTmS9

### Step 5 — records closed

The three records landed on `docs/117-records-2026-10-18`: row 117 set to the
section 8 cell with the `EXECUTED, audit owed` prefix and the `<N>` slot left
for the audit-close commit (Needs-first: nothing), row 69 set to the section 8
SUPERSEDED cell verbatim (waiting-on: nothing), and the held-state sentence
appended inside `ai/UPSTREAM-PRS.md`'s expo-widgets Upstream cell with the base
sha. Break checks: PREPARED AND HELD counts 1 and 1, the SUPERSEDED count 1 -
all green. The records commit's sha is recorded in AUDIT.md at the audit close
(the entry cannot carry its own commit's sha). Dispatch note: this step ran
lane-self, the executor dispatch path being unusable this session (provider
casualties); recorded per the step's own fallback clause.

session: ses_eb3c7ecb4ffenw7HZoIA7mTmS9
