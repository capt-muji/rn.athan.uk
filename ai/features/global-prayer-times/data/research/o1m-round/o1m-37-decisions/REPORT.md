# O1m-37: the decisions addendum, round three

Incremental record. This file grows as the sheet is re-cut. Nothing here was measured with a model
vision pass, nothing was captured from the web (no item needed a public page beyond what the round
already holds), and the repository was not touched.

Workspace: `$HOME/athan-gitree/census/o1m/o1m-37-decisions/`.

---

## 1. Deliverable

`DECISIONS-ADDENDUM-ROUND3.md`, sixteen items, D1 to D16. Each carries the question in one line, the
options, the evidence with its count or its source, the recommendation with its one-line why, the cost
of each answer, and the wave or close step that owns it. Three marks: Decided, Owner and Conservative.

The fourteen questions the wave was sent with, and what happened to each:

| Sent | Item | Outcome |
|---|---|---|
| tawkit's bulk | D1 | already ruled agent-side, cited and confirmed |
| Diyanet tier | D2 | Owner |
| the 11 FALLBACK lift, one ruling or two | D3 | Owner, one ruling recommended, and the count is 32 rows, not 11 |
| US/China 18/16 | D4 | Conservative, and the premise needed correcting |
| Iran's 4.5-degree maghrib | D5 | already carried in v2.5, confirmed and widened |
| Saudi Ramadan +120 | D6 | already carried, second witness added |
| the HTML-error `.pdf` captures | D7 | Conservative, class measured at 68 not 30, four verdicts reopen |
| Chaguanas | D8 | Conservative, record only |
| Lebanon's undated tables | D9 | Conservative, stay undated |
| Kuwait and Oman | D10 | Conservative, Kuwait one line, Oman per-area |
| Algeria's isha rule-form | D11 | Conservative, adopt |
| Tunisia's FLAT successor | D12 | Conservative, correct the rule-form |
| the polar five | D13 | Conservative, per object, two schema additions |
| mawaqit relabel and Diyanet postback | D14 | Conservative, one defect register |
| new | D15 | LUPT's 2027 asr break, already ruled by FIT-RULES, now measured |
| new | D16 | "measured" is a seventh class in the fit index |

## 2. Counts

| Mark | Items |
|---|---|
| Decided | 4 (D1, D5, D6, D15) |
| Owner | 2 (D2, D3) |
| Conservative | 10 (D4, D7, D8, D9, D10, D11, D12, D13, D14, D16) |
| Total | 16 |

Two of the sixteen were added by this sheet (D15, D16). One sent question split into two Owner items
because the tier and the lift are separate answers (D2, D3).

## 3. What was measured here, with the command

Four scripts, all in `data/`, all reproducible from the census tree alone.

| Script | Output | What it counts |
|---|---|---|
| `scan-pdf-class2.py` | `pdf-class2.txt` | 1,212 `.pdf` files by byte magic: 1,135 real PDFs, 68 error bodies across 12 workspaces, 9 deliberate HTML or XML records |
| `fallback-lift.py` | `fallback-lift.txt` | the 35 FALLBACK rows of `world-table-v3.json` against every dated surface the round found: 32 lift, 3 do not, 5 rest on the Diyanet tree alone |
| `consensus-counts.py` | `consensus-counts.txt` | the 232-country engine matrix: the isha-angle bins per family (99 countries carry a 15.4 to 16.6 degree isha in at least one family), the Iran maghrib models, the Saudi Ramadan gaps |
| `measure-deltas.js` | `measure-deltas.txt` | the minute cost of the 18/16 question through adhan 4.4.6 at four literal dates, and fajr's latitude sensitivity across the Oman band |

Two findings changed an item's answer while the sheet was being written:

1. The error-body class is **68 files, not 30**, and the OCR wave's own list runs to 32 names. Most are
   deliberate negatives. Four verdicts put a claim on an error page: Jyväskylä (a 353-row bank with no
   surviving artifact), Seychelles (a 403 body behind a 29-row bank), the Islamic Academy "series
   stop" (four 404s at guessed URLs) and Wrexham/Dundee's failing months.
2. The 18/16 question's premise was wrong in a way that mattered. A 16-degree-band isha is carried by
   at least one family in 99 of 232 countries, so it is not a Diyanet oddity. What is specific to the
   United States and China is the membership, and moving to 18/16 would print fajr 17 to 27 minutes
   earlier than the surfaces the record grades A.

## 4. NEXT

1. **D2 and D3 are the only lines the owner needs to send.** Everything else is either already ruled
   or decidable at the close. One line each, `D2: a`, `D3: a`.
2. **The close lands eight items without an owner line**: D1's count line, D4's two Chinese lines, D5's
   glossary correction, D6's provenance line, D9's `surface-only` entry, D10's Kuwait line, D11's
   Algerian object, D12's Tunisia rule-form, D13's schema additions, D14's defect register, D15's era
   split and D16's relabel.
3. **Four re-fetches for D7**, Jyväskylä first, because a 353-row bank with no artifact behind it is
   the one a builder would ship.
4. **Re-cut the sheet at the close** once the five waves without a block return (`o1m-29`, `o1m-31`,
   `o1m-32`, `o1m-33`, `o1m-34`). The round's own diff has not run, so no item here depends on it.
5. **The fit index grows while this is read.** Every count quoted from it carries the read time
   (12:34Z, 154 entries, grades A 31). Re-read before citing in the round summary.

## 5. Files

| Path | What |
|---|---|
| `DECISIONS-ADDENDUM-ROUND3.md` | the sheet, sixteen items |
| `REPORT.md` | this record |
| `data/scan-pdf-class2.py`, `data/pdf-class2.txt` | the `.pdf` byte-magic scan and its line-by-line output |
| `data/fallback-lift.py`, `data/fallback-lift.txt` | the FALLBACK presence count |
| `data/consensus-counts.py`, `data/consensus-counts.txt` | the engine-matrix counts |
| `data/measure-deltas.js`, `data/measure-deltas.txt` | the minute deltas for D4 and the latitude sensitivity for D10 |
| `captures/` | empty: no item needed a page the round did not already hold |
