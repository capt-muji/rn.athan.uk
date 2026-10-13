# Step 1: The volume notes and the split help question

Requirements: R1.1, R1.2, R1.3, R2.1, R2.2, R3.1, R4.1
Weight: 2

## Anchor check

`alert-card`, `sound-card`, `help-quiet`, `en-quiet`. A count other than 1 is
a STOP.

## Goal

One platform-keyed volume note renders in both sheets; the Help question is
reworded and answers on both platforms; the six catalogs carry the new keys
byte-exact with the lock re-taken.

## Branch

`git checkout -b feat/64-volume-copy uat`

## Files

- `shared/i18n/en.ts` (change)
- `shared/i18n/ar.ts`, `ms.ts`, `so.ts`, `hi.ts`, `th.ts` (change: the same keys)
- `shared/i18n/catalog-lock.json` (change: `yarn i18n:lock`)
- `shared/help.ts` (change: the quiet entry becomes the volume entry with both answers)
- `components/sheets/screens/Alert.tsx` (change: the note line)
- `components/sheets/screens/Sound.tsx` (change: the note line)
- `shared/__tests__/help.test.ts` (change: the split assertion, the new values)
- `shared/__tests__/i18n.test.ts` (change: `PINNED_LITERALS`)
- `components/sheets/screens/__tests__/Alert.test.tsx` (change: the note assertion)
- `components/sheets/screens/__tests__/Sound.test.tsx` (change: the note assertion)
- `components/modals/__tests__/Help.test.tsx` (change: the question and answers)

## The copy (the specification; byte-exact)

Five keys, replacing `help.q.quiet`, `help.a.quiet` and
`help.step.alarmVolume`. The en column is the specification; the other five
are planner drafts under the owner's audit veto (the D42-superseded shape).

| Key | en |
| --- | --- |
| `volume.note.android` | Plays at alarm volume, not ring volume. |
| `volume.note.ios` | Plays at your Ringer & Alerts volume. The Ring/Silent switch and Focus mute it. |
| `help.q.volume` | Which volume controls the sound level? |
| `help.a.volume.android` | The athan plays at alarm volume, not ring volume. Raise Alarm in your sound settings. |
| `help.a.volume.ios` | The athan plays at your ringer volume, and the Ring/Silent switch and Focus silence it. |

| Key | ar | ms | so | hi | th |
| --- | --- | --- | --- | --- | --- |
| `volume.note.android` | يعمل بصوت المنبّه، لا بصوت الرنين. | Dimainkan pada volum penggera, bukan volum deringan. | Waxaa lagu ciyaaraa codka digniinta, ma aha codka garaaca. | अलार्म वॉल्यूम पर बजता है, रिंग वॉल्यूम पर नहीं। | เล่นที่ระดับเสียงนาฬิกาปลุก ไม่ใช่เสียงริงโทน |
| `volume.note.ios` | يعمل بصوت «الرنين والتنبيهات». مفتاح الرنين/الصامت وأوضاع التركيز تكتمه. | Dimainkan pada volum Dering & Makluman. Suis Senyap dan mod Fokus menyenyapkannya. | Waxaa lagu ciyaaraa codka «Garaaca & Digniinaha». Badhanka aamusan iyo Focus ayaa aamusa. | रिंगर वॉल्यूम पर बजता है। रिंग/साइलेंट स्विच और फ़ोकस इसे म्यूट कर देते हैं। | เล่นที่ระดับเสียงริงและแจ้งเตือน สวิตช์ปิดเสียงและโหมดโฟกัสจะปิดเสียง |
| `help.q.volume` | أي مستوى صوت يتحكم بالصوت؟ | Volum yang mana mengawal tahap bunyi? | Codkee ayaa xakameeya heerka codka? | कौन-सा वॉल्यूम आवाज़ नियंत्रित करता है? | ระดับเสียงใดควบคุมความดัง? |
| `help.a.volume.android` | الأذان يعمل بصوت المنبّه، لا بصوت الرنين. ارفع مستوى المنبّه من إعدادات الصوت. | Bunyi azan dimainkan pada volum penggera, bukan volum deringan. Naikkan volum Penggera dalam tetapan bunyi. | Athaanku wuxuu ku dhacaa codka digniinta, ma aha codka garaaca. Kordhi «Alarm» ee dejinta codka. | अज़ान अलार्म वॉल्यूम पर बजती है, रिंग वॉल्यूम पर नहीं। ध्वनि सेटिंग में अलार्म बढ़ाएँ। | เสียงอาซานเล่นที่ระดับเสียงนาฬิกาปลุก ไม่ใช่เสียงริงโทน เพิ่มระดับนาฬิกาปลุกในการตั้งค่าเสียง |
| `help.a.volume.ios` | الأذان يعمل بصوت الرنين، ومفتاح الرنين/الصامت وأوضاع التركيز تكتمه. | Bunyi azan dimainkan pada volum deringan, dan suis Senyap dan mod Fokus menyenyapkannya. | Athaanku wuxuu ku dhacaa codka garaaca, badhanka aamusan iyo Focus ayaa aamusa. | अज़ान रिंगर वॉल्यूम पर बजती है, और रिंग/साइलेंट स्विच और फ़ोकस इसे बंद कर देते हैं। | เสียงอาซานเล่นที่ระดับเสียงริง และสวิตช์ปิดเสียงและโหมดโฟกัสจะปิดเสียง |

