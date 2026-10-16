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

### Step 1 — DONE

Branch docs/118-statics (the lane worktree, lane/118 rebased on uat after the READY
merge). Preflight copy in $TMPDIR printed `PREFLIGHT OK` at 2.0.859.

Fetch: the four variable files sat in $TMPDIR/lane118-fonts from planning, recorded in
SOURCE.txt at google/fonts 47d54ca1ebb14fd864695f1d39dc734f39017c33. shasum:
13e6eba1... NotoSansDevanagari-VF, c186e7fc... NotoSansThai-VF, 764a6afe... Roboto-VF,
3b7d0fe7... Rubik-VF. No 404, no family missing a variable file. No font file committed.

Statics baseline (scripts/measure-fonts.py file, eight blocks, full text in
$TMPDIR/lane118-fonts/statics.txt):

- Rubik-Regular: weight 400, upm 1000, glyphs 1075, cps 885, hhea 935/-250/0, win
  1066/466, typo 935/-250/0, embox win 1532 hhea 1185 per 1000em, bytes 174992,
  advances 0:635 1:428 5:594 7:513 h:609 m:889 s:510 ::256 :245 .:252.
- Rubik-Medium: 500, same box trio, bytes 175596, advances 0:657 1:463 5:620 7:543
  h:629 m:902 s:532 ::274 :229 .:268.
- Roboto-Regular: 400, upm 2048, glyphs 1294, cps 896, hhea 1900/-500/0, win 1946/512,
  typo 1536/-512/102, embox win 1200 hhea 1172, bytes 168260, advances 0:562 (all four
  digits) h:551 m:876 s:516 ::242 :248 .:263.
- Roboto-Medium: 500, same boxes, bytes 168644, advances 0:568 h:555 m:870 s:516
  ::265 :249 .:279.
- NotoSansDevanagari-Regular/Medium: 400/500, upm 1000, glyphs 845, cps 281, hhea
  896/-408/0, win 1348/558, embox win 1906 hhea 1304, bytes 243520/243716, digits all
  551/556, no Latin letters in the subset, space 260, period 268/274.
- NotoSansThai-Regular/Medium: 400/500, glyphs 140, cps 101, hhea 1061/-450/0, win
  1061/450, embox 1511 both, bytes 37780/38296, no digits, no Latin letters, space 260.

Every static block matches the plan's predicted numbers (the Rubik-Regular block
verbatim). The pinned metrics from rows 79/87/106/108/110 re-measured identical:
Rubik hhea box 1.185em and win ink 1.532em, Hindi 1.304em box with win descent 558,
Thai 1.511em own box, Roboto tabular digits 562/568, Rubik proportional defaults.

Candidates (scripts/measure-fonts.py file, four blocks, $TMPDIR/lane118-fonts/vfs.txt):

- Roboto[wdth,wght].ttf 488584 bytes, wght 100/400/900, wdth 75/100/100, default
  instance Roboto Regular 400, boxes identical to the statics.
- Rubik[wght].ttf 359804 bytes, wght 300/300/900, DEFAULT INSTANCE RUBIK LIGHT 300,
  boxes identical to the statics.
- NotoSansDevanagari[wdth,wght].ttf 641944 bytes, wght 100/400/900, wdth 62/100/100,
  boxes identical, glyphs 1117 cps 551 (full coverage against the statics' 845/281).
- NotoSansThai[wdth,wght].ttf 218652 bytes, same axes, boxes identical, glyphs 467
  cps 426 (against 140/101).

Break: measure-fonts.py file on a garbage file exited 1. ALL AS EXPECTED.

session: ses_ebab6f35fffedobipiJeJ7Att0
