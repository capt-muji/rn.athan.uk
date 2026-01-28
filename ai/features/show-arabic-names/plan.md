# Show Arabic Names - Implementation Plan

**Created:** 2026-01-23
**Status:** Ready for Review
**Complexity:** Small

---

## Overview

Add a settings toggle to show/hide Arabic prayer names. The toggle should be ON by default. When toggled, both the main prayer list and overlay must update immediately without layout misalignment.

## Key Insight: Layout Preservation

The Prayer.tsx layout uses `flex: 1` for the Arabic column. To prevent layout shifts:

- **DO NOT** conditionally render the Arabic `<Animated.Text>` element
- **DO** render the element but with empty string when disabled

This ensures:

1. The `flex: 1` space is always reserved
2. Overlay and main list have identical layouts
3. No measurement recalculation needed

---

## Task Breakdown

### Task 1: Add Atom to stores/ui.ts

**Objective:** Add persisted boolean atom for the setting

**Acceptance Criteria:**

- Atom named `showArabicNamesAtom`
- Storage key: `preference_show_arabic_names`
- Default value: `true` (ON by default)

**Files:**

- `stores/ui.ts` - Add atom after `showTimePassedAtom`

**Complexity:** Small

---

### Task 2: Update Prayer.tsx to Conditionally Display Arabic

**Objective:** Hide Arabic text when setting is OFF, preserving layout

**Acceptance Criteria:**

- Import and use `showArabicNamesAtom`
- Render Arabic element with empty string when disabled
- DO NOT conditionally render the element itself (preserves flex layout)
- Works in both overlay and non-overlay modes

**Files:**

- `components/Prayer.tsx`

**Implementation:**

```typescript
const showArabicNames = useAtomValue(showArabicNamesAtom);

// In render:
<Animated.Text style={[styles.text, styles.arabic, AnimColor.style]}>
  {showArabicNames ? Prayer.arabic : ''}
</Animated.Text>
```

**Complexity:** Small

---

### Task 3: Add Toggle to BottomSheetSettings.tsx

**Objective:** Add UI toggle for the setting

**Acceptance Criteria:**

- Import `showArabicNamesAtom` from stores/ui
- Add `useAtom` hook for the setting
- Add SettingsToggle after "Show time passed" toggle
- Label: "Show arabic names"

**Files:**

- `components/BottomSheetSettings.tsx`

**Implementation:**

```typescript
const [showArabicNames, setShowArabicNames] = useAtom(showArabicNamesAtom);

// After "Show time passed" toggle:
<SettingsToggle
  label="Show arabic names"
  value={showArabicNames}
  onToggle={() => setShowArabicNames(!showArabicNames)}
/>
```

**Complexity:** Small

---

### Task 4: Manual Testing & Verification

**Objective:** Verify all scenarios work correctly

**Test Cases:**

- [ ] Toggle ON: Arabic names visible in Standard list
- [ ] Toggle ON: Arabic names visible in Extra list
- [ ] Toggle OFF: Arabic names hidden in Standard list
- [ ] Toggle OFF: Arabic names hidden in Extra list
- [ ] Overlay open + toggle setting: Overlay updates immediately
- [ ] No layout shift when toggling (English column stays aligned)
- [ ] Setting persists after app restart
- [ ] Overlay shows correct state after restart

**Complexity:** Small

---

## File Modification Summary

| File                                 | Change Type | Description                    |
| ------------------------------------ | ----------- | ------------------------------ |
| `stores/ui.ts`                       | Modified    | Add `showArabicNamesAtom`      |
| `components/Prayer.tsx`              | Modified    | Conditionally show Arabic text |
| `components/BottomSheetSettings.tsx` | Modified    | Add toggle                     |

---

## Risks & Mitigations

| Risk                 | Mitigation                                     |
| -------------------- | ---------------------------------------------- |
| Layout shift         | Use empty string, not conditional rendering    |
| Overlay misalignment | Same Prayer component used everywhere          |
| Stale state          | Jotai reactivity handles updates automatically |

---

## Rollback Strategy

If issues found:

1. Remove toggle from BottomSheetSettings.tsx
2. Remove conditional from Prayer.tsx
3. Remove atom from stores/ui.ts
4. Clear `preference_show_arabic_names` from MMKV if needed

---

## Success Criteria

- [ ] Setting toggle appears in settings
- [ ] Default is ON (Arabic visible)
- [ ] Toggle OFF hides Arabic in all lists
- [ ] Overlay respects setting
- [ ] No layout shift or misalignment
- [ ] Setting persists across restarts
