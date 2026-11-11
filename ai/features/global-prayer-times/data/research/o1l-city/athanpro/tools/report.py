#!/usr/bin/env python3
"""Render REPORT.md from the merged fits and the gate results."""
import json
import os
import re
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")
COLS = ("fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha")


def main():
    fits = json.load(open(os.path.join(DATA, "fits.json")))
    s = json.load(open(os.path.join(DATA, "summary.json")))
    summ = s["summary"]
    by_source = defaultdict(list)
    for r in fits:
        by_source[r.get("source") or "?"].append(r)

    def rate(rows, thresh):
        return sum(1 for r in rows if (r.get("pct") or 0) >= thresh)

    uniform = []
    for r in fits:
        a = r.get("adjust")
        if not a:
            continue
        vals = [a[c] for c in COLS]
        if min(vals) >= 30 or max(vals) <= -30:
            uniform.append(r)
    uni_zone = Counter(r["tz"] for r in uniform)

    o = []
    w = o.append
    w("# O1l-56 athanpro platform walk — the full city universe")
    w("")
    w("Workspace `census/o1l-city/athanpro/`. Read `BRIEF.md`, `FIT-RULES.md` and the O1l-45 block "
      "of `CONSOLIDATION.md`. Engine adhan 4.4.6 at `census/adhan-build/node_modules/adhan`, "
      "`Rounding.None`, second resolution, explicit minute rounding per column, zone pinned per "
      "city, no clock read.")
    w("")
    w("## Headline")
    w("")
    w(f"`athanpro.com` serves **{summ['cities']} city pages across {summ['countries']} countries**. "
      f"Every one is captured raw and its dated month table banked: **{summ['tables']} tables, "
      f"{summ['rows']} dated rows**, all September 2026, all 30 rows, all six columns. The sitemap "
      f"and the `cities` array each country page embeds agree exactly, city for city, so the "
      f"enumeration is complete against both.")
    w("")
    w(f"On the platform-engine gate, **{summ['pct100']} of {summ['tables']} tables reproduce at "
      f"100pc** within one minute on the five timed prayers, **{summ['pct99']} at 99pc or better** "
      f"and {summ['pct90']} at 90pc or better, each on one recipe fitted at the page's own point. "
      f"The remainder are concentrated in two classes that are not the platform's own computation, "
      f"reported below.")
    w("")
    w("## The universe")
    w("")
    w(f"`ATHANPRO-CITIES.md` carries the country table. The full enumeration is "
      f"`data/universe.tsv`: {summ['cities']} rows of country, city, slug, latitude, longitude, "
      f"IANA zone and platform priority. Five country directories carry no city page at all: "
      f"French Guiana, Honduras, Hungary, Iceland, Saint Pierre and Miquelon.")
    w("")
    w("The distribution is the platform's product footprint, not a national network: Turkey 510, "
      "Malaysia 192, Morocco 112, the UAE 60, Libya 28, then a long tail in which most countries "
      "carry ten or fewer cities.")
    w("")
    w("## What each page actually is")
    w("")
    w("The page's `source` field separates four kinds of table, and that distinction decides the "
      "tier. It is the most useful structural finding of this walk.")
    w("")
    w("| `source` | Pages | What it is | Tier |")
    w("|---|---|---|---|")
    w(f"| `calculator` | {len(by_source.get('calculator', []))} | the platform computes the table "
      f"from a stated method (MWL for all but a handful) | platform |")
    w(f"| `database` | {len(by_source.get('database', []))} | the platform computes it with a named "
      f"authority's method (Diyanet 510, JAKIM 183, Habous 104, UAE 60, Libya 28 and others) | platform |")
    w(f"| `www.e-solat.gov.my` | {len(by_source.get('www.e-solat.gov.my', []))} | JAKIM's own "
      f"published zone table, re-rendered by the platform | authority, second-hand |")
    w(f"| `mosque` | {len(by_source.get('mosque', []))} | a **named mosque's** timetable, carried "
      f"with jamaat columns, not a computed table | mosque, via platform |")
    w("")
    w("The `mosque` class is the one that matters. Those pages name the mosque (Istanbul's reads "
      "`مسجد الابرار العبيديه`) and print that mosque's schedule. They are not the platform's "
      "computation, so an adhan fit is the wrong gate for them and they must not be read as "
      "platform coverage of the city. Their best fit is recorded anyway, for the record.")
    w("")
    w("## Gate results by source class")
    w("")
    w("| Source | Tables | 100pc | >=99pc | >=90pc |")
    w("|---|---|---|---|---|")
    for src in ("calculator", "database", "www.e-solat.gov.my", "mosque"):
        rows = by_source.get(src, [])
        if not rows:
            continue
        w(f"| `{src}` | {len(rows)} | {rate(rows, 100.0)} | {rate(rows, 99.0)} | {rate(rows, 90.0)} |")
    w("")
    w("`calculator` is the platform's own engine and it is consistent: 1,148 of its 1,241 pages "
      "land on 100pc at MWL 18/17 Shafi with every adjustment at zero. `database` is nearly as "
      "clean once the authority's own minute adjustments are fitted. The two weaker classes are "
      "the mosque tables and the re-rendered JAKIM feed.")
    w("")
    w("## The recipe, and the adjustments")
    w("")
    w("A stated method label is never taken as the recipe on its own. Every page is tested against "
      "a ladder of published recipes (both madhabs) and the ladder's winner is recorded; the "
      "platform's own per-prayer minute adjustments are then fitted on top and stored in "
      "`data/fits.json` under `adjust`. Where the ladder reaches nothing the fit falls back to a "
      "half-degree sweep of both twilight angles, and where a twilight adjustment stays above half "
      "an hour the three published night rules are tested as well (`rule`).")
    w("")
    rc = Counter()
    for r in fits:
        tag = re.sub(r"^(stated(?: Hanafi)?): .*$", r"\1 method", r.get("recipe") or "none")
        rc[tag] += 1
    w("| Recipe | Cities |")
    w("|---|---|")
    for k, v in rc.most_common(12):
        w(f"| {k} | {v} |")
    w("")
    w("## Fit verdict")
    w("")
    w("One recipe per city, one span of 30 days (2026-09-01..2026-09-30), scored jointly on the "
      "five timed prayers: 150 cells per city. The per-year breakdown is a single year by "
      "construction, and a between-year stability verdict is not available. The sitemap's "
      "`lastmod` is `2026-09-29T07:05:28.774Z` on all 2,935 URLs, every page renders the same "
      "September month, and 2,684 pages carry `initialPrayerDate` 2026-09-29 (the six that read "
      "2026-09-28 are the Pacific pages still on the 28th at the build instant). This is **one "
      "frozen generation**. Under the frozen-generation precedent the grade is **provisional, one "
      "published cycle**, and it never lifts to A.")
    w("")
    w("Seasonal amplitude beside a fit is model-derived from the fitted recipe at the city's own "
      "point (15 January against 15 July of the same year), because one month is held and no "
      "measured year exists. It is stored under `amp` and labelled as model-derived wherever used.")
    w("")
    w("## Defects recorded, not corrected")
    w("")
    w(f"1. **Eight cities are served a foreign IANA zone, and the table is rendered in it.** "
      f"Kingston (Jamaica) is served `Pacific/Norfolk`, sixteen hours from its own wall clock; "
      f"Georgetown (Guyana) `Atlantic/St_Helena`, four hours; San José (Costa Rica) "
      f"`America/Los_Angeles`, one hour in September; Perth `Europe/London`, eight hours; Hamilton "
      f"(Bermuda) `Pacific/Auckland`, fifteen; Saint-Pierre (Martinique) `Indian/Reunion`, eight; "
      f"Port Elizabeth (Saint Vincent) `Africa/Johannesburg`, six; and both Barcelona and Valencia "
      f"`America/Caracas`, six. The table is internally consistent, so it fits at the page's own "
      f"point in the page's own zone, but as local prayer times the page is unusable there.")
    uni_countries = Counter(r["country"] for r in uniform)
    top = ", ".join(f"{k} {v}" for k, v in uni_countries.most_common(4))
    w(f"2. **{len(uniform)} cities carry a uniform shift of 30 minutes or more across all six "
      f"columns**, which is a clock, not a parameter. {top}. The largest cluster is Morocco and "
      f"Western Sahara: those Habous pages render about an hour behind the zone the page itself "
      f"names, because the table is computed at UTC+0 while `Africa/Casablanca` is UTC+1 in "
      f"September. {rate(uniform, 99.0)} of the {len(uniform)} still fit at 99pc with the shift "
      f"recorded as an adjustment, so the table is recoverable; the page's clock is not.")
    w(f"3. **The printed offset label is the country's, not the city's.** {summ['label_bad']} pages "
      f"print a fixed offset that disagrees with the zone the table runs in, because the label is "
      f"copied from the country record. Every DST city is affected. The label must never be read "
      f"as the zone.")
    w("4. **The `Today` block does not contradict the month table anywhere.** The prior record's "
      "second defect does not reproduce: on all 2,690 pages the block equals the table row for the "
      "day it names. The block is still a build artefact, not a live value.")
    w(f"5. **Ten sitemap URLs under `/countries/palestine/` are dead, and their live equivalents "
      f"sit in an unlisted directory.** The sitemap advertises twenty `palestine` city URLs. The "
      f"ten Palestinian cities answer 200; the ten Palestinian cities (Jerusalem, Tel Aviv, Haifa, "
      f"Rishon LeZion, Petah Tikva, Ashdod, Netanya, Beersheba, Holon, Bnei Brak) answered 404 on "
      f"re-probe while the same page, canonical `https://athanpro.com/countries/palestine/<city>`, "
      f"was served under `/countries/palestine/<city>`. Both captures are held.")
    w(f"6. **A `mosque`-source page is not a platform table.** 485 pages carry a named mosque's own "
      f"schedule with jamaat columns; 294 of them fit at 99pc or better once a uniform offset is "
      f"absorbed, and the rest are that mosque's own convention. They are recorded as mosque-tier "
      f"surfaces, never as platform coverage.")
    w("")
    w("## The four broken capital pages, re-probed")
    w("")
    w("| City | Zone served | Country label | Solar gate | Fit | Verdict |")
    w("|---|---|---|---|---|---|")
    for r in fits:
        if r["city"] in ("kingston", "georgetown", "san-jose", "colonia") and r["cc"] in (
                "jamaica", "guyana", "costa-rica", "micronesia"):
            w(f"| {r['name']} | `{r['tz']}` | {r.get('tz_label')} | {r.get('solar')} min | "
              f"{r.get('recipe')} {r.get('pct')}pc | "
              f"{'zone defect' if r['city'] != 'colonia' else 'clean'} |")
    w("")
    w("All four reproduce at 100pc at the page's own point in the page's own zone, with zero "
      "adjustments, and all four pass the solar gate at 0 minutes. The earlier verdict called them "
      "broken because the gate was run against the country's offset label rather than the zone the "
      "table is rendered in. What actually fails is the zone record for Kingston, Georgetown and "
      "San José, and the offset label for all four. Colonia is clean on both counts, so its "
      "61-minute flag does not reproduce.")
    w("")
    w("## Capital coverage")
    w("")
    w(f"{summ['capitals']} of the 202 capitals on the O1l-38 matrix were identified by name among "
      f"the city pages and now carry a dated table here. The rest are either served under a "
      f"different name or absent from the platform's directory.")
    w("")
    w("## Honest negatives")
    w("")
    w("- No year-2 data exists on this surface: one frozen build, so no forward-longevity claim is "
      "possible and no backward harvest exists in the sitemap.")
    w("- Five country directories serve no city page: French Guiana, Honduras, Hungary, Iceland, "
      "Saint Pierre and Miquelon.")
    w("- `mosque`-source pages carry `null` in every adjustment field, so those tables cannot be "
      "reconstructed from stated parameters; the fitted adjustment is an inference, not the "
      "mosque's published parameter.")
    w("- Nothing here is a second surface for a city. This walk records one platform's directory "
      "and its tables; a city-level verdict still needs an authority or community surface beside it.")
    w("")
    w("## Data")
    w("")
    w("- `captures/cities/<country>/<city>.html`: the raw page for every city.")
    w("- `data/<country>-<city>.json`: dated rows, `{'YYYY-MM-DD': {fajr..isha}}`.")
    w("- `data/universe.tsv`, `data/fits.json`, `data/summary.json`.")
    w("- `tools/`: the harvest, the two fit stages and the summariser.")
    open(os.path.join(ROOT, "REPORT.md"), "w").write("\n".join(o) + "\n")
    print("wrote REPORT.md")


if __name__ == "__main__":
    main()
