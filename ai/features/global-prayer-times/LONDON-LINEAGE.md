# London: are `londonprayertimes.com` and `londonsalahtimes.com` the same timetable?

**Question (owner, 2026-09-30):** the app's API is `londonprayertimes.com`. The fifty published years R13 found are
on `londonsalahtimes.com`. Are they the same source, both coming from East London Mosque, or two different
lineages? R13 claimed fifty years of London times without ever cross-checking the two, which is the gap this
document closes.

**Answer: YES, they are the same timetable, and the chain is now established end to end.** Verified 2026-09-30 by
reading all three parties' own pages and by comparing their published times directly.

---

## The evidence, in the order it settles the question

### 1. East London Mosque credits the producer by name

`eastlondonmosque.org.uk/prayer-times` carries, on the page itself, beneath its timetable:

> "Prayer times produced by London Salah Times"

So East London Mosque does not compute its own times. `londonsalahtimes.com` produces them. **cited, fetched
2026-09-30.**

### 2. The app's API says it publishes East London Mosque's timetable, unmodified

`londonprayertimes.com` states on its own home page:

> "Here you can find the Unified Islamic Prayer Timetable for London. The London Unified Prayer Times are used at a
> number of mosques in the capital, including East London Mosque, London Central Mosque and Croydon ICT."
> "We publish the official timetable as provided; where jama'ah times are shown, they reflect East London Mosque."

Wave 1 recorded the same claim in the site's footer: "Times sourced from East London Mosque. We publish the official
timetable without modification." **cited, fetched 2026-09-30 and 2026-09-14.**

### 3. So the chain has one producer and two publishers

```
Hizbul Ulama's UK observations (Blackburn, 1987 to 1988)
        |
        v
London Salah Times  ← the PRODUCER. Computes with Meeus, publishes the equations,
        |             publishes .xlsx years 2027 to 2076
        |
        +---> East London Mosque  ---> its own PDF timetable
        |        (credits London Salah Times on its page)
        |
        +---> londonprayertimes.com ---> the API this app consumes
                 (states it republishes ELM's timetable unmodified)
```

Both publishers sit downstream of the same producer. Neither computes independently.

### 4. The decisive test: their published times are identical

`londonsalahtimes.com`'s own home page for 24 September 2026, against the app's captured API year
(`ai/features/moonsighting/data/london/lpt-2026.json`), same date, all seven fields:

| Field | `londonsalahtimes.com` | the app's API | Match |
| --- | --- | --- | --- |
| Fajr | 5:18 | 05:18 | yes |
| Sunrise | 6:47 | 06:47 | yes |
| Zuhr | 12:58 | 12:58 | yes |
| Asr 1 (mithl 1) | 4:08 | 16:08 | yes |
| Asr 2 (mithl 2) | 4:58 | 16:58 | yes |
| Maghrib | 6:58 | 18:58 | yes |
| Isha | 8:14 | 20:14 | yes |

**All seven fields identical. measured, 2026-09-30.** Its seven-day forward table matches the API's corresponding
days too, on every field.

Note also that `londonsalahtimes.com` publishes **both Asr columns** (mithl 1 and mithl 2), which is exactly the
pair the app's API returns as `asr` and `asr_2`, and exactly what East London Mosque's own PDF prints as
`1 Mithl` and `2 Mithl`. The field structure is the same because the source is the same.

### 5. R13's independent control points the same way

R13 compared East London Mosque's 2026 PDF against the app's captured API year and found
**2,555 of 2,555 cells identical**. That anchors ELM to the API. Combined with ELM's own credit line, and with the
direct comparison in section 4, all three parties are now tied together.

### 6. The producer publishes its method, and it matches what wave 1 derived independently

`londonsalahtimes.com/technical` publishes the whole calculation, which corroborates wave 1's reverse-engineering
in detail:

