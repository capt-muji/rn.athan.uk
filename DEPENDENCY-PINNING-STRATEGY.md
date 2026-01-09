# Dependency Pinning Strategy

**Adopted**: Jan 2026 (Post-SDK 54 Migration)
**Rationale**: Prevent breaking changes from automatic patch/minor updates
**Status**: All dependencies pinned to exact versions

---

## Philosophy

This project pins ALL dependencies to exact versions (no `^`, `~`, or `@latest`).

### Why?
1. **Reproducible builds** - Same code = same dependencies everywhere
2. **Explicit upgrades** - Developers choose when to update
3. **Stability** - No surprise breaking changes in CI/CD
4. **Mobile-specific** - Native modules (MMKV, Reanimated) change frequently

### Trade-off
- ❌ Won't get automatic security patches
- ✅ Must manually review and test upgrades
- ✅ Full control over when breaking changes happen

---

## Current Locked Versions

### Core Framework
```json
{
  "expo": "54.0.31",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "typescript": "5.9.3"
}
```

### State Management & Storage
```json
{
  "jotai": "2.16.1",
  "react-native-mmkv": "4.1.1",
  "react-native-nitro-modules": "0.32.1"
}
```

### UI & Animation
```json
{
  "react-native-reanimated": "4.1.6",
  "react-native-gesture-handler": "2.28.0",
  "@gorhom/bottom-sheet": "5.2.8",
  "react-native-pager-view": "6.9.1",
  "react-native-safe-area-context": "5.6.2",
  "react-native-screens": "4.16.0",
  "react-native-svg": "15.12.1"
}
```

### Expo Modules
```json
{
  "expo-audio": "1.1.1",
  "expo-asset": "12.0.12",
  "expo-constants": "18.0.13",
  "expo-dev-client": "6.0.20",
  "expo-font": "14.0.10",
  "expo-haptics": "15.0.8",
  "expo-intent-launcher": "13.0.8",
  "expo-linear-gradient": "15.0.8",
  "expo-linking": "8.0.11",
  "expo-notifications": "0.32.16",
  "expo-router": "6.0.21",
  "expo-splash-screen": "31.0.13",
  "expo-status-bar": "3.0.9",
  "expo-system-ui": "6.0.9",
  "expo-updates": "29.0.16"
}
```

### Dev Dependencies
```json
{
  "@babel/core": "7.28.5",
  "@types/node": "22.19.3",
  "@types/react": "19.1.17",
  "eslint": "9.39.2",
  "eslint-plugin-import": "2.32.0",
  "eslint-plugin-unused-imports": "4.3.0",
  "husky": "8.0.3",
  "lint-staged": "15.5.2",
  "pino": "9.14.0",
  "pino-pretty": "13.1.3",
  "prettier": "3.7.4",
  "react-native-svg-transformer": "1.5.2",
  "typescript-eslint": "8.52.0"
}
```

---

## Upgrade Process

When you want to upgrade a package:

### Step 1: Research
```bash
# Check what's new
npm view <package> versions --json | tail -20

# Read changelog
# Visit package GitHub/docs
```

### Step 2: Update package.json
Edit `package.json` with exact new version:

```json
{
  "react-native": "0.82.0"  // Change from 0.81.5
}
```

**Don't use**:
- `^0.82.0` - Allows 0.82.x (breaking changes possible)
- `~0.82.0` - Allows 0.82.0-0.82.99 (breaking changes possible)
- `0.82` - Invalid, use exact version

### Step 3: Clean Install
```bash
yarn clean  # Removes node_modules, yarn.lock, etc
yarn install
```

### Step 4: TypeScript Check
```bash
npx tsc --noEmit
```

Fix any type errors before proceeding.

### Step 5: Build Test
```bash
# iOS
yarn ios

# Android
yarn android
```

Both must compile successfully.

### Step 6: Feature Testing

Test the entire app manually:
- [ ] App starts without errors
- [ ] Prayer times display
- [ ] Timer counts down
- [ ] Notifications schedule
- [ ] Audio plays
- [ ] Settings work
- [ ] No console errors

### Step 7: Commit
```bash
git add package.json yarn.lock
git commit -m "chore: upgrade <package> from X.Y.Z to A.B.C

- <breaking change 1>
- <breaking change 2>
- <improvement>"
```

---

## Major Package Upgrade Paths

### React Upgrades
React major versions often change event types and hooks APIs.

**Check for**:
- Event type changes (e.g., `React.ChangeEvent`)
- Hook deprecations
- New concurrent features

