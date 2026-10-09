# Verification: blast radius and test census counts

| Field | Value |
| --- | --- |
| Base | `uat` `52109ec0` (1.29.303) |
| Date | 2026-10-09 |
| Claim under test | PLAN.md section 4 says the code map is `research/R13-BLAST-RADIUS.md` and the test census is `research/R14-TEST-CENSUS.md`. The executor works from their `file:line` map and their counts, and from the ten code facts in `SINGLE-LANGUAGE-PIVOT.md`. |
| Result | 4 confirmed, 13 contradicted, 1 uncertain |

## Method

**Read in full:** the common brief, `ai/AGENTS.md`, `SINGLE-LANGUAGE-PIVOT.md`, `OWNER-DECISIONS.md`,
`PLAN.md`, `research/R13-BLAST-RADIUS.md`, `research/R14-TEST-CENSUS.md`, `MEASURED.md`, `LOG.md`,
the five counting scripts (`inventory-strings.py`, `classify-strings.py`, `identifier-contract.py`,
`widget-payload.py`, `plural-surface.py`), all six flows under `e2e/flows/`, all six scripts under
`e2e/scripts/`, and `components/sheets/screens/Settings.tsx`.

**Drift check first.** `git diff --stat 5ad6aaba 52109ec0 -- . ':!ai'` and the same from `500e5037`
both list two files, `app.json` and `package.json`, one line each (the version). No source file and
no test file moved between the record's shas and this one. Every mismatch below is therefore a count
that was never right, not drift.

**Citations.** I transcribed 208 `file:line` citations from R13 sections 1 to 9 and pivot facts 3, 4,
6 and 10 into a list of `file | first line | last line | expected token`. A scratch script reads each
file with `git show <sha>:<path>` and tests the token inside the cited range, at `52109ec0` and again
at `5ad6aaba`. The table in CNT-1 names every citation checked.

**Counting scripts.** `classify-strings.py`, `identifier-contract.py`, `plural-surface.py` and
`widget-payload.py` only print. `inventory-strings.py` overwrites the tracked
`research/string-inventory.json`, so I ran a scratch copy with the output path changed to the scratch
folder (`sed` on the one path, nothing else), then ran scratch copies of the classifier and the plural
script against that fresh file. The tracked JSON is untouched.

