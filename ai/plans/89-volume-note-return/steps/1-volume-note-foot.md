# Step 1: the volume note returns to both sheets at the foot

**Requirements:** R1.1, R1.2, R2.1, R3.1, R3.2, R4.1, R4.2
Weight: 2

## Anchor check

Run the pre-flight first (PLAN.md section 3). It counts every anchor this step edits,
including the two screen anchors and the six catalog anchors. Any count other than 1 is
`NEEDS CONTEXT: NEEDS REPLAN, <the anchor and its count>`.

## Goal

The two `volume.note.*` keys live again in all six catalogs at their 2.0.728 bytes, the
lock matches, and both sheets close on the new `VolumeNote` part: centred, icon-aside,
platform-keyed, padded off the body.

## Branch

```bash
git checkout -b feat/89-volume-note lane/89
```

Expected: `Switched to a new branch 'feat/89-volume-note'`. With the step's first
commit, set row 89 in `ai/plans/README.md` to `IN PROGRESS, step 1`.

## Files

Changed: `shared/i18n/en.ts`, `shared/i18n/ar.ts`, `shared/i18n/hi.ts`,
`shared/i18n/ms.ts`, `shared/i18n/so.ts`, `shared/i18n/th.ts`,
`shared/i18n/catalog-lock.json`, `shared/__tests__/i18n.test.ts`,
`components/__tests__/typographySweep.test.tsx`, `components/sheets/parts/index.ts`,
`components/sheets/screens/Alert.tsx`, `components/sheets/screens/Sound.tsx`,
`components/sheets/screens/__tests__/Alert.test.tsx`,
`components/sheets/screens/__tests__/Sound.test.tsx`, `ai/plans/README.md`,
`ai/plans/89-volume-note-return/PLAN.md`, `ai/plans/89-volume-note-return/LOG.md`,
`package.json`, `app.json`. New: `components/sheets/parts/VolumeNote.tsx`,
`components/sheets/parts/__tests__/VolumeNote.test.tsx`. Nothing else.

## Red tests

Write every test edit before any code change. All edits are verbatim below.

1. New file `components/sheets/parts/__tests__/VolumeNote.test.tsx`, exactly:

```tsx
/**
 * The volume footnote: the platform's copy, centred beside its information glyph
 */

import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { onPlatform } from '@/__tests__/harness';
import { COLORS, SPACING, TEXT } from '@/shared/constants';

import SheetVolumeNote from '../VolumeNote';

const IOS_COPY = 'Follows your Ringer & Alerts volume. Silent and Focus modes mute it.';
const ANDROID_COPY = 'Plays at alarm volume, not ring volume.';

const noteStyle = (copy: string): Record<string, unknown> =>
  StyleSheet.flatten(screen.getByText(copy).props.style) as Record<string, unknown>;

const footStyle = (copy: string): Record<string, unknown> =>
  StyleSheet.flatten(screen.getByText(copy).parent?.props.style) as Record<string, unknown>;

describe('the volume footnote', () => {
  it('draws the iOS copy beside the information glyph', async () => {
    await render(<SheetVolumeNote />);

    expect(screen.getByText(IOS_COPY)).toBeOnTheScreen();
    expect(screen.getByTestId('svg:info', { includeHiddenElements: true })).toBeOnTheScreen();
  });

  it('draws the Android copy on Android', async () => {
    onPlatform('android');
    await render(<SheetVolumeNote />);

    expect(screen.getByText(ANDROID_COPY)).toBeOnTheScreen();
    expect(screen.getByTestId('svg:info', { includeHiddenElements: true })).toBeOnTheScreen();
  });

  it('centres every line in the sheet-subtitle ink at the detail size', async () => {
    await render(<SheetVolumeNote />);

    const text = noteStyle(IOS_COPY);
    expect(text.textAlign).toBe('center');
    expect(text.color).toBe(COLORS.text.sheetSubtitle);
    expect(text.fontSize).toBe(TEXT.sizeDetail);
    expect(text.fontFamily).toBe('Roboto-Regular');
  });

  it('lifts off the body, a centred row with its padding', async () => {
    await render(<SheetVolumeNote />);

    const foot = footStyle(IOS_COPY);
    expect(foot.flexDirection).toBe('row');
    expect(foot.justifyContent).toBe('center');
    expect(foot.alignItems).toBe('center');
    expect(foot.marginTop).toBe(SPACING.xxl);
    expect(foot.paddingHorizontal).toBe(SPACING.lg);
  });
});
```

