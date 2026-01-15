Read ai/AGENTS.md and begin as Orchestrator.

I want to initialize a new feature.

STOP. Ask me: "What is the feature name? (e.g., 'prayer-notifications', 'settings-ui')"

Wait for my response, then:

1. Create folder: ai/features/[feature-name]/
2. Copy FEATURE-TEMPLATE.md to ai/features/[feature-name]/description.md
3. Create ai/features/[feature-name]/progress.md with this template:

```markdown
# Feature: [Feature Name]

**Status:** 📝 Not Started
**Created:** [YYYY-MM-DD]

---

## Tasks

### Phase 1: Planning
- [ ] Task 1: [Placeholder - update after writing description.md]
- [ ] Task 2: [Placeholder]

### Phase 2: Implementation
- [ ] Task 3: [Placeholder]
- [ ] Task 4: [Placeholder]

### Phase 3: Testing & Review
- [ ] Task 5: [Placeholder]
- [ ] Task 6: [Placeholder]

---

## Notes

*This is a placeholder progress file. After filling in description.md, run the feature-generate-tasks prompt to replace this with actual AI-generated tasks.*

**Next Steps:**
1. Edit ai/features/[feature-name]/description.md with your requirements
2. Run: `ai/prompts/feature-generate-tasks.md` to generate real tasks
```

4. Confirm completion and show next steps:
   - Edit description.md with your feature requirements
   - Then run feature-generate-tasks.md to replace progress.md with AI-generated tasks
