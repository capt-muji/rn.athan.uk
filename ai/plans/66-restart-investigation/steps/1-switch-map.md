# Step 1: The switch map and the cache inventory

Requirements: R1.1, R1.2
Weight: 1

## Anchor check

```bash
cd "$(git rev-parse --show-toplevel)"
plan=ai/plans/66-restart-investigation
for a in switch-restart:stores/language.ts remount-key:app/_layout.tsx width-key:stores/ui.ts widget-await:stores/notifications.ts converge-stamp:stores/language.ts countdown-name:stores/countdown.ts launch-converge:app/index.tsx; do
  n="${a%%:*}"; src="${a#*:}"
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
    "$plan/scripts/anchors/$n.txt" "$src"
done
```

Expected: seven lines, each `1`. Any other count: `NEEDS_CONTEXT: NEEDS REPLAN, <the anchor
and its count>`.

## Goal

`FINDINGS.md` sections 1 and 2 exist: the switch-path map, one row per hop, and the cache
inventory. No code changes.

## Branch

`git checkout -b docs/66-1-switch-map uat`

## Files

- `ai/plans/66-restart-investigation/FINDINGS.md` (new, sections 1 and 2)
- `ai/plans/README.md` (ticket line: step 1 in flight)
- this plan folder's `PLAN.md` and `LOG.md`

## Red

`FINDINGS.md` does not exist. The step's own commit creates it: the "red" is the file's
absence, recorded as such in LOG.md.

## Change contracts

Section 1, the switch-path map: one row per hop, in order, each with its file:line and one
clause of role. The expected hops are the PLAN.md section 4 table's first seven groups: the
pick (`Language.tsx:44`, `languageSheet.ts:18-31`), the commit (`stores/language.ts:65-93`),
the locale bump (`shared/i18n/locale.ts:48-52`), the remount (`app/_layout.tsx:85-92`), the
convergence (`stores/language.ts:37-49`, `stores/notifications.ts:1672-1673`), the widget push
(`stores/widget.ts:237-256`), the dismiss and the D59 restart (`languageSheet.ts:29-31`,
`stores/language.ts:77-89`). A hop whose line no longer matches is the PLAN.md section 10
contradiction row: re-open the file before writing.

Section 2, the cache inventory: one row per cache or selector, with columns cache, file:line,
reset trigger today, and what an always-restart changes. The expected rows: the per-locale
width atoms and the module Map (`stores/ui.ts:114`, `:122-131`, the widen guard `:249-263`),
the Android channel dedup caches (`shared/notifications.ts:430-448`), the countdown name and
display selectors (`stores/countdown.ts:74-78`, `:90-94`), the catalog loader's runtime state
(`shared/i18n/loader.ts` and `shared/i18n/index.ts`: read both, record what each holds across
a switch), the baked widget strings (`shared/widgetTimeline.ts:62-71`, `:304-355`), and the
last-armed stamp (`stores/language.ts:22`). End section 2 with the transient's confirmed
mechanism: planning's working diagnosis is the selectors' derived cache surviving one
wall-clock tick (`stores/countdown.ts:408-438`); confirm it against the code and the row 57
audit record, or record the candidate mechanisms and the test that would decide.

## Green run

A scripted check opens every file:line row in both sections and finds the claimed symbol or
statement on the line (0 mismatches); five rows spot-opened with `sed`. Sections 1 and 2 read
as one document.

## Break script

None for a docs step; the LOG entry records the row counts instead.

## Version and commit

Fetch `origin uat` first. Next patch after uat's `package.json`, the three places, `app.json`
first.

```
<VERSION> - docs(plans): 66 step 1, the switch map and the cache inventory
```

## Review checklist

- No file outside the plan folder and the queue changed.
- Every cache class the brief names appears: the per-locale width cache, the channel caches,
  the transient.
- Every row carries file:line and its reset trigger.

## Merge

`git checkout uat && git merge --no-ff docs/66-1-switch-map -m "<VERSION> - merge docs/66-1-switch-map: switch map and caches (66 step 1)"`

## Done when

Checklist ticked, LOG.md entry under `### Step 01 — done` with the `session:` line.