**Independent recount.** A scratch Node script parses every production `.ts` and `.tsx` file (the
inventory script's own directory exclusions, 129 files) with `@babel/parser` from `node_modules`
(plugins `typescript`, `jsx`). It records every string literal, template literal and JSX text node
with its context: logger call, thrown error, `Alert.alert` argument, JSX attribute name, or plain.
Comments are not literals, so this scan cannot be fooled by doc comments. Numbers quoted as "AST scan"
come from it.

**Suites.** `git ls-files | grep -E '\.test\.(ts|tsx|js|jsx)$' | wc -l` and
`npx jest --listTests --watchman=false` from the worktree, plus the same `git ls-tree -r` filter at
both record shas. No test was executed.

**Class recount.** A scratch script reads every test file and counts lines matching one stated
pattern per class. Class 1: a quoted prayer name, `.english`, `english:`, `prayerEnglish`,
`englishName`, `PRAYERS_ENGLISH`, `EXTRAS_ENGLISH`. Class 2: `arabic` as a word, `arabicName`,
`prayerArabic`, `showArabicNames`, `toArabicNumbers`, `_ARABIC`, any character in U+0600 to U+06FF.
Class 4: `preference_(alert|reminder|notification)`, `prayer_max_english_width`,
`prayerNotificationIdentifier`, `reminderNotificationIdentifier`, `athan_(standard|extra)`,
`reminder_(standard|extra|<name>_<n>)`, `AndroidChannelId`, `prayerNameSlug`. Class 5: `nextName`,
`dateLabel`, `WidgetPrayerRow`, `AndroidWidgetDayRow`.

No external source was used.

## Findings

### CNT-1. CONFIRMED: the `file:line` map is accurate, 207 of 208 citations hold, one is off by a line, none has drifted

- **Record says:** R13 cites `file:line` at `5ad6aaba` for every site. The pivot's facts table cites
  its own lines.
- **Evidence:** at `52109ec0` the checker reports 206 holds and 2 misses in the cited range, with no
  missing file and no line past the end of a file. The result at `5ad6aaba` is identical. One miss
  is a one-line slip: `shared/notifications.ts:452` is cited for `'Extra Times'`, which sits on
  `:451`. The other was my token: `shared/widgetTypes.ts:14` is cited as the schema version and
  holds `export const WIDGET_PROPS_VERSION = 5;`, so the citation is right. That makes 207 holds.

| Section | Citations checked | Files and lines checked |
| --- | --- | --- |
| R13 section 1, row name fields | 36 | `shared/types.ts`: 270, 272, 266-276, 286, 298<br>`shared/prayer.ts`: 269-275, 302-303, 385-393, 414-420, 505, 578<br>`hooks/usePrayer.ts`: 89-92<br>`stores/countdown.ts`: 45, 413-414, 430<br>`shared/sequence.ts`: 25, 194<br>`hooks/usePrayerAgo.ts`: 36<br>`components/prayer/Prayer.tsx`: 74, 88-89, 92<br>`components/prayer/Alert.tsx`: 66, 157-158, 185-186<br>`components/overlay/OverlayInfoBox.tsx`: 71<br>`stores/schedule.ts`: 89, 307, 323-326<br>`stores/notifications.ts`: 433, 664<br>`shared/widgetTimeline.ts`: 135, 188, 247, 303, 306<br>`hooks/usePrayerSequence.ts`: 98 |
| R13 section 2, constants consumers | 57 | `shared/constants.ts`: 9, 15, 26, 32, 54, 1006, 39, 47<br>`shared/prayer.ts`: 191, 197, 318, 325, 324, 329, 574-575, 258, 358, 248, 348, 181, 398-399, 407<br>`shared/sequence.ts`: 24<br>`stores/notifications.ts`: 154, 215, 288, 304, 346, 557-558, 1587, 1615, 155, 224, 296, 312, 351, 552, 558, 1618, 487<br>`shared/notifications.ts`: 324, 526, 325, 88<br>`components/ui/InitialWidthMeasurement.tsx`: 21, 24<br>`components/overlay/overlayContent.ts`: 53, 57-58<br>`components/prayer/rowPress.ts`: 33 |
| R13 section 3, MMKV keys and stored shapes | 21 | `stores/notifications.ts`: 207, 257-260, 277-280, 333-337, 536-581, 493, 877, 1071<br>`stores/version.ts`: 289, 144-155, 155<br>`stores/sync.ts`: 363<br>`stores/database.ts`: 136-145, 193, 258<br>`shared/types.ts`: 108-122<br>`shared/prayer.ts`: 407<br>`shared/notifications.ts`: 17-24<br>`device/notifications.ts`: 130, 248 |
| R13 section 4, OS identifiers and channels | 13 | `device/notifications.ts`: 49-50, 61-66<br>`shared/notifications.ts`: 147, 387-390, 402-403, 106, 410, 452, 502, 130, 181, 161-162, 526-531 |
| R13 section 5, widget pipeline | 26 | `shared/widgetTimeline.ts`: 114-116, 290<br>`shared/widgetTypes.ts`: 48-53, 80-81, 127-134, 14<br>`stores/widget.ts`: 167-229, 201-217, 237-256, 345-389, 374, 124-140, 319-337<br>`stores/notifications.ts`: 1646-1663<br>`widgets/PrayerWidget.tsx`: 378, 439, 611, 737, 303-310, 545-555<br>`widgets/LockPrayerWidget.tsx`: 140, 169, 283, 313, 450, 466 |
| R13 section 6, formatters | 14 | `shared/time.ts`: 25-34, 229-233, 243, 318, 329, 528-548, 564-574<br>`components/day/shownDate.ts`: 34<br>`shared/widgetTimeline.ts`: 115<br>`shared/text.ts`: 25<br>`components/prayer/Explanation.tsx`: 80, 159-165<br>`stores/ui.ts`: 104-107 |
| R13 section 7, `showArabicNamesAtom` | 6 | `stores/ui.ts`: 132<br>`components/prayer/Prayer.tsx`: 36, 91-93, 113-116<br>`components/sheets/screens/Settings.tsx`: 37, 128-132 |
| R13 section 8, display copy and qibla | 17 | `stores/ui.ts`: 219<br>`stores/widget.ts`: 220, 379<br>`stores/notifications.ts`: 197, 655<br>`components/sheets/screens/Qibla.tsx`: 46-47, 62-63, 103-106, 109-112, 140, 166-168<br>`device/qibla.ts`: 36-43<br>`shared/qiblaCompass.ts`: 92-97<br>`shared/qiblaPlace.ts`: 36-47 |
| R13 section 9 and the seams | 7 | `shared/prayer.ts`: 569-579<br>`components/overlay/OverlayInfoBox.tsx`: 73<br>`shared/sequence.ts`: 22-27<br>`shared/types.ts`: 182-202<br>`stores/notifications.ts`: 1499-1541, 1528-1533, 663-666 |
| Pivot fact 3 | 5 | `components/sheets/screens/Settings.tsx`: 129-131<br>`shared/prayer.ts`: 314<br>`shared/notifications.ts`: 125, 169, 176 |
| Pivot fact 4 | 4 | `stores/ui.ts`: 216<br>`stores/sync.ts`: 365<br>`components/prayer/Time.tsx`: 62-72 |
| Pivot fact 6 | 1 | `shared/time.ts`: 241-243 |
| Pivot fact 10 | 1 | `device/notifications.ts`: 44-66 |

- **Attack tried:** I ran the same list against both shas to separate drift from error, and looked
  for cited lines past the end of a file (`shared/constants.ts:1006` looked like a typing slip, and
  the file does hold `EXTRAS_EXPLANATIONS_ARABIC` on line 1006).
- **Consequence:** none for the lines R13 lists. The problem with R13 is what it does not list
  (CNT-12), not what it lists. R14's per-suite line lists were not checked line by line. See "Not
  verified".

### CNT-2. CONFIRMED: the script-derived headline numbers reproduce at this sha

- **Record says:** pivot fact 1 (205, 123 over 34 files, 25, 23, 22, 12, and the four largest files)
  and fact 2 (2 identifier builders, 11 audio-slug sites, 5 ordering sites, 67 reminder mp3s). Ruling
  D22 says 99 audio files.
- **Evidence:** the scratch run of `inventory-strings.py` prints `TOTAL 205 literals across 48 files`.
  The classifier on that file prints `123 display copy (34 files)`, `25 widget copy (2 files)`,
  `23 identifier (11 files)`, `22 prayer name used as identifier (7 files)`, `12 doc example (5
  files)`, and display copy by file `27 shared/help.ts`, `14 shared/whatsNew.ts`,
  `12 components/sheets/screens/Settings.tsx`, `10 components/sheets/screens/Alert.tsx`.
  `identifier-contract.py` prints `OS notification id (device/notifications.ts, 2 sites)`,
  `audio resource slug (shared/notifications.ts, 11 sites)`, `ordering and day rules
  (shared/prayer.ts, 5 sites)`, `audio filenames on disk: 67 files, 11 prayer slugs`.
  `git ls-files assets/audio` lists 32 files under `athans/`, 67 under `reminders/` and one
  `assets/audio/index.ts`, so 99 audio files.
- **Attack tried:** I ran the classifier as committed, against the tracked JSON. It prints
  `194 literals classified` and `113 display copy`. The 205 and 123 appear only after the inventory
  script rewrites the tracked JSON. The committed artefacts do not reproduce the headline without
  mutating a tracked file. `classify-strings.py:1` still says "the 194 literals".
- **Consequence:** the numbers are reproducible. What they measure is a different matter (CNT-4,
  CNT-5). The tracked `string-inventory.json` is stale by 11 rows and 5 files.

### CNT-3. CONFIRMED: R13's structural counts hold, and every production read of the name fields sits inside an R13 citation

- **Record says:** 5 write sites, 4 MMKV key families plus the index-to-name migration, 5 identifier
  and channel builders, 10 widget renderer sites, cardinal letters at `shared/qiblaCompass.ts:92-97`,
  `device/qibla.ts` 4 strings.
- **Evidence:** the five write sites (`shared/prayer.ts:269-275` with `:302-303`, `:385-393`,
  `:414-420`, `hooks/usePrayer.ts:89-92`, `stores/countdown.ts:45`) all hold. The four key builders
  are `stores/notifications.ts:207`, `:258`, `:278`, `:335`, with the migration at `:575-579`. The
  five builders are `device/notifications.ts:50`, `:66`, `shared/notifications.ts:147`, `:389`,
  `:402-403`. The ten renderer lines (`widgets/PrayerWidget.tsx:378, 439, 611, 737`,
  `widgets/LockPrayerWidget.tsx:140, 169, 283, 313, 450, 466`) all hold. `device/qibla.ts:37-41`
  passes four visible strings to `Alert.alert`.
  A scan of all production files for `.english` and `.arabic` finds 30 lines in 12 files. Every one
  that is code sits within 3 lines of an R13 citation. The same scan for the eight name-bearing
  constants finds 79 lines in 10 files. The only ones my parser did not match to a citation are
  import lines and four definitions that R13 cites in its bare `:39` shorthand.
- **Attack tried:** I looked for a direct `.english` read R13 missed. There is none. The gaps are one
  hop downstream, where the name travels under another identifier (CNT-12).
- **Consequence:** none.

### CNT-4. CONTRADICTED (MAJOR): the 123 and the 25 are regex buckets, not counts of display strings

- **Record says:** pivot fact 1 and synthesis finding 11 treat 123 as display strings and 25 as widget
  strings, and reconcile the catalog corpus as 123 plus 25 plus the 16 religious terms. PLAN.md
  section 5 migrates "the 123 display strings file by file", and step 10 resolves "widgets' 25
  strings".
- **Evidence:** `inventory-strings.py:10` matches any quoted run that starts with a capital, on any
  line, comments included, and `classify-strings.py:32-33` drops everything unclassified into display
  copy. Of the 123 rows, at least 29 are not copy:
  - 10 sit on comment-only lines (no literal on that line in the AST scan): `app/index.tsx:44`,
    `shared/prayer.ts:501`, `shared/notifications.ts:145`, `shared/text.ts:22`, `:23`,
    `components/sheets/parts/LabeledToggle.tsx:18`, `components/sheets/parts/Sheet.tsx:102`, `:103`,
    `components/sheets/parts/Header.tsx:22`, `:23`.
  - 7 are SVG path data: `components/prayer/Explanation.tsx:50`, `:53`, `:88`, `:91`
    (`<Path d='M0 12 L12 3.5 Q15 1 18 3.5 L30 12 Z' .../>`), `shared/qiblaCompass.ts:113`,
    `shared/qiblaWave.ts:84`, `:101`.
  - 5 are the identifier vocabulary itself: `shared/constants.ts:9`, `:26`, `:39`, `:47` and the
    legacy array at `stores/notifications.ts:487`. Each row is one regex match spanning several names.
  - 7 are other non-copy: `app/_layout.tsx:63` (`LogBox.ignoreLogs(['Require cycle'])`),
    `stores/widget.ts:220` and `:379` (a label used only inside `logger.info`),
    `components/prayer/rowPress.ts:33` (an identity comparison),
    `modules/qiblaheading/index.ts:50` (a native module name), `shared/whatsNew.ts:235`, `:236`
    (badge keys that `components/modals/WhatsNew.tsx:36-37` maps to glyphs).
  - `api/client.ts:108` is a thrown `Error` message. I did not trace it to a screen.

  So at most 94 of the 123 rows are copy. The rows are also not strings: `shared/help.ts` holds 36
  prose literals by the AST scan against 27 inventory rows, because one match can swallow two
  adjacent literals (`shared/help.ts:61`, `:68`, `:72`, `:103`).
  Of the 25 widget rows, 14 are widget kind identifiers passed to `createWidget`
  (`widgets/PrayerWidget.tsx:769-776`, `widgets/LockPrayerWidget.tsx:192-193, 335-336, 494-495`). The
  other 11 rows hold six distinct strings.
  In all, 39 of the 205 rows sit on comment-only lines, against a "doc comments" bucket of 12.
- **Attack tried:** I checked whether the Explanation rows could be copy under another reading. They
  are `d` attributes of `<Path>`. PLAN.md step 9 lists `Explanation.tsx` in a strings wave on the
  strength of those four rows. The file's real copy is the `{prayerName}` title (`:67`) and the
  explanation props, which come from `shared/constants.ts`.
- **Consequence:** the plan must stop quoting 123 and 25 as work counts and as the catalog corpus. The
  per-file wave sizes in steps 8 to 10 need a regenerated census (see "Better alternatives"). The
  design is unaffected. The step files and the "which is nothing" claim in section 5 are.

### CNT-5. CONTRADICTED (MAJOR): at least 90 visible source sites and 31 config values sit outside the 205

- **Record says:** the 205 are the string surface. MEASURED.md section 1 calls the inventory "every
  capitalised string literal in production source". The pivot calls the 123 the display copy.
- **Evidence:** the regex needs a quote, a leading capital, 3 to 81 characters and a narrow character
  class. It cannot see JSX text, template literals, lowercase starts, digit starts, long strings, or
  any file that is not `.ts` or `.tsx`. The AST scan finds:
  - **JSX text: 56 nodes in 13 files.** 9 repeat a quoted string in the same file. 47 nodes (34
    distinct strings) appear nowhere in the inventory. `components/ui/Error.tsx:37-42` ("Oh no!",
    "Something went wrong.", "Try refreshing!", "Refresh") and `components/day/Day.tsx:48`
    ("London, UK") are in files with zero inventory rows. Others: the four Settings card headings
    (`components/sheets/screens/Settings.tsx:86, 115, 145, 158`),
    `components/modals/Update.tsx:16, 18`, `components/sheets/screens/Alert.tsx:222-223`,
    `components/sheets/screens/ColorPicker.tsx:121, 144`,
    `components/sheets/screens/ReminderCard.tsx:65, 70`, `components/sheets/screens/Sound.tsx:178`,
    all eight Qibla texts (`components/sheets/screens/Qibla.tsx:46, 47, 62, 63, 84, 87, 103, 112`),
    and 19 widget nodes (`widgets/LockPrayerWidget.tsx:59, 73, 74, 96, 111, 114` and the same six in
    the two other layouts, plus `widgets/PrayerWidget.tsx:493`).
  - **Prose literals the regex rejects: 16.** `shared/constants.ts:57-59` (three of the five Extras
    explanations start with a digit: `'20 mins before Fajr'`, `'20 mins after Sunrise'`,
    `'1 hour before Magrib (Fridays only)'`), `shared/help.ts:78, 82, 102, 124, 127`,
    `shared/whatsNew.ts:113, 120`, `components/sheets/screens/Alert.tsx:43, 46`,
    `widgets/PrayerWidget.tsx:336, 499`, and the two alert bodies `device/qibla.ts:38` and
    `hooks/useNotification.ts:59`.
  - **Visible template literals: 23.** Notification titles and channel names
    (`shared/notifications.ts:130, 181, 410, 502`), the ago badge (`hooks/usePrayerAgo.ts:36`, two),
    the unit suffixes (`shared/time.ts:540` two, `:545`, `:568`, `:572`, `:573`), the Android widget
    countdown (`widgets/PrayerWidget.tsx:296-298`), `components/sheets/parts/SoundItem.tsx:102` and
    `:127` (two), and the accessibility labels `components/countdown/Bar.tsx:166`,
    `components/prayer/Alert.tsx:185, 186`, `components/sheets/parts/Stepper.tsx:58, 75`.
  - **Short lowercase strings: 4.** `shared/time.ts:529` (`'0s'`), `:565` (`'now'`),
    `components/sheets/parts/Stepper.tsx:43` (`unit = 'min'`), `components/modals/WhatsNew.tsx:45`
    (`'iOS'`).
  - **`app.json`: 31 values.** The app name (`:3`), two iOS purpose strings (`:24`, `:25`), and 14
    widget `displayName` plus 14 `description` values shown in the OS widget gallery (`:206-373`).
  - **Concatenated fragments.** `components/modals/WhatsNew.tsx:29` (`v{version}`) and `:45`
    (`({platform} only)`) build a sentence from pieces.
  - **Two byte forms of one label.** `components/sheets/screens/Settings.tsx:164` holds
    `"What's new"` with a straight apostrophe and `:169` renders `What&#8217;s new` with a curly one.
    A byte-identical English catalog needs both.
- **Attack tried:** I checked whether the plural script covers the count-bearing explanations. It
  reads the inventory, so `'20 mins before Fajr'` and `'1 hour before Magrib (Fridays only)'` are
  absent from the plural surface it prints. Its 19 hits include four SVG paths and five widget
  argument lists.
- **Consequence:** the three string waves cannot reach zero from the inventory. A census produced by
  the guard's own scanner must replace it before the step files are written. The plural evidence
  needs a rerun on that census.

### CNT-6. CONTRADICTED (MAJOR): a hardcoded-string scan with a zero-length exclusion list is not achievable as the plan describes it

- **Record says:** PLAN.md step 14 switches on a Jest source scan "against a zero-length exclusion
  list", and section 5 says it then flags "only what remains, which is nothing".
- **Evidence:** the plan does not define the scan rule. There are two possible rules, and each fails
  the claim.
  A literal-pattern scan in the style of `inventory-strings.py` flags 330 literals in the AST scan
  that are code, not comments. 147 are logger arguments, 128 are plain literals (enum values such as
  `shared/types.ts:246-257`, font names at `shared/constants.ts:284, 286`, widget kind names, name
  arrays), 4 are `d` attributes, 3 are thrown errors. The script's own logger filter works per line
  (`inventory-strings.py:22`), so a logger call that wraps its message onto the next line would
  escape it. No such line exists today (I checked all 147).
  That scan needs a non-empty exclusion list by construction.
  A context-scoped scan (JSX text, a fixed set of visible attributes, `Alert.alert` arguments) can
  run with no exclusions. It then cannot see copy that reaches the screen through a variable:
  everything in `shared/help.ts`, `shared/whatsNew.ts` and `shared/constants.ts:54-59`, the
  notification titles and channel names built at `shared/notifications.ts:130, 181, 410, 502`, and
  the units in `shared/time.ts:528-574`. It also flags, today, the sites in CNT-5 that no wave lists.
  What neither rule may flag: 204 logger literals, 10 `testID` values (`'qibla-place'` and nine
  more), five `accessibilityRole` values, four `perfName` values, style values, storage key and
  identifier templates (`stores/database.ts:138-304`, `stores/notifications.ts:207-579`), and SVG
  path data.
- **Attack tried:** I looked for a rule that is both exclusion-free and complete. Data modules defeat
  it: a string in `shared/help.ts` is indistinguishable from an enum value without knowing its sink.
- **Consequence:** the plan must specify the guard as two parts: a context-scoped AST scan with no
  exclusions for JSX text, visible attributes and alert arguments, and a module-level rule that the
  named data modules export catalog keys only. PLAN.md section 2.2 tells the executor to stop on any
  output the plan does not predict, so the guard as written stops the session at step 14.

### CNT-7. CONTRADICTED (MAJOR): R14's own table lists 85 affected suites, not 74, and at least 5 more are missing

- **Record says:** R14 header and totals table: 74 distinct affected suites, 62 in class 1, 38 in
  class 2, 24 in class 3, 18 in class 4, 7 in class 5. PLAN.md section 4 repeats 74.
- **Evidence:** R14's table runs from line 16 to line 100. That is 85 rows naming 85 distinct files,
  and every file exists. Tallying the table's own category column gives 62, 38, 28, 17 and 8 (7 plus
  the one marked indirect). Classes 1, 2 and 5 match. Class 3 is 28, not 24. Class 4 is 17, not 18.
  The distinct total is 85, not 74.
  My class greps match R14 for class 2 (38 suites, none outside the table). They find five suites
  the table lacks:
  - `stores/__tests__/notificationsOctober18Midnight.test.ts`: `:28` passes `'Midnight'`, and
    `:42-45, 56-59, 78-81` pin twelve identifiers such as `'athan_extra_midnight_2026-10-18'`.
  - `shared/__tests__/notificationNativeTimeout.test.ts:22-23` pins
    `'athan_standard_fajr_2026-09-16'`. R14 lists only the `device/` suite of the same name.
  - `shared/__tests__/candidateHorizon.test.ts:50, 57, 64` passes `'Midnight'`, `'Last Third'` and
    `'Fajr'`. R14 lists this suite as clean.
  - `components/ui/__tests__/InitialWidthMeasurement.test.tsx:18-19` pairs `'Sunrise'` and
    `'Last Third'` with the two width atoms. R14 lists it as clean, and PLAN.md step 11 rewrites the
    component and those atoms.
  - `components/prayer/__tests__/Time.test.tsx:23-24`.

  That makes at least 90 of 189.
