# Handoff Document: Codebase Cleanup & Optimization

## Session Context

**Date Created**: 2026-01-20
**Status**: Planning Complete ✅ | Implementation Pending ⏳
**Plan Location**: `ai/features/codebase-cleanup-2026-01-20/plan.md`
**Goal**: Deep cleanup removing ~150 lines of unused code, simplifying complex logic, ensuring 100% code quality

---

## What Has Been Done ✅

### Discovery Phase (Complete)
Three Explore agents analyzed the entire codebase:

1. **RepoMapper Agent** - Mapped all 65 TypeScript/TSX files (12,653 lines total)
   - Result: Zero orphaned files, zero circular dependencies, excellent structure

2. **Unused Code Agent** - Found patterns not referenced anywhere
   - Result: ~150 lines of unused code identified (hooks, atoms, types, entire file)

3. **Complexity Agent** - Identified complex code needing simplification
   - Result: 6 duplicate animation hooks, 2 large functions (61 & 67 lines), repeated patterns

### Planning Phase (Complete)
**Architect Agent** designed detailed 5-phase implementation plan with:
- Specific line numbers for changes
- Verification commands for each phase
- Rollback strategies
- Risk assessment (Low overall)
- Success metrics

**Plan saved to**: `ai/features/codebase-cleanup-2026-01-20/plan.md`

---

## What Needs To Be Done Next ⏳

### Implementation Approach

**IMPORTANT**: User has granted **full permissions** - no need to ask before making changes.

User requirements:
- Remove ALL unused/redundant code (except cleanup-related files)
- Simplify complex logic (break down large functions, extract common patterns)
- Prettier format everything
- Zero ESLint errors
- Update README/AGENTS.md documentation
- Review/update comments (especially in types.ts)
- QA review multiple times
- Verify 100/100 quality checklist
- Make code simpler, easier to understand
- Break down complex logic into smaller functions with good names

### Recommended Agent Workflow

#### Step 1: Phase 1 - Remove Unused Code (Use Implementer)
**Agent**: Implementer
**Why**: Straightforward deletions, safest changes
**Prompt**:
```
Read the plan at ai/features/codebase-cleanup-2026-01-20/plan.md

Execute Phase 1: Remove Unused Code (~30 min)

Tasks:
1. Remove 3 unused animation hooks from hooks/useAnimation.ts (lines 87-107, 131-152, 171-186)
2. Remove IApiTimes interface from shared/types.ts (lines 17-19)
3. Remove 4 unused atoms + 5 functions from stores/ui.ts
4. Delete entire hooks/useCountdown.ts file (unused)
5. Update stores/version.ts to clear prayer_max_english_width_* from cache

After each file change:
- Run prettier --write on the file
- Run eslint on the file
- Verify no TypeScript errors with tsc --noEmit

After all changes, run the Phase 1 checkpoint commands and verify the app starts successfully.
```

**Expected Outcome**: ~150 lines removed, 1 file deleted, zero breaking changes

---

#### Step 2: Phase 2 - Simplify Animation Hooks (Use Implementer)
**Agent**: Implementer
**Why**: Refactoring with clear pattern to follow
**Prompt**:
```
Read the plan at ai/features/codebase-cleanup-2026-01-20/plan.md

Execute Phase 2: Simplify Animation Hooks (~45 min)

The plan shows how to extract the duplicate animate function logic from 6 animation hooks into a shared createAnimateFunction helper.

After implementation:
- Run prettier/eslint/tsc
- Test all animations (overlay, progress bar, prayer list cascade)
```

**Expected Outcome**: ~80 lines of duplication reduced to ~30 lines of shared logic

---

#### Step 3: Phase 3 - Extract Patterns (Use Implementer)
**Agent**: Implementer
**Why**: Pattern extraction following clear examples in plan
**Prompt**:
```
Read the plan at ai/features/codebase-cleanup-2026-01-20/plan.md

Execute Phase 3: Extract Patterns & Constants (~45 min)

Tasks:
1. Add TIME_CONSTANTS and ISLAMIC_DAY to shared/constants.ts
2. Replace magic numbers in 3 files (stores/schedule.ts, device/updates.ts, shared/prayer.ts)
3. Extract withSchedulingLock wrapper in stores/notifications.ts
4. Refactor 4 notification functions to use the wrapper

After each change, run prettier/eslint/tsc and test notification scheduling.
```

