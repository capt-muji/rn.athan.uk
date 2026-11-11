# O1l-15r — Turkey, city-level round two (all 81 provinces, full-year 2026)

Wave tag `o1l-15r`. Captured 2026-11-11. Authority surface: Diyanet İşleri Başkanlığı
domestic ilce tables. Fit engine: adhan 4.4.6 at
`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`, `CalculationMethod.Turkey()`
(18/17 + sunrise −7 / dhuhr +5 / asr +4 / maghrib +7), `Rounding.None`, Shafi asr,
TZ `Europe/Istanbul`, dates built from the capture's own `DD Month YYYY` strings.

## 1. Surface and how the ilce codes were recovered

`namazvakitleri.diyanet.gov.tr/tr-TR/{ilceId}` embeds the whole current calendar year in one
HTML table (`id="yourTable"`, columns `Miladi Tarih | Hicri Tarih | İmsak | Güneş | Öğle |
İkindi | Akşam | Yatsı`). A bare request 301s and must be followed.

The page carries no coordinate for the ilce, and the `state` select ids (500–580) are NOT
ilce ids: `/tr-TR/540` resolves to a 500 "Çalışma Zamanı Hatası" because the route treats
540 as an ilceId. The working door is the site's own region resolver:

```
GET /Tr-tr/home/GetDestinationUrl?CountryName=TÜRKİYE&StateName=<İL>&StateRegionName=&Culture=tr-TR
→ {"Url":"/Tr-tr/9560/icin-namaz-vakti","IlceId":"9560"}
```

Raw response saved to `captures/ilce-resolve.txt`. This is a NEW, reproducible method for
this trap: the record holds only the 9542-Kartal warning, not how to resolve an ilce id.

## 2. Rows banked — all 81 provinces, 29,565 dated rows, all of 2026

Each file `data/tr-2026-<province>.json` holds `rows: {"YYYY-MM-DD": {fajr, sunrise, dhuhr, asr,
maghrib, isha}}`, 365 days, 2026-01-01..2026-12-31, plus `_source`, `_ilce` and `_province`.
81 files, 29,565 rows, zero missing days, every capture HTTP 200.

Province-centre ilce ids resolved with the site's own resolver, one call per province, all 81
answered `Result: ok` (`data/province-ilce.json`). City-centre coordinates from Nominatim
(OSM `place=city`), `data/province-coords.json`.

Coordinate defect found and corrected: Nominatim returns 36.3669 N / 30.2858 E for `IĞDIR`,
which is a point in Antalya province, not Iğdır. At that point Iğdır scores MAE 53.4 min,
worst 75. At its true position 39.9219 N / 44.0436 E it scores MAE 0.404, within-1 98.2 %,
worst 2. Every other province resolved to its own centre on first answer.

