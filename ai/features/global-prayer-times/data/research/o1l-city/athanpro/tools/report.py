#!/usr/bin/env python3
"""Render REPORT.md from the merged fits and the gate results."""
import json
import os
import re
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")


def main():
    fits = json.load(open(os.path.join(DATA, "fits.json")))
    s = json.load(open(os.path.join(DATA, "summary.json")))
    summ = s["summary"]
    uni = [l.rstrip("\n").split("\t") for l in open(os.path.join(DATA, "universe.tsv"))]
    by_source = defaultdict(list)
    for r in fits:
        by_source[r.get("source") or "?"].append(r)

    def stat(rows, key="pct", thresh=99.0):
        return sum(1 for r in rows if (r.get(key) or 0) >= thresh)

    o = []
    w = o.append
    w("# O1l-56 athanpro platform walk — the full city universe")
    w("")
    w(f"Workspace `census/o1l-city/athanpro/`. Read `BRIEF.md`, `FIT-RULES.md` and the O1l-45 block "
      f"of `CONSOLIDATION.md`. Engine adhan 4.4.6 at `census/adhan-build/node_modules/adhan`, "
      f"`Rounding.None`, second resolution, explicit minute rounding per column, zone pinned per "
      f"city, no clock read.")
    w("")
    w("## Headline")
    w("")
    w(f"`athanpro.com` serves **{summ['cities']} city pages across {summ['countries']} countries**. "
      f"Every one is captured raw and its dated month table banked: **{summ['tables']} tables, "
      f"{summ['rows']} dated rows**, all September 2026, all 30 rows, all six columns. "
      f"The sitemap and the country pages' embedded `cities` arrays agree exactly, city for city, "
      f"so the enumeration is complete against both sources.")
    w("")
    w(f"On the platform-engine gate, **{summ['pct100']} of {summ['tables']} tables reproduce at "
      f"100pc** within one minute on the five timed prayers, **{summ['pct99']} at 99pc or better**. "
      f"Four source classes behave differently and are reported separately below.")
    w("")
    w("## The universe")
    w("")
    w(f"See `ATHANPRO-CITIES.md` for the country table. The full enumeration is "
      f"`data/universe.tsv` ({summ['cities']} rows: country, city, slug, latitude, longitude, IANA "
      f"zone, platform priority). Five country directories carry no city page at all: French "
      f"Guiana, Honduras, Hungary, Iceland, Saint Pierre and Miquelon.")
    w("")
    w("## What each page is")
    w("")
    w("The page's `source` field separates four kinds of table, and the distinction decides the "
      "tier. It is the single most useful structural finding of this walk.")
    w("")
    w("| `source` | Pages | What it is | Tier |")
    w("|---|---|---|---|")
    w(f"| `calculator` | {len(by_source.get('calculator', []))} | the platform computes the table "
      f"itself from a stated method (MWL for all but a handful) | platform |")
    w(f"| `database` | {len(by_source.get('database', []))} | the platform computes the table with a "
      f"named authority's method (Diyanet, JAKIM, Habous, UAE, Libya and others) | platform |")
    w(f"| `www.e-solat.gov.my` | {len(by_source.get('www.e-solat.gov.my', []))} | JAKIM's own "
      f"published zone table, re-rendered by the platform | authority, second-hand |")
    w(f"| `mosque` | {len(by_source.get('mosque', []))} | a **named mosque's** timetable, carried "
      f"with jamaat columns, not a computed table | mosque, via platform |")
    w("")
    w("The `mosque` class is the important one. Those pages name the mosque (Istanbul's reads "
      "`مسجد الابرار العبيديه`) and print that mosque's own schedule. They are not the platform's "
      "computation, so an adhan fit is not the right gate for them, and they must not be read as "
      "platform coverage of the city.")
    w("")
    w("## Gate results by source class")
    w("")
    w("| Source | Tables | Reproduce 100pc | Reproduce >=99pc | Median worst column | Solar gate >3 min |")
    w("|---|---|---|---|---|---|")
    for src in ("calculator", "database", "www.e-solat.gov.my", "mosque"):
        rows = by_source.get(src, [])
        if not rows:
            continue
        scored = [r for r in rows if r.get("pct") is not None]
        worsts = sorted(r["worst"] for r in scored)
        med = worsts[len(worsts) // 2] if worsts else "-"
        gate = sum(1 for r in rows if (r.get("solar") or 0) > 3)
        w(f"| `{src}` | {len(rows)} | {stat(rows, 'pct', 100.0)} | {stat(rows)} | {med} | {gate} |")
    w("")
    w("## The recipe")
    w("")
    rc = Counter()
    for r in fits:
        tag = r.get("recipe") or "none"
        tag = re.sub(r"^(stated(?: Hanafi)?): .*$", r"\1 method", tag)
        rc[tag] += 1
    w("| Recipe | Cities |")
    w("|---|---|")
    for k, v in rc.most_common(14):
        w(f"| {k} | {v} |")
    w("")
    w("A stated method label is never taken as the recipe on its own: every page is tested against "
      "the full ladder of published recipes (both madhabs) and the ladder's winner is recorded. "
      "Where the ladder reaches nothing at 99pc the fit falls back to a 0.25-degree sweep of both "
      "twilight angles.")
    w("")
    w("## Fit verdict")
    w("")
    w("One recipe per city, one span of 30 days (2026-09-01..2026-09-30), scored jointly on the "
      "five timed prayers: 150 cells per city. Per-year breakdown is a single year by construction "
      "and a between-year stability verdict is not available: the sitemap's `lastmod` is "
      "2026-09-29, every page renders the same September month and every page's `initialPrayerDate` "
      "reads 2026-09-29, so this is **one frozen generation**. Under the frozen-generation "
      "precedent it is **provisional, one published cycle**, and it can never lift to A.")
    w("")
    w("Seasonal amplitude beside each fit is model-derived from the fitted recipe at the city's own "
      "point (15 January against 15 July of the same year), because one month is held and no "
      "measured year exists. It is labelled as such wherever it appears.")
    w("")
    w("## Defects recorded, not corrected")
    w("")
    w(f"1. **The city's IANA zone is wrong on some pages, and the table is rendered in it.** "
      f"{summ['zone_far']} pages carry a zone more than three hours from the zone their own "
      f"longitude implies. Kingston (Jamaica) is served as `Pacific/Norfolk` and prints a table "
      f"16 hours from its own wall clock; Georgetown (Guyana) as `Atlantic/St_Helena`, four hours "
      f"off; San José (Costa Rica) as `America/Los_Angeles`, one hour off in September. The table "
      f"is internally consistent, so it fits at the page's own point in the page's own zone, but "
      f"as local prayer times the page is unusable for those cities.")
    w(f"2. **The printed offset label is the country's, not the city's.** {summ['label_bad']} pages "
      f"print a fixed offset that disagrees with the zone the table runs in, because the label is "
      f"copied from the country record. Every DST city is affected. The label must never be read "
      f"as the zone.")
    w(f"3. **The `Today` block contradicts the month table on some pages.** "
      f"{summ['today_bad']} pages print a today row that is not the table's row for the day it "
      f"names. The month table is the surface; the block is a build artefact.")
    w("4. **A `mosque`-source page is not a platform table.** The 485 pages in that class carry a "
      "named mosque's own schedule, and their dhuhr does not sit on solar noon at the city. They "
      "are recorded as mosque-tier surfaces, not as platform coverage.")
    w("")
    w("## The four broken capital pages, re-probed")
    w("")
    reprobe = [r for r in fits if r["city"] in ("kingston", "georgetown", "san-jose", "colonia")
               and r["cc"] in ("jamaica", "guyana", "costa-rica", "micronesia")]
    w("| City | Zone served | Zone implied | Solar gate | Fit | Verdict |")
    w("|---|---|---|---|---|---|")
    for r in reprobe:
        w(f"| {r['name']} | `{r['tz']}` | label {r.get('tz_label')} | {r.get('solar')} min | "
          f"{r.get('recipe')} {r.get('pct')}pc | {'zone defect' if (r.get('solar') or 0) > 3 else 'clean'} |")
    w("")
    w("The earlier verdict called all four broken. On the zone the page names, the tables are "
      "internally consistent: what fails is the zone itself for Kingston, Georgetown and San José, "
      "and the offset label for all four. Colonia is clean on both counts at its own point, so its "
      "earlier 61-minute flag does not reproduce.")
    w("")
    w("## Honest negatives")
    w("")
    w("- No year-2 data exists on this surface. Every page is the same frozen September 2026 build, "
      "so no forward-longevity claim is possible from it, and no backward harvest exists in the "
      "sitemap.")
    w("- Five country directories serve no city page: French Guiana, Honduras, Hungary, Iceland, "
      "Saint Pierre and Miquelon.")
    w("- The platform carries no per-prayer adjustment values for `mosque`-source pages; the "
      "adjustment fields read `null`, so those tables cannot be reconstructed from parameters.")
    w("")
    w("## Data")
    w("")
    w("- `captures/cities/<country>/<city>.html` — the raw page for every city (502 MB).")
    w("- `data/<country>-<city>.json` — the dated rows, `{'YYYY-MM-DD': {fajr..isha}}`.")
    w("- `data/universe.tsv`, `data/fits.json`, `data/summary.json`.")
    w("- `tools/` — the harvest, the fit and the summariser, each with the recipe it runs.")
    open(os.path.join(ROOT, "REPORT.md"), "w").write("\n".join(o) + "\n")
    print("wrote REPORT.md")


if __name__ == "__main__":
    main()
