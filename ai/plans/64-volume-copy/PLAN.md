# Ticket 64: Volume-source copy: alert and sound sheets plus a help question

| Brief | Volume-source copy: alert and sound sheets plus a help question |
| --- | --- |
| Planned at | `1e9c7194`, version 2.0.149, 2026-10-13 (anchors verified at this sha) |
| Planned by | Planning session 2026-10-13 |
| Needs first | nothing (39 and 63 DONE) |
| Parent | none |
| Group | the six i18n catalog files plus the Alert, Sound and Help surfaces (serializes with any open catalog ticket) |
| Batch budget | 2 (one code step, no device step) |
| Session budget | 2 |
| Steps count | 1 (one code step) |
| Device | none: the copy rides the D41 confidence build; no pixel moves |
| Owner decisions still needed | none. Her 2026-10-12 rulings recorded in section 2; the reworded help question and the six-language drafts take her audit veto (D42's superseded shape, as row 59 used) |

## 1. Goal

The alert sheet and the athan sound sheet carry no explanation of which
volume actually controls the athan, and the Help question
`help.q.quiet` ("Why is the athan so quiet?") asks a symptom rather than the
question ("Which volume controls the sound level?"). The owner wants the
explanation in BOTH sheets for absolute clarity, plus the reworded help
question, and the copy platform-specific by rule: Android states the alarm
volume (row 27's measured proof: `usage: ALARM`, which the ringer switch does
not mute); iOS states its own documented path.

When DONE: both sheets render one platform-keyed volume note; the Help modal
carries the reworded question with a platform-split answer on BOTH platforms
(today the quiet answer is Android-only); all six catalogs carry the new
keys in one commit with the lock re-taken; the measured claims cite
`ai/plans/27-silent-mode-bypass/FINDINGS.md` as the answer already does; the
diff adds no style entry and changes no line outside the listed files plus
the Help modal's ruled copy.

The owner's rules that apply: copy in both sheets (her ruling), the
platform-specific rule, answer text ≤ 160 characters in en
(`help.test.ts:155-161`), no `\n` in help answers, the word "alert" banned
in help copy (`help.test.ts:93-99`), no internals or app names, and no pixel
changes beyond the ruled copy.

## 2. Decisions

### 2.1 Taken

| ID | Decision | Who, when | Recorded |
| --- | --- | --- | --- |
| D64.1 | The copy lands in BOTH sheets, keyed by platform, even though Help already carries the question | Owner, 2026-10-12, in session | The queue row |
| D64.2 | The copy is platform-specific: Android states the alarm volume (row 27's proof); iOS states its own path, verified against Apple's documentation | Owner (the rule) and planner (the verification), 2026-10-12/13 | This table |
| D64.3 | The help question is reworded to "Which volume controls the sound level?" and its answer joins the split: iOS gains an answer it lacks today | Owner, 2026-10-12 | The queue row |
| D64.4 | The iOS path (verified 2026-10-13): a standard notification sound plays at the Ringer & Alerts volume; Silent mode "doesn't ring or play alerts or other sound effects" (support.apple.com, Silence iPhone) and Focus modes silence it | Planner, from Apple's documentation | This table and the en copy |
| D64.5 | The iOS copy says plainly what controls the sound (the ringer volume) and what silences it (the Ring/Silent switch and Focus), because iOS has no alarm-stream bypass: row 27's Critical Alerts attempt was refused | Planner, from D64.4 | Step 1 |
| D64.6 | The Android contrast names ring volume, the term the landed help answer already uses (the queue row's "notification volume" was its informal shape) | Planner, from the shipped `help.a.quiet` wording | This table |
| D64.7 | The help answers carry no `steps` member: `[]` fails `help.test.ts:149` and renders an empty fix block | Planner, from the gate and the Help modal | Step 1 |
| D64.8 | The help answers say "ringer volume" while the sheet notes name `Ringer & Alerts`: the en help gate bans the word "alert", so the full setting name lives in the sheet copy alone | Planner, from the alert-word gate | Step 1 |
| D64.9 | The null-answer drop goes: the volume entry answers both platforms, the old quiet entry's `ios: null` was the catalog's only null, so `getHelpTopics`'s `if (!answer) return [];` and the `ios`/`android` `HelpAnswerKeys \| null` union become dead code no test can reach (`HELP_ENTRIES` is module-internal) and the pre-commit coverage gate refuses the commit. Step 1 deletes the guard and the union; the split machinery and `HelpTopic` stand | Planner replan, 2026-10-13, from the executor's verified stop | LOG.md replan section |

The drafts take the owner's audit veto (the D42-superseded shape row 59
used): planner-drafted, she strikes or rewords any string at audit.

### 2.2 The executor must not decide

- Any wording beyond the five new keys and the two rewrites in step 1.
- The platform split shape (two keys per note, chosen in the component by
  `Platform.OS`, the Help.tsx pattern).
- Whether any other surface gains copy: none does.

## 3. Pre-flight

`scripts/preflight-64.sh`, committed in this folder. The executor copies it
to `$TMPDIR` and runs `bash $TMPDIR/preflight-64.sh` from the repository
root. It checks: `uat` checked out, clean tree, `origin/uat` merged in,
`package.json` at 2.0.149 or higher, the six catalogs present, and every
anchor counting exactly 1. It ends `PREFLIGHT OK`.

## 4. Background the executor needs

From the 2026-10-13 fact pack, verified at `1e9c7194`:

- The alert sheet: `components/sheets/screens/Alert.tsx:215-216` renders the
  Athan card (`alert.card.athan`, `alert.card.athanHint`) and `:227-249` the
  reminder cards; a footnote-style block pattern exists at `:95-100`
  (`alert.unavailable` in `styles.unavailable`); each card carries a
  `cardHint` line already.
- The sound sheet: `components/sheets/screens/Sound.tsx:181-205` wraps the
  row list in a card whose hint line is `sound.notificationSound`
  (`:183`, `styles.cardHint` at `:219-223`) — the natural seat for the note.
- The Help modal: `components/modals/Help.tsx:121` picks
  `getHelpTopics(Platform.OS === 'android' ? 'android' : 'ios')`; the split
  shape lives in `shared/help.ts:34-38` (`HelpEntryKeys`: one `question`,
  then `ios`/`android` `HelpAnswerKeys`), filtered at `:141-148` (an entry
  with a null answer drops off that platform). Today's quiet entry:
  `shared/help.ts:114-121`, `question: 'help.q.quiet'`, `ios: null`,
  `android: { text: 'help.a.quiet', steps: ['help.step.alarmVolume'] }`.
- The en values today (`shared/i18n/en.ts`): `help.q.quiet` "Why is the
  athan so quiet?", `help.a.quiet` "It plays at alarm volume, not ring
  volume.", `help.step.alarmVolume` "Raise the Alarm volume in your sound
  settings" (`:66-68`).
- The gates a new key passes: `catalogGates.test.ts:68-70` (every locale
  holds exactly the en key set), `:72-80` (token parity),
  `:129-139` (the translated-length gate fails only when a value is over 3x
  its en length AND over 90 characters),
  `i18n.test.ts:32+` with `PINNED_LITERALS` (`:46-78`, `:98-103`) byte-pinning
  en values — the plan's exact en strings are what that test expects;
  `help.test.ts` (≤160 chars at `:155-161`, the word "alert" banned at
  `:93-99`, the quiet entry's Android-only split at `:63-69` — this changes
  to both platforms); `catalogLock.test.ts:20-25` fails until `yarn i18n:lock`
  re-takes the lock after the en edits (`scripts/catalog-lock.mjs`).
- The dist artifacts are gitignored (`.gitignore:4`); regeneration is a
  local step (`I18N_BRIDGE=export I18N_LOCALE=<loc>`, the row 59 pattern).
- The measured Android claim: `shared/notifications.ts:364-372`
  (`ALARM_AUDIO_ATTRIBUTES`, `usage: ALARM`, `enforceAudibility`),
  `shared/help.ts:9-14` cites `ai/plans/27-silent-mode-bypass/FINDINGS.md`,
  and `notifications.test.ts:455-465` pins the alarm stream.
- Prior copy tickets (rows 62, 63): one commit touching all six catalogs,
  the lock, the affected tests and the version files together.

Concurrency: none new; catalog constants and two text lines.

## 5. Design

The approach: five new key pairs and two rewrites in the six catalogs, a
platform-chosen note line in each sheet, and the help entry rebuilt with both
platform answers. The iOS copy is the documented path (D64.4); the Android
copy stays row 27's measured truth.

**Acceptance criteria:**

- [R1.1] WHEN the alert sheet renders on Android THE SYSTEM SHALL show the text `volume.note.android`
- [R1.2] WHEN the alert sheet renders on iOS THE SYSTEM SHALL show the text `volume.note.ios`
- [R1.3] WHEN the sound sheet renders THE SYSTEM SHALL show the same platform-keyed note above the sound list
- [R2.1] WHEN the Help modal renders on Android THE SYSTEM SHALL show the question `help.q.volume` and the answer `help.a.volume.android`
- [R2.2] WHEN the Help modal renders on iOS THE SYSTEM SHALL show the same question and the answer `help.a.volume.ios`
- [R3.1] WHEN any of the six catalogs is read THE SYSTEM SHALL carry every new key with the plan's exact bytes and re-take the lock
- [R4.1] WHEN the step 1 diff is read THE SYSTEM SHALL add no style entry and change no line outside the files listed plus the Help modal's ruled copy (D64.3)

## 6. Steps

Checklist:

1. Step 1 — the five key pairs, the two rewrites, the split help entry
   (`steps/1-volume-copy.md`)

Scope guard: the notifications module, the audio attributes and every other
sheet are out; the copy and the help entry are the whole ticket.

## 7. Device proof

None beyond the D41 confidence build: the two new lines and the reworded
question are text, the same suites that render the sheets assert them, and
the owner's audit veto covers the wording.

## 8. Records

The findings text the executor appends to `LOG.md` under
`## Ticket 64 (2026-10-13)`:

```
The volume-source copy landed in both sheets, platform-keyed: Android states
the alarm volume (row 27's proof), iOS the documented Ringer & Alerts path;
the Help question is reworded and answers on both platforms; all six
catalogs carry the new keys and the lock is re-taken.
```

The queue cell the lead applies on DONE:

```
DONE <date>, audited: alert and sound sheets carry the platform-keyed volume
note (Android alarm volume, iOS Ringer & Alerts per Apple's documentation),
the Help question is reworded with an iOS answer added; six catalogs and the
lock in one commit.
```

Docs commit message: `<VERSION> - docs(plans): ticket 64 READY: volume-source
copy, 1 step`.

## LOG.md ledger contract

Every step entry opens with `### Step <NN> — <state>` and ends with
`session: <ses_id>`. Planning sections use `## Planning (<date>)`.

## 9. Push

None. The executor never pushes; the lead pushes after the reviews pass.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| `catalogLock.test.ts` fails after the en edits | The lock was not retaken | `yarn i18n:lock`, commit the lock file |
| `i18n.test.ts` fails on a pinned literal | An en string differs from this plan | Copy the plan's byte-exact string |
| `help.test.ts` fails on the quiet entry | The Android-only split assertion still stands | Update it to both platforms, per R2.1/R2.2 |
| A translated value trips the length gate | The draft is long | Shorten within the plan's meaning; a STOP if the meaning cannot hold |

Anticipated review fixes, word for word:

- A platform ternary in the wrong place: both sheets choose the key at
  render through `Platform.OS`, the Help.tsx pattern.
- The iOS copy naming a setting that does not exist: the sheet note carries
  the documented names (`Ringer & Alerts`, `Ring/Silent`); the HELP answer
  says "ringer volume" on purpose, because the en help gate bans the word
  "alert" and "Ringer & Alerts" trips it (D64.7's family). A reviewer asking
  the help answer to carry the full setting name is wrong here.

Restore list: step 1 reverts `shared/i18n/en.ts`, `ar.ts`, `ms.ts`, `so.ts`,
`hi.ts`, `th.ts`, `catalog-lock.json`, `shared/help.ts`,
`components/sheets/screens/Alert.tsx`, `components/sheets/screens/Sound.tsx`
and the five affected suites named under Files, `app.json` and
`package.json`.

## 11. Subagents

Planning: `explore` workers answer fact questions, `athan-plan-griller`
grills the draft. Delivery: the lead dispatches `athan-executor` and
`athan-reviewer`. Nothing else, ever.

## 12. Report to the owner

Plain sentences, the progress table, the copy table for her audit veto, the
four-line handoff.
