# UAE emirate layer — fit run
rows: 35880 from captures/federal-2026-01-01_2026-05-31.json, captures/federal-2026-06-01_2026-10-31.json, captures/federal-2026-10-12.json, captures/federal-2026-11-11_2027-05-31.json
dates: 2026-01-01 .. 2027-05-31  areas: 60

## Whole country, record recipe (0/-3/+2/0/+2/-1)
| scope | rows | exact | within1 | MAE |
|---|---|---|---|---|
| all 60 areas | 35880 | 62.0% | 93.9% | 0.464 |

## Per emirate, the same record recipe
| emirate | areas | rows | exact | within1 | MAE | per-prayer bias (min) |
|---|---|---|---|---|---|---|
| Abu Dhabi | 31 | 18538 | 61.8% | 94.0% | 0.454 | fajr 0.16, sunrise 0.48, dhuhr -0.00, asr 0.11, maghrib 0.26, isha 0.06 |
| Dubai | 3 | 1794 | 55.9% | 93.6% | 0.505 | fajr 0.33, sunrise -0.26, dhuhr 0.12, asr 0.23, maghrib 1.20, isha 0.11 |
| Sharjah | 8 | 4784 | 64.1% | 95.3% | 0.406 | fajr 0.65, sunrise 0.59, dhuhr -0.01, asr 0.10, maghrib 0.62, isha 0.05 |
| Ajman | 3 | 1794 | 62.8% | 94.8% | 0.427 | fajr 0.69, sunrise 0.19, dhuhr -0.01, asr 0.09, maghrib 1.04, isha 0.04 |
| Umm Al Quwain | 1 | 598 | 83.2% | 100.0% | 0.168 | fajr -0.05, sunrise -0.02, dhuhr -0.00, asr 0.11, maghrib 0.52, isha 0.02 |
| Ras Al Khaimah | 7 | 4186 | 59.0% | 89.7% | 0.655 | fajr 0.64, sunrise -0.51, dhuhr -0.00, asr 0.09, maghrib 1.72, isha 0.04 |
| Fujairah | 7 | 4186 | 62.8% | 95.0% | 0.423 | fajr 0.56, sunrise 0.11, dhuhr -0.00, asr 0.10, maghrib 1.00, isha 0.05 |