- **Attack tried:** I checked whether the five would pass untouched. The identifier strings stay
  byte-identical under R15, so the pinned ids survive. The capitalised name arguments are at risk: a
  `'Midnight'` or `'Fajr'` that reaches a parameter step 5 retypes as the lowercase `PrayerId` union
  stops type-checking. I did not trace each of these calls to its parameter.
- **Consequence:** PLAN.md section 10 says a failing test the step did not name is a STOP. With a
  list that is short by 16 suites the executor stops repeatedly. R14 needs regenerating from a stated
  pattern set, and step files must name suites from that list.

### CNT-8. CONTRADICTED (MINOR): there are 189 suites, not 171, at every sha the record names

- **Record says:** R14 line 3 and the pivot digest: 171 test files scanned.
- **Evidence:** `git ls-files | grep -E '\.test\.(ts|tsx|js|jsx)$' | wc -l` prints 189 (147 `.test.ts`,
  42 `.test.tsx`). `npx jest --listTests --watchman=false` prints 189 paths and the two lists are
  identical. `git ls-tree -r --name-only <sha>` with the same filter prints 189 at `5ad6aaba`, at
  `500e5037` and at `52109ec0`.
- **Attack tried:** I looked for a filter that yields 171 (extension, directory, `__tests__` only).
  None does. All 189 sit under `__tests__` folders.
