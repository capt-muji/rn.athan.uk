# Execution log: Session 41

## Planning, 2026-09-30

The owner's seven rulings landed (`PLAN.md` section 2.1) and reshaped the row: map plus street sentence, no
user interaction, no compass, no London bundle, fetch on demand with a 25 MB cache.

**Proven in the scratch worktree `~/athan-device-sweep/worktrees/plan-41`, then deleted, as the brief requires:**

| What | Result |
| --- | --- |
| The live archive, every offset read from the header | 4 cities fetched in 10 range requests, 873 KB, 5.0 s |
| `shared/tileGeometry.ts`, `shared/vectorTile.ts`, `shared/qiblaStreet.ts` | Built, 62 tests, **100% on all four measures** |
| `npx tsc --noEmit` | exit 0 |
| `npx biome check --error-on-warnings` | exit 0 |
| `scripts/breaks-1.sh` | **caught 18 of 18, ALL AS EXPECTED: 1** |
| `shared/__tests__/unusedExports.test.ts` | FAILS on the modules alone, naming all five exports. This is the sequencing constraint and it is now proven rather than predicted. |

**Four defects found by building rather than by reasoning**, each recorded because each would have reached the
executor as a broken plan:

1. **The break script's perl substitution silently failed** on every search text holding `/`, printing
   `BREAK NOT APPLIED` for both Mercator breaks. Driven through the environment with a `{}` delimiter instead.
2. **The "nearness weight removed" break SURVIVED.** Both ordering fixtures put the far street outside the
   122 m radius, so it was filtered before scoring and nothing tested the ordering at all. This is session
   32's lesson for the third time: a break script is not verified until it is run.
3. **The test helper drew its streets south-to-north**, because tile y grows southward, so a line meant to
   bear 0 bore 180. Caught by the test, which is what it is for.
4. **`metresPerDegree(51.5)` was asserted at 111278 against a true 111258.85.** My arithmetic, not the code's.

Also found, in the data rather than the code: **`is_tunnel` is per segment**, so a tunnel's approach ramps
carry the tunnel's name with the tag absent, which is how "Queensway Tunnel" passed a tag-only filter in
Birmingham. The filter now reads the name as well.
