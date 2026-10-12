# Ticket 67: Widget digits follow the app locale, not the device locale

| Brief | Widget digits follow the app locale, not the device locale |
| --- | --- |
| Planned at | `7011229e`, version 2.0.136, 2026-10-12 (repaired after the step-1 stop: all fifteen anchors recount 1, the saved patch applies cleanly, and the three missed test sites are verified at this sha) |
| Planned by | Planning session 2026-10-12 |
| Needs first | nothing (57 DONE) |
| Parent | none |
| Group | widget props and widget modules (serializes with rows 68 and 69; disjoint from row 63, which touches no widget file under D77) |
| Batch budget | 2 (one code step; no device step rides this ticket) |
| Session budget | 2 |
| Steps count | 1 (one code step) |
| Device | rides the D41 confidence build (the queue row's ruling), no dedicated device step |
| Owner decisions still needed | none. D78 and D79 taken 2026-10-12, question round in the 63 planning session |

Repair (2026-10-12, after the step-1 execution stop): the executor's isolated
rerun proved the plan's test-site enumeration incomplete — a third and fourth
version pin (`widgetSnapshot.test.ts:175`, `stores/__tests__/widgetAndroid.test.ts:161`)
and the twelve golden digests of `widgetSimulation.test.ts` (`REAL_YEAR_TIMELINES`)
all fail at green, and Biome format collapses two of the plan-verbatim blocks.
This repair folds those sites into section 4, step 1's files, contracts and
green run, pins the twelve post-change digests measured by the isolated rerun,
and adds the saved-patch resume procedure to the red section. The red-verified
implementation itself is unchanged: `$HOME/athan-gitree/sessions/67-exec/step1-sixfiles.patch`
applies cleanly at `7011229e`.

## 1. Goal

Today the home widget's render-time digit map keys off
`__expoWidgetDeviceLocale` (the D61 resolver), while every baked string, time
and footer keys off the app's own locale. A forced app locale that differs from
the device renders one card in mixed scripts: `19د` beside `٠٣:٣٠`, or `1h 12m`
over Arabic-Indic rows. A real user hits it as an Arabic speaker on an
English-configured phone.

When DONE: every pushed widget props blob carries the active app locale id; the
home widget's digit map, its parsed legacy footers and the v1 fallback words key
off that id; props predating the field keep today's device-locale rendering
byte-for-byte; the null-props placeholder copy stays device-keyed (D44).

The owner's rules that apply: widget props are JSON-only with a schema version
and a `props == null` guard; the widget runtime imports nothing (closure law);
`expo-widgets` is pinned exact; the widget runtime load suite runs after any
install; no pixel changes.

## 2. Decisions

### 2.1 Taken

| ID | Decision | Who, when | Recorded |
| --- | --- | --- | --- |
| D78 | D61 is superseded for digit keying only: the widget digit map keys off the app locale baked into the props, with the device-locale chain kept as the fallback for props predating the field | Owner, 2026-10-12, question round in the 63 planning session | This table and the queue row |
| D79 | Static copy (null-props placeholder rows, stale cards' `STATIC` tables) stays device-keyed per D44 | Owner, same round (the ruling covers digits; D44 untouched) | This table |

Planner rulings from the proof: the field name (`locale`), the closed six-id
union written literally as the widget files already do
(`widgets/PrayerWidget.tsx:313`, so `widgetTypes.ts` gains no i18n import),
both version bumps (`WIDGET_PROPS_VERSION` 7 to 8,
`ANDROID_SNAPSHOT_VERSION` 3 to 4), and the exact fallback chain
(`props.locale` validated against the six ids, else today's
`__expoWidgetDeviceLocale` prefix match).

### 2.2 The executor must not decide

- Whether the lock widget changes: it has no digit map (its countdown is a
  native SwiftUI timer and its times are baked props), so it changes only where
  the proof shows a digit or legacy-footer read.
- Any new string, any schema shape beyond the plan's, any version number beyond
  the plan's.

## 3. Pre-flight

`scripts/preflight-67.sh`, committed in this folder. The executor saves a copy to
`$TMPDIR` and runs `bash $TMPDIR/preflight-67.sh` with the repository root as the
working directory. It checks: `uat` checked out, clean tree, `origin/uat` merged
in, `package.json` version at 2.0.122 or higher, and every anchor under
`scripts/anchors/` counting exactly 1 in its source file. It ends
`PREFLIGHT OK`.

## 4. Background the executor needs

The code map (from the fact pack, verified against `fc1e3b89`):

- The digit map and its keying: `widgets/PrayerWidget.tsx:318-335`. The map
  lives inside the widget function (the closure law rejects module-scope
  references), keyed off `localeKey` derived from
  `__expoWidgetDeviceLocale` (`:312-316`). Seven call sites: the Android
  countdown label `ALabel` (`:406-408`), the Android day footer `AFooter`
  (`:417`, `:420`), the iOS legacy-footer derivation for v6 entries (`:682`,
  `:686`).
- The device-locale reads: `widgets/PrayerWidget.tsx:312` and
  `widgets/LockPrayerWidget.tsx:133`, `:377`, `:610` (the last three feed only
  static copy rows, D79 keeps them). The writer is the runtime patch
  `patches/expo-widgets+58.0.14.patch:38` (Android JSI) and `:158` (iOS
  extension), pinned by `shared/__tests__/widgetOpenAppPatch.test.ts:57-59`.
- The app-side locale: `shared/i18n/locale.ts:38-43` exports
  `currentLocaleId(): LocaleId` (closed union, `LOCALE_IDS` at `:15`). Not
  re-exported from the `@/shared/i18n` barrel; import from
  `@/shared/i18n/locale`. `stores/widget.ts:46-47` imports only from
  `widgetTimeline` and `widgetTypes` today.
- The push pipeline: `shared/widgetTimeline.ts` `makeEntry` stamps
  `v: WIDGET_PROPS_VERSION` (`:207`) and localises times app-side (`:211`);
  `buildPrayerWidgetSnapshot` stamps `v: ANDROID_SNAPSHOT_VERSION` (`:345`) and
  bakes `strings: widgetStrings()` (`:349`). Versions declared at
  `shared/widgetTypes.ts:21` (7) and `:33` (3), each with a history doc block.
- Where the version numbers appear in the suites. Four pin sites edit, one
  digest table re-golds, the rest tolerate or read the constant:
  `shared/__tests__/widgetContract.test.ts:469-470`
  (`WIDGET_PROPS_VERSION` toBe 7) and `:484-485` (`ANDROID_SNAPSHOT_VERSION`
  toBe 3); `shared/__tests__/widgetSnapshot.test.ts:175`
  (`expect(snapshot.v).toBe(3)` inside `it('stamps the version and the
  schedule')`); `stores/__tests__/widgetAndroid.test.ts:161`
  (`expect(props.v).toBe(3)` inside the updateSnapshot mock assertion);
  `shared/__tests__/widgetTimeline.test.ts:292-295`, `:1135` and the stale
  entry's whole-object assertion at `:1132`. The digest table:
  `shared/__tests__/widgetSimulation.test.ts` `REAL_YEAR_TIMELINES` (the
  twelve-row table ending at `:698`) hashes
  `JSON.stringify(buildPrayerWidgetTimeline(...))` over both schedules at
  every push instant, and the `locale` field on every entry changes all twelve
  digests; the block's own protocol governs — "a deliberate design change to
  re-gold, never as a test to silence" — with the v7 footer re-gold (job 39
  step 7) as the precedent. Unchanged, named so the executor does not
  re-derive them: `stores/__tests__/widgetSettingsSync.test.ts:351` reads the
  constant and passed; `shared/__tests__/widgetStaticStrings.test.ts:215` and
  `:231` hold legacy `v: 7` fixtures that the new field legitimately
  tolerates and they passed.
- The digit suites that re-key: `shared/__tests__/widgetRenderer.test.ts:418`
  (v6 footer digits), `:500` (countdown label digits, expects `١٩د`), `:543`
  (v1 fallback words with native digits, expects `١h ١٢m`), `:564` (legacy
  Android footer); the forcing sites `:422/427`, `:503/521`, `:553/560`,
  `:574/582`. `shared/__tests__/widgetStaticStrings.test.ts` (forcing helper
  `:199-201`). `shared/__tests__/widgetContract.test.ts:655-664` (ar neutral
  card). No runtime `v` comparison exists in `widgets/`: tolerance is
  field-presence, documented per field in `widgetTypes.ts`.
- `shared/i18n/widget-statics.json:2` documents the null-props statics as
  device-keyed (D44).

Concurrency: the stamp happens in the push path (main thread, before
`updateTimeline`/`updateSnapshot`); the read happens in the widget process at
render. No timer races; the field is immutable data on the blob.

Proof (scratch worktree, deleted): with the device forced `en` and a snapshot
stamped `locale: 'ar'`, the current code rendered `19د` (the mixed-script
defect, red). After the change — the `locale` field on both prop shapes,
`WIDGET_PROPS_VERSION` 8, `ANDROID_SNAPSHOT_VERSION` 4, the stamp in `makeEntry`,
the stale terminal entry and `buildPrayerWidgetSnapshot`, and the digit key
resolved from the stamped locale with the device-locale fallback — the case
rendered `١٩د` (green). `tsc` clean, Biome clean on the three changed files.
The enumeration of what else broke at green, each a re-key the step names: the
two Android ar-device renderer tests (their fixtures must stamp `locale: 'ar'`;
the iOS v6 case's hand-built fixture survives through the fallback and the
contract stamps it anyway to pin the new path), the two v1 fixtures must strip
the field to stay true v1 blobs, the two `widgetContract` version pins (7 and
3), and one `widgetTimeline` stale-entry shape assertion. The planning proof
missed the four sites execution then proved: the `widgetSnapshot` and
`widgetAndroid` version pins and the twelve simulation digests (section 4),
plus two Biome format wraps. `widgetStaticStrings` and `widgetSettingsSync`
passed unchanged: their fixtures are legacy-shaped blobs the new field
legitimately tolerates, and the settings-sync pin reads the constant.

Execution (2026-10-12, stopped): the red phase verified exactly as planned
(5 failed, 131 passed, the received arrays quoted in `LOG.md`). The green run
then failed on fourteen counts, and an isolated rerun (a scratch worktree at
`d6ca9ade` plus only the six-file diff) attributed every one to this change:
the third and fourth pins above (both `Expected: 3, Received: 4`), the twelve
digest mismatches, and the two Biome format wraps (fourteen failing cases and
two format errors).
The full implementation, red-verified, is saved at
`$HOME/athan-gitree/sessions/67-exec/step1-sixfiles.patch` and applies
cleanly at `7011229e`. Between `d6ca9ade` and `7011229e` ticket 63's
execution landed (`shared/time.ts`, the i18n locale files, their suites)
beside the `widgetTypes.ts` doc reword; none of it touches the timeline
serialization, proven by the simulation goldens being byte-identical at both
shas with all 65 cases passing at `7011229e`, so no hash-relevant byte moved.
The twelve post-change digests the
isolated rerun measured are pinned in step 1's change contract 7; a different
received digest at re-gold time is a STOP.

## 5. Design

The approach: stamp the active app locale id onto every widget props blob the
app pushes, and resolve the home widget's digit key from that stamp, falling
back to today's device-locale chain when the blob predates the field. The
static-copy rows keep the device key (D79). The lock widget changes nothing: it
has no digit map.

The invariant, one sentence a test can check: the home widget draws Eastern
Arabic-Indic digits if and only if the stamped app locale is `ar`, or the stamp
is absent and the device locale resolves to `ar`.

Alternatives rejected: keying the static copy off the stamp too (D79 keeps
D44's ruled behaviour for null-props placeholders); re-reading the locale from a
module import inside the widget function (the closure law rejects module-scope
references); a separate boolean `arDigits` field (loses the id, blocks future
locales); bumping only one version (both shapes gain the field, so both
tolerance histories move).

**Acceptance criteria:**

- [R1.1] WHEN the app pushes an iOS timeline entry THE SYSTEM SHALL stamp the active app locale id on the entry's props (schema v8)
- [R1.2] WHEN the app pushes an Android snapshot THE SYSTEM SHALL stamp the active app locale id on the snapshot (schema v4)
- [R1.3] WHEN the home widget renders digits from a blob stamped `ar` THE SYSTEM SHALL draw Eastern Arabic-Indic digits even where the device locale resolves elsewhere
- [R1.4] WHEN the home widget renders digits from a blob with no stamp THE SYSTEM SHALL key off the device locale exactly as the D61 resolver does today
- [R1.5] WHEN the home widget renders a blob whose stamp holds a value outside the six locale ids THE SYSTEM SHALL fall back to the device-locale chain
- [R2.1] WHEN props are null THE SYSTEM SHALL render the device-keyed static copy rows unchanged (D44)
- [R2.2] WHEN the lock widget renders THE SYSTEM SHALL render byte-identically to today (no digit map exists there)

Design review: the version pins that move are four sites — the two contract
pins, the snapshot pin and the Android store pin — named by the proof and the
stopped execution; the twelve simulation digests re-gold under the table's own
protocol, with the received values pinned in the step; the renderer re-keys
are three fixtures plus the two new keying cases; the field is optional on
both shapes, so every stored blob from every prior release renders through the
fallback unchanged.

## 6. Steps

Checklist:

1. Step 1 — the locale stamp and the digit re-key
   (`steps/1-locale-stamp.md`)

Scope guard: `widgets/LockPrayerWidget.tsx`,
`shared/i18n/widget-statics.json`, `patches/expo-widgets+58.0.14.patch` and the
patch-pin suite are out of scope (D79, D44 and the patch already carry the
device locale the fallback reads).

## 7. Device proof

None beyond the D41 confidence build the queue row names: the face is verified
there (an `ar` app locale on an `en`-configured device renders one script per
card). No dedicated step, no build, no phone.

## 8. Records

The findings text the executor appends to `LOG.md` under
`## Ticket 67 (2026-10-12)`:

```
Widget digits follow the app locale: every pushed iOS entry (v8) and Android
snapshot (v4) carries the active locale id; the home widget's digit map, its
parsed legacy footers and the v1 fallback words key off the stamp, with the
device-locale chain kept for blobs predating the field (D78). Static copy stays
device-keyed (D79); the lock widget is untouched.
```

The queue cell the lead applies on DONE:

```
DONE <date>, audited: widget digits key off the app locale stamped on the props
(v8 entries, v4 snapshots), device-locale fallback for older blobs; the mixed-
script card is gone; static copy and the lock widget unchanged (D78, D79).
```

Docs commit message: `<VERSION> - docs(plans): ticket 67 READY: widget digits
follow the app locale, 1 step`.

## LOG.md ledger contract

Every step entry in `LOG.md` opens with the heading `### Step <NN> — <state>` and
ends with a line `session: <ses_id>`. Planning sections use
`## Planning (<date>)` and `## Ticket <N>`.

## 9. Push

None. The executor worker never pushes. The lead pushes after the reviews pass.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| A widget suite fails on an entry-shape `toEqual` after the stamp | The assertion pins the whole props object | Add `locale: <the suite's active locale>` to the expected object; the proof found one such assertion in `widgetTimeline.test.ts` |
| The two Android ar-device renderer cases fail after the change | Their fixtures now stamp the test's active locale (`en`) and the device key no longer reaches the digits | Stamp `locale: 'ar'` in those fixtures and strip the field from both v1 fixtures; add the two new keying cases the step names |
| `widgetOpenAppPatch.test.ts` fails | The patch was edited | Revert: the patch is the fallback's data source and is out of scope |
| The board or a flow reports a widget crash on old blobs | The stamp validation misses a shape | The resolver accepts only the six exact ids; anything else falls back. `STOP:` with the blob's shape if a third shape exists |
| A golden-digest case still fails after the re-gold | The received digest differs from the value contract 7 pins | `STOP:` the timeline serialization moved beyond the `locale` field; quote both digests |
| `widgetSnapshot` or `widgetAndroid` fails `Expected: 3, Received: 4` after the version bump | A pin edit from contract 6 was skipped | Apply the two `toBe(4)` edits; both suites then pass |

Anticipated review fixes, word for word:

- A version history doc block missing its `v8` or `v4` line: add the line the
  types file carries.
- A re-keyed test still forcing `__expoWidgetDeviceLocale` where the stamp now
  decides: keep the forcing only in the fallback case.

Restore list: step 1 reverts `shared/widgetTypes.ts`,
`shared/widgetTimeline.ts`, `widgets/PrayerWidget.tsx`,
`shared/__tests__/widgetRenderer.test.ts`,
`shared/__tests__/widgetContract.test.ts`,
`shared/__tests__/widgetTimeline.test.ts`,
`shared/__tests__/widgetSnapshot.test.ts`,
`stores/__tests__/widgetAndroid.test.ts` and
`shared/__tests__/widgetSimulation.test.ts`.

## 11. Subagents

Planning: `explore` workers answer fact questions, `athan-plan-griller` grills
the draft. Delivery: the lead dispatches the `athan-executor` and
`athan-reviewer` workers. Every worker may call `vision` for an image it cannot
see. Nothing else, ever.

## 12. Report to the owner

Plain sentences on what changed and what was proven, the progress table, the
decisions waiting on the owner (none: D78 and D79 are taken), the four-line
handoff.
