# R17. Launch scale, weight and fonts, adversarially reviewed (research agent report, 2026-10-09)

Dispatched by the owner's instruction. His questions: "should we cover the top 20 most spoken
languages in the world? How heavy is that? Are we going to need to download specific fonts for
each language?"

**Verdict.** "Top 20 most spoken" is the wrong list for a prayer-times app: it agrees with the
Muslim-reach ranking on roughly half its entries, and its unique members (Japanese, Korean,
Vietnamese, Telugu, Marathi, Nigerian Pidgin) carry between 0.01% and 2% of the audience the app
exists for. Bytes are not the constraint: 20 locales cost ~104KB of JS source against a 4.4-4.9MB
bundle, and no font needs bundling on either floor platform. The real cost is that every locale
is a permanent per-locale verification and support annuity, paid by a solo owner who speaks none
of them.

## 1. The top 20 by speakers, audited against Muslim reach

Sources: Ethnologue 2026 via the current Wikipedia mirror and the Ethnologue 200 page; Muslim
reach from the Pew-based compilation (worldpopulationreview.com, fetched live) and Pew 2025
(pewresearch.org/religion/2025/06/09/how-the-global-religious-landscape-changed-from-2010-to-2020).
Catalog state from `research/prayer-names.json`.

| # | Language | Speakers (M) | Muslim reach (M) | Catalog | Font risk, Android 9 / iOS 18 | Verdict |
|---|---|---|---|---|---|---|
| 1 | English | 1,493 | Base + L2 lingua franca | 11/11 | None (Roboto) | Valuable, default |
| 2 | Mandarin | 1,183 | 28.1; Play Store unreachable in mainland China | zh 9/11 | Han: NotoSansCJK / PingFang | Marginal, post-launch |
| 3 | Hindi | 611 | ~200, overlapping Urdu | 9/11 | Devanagari: NotoSansDevanagari / Sangam MN; 1.5em floor | Valuable, after ur |
| 4 | Spanish | 561 | ~3-4 | 9/11 | None | Marginal |
| 5 | Arabic (MSA) | 335 | ~370 + liturgical reach into 2.0B | 11/11 | NotoNaskhArabic / Geeza Pro; 1.4em floor | Valuable, launch |
| 6 | French | 334 | ~125 + France 6.9 | 10/11 | None | Valuable, launch |
| 7 | Bengali | 274 | ~160-180 | 10/11 | NotoSansBengali / Bangla Sangam MN; tnum digit risk | Valuable, launch |
| 8 | Portuguese | 269 | ~7.5 | Absent | None | Marginal, cheapest add |
| 9 | Indonesian | 255 | 249.8, largest single Muslim population | 11/11 | None | Valuable, launch |
| 10 | Urdu | 246 | ~280 | 9/11 | Naskh only on Android 9 (no Nastaliq in its set); Geeza Pro on iOS | Valuable, launch |
| 11 | Russian | 210 | 15 + Central Asian L2 | 10/11 | Cyrillic is in bundled Roboto | Valuable, post-launch |
| 12 | German | 133 | 5.6 | 9/11 | None | Marginal, in the D15 eight |
| 13 | Japanese | 126 | 185K Pew (0.1% of Japan) | Absent | Kana in NotoSansCJK / Hiragino | Pointless |
| 14 | Nigerian Pidgin | 121 | Shares Nigeria's 96M with en and ha | Absent | None | Pointless; en + ha cover it |
| 15 | Egyptian Arabic | 118 | Inside `ar` | Covered by ar | Same as ar | Covered by ar |
| 16 | Marathi | 99 | ~2-4 (Deccani-Urdu dominant) | Absent | Same as Hindi | Pointless to marginal |
| 17 | Vietnamese | 97 | 70.9K Pew (0.07%) | Absent | None (Roboto covers the diacritics) | Pointless |
| 18 | Telugu | 96 | ~3-5 | In catalog | NotoSansTelugu / Kohinoor Telugu | Marginal |
| 19 | Swahili | 95 | 30-40 | 8/11 | None | Valuable, speaker-gated |
| 20 | Hausa | 94 | 60-75 | 6/11 | None | Valuable, speaker-gated |
| 20= | Turkish | 94 | 85 | 11/11 | None | Valuable, launch (labels per D27, not Diyanet's) |

Outside the top 20: Tamil 86M speakers (~7M reach, marginal), Korean 82M (75K Muslims,
pointless), Thai 71M (Thailand's Muslims mostly Malay-speaking; Thai-reachable ~1M). The mirror
image the top-20 hides: Persian ~110M Muslims, Pashto ~50, Uzbek ~30, Somali ~20, Azerbaijani
~15. Persian alone outreaches Turkish. `WHICH-20.md`'s audience-weighted 20 (`ar ur id hi bn fa
tr ha ps sw ku uz ms so ru az ta ml en fr`) is the defensible cut.

## 2. The weight, measured honestly

| Item | Measurement |
| --- | --- |
| Catalog per locale | 5,317 B **source** for this app's 129 strings (raw, not gzipped; the earlier "~5KB gzipped" phrasing mislabelled it - gzipped is ~1.5-2KB, and gzip is irrelevant to bundled Hermes bytecode anyway) |
| Sanity anchors | Al-Azan: 59.6-99.3KB raw strings.xml per locale, 13 locales. Bluesky: 480-650KB `.po` per locale at ~5,000 strings. Scaled to 129 strings: 6-13KB. The repo's 5.3KB is the right order, low end |
| 20 locales vs 8 | 104KB vs 42KB of JS source: 2.4% of the 4.4MB bundle (a newer measurement says 4.9MB; the conclusion survives either denominator) |
| Cold start | 6.6s first frame on the 3T, ~1.9s of it JS evaluation and mount; a 15KB module evaluates in single-digit ms on the SD820. Lazy per-locale loaders with `inlineRequires` bind evaluation to active + fallback regardless of shipped count |
| Widget payload | 9,800B for 23 entries against the 200,000B guard: 20.4x headroom. Worst locale (Thai) lands ~12,000B, 6% of guard. The estimate excludes `dateLabel`, so the per-locale payload re-run is mandated |

Conclusion: byte weight is a solved question at every scale up to 60 locales. Locale count
decisions must be made on verification and maintenance, not on size.

## 3. Fonts verdict: do not bundle, on either platform

**Android 9 (the floor device).** Decoded `fonts.xml` from the AOSP `pie-release` branch
(android.googlesource.com). The system image ships Noto fonts for: Arabic (Naskh + UI variant),
Bengali, Devanagari, Telugu, Tamil, Thai, CJK (Han simpl+trad, Hangul, Kana), Malayalam, Kannada,
Gujarati, Gurmukhi, Sinhala, Lao, Khmer, Myanmar. Cyrillic and Greek are in the bundled Roboto
itself. The file's header documents the fallback contract: full BCP-47 tag, then language, then
order. Per-glyph fallback is already load-bearing in this app's production Arabic rendering.

**Not in Android 9's list: Noto Nastaliq Urdu.** Urdu renders in Naskh on the 3T. That is the
system behavior for every Urdu string on that device, and Nastaliq's 2.5em line span would break
the fixed 57px row. Bundling Nastaliq to fix aesthetics would be the one defensible bundle and
the plan rejects it anyway.

**iOS 18.** The preinstalled system font list (developer.apple.com/fonts/system-fonts) ships a
font for every script in the set: Geeza Pro, Bangla Sangam MN and Kohinoor Bangla, Devanagari
Sangam MN and Kohinoor Devanagari, Kohinoor Telugu, Tamil Sangam MN, Thonburi, PingFang and
Hiragino families, Apple SD Gothic Neo.

**So is bundling ever required?** For glyph coverage, no, on either platform, for every script
either launch set needs. Three honest exceptions, none applying at 2.0.0: a brand typeface
(design choice); tabular figures (`fontVariant: ['tabular-nums']`; risk confined to the
non-Latin-digit locales, and numerals are Latin at 2.0.0 per D21, so the risk is empty until
then); a script the OS lacks (nothing in any candidate set qualifies).

**What does need per-locale work, since fonts do not:** vertical metrics. `TEXT.lineHeight.arabic`
exists because the problem was met once. The floors: 1.4em Arabic Naskh, 1.5em Devanagari, Thai
and Bengali, 2.0em+ Nastaliq, against a default 1.22em and a fixed 57px row. The launch eight
raises the script families from 2 (Latin, Arabic) to 4 (plus Bengali, Devanagari via ur/hi
rendering... the D15 eight needs Latin and Arabic only at launch; bn adds Bengali). The font
budget is per-script line-height constants plus device checks, not font files.

## 4. Maintenance cost per locale, beyond bytes

Per locale, permanently: sourcing the 16 religious terms with provenance and ~123 UI strings, one
native-speaker confirmation, the width-budget test, the per-locale widget payload run, the
per-locale glyph and line-height device check on the 3T, store listing metadata, and support
correspondence in a language the owner cannot read. Documented evidence: Element-web's standing
bug class of incomplete translations surfacing raw keys (element-hq/element-web#9422); the HN
discussion "What they don't tell you when you translate your app" naming the structural costs
(news.ycombinator.com/item?id=28468853); Bluesky's explicit contribution gate for new languages;
Muslim Pro curating a short language list rather than a maximal one.

## 5. Rollout compared

| Option | Sourcing gap on 2.0.0 date | Verdict |
| --- | --- | --- |
| 8 at launch (`en ar id ur bn tr fr de`) | None. Every row READY | Matches the recorded owner decision; recommended |
| 12 at launch (+ ms sw ha pt) | sw needs a speaker, ha needs 5 names + 5 explanations, pt needs a table + speaker | Acceptable only if the speakers are already in hand |
| 20 at launch | Adds ps, so, uz, ru, hi, zh; ~2.5x the per-locale checks; every future feature ships in 20 languages from day one | Rejected. Buys ~2% bundle cost to take on a 2.5x annuity, and half the added languages serve the wrong audience |

The language commit transaction is locale-count-independent. What scales linearly is exactly the
part the owner cannot delegate: per-locale verification and per-locale support.

## 6. Recommendation

Ship the D15 eight at 2.0.0. Quarterly thereafter: `ms` + `pt` + `uz` first (cheapest to close,
all high-readiness), `sw` + `ha` when one speaker each closes them, then `ru` + `hi`, then
revisit. Keep the architecture uncapped. Gate any locale beyond the eight on one named native
speaker (the Bluesky rule adapted to a solo project). Do not build `ln`, `ig`, `ja`, `ko`, `vi`,
or Nigerian Pidgin for v2.0 under any speaker-count argument.

## 7. The three biggest risks the owner was not seeing

1. **The "99% of the world" framing double-counts.** Top-20-by-speakers overlaps the
   Muslim-reach set on about half its entries; its unique members carry almost no Muslims, while
   the languages it misses (fa, ps, ha, so, ku, uz) carry over 200M.
2. **Vertical metrics and the width cache are per-locale layout debt.** The fixed 57px row, the
   1.22em default leading, and the grow-only width cache mean every added script family is a
   clipping or permanent-wide-column risk, not a string file.
3. **Each locale is an OS-level commitment, not a JS catalog.** Declaring locales in
   `expo.locales`, `knownRegions` and `CFBundleLocalizations` opts native surfaces into locale
   semantics (iOS per-app language lists, system alerts, the knownRegions RTL trap). The JS
   picker and the OS-declared list must match exactly. Twenty declared locales is twenty OS
   surfaces to keep honest, plus store metadata and review replies in each.
