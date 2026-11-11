# Population weights audit

Scope: the weights that multiply each country in the O1h headline ranking. A country's weight is the number of Muslims it carries, so a wrong weight moves a method's population-weighted mean without touching a single prayer time. Nothing here changes a method, a recipe or a deviation. The shipped weights stay where they are: `sim/sim.mjs` hardcodes its own table and this audit does not edit it. `weights.json` is the corrected set for whoever adopts it.

## 1. The sources and what each one is worth

| Source | Vintage | What it carries | Finding |
| --- | --- | --- | --- |
| World Population Review, Muslim Population by Country 2026 | 2026 label | 226 rows, Muslim headcount plus share | Verified live on 2026-11-10: all thirty audited figures match the page to the digit. The 2026 label is not what the column delivers, see section 2 |
| Pew Research Center, appendix B | 2020 | Population, share, product per country | Verified against the appendix text: Nigeria 214.0M at 56.1 pc, Egypt 109.32M at 95.2 pc, Sudan 46.79M at 98.9 pc, Yemen 36.13M at 99.9 pc, Syria 21.05M at 94.2 pc, Russia 146.37M at 8.2 pc |
| Wikipedia, "Islam by country" | 2026 mirror | 233 rows | Not independent. Every row checked reproduces the WPR figure exactly, and the table cites WPR-style sources throughout. It counts as corroboration of WPR, never as a second source. It does add ranges on Nigeria, Egypt and Russia |
| CIA World Factbook 2018, via Wikipedia "Islam in Nigeria" | 2018 | 53.5 pc Muslim | Third source, Nigeria |
| Arab Barometer wave V 2018, via Wikipedia "Islam in Egypt" | 2018 | 90.4 pc Muslim | Third source, Egypt |
| UNDP Sudan, via Wikipedia "Islam in Sudan" | current | 97 pc Muslim | Third source, Sudan |
| Wikipedia "Islam in Yemen", "Islam in Syria" | current | over 99 pc, 87 pc Muslim | Third source, Yemen and Syria |
| Mufti Council via TASS 2015, via Wikipedia "Islam in Russia" | 2015 | 20M of 146M, 13.7 pc | Third source, Russia |

The third sources are share-only, so each was applied to WPR's own 2026 total population to make a headcount comparable with the other two. Every page used is saved under `raw/`.

## 2. The main finding: the primary column mixes vintages

WPR publishes a Muslim headcount and a Muslim share. The two do not agree on one population: figure divided by share gives the population the row assumes, and WPR publishes its own 2026 population for the same country. Across the 83 rows where both exist, the assumed population runs a median 8.1 percent below today's, a mean 10.4 percent, with a quartile range of 2.3 to 17.4. Among the thirty largest rows the median is 11.9 percent.

So the column is not one estimate of 2026. It is a current share multiplied by a population total of mixed vintage, and the newer the country's growth the further behind it falls. The rows the flagging pass found are the extreme end of that, not a separate defect:

| Country | WPR figure | WPR share | Population the row assumes | WPR 2026 population | Behind by |
| --- | --- | --- | --- | --- | --- |
| Nigeria | 96.0 | 48.0 pc | 200.0 | 242.4 | 17.5 pc |
| Egypt | 87.5 | 92.35 pc | 94.7 | 120.1 | 21.1 pc |
| Sudan | 38.6 | 96.0 pc | 40.2 | 53.3 | 24.5 pc |
| Yemen | 26.8 | 97.2 pc | 27.6 | 43.0 | 35.9 pc |
| Syria | 15.0 | 87.0 pc | 17.2 | 26.5 | 35.0 pc |
| Russia | 15.0 | 11.0 pc | 136.4 | 143.4 | 4.9 pc |

The same test on rows nobody flagged, behind by: Chile 79.9 percent, Eswatini 76.4, Netherlands 58.0, Oman 50.8, Kuwait 42.2, Tanzania 24.0, Niger 25.5, Cote d'Ivoire 21.4, Afghanistan 17.6, Kenya 16.3, Mozambique 16.2. Russia is the only one of the six whose row is current; its dispute is the share alone, 8.2 pc against 11 pc against 13.7 pc.

