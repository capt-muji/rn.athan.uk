# AI Agent Usage Guide

## Quick Reference: Copy-Paste Prompts

This guide is for **you (the human)**. Copy these prompts into your AI tool to work with the agent system.

---

## 🚀 Starting Any Session

**Always start with this:**

```
Read ai/AGENTS.md and begin as Orchestrator.
```

---

## 🎯 Mock Cascade Simulation (countdown/transition testing)

The mock feed (`mocks/simple.ts`, active whenever `EXPO_PUBLIC_ENV` is not
`prod`/`preview` — the default for local Release builds) builds TODAY's prayer
times **relative to app launch**. Edit the offsets to stage transitions:

```ts
// mocks/simple.ts — [today] block
fajr: addMinutes(-10),   // passed 10m before launch
sunrise: addMinutes(1),  // transition 1m after launch
dhuhr: addMinutes(2),    // 2m
asr: addMinutes(3),      // 3m
magrib: addMinutes(4),   // 4m
isha: addMinutes(5),     // 5m
```

Offsets are minutes **from launch** (negative = already passed). One
minute-between-prayers spacing gives a transition every minute for a fast
repro loop; widen them to watch longer final-countdowns.

**Night-testing constraint (00:00–05:59):** `calculateBelongsToDate`
(shared/prayer.ts, intended behavior) assigns any Isha in that window to the
PREVIOUS Islamic day — real London Isha never lands there, but a night-time
mock does. Effect: at the Magrib→Isha handoff the display date flips a day
early and the rollover cascade fires before Isha. To test the handoff/rollover
cleanly, simulate during 06:00–23:59, or at night give `isha` an offset large
enough to land at/after 06:00. Countdown ticking and pre-Isha transitions are
unaffected at any hour.

### Rerun the simulation (iPhone 16 sim, Release, mock data)

```bash
# 1. Rebuild + install (first run ~15 min; incremental ~4-6 min)
npx expo run:ios --configuration Release

# 2. Clean relaunch — IMPORTANT: bypasses the dev-client URL the build's
#    auto-launch opens (which parks the app on a "connecting to Metro" screen)
UDID=8FB33B9F-A3D4-4776-A4E6-4BE17228E9DC
xcrun simctl terminate $UDID com.mugtaba.athan 2>/dev/null; sleep 2
date "+%H:%M:%S.%N LAUNCH (T0)"
xcrun simctl launch $UDID com.mugtaba.athan

# 3. (Optional) stream the countdown TICK debug logs while transitions play out
xcrun simctl spawn $UDID log stream --predicate 'eventMessage CONTAINS "TICK"' --level debug | tee /tmp/tick-stream.txt
# ...watch N minutes, then Ctrl-C. (Debug entries are stream-only —
#  `log show` cannot retrieve them afterwards; `log show --info` works
#  for info-level history.)

# 4. On-screen check without screenshots: the a11y tree exposes the countdown
#    text directly (e.g. "Fajr", "1m 42s", "Magrib 1m ago")
```

Transitions land on the wall second containing each target (mock targets are
launch-relative, i.e. arbitrary sub-second phase; real prayer times are
minute-exact, so real transitions fire within ~20ms of the :00 boundary).

### What healthy looks like

- TICK `phase` (=`wall % 1000`) stays 10–30ms — digits flip with the status bar
- `computed` counts down to 1 and swaps to the next prayer at the boundary —
  never 0 (display contract)
- Transitions (`TICK: transition`) show small `transitionMs`

---

## 📋 Task Templates

### 1. New Feature (Planning + Implementation)

**When:** Building something new  
**Agent:** Orchestrator → Architect → Implementer → TestWriter

**Prompt:**

```
Read ai/AGENTS.md and begin as Orchestrator.

I want to add a new feature: [DESCRIBE FEATURE HERE]

Use Architect to draft a technical spec first.
Include: requirements, data flow, edge cases, and risks.
```

**Example:**

```
Read ai/AGENTS.md and begin as Orchestrator.

I want to add a new feature: User authentication with OAuth (Google + GitHub)

Use Architect to draft a technical spec first.
Include: requirements, data flow, edge cases, and risks.
```

**After spec is approved:**

```
Spec approved. Use Implementer to build the feature.
Start with [specific component, e.g., "the OAuth provider setup"].
```

---

### 2. Bug Fix (With Error Message)

**When:** Something is broken and you have an error/stack trace  
**Agent:** Orchestrator → Implementer + TestWriter

**Prompt:**

```
Read ai/AGENTS.md and begin as Orchestrator.

Fix the bug in [FILE PATH] line [LINE NUMBER].

Error:
[PASTE FULL ERROR MESSAGE HERE]

Use Implementer to fix it and TestWriter to create a repro test.
```

**Example:**

