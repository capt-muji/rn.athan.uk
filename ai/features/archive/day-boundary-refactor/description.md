# Refactor: Day Boundary Bug Fixes

**Status:** In Progress
**Author:** muji
**Date:** 2026-01-18
**Specialist:** Architect

---

## Overview

Refactor the prayer-based day boundary system to fix reported bugs with date display, timer/countdown, and schedule advancement. ADR-004 documents the intended behavior - this refactor ensures the code matches the specification.

## Goals

- [ ] Fix date display issues (correct date shown on each schedule)
- [ ] Fix timer/countdown bugs (always shows correct next prayer)
- [ ] Fix schedule advancement bugs (advances at the right time)
- [ ] Ensure all 14 ADR-004 scenarios work correctly

## Non-Goals

- No new features
- No UI changes (visual appearance)
- No changes to notification system
- No changes to API/data fetching

## Problem Statement

Current Issues Reported:
1. Date display issues - dates may be incorrect in certain edge cases
2. Timer/countdown bugs - timer may show wrong prayer or wrong time
3. Schedule advancement bugs - schedule may not advance when expected

Root Cause: The Midnight prayer (Maghrib-Fajr midpoint) introduced complexity:
1. The term "midnight" has two meanings (prayer name vs 00:00)
2. The Extras schedule has an inverted temporal structure (starts evening, ends morning)
3. Two schedules can be on different dates simultaneously

## Reference

**Authoritative Spec:** ai/adr/004-prayer-based-day-boundary.md

## Key Files to Review

| File | Responsibility |
|------|----------------|
| `shared/time.ts` | `calculateCountdown()` with yesterday fallback |
| `stores/schedule.ts` | `advanceScheduleToTomorrow()` |
| `stores/sync.ts` | `initializeAppState()` |
| `stores/timer.ts` | Timer that triggers advancement |
| `hooks/usePrayer.ts` | `isPassed` calculation |
| `components/ActiveBackground.tsx` | Blue highlight visibility |
| `components/Timer.tsx` | Timer display |
| `components/Day.tsx` | Date display |
| `components/Prayer.tsx` | Prayer row display |
| `components/ProgressBar.tsx` | Progress bar calculation |

## Critical Scenarios from ADR-004

1. Isha after system midnight (summer)
2. Midnight prayer after system midnight
3. Both schedules on different dates
4. Extras "Midnight still upcoming after Duha" (yesterday fallback)
5. App opened after last prayer passed
6. isPassed calculation after schedule advancement
7. New Year boundary (Dec 31 → Jan 1)

## Acceptance Criteria

- [ ] All 14 scenarios in ADR-004 work as documented
- [ ] Timer always shows countdown (never blank/hidden)
- [ ] Date matches schedule's current day
- [ ] isPassed correctly handles advanced schedules
- [ ] Yesterday fallback works for Extras Midnight

---

## Approval

- [ ] Architect: Plan reviewed and approved
- [ ] ReviewerQA: Security/quality concerns addressed
- [ ] Implementer: Ready to build
