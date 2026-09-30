# Step 6: The device proof on the iPhone XS

0. **Anchor check.** None.

1. **Goal.** Prove on real hardware that the drawn map matches the real street layout and that the sentence
   names a street that is actually there. This step exists because **the suite was green at 100% while
   session 37's dial shipped every label upside down**: tests assert on props, and a map is the largest
   visual surface this app has ever drawn.

2. **Branch.** `git checkout -b docs/41-device-proof uat-2`

3. **Files.** `ai/plans/41-qibla-map/LOG.md`, `ai/plans/README.md`, `ai/features/uat-2/AUDIT-FINDINGS.md`.
   No app code changes in this step. If the proof finds a defect, that is a new step, not an edit here.

4. **Tests first (red).** None: this step measures rather than changes.

5. **The build and the proof.**

Bump the version FIRST, then prebuild, then build. That order is the repo's rule and violating it once
shipped 1.22.10 code stamped 1.22.9.

```bash
cd /Users/muji/repos/rn.athan.uk
npx expo prebuild -p ios --no-install
grep -A1 CFBundleShortVersionString ios/Athan/Info.plist
```

The plist must show the version in `app.json`. Then:

```bash
npx expo run:ios --configuration Release --device 00008020-0015585C22D2002E
```

Run it in the background with a log, as `EXECUTOR-BRIEF.md` section 3 requires.

**The checks.** The owner performs the taps, because local tooling drives none on a physical iPhone. Ask the
owner to open the app, tap the Masjid icon, and open Qibla. Then:

| # | What | How | Expected |
| --- | --- | --- | --- |
| 1 | The sheet opens without a freeze | Ask the owner whether the map appeared at once or the sheet hung | No freeze. A freeze over about a second means the feature cap is not being applied: record the reading and STOP |
| 2 | A screenshot of the sheet | `pymobiledevice3 developer dvt screenshot ~/athan-device-sweep/session41/qibla-map.png --udid 00008020-0015585C22D2002E` | The file exists |
| 3 | The map matches the ground | Read the screenshot, section 6 | Answers below |
| 4 | The sentence names a real street | Ask the owner: is the street named in the sentence one you can see from where you are standing? | Yes |
| 5 | No sensor is armed | `pymobiledevice3 syslog live -pn Athan` while the sheet is open, grepped for `sensor` | Nothing |

Save everything under `~/athan-device-sweep/session41/`.

6. **Reading the screenshot.** The executor reads it itself if its model can see images. If it cannot, it
calls the `vision` subagent with the path and this exact question, and nothing else:

> This is a screenshot of a phone app showing a small street map. Answer only what you can see.
> 1. How many distinct street lines are drawn?
> 2. Is there a single straight ray drawn from the centre of the map outward? If so, give its direction in
>    degrees clockwise from straight up, measured as accurately as you can.
> 3. Is there a dot or marker at the exact centre?
> 4. Does any street line appear broken, doubled, or drawn across the whole image as a single long straight
>    line that does not fit the street pattern?
> 5. Read any text below the map, exactly as printed.

**The acceptance:** the ray's measured direction agrees with the qibla the sentence implies within 5 degrees,
there is a centre marker, and question 4 finds nothing. A long straight line that does not fit the pattern is
the rhumb-line defect and it is a STOP.

**Never send the screenshot to the owner.** Describe what it showed.

7. **Breaks.** None: this step changes no code.

8. **Records.**

Append to `ai/features/uat-2/AUDIT-FINDINGS.md` under the exact heading `## Session 41: the qibla against a street`:

```
The qibla screen no longer reads a magnetometer. It draws the streets around the user from
map tiles and states the qibla as a turn from the nearest street they could sight along.

Why: the shipped dial measured 30 degrees wrong indoors, and the owner ruled it out entirely
rather than ship a wrong direction. Sessions 37 and 40 both shipped correct code whose
bearing was exact and whose heading was not.

The street bearing is self-correcting under position error. Measured over 300 samples per
cell, a 100 m error names a different street four times out of five in Manhattan and still
delivers 0.000 degrees, because the turn is recomputed for whichever street is named. Makkah
is the exception at 2.985 degrees mean, from the near-Makkah geometry rather than the rule.

Coverage: 20 of 24 sampled places worldwide have a usable named street within 122 m. The four
that do not are rural and get an honest empty state.

Suite after: <SUITES_AFTER> suites, <TESTS_AFTER> tests, 100% on all four measures.

Not proven on Android: no Android phone was connected during this session, so the tile fetch,
the decode cost on the SD820 and the drawn map are unproven there. This carries forward
alongside row 40's own outstanding Android heading proof.
```

Set the `ai/plans/README.md` row 41 status to EXECUTED. The `ai/prompts/README.md` row is the auditor's, and
its new cell text is:

```
DONE 2026-09-30. The qibla is stated against a street the user can see, and the compass is deleted.
```

Docs commit message:

```
<VERSION> - docs(plans): session 41 executed: the map ships and the device proof is in
```

9. **Push.** None. The audit session pushes.

10. **Stopping part-way.** Nothing to restore: this step writes only records.
