# Conflicts (compressed)

Three real conflicts between the five reports, each resolved by `ASSUMPTIONS.md`: B2/B5 (library
and key style) and B10 (per-locale width) carry the resolutions. Written 2026-09-29 at 123 lines;
**compressed 2026-10-07** to the grounds other documents do not carry. Recover the full original
from git history (C4).

- **In-app picker vs OS-only (R5's no-picker position): resolved for the picker.** R5's premise
  fails on the floor device (per-app languages are Android 13+/iOS 13+. The 3T is Android 9), an
  endonym-labelled list is readable without English, and D7 plus the deterministic-identifier
  re-arm already pay the costs R5 feared.
- **Grow-only width vs per-locale (R5 vs R3/WIDTH-EVIDENCE): resolved per-locale.** A user who
  ever renders Swahili keeps a 226pt column forever (360dp phone = 71% empty space); Arabic 0.85x
  and Chinese 0.60x make one global max a permanent, unrecoverable layout defect triggered by
  trying a language once. Reflow and `clearAllExcept` whitelist traps handled by the plan.
- **Natural-language vs structured keys: resolved structured**, on R5's three grounds, decisively
  the existing `Off`/`Silent`/`Sound` collision in `Alert.tsx` that a natural-language key cannot
  express.
