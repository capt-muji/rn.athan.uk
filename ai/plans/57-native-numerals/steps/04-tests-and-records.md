# Step 04: the pinned assertions and the records

**Requirements:** R1.2, R7.1
Weight: 1
**Anchors:** none (records step).

## Resume note (A1)

The first run of this step stopped after its records commit `fac3194d`
(2.0.60): two of its sweep twins exposed the census defect that step 03b now
fixes. Re-apply the preserved sweep from
`$HOME/athan-gitree/sessions/57/step04-stopped.patch` minus its
`Time.test.tsx` and `widgetSimulation.test.ts` hunks (those two twins belong
to step 03b now); the remaining six files' twins pass as engineered. The
ledger reconciliations and the stop finding already landed in `fac3194d`; do
not rewrite them, and fill the stopped entry's `Merge` line with `e827326d`
(change nothing else in it). `LOG.md` still owes step 03b's entries as they land and
this step's own final entry; the queue row reads `IN PROGRESS, step 4` when
this step runs.

## Goal

Every suite that pinned Latin digits asserts locale-aware expectations with en
byte-frozen, the width re-measure under native digits is proven, and the records land.

## Branch

`feat/57-04-tests-records` off `uat`.

## Files

- The pinned assertions the census enumerated (PLAN.md section 4 carries the full
  file-and-line list): `components/prayer/__tests__/Time.test.tsx`,
  `components/countdown/__tests__/Countdown.test.tsx`,
  `components/sheets/parts/__tests__/SoundItem.test.tsx`,
  `components/sheets/screens/__tests__/Alert.test.tsx`,
  `components/sheets/screens/__tests__/Sound.test.tsx`,
  `stores/__tests__/countdown.test.ts`, `shared/__tests__/time.test.ts`,
  `shared/__tests__/dateLocalized.test.ts`,
  `shared/__tests__/notifications.test.ts`,
  `shared/__tests__/i18nBridge.test.ts`,
  `shared/__tests__/prayerIdContract.test.ts`,
  `shared/__tests__/widgetRenderer.test.ts`,
  `shared/__tests__/widgetLockRenderer.test.ts`,
  `components/ui/__tests__/InitialWidthMeasurement.test.tsx` (the width
  proof, change contract 2),
  `shared/__tests__/widgetSimulation.test.ts` (each flips to a
  locale-parameterised expectation or gains an ar twin; every en assertion stays
  byte-identical)
- the plan files

## Red tests

1. Run the full suite under an ar-forced locale harness where one exists; the census's
   Latin-digit assertions fail before the update where they exercise ar surfaces - the
   flip is the change itself (this step's red is recorded, not engineered: the
   assertions updated in step 01 to 03 already carry the ar twins; this step sweeps
   the remainder the census named, each updated assertion named in LOG.md).

## Change contracts

1. Each updated assertion: the en expectation stays byte-identical; the ar twin
   composes the same shape with native digits. No assertion loosens (no regexes where
   exact strings stood).
2. The width proof: a suite extension renders the prayer row under ar with native
   digits and asserts the measure passes and the ar width key is unchanged (the
   measure layer reads prayer names only, which carry no digits).
3. Records: LOG.md entries complete; the queue row carries the executed text.

## Green run

`yarn validate` passes; tsc and biome exit 0.

## Break script

None (records step; the house pattern for weight-1 records steps).

## Version and commit

Message: `<VERSION> - test(i18n): digit assertions locale-aware, en byte-frozen; job 57 records`.

## Review checklist

- No en byte changed anywhere in the diff.
- Every named assertion from the census is accounted for.

## Merge

`git checkout uat && git merge --no-ff feat/57-04-tests-records -m "Merge feat/57-04-tests-records into uat: job 57 step 04"`.

## Done when

Checklist ticked; row reads `IN PROGRESS, step 4`.
