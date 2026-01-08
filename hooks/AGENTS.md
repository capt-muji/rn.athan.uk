# HOOKS DIRECTORY

**Purpose:** 4 custom React hooks for schedule, prayer, notification, and animation logic

---

## OVERVIEW
Custom React hooks providing reusable logic for schedules, individual prayer data, notification handling, and Reanimated animations.

---

## WHERE TO LOOK

| Hook | Purpose | Returns/Handles |
|-------|---------|-----------------|
| `useSchedule` | Access schedule data and mute states | scheduleAtom, standard/extra schedules, mute toggle handlers |
| `usePrayer` | Individual prayer state detection | passed/next/upcoming flags, prayer data, click handlers |
| `useNotification` | Permission + preference handling | notification permission, alert/mute change handlers |
| `useAnimation` | Reusable Reanimated hooks | useAnimationColor, useAnimationOpacity, useAnimationScale, useAnimationBounce, etc. |

---

## CONVENTIONS

- **Named exports only** - All hooks use named exports
- **No default exports** - Consistent with stores/shared pattern
- **Type-safe hooks** - All parameters and returns typed
- **Reanimated integration** - All animation hooks use worklet-optimized Reanimated

---

## NOTES
- useAnimation provides centralized animation config (duration, easing) across all components
- Hooks follow pattern: extract logic from components into reusable functions
