# Step 2b: the compass ring's cardinal numbers (the owner's 2026-10-14 rebuild)

Requirements: R3.1, R3.2
Weight: 2

Source: the owner's instruction of 2026-10-14 (PLAN.md section 0). This step supersedes
step 2's R3.1 work: the cardinal-lock test committed at 2.0.604 asserted the old letters
and is replaced here.

Anchor check: none. The `ar-cardinals` anchor retires with the keys this step deletes.

Goal: the compass ring prints the four bearings as the LATIN numbers 0, 90, 180 and 270,
each with a small degree circle at its top right, identical in every language, and the
compass module reads no catalog at all.

Branch: `ticket/76`.

Files: `shared/qiblaCompass.ts`, `components/sheets/screens/QiblaCompass.tsx`,
`shared/__tests__/qiblaCompass.test.ts`, `shared/__tests__/stringGuard.test.ts`,
`components/sheets/screens/__tests__/Qibla.test.tsx`, `shared/i18n/en.ts`,
`shared/i18n/ar.ts`, `shared/i18n/ms.ts`, `shared/i18n/so.ts`, `shared/i18n/hi.ts`,
`shared/i18n/th.ts`, `shared/i18n/catalog-lock.json`, `app.json`, `package.json`.
(The `ar-cardinals` pre-flight anchor's subject is deleted; the anchor file is the
step-0 gate and stays.)

Red tests, written first:

1. In `shared/__tests__/qiblaCompass.test.ts`, replace the `describe('the cardinal
   letters')` block with `describe('the cardinal numbers')`: import `CARDINAL_ANGLES` and
   assert it `toEqual([0, 90, 180, 270])`, that each is a number (never a string), and
   that the module holds no `qibla.cardinal` key in its source. Red line recorded in
   LOG.md: `CARDINAL_ANGLES` is not exported yet, so the import is `undefined` and the
   deep-equal throws.
2. In `components/sheets/screens/__tests__/Qibla.test.tsx`, add a sweep named "prints the
   four bearing numbers with their degree circles in each shipped locale: %s" (`it.each`
   over `LOCALE_IDS`, `setActiveLocale` in try/finally restoring `en`): open the sheet,
   `reportHeadings(95)`, read the dial's text under `qibla-dial`, and assert the four
   numbers 0, 90, 180 and 270 are drawn, each followed by the degree circle. All six
   cases red today, because the ring draws letters (ش ق ج غ under ar, N E S W under en).
3. In `shared/__tests__/stringGuard.test.ts`, update the compass test from "holds the
   compass cardinals in the catalog, not the module" to "holds the ring's bearings as
   module data, not catalog copy": `expect(source).toContain('CARDINAL_ANGLES')`,
   `expect(source).not.toContain('qibla.cardinal')`, `expect(source).not.toMatch(/letter:
   '/)`, and keep the census assertion (no display rows in the module). Red today, since
   the module reads `t('qibla.cardinal.n')`.

Change contract:

- `shared/qiblaCompass.ts`: delete the `import { t }` line, the `DialCardinal` interface
  and `resolveCardinals`. Add
  `export const CARDINAL_ANGLES = [0, 90, 180, 270] as const;` with the section-0 comment
  (the four bearings, Latin, identical in every language). Add `degree` to `FACE` (the
  degree circle's size as a share of the cardinal size).
- `components/sheets/screens/QiblaCompass.tsx`: import `CARDINAL_ANGLES` (not
  `resolveCardinals`) and `TSpan`; map it, drawing the number as the `<Text>` child at
  `facePoint(angle, radius * FACE.cardinal)` and the degree circle as a nested `TSpan`
  with `fontSize={radius * FACE.cardinalSize * FACE.degree}` and
  `baselineShift={'super'}`.
- The six catalogs: delete `qibla.cardinal.n/e/s/w` from each.
- `shared/i18n/catalog-lock.json`: re-take with `node scripts/catalog-lock.mjs`
  (`yarn i18n:lock`), because the en catalog changed.
- Retire the `ar-cardinals` pre-flight anchor's subject by deleting the four keys; the
  anchor file itself is the step-0 gate and stays untouched.

Green run: `npx jest shared/__tests__/qiblaCompass.test.ts --watchman=false
--selectProjects=unit`, then `npx jest components/sheets/screens/__tests__/Qibla.test.tsx
components/prayer/__tests__/Explanation.test.tsx shared/__tests__/stringGuard.test.ts
shared/__tests__/catalogGates.test.ts shared/__tests__/catalogLock.test.ts
--watchman=false --selectProjects=components` (the lock and parity gates ride along),
then `yarn validate`, then `yarn format` if Biome asks.

Break script (run after green, revert immediately):

```bash
# Break the numbers the ring prints: the four-bearing test must fail
perl -0pi -e 's/\[0, 90, 180, 270\]/[0, 90, 180, 271]/' shared/qiblaCompass.ts
npx jest shared/__tests__/qiblaCompass.test.ts --watchman=false --selectProjects=unit
# Expected: the CARDINAL_ANGLES deep-equal fails on 271
git checkout -- shared/qiblaCompass.ts
npx jest shared/__tests__/qiblaCompass.test.ts --watchman=false --selectProjects=unit
# Expected: green again
```

Review: the module holds no catalog key and imports no `t`; the degree circle's size is a
`FACE` ratio, never a number invented at the draw site; the keys leave every locale, not
ar alone; no committed artefact still names `qibla.cardinal`.

Version and commit: 2.0.606 in both files. Commit message:
`2.0.606 - feat(qibla): the compass ring prints the four bearings as Latin degree numbers, identical in every language (owner ruling 2026-10-14)`.

Merge: none this run.

Done when: the red lines and the break run are in LOG.md, the suites and `yarn validate`
are green, and the commit is on `ticket/76` at 2.0.606.
