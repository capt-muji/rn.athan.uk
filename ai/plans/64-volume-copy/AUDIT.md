# Ticket 64 audit (2026-10-13)

Range: `origin/uat..uat` at `b3d4851e` (replan `8d417e81`, step `7c01e5c6`,
merge `10f6d9d9`, ledger `b3d4851e`). Two reviewers: plan-conformance and
blind, run in parallel against `audit-64.diff` (ai/plans excluded).

## Verified clean

- R1.1 to R4.1 all hold; all 30 copy cells byte-exact to the plan tables
  (parser-based comparison); lock hash recomputed from landed en.ts equals
  all five lock values; no style entry; no line outside the listed files.
- D64.9 deletions stand (`shared/help.ts:34-38`, `:142-147`); type-safe over
  all seven entries; key parity holds in all six catalogs; no stale
  reference to the three removed keys in shipped code.
- Versions 2.0.175 / 2.0.176 / 2.0.177 with gradle versionName bumped on
  disk (gitignored). Commit messages match the step spec verbatim.

## Findings and verdicts

1. [nice, plan-conformance] `components/modals/__tests__/Help.test.tsx:97-104`
   uses the default platform where the step's red-test named
   `onPlatform('ios')`. REJECTED as a defect: the components harness loads RN
   as iOS by default and restores the switch per test, so the test proves the
   iOS branch the plan intended; the named helper would be a redundant
   switch. No fix.

2. [nice, blind] `shared/i18n/hi.ts:64` hi's iOS sheet note names only
   "रिंगर वॉल्यूम" (ringer volume), dropping the "& Alerts" half en and the
   other four locales carry. CONFIRMED as a wording observation, NOT fixed:
   the landed bytes are the plan's own copy table verbatim, the copy drafts
   sit under the owner's audit veto (the D42 shape), and a reword without her
   word would break R3.1's plan-byte requirement. Carried to the owner's
   copy-veto list beside the standing veto over all five drafts.

3. [nice, blind] `shared/__tests__/i18n.test.ts:4-5` header claims "every
   member's value is pinned" while parameterized keys (`notification.now`,
   `alert.reminder`, `stepper.value`) appear in no pin. CONFIRMED
   (pre-existing, file touched by the range). FIXED as the audit commit:
   header reworded to "every literal member", with the parameterized keys'
   token-parity gate named.

## Verdict

PASS. One audit fix (comment-only, no behaviour, no test applies), one
finding carried to the owner's veto list, one rejected with the disproving
line above.
