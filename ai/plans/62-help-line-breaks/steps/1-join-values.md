# Step 1: Join the twelve broken values, re-take the lock, regenerate dist

Requirements: R1.1
Weight: 2

## Anchor check

```bash
cd "$(git rev-parse --show-toplevel)"
for a in en-stopAfterRestart en-cutoff ar-stopAfterRestart ar-cutoff ms-stopAfterRestart ms-cutoff so-stopAfterRestart so-cutoff hi-stopAfterRestart hi-cutoff th-stopAfterRestart th-cutoff; do
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
    "ai/plans/62-help-line-breaks/scripts/anchors/$a.txt" "shared/i18n/${a%%-*}.ts"
done
```

Expected: twelve lines, each `1`. Any other count: `NEEDS_CONTEXT: NEEDS
REPLAN, <the anchor and its count>`.

## Goal

The two multi-sentence help answers flow as one paragraph in all six
languages, the lock matches the edited English, and dist matches the landed
catalogs.

## Branch

`git checkout -b code/62-1-join-help-breaks uat`

## Files

- `shared/i18n/en.ts`, `shared/i18n/ar.ts`, `shared/i18n/ms.ts`,
  `shared/i18n/so.ts`, `shared/i18n/hi.ts`, `shared/i18n/th.ts` (two values
  each)
