Read ai/AGENTS.md and begin as Orchestrator.

Resume implementation of: ai/features/[feature-name]/

## Phase 1: Context Recovery

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

2. **Read all feature documents:**
   - ai/features/[feature-name]/description.md (requirements)
   - ai/features/[feature-name]/plan.md (implementation plan)
   - ai/features/[feature-name]/progress.md (current status)

3. **Identify current state:**
   - Find last completed task (marked with `[x]`)
   - Find next incomplete task (marked with `[ ]`)
   - Review any notes or blockers in progress.md

4. **Switch to Architect agent** for context review:
   - Review completed work
   - Verify completed tasks integrate correctly
   - Check if plan needs updates based on completed work
   - Identify any issues or technical debt from previous tasks

5. **Switch to ReviewerQA agent** to verify completed work:
   - Audit previously completed tasks
   - Verify they meet acceptance criteria
   - Check for any issues that need fixing
   - If any completed task scores < 100, mark it incomplete and fix

---

## Phase 2: Resume Implementation

**Follow the EXACT same workflow as feature-start-tasks.md:**

### For each remaining task:

1. **Understand Task**
   - Read task description from plan.md
   - Identify files to modify
   - Understand acceptance criteria
   - Review dependencies

2. **Implement Task**
   - Make required code changes
   - Follow existing patterns
   - Include error handling
   - Add helpful comments

3. **Self-Check**
   - [ ] All files modified
   - [ ] Code follows patterns
   - [ ] No syntax errors
   - [ ] Acceptance criteria met
   - [ ] No unintended side effects

4. **CRITICAL: Switch to ReviewerQA agent**
   - Review implementation
   - Check code quality, completeness, integration
   - **ONLY proceed if ReviewerQA gives 100/100**
   - If < 100: fix issues and re-review
   - **Repeat until 100/100**

5. **Mark Task Complete**
   - Update progress.md: `[ ]` → `[x]`
   - Add completion note with ReviewerQA 100/100
   - Move to next task

### Phase Completion Reviews

**After completing each PHASE:**

- **Switch to ReviewerQA agent** for phase review
- Review ALL changes in this phase
- Verify phase objectives met
- **ONLY proceed to next phase if 100/100**
- If < 100: fix and re-review

---

## Phase 3: Feature Completion (when all tasks done)

1. **Switch to Architect agent** for final review:
   - Review entire implementation
   - Verify all requirements met
   - Check integration points

2. **Switch to ReviewerQA agent** for final audit:
   - Audit ALL changes
   - Verify all tasks have 100/100 approval
   - Confirm success criteria met
   - **ONLY mark complete if 100/100**
   - If < 100: fix and re-audit

3. Update progress.md:
   - Status: "✅ Complete"
   - Add completion date
   - Add final ReviewerQA score: 100/100

4. **Update ai/AGENTS.md section 11 (Memory):**
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

5. **Update README.md if needed:**
   - If this feature includes user-facing changes:
     - Add to Features section
     - Update usage documentation
     - Add examples if applicable
   - If this is internal/infrastructure:
     - Skip README update (document in memory only)

6. **Switch to ReviewerQA agent** to verify all documentation:
   - Check progress.md is updated correctly
   - Verify memory entry is complete and helpful
   - Check README updates (if applicable)
   - Confirm all links and references work
   - **100/100 required**

---

## Quality Gates (CANNOT BE SKIPPED)

- ✋ Each Task → ReviewerQA 100/100
- ✋ Each Phase → ReviewerQA 100/100
- ✋ Final Feature → ReviewerQA 100/100
- ✋ Documentation → ReviewerQA 100/100

**If any gate < 100: STOP, FIX, RE-REVIEW**

---

## Next Steps After Completion

Run: `ai/prompts/feature-mark-complete.md` to archive and update memory
