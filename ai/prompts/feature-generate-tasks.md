Read ai/AGENTS.md and begin as Orchestrator.

Generate implementation plan for existing feature: ai/features/[feature-name]/

## Phase 1: Context Gathering

**Before planning, gather context from existing documentation:**

1. **Read ai/AGENTS.md section 11 (Memory):**
   - Look for similar features or related work
   - Understand past decisions and patterns
   - Identify relevant lessons learned
   - Note any gotchas or pitfalls to avoid

2. **Read relevant ADRs in ai/adr/:**
   - Search for ADRs related to this feature area
   - Understand architectural decisions that affect this work
   - Identify constraints and principles to follow

3. **Read ai/features/[feature-name]/description.md:**
   - Understand requirements, constraints, and success criteria
   - Identify all affected files and dependencies

## Phase 2: Switch to Architect Agent

**CRITICAL: Switch to Architect agent**

The Architect will:

1. **Analyze Requirements:**
   - Review description.md thoroughly
   - Consider memory and ADR context from Phase 1
   - Identify all technical requirements
   - Map out system dependencies
   - Consider edge cases and risks
   - Ensure alignment with past architectural decisions

2. **Create Detailed Plan:**
   - Break feature into small, well-described tasks (1-2 hours each)
   - Each task must include:
     - Clear objective and acceptance criteria
     - Specific files to modify/create
     - Dependencies on other tasks
     - Complexity estimate (small/medium/large)
     - Verification steps
   - Organize tasks into logical phases
   - Phase 1 should always be foundation/setup
   - Final phase should always be testing/verification

3. **Write Plan to plan.md:**
   - Create ai/features/[feature-name]/plan.md
   - Plan structure must include:
     - Overview and goals
     - Prerequisites (existing code, dependencies)
     - Detailed task breakdown by phase
     - File modification list (which files will be changed)
     - Risk analysis and mitigations
     - Rollback strategy
     - Success criteria
     - Testing strategy

## Phase 3: Plan Review

**CRITICAL: Switch to ReviewerQA agent**

ReviewerQA will audit the plan for:

**Task Quality:**

- [ ] Are tasks small enough (1-2 hours each)?
- [ ] Does each task have clear acceptance criteria?
- [ ] Are task objectives specific and measurable?
- [ ] Are verification steps included for each task?

**Technical Accuracy:**

- [ ] Are all file references specific and accurate?
- [ ] Are dependencies between tasks clearly identified?
- [ ] Are edge cases and error handling considered?
- [ ] Is the rollback strategy realistic and testable?

**Organization:**

- [ ] Are phases logically organized?
- [ ] Does the plan flow from foundation to completion?
- [ ] Are risks identified and mitigations proposed?
- [ ] Are success criteria clear and testable?

**ONLY proceed if ReviewerQA gives 100/100 approval**

If score < 100:

- Document all issues found by ReviewerQA
- Fix ALL identified issues in plan.md
- Re-submit entire plan to ReviewerQA
- Iterate until 100/100 is achieved
- **Do NOT proceed to Phase 4 until 100/100**

## Phase 4: Update Progress File

Once plan is approved at 100/100:

1. Update ai/features/[feature-name]/progress.md with:

   ```markdown
   # Feature: [Feature Name]

   **Status:** 📝 Ready for Implementation
   **Created:** [YYYY-MM-DD]
   **Plan:** ai/features/[feature-name]/plan.md (ReviewerQA approved 100/100)
   **Description:** ai/features/[feature-name]/description.md

   ---

   ## Tasks

   [Extract checklist from plan.md phases]

   ---

   ## Notes

   Implementation plan created by Architect agent and approved by ReviewerQA at 100/100.
   See plan.md for detailed implementation strategy.
   ```

## Phase 5: Final Verification

**Switch to ReviewerQA agent again**

Final verification checklist:

- [ ] plan.md exists and is complete
- [ ] progress.md is updated with task checklist
- [ ] All tasks from plan.md are in progress.md
- [ ] Files are properly cross-referenced
- [ ] Status is set to "Ready for Implementation"

**Confirm 100/100 approval before completion**

## Phase 6: Completion

Show me:

```
✅ Implementation plan created successfully!

Files updated:
- ai/features/[feature-name]/plan.md (detailed plan - ReviewerQA 100/100)
- ai/features/[feature-name]/progress.md (task tracker)

ReviewerQA Score: 100/100

Next steps:
- Run ai/prompts/feature-start-tasks.md to begin implementation
- Update handoff.md with plan summary (if needed)
```
