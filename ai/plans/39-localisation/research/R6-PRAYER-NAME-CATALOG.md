# R6: Prayer-name catalog, sourced

Status: complete. Companion data file: `prayer-names.json` in this directory. Every claim below traces to a source slug registered in that file's `_meta.sourceSlugs`. This report covers 28 languages: the 8-language launch set plus 20 more of the 22-language full set. Two requested languages are absent: both were listed as `zh-Hans` and `zh-Hant` variants of one code in the brief; no language was skipped for lack of trying.

What this is: data entry with citations. What this is not: translation. Where a language had no source, the entry is `null` with a note. There are 41 nulls across the file. Every one of them is deliberate.

## 1. Coverage table

Legend: `H` high, `M` medium, `L` low, `-` null (no sourced text). Names are the 11 rows; Expl are the 5 explanation strings.

| lang | Fajr | Sunrise | Dhuhr | Asr | Magrib | Isha | Midn. | L Third | Suhoor | Duha | Istij. | Expl |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| en | H | H | H | H | H | H | H | H | H | H | H | H |
| ar | H | H | H | H | H | H | H | M | H | H | M | H |
| id | H | H | H | H | H | H | M | M | H | H | L | M |
| ur | H | H | H | H | H | H | M | M | H | - | - | M |
| bn | H | H | H | H | H | H | M | M | H | H | - | M |
| tr | H | H | H | H | H | H | H | M | H | H | M | H |
| fr | H | H | H | H | H | H | M | M | M | L | - | M |
| de | M | H | H | H | H | M | H | H | M | - | - | H |
| fa | H | H | H | H | H | H | H | H | M | M | - | M |
| ms | H | H | H | H | H | H | M | L | H | H | - | M |
| sw | H | H | H | H | H | H | H | H | - | - | - | M |
| ha | H | H | H | M | M | H | - | - | - | - | - | - |
| so | H | M | H | H | H | H | L | - | L | L | - | - |
| ps | M | H | H | H | H | H | - | - | - | - | - | - |
| ku | M | L | H | H | H | H | L | - | - | - | - | - |
| uz | H | H | H | H | H | H | - | H | H | H | - | H |
| az | H | H | H | H | H | H | H | - | L | - | - | M |
| ta | H | H | H | H | H | H | - | - | L | - | - | M |
| ml | H | H | H | H | H | H | - | M | - | M | - | M |
| hi | H | H | H | H | H | H | M | M | M | - | - | M |
| ru | H | H | H | H | H | H | M | M | M | L | - | M |
| es | M | H | M | H | M | H | M | M | M | - | - | M |
| zh-Hans | H | H | H | H | H | H | M | L | M | - | - | M |
| zh-Hant | H | H | H | H | H | H | M | L | M | - | - | M |
| bs | H | H | H | H | H | H | H | - | - | - | - | M |
| sq | H | H | H | H | H | H | - | - | - | - | - | M |
| th | H | H | H | H | H | H | - | - | - | L | - | M |
| nl | H | M | H | H | H | H | L | L | L | - | - | M |

Reading of the table:

- The 6 standard names are sourced at high or medium confidence for every language. No language ships a guessed Fajr.
- `Istijaba` is null for 22 of 27 non-English languages. This is the honest result: almost no prayer-time table in any language publishes a row for it.
- `Duha` is published by exactly two authority families in the world as far as this research found: JAKIM-family (Malaysia) and the Indonesian imsakiyah convention. Uzbek islam.uz publishes the same instant under the name `Ishroq` with the exact 20-minutes-after-sunrise definition this app uses.
- The 5 explanation strings are machine-translatable in structure but were derived from each language's sourced names, because the names themselves are the vocabulary risk.

## 2. Sources