```
Read ai/AGENTS.md and begin as Orchestrator.

Fix the bug in src/utils/parser.ts line 42.

Error:
TypeError: Cannot read property 'length' of undefined
at parseUserInput (src/utils/parser.ts:42:18)
at handleSubmit (src/components/Form.tsx:15:22)

Use Implementer to fix it and TestWriter to create a repro test.
```

---

### 3. Bug Fix (No Error, Wrong Behavior)

**When:** Code runs but produces wrong output  
**Agent:** Orchestrator → Architect (logic analysis)

**Prompt:**

```
Read ai/AGENTS.md and begin as Orchestrator.

The [FEATURE/FLOW] is producing wrong results.

Expected: [DESCRIBE EXPECTED BEHAVIOR]
Actual: [DESCRIBE ACTUAL BEHAVIOR]
File(s): [RELEVANT FILES]

Use Architect to trace the logic and identify the root cause.
```

**Example:**

```
Read ai/AGENTS.md and begin as Orchestrator.

The checkout total calculation is wrong.

Expected: Subtotal + Tax (20%) + Shipping (£5)
Actual: Shows random numbers, sometimes negative
File(s): src/checkout/calculateTotal.ts, src/checkout/CartSummary.tsx

Use Architect to trace the logic and identify the root cause.
```

---

### 4. Refactoring

**When:** Code works but needs cleanup/restructuring  
**Agent:** Orchestrator → ReviewerQA → Implementer

**Prompt:**

```
Read ai/AGENTS.md and begin as Orchestrator.

I want to refactor [FILE OR MODULE].

Goal: [DESCRIBE GOAL: better performance / cleaner code / extract reusable logic / etc]

Use ReviewerQA to assess risks first, then Implementer to execute.
```

**Example:**

```
Read ai/AGENTS.md and begin as Orchestrator.

I want to refactor src/components/UserProfile.tsx.

Goal: Extract form validation logic into reusable hooks. Currently 300+ lines in one component.

Use ReviewerQA to assess risks first, then Implementer to execute.
```

---

### 5. Security Audit

**When:** Reviewing code for security issues  
**Agent:** Orchestrator → ReviewerQA (SecurityAudit skill)

**Prompt:**

```
Read ai/AGENTS.md and begin as Orchestrator.

Run a security audit on [FILE OR FOLDER].

Focus areas:

    SQL injection

    XSS vulnerabilities

    Auth bypass

    Secret leaks

    Input validation

Use ReviewerQA with SecurityAudit skill.
```

**Example:**

```
Read ai/AGENTS.md and begin as Orchestrator.

Run a security audit on src/api/payment.ts.

Focus areas:

    SQL injection

    XSS vulnerabilities

    Auth bypass

    Secret leaks

    Input validation

Use ReviewerQA with SecurityAudit skill.
```

---

### 6. Code Review

**When:** Reviewing code before merge/commit  
**Agent:** Orchestrator → ReviewerQA

**Prompt:**

```
Read ai/AGENTS.md and begin as Orchestrator.

Review the code in [FILE OR FOLDER].

Check for:

    Consistency with existing patterns

    Missing documentation

    Edge cases

    Performance issues

    Security concerns

Use ReviewerQA for a full audit.
```

**Example:**

```
Read ai/AGENTS.md and begin as Orchestrator.

Review the code in src/features/notifications/.

Check for:

    Consistency with existing patterns

    Missing documentation

    Edge cases

    Performance issues

    Security concerns

Use ReviewerQA for a full audit.
```

---

### 7. Adding Tests

**When:** Code exists but has no/insufficient tests  
**Agent:** Orchestrator → TestWriter

**Prompt:**

```
Read ai/AGENTS.md and begin as Orchestrator.

Add tests for [FILE].

Coverage needed:

    [Happy path / Edge cases / Error handling / Integration / E2E]

Use TestWriter to create comprehensive tests matching our testing conventions.
```

**Example:**

```
Read ai/AGENTS.md and begin as Orchestrator.

Add tests for src/utils/validator.ts.

Coverage needed:

    Happy path (valid input)

    Edge cases (empty strings, special chars, unicode)

    Error handling (malformed data)

Use TestWriter to create comprehensive tests matching our testing conventions.
```

---

### 8. Understanding Codebase (New Developer Onboarding)

**When:** Learning a new/unfamiliar codebase  
**Agent:** Orchestrator → RepoMapper

**Prompt:**

```
Read ai/AGENTS.md and begin as Orchestrator.

I'm new to this codebase. Help me understand [AREA/MODULE].

Questions:

    How is [FEATURE] implemented?

    Where does [DATA FLOW] happen?

    What are the key files for [DOMAIN]?

Use RepoMapper to analyze and explain.
```

**Example:**

```
Read ai/AGENTS.md and begin as Orchestrator.

I'm new to this codebase. Help me understand the authentication flow.

Questions:

    How is user login/logout implemented?

    Where does session management happen?

    What are the key files for auth?

Use RepoMapper to analyze and explain.
```