- **Consequence:** 18 suites were never scanned. That is the likely source of the misses in CNT-7.
  Correct the figure when R14 is regenerated.

### CNT-9. CONTRADICTED (MINOR): the commit-signature set is six suites, and it is a different six

- **Record says:** R14 and PLAN.md step 4: removing the Arabic parameter rewrites argument lists in
  eight suites, named in R14.
- **Evidence:** `git grep -lE 'commitPrayerAlertChange|commitAlertMenuChanges' -- '*.test.ts' '*.test.tsx'`
  lists six files. Five are in R14's eight. The sixth, `stores/__tests__/notifications.test.ts`
  (`:1646`, `:1668`), is not. Three of R14's eight never call either function. Their only Arabic
  marker is a stored-record fixture field: `stores/__tests__/notificationRefreshGate.test.ts:156`,
  `stores/__tests__/notificationOffCancelFailure.test.ts:92` and
  `stores/__tests__/notificationStaleCancelFailure.test.ts:59`, each `arabicName: 'الفجر'`.
- **Attack tried:** I searched those three for any `commit...(` call. There is none.
- **Consequence:** step 4's suite list changes. Those three belong to the bookkeeping-record shape
  change, and R18 says the parser ignores the extra field, so they may need no edit at all.

### CNT-10. CONTRADICTED (MINOR): the "five largest refactors" figures cannot be reproduced and the order differs

