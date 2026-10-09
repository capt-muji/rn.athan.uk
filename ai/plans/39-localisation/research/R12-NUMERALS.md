# R12. Numeral systems per locale (research agent report, 2026-10-09)

Dispatched by the owner's instruction. Method: all sources fetched live on 2026-10-09. CLDR
defaults come from the published CLDR JSON (unicode-org cldr-json, main branch, cross-checked
against the 45.0.0 tag). Each locale's file is
`https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json/cldr-numbers-full/main/<LOCALE>/numbers.json`
(the `defaultNumberingSystem` field).

## 1. The three numeral families and who uses them

The W3C Arabic Layout Requirements spec fixes the vocabulary and the geography: European (0123)
for "Western Arabic-speaking countries; e.g. Algeria or Morocco", Arabic-Indic (0123, U+0660) for
"Eastern Arabic-speaking countries; e.g. Egypt, Saudi Arabia, Iraq", and Extended Arabic-Indic
(0123, U+06F0) for "Iran and Afghanistan" (w3.org/TR/alreq). Wikipedia's Eastern Arabic numerals
article adds: Urdu reuses the Persian code points, the Maghreb "only" uses Western numerals, the
UAE "uses both", and in Pakistan "Western Arabic numerals are more extensively used digitally"
while Urdu print keeps Eastern numerals.

Two CLDR shifts matter:

- **Arabic flipped in CLDR 46 (2024)**: `ar` root default was `arab` in CLDR 45 and is `latn` in
  CLDR 46+, with `arab` kept as the `native` system. Regional overrides survive: `ar-EG` and
  `ar-SA` remain `arab`, while `ar-AE`, `ar-DZ`, `ar-TN`, `ar-LY`, `ar-MA` are `latn`. Devices
  with older ICU still format `ar` with Arabic-Indic digits, which is why Al-Azan's "default" mode
  behaves differently per device.
- **Urdu is `latn` with `arabext` as native**, matching the "Latin on screens, 0123 in print"
  reality.

Non-Latin defaults in the launch set are exactly: `fa` = `arabext`, `ps` = `arabext`, `bn` =
`beng`. Everything else (`en`, `hi`, `tr`, `id`, `ms`, `sw`, `ha`, `so`, `ku`, `az`, `ru`, `es`,
`fr`, `de`, `zh`/`zh-Hans`, `pt-BR`, plus `ku-Arab` and `ms-Arab`) is `latn`.

**Maghreb and UAE**: Morocco's Ministry of Awqaf prints its Arabic prayer page with Latin times
("04:39", "06:06", habous.gov.ma/prieres), zero Arabic-Indic digits on the page. Egypt's Dar
al-Ifta does the same on its Arabic timetable ("05:02 ص", "12:55 م", dar-alifta.org/ar/prayer).
CLDR's `ar-AE` default is `latn`, consistent with the "uses both" note and Gulf news practice.

## 2. Per-locale table

| Locale | CLDR default | Authority practice (verified) | Comparator apps | Recommended launch numeral |
|---|---|---|---|---|
| en | latn | East London Mosque PDF timetable: Latin | All Latin | Latin 0123 |
| ar | latn since CLDR 46 (was arab in 45), ar-EG/ar-SA = arab | Dar al-Ifta Ar page: Latin times; Egypt print uses 0123 | Muslim Pro ar page: Latin. Mihrab: Latin (code-cited). Al-Azan: ICU default + override | Latin 0123, with an Arabic-Indic toggle |
| fa | arabext | ALREQ and Wikipedia put Iran on 0123 (official pages unreachable) | Muslim Pro fa page: Latin times (Persian digits only in prose) | Persian 0123 |
| ur | latn (native arabext) | Daily Jang Urdu prayer page: Latin times, 0 Urdu digits; print differs | Muslim Pro ur page: Latin | Latin 0123, note print convention |
| hi | latn (native deva) | Hindi timetable sites use Latin | Muslim Pro hi page: Latin | Latin 0123 |
| bn | beng | Islamic Foundation district PDFs; UK Bengali mosque timetable shows "21:25" in Bengali digits; Prothom Alo reproduces with Bengali dates | Muslim Pro bn page: Latin times, Bengali digits in dates | Bengali 0123 |
| tr | latn | Diyanet: Latin times | Muslim Pro tr: Latin | Latin 0123 |
| id | latn | Kemenag data as republished: Latin | Muslim Pro, Al-Azan: Latin | Latin 0123 |
| ms | latn | JAKIM portal (JS), Malaysian timetables Latin; MUIS Latin | Muslim Pro ms: Latin | Latin 0123 (Jawi print uses 0123) |
| sw | latn | BAKWATA notices, Latin script | Al-Azan ships sw: Latin | Latin 0123 |
| ha | latn | Nigerian timetables in Hausa media: Latin | Sajda ha page: Latin | Latin 0123 |
| so | latn | Somali has used the Latin script officially since 1972 | Muslim Pro: Latin | Latin 0123 |
| ku | latn (even ku-Arab) | Sorani prayer site: Latin times with Arabic-Indic dates | Muslim Pro has no ku locale | Latin 0123 (dates in 0123 later if wanted) |
| ps | arabext | ALREQ assigns 0123 to Afghanistan | Muslim Pro has no ps locale | Persian 0123 |
| az | latn | Qafqaz Islam Idaresi calendar: Latin digits only | Muslim Pro: Latin | Latin 0123 |
| ru | latn | Moscow Cathedral Mosque schedule: Latin | Muslim Pro: Latin | Latin 0123 |
| es | latn | Centro Cultural Islamico de Madrid | Muslim Pro: Latin | Latin 0123 |
| fr | latn | Grande Mosquee de Paris | Muslim Pro: Latin | Latin 0123 |
| de | latn | DITIB Ingolstadt | Muslim Pro: Latin | Latin 0123 |
| zh-Hans | latn (via zh, native hanidec) | Chinese Islamic sites: Latin | Muslim Pro zh: Latin | Latin 0123 |
| pt-BR | latn | Instituto Islamico Brasileiro: Latin | Muslim Pro: Latin | Latin 0123 |

