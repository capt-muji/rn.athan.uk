---
name: language-wave
description: Run a language translation or transliteration change across the catalogs - new keys, reworded English, glossary rulings. Covers the targeted wave process, the transliteration register, the verify tooling, judging precision, gates and locks. Use whenever a change adds, edits or rewords user-facing copy, or asks whether a word translates or transliterates.
---

# language-wave

Any change to user-facing copy - new keys, reworded English, a new feature's strings - goes
through this wave. It never re-opens the whole catalog.

## This skill improves itself

Owner order 2026-11-07: every mistake a wave finds, and every fix it lands, updates this
skill in the same breath - a lesson that lives only in a ticket's history will be repeated.
When a wave corrects a translation class of error (a glyph, a spelling convention, a gate
gap, a process wrong-turn like a full-catalog verify or an over-engineered layout), add the
row or rule here before the ticket closes. The register and the workflow grow with every
wave; nothing is learned twice.

## The prime directive: targeted, never total

Owner order 2026-11-07: a wave touches exactly the keys the change added, edited or reworded,
in all 74 non-English locales. Untouched surfaces (settings, advanced sheet, anything else)
never re-verify. 74 locales over a handful of keys is a minutes-scale job, not hours; a
full-catalog verify pass is a defect, not thoroughness.

Scope = the diff's keys. A reworded English source makes every locale's old translation of
that key stale: the key re-translates everywhere, even though the locale's file only changed
one line. Count the wave's keys from the en diff, not from per-locale diff sizes.

## The order of work

1. English settles first. Land the reword in `shared/i18n/en.ts`, re-take the catalog lock
   (`scripts/catalog-lock.mjs`) over the changed source, and only then author translations.
   The wave translates settled copy, never a moving target.
2. Translate the settled keys into all 74 locales. Two engines per row, round-tripped:
   translate to the locale, back to English, judge the round trip. Engine calls pace at
   4000 ms (`--pace 4000`, owner order 2026-11-08: one request per four seconds is the
   lock, superseding the same day's 3000 probe; no lower pace is hunted, the batching
   bought the speed). Authoring can be chunked across workers; each
   worker owns disjoint locales and lands into the catalogs directly.
3. Verify targeted: scope the verify to the wave's keys (`--keys` - T-629 added it; if the
   flag is missing it was lost, recover it from git history before running anything). The
   old full-catalog `--all` mode is never the default for a wave again.
4. Judge: reds re-translate, in the locale's own catalog voice. Ambers are disputes: record
   them with reasons, do not silently change them. An engine that refuses a locale (probe
   refused) means the wave judges that locale itself and records the ruling.
5. Gates green, and the deferrals self-dismantle: any PENDING_Txxx exemption set in
   `shared/__tests__/catalogGates.test.ts` dies the moment its keys carry true
   translations - flip the gate red-first over the untranslated tree, land the
   translations, then delete the set.
6. The ko glyph subset recuts (`shared/i18n/cjk-glyph-lock.json`) when the translated
   Korean closed set moves.
7. Move the verify tooling's pins to the post-wave row count.
8. `yarn validate` green, 100 percent coverage on touched lines, staged pages colored and
   counted for the owner's read.

## The engine's batching facts (research 2026-11-08, live-tested; the rework is ticket #659)

