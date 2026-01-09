# ATHAN.UK MAJOR UPGRADE PLAN

**Created:** 2026-01-09
**Completed:** 2026-01-09
**Status:** ✅ COMPLETED
**Final Versions:** Expo SDK 54.0.31 + React 19.1.0 + React Native 0.81.5
**Strategy:** Aggressive upgrade with full testing

---

## ✅ MIGRATION COMPLETED

All phases completed successfully. See `SDK-54-BREAKING-CHANGES.md` for detailed migration notes.

---

## ORIGINAL PLAN (ARCHIVED)

---

## 📊 VERSION MATRIX

### Core Framework Upgrade
| Package | Current | Target | Change |
|---------|---------|--------|--------|
| expo | 52.0.48 | 54.0.31 | 🔴 Major (+2) |
| react | 18.3.1 | 19.2.3 | 🔴 Major |
| react-native | 0.76.9 | 0.83.1 | 🔴 Major (+7 minor) |

### Deprecated Packages (MUST MIGRATE)
| Package | Current | Action |
|---------|---------|--------|
| expo-av | 15.0.2 | ❌ REMOVE → Use expo-audio |
| expo-background-fetch | 13.0.6 | ❌ REMOVE → DELETE tasks.ts |

### Major Package Upgrades
| Package | Current | Target | Breaking? |
|---------|---------|--------|-----------|
| react-native-mmkv | 3.3.3 | 4.1.1 | 🔴 Yes |
| react-native-pager-view | 6.5.1 | 8.0.0 | 🔴 Yes |
| react-native-safe-area-context | 4.12.0 | 5.6.2 | 🔴 Yes |
| expo-router | 4.0.22 | 6.0.21 | 🔴 Yes |
| expo-notifications | 0.29.14 | 0.32.16 | 🟡 Possible |
| expo-splash-screen | 0.29.24 | 31.0.13 | 🔴 Yes |
| react-native-reanimated | 4.0.0 | 4.2.1 | 🟢 No |

---

## 🚨 BREAKING CHANGES SUMMARY

### 1. MMKV v4 Changes
- `new MMKV()` → `createMMKV()`
- **Files affected**: `stores/database.ts`

### 2. expo-av → expo-audio
- `Audio.Sound.createAsync()` → `useAudioPlayer()` hook
- **Files affected**: `components/BottomSheetSoundItem.tsx`

### 3. expo-background-fetch Removal
- **Action**: DELETE `device/tasks.ts` entirely

---

## 📁 FILES REQUIRING CHANGES

### Must Modify
1. `stores/database.ts` - MMKV v4 migration
2. `components/BottomSheetSoundItem.tsx` - expo-audio migration
3. `app/index.tsx` - Remove background task import/call
4. `package.json` - All version updates

### Must Delete
1. `device/tasks.ts` - Deprecated background fetch code

---

## 🔄 EXECUTION PHASES

### Phase 1: Core Framework
```bash
npx expo install expo@latest
npx expo install --fix
```

### Phase 2: Delete Deprecated Code
- Delete device/tasks.ts
- Remove imports from app/index.tsx
- Remove expo-background-fetch

### Phase 3: MMKV v4 Migration
- Update stores/database.ts

### Phase 4: expo-audio Migration
- Replace expo-av with expo-audio
- Rewrite BottomSheetSoundItem.tsx

### Phase 5: Update All Other Packages
- All expo-* packages
- All react-native-* packages
- Dev dependencies

### Phase 6: Clean Rebuild
```bash
yarn clean && yarn install && npx expo prebuild --clean
```

### Phase 7: Fix & Test
- Fix TypeScript errors
- Test all features
