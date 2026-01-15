# Features Folder Structure

This folder tracks feature development from planning to completion.

## Structure

```
ai/features/
├── FEATURE-TEMPLATE.md                    # Template to copy for new features
│
├── your-feature-name/                     # Active feature folders
│   ├── description.md                     # You write: requirements, goals, specs
│   └── progress.md                        # AI generates: task breakdown with checkboxes
│
└── archive/                               # Completed features
    └── completed-feature/
        ├── description.md
        └── progress.md                    # All tasks checked ✅
```

## Feature States

### 📝 PLANNED
Only `description.md` exists. You've written requirements but haven't started implementation.

### 🔄 IN PROGRESS
Both `description.md` and `progress.md` exist. AI has generated tasks, you're working through them.

### ✅ COMPLETED
All tasks in `progress.md` are checked. Move the entire folder to `archive/`.

## Workflow

### 1. Start New Feature
```bash
# Copy template
mkdir -p ai/features/my-feature
cp ai/features/FEATURE-TEMPLATE.md ai/features/my-feature/description.md

# Edit description.md with your requirements
```

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

### 4. Archive When Done
```bash
# Move to archive when all tasks complete
mv ai/features/my-feature ai/features/archive/
```

## Example

```
ai/features/
├── FEATURE-TEMPLATE.md
│
├── prayer-notifications/                  # 🔄 IN PROGRESS (5/10 tasks done)
│   ├── description.md
│   └── progress.md
│
├── settings-ui/                           # 📝 PLANNED (no progress.md yet)
│   └── description.md
│
└── archive/
    └── offline-cache/                     # ✅ COMPLETED
        ├── description.md
        └── progress.md
```