- `shared/__tests__/help.test.ts` (the red test)
- `shared/__tests__/i18n.test.ts` (two pinned literals joined: the rows for
  `help.a.stopAfterRestart` and `help.a.cutoff` in its `PINNED_LITERALS`
  table, lines 59-62 and 77, become the same two strings with the literal
  `\n` replaced by one space, matching D76's join)
- `shared/i18n/catalog-lock.json` (re-taken by command)
- `ai/plans/README.md` (ticket line: `IN PROGRESS, step 1`)
- this plan folder's `PLAN.md` and `LOG.md`

`shared/i18n/dist/` is gitignored (`.gitignore:4`): the six export files are
pipeline artifacts, never committed, never listed by `git status
--porcelain`.

## Red tests

In `shared/__tests__/help.test.ts`, add the catalog imports above the
relative import (Biome's order):

```tsx
import { ar } from '@/shared/i18n/ar';
import { type Catalog, en } from '@/shared/i18n/en';
import { hi } from '@/shared/i18n/hi';
import { ms } from '@/shared/i18n/ms';
import { so } from '@/shared/i18n/so';
import { th } from '@/shared/i18n/th';

import { getHelpActionLabels, getHelpTopics } from '../help';
```

Append at the end of the file (the `it.each` line is pre-split to Biome's
120-column width):

```tsx
describe('hard line breaks', () => {
  const CATALOGS: Record<string, Catalog> = { en, ar, ms, so, hi, th };

  // Owner, 2026-10-12: no answer is broken into lines for the English layout; the text wraps at the view width
  it.each(['help.a.stopAfterRestart', 'help.a.cutoff'] as const)(
    '%s flows as one paragraph in every catalog',
    (key) => {
      for (const catalog of Object.values(CATALOGS)) {
        expect(catalog[key]).not.toMatch(/\n/);
      }
    }
  );
});
```

Run:

```bash
npx jest shared/__tests__/help.test.ts --watchman=false --selectProjects=unit -t 'flows as one paragraph'
```

Expected red: both `it.each` rows fail, each printing the received string
with the line break visible, summary `Tests: 2 failed, 21 skipped, 23
total`. A pass: `STOP:`.

## Change contracts

Apply exactly these twelve replacements (the `\n` is the two-character
escape inside the single-quoted TypeScript literal; the join is one space):

```python
JOINS = {
 'shared/i18n/en.ts': [
  ("'After rebooting the phone, the app is terminated.\\nThis stops new notifications being sent.'",
   "'After rebooting the phone, the app is terminated. This stops new notifications being sent.'"),
  ("'Notification sounds are limited to 30 seconds.\\nEvery athan is trimmed to fit.'",
   "'Notification sounds are limited to 30 seconds. Every athan is trimmed to fit.'"),
 ],
 'shared/i18n/ar.ts': [
  ("'بعد إعادة تشغيل الهاتف، يكون التطبيق مُنهيًا.\\nهذا يوقف إرسال إشعارات جديدة.'",
   "'بعد إعادة تشغيل الهاتف، يكون التطبيق مُنهيًا. هذا يوقف إرسال إشعارات جديدة.'"),
  ("'أصوات الإشعارات محدودة بـ 30 ثانية.\\nكل أذان مُقلَّص ليناسب ذلك.'",
   "'أصوات الإشعارات محدودة بـ 30 ثانية. كل أذان مُقلَّص ليناسب ذلك.'"),
 ],
 'shared/i18n/ms.ts': [
  ("'Selepas telefon dimulakan semula, apl ditamatkan.\\nIni menghentikan notifikasi baharu dihantar.'",
   "'Selepas telefon dimulakan semula, apl ditamatkan. Ini menghentikan notifikasi baharu dihantar.'"),
  ("'Bunyi notifikasi dihadkan kepada 30 saat.\\nSetiap azan dipendekkan untuk muat.'",
   "'Bunyi notifikasi dihadkan kepada 30 saat. Setiap azan dipendekkan untuk muat.'"),
 ],
 'shared/i18n/so.ts': [
  ("'Dib-u-dhig ka dib, barnaamijku waa la joojiyay.\\nTani way joojisaa ogeysiis cusub soo diritaanka.'",
   "'Dib-u-dhig ka dib, barnaamijku waa la joojiyay. Tani way joojisaa ogeysiis cusub soo diritaanka.'"),
  ("'Dhawaaqyada ogeysiisu waa xadidan yihiin 30 ilbiriqsi.\\nAqan kasta waa la gaabiyay si uu u dhismo.'",
   "'Dhawaaqyada ogeysiisu waa xadidan yihiin 30 ilbiriqsi. Aqan kasta waa la gaabiyay si uu u dhismo.'"),
 ],
 'shared/i18n/hi.ts': [
  ("'फ़ोन रीस्टार्ट होने के बाद ऐप बंद हो जाता है।\\nइससे नई सूचनाएँ भेजना रुक जाता है।'",
   "'फ़ोन रीस्टार्ट होने के बाद ऐप बंद हो जाता है। इससे नई सूचनाएँ भेजना रुक जाता है।'"),
  ("'सूचना की आवाज़ें 30 सेकंड तक सीमित हैं।\\nहर अज़ान उसी हिसाब से छोटी की गई है।'",
   "'सूचना की आवाज़ें 30 सेकंड तक सीमित हैं। हर अज़ान उसी हिसाब से छोटी की गई है।'"),
 ],
 'shared/i18n/th.ts': [
  ("'หลังรีสตาร์ทโทรศัพท์ แอปจะถูกปิด\\nทำให้การส่งแจ้งเตือนใหม่หยุดชะงัก'",
   "'หลังรีสตาร์ทโทรศัพท์ แอปจะถูกปิด ทำให้การส่งแจ้งเตือนใหม่หยุดชะงัก'"),
  ("'เสียงแจ้งเตือนถูกจำกัดไว้ที่ 30 วินาที\\nอะซานทุกเสียงจึงถูกตัดให้พอดี'",
   "'เสียงแจ้งเตือนถูกจำกัดไว้ที่ 30 วินาที อะซานทุกเสียงจึงถูกตัดให้พอดี'"),
 ],
}
```

Each `before` string appears exactly once in its file (the anchors pin the
neighbourhood). A `before` that does not match, or matches twice: `STOP:`.

Then re-take the lock and refresh every dist artifact:

```bash
yarn i18n:lock
for L in en ar ms so hi th; do I18N_LOCALE=$L yarn i18n:export; done
for L in en ar ms so hi th; do I18N_LOCALE=$L yarn i18n:import; done
```

Expected: `yarn i18n:lock` prints `catalog lock written for ar, ms, so, hi,
th` and rewrites `shared/i18n/catalog-lock.json`. Each export prints
`Running one project: unit`, then the `● process.exit called with "0"`
diagnostic, runs no suite, exits 0 (the bridge writes and exits). Each
import runs the bridge round trip and passes, proving the dist file matches
the landed catalog. `git status --porcelain` then lists the six catalogs,
the lock, the two test files and the plan files, nothing else (dist is
ignored).

## Green run

```bash
npx jest shared/__tests__/help.test.ts shared/__tests__/i18n.test.ts shared/__tests__/catalogLock.test.ts shared/__tests__/i18nBridge.test.ts --watchman=false --selectProjects=unit
npx tsc --noEmit
npx biome check . --error-on-warnings
```

Expected: all suites pass (the pinned literals in `i18n.test.ts` now match
the joined values), tsc exit 0, Biome exit 0.

## Break script

`$TMPDIR/break-62-1.sh`, run with `bash` from the repository root:

```bash
#!/bin/bash
# Break: one English value regains its hard break; the paragraph test must fail
cd "$(git rev-parse --show-toplevel)" || exit 1
perl -0pi -e 's/terminated\. This stops new notifications/terminated.\\nThis stops new notifications/' shared/i18n/en.ts
npx jest shared/__tests__/help.test.ts --watchman=false --selectProjects=unit -t 'flows as one paragraph' > "$TMPDIR/break-62-1.log" 2>&1
if grep -q "1 failed" "$TMPDIR/break-62-1.log" && grep -qF "stopAfterRestart" "$TMPDIR/break-62-1.log"; then
  echo 'ALL AS EXPECTED: 1'
else
  echo 'BREAK NOT APPLIED'
fi
perl -0pi -e 's/terminated\.\\nThis stops new notifications/terminated. This stops new notifications/' shared/i18n/en.ts
```

Expected last line: `ALL AS EXPECTED: 1`, then `git status --porcelain`
lists only this step's files and the plan files.

## Version and commit

Fetch `origin` under the version lock. Next patch after uat's `package.json`
(`app.json` first, then `package.json`, then the gitignored gradle
`versionName`). Commit message:

```
<VERSION> - fix(i18n): the two multi-sentence help answers flow as one paragraph in all six languages (62)
```

## Review checklist

- Twelve values changed, all named by D75; no other catalog byte moved
  (`git diff shared/i18n/*.ts` shows exactly the twelve lines).
- The two pinned literals in `i18n.test.ts` joined identically to their
  catalogs.
- The lock entries changed once, to the new English hash.
- Each dist round trip passed (`i18n:import` per locale).
- No component file in the diff.

## Merge

```bash
git checkout uat && git merge --no-ff code/62-1-join-help-breaks -m "<VERSION> - merge code/62-1-join-help-breaks: help breaks joined (62)"
```

Delete the branch after the merge. Then Finishing: records text into LOG.md,
ticket set to EXECUTED, executed docs commit, merge, no push.

## Done when

Checklist ticked, LOG.md entry under `### Step 01 — done` with the
`session:` line, Finishing complete.
