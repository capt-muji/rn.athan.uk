# Features Folder Structure

This folder tracks feature development from planning to completion.

## Structure

```
ai/features/
├── FEATURE-TEMPLATE.md                    # Template to copy for new features
├── HANDOFF-TEMPLATE.md                    # Template for session handoffs
│
└── your-feature-name/                     # Active feature folders
    ├── description.md                     # You write: requirements, goals, specs
    ├── progress.md                        # AI generates: task breakdown with checkboxes
    ├── plan.md                            # AI generates: implementation plan
    └── handoff.md                         # Session handoff for continuity
```

## Feature States

### 📝 PLANNED

Only `description.md` exists. You've written requirements but haven't started implementation.

### 🔄 IN PROGRESS

Both `description.md` and `progress.md` exist. AI has generated tasks, you're working through them.

### ✅ COMPLETED

All tasks in `progress.md` are checked. Delete the folder - key learnings should be in `ai/AGENTS.md` Memory section or as an ADR.

## Workflow

### 1. Start New Feature

```bash
# Copy template
mkdir -p ai/features/my-feature
cp ai/features/FEATURE-TEMPLATE.md ai/features/my-feature/description.md

# Edit description.md with your requirements
```

Or use: `Read ai/prompts/feature-init.md`

### 2. Generate Tasks (AI)

```
Read ai/AGENTS.md and begin as Orchestrator.

New feature to build: ai/features/my-feature/description.md

Use Architect to:
1. Read the description
2. Break it into small, ordered tasks (1-2 hours each)
3. Create: ai/features/my-feature/progress.md
```

### 3. Implement Feature (AI)

```
Read ai/AGENTS.md and begin as Orchestrator.

Continue working on: ai/features/my-feature/progress.md

Start with Task 1.
Update progress.md after each completed task.
```

### 4. Complete Feature

When all tasks are done:

1. Add key learnings to `ai/AGENTS.md` Memory section
2. Create ADR if architectural decisions were made
3. Delete the feature folder

```bash
rm -rf ai/features/my-feature
```
