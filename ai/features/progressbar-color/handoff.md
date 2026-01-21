# Session Handoff: [Feature/Bug Name]

**Purpose:** Use this prompt to start a new session to work on this feature/bug.

**Last Updated:** [YYYY-MM-DD]

---

## Quick Start

Read ai/AGENTS.md and begin as Orchestrator.

[1-2 sentence summary of what needs to be done]

---

## Context

**Feature/Bug Name:** [Name]
**Location:** ai/features/[feature-name]/
**Status:** [Current Status]
**Priority:** [Low/Medium/High/Critical]
**Type:** [Feature/Bug Fix/Enhancement/Investigation]

---

## Required Reading (In Order)

1. **ai/features/[feature-name]/description.md**
   - [What this contains]

2. **ai/features/[feature-name]/plan.md**
   - [What this contains]

3. **ai/features/[feature-name]/progress.md**
   - Current status and completed tasks
   - Where to log findings/progress

4. **ai/AGENTS.md section 11 (Memory)**
   - Look for related entries
   - Understand past decisions and patterns
   - Note any gotchas or lessons learned

5. **Relevant ADRs in ai/adr/**
   - [List specific ADRs if known]
   - Search for ADRs related to this work

6. **Related Features/Work:**
   - [Link to parent feature if applicable]
   - [Link to related work]

---

## Summary (Quick Reference)

**What We're Building/Fixing:**
- [Key point 1]
- [Key point 2]
- [Key point 3]

**Quick Reproduction (if bug):**
```typescript
// Steps to reproduce or code to demonstrate
```

**Current Hypothesis/Approach:**
[If investigation: what we think the issue is]
[If feature: what approach we're taking]

**Already Tried (if applicable):**
1. [Thing 1] - [Result]
2. [Thing 2] - [Result]

---

## Key Files Involved

- `path/to/file1.ts` - [What it does]
- `path/to/file2.ts` - [What it does]
- `path/to/file3.ts` - [What it does]

---

## Implementation/Investigation Plan Overview

**Phase 1: [Phase Name]**
- [Task summary]

**Phase 2: [Phase Name]**
- [Task summary]

**Phase 3: [Phase Name]**
- [Task summary]

[Continue for all phases from plan.md]

---

## What I Need You To Do

**Step 1: Use Architect Agent**
- Read all documentation listed above
- Review the plan (plan.md)
- Understand the current progress (progress.md)
- [Specific architectural guidance needed]

**Step 2: Execute Work**
- Follow the plan.md phases sequentially
- Update progress.md after each task/phase
- Document findings in progress.md
- [Specific execution guidance]

**Step 3: ReviewerQA Approval After Each Task/Phase**
- After completing each [task/phase], switch to ReviewerQA
- ReviewerQA should verify [what to verify]
- **ONLY proceed to next [task/phase] if ReviewerQA gives 100/100**

**Step 4: [Next Major Step]**
- [Description]

**Step 5: Update Documentation**
- Update progress.md with [what to update]
- Update ai/AGENTS.md Memory with lessons learned
- Update README.md if user-facing changes
- **Update this handoff.md** with any new findings or context

---

## Critical Constraints

1. **[Constraint 1]** - [Why it's important]
2. **[Constraint 2]** - [Why it's important]
3. **Must use ReviewerQA 100/100 approval** between each [task/phase]
4. **Must work on branch:** [branch-name]

---

## Expected Outcome

**Success Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]
- [ ] All tests pass
- [ ] No regressions
- [ ] Documentation updated

---

## Start Here

Begin by reading the documentation above, then use the Architect agent to review the plan and recommend where to start. Proceed systematically through the phases with ReviewerQA approval at each step.

Let me know when you've read the context and are ready to begin.

---

## Update Log

**[YYYY-MM-DD]:** [What happened in this session]
**[YYYY-MM-DD]:** [What happened in this session]
