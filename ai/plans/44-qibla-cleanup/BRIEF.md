# Brief: Session 44. Delete the qibla, all of it

This session ships NO feature. It removes four sessions of qibla work from `uat-2` and leaves the tree as if none of
it had happened, except for the Settings row and the records.

**Do not design the replacement here.** Session 45 does that, from a clean tree. A cleanup that starts inventing the
next thing stops being a cleanup.

## Why this row exists

The owner tested 1.29.162 on his iPhone XS, reading `trueHeading` from Core Location, which is the value Apple Maps
itself points with. His verdict, and it is the most valuable measurement this programme has taken:

🐋  "Major breakthrough. Turns out, I was wrong. Google Maps and Apple Maps are the source of truth, and they are also
very, very jittery. If I walk 1 metre from one bedroom to another bedroom to the living room to the balcony, everything
is very different. So we have been doing testing all wrong."

**Read that carefully, because it inverts the entire premise of sessions 37, 40, 41 and 43.** Every one of those
sessions treated compass disagreement as OUR defect and went looking for OUR mistake. Session 37 blamed its dial,
session 40 blamed `expo-location`'s sensor fusion, session 41 blamed the sensor so completely that it deleted the
compass, session 43 blamed an axis constant. **The correct reading is that the platform's own maps are equally
jittery indoors, so there was never an app-level defect to find.** Four sessions were spent chasing a property of
magnetism in a building.

**The arithmetic settles which half moved.** Measured this session from the owner's own address: walking

| Distance moved | Qibla changes by |
| --- | --- |
| 1 m | 0.000008 to 0.000016 degrees |
| 10 m | 0.000084 to 0.000159 degrees |
| 100 m | 0.000841 to 0.001591 degrees |
| 10 km | 0.084 to 0.159 degrees |

So room-to-room movement moves the true qibla by **under a ten-thousandth of a degree**. Every degree the owner saw
change was the COMPASS. The geometry was never in question and still is not.

## What the owner ruled

🐋  "What I need you to do is create a follow-up session... where we will completely, completely wipe, clean up
anything we've done regarding a compass, regarding maps, regarding absolutely everything... The first one has to be a
cleanup, a complete deep cleanup."

🐋  "I feel like we've introduced so much junk with this that needs to be cleaned up."

🐋  "You can forget about the previous research that we've done because I think we've come to the conclusion that all
the previous research is incorrect... because we were doing very specific things, which I think we should just throw
out completely."

**So the research is not carried forward and not cited as authority by session 45.** The measured NUMBERS remain true
and are preserved in `FACTS.md` (see below), because a measurement does not stop being a measurement; what is thrown
out is every conclusion built on the assumption that the platform is a reliable reference indoors.

## What is on `uat-2` right now, and what is not

**Merged and pushed** (so it must be removed by a commit, never by discarding a branch):

| Commit | Version | What it did |
| --- | --- | --- |
| `edad8439` | 1.29.158 | Our own `bearingTo`, `KAABA` re-sourced, the `adhan` import deleted from `shared/qibla.ts` |
| `67737213` | merge | Step 1 into `uat-2` |

Earlier qibla work merged in sessions 37, 40 and 41 is also on `uat-2` and is in scope.

**NOT merged, and it dies with its branch.** Branch `feat/43-the-screen` holds steps 2 to 4 of session 43,
uncommitted: `shared/greatCircle.ts`, `shared/qiblaAlignment.ts`, `hooks/useQiblaWorld.ts`,
`components/qibla/WorldMap.tsx`, `components/qibla/FacingArrow.tsx`, the rewritten
`components/sheets/screens/Qibla.tsx`, `tilesForWorld` in `device/tiles.ts`, and their suites. **A patch of the whole
working tree is saved at `~/athan-device-sweep/session43/step2-4-unfinished.patch` (1,432 lines) with its status
file beside it.** Nothing in it needs to survive; it is kept only so session 45 can read what was tried.

## The inventory to delete

Every item below is on `uat-2` and must go. Verify each with `codegraph_explore` before deleting, because four
sessions of merges have left cross-references the file list alone does not show.

**Screens and components**
- `components/sheets/screens/Qibla.tsx` and its suite
- `components/qibla/` entirely, including `__tests__/`

**Hooks**
- `hooks/useQiblaMap.ts` and its suite (deleted on the unmerged branch, still on `uat-2`)

**Shared**
- `shared/qibla.ts`: `KAABA`, `bearingTo`, `qiblaBearing`, `normaliseHeading`, `shortestDelta`, `Position`
- `shared/qiblaStreet.ts`, `shared/qiblaSentence.ts` and their suites
- `shared/tileGeometry.ts`, `shared/vectorTile.ts`, `shared/tileCache.ts`, `shared/pmtiles.ts` and their suites
- `shared/__tests__/realTile.test.ts` and `shared/__tests__/fixtures/London.mvt.gz`, `Makkah.mvt.gz`

**Device**
- `device/qibla.ts` entirely: `hasLocationPermission`, `requestLocationPermission`, `openLocationSettings`,
  `readPosition`, `watchHeading`
- `device/tiles.ts` entirely, and its suite

**Stores and UI**
- `qiblaSheetModalAtom` and `setQiblaSheetModal` in `stores/ui.ts`
- The Qibla row in `components/sheets/screens/Settings.tsx`, its permission flow, its `Alert` copy and its tests in
  `components/sheets/screens/__tests__/Settings.test.tsx`

