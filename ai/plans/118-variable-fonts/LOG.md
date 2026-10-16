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

### Step 2 — DONE

Branch docs/118-instances. Eight instanced blocks produced by
`measure-fonts.py instance` (full text in $TMPDIR/lane118-fonts/instances.txt); the
instancer renames the instances (Rubik-VF-wght500 reports fullName Rubik Medium weight
500).

Comparison against the statics, per family and weight (R2.2):

- Line boxes: delta 0 everywhere. Every instanced file at 400 and 500 carries the same
  hhea trio, usWin pair and typo trio as its family's statics: Rubik 935/-250/0 and
  1066/466, Roboto 1900/-500/0 and 1946/512, Devanagari 896/-408/0 and 1348/558, Thai
  1061/-450/0 and 1061/450. No pin from rows 79, 87, 106, 108 or 110 reopens.
- Advances: Rubik delta 0 on every pinned glyph at both weights (VF@400 equals
  Rubik-Regular digit for digit, VF@500 equals Rubik-Medium digit for digit). Devanagari
  delta 0 on every glyph the statics carry (digits, colon, space, period; the statics
  carry no Latin letters). Thai: the statics carry no digits or letters, so only the
  space compares, delta 0; the VF's own digits are newly present and tabular (572 each
  at both weights).
- Roboto: five Latin glyphs differ by 1 unit per 1000em. At 400: m +1 (877 vs 876),
  period +1 (264 vs 263). At 500: h +1 (556 vs 555), m +1 (871 vs 870), s -1 (515 vs
  516), colon -1 (264 vs 265), period -1 (278 vs 279). Digits and the row-relevant
  glyphs are equal (562/568 tabular).

STOP answered, agent-ruled 2026-10-16: the plan predicted delta 0 for every glyph; the
Roboto five-glyph +|-1 divergence is quoted above. Verdict: instancer rounding, not a
metrics divergence. One unit per 1000em is 2 font units at Roboto's 2048 upm, under
0.03px at the app's largest 26pt size, and it appears only where fontTools' instancer
rounds a gvar delta against the integer advance Google's own statics cutter rounded the
other way. A device never draws the fontTools instance: platforms apply the variation
continuously at render time. The step-2 expectation is amended to "delta 0 on every
pinned glyph except Roboto m, h, s, colon and period at +|-1 unit per 1000em, instancer
rounding". The conclusion this step feeds (metrics identical, nothing reopens) stands.

tnum verdicts (R2.3, full text in tnum.txt):

- Rubik at 400: default NOT equal (0:635 1:428 2:587 3:601 4:621 5:594 6:603 7:513
  8:636 9:593), tnum equal at 619 each. Rubik at 500: default NOT equal, tnum equal at
  641 each. The no-shift rule keeps riding the fontVariant tabular-nums pin, which the
  variable files honor identically to the statics.
- Roboto at 400 and 500: both columns equal (562 at 400, 568 at 500), tabular by
  default, tnum a no-op.

Byte table (R2.2 record, `measure-fonts.py sizes`, gzip -9 as the deflate proxy):

| set | files | raw bytes | gzip9 bytes |
| --- | --- | --- | --- |
| statics today | 8 | 1,250,804 | 579,325 |
| variable candidates | 4 | 1,708,984 | 905,837 |
| growth | | +458,180 (36.8 percent) | +326,512 (56.3 percent) |

Per family raw (statics pair vs one VF): Roboto 336,904 vs 488,584; Rubik 350,588 vs
359,804; Devanagari 487,236 vs 641,944; Thai 76,076 vs 218,652. gzip9: Roboto 176,846
vs 280,238; Rubik 156,382 vs 146,358 (the one saving, 10,024 bytes); Devanagari
207,127 vs 347,745; Thai 38,970 vs 131,496. Cause: the statics are Google's subset
builds (Thai pair 140 glyphs against the VF's 467, Devanagari 845 against 1117).

Break: `measure-fonts.py instance` on a garbage file exits nonzero. ALL AS EXPECTED.

session: ses_ebab6f35fffedobipiJeJ7Att0

### Step 3 — DONE

Branch docs/118-coverage. The four quotes the plan requires, each read from the
installed source in this worktree (R3.1):

1. The expo-font API 29 gate,
   `node_modules/expo-font/android/src/main/java/expo/modules/font/FontLoaderModule.kt`
   lines 58 to 66:

       // Below API 29, `android.graphics.fonts.FontFamily` doesn't exist, so only the default face
       // loads and Android synthesizes bold/italic from it.
       private fun familyTypeface(fontFamilyName: String, faces: List<FontFaceRecord>): Typeface {
         ...
         if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
           val defaultFace = faces[FontFamilyFaces.defaultFaceIndex(faces)]

   The same file gates the single-face variable instancer behind
   `Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q` in `loadSingleFaceTypeface`, and
   `VariableTypefaces.kt` is `@RequiresApi(Build.VERSION_CODES.Q)` throughout.

2. The plugin variation-settings writer, `node_modules/expo-font/plugin/build/withFontsAndroid.js`
   line 308 (inside getXmlSpecs):

       // Instances a variable font at the declared weight and axes, so that one file can
       // back several definitions. Static fonts declare no axes and ignore this.

   written into each XML entry as `app:fontVariationSettings`; and the
   duplicate-destination refusal, same file line 357:

       throw new Error(`Font files ${claimed} and ${asset} both become ${...} in the native project, so only one of them can be embedded. Rename one of them so their file names differ.`)

3. The RN Android weight branch,
   `node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/common/assets/ReactFontManager.kt`
   lines 146 to 151:

       public fun apply(typeface: Typeface?): Typeface =
           if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
             Typeface.create(typeface, nearestStyle)
           } else {
             Typeface.create(typeface, weight, italic)
           }

4. The androidx impl selection, androidx core TypefaceCompat.java lines 73 to 88
   (fetched from googlesource at planning, saved at $TMPDIR/TypefaceCompat*.java):
   API 31+ -> Api31Impl, 29/30 -> Api29Impl, 28 -> Api28Impl, 26/27 -> Api26Impl.
   `setFontVariationSettings` appears only in TypefaceCompatApi29Impl (lines 125 and
   206); Api26Impl and Api28Impl carry zero occurrences. Api26Impl line 210 parses the
   variation settings into `FontVariationAxis` and forwards them into the hidden
   platform `FontFamily#addFontFromBuffer`.

Coverage verdict: expo-font 58.0.7's variable support covers the app's needs on every
fleet device except the one that builds the app. On iOS, the string form embeds the file
through UIAppFonts and RN resolves family plus fontWeight against the member names,
which include a variable font's named instances; on Android 10 to 14 the runtime path
builds one font per 100-step weight from the fvar axis; on Android 15+ the family
varies continuously. On the 3T (Android 9, API 28) the runtime path loads the default
instance only, and Rubik's variable default is Light 300 (step 1's fvar reading), so
the whole Arabic face would render Light and every Medium surface would fall back to
the default weight. The plugin's XML route can pin a weight per family, and androidx
forwards the axes even below API 29 through hidden platform APIs, but no desk check can
prove the 3T's Android 9 runtime applies them; that single leg needs a device proof and
is recorded as the open condition (D118.6). The byte refutation from step 2 makes the
question moot for this round.

session: ses_ebab6f35fffedobipiJeJ7Att0
