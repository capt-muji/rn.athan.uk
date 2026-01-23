Read ai/AGENTS.md and begin as Orchestrator.

Mark feature complete: ai/features/[feature-name]/

## Phase 1: Pre-Completion Verification

1. **Verify completion status:**
   - Check progress.md shows all tasks completed `[x]`
   - Verify status is "✅ Complete"

2. **If not fully complete:**
   - STOP - Feature cannot be marked complete
   - Tell me which tasks are incomplete
   - Suggest running feature-resume-tasks.md instead

---

## Phase 2: Final Quality Check

**Run validation:**

```bash
yarn validate
```

All checks must pass (typecheck, lint, format, tests).

---

## Phase 3: Update Memory

**Add key learnings to ai/AGENTS.md section 11 (Memory):**

Only add entries if there are important lessons learned. Format:

```markdown
- **[Topic]** - Brief lesson or principle established.
```

Examples:

- **NO FALLBACKS** - Fix root cause, don't mask problems.
- **Prayer-centric model** - Use full DateTime objects, not separate date/time strings.

---

## Phase 4: Create ADR (if needed)

If architectural decisions were made, create an ADR:

```
Read ai/prompts/architect-init.md
```

---

## Phase 5: Cleanup

Delete the feature folder:

```bash
rm -rf ai/features/[feature-name]
```

---

## Phase 6: Completion

Show me:

```
✅ Feature complete!

Validation: yarn validate passed
Memory: [Updated / No changes needed]
ADR: [Created ai/adr/NNN-*.md / Not needed]
Cleanup: Feature folder deleted

Ready for manual git commit.
```
