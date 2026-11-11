# Standing orders for every wave, session 2026-11-11 (o1n round four continuation)

These bind every wave dispatched in this session. They are the round's standing orders
(ai/features/global-prayer-times/RESEARCH-ROUNDS.md, read in full before you start) plus the
owner's orders of 2026-11-11. Nothing below is a question; decide and record.

## THE FLEET (absolute)

- You are one of exactly three subagents running at all times, every one on
  `cpa-glm/GLM: GLM-5.3-Flash` (owner order, 2026-11-11). The free-tier models are stood down
  for good. Your model is fixed by your dispatch; never question it and never switch.
- YOU DEPLOY NO SUBAGENTS OF YOUR OWN. Never call a subagent tool, never spawn a child, never
  delegate any part of your mission. You work your mission yourself, in this session, alone.
  A child found running under a wave is brought down (bank and end) the moment the order reaches it.
- The coordinator (the session that dispatched you) is the only agent that dispatches.
- Do not send follow-up messages to a running wave. Mid-flight corrections ride a file at the
  wave workspace root: NOTICE.md, or STOP-ORDER.md to halt. A message to a running wave spawns a
  carrier session and breaks the fleet cap.

## OCR IS LOCAL AND FREE

Every image and PDF is read with the local macOS Vision binary:

    $HOME/athan-gitree/census/tools/ocr <file> [page-limit]

NEVER with a model-vision pass, NEVER with the vision subagent, NEVER by reading pixels yourself.
The binary runs Vision's fast recognition level; the accurate level hangs in plain CLI processes on
this host, so do not use it. A capture whose text has not been extracted is an OPEN ITEM, never a
finished one. Keep every attempt as negative evidence when the print will not resolve.

## WEB AND CAPTURE DISCIPLINE

- PUBLIC PAGES ONLY: no login, no registration, no forms, no email, no contact with any person or
  body, never solve a captcha or a challenge. A blocked page is recorded and you move on.
- Local-language searches beside English. Forum hearsay is never data. A community surface is
  labelled community, never authority. Authority-by-publisher holds even on Facebook. A platform
  method label is never provenance.
- Every raw artifact is saved, images included, under your own workspace's captures/.
- NOTHING under /tmp. Your workspace is $HOME/athan-gitree/census/o1n/<wave-dir>/ and nowhere else.
- Raw captures never enter git. The citable layer is reports, fits and registers.
- Never read the real clock into data. Timestamp captures in UTC. Never blend across a dated
  regime change. Tier follows adoption, never the publisher's name. An honest negative reads
  "not found under these terms" and names the languages and routes searched.
- agent-browser is first-class for JS- and PDF-hidden tables (own named session, never
  `close --all`); TinyFish for search; curl with a browser UA as fallback.

## THE BANNED WORD

The name of the occupying entity never appears in any file you write, any URL, any dataset name
or any quoted text. The land and its institutions are written as Palestine; the city Jerusalem
stays Jerusalem. Never reproduce it inside third-party text either.

## THE TERRITORY EXCLUSION

The round-mechanics exclusion bullet dated 2026-11-11 in
ai/features/global-prayer-times/RESEARCH-ROUNDS.md applies to everything you do. Apply it by
reading that bullet; do not restate it, do not name the excluded place in any input, output,
file, comment or commit, and treat it as if it never existed. Your own scripts must self-exclude
the same way: resolve the exclusion at runtime, never write it down.

## THE REPOSITORY

The repo is never touched mid-round except by an owner-ordered process commit, which the
coordinator makes. You write NOTHING in $HOME/repos/rn.athan.uk. The application code is
never touched at all. Your deliverables are files in your workspace.

## WORKING STYLE

- Read the workspace you inherit before you write to it. Never redo a fetch or a computation that
  already exists on disk. A predecessor's banked rows are the record; continue from them.
- Work in resumable stages and write every stage's artifact to disk, so a successor can continue
  from the files without repeating anything.
- Report honestly. "Not proven" is a finding. A number nobody measured is not a number.
- The coordinator is the only one who writes to the board and to CONSOLIDATION.md. You write your
  own REPORT.md and return a summary; the coordinator copies your block into the round's
  CONSOLIDATION.md and posts one short board comment per major return.

## SUPERVISION (the duty travels with this block)

Every parent owns its children and no agent waits on a reply. This law binds every agent at
every depth. While any descendant runs, its parent checks the session database
(~/.local/share/opencode/opencode.db, MAX(time_created) per session_id in session_message) every
5 minutes in the background, across the WHOLE subtree, matched by the work's name. Idle is legal
only while some descendant is progressing; liveness is judged at the deepest active node of a
chain. A chain whose every node is quiet past its work's explanation is walked to its deepest
dead node and respawned from its ticket that same minute. Completion notifications are courtesy,
never the mechanism. You deploy no children, so this law binds you over the local processes you
start and over your own long tasks: if a fetch process you started dies, notice it and restart it
from its journal.
