# Ticket 58a log

## Ticket 58a

## Planning (2026-10-12)

- Session opened at `uat` 5f017d84 (2.0.84). Rulings D59, D60 (2026-10-11, queue row 58)
  stand: D59 restart on RTL switch (58b), D60 two-stage split (58a mechanical conversion,
  58b the flip). Stage planned here: 58a.
- Fact census dispatched to three explore workers: directional-style census, pinned-RN
  logical-key facts, measure-site map. Findings land in section 4 as they return.
- Owner instruction this session: no board or dashboard changes; she works the board in a
  separate worktree. This plan touches app source, `ai/plans/58a-logical-edges/` and the
  queue row only.

- Fact census: three explore workers returned 2026-10-12. Census (67 raw hits: 46
  Class A convert lines, 7 window-space, 11 worklet/sprite, 3 non-style; zero directional
  textAlign, zero hitSlop objects, zero physical borders, widgets already logical).
  RN facts: every logical key exists in the pinned types
  (`types_generated/Libraries/StyleSheet/StyleSheetTypes.d.ts`), Yoga resolves start to
  left and end to right under LTR (`Style.h` computeLeftEdge/computeRightEdge), RNTL and
  jest-expo rewrite nothing, and RN's own swapLeftAndRightInRTL mechanism is exactly
  what 58a makes explicit. Measure map: five measure-site families classified; overlay
  catchers are window-space physical by construction.
- Owner interview 2026-10-12: D66 tests only (no device step in 58a), D67 permanent
  structural gate test, D68 explicit queue row for 58b. All three recommendations
  accepted as proposed.
- Scratch-worktree proof ($HOME/athan-gitree/worktrees/plan-58a, code at 1c39b04c):
  gate prototype over seven source dirs reports 67 hits; empty allowlist lists all 67
  (red); full allowlist passes 0 remainder 0 stale; dropping step-2 entries with code
  unchanged fails naming exactly the 6 step-2 lines (red); converting the four step-2
  files (constants start/end rename, Prayer, Alert, Time) and dropping those entries
  passes (67 to 61 hits, 0 remainder, 0 stale); `npx tsc --noEmit` exit 0; prayer
  suites 7 passed / 59 tests. Step-2 shape proven end to end.

- Drafting complete 2026-10-12: PLAN.md sections 1 to 12, six step files, 29 anchors
  (all count 1 at 1c39b04c), six break scripts, preflight-58a.sh (prints PREFLIGHT OK
  from a clean checkout), handover trio (scanner, 59-entry allowlist, gate suite).
  `bash scripts/check-plan.sh` prints PLAN OK. Break-1 proven live in the worktree
  (both failure directions, restore verified three ways). Break 2 to 6 sed targets
  verified unique in their post-conversion files during the same proof session.

- Grill 2026-10-12 (athan-plan-griller, cold): 9 findings (3 must, 4 should, 2 nice),
  all adjudicated and applied. Musts: the handover trio failed Biome as written (fixed:
  formats run, unused parameter dropped, re-proven live: biome 0, CLI OK, gate 2/2);
  the per-step allowlist rewrite produced a Biome-rejected shape (fixed: every red-test
  filter command now ends in `npx biome format --write`, contracts reworded from
  byte-for-byte to same-entries-content-unchanged, proven live: filter+format ends
  Biome-clean and red); the D68 queue change sat on nobody's plate (fixed: the READY
  commit lands row 68, row 58 restated as 58a, row 66 repointed at row 68, preflight
  asserts row 68 exists). Shoulds: Class C allowlist wording, Class A counts (20 files,
  46 lines), step 1 gradle clarification, step 3 anchor reference reworded. Nices:
  `hooks/` joined the scan scope (0 hits at planned-at), preflight fallback path uses
  $HOME. check-plan prints PLAN OK after the fixes.

session: ses_ed0c05b82ffe7FokNEW4Ih9lvf