- **Record says:** `schedule.test.ts` 106 marker lines, `notificationAlertCommit` about 80,
  `notifications.test.ts` 63, `prayer.test.ts` about 55, `widgetSimulation` about 45.
- **Evidence:** R14 never states its patterns. With the class 1, 2 and 4 patterns in "Method", lines
  per suite are: `stores/__tests__/notifications.test.ts` 253,
  `stores/__tests__/schedule.test.ts` 165, `shared/__tests__/prayer.test.ts` 126,
  `stores/__tests__/notificationAlertCommit.test.ts` 112,
  `shared/__tests__/widgetTimeline.test.ts` 102, `shared/__tests__/nightTimes.test.ts` 93,
  `shared/__tests__/sequence.test.ts` 79, `shared/__tests__/widgetSimulation.test.ts` 77,
  `shared/__tests__/notifications.test.ts` 77.
- **Attack tried:** I tried class 1 alone and class 1 plus 2. `stores/__tests__/notifications.test.ts`
  stays first (189 on class 1 alone) and never falls near 63.
- **Consequence:** treat the five as a rough ranking only. `widgetTimeline`, `nightTimes` and
  `sequence` outrank `widgetSimulation`. Regenerate with the patterns written down.

### CNT-11. CONTRADICTED (MAJOR): none of the plan's anchors exists at this sha

- **Record says:** PLAN.md section 3 says the pre-flight is saved to `scripts/preflight-38.sh` and
  that every anchor under `scripts/anchors/` counts exactly 1. Section 4 says `scripts/anchors/`
  holds the verbatim excerpts each step edits against. Section 6 lists fifteen files under `steps/`.
- **Evidence:** `ls` of `ai/plans/39-localisation/scripts/anchors`,
  `ai/plans/39-localisation/steps` and `ai/plans/39-localisation/scripts/preflight-38.sh` each
  returns "No such file or directory". `git ls-files ai/plans/39-localisation | grep -E 'anchors|steps|preflight'`
  prints nothing. `scripts/` holds 13 files, none of them a pre-flight or an anchor. `LOG.md` is four
  lines with no execution entry.
- **Attack tried:** I read PLAN.md's "Resume from" note. It admits the step files are not written. It
  also says everything they need is in "the anchors under `scripts/anchors/`", which do not exist.
- **Consequence:** PLAN.md is a skeleton. Sections 3 and 4 must be reworded to future tense or the
  artefacts written. Section 10's "any anchor count other than 1: NEEDS REPLAN" has nothing to count.

### CNT-12. CONTRADICTED (MAJOR): R13 misses the sites where the name travels under another identifier, including a sixth silent seam

- **Record says:** PLAN.md section 4: R13 is "every file:line to touch". The pivot digest counts 15
  production read sites, 8 baking sites, 3 re-push paths and 6 formatters in `shared/time.ts`.
