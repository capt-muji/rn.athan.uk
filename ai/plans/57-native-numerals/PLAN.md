# Job 57: native numerals per language

| Field | Value |
| --- | --- |
| Brief | Queue row 57 (asked 2026-10-11): every language renders Latin digits today; the owner wants each language's native numerals. Reverses D21 for ar |
| Planned at | `6195ab1f` |
| Needs first | row 39 (shared code surfaces; execution behind its DONE) |
| Parent | none |
| Group | i18n surfaces (`shared/i18n/*`, `shared/time.ts`), shared with no other open row |
| Batch budget | 6 |
| Session budget | 12 |
| Steps | 4 (no device step; D41's confidence build covers the device) |
| Device | none |

## 1. Goal

**What is wrong today:** every language renders Latin digits. The countdown, list
times, dates, notifications, widgets and sheet counts all draw 0-9 regardless of the
active locale, so Arabic reads natively everywhere except its numbers.

**What is true when DONE:** Arabic draws Eastern Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩)
everywhere a user can see a number: list times, countdown, ago badge, Gregorian and
Hijri dates, notification titles and bodies, channel names with counts, widget times,
dates, footers and countdown labels, and sheet counts. en, ms, so, hi and th keep
Latin digits byte-identical to 2.0.49. Stored keys, log lines and API traffic stay
Latin forever. The iOS widget hero countdowns keep their native SwiftUI timers with
system-drawn digits (D58).

**How the owner notices:** she switches to Arabic and the numbers are Arabic - the
clock, the countdown, the dates, the notifications, the widgets.

**Owner rules that apply:** the governing goal G1 (completely native: layout, digits,
letters, symbols) and D54 to D58, recorded in section 2.

## 2. Decisions

**2.1 Taken.**

| # | Decision | Taken | Where |
| --- | --- | --- | --- |
| G1 | Governing goal: completely native to the active language in layout, digits, letters, symbols | Owner, 2026-10-11 | this file, rows 57 and 58 |
| D54 | ar uses Eastern Arabic-Indic digits (reverses D21 for ar) | Owner, 2026-10-11 round 1 | this file |
| D55 | hi keeps Latin digits (D21 stands) | Owner, 2026-10-11 round 1 | this file |
| D56 | th keeps Latin digits (D21 stands) | Owner, 2026-10-11 round 1 | this file |
| D57 | Native digits render everywhere user-visible; the clock colon and separators follow the digits (only the ten digit glyphs map; colon, spaces and punctuation stay ASCII); stored keys, logs and API traffic stay Latin | Owner, 2026-10-11 round 1 | this file |
| D58 | The iOS widget hero countdowns keep their native SwiftUI timers and system-drawn digits; no pre-rendered replacement, the per-second tick stands | Owner, 2026-10-11 round 2 | this file |
| D61 | The widget digit edges localise through an inline ten-glyph map inside the widget function, reading the existing `globalThis.__expoWidgetDeviceLocale` resolver (`PrayerWidget.tsx:312-316`), never a static import (the widget closure walk fails any module-scope reference) | Planning, forced by the closure law, 2026-10-11 | this file, step 03 |

**2.2 The executor must not decide.** Any output the plan does not predict: STOP and
ask. No en byte changes. No stored key, identifier or log line localises. The Hijri
shape and order never change beyond digit glyphs.

## 3. Pre-flight

`scripts/preflight-57.sh` in this folder. The executor saves a copy to `$TMPDIR`, runs
it from there. It checks: the checkout is on `uat`, a clean tree, `origin/uat` fetched
and merged, the version not lower than the landing version of row 39, row 39 DONE in
the queue, every anchor under `scripts/anchors/` counts exactly 1. It ends
`PREFLIGHT OK`.

## 4. Background the executor needs

The code map, one line per file (anchors carry the verbatim regions):

- `shared/i18n/digits.ts` (new) - the localiser this job adds.
- `shared/i18n/index.ts` - `t()` and the `{token}` substitution (the
  `bridge-substitution` anchor); `ParamsOf`.
- `shared/time.ts` - the six functions that feed eight of the fifteen digit edges:
  `formatPrayerTime` (with `pad2`, `adjustTime`), `formatTime`, `formatTimeAgo`,
  `formatDateLocalized`, `formatHijriDateLocalized`, `footerFor`.
- `stores/countdown.ts:93` - the display atom funnels through `formatTime`; one edge.
- `components/sheets/parts/SoundItem.tsx:18` - the local `m:ss` preview formatter
  (a straggler).
- `components/sheets/parts/Stepper.tsx:71` - the raw visible `{value}` (a straggler;
  its a11y label rides the bridge).
- `widgets/PrayerWidget.tsx:383` - the inline `ALabel` widget countdown (a straggler);
  `:654` the legacy footer parse (parses Latin, renders localised); `:729` and
  `widgets/LockPrayerWidget.tsx:263,747` the native `Text(timerInterval:)` sites
  (untouched, D58). The widget digit edges localise through an inline ten-glyph map
  inside the widget function reading the existing `__expoWidgetDeviceLocale` resolver
  at `:312-316` (D61; a static import fails the closure walk).
- `shared/notifications.ts:182,410,513` - the `{n}` notification and channel sites
  (covered by the bridge; no call-site change).
