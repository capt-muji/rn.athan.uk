# R9. Launch language set (research agent report, 2026-10-09)

> **SUPERSEDED IN PART, 2026-10-09 (synthesis findings 2-4):** D27 cancels the Turkish Diyanet
> wholesale exception and returns every authority label for the eight transliterated slots to the
> rule (transliterate everywhere, sign-off per exception). D24 cancels row suppression: readiness
> grades built on suppressed rows (ur, id, fr) re-derive with transliteration filling the nulls.
> The launch-set size itself returns to the owner (Q20): this report's rows 1-8 (`en ar id ur bn
> fa fr tr`) and the D15 eight (`en ar id ur bn tr fr de`) differ on `fa` versus `de`; no document
> records why `fa` dropped. Read sections 1 and 3 as evidence; read section 4's sizes and grades
> through this note.

Dispatched by the owner's instruction; population sources cited inline. Built on
`research/prayer-names.json` (28 locales), R6 and R4, with fresh population verification.

**The naming rule as a filter.** Eight transliterated slots (Fajr, Dhuhr, Asr, Magrib, Isha,
Suhoor, Duha, Istijaba), three translated (Sunrise, Midnight, Last Third), one word where the
language allows. The catalog was built before this rule, so section 3 is the pass that reconciles
them.

## 1. Ranked candidates: Muslim population reachable x catalog readiness

Population sources: Pew Research Center (2025-06-09 report; 2025-12-08 short read: 2.0B Muslims,
six countries hold 52%: Indonesia, Pakistan, India, Bangladesh, Nigeria, Egypt) [1][2], the
Pew-based World Population Review 2026 table [3], UNFPA 2025 for DRC [4]. "Reachable" means Muslims
who can plausibly run the app in that language; R4 C.2 supplies the mapping logic.

| # | Language | Muslims reachable (M) | Anchor numbers [3] | Catalog: 11 names | Width max (chars) | State |
|---|---|---|---|---|---|---|
| 1 | ar | ~370 + liturgical L2 for 2.0B | Egypt 87.5, Algeria 43.7, Iraq 39, Sudan 38.6, Morocco 36.4, Saudi 31.5, Yemen 26.8 [1][2][3] | 11/11 | 9 | READY |
| 2 | id | 249.8 | Indonesia 87.1% [3] | 11/11 (Istijabah low) | 15 | READY |
| 3 | ur | ~280 | Pakistan 233 (96.5%), India 200 Muslim lingua-franca overlap, UK 4 [3] | 9/11 | 10 | READY (2 rows suppressed) |
| 4 | bn | ~160-180 | Bangladesh 150.8 (91%), West Bengal, UK 4 [3] | 10/11 | 13 | READY |
| 5 | hi | ~200 addressable, overlaps ur | India 200 (14.6%) [3] | 9/11 | 15 | READY, extras held |
| 6 | fa | ~110 | Iran 85.7 (99.8%), Afghanistan Dari, Tajikistan [3] | 10/11 | 12 | READY |
| 7 | fr | ~125 conservative | France 6.9 + Senegal 17.4, Mali 20.5, Niger 21.1, Guinea 10.6, Burkina 13.5, Cote d'Ivoire 11.3, Cameroon 9.5, Chad 10.5 (+Maghreb French-L2 browse) [3] | 10/11 | 16 | READY |
| 8 | tr | ~85 | Turkey 81.2 (94.5%), diaspora [3] | 11/11 | 12 | EXCEPTION (Diyanet labels) |
| 9 | ha | ~60-75 | Most of Nigeria's 96 + Niger 21.1; Hausa 94M total speakers [3][5] | 6/11, explanations 0/5 | 12 (6 bare) | NEEDS SOURCING |
| 10 | sw | ~30-40 | Tanzania 19.4, Kenya 5.5, Mozambique 5.8, east DRC belt [3] | 8/11 | 27 | NEEDS SOURCING |
| 11 | ps | ~50 | Afghanistan 37, Pakistan KPK/Balochistan [3] | 6/11, phrases violate rule | 15 (7 bare) | NEEDS SOURCING |
| 12 | uz | 29.9 | Uzbekistan 88.7% [3] | 9/11 incl. Ishroq=Duha, Tahajjud row | 8 | READY |
| 13 | zh-Hans/Hant | 28.1 | China 1.73% [3] | 9/11, pair | 7 | EXCEPTION (translated set) |
| 14 | so | ~20-25 | Somalia 11, Ethiopia Somali region, Kenya, UK [3] | 9/11, lows | 16 | NEEDS SOURCING |
| 15 | ms | 21.5 | Malaysia 20.1 (63.5%), Brunei 0.4, Singapore 0.9 [3] | 10/11 | 21 to 15 (fix in R6) | READY |
| 16 | ru | 15 | Russia 11% [3] | 10/11 | 17 | READY, extras held |
| 17 | yo | ~15-20 (Pew silent; country studies) | Yoruba ~21% of Nigeria, ~half Muslim [6] | ABSENT | - | NEEDS SOURCING |
| 18 | pt | ~7.5 | Mozambique 5.8, Brazil 0.77 (census floor 35K), Guinea-Bissau 0.9, Portugal 0.04 [3][7] | ABSENT | - | NEEDS SOURCING |
| 19 | az | 10.1+ | Azerbaijan 97.3%, Iran north [3] | 8/11 | 12 | NEEDS SOURCING |
| 20 | de | 5.6 | Germany 6.7% [3] | 9/11 | 15 | READY after speaker fork |
| 21 | ln (Lingala) | ~1-3 | DRC Muslims 1.5-12% of 112.8M, concentrated in the Swahili-speaking east; Congo-Brazzaville 108K [3][4][8] | ABSENT | - | RECOMMEND AGAINST |
| 22 | ig (Igbo) | <2 | Southeast Nigeria predominantly Christian; southwest holds the south's Muslim share [9] | ABSENT | - | RECOMMEND AGAINST |

The remaining catalog locales (ku, ta, ml, th, bs, sq, es, nl) sit at 2-10M reachable with medium
sourcing; they are post-launch material per R6 section 5.

## 2. The owner's named interests vs the 28-locale catalog

| Interest | In catalog? | What is missing and the sourcing it needs |
| --- | --- | --- |
| Indonesian | Yes, 11/11 | Nothing for launch. Istijabah is low confidence; ship with the row suppressed until a speaker confirms |
| Bahasa Melayu | Yes, 10/11 | Last Third is derived-only and 21 chars; R6's fix (drop `malam`, `Sepertiga akhir`) plus one speaker confirmation. Sunrise `Syuruk` needs an owner sign-off as an authority exception (section 3) |
| English | Yes, 11/11 | Nothing; it is the default and fallback |
| Hausa | Partial, 6/11 | Five name nulls (Midnight, Last Third, Suhoor, Duha, Istijaba) and all five explanations. Ordinary Hausa has candidates (`tsakar dare`), but none attested in an Islamic-time table. Close via BBC Hausa Ramadan timetables, Nigerian Supreme Council for Islamic Affairs output, Hausa Wikipedia extensions of the existing islamhouse-ha base, then one northern-Nigerian imam review. Also decide bare forms (`Asuba`, `Azahar`) over `Sallar X` for the width budget |
| Yoruba | No | Nothing in the catalog; no prayer-table genre exists to harvest. Sourcing path: Yoruba-language da'wah sermon media [10], Yoruba Wikipedia's Islam articles, one native-speaker imam (Lagos/Abeokuta). Audience ~15-20M [6], real but smaller than Hausa and harder to source. Defer to post-launch unless a speaker is already at hand |
| Igbo | No | Audience under 2M: the Igbo southeast is predominantly Christian and the southwest holds the south's Muslim share [9]. Pew publishes no ethnic split. No source genre exists. Recommend not building it for v2.0 |
| Lingala | No | Congolese Islam is concentrated in Maniema and the Swahili-speaking east; estimates of national Muslim share range 1.4-12% [3][8], and the Lingala-speaking west holds a minority of them. Congolese Islamic bodies (Comico) publish in French and Swahili. Realistic Lingala-reachable audience ~1-3M. Recommend not building it; serve Congo with `fr` + `sw` |
| Swahili | Yes, 8/11 | Suhoor/Duha nulls (the rule itself resolves both to transliterations, see section 3), Last Third at 27 chars needs a shorter attested form, two explanations need polish. One Tanzanian or Kenyan speaker closes it |
| French for Congo | Yes, 10/11 | Serves all francophone Africa (~125M conservative [3]) including both Congos. Duha is an unreviewed transliteration, Istijaba null (suppress). One speaker for the AGPL-only extras (R6 section 2) |
| Brazilian Portuguese | No | Recommend one `pt` file, not `pt-BR` (R4 A.4: orthographic differences are small in this vocabulary). Sourcing is unusually easy: Brazilian and Portuguese prayer tables already print the exact pattern the owner's rule requires, transliterated prayers plus translated `Nascer do sol` for Sunrise [11][12][13]. Need one Brazilian mosque table for the six core names, then a speaker pass for Midnight (`Meia-noite`), Last Third (`Ultimo terco`), Suhoor, and the five explanations. Smallest audience of the launch candidates (~7.5M) but cheap to source |

## 3. Violations pass against the 8-transliterated / 3-translated rule

**Swap: the catalog text breaks the rule and an attested compliant form exists.**

| Locale | Slot | Catalog text | Compliant form | Basis |
|---|---|---|---|---|
| ps | Fajr, Dhuhr, Asr, Magrib, Isha | Translated phrases | The Arabic loans the same source prints (`صبح` and peers) | prayer-names.json ps notes; ps-islamery attests both conventions, "tables prefer the short loan" |
| ta | Suhoor | `நோன்பு உணவு` (translated, "fast meal") | `சஹர்` (Sahar), attested in Tamil Ramadan calendars | prayer-names.json ta Suhoor note |
| az | Suhoor | `Səhər yeməyi` (translated, "morning meal") | `Sahur`, attested in Azerbaijani Ramadan usage | prayer-names.json az Suhoor note |
| sw | Suhoor, Duha | null | Transliterations `Suhur`, `Duha` | The rule mandates transliteration for these slots; the catalog's own notes already point there. Needs only speaker sign-off |

**Keep as authority exceptions** (the Turkish precedent: the authority's own table label wins):

- **tr, wholesale**: Imsak (Fajr), Ogle, Ikindi, Aksam, Yatsi, Teheccud (Last Third), Kusluk (Duha) are all Diyanet or Diyanet-family labels, verified against both language versions of the same page (R6 section 3.1). Sunrise `Gunes`, Midnight `Gece yarisi` are translated and compliant.
- **uz**: Bomdod, Peshin, Shom, Xufton, Tahajjud, Ishroq are islom.uz's own rows, with Ishroq defined exactly as the app's Duha (20 min after sunrise). `Asr` and `Quyosh` are compliant anyway.
- **bs, sq**: Sabah/Podne/Ikindija/Aksam/Jacia and Imsaku/Yleja/Ikindia/Akshami/Jacia are the vaktija and KMSH labels. The Turkish-style Imsak/Imsaku convention needs the owner sign-off R6 section 5 already flags.
- **zh-Hans/Hant**: the translated set is the written standard used by both the PRC and Taiwan religious-affairs pages (R6 section 3.5); the Hui folk alternatives are Persian-route, not Arabic. No compliant form exists; keep as exception.
- **fa**: the `اذان صبح`-style rows are every Iranian portal's label; the bare Arabic `فجر` is the attested short form. Duha `چاشت` is Persian-route with the attested Arabic loan `ضحی` in the same source; keep `چاشت` as the living name, owner call.
- **ms Sunrise `Syuruk`**: a transliteration in a translated slot, but JAKIM e-Solat and MUIS print it (R6 section 2). Compliant alternative `Matahari terbit` is attested in Mihrab's locale set. This is the one Malay decision for the owner: exception-keep recommended, since the national authority prints it.
- **bn Duha `চাশত`**: Persian-route; the Arabic loan `দোহা` is attested but rare (prayer-names.json bn Duha note). Keep the Bangladeshi nafil-table form as exception.
- **so Fajr `Subax`**: Somali native word; the Fajr loan circulates and masjidbox prints Subax. Keep as masjidbox-attested, flag for the speaker pass.
- **ml Last Third `തഹജ്ജുദ്`**: violates the translate rule but no one-word Malayalam alternative is attested; keep.

**Width short forms that the rule now disallows:** fr `Chourouq` and de `Schuruk` for Sunrise are transliterations in a translated slot. Keep `Lever du soleil` (15) and `Sonnenaufgang` (13) and size the column to 16.

**Already compliant, no action:** en, ar, id, ur (with two suppressed rows), bn (aside from the Duha call), hi, ru, es, nl, th. German's chosen forms (Fadschr, Ischa) are German-orthographic transliterations and compliant.

## 4. Launch-set recommendation (12 languages)

| # | Tag | Status | One line of reasoning |
|---|---|---|---|
| 1 | en | READY | Base, fallback, and the largest L2 lingua franca (R4 A.9) |
| 2 | ar | READY | ~370M in Arabic-majority countries plus liturgical reach into all 2.0B Muslims; 11/11 sourced, 9-char width, RTL is the only cost |
| 3 | id | READY | Largest single Muslim population (249.8M); Kemenag-sourced 11/11 including Dhuha; suppress Istijabah |
| 4 | ur | READY | Pakistan 233M plus the North-Indian Muslim lingua franca and the UK mosque common tongue; suppress Duha/Istijaba rows |
| 5 | bn | READY | Bangladesh 150.8M plus the largest London mosque community; 10/11 at 13 chars |
| 6 | fa | READY | Iran 85.7M and the Dari belt, authority-sourced to 10/11; add the Magrib-convention help note R6 section 3.6 already prescribes |
| 7 | fr | READY | The owner's Congo interest plus ~125M francophone-African Muslims and France's 6.9M; keep the translated Sunrise and accept the 16-char column |
| 8 | tr | EXCEPTION | 81.2M Turkish Muslims read Diyanet's own label set, Imsak included; the exception is documented and verified |
| 9 | ms | READY | Owner interest; Malaysia 20.1M plus Brunei and Singapore; JAKIM 10/11 incl. Dhuha; apply the R6 width fix and sign off Syuruk |
| 10 | sw | NEEDS SOURCING | Owner interest; ~30-40M in the East African coastal belt and Congolese east; one speaker closes Suhoor/Duha and the 27-char Last Third |
| 11 | ha | NEEDS SOURCING | Owner interest; ~60-75M across northern Nigeria and Niger, the biggest West African gap in the catalog; needs the five nulls plus all five explanations from Hausa Islamic media and a speaker |
| 12 | pt | NEEDS SOURCING | Owner interest (pt-BR); one `pt` file serves Brazil, Portugal, Guinea-Bissau and Lusophone Africa at ~7.5M; the compliant core pattern is already attested in Brazilian mosque tables, so it is the cheapest missing locale to build |

If the owner wants eight at launch, ship rows 1-8 and hold `ms`/`sw`/`ha`/`pt` for the first
update; `ms` is the ninth by readiness, `pt` the fastest to close by sourcing effort. Post-launch
order: `uz` (strongest unsourced catalog after the launch set), `de`, `ru`, `hi`, `so`, `zh` pair,
`yo` if a speaker appears. Do not build `ln` or `ig` for v2.0.

## Sources

[1] Pew Research Center, "How the Global Religious Landscape Changed From 2010 to 2020", 2025-06-09
[2] Hackett, C., "Many religions are heavily concentrated in a few countries", Pew Research Center, 2025-12-08
[3] World Population Review, "Muslim Population by Country 2026" (Pew-based compilation), fetched 2026-10-09
[4] UNFPA, "Congo, the Democratic Republic of the Population 2025" (112.8M)
[5] Ethnologue 2026 via R4 C.1 (Hausa 94M total speakers)
[6] PBS Frontline, "Portraits of Ordinary Muslims: Nigeria"
[7] Wikipedia, "Islam in Brazil" (2010 census 35,207)
[8] Wikipedia, "Islam in the Democratic Republic of the Congo"; US State Dept IRF 2023 for Republic of the Congo
[9] Wikipedia, "Religion in Nigeria"; Guardian Nigeria
[10] Yoruba-language prayer instruction media (YouTube)
[11] true-time prayer times, Porto Alegre (pt)
[12] Mesquita Omar Ibn Al-Khattab (CCBI, Foz do Iguacu, Brazil), prayer table
[13] dateandtime.info (pt), Figueira da Foz
