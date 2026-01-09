# Documentation Index

Quick navigation for all project documentation. Start here if you're new to this codebase.

---

## 🚀 Start Here (New Developers/Agents)

**First read these in order:**

1. **[README.md](./README.md)** - Project overview, features, setup instructions
2. **[CLAUDE.md](./CLAUDE.md)** - Architecture guide for AI agents (commands, patterns, conventions)
3. **[AGENTS.md](./AGENTS.md)** - Comprehensive agentic knowledge base (where to look, critical patterns)

---

## 📚 Reference Documentation

### Architecture & Patterns
- **[CLAUDE.md](./CLAUDE.md)** - AI agent guide (commands, architecture, storage keys)
- **[AGENTS.md](./AGENTS.md)** - Deep architecture reference (data flow, state management, conventions)
- **[README.md](./README.md)** - User-facing documentation (features, tech stack, setup)

### Recent Changes
- **[MIGRATION-SUMMARY.md](./MIGRATION-SUMMARY.md)** - SDK 54 migration overview (START HERE for migration context)
- **[SDK-54-BREAKING-CHANGES.md](./SDK-54-BREAKING-CHANGES.md)** - All breaking changes & fixes
- **[MIGRATION-EXPO-AUDIO.md](./MIGRATION-EXPO-AUDIO.md)** - expo-av → expo-audio guide
- **[UPGRADE-PLAN.md](./UPGRADE-PLAN.md)** - Archived upgrade plan (completed)

### Dependency Management
- **[DEPENDENCY-PINNING-STRATEGY.md](./DEPENDENCY-PINNING-STRATEGY.md)** - How to upgrade packages safely
- **[package.json](./package.json)** - All locked dependencies

---

## 🐛 Bug Documentation

### Active Issues
- **[BUG-2-ANALYSIS.md](./BUG-2-ANALYSIS.md)** - Double notification analysis
- **[BUG-2-TESTING-PLAN.md](./BUG-2-TESTING-PLAN.md)** - Testing approach
- **[BUG-2-TESTING-INSTRUCTIONS.md](./BUG-2-TESTING-INSTRUCTIONS.md)** - How to test
- **[BUG-2-FIX-SUMMARY.md](./BUG-2-FIX-SUMMARY.md)** - Fix summary
- **[BUG-3-ANALYSIS.md](./BUG-3-ANALYSIS.md)** - Android timing analysis
- **[BUG-3-RE-ANALYSIS.md](./BUG-3-RE-ANALYSIS.md)** - Re-analysis
- **[BUG-3-FIX-PLAN.md](./BUG-3-FIX-PLAN.md)** - Fix plan
- **[BUG-3-FIX-SUMMARY.md](./BUG-3-FIX-SUMMARY.md)** - Fix summary
- **[BUG-3-IMPLEMENTATION-COMPLETE.md](./BUG-3-IMPLEMENTATION-COMPLETE.md)** - Implementation
- **[BUG-3-QUICK-SUMMARY.md](./BUG-3-QUICK-SUMMARY.md)** - Quick summary

---

## 📖 Quick Reference by Task

### "I need to upgrade a package"
1. Read: `DEPENDENCY-PINNING-STRATEGY.md`
2. Check: `SDK-54-BREAKING-CHANGES.md` for patterns
3. Update: `package.json` with exact version
4. Test: Both iOS and Android
5. Document: Update relevant docs

### "I need to understand the architecture"
1. Read: `CLAUDE.md` (overview)
2. Read: `AGENTS.md` (deep dive)
3. Read: `README.md` (user perspective)

### "I need to work on audio/notifications"
1. Read: `MIGRATION-EXPO-AUDIO.md` (audio patterns)
2. Read: `SDK-54-BREAKING-CHANGES.md` (notification fixes)
3. Check: `shared/notifications.ts` (implementation)
4. Check: `components/BottomSheetSoundItem.tsx` (audio player)

### "I need to fix a bug"
1. Check: BUG-X-ANALYSIS.md files
2. Read: `AGENTS.md` (where to look)
3. Review: Recent migration docs (SDK-54-BREAKING-CHANGES.md)

### "What changed in the last migration?"
1. Read: `MIGRATION-SUMMARY.md` (START HERE)
2. Read: `SDK-54-BREAKING-CHANGES.md` (details)
3. Read: `MIGRATION-EXPO-AUDIO.md` (audio specifics)
4. Check: `UPGRADE-PLAN.md` (archived plan)

---

## 📂 File Organization

