Read ai/AGENTS.md and begin as Implementer.

# Documentation Session

## Phase 1: Scope Definition

**STOP.** Ask me:

1. "What should I document?" Options:
   - **File** - Specific file(s)
   - **Folder** - All exports in a folder
   - **Exports** - All public exports missing JSDoc
   - **README** - Update README.md

Wait for my response.

## Phase 2: Audit Missing Documentation

For each file in scope:

1. **Scan all exports** (`export const`, `export function`, `export interface`)
2. **Check for JSDoc** - Must have description, @param, @returns
3. **Check complex logic** - Functions >20 lines need inline comments
4. **Check section headers** - Files >100 lines need section organization

Report:

```
FILE: path/to/file.ts
Exports: 8 total, 3 missing JSDoc
- Line 25: calculateTime (missing)
- Line 45: formatDate (missing)
- Line 80: parseInput (missing)
Complex functions needing comments: 2
```

## Phase 3: Add Documentation

For each missing item, add JSDoc following this pattern:

```typescript
/**
 * Brief one-line description
 *
 * Longer description if needed (when, why, edge cases).
 *
 * @param paramName - Description of parameter
 * @param options - Configuration options
 * @returns Description of return value
 *
 * @example
 * const result = myFunction('input');
 * // result: 'output'
 *
 * @see relatedFunction - For related functionality
 */
```

**Rules:**

- First line: Brief description (imperative: "Calculates...", not "This calculates...")
- @param: Describe purpose, not just type
- @returns: Describe what's returned, not just type
- @example: Include for complex functions
- @see: Link related functions/ADRs

## Phase 4: Section Headers

For files >100 lines, add section organization:

```typescript
// =============================================================================
// IMPORTS & TYPES
// =============================================================================

// =============================================================================
// HELPERS (PRIVATE)
// =============================================================================

// =============================================================================
// MAIN EXPORTS
// =============================================================================
```

## Phase 5: README Updates (if applicable)

If documenting features, check README.md:

- Is feature listed in Features section?
- Is usage documented?
- Are any commands outdated?

## Phase 6: Verify

1. Run `yarn validate`
2. Report: "Documentation complete. Added JSDoc to X exports, Y inline comments."

## Quick Reference - JSDoc Examples

**Simple function:**

```typescript
/**
 * Formats a date string for display
 * @param date - Date in YYYY-MM-DD format
 * @returns Formatted date (e.g., "Fri, 23 Jan 2026")
 */
```

**Function with options:**

```typescript
/**
 * Calculates prayer time with optional adjustments
 * @param time - Base time in HH:mm format
 * @param options - Adjustment options
 * @param options.offset - Minutes to add/subtract
 * @param options.roundUp - Round to next minute
 * @returns Adjusted time in HH:mm format
 */
```

**React hook:**

```typescript
/**
 * Hook for managing prayer countdown state
 *
 * Provides current countdown value and formatting.
 * Updates every second when mounted.
 *
 * @returns Countdown state and controls
 *
 * @example
 * const { seconds, formatted } = useCountdown();
 */
```

**Interface:**

```typescript
/**
 * Prayer time configuration
 * @property english - English prayer name
 * @property arabic - Arabic prayer name (RTL)
 * @property time - Time in HH:mm format
 */
export interface Prayer { ... }
```
