# Step 5: The device proof on the iPhone XS

0. **Anchor check.** None.

1. **Goal.** Prove on the owner's own phone, in a room with the curtains shut, that the tap arrives when he
   faces Makkah. **This is the only step that can judge the feature**, because the three previous qibla
   sessions all shipped at 100% coverage and all three were unusable.

2. **Branch.** `git checkout -b docs/43-device-proof uat-2`

3. **Files.** `ai/plans/43-qibla-haptic/LOG.md`, `ai/plans/README.md`, `ai/features/uat-2/AUDIT-FINDINGS.md`.
   No app code. **A defect found here is a new step, never an edit in this one.**

4. **Tests first (red).** None: this step measures.

5. **The build and the proof.**

Bump the version FIRST, then prebuild, then build. That order is the repo's rule and breaking it once shipped
1.22.10 code stamped 1.22.9.

```bash
cd /Users/muji/repos/rn.athan.uk
npx expo prebuild -p ios --no-install
grep -A1 CFBundleShortVersionString ios/Athan/Info.plist
```

The plist must show the version in `app.json`. Then, in the background with a log:

```bash
npx expo run:ios --configuration Release --device 00008020-0015585C22D2002E
```

**The checks.** The owner performs every turn, because local tooling drives no taps on a physical iPhone.

| # | What | How | Expected |
| --- | --- | --- | --- |
| 1 | The sheet opens without a freeze | Ask the owner whether the map appeared at once | No freeze. Over about a second means the tile work is blocking: record it and STOP |
| 2 | A screenshot of the sheet | `pymobiledevice3 developer dvt screenshot ~/athan-device-sweep/session43/qibla-world.png --udid 00008020-0015585C22D2002E` | The file exists |
| 3 | The drawing is right | Read the screenshot, part 6 | Answers below |
| 4 | **The tap arrives facing Makkah** | Ask the owner to stand in a room with the curtains shut, hold the phone flat, and turn slowly through a full circle | Exactly one tap per revolution |
| 5 | **It taps coming back** | Ask the owner to turn past the line, then back | A tap each way |
| 6 | **It does not buzz** | Ask the owner to hold still on the line for ten seconds | No further taps |
| 7 | **It is silent facing away** | Ask the owner to face directly away from Makkah and hold still | No tap |
| 8 | Does it feel immediate | Ask the owner whether the tap landed as he crossed or noticeably after | No perceptible lag |
| 9 | How far off is it | Ask the owner to compare where it taps against where he believes the qibla is | Record the answer as a number of degrees, whatever it is |

Save everything under `~/athan-device-sweep/session43/`.

**Check 9 is the honest one and it may well fail.** The magnetometer measured 30 degrees wrong in this room.
Record what the owner reports without arguing with it, and do not adjust any constant to make it agree:
session 40 tuned seven values by eye and never converged.

6. **Reading the screenshot.** Read it yourself if your model can see images. If it cannot, call the `vision`
   subagent with the path and this exact question, and nothing else:

> This is a screenshot of a phone app showing a world map. Answer only what you can see.
> 1. Is there a line or path drawn between two marked points? Is it straight, or does it curve?
> 2. How many text labels are on the map, and what does each say exactly?
> 3. Is there an arrow or pointer shape? Which direction does it point, in degrees clockwise from straight up?
> 4. Are there two distinct marker dots or shapes at the ends of the path?
> 5. Does any shape look broken, doubled, or drawn across the whole image in a way that does not fit?

**The acceptance:** the path CURVES, there are exactly two labels, both markers are present, and question 5
finds nothing. **A straight path is the rhumb-line defect and it is a STOP.**

**Never send the screenshot to the owner.** Describe what it showed.

7. **Breaks.** None: this step changes no code.

8. **Records.**

Append to `ai/features/uat-2/AUDIT-FINDINGS.md` under the exact heading
`## Session 43: the qibla felt, not read`:

```
The Qibla screen is a north-locked world map with the user, the Kaaba, the great-circle path
between them, and an arrow for where the phone points. The user turns until the phone taps their
hand once.

Why: the screen this replaced stated "turn 49 degrees to the left", and the owner rejected it on
sight because no person can estimate an angle by eye. It also needed a street the user could see,
which is useless in a windowless room. Three qibla screens have now shipped at 100% coverage and
been unusable, and the common cause is that every acceptance criterion measured whether the number
was correct rather than whether a person could act on it.

The path is a great-circle curve. A straight line on a north-locked map is the rhumb line, which
departs 14.583 degrees from the true qibla in London and 71.31 in Los Angeles.

The haptic uses hysteresis, 4 degrees in and 8 out, because a single threshold measured 49 taps in
100 samples of 0.3-degree jitter. A crossing is bounded to 90 degrees from the line, because the
signed offset also changes sign at the antipode.

The bearing and the Kaaba's coordinates are ours, not adhan's. Five independent sources agree to
0.34 arcseconds.

Suite after: <SUITES_AFTER> suites, <TESTS_AFTER> tests, 100% on all four measures.

ON DEVICE: <what the owner reported for checks 4 to 9, in his words, including the error in
degrees from check 9>.

Not proven on Android: no Android phone was connected.
```

Set `ai/plans/README.md` row 43 to EXECUTED. The `ai/prompts/README.md` row is the auditor's.

Docs commit message:

```
<VERSION> - docs(plans): session 43 executed: the qibla is felt, and the device proof is in
```

9. **Push.** None. The audit session pushes.

10. **Stopping part-way.** Nothing to restore: this step writes only records.
