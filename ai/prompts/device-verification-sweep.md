# Session: verify every feature on real hardware, top to bottom

**Status: NOT STARTED. Queued by the owner on 2026-09-13, and it runs BEFORE every other queued
session** — before `coverage-sweep.md`, before `moonsighting-research.md`. The owner was explicit:
*"absolutely before any other sessions, the next session."*

## Paste this to start the session

```
Read ai/prompts/device-verification-sweep.md and follow it. This is session 1 of the queue in
ai/prompts/README.md — the full-device verification sweep. Do not drift into sessions 2-5.

Before anything else, read: ai/prompts/README.md, ai/features/uat-2/AUDIT-FINDINGS.md (findings
5, 65-71 especially), AGENTS.md.

The API key is at ~/.config/athan/.api_key (mode 600). Read it from there. NEVER commit it.

Devices: OnePlus 3T on adb (8f7ada76): clock-driving, the midnight matrix, DST
pairs, every notification-schedule dump. iPhone XS — audio only, and only once I have connected
it; check `xcrun xctrace list devices` and ask me if it is offline. Run the two audio passes in
parallel.

Acceptance criterion, mine, verbatim: there is no notification that should ever be a generic one.
All 99 sounds play their own file. Prove it with the dumpsys fingerprint (44100 mono = athan,
22050 stereo = reminder, 48000 stereo = the default reminder, 44100 stereo = a fallback tone and
therefore a failure), then listen to each of the 32 athans, because all 32 share a fingerprint.

No screenshots: I dropped them on 2026-09-13 and had the evidence/ folder deleted. Prove device
claims with dumps and logs, as the section "Evidence is dumps and logs, not screenshots" describes.

Standing rules, all absolute:
- Never touch uat. One finding, one branch, one commit, version-bumped, merged --no-ff into uat-2.
- Never build on EAS and never push to it. EAS and the Expo MCP are READ ONLY. Builds are local.
- releases.json is untouchable.
- Keep every visual exactly as it is. Ask before touching a pixel.
- Never copy, average or synthesise a prayer time. Not from yesterday, not from tomorrow, ever.
- Comments explain WHY, never what. The code already shows what.
- Every change deep-reviewed by an agent with no stake in it, then verified on hardware. A green
  unit test is not evidence a notification fired; a fired notification is not evidence the right
  file played. Both, every time.

How to work: Opus 5 at max effort for everything, including every subagent. Work autonomously in
a loop and do not stop to check in — I am not available to review. Use parallel agents in
worktrees where the work divides cleanly, deep-diving reviewers rather than brief overviews.
Put a compact progress table in EVERY response.

Do the device testing yourself — change the clock, build, install, read the dumps. Do not hand me
a recipe.
```

## The ask, in the owner's framing

> "I'm absolutely going to make you test from top to bottom, every single feature… read the data
> that is presented to the user. Read every single log, physically test on the device… test every
> single notification… test every single sound on the Android… test on the Android and the
> iPhone, I'm going to connect the iPhone… all 32 athans actually play, by selecting each one and
> listening to each one. And then for each single reminder, listen to each one and confirm it
> plays. Confirm every single prayer before 12 o'clock and after 12 o'clock — for example Isha
> and Magrib can fall after 12 o'clock — so explicitly test every single scenario before and
> after. And every single extra prayer as well, the extra schedule, every single one of them
> matches up correctly. And test in parallel, both phones in parallel. Every notification should
> play its audio. **There is no notification that should ever be a generic one.**"

That last sentence is the acceptance criterion for the whole session. Everything else is method.

## The instrument: an AudioTrack fingerprint that says which file played

Measured 2026-09-13 with `ffprobe` over `android/app/src/main/res/raw` — the 99 files the
notification channels actually reference, not the source assets:

| Category | Files | Sample rate | Channels | Reads in `dumpsys audio` as |
| --- | ---: | ---: | --- | --- |
| Athans | 32 | 44100 Hz | **mono** | `44100 Hz, mono` |
| Reminders | 66 | 22050 Hz | **stereo** | `22050 Hz, stereo` |
| `reminder.mp3` (the default) | 1 | 48000 Hz | **stereo** | `48000 Hz, stereo` |
| **A system/fallback tone** | — | 44100 Hz | **stereo** | `44100 Hz, stereo` |

**No shipped file is 44100-stereo, and no shipped file is both 44100 and stereo.** So the three
categories and the failure case are mutually exclusive on two fields the audio flinger already
logs. That is what makes "test all 99 sounds" tractable in a session rather than a week: the
device says which *category* played without anyone listening, and listening is then spot-checks
for identity rather than 99 sequential judgements.

**It does not identify *which* athan played** — all 32 share a fingerprint. Identity within a
category still needs an ear, or a capture compared against the file. Plan for both: fingerprint
every one of the 99 to prove nothing fell back, then listen to each of the 32 athans to prove the
selection maps to the right file.

## What "generic" looks like, and why it is the thing being hunted

Finding 5, restated by the owner and correct as restated: after a phone migration Android Auto
Backup restores app settings but **not notification channels**. A prayer then posts to a channel
id that no longer exists, and `expo-notifications` quietly substitutes its own fallback channel —
which carries the device's default notification tone. **The alarm still rings, so nothing looks
broken.** It just is not the athan any more. A `44100 Hz, stereo` line in `dumpsys` is that
failure, and it is the only cheap way to see it.

Re-verify the fix survives a real backup/restore cycle, not a simulated one:
`adb backup` → `pm clear` → `adb restore`, then fire a prayer and read the fingerprint.

## Which device does what — the owner's split, 2026-09-13