- The census's pinned-assertion inventory, enumerated for step 04:
  `components/prayer/__tests__/Time.test.tsx:68,81`;
  `components/countdown/__tests__/Countdown.test.tsx:32,42,53,65,76`;
  `components/sheets/parts/__tests__/SoundItem.test.tsx:159`;
  `components/sheets/screens/__tests__/Alert.test.tsx:407`;
  `components/sheets/screens/__tests__/Sound.test.tsx:87`;
  `stores/__tests__/countdown.test.ts:669,673,677,687`;
  `shared/__tests__/time.test.ts:44-74,79-123,152-167,191-225,586-592`;
  `shared/__tests__/dateLocalized.test.ts:63,77-78`;
  `shared/__tests__/notifications.test.ts:310-311`;
  `shared/__tests__/i18nBridge.test.ts:54-56`;
  `shared/__tests__/prayerIdContract.test.ts:108-113`;
  `shared/__tests__/widgetRenderer.test.ts:260,474-475,500-502,537-539,667,672,1020`;
  `shared/__tests__/widgetLockRenderer.test.ts:221,235,244`;
  `shared/__tests__/widgetSimulation.test.ts:238-247,324,336,337`.

Why the obvious fix is wrong: localising inside `pad2` or `adjustTime` would leak into
stored-key paths and the `--:--` sentinels; a `toLocaleString`-style Intl format
reorders groupings and inserts separators RN Text width tables never measured; and
touching the native timers breaks the per-second tick (D58).

## 5. Design

**Invariant (one sentence a test can check):** after every step, an English-locale
device renders byte-identical output to 2.0.49, only ar's digits change, every stored
key, log line and API byte stays Latin, and the iOS widget timers keep ticking per
second.

**The approach:** one digit localiser at the rendering edge: `localiseDigits` in
`shared/i18n/digits.ts`, a ten-glyph Eastern Arabic-Indic map applied only when
`currentLocaleId()` is `'ar'` (call-time, job 39's loader law), identity otherwise.
The six `shared/time.ts` functions pass their composed output through it as their last
step; the bridge localises numeric parameter values at substitution; six point fixes
call the same function. Nothing parses localised digits.

**Concurrency trace:** notification copy freezes at schedule time exactly as today, so
an ar switch re-arms under the convergence pass job 39 shipped; widget props bake
localised digits at push time; the width atoms and the measure layer are untouched
(their measured strings carry no digits).

**Design review:** the explore census (2026-10-11, in section 4's shape), job 39's
loader and capture lessons, and the griller pass.

### Acceptance criteria (EARS)

- [R1.1] WHEN a digit renders in the active ar locale THE SYSTEM SHALL draw Eastern Arabic-Indic glyphs
- [R1.2] WHEN a digit renders in en, ms, so, hi or th THE SYSTEM SHALL draw Latin digits byte-identical to 2.0.49
- [R2.1] WHEN t() interpolates a numeric parameter THE SYSTEM SHALL localise its digits at substitution
- [R3.1] WHEN the Gregorian or Hijri date renders in ar THE SYSTEM SHALL compose native digits in the same shape and order, with no era affix
- [R4.1] WHEN widget props bake times, dates, footers or countdown labels THE SYSTEM SHALL bake localised digits
- [R5.1] WHEN the iOS widget countdown renders THE SYSTEM SHALL keep the native timer's system-drawn digits (D58)
- [R6.1] WHEN a stored key, log line or API value carries digits THE SYSTEM SHALL keep them Latin
- [R7.1] WHEN the list renders in ar with native digits THE SYSTEM SHALL leave the per-locale width keys and the measure layer unchanged (the measure layer reads prayer names only, which carry no digits)

## 6. Steps (checklist; each step is a file under `steps/`)

1. `01-digit-core.md` - `shared/i18n/digits.ts`, the six shared/time.ts functions
   routed through it. Weight 2.
2. `02-bridge-and-notifications.md` - the i18n bridge's numeric substitution, the
   notification and channel sites. Weight 2.
3. `03-point-fixes.md` - SoundItem's local m:ss, the widget ALabel, the legacy footer
   render, the stepper's raw value, the v1 fallback literals. Weight 2.
4. `04-tests-and-records.md` - the pinned assertions flip locale-aware (en stays
   byte-identical), the width re-measure proof, LOG and queue records. Weight 1.

## 7. Device proof

None as a plan step. The owner's D41 confidence build renders every surface in every
locale and carries this job's visual verification; the suites prove the bytes.

## 8. Records

`LOG.md` gains each step's entry as it lands. The queue-row cell the lead applies on
PASS: "DONE 2026-<date>, audited: native numerals landed - ar draws Eastern
Arabic-Indic digits on every user-visible surface (D54, D57), the other five locales
byte-frozen Latin (D55, D56), the bridge and six point fixes covered, the iOS native
timers kept (D58); en bytes identical; the confidence build carries the visual
verification (D41)." The plan folder dies in the audit merge per the repo rule.

## 9. Push

None. The executor never pushes; the audit session pushes after PASS.

## 10. When something goes wrong

| Symptom | Response |
| --- | --- |
| A rendered string localises that must not (a stored key, a log line) | STOP |
| A test asserting en output changes bytes | STOP: en is byte-frozen |
| The Hijri Intl output shape changes beyond digit glyphs | STOP: R3.1's shape is frozen |
| The widget runtime load suite fails after the static import | STOP (the closure law) |

## 11. Subagents

Planning used `explore` workers for the census; delivery is the lead's
`athan-executor` and `athan-reviewer` dispatches per the workflow.

## 12. Report to the owner

Plain sentences: Arabic numbers are Arabic everywhere the eye lands, what the suites
prove, what the confidence build should show her, and the iOS timer exception she
ruled. Progress table. The four-line handoff.

## Resume from

The frontier is closed and the facts are in. The griller pass runs next.
