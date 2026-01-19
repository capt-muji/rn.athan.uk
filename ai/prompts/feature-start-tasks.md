Read ai/AGENTS.md and begin as Orchestrator.

Begin implementation of: ai/features/[feature-name]/

## Critical Workflow Requirements

**MANDATORY: Each task MUST go through this cycle:**

1. Implement the task
2. **Switch to ReviewerQA agent** for task review
3. **ONLY mark complete if ReviewerQA gives 100/100**
4. If score < 100, fix issues and re-review
5. Update progress.md to mark task complete
6. Move to next task

**DO NOT skip ReviewerQA approval for ANY task**

---

## Phase 1: Pre-Implementation Review

1. **Gather context from existing documentation:**
   - **Read ai/AGENTS.md section 11 (Memory):**
     - Look for similar features or related work
     - Understand past decisions and patterns
     - Identify relevant lessons learned
     - Note any gotchas or pitfalls to avoid
   - **Read relevant ADRs in ai/adr/:**
     - Search for ADRs related to this feature area
     - Understand architectural decisions that affect this work
     - Identify constraints and principles to follow

2. **Read all planning documents:**
   - ai/features/[feature-name]/description.md (requirements)
   - ai/features/[feature-name]/plan.md (implementation strategy)
   - ai/features/[feature-name]/progress.md (task checklist)

3. **Switch to Architect agent** to review plan:
   - Verify plan is still current and accurate
   - Identify any missing dependencies
   - Confirm task order is optimal
   - Update plan.md if changes needed

4. **Switch to ReviewerQA agent** to verify plan:
   - Review updated plan (if any changes made)
   - Confirm all tasks are clear and actionable
   - **ONLY proceed if ReviewerQA gives 100/100**

---

## Phase 2: Task Implementation Loop

**For each task in progress.md, follow this EXACT workflow:**

### Step 1: Understand Task

- Read task description from plan.md
- Identify files to modify
- Understand acceptance criteria
- Review dependencies (ensure prerequisites are complete)

### Step 2: Implement Task

- Make required code changes
- Follow existing code patterns
- Include error handling
- Add comments where needed

### Step 3: Self-Check

Before calling ReviewerQA, verify:
- [ ] All files mentioned in task are modified
- [ ] Code follows existing patterns
- [ ] No syntax errors
- [ ] Acceptance criteria met
- [ ] No unintended side effects

### Step 4: **CRITICAL - ReviewerQA Approval**

**Switch to ReviewerQA agent**

ReviewerQA will check:

**Code Quality:**
- [ ] Does implementation match task requirements?
- [ ] Are all acceptance criteria met?
- [ ] Does code follow existing patterns?
- [ ] Is error handling appropriate?
- [ ] Are edge cases handled?

**Completeness:**
- [ ] Are all mentioned files modified?
- [ ] Are comments clear and helpful?
- [ ] Is the code production-ready?
- [ ] Are there any obvious bugs?

**Integration:**
- [ ] Does code integrate with existing system?
- [ ] Are dependencies handled correctly?
- [ ] No breaking changes to other features?

**REQUIRED: ReviewerQA must give 100/100 to proceed**

### Step 5: Fix Issues (if score < 100)

If ReviewerQA score < 100:
- Document ALL issues found
- Fix EVERY issue identified
- Re-run self-check (Step 3)
- Re-submit to ReviewerQA (Step 4)
- **Repeat until 100/100 achieved**
- **DO NOT mark task complete until 100/100**

### Step 6: Mark Task Complete

Once ReviewerQA gives 100/100:
- Update progress.md: Change `[ ]` to `[x]` for completed task
- Add completion note with ReviewerQA score
- Move to next task

### Step 7: Repeat for Next Task

Continue Step 1-6 for each remaining task in progress.md

---

## Phase 3: Phase Completion Reviews

**After completing each PHASE (group of tasks):**

1. **Switch to ReviewerQA agent** for phase review:
   - Review ALL changes made in this phase
   - Verify phase objectives are met
   - Check for inconsistencies across tasks
   - Ensure no regressions introduced
   - **ONLY proceed to next phase if 100/100**

2. If phase review < 100:
   - Fix all identified issues
   - Re-review affected tasks individually
   - Re-submit phase for review
   - Iterate until phase approval 100/100

---

## Phase 4: Feature Completion

**After ALL tasks complete:**

1. **Switch to Architect agent** for final technical review:
   - Review entire implementation
   - Verify all requirements from description.md are met
   - Check integration points
   - Identify any missing pieces

2. **Switch to ReviewerQA agent** for final audit:
   - Audit ALL changes for consistency and completeness
   - Verify all tasks marked complete have 100/100 approval
   - Check for any technical debt introduced
   - Confirm success criteria from plan.md are met
   - **ONLY mark feature complete if 100/100**

3. If final audit < 100:
   - Document all issues
   - Create fix tasks
   - Implement and review fixes
   - Re-submit for final audit
   - Iterate until 100/100

---

## Phase 5: Documentation and Memory

Once feature achieves 100/100 final approval:

1. Update progress.md:
   - Change status to "✅ Complete"
   - Add completion date
   - Add final ReviewerQA score: 100/100

2. **Update ai/AGENTS.md section 11 (Memory):**
   - Add entry for this feature
   - Document lessons learned during implementation
   - Note any gotchas or important patterns discovered
   - Include technical decisions made
   - Format:
     ```markdown
     [YYYY-MM-DD] Feature: [Feature Name]
     - Brief description of what was implemented
     - Key technical decisions or patterns used
     - Lessons learned and gotchas to avoid
     - ReviewerQA final score: 100/100
     - Location: ai/features/[feature-name]/
     ```

3. **Update README.md if needed:**
   - If this feature includes user-facing changes:
     - Add to Features section
     - Update usage documentation
     - Add examples if applicable
   - If this is internal/infrastructure:
     - Skip README update (document in memory only)

4. **Switch to ReviewerQA agent** to verify all documentation:
   - Check progress.md is updated correctly
   - Verify memory entry is complete and helpful
   - Check README updates (if applicable)
   - Confirm all links and references work
   - **100/100 required**

5. Tell me the feature is ready for the feature-mark-complete prompt

---

## Quality Gates Summary

**These gates CANNOT be skipped:**

- ✋ Task Implementation → ReviewerQA 100/100 required
- ✋ Phase Completion → ReviewerQA 100/100 required
- ✋ Feature Completion → ReviewerQA 100/100 required
- ✋ Documentation → ReviewerQA 100/100 required

**If any gate scores < 100: STOP, FIX, and RE-REVIEW**

---

## Next Steps After Completion

Run: `ai/prompts/feature-mark-complete.md` to archive the feature and update memory.