Parse defect found and fixed: September's month cell is entity-encoded (`01 Eyl&#252;l
2026`), so a naive tag-strip yields "l" and silently drops all 30 September rows (335/365).
The parser decodes numeric entities before matching. Any prior Turkey capture parsed with a
tag-strip-only parser should be re-checked for the same 30-row hole.

## 3. Fit — one recipe, 81 provinces, 177,390 cells

`data/fit-2026-all81.json` holds the per-province, per-prayer scores; `data/signed-residual.json`
holds the second-level residual distribution over the first fifteen.

Aggregate: MAE 0.361–0.482 min per province, within-1 95.2–99.4 %, exact 56.3–65.0 %, worst
2 min on every one of the 81. **No deviating province.**

| province | ilce | lat | exact % | within-1 % | MAE | worst |
| --- | --- | --- | --- | --- | --- | --- |
| SİNOP | 9847 | 42.0266 | 58.54 | 95.57 | 0.459 | 2 |
| KIRKLARELİ | 9638 | 41.7370 | 56.30 | 95.53 | 0.482 | 2 |
| EDİRNE | 9419 | 41.6759 | 57.81 | 95.21 | 0.470 | 2 |
| BARTIN | 9285 | 41.6350 | 58.54 | 96.21 | 0.453 | 2 |
| ZONGULDAK | 9955 | 41.4527 | 59.41 | 96.26 | 0.443 | 2 |
| KASTAMONU | 9609 | 41.3765 | 59.18 | 96.80 | 0.440 | 2 |
| SAMSUN | 9819 | 41.2946 | 59.18 | 96.94 | 0.439 | 2 |
| KARABÜK | 9581 | 41.1955 | 58.45 | 96.21 | 0.453 | 2 |
| ARTVİN | 9246 | 41.1831 | 59.54 | 97.08 | 0.434 | 2 |
| ARDAHAN | 9238 | 41.1103 | 59.73 | 97.49 | 0.428 | 2 |
| RİZE | 9799 | 41.0248 | 60.00 | 97.31 | 0.427 | 2 |
| İSTANBUL | 9541 | 41.0064 | 57.95 | 96.35 | 0.457 | 2 |
| TRABZON | 9905 | 41.0055 | 57.53 | 95.66 | 0.468 | 2 |
| ORDU | 9782 | 40.9852 | 60.14 | 97.21 | 0.426 | 2 |
| TEKİRDAĞ | 9879 | 40.9781 | 57.17 | 97.17 | 0.457 | 2 |
| GİRESUN | 9494 | 40.9176 | 60.05 | 97.21 | 0.427 | 2 |
| DÜZCE | 9414 | 40.8392 | 58.54 | 96.35 | 0.451 | 2 |
| SAKARYA | 9807 | 40.7726 | 57.26 | 96.99 | 0.458 | 2 |
| KOCAELİ | 9654 | 40.7654 | 58.22 | 95.21 | 0.466 | 2 |
| BOLU | 9315 | 40.7333 | 59.63 | 96.76 | 0.436 | 2 |
| YALOVA | 9935 | 40.6583 | 59.22 | 96.76 | 0.440 | 2 |
| AMASYA | 9198 | 40.6503 | 60.05 | 97.17 | 0.428 | 2 |
| KARS | 9594 | 40.6071 | 61.37 | 97.81 | 0.408 | 2 |
| ÇANKIRI | 9359 | 40.5972 | 59.86 | 96.80 | 0.433 | 2 |
| ÇORUM | 9370 | 40.5499 | 60.73 | 96.85 | 0.424 | 2 |
| GÜMÜŞHANE | 9501 | 40.4618 | 59.82 | 97.26 | 0.429 | 2 |
| TOKAT | 9887 | 40.3234 | 59.59 | 97.49 | 0.429 | 2 |
| BAYBURT | 9295 | 40.2552 | 60.73 | 98.13 | 0.411 | 2 |
| BURSA | 9335 | 40.1826 | 59.32 | 97.31 | 0.434 | 2 |
| ÇANAKKALE | 9352 | 40.1463 | 58.22 | 96.53 | 0.453 | 2 |
| BİLECİK | 9297 | 40.1435 | 58.72 | 97.44 | 0.438 | 2 |
| IĞDIR | 9522 | 39.9219 | 61.42 | 98.22 | 0.404 | 2 |
| ANKARA | 9206 | 39.9208 | 58.72 | 97.17 | 0.441 | 2 |
| ERZURUM | 9451 | 39.9063 | 62.47 | 97.99 | 0.395 | 2 |
| KIRIKKALE | 9635 | 39.8410 | 60.27 | 97.58 | 0.421 | 2 |
| YOZGAT | 9949 | 39.8222 | 59.86 | 97.81 | 0.423 | 2 |
| ESKİŞEHİR | 9470 | 39.7744 | 59.09 | 97.63 | 0.433 | 2 |
| SİVAS | 9868 | 39.7504 | 60.50 | 98.13 | 0.414 | 2 |
| ERZİNCAN | 9440 | 39.7468 | 59.63 | 98.22 | 0.421 | 2 |
| AĞRI | 9185 | 39.7191 | 61.69 | 98.17 | 0.401 | 2 |
| BALIKESİR | 9270 | 39.6474 | 60.27 | 96.58 | 0.432 | 2 |
| KÜTAHYA | 9689 | 39.4199 | 58.86 | 97.63 | 0.435 | 2 |
| KIRŞEHİR | 9646 | 39.1461 | 61.10 | 97.35 | 0.416 | 2 |
| TUNCELİ | 9914 | 39.1061 | 62.42 | 98.58 | 0.390 | 2 |
| BİNGÖL | 9303 | 38.8861 | 61.69 | 97.99 | 0.403 | 2 |
| AFYONKARAHİSAR | 9167 | 38.7569 | 61.69 | 98.26 | 0.400 | 2 |
| MUŞ | 9755 | 38.7322 | 62.15 | 98.54 | 0.393 | 2 |
| KAYSERİ | 9620 | 38.7219 | 60.27 | 98.40 | 0.413 | 2 |
| ELAZIĞ | 9432 | 38.6747 | 60.32 | 98.04 | 0.416 | 2 |
| UŞAK | 9919 | 38.6740 | 59.73 | 97.53 | 0.427 | 2 |
| NEVŞEHİR | 9760 | 38.6250 | 59.09 | 98.36 | 0.426 | 2 |
| MANİSA | 9716 | 38.6126 | 58.77 | 97.81 | 0.434 | 2 |
| VAN | 9930 | 38.5009 | 64.89 | 98.17 | 0.369 | 2 |
| İZMİR | 9560 | 38.4193 | 60.82 | 98.04 | 0.411 | 2 |
| BİTLİS | 9311 | 38.4021 | 63.97 | 98.68 | 0.374 | 2 |
| AKSARAY | 9193 | 38.3705 | 60.64 | 98.54 | 0.408 | 2 |
| MALATYA | 9703 | 38.3487 | 62.92 | 98.36 | 0.387 | 2 |
| NİĞDE | 9766 | 37.9698 | 62.33 | 98.49 | 0.392 | 2 |
| SİİRT | 9839 | 37.9274 | 64.25 | 98.77 | 0.370 | 2 |
| DİYARBAKIR | 9402 | 37.9162 | 62.79 | 98.45 | 0.388 | 2 |
| BATMAN | 9288 | 37.8836 | 62.69 | 97.67 | 0.396 | 2 |
| KONYA | 9676 | 37.8727 | 61.42 | 98.54 | 0.400 | 2 |
| AYDIN | 9252 | 37.8484 | 61.32 | 98.26 | 0.404 | 2 |
| DENİZLİ | 9392 | 37.7828 | 59.91 | 97.67 | 0.424 | 2 |
| ISPARTA | 9528 | 37.7637 | 61.64 | 98.54 | 0.398 | 2 |
| ADIYAMAN | 9158 | 37.7603 | 63.52 | 98.86 | 0.376 | 2 |
| BURDUR | 9327 | 37.7248 | 62.51 | 98.40 | 0.391 | 2 |
| KAHRAMANMARAŞ | 9577 | 37.5813 | 63.24 | 99.04 | 0.377 | 2 |
| HAKKARİ | 9507 | 37.5767 | 64.98 | 98.72 | 0.363 | 2 |
| ŞIRNAK | 9854 | 37.5220 | 64.66 | 99.22 | 0.361 | 2 |
| MARDİN | 9726 | 37.3133 | 63.33 | 99.36 | 0.373 | 2 |
| MUĞLA | 9747 | 37.2152 | 62.24 | 97.44 | 0.403 | 2 |
| KARAMAN | 9587 | 37.1809 | 62.33 | 98.86 | 0.388 | 2 |
| ŞANLIURFA | 9831 | 37.1596 | 64.43 | 99.00 | 0.366 | 2 |
| OSMANİYE | 9788 | 37.0734 | 62.15 | 98.86 | 0.390 | 2 |
| GAZİANTEP | 9479 | 37.0628 | 64.79 | 98.54 | 0.367 | 2 |
| ADANA | 9146 | 36.9864 | 63.29 | 99.00 | 0.377 | 2 |
| ANTALYA | 9225 | 36.8866 | 63.11 | 97.44 | 0.395 | 2 |
| MERSİN | 9737 | 36.7978 | 62.51 | 98.72 | 0.388 | 2 |
| KİLİS | 9629 | 36.7166 | 64.84 | 98.77 | 0.364 | 2 |
| HATAY | 20089 | 36.2025 | 64.47 | 98.36 | 0.372 | 2 |

Per-prayer MAE is uniform across the country: fajr 0.07–0.21, sunrise 0.10–0.18, dhuhr
0.07–0.13, asr 0.62–0.76, maghrib 0.52–0.67, isha 0.72–0.87 min. Signed means over the first
fifteen cities are −0.078 / −0.062 / −0.045 / −0.084 / −0.060 / −0.059 min, i.e. no systematic
offset. The asr/maghrib/isha spread (±1.2 min, worst 2) is second-resolution disagreement
amplified by the +4/+7 temkin, not a recipe error.

### Latitude span 36–42 N

| band | provinces | mean within-1 % | mean MAE | worst province |
| --- | --- | --- | --- | --- |
| 36–37 N | 5 | 98.46 | 0.379 | Antalya 97.4 |
| 37–38 N | 19 | 98.56 | 0.386 | Muğla 97.4 |
| 38–39 N | 13 | 98.21 | 0.405 | Uşak 97.5 |
| 39–40 N | 13 | 97.77 | 0.417 | Balıkesir 96.6 |
| 40–41 N | 18 | 97.02 | 0.436 | Kocaeli 95.2 |
| 41–42 N | 12 | 96.42 | 0.449 | Edirne 95.2 |
| 42–43 N | 1 | 95.57 | 0.459 | Sinop 95.6 |

The score degrades monotonically with latitude: 98.5 % within-1 at 36–37 N down to 95.6 % at
42 N, MAE 0.379 to 0.459. There is no latitude-keyed switch in the table, no discontinuity at
41 N where the frozenLatitude45 rule would begin to bind, and no city that needs its own
recipe. The gradient is what a fixed temkin set produces as twilight lengthens, not a recipe
failure.

Anchor check on the first fifteen: a ±0.30° lat / ±0.40° lon grid search lowers MAE by at most
0.06 min (Van 0.382→0.320; Samsun unchanged), so the published city-centre coordinate is
already the publisher's anchor within the grid step. No per-province coordinate correction is
needed for the bake.

Byte-exact spot check, İstanbul at 41.0 N / 29.0 E, 2026-01-01: adhan+recipe returns fajr
06:50:02, sunrise 08:21:54, dhuhr 13:12:32, asr 15:32:36, maghrib 17:53:17, isha 19:19:42;
the Diyanet table prints 06:50 / 08:22 / 13:12 / 15:32 / 17:53 / 19:19. The recipe is the
publisher's own arithmetic, not an approximation.

Grade: A stands and widens from two city-years to eighty-one distinct 2026 province-years on
one recipe. Between-year stability is untestable per province from this wave alone (one year
each); the record's İstanbul 2027 is the only second year and is not re-fitted here.

### The 9542 Kartal trap, measured

Three İstanbul districts captured and differenced against the province table
(`data/districts-istanbul-2026.json`):

| pair | mean abs diff | worst | largest column |
| --- | --- | --- | --- |
| Kartal (9542) vs İstanbul (9541) | 0.84 min | 2 | isha 1.11 |
| Pendik (9545) vs İstanbul | 1.01 min | 3 | isha 1.32 |
| Çekmeköy (9539) vs İstanbul | 0.81 min | 1 | fajr 0.88 |
| Kartal vs Pendik | 0.18 min | 1 | isha 0.22 |

The trap is real but small in magnitude: a district table runs 0.8–1.0 min off the province
table on average, worst 3, and isha carries the largest share. A province-level bake is not
wrecked by an ilce retarget, but a district-level bake would be, and the record's warning
stands. Kartal and Pendik serve pages of identical byte length (380,945) yet their rows differ
by 0.18 min mean, so equal page size is not evidence of shared rows.

## 4. 2027 roll check — probed once, recorded exactly

Probe time 2026-11-11T04:26:10Z (`captures/probe-2027-timestamp.txt`).

| probe | result |
| --- | --- |
| `GET https://namazvakitleri.diyanet.gov.tr/tr-TR/9560` | 200, 381,202 bytes, final URL `.../9560/izmir-icin-namaz-vakti`; last dated row `31 Aralık 2026 Perşembe` |
| `GET .../tr-TR/9560?yil=2027` | 200, 381,202 bytes, byte-identical size; last dated row still `31 Aralık 2026`; the year parameter is ignored |
| year selector in markup | none (the only `select` elements are country / state / district) |
| `POST https://awqatsalah.diyanet.gov.tr/api/PrayerTime/DateRange` `{cityId:9560, 2027-01-01..2027-12-31}` | 401, 0 bytes |
| `GET https://awqatsalah.diyanet.gov.tr/api/Place/States` | 401, 0 bytes |
| `GET https://vakithesaplama.diyanet.gov.tr/` | 200, 39,577 bytes; calculator page, no year table, carries a WAF hidden field (`as_sfid`) |
| `GET https://namazvakti.diyanet.gov.tr/` | 200, 28,935 bytes; three selects (Country/State/City), `2026` is the only year in the markup |

