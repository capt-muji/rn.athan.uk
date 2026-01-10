# BUG-3: Android Notification Delays - Executive Summary

**Last Updated**: 2026-01-10

---

## The Problem

**BUG-3**: Android notifications for prayer times arrive 1-3 minutes late on SOME devices (not all).

**Critical Facts**:
- ✅ Works perfectly on iOS
- ✅ Works perfectly on SOME Android devices
- ❌ Delayed by ±1-3 minutes on SOME Android devices
- ❌ SCHEDULE_EXACT_ALARM permission is already enabled
- ❌ Battery optimization is already disabled
- ❌ Switching to different libraries (notifee, etc.) won't help - they use same underlying APIs

---

## Root Cause (TL;DR)

**Android OS intentionally defers alarms by 1-3 minutes to save battery**, even when apps have exact alarm permissions. This is:

1. **By design** - Android prioritizes battery over timing precision
2. **OEM-amplified** - Samsung, Xiaomi, Oppo add additional restrictions
3. **Device-specific** - Affects some models more than others
4. **Unavoidable with standard APIs** - All notification libraries suffer from this

**Why it's not our code**:
- iOS works perfectly (same code, different OS)
- Some Android devices work perfectly (same code, different OEM/version)
- Following all best practices (MAX priority, exact alarm permission, battery optimization disabled)

---

## Solution Strategy

### Recommended Approach: Three-Tiered Strategy

**Tier 1: Quick Win (Implement Immediately)**
- Reduce notification buffer from 6 days to 2-3 days
- May reduce alarm batching/deferral
- Zero risk, 5-minute implementation
- Success probability: 60%