**Expected Outcome**: ~60 lines reduced to ~25 lines, magic numbers eliminated

---

#### Step 4: Phase 4 - Break Down Large Functions (Use Implementer)
**Agent**: Implementer
**Why**: Core logic changes, needs careful implementation
**Prompt**:
```
Read the plan at ai/features/codebase-cleanup-2026-01-20/plan.md

Execute Phase 4: Break Down Large Functions (~60 min)

⚠️ CRITICAL PHASE - Test thoroughly after each function breakdown

Tasks:
1. Split createPrayerSequence (shared/prayer.ts) into 4 helper functions
2. Split refreshSequence (stores/schedule.ts) into 4 helper functions

The plan provides the exact helper function signatures and logic to extract.

After implementation, run CRITICAL TESTS:
- Wait for a prayer to pass, verify sequence refreshes
- Check Isha after midnight displays correctly
- Test Friday (Istijaba appears) and non-Friday (doesn't appear)
- Verify progress bar works across prayer transitions
```

**Expected Outcome**: 2 large functions (128 lines) → 8 focused functions, much more readable

---

#### Step 5: Phase 5 - Documentation & QA (Use Implementer + ReviewerQA)
**Agent**: Implementer (for doc changes), then ReviewerQA (for verification)

**Implementer Prompt**:
```
Read the plan at ai/features/codebase-cleanup-2026-01-20/plan.md

Execute Phase 5: Documentation & QA (~45 min)

Tasks:
1. Add comprehensive JSDoc to 3 time utility functions (shared/time.ts)
2. Add explanatory comments to 5 interfaces/enums (shared/types.ts)
3. Review and verify existing comments in shared/prayer.ts and stores/schedule.ts
4. Update README.md with "Recent Cleanup (2026-01-20)" section
5. Update ai/AGENTS.md memory log with cleanup completion entry

Run final QA checklist:
- prettier --write "**/*.{ts,tsx,md}"
- eslint "**/*.{ts,tsx}"
- tsc --noEmit
- yarn start (manual testing)
```

**ReviewerQA Prompt** (after Implementer completes):
```
Review the codebase cleanup changes for code quality and best practices.

Context: Comprehensive cleanup that:
- Removed ~150 lines of unused code
- Simplified complex logic
- Extracted duplicate patterns
- Added documentation

Files changed (15 total):
- hooks/useAnimation.ts, hooks/useCountdown.ts (deleted)
- shared/types.ts, shared/constants.ts, shared/prayer.ts, shared/time.ts
- stores/ui.ts, stores/schedule.ts, stores/notifications.ts, stores/version.ts
- device/updates.ts
- components/CountdownBar.tsx (optional)
- README.md, ai/AGENTS.md

Review criteria:
1. Code consistency - matches existing patterns from AGENTS.md
2. No new dependencies added
3. All complex functions have JSDoc
4. Magic numbers replaced with constants
5. Large functions broken into focused helpers
6. Zero ESLint/TypeScript errors
7. Comments are accurate and helpful
8. Documentation updated

Provide grade (A-F) and specific feedback on any issues.
```

**Expected Outcome**: +100 lines documentation, 100/100 quality checklist passed

---

## Critical Files Reference

### Files to Modify (15 total)

**High Priority** (Core logic changes):
1. `hooks/useAnimation.ts` - Remove 3 hooks, refactor 4 hooks
2. `shared/prayer.ts` - Break down createPrayerSequence, use constants
3. `stores/schedule.ts` - Break down refreshSequence, use constants
4. `stores/notifications.ts` - Extract lock pattern wrapper
5. `stores/ui.ts` - Remove 4 unused atoms + 5 functions