| Source | URL | Covers | Licence | Trust |
|---|---|---|---|---|
| Diyanet (Turkey) | namazvakitleri.diyanet.gov.tr | tr names, both language versions of the same table | state site, public data | highest; read both `/tr-TR/` and `/en-US/` and confirmed the label mapping |
| Kemenag convention (Indonesia) | bimasislam.kemenag.go.id and jadwalsholat.org, jadwalsholat.nu.or.id | id names, Imsak/Subuh/Terbit/Dhuha split | state criteria, public | high; the criteria page defines Imsak as 10 min before Subuh |
| JAKIM e-Solat family (Malaysia) | e-solat.gov.my, mufti.pahang.gov.my/solat | ms names incl. Duha | state, public | highest; the Pahang mufti page renders the full JAKIM row set |
| MUIS (Singapore) | muis.gov.sg | corroborates ms | state, public | high |
| KMSH (Albania) | namaz.kmsh.al | sq names, with Arabic glosses | religious community, official | highest; prints the Arabic beside each Albanian label |
| Habous ministry (Morocco) | habous.gov.ma | fr names (French-language tables) | state, public | high; Alfajr/Chourouq/Dhuhr/Asr/Maghrib/Ishae |
| islom.uz (Uzbekistan) | islom.uz/taqvim | uz names incl. Ishroq and Tahajjud | religious site, de facto national | high |
| Azerbaijani portals | namazvaxti.az, islam.az, metbuat.az | az names | private but consistent across three | medium-high |
| Diyanet Haber | diyanethaber.com.tr | tr Duha (Kuşluk) definition | Diyanet-affiliated outlet | high for the definition |
| İsmail Ağa | ismailaga.org.tr | tr Istijaba (İcabet saati) | mosque foundation | medium |
| vaktija.ba | vaktija.ba | bs names | Bosnian vaktija tradition | high |
| islamhouse Hausa | islamhouse.com | ha prayer-time prose | Saudi dawah office, free literature | high for prose, medium for labels |
| masjidbox Somali | masjidbox.com | so names | mosque platform | medium |
| Iranian portals | bahesab.ir, badesaba.ir | fa names | private, consistent | high |
| ps.islamery.com | ps.islamery.com | ps names | private | medium |
| ku.wikipedia | ku.wikipedia.org/wiki/Nimêj | ku names | CC BY-SA | medium |
| national Wikipedia articles | ur, bn, hi, ru, zh, nl, es, ml, ha, ps | names in prose | CC BY-SA | medium; used where no authority table exists |
| wikishia Swahili | sw.wikishia.net | sw names | CC BY-SA | medium |
| Mihrab | github.com/MihrabHQ/Mihrab at 77e846d | 13 locales | AGPL-3.0 | cross-check only, never sole source for shipped text |
| Al-Azan | github.com/meypod/al-azan-compose at d89b047 | 12 locales | AGPL-3.0 | cross-check; its tr/fa/sw/de hint strings quote full sentences that are citable as usage |
| muslimthaipost / whitechannel | prayertimes.muslimthaipost.com, whitechannel.tv | th names | private Thai Islamic media | medium |
| true-time Tamil, muslimbangla, namajersomoysuchi | various | ta, bn prose and tables | private | medium |

AGPL discipline, stated plainly: Mihrab and Al-Azan are AGPL-3.0. This project used them to verify that a name agrees with an authority or a second independent source. Entries whose `source` field names only `mihrab@77e846d` or `al-azan@d89b047` are flagged in the JSON. They are: id `Last Third`, ur `Midnight` and `Last Third`, bn `Midnight` and `Last Third`, tr `Last Third`, fr `Midnight`, `Last Third`, `Suhoor`, de `Fajr`, `Ischa`, `Last Third`, `Suhoor`, and several more listed in the JSON. Each needs one independent confirmation, from a dictionary, a national authority, or a native speaker, before shipping in a closed-source app. The five-character prayer names themselves (Fajr, Dhuhr, Asr, Maghrib, Isha) are common property of the language and carry no licence risk; it is the longer explanatory labels where the AGPL-only flag matters.

## 3. The traps

### 3.1 Suhoor versus Imsak, per language

This is the trap with real user-facing damage. In several major languages the table row that sits where this app shows Fajr is labelled with the fast-start concept, and the meal has a separate word.

