# Resume from here

**Paused by the owner on 2026-09-30, with the research complete and nothing planned.** Everything is committed,
merged and pushed to `uat-2` at `1.29.162`. No app code was written, no dependency was installed, and no test was
run, because this was a research programme.

## Where the work stands

| | |
| --- | --- |
| Phase finished | **Research.** Four waves, 12 reports plus a consolidated catalog, about 13,000 lines |
| Phase NOT started | **Planning.** No `PLAN.md` exists and none should be written until the owner answers the decisions below |
| Queue row | **42** in `ai/plans/README.md`, status RESEARCH COMPLETE |
| Branch | `research/global-prayer-times`, merged into `uat-2` and pushed; the branch is kept, not deleted |
| Worktree | `/Users/muji/athan-global-wt`, safe to remove once the branch is no longer needed |
| Scratch, outside git | `/Users/muji/athan-global-scratch/` holds `adhan@4.4.6`, `praytime`, `astronomy-engine` for the measurement harnesses |

## Read these, in this order

1. `FINDINGS.md`, the synthesis. Sections 6b and 6c carry what waves 3 and 4 changed.
2. `SOURCE-CATALOG.md`, the operational document. **It supersedes the individual reports wherever they disagree**,
   because it was written to reconcile them. `data/catalog/sources.json` is its machine-readable form, and
   `node data/catalog/build-catalog.mjs --check` fails if the two drift.
3. `LONDON-LINEAGE.md`, which settles that the app's API and the fifty-year publisher are the SAME timetable, and
   records the one cheap test still outstanding (diff an API month against `LUPT-2027.xlsx` in January 2027).
4. `RECOMMENDATION.md`, the answer: make the SOURCE the central concept, and the twelve-step sequence.
5. `ASSUMPTIONS.md`, every judgement made without the owner, with the likeliest to be wrong flagged.
6. The twelve reports in `agent-reports/`, only as needed. They are kept unedited as the record of how each number
   was reached, which is why several now carry a reading the catalog overturned.

## The seven decisions that block planning

None is a research question. Each changes what gets built. Full detail in `ASSUMPTIONS.md`.

1. **Will the app ask for a location permission, or ship a manual city and zone picker?** The biggest, and wave 4
   created it. Timezone inference is a median 16 displayed minutes wrong, so worldwide needs one or the other. The
   owner has never agreed to a permission and dislikes prompts. Everything else works under either answer.
2. Does "completely offline" permit a yearly fetch? Now narrower: London needs no fetch ever and the location layer
   needs none, so this applies only to non-London authority sources.
3. Are per-prayer user offsets allowed under the never-invent rule?
4. Is a reproduction claim, rather than an accuracy claim, acceptable as the product's promise?
5. Which countries launch, and is Malaysia the right first non-London source?
6. Which Asr does a user see by default? The app shows the Shafi one and `shared/types.ts:25` documents it as
   Hanafi, which is the reverse of the data.
7. Does the app read device elevation? R14 says yes, reversing R1, on the evidence of one authority.

**Settled, do not re-open:** licensing (the owner has permission from the authorities), and what happens to existing
London users (they stay on their own published timetable, now provably permanent and offline).

## The sessions to queue when the owner answers

From `RECOMMENDATION.md`, which has the full reasoning and the acceptance criteria. **S1 to S4 and S6b need no
decision at all and are worth queueing immediately.**