**Testing priority**: Medium
**Risk**: Medium (TypeScript catches most issues)

### React Native Upgrades
RN is the most volatile. Every minor version has potential breaking changes.

**Check for**:
- New architecture implications
- Native module compatibility
- Platform-specific behaviors

**Testing priority**: HIGH
**Risk**: HIGH (test on both iOS and Android)

### Expo Upgrades
Expo upgrades typically require SDK-wide compatibility.

**Check for**:
- SDK changelog
- New required config in `app.json`
- Plugin changes
- Notification API changes

**Testing priority**: HIGH
**Risk**: HIGH (entire app infrastructure)

### MMKV Upgrades
MMKV v3→v4 was major breaking change. Watch for v5.

**Check for**:
- Constructor changes
- API method changes
- Nitro Module implications

**Testing priority**: HIGH
**Risk**: HIGH (all data persistence depends on it)

### Reanimated Upgrades
Reanimated impacts animation system across app.

**Check for**:
- Style prop typing changes
- Animation API changes
- Performance implications

**Testing priority**: HIGH
**Risk**: Medium (affects animations, not core logic)

---

## When NOT to Upgrade

Skip upgrade if:

1. **Release is very recent** (<2 weeks)
   - Bugs haven't been discovered yet
   - Community hasn't tested thoroughly

2. **Known critical issues**
   - Check GitHub issues
   - Look for "critical" or "blocker" labels

3. **Your features work fine**
   - Don't upgrade "just because"
   - If it's not broken, don't fix it

4. **Next major release coming soon**
   - Wait for stability
   - Avoid chasing beta versions

---

## Security Patch Exceptions

If a critical security vulnerability is discovered:

1. **Read the advisory**
   - Understand what's vulnerable
   - Check if your use case is affected

2. **Upgrade to patch version only**
   ```json
   {
     "package": "X.Y.Z"  // Only patch number changes
   }
   ```

3. **Do quick testing**
   - Run TypeScript check
   - Quick manual test
   - Don't need exhaustive testing for patches

4. **Deploy ASAP**
   - Security patches are urgent

---

## Tools for Finding Updates

```bash
# See outdated packages
yarn outdated

# See security vulnerabilities
yarn audit

# Check compatibility
npm view <package> peerDependencies
```

---

## Common Upgrade Scenarios

### Scenario 1: Minor version bump (low risk)
```
react-native: 0.81.5 → 0.81.6
```
✅ Safe to upgrade - patch fixes only
- Quick test, deploy

### Scenario 2: Minor version bump (medium risk)
```
expo: 54.0.31 → 54.1.0
```
⚠️ Moderate risk - new features, possible deprecations
- Full testing cycle required
- Review changelog carefully

### Scenario 3: Major version bump (high risk)
```
react: 19.1.0 → 20.0.0
```
🔴 High risk - breaking changes likely
- Expect TypeScript errors
- Full feature testing
- May need code refactoring

### Scenario 4: Native module upgrade
```
react-native-mmkv: 4.1.1 → 4.2.0
```
🔴 High risk - native code changes
- Test on actual devices if possible
- Data persistence must work
- Storage migration if needed

---

## Maintenance Schedule (Suggested)

| Frequency | Task |
|-----------|------|
| Monthly | Check `yarn audit` for security |
| Quarterly | Review `yarn outdated` for patches |
| Quarterly | Evaluate minor version upgrades |
| Yearly | Plan major version upgrades |

---

## Rollback Plan

If an upgrade breaks things:

```bash
# 1. Revert package.json
git checkout package.json

# 2. Reinstall previous version
yarn install

# 3. Verify it works
yarn ios

# 4. Debug the issue
# (Don't upgrade until cause is understood)

# 5. Report bug if it's a package issue
# (Create GitHub issue with details)
```

---

## Why This Approach?

This project's pinning strategy is different from most web projects because:

1. **Mobile builds are slower** - Can't iterate as quickly
2. **Native modules matter** - MMKV, Reanimated touch native code
3. **Breaking changes are frequent** - React Native ecosystem is volatile
4. **Users depend on stability** - Prayer times app must be reliable

By pinning versions, we trade continuous updates for stability and predictability.

---

## See Also

- `SDK-54-BREAKING-CHANGES.md` - Detailed breaking changes from last upgrade
- `MIGRATION-EXPO-AUDIO.md` - Example of migrating deprecations
- `package.json` - Current locked versions
- `yarn.lock` - Exact transitive dependencies

