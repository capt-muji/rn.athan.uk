# Step 1 — the native-digit map dies, every surface renders Latin

Requirements: R1.1, R1.2, R1.3, R1.4, R1.5, R1.6
Weight: 2

Anchor check (before anything else; a count other than 1 is `STOP:`):
a01 in `shared/i18n/locale.ts`, a02 and a03 in `shared/time.ts`, a04 in
`components/modals/Help.tsx`, a05 in `components/prayer/Explanation.tsx`,
a06 in `components/sheets/parts/Stepper.tsx`, a08 in `shared/typography.ts`,
a09 in `shared/__tests__/dateLocalized.test.ts`, a10 in
`components/prayer/__tests__/Explanation.test.tsx`, a13 in
`shared/__tests__/locale.test.ts`. Count each with
`python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' <anchor> <source>`.

Goal: delete `NATIVE_DIGITS` and `localizeDigits` from
`shared/i18n/locale.ts`, unwrap the twelve `localizeDigits(...)` call
expressions across four files, and flip every pinned native-digit test to
Latin expectations.

Branch: `git checkout -b ticket/88-step1 lane/88`.

Files: `shared/i18n/locale.ts`, `shared/typography.ts`, `shared/time.ts`,
`components/modals/Help.tsx`, `components/prayer/Explanation.tsx`,
`components/sheets/parts/Stepper.tsx`, `shared/__tests__/locale.test.ts`,
`shared/__tests__/dateLocalized.test.ts`,
`components/prayer/__tests__/Explanation.test.tsx`,
`components/sheets/parts/__tests__/Stepper.test.tsx`,
`components/modals/__tests__/Help.test.tsx`,
`components/sheets/screens/__tests__/Alert.test.tsx`,
`shared/__tests__/widgetTimeline.test.ts`.

## Red tests

Write these before any source change. The jest projects are named `unit`
and `components` (`jest.config.js` lines 45 and 62). Run the three suites
under `shared/__tests__/` with
`npx jest <path> --watchman=false --selectProjects=unit` (the locale suite's
change is a deletion with no red run), and the three component test files
with `--selectProjects=components`. Every named new or flipped test must
fail; a test that passes is `STOP:`.

1. `shared/__tests__/dateLocalized.test.ts`:
   - File header line 4: replace `and each locale's own digits` with
     `and Latin digits in every locale (row 88)`.
   - The test `composes the label from the ar calendar keys with
     Arabic-Indic digits` becomes `composes the label from the ar calendar
     keys with Latin digits` and its body expects
     `formatDateLocalized('2026-10-11')` to be
     `'الأحد, 11 أكتوبر 2026'` and adds
     `expect(formatDateLocalized('2026-10-11')).not.toMatch(/[\u0660-\u0669]/)`.
   - The test `draws the ar catalog month with Arabic-Indic digits and no
     era under ar` becomes `draws the ar catalog month with Latin digits and
     no era under ar` and expects
     `formatHijriDateLocalized('2026-10-11')` to be
     `'ربيع الآخر 30, 1448'`.
   - Red today: the received values are
     `'الأحد, ١١ أكتوبر ٢٠٢٦'` and `'ربيع الآخر ٣٠, ١٤٤٨'`.