Proves: the platform keying (R1.2), the glyph (R3.2), the centring and ink (R3.1), the
padding and row shape (D89.3). Red now with `Cannot find module '../VolumeNote'`.

2. In `components/sheets/screens/__tests__/Alert.test.tsx`: change the harness import
line to `import { onPlatform, showLondonDay } from '@/__tests__/harness';`, add
`import { t } from '@/shared/i18n';` directly under the constants import (it sits
between `@/shared/constants` and `@/shared/i18n/locale` in the sorted order), and insert
these two tests directly after the test that ends at the `alert-test-anchor.txt` excerpt
(the one asserting `15 min`):

```tsx
  it('carries the volume note below the second reminder', async () => {
    showLondonDay('2026-09-11', '14:00');
    openSheetFor(FAJR);

    await render(<AlertSheet />);

    const drawn = JSON.stringify(screen.toJSON());
    // Depth-first serialization is the sheet's visual order: the note closes the content
    expect(drawn.indexOf(t('volume.note.ios'))).toBeGreaterThan(drawn.indexOf(t('alert.reminder', { n: 2 })));
    expect(screen.getAllByText(t('volume.note.ios'))).toHaveLength(1);
  });

  it('carries the alarm-volume wording on Android', async () => {
    onPlatform('android');
    showLondonDay('2026-09-11', '14:00');
    openSheetFor(FAJR);

    await render(<AlertSheet />);

    expect(screen.getAllByText(t('volume.note.android'))).toHaveLength(1);
  });
```

Proves R1.1 and the Android side of R1.2. Red now: `t('volume.note.ios')` throws
`TypeError: Cannot read properties of undefined (reading 'replace')`, the key being
absent from the catalog.

3. In `components/sheets/screens/__tests__/Sound.test.tsx`: same import changes
(`onPlatform` into the harness import, `t` from `'@/shared/i18n'` in sorted position),
and insert these two tests directly after the test ending at the
`sound-test-anchor.txt` excerpt (the rows-warm test):

```tsx
  it('carries the volume note below every athan row', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSoundListReady();

    await render(<SoundSheet />);

    const drawn = JSON.stringify(screen.toJSON());
    const lastRow = `Athan ${ATHAN_AUDIOS.length}`;
    expect(drawn.indexOf(t('volume.note.ios'))).toBeGreaterThan(drawn.indexOf(lastRow));
    expect(screen.getAllByText(t('volume.note.ios'))).toHaveLength(1);
  });

  it('carries the alarm-volume wording on Android', async () => {
    onPlatform('android');
    showLondonDay('2026-09-11', '14:00');
    setSoundListReady();

    await render(<SoundSheet />);

    expect(screen.getAllByText(t('volume.note.android'))).toHaveLength(1);
  });
```

Proves R2.1 and the Android side of R1.2. Red the same way.