- **Evidence:** R13 maps direct `.english` reads. It does not follow the value after it is copied.
  - **The countdown name slot (the sixth seam).** `stores/countdown.ts:413-414` and `:430` write a
    prayer name into `CountdownStore.name`. `:45` seeds the literal `'Fajr'`. `:423` writes the
    sentinel `COUNTDOWN_WAITING_NAME`, defined as `'...'` at `shared/constants.ts:275`.
    `hooks/useCountdown.ts:47` reads the slot and `components/countdown/Countdown.tsx:46-47` both
    compares it to the sentinel and renders `{prayerName}` raw. R13 cites `:45`, `:413-414` and
    `:430` only. After step 5 this slot holds an id or a non-id sentinel. If the slot stays typed
    `string` and the renderer wraps it in the label lookup, the sentinel resolves to nothing and the
    waiting state renders blank with no error. Neither `Countdown.tsx` nor `useCountdown.ts` appears
    in R13's per-file table.
  - **Other raw renders of a carried name.** `components/prayer/Explanation.tsx:67` renders
    `{prayerName}` as the box title (R13 cites this file for the Arabic line only).
    `components/sheets/screens/Alert.tsx:95` uses `sheetState?.prayerEnglish` as the sheet title and
    `:85-86` passes both names to the commit. R13's table gives that file 4 sites and cites no line.
  - **The plan key.** `shared/notifications.ts:252-253` builds `${scheduleType}_${englishName}`,
    written at `:277` and read at `:360` with `?? []`. A caller that passes a label where the walk at
    `:324-325` used an id gets an empty day list, so that prayer arms nothing, silently. R13 cites
    `:324` and not the key.
  - **A formatter inside the widget runtime.** `widgets/PrayerWidget.tsx:292-299` (`ALabel`) builds
    the Android widget countdown with English unit letters at render time. The widget runtime cannot
    call the catalog, so these units need a new baked prop and a `WIDGET_PROPS_VERSION` bump. R13
    lists the footer parser at `:303-310` and omits this.
  - **Count slips.** `shared/time.ts` has seven English-pinned sites by R13's own section 6 (`:25`,
    `:229-233`, `:243`, `:318`, `:329`, `:528`, `:564`), not six. R13 names a fourth re-push path,
    the `stores/sync.ts` data landings, without lines. They are `stores/sync.ts:253` and `:259`. The
    digest's "3 re-push paths" omits it.
  - **The record never names these.** A search of the whole plan folder for `COUNTDOWN_WAITING`,
    `schedulePlanKey` and `ALabel` returns nothing. In R13, `Countdown.tsx` and `useCountdown` do not
    appear at all, and `components/sheets/screens/Alert.tsx` appears only as a table row.
- **Attack tried:** I checked what catches these today. English render tests catch a raw id in the
  countdown (`components/countdown/__tests__/Countdown.test.tsx:52, 64, 75` assert `'Asr'` and
  `'Magrib'`), and `:102` pins the waiting state to the text `'...'`. So the countdown seam is silent
  at runtime and loud in the suite, provided the executor does not edit that assertion with the
  change. Nothing pins the widget units to a catalog, and the plan key has no type guard today
  (`englishName: string` at `shared/notifications.ts:252`).
- **Consequence:** add these sites to the map before steps 5, 6, 10 and 13 are written. Type the
  countdown slot as `PrayerId | typeof COUNTDOWN_WAITING_NAME` so the compiler forces the branch.
  Retype `schedulePlanKey` and `genScheduleDatesForPrayer` to `PrayerId` in step 5. Decide in the
  plan whether the widget's `h` and `m` are baked props. PLAN.md section 5's invariant says every
  user-visible string reaches the screen through `t()`, and `ALabel` cannot call it.

### CNT-13. CONTRADICTED (MINOR): "27 MMKV preference keys" matches no measurement

- **Record says:** pivot fact 2 cites `identifier-contract.py` for 27 MMKV preference keys.
  PLAN.md section 1 says 27 storage keys. R15 says "4 families, 27 sites".
- **Evidence:** the cited script prints `MMKV preference key (stores/notifications.ts, 8 sites)`. Its
  pattern gives 8 on `git show 77eb52fe:stores/notifications.ts` too, the sha MEASURED.md was written
  at. MEASURED.md section 2 carries both numbers: 27 in its first table and 8 in its second. The
  distinct key strings number up to 66: 11 names times one alert key (`stores/notifications.ts:207`), two reminder
  alert keys and two reminder interval keys (`:258`, `:278`, with `REMINDER_SLOTS = [0, 1]` at
  `shared/types.ts:219` and the suffix at `stores/notifications.ts:241`), and one repair mark
  (`:335`).
- **Attack tried:** I looked for any count that yields 27. Lines containing `preference_` in
  `stores/notifications.ts`: 17. In all production source: 35.
- **Consequence:** step 1's freeze table must enumerate 66 key strings, not 27. Fix the wording in
  PLAN.md section 1.

### CNT-14. CONTRADICTED (MINOR): pivot fact 9 says the stored day rows carry name fields, and they do not

- **Record says:** pivot fact 9: the stored day rows carry `english` and `arabic` name fields,
  evidence `stores/database.ts`.
- **Evidence:** `stores/database.ts:136-141` stores `ISingleApiResponseTransformed` under
  `prayer_${prayer.date}`. `shared/types.ts:108-122` declares that shape as `date` plus nine time
  fields, `fajr` to `istijaba`, and no name. The name fields live on the in-memory `PrayerRow`
  (`shared/types.ts:270`, `:272`). R13 section 3, R18 and the pivot's own blast-radius digest all say
  the stored days hold no names.
- **Attack tried:** I checked whether fact 9 could mean the bookkeeping records. Those hold
  `englishName` and `arabicName` (`shared/notifications.ts:17-24`), not `english` and `arabic`, and
  they are not day rows.
- **Consequence:** strike fact 9 or rewrite it. PLAN.md section 5 still lists "the storage row-shape
  change" as a stage of the approach. No stored shape changes, so that phrase must go or name the
  in-memory row.

### CNT-15. CONTRADICTED (MINOR): the census covers Jest only, and all six Maestro flows assert English text

