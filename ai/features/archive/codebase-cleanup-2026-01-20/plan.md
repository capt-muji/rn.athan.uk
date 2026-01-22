# Comprehensive Codebase Cleanup & Optimization Plan

## Executive Summary

**Goal**: Deep cleanup and optimization of Athan.uk codebase to remove ~150 lines of unused code, simplify complex logic, ensure 100% code quality, and update documentation.

**Approach**: 5 incremental phases with verification checkpoints after each phase
**Estimated Time**: 3-4 hours
**Risk Level**: Low (incremental changes, mostly removing dead code)
**Breaking Changes**: None (all internal refactors)

---

## Phase 1: Remove Unused Code (30 min) ✓ SAFEST

### 1.1 Remove Unused Animation Hooks
**File**: `hooks/useAnimation.ts`
- **Delete lines 87-107**: `useAnimationBackgroundColor` (21 lines)
- **Delete lines 131-152**: `useAnimationTranslateY` (22 lines)
- **Delete lines 171-186**: `useAnimationBounce` (16 lines)
- **Impact**: 59 lines removed

**Verification**:
```bash
grep -rn "useAnimationBackgroundColor\|useAnimationTranslateY\|useAnimationBounce" --include="*.tsx" .
# Should return 0 results after removal
prettier --write hooks/useAnimation.ts
eslint hooks/useAnimation.ts
```

### 1.2 Remove Unused Type Definition
**File**: `shared/types.ts`
- **Delete lines 17-19**: `IApiTimes` interface (redundant)
- **Impact**: 3 lines removed

### 1.3 Remove Unused Atoms
**File**: `stores/ui.ts`
- **Delete line 21**: `scrollPositionAtom`
- **Delete lines 23-24**: `englishWidthStandardAtom`, `englishWidthExtraAtom`
- **Delete line 28**: `measurementsMasjidAtom`
- **Delete line 64-69**: `setEnglishWidth` function
- **Delete line 71**: `setScrollPosition` function
- **Delete lines 76-77**: `getMeasurementsMasjid`, `setMeasurementsMasjid`
- **Impact**: ~15 lines removed

**Also update**: `stores/version.ts` - Add `prayer_max_english_width_*` to cache clearing list in `handleAppUpgrade()`

### 1.4 Delete Unused File
**File**: `hooks/useCountdown.ts`
- **Action**: Delete entire file (73 lines)
- **Reason**: Countdown logic moved to `stores/countdown.ts`

**Phase 1 Total**: ~150 lines removed + 1 file deleted

**Checkpoint**:
```bash
prettier --write "**/*.{ts,tsx}"
eslint "**/*.{ts,tsx}"
tsc --noEmit
yarn start  # Verify app loads, countdowns work
```

---

## Phase 2: Simplify Animation Hooks (45 min)

### 2.1 Refactor Animation Hooks Pattern
**File**: `hooks/useAnimation.ts`

**Problem**: 6 animation hooks with 80% duplicate code:
- `useAnimationColor`, `useAnimationFill`, `useAnimationOpacity`, `useAnimationScale` - all follow identical pattern

**Solution**: Extract shared `animate` function logic:

```typescript
function createAnimateFunction(
  value: Animated.SharedValue<number>,
  animationType: 'timing' | 'spring' = 'timing'
) {
  return (toValue: number, options?: AnimationOptions) => {
    'worklet';
    // Shared animation logic (30 lines) extracted once
    // All hooks use this instead of duplicating
  };
}
```

Then simplify each hook to 8-10 lines instead of 20+ lines.

**Impact**: Reduce ~80 lines of duplication to ~30 lines of shared logic

**Verification**:
```bash
prettier --write hooks/useAnimation.ts
eslint hooks/useAnimation.ts
tsc --noEmit
yarn start  # Test all animations: overlay, progress bar, prayer list
```

---

## Phase 3: Extract Patterns & Constants (45 min)

### 3.1 Move Magic Numbers to Constants
**File**: `shared/constants.ts`

**Add**:
```typescript
export const TIME_CONSTANTS = {
  ONE_DAY_MS: 24 * 60 * 60 * 1000,
  ONE_HOUR_MS: 60 * 60 * 1000,
} as const;

export const ISLAMIC_DAY = {
  EARLY_MORNING_CUTOFF_HOUR: 6,
} as const;
```

**Update usage in**:
- `stores/schedule.ts:216` - Replace `24 * 60 * 60 * 1000` with `TIME_CONSTANTS.ONE_DAY_MS`
- `device/updates.ts:61` - Same replacement
- `shared/prayer.ts:113` - Replace `6` with `ISLAMIC_DAY.EARLY_MORNING_CUTOFF_HOUR`

### 3.2 Extract Notification Lock Pattern
**File**: `stores/notifications.ts`

**Problem**: Guard pattern repeated 4 times (lines 166-177, 219-232, 316-332, 334-360)

**Solution**: Create wrapper:
```typescript
async function withSchedulingLock<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T | void> {
  if (isScheduling) return;
  isScheduling = true;
  try {
    return await operation();
  } finally {
    isScheduling = false;
  }
}
```

Then refactor 4 functions to use this wrapper.

**Impact**: Reduce ~60 lines to ~25 lines

**Verification**:
```bash
prettier --write shared/constants.ts stores/notifications.ts stores/schedule.ts device/updates.ts shared/prayer.ts
eslint "**/*.{ts,tsx}"
tsc --noEmit
yarn start  # Test notification scheduling
```

---

## Phase 4: Break Down Large Functions (60 min) ⚠️ CAREFUL

### 4.1 Simplify `createPrayerSequence` (61 lines → 4 functions)
**File**: `shared/prayer.ts:224-285`