Gate notes: no `help.*` value contains the word `alert` (the gate reads the
en help entries alone, so it never sees the sheet keys, whose iOS value
carries "Ringer & Alerts" as the setting's own name); every help value is
≤ 160 characters; no `\n`; and the translated-length gate fails only when a
value is over 3x its en length AND over 90 characters
(`catalogGates.test.ts:134`), so the longest ms value passes. The token set
gains no `{param}` (none of the five carries one, so `ParamsOf` is
untouched).

## Red tests

1. `shared/__tests__/help.test.ts`: change the split assertion
   (`:63-69`) to assert the question exists on BOTH platforms with the
   platform answer each, and the banned-word and length cases pass over the
   new values.
2. `components/modals/__tests__/Help.test.tsx`: the visible question text
   becomes "Which volume controls the sound level?", with the Android answer
   under the android harness and the iOS answer under `onPlatform('ios')`
   (`__tests__/harness.ts:47`).
3. `components/sheets/screens/__tests__/Alert.test.tsx` and `Sound.test.tsx`:
   each gains two cases, covering both ternary branches (100% branch
   coverage gates the commit): "renders the Android volume note" under
   `onPlatform('android')` asserting `volume.note.android`'s text, and
   "renders the iOS volume note" on the default platform asserting
   `volume.note.ios`'s text.
4. `shared/__tests__/i18n.test.ts`: `PINNED_LITERALS` swaps the three old
   keys for the five new values byte-exact.

Run:

```
npx jest shared/__tests__/help.test.ts shared/__tests__/i18n.test.ts shared/__tests__/catalogGates.test.ts --watchman=false --selectProjects=unit
npx jest components/modals/__tests__/Help.test.tsx components/sheets/screens/__tests__/Alert.test.tsx components/sheets/screens/__tests__/Sound.test.tsx --watchman=false --selectProjects=components
```

Expected: the help, pin and component cases fail on the missing keys/texts
(a missing en key reaches `t` as undefined and throws
`TypeError: Cannot read properties of undefined (reading 'replace')`,
`shared/i18n/index.ts:42`). The catalog gates pass in this run — `en.ts`
still holds its old key set, so every locale still matches it; they turn red
only once the en edit lands ahead of the five translations, and green again
when the catalogs and the lock follow. Every other case passes. Any other
failure is a STOP.

## Change contracts

1. The six catalogs: remove `help.q.quiet`, `help.a.quiet`,
   `help.step.alarmVolume`; add the five keys above with the table's exact
   bytes (en first, then the five translations, one commit).

2. `shared/help.ts`: the quiet entry becomes
   `question: 'help.q.volume'`,
   `android: { text: 'help.a.volume.android' }`,
   `ios: { text: 'help.a.volume.ios' }`
   (no `steps` member at all: `[]` fails `help.test.ts:149`'s
   `steps.length > 0` and renders an empty fix block, the `help.q.cutoff`
   shape at `shared/help.ts:124-132` is the model; the answers carry the
   instruction inline, keeping each under the 160-char gate). The volume
   entry removes the catalog's last null answer: delete the
   `if (!answer) return [];` drop in `getHelpTopics` and the
   `ios`/`android` `| null` union from `HelpEntryKeys`
   (`shared/help.ts:36-37`, `:144`), both dead after this change (D64.9);
   the coverage gate refuses the commit while the uncovered branch stands.

3. `components/sheets/screens/Alert.tsx`: inside `AlertSheetBody`, after the
   second `ReminderCard` (`Alert.tsx:239-249`), render one note line
   `t(Platform.OS === 'android' ? 'volume.note.android' : 'volume.note.ios')`
   in the existing `cardHint` text style (no new style, no pixel move beyond
   the line itself). The `isUnavailable` branch renders no note.

4. `components/sheets/screens/Sound.tsx`: the same line above the sound list,
   under the `sound.notificationSound` hint, same key choice, same style.

5. `yarn i18n:lock` to re-take `catalog-lock.json` after the en edits, and
   `yarn i18n:export` for each locale to refresh the gitignored dist
   artifacts (never added).

What the contract must never do: touch the notifications module, any other
sheet, any audio attribute, or introduce a `{param}` token.

## Green run

```
npx jest shared/__tests__/help.test.ts shared/__tests__/i18n.test.ts shared/__tests__/catalogGates.test.ts shared/__tests__/catalogLock.test.ts shared/__tests__/i18nRuntime.test.ts --watchman=false --selectProjects=unit
npx jest components/modals/__tests__/Help.test.tsx components/sheets/screens/__tests__/Alert.test.tsx components/sheets/screens/__tests__/Sound.test.tsx components/sheets/__tests__/SheetHost.test.tsx --watchman=false --selectProjects=components
npx tsc --noEmit
npx biome check . --error-on-warnings
```

All pass; exit 0 each. The lock suite proves the re-take; the sheet suites
prove both ternary branches, and `SheetHost.test.tsx` (which mocks the five
screens to null) rides unchanged as the re-render guard it always was.

## Break script

`bash scripts/break-step1.sh` from the plan folder, copied to `$TMPDIR`: it
restores the old `help.q.quiet` question value in `en.ts`, runs the help
suite, expects the both-platform question assertion to fail, restores the
file, ends `ALL AS EXPECTED: 1`.

## Version and commit

Version command: the next patch under the version lock. Add the ten files
(six catalogs, the lock, `help.ts`, `Alert.tsx`, `Sound.tsx`) and the five
suites named under Files, plus `app.json`, `package.json`,
`android/app/build.gradle` (`versionName`, never added),
`ai/plans/README.md` (`IN PROGRESS, step 1`), the plan's `PLAN.md` and
`LOG.md`. Message:

```
<VERSION> - feat(i18n): volume-source copy in both sheets, help question reworded

Android states the alarm volume, iOS the documented ringer path; the Help
question answers on both platforms; six catalogs and the lock in one commit.
R1.1-R4.1.
```

## Review checklist

- The five keys carry the plan's bytes in all six catalogs; the three old
  keys are gone from every catalog.
- The null-answer drop and the `| null` union are gone from `shared/help.ts`;
  every entry carries both answers.
- No value trips the alert-word, length or token gates.
- Both sheets choose their key by `Platform.OS`; no other line moved.
- The lock file's five hashes equal the new en hash.

## Merge

`git checkout uat && git merge --no-ff feat/64-volume-copy -m "<VERSION> -
merge feat/64-volume-copy: step 1, the volume copy"`. A conflict aborts and
STOPs.

## Done when

Checklist ticked, `LOG.md` appended with the heading, shas, hook lines, break
line and `session:` line.
