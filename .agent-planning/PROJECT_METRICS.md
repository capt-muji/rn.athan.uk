# PROJECT METRICS & ANALYSIS

**Generated:** 2025-01-08
**Project:** Athan.uk React Native Prayer Times App
**Branch:** main

---

## SCALE METRICS

| Metric | Value | Threshold | Additional Actions |
|---------|--------|------------|-------------------|
| **Total files** | 70 (excl node_modules) | >100 | - (Below threshold) |
| **Total TS/TSX lines** | 10,232 | >10k | - +1 agent needed |
| **Large files (>500 lines)** | 2 | >10 | - (Below threshold) |
| **Directory depth** | 8 | ≥4 | - +2 agents needed |
| **Subdirectories with >20 files** | 1 (components: 21) | - | - Documented |
| **Code languages** | TypeScript/TSX (primary), JSON, Bash | >1 | - +1 agent |

---

## DIRECTORY ANALYSIS

| Directory | Files | Type Files | Complexity Score | Action |
|-----------|---------|-------------|------------------|---------|
| `app/` | 4 | 4 TSX | 12 | CREATE ✅ |
| `api/` | 2 | 2 TS | 6 | SKIP |
| `components/` | 21 | 21 TSX | 21 | CREATE ✅ |
| `device/` | 4 | 4 TS | 12 | CREATE ✅ |
| `hooks/` | 4 | 4 TS | 8 | SKIP |
| `shared/` | 6 | 6 TS | 18 | CREATE ✅ |
| `stores/` | 8 | 8 TS | 16 | CREATE ✅ |
| `assets/` | 52 | - | 0 | SKIP |
| `mocks/` | 2 | 2 TS | 4 | SKIP |
| `errors/` | 2 | - | 0 | SKIP |

---

## DEPENDENCY COMPLEXITY

### Critical Dependencies (Monitor)
- `react-native-reanimated: "4.0.0-beta.2"` - Beta version, upgrade to stable
- `react-native-screens: "4.8.0"` - BUG-1: Prop type errors on iOS

### Stable Dependencies
- `expo: ^52.0.36` - Latest stable SDK
- `react-native: ~0.77.1` - Latest stable
- `jotai: ^2.12.1` - Stable state management
- `react-native-mmkv: ^3.2.0` - Stable storage

---

## CODE PATTERN ANALYSIS

### Import Distribution
- Path alias `@/*` usage: 216+ imports found
- Import order enforced via ESLint: 4 groups with blank lines
- External imports: React Native, Expo, Jotai, Reanimated

### State Management Distribution
- Jotai atoms: 20+ atoms across stores
- MMKV storage keys: 30+ keys
- React hooks: 4 custom hooks
- No React Context (verified pattern)

---

## TESTING COVERAGE

| Metric | Value |
|---------|--------|
| Test files | 0 |
| Test frameworks installed | 0 |
| Test scripts in package.json | 0 |
| Mock data files | 2 (simple.ts, full.ts) |

**Status:** NO TESTS CONFIGURED ❌

---

## PERFORMANCE INDICATORS

| Metric | Value | Assessment |
|---------|--------|------------|
| Bundle size (estimated) | ~2-3 MB | ✅ Good |
| Annual data cache | ~50 KB (365 days × 6 prayers) | ✅ Efficient |
| Storage key count | 30+ keys | ✅ Organized |
| Timer count | 4 concurrent timers | ✅ Acceptable |
| Notification buffer | 6 days rolling | ✅ Adequate |

---

## TECHNICAL DEBT

| Issue | Severity | File | Action Required |
|--------|-----------|-------|----------------|
| BUG-1: iOS simulator startup error | CRITICAL | errors/BUG-1_*.txt | Fix RN Screens/Reanimated compat |
| BUG-2: Double notifications | HIGH | device/notifications.ts | Investigate channel logic |
| BUG-3: Android delayed notifications | HIGH | device/notifications.ts | Fix exact alarm timing |
| TODO: Background task cleanup | MEDIUM | app/index.tsx:35 | Remove deregistration code |
| @ts-expect-error suppression | MEDIUM | app/_layout.tsx:23-26 | Fix Text defaultProps |
| JSON.parse without validation | MEDIUM | stores/storage.ts | Add try-catch + schema validation |
| Production logging disabled | LOW | shared/logger.ts | Add error tracking service |

---

## ARCHITECTURE COMPLEXITY

### Complexity Score: MEDIUM (6/10)

**Factors:**
- Multi-store state (Jotai) - High
- Custom storage layer (MMKV) - Medium
- Multi-timer system - Medium
- PagerView navigation (non-standard) - Low
- No Context providers - Simple

**Recommendation:** Consider consolidating stores if complexity grows

---

## MAINTENANCE INDEX

| Metric | Score | Status |
|---------|--------|--------|
| Code documentation | 7/10 | ✅ Good (AGENTS.md created) |
| Type safety | 9/10 | ✅ Excellent (strict mode) |
| Code consistency | 8/10 | ✅ Good (Prettier + ESLint) |
| Testing coverage | 0/10 | ❌ Critical gap |
| Error tracking | 2/10 | ⚠️ Needs improvement |

**Overall Maintenance Score: 5.2/10**

---

## ACTION ITEMS

### Immediate (This Sprint)
1. Fix BUG-1: iOS simulator build error
2. Remove TODO: Background task deregistration
3. Fix @ts-expect-error: Text defaultProps mutation

### Short-term (Next Sprint)
4. Investigate BUG-2: Double notifications
5. Investigate BUG-3: Android delayed notifications
6. Add JSON.parse validation in storage.ts

### Medium-term (Next Month)
7. Set up Jest testing framework
8. Add error tracking service (Sentry/Crashlytics)
9. Upgrade Reanimated to stable release

### Long-term (Next Quarter)
10. Evaluate state management complexity
11. Consider adding CI/CD with GitHub Actions
12. Investigate local builds to bypass EAS limits
