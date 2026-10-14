# LOG: ticket 76

## Ticket 76

Digit and string gaps under ar: the overlay's Latin numerals, the Qibla instruction's
ellipsis, the cardinal letters. Worktree `$HOME/athan-gitree/run-76`, branch
`ticket/76`, anchor `1b0d5229` (2.0.402). One continuous run under the owner's run
order of 2026-10-14: plan, grill, execute, audit; no merge to uat, no push, no DONE.

## Planning (2026-10-14)

Findings, each written when taken:

- **The numeral law, resolved from the shipped code.** Lineage: row 57 (2026-10-12)
  native numerals per language; row 82 (2026-10-13) reversed to Latin in every
  language; row 84 (2026-10-13, landed as `1b30469a`, 2.0.250, "every locale rule
  made data") shipped the boundary at the anchor: `NATIVE_DIGITS` as data at
  `shared/i18n/locale.ts:27` (ar `٠١٢٣٤٥٦٧٨٩`), read by `localizeDigits`
  (locale.ts:29-32). The countdown, its bar and the list row times keep Latin glyphs
  in every locale (`shared/typography.ts:18-19`); every other sentence and value takes
  the locale's digits.
- **Item (a) verdict.** The Extras info box path reads the digit tables:
  `components/prayer/Explanation.tsx:74` renders
  `{localizeDigits(explanation)}`, a call added by the same `1b30469a` (verified with
  `git log -S localizeDigits -- components/prayer/Explanation.tsx`: one commit,
  2026-10-14, 2.0.250). The owner's RTL test of 2026-10-13 ran a build from before
  that commit, so her Latin 20 was real then. The ar Suhoor string carries a Latin 20
  in the catalog (`ar.ts:152`, `'20 دقيقة قبل الفجر'`) and the renderer converts it
  at draw time. `Explanation.test.tsx:60-73` already locks the Suhoor box under ar.
  Remaining work: the five-box, six-locale sweep lock (step 2) and the visual read
  (step 3). No production change.
- **Item (b) verdict: truncated by layout, not by the catalog.** All six catalogs hold
  complete sentences for both keys (grep of `en|ar|ms|so|hi|th` quoted in the plan's
  evidence): waiting `Follow below instructions` / `اتبع التعليمات أدناه` and ready
  `Hold flat and turn slowly` / `امسكه أفقيًا ودُر ببطء`; so's ready line is the
  longest at 42 characters. Both lines render with `numberOfLines={1}`
  (`Qibla.tsx:91,94`), whose default tail mode appends the dots. The box shrink-wraps
  to the in-flow waiting line while the ready line is absolute; the repo's own test
  comment (`Qibla.test.tsx:258-260`) documents the mechanism with measured en widths,
  158.6dp in flow against 150.4dp absolute. Under ar (and so) the ready sentence is
  the wider one, so the absolute line truncates at the waiting line's width and grows
  the three dots she saw. Fix: the zero-height width donor (step 1, D76.3).
- **Item (c) verdict: the cardinal letters are correct.** The catalog holds
  n=ش, e=ق, s=ج, w=غ (`ar.ts:177-180`); `resolveCardinals` maps them to 0/90/180/270
  degrees (`shared/qiblaCompass.ts:99-104`). Sources (web, via the TinyFish MCP,
  2026-10-14): five independent Arabic qibla services print the live compass dial in
  the same four letters in the same clockwise order from north: al-harameen.com/qibla,
  hijriyan.com, tarikhak.com (Doha, Dammam, Kuwait City, Amman pages), wmadaat.com
  (spaced "ش ق ج غ"), manarquraan.co.uk. East takes ق because شرق and شمال share the
  initial ش; the dial convention disambiguates. No change; step 2 adds the mapping
  lock.
- **Version-range deviation (D76.5).** The run order reserved 2.0.500-2.0.599, but
  `origin/uat` measured at `f5c608ed` (2.0.600) on 2026-10-14: numbers 2.0.403
  through 2.0.600 are taken on uat; sibling branches measure `ticket/80` 2.0.406 and
  `ticket/75` 2.0.450. The repo law (fetch origin first, never take a taken number)
  governs; this ticket versions from 2.0.601 upward.
- **Parallel-invariant file list (complete, declared at planning).** Production and
  tests this ticket may touch: `components/sheets/screens/Qibla.tsx`,
  `components/sheets/screens/__tests__/Qibla.test.tsx`,
  `components/prayer/__tests__/Explanation.test.tsx`,
  `shared/__tests__/qiblaCompass.test.ts`, `app.json`, `package.json`,
  `ai/plans/README.md`, `ai/plans/76-ar-digits-qibla-copy/**`. Transiently, by the
  step-2 break script only (edited then reverted):
  `components/prayer/Explanation.tsx`. None of these appears in ticket 80's or
  ticket 75's list.
- `android/` is gitignored and absent in the worktree; the lockstep test accepts the
  absent file and asserts the gitignore, so only `app.json` and `package.json` carry
  the bumps.

### Step 01 — done

Branch `ticket/76`, commit directly on it. Preflight: `PREFLIGHT OK` (script copied
to `$TMPDIR`, run from the worktree root; all seven anchors counted 1).

Red first: the two subtitle testIDs added to `Qibla.tsx` (the donor id stays off,
which is the change under test), then the test edits of the step file — helper moved
to testID lookups, the four text-keyed subtitle tests re-keyed to the ids, the
wider-line test renamed to its post-fix invariant with both measured en widths kept
in its comment (158.6dp in flow, 150.4dp absolute), the en donor test and the
six-locale `it.each` sweep over `LOCALE_IDS` added. Red run (`npx jest
components/sheets/screens/__tests__/Qibla.test.tsx --watchman=false
--selectProjects=components`): `Tests: 7 failed, 159 passed, 166 total`, every
failure the plan's line —

    Unable to find an element with testID: qibla-subtitle-donor

— across `sizes its box to the wider of its two sentences under en` and the six
`in each shipped locale: en|ar|ms|so|hi|th` cases. No other test failed.

Change: the zero-height donor `Text` between the two lines (testID
`qibla-subtitle-donor`, `accessibilityElementsHidden`,
`importantForAccessibility={'no-hide-descendants'}`, `numberOfLines={1}`, style
`[styles.subtitleText, styles.subtitleDonor]`, content `t('qibla.subtitleReady')`,
one-line why comment); the text metrics hoisted once as `subtitleText` and shared by
`styles.subtitle` (plus `marginTop`), `styles.subtitleDonor` (plus `height: 0,
opacity: 0`, no margin, no position), and the `styles.subtitleText` key itself.

Green: same command — `Tests: 166 passed, 166 total`. `yarn validate` clean (tsc,
Biome, Jest 5577 passed, 2 skipped; one Biome format pass applied to the wrapped
JSX attribute brackets, `yarn format`, no other file touched).

Break script, run with the change staged so `git checkout --` restores it from the
index: `Tests: 7 failed, 159 skipped, 166 total` — the en case and the six locale
cases, exactly the plan's seven. Reverted; the donor id re-counted 1 in `Qibla.tsx`.

Versions: `app.json` then `package.json` to 2.0.602. Commit: `2.0.602 - fix(qibla):
the subtitle box sizes to the wider sentence in every language, so the ready line
never truncates under ar`.

session: ses_ec63996c6ffeqGuyw8XgOwbyVh