**Extract helper functions**:
1. `getPrayerNamesForDate(type, date)` - Filters Istijaba on non-Fridays
2. `adjustPrayerDate(type, name, date, time)` - Handles midnight-crossing logic
3. `createPrayersForDay(type, date, rawData)` - Creates prayers for single day
4. Main `createPrayerSequence(type, startDate, dayCount)` - Orchestrates

**Impact**: 61 lines → 4 focused functions (~70 lines total, much more readable)

### 4.2 Simplify `refreshSequence` (67 lines → 4 functions)
**File**: `stores/schedule.ts:185-252`

**Extract helper functions**:
1. `filterRelevantPrayers(prayers, now, displayDate, nextIndex)` - Filter logic
2. `needsMorePrayers(prayers, now)` - Buffer check
3. `mergePrayerSequences(existing, newPrayers)` - Deduplication
4. Main `refreshSequence(type)` - Orchestrates

**Impact**: 67 lines → 4 focused functions (~80 lines total, clearer logic)

**Verification** (CRITICAL):
```bash
prettier --write shared/prayer.ts stores/schedule.ts
eslint "**/*.{ts,tsx}"
tsc --noEmit
yarn start

# CRITICAL TESTS:
# 1. Wait for prayer to pass, verify sequence refreshes
# 2. Check Isha after midnight displays correctly
# 3. Test Friday (Istijaba appears), non-Friday (doesn't appear)
# 4. Verify progress bar works across transitions
```

---

## Phase 5: Documentation & QA (45 min)

### 5.1 Add JSDoc to Complex Functions
**File**: `shared/time.ts`

**Add comprehensive JSDoc to**:
1. `getLastThirdOfNight(magribTime, fajrTime)` - Explain Islamic night division, +5 min adjustment
2. `getMidnightTime(magribTime, fajrTime)` - Explain Islamic midnight vs 00:00
3. `formatTime(seconds, hideSeconds)` - Explain formatting rules, examples

**Impact**: +60 lines of documentation

### 5.2 Add Comments to Types
**File**: `shared/types.ts`

**Add comments to**:
- `IApiSingleTime` - Explain raw API structure
- `IApiResponse` - Explain API response format
- `ISingleApiResponseTransformed` - Explain derived data
- `ScheduleType` - Explain Standard vs Extra
- `AlertType` - Explain Off/Silent/Sound

**Impact**: +40 lines of documentation

### 5.3 Review Existing Comments
**Files**: `shared/prayer.ts`, `stores/schedule.ts`
- Verify ADR-004 and ADR-005 references are accurate
- Verify algorithm comments match current implementation
- Update any outdated comments

### 5.4 Update Documentation
**File**: `README.md`
- Add "Recent Cleanup (2026-01-20)" section
- Document code quality improvements

**File**: `ai/AGENTS.md`
- Add memory log entry for cleanup completion
- Document removed code, refactored patterns, quality metrics

### 5.5 Final QA Checklist (100/100)

```bash
# 1. Format everything
prettier --write "**/*.{ts,tsx,md}"

# 2. Lint everything
eslint "**/*.{ts,tsx}"

# 3. Type check
tsc --noEmit

# 4. Manual testing
yarn start
```

**Verify**:
- [ ] Zero ESLint errors
- [ ] Zero TypeScript errors
- [ ] App loads without console errors
- [ ] All animations work smoothly
- [ ] Prayer transitions function correctly
- [ ] Notifications schedule properly
- [ ] No unused imports/exports
- [ ] All comments accurate
- [ ] Documentation updated

---

## Critical Files (15 files total)

| File | Changes | Risk |
|------|---------|------|
| `hooks/useAnimation.ts` | Remove 3 hooks, refactor 4 hooks | Low |
| `hooks/useCountdown.ts` | **DELETE FILE** | Very Low |
| `shared/types.ts` | Remove IApiTimes, add JSDoc | Very Low |
| `stores/ui.ts` | Remove 4 atoms + 5 functions | Very Low |
| `stores/version.ts` | Add MMKV keys to clear list | Very Low |
| `shared/constants.ts` | Add TIME_CONSTANTS, ISLAMIC_DAY | Very Low |
| `stores/notifications.ts` | Extract lock pattern wrapper | Low |
| `stores/schedule.ts` | Break down refreshSequence + use constants | Medium |
| `device/updates.ts` | Use TIME_CONSTANTS | Very Low |
| `shared/prayer.ts` | Break down createPrayerSequence + use constants | Medium |
| `shared/time.ts` | Add JSDoc to 3 functions | Very Low |
| `components/ProgressBar.tsx` | Extract platform helpers (optional) | Low |
| `README.md` | Add cleanup section | Very Low |
| `ai/AGENTS.md` | Add memory log | Very Low |

---

## Success Metrics

**Code Reduction**:
- Remove ~150 lines of unused code ✓
- Reduce duplication by ~100 lines ✓
- Net: ~250 lines cleaner codebase

**Code Quality**:
- Zero ESLint errors ✓
- Zero TypeScript errors ✓
- 100% Prettier formatted ✓

**Documentation**:
- +100 lines of JSDoc/comments ✓
- All complex functions documented ✓
- README/AGENTS.md updated ✓

**Maintainability**:
- Large functions broken down (61→70, 67→80 lines but 4x more readable) ✓
- Magic numbers replaced with constants ✓
- DRY principle applied to repeated patterns ✓

---

## Rollback Strategy

If any phase fails:
```bash
# Rollback specific file
git restore [file-path]

# Complete rollback
git reset --hard HEAD
```

Each phase is independent - can rollback individual phases without affecting others.