2. `components/prayer/__tests__/Explanation.test.tsx`:
   - File header line 2: `its words, its Arabic digits` becomes
     `its words, its Latin digits`.
   - The ar describe's test name `renders its sentence with the
     locale\u2019s own digits` becomes `renders its sentence with Latin
     digits under ar`; its body replaces both `getByText(/\u0662\u0660/)`
     lines with
     `expect(screen.getByText(t(EXTRAS_EXPLANATIONS[2])).props.children).toBe(t(EXTRAS_EXPLANATIONS[2]))`
     and
     `expect(screen.getByText(t(EXTRAS_EXPLANATIONS[2])).props.children).not.toMatch(/[\u0660-\u0669]/)`.
     The comment above it becomes `// The ar Suhoor sentence carries 20
     minutes; row 88 renders every digit Latin`.
   - The sweep describe renames to `the five Extras boxes across the six
     locales` with test name `renders $key under $locale with the catalog
     bytes and Latin digits`; its body becomes
     `const shown = screen.getByText(t(key));` then
     `expect(shown.props.children).toBe(t(key));` then
     `expect(shown.props.children).not.toMatch(/[\u0660-\u0669]/);`. The
     describe's comment becomes `// Row 88: every sentence renders the
     catalog bytes untouched, digits Latin in every locale`.
   - Remove `localizeDigits` from the import from `@/shared/i18n/locale`
     (keep `LOCALE_IDS` and `setActiveLocale`).
   - Red today: the rendered ar sentence carries `٢٠`, so
     `getByText(t(key))` matches nothing under ar.
3. `components/sheets/parts/__tests__/Stepper.test.tsx`, new describe
   `the reminder stepper under ar` after the first describe:

   ```tsx
   describe('the reminder stepper under ar', () => {
     it('shows the Latin number beside the ar word for minutes', async () => {
       setActiveLocale('ar');
       try {
         await render(<Stepper value={15} onDecrement={jest.fn()} onIncrement={jest.fn()} />);

         expect(screen.getByText('15')).toBeOnTheScreen();
         expect(screen.getByText('دقيقة')).toBeOnTheScreen();
         expect(screen.getByText('15').props.children).not.toMatch(/[\u0660-\u0669]/);
         expect(screen.getByLabelText('15 دقيقة')).toBeOnTheScreen();
       } finally {
         setActiveLocale('en');
       }
     });
   });
   ```

   Add `setActiveLocale` to the import from `@/shared/i18n/locale`. Red
   today: the value renders `١٥`, so `getByText('15')` matches nothing.
4. `shared/__tests__/widgetTimeline.test.ts`, new test directly after
   `bakes Latin digits into every carried time under ar`:

   ```ts
   it('bakes no Arabic-Indic digit into any prop string under ar', () => {
     setActiveLocale('ar');
     try {
       for (const settings of [SETTINGS, SETTINGS_HIJRI]) {
         const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), settings, 'light');
         const snapshot = buildPrayerWidgetSnapshot(makeSequence(), settings);
         expect(snapshot).not.toBeNull();
         for (const entry of entries) {
           expect(JSON.stringify(entry.props)).not.toMatch(/[\u0660-\u0669]/);
         }
         if (snapshot) {
           expect(JSON.stringify(snapshot)).not.toMatch(/[\u0660-\u0669]/);
         }
       }
     } finally {
       setActiveLocale('en');
     }
   });
   ```

   Red today: the Gregorian `dateLabel` localises its day and year
   (`formatDateLocalized`) and the Hijri `dateLabel` its day and year too,
   so both settings legs carry Arabic-Indic digits.
5. `shared/__tests__/locale.test.ts`: delete the whole `localizeDigits`
   describe (the a13 anchor block) and remove `localizeDigits` from the
   import list; one of the two now-adjacent blank lines goes with the block
   (Biome collapses a doubled blank line). This file's change is a deletion;
   it has no red run.
6. `components/modals/__tests__/Help.test.tsx`, new describe at the end:

   ```tsx
   describe('the Help modal under ar', () => {
     it('renders every answer with the catalog bytes and Latin digits', async () => {
       setActiveLocale('ar');
       try {
         const topics = getHelpTopics('ios');
         await render(<ModalHelp visible={true} onClose={jest.fn()} />);

         for (const topic of topics) {
           await fireEvent.press(screen.getByRole('button', { name: topic.question }));
           const shown = screen.getByText(topic.text);
           expect(shown.props.children).toBe(topic.text);
           expect(shown.props.children).not.toMatch(/[\u0660-\u0669]/);
         }
       } finally {
         setActiveLocale('en');
       }
     });
   });
   ```

   Add `setActiveLocale` to the imports
   (`import { setActiveLocale } from '@/shared/i18n/locale';`). Red today:
   the cutoff topic's ar answer carries `30` in the catalog, which
   `localizeDigits` renders as `٣٠`, so `getByText(topic.text)` matches
   nothing for that topic.
7. `components/sheets/screens/__tests__/Alert.test.tsx`, the test
   `renders the visible reminder interval with the locale digits under ar`:
   the assertion `expect(screen.getByText('\u0661\u0665')).toBeOnTheScreen());`
   becomes `expect(screen.getByText('15')).toBeOnTheScreen());` plus
   `expect(screen.getByText('15').props.children).not.toMatch(/[\u0660-\u0669]/);`,
   and the comment above it becomes
   `// Row 88, 2026-10-15: Latin digits on every value, the stepper's word kept`.
   Red today: the sheet renders the stepper value as `١٥`, so
   `getByText('15')` matches nothing.

