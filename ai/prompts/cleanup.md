Read ai/AGENTS.md and begin as ReviewerQA.

# Code Cleanup & Refactoring Session

## Phase 1: Scope Definition

**STOP.** Ask me:

1. "What files or areas should I focus on?" (e.g., 'shared/', 'components/Alert.tsx', 'all hooks')
2. "What type of cleanup?" Options:
   - **DRY** - Remove duplication, extract helpers
   - **Simplify** - Reduce complexity, flatten logic
   - **Document** - Add JSDoc, comments, section headers
   - **Format** - Fix formatting, imports, naming
   - **Full** - All of the above

Wait for my response.

## Phase 2: Audit

For each file in scope:

1. **Read the file completely**
2. **Check against AGENTS.md patterns** (section 4, 8)
3. **Identify issues by category:**

   **DRY Violations:**
   - Duplicated code blocks
   - Repeated patterns that could be helpers
   - Copy-pasted logic

   **Complexity Issues:**
   - Nested conditionals (>2 levels)
   - Long functions (>50 lines)
   - Mixed concerns in single function

   **Documentation Gaps:**
   - Missing JSDoc on exports
   - Complex logic without comments
   - Missing section headers

   **Format Issues:**
   - Inconsistent naming
   - Wrong import order
   - Unused imports/variables

4. **Report findings** in format:
   ```
   FILE: path/to/file.ts
   - [DRY] Lines 45-60: Duplicated date parsing, extract helper
   - [SIMPLIFY] Lines 80-120: Nested ternary, flatten to if/else
   - [DOCUMENT] Line 25: Export missing JSDoc
   ```

## Phase 3: Fix

For each issue:

1. **Apply fix** following AGENTS.md patterns
2. **Run file-scoped check**: `npx eslint [file] && npx prettier --write [file]`
3. **Verify no regressions**: If file has tests, run them

## Phase 4: Verify

1. Run `yarn validate`
2. List all changes made
3. Confirm: "Cleanup complete. X issues fixed across Y files."

## Quick Reference - Common Cleanups

**Extract Helper:**

```typescript
// Before (duplicated)
const hours1 = time1.split(':')[0];
const hours2 = time2.split(':')[0];

// After (extracted)
const getHours = (time: string) => time.split(':')[0];
const hours1 = getHours(time1);
const hours2 = getHours(time2);
```

**Add Section Comments:**

```typescript
// =============================================================================
// SECTION NAME
// =============================================================================
```

**Flatten Nested Ternary:**

```typescript
// Before
const x = a ? b : c ? d : e;

// After
if (a) return b;
if (c) return d;
return e;
```

**Add JSDoc:**

```typescript
/**
 * Brief description
 * @param input - Description
 * @returns Description
 */
export const myFunc = (input: string): string => { ... };
```
