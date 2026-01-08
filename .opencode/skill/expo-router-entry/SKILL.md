---
name: expo-router-entry
description: Expo Router file-based routing entry patterns for prayer times app with PagerView navigation
license: MIT
compatibility: opencode
metadata:
  audience: developers
  tech: "expo-router, react-native, pager-view"
---

# Expo Router Entry Patterns

## What I do

I guide you through the unique Expo Router entry point architecture used in this prayer times app. This project uses **no traditional App.tsx** - instead, file-based routing with a custom initialization flow.

## Entry Point Flow

### 1. Package.json Entry
```json
{
  "main": "expo-router/entry"
}
```

### 2. Root Layout (`app/_layout.tsx`)
**First component rendered:**
```typescript
// Triggers background sync immediately
setTimeout(triggerSyncLoadable, 0);

// Wraps app with providers
<GestureHandlerRootView>
  <BottomSheetModalProvider>
    <Slot />  // Expo Router outlet
  </BottomSheetModalProvider>
</GestureHandlerRootView>
```

**Key responsibilities:**
- Prevent splash screen auto-hide
- Trigger async data sync
- Set up gesture handlers
- Configure BottomSheet modals
- Render hidden `InitialWidthMeasurement` for layout calculation

### 3. Index Page (`app/index.tsx`)
**Main app component:**
```typescript
// Wait for sync to complete
const syncState = useAtomValue(syncLoadable);

if (syncState === 'loading') return <LoadingSpinner />;
if (syncState === 'hasError') return <Error />;

// Render modal stack → Navigation
return (
  <>
    <ModalUpdate />
    <ModalTips />
    <ModalTimesExplained />
    <Overlay />
    <Navigation />
  </>
);
```

**Modal rendering order matters:**
1. ModalUpdate (app version check)
2. ModalTips (first-time tips)
3. ModalTimesExplained (prayer info)
4. Overlay (full-screen prayer details)
5. Navigation (main content)

### 4. Navigation (`app/Navigation.tsx`)
**PagerView 2-page system:**
```typescript
<PagerView>
  <Screen type={ScheduleType.Standard} />
  <Screen type={ScheduleType.Extra} />
</PagerView>
```

**NOT using Expo Router tabs** - Custom PagerView for horizontal swipe.

### 5. Screen (`app/Screen.tsx`)
**Reusable page component:**
```typescript
<Screen type={ScheduleType.Standard}>
  <Timer />
  <Day />
  <List />
  <Mute />
</Screen>
```

## Unique Patterns

### No Traditional App.tsx
**Never create:** `App.tsx` or `index.ts` at root

**Use instead:**
- `app/_layout.tsx` - Root providers + sync trigger
- `app/index.tsx` - Main entry point

### Background Sync Trigger
**Pattern: Defer sync to next tick:**
```typescript
// ✅ CORRECT - allows layout to mount first
setTimeout(triggerSyncLoadable, 0);

// ❌ WRONG - blocks layout rendering
triggerSyncLoadable();
```

### Splash Screen Handling
```typescript
// ✅ CORRECT - manual control
SplashScreen.preventAutoHideAsync();
// ... layout mount
useLayoutEffect(() => {
  SplashScreen.hideAsync();
}, []);
```

### Modal Stack Order
**Order enforced by rendering sequence in index.tsx:**
```typescript
// Update → Tips → TimesExplained → Overlay → Navigation
<>
  <ModalUpdate />        {/* Bottom priority */}
  <ModalTips />
  <ModalTimesExplained />
  <Overlay />
  <Navigation />        {/* Top priority */}
</>
```

### PagerView Instead of Expo Router Tabs
**This project intentionally avoids Expo Router's built-in tabs:**

**❌ Wrong:**
```typescript
<Tabs>
  <Tabs.Screen name="standard" />
  <Tabs.Screen name="extra" />
</Tabs>
```

**✅ Correct:**
```typescript
<PagerView>
  <View>
    <Screen type={ScheduleType.Standard} />
  </View>
  <View>
    <Screen type={ScheduleType.Extra} />
  </View>
</PagerView>
```

**Why:** Custom animated dot indicators + page position tracking in Jotai atom.

## When to Use Me

Use this skill when:
- Adding new screens to `app/`
- Modifying the initialization flow
- Changing modal rendering order
- Understanding why sync doesn't run
- Adding new modals or popups

## File Locations

| File | Purpose | Key Patterns |
|------|---------|---------------|
| `app/_layout.tsx` | Root layout + providers | GestureHandler, BottomSheet, sync trigger |
| `app/index.tsx` | Main entry + modal stack | Wait for sync, render modals |
| `app/Navigation.tsx` | PagerView navigation | 2 pages, animated dots |
| `app/Screen.tsx` | Reusable page | Timer, Day, List, Mute |

## Common Tasks

### Add New Screen
```typescript
// 1. Create app/NewScreen.tsx
export default function NewScreen({ type }: { type: ScheduleType }) {
  return <YourContent type={type} />;
}

// 2. Add to app/Navigation.tsx
<PagerView>
  <Screen type={ScheduleType.Standard} />
  <Screen type={ScheduleType.Extra} />
  <Screen type={ScheduleType.NewType} />  {/* Add here */}
</PagerView>
```

### Add New Modal
```typescript
// 1. Create components/ModalNew.tsx
export default function ModalNew() {
  // Modal logic
}

// 2. Add to app/index.tsx
return (
  <>
    <ModalUpdate />
    <ModalTips />
    <ModalTimesExplained />
    <ModalNew />  {/* Add here */}
    <Overlay />
    <Navigation />
  </>
);
```

### Modify Sync Flow
```typescript
// Edit app/_layout.tsx
useEffect(() => {
  // Add new initialization here
  setTimeout(triggerSyncLoadable, 0);
}, []);
```

## Anti-Patterns to Avoid

### 1. Creating App.tsx
```typescript
// ❌ WRONG - not used in this project
export default function App() {
  return <YourApp />;
}

// ✅ CORRECT - use Expo Router file-based routing
// app/_layout.tsx for providers
// app/index.tsx for main entry
```

### 2. Synchronous Sync Trigger
```typescript
// ❌ WRONG - blocks layout rendering
triggerSyncLoadable();

// ✅ CORRECT - defer to next tick
setTimeout(triggerSyncLoadable, 0);
```

### 3. Using Expo Router Tabs
```typescript
// ❌ WRONG - this project uses PagerView
import { Tabs } from 'expo-router';

// ✅ CORRECT - use custom PagerView
import PagerView from 'react-native-pager-view';
```

## Notes

- Entry point defined in package.json: `"main": "expo-router/entry"`
- No traditional App.tsx or index.ts at root
- PagerView used instead of Expo Router tabs
- Modal rendering order affects z-index/visibility
- Background sync deferred to avoid blocking layout mount
- Splash screen manually controlled (no auto-hide)