## Per-area residual constants vs raw 18.2/18.2 (mean obs - raw, minutes)
| emirate | area | rows | fajr | sunrise | dhuhr | asr | maghrib | isha |
|---|---|---|---|---|---|---|---|
| Abu Dhabi | Abu Dhabi | 598 | -0.47 | -3.41 | 1.99 | 0.08 | 2.52 | -0.94 |
| Abu Dhabi | Al Ain | 598 | -1.26 | -5.22 | 2.00 | 0.13 | 2.83 | -0.95 |
| Abu Dhabi | Ghagha-Qaffay | 598 | -0.04 | -2.11 | 1.99 | 0.12 | 1.68 | -0.94 |
| Abu Dhabi | Dalma Island | 598 | 0.94 | -1.62 | 2.00 | 0.08 | 2.09 | -0.94 |
| Abu Dhabi | Arzanah-Island | 598 | 0.94 | -1.34 | 2.00 | 0.09 | 1.80 | -0.93 |
| Abu Dhabi | DasIsland | 598 | 0.95 | -1.14 | 2.00 | 0.07 | 1.67 | -0.94 |
| Abu Dhabi | Zarkuh | 598 | 0.95 | -1.84 | 2.00 | 0.12 | 2.33 | -0.94 |
| Abu Dhabi | Mukhariz | 598 | 0.92 | -1.81 | 2.00 | 0.11 | 2.30 | -0.95 |
| Abu Dhabi | Belhasa | 598 | 0.93 | -1.84 | 2.00 | 0.11 | 2.32 | -0.93 |
| Abu Dhabi | Um-Al-Zamool | 598 | 0.90 | -1.60 | 2.00 | 0.13 | 2.11 | -0.89 |
| Abu Dhabi | Liwa | 598 | 0.93 | -2.10 | 2.00 | 0.15 | 3.61 | -0.95 |
| Abu Dhabi | Ghayathi-Bida-Al-Mutawa | 598 | -1.02 | -3.28 | 2.00 | 0.12 | 1.80 | -0.94 |
| Abu Dhabi | AlSila-Al Ghuwaifat | 598 | 0.36 | -1.73 | 1.99 | 0.09 | 1.59 | -0.97 |
| Abu Dhabi | Al Mirfa | 598 | -1.05 | -2.90 | 1.99 | 0.14 | 1.42 | -0.95 |
| Abu Dhabi | Jebel Hafeet Summit | 598 | 0.93 | -5.18 | 1.99 | 0.10 | 5.74 | -0.92 |
| Abu Dhabi | alwaqn alqawe | 598 | -0.05 | -2.98 | 2.00 | 0.16 | 2.49 | -0.93 |
| Abu Dhabi | alzzahira aleirad | 598 | -1.03 | -3.78 | 2.00 | 0.09 | 2.32 | -0.95 |
| Abu Dhabi | al faqa alshawib | 598 | 0.56 | -3.23 | 2.00 | 0.08 | 3.35 | -0.94 |
| Abu Dhabi | al khazna alssad | 598 | -1.02 | -4.19 | 1.99 | 0.08 | 2.74 | -0.94 |
| Abu Dhabi | Razin | 598 | 0.92 | -1.68 | 2.00 | 0.15 | 2.18 | -0.94 |
| Abu Dhabi | Jazirat Abu al Abyadh | 598 | -1.05 | -2.90 | 1.99 | 0.14 | 1.42 | -0.95 |
| Abu Dhabi | Al noof | 598 | 0.91 | -1.16 | 1.99 | 0.11 | 1.64 | -0.95 |
| Abu Dhabi | Al Khatam | 598 | -1.02 | -4.19 | 1.99 | 0.08 | 2.74 | -0.94 |
| Abu Dhabi | Al Bahia Gantoot | 598 | 0.16 | -1.93 | 2.00 | 0.08 | 1.61 | -0.95 |
| Abu Dhabi | Madinat Zayed | 598 | -0.05 | -2.81 | 2.00 | 0.09 | 2.34 | -0.94 |
| Abu Dhabi | Al-Hamra-Barakah | 598 | -0.05 | -1.88 | 2.00 | 0.13 | 1.41 | -0.93 |
| Abu Dhabi | AL Ruwais - Shuweihat | 598 | 0.15 | -2.62 | 1.99 | 0.11 | 2.28 | -0.95 |
| Abu Dhabi | Island Border Guard | 598 | 0.93 | -1.12 | 2.00 | 0.12 | 1.60 | -0.94 |
| Abu Dhabi | Esab | 598 | 0.91 | -1.62 | 1.99 | 0.12 | 2.12 | -0.94 |
| Abu Dhabi | alssahil | 598 | 0.92 | -1.49 | 1.99 | 0.10 | 2.01 | -0.92 |
| Abu Dhabi | Al Hayer Sweihan | 598 | -1.02 | -3.51 | 1.99 | 0.15 | 2.08 | -0.93 |
| Dubai | Dubai | 598 | -0.58 | -3.60 | 2.12 | 0.22 | 2.59 | -0.87 |
| Dubai | Rural Area dubai | 598 | 0.56 | -3.17 | 2.12 | 0.23 | 3.39 | -0.89 |
| Dubai | Hatta | 598 | 1.00 | -2.99 | 2.12 | 0.24 | 3.62 | -0.89 |
| Sharjah | Sharjah | 598 | -0.22 | -3.23 | 1.99 | 0.11 | 2.55 | -0.95 |
| Sharjah | Sharjah Al Dhaid | 598 | 0.56 | -2.54 | 1.99 | 0.10 | 2.65 | -0.94 |
| Sharjah | Sharjah al madam -Maliha | 598 | 0.15 | -3.04 | 2.00 | 0.08 | 2.78 | -0.95 |
| Sharjah | Sharjah alssahil alsharqiu | 598 | 0.94 | -2.05 | 2.00 | 0.11 | 2.53 | -0.95 |
| Sharjah | nahwat wadi shays | 598 | 0.94 | -2.92 | 1.99 | 0.11 | 3.43 | -0.96 |
| Sharjah | Sharjah Wadi Al Hulu | 598 | 0.96 | -2.90 | 1.99 | 0.10 | 3.37 | -0.96 |
| Sharjah | Sharjah Sir Bu Nair | 598 | 0.95 | -1.32 | 1.99 | 0.10 | 1.82 | -0.95 |
| Sharjah | SharjahAbu Musa | 598 | 0.95 | -1.31 | 1.99 | 0.09 | 1.80 | -0.97 |
| Ajman | Ajman | 598 | 0.19 | -2.82 | 1.99 | 0.07 | 2.52 | -0.98 |
| Ajman | Ajman Masfoot | 598 | 0.94 | -3.48 | 2.00 | 0.12 | 3.96 | -0.95 |
| Ajman | Ajman Al Manama | 598 | 0.94 | -2.15 | 1.99 | 0.09 | 2.63 | -0.96 |
| Umm Al Quwain | Um Al Quwain | 598 | -0.05 | -3.02 | 2.00 | 0.11 | 2.52 | -0.98 |
| Ras Al Khaimah | Ras AlKhaimah | 598 | -0.03 | -3.02 | 2.00 | 0.07 | 2.56 | -0.95 |
| Ras Al Khaimah | Ras AlKhaimah Shaam Ghalilah | 598 | 0.97 | -2.44 | 2.00 | 0.10 | 2.94 | -0.96 |
| Ras Al Khaimah | Ras Alkhaimah Adhan Asimahg | 598 | 0.37 | -4.08 | 2.00 | 0.08 | 4.02 | -0.95 |
| Ras Al Khaimah | Ras Alkhaimah Masafi Shawka | 598 | 0.33 | -3.68 | 1.99 | 0.11 | 3.57 | -0.97 |
| Ras Al Khaimah | Ras AlKhaimah Munay | 598 | 0.97 | -2.63 | 2.00 | 0.08 | 3.15 | -0.94 |
| Ras Al Khaimah | Ras AlKhaimah Jebel Jais | 598 | 0.95 | -7.20 | 2.00 | 0.08 | 7.71 | -0.97 |
| Ras Al Khaimah | Ras AlKhaimah Tonb Al-Kubra | 598 | 0.96 | -1.52 | 1.99 | 0.12 | 2.07 | -0.97 |
| Fujairah | Fujairah | 598 | 0.36 | -2.72 | 2.00 | 0.14 | 2.69 | -0.96 |
| Fujairah | Fujairah Dibba Al-Bidyah | 598 | 0.94 | -2.05 | 2.00 | 0.11 | 2.53 | -0.95 |
| Fujairah | Fujairah  Al Tayiba | 598 | 0.37 | -4.08 | 2.00 | 0.08 | 4.02 | -0.95 |
| Fujairah | Fujairah Masafi Seiji | 598 | 0.33 | -3.68 | 1.99 | 0.11 | 3.57 | -0.97 |
| Fujairah | Fujairah habhab | 598 | -0.03 | -3.02 | 2.00 | 0.07 | 2.56 | -0.95 |
| Fujairah | Fujairah Al Tawiyan | 598 | 0.97 | -1.88 | 1.99 | 0.10 | 2.35 | -0.95 |
| Fujairah | Fujairah Wadi Saham | 598 | 0.98 | -2.78 | 2.00 | 0.12 | 3.28 | -0.95 |

