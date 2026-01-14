# AI Agent Usage Guide

## Quick Reference: Copy-Paste Prompts

This guide is for **you (the human)**. Copy these prompts into your AI tool to work with the agent system.

---

## 🚀 Starting Any Session

**Always start with this:**

```
Read docs/ai/AGENTS.md and begin as Orchestrator.
```

---

## 📋 Task Templates

### 1. New Feature (Planning + Implementation)

**When:** Building something new  
**Agent:** Orchestrator → Architect → Implementer → TestWriter

**Prompt:**

```
Read docs/ai/AGENTS.md and begin as Orchestrator.

I want to add a new feature: [DESCRIBE FEATURE HERE]

Use Architect to draft a technical spec first.
Include: requirements, data flow, edge cases, and risks.
```

**Example:**

```
Read docs/ai/AGENTS.md and begin as Orchestrator.

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
Read docs/ai/AGENTS.md and begin as Orchestrator.

Fix the bug in [FILE PATH] line [LINE NUMBER].

Error:
[PASTE FULL ERROR MESSAGE HERE]

Use Implementer to fix it and TestWriter to create a repro test.
```

**Example:**

```
Read docs/ai/AGENTS.md and begin as Orchestrator.

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
Read docs/ai/AGENTS.md and begin as Orchestrator.

The [FEATURE/FLOW] is producing wrong results.

Expected: [DESCRIBE EXPECTED BEHAVIOR]
Actual: [DESCRIBE ACTUAL BEHAVIOR]
File(s): [RELEVANT FILES]

Use Architect to trace the logic and identify the root cause.
```

**Example:**

```
Read docs/ai/AGENTS.md and begin as Orchestrator.

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
Read docs/ai/AGENTS.md and begin as Orchestrator.

I want to refactor [FILE OR MODULE].

Goal: [DESCRIBE GOAL: better performance / cleaner code / extract reusable logic / etc]

Use ReviewerQA to assess risks first, then Implementer to execute.
```

**Example:**

```
Read docs/ai/AGENTS.md and begin as Orchestrator.

I want to refactor src/components/UserProfile.tsx.

Goal: Extract form validation logic into reusable hooks. Currently 300+ lines in one component.

Use ReviewerQA to assess risks first, then Implementer to execute.
```

---

### 5. Database Migration (Schema Changes)

**When:** Adding/modifying database tables/columns  
**Agent:** Orchestrator → DevOpsRelease

**Prompt:**

```
Read docs/ai/AGENTS.md and begin as Orchestrator.

I need to [ADD/MODIFY/REMOVE] database [TABLE/COLUMN].

Details:

    Table: [TABLE NAME]

    Change: [DESCRIBE CHANGE]

    Requirements: [zero-downtime / backward-compatible / etc]

Use DevOpsRelease to create migration, rollback script, and test plan.
```

**Example:**

```
Read docs/ai/AGENTS.md and begin as Orchestrator.

I need to add a new column to the users table.

Details:

    Table: users

    Change: Add "subscription_tier" enum column (free/pro/enterprise)

    Requirements: Zero-downtime, default value "free"

Use DevOpsRelease to create migration, rollback script, and test plan.
```

---

### 6. Security Audit

**When:** Reviewing code for security issues  
**Agent:** Orchestrator → ReviewerQA (SecurityAudit skill)

**Prompt:**

```
Read docs/ai/AGENTS.md and begin as Orchestrator.

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
Read docs/ai/AGENTS.md and begin as Orchestrator.

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

### 7. Code Review

**When:** Reviewing code before merge/commit  
**Agent:** Orchestrator → ReviewerQA

**Prompt:**

```
Read docs/ai/AGENTS.md and begin as Orchestrator.

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
Read docs/ai/AGENTS.md and begin as Orchestrator.

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

### 8. Adding Tests

**When:** Code exists but has no/insufficient tests  
**Agent:** Orchestrator → TestWriter

**Prompt:**

```
Read docs/ai/AGENTS.md and begin as Orchestrator.

Add tests for [FILE].

Coverage needed:

    [Happy path / Edge cases / Error handling / Integration / E2E]

Use TestWriter to create comprehensive tests matching our testing conventions.
```

**Example:**

