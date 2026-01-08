# APP - EXPO ROUTER ENTRY POINT

**Generated:** 2025-01-08
**Purpose:** Expo Router file-based routing with PagerView navigation

---

## OVERVIEW

Expo Router file-based routing entry using PagerView for 2-page horizontal navigation system.

---

## WHERE TO LOOK

| File             | Purpose                                                               |
| ---------------- | --------------------------------------------------------------------- |
| `_layout.tsx`    | Root layout: GestureHandler, BottomSheet, splash screen, sync trigger |
| `index.tsx`      | Main entry: wait for sync, render modal stack → Overlay → Navigation  |
| `Navigation.tsx` | PagerView wrapper with 2 pages + animated dot indicators              |
| `Screen.tsx`     | Individual page: Timer, Day, List, Mute composition                   |

---

## CONVENTIONS

**No traditional App.tsx** - Entry point defined in package.json as `"expo-router/entry"`

**Modal rendering order** (index.tsx):

1. ModalUpdate
2. ModalTips
3. ModalTimesExplained
4. Overlay
5. Navigation

**Component pattern**: Default exports only, no named exports

---

## ANTI-PATTERNS

**Lines 23-26 in `_layout.tsx`**: `@ts-expect-error` suppressing Text.defaultProps mutation (font scaling prevention)

**Line 35 in `index.tsx`**: `deregisterBackgroundFetchAsync(); // TODO: Remove` - deprecated background task cleanup (action required)