**What the comparators do, from their own code and issues:**

- **Muslim Pro** (closed source; localized web pages): Latin times in every sampled language (ar,
  ur, fa, bn, tr, hi, zh, ms). No numerals setting surfaced in its help center.
- **Al-Azan** (meypod/al-azan-compose): ships en, ar, fa, tr, id, fr, ur, hi, de, bs, vi, bn, sw
  (SupportedLocale.kt). NumberFormatUtils.kt implements four modes: Default (ICU locale default),
  Latn, Arab, Arabext, applied to times and countdown ticks. Issue #10 ("For some app languages,
  such as Arabic, it is not possible to change the numbering system to Western Arabic numerals")
  shows real Arabic-reading users asking for Western digits.
- **Mihrab** (MihrabHQ/Mihrab): 13 languages (languages.ts), and clockFormat.ts states the policy
  outright: "Digits are always Latin, on purpose... Only the day-period marker ('PM', 'م',
  '下午') and its position are localised." Its clockFormat test names the failure mode: "an
  Arabic user reading '5:31' beside a Latin-digit countdown on the same card is the bug this
  arrangement exists to prevent."

## 3. Readability and accessibility evidence

- W3C ALREQ: the three numeral families differ in bidirectional category, and digits interact
  with separators and RTL runs, so a line that mixes Latin digits into Arabic text creates bidi
  work that pure runs do not.
- W3C inline bidi markup guidance: numbers at direction boundaries are a listed spillover risk.
- Mihrab issue #26 plus its prayerRowTimeColumn test: proportional-digit jitter wrapped clock
  values onto second lines when Android system fonts lacked `tnum` tables, fixed with tabular
  sizing samples. Digit width, not just glyph choice, is an accessibility surface.
- Acta Psychologica 2023 eye-tracking study: adults make 2.5 to 7 times more fixations reading
  numerals than matched words. Script-agnostic, but supports minimizing per-line numeral load and
  consistency.
- Al-Azan issue #10 is demand-side evidence: Arabic-reading users wanted Western numerals in an
  Arabic UI, which is why the app grew an explicit setting.

## 4. Recommendation for a v2.0 launch

Ship Latin 0123 as the numeral system for every launch locale except `fa`, `ps` (Persian 0123)
and `bn` (Bengali 0123), apply that single choice identically to times, dates, and countdowns,
keep canonical `HH:mm` as internal storage and format only at display (the Mihrab and Al-Azan
pattern), render countdown digits in the same system as the times on the same card with tabular
figures, and add one setting, "Numerals: Western / Eastern Arabic", that defaults to Western for
`ar` and `ur`. This follows current CLDR, matches what Dar al-Ifta, Diyanet, JAKIM, Jang, and the
Maghreb actually print online, matches both open-source comparators, and cannot surprise a
London-English base because English behavior is byte-identical to today. The toggle absorbs the
one genuine split (Mashriq print convention 0123) that London's Egyptian and Sudanese users may
expect.

## Assumptions

- "CLDR default" means the `defaultNumberingSystem` field of current CLDR (main branch, post-46),
  not what an older device ICU will render at runtime.
- The Kemenag and JAKIM portals are JS-rendered, so their digits were verified through republished
  timetables (Kompas, waktusolat.my).
- The Iranian, Afghan, and KRG official sites were unreachable through the fetch tool, so `fa` and
  `ps` recommendations rest on CLDR plus ALREQ plus Wikipedia agreement.
- "Dates" means day/month/year numerals in Gregorian and Hijri strings, not calendar-system
  selection.