An audit that corrected the six and left the others would put the weights on two bases at once, so the whole table is rebased.

## 3. Rule

1. Weight = WPR's published Muslim share multiplied by WPR's own 2026 population for the same country. One source, one vintage, and it removes the mixed denominator without importing a second estimate.
2. Where the share itself is disputed beyond vintage, the weight uses the median published share, because at that point the population is agreed and the share is not. Six rows qualify: Nigeria, Egypt, Sudan, Yemen, Syria and Russia.
3. Where WPR omits the row, the primary figure stands. Kosovo and Czechia.

Rows that were already current barely move, which is the check that the rule stays quiet where nothing is wrong: Indonesia 249.8 becomes 250.7 on an 0.4 percent gap, Turkey 81.2 becomes 83.1 on 2.3 percent.

## 4. The six, decided

| Country | Primary | WPR share | Pew 2020 | Third | Chosen | Basis |
| --- | --- | --- | --- | --- | --- | --- |
| Nigeria | 96.0 | 48.0 | 120.1 | 129.7 (CIA 53.5 pc) | 118.8 | Median of five shares, 49.0 pc of 242.4M. The published shares span 47 to 56.1 pc, and the WPR row assumes a 200.0M population |
| Egypt | 87.5 | 92.35 | 104.1 | 108.6 (Arab Barometer 90.4 pc) | 110.9 | Median 92.35 pc of 120.1M. All three sources sit in a 90 to 95 pc band, so the denominator was the whole gap |
| Sudan | 38.6 | 96.0 | 46.3 | 51.7 (UNDP 97 pc) | 51.7 | Median 97 pc of 53.3M. Shares span 96 to 98.9 pc, so again the denominator decides |
| Yemen | 26.8 | 97.2 | 36.1 | 42.5 (99 pc) | 42.5 | Median 99 pc of 43.0M. The 26.8 assumed 27.6M people; the country has since grown 36 pc |
| Syria | 15.0 | 87.0 | 19.8 | 23.0 (87 pc) | 23.0 | Median 87 pc of 26.5M. Pew's 94.2 pc is a projection; WPR and Wikipedia both read the share at 87 pc |
| Russia | 15.0 | 11.0 | 12.0 | 19.6 (13.7 pc) | 15.8 | Median 11 pc of 143.4M. The row is current and only the share moves; the median holds WPR |

Syria carries no scored row in `sim/scores.json`, so its weight cannot move the result at all. It is corrected for the table's sake, not the ranking's.

## 5. Coverage

| Quantity | Primary | Audited |
| --- | --- | --- |
| Rows | 85 | 85 |
| Total Muslim population covered | 1707.7M | 1912.6M |
| Change | | +12.0 pc |
| Top thirty | 1637.3M | 1831.2M |
| Top thirty share of coverage | 95.9 pc | 95.7 pc |
| The six disputed rows | 278.9M | 362.7M |
| The six as a share of coverage | 16.3 pc | 19.0 pc |

The same thirty countries carry 96 percent of the weight under either basis, so the study remains a ranking of the thirty largest Muslim populations with a thin tail. The country order inside the thirty changes: Sudan moves from eleventh to ninth, Algeria from ninth to tenth, Iraq from tenth to eleventh, Yemen from sixteenth to thirteenth. The set of thirty does not change.

## 6. How far the six can move the ranking

Measured, not asserted. Each disputed scored row was set to the low and the high of its published share band, giving 32 weight sets, and every method re-ranked under each. Syria has no scored row and contributes nothing.

| Country | Chosen | Low | High | Span as share of total weight |
| --- | --- | --- | --- | --- |
| Nigeria | 118.8 | 113.9 | 136.0 | 1.16 pc |
| Egypt | 110.9 | 108.1 | 114.3 | 0.32 pc |
| Sudan | 51.7 | 51.2 | 52.7 | 0.08 pc |
| Yemen | 42.5 | 41.8 | 42.9 | 0.06 pc |
| Russia | 15.8 | 11.8 | 19.6 | 0.41 pc |
| Syria | 23.0 | 23.0 | 24.9 | unscored |

