# Feature Spec: [FEATURE NAME]

**Status:** Draft | In Review | Approved | Implemented
**Author:** [Name]
**Date:** [YYYY-MM-DD]
**Specialist:** Architect

---

## Overview

[1-2 sentences describing what this feature does and why it's needed]

## Goals

- [ ] Goal 1
- [ ] Goal 2
- [ ] Goal 3

## Non-Goals

- What this feature explicitly does NOT do
- Out of scope items

## User Stories

### Story 1: [Title]
**As a** [user type]
**I want** [action]
**So that** [benefit]

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2

## Technical Design

### Data Flow
```
[Describe data flow: User Action → Component → Store → API → Response]
```

### Components Affected
| Component | Change Type | Description |
|-----------|-------------|-------------|
| `path/to/file.ts` | New/Modified | What changes |

### State Changes
- New atoms: [List any new Jotai atoms]
- Modified atoms: [List modified atoms]
- Storage keys: [New MMKV keys]

### API Changes
- Endpoints affected: [List endpoints]
- New endpoints: [List new endpoints]

## Edge Cases

| Scenario | Expected Behavior |
|----------|------------------|
| [Edge case 1] | [How it should behave] |
| [Edge case 2] | [How it should behave] |

## Error Handling

| Error Condition | User Message | Recovery |
|----------------|--------------|----------|
| [Error 1] | [Message shown] | [How to recover] |

## Testing Plan

### Unit Tests
- [ ] Test case 1
- [ ] Test case 2

### Integration Tests
- [ ] Test case 1

### Manual Testing
- [ ] Step-by-step verification

## Rollout Plan

### Phase 1: Development
- [ ] Implement core functionality
- [ ] Add tests

### Phase 2: Review
- [ ] Code review
- [ ] QA verification

### Phase 3: Release
- [ ] Deploy to staging
- [ ] Deploy to production

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [Risk 1] | Low/Med/High | Low/Med/High | [How to mitigate] |

## Open Questions

- [ ] Question 1?
- [ ] Question 2?

---

## Approval

- [ ] Architect: Approved design
- [ ] Implementer: Ready to build
- [ ] ReviewerQA: Security/quality concerns addressed