| Work | Device | Why |
| --- | --- | --- |
| **Every UI and scheduling check** | **OnePlus 3T only** | It is the device whose buttons and layout are already known. *"We don't want to do all that work again on the iPhone XS."* |
| **Audio — all 99 sounds** | **Both phones** | iOS has a 30-second sound cliff and its own fallback path that Android cannot show. |

So: the clock-driving, the midnight matrix, the DST pairs and the notification-schedule dumps
happen on the 3T. The iPhone XS is brought in for the audio pass and nothing else.

## Evidence is dumps and logs, not screenshots

The owner dropped screenshots mid-session on 2026-09-13 and had the `evidence/` folder deleted in
1.26.29: *"I don't care about the screenshots anymore... don't take screenshots of videos just for
me. Matter of fact, delete the evidence folder."* Screenshots are no longer kept as proof. A device
claim is proven by the `dumpsys` lines and logs, recorded in the findings entry. Audio evidence
stays as it was: the `dumpsys audio` fingerprint line plus the ear check. Read rendered values
from Maestro's `hierarchy`, which is live; on the 3T `uiautomator dump` serves stale trees
(ai/AGENTS.md, Performance Design Rules, rule 10).

## The matrix to cover

Everything below runs on the **OnePlus 3T** (`adb devices` → `8f7ada76`) except items 2 and 3,
the audio pass, which runs on both it and the **iPhone XS** (currently offline in
`xcrun xctrace list devices`; the owner will connect it). Run the two audio passes in parallel.

1. **Every notification type** — each of the six Standard prayers, each Extras row, at each alert
   type (Off / Silent / Sound), plus the reminder offsets.
2. **All 32 athans** — select each in the sound sheet, fire, fingerprint, and listen.
3. **All 67 reminders** — fire, fingerprint, and listen.
4. **Reminder intervals** — change to 10 minutes and prove the scheduled time actually moved. The
   owner has called this out twice; the sound sheet and the interval are the two settings most
   likely to be read once and cached.
5. **Before and after midnight, explicitly — and "midnight" here means 00:00 on the clock.**
   The owner disambiguated this on 2026-09-13: the *Gregorian* midnight, not the Extras row
   called "Midnight", which is the midpoint of the night and a different thing entirely. Every
   row that can land either side of 00:00 gets tested on both sides, and **the assertion is not
   just what the list shows — it is that the exact notification is scheduled for the exact
   moment.** Drive the clock with `service call alarm 2 i64` against `auto_time 0`, then read
   the scheduled set back and compare it against the row.
6. **The full year, including both DST transitions.** London goes forward on the last Sunday in
   March and back on the last Sunday in October, and a night that contains a clock change is
   23 or 25 hours long — which is exactly what Islamic Midnight and Last Third are measured
   against. Both boundaries, and enough of the rest of the year to show the timings hold
   throughout, not only in the weeks around today.
7. **High latitude, through the mocks rather than a real city.** The app is London-only until
   v2.0, so Finland cannot be tested for real — but the midnight-crossing logic exists and is
   reachable: edit the mock data so Magrib lands past 00:00 (and Fajr under 00:20, which is what
   makes Suhoor wrap), and confirm the schedule and the fired notification both agree with the
   row. This is dormant code in production today and live the moment the app goes global, which
   is the reason to prove it now rather than then.
8. **The whole Extras schedule** — Midnight, Last Third, Suhoor, Duha, and Istijaba on a Friday —
   each one on the right list day, at the right instant, matching what the list shows.
9. **Istijaba across midnight, named by the owner.** It is always one hour before Magrib. A
   Magrib at 01:20 puts it at 00:20 the same night; a Magrib at 00:40 puts it at **23:40 the
   evening before**. Both are pinned in `shared/__tests__/nightTimes.test.ts` with the literal
   date and clock, and the test was proved to bite by reverting the fix (6 failures). What is
   *not* proved is the notification: fire both on the 3T with the clock driven to each Magrib
   and read the scheduled time back, because a unit test cannot show that the alarm agrees.
10. **What the user actually sees** — read the rendered values back off the device and compare
   them to the times the API returned, not to what the code computed. Same for the logs.

## Standing rules for this session

- **Comments say why, never what.** The code already shows what. Every comment written this
  session explains the reason the line exists, or it does not go in.
- **Everything code-reviewed** — deep review, not an overview, by an agent with no stake in
  the change.
- **100% end-to-end coverage, unit tests, and physical verification on both phones.** A passing
  unit test is not evidence a notification fired; a fired notification is not evidence the right
  file played. Both, every time.
- Never build on EAS and never push to it. Builds are local, on the 3T and the iPhone.
- Never touch `uat`. One finding, one branch, one commit, version-bumped, merged `--no-ff`
  into `uat-2`.
- `releases.json` is untouchable.
- Keep every visual exactly as it is.

## Two terms this brief uses that are easy to confuse

**"Midnight" the Extras row** is the midpoint of the night — halfway between Magrib and the
following Fajr, typically somewhere around 23:30–01:30 in London. **"Midnight" everywhere else in
this brief** means 00:00 on the clock. The owner had to disambiguate this once; do not make them
do it twice.

**Suhoor** is twenty minutes before Fajr, and it is stored as text rather than as a moment. A
Fajr under 00:20 therefore produces a Suhoor of `23:4x` that belongs to the evening *before* —
the same wrap problem Magrib and Istijaba have, arriving from the other end of the night. Only
reachable far north; London's earliest Fajr is 02:38.

## Existing tooling to build on, not re-derive

`e2e/scripts/` already has `device-checks.sh` / `device_checks.py`, `frame-audit.sh`,
`idle-cpu.sh` / `idle_cpu.py`, and `baseline-compare.sh`, with baselines in `e2e/baselines/`.
The mutation harness from finding 65 lives at `ai/features/uat-2/mutate.py` and `mutate2.py`.