## DUBAI: the asr question (cityID 32 Dubai city + 59 Rural Dubai + 60 Hatta, 1794 rows)
| recipe | exact | within1 | MAE |
|---|---|---|---|
| record (fajr 0, sunrise -3, dhuhr +2, asr 0, maghrib +2, isha -1) | 55.9% | 93.6% | 0.505 |
| adhan 4.4.6 preset Dubai (0, -3, +3, +3, +3, 0) | 28.8% | 81.2% | 1.029 |

Per prayer, preset vs the authority's own rows:
| prayer | preset bias (min) | preset exact % | preset worst | record bias | record exact % |
|---|---|---|---|---|---|
| fajr | 0.33 | 33.2% | 2 | 0.33 | 33.2% |
| sunrise | -0.26 | 55.8% | -1 | -0.26 | 55.8% |
| dhuhr | -0.88 | 12.2% | -2 | 0.12 | 87.4% |
| asr | -2.77 | 0.0% | -4 | 0.23 | 72.1% |
| maghrib | 0.20 | 52.6% | 1 | 1.20 | 13.7% |
| isha | -0.89 | 19.2% | -2 | 0.11 | 73.0% |

Asr residual histogram (authority - adhan Dubai preset): -4:45 -3:1294 -2:455
Dhuhr residual histogram (authority - adhan Dubai preset): -2:8 -1:1568 0:218
