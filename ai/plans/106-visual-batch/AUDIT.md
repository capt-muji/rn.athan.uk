# AUDIT 106

Range: the three code steps `e2307873` (2.0.803, Rubik), `d249500b` (2.0.806, arrow),
`0680c5ab` (2.0.808, letter gap) and the dial follow-up `e8106d73` (2.0.815), plus their
merges. Seven reviewers across two waves, all in parallel worktrees: plan-conformance and
blind on the three-item diff (findings fixed at 2.0.811), plan-conformance and blind on the
dial diff (findings fixed at 2.0.816). The owner's reads landed at 2.0.811 and the dial at
2.0.815 with her next read riding row 108's build.

Verdict: PASS. All four commits conform; every must and should is fixed or carried with a
reason; the owner's acceptance stands on her own words for the letters ("perfect. Thank you")
and the gap dial.

| Finding | Source | Verdict |
| --- | --- | --- |
| TIP_OVERLAP 6 with the 15pt arrow moves the card body 1pt against her order | blind wave 1, must | FIXED at 2.0.811: the overlap goes to 7, the body byte-identical, the tip sunk deeper still |
| "D106.2:" provenance prefix in the test comment | blind wave 1, must | FIXED at 2.0.811: deleted |
| The stale familyDigits comment and the mis-scoped test title | blind wave 1, should | FIXED at 2.0.811: both reworded |
| The dead Noto TTFs and licence line | blind wave 1, should | FIXED at 2.0.815 with her ask-first nod |
| Rubik's OFL attribution missing | blind wave 1, nice | FIXED at 2.0.811 |
| The DONE-cell draft overclaimed "every non-ar locale byte-identical" | plan wave 1, should | FIXED at apply: the cell scopes the claim to the faces |
| The dial comment carried styling value and provenance | blind wave 2, must | FIXED at 2.0.816: the comment dies whole |
| compactArabic now names the looser branch | blind wave 2, should | REJECTED: the idiom spans five files (Sound.tsx:246 carries the same shape); one file diverging is worse than a drifted name |
| The literal 6 beside a token-using branch | blind wave 2, nice | FIXED at 2.0.816: SPACING.py |
| Shipped Roboto faces carry no Apache notice | blind wave 2, nice | CARRIED: pre-existing; the honest fix is a NOTICE file, its own hygiene commit |
| The plan's preflight anchors self-stale across steps (ar-record after step 1, day-styles after the dial) | plan, both waves | NOTED: the plan-writing lesson row 104's audit also recorded - future plans give each step's preflight only that step's anchors |
| The audit diff file omitted the app.json hunk | plan wave 2, nice | BY DESIGN: the diff command excluded the version-carrying files; the reviewer verified the hunk from the commit directly |

The Rubik cascade her read surfaced (the sheets' -10 pulls, the label gap, the footer clipping)
is row 108, out of this ticket by her own batch ruling. The font specimen survives at
$HOME/athan-gitree/sessions/106/ by her instruction ("dont delete the fonts yet"); it is the
folder's only content and this ticket's named artefact. Everything else under sessions/106 is
the specimen's own folder and dies with nothing else.
