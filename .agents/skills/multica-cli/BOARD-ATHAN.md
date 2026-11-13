# The Athan board on Multica

Companion to `SKILL.md` (the official multica-cli skill): this file carries what is
true about OUR board, not about the CLI.

## Where

- Server: the API URL the CLI already holds (`multica config show` prints `server_url`);
  browser front `https://kan.chabu.me`.
- CLI: `~/.local/bin/multica`, already configured (`server_url` set) and logged in
  with the owner-minted PAT (`MULTICA_PAT` in `~/.zshrc`). Never print the PAT.
- Two workspaces:
  - `athan` (identifier `ATHA-`): the app and the board programme.
  - `mosques`: the research/mosque-database programme. Research tickets never go
    into `athan`.

## The eleven columns, in board order

| # | Column | Key (athan) | Key (mosques) | Meaning |
| --- | --- | --- | --- | --- |
| 1 | Backlog | `backlog` | `backlog` | Deferred by the owner. Parking: assignee set, nothing runs. |
| 2 | Todo | `todo` | `todo` | Queued for work. |
| 3 | Planning | `planning_2` | `planning` | The plan is being written or grilled. |
| 4 | Ready | `ready` | `ready` | Plan passed the gate; waiting for an executor. |
| 5 | In Progress | `in_progress` | `in_progress` | Actively worked. |
| 6 | In Review | `in_review` | `in_review` | The audit: work delivered, waiting on review. |
| 7 | Awaiting Owner | `awaiting_owner` | `awaiting_owner` | Waiting on the owner's hands or decision. |
| 8 | Upstream | `upstream` | `upstream` | Lives in an upstream repo; waiting on their merge. |
| 9 | Blocked | `blocked` | `blocked` | Stalled on an external dependency. |
| 10 | Done | `done` | `done` | Completed. |
| 11 | Cancelled | `cancelled` | `cancelled` | Decided not to do. |

The board's render order is the Default workflow's step list (GET /api/issue-workflows),
not the status catalog's array order; the table above is that render order.
The `planning_2` key is a scar, not a mistake: ATHAN archived a stray `planning`
once and Multica never frees a key. Pass keys, never display names.

## Behavior the platform gives these columns

- Only built-in keys carry automation: `backlog` parks, leaving `backlog` enqueues
  the assignee, `done` on a child can wake the parent, failed runs roll
  `in_progress` to `todo`. Customs (`planning_2`/`planning`, `ready`,
  `awaiting_owner`, `upstream`) are lifecycle labels only.
- Record-keeping moves take `--no-start` (`multica issue status <id> <key> --no-start`).
- Customs cannot be archived while issues sit on them; built-ins cannot be edited
  or archived at all.

## Numbers and labels

- The identifier (`ATHA-42`) is the day-to-day handle.
- The old itsaplan number rides TWO places, both deliberate: the `Ticket number`
  property (hash icon) and the `#N` label (deep blue). When the owner says
  "ticket 687", they mean that number.
- Labels are per-workspace and case-insensitively unique. The palette lives in
  `~/multica-board/migration/label-colors.json`.

## Discipline carried over from the old board

- One ticket at a time; never move a ticket you were not asked to move.
- A comment answers another comment in its thread (`--parent`).
- Comments report what was done and what is left; no file paths or code in
  comments beyond what the owner needs to decide.
- The board itself lives on the server; nothing about it is committed to this
  repository. `board/` at the repo root is the frozen itsaplan archive (history
  only, never started).
