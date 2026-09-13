# Session: verify every feature on real hardware, top to bottom

**Status: NOT STARTED. Queued by the owner on 2026-09-13, and it runs BEFORE every other queued
session** — before `coverage-sweep.md`, before `moonsighting-research.md`. The owner was explicit:
*"absolutely before any other sessions, the next session."*

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

## The matrix to cover

**Both phones, in parallel.** OnePlus 3T (`adb devices` → `3T_SERIAL`) and the owner's iPhone
(currently offline in `xcrun xctrace list devices`; the owner will connect it).

1. **Every notification type** — each of the six Standard prayers, each Extras row, at each alert
   type (Off / Silent / Sound), plus the reminder offsets.
2. **All 32 athans** — select each in the sound sheet, fire, fingerprint, and listen.
3. **All 67 reminders** — fire, fingerprint, and listen.
4. **Reminder intervals** — change to 10 minutes and prove the scheduled time actually moved. The
   owner has called this out twice; the sound sheet and the interval are the two settings most
   likely to be read once and cached.
5. **Before and after midnight, explicitly.** Isha and Magrib can both fall after 00:00, and the
   Extras night rows are defined by it. Every row, both sides of the boundary, driven with
   `service call alarm 2 i64` against `auto_time 0`.
6. **The whole Extras schedule** — Midnight, Last Third, Suhoor, Duha, and Istijaba on a Friday —
   each one on the right list day, at the right instant, matching what the list shows.
7. **What the user actually sees** — read the rendered values back off the device and compare
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

## Existing tooling to build on, not re-derive

`e2e/scripts/` already has `device-checks.sh` / `device_checks.py`, `frame-audit.sh`,
`idle-cpu.sh` / `idle_cpu.py`, and `baseline-compare.sh`, with baselines in `e2e/baselines/`.
The mutation harness from finding 65 lives at `ai/features/uat-2/mutate.py` and `mutate2.py`.
