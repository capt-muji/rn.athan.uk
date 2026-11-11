# REPORT, O1n-1 (adoption of WORLD-TABLE-DIFF-ROUND3)

2026-11-11. Wave O1n-1 of round four (o1n). Mission: adopt the round-three world-table diff.
Workspace: `$HOME/athan-gitree/census/o1n/o1n-1-wtdiff/`. Inputs, all read-only:
`o1m/o1m-34-wtdiff3/` (WORLD-TABLE-DIFF-ROUND3.md, REPORT.md, data/class-arithmetic.py,
data/row-counts.py, the scripts copied here and worked on as copies), the register
`research/o1m-round/CORRECTIONS-ROUND3.md`, and the record `census/world-table-v3.json`
plus `census/policy-layer.v2.5.json`. No fetches, so no captures and nothing to gzip.
Nothing under `/tmp`. The repository at `~/repos/rn.athan.uk` was only read, never written.

## 1. The base, verified

`data/row-counts.py` verifies the base explicitly, and it is the pre-round-two record:

- world-table-v3.json carries exactly 174 rows, classes A 17 / provisional 40 / candidate 65 /
  community 15 / F 2 / FALLBACK 35 / UNNAMED 0 (asserted, not read off).
- Round two is not applied beneath: none of o1l's 18 new-country names (Malta,
  Congo-Brazzaville, Equatorial Guinea, Cuba, Puerto Rico, Haiti, Barbados, Belize,
  El Salvador, Dominican Republic, Panama, Costa Rica, Jamaica, Ecuador, Bolivia, Andorra,
  Liechtenstein, San Marino) is present in v3. Checked, 0 of 18.
- Macau and North Korea are absent from v3. Checked, both absent.

## 2. Section-4 cross-read, A1-A82

`data/crossread-a.py` reads the banked A-to-rows mapping out of row-counts.py, strips
round-two numbering (`o1l A63` in 4.2's Turkey row is round two's register, not this one),
and maps every A item to its section-4 citation. Full banked table: `data/a-mapping.txt`.
Every row of it:

```
A    rows touched (banked mapping)          section-4 location
----------------------------------------------------------------------------------------------------
A1   Syria                                  4 (Syria)
A2   Syria                                  4 (Syria)
A3   France                                 4 (France)
A4   France                                 4 (France)
A5   France                                 4 (France)
A6   France                                 4 (France)
A7   Tunisia                                4 (Tunisia)
A8   Tunisia                                4 (Tunisia)
A9   Morocco                                4 (Morocco)
A10  Nigeria                                4 (Nigeria)
A11  Malaysia                               4 (Malaysia)
A12  Pakistan                               4 (Pakistan)
A13  Pakistan                               4 (Pakistan)
A14  Pakistan                               4 (Pakistan)
A15  Bolivia                                4 (Bolivia)
A16  Bolivia                                4 (Bolivia)
A17  Venezuela                              4 (Venezuela)
A18  Russia (CDUM)                          4 (Russia (CDUM))
A19  Russia (CDUM)                          4 (Russia (CDUM))
A20  Russia (CDUM)                          4 (Russia (CDUM))
A21  Russia (Bashkortostan)                 4 (Russia (Bashkortostan))
A22  Russia (Bashkortostan)                 4 (Russia (Bashkortostan))
A23  Russia (Tatarstan)                     4 (Russia (Tatarstan))
A24  Russia (Tatarstan)                     4 (Russia (Tatarstan))
A25  Cyprus (north)                         4 (Cyprus (north))
A26  Czechia                                4 (Czechia)
A27  Czechia                                4 (Czechia)
A28  Egypt                                  4 (Egypt)
A29  Egypt                                  4 (Egypt)
A30  Egypt                                  4 (Egypt)
A31  Egypt                                  4 (Egypt)
A32  Egypt                                  4 (Egypt)
A33  Malaysia                               not cited
A34  (non-row item)                         4.7 (present by subject: the .pdf error-page row; A-number not cited)
A35  Oman                                   4 (Oman)
A36  Oman                                   4 (Oman)
A37  Iran                                   4 (Iran)
A38  Iran                                   4 (Iran)
A39  United States, China                   4 (China / United States)
A40  China                                  4 (China)
A41  China                                  4 (China)
A42  Hong Kong                              4 (Hong Kong)
A43  Sri Lanka                              4 (Sri Lanka)
A44  Kuwait                                 4 (Kuwait)
A45  Qatar                                  4 (Qatar)
A46  Qatar                                  4 (Qatar)
A47  Bahrain                                4 (Bahrain)
A48  Bahrain                                4 (Bahrain)
A49  Turkey                                 4 (Turkey)
A50  Algeria                                4 (Algeria)
A51  Algeria                                4 (Algeria)
A52  Nepal                                  4 (Nepal)
A53  Samoa                                  4 (Samoa)
A54  Kiribati                               4 (Kiribati)
A55  Ireland                                4 (Ireland)
A56  Fiji                                   4 (Fiji)
A57  Austria                                4 (Austria)
A58  (non-row item)                         4 (The mawaqit `?year` relabel)
A59  (non-row item)                         4 (The Diyanet city postback)
A60  (non-row item)                         4 (The tawkit engine)
A61  Norway (Mawaqeet line)                 4 (Norway (Mawaqeet line))
A62  Norway (Rabita line), Norway (Mawaqeet line), Sweden, Belgium 4 (Belgium / Norway (Rabita line))
A63  Sweden                                 4 (Sweden)
A64  Iceland                                4 (Iceland)
A65  Iceland                                4 (Iceland)
A66  Jordan                                 4 (Jordan)
A67  Jordan                                 4 (Jordan)
A68  Iraq                                   4 (Iraq)
A69  Palestine                              4 (Palestine)
A70  Lebanon                                4 (Lebanon)
A71  Libya                                  4 (Libya)
A72  Yemen                                  4 (Yemen)
A73  Vietnam, Cambodia, Laos                4 (Vietnam, Cambodia, Laos)
A74  Romania                                4 (Romania)
A75  (non-row item)                         4 (The masjidi.app engine mismatch)
A76  (non-row item)                         4 (tawkit's two isha conventions)
A77  DR Congo                               4 (DR Congo)
A78  Saudi Arabia                           4 (Saudi Arabia)
A79  Saudi Arabia                           4 (Saudi Arabia)
A80  United Kingdom (London)                4 (United Kingdom (London))
A81  United Kingdom (London)                4 (United Kingdom (London))
A82  United Kingdom (London)                4 (United Kingdom (London))
```