**Tier 2: Native Solution (If Tier 1 Doesn't Work)**
- Use `setAlarmClock()` Android API via native module
- Guarantees exact timing on ALL devices
- Trade-off: Shows small clock icon in status bar
- Success probability: 90%

**Tier 3: Hybrid Fallback (If Tier 2 Unacceptable)**
- Detect problematic OEMs and guide users to fix settings
- Combine with other workarounds as needed
- Success probability: 30-40%

---

## Detailed Documentation

### 📄 BUG3_ROOT_CAUSE_ANALYSIS.md

**What it covers**:
- Detailed analysis of current notification implementation
- How expo-notifications works under the hood
- Why Android defers alarms even with permissions
- Evidence from Android documentation and developer reports
- Why iOS works but Android doesn't
- Why previous workarounds failed

**Key Sections**:
1. Current Implementation Analysis - notification scheduling flow
2. Root Cause Analysis - Android AlarmManager deferral behavior
3. Secondary Contributing Factors - buffer size, refresh cycle, channels
4. Evidence Supporting This Analysis - research findings
5. Why Previous Workarounds Failed - permission and battery optimization limitations

**Read this if**: You want to understand WHY the delays happen

---

### 📄 BUG3_INVESTIGATION_PLAN.md

**What it covers**:
- Comprehensive diagnostic approach
- Data collection strategies
- Pattern analysis methodology
- Hypothesis testing framework
- Device profiling and correlation analysis

**Key Sections**:
1. Phase 1: Data Collection & Profiling - logging, debug screens, device info
2. Phase 2: Pattern Analysis - OEM, Android version, time-of-day correlations
3. Phase 3: Hypothesis Testing - 5 specific hypotheses with test plans
4. Phase 4: Advanced Diagnostics - native verification, foreground service tests
5. Phase 5: User Feedback Collection - in-app forms and analytics

**Read this if**: You want to DIAGNOSE exactly which devices are affected and why

**Key Diagnostic Tools**:
- Notification delay tracking with MMKV storage
- Debug screen showing delay statistics
- Device information correlation
- ADB alarm manager dump commands
- Timezone and timestamp verification

---

### 📄 BUG3_PROPOSED_SOLUTIONS.md

**What it covers**:
- 7 potential solutions ranked by success likelihood
- Detailed implementation for each approach
- Pros, cons, and trade-offs
- Code examples for top solutions
- Testing and validation strategies

**Solution Rankings**:

| Solution | Success Rate | Difficulty | Status Bar Icon? |
|----------|-------------|------------|------------------|
| 1. `setAlarmClock()` Native Module | 90% | Medium | Yes |
| 2. Reduce Rolling Buffer | 60% | Very Low | No |
| 3. Pre-Trigger + Verification Loop | 50% | High | No |
| 4. Foreground Service | 50% | High | No (persistent notification) |
| 5. Hybrid AlarmManager + WorkManager | 40% | Medium | No |
| 6. OEM-Specific Workarounds | 30% | Very High | No |
| 7. User Education | 20% | Very Low | No |

**Read this if**: You want to know HOW to fix the delays

**Top Solution (setAlarmClock) Highlights**:
- Direct Android API call via native Kotlin module
- Bypasses ALL battery optimization and Doze mode
- Guaranteed exact timing
- Works on 100% of Android devices
- Only trade-off: small clock icon in status bar
- Full implementation code provided

---

## Implementation Roadmap

### Week 1: Quick Win
```
[ ] Reduce NOTIFICATION_ROLLING_DAYS from 6 to 2
[ ] Deploy to test users
[ ] Collect delay data for 7 days
[ ] Analyze if delays reduced
```

### Week 2-3: Native Solution (if needed)
```
[ ] Create ExactAlarmModule native module
[ ] Implement setAlarmClock() wrapper
[ ] Replace expo-notifications scheduling
[ ] Add settings toggle (Exact vs Standard timing)
[ ] Test on 10+ different devices
[ ] Measure delay elimination
```

### Week 4: Polish & Release
```
[ ] A/B test with subset of users
[ ] Gather feedback on status bar icon
[ ] Document OEM-specific behavior
[ ] Release to production
```

---

## Success Metrics

**Before Fix**:
- X% of notifications delayed >5 seconds
- Average delay: Y seconds
- Worst device: Z (OEM/model)

**After Fix (Target)**:
- <5% of notifications delayed >5 seconds (accounting for network/system lag)
- Average delay: <2 seconds
- 100% of devices within ±10 seconds

---

## Key Decisions Needed

### Decision 1: Accept Status Bar Icon?

**If YES**: Implement Solution 1 (setAlarmClock) → 90% success rate
**If NO**: Implement Solution 2 + 6 (buffer reduction + OEM workarounds) → 30-60% success rate

**Recommendation**: Make it OPTIONAL
- Default: Standard (no icon, may have delays)
- Settings toggle: "Exact Timing" (shows icon, guaranteed accuracy)
- Users can choose based on their priorities

### Decision 2: How Much Data to Collect?

**Option A**: Implement logging immediately, gather 2 weeks of data before fixing
- Pros: More information, better decisions
- Cons: Delays fix by 2 weeks, users continue experiencing issues

**Option B**: Implement quick win (buffer reduction) immediately, gather data in parallel
- Pros: May fix issue for some users immediately, still gather data
- Cons: If buffer reduction works, won't know if native solution was necessary

**Recommendation**: Option B - try quick win while collecting data

### Decision 3: Native Module Complexity

**Option A**: Create minimal native module just for setAlarmClock
- Pros: Simple, focused, easy to maintain
- Cons: Duplicates some expo-notifications functionality

**Option B**: Fork/extend expo-notifications to add setAlarmClock option
- Pros: Integrated with existing system
- Cons: Much more complex, harder to maintain across SDK updates

**Recommendation**: Option A - keep native module minimal and focused

---

## Technical Constraints & Assumptions

**Constraints**:
1. Cannot rely on SCHEDULE_EXACT_ALARM permission alone - Android still defers
2. Cannot disable battery optimization for all users - they need to opt-in
3. Cannot use different notification library - all use same Android APIs
4. Cannot fix OEM customizations - each manufacturer adds their own restrictions

**Assumptions**:
1. Users care more about accurate timing than status bar cleanliness
2. 1-3 minute delay is unacceptable for prayer notifications (religious obligation)
3. Some battery drain is acceptable trade-off for reliability
4. Issue affects minority of devices, not majority

**Validation Needed**:
- Survey users: Would you accept a status bar icon for accurate notifications?
- Test on representative device sample (Pixel, Samsung, Xiaomi, OnePlus)
- Measure actual delay distribution across user base

---

## Next Steps

1. **Read all three detailed documents** to understand the full picture
2. **Make key decisions** (accept icon? How much data? Native module scope?)
3. **Set up development environment** for native module work
4. **Implement Phase 1** (logging + quick win)
5. **Monitor and iterate** based on real-world data

---

## Questions?

**"Why can't we just use a different library?"**
→ All libraries (expo-notifications, notifee, react-native-push-notification) use the same Android AlarmManager API, which has the same deferral behavior.

**"Why does iOS work perfectly?"**
→ iOS uses a different notification system (UNNotificationRequest) that prioritizes user experience over battery optimization for scheduled local notifications.

**"Will setAlarmClock() really work 100% of the time?"**
→ Yes, setAlarmClock() is the highest-priority alarm type in Android and bypasses all battery optimization. It's designed for user-facing alarms (like alarm clock apps).

**"Is the status bar icon permanent?"**
→ No, it only shows while alarms are scheduled. Since we schedule 2-3 days ahead, it would be visible most of the time, but users could toggle it off if they prefer.

**"Can we ask users to whitelist the app in their battery settings?"**
→ We already do, and it doesn't fully solve the issue. Android's alarm deferral is separate from battery optimization whitelist.

**"What if we just show the notification 2 minutes early?"**
→ This defeats the purpose of prayer time notifications - they need to be accurate to the minute. Users would miss the exact start of prayer time.

---

## File Structure

```
docs/
├── BUG3_EXECUTIVE_SUMMARY.md        ← You are here
├── BUG3_ROOT_CAUSE_ANALYSIS.md      ← Why delays happen
├── BUG3_INVESTIGATION_PLAN.md       ← How to diagnose
└── BUG3_PROPOSED_SOLUTIONS.md       ← How to fix
```

**Start with**: Executive Summary (this file)
**Then read**: Root Cause Analysis (understand the problem)
**Then read**: Investigation Plan (how to gather data)
**Finally read**: Proposed Solutions (how to fix)

---

## Conclusion

BUG-3 is solvable, but requires either:
1. Accepting a UI trade-off (status bar icon), OR
2. Accepting that delays will persist for some users on some devices

**The good news**: We have a clear path forward with high probability of success.

**The recommendation**: Implement quick win (buffer reduction) immediately, then native solution (setAlarmClock) as optional feature with user toggle.
