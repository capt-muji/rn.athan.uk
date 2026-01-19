Read ai/AGENTS.md and begin as Orchestrator.

Mark feature complete and archive: ai/features/[feature-name]/

## Phase 1: Pre-Completion Verification

1. **Verify completion status:**
   - Check progress.md shows all tasks completed `[x]`
   - Verify status is "✅ Complete"
   - Confirm ReviewerQA 100/100 score is documented

2. **If not fully complete:**
   - STOP - Feature cannot be marked complete
   - Tell me which tasks are incomplete
   - Suggest running feature-resume-tasks.md instead

---

## Phase 2: Final Quality Audit

**CRITICAL: Switch to Architect agent**

Architect performs final technical review:
- Review entire implementation end-to-end
- Verify all requirements from description.md are met
- Check all integration points work correctly
- Identify any technical debt or issues
- Confirm success criteria achieved
- Verify no breaking changes introduced

**CRITICAL: Switch to ReviewerQA agent**

ReviewerQA performs comprehensive audit:

**Implementation Quality:**
- [ ] All tasks completed with 100/100 approval?
- [ ] All acceptance criteria met?
- [ ] Code quality is production-ready?
- [ ] No obvious bugs or issues?
- [ ] Error handling is appropriate?

**Documentation:**
- [ ] description.md complete and accurate?
- [ ] plan.md reflects actual implementation?
- [ ] progress.md updated with all completions?
- [ ] All ReviewerQA scores documented?

**Integration:**
- [ ] No breaking changes to existing features?
- [ ] All dependencies handled correctly?
- [ ] Feature integrates cleanly?

**Testing:**
- [ ] Feature tested per plan.md testing strategy?
- [ ] Edge cases verified?
- [ ] No regressions?

**ONLY proceed if ReviewerQA gives 100/100 approval**

If score < 100:
- Document ALL issues found
- Return to implementation to fix issues
- Run feature-resume-tasks.md to fix
- Re-submit for final audit when fixed
- **DO NOT archive until 100/100**

---

## Phase 3: Archive Feature

Once final audit achieves 100/100:

1. Create archive directory if needed:
   ```bash
   mkdir -p ai/features/archive/
   ```

2. Move feature folder:
   ```bash
   mv ai/features/[feature-name]/ ai/features/archive/[feature-name]/
   ```

3. Verify move:
   - Check archive/[feature-name]/ exists
   - Verify all files moved (description.md, plan.md, progress.md)
   - Confirm original location is empty

---

## Phase 4: Update Documentation

1. **Update README.md:**
   - Add feature to "Features" section
   - Include brief description
   - Link to archive if relevant

2. **Switch to ReviewerQA agent** to verify README:
   - Check feature is documented correctly
   - Verify links work
   - Confirm formatting is clean
   - **100/100 required**

---

## Phase 5: Update Memory

1. **Add entry to ai/AGENTS.md section 11 (Memory):**

   Format:
   ```markdown
   [YYYY-MM-DD] Feature: [Feature Name]
   - Brief description of what was implemented
   - Key technical decisions or patterns used
   - Any gotchas or lessons learned
   - ReviewerQA final score: 100/100
   - Location: ai/features/archive/[feature-name]/
   ```

2. **Switch to ReviewerQA agent** to verify memory entry:
   - Check entry is complete and helpful
   - Verify format follows examples
   - Confirm date and location are correct
   - **100/100 required**

---

## Phase 6: Final Verification

**Switch to ReviewerQA agent** for final checklist:

- [ ] Feature archived to ai/features/archive/[feature-name]/
- [ ] README.md updated with new feature
- [ ] AGENTS.md memory section updated
- [ ] All documentation is accurate
- [ ] No broken links or references

**ONLY complete if all items checked and ReviewerQA gives 100/100**

---

## Phase 7: Completion

Show me:
```
✅ Feature marked complete and archived!

Final ReviewerQA Score: 100/100

Archive location: ai/features/archive/[feature-name]/

Documentation updated:
- README.md (features section)
- AGENTS.md (memory section)

Status: Ready for production
```

---

## Quality Gates Summary

**These gates were required:**

- ✅ Final Architect Review → Approved
- ✅ Final ReviewerQA Audit → 100/100
- ✅ README Update → ReviewerQA 100/100
- ✅ Memory Update → ReviewerQA 100/100
- ✅ Final Verification → ReviewerQA 100/100

**Total ReviewerQA approvals required: 4 (all at 100/100)**
