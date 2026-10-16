# LOG.md - ticket 121

## Planning (2026-10-16)

Frontier worked agent-ruled per the standing hands-off order; decisions D121.1 to D121.9 in
PLAN.md section 2. Facts measured directly from the installed `expo-location` 58.0.16 source tree,
the published `Location (next)` documentation page, the package changelog, the npm registry and the
upstream pull request's API record; the app's own location and heading surface read in full.

## Ticket 121

Skeleton landed with the draft; the grill, the gate and READY follow.

DRAFT (2026-10-16): the plan drafted - three docs steps, sixteen anchors extracted from the
installed tree and verified at `ef0b09b2` (2.0.898) by `scripts/build-anchors.sh` (all sixteen
counting 1), the pre-flight script written, and FINDINGS sections 1 to 8 drafted to land with the
READY commit.

Anchor extraction (2026-10-16): `bash ai/plans/121-expo-location-next/scripts/build-anchors.sh`
printed, one line per anchor, its source, its line count and its count; every count 1, every line
count inside the 3-to-15 band.
