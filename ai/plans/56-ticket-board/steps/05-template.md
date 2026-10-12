# Step 05: the template

Requirements: R6.1, R6.2, R6.3, R6.4, R1.3
Weight: 2 (code)

## Anchor check

```bash
bash ai/plans/56-ticket-board/scripts/anchor-check.sh
```

Every anchor count must be 1. Any other count is STOP.

## Goal

`board/index.html` renders the elected A5 design from `board.json`: stripped dark, flat solid
surfaces, one aurora horizon line, a single glow on the running step, rounded pale pastel tags,
equal 280px columns, one identical card template on an 8px grid, and a genuinely composed 390px
phone page. Self-contained: no network beyond the two same-origin routes.

## Branch

```bash
git checkout -b feat/56-05-template uat
```

## Files

- `board/index.html` (new)

## Red check

```bash
REPO_DIR_IN_DB=$(pwd) docker compose --project-directory board up -d >/dev/null 2>&1
sleep 5
curl -s --max-time 5 -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8788/
docker compose --project-directory board down >/dev/null 2>&1
```

Expected today: `404` (no index.html). Record it. Any other code is STOP.

## Change contract

One file, `board/index.html`, no build step, no external requests, system font stack only.
Structure and behaviour:

- Loads `board.json` with `fetch('/board.json')`, renders, then opens
  `new EventSource('/events')` and refetches on every message without reloading the page.
- Header band: the page heading is `Ticket board`, followed by the repository version, the `uat` short sha, an unpushed badge when `repo.unpushed` is
  true, `activeNow` shown as a live dot, and the staleness stamp: the age of `generatedAt`,
  stamped stale past 30000 ms (twice the reconcile interval).
- One aurora line: a single gradient horizontal line under the header, nothing else animated.
- Columns in order: Backlog, Planning, Ready, In progress, Audit, Done, Blocked, Owner-led.
  The Unmapped column renders only when at least one ticket maps there and carries the label
  `Unmapped`. Equal 280px columns, gaps and every spacing a multiple of 8.
- One card template renders every ticket: order number as a mono tag, the name, a pale pastel
  status tag per column, the platform pill when `platform` is non-null, needs chips as
  bordered pills (hollow square when unmet, check plus strikethrough when met), the parent
  rollup line and bar when `parent` is non-null, the conflict group as a dotted left border
  plus a mono label when `group` is non-null, `statusText` as the card's second line.
- The steps rail on cards whose ticket has steps: one cell per step, Pending as a hollow dot,
  Running as the single glowing cell (the only glow on the page), Merged as a filled cell, in
  step order with the cursor visible.
- The context chip when `context` is non-null: the percentage and its age in minutes.
- In-flight tickets render as hero cards in the In progress column, full column width, with
  their steps rail. The counter above the column reads `1 in flight` or `2 in flight`. The
  column turns red only when two in-flight tickets share a `group`; two disjoint in-flight
  tickets never colour it.
- The Done column holds the `doneColumnCount` highest-order DONE tickets (the reader already
  picks them) with a `doneCount` total badge.
- The page foot holds two lists: `Run order`, one entry per waiting ticket with its reason
  inline (the unmet needs and their row numbers), hidden entirely when no ticket waits; and
  `Blocked`, the blocked tickets with their unmet order list, hidden when none are blocked.
- `@media (max-width: 430px)`: the columns become 88vw wide, horizontal scroll with
  `scroll-snap-type: x mandatory`, one column per swipe; the header compresses to one line.
- A `board.json` fetch failure or a parse failure renders a single error line naming the
  failure, never a blank page.

## Green run

```bash
REPO_DIR_IN_DB=$(pwd) docker compose --project-directory board up -d >/dev/null 2>&1
sleep 5
curl -s --max-time 5 http://127.0.0.1:8788/ > "$TMPDIR/board-page.html"
for word in Backlog Planning Ready Audit Done Blocked 'Owner-led' 'Run order' 'Ticket board'; do
  grep -Fq "$word" "$TMPDIR/board-page.html" || { echo "missing: $word"; exit 1; }
done
echo 'template words present'
curl -s --max-time 5 http://127.0.0.1:8788/ -o /dev/null -w '%{http_code}\n'
agent-browser open http://127.0.0.1:8788 >/dev/null 2>&1 || true
agent-browser read http://127.0.0.1:8788 2>/dev/null | head -40 > "$TMPDIR/board-read.txt"
grep -Fq 'Ticket board' "$TMPDIR/board-read.txt" && echo 'page renders in a browser'
cp "$TMPDIR/board-read.txt" "$HOME/athan-gitree/sessions/56/step05-board-read.txt"
docker compose --project-directory board down >/dev/null 2>&1
```

Expected: `template words present`, `200`, `page renders in a browser`. The read capture lands
under `sessions/56/`. If `agent-browser` is absent, its line degrades: record the absence in
LOG.md and prove the render by the word checks plus the step 6 owner read; do not invent
another tool.

## Break script

Save as `$TMPDIR/break-56-05.sh`, run with `bash`:

```bash
#!/usr/bin/env bash
set -u
if grep -Eq 'https?://|<link|@import' board/index.html; then
  echo 'external reference found'; exit 1
fi
docker compose --project-directory board up -d >/dev/null 2>&1
sleep 5
docker run --rm -v board_board-state:/state node:24-alpine sh -c 'echo garbage > /state/board.json'
sleep 1
code=$(curl -s --max-time 5 -o /dev/null -w '%{http_code}' http://127.0.0.1:8788/)
docker compose --project-directory board down >/dev/null 2>&1
[ "$code" = "200" ] || { echo "page answered $code on corrupt data"; exit 1; }
echo 'ALL AS EXPECTED: 2'
```

Expected last line: `ALL AS EXPECTED: 2`: no external reference exists in the committed file,
and the page keeps answering 200 while the data is corrupt (the template's error line renders
client-side; the server serves bytes regardless). `git status --porcelain` then lists only
this plan folder's files.

## Version and commit

Version command: the next patch after `uat`'s `package.json` under the version lock. Set it in
the three files, `app.json` first. Add `board/index.html` by name plus this plan folder's
changed files. Commit message:

```
<VERSION> - feat(board): the A5 template, columns, cards, phone page (job 56 step 5)
```

## Review checklist

- Exactly one glow rule in the CSS (the running step), one gradient line (the aurora).
- Every spacing value is a multiple of 8; columns are 280px desktop, 88vw under 430px.
- No external URL, font, image or script anywhere in the file.
- The card template is one function (or one template block) reused by every column.
- The owner reads this page before the job is DONE; her approval of the face is part of the
  audit, per the visuals rule.

## Merge

```bash
git checkout uat && git merge --no-ff feat/56-05-template -m "Merge feat/56-05-template into uat: job 56 step 5, the template"
```

A conflict is `git merge --abort`, then STOP.

## Done when

Checklist box 5 ticked, LOG.md entry appended, the stack is down, merged.
