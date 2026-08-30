# AI Agent Usage Guide

Human-facing guide: how to drive sessions and run the simulator test loops.

## 🚀 Starting Any Session

**Always start with this:**

```
Read ai/AGENTS.md and begin as Orchestrator.
```

---

## 🎯 Mock Cascade Simulation (countdown/transition testing)

The mock feed (`mocks/simple.ts`, active whenever `EXPO_PUBLIC_ENV` is not
`prod`/`preview` — the default for local Release builds) builds TODAY's prayer
times **relative to app launch**. Edit the offsets to stage transitions.

Current committed resting state — every transition is a 2-minute wait:

```ts
// mocks/simple.ts — [today] block
fajr: addMinutes(-10),   // passed 10m before launch
sunrise: addMinutes(-8), // passed
dhuhr: addMinutes(-6),   // passed
asr: addMinutes(-4),     // passed
magrib: addMinutes(2),   // +2m → flip to Isha
isha: addMinutes(4),     // +4m → flip to next day's Fajr (footer day swaps)
// [day1] block: fajr: addMinutes(6) closes the 2-minute chain
```

Offsets are minutes **from launch** (negative = already passed). Tighten or
widen them to stage whatever transition you want to watch.

**Night-testing constraint (00:00–05:59):** the intended midnight-crossing
rules apply — `adjustPrayerDateForMidnightCrossing` moves a Standard Isha in
that window to *tomorrow's* datetime, and `calculateBelongsToDate` assigns it
to *yesterday's* Islamic day. Correct for a real post-midnight Isha (real
London Isha never lands there), but a night-time mock triggers both: at the
Magrib→Isha handoff the countdown skips to the next day's Fajr and the
rollover cascade fires early. The +2/+4/+6 chain keeps its real-time gaps at
any hour, but the app's list view cascades cleanly only 06:00–23:59.
Countdown ticking and pre-Isha transitions are unaffected at any hour.

### Rerun the simulation (iPhone 16 sim, Release, mock data)

```bash
# 1. Rebuild + install (first run ~15 min; incremental ~4-6 min)
npx expo run:ios --configuration Release

# 2. Clean relaunch — IMPORTANT: bypasses the dev-client URL the build's
#    auto-launch opens (which parks the app on a "connecting to Metro" screen)
UDID=8FB33B9F-A3D4-4776-A4E6-4BE17228E9DC
xcrun simctl terminate $UDID com.mugtaba.athan 2>/dev/null; sleep 2
date "+%H:%M:%S.%N LAUNCH (T0)"
xcrun simctl launch $UDID com.mugtaba.athan

# 3. (Optional) stream the countdown TICK debug logs while transitions play out
xcrun simctl spawn $UDID log stream --predicate 'eventMessage CONTAINS "TICK"' --level debug | tee /tmp/tick-stream.txt
# ...watch N minutes, then Ctrl-C. (Debug entries are stream-only —
#  `log show` cannot retrieve them afterwards; `log show --info` works
#  for info-level history.)

# 4. On-screen check without screenshots: the a11y tree exposes the countdown
#    text directly (e.g. "Fajr", "1m 42s", "Magrib 1m ago")
```

Transitions land on the wall second containing each target (mock targets are
launch-relative, i.e. arbitrary sub-second phase; real prayer times are
minute-exact, so real transitions fire within ~20ms of the :00 boundary).

### What healthy looks like

- TICK `phase` (=`wall % 1000`) stays 10–30ms — digits flip with the status bar
- `computed` counts down to 1 and swaps to the next prayer at the boundary —
  never 0 (display contract)
- Transitions (`TICK: transition`) show small `transitionMs`

---

## 🔄 After Work is Done

Agents **cannot commit to Git unprompted**. After review:

```bash
git status
git diff
# then commit (version bumped per AGENTS.md §6) and push
```

## 🆘 Troubleshooting

- **Agent isn't following conventions** — check ai/AGENTS.md §4 (Golden Paths) and §8 (Consistency)
- **Agent is too verbose** — ask for concision; reference AGENTS.md sections instead of re-explaining
- **Not sure which specialist** — read ai/AGENTS.md §10 (Decision Tree)

## 📁 Templates

| Template         | Location                          | Purpose                                                           |
| ---------------- | --------------------------------- | ----------------------------------------------------------------- |
| **Feature Spec** | `ai/features/FEATURE-TEMPLATE.md` | Full feature requirements (goals, user stories, technical design) |
| **ADR**          | `ai/adr/TEMPLATE.md`              | Architecture Decision Records                                     |

```bash
# For a new feature
mkdir -p ai/features/my-feature
cp ai/features/FEATURE-TEMPLATE.md ai/features/my-feature/description.md

# For an ADR
cp ai/adr/TEMPLATE.md ai/adr/NNN-my-decision.md
```

## 📚 Learn More

- Full agent details: ai/AGENTS.md §10
- Coding conventions: ai/AGENTS.md §4
- Session init prompt: ai/prompts/init.md
- Feature workflow prompts: ai/prompts/feature-*.md
