# Session 41: the qibla on an offline map, so the user aligns it by eye

Research brief. Written 2026-09-29, at the owner's instruction, after session 40 shipped a fused-sensor
compass that still read 30 degrees wrong in the owner's own bedroom.

## 1. Why this row exists

Sessions 37 and 40 both shipped. Both were correct. The feature is still not trustworthy.

| Session | What it fixed | What it left |
| --- | --- | --- |
| 37 | The bearing maths, 13 invariants, a 60fps dial, the permission flow | The needle came from `expo-location`, which reads the raw magnetometer with no gyroscope |
| 40 | The heading source: OS-fused rotation vector, true-north frame on iOS, declination on Android, a field-strength trust check | The room itself. Two metres of walking swung the needle 30 degrees while the qibla moved 0.09 arcseconds |

**The owner's ruling, which is the premise of this row and is not up for re-litigation:**

🐋  "I really don't want to provide wrong data, and I do not want people to pray in the wrong direction. I
would rather not offer this feature at all."

**The argument for a map, in one sentence:** a dial gives the user nothing to check the needle against, so
every degree of sensor error reaches them undetected, while a map gives them streets, buildings and the shape
of their own road, and the human does the alignment.

That is already how the owner finds the qibla in practice: open Google Maps, see the street, reason about
which way the line points. The feature is to bring that on-device and offline.

## 2. The constraint that shapes everything

🐋  "this app is completely local, offline, no Wi-Fi connection. It can work without internet connection...
It's a completely on the phone app."

Restated as hard rules:

- **No API key.** Not Mapbox, not Google, not MapTiler, not Stadia, not Thunderforest.
- **No tile server**, ours or anyone's, at runtime.
- **No network** for the feature to work.

### Bundle size is DEFERRED, on the owner's ruling of 2026-09-29

🐋  "I think you should stop worrying about the size, actually. Don't worry about the size for now. Okay?
Let's just try to get something working. So don't worry about the app size. I know I mention it, but just
don't worry about it for now. This is too early to think about."

So size is **recorded, never used as a filter**. Every proposal still states its megabyte cost, because the
number is needed later and is cheap to measure now, but no option is rejected for weighing too much and no
design is compromised to save bytes. Getting something that WORKS is the only bar in this session.

The baseline, for the record: the Android release APK measures **67 MB** (`session37/qibla-dial.apk`), of
which 26 MB is `lib/arm64-v8a` at a single ABI, 9.4 MB `classes.dex`, 4.9 MB the JS bundle and about 15 MB
the athan and reminder audio. `assets/marketing` is 30 MB in the repo and is not shipped.

## 3. What is already settled and must not be re-opened

| Settled | Where |
| --- | --- |
| The bearing maths, great circle not rhumb line, 13 invariants, `adhan@4.4.6` | `ai/plans/37-qibla-compass/RESEARCH.md`, `shared/qibla.ts` |
| Location permission stays: only a position says which way Makkah lies | `ai/AGENTS.md`, 2026-09-29 |
| Coarse accuracy is ample: 0.5 degrees of bearing error per 10 km of position error | 37's research |
| The dial's 60fps architecture: one recorded layer, rotated by a Reanimated transform | `components/qibla/Dial.tsx` |
| RTL is pinned LTR app-wide; layout direction is a launch-time constant under Fabric | row 39 research |
| The fused sensor and `isFieldTrustworthy` stand and are not deleted | session 40 |

## 4. What the research must answer

Numbered so reports can cite them. Every answer carries its source and, where it is a size or a
measurement, the number.

1. **Does an offline basemap fit this app at all?** PMTiles, Protomaps, and whatever else exists. Planet vs
   region vs "only what the user needs". Megabytes at each zoom range, measured or published, never guessed.
2. **Is there a renderer that works here?** `@maplibre/maplibre-react-native` on React Native 0.88.0-rc.2
   with the New Architecture and Expo SDK 58 preview, Fabric, no config plugin surprises. The native binary's
   own size per ABI. Alternatives if it does not fit.
3. **Is a map even the right picture?** The user's job is to align a drawn line to something they can see.
   Streets, building footprints, satellite imagery, a bare compass rose over a photograph, or something else
   entirely. What is the MINIMUM visual that lets a human check the direction.
4. **What do the sensor-free methods give?** The sun's azimuth at a known time and place is computable to
   arcseconds with no magnetometer and no network. Shadow methods, the Qibla-by-sun-time method, the
   Istiqbal/solar-transit method. What they cost, what they need from the user, how accurate they are, and
   whether one of them is the real answer rather than the map.
5. **How do shipping apps actually do it, and what do users report?** Teardowns, store reviews, forum
   threads. Which presentations users say work and which they say are wrong.
6. **What does it cost to deliver?** Android App Bundle asset packs, iOS On-Demand Resources, bundling in
   the APK, or a one-time download. The owner's offline rule constrains this and the answer must respect it.
7. **What has already been tried and failed, here and elsewhere?** This is the repeat-history question. The
   owner's words: 🐋  "compare it with what we have already tried so many, many, many times already. We
   actually tried to do this, but we had so many trials and errors."

## 5. Rules for every report

- **Cite the source.** A URL, a file and line, a package version, a published figure. A claim with no source
  is marked `UNVERIFIED` in the report.
- **Never guess a number.** If a size or an accuracy is not measured or published, say so.
- **Compare against what this repo already has.** 66 MB APK, `react-native-svg@15.15.5`,
  `react-native-reanimated@4.7.0`, `adhan@4.4.6`, no Skia, no WebView library, `@expo/dom-webview@~58.0.1`
  present.
- **Attack your own conclusion** before submitting it, and record what survived.
- Writing style follows `ai/AGENTS.md` section 8: no em dashes, no arrows in prose, no exclamation marks, no
  emoji, no filler.