---

### 9. Documentation Update

**When:** README or docs are outdated  
**Agent:** Orchestrator → ReviewerQA + Implementer

**Prompt:**

```
Read ai/AGENTS.md and begin as Orchestrator.

Update documentation for [FEATURE/CHANGE].

Files to update:

    README.md

    API docs (OpenAPI/GraphQL schema)

    Inline JSDoc/TSDoc

Use ReviewerQA to audit what's missing, then Implementer to update.
```

**Example:**

```
Read ai/AGENTS.md and begin as Orchestrator.

Update documentation for the new OAuth authentication flow.

Files to update:

    README.md (add OAuth setup steps)

    API docs (new /auth/oauth endpoints)

    Inline JSDoc for src/auth/oauth.ts

Use ReviewerQA to audit what's missing, then Implementer to update.
```

---

### 10. Performance Optimization

**When:** Code is slow, needs profiling  
**Agent:** Orchestrator → ReviewerQA (PerformanceProfile skill)

**Prompt:**

```
Read ai/AGENTS.md and begin as Orchestrator.

The [FEATURE/ENDPOINT] is slow.

Performance issue:

    Current: [e.g., 2-3 seconds response time]

    Expected: [e.g., <500ms]

    File(s): [RELEVANT FILES]

Use ReviewerQA with PerformanceProfile skill to identify bottlenecks.
```

**Example:**

```
Read ai/AGENTS.md and begin as Orchestrator.

The /api/users endpoint is slow.

Performance issue:

    Current: 2-3 seconds response time

    Expected: <500ms

    File(s): src/api/users.ts, src/services/UserService.ts

Use ReviewerQA with PerformanceProfile skill to identify bottlenecks.
```

---

### 11. Building a Large Feature (Multi-Session Workflow)

**When:** Building complex features that span multiple sessions  
**Agent:** Orchestrator → Architect → Multiple Implementer/TestWriter cycles

**This workflow allows you to pause/resume without losing context.**

---

#### Step 1: Create Your Feature Description

Create `ai/features/[name]/description.md` using the template:

```bash
mkdir -p ai/features/oauth-login
cp ai/features/FEATURE-TEMPLATE.md ai/features/oauth-login/description.md
```

## 💡 Tips for Better Results

### Be Specific

❌ **Vague:** "Fix the bug"  
✅ **Specific:** "Fix TypeError in src/auth.ts line 42: 'Cannot read property email of null'"

### Provide Context

❌ **No context:** "Add login"  
✅ **With context:** "Add OAuth login (Google + GitHub) using NextAuth.js. Users should be redirected to /dashboard after login."

### Reference Files

❌ **Generic:** "The API is broken"  
✅ **Specific:** "The POST /api/users endpoint in src/api/users.ts returns 500 error when email is missing"

### Let Agents Guide You

If you're unsure, just state your goal:

```
I want to build a real-time chat feature
```

The Orchestrator will ask clarifying questions and guide you through the proper workflow.

---

## 🔄 After Work is Done

Agents **cannot commit to Git**. After they finish, you need to:

```bash
# Review changes
git status
git diff

# Commit
git add .
git commit -m "feat: add user authentication"

# Push
git push
```

## 🆘 Troubleshooting

### Agent isn't following conventions

Stop. Check ai/AGENTS.md section 4 (Golden Paths) and section 8 (Consistency).
Match the patterns in [reference similar file].

### Agent is too verbose

Be concise. Reference AGENTS.md sections instead of re-explaining everything.

### Agent wants to run a blocked command

That's a blocked command (see AGENTS.md Safety section).
Propose a safe alternative.

### Not sure which agent to use

Read ai/AGENTS.md section 10 (Decision Tree) and tell me which specialist to use for [task].

## 📁 Templates

Templates are available for common documentation needs:

| Template         | Location                          | Purpose                                                           |
| ---------------- | --------------------------------- | ----------------------------------------------------------------- |
| **Feature Spec** | `ai/features/FEATURE-TEMPLATE.md` | Full feature requirements (goals, user stories, technical design) |
| **ADR**          | `ai/adr/TEMPLATE.md`              | Architecture Decision Records                                     |

**To use a template:**

```bash
# For a new feature
mkdir -p ai/features/my-feature
cp ai/features/FEATURE-TEMPLATE.md ai/features/my-feature/description.md
# Fill in description.md with your requirements

# For an ADR
cp ai/adr/TEMPLATE.md ai/adr/001-my-decision.md
```

📚 Learn More

    Full agent details: See ai/AGENTS.md section 10

    Coding conventions: See ai/AGENTS.md section 4 (Golden Paths)

    Safety rules: See ai/AGENTS.md Safety section

    Init prompt: See ai/prompts/init.md (for re-initialization)

    Feature workflow prompts: See ai/prompts/feature-*.md (helper prompts)
