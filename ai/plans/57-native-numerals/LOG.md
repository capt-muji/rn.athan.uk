# Job 57 execution ledger

## Step 01: the digit localiser and the shared formatters

- Branch: `feat/57-01-digit-core` off `uat` (pre-flight `PREFLIGHT OK`, 7 anchors verified, jest existence check passed).
- Red: `digits.test.ts` failed on the absent module; `formatTime`/`formatPrayerTime` ar tests failed showing `2س 59د`/`05:44`; `dateLocalized` ar tests failed showing Latin. 4 named failures, no others.
- Change: `shared/i18n/digits.ts` (ARABIC_INDIC ten-glyph map, `localiseDigits` with the single `currentLocaleId() === 'ar'` test), re-export in `shared/i18n/index.ts`, all six `shared/time.ts` formatters wrap every return through `localiseDigits` (`formatPrayerTime` 1 return, `formatTime` 2, `formatTimeAgo` 4, `formatDateLocalized` 1, `formatHijriDateLocalized` 2 including the Gregorian fallback delegation, `footerFor` 2). Plan's parenthetical counts (6/4/3) do not match the code on uat (2/4/2; `shared/time.ts` unchanged since the planning commit `6195ab1f`); the operative contract "wrap each return" was followed literally. The catch-fallback split to three lines needed one added test (`2026-03-05 ` trailing space: ISO parse throws, field split composes) to hold the 100% coverage gate. Updated the `formatHijriDateLocalized` JSDoc and the dateLocalized test header comment, which the change made untrue.
- Green: `yarn validate` 5443 passed, 5443 total; Statements 100% (5202/5202), Branches 100% (2242/2242), Functions 100% (1080/1080), Lines 100% (4660/4660). `yarn test:tz` exit 0, four zones, 5443 passed each. `npx tsc --noEmit` and `npx biome check . --error-on-warnings` exit 0.
- Break script: `ALL AS EXPECTED: 1` (locale test substitution fails the ar mapping with `05:44` shown, restore passes 5/5).
- Version: 2.0.57 (origin/uat fetched under the version lock at 2.0.56).
- Commit: `a67cc87b` (2.0.57), hook green: `Tests: 5443 passed, 5443 total`; Statements 100% (5202/5202), Branches 100% (2242/2242), Functions 100% (1080/1080), Lines 100% (4660/4660).
- Review: read `git show a67cc87b` cold. Map covers exactly ten glyphs (pinned by test); en/ms/so/hi/th identity pinned; no output parsing; call-time locale read (loader law); cache-key paths (`formatDateShort`, `pad2`, `adjustTime`) untouched; the one untrue JSDoc updated. No findings.
- Merge: (filled after merge)
- session: ses_ed2764c96ffe16EVsvp03ReEtF
