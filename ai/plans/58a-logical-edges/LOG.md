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


### Step 1 — merged
Branch code/58a-1-gate, commit 3f380d80 (merge 569cb261), version 2.0.87.
Handover trio copied verbatim (scanner, 59-entry allowlist, gate suite). Against
unchanged uat code: gate `Tests: 2 passed, 2 total`; CLI `DIRECTIONAL STYLES OK`;
tsc 0; Biome 0.
Break-1 both directions: deleting the permanent RamadanDecorations `left: cx - r,`
entry failed the remainder test (`Tests: 1 failed, 1 passed, 2 total`, naming
`components/ui/RamadanDecorations.tsx`); pushing the `NOTHING_MATCHES_THIS` entry
failed the stale test (`Tests: 1 failed, 1 passed, 2 total`, naming the snippet);
restore verified by suite, CLI and `cmp`. Break last line: `ALL ASPECTED: 1`.
Review: three files equal handover byte for byte (`diff` clean each pair); banned
patterns match PLAN section 4's nine; allowlist 59 entries, 38 `pending: step`,
21 permanent; no other file changed.
session: ses_ed08408e4ffeAXuuHvFBvFXsOO

### Step 2 — merged
Branch code/58a-2-prayer-constants, commit d143582c (merge d5029c63), version 2.0.88.
Gate red before conversion: remainder test failed naming exactly 6 lines
(`shared/constants.ts:994`, `:996`, `components/prayer/Prayer.tsx:109`,
`components/prayer/Alert.tsx:208`, `:209`, `components/prayer/Time.tsx:71`).
Converted the four files per the map (constants fields `left/right` -> `start/end`
plus their two doc comments, Prayer width arithmetic and padding style, Alert
paddingEnd/paddingStart, Time marginStart); allowlist now 53 entries (32 pending).
Suites: gate `Tests: 2 passed, 2 total`; `components/prayer` components project
`7 passed, 7 total` / `59 passed, 59 total`; unit project `4 passed, 4 total` /
`30 passed, 30 total`; CLI `DIRECTIONAL STYLES OK`; tsc 0; Biome 0; the
`padding.left|padding.right` reader grep printed nothing. tsc 0, Biome 0.
Break 2: `ALL ASPECTED: 1`. Review: diff touches only the named lines, the two doc
comments, the allowlist, the version trio and plan files; no value changed; allowlist
53 entries, none `pending: step 2`.
session: ses_ed08408e4ffeAXuuHvFBvFXsOO

### Step 3 — stopped, owner ruled, plan repaired (2026-10-12)

First attempt returned STOP: converting `OverlayInfoBox.tsx:68-69` (Class A, its own
comment "never a window measurement") failed 3 of 36 tests in
`components/overlay/__tests__/overlayPlacement.test.ts`, because `:153` (toMatchObject
`left: 0`) and `:205` (`expect(style.left).toBe(0)`) assert the raw physical key of the
inline style the step converts. Rendered LTR unchanged; the plan's census had misfiled
the suite as geometry-only (PLAN 4.4), and R2.1's zero-test-edits rule left no
plan-given path. Step 3 fully reverted by the executor: tree clean, gate green, version
lock released, branches deleted, queue back to `IN PROGRESS, step 2`. Evidence:
`$HOME/athan-gitree/sessions/58a/` (failure log confirms `Expected: 0 / Received:
undefined` at `:205`; 3 failed, 33 passed).

Question put to the owner: amend the plan (assertions follow the site, `left` to
`start`), or keep the pair physical and allowlist. **Ruling: amend the plan (D69).**
Lead repaired PLAN.md (D69 row, R2.1 named exception, 4.4 census correction) and
`steps/3-overlay.md` (test file added to the files list, change contract for the two
assertion keys, green-run and review-checklist lines, expected version 2.0.90) in docs
commit 2.0.89; step 3 re-runs from the amended step file in the same executor session.

session: ses_ed0851d12ffe2V9Hm86D36O7H3 (lead)