```
Read docs/ai/AGENTS.md and begin as Orchestrator.

Add tests for src/utils/validator.ts.

Coverage needed:

    Happy path (valid input)

    Edge cases (empty strings, special chars, unicode)

    Error handling (malformed data)

Use TestWriter to create comprehensive tests matching our testing conventions.
```

---

### 9. Deployment Planning

**When:** Preparing to deploy to staging/production  
**Agent:** Orchestrator → DevOpsRelease

**Prompt:**

```
Read docs/ai/AGENTS.md and begin as Orchestrator.

Create a deployment plan for [FEATURE/SERVICE].

Include:

    Pre-deployment checklist

    Environment variables

    Migration steps

    Health checks

    Rollback procedure

Use DevOpsRelease.
```

**Example:**

```
Read docs/ai/AGENTS.md and begin as Orchestrator.

Create a deployment plan for the new WebSocket notification service.

Include:

    Pre-deployment checklist

    Environment variables

    Migration steps

    Health checks

    Rollback procedure

Use DevOpsRelease.
```

---

### 10. Understanding Codebase (New Developer Onboarding)

**When:** Learning a new/unfamiliar codebase  
**Agent:** Orchestrator → RepoMapper

**Prompt:**

```
Read docs/ai/AGENTS.md and begin as Orchestrator.

I'm new to this codebase. Help me understand [AREA/MODULE].

Questions:

    How is [FEATURE] implemented?

    Where does [DATA FLOW] happen?

    What are the key files for [DOMAIN]?

Use RepoMapper to analyze and explain.
```

**Example:**

```
Read docs/ai/AGENTS.md and begin as Orchestrator.

I'm new to this codebase. Help me understand the authentication flow.

Questions:

    How is user login/logout implemented?

    Where does session management happen?

    What are the key files for auth?

Use RepoMapper to analyze and explain.
```

---

### 11. Documentation Update

**When:** README or docs are outdated  
**Agent:** Orchestrator → ReviewerQA + Implementer

**Prompt:**

```
Read docs/ai/AGENTS.md and begin as Orchestrator.

Update documentation for [FEATURE/CHANGE].

Files to update:

    README.md

    API docs (OpenAPI/GraphQL schema)

    Inline JSDoc/TSDoc

Use ReviewerQA to audit what's missing, then Implementer to update.
```

**Example:**

```
Read docs/ai/AGENTS.md and begin as Orchestrator.

Update documentation for the new OAuth authentication flow.

Files to update:

    README.md (add OAuth setup steps)

    API docs (new /auth/oauth endpoints)

    Inline JSDoc for src/auth/oauth.ts

Use ReviewerQA to audit what's missing, then Implementer to update.
```

---

### 12. Performance Optimization

**When:** Code is slow, needs profiling  
**Agent:** Orchestrator → ReviewerQA (PerformanceProfile skill)

**Prompt:**

```
Read docs/ai/AGENTS.md and begin as Orchestrator.

The [FEATURE/ENDPOINT] is slow.

Performance issue:

    Current: [e.g., 2-3 seconds response time]

    Expected: [e.g., <500ms]

    File(s): [RELEVANT FILES]

Use ReviewerQA with PerformanceProfile skill to identify bottlenecks.
```

**Example:**

```
Read docs/ai/AGENTS.md and begin as Orchestrator.

The /api/users endpoint is slow.

Performance issue:

    Current: 2-3 seconds response time

    Expected: <500ms

    File(s): src/api/users.ts, src/services/UserService.ts

Use ReviewerQA with PerformanceProfile skill to identify bottlenecks.
```

---

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

Stop. Check docs/ai/AGENTS.md section 4 (Golden Paths) and section 8 (Consistency).
Match the patterns in [reference similar file].

### Agent is too verbose

Be concise. Reference AGENTS.md sections instead of re-explaining everything.

### Agent wants to run a blocked command

That's a blocked command (see AGENTS.md Safety section).
Propose a safe alternative.

### Not sure which agent to use

Read docs/ai/AGENTS.md section 10 (Decision Tree) and tell me which specialist to use for [task].

## 📚 Learn More

- Full agent details: See docs/ai/AGENTS.md section 10
- Coding conventions: See docs/ai/AGENTS.md section 4 (Golden Paths)
- Safety rules: See docs/ai/AGENTS.md Safety section