Results:

- The largest movement in any method's population-weighted mean across the 32 sets is 0.228 minutes, on Moonsighting Committee. Every other method stays inside 0.13.
- No method changes rank at any of the 32 weight sets, and the top ten is fixed.
- Moving from the primary weights to the audited weights shifts a weighted mean by at most 0.077 minutes, on Qatar, and changes no rank.
- The replay of the study's own weighted means from `sim/scores.json` matches `sim/aggregates.json` exactly on the thirteen methods compared, so these numbers are computed the way the study computes them.

| Method | Primary | Audited | Low | High | Span |
| --- | --- | --- | --- | --- | --- |
| Moonsighting Committee | 5.054 | 5.090 | 4.964 | 5.192 | 0.228 |
| Fazilet B | 9.881 | 9.862 | 9.799 | 9.921 | 0.122 |
| Egyptian | 5.872 | 5.812 | 5.748 | 5.862 | 0.114 |
| Fazilet A | 6.262 | 6.238 | 6.179 | 6.289 | 0.109 |
| Umm al-Qura | 8.710 | 8.762 | 8.721 | 8.830 | 0.109 |
| MABIMS | 6.525 | 6.525 | 6.470 | 6.577 | 0.107 |
| Singapore (MUIS) | 6.475 | 6.473 | 6.419 | 6.524 | 0.106 |
| Muslim World League | 4.223 | 4.220 | 4.156 | 4.254 | 0.098 |
| ECFR | 4.223 | 4.220 | 4.156 | 4.254 | 0.098 |
| Diyanet Domestic | 4.223 | 4.220 | 4.156 | 4.254 | 0.098 |
| Qatar | 6.973 | 7.049 | 7.014 | 7.109 | 0.095 |
| Tehran | 10.805 | 10.797 | 10.739 | 10.833 | 0.093 |
| Russia (SAM) | 12.541 | 12.528 | 12.470 | 12.561 | 0.091 |
| ISNA 15 | 14.981 | 14.961 | 14.904 | 14.991 | 0.087 |
| Kuwait | 3.716 | 3.736 | 3.683 | 3.769 | 0.086 |
| ISNA 2010 | 3.377 | 3.450 | 3.403 | 3.488 | 0.085 |
| Jakim | 3.377 | 3.450 | 3.403 | 3.488 | 0.085 |
| Karachi | 3.377 | 3.450 | 3.403 | 3.488 | 0.085 |
| Dubai | 3.911 | 3.973 | 3.928 | 4.011 | 0.083 |
| Diyanet Europe | 6.118 | 6.087 | 6.036 | 6.112 | 0.076 |

A reader of the final ranking can treat the six disputes as worth under a quarter of a minute of weighted mean and no rank movement. The interest in them is in the population table, not in the method order.

## 7. Limits

- The share is still the weak link. Rebasings fix the denominator, not the estimate of how many people are Muslim. Nigeria has had no religion census since 2006, Egypt publishes no religious breakdown, and Sudan's last census is 2008. That is why the six stay a band and not a point.
- The rule trusts WPR's share on the seventy-nine rows outside the six. Those shares were not audited against a national source, only checked for agreement with Pew.
- Rows WPR lists that `countries.json` does not score, Ghana among them, are ignored. Rows WPR omits, Kosovo and Czechia, keep the primary figure. Cote d'Ivoire appears in WPR as Ivory Coast.
- The rebase raises total coverage 12 percent and the six's share of it from 16.3 to 19.0 percent. That is a real change of weights, and it is the reason the audited column exists as a separate file rather than an edit to the study.

## Files

- `weights.json`: 85 countries, chosen millions, sources with figure and year, one-line reason.
- `summary.json`: totals, staleness distribution, the six, per-method sensitivity, replay check.
- `build-weights.py`: rebuilds both from the files under `raw/`.
- `parse-populations.py`, `parse-wiki.py`: table and page extraction.
- `raw/`: every fetched page, unchanged.
