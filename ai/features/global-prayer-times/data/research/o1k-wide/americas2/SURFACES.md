# O1k americas2 — surface index

23 normalised row files, 7,670 dated rows. Report: `REPORT.md`. Raw captures: `captures/`.

## Feeds captured, by country

| Country | Surface | File | Rows |
|---|---|---|---|
| USA | Islamic Center of Greater Toledo (dpt, 2025) | `data/rows_us_icgt_toledo.json` | 365 |
| USA | Muslim Center of San Antonio (dpt, 2026) | `data/rows_us_mcsamasjid_san_antonio.json` | 365 |
| USA | Memphis Islamic Center (Masjidal) | `data/rows_us_memphis_islamic_center.json` | 365 |
| USA | Richmond Islamic Community Center TX (Masjidal) | `data/rows_us_richmond_iccc_tx.json` | 365 |
| USA | Islamic Center of South Bay, Lomita CA (Masjidal) | `data/rows_us_icsouthbay_lomita_ca.json` | 365 |
| USA | MAS Tarbiyah Center, Livonia MI (Masjidal) | `data/rows_us_mas_tarbiyah_livonia_mi.json` | 365 |
| USA | Jamaica Muslim Center, Queens NY (Masjidal) | `data/rows_us_jamaica_muslim_center_queens_ny.json` | 365 |
| USA | Ethiopian Muslim Association, SeaTac WA (Masjidal) | `data/rows_us_ema_seatac_wa.json` | 365 |
| USA | Islamic Center of Tennessee, Antioch TN (Masjidal) | `data/rows_us_islamic_center_of_tennessee.json` | 365 |
| USA | Islamic Association of North Texas (record, re-captured 3 years) | `data/rows_us_iant_richardson_tx.json` | 365 |
| Canada | Kitchener Masjid (dpt) | `data/rows_ca_kitchener_masjid.json` | 365 |
| Canada | Bilal Centre, Winnipeg (dpt) | `data/rows_ca_bilal_centre_winnipeg.json` | 365 |
| Canada | Manitoba Islamic Association (dpt) | `data/rows_ca_mia_winnipeg.json` | 334 |
| Canada | Ummah Masjid, Halifax (dpt, 2025) | `data/rows_ca_ummah_masjid_halifax.json` | 365 |
| Canada | CCIQ, Quebec City (mawaqit) | `data/rows_ca_cciq_quebec_city.json` | 365 |
| Canada | Mosquée de la Capitale, Quebec City (mawaqit) | `data/rows_ca_mosquee_de_la_capitale_quebec.json` | 365 |
| Canada | Markaz Ul Islam, Edmonton (Masjidal) | `data/rows_ca_markaz_ul_islam_edmonton.json` | 365 |
| Canada | Masjid At-Taqwa, Edmonton (Masjidal) | `data/rows_ca_masjid_ataqwa_edmonton.json` | 365 |
| Canada | Masjid Al-Fatima, Edmonton (Masjidal) | `data/rows_ca_masjid_alfatima_edmonton.json` | 365 |
| Mexico | Mezquita de Guadalajara Isa Ibn Maryam (Masjidbox) | `data/rows_mx_guadalajara_isa_ibn_maryam.json` | 7 |
| Guatemala | Mezquita Aldaawa, Guatemala City (mawaqit) | `data/rows_gt_aldaawa_guatemala_city.json` | 365 |
| Honduras | Centro Islámico de Honduras, San Pedro Sula (mawaqit) | `data/rows_hn_centro_islamico_san_pedro_sula.json` | 365 |
| Suriname | Surinaamse Moeslim Associatie, Paramaribo (JPG, transcribed) | `data/rows_sr_sma_paramaribo_2025.json` | 29 |
| Venezuela | Mezquita de Caracas (monthly PDF) | `data/ve_caracas_mezquita_2026-10-12_2026-11-10.json` | 30 |

Masjidal and mawaqit captures keep their full shape (iqamah, hijri, imsak/iftar) in
`data/masjidal_<id>_<year>.json`, `data/gt_aldaawa_2026.json`, `data/hn_sps_centro_islamico_2026.json`
and `data/ca_*_quebec_2026.json`.

## Probe logs

| File | Contents |
|---|---|
| `probes/us2.tsv` | 176 US candidate domains, wave 1 |
| `probes/us3.tsv` | 28 search-confirmed US domains, wave 2 |
| `probes/ca2.tsv` | 25 Canadian candidate domains |
| `probes/masjidal_capture.log` | 31 Masjidal capture spans |
| `probes/cl_nov_files.txt` | the 18 Chile November buttons as published |

## Scripts

| File | Purpose |
|---|---|
| `probes/probe.zsh` | the dpt probe, with the homepage signal on every miss |
| `probes/masjidal_capture.zsh` | Masjidal whole-year capture with `from_date`/`to_date` |
| `probes/masjidbox_extract.py` | inline Masjidbox payload to rows |
| `probes/mawaqit_year.py` | 12-month `confData` calendar to rows |
| `probes/parse_ve_caracas.py` | the Caracas PDF |
| `probes/fit_rows.js` | angle fit, one column at a time, three high-latitude rules |
| `probes/masjidal_analyze.js` | per-month column offsets and the shift runs |