4. In `shared/__tests__/i18n.test.ts`, insert directly under the
`['help.step.dndAccess', ...]` pin (the `i18n-pins.txt` excerpt's first line):

```ts
  ['volume.note.android', 'Plays at alarm volume, not ring volume.'],
  ['volume.note.ios', 'Follows your Ringer & Alerts volume. Silent and Focus modes mute it.'],
```

Proves R4.2. Red now with `TypeError: Cannot read properties of undefined (reading
'replace')` (the key is absent from the catalog).

5. In `components/__tests__/typographySweep.test.tsx`, insert `  'sheets/parts/VolumeNote.tsx',`
directly under the `'sheets/parts/Stepper.tsx',` line inside the
`sweep-inventory.txt` excerpt. Proves the part resolves through `typographyFor`. Red now
with `ENOENT` on the missing file.

Run each suite and record the exact failing lines:

```bash
npx jest components/sheets/parts/__tests__/VolumeNote.test.tsx --watchman=false --selectProjects=components
npx jest components/sheets/screens/__tests__/Alert.test.tsx --watchman=false --selectProjects=components
npx jest components/sheets/screens/__tests__/Sound.test.tsx --watchman=false --selectProjects=components
npx jest shared/__tests__/i18n.test.ts --watchman=false --selectProjects=unit
npx jest components/__tests__/typographySweep.test.tsx --watchman=false --selectProjects=components
```

Expected: every run exits 1 with the failures named above. A named test passing, or a
test this step did not name failing, is `STOP:`.

## Change contracts

1. New file `components/sheets/parts/VolumeNote.tsx`, exactly:

```tsx
import { Platform, StyleSheet, Text, View } from 'react-native';

import { IconView } from '@/components/ui';
import { COLORS, SPACING, TEXT } from '@/shared/constants';
import { t } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import { Icon } from '@/shared/types';
import { typographyFor } from '@/shared/typography';

/**
 * The volume footnote both sheets close on: the running platform's own volume
 * truth, centred under the body, its information glyph beside the copy.
 */
export default function SheetVolumeNote() {
  return (
    <View style={styles.foot}>
      <IconView type={Icon.INFO} size={12} color={COLORS.text.sheetSubtitle} />
      <Text style={styles.text}>{t(Platform.OS === 'android' ? 'volume.note.android' : 'volume.note.ios')}</Text>
    </View>
  );
}

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  text: {
    flexShrink: 1,
    textAlign: 'center',
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
});
```

The contract: answers the platform-keyed copy beside its glyph, centred with the pinned
padding. It must never read storage, hold state, or draw a divider. It throws nothing.

2. `components/sheets/parts/index.ts`: add `export { default as VolumeNote } from './VolumeNote';`
as the last export line, directly under the Toggle line of the `parts-index.txt` excerpt.

3. `components/sheets/screens/Alert.tsx`: change the parts import to
`import { SegmentedControl, type SegmentOption, Sheet, VolumeNote } from '../parts';`
and insert `<VolumeNote />` on its own line between the `)}` line and the `</Sheet>`
line of the `alert-sheet-children.txt` excerpt, indented 6 spaces. No other line moves.
The screen itself imports nothing from `react-native` beyond what it already does.

4. `components/sheets/screens/Sound.tsx`: change the parts import to
`import { Sheet, SoundItem, VolumeNote } from '../parts';` and insert `<VolumeNote />`
on its own line between the `)}` line and the `</Sheet>` line of the
`sound-sheet-card.txt` excerpt, indented 6 spaces.

5. The six catalogs: in each file, insert the two lines below directly under the
`help.step.dndAccess` line of that file's `<locale>-volume-keys.txt` excerpt, above the
`help.q.volume` line. Values verbatim:

`shared/i18n/en.ts`:

```ts
  'volume.note.android': 'Plays at alarm volume, not ring volume.',
  'volume.note.ios': 'Follows your Ringer & Alerts volume. Silent and Focus modes mute it.',
```

`shared/i18n/ar.ts`:

```ts
  'volume.note.android': 'يعمل بصوت المنبّه، لا بصوت الرنين.',
  'volume.note.ios': 'يعمل بصوت «الرنين والتنبيهات». مفتاح الرنين/الصامت وأوضاع التركيز تكتمه.',
```

`shared/i18n/hi.ts`:

```ts
  'volume.note.android': 'अलार्म वॉल्यूम पर बजता है, रिंग वॉल्यूम पर नहीं।',
  'volume.note.ios': 'रिंगर वॉल्यूम पर बजता है। रिंग/साइलेंट स्विच और फ़ोकस इसे म्यूट कर देते हैं।',
```

`shared/i18n/ms.ts`:

```ts
  'volume.note.android': 'Dimainkan pada volum penggera, bukan volum deringan.',
  'volume.note.ios': 'Dimainkan pada volum Dering & Makluman. Suis Senyap dan mod Fokus menyenyapkannya.',
```

`shared/i18n/so.ts`:

```ts
  'volume.note.android': 'Waxaa lagu ciyaaraa codka digniinta, ma aha codka garaaca.',
  'volume.note.ios': 'Waxaa lagu ciyaaraa codka «Garaaca & Digniinaha». Badhanka aamusan iyo Focus ayaa aamusa.',
```

`shared/i18n/th.ts`:

```ts
  'volume.note.android': 'เล่นที่ระดับเสียงนาฬิกาปลุก ไม่ใช่เสียงริงโทน',
  'volume.note.ios': 'เล่นที่ระดับเสียงริงและแจ้งเตือน สวิตช์ปิดเสียงและโหมดโฟกัสจะปิดเสียง',
```

6. Re-take the lock, from the lane root:

```bash
yarn i18n:lock
```

Expected output: `catalog lock written for ar, ms, so, hi, th`. `git diff
shared/i18n/catalog-lock.json` then shows all five locale hashes changed (five `-` and
five `+` lines; every locale shares the one en hash).

## Green run

```bash
npx jest components/sheets/parts/__tests__/VolumeNote.test.tsx --watchman=false --selectProjects=components
npx jest components/sheets/screens/__tests__/Alert.test.tsx --watchman=false --selectProjects=components
npx jest components/sheets/screens/__tests__/Sound.test.tsx --watchman=false --selectProjects=components
npx jest shared/__tests__/i18n.test.ts shared/__tests__/catalogLock.test.ts --watchman=false --selectProjects=unit
npx jest components/__tests__/typographySweep.test.tsx --watchman=false --selectProjects=components
npx tsc --noEmit
npx biome check . --error-on-warnings
```

Expected: every command exits 0. Errors in the handed code: compare byte-for-byte with
the contract, fix the transcription, never the contract. A name, line or value this plan
gave failing at green is `STOP:` with the error quoted.

## Break script

Save as `$TMPDIR/break-89-1.sh`, run with `bash` from the lane root. It applies four
mutations, each named with the tests it must fail, and restores between them.

```bash
#!/usr/bin/env bash
# Ticket 89 step 1 break script. Each break must flip its named tests red.
set -u
VN=components/sheets/parts/VolumeNote.tsx
AL=components/sheets/screens/Alert.tsx
J="npx jest --watchman=false --selectProjects=components"
JU="npx jest --watchman=false --selectProjects=unit"
cp "$VN" "$TMPDIR/vn.bak"; cp "$AL" "$TMPDIR/al.bak"
fail=0
expect_fail() {
  local name="$1"; shift
  if "$@" > "$TMPDIR/break-89.log" 2>&1; then
    echo "BREAK NOT APPLIED: $name"; fail=1
  else
    echo "broke: $name"
  fi
}
# B1: the platform keys swap sides -> every platform test fails
perl -pi -e "s/'volume\.note\.android' : 'volume\.note\.ios'/'volume.note.ios' : 'volume.note.android'/" "$VN"
expect_fail "B1 key swap (VolumeNote suite)" $J components/sheets/parts/__tests__/VolumeNote.test.tsx
expect_fail "B1 key swap (Alert suite)" $J components/sheets/screens/__tests__/Alert.test.tsx
expect_fail "B1 key swap (Sound suite)" $J components/sheets/screens/__tests__/Sound.test.tsx
cp "$TMPDIR/vn.bak" "$VN"
# B2: the note leaves the alert sheet -> the Alert note tests fail
perl -0pi -e "s/\n      <VolumeNote \/>//" "$AL"
expect_fail "B2 alert note removed (Alert suite)" $J components/sheets/screens/__tests__/Alert.test.tsx
cp "$TMPDIR/al.bak" "$AL"
# B3: centring dies -> the centring test fails
perl -pi -e "s/^\s+textAlign: 'center',\n//" "$VN"
expect_fail "B3 centring removed (VolumeNote suite)" $J components/sheets/parts/__tests__/VolumeNote.test.tsx
cp "$TMPDIR/vn.bak" "$VN"
# B4: the copy drifts a byte -> the en pins fail
cp shared/i18n/en.ts "$TMPDIR/en.bak"
perl -pi -e "s/'Plays at alarm volume, not ring volume\.'/'Plays at alarm volume, not ring volume!'/" shared/i18n/en.ts
expect_fail "B4 en copy drift (i18n pins)" $JU shared/__tests__/i18n.test.ts
cp "$TMPDIR/en.bak" shared/i18n/en.ts
[ "$fail" -eq 0 ] && echo "ALL AS EXPECTED: 1" || echo "BREAKS FAILED"
exit "$fail"
```

`B1` must fail the two platform tests of the VolumeNote suite, the two Alert note tests
and the two Sound note tests. `B2` must fail both Alert note tests. `B3` must fail
`centres every line in the sheet-subtitle ink at the detail size`. `B4` must fail the
`volume.note.android` pin. A break passing where the plan says it fails is `STOP:`.

## Version and commit

Take the version lock (`mkdir $HOME/athan-gitree/version.lock`, retry in short sleep
cycles while it exists, `rmdir` after the merge; a STOP before that removes it too), then:

```bash
git fetch -q origin uat
node -e '
const { execSync } = require("node:child_process");
const lane = require("./package.json").version;
const origin = JSON.parse(execSync("git show origin/uat:package.json", { encoding: "utf8" })).version;
const bump = (v) => { const p = v.split(".").map(Number); p[2] += 1; return p.join("."); };
console.log(bump(lane >= origin ? lane : origin));
'
```

Expected: one line, the next patch above the greater of the lane's and `origin/uat`'s
version. Set that version in `package.json` and `app.json` (both `"version"`).
`android/app/build.gradle` does not exist in the lane; the lockstep test tolerates its
absence. Never add it.

Write the message to `$TMPDIR/msg-89-1.txt` with `<VERSION>` replaced:

```
<VERSION> - feat(sheets): the volume note returns to both sheets at the foot, centred beside its information glyph

Her 2026-10-15 ruling supersedes the 2.0.729 removal: both sheets close on the
same platform-keyed note, the 2.0.728 copy bytes restored in all six catalogs
with the lock re-taken. The Help question stays.
```

Add every file from the Files list by name (plus the plan files this run changed and the
two version files), commit in the background with `git commit -F`, and read the log. The
hook's last `Tests:` line must end `passed, <n> total` and the four coverage lines must
each read `100%`. If only `shared/__tests__/audioMatrix.test.ts` times out, wait in the
background for load average below 8 and commit again, up to 3 times.

## Review

Read `git show <sha>` cold against this checklist:

- `SheetVolumeNote` matches its contract byte-for-byte; the barrel exports `VolumeNote`.
- Both screens insert exactly one `<VolumeNote />` line and change exactly one import
  line; nothing else in either screen moved.
- The six catalogs hold the two keys at the exact anchored position with the exact
  bytes; the lock's five hashes changed.
- The note draws under the unavailable message too (D89.1: unconditional last child).
- No divider, no new colour literal outside `COLORS.text.sheetSubtitle`, no
  `console.log`, no comment explaining what.
- Versions: three places if the gradle file existed (it does not), `package.json` and
  `app.json` equal, message starts `<VERSION> - `.

A fix the plan's symptom table gives: apply and amend. Anything else: `STOP:`.

## Merge

```bash
git checkout lane/89 && git merge --no-ff feat/89-volume-note -m "<VERSION> - merge ticket 89 step 1: the volume note returns"
git branch -d feat/89-volume-note
```

A conflict: `git merge --abort`, then `STOP:`.

## Done when

The checklist box for step 1 in PLAN.md section 6 is ticked, `LOG.md` carries the step
entry (`### Step 01 — done` heading, `session:` line last) with the branch, sha, version,
hook lines, break result, review verdict and merge sha, and row 89 in the queue reads
`IN PROGRESS, step 1` inside the step's own commit. Finishing (the executed docs commit,
status EXECUTED) runs only when the lead's dispatch says the whole plan is done; a
dispatch ending at this step returns `ROTATE: steps 1 to 1 done, next none` instead.

## Restore list

On a mid-step stop: `git diff > $HOME/athan-gitree/sessions/89/step1-unfinished.patch`
and `git status --porcelain > $HOME/athan-gitree/sessions/89/step1-unfinished-status.txt`
(mkdir the folder first), then `git checkout -- ` every changed file above, delete
`components/sheets/parts/VolumeNote.tsx` and its test, `git checkout lane/89`, and if
`git log --oneline lane/89..feat/89-volume-note` prints nothing, `git branch -D
feat/89-volume-note`.