81 of 82 cited, A34 present in 4.7 by subject. Two defects, neither fatal to adoption:

1. **A33 is a true gap.** The Terengganu "1448 takwim" correction (my-terengganu-1448.pdf is a
   public-holiday calendar, not a prayer table; the Perlis takwim is 1448H and no 1447 exists)
   appears nowhere in section 4, not even in the Malaysia row it maps to. It changes no row's
   prayer-time text: it is a capture-classification correction and belongs in 4.7's non-row list.
   Carried in this adoption as a non-row item with that disposition.
2. **The 4.4 India row cites a literal "A?"** (reading "O1m-17 india, O1m-23 india-complete,
   O1m-5, A? C14-C16"). The register has no A item for India; India enters through C14-C16 and
   the B decomposition only. The placeholder should read "no A item; C14-C16".

## 3. The amend list, scripted and closed

`data/class-arithmetic.py` carries section 6.3's amend table family by family, deduplicates it
against `policy-layer.v2.5.json` (87 objects), and the numbers reconcile with the diff's
headline exactly:

- Ids named: 65 across the eight field families; 51 unique, BH included.
- BH is named twice with "(no object)" and SY-MWL-POLICY and DZ-MARW hold no object in
  policy-layer. All three are add-side rows, not amendable objects: Syria and Algeria are
  already in the diff's add list, and Bahrain's new method object (6.3's own M3/B23) belongs
  there too.
- Amendable objects that exist: 48, every one verified present among the 87. The diff's
  headline "48 objects need field changes" is exact once the three no-object names move to the
  add side. This is the de-duplication o1m-34's report left undone; it is now done, by script.

The add-side gap itself grows by one from the diff's figure. The diff's 49 (32 lifted + 5 new
+ 8 moving + 4 carried as rows without objects) omits Bahrain, which 6.3 itself names as having
no object while its row stays provisional. `data/row-counts.py` computes the add side as
50 rows as the diff counts it, 52 with the wave-four ruling. One object per row therefore takes
policy-layer from 87 to 137 as counted, 139 with the ruling (the diff said 136).

## 4. The class table, banked

`data/class-arithmetic.py` output, verbatim, banked in `data/class-table.txt`. Every move is
asserted against the row's actual v3 class before it applies; the identity is computed from the
script's own counters, never hand-summed.

```
class      v3                    class      after (diff as counted)
  A             17                A             28
  provisional   40                provisional   53
  candidate     65                candidate     77
  community     15                community     16
  F              2                F              0
  FALLBACK      35                FALLBACK       3
  UNNAMED        0                UNNAMED        2
  total        174                total        179
identity    28 + 53 + 77 + 16 + 0 + 3 + 2 = 179 vs 179 -> CLOSES
```

FALLBACK base 35, lifted 32, still FALLBACK: Cyprus (south), French Polynesia, Western Sahara.
The diff's counted tables reproduce with no discrepancy: class deltas, move pairs, the unnamed
detail (Thailand C22/C74, India C14) and the identity all match sections 1 and 5.2.

## 5. Macau and North Korea, priced and ruled

Both are absent from v3 and neither is among the register's five counted new countries.
The register carries them as B10 (Macau: one city, 365 rows, 100 pc, provisional) and B11
(North Korea: one platform city page, dated rows, provisional at one city).

| Option | Rows | Provisional | Identity | Cost |
|---|---|---|---|---|
| Named-absence entry (the diff as counted) | 179 | 53 | closes at 174 + 5 | Two measured countries ship with no row. The presence inventory contradicts the register's own B table and needs a standing footnote (the diff's G2) |
| Two-row addition | 181 | 55 | closes at 174 + 7 (script-printed) | Departs from the register's counted five. But the register never refused the rows: it filed them as B-table items and the diff's own method rule priced rather than adjudicated them |

Recommendation: the two-row addition. B10 and B11 are measured dated presences, in kind
identical to the five counted new countries (a country absent from v3 with a first dated
surface); the only difference is which register table filed them. Tier follows adoption: both
enter at platform tier, grade provisional, on adoption.

> agent-ruled, 2026-11-11, adopt B10 and B11 as rows at provisional: both are measured dated
> presences in kind identical to the five counted new countries, and a presence table that
> omits measured countries to spare a counting convention misstates coverage.

The script banks the ruled table alongside the counted one; the counted table stays the diff's
own output, untouched.

## 6. Adoption

**WORLD-TABLE-DIFF-ROUND3 is ADOPTED, on the 174-row base of world-table-v3.json.** Round
two's diff (o1l-city/wtdiff2) was never applied to the record, and row-counts.py proves the
base is exactly that record: 174 rows, the class block 17/40/65/15/2/35, none of o1l's 18
countries present. As counted, the diff carries 174 + 5 = 179 rows with the identity closed on
the script's own output. With the wave-four ruling of section 5 applied at adoption, the
adopted table is **181 rows: A 28, provisional 55, candidate 77, community 16, F 0, FALLBACK 3,
UNNAMED 2, 28 + 55 + 77 + 16 + 0 + 3 + 2 = 181 = 174 + 7**, identity script-closed.

**If round two is ever adopted beneath this diff**, from o1l-city/wtdiff2 section 5.2 and
3.1, these numbers move:

1. Base 174 becomes 192 (o1l's 18 new rows: 9 candidate, 8 community, 1 provisional, Ecuador).
   This diff's counted 179 becomes 197; the ruled 181 becomes 199.
2. Every class column re-bases to o1l's after-state before this diff's deltas re-apply:
   A 19, provisional 44, candidate 71, community 24, F 2, FALLBACK 26, UNNAMED 6.
3. Twelve rows move in both rounds and need re-adjudication, sequenced o1l-first. Eight carry
   conflicting destinations: Mexico (o1l A against D3's candidate), Central African Republic
   (o1l provisional against D3's candidate), Algeria (o1l UNNAMED-fitted against C58's A),
   Uganda (o1l UNNAMED-fitted against D3's candidate), Tanzania (o1l A-eligible against D3's
   candidate), China (o1l UNNAMED-measured against C23's provisional), India (o1l community
   against C14's UNNAMED), Western Sahara (o1l candidate against this diff's held FALLBACK).
   Four agree: Thailand (both rounds to the same UNNAMED A-candidate phrase) and Tonga (both
   to provisional), Madagascar and Guinea-Bissau (both to candidate).
4. Bolivia stops being an absent row. o1l N15 adds it at candidate with the "sun columns
   unreproducible" clause, and this diff's A15/A16 then land as corrections on an existing row,
   striking that clause.
5. The FALLBACK leftover closes to 1 or 2: Cyprus (south) always remains; Western Sahara
   resolves by whichever round's reading governs; French Polynesia lifts under the o1l O2
   clause either way.
6. The identity re-closes by construction at 197 or 199, since moves conserve rows; the close
   adopting beneath must state the sequencing in one line, as o1m-34's 5.3 already asks.

## 7. Defect ledger

| # | Defect | Disposition |
|---|---|---|
| 1 | A33 absent from section 4 entirely | Recorded here; belongs in 4.7 as a non-row item; carried in the adoption |
| 2 | 4.4 India row cites literal "A?" | India has no A item; reads "no A item; C14-C16" |
| 3 | A34 present in 4.7 by subject, A-number not cited | Cosmetic; no action |
| 4 | The 49-row add list omits Bahrain, which 6.3 itself names as no-object | Add side is 50 as counted, 52 with the ruling; 87 + 50 = 137, + 52 = 139 |
| 5 | 6.3 names SY-MWL-POLICY and DZ-MARW as amendable objects; neither exists in policy-layer | Their field changes fold into the add-side objects for Syria and Algeria; the 48 headline is exact after the move, machine-verified |
| 6 | 4.2's Turkey row carries "o1l A63", round-two numbering | Trap for A-token cross-reads; this wave's script strips it |

## 8. Provenance

Every figure above is script output or a direct quote from the named input. The three scripts
run green as of this build: crossread-a.py (81 of 82 cited, defects named), class-arithmetic.py
(both identities CLOSE, amend list 48 verified against the 87), row-counts.py (base asserted,
add side 50/52). Banked outputs: `data/a-mapping.txt`, `data/class-table.txt`,
`data/row-counts-output.txt`. No clock was read into any figure; every date is a document date.
No page was fetched, so no capture exists to gzip. The o1m-34 workspace was not edited; the
defects it left are recorded here, in the adoption's own ledger.