**Medium Priority**:
6. `hooks/useCountdown.ts` - **DELETE FILE**
7. `shared/types.ts` - Remove IApiTimes, add JSDoc comments
8. `stores/version.ts` - Add MMKV keys to cache clear list
9. `shared/constants.ts` - Add TIME_CONSTANTS, ISLAMIC_DAY
10. `device/updates.ts` - Use TIME_CONSTANTS
11. `shared/time.ts` - Add JSDoc to 3 functions

**Low Priority** (Documentation):
12. `components/CountdownBar.tsx` - Extract platform helpers (optional)
13. `README.md` - Add cleanup section
14. `ai/AGENTS.md` - Add memory log entry

---

## Verification Commands

After each phase:
```bash
# Format code
prettier --write "**/*.{ts,tsx}"

# Check for errors
eslint "**/*.{ts,tsx}"

# Verify types
tsc --noEmit

# Start app for manual testing
yarn start
```

Final verification (Phase 5):
```bash
# Format all files including markdown
prettier --write "**/*.{ts,tsx,md}"

# Full lint check
eslint "**/*.{ts,tsx}"

# Type check
tsc --noEmit

# Manual test
yarn start
```

---

## Success Criteria

Before marking this cleanup complete, verify:

- [ ] ~150 lines of unused code removed
- [ ] ~100 lines of duplication eliminated
- [ ] +100 lines of documentation added
- [ ] Zero ESLint errors
- [ ] Zero TypeScript errors
- [ ] App loads without console errors
- [ ] All animations work smoothly
- [ ] Prayer transitions function correctly
- [ ] Notifications schedule properly
- [ ] Progress bar displays and animates correctly
- [ ] Isha after midnight displays correctly
- [ ] Friday Istijaba appears, non-Friday it doesn't
- [ ] All comments accurate
- [ ] README.md updated
- [ ] ai/AGENTS.md memory log updated
- [ ] ReviewerQA grade: A or A-

---

## Rollback Strategy

If any phase fails:

```bash
# Rollback specific file
git restore [file-path]

# Rollback entire phase
git restore hooks/useAnimation.ts shared/types.ts stores/ui.ts hooks/useCountdown.ts

# Complete rollback to start
git reset --hard HEAD
```

Each phase is independent - can rollback individual phases without affecting others.

---

## Key Decisions Made

1. **Animation Hooks**: Extract shared logic, don't use factory pattern (React hooks rules)
2. **Schedule Type Ternaries**: Keep as-is (simple enough, introducing helper may reduce clarity)
3. **CountdownBar Platform Logic**: Optional refactor (low priority)
4. **Constants**: Group by domain (TIME_CONSTANTS, ISLAMIC_DAY) rather than flat structure
5. **Function Breakdown**: Prefer 4 focused functions over 1 large function (even if slightly more lines)

---

## Expected Timeline

- **Phase 1**: 30 minutes (safest, pure deletions)
- **Phase 2**: 45 minutes (refactoring with clear pattern)
- **Phase 3**: 45 minutes (pattern extraction)
- **Phase 4**: 60 minutes (careful - core logic changes)
- **Phase 5**: 45 minutes (documentation + QA)

**Total**: 3-4 hours

---

## Next Session Command

To continue this work in a new session:

```
I'm continuing the codebase cleanup task from the previous session.

Please read:
1. ai/features/codebase-cleanup-2026-01-20/plan.md (detailed implementation plan)
2. ai/features/codebase-cleanup-2026-01-20/handoff.md (this handoff document)

Start with Phase 1: Remove Unused Code using the Implementer agent as described in the handoff document.

I've granted full permissions - no need to ask before making changes.
```

---

## Notes

- User wants code to be **simpler** above all else - prefer readable code over clever abstractions
- User wants **large functions broken down** into smaller functions with good names
- User specifically mentioned caring about **comment correctness** (especially in types.ts)
- User wants **multiple QA reviews** to verify best practices
- No need to ask for permission at any point (full permissions granted)
- Follow patterns from ai/AGENTS.md - "Consistency > Cleverness"