- **Record says:** nothing. A search of the plan folder for `maestro` and `e2e/` finds two lines,
  both in `research/R5-PRODUCTION-ENGINEERING.md` about a timing measurement.
- **Evidence:** six flows. Five end on `'London, UK'` (`e2e/flows/smoke.yaml:8`,
  `overlay-x10.yaml:20`, `sheets-x10.yaml:29`, `sounds-x5.yaml:37`, `toggles-x10.yaml:24`), which is
  the JSX text at `components/day/Day.tsx:48` and is outside the inventory. One waits on `'Midnight'`
  and `'Fajr'` (`swipes-x15.yaml:16`, `:23`). None selects an Arabic name. Four tap absolute pixels
  inside the Settings sheet or the list.
  Six scripts. None parses a prayer name. `e2e/scripts/device_checks.py:20-23` records that the alarm
  dump carries no per-notification identifier. `e2e/scripts/device-checks.sh:158-164` greps channel
  ids (`extras_at_time`, `athan_<n>`), which R15 freezes.
- **Attack tried:** I tested whether the stage-one removal of the Arabic toggle shifts the tapped
  rows. `components/sheets/screens/Settings.tsx:78` fixes the sheet at `snapPoints={['85%']}`, and
  the removed row (`:128-132`) sits below "Change athan" (`:87-98`) and "Show seconds" (`:122`), the
  two rows the flows tap. On a code reading the coordinates hold. Stage one keeps English bytes, so
  the text assertions hold too.
- **Consequence:** none for stage one. Stage two must either keep the flows on an English device or
  move them to `testID` selectors. Add one line to the plan so the flows are a named decision.

### CNT-16. CONTRADICTED (MINOR): the record gives different numbers for the same thing in eleven places

- **Record says / Evidence:** each row names the pair and the value that is right at this sha.

| Thing | One place | Another place | Right at `52109ec0` |
| --- | --- | --- | --- |
| Inventory size | 205 literals, 48 files (pivot fact 1) | 194 strings, 43 files (R13 section 8, MEASURED.md, the tracked JSON) | 205 and 48 after a rerun. The tracked JSON holds 194 and 43 |
| Display copy | 123 (pivot) | 113 (MEASURED.md, classifier on the tracked JSON) | 123 rows by the classifier. At most 94 are copy (CNT-4) |
| R13 "top files by display-copy count" | `widgets/PrayerWidget.tsx` 20, `shared/types.ts` 15, `shared/whatsNew.ts` 13, `Settings.tsx` 11 (R13 section 8) | `shared/whatsNew.ts` 14, `Settings.tsx` 12 (pivot fact 1) | R13's list is all-literal totals from the older run. `shared/types.ts` holds 16 rows and none is display copy. The classifier puts `PrayerWidget.tsx` in the widget bucket |
| `Qibla.tsx` strings | 8 (pivot digest, R13 table) | 11 sites (R13 section 8 list) | 8 JSX texts, 1 accessibility label (`:109`), 1 title (`:140`), 1 place line (`:166-168`). The inventory sees 2 |
| `device/qibla.ts` strings | 4 (pivot digest) | 3 (R13 table) | 4 (`:37`, `:38`, `:40`, `:41`). The inventory sees 3 because the body exceeds 81 characters |
| Name-bearing constants | 6 arrays (pivot digest, R14) | 8 definitions (R13 table) | 8, all listed in R13 section 2 |
| `shared/time.ts` formatters | 6 (pivot digest, R13 table) | 7 sites (R13 section 6) | 7 |
| `showArabicNamesAtom` | 3 consumers (pivot digest) | definition plus two (R13 section 7) | 1 definition (`stores/ui.ts:132`) and 2 consumers (`components/prayer/Prayer.tsx:36`, `Settings.tsx:37`) |
| Production read sites | 15 (pivot digest) | 13 bullets (R13 section 1) | 30 lines in 12 files, all inside R13's citations |
| Preference keys | 27 (pivot, PLAN.md, R15) | 8 sites (MEASURED.md second table, the script) | 8 builder lines, 66 distinct keys (CNT-13) |
| Countdown example | `1H 10M` (pivot Q4, ruling D21) | `shared/time.ts:540` builds `${totalHours}h` and `${minutes}m` | lowercase units. No uppercase transform exists in app code. Only the widget uppercases (`widgets/PrayerWidget.tsx:378`, `:606`) |

- **Attack tried:** for each pair I ran the count rather than choose between the documents.
- **Consequence:** correct each figure where the plan quotes it. None changes the design.

### CNT-17. UNCERTAIN: whether the `app.json` strings can follow the in-app language at all

- **Record says:** ruling D17 says every user-visible string follows the selected language. PLAN.md
  has no step for the app name, the two iOS purpose strings or the 28 widget gallery strings.
  `research/R5-PRODUCTION-ENGINEERING.md:440-453` names the `expo.locales` mechanism for the purpose
  strings and the display name.
- **Evidence:** `app.json:24-25` and `:206-373` hold the values. They reach the OS through the native
  project, not through JavaScript, so `t()` cannot serve them. I did not establish from a primary
  source whether the OS picks these by the system language, by the per-app language, or whether an
  in-app picker can move them. I read only the matching lines of R5, not the whole report.
- **Attack tried:** I confirmed the inventory cannot see them (the script reads `.ts` and `.tsx`
  only) and that no plan step names them.
- **Consequence:** what settles it: the generated `InfoPlist.strings` and Android `strings.xml` after
  a prebuild with `expo.locales` set, then a device check that switches the in-app language with the
  system language unchanged and reads the permission prompt and the widget gallery. If they follow
  the system only, D17 needs a recorded exception.

### CNT-18. CONFIRMED: pivot facts 3, 4, 6, 7, 8 and 10 hold on the lines they cite

