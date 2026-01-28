Read ai/AGENTS.md and begin as Architect.

Create a new ADR (Architecture Decision Record) for a decision I've made.

## Phase 1: Information Gathering

1. Ask me:
   - What decision was made?
   - What problem does it solve?
   - What alternatives were considered?
   - Why were alternatives rejected?

2. Review existing ADRs in ai/adr/ for numbering

## Phase 2: Draft ADR

3. Create: ai/adr/NNN-[kebab-case-title].md using ai/adr/TEMPLATE.md

4. Include:
   - Context (constraints, requirements)
   - Decision (clear statement)
   - Consequences (positive/negative/neutral)
   - Alternatives with pros/cons/rejection reasons
   - Implementation notes (file references, gotchas)

## Phase 3: Quality Review

5. **CRITICAL: Switch to ReviewerQA agent**
   - Review the ADR for completeness, consistency, and clarity
   - Check all sections are filled out properly
   - Verify alternatives have clear pros/cons/rejection reasons
   - Ensure consequences are realistic and comprehensive
   - **ONLY proceed if ReviewerQA gives 100/100 approval**
   - If score < 100, fix all issues and re-submit to ReviewerQA
   - Iterate until 100/100 is achieved

## Phase 4: Memory Update

6. Update Memory:
   - Add entry to ai/AGENTS.md section 11
   - Format: `[YYYY-MM-DD] Topic: Summary (see ai/adr/NNN-*.md)`

## Phase 5: Final Verification

7. **Switch to ReviewerQA agent again**
   - Verify memory entry is properly formatted
   - Ensure ADR file exists and is accessible
   - **Confirm 100/100 approval before completion**