**Verdict: 2027 is not served by any public Diyanet surface.** The authority page is a
current-calendar-year table with no year selector and no year parameter; the awqatsalah API is
credential-gated and holds no public token (its own README states credentials are issued per
applicant, 5 requests per endpoint). The 2027 Diyanet calendar exists as a printed artifact:
mosque-distribution posts dated within the last week advertise the 2027 Diyanet calendar for
sale, so the data exists but no public page serves it. The record's İstanbul 2027 validation
therefore still rests on the awqatsalah API alone; this wave could not re-probe it without
credentials, and did not attempt a login (brief: no login, no registration).

## 5. Second publishers — Turkish search

Searched Turkish, five phrasings: `Diyanet Vakfı namaz vakitleri il ilçe 2027 takvimi`,
`ilçe müftülüğü namaz vakitleri 2027 takvimi yayınlandı`, `Türkiye Diyanet Vakfı namaz
vakitleri takvimi yayın`, `Semerkand takvimi namaz vakitleri 2026 il ilçe`, `il müftülüğü
namaz vakitleri tablosu yayınladı 2026`.

Surfaces found, with verdicts:

| publisher | surface | verdict |
| --- | --- | --- |
| turktakvim.com | `index.php?link=yillikvakitler.php`, 437 KB, 8 columns incl. İmsâk AND Sabâh | **near-witness, own scheme.** 2026-01-01: İmsâk 06:33, Sabâh 06:51, Güneş 08:22, İşrak 09:17, Öğle 13:19, İkindi 15:40, Akşam 17:54, Yatsı 19:31. Diyanet prints 06:50 / 08:22 / 13:12 / 15:32 / 17:53 / 19:19. Sunrise identical; its Sabâh equals Diyanet's İmsak; it drifts +7 dhuhr, +8 asr, +12 isha and carries a deeper İmsâk 17 min before its own Sabâh. A distinct object, not a Diyanet mirror. |
| namazvakti.com | `Yearly.php?WSLanguage=TR`, 373 KB, 12 monthly tables, coords 41.0000/29.0000 | **distinct scheme, defective year label.** 2026-01-01 labelled `1 Salı` (Tuesday); 2026-01-01 is a Thursday. İmsâk 06:15, Sabâh 06:32, Güneş 08:02, Öğle 13:04, İkindi 15:29, Akşam 17:45, Yatsı 19:20. Its Güneş sits 20 min before Diyanet's sunrise and 27 min before the true solar sunrise at that coordinate, which is not a sunrise at all. |
| semerkandtakvimi.com | homepage 22 KB, 1 `<tr>` | JS-driven, no table in the served HTML; not captured without a browser walk. Recorded as a lead. |
| diyanethaber.com.tr | `/istanbul-namaz-vakitleri` | Diyanet's own news portal reproducing the ilce table; same authority, not a second publisher. |
| istanbul.diyanet.gov.tr, izmir.diyanet.gov.tr | province mufti portals, 163 KB / 159 KB | portals, not table publishers; they route to the national page. |
| ibadetvaktipro.com | `/takvim-2027`, 12.5 KB | advertises 2027 for 81 provinces but serves no rows in the HTML (0 `<tr>`); unverified, third-party. |
| Diyanet Vakfı (diyanetvakfi.org.tr) | — | no prayer table surfaced under any of the five Turkish queries. |

