# LOG.md, ticket 118

## Ticket 118

Variable fonts: one file per family, the investigation. Planning opens 2026-10-16 in
the lane worktree. The dispatch order: no device contact and no builds this wave, no
font file ever committed.

## Planning (2026-10-16)

Read in full: ai/AGENTS.md, the queue rows (118 and the metric-risk ground: 79, 85,
87, 106, 108, 110), TEMPLATE.md, the lead and planner skills, the worker files.
Facts measured at planning time and written into the plan as predicted outputs:

- expo-font at the installed 58.0.7 carries the variable support (Android
  VariableTypefaces, the plugin's object form with app:fontVariationSettings, the iOS
  named-instance aliasing); the runtime instancing gate is API 29, quoted in the plan.
- RN 0.88's ReactFontManager applies numeric weight from API 28 (Typeface.create with
  weight and italic); below that only nearest style.
- The four upstream variable files fetched from google/fonts at 47d54ca1 to
  $TMPDIR/lane118-fonts (never committed). Rubik's variable defaults to wght 300.
- Recon measurement: vertical metrics byte-identical between statics and variables for
  all four families; advances at instanced 400 and 500 identical to the statics; Rubik
  tnum 619/641 equal, Roboto tabular 562/568; the four variable files are larger than
  the eight statics together (1,708,984 against 1,250,804 raw, 905,837 against 579,325
  gzip-9), because the statics are Google's subset builds.
- androidx TypefaceCompat fetched from googlesource and read: setFontVariationSettings
  appears in the Api29Impl only; pre-29 impls parse the axes and forward them through
  hidden platform APIs, which no desk check can prove on the 3T. Recorded as an open
  condition, not a verdict.

Planning decisions D118.1 to D118.6 recorded in PLAN.md section 2.

session: ses_ebab6f35fffedobipiJeJ7Att0
