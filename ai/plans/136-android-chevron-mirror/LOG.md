# LOG - ticket 136

## Ticket 136

## Planning (2026-10-18)

Frontier (all agent-ruled, argued twice, PLAN.md 2.1):

- D136.1 mechanism, measured: `chevronFor()` reads the pure app locale; the
  defect is Android's text stack mirroring the authored neutral glyph under
  the RTL-resolved paragraph (Unicode Bidi_Mirrored=1 for U+2039/U+203A;
  Fabric sets every view's layoutDirection from Yoga at
  `SurfaceMountingManager.kt:811`; iOS sets no paragraph baseDirection, so
  CoreText resolves natural and never mirrors). The row's I18nManager-snapshot
  theory does not apply: no branch in this path reads I18nManager.
- D136.2 fix: `direction: 'ltr'` pinned on the chevron Texts; codepoint choice
  untouched. Alternatives rejected in PLAN.md 2.1.
- D136.3 scope: every chevronFor consumer (Settings, ColorPicker, Help action
  row); Help's step-mark guillemets left as a named residual.
- D136.4 sweep suite `components/__tests__/chevronDirection.test.tsx`, red
  today, counts six and one.
- D136.5 device proof: 2.0.996 repro first, fixed fleettest build after
  merge; screenshot reads (a11y carries the authored codepoint, never the
  mirror).
- D136.6 the AVD is never a witness; D136.7 no `yarn test:tz` (no date path).

Planning mechanism probe (2026-10-18, AVD athan-smoke-28, disposable; shots
under sessions/136/avd-*, never committed):

- Probe branch `probe/136-pin` at `70bf8654` in a scratch worktree: the three
  pin edits (Settings.chevron, ColorPicker.chevron, Help actionChevron joined
  to actionText), committed with the full hook green (Tests: 2 skipped, 5743
  passed, 5745 total; coverage 100% on statements, branches, functions,
  lines). tsc and Biome clean on the probe tree before the commit.
- Baseline install of the owner's 2.0.996 fleettest APK on the AVD: under ar
  every Settings chevron apex points RIGHT (vision reads: 2 of 2 in the top
  card, 3 of 3 scrolled: Qibla partial, colour-picker row, Language row) with
  the layout mirrored (chevrons at the rows' left ends). The defect
  reproduced off the 3T.
- Probe build `probe-136-pin.apk` (build-mock.zsh, package
  com.example.athan, versionName 2.0.1013, badging read before install):
  under ar every chevron apex points LEFT (2 of 2 top, 4 of 4 scrolled
  including What's new and Help), layout mirrored as before; under en the
  chevrons point RIGHT at the rows' right ends, layout LTR.
- Harness notes for the device steps: the AVD's on-screen nav bar covers
  y 1794-1920 (dumpsys mContentFrame Rect(0, 1794 - 1080, 1920)), hiding the
  bottom row; `settings put global policy_control
  immersive.full=com.example.athan.fleettest,com.example.athan` freed it for
  the drive. The 3T has capacitive keys and no such bar, so the atlas point
  stands there. The Settings sheet needs one scroll before the Language row
  is visible on this panel class; the committed language-switch flow taps
  Language without scrolling, so the step-1 flow carries the scroll.
- Probe scratch worktree, branch and APK removed; the AVD killed. Evidence
  shots kept under sessions/136/ until DONE.

Anchor counts verified 1 of 1 each at cd171855 (eleven anchors).

Planned at cd171855 (2.0.1013); lane branch fast-forwarded to 65a88291
(2.0.1016, the owner's orders commit) before the planning commit; next free
version 2.0.1017.
