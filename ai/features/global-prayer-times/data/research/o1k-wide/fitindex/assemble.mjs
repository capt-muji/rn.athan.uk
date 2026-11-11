import fs from "node:fs";

const entries = fs
  .readFileSync("entries.ndjson", "utf8")
  .split("\n")
  .filter((l) => l.trim())
  .map((l) => JSON.parse(l));

const byGrade = (g) => entries.filter((e) => e.grade_candidate === g);
const gradeA = byGrade("A");
const provisional = byGrade("provisional");
const community = byGrade("community");

const doc = {
  schema: "athan-fit-index",
  schemaVersion: "1.0.0",
  generated: "2026-11-10",
  generatedBy: "fitindex agent (registry), O1k nine-hour research operation",
  purpose:
    "machine-readable index of every fit recipe the O1k night produced, for the policy-layer build to consume. Recipes are transcribed as the fit deliverables state them; nothing here is re-derived.",
  gradingRule: {
    source: "T-667 #6943 owner multi-year ruling, as encoded in the policy layer v2.1",
    gradeA: "at least 2-3 distinct years of fitted evidence, one recipe reproducing every year",
    provisional: "one published cycle, one year, or a short sample inside one cycle; year-2 debt recorded",
    community: "fitted recipe from a mosque, federation or platform surface; never an authority claim",
    frozenGenerationPrecedent:
      "a table proven perpetual or byte-reprinted across nominal years does not supply a distinct year-2, so the A path is closed and the object stays provisional (precedents: Botswana 146/151 tables identical 2021-2026; Uzbekistan 1400/1404 cell-for-cell; Sri Lanka frozen uploads; Belgium 363/365 rows identical; Niger 1,651 of 2,190 slots identical across seven years)",
    note: "grade is independent of tier: a community surface can reach A on multi-year evidence, and an authority surface can sit at provisional on one year",
  },
  method: {
    engine: "adhan-js 4.4.6 at census/adhan-build is the common engine; fit7 and verify2 also use a PrayTimes v2-family engine as the publisher-side check; southasia2 uses an independent NOAA solar routine",
    scores: "exact = days or cells reproduced to the printed minute; within1 = days or cells inside one minute; worst = largest whole-minute miss. Units differ per entry and are stated in scores.unit",
    spanVerdicts: {
      yes: "one recipe holds across every held year or edition",
      no: "the recipe changes within the span, or the surfaces disagree inside it",
      "frozen-recomputed": "one recipe across years and the years are recomputed, not copied (a genuine multi-year test)",
      "frozen-reprint": "one table republished across nominal years: year-2 is nominal, not distinct",
      "untestable-single-year": "the held data is one year, one month or one short sample",
      "untestable-single-template": "one perpetual template; no second edition exists to test",
    },
  },
  counts: {
    entries: entries.length,
    countries_or_territories: new Set(entries.flatMap((e) => e.country.split("/"))).size,
    gradeA: gradeA.length,
    provisional: provisional.length,
    community: community.length,
    gradeBlocked: entries.filter((e) => e.grade_blocked).length,
    conflictsRecorded: entries.filter((e) => e.conflicts.length).length,
    distinctSpanYes: entries.filter((e) => ["yes", "frozen-recomputed"].includes(e.span_verdict)).length,
    frozenReprints: entries.filter((e) => e.span_verdict === "frozen-reprint").length,
    singleYearOrSample: entries.filter((e) => e.span_verdict.startsWith("untestable")).length,
  },
  entries,
  conflicts: [
    {
      id: "PK-ISLAMABAD",
      parties: ["PK-ISLAMABAD-FIT1", "PK-ISLAMABAD-SOUTHASIA2"],
      kind: "same surface, two workspaces",
      detail:
        "fit1 fits fajr 17.95 with a -0.5 floor margin and reads the chart as tracking the current (2026) solar year; southasia2 fits 18.00 (least squares 18.12) and reads the template as leap-anchored to 2028, with March-December rows computed one day ahead in a common year. Dhuhr and isha agree exactly (two clocks; a 15-minute ladder).",
      verdict: "arbitration-needed",
      suggest: "carry the clocks verbatim, hold fajr at 18.00, and publish the leap-basis caveat rather than choosing one anchor",
    },
    {
      id: "ID-NATIONAL-LINES",
      parties: ["ID-KEMENAG-HIGHLAND", "ID-MUHAMMADIYAH-DECADE", "ID-MUHAMMADIYAH-ACEH"],
      kind: "same country, two national publishers",
      detail:
        "Kemenag prints 20/18 +2 min (21/19 above ~1,750 m); Muhammadiyah prints 18/18 ceil +1 min and lands 7.7-7.8 min earlier for fajr every year from 2025 to 2035. Neither is wrong: they are two publishers.",
      verdict: "arbitration-needed",
      suggest: "ship both as distinct objects; never merge into one Indonesia recipe",
    },
    {
      id: "NE-GRADE",
      parties: ["NE-NIAMEY"],
      kind: "grade against precedent",
      detail:
        "The record holds grade A on a freshness check (banked Nov 2026 reproduced 30/30, constants unchanged). The generator has no year term, and 1,651 of 2,190 date-and-column slots are identical across all seven served years, so under the frozen-generation precedent there is no distinct year-2.",
      verdict: "arbitration-needed",
      suggest: "decide whether a freshness check satisfies the multi-year ruling or whether only recomputation does; the precedent says recomputation",
    },
    {
      id: "TN-ROUNDING",
      parties: ["TN-TUNIS-FIT1", "TN-TUNIS-DEEP2"],
      kind: "same surface, rounding convention",
      detail:
        "Constants agree (18.1/18.1, dhuhr +7, maghrib +2-3, Shafi 0). fit1 labels dhuhr +7.5 floor and maghrib +3 floor; deep2 labels dhuhr +7 round and maghrib +2 rounded-up, and reports that the held object's dhuhr floor is its largest single error over seven years.",
      verdict: "superseded",
      suggest: "take the seven-year reading (round), since floor(x+7.5) and round(x+7) only differ on exact-minute rows",
    },
    {
      id: "DZ-ISHA-RIDGE",
      parties: ["DZ-ALGER-1448-FIT2", "DZ-ALGER-1447-FIT11"],
      kind: "same country, two Hijri years",
      detail:
        "fajr 17.80 recovers identically in both years with the same margin and rounding. Isha's free fit prefers 16.10 on 1448 and 16.30 on 1447, two cells of 118; at the frozen 16.10 the 1447 score barely moves.",
      verdict: "consistent",
      suggest: "keep 16.10 and record the ridge",
    },
    {
      id: "SA-DUPLICATE",
      parties: ["SA-MAKKAH-1500H", "SA-FOUR-CITIES"],
      kind: "same surface, overlapping spans",
      detail:
        "deep1 fits Makkah over six Hijri years to 1500H; verify2 re-scores the same recipe at Makkah plus three more cities over 1448-1449. Both report 100% within one minute; each city's free fajr fit lands within 0.04 deg of 18.5.",
      verdict: "consistent",
      suggest: "merge into one Saudi object carrying the four-city verification",
    },
    {
      id: "BJ-CITY-ABSENT",
      parties: ["BJ-GAKPE-FIT2", "BJ-ATTRIBUTION-FIT11"],
      kind: "same surface, duplicate fit with a finer grid",
      detail:
        "Both find the Cotonou capture is computed for northern Benin. fit2 implies 11.12 N / 2.97 E; fit11 refines 11.11 N / 2.94 E with 1852/2190 exact. The page never says Cotonou.",
      verdict: "consistent",
      suggest: "record the surface as Gakpe, computed at Kandi; Benin has no gradable Cotonou table",
    },
    {
      id: "OM-ASR-SCHOOL",
      parties: ["OM-MUSCAT"],
      kind: "held object correction",
      detail:
        "The census object read asr as Hanafi; the eight-year fit puts it on the Shafi shadow with +5 ceil, which is 56 minutes away from Hanafi on average.",
      verdict: "superseded",
      suggest: "correct the object's asr to Shafi",
    },
    {
      id: "SR-ISHA-RULE",
      parties: ["SR-PARAMARIBO"],
      kind: "held object refutation",
      detail:
        "The census held 18/18; the sheet prints isha = maghrib + 70 on all 29 rows, and the angle model leaves a drifting residual (MAE 0.88) that the interval model does not (0.26).",
      verdict: "superseded",
      suggest: "replace the isha angle with the printed interval",
    },
    {
      id: "US-WIDGET-VS-FEED",
      parties: ["US-EIGHT-SURFACES", "US-DEFAULT-TALLY"],
      kind: "same mosque, two surfaces",
      detail:
        "IANT Richardson's dpt feed measures 18/17 while its own live Masjidal widget measures 15/15; the two disagree on exactly the two twilight prayers (fajr +15.6, isha -10.5 over 364 days).",
      verdict: "superseded",
      suggest: "the live page wins; gate every capture of a mosque route against its widget",
    },
  ],
  inFlight: [
    {
      workspace: "fit13",
      state: "started, empty",
      evidence: "only lib.js present (8,958 bytes, written 21:20)",
      scope:
        "Australia Diyanet full-year tables (Broadmeadows, Preston, Brisbane), the NZ FIANZ stated-offset fit, the New Caledonia year, Adelaide ISSA",
    },
    {
      workspace: "fit14",
      state: "not created",
      evidence: "no directory under o1k-wide/",
      scope: "the LUPT-family synthesis across England: whether the interval form plus its per-town shifts closes into one object",
    },
    {
      workspace: "verify3",
      state: "not created",
      evidence: "no directory under o1k-wide/",
      scope: "adversarial re-check of the night's five load-bearing findings",
    },
    {
      workspace: "wtdiff",
      state: "not created",
      evidence: "no directory under o1k-wide/",
      scope: "the country-by-country world-table diff draft",
    },
    {
      workspace: "fit8 (partial)",
      state: "delivered Norway only",
      evidence: "no-fit.json holds four IRN tables and no Swedish or Danish fit",
      scope: "the Swedish IF national line and the Danish three-way split are unfitted",
    },
    {
      workspace: "fit9 (partial)",
      state: "NL, BE and PT delivered; ES and IT open",
      evidence: "job1_nl.json, job2_be.json and job3_pt.json written; job3_pt.py ran at 21:18 and no Spain or Italy output exists",
      scope: "Spain (Madrid CCIM second city and second year) and Italy (the Rome monthly PNG) are unfitted",
    },
    {
      workspace: "fit6 (partial)",
      state: "three jobs delivered; the Baltic firsts did not land",
      evidence: "job1-geneva.json, job2-jamiat.json and job3-us.json only",
      scope: "Latvia, Lithuania and Belarus captures exist in nordics2 but carry no fit output tonight",
    },
    {
      workspace: "nigeria3",
      state: "fit delivered, no year-2",
      evidence: "fit/ holds three scripts and no JSON deliverable; the scores live in REPORT.md",
      scope: "Nigeria remains a community platform method with two months",
    },
  ],
  notFitted: [
    "Kuwait, Qatar, Jordan, Egypt, Morocco, Turkey, Iran, Yemen, Lebanon, Iraq (year fit), Palestine, Syria: captures or confirmations exist but no fit deliverable tonight",
    "Sweden, Denmark, Finland, Latvia, Lithuania, Belarus: captures exist, fits outstanding",
    "Spain, Italy, Andorra: iberia2 measurements exist, fits outstanding",
    "Australia, New Zealand, New Caledonia, Fiji: captured, fit13 queued",
    "Singapore, Brunei, Sri Lanka, Bangladesh, India, Nepal, Maldives, Thailand: confirmations and negatives, no recipe",
    "kel2's Yemen two-feed diff: a feed comparison (Sanaa API vs yemenawqaf.org Aden), not a fitted recipe",
  ],
};

fs.writeFileSync("FIT-INDEX.json", JSON.stringify(doc, null, 1) + "\n");
console.log(JSON.stringify(doc.counts, null, 1));