```
Root Documentation (19 .md files)
├── Core Documentation
│   ├── README.md                           # Project overview
│   ├── CLAUDE.md                           # AI agent guide
│   ├── AGENTS.md                           # Architecture knowledge base
│   └── LICENSE.md                          # License
│
├── Migration Documentation (SDK 54)
│   ├── MIGRATION-SUMMARY.md                # ⭐ Start here
│   ├── SDK-54-BREAKING-CHANGES.md          # All fixes
│   ├── MIGRATION-EXPO-AUDIO.md             # Audio migration
│   └── UPGRADE-PLAN.md                     # Archived plan
│
├── Dependency Management
│   ├── DEPENDENCY-PINNING-STRATEGY.md      # How to upgrade
│   └── package.json                        # Locked versions
│
└── Bug Documentation
    ├── BUG-2-*.md (5 files)                # Double notifications
    └── BUG-3-*.md (6 files)                # Android timing
```

---

## 🎯 Common Scenarios

### Scenario: "App won't build after yarn install"
1. Check `package.json` - all versions pinned?
2. Run `yarn clean` then `yarn install`
3. Check TypeScript: `npx tsc --noEmit`
4. If still failing, see `SDK-54-BREAKING-CHANGES.md`

### Scenario: "Notification not playing sound"
1. Check `shared/notifications.ts` - sound field is `false` or string?
2. See `SDK-54-BREAKING-CHANGES.md` section 2
3. Test with both "Silent" and "Sound" alert types

### Scenario: "Audio player not working"
1. Check using `useAudioPlayer` + `useAudioPlayerStatus` hooks?
2. See `MIGRATION-EXPO-AUDIO.md` for correct pattern
3. Check `components/BottomSheetSoundItem.tsx` implementation

### Scenario: "MMKV error on startup"
1. Using `createMMKV()` not `new MMKV()`?
2. Using `.remove()` not `.delete()`?
3. See `SDK-54-BREAKING-CHANGES.md` section 1

---

## 📝 Documentation Maintenance

### When to Update Documentation

**After any major change:**
- Update `CLAUDE.md` if architecture changes
- Update `AGENTS.md` if patterns change
- Update `README.md` if features change
- Create `MIGRATION-*.md` if migrating major packages

**After SDK upgrade:**
- Create/update `SDK-XX-BREAKING-CHANGES.md`
- Update `MIGRATION-SUMMARY.md`
- Update `CLAUDE.md` and `AGENTS.md` versions
- Update `README.md` tech stack

**After bug fix:**
- Update relevant `BUG-X-*.md` files
- Mark as resolved in `README.md` if fixed

### Documentation Standards

1. **Use clear headings** - Makes navigation easy
2. **Include examples** - Show don't tell
3. **Link related docs** - Cross-reference
4. **Date major changes** - Track when things happened
5. **Keep it current** - Outdated docs are worse than no docs

---

## 🔗 External Resources

- [Expo SDK 54 Docs](https://docs.expo.dev/)
- [React Native 0.81 Docs](https://reactnative.dev/)
- [MMKV v4 Docs](https://github.com/mrousavy/react-native-mmkv)
- [expo-audio Docs](https://docs.expo.dev/versions/latest/sdk/audio/)
- [Jotai Docs](https://jotai.org/)

---

## 💡 Tips for Working with This Codebase

1. **Always read CLAUDE.md first** - It's optimized for quick orientation
2. **Check migration docs** - Lots of lessons learned documented
3. **All versions are pinned** - No automatic updates, must upgrade manually
4. **Test on both platforms** - iOS and Android can behave differently
5. **Update docs as you go** - Future you will thank present you

---

## 🎓 Learning Path

**New to the codebase? Read in this order:**

1. README.md (30 min) - Get the big picture
2. CLAUDE.md (20 min) - Understand architecture
3. MIGRATION-SUMMARY.md (15 min) - See what recently changed
4. AGENTS.md (30 min) - Deep dive into patterns
5. SDK-54-BREAKING-CHANGES.md (20 min) - Learn from recent fixes

**Total: ~2 hours to become productive**

---

## 📊 Documentation Stats

- **Total markdown files**: 19
- **Migration docs**: 4
- **Bug analysis docs**: 11
- **Architecture docs**: 3
- **Other**: 1
- **Last major update**: Jan 9, 2026 (SDK 54 migration)

---

## ✅ Quick Checks

Before starting work:
- [ ] Read `CLAUDE.md` for current state
- [ ] Check `MIGRATION-SUMMARY.md` for recent changes
- [ ] Review `package.json` for locked versions
- [ ] Check BUG-X docs for known issues

Before upgrading packages:
- [ ] Read `DEPENDENCY-PINNING-STRATEGY.md`
- [ ] Review `SDK-54-BREAKING-CHANGES.md`
- [ ] Test on iOS
- [ ] Test on Android
- [ ] Update documentation

---

**Last Updated**: Jan 9, 2026 (Post SDK 54 Migration)

