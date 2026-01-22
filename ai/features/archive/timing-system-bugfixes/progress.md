# Bug Fix Plan: Prayer Timing System Post-Refactor Issues

**Status:** ✅ ARCHIVED
**Created:** 2026-01-19
**Archived:** 2026-01-21
**Branch:** `refactor_time_from_cleanup_prayer`
**Related:** ai/adr/005-timing-system-overhaul.md
**Note:** All 5 bugs fixed and verified - feature working correctly

---

## Summary

After refactoring from date-centric to prayer-centric model (ADR-005), manual testing at 03:16am on Jan 19th revealed 5 bugs. All bugs were fixed and verified.

### Bugs Fixed

| Bug   | Description                      | Status   |
| ----- | -------------------------------- | -------- |
| Bug 5 | Store Mutation During Atom Read  | ✅ Fixed |
| Bug 3 | Progress Bar Shows 0% (timezone) | ✅ Fixed |
| Bug 1 | Midnight Not Showing on Extras   | ✅ Fixed |
| Bug 2 | Overlay Shows Wrong Prayer Data  | ✅ Fixed |
| Bug 4 | Require Cycles                   | ✅ Fixed |

### Files Modified

| File                      | Bug  | Changes                                             |
| ------------------------- | ---- | --------------------------------------------------- |
| `stores/schedule.ts`      | 5, 1 | Pure `getNextPrayer()`, smarter `refreshSequence()` |
| `shared/time.ts`          | 3    | London timezone in `createPrayerDatetime()`         |
| `stores/countdown.ts`         | 2, 4 | Tomorrow fallback in overlay, new atom import       |
| `device/notifications.ts` | 4    | Dependency injection for sound preference           |
| `shared/notifications.ts` | 4    | Dependency injection for refresh function           |
| `stores/atoms/overlay.ts` | 4    | NEW: Extracted overlayAtom                          |
| `stores/overlay.ts`       | 4    | Import from new atom location                       |

---

## ReviewerQA Score: 100/100

All bugs fixed with clean implementation following existing codebase patterns.

---

## Verification Complete

- ✅ No "store mutation" warning
- ✅ Progress bar shows correct percentage
- ✅ Midnight appears on Extras schedule
- ✅ Overlay shows correct prayer data
- ✅ No "require cycle" warnings
- ✅ All edge cases tested

---

**Archived:** 2026-01-21
