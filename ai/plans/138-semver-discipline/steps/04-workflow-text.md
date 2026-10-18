# Step 4 - the workflow text and the consistency sweep

Requirements: R4.1, R5.1
Weight: 1

## Anchor checks

`python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/138-semver-discipline/scripts/anchors/agents-version-rule.md ai/AGENTS.md`
prints `1`, and the same for `lane-merge-bullet.md` against
`.opencode/agents/athan-lane.md`. If either differs, `STOP:` per PLAN.md 2.2.

## Goal

The discipline's statement lands in the two files agents read, minimal and in each
file's voice, and the queue carries nothing inconsistent.

## Branch

`git checkout -b step/138-workflow-text lane/138` (after step 3 merged).

## Files

- `ai/AGENTS.md` (one hard-rule bullet rewritten)
- `.opencode/agents/athan-lane.md` (two bullets extended)
- `ai/plans/README.md` (row 138 Status cell only)
- `ai/plans/138-semver-discipline/LOG.md` (records, no code)

## Change contracts

`ai/AGENTS.md`, the version hard rule (the anchored four lines) becomes exactly:

```
- Version bump on every commit: `package.json`, `app.json` and `android/app/build.gradle`
  together, one class-step per commit: a patch by default, a minor when the commit's
  subject is typed `feat`, meaning it completes user-visible functionality (semver's
  minor: new backward-compatible capability; a fix is always a patch, however visible).
  Patch resets to 0 at a minor. Majors are the owner's alone: never take one without
  her recorded order and an entry in `scripts/version-major-allowlist.json`. Fetch `origin`
  first, because concurrent sessions have taken the same number twice. Bump `app.json`
  FIRST, then prebuild, then build: `expo run:*` never re-syncs an existing native folder.
```

`.opencode/agents/athan-lane.md`, the `uat.lock` bullet (the anchored eight lines)
gains after the `git merge` clause: `and run node scripts/check-version-discipline.js
--merge-check the same way: a merge whose incoming version does not exceed uat HEAD's
is refused (rebase onto uat and renumber onto the higher line)`.

The lane-weather bullet (the same file, the paragraph naming merge conflicts on
`ai/plans/README.md` or the three version files) gains one standalone sentence after
"retry the merge once, then STOP if it still conflicts.": `Renumbering replays every
replayed commit as one class-step from its new parent (a rebase onto a minor line
re-lines the patches as x.Y.1, x.Y.2), and a rebase run with hooks bypassed re-runs
node scripts/check-version-discipline.js by hand over the range.`

Consistency sweep, recorded in `LOG.md` with its output:
`grep -rn 'patch per commit\|minor per completed feature' ai/AGENTS.md .opencode/ e2e/ --include='*.md'`
prints the one `ai/AGENTS.md` line before the change and nothing after (the owner's
transcribed order in the queue row and this plan folder are exempt: her quotation is
the record, and the folder dies at DONE), and
`grep -rn 'versionCode\|versionName' ai/AGENTS.md .opencode/agents/athan-lane.md`
output is unchanged by this step (no drift into build-bay territory).

The queue row 138 gains, in the Status cell only: `; steps 1-4 landed, the boundary
recommendation (grandfather) and the store/OTA measurements carried in the audit
merge` - the DONE wording itself is the audit's (PLAN.md section 8).

## Red test

Docs step: the red proof is the sweep - run the scoped grep (above) before the
change (it prints exactly the `ai/AGENTS.md` hard-rule line; if it prints more,
record every hit and fix them all in this step), run it after (empty). Record both
outputs in `LOG.md`.

## Green run

`yarn validate` (nothing code-facing changed; the gate still passes with the plan's
suites in place).

## Break script

None (docs step; the mutation pass lives in steps 1 to 3).

## Version and commit

The parent's version plus exactly one patch (D138.3) - after step 3's commit; record
the number in `LOG.md`. If the uniqueness gate reports parent+1 held, `STOP: lane
weather` per PLAN.md section 5. Subject: `<VERSION> - docs(workflow): 138 step 4
the class rule in AGENTS.md and the lane protocol, the boundary recorded`.

## Review

Read the diff cold: the AGENTS.md bullet keeps the file's voice (imperatives, the
existing structure, no new section); the lane file's two additions are one sentence
each; no other file moved.

## Merge

Same as step 1, branch `step/138-workflow-text`.

## Done when

Checklist box ticked, sweep outputs recorded, `yarn validate` green, merged to
`lane/138`.