- **Record says:** the facts table in `SINGLE-LANGUAGE-PIVOT.md`.
- **Evidence:** fact 3: `components/prayer/Prayer.tsx:91-93`, `Settings.tsx:128-132` (read in full),
  `components/prayer/Explanation.tsx:80`, `shared/types.ts:272`, `shared/prayer.ts:314`,
  `shared/notifications.ts:125, 169, 176`, `stores/notifications.ts:877`, `stores/ui.ts:19-20`.
  Fact 4: `stores/ui.ts:216-219` (`setEnglishWidth`, grow-only comment), `stores/sync.ts:365`,
  `stores/version.ts:155`, `components/prayer/Time.tsx:64` (`flex: 1`) and `:70`
  (`textAlign: 'center'`). Fact 6: `shared/time.ts:243` (`'en-US-u-ca-islamic-umalqura'`), and
  `toArabicNumbers` has one production caller at `Explanation.tsx:80`. Fact 7: `package.json` has no
  `expo-localization`. Fact 8: 67 files under `assets/audio/reminders/`. Fact 10:
  `device/notifications.ts:50, 66`.
- **Attack tried:** a tree-wide search for `I18nManager` (fact 5's zero) returns nothing in tracked
  `.ts` and `.tsx` files. A search for `Intl.`, `toLocale...` and `en-US` outside `shared/time.ts`
  returns nothing, so no second locale-pinned formatter hides elsewhere except the widget one in
  CNT-12.
- **Consequence:** none. Fact 1 holds as arithmetic only (CNT-2, CNT-4). Fact 2's 27 fails (CNT-13).
  Fact 9 fails (CNT-14). Fact 5's native citations are not checked here.

## Better alternatives

**Replace the inventory with the guard's own scanner, run by the pre-flight.** The counts are not
reliable as an execution map: the buckets overcount by about 30 non-copy rows and undercount by at
least 90 visible sites. One AST scan should produce both the census and the step 14 guard, so the
waves and the guard cannot disagree. Shape: a Jest suite (or a `scripts/` Node file the suite calls)
that parses production source with `@babel/parser`, already in `node_modules`, and emits one row per
JSX text node, per visible attribute (`accessibilityLabel`, `accessibilityHint`, `title`, `subtitle`,
`label`, `hint`), per `Alert.alert` argument, and per string exported from the named data modules.
Cost: about 150 lines and one test file. The scratch version in this session is about 60 lines and
parses 129 files in under two seconds. No dependency, no bundle bytes, no runtime cost. Risk: the
visible-attribute list is a judgement that needs one review. It displaces `inventory-strings.py`,
`classify-strings.py`, `plural-surface.py` and the tracked `string-inventory.json`. The pre-flight
runs it at the execution sha and fails if the row count differs from the count the step files were
written against, which also replaces the missing anchor mechanism for the string waves.

**Regenerate R14 from written patterns.** A 40-line script with the four pattern sets in "Method"
reproduces the class totals in seconds and lists every suite. Cost: the script plus a reread of the
16 suites R14 lacks. It removes the unreproducible marker counts. Class 3 (display copy) still needs
a human pass, because a copy assertion has no reliable pattern.

**Keep R13 as the map and patch it.** R13's citations are accurate and the `PrayerId` union plus
`tsc` will surface most missed consumers at compile time. The cheaper fix for CNT-12 is to add the
listed sites and one rule to step 5: after the rename, every remaining `: string` parameter or field
that R13 names as carrying a prayer name is retyped or justified. Cost: one paragraph in the step
file. No regenerated blast-radius census is needed.

**Write the anchors or drop the claim.** Verbatim anchors for 15 steps are roughly a day of planning
work. With no source drift since `5ad6aaba` they would be valid today. The alternative is a
pre-flight that runs the 208-row citation list from this session against the execution sha, which
costs the list (already built in scratch, not committed) and a 30-line checker.

## Not verified

- **Partial reads of production source.** I read `components/sheets/screens/Settings.tsx` in full.
  For every other production file I relied on the citation checker (token inside the cited range)
  and on line-range reads: `shared/notifications.ts` 228-282 and 350-362, `stores/notifications.ts`
  196-210, 236-282 and 328-338, `stores/countdown.ts` 36-50 and 405-434,
  `components/countdown/Countdown.tsx` 20-52, `widgets/PrayerWidget.tsx` 284-337 and 766-777,
  `widgets/LockPrayerWidget.tsx` 190-194, `components/prayer/Explanation.tsx` 46-92,
  `components/modals/WhatsNew.tsx` 26-47, `shared/whatsNew.ts` 230-238, `shared/time.ts` 240-247 and
  520-575, `shared/types.ts` 106-123, `stores/database.ts` 134-146, `stores/ui.ts` 209-219,
  `stores/sync.ts` 361-366, `stores/version.ts` 152-156, `components/prayer/Time.tsx` 61-73,
  `components/ui/Error.tsx` 34-43, `components/day/Day.tsx` 44-50,
  `components/sheets/parts/Stepper.tsx` 40-60, `components/sheets/screens/Qibla.tsx` 160-170, and a
  handful of two-line spot reads. The AST scan parsed all 129 production files mechanically.
- **Partial reads of the record.** `research/R5-PRODUCTION-ENGINEERING.md`,
  `research/R15-IDENTIFIER-DESIGN.md` and `research/R18-UPGRADE-PATH.md` were searched for specific
  lines, not read. `research/string-inventory.json` was loaded whole by script, not read by eye.
  `e2e/README.md` was not read.
- **What a citation hold proves.** The checker proves the cited range holds the named identifier or
  string. It does not prove the surrounding logic matches R13's prose. Six tokens are loose and prove
  little on their own: `stores/schedule.ts:89` and `:323-326`,
  `components/overlay/OverlayInfoBox.tsx:73`, `stores/notifications.ts:1499-1541` and `:1528-1533`,
  and `components/sheets/screens/Qibla.tsx:166-168` (the last one I then read).
- **R14's per-suite line citations** (the bracketed line lists in its table) were not checked.
  Class 3 was not recounted independently: I tallied R14's own table only.
- **The 18 suites that my greps did not hit but R14 lists** are all class 3 or class 5 indirect. I did
  not open them.
- **`widget-payload.py`** was read and not run. Its inputs are hard-coded samples, not counts under
  test.
- **Pivot fact 5** (native RTL behaviour, `I18nUtil.kt`, `RCTI18nUtil.m`) was not checked.
- **Whether `api/client.ts:108`'s error message reaches a screen** was not traced.
- **Needs a device:** that the Settings sheet rows the flows tap keep their pixel positions after
  the Arabic toggle row is removed, and everything in CNT-17.
- **No test was executed.** `jest --listTests` only lists paths.