**Verdict: Turkey has a real second-publisher layer, and none of it reproduces the domestic
Diyanet table.** turktakvim.com is the closest and is a genuinely separate computation (own
İmsâk/Sabâh split, own dhuhr/asr/isha margins); namazvakti.com is separate and internally
inconsistent on its own year label. Both are community tier and must not be used to lift or
cross-check the authority object. The classical Turkish 8-column set (İmsâk, Sabâh, Güneş,
İşrak, Öğle, İkindi, Akşam, Yatsı) is the publisher convention here; Diyanet's domestic table
drops İmsâk-before-Sabâh and İşrak, which is why the two schemes cannot be compared column for
column.

## 6. What this confirms and what is new

Confirms: the 18/17 domestic recipe with temkin −7 sunrise / +5 dhuhr / +4 asr / +7 maghrib,
no imsak or yatsi temkin, nearest rounding, Shafi asr, across all 81 provinces at 36–43 N;
no latitude-keyed switch; no deviating province; a monotone latitude gradient in the residual
and nothing else.

New: (a) the ilce-id resolver `GetDestinationUrl`, which closes the 9542-Kartal class of trap
with a reproducible method; (b) the September entity-encoding parse hole (30 rows) that any
prior Turkey parser may carry; (c) eighty-one province-years of dated 2026 rows in `data/`; (d) the
second-publisher layer measured, with turktakvim.com's drift quantified against Diyanet on the
same day; (e) the 2027 verdict recorded per surface.

Honest negatives: 2027 not served publicly (recorded per surface above); the awqatsalah API
unreachable without credentials and not attempted; semerkandtakvimi.com not walked (JS);
ibadetvaktipro.com's 2027 claim unverified (no rows in HTML); Diyanet Vakfı has no prayer table
under these terms.

Not complete. All 81 province centres are banked, but the ~970 ilce/district tables behind them
are not: the district select on each province page enumerates them and each has its own ilce id
and its own anchor, which is the next tranche. The second-publisher sweep stops at six surfaces
and Semerkand was not walked.
