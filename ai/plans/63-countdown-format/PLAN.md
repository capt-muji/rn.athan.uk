# Ticket 63: Countdown format: numbers and colons only, every language

Resume from: section 4 code map (deep read of Countdown.tsx, overlay countdown,
LockPrayerWidget countdown rendering, widgetIo version guards, i18n gates and lock,
notifications title composer, and every covering test). Sections 1 to 3 carry the
owner's ask from the queue row; no interview is possible this session (owner away,
her instruction: plan the tickets that need no questions). Facts learned so far are
in section 4.

| Brief | Countdown format: numbers and colons only, every language |
| --- | --- |
| Planned at | pending (uat sha, version, date) |
| Planned by | planning session 2026-10-12 |
| Needs first | nothing (57 DONE) |
| Parent | none |
| Group | countdown/time format + widget strings (serializes with rows 67 and 68, which touch the same widget files) |
| Batch budget | pending |
| Session budget | pending |
| Steps count | pending |
| Device | pending |
| Owner decisions still needed | none (derivation rulings recorded in section 2.1) |

## 1. Goal

Pending draft.

## 2. Decisions

Pending draft.

## 3. Pre-flight

Pending draft (scripts/preflight-63.sh).

## 4. Background the executor needs

Pending draft. Facts landed so far:

- `shared/time.ts` owns `DurationLabels`, `durationLabels()`, `formatTime`,
  `formatTimeAgo`; unit words come from catalog keys `duration.h/m/s/now`.
- `stores/countdown.ts:96` renders the hero and overlay countdown strings through
  `formatTime(seconds, !showSeconds)`.
- `hooks/usePrayerAgo.ts:35` renders the ago badge through `formatTimeAgo`.
- `widgets/PrayerWidget.tsx` `ALabel` (Android, minutes-only) renders
  `${minutes}m` / `${hours}h ${minutes}m` from the snapshot's `strings`.
- `shared/widgetTimeline.ts` `widgetStrings()` bakes `duration.h/m/s/now` into the
  Android snapshot; `shared/widgetTypes.ts` says `s` and `now` already ride unread.
- `shared/notifications.ts:182` composes the reminder title from
  `notification.reminder` (`{name} in {n}m` in en); `:513` the channel name from
  `channel.reminder`. Six catalogs carry both.
- `components/sheets/parts/SoundItem.tsx` already renders a colon countdown
  (`mins:secs`) — the in-house precedent for the new format.
- `shared/__tests__/i18n.test.ts:167-170` pins the en duration values.

## 5. Design

Pending draft.

## 6. Steps

Pending draft.

## 7. Device proof

Pending draft.

## 8. Records

Pending draft.

## LOG.md ledger contract

Every step entry in `LOG.md` opens with the heading `### Step <NN> — <state>` and
ends with a line `session: <ses_id>`. Planning sections use
`## Planning (<date>)` and `## Ticket <N>`.

## 9. Push

None. The executor worker never pushes. The lead pushes after the reviews pass.

## 10. When something goes wrong

Pending draft.

## 11. Subagents

Planning: `explore` workers answer fact questions, `athan-plan-griller` grills the
draft. Delivery: the lead dispatches the `athan-executor` and `athan-reviewer`
workers. Every worker may call `vision` for an image it cannot see. Nothing else,
ever.

## 12. Report to the owner

Pending draft.