### Step 3 — merged
Branch code/58a-3-overlay, commit 7b9cf17a (merge 18fcbc3f), version 2.0.90.
Gate red before conversion: remainder test failed naming exactly 10 lines
(`components/overlay/Overlay.tsx:122`, `:123`, `components/overlay/OverlayInfoBox.tsx:68`,
`:69`, `:94`, `:95`, `components/overlay/VeilBackdrop.tsx:62`, `:63`, `:69`, `:70`;
no `catcherGeometry.ts` line).
Converted the three files per the map (Overlay container pair, InfoBox inline
ternary pair plus placer stylesheet pair, Veil container and gradient pairs);
`Overlay.tsx:111` and `VeilBackdrop.tsx:40` untouched. Two assertion keys in
`overlayPlacement.test.ts` follow the site per D69 (`:153` toMatchObject
`left: 0` -> `start: 0`, `:205` `style.left` -> `style.start`), no other test
line changed; allowlist now 46 entries (25 pending).
Suites: gate `Tests: 2 passed, 2 total`; `components/overlay` components project
`2 passed, 2 total` / `19 passed, 19 total`; unit project `3 passed, 3 total` /
`36 passed, 36 total` (overlayPlacement green with exactly the two D69 edits);
CLI `DIRECTIONAL STYLES OK`; tsc 0, Biome 0.
Break 3: `ALL ASPECTED: 1`. Review: no hunk at `Overlay.tsx:111` or
`VeilBackdrop.tsx:40`; `catcherGeometry.ts` absent; test diff exactly the two
assertion keys; no value changed; allowlist 46 entries, none `pending: step 3`.
session: ses_ed08408e4ffeAXuuHvFBvFXsOO

### Step 4 — merged
Branch code/58a-4-sheet-parts, commit f8641183 (merge 27fbc3f3), version 2.0.91.
Gate red before conversion: remainder test failed naming exactly 6 lines
(`components/sheets/parts/Sheet.tsx:225`, `SoundItem.tsx:149`, `:162`,
`Stepper.tsx:142`, `SegmentedControl.tsx:194`, `:220`). Converted the four
files per the map (Sheet inline margin pair, SoundItem paddingStart/marginEnd,
Stepper marginStart, SegmentedControl indicator `start: 3` and iconLayer
`start: 0`); the `translateX` lines at SegmentedControl.tsx:141 and `:154`
untouched; allowlist now 40 entries (19 pending).
Suites: gate `Tests: 2 passed, 2 total`; `components/sheets/parts` components
project `8 passed, 8 total` / `94 passed, 94 total`; unit project
`1 passed, 1 total` / `22 passed, 22 total`; CLI `DIRECTIONAL STYLES OK`;
tsc 0, Biome 0.
Break 4: `ALL ASPECTED: 1`. Review: `translateX` lines byte-identical to uat;
no value changed; allowlist 40 entries, none `pending: step 4`.
session: ses_ed06f54aeffeLWAF9t0gAMJFou

### Step 5 — merged
Branch code/58a-5-sheet-screens, commit (sha filled with step 6's plan files), version 2.0.92.
Gate red before conversion: remainder test failed naming exactly 10 lines
(`components/sheets/screens/Qibla.tsx:197`, `:199`, `Sound.tsx:233`, `:234`,
`Language.tsx:84`, `:85`, `Settings.tsx:241`, `:250`, `:264`, `:281`).
Converted the four files per the map (Qibla lost-style start/end pair, Sound
indicator pair, Language paddingStart/paddingEnd, Settings two paddingEnd and
two marginStart); allowlist now 32 entries (11 pending).
Suites: gate `Tests: 2 passed, 2 total`; `components/sheets/screens`
components project `5 passed, 5 total` / `239 passed, 239 total`; unit project
`2 passed, 2 total` / `47 passed, 47 total`; CLI `DIRECTIONAL STYLES OK`;
tsc 0, Biome 0.
Break 5: `ALL ASPECTED: 1`. Review: no value changed, key-name hunks only;
allowlist 32 entries, none `pending: step 5`.
session: ses_ed06f54aeffeLWAF9t0gAMJFou