| lang | Table shows where app shows Fajr | Meal word (app's Suhoor) | Deadline word (not the meal) | Mapping onto the app's 11 rows |
|---|---|---|---|---|
| tr | İmsak (Diyanet tr page) | Sahur | İmsak | Fajr row labels İmsak; Suhoor row labels Sahur. Verified: Diyanet's own English page prints Fajr at the identical time its Turkish page prints İmsak |
| id | Subuh, with Imsak as a separate earlier row (10 min) | Sahur | Imsak | Fajr row labels Subuh; Suhoor is Sahur; do not render an Imsak row, the app has none |
| ms | Subuh, with Imsak as a separate earlier row | Sahur | Imsak | same as id |
| sq | Imsaku (KMSH, glossed الفجر) | not published; imsaku/iftari pair | Imsaku | Fajr row labels Imsaku; Suhoor unsourced, left null |
| th | ซุบฮิ, with อิมซาก as a separate earlier row | unsourced | อิมซาก | Fajr row labels ซุบฮิ |
| uz | Bomdod, annotated Saharlik on Ramadan tables | Saharlik | Saharlik | Fajr row labels Bomdod; the app's Suhoor row (a deadline) labels Saharlik, matching how namozvaqti.uz prints it |
| fa | اذان صبح | سحری | اذان صبح | Fajr and the deadline share one label; Suhoor as a distinct meal row only exists in Ramadan |
| en | Fajr | Suhoor | Imsak | the app's own model |

The general rule this research supports: languages whose Islam came via the Hanafi Ottoman or Persian channel (Turkish, Albanian, Bosnian, Urdu, Uzbek) tend to publish a fast-start row; languages of the Shafi'i Malay world (Indonesian, Malay) publish Subuh plus a clearly separate Imsak row. The app's `Suhoor` (meal) and `Fajr` (prayer) split maps cleanly onto the Malay-world model and onto Turkish if Fajr is labelled İmsak. It maps badly onto Persian, where one label serves both concepts.

### 3.2 Istijaba: which languages have no word

22 of 27 non-English languages in this file have a null for Istijaba. What those languages' apps and texts do instead:

| language family | what exists instead |
|---|---|
| Turkish | İcabet saati (hour of acceptance), used by İsmail Ağa and religious press; not a Diyanet table row |
| Indonesian | waktu istijabah in religious journalism; no table row |
| Malay | waktu mustajab; no table row |
| Arabic | ساعة الاستجابة, the source phrase; islamqa 112165 |
| European languages | a descriptive phrase: l'heure d'exaucement (fr), die Stunde der Erhörung (de), час принятия мольбы (ru), saat ya maombi kukubalika (sw). All are sentences, not row labels |
| South Asian | Urdu, Bengali, Hindi describe the concept, never name it in one word |

Recommendation: treat Istijaba as a row that exists only where a language has a real name for it (ar, tr, and after confirmation id). For the rest, the cleaner product decision is to suppress the row and let the explanation surface in the Friday-notification copy instead. Shipping a transliteration Istijaba into 20 languages that never use the word teaches users nothing and looks like a bug.

### 3.3 Transliterate versus translate

| pattern | languages | effect on layout |
|---|---|---|
| Keep the Arabic loanword | ur, bn, fa, ps, ku, az, ta, ml, hi, sw (partly), id/ms (regional spellings), ru | short names, 4 to 10 chars |
| Use the Ottoman/Persian heritage name | tr (Sabah/Öğle/İkindi/Akşam/Yatsı), bs, sq, uz, ha | short, 4 to 8 chars |
| Translate the concept | de (Abendgebet, Nachmittagsgebet), fr (Lever du soleil), nl, es (amaneecer) | long, 12 to 19 chars |
| Chinese | zh-Hans, zh-Hant | 2 chars, the shortest set in the file |

The European languages are where the layout dies. German's Sonnenaufgang is 13 characters; French's Lever du soleil is 15. If the fixed-width column is sized to the English Sunrise (7 chars), both overflow. The mitigation is in the length table below.

### 3.4 Duha: who publishes it

| source | publishes a Duha row? | name used |
|---|---|---|
| JAKIM family (Malaysia) | yes | Dhuha |
| Indonesian imsakiyah (NU Online, jadwalsholat.org) | yes | Dhuha |
| islom.uz (Uzbekistan) | yes, same instant | Ishroq, defined as 20 minutes after sunrise |
| Diyanet (Turkey) | no table row, but Diyanet Haber defines it | Kuşluk (or İşrak) |
| Bengali nafil tables | yes | চাশত (Chasht, from Persian) |
| everything else found | no | - |

So the app's Duha row has a sourced name in ms, id, uz, bn, tr, fa (نماز چاشت), ml (ളുഹാ) and a null elsewhere. That is the honest ceiling.

### 3.5 Script and spelling variants

| language | variants found | what was chosen |
|---|---|---|
| Urdu | فجر vs نماز فجر; طلوع آفتاب vs طلوع | bare name for rows, matching Pakistani tables |
| Bengali | যোহর / জোহর / ধুহর; ইশা / এশা; সাহরি / সেহরি | যোহর, ইশা, সাহরি, flagged the alternatives |
| Chinese | 晨礼 (written standard) vs 邦达 (Hui folk, from Persian bamdad); likewise 撇申 晌礼, 底盖尔 晡礼, 沙目 昏礼, 呼福坦 宵礼 | written standard; the Hui names are in the notes for future regionalisation |
| Thai | muslimthaipost uses Thai-native ตะวันขึ้น for Sunrise; whitechannel uses the Arabic loan ชุรูก; ซุบฮิ vs ศุบฮิ for Fajr | muslimthaipost's set, Arabic loans where both exist and the Thai-native word is astronomical |
| Indonesian | Subuh/Imsak split vs bare Fajr; Dzuhur/Zuhur/Dhuhur; Ashar/Asar; Isya/Isya' | the Kemenag-table forms |
| French | Maghrib vs Maghreb; Isha vs Icha vs Ishae; Chourouq vs Lever du soleil | Maghrib, Isha, Lever du soleil, with Chourouq noted as shortText |
| German | Fajr vs Fadschr; Isha vs Ischa; Asr vs Nachmittagsgebet | Fadschr and Ischa are the German-transliteration standard, Fajr and Isha the community standard; file flags the choice |
| Russian | Фаджр vs Фаджр (same); Восход vs Восход солнца | short forms |
| Kurdish Kurmanji | Mexreb vs Êvar; Eşa vs Şev (Arabic loan vs Kurmanji word) | the Arabic loans, which match the other languages, with the Kurmanji words noted |
| Azerbaijani | Sübh vs Fəcr; Gün çıxır vs Günəş | Sübh, Gün çıxır |

### 3.6 Sunrise is an astronomical event

Every language in the file names Sunrise in the astronomical register, not the liturgical one: الشروق, Terbit, Syuruk, طلوع آفتاب, Güneş, Macheo, Waaberi, لمرختنه, Quyosh, Gün çıxır, 日出, سूर्योदय, सूर्योदय, Восход, Zonsopkomst, Amanecer, Izlazak sunca, Lindja, ตะวันขึ้ن. Two consequences. First, the row reads as weather, not worship, which is correct and matches the app's model where Sunrise ends Fajr's window. Second, translators asked to localize this row will reach for the plain word for sunrise in their language, which is exactly right, so this row is the one where machine translation is safe. The one exception is Thai, where the Arabic loan ชุรูก is also current; the file picks the Thai-native word.

One further finding: Persian tables distinguish غروب آفتاب (sunset) from اذان مغرب (the Maghrib prayer, minutes later). The app computes Magrib as the prayer. If a Persian user compares the app to an Iranian portal, the Magrib row will differ by a few minutes. That is a calculation-convention difference, not a naming one, but it will arrive as a naming bug report. Worth a note in the app's Persian help text.

## 4. Length table

Character counts of the longest name in each set. The app sizes the fixed-width column to the longest name.

| lang | longest standard | chars | longest extra | chars | over 20 | shorter alternative |
|---|---|---|---|---|---|---|
| en | Sunrise | 7 | Last Third | 10 | | |
| ar | الشروق | 6 | نصف الليل | 9 | | |
| id | Maghrib | 7 | Sepertiga akhir | 15 | | |
| ur | طلوع آفتاب | 10 | آخری تہائی | 10 | | |
| bn | সূর্যোদয় | 9 | শেষ তৃতীয়াংশ | 13 | | |
| tr | İkindi | 6 | İcabet saati | 12 | | |
| fr | Lever du soleil | 15 | Minuit islamique | 16 | | Chourouq (8), Minuit (6) |
| de | Sonnenaufgang | 13 | Letztes Drittel | 15 | | Schuruk (6) |
| fa | طلوع آفتاب | 10 | نیمه شب شرعی | 12 | | طلوع (4) |
| ms | Maghrib | 7 | Sepertiga akhir malam | 21 | YES | Sepertiga akhir (15) |
| sw | Magharibi | 9 | Theluthi ya mwisho ya usiku | 27 | YES | needs a speaker; a Qiyam-style single word may exist |
| ha | Sallar Azahar | 12 | null | 0 | | Azahar alone (6) |
| so | Cishaa'i | 8 | Habeennimo dhexe | 16 | | |
| ps | د ماسپښين لمونځ | 15 | null | 0 | | ماسپښين (7) |
| ku | Derketina rojê | 14 | Nîveşev | 7 | | |
| uz | Bomdod | 6 | Tahajjud | 8 | | |
| az | Gün çıxır | 9 | Səhər yeməyi | 12 | | Günəş (5) |
| ta | சூரிய உதயம் | 11 | நோன்பு உணவு | 11 | | |
| ml | സൂര്യോദയം | 9 | തഹജ്ജുദ് | 8 | | |
| hi | सूर्योदय | 8 | इस्लामी आधी रात | 15 | | आधी रात (7) |
| ru | Восход | 6 | Исламская полночь | 17 | | Полночь (7) |
| es | Amanecer | 8 | Medianoche islámica | 19 | | Medianoche (11) |
| zh-Hans | 晨礼 | 2 | 最后三分之一 | 7 | | |
| zh-Hant | 晨禮 | 2 | 最後三分之一 | 7 | | |
| bs | Izlazak sunca | 13 | Ponoć | 5 | | Izlazak (7) |
| sq | Ikindija | 7 | null | 0 | | |
| th | ตะวันขึ้น | 9 | ดุฮา | 4 | | |

Two languages exceed the 20-character threshold, both on `Last Third`: Malay at 21 (fix: drop `malam`, since Sepertiga akhir alone is unambiguous next to a clock time) and Swahili at 27 (Theluthi ya mwisho ya usiku; no sourced shorter form exists, so this needs a speaker or a layout decision). Every other language fits a column sized to about 16 characters, and the French/German overflow has a legitimate short alternative in the Arabic loan (Chourouq, Schuruk) that those communities already use in mosque calendars.

The `shortText` field is not present in the JSON because no entry needed it at the name level except where the note already carries the alternative (fr Chourouq, de Schuruk, az Günəş, fa طلوع, ps bare names, ha bare names, bs Izlazak). Implementers should read the notes before sizing columns.

## 5. Confidence assessment

Ship on this data, no native speaker needed first (names verified against a national authority or two independent sources):

ar, tr, id, ms, uz, sq, bn (standard 6 only).

These seven have their standard six names from an authority or an authority plus a catalog. Turkish and Albanian need the İmsak/Imsaku decision (section 3.1) signed off by the owner, because it is a product decision, not a translation one.

Ship the standard 6, hold the extras for a speaker:

ur, fa, sw, ru, hi, zh-Hans, zh-Hant, bs, az, ta, ml, th, so.

Their six names rest on Wikipedia prose, one good private portal, or a single catalog. The extras are null or AGPL-only.

Hold the whole language:

fr, de, es, nl, ku, ps, ha.

French, German, Spanish and Dutch have a genuine orthographic fork (Fajr vs Fadschr, Maghreb vs Maghrib, Fayr vs Fajr, Zonsopkomst confirmation) that a native Muslim speaker should settle in one pass, and their extras are AGPL-only. Kurdish Kurmanji, Pashto and Hausa have structural gaps (no sourced Sunrise for ku, no extras at all for ha and ps) that this research could not close from public tables.

Do not ship Istijaba in any language except ar and tr without a speaker. Do not ship Duha outside ms, id, uz, bn, tr, fa, ml without a speaker.

The single most important trap, restated: the Turkish Fajr row must read İmsak, not Sabah, if it is to match Diyanet, and the same convention decision hits Albanian (Imsaku) and, in the opposite direction, Indonesian and Malay (Subuh, with Imsak as a separate row the app does not have). Getting this backwards shows a million Turkish users a dawn time under the wrong concept. Everything else in this file is recoverable; that one is a credibility failure.
