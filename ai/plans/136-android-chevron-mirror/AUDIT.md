# AUDIT - ticket 136

## Pass: plan-conformance
Range: 6aadbfa6^..859b42fb (ticket 136's merges 6aadbfa6, 508c56b5, daa7bd8a, 9d6964a7, 281e5560, 859b42fb; the production code sits in be3850d2)
Findings: /var/folders/cs/j4wg7fqj1qd_xx4dcnmbb5fm0000gp/T//findings-plan-136.md

Verdict: conforms. The three pins, the verbatim suite, the file list, the
version ascent and every named sha verified against git. One should,
adjudicated below.

## Pass: blind
Range: 1d69959c..9d6964a7
Findings: /var/folders/cs/j4wg7fqj1qd_xx4dcnmbb5fm0000gp/T//findings-blind-136.md

Verdict: sound. The pin verified against RN 0.88's ParagraphShadowNode
direction stamping and the repo's own pin idiom; the sweep's assertions
and counts verified honest. One must and one nice, adjudicated below.

## Adjudication

| # | Finding | Verdict | Disposition |
| --- | --- | --- | --- |
| P1 | The lane-weather rebuilds replayed a whole older README, transiently stomping rows 135 and 137 on uat until their owners' next commits repaired them (8410ac83, efdee293) | Confirmed, procedural | Record-only. The lane's own later rebuilds switched to surgical row substitution and LOG.md's weather record carries the lesson; HEAD is accurate, no tree change |
| B1 | Help's step-mark guillemets (directionGlyph, U+00BB/U+00AB) are the same lone mirrored neutral in an unpinned RTL paragraph and draw mirrored under ar on Android | Mechanism confirmed, out of scope by D136.3 | Rejected as an audit fix. The plan argued and recorded the exclusion (unreported surface, a different glyph, named as the residual in the DONE cell); a visual change beyond the plan and her rulings is not the audit's to make. If she reports it, the fix is one pin and one sweep line with the mechanism already diagnosed |
| B2 | The sweep does not guard the enumeration: a chevronFor() call site in a new file stays green | Confirmed | Applied in this audit commit: a source-scan inventory test asserting the only chevronFor() callers under components/ are the three pinned files, its teeth proven by a temp-caller mutant reddening before the commit |