**Dependencies** (the owner decides, see the decision list)
- `fflate`, added by session 41 for PMTiles gzip and used by nothing else afterwards
- `adhan` is **NOT** in this list and must stay: it computes the prayer times, which is the app's whole purpose.
  Session 43 removed only the `Qibla` import from `shared/qibla.ts`

**Configuration**
- `NSLocationWhenInUseUsageDescription` in `app.json`, whose text names the compass

**Records**
- `ai/features/uat-2/AUDIT-FINDINGS.md`: the qibla sections of sessions 37, 40, 41 and 43

## The two things that are KEPT

1. **The Settings row stays as a concept.** 🐋  "When I press the settings icon, I like having Qibla there, the Qibla
   option. Good, so we can keep that the Qibla option." Session 45 rebuilds the row and the sheet. **Whether this
   session deletes the row and 45 re-adds it, or this session leaves a row that opens an empty sheet, is an owner
   decision** (see below). Deleting it is cleaner; leaving it means `uat-2` ships a dead button between sessions.

2. **`ai/plans/43-qibla-haptic/LOG.md` and every earlier plan folder stay untouched.** They are the record of what was
   learned, including the four wrong diagnoses, and deleting them would repeat the history. Only their STATUS rows in
   `ai/plans/README.md` change, to note that the code was removed by session 44.

## What this session must produce besides the deletions

**`ai/plans/44-qibla-cleanup/FACTS.md`**, one page, holding ONLY measurements that survive the owner's ruling, each
with how it was obtained. This is what session 45 is allowed to build on. Nothing else from sessions 37 to 43 carries
forward. At minimum it holds:

- The qibla-versus-distance table above, and the fact that the great-circle bearing and the
  **straight-line-through-the-earth** azimuth are **identical to six decimal places at seven cities** (London, New
  York, Los Angeles, Jakarta, Sydney, Cairo, Toronto), which answers the owner's own question about a man in space:
  cutting through the earth and following the surface give the same compass direction, so there is nothing to choose
  between them.
- The rhumb-line error table, because it decides how session 45 may draw a line on a flat map: London 14.86 degrees,
  New York 42.80, Toronto 48.03, **Los Angeles 71.32**, Sydney 20.00, Cairo 1.99, Jakarta 2.36.
- `adhan@4.4.6` exports `Qibla(coordinates)`, which is the same great-circle bearing; measured against our own
  implementation it agreed to about nine millionths of a degree.
- `expo-location`'s `watchHeadingAsync` gives `trueHeading` (the platform's own fused, declination-corrected heading)
  and **buckets the accuracy**: `LocationUtils.swift:9` maps Apple's raw degrees to 0, 1, 2 or 3 at the 50, 35 and 20
  degree boundaries, so **the degrees Apple reports are discarded before JavaScript sees them.**
- **Apple Maps draws a CONE, not a needle**, and its width is that heading accuracy. Apple's own documentation on
  `CLHeading.headingAccuracy` says a negative value means the heading is invalid, "which can occur when the device is
  uncalibrated or there is strong interference from local magnetic fields". So the platform's answer to indoor
  jitter is to DISPLAY the uncertainty rather than hide it.
- The current iOS permission is `NSLocationWhenInUseUsageDescription` alone. No motion permission is used today.

**Write nothing in `FACTS.md` that was not measured or read from source this session or verifiably before it.** No
conclusions, no recommendations: session 45 draws those.

## Owner decisions this session needs

Ask all of them at once, early, with the `question` tool.

1. **Does the Settings row survive the gap?** Delete it and let 45 re-add it, or keep it opening an empty sheet.
2. **Does `fflate` get uninstalled?** It is 91 KB with no transitive dependencies and nothing else uses it. Removing
   it means a `yarn remove`, which `ai/AGENTS.md` puts behind the nested-copy trap and requires running
   `shared/__tests__/widgetRuntimeLoads.test.ts` afterwards.
3. **Does the location permission string come out of `app.json`?** Removing it is correct while no feature reads
   location, and it means an iOS prebuild and another store-metadata change when 45 puts it back.
4. **Do the tile fixtures go?** `London.mvt.gz` and `Makkah.mvt.gz` are about 200 KB of committed test data that only
   the deleted suites read.

## How this session is judged

- `grep -rni 'qibla\|kaaba\|pmtiles\|mvt\|tilecache\|greatcircle' app/ components/ device/ hooks/ shared/ stores/ widgets/ api/`
  returns **nothing**, tests included.
- `python3 scripts/find-unused-exports.py` reports only the five pre-existing allow-listed entries.
- `yarn validate` passes with 100% on all four measures, and the suite count drops by the qibla suites.
- The app builds and launches, and Settings behaves as decision 1 says.
- No plan folder or `LOG.md` was deleted.

## The lesson this row exists to record

**An acceptance criterion that measures OUR output against a reference we never validated is not a test.** Four
sessions compared this app's needle against Google Maps and Apple Maps and treated every disagreement as our bug. One
afternoon of the owner walking between his own rooms with those same apps open showed the reference moves as much as
we do. **The cheapest experiment in the whole programme was never run: check whether the thing you are measuring
against holds still.**
