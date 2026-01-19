# Cleanup Plan - Timing System Refactor

## Executive Summary

This document outlines the comprehensive cleanup plan for the timing system refactor, identifying redundant code, unused properties, and optimization opportunities across the codebase.

---

## Phase 1: Immediate Cleanup (Zero Risk)

### 1.1 Remove `id` Property from Prayer Interfaces

**Location**: `shared/types.ts`, `shared/prayer.ts`

**Changes**:

- Remove `id: string` from `Prayer` interface (line 188)
- Remove `id: string` from `StoredPrayer` interface (line 233)
- Remove `generatePrayerId()` function from `shared/prayer.ts`
- Update serialization functions to exclude `id`

**Rationale**:

- Usage count: **0 matches** in codebase
- Never accessed via property notation
- Not used in map keys (arrays use index)
- Not used in Set operations for deduplication

**Risk**: **ZERO** - No dependencies found

**Files to modify**:

1. `shared/types.ts` - Remove `id` from interfaces
2. `shared/prayer.ts` - Remove `generatePrayerId()` function
3. `shared/storage.ts` - Update serialization (if needed)

---

### 1.2 Remove Old System Reference Documentation

**Location**: `mocks/timing-system-schema.ts` lines 17-121

**Changes**:

- Remove `ITransformedPrayerCurrent` interface
- Remove `ScheduleStoreCurrent` interface
- Remove `CURRENT_SYSTEM_EXAMPLE` constant
- Keep comments explaining the transformation
- Keep ADR references (`@see ai/adr/005-timing-system-overhaul.md`)

**Rationale**:

- Usage count: **0 matches** in actual implementation
- These are documentation examples only
- Codebase has fully migrated to prayer-centric model

**Risk**: **ZERO** - No runtime dependencies

**Files to modify**:

1. `mocks/timing-system-schema.ts` - Remove old system interfaces

---

## Phase 2: Post-UI Migration Cleanup (Low Risk)

### 2.1 Remove `time` Property

**Location**: `shared/types.ts`

**Changes**:

- Remove `time: string` from `Prayer` interface
- Remove `time: string` from `StoredPrayer` interface
- Update `PrayerTime.tsx` to use `datetime.toLocaleTimeString()`
- Update all components using `prayer.time`

**Rationale**:

- Marked as "Kept for backward compatibility"
- Can be derived from `datetime.toLocaleTimeString()`
- Reduces data redundancy

**Pre-requisites**:

- Verify all UI components use `datetime` for time display
- Update `PrayerTime.tsx` component
- Update any other components using `.time` property

**Files to modify**:

1. `shared/types.ts` - Remove `time` from interfaces
2. `components/PrayerTime.tsx` - Update to use `datetime`
3. All other files using `prayer.time`

---

## Phase 3: Documentation and Polish (No Risk)

### 3.1 Simplify Schema Documentation

**Location**: `mocks/timing-system-schema.ts`

**Changes**:

- Reduce redundant examples
- Keep only essential examples
- Add migration notes
- Clean up comparison tables

**Rationale**:

- Current file is 1078 lines
- Many examples are repetitive
- Documentation should be concise

---

## Additional Cleanup Opportunities

### A. Unused Exports and Dead Code

**Search Strategy**:

1. Use TypeScript compiler to find unused exports
2. Search for functions never called
3. Find imports that are never used
4. Identify commented-out code

**Tools**:

- `tsc --noEmit` with strict settings
- `eslint --no-eslintrc --ext .ts,.tsx --rule '{"no-unused-vars": "error"}'`
- Manual grep searches for patterns

---

### B. Redundant Types and Interfaces

**Candidates**:

1. `ITransformedPrayer` in `shared/types.ts` - Check usage
2. Duplicate type definitions across files
3. Interfaces that can be inferred or derived

---

### C. Duplicate Code Patterns

**Search Strategy**:

1. Identify repeated utility functions
2. Find copy-paste code blocks
3. Locate similar logic in different files

**Candidates**:

- Date/time formatting utilities
- Array manipulation functions
- Similar component patterns

---

### D. Deprecated API Usage

**Search Strategy**:

1. Check for deprecated React Native APIs
2. Find Expo SDK v52+ migration artifacts
3. Identify outdated patterns

**Candidates**:

- Old notification patterns
- Legacy timer implementations
- Deprecated hook usage

---

## Verification Checklist

- [ ] All changes compile without errors
- [ ] No TypeScript warnings or errors
- [ ] All tests pass
- [ ] ESLint passes
- [ ] Runtime behavior unchanged
- [ ] No breaking changes to public APIs

---

## Rollback Plan

If issues are found after cleanup:

1. Revert git changes: `git checkout HEAD~1`
2. Restore removed code
3. Run tests to verify
4. Investigate issues before retrying

---

## Notes

- All cleanup should be done on a feature branch
- Create PR for review before merging
- Document all changes in commit messages
- Test thoroughly on both iOS and Android

---

**Generated**: 2026-01-19
**Status**: Pending Implementation
**Priority**: High
