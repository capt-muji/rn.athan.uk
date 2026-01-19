# Session Handoff: Isha Display Bug Investigation

**Purpose:** Use this prompt to start a new session to work on this bug investigation.

**Last Updated:** 2026-01-19

---

## Quick Start

Read ai/AGENTS.md and begin as Orchestrator.

I need to investigate and fix a critical bug in the prayer timing system.

---

## Bug Context

**Bug Name:** Isha Display Bug
**Location:** ai/features/isha-display-bug/
**Status:** Documented, Investigation Ready
**Priority:** CRITICAL - Blocking production
**Affects:** Standard schedule only

---

## Required Reading (In Order)

1. **ai/features/isha-display-bug/description.md**
   - Complete bug symptoms and technical analysis
   - Root cause hypotheses
   - Code path walkthrough
   - Quick reproduction steps

2. **ai/features/isha-display-bug/plan.md**
   - 5-phase investigation plan (ReviewerQA approved 100/100)
   - Diagnostic logging strategy
   - Hypothesis testing approach
   - Fix implementation priorities

3. **ai/features/isha-display-bug/progress.md**
   - Current status tracker
   - Where to log findings

4. **ai/AGENTS.md section 11 (Memory)**
   - Look for entry: "[2026-01-19] Critical Bug: Isha Display Issue"
   - Understand context from timing system overhaul

5. **ai/features/timing-system-overhaul/progress.md**
   - See Phase 9 (5 bugs we fixed)
   - See Phase 10 (this Isha bug - still open)
   - Understand the refactor that triggered this

6. **ai/adr/005-timing-system-overhaul.md**
   - Understand the prayer-centric model
   - Understand `belongsToDate` concept
   - Understand `displayDate` derivation

---

## Bug Summary (Quick Reference)

**Symptoms:**
- When Isha is next prayer: Only Isha renders, Fajr-Maghrib missing
- Isha shows +1 hour offset from actual time
- Prayers vanish when Maghrib countdown finishes
- Isha disappears when its countdown finishes

**Quick Reproduction:**
```typescript
// In mocks/simple.ts:
isha: addMinutes(1),  // 1 min in future
// All other prayers: addMinutes(-1) // passed
```

**Primary Hypothesis:**
Isha's `belongsToDate` is different from other prayers' `belongsToDate`, causing the filter in `hooks/useSchedule.ts:28` to exclude all non-Isha prayers.

**Already Tried (Did NOT Work):**
1. Changed `createPrayerDatetime()` to use `fromZonedTime` (shared/time.ts)
2. Added `getLondonHours()` helper (shared/prayer.ts)
3. Updated `calculateBelongsToDate()` to use London hours (shared/prayer.ts)

All three fixes were implemented but did not resolve the issue.

---

## Key Files Involved

- `shared/prayer.ts` - Prayer creation, `belongsToDate` calculation
- `shared/time.ts` - Datetime creation, timezone handling
- `stores/schedule.ts` - Sequence storage, `displayDate` derivation
- `hooks/useSchedule.ts:28` - Filter that excludes prayers
- `hooks/usePrayerSequence.ts` - Derives `displayDate` and prayer state

---

## Investigation Plan Overview

**Phase 1: Diagnostic Logging**
- Add logging to trace `belongsToDate` values through system
- Log at: `createPrayer()`, `calculateBelongsToDate()`, `createDisplayDateAtom()`, `useSchedule filter`, `refreshSequence()`

**Phase 2: Minimal Reproduction**
- Create mock data file for Isha-next scenario
- Create test harness for isolated debugging

**Phase 3: Hypothesis Testing**
- Test if Isha's `belongsToDate` mismatches
- Test if `displayDate` derivation is wrong
- Test if filter logic is incorrect
- Test if `refreshSequence()` removes prayers
- Test if timezone double-conversion exists

**Phase 4: Fix Implementation**
- Priority order: Timezone fix → belongsToDate fix → displayDate fix → filter fix
- Each fix includes pros/cons in plan.md

**Phase 5: Verification**
- Test all scenarios (Isha next, Maghrib next, after Isha passes, summer time, timezone edge cases)

---

## What I Need You To Do

**Step 1: Use Architect Agent**
- Read all documentation listed above
- Review the investigation plan (plan.md)
- Understand the attempted fixes and why they didn't work
- Propose which phase to start with (likely Phase 1: Diagnostic Logging)

**Step 2: Execute Investigation**
- Follow the plan.md phases sequentially
- Update progress.md after each phase
- Document findings in progress.md "Investigation Log" section
- Log all hypotheses tested and results

**Step 3: ReviewerQA Approval After Each Phase**
- After completing each investigation phase, switch to ReviewerQA
- ReviewerQA should verify findings are thorough and conclusions are sound
- **ONLY proceed to next phase if ReviewerQA gives 100/100**

**Step 4: Implement Fix (When Root Cause Found)**
- Once root cause is identified, implement the appropriate fix from plan.md
- Test with all verification scenarios from Phase 5
- Get ReviewerQA 100/100 approval on the fix

**Step 5: Update Documentation**
- Update progress.md with root cause and fix applied
- Update ai/AGENTS.md Memory with lessons learned
- Mark ai/features/isha-display-bug/progress.md as Complete
- **Update this handoff.md** with any new findings or context

---

## Critical Constraints

1. **DO NOT skip diagnostic logging** - We need to trace the exact data flow
2. **DO NOT guess at fixes** - Must confirm root cause via logs first
3. **Must use ReviewerQA 100/100 approval** between each phase
4. **Must test all 5 verification scenarios** before marking complete
5. **Must work on branch:** `refactor_time_from_cleanup_prayer`

---

## Expected Outcome

**Success Criteria:**
- All 6 Standard prayers render when Isha is next
- Isha time displays correctly (no +1 hour offset)
- Prayers don't vanish on Maghrib→Isha transition
- Isha doesn't disappear after countdown finishes
- Works in summer (Isha after midnight) and winter
- Works with device in non-London timezone

---

## Start Here

Begin by reading the documentation above, then use the Architect agent to review the investigation plan and recommend where to start. Proceed systematically through the phases with ReviewerQA approval at each step.

Let me know when you've read the context and are ready to begin Phase 1.

---

## Update Log

**2026-01-19:** Initial handoff created after documenting bug and creating investigation plan (ReviewerQA 100/100)
