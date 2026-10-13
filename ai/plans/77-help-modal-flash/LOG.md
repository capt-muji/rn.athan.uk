# Ticket 77 ledger

## Planning (2026-10-13)

## Ticket 77

- Brief read from queue row 77; owner away, her recorded rulings taken as the brief.
- Her recording read in planning: 2.42 s, 120 fps, 1080x2340. Frames extracted to
  `$TMPDIR` and read directly; never committed. Measured: card alpha 0.78 against row
  alpha 0.96 at t=0.833 (frame h_034), both 1.0 settled (h_100), the row near-solid
  from its first frame.
- Root cause: the Close row (components/modals/Help.tsx:151) carries no `entering`,
  so it paints opaque from frame 1 while the container's FadeIn
  (components/modals/Modal.tsx:81) raises the card around it; the row's opaque
  background (Help.tsx:274) makes the gap visible as the white box. SlideInDown moves
  `originY` only, so the card's translucency is the container's fade, not its own.
- Decisions D1 to D4 taken and recorded in PLAN.md section 2.1.
- Anchors extracted at cfb9b837; verified counting 1 at eb4582b1 by diff and on uat
  ad6a1c89 by the griller's own runs. Planned at set to uat ad6a1c89 (2.0.203).
- Griller pass ran (one round, ten findings: six must, four should, plus one nice);
  all applied. The load-bearing one: uat took 2.0.203 (ad6a1c89, ticket 72's merge)
  while planning wrote, so versions run by rule from uat's package.json at execution
  (D4), the planning docs commit rides 2.0.204.
- Resume from: run the gate once more, set row 77 READY in the queue, bump the two
  version files to 2.0.204, commit on lane/77.
