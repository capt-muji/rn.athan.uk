# Capital coverage matrix — city-level round two (O1l-38)

Built 2026-11-11 from `census-index.db` (1,547 surfaces), the coordinate ledger, and a
filesystem sweep of every `data/` table in `$HOME/athan-gitree/census` (21,137 candidate files).
One row per capital, ordered by capital population. A capital is COVERED only where a held
surface names it (or names the country and is computed at it) and carries dated rows; the
row count is distinct dates found in the file. GAP states the reason and the terms searched.

**142 covered, 60 gap, 202 capitals on the list.**

| # | Country | Capital | Pop (M) | Status | Surface | Rows | Span | Tier |
|---|---|---|---|---|---|---|---|---|
| 1 | China | Beijing | 21.50 | COVERED | islamichina_beijing_2026.json (islamichina Beijing, 365 dated rows, calculator widget) | 365 | 2026-01-01..2026-12-31 | platform |
| 2 | DR Congo | Kinshasa | 15.60 | GAP | not found under these terms: only Goma held; the capital Kinshasa has no surface |  |  |  |
| 3 | Japan | Tokyo | 14.00 | COVERED | mawaqit-makki-masjid-tokyo.json [o1l-city/o1l-24/data/mawaqit-makki-masjid-tokyo.json] | 366 | 2026-01-01..2026-12-31 | community |
| 4 | Russia | Moscow | 13.00 | COVERED | ru-cdum-moskva-2026-restability.json [o1k-wide/centralasia/data/ru-cdum-moskva-2026-restability.json] | 365 | 2026-01-01..2026-12-31 | community |
| 5 | Indonesia | Jakarta | 10.60 | COVERED | khgt-2027-jakarta-pusat.json [o1l-city/indonesia-cities/data/khgt-2027-jakarta-pusat.json] | 365 | 2027-01-01..2027-12-31 | authority |
| 6 | Thailand | Bangkok | 10.50 | COVERED | th-cicot-bangkok-2569-leap.json [o1l-city/thailand-provinces/data/th-cicot-bangkok-2569-leap.json] | 366 | 2028-01-01..2028-12-31 | authority |
| 7 | Bangladesh | Dhaka | 10.20 | COVERED | uttara-7no-sector-jame-masjid-society-uttara-dhaka-1230-bangladesh.json [o1l-city/o1l-13r/data/uttara-7no-sector-jame-masjid-society-uttara-dhaka-1230-bangladesh.json] | 365 | 2026-01-01..2026-12-31 | community |
| 8 | Peru | Lima | 9.70 | COVERED | pe_lima_mawaqit_2026.json (Lima mawaqit conf) | 365 | 2026-01-01..2026-12-31 | community |
| 9 | Egypt | Cairo | 9.60 | COVERED | eg-esa-cairo-2026-11.json | 365 | 2026-01-01..2026-12-31 | authority |
| 10 | South Korea | Seoul | 9.40 | COVERED | mawaqit-masjid-noor-seoul-seoul-05000-south-korea.json [o1l-city/o1l-24/data/mawaqit-masjid-noor-seoul-seoul-05000-south-korea.json] | 366 | 2026-01-01..2026-12-31 | community |
| 11 | Mexico | Mexico City | 9.20 | GAP | not found under these terms: search page only, no dated rows |  |  |  |
| 12 | Iran | Tehran | 9.00 | GAP | not found under these terms: no dated table captured |  |  |  |
| 13 | United Kingdom | London | 9.00 | COVERED | london-central-mosque-icc-2026-11-12.json | 366 | 2026-01-01..2026-12-31 | authority |
| 14 | Vietnam | Hanoi | 8.40 | COVERED | vietnam_al-noor_hanoi.json [c8-easia/data/vietnam_al-noor_hanoi.json] | 30 | 2026-11-01..2026-11-30 | community |
| 15 | Angola | Luanda | 8.30 | COVERED | luanda.json [c15-jamiat/data/Angola/luanda.json] | 30 | 2026-11 | community |
| 16 | Colombia | Bogota | 7.70 | GAP | not found under these terms: only Cartagena held |  |  |  |
| 17 | Saudi Arabia | Riyadh | 7.70 | COVERED | sa-riyadh-rows.json [o1l-city/mideast-cities/data/sa-riyadh-rows.json] | 709 | 2026-06-16..2028-05-24 | authority |
| 18 | Iraq | Baghdad | 7.50 | COVERED | iq-baghdad-2026.json [o1l-city/mideast-cities/data/iq-baghdad-2026.json] | 365 | 2026-01-01..2026-12-31 | community |
| 19 | Chile | Santiago | 6.30 | COVERED | chile-santiago-mezquita-as-salam.json [c7-latam/data/chile-santiago-mezquita-as-salam.json] | 30 | 2026-11-01..2026-11-30 | community |
| 20 | Sudan | Khartoum | 6.00 | COVERED | sudan_khartoum_1447_state.json [c13-corrob/data/sudan_khartoum_1447_state.json] | 30 | 2026-02-18..2026-03-19 | community |
| 21 | Singapore | Singapore | 5.90 | COVERED | sg-muis-2027.json (MUIS Singapore) | 365 | 2027-01-01..2027-12-31 | authority |
| 22 | Turkiye | Ankara | 5.70 | COVERED | tr-diyanet-ankara-2026.json | 365 | 2026-01-01..2026-12-31 | authority |
| 23 | Ethiopia | Addis Ababa | 5.20 | GAP | not found under these terms: settings page only |  |  |  |
| 24 | Afghanistan | Kabul | 4.60 | COVERED | af-kabul-mohia-burj-1405-full.json [c30-afghan/data/af-kabul-mohia-burj-1405-full.json] | 366 | 2026-03-20..2027-03-20 | authority |
| 25 | Kenya | Nairobi | 4.40 | COVERED | Ramadhan-Timetable-1447-2026.pdf (Jamia Mosque Nairobi, held raw) |  | Ramadan 1447 PDF, not normalised | clerical |
| 26 | Jordan | Amman | 4.00 | COVERED | jo-awqaf-grid-2026-11-10.json (Awqaf grid) | 10 | 2026-11-10..2026-11-19 | authority |
| 27 | Germany | Berlin | 3.70 | COVERED | de-diyanet-berlin-2026.json [o1k-wide/europe/data/de-diyanet-berlin-2026.json] | 365 | 2026-01-01..2026-12-31 | platform |
| 28 | Nigeria | Abuja | 3.60 | COVERED | timetable-nigeria-air-force-base-central-mosque-abuja-900107-nigeria.json [c1-wafrica/data/timetable-nigeria-air-force-base-central-mosque-abuja-900107-nigeria.json] | 366 | 2026-11-10..2027-12-31 | community |
| 29 | Spain | Madrid | 3.30 | COVERED | es-madrid-2026.json [o1k-wide/iberia2/data/es-madrid-2026.json] | 334 | 2026-01-01..2026-11-30 | community |
| 30 | Argentina | Buenos Aires | 3.10 | COVERED | mawaqit.net/en/haazimi-musallah-buenos-aires-c1214 (captured this wave, gate 2026-11-11) | 365 | 2026-01-01..2026-12-31 | community |
| 31 | Brazil | Brasilia | 3.00 | GAP | not found under these terms: no surface with dated rows (IIB Brasilia page is a calculator) |  |  |  |
| 32 | Kuwait | Kuwait City | 3.00 | COVERED | kw-kuwait-city-2026.json [o1l-city/mideast-cities/data/kw-kuwait-city-2026.json] | 365 | 2026-01-01..2026-12-31 | community |
| 33 | North Korea | Pyongyang | 3.00 | GAP | not found under these terms: no surface |  |  |  |
| 34 | Yemen | Sanaa | 3.00 | COVERED | ye-sanaa-31-locations-nov2026.json (Sanaa, 31 locations) | 9 | 2026-11-01..2026-11-10 | authority |
| 35 | Zambia | Lusaka | 3.00 | COVERED | lusaka.json [c15-jamiat/data/Zambia/lusaka.json] | 30 | 2026-11 | community |
| 36 | Algeria | Algiers | 2.90 | GAP | not found under these terms: 30-day MARW window held |  |  |  |
| 37 | Ukraine | Kyiv | 2.90 | COVERED | ua_kiev_solar_deltas.json [c16-fits/data/ua_kiev_solar_deltas.json] | 365 | 2026-01-01..2026-12-31 | authority |
| 38 | Uzbekistan | Tashkent | 2.90 | COVERED | uz-islom.uz-toshkent-2026-11.json [o1k-wide/centralasia/data/uz-islom.uz-toshkent-2026-11.json] | 30 | 2026-11-01..2026-11-30 | authority |
| 39 | Cameroon | Yaounde | 2.80 | COVERED | mawaqit.net/en/mosquee-hlm-waounde (captured this wave, gate 2026-10-29) | 365 | 2026-01-01..2026-12-31 | community |
| 40 | Italy | Rome | 2.80 | COVERED | au-11287-roma-2026.json [o1l-city/o1l-19r/data/diyanet/au-11287-roma-2026.json] | 365 | 2026-01-01..2026-12-31 | platform |
| 41 | Mali | Bamako | 2.70 | COVERED | mali-bamako-omar-ibn-kattab-mawaqit-2026.json [o1k-wide/sahel2/data/mali-bamako-omar-ibn-kattab-mawaqit-2026.json] | 365 | 2026-01-01..2026-12-31 | community |
| 42 | Ghana | Accra | 2.60 | COVERED | timetable-masjid-al-firdaws-accra-233-ghana.json [c1-wafrica/data/timetable-masjid-al-firdaws-accra-233-ghana.json] | 366 | 2026-11-10..2027-12-31 | community |
| 43 | Somalia | Mogadishu | 2.60 | COVERED | somalia-mawaqit-masjidka-cali-jimcaale-mogadishu.json [o1k-wide/horneast2/data/somalia-mawaqit-masjidka-cali-jimcaale-mogadishu.json] | 366 | 2026-01-01..2026-12-31 | community |
| 44 | Taiwan | Taipei | 2.60 | COVERED | taiwan-taipei_cma-ramadan-1446_sample.json [o1k-wide/china/data/taiwan-taipei_cma-ramadan-1446_sample.json] | 44 | table held (non-ISO layout) | community |
| 45 | South Africa | Pretoria | 2.50 | COVERED | pretoria.json [c15-jamiat/data/South Africa/pretoria.json] | 30 | 2026-11 | community |
| 46 | Syria | Damascus | 2.50 | COVERED | mawaqit.net/en/anwar-akkad-mosque-damascus-00963-syria (captured this wave, gate 2026-11-11) | 365 | 2026-01-01..2026-12-31 | community |
| 47 | Burkina Faso | Ouagadougou | 2.40 | COVERED | bf-an-nour-yamtenga-ouaga.json (Ouagadougou) | 365 | 2026-01-01..2026-12-31 | community |
| 48 | Lebanon | Beirut | 2.40 | COVERED | mohammad-al-amin-beirut.json (Beirut) | 1 | 2026-11-10..2026-11-10 | community |
| 49 | Azerbaijan | Baku | 2.30 | COVERED | baku-sehidler.json [c10-caucasus/data/baku-sehidler.json] | 365 | 2026-01-01..2026-12-31 | community |
| 50 | Cambodia | Phnom Penh | 2.30 | COVERED | cambodia_al-serkal_phnom-penh.json [c8-easia/data/cambodia_al-serkal_phnom-penh.json] | 30 | 2026-11-01..2026-11-30 | community |
| 51 | Congo | Brazzaville | 2.30 | COVERED | mawaqit-houriya-brazzaville-99324-congo-brazzaville.json [o1l-city/O1l-33/data/mawaqit-houriya-brazzaville-99324-congo-brazzaville.json] | 365 | 2026-01-01..2026-12-31 | community |
| 52 | Venezuela | Caracas | 2.20 | COVERED | ve_caracas_mezquita_2026-10-12_2026-11-10.json (Caracas) | 30 | 2026-10-12..2026-11-10 | community |
| 53 | Cuba | Havana | 2.10 | COVERED | mawaqit_havana_abdallah.json [o1l-city/O1l-30/data/mawaqit_havana_abdallah.json] | 365 | 2026-01-01..2026-12-31 | community |
| 54 | France | Paris | 2.10 | COVERED | fr-gmp-paris-2026-11.json [o1k-wide/benelux2/data/fr-gmp-paris-2026-11.json] | 30 | 2026-11-01..2026-11-30 | community |
| 55 | Austria | Vienna | 2.00 | COVERED | at-izw-wien-xlsx-2025.json [o1k-wide/europe/data/at-izw-wien-xlsx-2025.json] | 365 | 2025-01-01..2025-12-31 | community |
| 56 | Belarus | Minsk | 2.00 | COVERED | by-islambel-minsk-2025.json [o1k-wide/nordics2/data/by-islambel-minsk-2025.json] | 365 | 2025-01-01..2025-12-31 | community |
| 57 | Guinea | Conakry | 2.00 | COVERED | guinea-nono-grande-mosquee-mawaqit-2026.json (Conakry) | 365 | 2026-01-01..2026-12-31 | community |
| 58 | Ecuador | Quito | 1.90 | COVERED | ec_quito_mawaqit_2026.json (Quito mawaqit conf) | 365 | 2026-01-01..2026-12-31 | community |
| 59 | Morocco | Rabat | 1.90 | COVERED | ma-habous-rabat-2026-10.json [o1k-wide/mideast/data/ma-habous-rabat-2026-10.json] | 31 | 2026-10-01..2026-10-31 | authority |
| 60 | Panama | Panama City | 1.90 | COVERED | mawaqit_panama_madina.json [o1l-city/O1l-30/data/mawaqit_panama_madina.json] | 365 | 2026-01-01..2026-12-31 | community |
| 61 | Togo | Lome | 1.90 | COVERED | timetable-mosquee-de-zossime-lome-1896-togo.json [c1-wafrica/data/timetable-mosquee-de-zossime-lome-1896-togo.json] | 366 | 2026-11-10..2027-12-31 | community |
| 62 | Malaysia | Kuala Lumpur | 1.80 | COVERED | my-jakim-2026-all-zones.json (JAKIM zone WLY01, Kuala Lumpur) | 366 | 2026-01-01..2026-12-31 | authority |
| 63 | Philippines | Manila | 1.80 | GAP | not found under these terms: only Cotabato, Davao, Marawi held |  |  |  |
| 64 | Poland | Warsaw | 1.80 | COVERED | mawaqit.net/en/osrodek-kultury-muzulmanskie-warsaw-02-389-poland (captured this wave, gate 2026-11-11) | 365 | 2026-01-01..2026-12-31 | community |
| 65 | Romania | Bucharest | 1.80 | COVERED | mawaqit.net/en/msjd-lrhmn-moscheea-ar-rahman-bucuresti-060316-romania (captured this wave, gate 2026-11-11) | 365 | 2026-01-01..2026-12-31 | community |
| 66 | Hungary | Budapest | 1.70 | COVERED | mawaqit.net/en/budapest (captured this wave, gate 2026-11-11) | 365 | 2026-01-01..2026-12-31 | community |
| 67 | Uganda | Kampala | 1.70 | COVERED | kampala.json [c15-jamiat/data/Uganda/kampala.json] | 30 | 2026-11 | community |
| 68 | Chad | N'Djamena | 1.60 | COVERED | mawaqit-masjid-abu-bakr-siddiq-ndjamena-526hhrv-chad.json [o1l-city/O1l-33/data/mawaqit-masjid-abu-bakr-siddiq-ndjamena-526hhrv-chad.json] | 365 | 2026-01-01..2026-12-31 | community |
| 69 | Mongolia | Ulaanbaatar | 1.60 | COVERED | mongolia_meyrim-enerel_ulaanbaatar.json [c8-easia/data/mongolia_meyrim-enerel_ulaanbaatar.json] | 30 | 2026-11-01..2026-11-30 | community |
| 70 | Oman | Muscat | 1.60 | COVERED | om-muscat-2031.json [o1l-city/gaps-closed/data/om-muscat-2031.json] | 365 | 2031-01-01..2031-12-31 | community |
| 71 | Nepal | Kathmandu | 1.50 | COVERED | np-islamisangh-calendar-2083-a.pdf (Islami Sangh Nepal, Kathmandu) |  | PDF held, not normalised | authority |
| 72 | United Arab Emirates | Abu Dhabi | 1.50 | COVERED | mawaqit.net/en/masjid-suhail-mohammed-darwish-al-mazrouei-971-sweihan-abu-dhabi-united-arab-emirates (captured this wave, gate 2026-11-10) | 365 | 2026-01-01..2026-12-31 | community |
| 73 | Zimbabwe | Harare | 1.50 | COVERED | harare.json [c15-jamiat/data/Zimbabwe/harare.json] | 30 | 2026-11 | community |
| 74 | Kazakhstan | Astana | 1.40 | COVERED | kz-astana-2060.json [o1k-wide/deep1/data/kz-astana-2060.json] | 366 | 2060-01-01..2060-12-31 | authority |
| 75 | Serbia | Belgrade | 1.40 | COVERED | rs_beograd_bajrakli_mawaqit.json [c21-balkans/data/rs_beograd_bajrakli_mawaqit.json] | 30 | 2026-11-01..2026-11-30 | community |
| 76 | Bulgaria | Sofia | 1.30 | COVERED | bg_sofia_grandmufti_2026.json [o1k-wide/balkans2/data/bg_sofia_grandmufti_2026.json] | 365 | 2026-01-01..2026-12-31 | authority |
| 77 | Czechia | Prague | 1.30 | COVERED | mawaqit.net/en/al-nour-mosque-mesita-al-nour-prague-110-00-czechia (captured this wave, gate 2026-11-11) | 365 | 2026-01-01..2026-12-31 | community |
| 78 | Madagascar | Antananarivo | 1.30 | GAP | not found under these terms: only Mahajanga held |  |  |  |
| 79 | Niger | Niamey | 1.30 | GAP | not found under these terms: BUTIN portal held, no dated rows normalised |  |  |  |
| 80 | Uruguay | Montevideo | 1.30 | COVERED | mawaqit.net/en/al-musallah-al-haazimi-11100-departamento-de-montevideo-uruguay (captured this wave, gate 2026-11-11) | 365 | 2026-01-01..2026-12-31 | community |
| 81 | Belgium | Brussels | 1.20 | COVERED | be-sanabel-bruxelles-2026.json [o1k-wide/benelux2/data/be-sanabel-bruxelles-2026.json] | 365 | 2026-01-01..2026-12-31 | community |
| 82 | Georgia | Tbilisi | 1.20 | COVERED | ge-mawaqit-tbilisi-juma-conf-2026-11-10.json [o1k-wide/centralasia/data/ge-mawaqit-tbilisi-juma-conf-2026-11-10.json] | 2204 | table held (non-ISO layout) | community |
| 83 | Honduras | Tegucigalpa | 1.20 | GAP | not found under these terms: only San Pedro Sula held |  |  |  |
| 84 | Libya | Tripoli | 1.20 | GAP | no surface found naming the capital |  |  |  |
| 85 | Mauritania | Nouakchott | 1.20 | COVERED | mr-ministry-nouakchott-1446-ramadan.json [o1k-wide/northafrica2/data/mr-ministry-nouakchott-1446-ramadan.json] | 30 | 2025-03-01..2025-03-30 | community |
| 86 | Myanmar | Naypyidaw | 1.20 | GAP | not found under these terms: no surface |  |  |  |
| 87 | Pakistan | Islamabad | 1.20 | COVERED | pk-islamabad-nizam-2026.json [o1k-wide/southasia2/data/pk-islamabad-nizam-2026.json] | 366 | 2026-01-01..2026-12-31 | authority |
| 88 | Qatar | Doha | 1.20 | COVERED | qa-moi-doha-2026-11-10.json (MOI Qatar, Doha) | 1 | 2026-11-10..2026-11-10 | authority |
| 89 | Rwanda | Kigali | 1.20 | GAP | not found under these terms: no surface |  |  |  |
| 90 | Sierra Leone | Freetown | 1.20 | COVERED | sierraleone-sliweb-2026-03-ramadan-freetown.json [o1k-wide/africa/data/sierraleone-sliweb-2026-03-ramadan-freetown.json] | 31 | 2026-02-18..2026-11-10 | community |
| 91 | Armenia | Yerevan | 1.10 | GAP | not found under these terms: no surface |  |  |  |
| 92 | Kyrgyzstan | Bishkek | 1.10 | COVERED | kg-bishkek-2027.json [o1k-wide/centralasia2/data/kg-bishkek-2027.json] | 365 | 2027-01-01..2027-12-31 | authority |
| 93 | Mozambique | Maputo | 1.10 | COVERED | maputo.json [c15-jamiat/data/Mozambique/maputo.json] | 30 | 2026-11 | community |
| 94 | Senegal | Dakar | 1.10 | COVERED | timetable-mosquee-soninke-dakar-11111-senegal.json [c1-wafrica/data/timetable-mosquee-soninke-dakar-11111-senegal.json] | 366 | 2026-11-10..2027-12-31 | community |
| 95 | Canada | Ottawa | 1.00 | COVERED | mawaqit.net/en/ottawa-main-mosque-oma-ottawa-k1y-0m1-canada (captured this wave, gate 2026-11-11) | 365 | 2026-01-01..2026-12-31 | community |
| 96 | Dominican Republic | Santo Domingo | 1.00 | COVERED | masjidbox_do_santodomingo_alnoor.json (Al-Noor, Santo Domingo) | 7 | 2026-11-10..2026-11-16 | community |
| 97 | Guatemala | Guatemala City | 1.00 | COVERED | rows_gt_aldaawa_guatemala_city.json [o1k-wide/americas2/data/rows_gt_aldaawa_guatemala_city.json] | 365 | 2026-01-01..2026-12-31 | community |
| 98 | Haiti | Port-au-Prince | 1.00 | COVERED | mawaqit_ht_portauprince_chalon.json (Port-au-Prince) | 365 | 2026-01-01..2026-12-31 | community |
| 99 | Liberia | Monrovia | 1.00 | COVERED | liberia-monrovia-matw-2026-11.json [o1k-wide/sahel2/data/liberia-monrovia-matw-2026-11.json] | 30 | 2026-11-01..2026-11-30 | community |
| 100 | Malawi | Lilongwe | 1.00 | COVERED | lilongwe-malawi.json [c15-jamiat/data/Malawi/lilongwe-malawi.json] | 30 | 2026-11 | community |
| 101 | Nicaragua | Managua | 1.00 | COVERED | mawaqit.net/en/mezquita-de-managua-14038-managua-nicaragua (captured this wave, gate 2026-11-11) | 365 | 2026-01-01..2026-12-31 | community |
| 102 | Norway | Oslo | 1.00 | COVERED | no-jamiat-oslo-2026.json [o1l-city/O1l-31/data/no-jamiat-oslo-2026.json] | 365 | 2026-01-01..2026-12-31 | community |
| 103 | Somaliland | Hargeisa | 1.00 | COVERED | somalia-hargeisa-masjid-nuurul-huda.json [o1k-wide/horneast2/data/somalia-hargeisa-masjid-nuurul-huda.json] | 366 | 2026-01-01..2026-12-31 | authority |
| 104 | Turkmenistan | Ashgabat | 1.00 | GAP | not found under these terms: no surface |  |  |  |
| 105 | Sweden | Stockholm | 0.98 | COVERED | se-ifis-stockholm-2026.json [o1k-wide/nordics2/data/se-ifis-stockholm-2026.json] | 365 | 2026-01-01..2026-12-31 | authority |
| 106 | Israel | Jerusalem | 0.95 | GAP | not found under these terms: jerusalem-awqaf capture is empty |  |  |  |
| 107 | Laos | Vientiane | 0.95 | COVERED | laos_unity-iklas_vientiane.json [c8-easia/data/laos_unity-iklas_vientiane.json] | 30 | 2026-11-01..2026-11-30 | community |
| 108 | Central African Republic | Bangui | 0.90 | COVERED | mawaqit-mosquee-saina-youssuf-avenue-udeac-bangui-central-african-republic.json [o1l-city/O1l-33/data/mawaqit-mosquee-saina-youssuf-avenue-udeac-bangui-central-african-republic.json] | 365 | 2026-01-01..2026-12-31 | community |
| 109 | Eritrea | Asmara | 0.90 | COVERED | mawaqit.net/en/masjid-al-khifa-al-rashidin-abbashawel-asmara-eritrea (captured this wave, gate 2026-11-09) | 365 | 2026-01-01..2026-12-31 | community |
| 110 | Netherlands | Amsterdam | 0.90 | COVERED | nl-amsterdam-2026.json | 365 | 2026-01-01..2026-12-31 | community |
| 111 | Tajikistan | Dushanbe | 0.86 | COVERED | tj-dushanbe-2026-07.json [o1l-city/o1l-26r/data/tj-dushanbe-2026-07.json] | 31 | 2026-07-01..2026-07-31 | community |
| 112 | Croatia | Zagreb | 0.77 | COVERED | hr_zagreb_vaktijaeu_2026-11.json [o1k-wide/balkans2/data/hr_zagreb_vaktijaeu_2026-11.json] | 30 | 2026-11-01..2026-11-30 | authority |
| 113 | Tanzania | Dodoma | 0.77 | COVERED | dodoma-tanzania.json [c15-jamiat/data/Tanzania/dodoma-tanzania.json] | 30 | 2026-11 | community |
| 114 | Gabon | Libreville | 0.70 | COVERED | mawaqit-mosquee-de-kinguele-msjd-alhq-libreville-0000-gabon.json [o1l-city/O1l-33/data/mawaqit-mosquee-de-kinguele-msjd-alhq-libreville-0000-gabon.json] | 365 | 2026-01-01..2026-12-31 | community |
| 115 | Moldova | Chisinau | 0.70 | COVERED | mawaqit.net/en/muftiatul-musulmanilor-din-moldova (captured this wave, gate 2026-11-11) | 365 | 2026-01-01..2026-12-31 | community |
| 116 | United States | Washington | 0.70 | COVERED | islamic-center-washington-dc.json (Islamic Center DC) | 3 | 2026-11-01..2026-11-30 | community |
| 117 | Finland | Helsinki | 0.66 | COVERED | fi-helsinki-rukousaika-2026.json [o1k-wide/europe/data/fi-helsinki-rukousaika-2026.json] | 365 | 2026-01-01..2026-12-31 | community |
| 118 | Denmark | Copenhagen | 0.65 | COVERED | no-mawaqeet-kobenhavn-2026.json [o1k-wide/nordics2/data/no-mawaqeet-kobenhavn-2026.json] | 365 | 2026-01-01..2026-12-31 | community |
| 119 | Greece | Athens | 0.64 | COVERED | gr_athens_almrkz_mawaqit.json [c21-balkans/data/gr_athens_almrkz_mawaqit.json] | 30 | 2026-11-01..2026-11-30 | community |
| 120 | Albania | Tirana | 0.60 | COVERED | al_tirana_nura_mawaqit.json [c21-balkans/data/al_tirana_nura_mawaqit.json] | 30 | 2026-11-01..2026-11-30 | community |
| 121 | Djibouti | Djibouti | 0.60 | COVERED | djibouti-mosquee-tayib-nagad.json [c2-eafrica/data/djibouti-mosquee-tayib-nagad.json] | 2203 | table held (non-ISO layout) | community |
| 122 | Ireland | Dublin | 0.60 | COVERED | ifi_dublin_2026_printed.json [o1l-city/o1l-29/data/ifi_dublin_2026_printed.json] | 365 | 2026-01-01..2026-12-31 | authority |
| 123 | Jamaica | Kingston | 0.60 | GAP | not found under these terms: only Kingston, Hobart (Australia) held; no Jamaican surface names Kingston |  |  |  |
| 124 | Latvia | Riga | 0.60 | COVERED | mawaqit.net/en/latvijas-islama-kulturas-centrs-riga-lv1001-latvia (captured this wave, gate 2026-11-11) | 365 | 2026-01-01..2026-12-31 | community |
| 125 | Tunisia | Tunis | 0.60 | COVERED | tn-inm-tunis-2026.json | 365 | 2026-01-01..2026-12-31 | authority |
| 126 | Lithuania | Vilnius | 0.58 | COVERED | lt-vilnius-diyanet.json [o1l-city/O1l-31/data/lt-vilnius-diyanet.json] | 730 | 2026-01-01..2027-12-31 | platform |
| 127 | Portugal | Lisbon | 0.55 | COVERED | pt-lisboa-2027.json [o1k-wide/iberia2/data/pt-lisboa-2027.json] | 365 | 2027-01-01..2027-12-31 | community |
| 128 | North Macedonia | Skopje | 0.54 | COVERED | mawaqit.net/en/xhamia-ikre-saraj-skopje-1000-north-macedonia (captured this wave, gate 2026-11-11) | 365 | 2026-01-01..2026-12-31 | community |
| 129 | El Salvador | San Salvador | 0.52 | COVERED | mawaqit_sv_sansalvador_daribrahim.json (Mezquita Dar Ibrahim) | 365 | 2026-01-01..2026-12-31 | community |
| 130 | Paraguay | Asuncion | 0.50 | GAP | not found under these terms: no surface |  |  |  |
| 131 | South Sudan | Juba | 0.50 | GAP | not found under these terms: no surface |  |  |  |
| 132 | Australia | Canberra | 0.46 | COVERED | au-11430-canberra-2026.json [o1l-city/o1l-19r/data/diyanet/au-11430-canberra-2026.json] | 365 | 2026-01-01..2026-12-31 | platform |
| 133 | Estonia | Tallinn | 0.44 | COVERED | ee_eic_tallinn.json [c6-neurope/data/ee_eic_tallinn.json] | 30 | 2026-11-01..2026-11-30 | community |
| 134 | Slovakia | Bratislava | 0.44 | GAP | not found under these terms: no surface |  |  |  |
| 135 | Namibia | Windhoek | 0.43 | COVERED | windhoek-namibia.json [c15-jamiat/data/Namibia/windhoek-namibia.json] | 30 | 2026-11 | community |
| 136 | Bosnia and Herzegovina | Sarajevo | 0.42 | COVERED | ba_sarajevo_2026.json [o1l-city/balkan-cities/data/ba_sarajevo_2026.json] | 365 | 2026-01-01..2026-12-31 | community |
| 137 | New Zealand | Wellington | 0.42 | COVERED | nz-2026-ramadan-wellington.json [o1k-wide/oceania2/data/nz-2026-ramadan-wellington.json] | 30 | 2026-02-19..2026-03-20 | community |
| 138 | Guinea-Bissau | Bissau | 0.40 | COVERED | gw-attadamun-bissau.json (Bissau) | 365 | 2026-01-01..2026-12-31 | community |
| 139 | Papua New Guinea | Port Moresby | 0.40 | GAP | not found under these terms: no surface |  |  |  |
| 140 | Cote d'Ivoire | Yamoussoukro | 0.36 | COVERED | timetable-mosquee-riadh-as-salihin-abidjan-1387-cote-divoire.json [c1-wafrica/data/timetable-mosquee-riadh-as-salihin-abidjan-1387-cote-divoire.json] | 366 | 2026-11-10..2027-12-31 | community |
| 141 | Costa Rica | San Jose | 0.34 | GAP | not found under these terms: no surface |  |  |  |
| 142 | Cyprus | Nicosia | 0.33 | COVERED | cy_north_kktc_lefkosa.json (KKTC Nicosia) | 30 | 2026-11-01..2026-11-30 | authority |
| 143 | Lesotho | Maseru | 0.33 | COVERED | maseru.json [c15-jamiat/data/Lesotho/maseru.json] | 30 | 2026-11 | community |
| 144 | Bahrain | Manama | 0.30 | COVERED | bh-bahrain-calendar-1448.json (Al-Majles al-A'la calendar) | 355 | 2026-06-16..2027-06-05 | authority |
| 145 | Bolivia | Sucre | 0.30 | GAP | not found under these terms: no surface |  |  |  |
| 146 | Equatorial Guinea | Malabo | 0.30 | COVERED | mawaqit-issa-obama-home-malabo-8163-equatorial-guinea.json [o1l-city/O1l-33/data/mawaqit-issa-obama-home-malabo-8163-equatorial-guinea.json] | 365 | 2026-01-01..2026-12-31 | authority |
| 147 | Slovenia | Ljubljana | 0.29 | COVERED | si_ljubljana_mkc_mawaqit.json [c21-balkans/data/si_ljubljana_mkc_mawaqit.json] | 30 | 2026-11-01..2026-11-30 | community |
| 148 | Bahamas | Nassau | 0.27 | GAP | not found under these terms: no surface |  |  |  |
| 149 | Botswana | Gaborone | 0.27 | COVERED | gaborone.json [c15-jamiat/data/Botswana/gaborone.json] | 30 | 2026-11 | community |
| 150 | Benin | Porto-Novo | 0.26 | COVERED | benin-cotonou-omar-el-farooq-mawaqit-2026.json [o1k-wide/sahel2/data/benin-cotonou-omar-el-farooq-mawaqit-2026.json] | 365 | 2026-01-01..2026-12-31 | community |
| 151 | India | New Delhi | 0.25 | GAP | not found under these terms: only a masjidway Delhi capture, not normalised |  |  |  |
| 152 | Maldives | Male | 0.25 | COVERED | mv-male-2036.json [o1l-city/wayback-back/data/mv-male-2036.json] | 366 | 2036-01-01..2036-12-31 | community |
| 153 | Suriname | Paramaribo | 0.24 | COVERED | sr_sma_paramaribo_2025-04-29_2025-05-27.json [o1k-wide/americas2/data/sr_sma_paramaribo_2025-04-29_2025-05-27.json] | 29 | 2025-04-29..2025-05-27 | community |
| 154 | Timor-Leste | Dili | 0.22 | GAP | not found under these terms: no surface |  |  |  |
| 155 | Western Sahara | Laayoune | 0.22 | COVERED | ma-habous-laayoune-2026-10.json [o1k-wide/mideast/data/ma-habous-laayoune-2026-10.json] | 31 | 2026-10-01..2026-10-31 | authority |
| 156 | Guyana | Georgetown | 0.20 | GAP | not found under these terms: no surface |  |  |  |
| 157 | Kosovo | Pristina | 0.20 | GAP | not found under these terms: takvim probes empty; no dated table |  |  |  |
| 158 | Fiji | Suva | 0.19 | GAP | not found under these terms: Fiji tables name no Suva row verified |  |  |  |
| 159 | Montenegro | Podgorica | 0.19 | COVERED | me_podgorica_monteislam_2026-11.json [o1k-wide/balkans2/data/me_podgorica_monteislam_2026-11.json] | 30 | 2026-11-01..2026-11-30 | authority |
| 160 | Cabo Verde | Praia | 0.16 | COVERED | mawaqit.net/en/aides-islamic-center-praia-cape-verde (captured this wave, gate 2026-11-11) | 365 | 2026-01-01..2026-12-31 | community |
| 161 | Mauritius | Port Louis | 0.15 | COVERED | jummahmasjid-mauritius-2026.json (Jummah Mosque, Port Louis) | 365 | 2026-01-01..2026-12-31 | clerical |
| 162 | Iceland | Reykjavik | 0.14 | COVERED | is-felagmuslima-reykjavik-2027.json [o1k-wide/nordics2/data/is-felagmuslima-reykjavik-2027.json] | 365 | 2027-01-01..2027-12-31 | community |
| 163 | Switzerland | Bern | 0.14 | GAP | not found under these terms: Geneva and Zurich only; no surface names Bern |  |  |  |
| 164 | Luxembourg | Luxembourg | 0.13 | COVERED | lu-shoura-luxembourg-2026.json [o1k-wide/benelux2/data/lu-shoura-luxembourg-2026.json] | 365 | 2026-01-01..2026-12-31 | community |
| 165 | Transnistria | Tiraspol | 0.13 | GAP | not found under these terms: no surface |  |  |  |
| 166 | Sri Lanka | Sri Jayawardenepura Kotte | 0.12 | COVERED | colombo-sri-lanka.json [c15-jamiat/data/Sri Lanka/colombo-sri-lanka.json] | 30 | 2026-11 | community |
| 167 | Barbados | Bridgetown | 0.11 | COVERED | masjidbox_bb_barbados_annoor.json (An-Noor, Bridgetown) | 7 | 2026-11-10..2026-11-16 | community |
| 168 | Bhutan | Thimphu | 0.11 | GAP | not found under these terms: no surface |  |  |  |
| 169 | Comoros | Moroni | 0.11 | COVERED | mawaqit.net/en/msjd-ljm-sima-97300-comoros (captured this wave, gate 2026-11-11) | 365 | 2026-01-01..2026-12-31 | community |
| 170 | Brunei | Bandar Seri Begawan | 0.10 | GAP | not found under these terms: probes only, no dated table |  |  |  |
| 171 | Eswatini | Mbabane | 0.09 | COVERED | mbabane.json [c15-jamiat/data/Eswatini/mbabane.json] | 30 | 2026-11 | community |
| 172 | Solomon Islands | Honiara | 0.09 | GAP | not found under these terms: no surface |  |  |  |
| 173 | Sao Tome and Principe | Sao Tome | 0.07 | GAP | not found under these terms: no surface |  |  |  |
| 174 | Abkhazia | Sukhumi | 0.07 | GAP | not found under these terms: no surface |  |  |  |
| 175 | Kiribati | South Tarawa | 0.06 | GAP | not found under these terms: no surface |  |  |  |
| 176 | Northern Cyprus | North Nicosia | 0.06 | COVERED | cy_north_kktc_lefkosa.json (KKTC Nicosia) | 30 | 2026-11-01..2026-11-30 | authority |
| 177 | Trinidad and Tobago | Port of Spain | 0.05 | GAP | not found under these terms: Chaguanas, San Fernando, Tobago only |  |  |  |
| 178 | Vanuatu | Port Vila | 0.05 | GAP | not found under these terms: no surface |  |  |  |
| 179 | Burundi | Gitega | 0.04 | GAP | not found under these terms: no surface |  |  |  |
| 180 | Monaco | Monaco | 0.04 | GAP | not found under these terms: no surface |  |  |  |
| 181 | Palestine | Ramallah | 0.04 | COVERED | mawaqit.net/en/jam-shwman-jerusalem-5345645-palestinian-territories (captured this wave, gate 2026-11-11) | 365 | 2026-01-01..2026-12-31 | community |
| 182 | Samoa | Apia | 0.04 | GAP | not found under these terms: no surface |  |  |  |
| 183 | Gambia | Banjul | 0.03 | GAP | not found under these terms: only Bathurst (Australia) held; no Gambian surface names Banjul |  |  |  |
| 184 | Grenada | Saint George's | 0.03 | GAP | not found under these terms: no surface |  |  |  |
| 185 | Marshall Islands | Majuro | 0.03 | GAP | not found under these terms: no surface |  |  |  |
| 186 | Seychelles | Victoria | 0.03 | GAP | not found under these terms: only Victoria Falls (Zimbabwe) held; no Seychellois surface names Victoria |  |  |  |
| 187 | Tonga | Nuku'alofa | 0.03 | COVERED | to-nukualofa-al-taiyab-mawaqit.json [c22-pacific/data/to-nukualofa-al-taiyab-mawaqit.json] | 30 | 2026-11-01..2026-11-30 | community |
| 188 | Andorra | Andorra la Vella | 0.02 | COVERED | mawaqit_andorra_2026.json [o1l-city/microstates/data/mawaqit_andorra_2026.json] | 365 | 2026-01-01..2026-12-31 | community |
| 189 | Antigua and Barbuda | Saint John's | 0.02 | GAP | not found under these terms: no surface |  |  |  |
| 190 | Belize | Belmopan | 0.02 | GAP | no surface found naming the capital |  |  |  |
| 191 | Saint Lucia | Castries | 0.02 | GAP | not found under these terms: no surface |  |  |  |
| 192 | Saint Vincent | Kingstown | 0.02 | GAP | not found under these terms: no surface |  |  |  |
| 193 | Dominica | Roseau | 0.01 | GAP | not found under these terms: no surface |  |  |  |
| 194 | Saint Kitts and Nevis | Basseterre | 0.01 | GAP | not found under these terms: no surface |  |  |  |
| 195 | Micronesia | Palikir | 0.01 | GAP | not found under these terms: no surface |  |  |  |
| 196 | Liechtenstein | Vaduz | 0.01 | COVERED | igmg_liechtenstein_vaduz.json [o1l-city/microstates/data/igmg_liechtenstein_vaduz.json] | 396 | 2026-10-01..2027-10-31 | community |
| 197 | Malta | Valletta | 0.01 | GAP | not found under these terms: only Msida and Birkirkara held; no surface names Valletta |  |  |  |
| 198 | Tuvalu | Funafuti | 0.01 | GAP | not found under these terms: no surface |  |  |  |
| 199 | San Marino | San Marino | 0.00 | COVERED | mawaqit_sanmarino_2026.json (San Marino) | 365 | 2026-01-01..2026-12-31 | community |
| 200 | Nauru | Yaren | 0.00 | GAP | not found under these terms: no surface |  |  |  |
| 201 | Vatican City | Vatican City | 0.00 | GAP | not found under these terms: no surface |  |  |  |
| 202 | Palau | Ngerulmud | 0.00 | GAP | not found under these terms: no surface |  |  |  |

## Gaps, largest population first

- **Kinshasa** (DR Congo, 15.60M) — not found under these terms: only Goma held; the capital Kinshasa has no surface
- **Mexico City** (Mexico, 9.20M) — not found under these terms: search page only, no dated rows
- **Tehran** (Iran, 9.00M) — not found under these terms: no dated table captured
- **Bogota** (Colombia, 7.70M) — not found under these terms: only Cartagena held
- **Addis Ababa** (Ethiopia, 5.20M) — not found under these terms: settings page only
- **Brasilia** (Brazil, 3.00M) — not found under these terms: no surface with dated rows (IIB Brasilia page is a calculator)
- **Pyongyang** (North Korea, 3.00M) — not found under these terms: no surface
- **Algiers** (Algeria, 2.90M) — not found under these terms: 30-day MARW window held
- **Manila** (Philippines, 1.80M) — not found under these terms: only Cotabato, Davao, Marawi held
- **Antananarivo** (Madagascar, 1.30M) — not found under these terms: only Mahajanga held
- **Niamey** (Niger, 1.30M) — not found under these terms: BUTIN portal held, no dated rows normalised
- **Tegucigalpa** (Honduras, 1.20M) — not found under these terms: only San Pedro Sula held
- **Tripoli** (Libya, 1.20M) — no surface found naming the capital
- **Naypyidaw** (Myanmar, 1.20M) — not found under these terms: no surface
- **Kigali** (Rwanda, 1.20M) — not found under these terms: no surface
- **Yerevan** (Armenia, 1.10M) — not found under these terms: no surface
- **Ashgabat** (Turkmenistan, 1.00M) — not found under these terms: no surface
- **Jerusalem** (Israel, 0.95M) — not found under these terms: jerusalem-awqaf capture is empty
- **Kingston** (Jamaica, 0.60M) — not found under these terms: only Kingston, Hobart (Australia) held; no Jamaican surface names Kingston
- **Asuncion** (Paraguay, 0.50M) — not found under these terms: no surface
- **Juba** (South Sudan, 0.50M) — not found under these terms: no surface
- **Bratislava** (Slovakia, 0.44M) — not found under these terms: no surface
- **Port Moresby** (Papua New Guinea, 0.40M) — not found under these terms: no surface
- **San Jose** (Costa Rica, 0.34M) — not found under these terms: no surface
- **Sucre** (Bolivia, 0.30M) — not found under these terms: no surface
- **Nassau** (Bahamas, 0.27M) — not found under these terms: no surface
- **New Delhi** (India, 0.25M) — not found under these terms: only a masjidway Delhi capture, not normalised
- **Dili** (Timor-Leste, 0.22M) — not found under these terms: no surface
- **Georgetown** (Guyana, 0.20M) — not found under these terms: no surface
- **Pristina** (Kosovo, 0.20M) — not found under these terms: takvim probes empty; no dated table
- **Suva** (Fiji, 0.19M) — not found under these terms: Fiji tables name no Suva row verified
- **Bern** (Switzerland, 0.14M) — not found under these terms: Geneva and Zurich only; no surface names Bern
- **Tiraspol** (Transnistria, 0.13M) — not found under these terms: no surface
- **Thimphu** (Bhutan, 0.11M) — not found under these terms: no surface
- **Bandar Seri Begawan** (Brunei, 0.10M) — not found under these terms: probes only, no dated table
- **Honiara** (Solomon Islands, 0.09M) — not found under these terms: no surface
- **Sao Tome** (Sao Tome and Principe, 0.07M) — not found under these terms: no surface
- **Sukhumi** (Abkhazia, 0.07M) — not found under these terms: no surface
- **South Tarawa** (Kiribati, 0.06M) — not found under these terms: no surface
- **Port of Spain** (Trinidad and Tobago, 0.05M) — not found under these terms: Chaguanas, San Fernando, Tobago only
- **Port Vila** (Vanuatu, 0.05M) — not found under these terms: no surface
- **Gitega** (Burundi, 0.04M) — not found under these terms: no surface
- **Monaco** (Monaco, 0.04M) — not found under these terms: no surface
- **Apia** (Samoa, 0.04M) — not found under these terms: no surface
- **Banjul** (Gambia, 0.03M) — not found under these terms: only Bathurst (Australia) held; no Gambian surface names Banjul
- **Saint George's** (Grenada, 0.03M) — not found under these terms: no surface
- **Majuro** (Marshall Islands, 0.03M) — not found under these terms: no surface
- **Victoria** (Seychelles, 0.03M) — not found under these terms: only Victoria Falls (Zimbabwe) held; no Seychellois surface names Victoria
- **Saint John's** (Antigua and Barbuda, 0.02M) — not found under these terms: no surface
- **Belmopan** (Belize, 0.02M) — no surface found naming the capital
- **Castries** (Saint Lucia, 0.02M) — not found under these terms: no surface
- **Kingstown** (Saint Vincent, 0.02M) — not found under these terms: no surface
- **Roseau** (Dominica, 0.01M) — not found under these terms: no surface
- **Basseterre** (Saint Kitts and Nevis, 0.01M) — not found under these terms: no surface
- **Palikir** (Micronesia, 0.01M) — not found under these terms: no surface
- **Valletta** (Malta, 0.01M) — not found under these terms: only Msida and Birkirkara held; no surface names Valletta
- **Funafuti** (Tuvalu, 0.01M) — not found under these terms: no surface
- **Yaren** (Nauru, 0.00M) — not found under these terms: no surface
- **Vatican City** (Vatican City, 0.00M) — not found under these terms: no surface
- **Ngerulmud** (Palau, 0.00M) — not found under these terms: no surface

## Filled this wave (18 capitals, one gated mawaqit capture each)

| Country | Capital | Surface | Rows | Gate day | Fit (fajr/isha exact, within-1) | Amplitude Jan-Jul |
|---|---|---|---|---|---|---|
| CA | Ottawa | mawaqit `ottawa-main-mosque-oma-ottawa-k1y-0m1-canada` | 365 | 2026-11-11 | 92.6/100, 84.1/99.7 | -153/265 min |
| PS | Jerusalem | mawaqit `jam-shwman-jerusalem-5345645-palestinian-territories` | 365 | 2026-11-11 | 43.8/88.5, 52.9/99.5 | -66/179 min |
| CM | Yaounde | mawaqit `mosquee-hlm-waounde` | 365 | 2026-10-29 | 4.1/14.2, 1.4/4.7 (publisher point 25.193 deg off the city) | -22/51 min |
| LV | Riga | mawaqit `latvijas-islama-kulturas-centrs-riga-lv1001-latvia` | 365 | 2026-11-11 | 16.4/52.1, 21.9/49.3 | -217/328 min |
| MK | Skopje | mawaqit `xhamia-ikre-saraj-skopje-1000-north-macedonia` | 365 | 2026-11-11 | 11.2/32.1, 29.9/66.3 | -109/241 min |
| MD | Chisinau | mawaqit `muftiatul-musulmanilor-din-moldova` | 365 | 2026-11-11 | 35.9/70.7, 18.4/32.3 | -170/257 min |
| HU | Budapest | mawaqit `budapest` | 365 | 2026-11-11 | 83.6/100, 82.2/100 | -186/297 min |
| CZ | Prague | mawaqit `al-nour-mosque-mesita-al-nour-prague-110-00-czechia` | 365 | 2026-11-11 | 26.8/83.3, 13.4/60.8 | -191/304 min |
| PL | Warsaw | mawaqit `osrodek-kultury-muzulmanskie-warsaw-02-389-poland` | 365 | 2026-11-11 | 23/47.7, 8.2/20.3 | -191/279 min |
| RO | Bucharest | mawaqit `msjd-lrhmn-moscheea-ar-rahman-bucuresti-060316-romania` | 365 | 2026-11-11 | 68.2/99.2, 85.5/100 | -157/269 min |
| ER | Asmara | mawaqit `masjid-al-khifa-al-rashidin-abbashawel-asmara-eritrea` | 365 | 2026-11-09 | 94/100, 95.9/100 | -56/49 min |
| CV | Praia | mawaqit `aides-islamic-center-praia-cape-verde` | 365 | 2026-11-11 | 98.9/100, 97.3/100 | -53/46 min |
| KM | Moroni | mawaqit `msjd-ljm-sima-97300-comoros` | 365 | 2026-11-11 | 32.6/71, 14.8/41.9 (publisher point 1.028 deg off the city) | 36/-42 min |
| UY | Montevideo | mawaqit `al-musallah-al-haazimi-11100-departamento-de-montevideo-uruguay` | 365 | 2026-11-11 | 96.2/100, 89.9/100 | 136/-142 min |
| NI | Managua | mawaqit `mezquita-de-managua-14038-managua-nicaragua` | 365 | 2026-11-11 | 88.8/100, 94/100 | -43/37 min |
| AR | Buenos Aires | mawaqit `haazimi-musallah-buenos-aires-c1214` | 365 | 2026-11-11 | 51.5/68.8, 0.5/1.9 | 102/-19 min |
| SY | Damascus | mawaqit `anwar-akkad-mosque-damascus-00963-syria` | 365 | 2026-11-11 | 97/99.7, 87.7/100 | -136/127 min |
| AE | Abu Dhabi | mawaqit `masjid-suhail-mohammed-darwish-al-mazrouei-971-sweihan-abu-dhabi-united-arab-emirates` | 365 | 2026-11-10 | 78.6/100, 55.1/98.6 (publisher point 1.286 deg off the city) | -90/84 min |
