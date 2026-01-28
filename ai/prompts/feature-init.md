Read ai/AGENTS.md and begin as Orchestrator.

I want to initialize a new feature.

## Phase 1: Feature Name Collection

**STOP.** Ask me: "What is the feature name? (e.g., 'prayer-notifications', 'settings-ui')"

Wait for my response, then proceed to Phase 2.

## Phase 2: Create Feature Structure

1. Create folder: ai/features/[feature-name]/
2. Copy FEATURE-TEMPLATE.md to ai/features/[feature-name]/description.md
3. Copy HANDOFF-TEMPLATE.md to ai/features/[feature-name]/handoff.md
4. Create ai/features/[feature-name]/progress.md with initial template
5. Create ai/features/[feature-name]/plan.md with initial template

Confirm completion and tell me: "Feature structure created. Please edit description.md with your requirements, then I'll use the Architect agent to create a detailed plan."

**STOP.** Wait for me to say I've updated description.md.

## Phase 3: Context Gathering

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

3. **Ask me: "Are there any specific ADRs or past features I should review for context?"**
   - Wait for my response
   - Read any additional context I provide

## Phase 4: Switch to Architect Agent

**CRITICAL: Switch to Architect agent**

The Architect will:

1. **Read and Analyze:**
   - Read ai/features/[feature-name]/description.md thoroughly
   - Review memory and ADR context gathered in Phase 3
   - Understand requirements, constraints, and success criteria
   - Identify all affected files and dependencies
   - Consider how this fits with past architectural decisions

2. **Create Detailed Plan:**
   - Break feature into small, well-described tasks (1-2 hours each)
   - Each task should have:
     - Clear objective and acceptance criteria
     - Specific files to modify/create
     - Dependencies on other tasks
     - Complexity estimate (small/medium/large)
   - Organize tasks into logical phases
   - Include verification steps for each phase

3. **Save Plan:**
   - Write complete plan to ai/features/[feature-name]/plan.md
   - Plan must include:
     - Overview and goals
     - Task breakdown with phases
     - File modification list
     - Risk analysis and mitigations
     - Rollback strategy
     - Success criteria

## Phase 5: Plan Review

**CRITICAL: Switch to ReviewerQA agent**

ReviewerQA will audit the plan:

- Are tasks small enough (1-2 hours)?
- Are tasks well-described with clear acceptance criteria?
- Are all dependencies identified?
- Are file references specific and accurate?
- Are phases logically organized?
- Is the rollback strategy realistic?
- Are edge cases considered?

**ONLY proceed if ReviewerQA gives 100/100 approval**

If score < 100:

- Fix all identified issues
- Re-submit to ReviewerQA
- Iterate until 100/100 is achieved

## Phase 6: Update Progress File

Once plan is approved at 100/100:

1. Update ai/features/[feature-name]/progress.md with:
   - Reference to plan.md
   - Initial task checklist (extracted from plan.md)
   - Status: "📝 Ready for Implementation"
   - Created date
   - Link to plan.md and description.md

## Phase 7: Final Verification

**Switch to ReviewerQA agent again**

Final verification checklist:

- [ ] description.md exists and is complete
- [ ] plan.md exists with detailed implementation plan
- [ ] progress.md exists with task checklist
- [ ] All files are properly linked
- [ ] Status is set correctly

**Confirm 100/100 approval before completion**

## Phase 8: Next Steps

Show me:

```
✅ Feature initialized successfully!

Files created:
- ai/features/[feature-name]/description.md (requirements)
- ai/features/[feature-name]/plan.md (implementation plan - ReviewerQA approved 100/100)
- ai/features/[feature-name]/progress.md (task tracker)
- ai/features/[feature-name]/handoff.md (session handoff prompt)

Next steps:
- Run ai/prompts/feature-start-tasks.md to begin implementation
- Use handoff.md to start new sessions on this feature
```