- The gtx endpoint batches STRINGS, not languages: one POST per target locale with newline-joined lines returns index-aligned segments (a 12-string mixed test returned exactly 12; repeated `q` params are silently ignored, only the first translates). POST also lifts the GET URL-length cap.
- One target language per request is the floor on the free endpoint; the paid v3 batch API takes an array of target languages but rides Cloud Storage and billing.
- Consequence: a full 223-key wave is ~150-220 requests with round trip, not the ~16,500 the per-row tool issued in T-629. The batched engine (#659, landed 2.52.9) is the standing tool: one newline POST per chunk, positional echo-guard alignment, form Content-Type required.

## The transliteration register

Every word ruled to transliterate rather than translate. These keep each locale's
established spelling, grounded in where the language is spoken.

| Word | Ruling | Source |
| --- | --- | --- |
| Fajr, Dhuhr, Asr, Maghrib, Isha, Suhoor, Duha, Istijaba | The eight names: transliterate per locale, each language's established Islamic spelling. Local phonetic spellings stand (Indonesian Zuhor). A language whose established practice translates a name (Turkish Diyanet usage) follows local convention, source noted | T-585 reference doc on that ticket |
| Sahur | Transliterates, never translates. The fasting card's strings spell it Sahur; the extras row's name spells it Suhoor - same pre-dawn meal, each surface keeps its own source spelling family | Owner order 2026-11-07, T-629 |
| Muhammad, Dawood | Proper names of the fasting regimens: each locale's established spelling of the name. They never translate to descriptions like "Monday/Thursday fasting" | T-629 wave |
| White days | Translates. It is a concept (13, 14, 15 of each Hijri month), not a name | T-629 wave |
| Ramadan, Hijri | Convention words: follow each locale's established usage for the month and the calendar | Catalog voice |

When a new key introduces a name that might transliterate, rule it here first: add the row
to this register with its ruling and source, then translate. A transliteration question
without a register row is an open question, never a guess.

Glossary authority, in order: this register, T-585's per-locale reference, the locale's
judge-rulings history, then the locale's existing catalog voice. Consistency with what
already ships beats a technically better translation.

## The tooling map

- `scripts/i18n-verify.js` - the round-trip engines, verdict coloring (green/red/amber),
  staged pages, resume. `--keys` scopes rows, `--locales` scopes locales, `--resume` adopts
  unchanged rows, `--pace 4000` is the standing owner pace. Wrap long runs so completion
  notifies you (an exit line appended to the log); never wait blind on a bare process.
- Artifacts under `$HOME/athan-i18n-verify`: per-locale `.json` results, `.html` staged
  pages, `.judge-rulings.json`, `approval-sheet.md`, `disputes.md`, `judge-flags.md`.
  These live outside the public repo; nothing here is ever committed.
- `shared/i18n/catalog-lock.json` - per-locale digests, re-taken via
  `scripts/catalog-lock.mjs` whenever a catalog moves.
- `shared/i18n/cjk-glyph-lock.json` - the ko glyph subset.

## The gates that judge the wave

Echo: no locale's value may contain its English source (plain >= 6 chars), place names and
calendar loanwords exempt. RTL: no Latin inside RTL copy outside tokens and the brand.
Prayer names sit inside a 24-char label budget. whatsNew titles cap at 32, bodies at 96,
per locale. Length budget: 3x the English plain length. Every gate flips red-first when a
deferral ends, then greens as the judged translations land.

## The traps T-629's judging met

Each cost real work once; none deserves a second pass.

- The David class: a regimen name row (Dawood, Muhammad) round-trips through the engine's
  own English preference (David, Mohamed) and reds. A judge ruling survives only while the
  engine stays silent on that row - when gtx renders and disagrees, the row stands red and
  the dispute records it. Derive the disputes list from the FINAL artifacts after the last
  pass, never from a mid-process snapshot: a final resume re-reddens exactly the
  engine-carried rows.
- The homograph terms: short established fasting terms read as their near-homographs
  (fr Jeûne -> Young, wo Woor -> Serious, yo Iwosun -> Sleep, vi An chay -> Vegetarian).
  The catalog's term is the locale's Muslim usage; the engine misreads.
- The holiday and daytime traps: "White days" literally rendered hits the March holiday in
  ja and ko (the Islamic term is neither) and the daytime homograph in zh (白色的日子, not
  白日子). Church-register names (fr Mahomet, it Maometto, pl Mahomet) never displace the
  locale's established Islamic spelling.
- The per-pass probe: a locale's engine service drifts inside one day (mrw served the
  morning fetch, refused the evening verify; kr refused in T-594, served in T-629). The
  probe names the engineless set per pass; never assume the earlier reading.
- The fill orphans: a locale's `.llm-fill.json` accretes keys later waves orphan; the fill
  refuses the whole file for one dead key. Strip fills to the live key set before filling.
- The wrapper: a nohup-detached process inside an instantly-completing shell can never
  notify its parent. Long passes run in the foreground of a notifying shell.

## Discipline

Red-first on every guarded change. Version ritual on every commit. `yarn validate` green
before anything is called done. Staged pages for the owner's read, colored and counted.
Screenshots and artifacts never enter the repository - it is public.
