# Row 57 LOG

## 2026-11-18

- MCP enables landed in opencode.json (mobile-mcp, maestro, agent-device,
  xcodebuildmcp, codegraph; codegraph un-nested from a dead `servers`
  wrapper). All five came live in-session.
- Board maintenance (owner order): BOARD-ATHAN.md + AGENTS.md rewritten to
  the ~/.multica/config.json truth (server URL, token location, the athan
  workspace id, the default-workspace trap); protocolLines guard re-pinned.
  ATHA-501 created (first attempt landed as PT-198 on the wrong workspace:
  cancelled, recreated under --workspace-id). ATHA-5: upstream merge of
  expo/expo#51291 recorded. ATHA-8: both upstream PRs dead (#51292 closed
  for #51840; #51840 closed unmerged) - moved to awaiting_owner. ATHA-10:
  moved blocked -> awaiting_owner (waits on the owner's own Play Console
  hands). waiting_on metadata set on ATHA-5/6/7/8/9/10. The 'prayer-times'
  label verified as pre-split research history, left in place.
- Commit 82500b029 (2.53.24): the board/MCP chore, validate green 262
  suites. A typographySweep timeout under the full-suite load was judged a
  flake (passes solo in 19s).
- Red phase: mocks + widgetContract + widgetLockRenderer +
  widgetStaticStrings + widgetSettingsSync extended to five layouts / ten
  kinds / eighteen pushes. Confirmed red ('PrayerLockWidget5 is not a
  function', count 4 vs 5).
- Implementation: AthanLockWidgetStacked restored as Layout 5 from the
  current CountdownPair block (current STATIC table, current conventions:
  bold name 16pt, muted time beside it, muted countdown beneath, floors
  0.88). BG 'rgba(0, 0, 0, 0.4)' on all 15 rect faces across five layouts;
  inline faces stay transparent. Both schedules push the fifth kind.
- Gallery copy: 68 locales reuse the retired kind's own translations
  (digit 4 -> 5 in the names, descriptions verbatim; Persian and Bengali
  digit systems handled by codepoint). Six post-retirement locales (bcl,
  hil, mfa, mrw, ti, war) composed from their own attested words (Layout 1
  countdown noun + Layout 2 time phrase + each locale's 'with').
  app.json Localizable + android resource keys, native-strings gallery,
  byte-parity verified. cjkSubset green: no ko recut needed.
- nativeLocalesConfig pins moved: iosOnly 8 -> 10, defaults 18 -> 22 and
  34 -> 38, translated keys 34 -> 38.
- README widget line updated (five layouts, translucent backing).
- Mutation pass: layout-5 floor drift caught by the renderer pin; push
  removal caught by the sync suite; locale-row corruption caught by the
  config suite. (One mishap: a git-checkout revert wiped the uncommitted
  widget file mid-pass; both implementation scripts re-ran byte-identical
  and the suites re-verified green.)
- Version 2.53.25 (owner order: patch despite the feat type, no What's New
  item - the modal must not trigger).
- Owner orders later in the session: Android build dropped entirely
  ("nothing changed there") - the mock APK build was killed mid-Gradle and
  stays unbuilt, superseding the both-platform standing order for this
  release. Lock-screen evidence is the OWNER's: no phone navigation, no
  screenshots, no customize-sheet drive after install; the agent's device
  work ends at uninstall + install (+ one launch so the timelines push and
  the widgets have data when the owner places them). The BG value
  rgba(0,0,0,0.4) therefore ships as the first device-tested-by-owner
  candidate; the owner's verdict decides any adjustment.
- What's New triple-check (owner question): shouldShowWhatsNew gates on item
  stamps only; the archive's newest stamped item is 2.50.0, this release
  adds none, so no stored-version state at or above 2.50.0 can open the
  modal - verified by running the real function over stored 2.50.0 /
  2.53.23 / 2.54.0 (all false) plus a below-2.50.0 catch-up row (true, by
  design).