| # | Session | Waits on | Visible to users? |
| --- | --- | --- | --- |
| S1 | Split the prayer identifier from the prayer label. **Shared with row 38's step 38.1, so it is done once, not twice** | nothing | No |
| S2 | Make the source explicit, with exactly one source. Moves the MMKV key to `prayer_${sourceId}_${date}` and pins every existing install to `london-prayer-times`. **Closes the largest silent risk in the codebase** | S1 | No |
| S3 | Make the timezone a property of the source. The two zone-blind offset caches at `shared/time.ts:67-68` are the specific trap | S2 | No |
| S4 | Commit the USNO verification fixtures. **Already built, in `data/validation/`: 37,340 comparisons, 0 failures** | nothing | No |
| S6b | **London's own interval table.** 10,290 bytes buys fifty published years, 2027 to 2076, removing the API key, the network dependency and the single-operator risk. **Offline fidelity is within one minute, not exact** (Isha 2 min out on 22 of 18,250 values). `LONDON-LINEAGE.md` verifies the publisher IS the app's own producer, and names the one test still outstanding | S2 | No, times unchanged |
| S5 | Name the authority on screen, with the honest wording | S2 | Yes, small |
| S6 | Surface jamaah. Already typed at `shared/types.ts:18-38` and never read, so the wire data is arriving and being discarded | nothing | Yes |
| S7 | Add ONE second source: Malaysia (JAKIM) | S2, S3 | Yes |
| S7b | The location layer, in whichever shape decision 1 takes | decision 1 | Yes |
| S8 | The source switch, with its cache wipe, alarm re-arm and delta warning | S7, S7b | Yes |
| S9 | Per-prayer manual offsets | decision 3 | Yes |
| S10 | The computed source with `adhan@4.4.6`, **last and deliberately so**, because library presets are the least authoritative option | S7, S8 | Yes |

## Five things a planning session must not rediscover the hard way

1. **The notification sweep cannot detect a moved time.** `findStaleScheduledNotificationIds` compares identifiers,
   and the identifier carries no time. Any step that can move times must re-arm explicitly rather than trust the
   sweep, or the phone silently fires old instants.
2. **The provider already changed its Asr margin, and it is documented on its own technical page.** Every London
   year to 2026 carries none and every year from 2027 carries +2, so a London user's Asr moves 1 to 3 minutes in
   January 2027 whatever this app does. It needs a decision, not a fix.
3. **`MiddleOfTheNight` is adhan's default and is measurably the worst high-latitude rule at every authority
   tested.** Set `highLatitudeRule` explicitly and never call `recommended()`, which never fires below the equator.
4. **Test any northern authority's high-latitude rule below the equator before trusting it.** Three sign bugs were
   found by measurement: Belgium's latitude-45 rule is 47 minutes wrong in the south, Wifaqul Ulama's longest-day
   rule 534 minutes wrong at 69.6S, and adhan's `recommended()` never fires there.
5. **Every extra published row must declare whether it comes from an angle or an offset.** The same cited 20 degrees
   binds to Malaysia's Imsak and to Indonesia's Subuh, which are different rows, and Kemenag's Imsak is a derived
   offset with no published angle.

## What a further research wave would do, if the owner wants one

Ordered by value. None blocks a decision; each sharpens one. Full list in `ASSUMPTIONS.md`.

1. **Finish Norway.** The last unexplained authority behaviour in the programme: the frozen-clock reading reproduces
   its blank-cell counts exactly but is 42.3 minutes off on the days that bind.
2. **Close Pakistan and Afghanistan**, the largest NULLs. Pakistan is the second-largest Muslim population on earth.
3. **Establish whether coordinate-to-zone generalises beyond Malaysia.** Built there at 96.5% from 63 KB of
   polygons; Indonesia, Brunei, Sri Lanka, Bangladesh and Turkey were not tested.
4. **Measure the remaining tier-D states**: Kuwait, Bahrain, Jordan, Libya, Portugal.
5. **Verify the residual-expiry result on a third authority year.** It rests on Singapore, Oman and the UAE, and
   London's interval table is the counter-example that shows why an interval outlives a residual.

## Standing rules this programme added

- **No session contacts anyone**, about anything, without the owner asking first: no email, no drafted letter, no
  contact form, no gathering of contact addresses (owner, 2026-09-30).
- **A research agent never spawns a research agent** (owner, 2026-09-30). Nested delegation cost this programme a
  deliverable once, when a country agent's regional tables were handed to sub-agents that were all cancelled.
- **Take the version number from `origin/uat-2` at the moment of the bump**, never from the working tree. Two
  sessions ran concurrently through this work and collided on 1.29.140 before this was adopted.
