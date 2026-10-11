# Step 11: the What's New entry

**Requirements:** R10.1
Weight: 2
**Anchors:** `whatsnew-archive-head`, `whatsnew-visible-capture` (already a function after step 03; the anchor region is the archive).

## Goal

The release that carries the language feature announces it, translated, in the What's New
modal (D48), at the version this step lands.

## Branch

`feat/39-11-whatsnew` off `uat`.

## Files

- `shared/whatsNew.ts`
- tests: `shared/__tests__/whatsNew.test.ts` extension

## Red tests

1. The whatsNew suite: `WHATS_NEW.version` equals the version this step lands (the executor sets it from the version command), and `getVisibleWhatsNew()` for that installed version resolves `whatsNew.title.language` / `whatsNew.body.language` through the active catalog — fails today (no 2.0.x entry for the feature).
2. Same suite: under `ms`, the resolved title is `Bahasa` — fails today (the entry does not exist).

## Change contracts

1. `WHATS_NEW.version` becomes the step's landed version. The archive's items list gains `{ titleKey: 'whatsNew.title.language', bodyKey: 'whatsNew.body.language', version: <the landed version> }` as its first entry. No flags (the feature ships in this release, D48's "now"). No historical item changes.
2. No other file changes; the strings already live in every catalog since step 02.

## Green run

The suite passes; `yarn validate` passes.

## Break script

Copy `shared/whatsNew.ts` to `$TMPDIR`; change the new item's `titleKey` to `'whatsNew.title.widgets'` by exact-text edit; run the suite, expect the resolved-title failure; restore; rerun, expect pass. Ends `ALL AS EXPECTED: 1`.

## Version and commit

Message: `<VERSION> - feat(language): whats-new entry for the language feature, translated`.

## Review checklist

- The entry's version equals the commit's version (the gate only shows on exact match).
- No parked item moved, no flag added.

## Merge

`git checkout uat && git merge --no-ff feat/39-11-whatsnew -m "Merge feat/39-11-whatsnew into uat: job 39 step 11"`.

## Done when

Checklist ticked; row reads `IN PROGRESS, step 11`.
