# AUDIT: ticket 76

| Field | Value |
| --- | --- |
| Branch | `ticket/76` |
| Audited head | `1607934e` (2.0.608), plus the audit-fix commit on top |
| Range audited | `1b0d5229..1607934e` for the code (plan files excluded), the plan folder read whole |
| Reviewers | one `athan-reviewer` plan-conformance, one blind (neither saw the other's findings); the lead adjudicated every finding from the code |
| Gate | `yarn validate` green; `node scripts/check-identifiers.js --push HEAD` clean |

Both reviewers returned their findings; the lead confirmed each from the code, by a test
where one applies, or rejected it with the line that disproves it. Fixes are red-first
where a behaviour changes. The blind reviewer disclosed one leak: a repo-wide `grep` for
`qibla.cardinal` printed lines from `ai/plans/`, which it did not open; every blind
finding stands on shipped code, so the leak changed nothing.

## Blind findings

| # | Finding | Verdict |
| --- | --- | --- |
| B1 | should-fix: the ring prints Latin `0/90/180/270` under every locale while the app localizes data digits; the only authority is the change's own comment | **Rejected.** The owner's 2026-10-14 ruling orders exactly this: "LATIN NUMBERS ... identical in every language, so the compass depends on no language at all". The authority is the ruling, recorded durably in queue row 76 and in PLAN.md section 0; the blind brief excluded the plan by design. The provenance concern is met by the queue row (partly by B2's fix). **Addressed in part** by P4: the ring now draws on the language-free digit face, so the digits *and* the degree circle are identical. |
| B2 | should-fix: two comments cite `(PLAN.md section 0)`, which dangles once the folder dies | **Confirmed, fixed.** Both comments now cite the ruling's date only. |
| B3 | nit: `QiblaCompass.tsx:87` says "the letters keep their bearings" | **Confirmed, fixed** (now "the numbers"). |
| B4 | nit: `shared/constants.ts:855` says "The cardinal letters" | **Confirmed, fixed** ("The cardinal numbers' ink"). |
| B5 | nit: `Qibla.tsx:89` comment claims the wider line is left in flow | **Confirmed, fixed** (rewritten to the waiting-in-flow / ready-absolute truth). |
| B6 | nit: the donor applies `[styles.subtitleText, styles.subtitleDonor]`, the latter already spreading the former | **Confirmed, fixed** (donor uses `styles.subtitleDonor`; the redundant `subtitleText` StyleSheet key removed). |
| B7 | nit: the donor test titles promise box sizing but assert only style props | **Confirmed, fixed** (renamed to the mechanism they prove). |
| B8 | nit: the six-locale loop in `qiblaCompass.test.ts` asserts a constant against itself; the reset is outside `try/finally` | **Confirmed, fixed** (the vacuous loop removed; the per-locale proof is the render sweep). |
| B9 | nit: `Explanation.test.tsx:86` restates the query on line 85 | **Rejected.** The assertion pins the node's child shape; `getByText` matches composed text and would still pass if the child were an array. The donor test in `Qibla.test.tsx` uses the same pattern, so the line is consistent and has a distinct failure mode. |

## Plan-conformance findings

| # | Finding | Verdict |
| --- | --- | --- |
| P1 | should-fix: the reserved DONE cell claims simulator proof under ar and en, but the ring, the ready line and the en reads were not taken | **Confirmed, fixed.** The DONE cell now states the readings actually taken and names the ring, the ready line and the en header as the owner's QA. |
| P2 | should-fix: the donor's width contribution is not proven (the tests assert style props only) | **Confirmed, noted.** RNTL measures no text, so the box-width mechanism (an in-flow, zero-height text holding the ready sentence) is what the tests lock; the rendered box on glass rests on the owner's QA. Recorded in the DONE cell and here. |
| P3 | should-fix: comments/plan name ar and so as the wider-ready locales, but ms is a third (ms ready 204.8dp vs waiting 129.2dp) | **Confirmed, fixed.** The surviving comment names ar, ms and so; the plan/LOG references die with the folder. |
| P4 | should-fix: the ring reads its face from the locale (`ty.familyMedium`), so under ar it draws the Arabic face, whose cmap lacks U+00B0, and the degree circle falls back to a platform font | **Confirmed, fixed.** The ring now draws `ty.familyDigits`, the language-free face (row 82's own pattern), so its numbers and degree circle are identical in every language. Red-first: reverting to `familyMedium` fails the new source assertion. Noted: the component's `ty` is a module-scope snapshot, so no render test can observe the per-locale face; the fix is guarded at the source and by the owner's QA. The ar pixels change; the ruling demands identity, and her QA confirms the look. |
| P5 | should-fix: two comments describe the removed code | **Confirmed, fixed** (same edits as B3 and B5). |
| P6 | should-fix: R1.2's icon-at-the-row's-end is measured only under en; so's ready sentence overruns the header column on a 360dp phone | **Confirmed, noted (no code change).** On a 360dp phone the column is 248dp against so's 260.4dp ready sentence, so that one line may still truncate there; the plan rejected the alternatives that would change the layout. On the owner's iPhone XS (375pt) the column is 263dp and the sentence fits. Recorded here and in the DONE cell's owner-QA note. |
| P7 | nit: D76.8 still prescribes `baselineShift` while the code uses `dy` | **Confirmed, fixed.** D76.8 corrected. |
| P8 | nit: the plan header still reads 4 steps / 7 units and assigns R3.1 to step 2 | **Confirmed, fixed** (5 steps / 9 units; step 2's line drops R3.1). |
| P9 | nit: `steps/2-digit-sweep.md`'s Files line omits `qiblaCompass.test.ts`, which the step changed | **Confirmed, fixed.** |
| P10 | nit: the `ar-cardinals` anchor and its pre-flight check survive while the keys they anchor are deleted | **Confirmed, fixed.** The anchor file and its `check_anchor` line are deleted. |
| P11 | nit: the string guard proves no `qibla.cardinal` key but not that the module imports no catalog | **Confirmed, fixed** (`expect(source).not.toContain('@/shared/i18n')`). |
| P12 | nit: the standalone en donor test duplicates the en case of the six-locale sweep | **Confirmed, fixed** (deleted; the sweep covers en). |
| P13 | nit: no step heading carries a review verdict | **Confirmed, addressed.** This file carries the verdicts; the step ledger records the fixes. |

## Residual items for the owner's QA

- The compass ring, the ar ready subtitle and the en Qibla read were not obtainable on
  the simulator: it vouches no heading (the dial never draws) and the ar-to-en reload
  starved when the smoke dev server exited. The structural tests carry the proof weight.
- The `so` ready sentence may still truncate on a 360dp-wide phone (P6); it fits on the
  owner's iPhone XS.
- The ring's face under ar changes from the Arabic face to the language-free digit face
  (P4); the ruling demands identity, and the look is hers to confirm.

## Verdict

**PASS with fixes on the branch.** Every confirmed finding is fixed in the audit-fix
commit; the two rejections are reasoned above. Acceptance criteria as closed: R1.3, R2.1,
R2.2, R3.1, R3.2 hold; R1.1 holds in tests with the rendered layout on the owner's QA;
R1.2 holds under en with the `so` narrow-width caveat recorded. The queue row is not set
DONE: the orchestrator merges and the owner's QA confirms the visuals.