| What the producer publishes | What wave 1 derived independently |
| --- | --- |
| Charing Cross, 51.5073 N, 0.12755 W | wave 1 fitted 51.5, -0.1275 and -0.165 |
| Jean Meeus, *Astronomical Algorithms*, 2nd ed. 1998 | wave 1 found the sun times matched a standard almanac source |
| "Fajr and 'Isha are based on the UK observations of Hizbul Ulama; they determined the times between Fajr and sunrise, and between sunset and 'Isha" | **this is exactly wave 1's central finding**: Fajr and Isha are fixed INTERVALS from the Blackburn 1987 to 1988 observations, not an angle |
| Sunrise 3 minutes earlier | wave 1 measured sunrise shown 3 minutes early |
| Maghrib (sunset) 3 minutes later | wave 1 measured Maghrib at sunset + 3 |
| Zuhr 5 minutes later, to avoid Zawal | wave 1 measured noon + 5 |
| **Asr 2 minutes later** | **wave 1 measured NO Asr margin in the years to 2026** |

The producer states the margins exist "to allow for" the 100-second spread across the M25, elevation and
refraction. That independent confirmation of the interval structure is the strongest corroboration in the whole
London strand: two parties arrived at the same description, one by publication and one by measurement.

---

## The one real discrepancy, and it is a genuine finding

**The Asr margin.** The producer's technical page says Asr is 2 minutes later. R13 measured that **every London year
up to 2026 carries no Asr margin, and every year from 2027 carries +2**. The published method describes the FUTURE
years, not the historical ones.

So the producer changed its Asr margin at the 2027 boundary and documented the new behaviour. **A London user's Asr
moves 1 to 3 minutes in January 2027 whatever this app does**, and the app cannot prevent it without diverging from
the authority it reproduces. This needs an owner decision, not a fix.

The other difference R13 found is the June interval slots: the fifty-year corpus gives 06-17, 06-18 and 06-19 as
83, 82, 82 where the app's 2026 API gives 84, 84, 83. Those are the same hand-edited days wave 1 identified, so the
producer appears to have adjusted them at the same boundary. **Same producer, revised table**, rather than a
different lineage.

---

## What this does and does not license

**Established.** The fifty `.xlsx` years are the app's own timetable's producer publishing its own future years.
They are not a third-party approximation, and they are not a different lineage. The concern that prompted this
document is answered.

**Still open, and it is a small, cheap test.** No file from this producer overlaps a year the app has captured from
its API, because the downloads begin at 2027 and the app's capture is 2026. So the two have never been compared on
the same year's full data, only on the live day in section 4 and the seven days after it. **In January 2027, fetch
one month from the API and diff it against `LUPT-2027.xlsx`.** If they agree, the fifty years are proven as the
app's own source and S6b can ship on them. If they disagree, the producer's downloads are its own revision and the
API is a separate republication, which would be worth knowing before shipping either.

**Corrected from R13.** R13's "fifty years, exact, no network ever" conflated two measurements. Against each year's
own published sun the interval table is exact (18,250 of 18,250, worst 0). Against a **computed** sun, which is what
"no network" means, it is **61 to 64% exact and 100% within one minute, with Isha 2 minutes out on 22 of 18,250
values**. The honest claim is "within a minute", not "exact".

---

## Sources

| Source | URL | Fetched | What it established |
| --- | --- | --- | --- |
| East London Mosque, prayer times | `eastlondonmosque.org.uk/prayer-times` | 2026-09-30 | "Prayer times produced by London Salah Times", and the `1 Mithl` / `2 Mithl` column pair |
| London Prayer Times, home | `londonprayertimes.com` | 2026-09-30 | it republishes the official timetable as provided, naming East London Mosque |
| London Salah Times, home | `londonsalahtimes.com` | 2026-09-30 | the live day and seven-day table used for the identity comparison |
| London Salah Times, technical | `londonsalahtimes.com/technical` | 2026-09-30 | Charing Cross, Meeus 1998, the Hizbul Ulama interval basis, and the four margins including Asr +2 |
| London Salah Times, downloads | `londonsalahtimes.com/downloads/` | 2026-09-30 | fifty `.xlsx` years, 2027 to 2076, 69 KB each, two sheets per workbook |
| The app's captured API year | `ai/features/moonsighting/data/london/lpt-2026.json` | 2026-09-14 | the comparison target; the key was used once by wave 1 and is never stored |
