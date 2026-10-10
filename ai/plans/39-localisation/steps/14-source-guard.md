# Step 14: the guard closes - zero exclusion list, data-modules rule

The allowlist empties. Every scanned tree (`components`, `app`, `hooks`, `shared`, `stores`,
`device`, `widgets`) holds no display literal outside the catalog files, the widget layouts'
baked-prop reads, and the migration's frozen legacy arrays. The data-modules rule joins the
guard as its second part.

- Branch: `feat/38-14-guard`
- Anchors: none new (this step reads the whole tree)
- Files: `scripts/string-census-allowlist.json` (becomes `[]`), `scripts/scan-strings.mjs`
  (grows the data-modules rule), `shared/__tests__/stringGuard.test.ts`,
  `shared/__tests__/i18n.test.ts` (closure over the whole `TranslationKey` surface, if not
  already asserted), and any file the guard still names (there should be none; if there are,
  they migrate here under the same byte-identical rule and are recorded in LOG.md)

## Contracts

1. The allowlist JSON is `[]`. The guard scans every root including `widgets`.
2. The scanner's data-modules rule: `shared/help.ts` and `shared/whatsNew.ts` hold only
   `TranslationKey` members and `t()` calls in their string positions - enforced by the same
   AST walk (a `StringLiteral` in those files matches only against the catalog-import path
   and key literals `help.`/`whatsNew.` prefixed).
3. The widget layouts' exemption is structural, not listed: the scanner's guard skips
   `widgets/` files for rule 1/2 hits INSIDE the widget body function (the closure law
   already forbids imports there; the strings they read are props). Any literal outside the
   body's prop-read positions still fails. The implementation: the scanner treats
   `widgets/*.tsx` JSX/attr hits inside the widget component functions as prop-driven and
   skips them; module-scope literals in those files fail.
4. `stringGuard.test.ts` gains: `it('holds zero display literals outside the catalog')`
   (allowlist empty, exit 0) and `it('the data modules export keys only')`.

## Red

Commit the empty allowlist before the rule work: the guard fails naming whatever remains
(the census at this sha is the predictor; LOG.md records the actual list). That red list is
the step's work.

## Change

Migrate any remainder under the byte-identical rule. Land the scanner rules and tests.

## Break script

1. Add a display literal to a component file. Guard fails naming it. Restore.
2. Add a free string to `shared/help.ts` (not a `help.` key). The data-modules rule fails.
   Restore.
3. Put a display literal at module scope in `widgets/PrayerWidget.tsx`. The guard fails.
   Restore. End `ALL AS EXPECTED: 1`.

## Version and commit

`<VERSION> - feat(i18n): the source guard closes over the whole tree, zero exclusions`

## Review checklist

The three permanent gates now in the chain: `prayerIdContract` (bytes), `i18nBridge` (parity),
`stringGuard` (no hardcoded display copy). The exemption logic for widgets is structural and
minimal. Shipped classes: Residue (no allowlist entry can hide a literal).

## Done when

Guard green with `[]`, both new tests green, `yarn validate` green end to end, break
`ALL AS EXPECTED: 1`, hook lines as step 01, merged `--no-ff`.

## Restore

`git checkout --` the changed files; restore the allowlist to its committed pre-step content.