## Change contracts

1. `shared/i18n/locale.ts`: delete the `NATIVE_DIGITS` declaration with its
   two-line doc comment and the whole `localizeDigits` function (the a01
   anchor block); one of the two now-adjacent blank lines goes with the
   block, because Biome collapses a doubled blank line. Nothing else in the
   file changes; `RTL_IDS`, `localeDirection`, `directionGlyph`, `chevronFor`
   stay byte-identical.
2. `shared/typography.ts` (a08): the `RECORDS` comment becomes
   `/** One record per shipped locale: a new language adds its entry here
    * and its id to RTL_IDS if it reads right to left */` (the numerals
   clause deleted; digits are Latin everywhere, row 88).
3. `shared/time.ts` `formatDateLocalized` (a02): the composed line becomes
   `` const composed = `${t(GREGORIAN_WEEKDAY_KEYS[isoWeekday - 1])}, ${String(day)} ${t(GREGORIAN_MONTH_KEYS[month - 1])} ${String(year)}`; ``.
   The doc comment line `the shape and order stay frozen` keeps; no comment
   in this function mentions digit localisation (none does today).
4. `shared/time.ts` `formatHijriDateLocalized` (a03): the composed line
   becomes
   `` const composed = `${t(HIJRI_MONTH_KEYS[hijriMonth - 1])} ${String(hijriDay)}, ${String(hijriYear)}`; ``
   and the doc comment's `then the day and year pass localizeDigits;`
   becomes `with Latin digits in every locale (row 88);`.
   Remove the now-unused `import { localizeDigits } from
   '@/shared/i18n/locale';` line at the top of the file.
5. `components/modals/Help.tsx` (a04): `{localizeDigits(text)}` becomes
   `{text}`; `{localizeDigits(step)}` becomes `{step}`;
   `{localizeDigits(getHelpActionLabels()[action])}` becomes
   `{getHelpActionLabels()[action]}`; the import keeps `chevronFor`,
   `currentLocaleId`, `directionGlyph` and drops `localizeDigits`.
6. `components/prayer/Explanation.tsx` (a05):
   `{localizeDigits(explanation)}` becomes `{explanation}`; the import keeps
   `currentLocaleId` and drops `localizeDigits`.
7. `components/sheets/parts/Stepper.tsx` (a06): the three
   `localizeDigits(t('stepper.<key>', ...))` accessibility labels lose the
   wrapper, the value `{localizeDigits(visible)}` becomes `{visible}`, and
   the import keeps `currentLocaleId` and drops `localizeDigits`. No
   styling, layout or word changes.

Nothing beyond these contracts. No other file loses or gains a line.

## Green run

1. `npx jest shared/__tests__/dateLocalized.test.ts shared/__tests__/locale.test.ts shared/__tests__/widgetTimeline.test.ts --watchman=false --selectProjects=unit` exits 0.
2. `npx jest components/prayer/__tests__/Explanation.test.tsx components/sheets/parts/__tests__/Stepper.test.tsx components/modals/__tests__/Help.test.tsx components/sheets/screens/__tests__/Alert.test.tsx --watchman=false --selectProjects=components` exits 0.
3. `npx tsc --noEmit` exits 0.
4. `npx biome check . --error-on-warnings` exits 0.

## Break script

Stage every file in the Files list with `git add <name>` before running the
break script, so each `git checkout -- <file>` restores the staged green
bytes rather than `uat`'s.

`scripts/break-88-step1.sh` (the executor writes it to the plan folder from
this text, runs `bash ai/plans/88-latin-numerals/scripts/break-88-step1.sh`
from the lane root). It substitutes Arabic-Indic digits back at three
changed sites one at a time, expects the named tests to fail, and restores:

```bash
#!/usr/bin/env bash
set -u
cd "$(dirname "$0")/../../../.." || exit 1
break_one() {
  local name="$1" file="$2" from="$3" to="$4" tests="$5" project="$6"
  python3 - "$file" "$from" "$to" <<'EOF'
import sys
path, old, new = sys.argv[1], sys.argv[2], sys.argv[3]
text = open(path).read()
if text.count(old) != 1:
    print(f"BREAK NOT APPLIED: {old!r} counts {text.count(old)} in {path}")
    sys.exit(1)
open(path, 'w').write(text.replace(old, new))
EOF
  [ $? -ne 0 ] && exit 1
  if npx jest $tests --watchman=false --selectProjects=$project > $TMPDIR/break-88.log 2>&1; then
    echo "BREAK NOT CAUGHT: $name passed with the break applied"
    git checkout -- "$file"
    exit 1
  fi
  echo "break $name: tests red as expected"
  git checkout -- "$file"
}
break_one "gregorian-label" "shared/time.ts" \
  'const composed = `${t(GREGORIAN_WEEKDAY_KEYS[isoWeekday - 1])}, ${String(day)} ' \
  'const composed = `${t(GREGORIAN_WEEKDAY_KEYS[isoWeekday - 1])}, ${String(day).replace(/[0-9]/g, "٥")} ' \
  "shared/__tests__/dateLocalized.test.ts shared/__tests__/widgetTimeline.test.ts" unit
break_one "stepper-value" "components/sheets/parts/Stepper.tsx" \
  '<Text style={styles.value}>{visible}</Text>' \
  '<Text style={styles.value}>{visible.replace(/[0-9]/g, "٥")}</Text>' \
  "components/sheets/parts/__tests__/Stepper.test.tsx" components
break_one "info-box" "components/prayer/Explanation.tsx" \
  '<Text style={styles.infoExplanation}>{explanation}</Text>' \
  '<Text style={styles.infoExplanation}>{explanation.replace(/[0-9]/g, "٥")}</Text>' \
  "components/prayer/__tests__/Explanation.test.tsx" components
break_one "help-answer" "components/modals/Help.tsx" \
  '<Text style={styles.cause}>{text}</Text>' \
  '<Text style={styles.cause}>{text.replace(/[0-9]/g, "٥")}</Text>' \
  "components/modals/__tests__/Help.test.tsx" components
echo "ALL ASPECTED: 1"
```

After the script, `git status --porcelain` lists only this step's files and
the plan files. The script's last line must be `ALL ASPECTED: 1`.

## Version and commit

Under the version lock: `mkdir $HOME/athan-gitree/version.lock` (retry in a
`sleep 10` loop at most 30 times, about 5 minutes, then `STOP:`; `rmdir`
after the merge). Fetch `origin` first (expect no output, exit 0; it
refreshes `uat` for the pre-flight's containment check). The version is the
next patch after whatever the lane's `package.json` prints at the branch
point (the plan-repair commit leaves it at `2.0.743`, so the expected step
version is `2.0.744`; if a concurrent lane bumped past that, take the next
patch after the printed value). Set it in `app.json` FIRST, then
`package.json`, by replacing the version string in place (never rewrite the
JSON: Biome owns its formatting). The lane has no `android/app/build.gradle`;
the lockstep test skips it.

Commit message: `<VERSION> - feat(digits): the native-digit map dies, every
composed surface renders Latin digits in every locale (row 88)`. Add every
file by name from the Files list plus `PLAN.md`, `LOG.md` and the break
script. Commit in the background with `git commit -F $TMPDIR/msg-88-1.txt`;
the log's last `Tests:` line ends `passed, <n> total` with the four `100%`
coverage lines present.

## Review

Read `git show <sha>` cold against this checklist: no file outside the
list changed; no wrapper survived; no import still names `localizeDigits`;
`RTL_IDS` untouched; the stepper's styles and words untouched; the Help
modal's rendered bytes equal the catalog bytes; the flipped tests assert
Latin, not merely not-native, at least once each. Then the
shipped classes: lifecycle (none: synchronous composition), thread (none:
no worklets), residue (the dead table and function are gone; the
`typography.ts` comment no longer names them), rule (no prayer time, no
heading, no scheduling touched).

## Merge

`git checkout lane/88 && git merge --no-ff ticket/88-step1 -m "<VERSION> -
merge step 1: the native-digit map dies"` then
`git branch -d ticket/88-step1` and `rmdir $HOME/athan-gitree/version.lock`.

## Done when

Both jest runs, `tsc` and Biome exit 0; the break script ends
`ALL ASPECTED: 1`; the commit carries the hook's four gate lines; the merge
is on `lane/88`; the checklist box in `PLAN.md` section 6 is ticked; the
step entry in `LOG.md` is written with the `session:` line.
