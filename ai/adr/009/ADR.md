# ADR-009: Prayer Time API Landscape

**Status:** Accepted
**Date:** 2026-02-16
**Decision Makers:** muji

---

## Context

[ADR-008](008/ADR.md) proposes a complex AI-powered scraping pipeline (Browser Use + Gemini 3 Pro for navigation, Opus 4.6 for extraction, Cloud Run for hosting) to extract mosque-specific prayer times from individual mosque websites. Before committing to that complexity, this ADR documents the existing API ecosystem — structured mosque display APIs that already aggregate prayer and iqamah times for thousands of mosques, calculation-only APIs, UK-specific sources, and client-side libraries.

If these APIs provide sufficient coverage for UK mosques, the scraping approach in ADR-008 may be partially or fully unnecessary. At minimum, they can serve as a first tier — reducing ADR-008's scraping to a fallback for mosques not covered by any existing API.

### Motivation

The original motivation was to find structured sources for mosque-specific iqamah/jamaat times — the exact times a mosque's congregation prays. A comprehensive survey of 28 APIs and sources was conducted to assess the landscape.

---

## Requirements Clarification

After completing the initial API landscape survey, a critical requirement was clarified: **only prayer start times (adhan times) are needed — not jamaah/iqamah times.**

This fundamentally changes the analysis:

- **Mosque display platform APIs** (MAWAQIT, MasjidiAPI, MosqueOS, Masjidal, etc.) — their primary value was aggregating iqamah/jamaat data that mosques manually enter. Without the need for iqamah times, these become unnecessary for the core use case.
- **ADR-008's AI scraping pipeline** — designed entirely to extract mosque-specific iqamah times from individual mosque websites. No longer needed.
- **Calculation-based solutions** (adhan-js, Aladhan) — become the complete solution. Astronomical calculation produces exactly the data required: prayer start times for any location on Earth.
- **LUPT (London)** — remains valuable as it provides a curated, community-agreed timetable that is already integrated and trusted by London mosques. It is not purely calculable.

---

## Decision

Adopt a **calculation-first strategy** for prayer times:

1. **London**: Keep the **LUPT API** (London Unified Prayer Timetable) — already integrated, curated community-agreed timetable that cannot be reproduced by pure calculation.
2. **All other locations**: Use **adhan-js** (`npm install adhan`) with `CalculationMethod.MoonsightingCommittee()` to calculate prayer start times client-side. Zero network dependency, works offline, TypeScript-native.
3. **Server-side complement**: **Aladhan API** (Method 15 — MoonsightingCommittee) as a validation source or server-side fallback where client-side calculation isn't possible.

Mosque display platform APIs (MAWAQIT, MasjidiAPI, MosqueOS, etc.) are documented below for reference but **deprioritised** — their primary value was iqamah/jamaat data, which is not required. ADR-008's AI scraping pipeline is **no longer needed** for the core use case.

---

## Comprehensive API Catalogue

### Mosque Display Software APIs (Return Iqamah Times)

These platforms provide mosque management software (TV displays, mobile apps, widgets). Mosques manually enter their iqamah/jamaat times into the platform. Some expose this data via APIs.

#### 1. Masjidal

| Field                   | Details                                                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Provider**            | Masjidal                                                                                                                                                                              |
| **URL**                 | [mymasjidal.com](https://mymasjidal.com)                                                                                                                                              |
| **Description**         | Athan clock, iqamah display, and donation platform for mosques. Hardware clocks/displays, TV signage, mobile app (Athan+), and website widgets. Powers thousands of mosques globally. |
| **API Endpoints**       | No documented public REST API. Integration is via embeddable widgets and iframe code keyed by Masjid ID.                                                                              |
| **Authentication**      | N/A (widget embed only)                                                                                                                                                               |
| **Pricing**             | Free basic plan (signage, widget). Paid tiers for enhanced display features.                                                                                                          |
| **Geographic Coverage** | Global. Primarily North America (US/Canada).                                                                                                                                          |
| **Data Returned**       | Mosque-specific iqamah/jamaat times (admin-set). Widget/embed only — no JSON API.                                                                                                     |
| **Open Source**         | No                                                                                                                                                                                    |
| **Rate Limits**         | N/A                                                                                                                                                                                   |
| **Public API**          | **No** — widget/embed only                                                                                                                                                            |

#### 2. MAWAQIT

| Field                   | Details                                                                                                                                                                                                                                                                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Provider**            | MAWAQIT                                                                                                                                                                                                                                                                                                                                   |
| **URL**                 | [mawaqit.net](https://mawaqit.net)                                                                                                                                                                                                                                                                                                        |
| **Description**         | The largest mosque display system. Non-profit (Waqf fi sabili Allah). 9,500+ mosques across 85+ countries. TV/Android TV apps, mobile apps, mosque management. Entirely free, no ads.                                                                                                                                                     |
| **API Endpoints**       | Official API is **private**. Per [help center](https://help.mawaqit.net/en/articles/11991838-can-i-use-your-api): not publicly available, contact support@mawaqit.net.                                                                                                                                                                    |
| **Unofficial Wrappers** | [mrsofiane/mawaqit-api](https://github.com/mrsofiane/mawaqit-api) (FastAPI REST wrapper), [Minemobs/mawaqit-api](https://github.com/Minemobs/mawaqit-api), [PyPI: mawaqit](https://pypi.org/project/mawaqit/) (official Python library), [mawaqit/home-assistant](https://github.com/mawaqit/home-assistant) (Home Assistant integration) |
| **Authentication**      | Official API requires auth (details private). Python library uses credentials.                                                                                                                                                                                                                                                            |
| **Pricing**             | Completely free. **Lucrative use of data is prohibited** (Waqf terms).                                                                                                                                                                                                                                                                    |
| **Geographic Coverage** | 85+ countries, 9,500+ mosques. Strong in France, North Africa, Middle East.                                                                                                                                                                                                                                                               |
| **Data Returned**       | Mosque-specific iqamah/jamaat times, adhan times, Jumuah times, announcements.                                                                                                                                                                                                                                                            |
| **Open Source**         | Partial — [github.com/mawaqit](https://github.com/mawaqit) (Android TV app, Home Assistant, Alexa skill). Core platform is not open source.                                                                                                                                                                                               |
| **Rate Limits**         | Unknown (API is private)                                                                                                                                                                                                                                                                                                                  |
| **Public API**          | **No official public API.** Unofficial wrappers exist.                                                                                                                                                                                                                                                                                    |

#### 3. MasjidiAPI

| Field                   | Details                                                                                                                                                                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Provider**            | MasjidiApp                                                                                                                                                                                                                                      |
| **URL**                 | [masjidiapp.com](https://masjidiapp.com)                                                                                                                                                                                                        |
| **Description**         | Self-described as "the first open API platform for Salah and Iqama time." Supports both calculated prayer times and crowdsourced iqamah data.                                                                                                   |
| **API Endpoints**       | Swagger/OpenAPI: [api.masjidiapp.com/docs](https://api.masjidiapp.com/docs), [apidocs.masjidiapp.com](https://apidocs.masjidiapp.com). Spec: [MasjidiAPI.json on GitHub](https://github.com/MasjidiApp/MasjidiAPI/blob/master/MasjidiAPI.json). |
| **Authentication**      | **Required.** API key in header. Test key: `123-test-key`. Production key via WhatsApp: [wa.me/15305086624](https://wa.me/15305086624).                                                                                                         |
| **Pricing**             | Free (open source project). API key obtained by request.                                                                                                                                                                                        |
| **Geographic Coverage** | Global. Iqamah data coverage depends on crowdsourced/admin submissions.                                                                                                                                                                         |
| **Data Returned**       | **Both calculated prayer times AND mosque-specific iqamah times.** Distinguishes calculated, predicted, and crowd-sourced data. Masjid details (name, address, lat/long, timezone).                                                             |
| **Open Source**         | **Yes.** [github.com/MasjidiApp/MasjidiAPI](https://github.com/MasjidiApp/MasjidiAPI)                                                                                                                                                           |
| **Rate Limits**         | Not documented                                                                                                                                                                                                                                  |
| **Public API**          | **Yes** — open source, Swagger-documented, auth token required                                                                                                                                                                                  |

#### 4. MosqueOS / Mosque Screen

| Field                   | Details                                                                                                                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Provider**            | Mosque-Screens (mosque.tech) / MosqueOS                                                                                                                                                                                                                |
| **URL**                 | [github.com/Mosque-Screens/Mosque-Screen](https://github.com/Mosque-Screens/Mosque-Screen)                                                                                                                                                             |
| **Description**         | Volunteer-based, open source prayer display screen. Mosques manage times in a Google Sheets template; system reads via Google Sheets API to render a display (PWA).                                                                                    |
| **API Endpoints**       | `https://api.mosque.tech/mosque-data/{spreadsheet_id}`, `https://api.mosque.tech/prayer-times/{spreadsheet_id}`, `https://api.mosque.tech/prayer-screen-config/{spreadsheet_id}`. [Endpoint generator tool](https://codepen.io/DilwoarH/full/mdvOexr). |
| **Authentication**      | None for public endpoints (requires knowing the Google Sheets ID). Mosques share their sheet with `mosque.screens786@gmail.com`.                                                                                                                       |
| **Pricing**             | Free. Open source, volunteer-based.                                                                                                                                                                                                                    |
| **Geographic Coverage** | Any mosque that fills in the template. Primarily UK mosques in practice.                                                                                                                                                                               |
| **Data Returned**       | Mosque-specific iqamah/jamaat times (manually entered by mosque admins into Google Sheets).                                                                                                                                                            |
| **Open Source**         | **Yes.** [Mosque-Screens/Mosque-Screen](https://github.com/Mosque-Screens/Mosque-Screen), [MosqueOS/Mosque-Prayer-Display-Screen](https://github.com/MosqueOS/Mosque-Prayer-Display-Screen). Discord: `discord.gg/CG7frj2`.                            |
| **Rate Limits**         | Subject to Google Sheets API limits                                                                                                                                                                                                                    |
| **Public API**          | **Yes** — but no directory endpoint to discover mosques. Must know individual spreadsheet IDs.                                                                                                                                                         |

#### 5. Masjid Times

| Field                   | Details                                                                                                                                                              |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Provider**            | Masjid Times (meltuhamy)                                                                                                                                             |
| **URL**                 | [github.com/meltuhamy/masjid-times](https://github.com/meltuhamy/masjid-times)                                                                                       |
| **Description**         | Open source prayer times app. Prayer times are **stored in a database per mosque** rather than calculated. Includes client-side JS library and server-side REST API. |
| **API Endpoints**       | RESTful HTTP interface documented in [GitHub wiki](https://github.com/meltuhamy/masjid-times/wiki).                                                                  |
| **Authentication**      | Not clearly documented. Likely no auth for reads.                                                                                                                    |
| **Pricing**             | Free, open source.                                                                                                                                                   |
| **Geographic Coverage** | Per-mosque. Coverage depends on which mosques have been entered.                                                                                                     |
| **Data Returned**       | Mosque-specific prayer times (DB-stored, not calculated). JSON format.                                                                                               |
| **Open Source**         | **Yes.** [github.com/meltuhamy/masjid-times](https://github.com/meltuhamy/masjid-times)                                                                              |
| **Rate Limits**         | Not documented                                                                                                                                                       |
| **Public API**          | **Yes** (open source REST API) — unclear if a public hosted instance exists                                                                                          |

#### 6. ConnectMazjid

| Field                   | Details                                                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Provider**            | ConnectMazjid (CMZ)                                                                                                                     |
| **URL**                 | [connectmazjid.com](https://connectmazjid.com)                                                                                          |
| **Description**         | Free, all-in-one mosque management and display platform. Smart TV app, admin portal, mobile app, web widgets. No extra hardware needed. |
| **API Endpoints**       | **No public API.** Data accessible only via their TV app, mobile app, and web widgets.                                                  |
| **Authentication**      | N/A                                                                                                                                     |
| **Pricing**             | Completely free.                                                                                                                        |
| **Geographic Coverage** | Global. Primarily North American mosques.                                                                                               |
| **Data Returned**       | Mosque-specific iqamah times, announcements, events (admin-managed).                                                                    |
| **Open Source**         | No                                                                                                                                      |
| **Public API**          | **No**                                                                                                                                  |

#### 7. FivePrayers

| Field                   | Details                                                                                                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Provider**            | FivePrayers                                                                                                                                                                                   |
| **URL**                 | [fiveprayers.org](https://fiveprayers.org)                                                                                                                                                    |
| **Description**         | Free web-based prayer times display system. Mosques register, configure times, and get a shareable public URL for large screen displays. Includes embed code for websites.                    |
| **API Endpoints**       | **No public REST API.** Display URL: `https://fiveprayers.org/display/index.php?id={mosque_email}`. Search: [fiveprayers.org/display/search.php](https://fiveprayers.org/display/search.php). |
| **Authentication**      | Mosque admin login for configuration. No API auth.                                                                                                                                            |
| **Pricing**             | Free.                                                                                                                                                                                         |
| **Geographic Coverage** | Global.                                                                                                                                                                                       |
| **Data Returned**       | Calculated athan times + mosque-set iqamah times. HTML display only, not JSON.                                                                                                                |
| **Open Source**         | No                                                                                                                                                                                            |
| **Public API**          | **No**                                                                                                                                                                                        |

#### 8. Masjidbox

| Field                   | Details                                                                                                                                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Provider**            | Masjidbox                                                                                                                                                                                                                        |
| **URL**                 | [masjidbox.com](https://masjidbox.com)                                                                                                                                                                                           |
| **Description**         | All-in-one digital solution for mosques. Screens, mobile app, website builder, donations, live streaming, Q&A, prayer calendars. Claims connection with "350,000+ mosques" (likely a directory reference, not active customers). |
| **API Endpoints**       | **No public REST API.** Integration via embeddable widgets, mobile apps, and PDF calendar generator.                                                                                                                             |
| **Authentication**      | N/A                                                                                                                                                                                                                              |
| **Pricing**             | Subscription model (EUR/month). Multiple tiers. 15% discount for bundles.                                                                                                                                                        |
| **Geographic Coverage** | Global. European-focused (pricing in EUR).                                                                                                                                                                                       |
| **Data Returned**       | Mosque-specific iqamah times including Jumuah, Imsak, Iftar, Taraweeh. Platform/widgets only.                                                                                                                                    |
| **Open Source**         | No                                                                                                                                                                                                                               |
| **Public API**          | **No**                                                                                                                                                                                                                           |

#### 9. Mosque Cloud

| Field                   | Details                                                                                                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Provider**            | Mosque Cloud                                                                                                                                                                      |
| **URL**                 | [mosquecloud.com](https://mosquecloud.com)                                                                                                                                        |
| **Description**         | Complete digital solutions for mosques. Custom website development, hosting, digital display screens, custom mobile apps. Bespoke development agency, not a platform with an API. |
| **API Endpoints**       | **No public API.** Services are bespoke.                                                                                                                                          |
| **Authentication**      | N/A                                                                                                                                                                               |
| **Pricing**             | Bespoke packages. Contact-based.                                                                                                                                                  |
| **Geographic Coverage** | UK-focused.                                                                                                                                                                       |
| **Data Returned**       | Mosque-specific prayer times via custom-built apps/websites.                                                                                                                      |
| **Open Source**         | No                                                                                                                                                                                |
| **Public API**          | **No** — bespoke development agency                                                                                                                                               |

#### 10. My-Masjid

| Field                   | Details                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Provider**            | My-Masjid                                                                                                                                                                |
| **URL**                 | [my-masjid.com](https://my-masjid.com)                                                                                                                                   |
| **Description**         | Web and mobile app for mosques to display and manage adhan and iqamah timings. 3 display modes. Large screen display works offline (PWA). Buzzer sounds at adhan/iqamah. |
| **API Endpoints**       | **No public API.** Display URLs: `https://time.my-masjid.com/{masjid-guid}`. Login and mosque selection via web.                                                         |
| **Authentication**      | Admin login for mosque management.                                                                                                                                       |
| **Pricing**             | Free.                                                                                                                                                                    |
| **Geographic Coverage** | Global. Any mosque can register.                                                                                                                                         |
| **Data Returned**       | Mosque-specific adhan and iqamah times (admin-set). Display URLs and mobile app only.                                                                                    |
| **Open Source**         | No                                                                                                                                                                       |
| **Public API**          | **No**                                                                                                                                                                   |

#### 11. SalatTimes

| Field                   | Details                                                                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Provider**            | SalatTimes                                                                                                                                                                                                               |
| **URL**                 | [salattimes.com](https://salattimes.com)                                                                                                                                                                                 |
| **Description**         | Prayer times website with mosque management software. Mosques claim a dashboard, configure times, upload logos, customise display themes, and show times on TV via dashboard URL. Generates professional PDF timetables. |
| **API Endpoints**       | **No public API.** Mosque display via dashboard URL.                                                                                                                                                                     |
| **Authentication**      | Mosque admin dashboard login.                                                                                                                                                                                            |
| **Pricing**             | Free mosque software.                                                                                                                                                                                                    |
| **Geographic Coverage** | Global.                                                                                                                                                                                                                  |
| **Data Returned**       | Mosque-specific iqamah times (admin-set). Platform display URLs only.                                                                                                                                                    |
| **Open Source**         | No                                                                                                                                                                                                                       |
| **Public API**          | **No**                                                                                                                                                                                                                   |

---

### Calculation-Only APIs

These APIs compute prayer times from coordinates using astronomical algorithms. They return adhan/start times only — no mosque-specific iqamah/jamaat times.

#### 1. Aladhan

| Field                   | Details                                                                                                                                                                                                                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Provider**            | Islamic Network                                                                                                                                                                                                                                                                                             |
| **URL**                 | [aladhan.com](https://aladhan.com)                                                                                                                                                                                                                                                                          |
| **Description**         | The de facto standard prayer times API. Free, well-documented, serves up to 60 million requests/day. Provides prayer times, Hijri calendar, Qibla direction, and more.                                                                                                                                      |
| **API Endpoints**       | `GET https://api.aladhan.com/v1/timings/{date}?latitude={lat}&longitude={lon}&method={method}`, `GET /v1/calendar/{year}/{month}`, `GET /v1/timingsByCity/{date}`, `GET /v1/timingsByAddress/{date}`, plus Hijri conversion, Qibla, and other endpoints. [Full docs](https://aladhan.com/prayer-times-api). |
| **Authentication**      | **None required.**                                                                                                                                                                                                                                                                                          |
| **Pricing**             | Free. No paid tiers.                                                                                                                                                                                                                                                                                        |
| **Geographic Coverage** | Global (any lat/long).                                                                                                                                                                                                                                                                                      |
| **Data Returned**       | Fajr, Sunrise, Dhuhr, Asr, Sunset, Maghrib, Isha, Imsak, Midnight, Firstthird, Lastthird. Plus Hijri and Gregorian date data.                                                                                                                                                                               |
| **Calculation Methods** | 16 methods including: MWL (1), ISNA (2), Egyptian (5), Umm al-Qura (4), Karachi (3), Tehran (7), Jafari (0), Kuwait (9), Qatar (10), Singapore (11), Turkey (13), Dubai (8), **Moonsighting Committee (15)**, UOIF (12), custom.                                                                            |
| **Open Source**         | **Yes.** GPL-3.0. [github.com/islamic-network](https://github.com/islamic-network) (migrating to [1x.ax](https://1x.ax)). Self-hostable Docker container.                                                                                                                                                   |
| **Rate Limits**         | Not documented. High capacity (60M req/day).                                                                                                                                                                                                                                                                |
| **Verified**            | Live-tested: `GET /v1/timings/16-02-2026?latitude=51.5074&longitude=-0.1278&method=2` returns `200 OK` with correct prayer times.                                                                                                                                                                           |

#### 2. MuslimSalat

| Field                   | Details                                                                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Provider**            | MuslimSalat.com                                                                                                                          |
| **URL**                 | [muslimsalat.com](https://muslimsalat.com)                                                                                               |
| **Description**         | Prayer times API for worldwide locations.                                                                                                |
| **API Endpoints**       | `GET https://muslimsalat.com/{location}.json?key={api_key}` where `{location}` is a city name. [API docs](https://muslimsalat.com/api/). |
| **Authentication**      | **API key required.**                                                                                                                    |
| **Pricing**             | Free for non-commercial/ad-supported use. Business license required for paid applications.                                               |
| **Geographic Coverage** | Global (by city name).                                                                                                                   |
| **Data Returned**       | Prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha).                                                                                          |
| **Calculation Methods** | Configurable (details in API docs).                                                                                                      |
| **Open Source**         | No                                                                                                                                       |
| **Rate Limits**         | No explicit limits; "don't abuse" policy.                                                                                                |

#### 3. IslamicFinder

| Field                   | Details                                                                                                                                                                                             |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Provider**            | IslamicFinder                                                                                                                                                                                       |
| **URL**                 | [islamicfinder.us](http://www.islamicfinder.us/index.php/api)                                                                                                                                       |
| **Description**         | Prayer times API supporting multiple calculation methods and locations.                                                                                                                             |
| **API Endpoints**       | `GET http://www.islamicfinder.us/index.php/api/prayer/times?...` with params: `user_ip`, `latitude`, `longitude`, `timezone`, `country`, `zipcode`, `date`, `method`, `juristic`. Format: JSON/XML. |
| **Authentication**      | Account registration at islamicfinder.us.                                                                                                                                                           |
| **Pricing**             | Free.                                                                                                                                                                                               |
| **Geographic Coverage** | Global (by IP, lat/long, country/zip).                                                                                                                                                              |
| **Data Returned**       | Fajr, Sunrise, Dhuhr, Asr, Sunset, Maghrib, Isha, Imsak, Midnight, Firstthird, Lastthird, Qibla.                                                                                                    |
| **Calculation Methods** | Jafari, Karachi, ISNA, MWL, Umm al-Qura, Egyptian, Tehran, Algerian, UOIF, Custom.                                                                                                                  |
| **Open Source**         | No                                                                                                                                                                                                  |
| **Rate Limits**         | Not documented                                                                                                                                                                                      |

#### 4. IslamicAPI

| Field                   | Details                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Provider**            | IslamicAPI                                                                                                          |
| **URL**                 | [islamicapi.com](https://islamicapi.com)                                                                            |
| **Description**         | Free Islamic API for prayer times, Qibla, Zakat, and more.                                                          |
| **API Endpoints**       | Prayer times, Qibla direction, Zakat calculator, Islamic calendar. [Docs](https://islamicapi.com/doc/prayer-time/). |
| **Authentication**      | **API key required.**                                                                                               |
| **Pricing**             | Free.                                                                                                               |
| **Geographic Coverage** | Global.                                                                                                             |
| **Data Returned**       | Prayer times with multiple calculation methods.                                                                     |
| **Open Source**         | Not documented                                                                                                      |
| **Rate Limits**         | Not documented                                                                                                      |

#### 5. UmmahAPI

| Field                   | Details                                                                                                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Provider**            | UmmahAPI                                                                                                                                                                                                                       |
| **URL**                 | [ummahapi.com](https://www.ummahapi.com)                                                                                                                                                                                       |
| **Description**         | Free Islamic REST API. Qibla direction, prayer times with madhab support, Hijri calendar, Asma ul Husna.                                                                                                                       |
| **API Endpoints**       | `GET https://ummahapi.com/api/qibla?lat={lat}&lng={lng}`, `GET /api/prayer-times?lat={lat}&lng={lng}&madhab={madhab}&method={method}`, `GET /api/hijri-date?date={date}`, `GET /api/asma-ul-husna`. Swagger docs: `/api/docs`. |
| **Authentication**      | **None required.**                                                                                                                                                                                                             |
| **Pricing**             | Free.                                                                                                                                                                                                                          |
| **Geographic Coverage** | Global.                                                                                                                                                                                                                        |
| **Data Returned**       | Five daily prayer times with madhab support (Hanafi/Shafi/Maliki/Hanbali).                                                                                                                                                     |
| **Calculation Methods** | Configurable via `method` param (e.g., MuslimWorldLeague).                                                                                                                                                                     |
| **Open Source**         | **Yes.** [github.com/yousuf3131/UmmahApi](https://github.com/yousuf3131/UmmahApi)                                                                                                                                              |
| **Rate Limits**         | 200 requests/15 min, 30 calculations/min, 1000 requests/hour                                                                                                                                                                   |

#### 6. Pray.zone

| Field                   | Details                                                                                                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Provider**            | Pray.zone                                                                                                                                                              |
| **URL**                 | [pray.zone](https://pray.zone)                                                                                                                                         |
| **Description**         | Prayer times API with today/weekly/monthly endpoints.                                                                                                                  |
| **API Endpoints**       | `GET https://api.pray.zone/v2/times/today.json?city={city}`, similar endpoints for `this_week.json`, `this_month.json`. Also accepts `ip=auto` for location detection. |
| **Authentication**      | **None required.**                                                                                                                                                     |
| **Pricing**             | Free.                                                                                                                                                                  |
| **Geographic Coverage** | Global (by city name or auto-IP).                                                                                                                                      |
| **Data Returned**       | Daily/weekly/monthly prayer times.                                                                                                                                     |
| **Calculation Methods** | Multiple school options via parameter.                                                                                                                                 |
| **Open Source**         | No                                                                                                                                                                     |
| **Rate Limits**         | Not documented                                                                                                                                                         |
| **Status**              | API returned 404 on live test (Feb 2026). May be down or restructured. **Reliability concern.**                                                                        |

#### 7. AzanTimes.in

| Field                   | Details                                                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Provider**            | AzanTimes.in                                                                                                                            |
| **URL**                 | [api.azantimes.in](https://api.azantimes.in)                                                                                            |
| **Description**         | Free Islamic prayer times REST API originally focused on Kerala, India.                                                                 |
| **API Endpoints**       | `GET https://api.azantimes.in/v1/timesheets/{location}/today.json`, `GET /v1/locations`. CORS enabled.                                  |
| **Authentication**      | **None required.**                                                                                                                      |
| **Pricing**             | Free.                                                                                                                                   |
| **Geographic Coverage** | Kerala, India (location identifiers like "Kozhikode", "Kalpetta_Assembly_Constituency"). **Not UK-relevant.**                           |
| **Data Returned**       | Subh (Fajr), Duhr, Asar, Maghrib, Isha, Sunrise.                                                                                        |
| **Open Source**         | Not documented                                                                                                                          |
| **Rate Limits**         | Not documented                                                                                                                          |
| **Status**              | API endpoint returns HTML instead of JSON on live test (Feb 2026). May have been restructured as website-only. **Reliability concern.** |

#### 8. Diyanet (AwqatSalah)

| Field                   | Details                                                                                                                                                                                                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Provider**            | Diyanet Isleri Baskanligi (Turkey's Presidency of Religious Affairs)                                                                                                                                                                                                                                                           |
| **URL**                 | [awqatsalah.diyanet.gov.tr](https://awqatsalah.diyanet.gov.tr/index.html)                                                                                                                                                                                                                                                      |
| **Description**         | Official Turkish government prayer times API. Hierarchical location lookup (country > city > region) to get prayer times.                                                                                                                                                                                                      |
| **API Endpoints**       | REST API at `awqatsalah.diyanet.gov.tr`. Location search, daily/monthly/annual prayer times by location ID. Reference implementation: [DinIsleriYuksekKurulu/AwqatSalah](https://github.com/DinIsleriYuksekKurulu/AwqatSalah). npm client: [@xsor/awqat-salah-client](https://www.npmjs.com/package/@xsor/awqat-salah-client). |
| **Authentication**      | **Username/password required.** Token lifetime: 45 min, refresh: 15 min. Registration process on Diyanet's website.                                                                                                                                                                                                            |
| **Pricing**             | Free (government service).                                                                                                                                                                                                                                                                                                     |
| **Geographic Coverage** | Global (covers countries, cities, regions). Primarily serves Turkish diaspora.                                                                                                                                                                                                                                                 |
| **Data Returned**       | Prayer times by location.                                                                                                                                                                                                                                                                                                      |
| **Rate Limits**         | 5 requests per service (100 for first 15 days). Annual prayer times: 10 monthly requests.                                                                                                                                                                                                                                      |
| **Open Source**         | Reference implementation on GitHub.                                                                                                                                                                                                                                                                                            |

#### 9. PawanOsman

| Field                   | Details                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Provider**            | PawanOsman                                                                                                                                        |
| **URL**                 | [github.com/PawanOsman/Prayer-Times-API](https://github.com/PawanOsman/Prayer-Times-API)                                                          |
| **Description**         | Self-hosted prayer times API. Originally at `api.pawan.krd`.                                                                                      |
| **API Endpoints**       | Originally at `api.pawan.krd/v1/prayertimes`.                                                                                                     |
| **Authentication**      | None for self-hosted.                                                                                                                             |
| **Pricing**             | Free (self-hosted).                                                                                                                               |
| **Geographic Coverage** | Global (by coordinates or city).                                                                                                                  |
| **Status**              | Live test returned error: "Incorrect API Endpoint". The hosted instance appears to have been repurposed or deprecated. **Self-hosting required.** |
| **Open Source**         | Yes (GitHub)                                                                                                                                      |

---

### UK-Specific Sources

These sources provide prayer times specifically calibrated for UK locations, often based on observation (mushahadah) rather than pure astronomical calculation.

#### 1. London Unified Prayer Timetable (LUPT) / London Prayer Times API

| Field                   | Details                                                                                                                                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Provider**            | London Prayer Times                                                                                                                                                                                                          |
| **URL**                 | [londonprayertimes.com](https://www.londonprayertimes.com)                                                                                                                                                                   |
| **Description**         | Publishes the official London Unified Prayer Timetable sourced from East London Mosque. This is a curated, bespoke timetable agreed upon by local London mosques — it cannot be reproduced by pure astronomical calculation. |
| **API Endpoint**        | `GET https://www.londonprayertimes.com/api/times/?format=json&key={key}`                                                                                                                                                     |
| **Parameters**          | `format` (json/xml), `key` (required), `date`, `year`, `month`, `city` (only "london"), `24hours`                                                                                                                            |
| **Authentication**      | **API key required.** Manually processed application, typically approved within 4 hours.                                                                                                                                     |
| **Pricing**             | Free.                                                                                                                                                                                                                        |
| **Geographic Coverage** | **London only** (within M25).                                                                                                                                                                                                |
| **Data Returned**       | `fajr`, `fajr_jamat`, `sunrise`, `dhuhr`, `dhuhr_jamat`, `asr`, `asr_2` (Hanafi), `asr_jamat`, `magrib`, `magrib_jamat`, `isha`, `isha_jamat`, `date`, `city`. **Both start and jama'ah times.**                             |
| **Open Source**         | Third-party Python library: [sshaikh/london_unified_prayer_times](https://github.com/sshaikh/london_unified_prayer_times) (GPLv3, Home Assistant integration).                                                               |
| **Current Usage**       | **Already integrated in this app** (`api/config.ts`).                                                                                                                                                                        |

#### 2. Wifaqul Ulama (Britain)

| Field             | Details                                                                                                                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Provider**      | Wifaqul Ulama (Britain)                                                                                                                                                                                           |
| **URL**           | [wifaqululama.co.uk](https://www.wifaqululama.co.uk)                                                                                                                                                              |
| **Description**   | UK ulama body providing prayer timetables. Uses 18 degrees for Fajr. For Isha at latitudes ≤48°, uses 18 degrees (al-Shafaq al-Abyadh). During perpetual twilight, employs Aqrabul-Ayyam and Nisful-Layl methods. |
| **Salah Times**   | [wifaqululama.co.uk/salahtimes/](https://www.wifaqululama.co.uk/salahtimes/)                                                                                                                                      |
| **API Endpoint**  | **No public API.** Data available as downloadable PDFs and via their mobile app. Web timetable uses PrayTimes.org calculations.                                                                                   |
| **PDF Cities**    | Preston, Manchester (Didsbury & Longsight), Bolton, Blackburn, Dewsbury, Liverpool, Bradford, and more.                                                                                                           |
| **Data Returned** | Fajr (Imsak), Sunrise, Dhuhr, Asr Shafi'i, Asr Hanafi, Maghrib (Iftaar), Isha. **Both Shafi'i and Hanafi Asr.**                                                                                                   |
| **Mobile App**    | iOS and Android. Uses precise GPS coordinates. More accurate than web-generated postcode-based timetables.                                                                                                        |
| **Public API**    | **No** — PDF/app only. Integration would require PDF scraping or app reverse-engineering.                                                                                                                         |

#### 3. Hizbul Ulama UK

| Field                   | Details                                                                                                                                                                                                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Provider**            | Hizbul Ulama UK                                                                                                                                                                                                                                                                   |
| **URL**                 | [hizbululama.org.uk](http://www.hizbululama.org.uk)                                                                                                                                                                                                                               |
| **Description**         | UK ulama body providing observation-based (mushahadah) prayer times. Timetable based on a mushahadah-guided computation model developed by Khalid Shaukat (moonsighting.com). Observations conducted on outskirts of Blackburn, Lancashire from September 1987 to September 1988. |
| **Prayer Times**        | [hizbululama.org.uk/salat_times.php](http://www.hizbululama.org.uk/salat_times.php)                                                                                                                                                                                               |
| **API Endpoint**        | **No API.** Data available as downloadable PDFs and static HTML pages.                                                                                                                                                                                                            |
| **Geographic Coverage** | UK-wide. "UK Salat Time Directory" for large cities. Also has a "Unified Prayer Times for London" timetable (within M25).                                                                                                                                                         |
| **Calculation Method**  | Moonsighting.com method: Fajr and Isha are functions of latitude AND season, not fixed degree angles. Shafaq observed disappearing at 66-100 minutes (9-13.6°), Subh-Sadiq at 94-122 minutes (14.5-10.6°). Adopted 2 January 1989.                                                |
| **Public API**          | **No** — PDF/HTML only                                                                                                                                                                                                                                                            |

#### 4. Moonsighting Committee Worldwide

| Field                   | Details                                                                                                                                                                                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Provider**            | Moonsighting Committee Worldwide (Khalid Shaukat)                                                                                                                                                                                                                                                                         |
| **URL**                 | ~~[moonsighting.com](https://www.moonsighting.com)~~ — now redirects to [PrayerTimeResearch/PrayerTimeAPI](https://github.com/PrayerTimeResearch/PrayerTimeAPI) on GitHub                                                                                                                                                 |
| **Description**         | Based on decade-long research finding that Subh-Sadiq and Shafaq are functions of latitude AND season (not fixed solar depression angles). Rejects fixed-degree assumptions.                                                                                                                                              |
| **API Endpoint**        | ~~`GET https://www.moonsighting.com/time_json.php?...`~~ — **deprecated/redirected.** Original domain no longer serves API responses. Reference implementation: [PrayerTimeResearch/PrayerTimeAPI](https://github.com/PrayerTimeResearch/PrayerTimeAPI) (Angular 9, Apache 2.0).                                          |
| **Alternative**         | `https://moonsighting.ahmedbukhamsin.sa/time_json.php` (same params — mirror, may still work)                                                                                                                                                                                                                             |
| **Authentication**      | **None required.**                                                                                                                                                                                                                                                                                                        |
| **Pricing**             | Free.                                                                                                                                                                                                                                                                                                                     |
| **Geographic Coverage** | Global. Specifically designed for higher latitudes where fixed-angle methods fail.                                                                                                                                                                                                                                        |
| **Data Returned**       | JSON with prayer times for an entire year. Minutes before sunrise (Fajr) and after sunset (Isha). Shafaq parameter: `general`, `ahmer` (Shafi'i/Maliki/Hanbali), `abyad` (Hanafi).                                                                                                                                        |
| **Aladhan Integration** | Available as **Method 15** in AlAdhan API.                                                                                                                                                                                                                                                                                |
| **Open Source**         | PHP library: [islamic-network/prayer-times-moonsighting](https://github.com/islamic-network/prayer-times-moonsighting). Reference API: [PrayerTimeResearch/PrayerTimeAPI](https://github.com/PrayerTimeResearch/PrayerTimeAPI) (Apache 2.0). Also implemented in adhan-js as `CalculationMethod.MoonsightingCommittee()`. |
| **Note**                | The redirect of moonsighting.com to GitHub reinforces that the original API is no longer reliably hosted. adhan-js implements this algorithm locally, making it the correct choice — no external API dependency needed.                                                                                                   |

---

### Client-Side Calculation Libraries

#### 1. adhan-js

| Field                   | Details                                                                                                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Provider**            | Batoul Apps                                                                                                                                                                       |
| **npm Package**         | [`adhan`](https://www.npmjs.com/package/adhan)                                                                                                                                    |
| **GitHub**              | [batoulapps/adhan-js](https://github.com/batoulapps/adhan-js) (parent: [batoulapps/Adhan](https://github.com/batoulapps/Adhan))                                                   |
| **Description**         | High precision Islamic prayer time library. All astronomical calculations use equations from "Astronomical Algorithms" by Jean Meeus.                                             |
| **Language**            | TypeScript. Ships with type definitions. ESM + UMD bundles. Node.js and browser.                                                                                                  |
| **Version**             | 4.4.3 (May 2025)                                                                                                                                                                  |
| **License**             | MIT                                                                                                                                                                               |
| **Stars**               | ~438+                                                                                                                                                                             |
| **Maintenance**         | Active. Uses semantic-release. Stable library with infrequent releases.                                                                                                           |
| **Calculation Methods** | MuslimWorldLeague, Egyptian, Karachi, UmmAlQura, Dubai, NorthAmerica (ISNA), **MoonsightingCommittee**, Kuwait, Qatar, Singapore, Tehran, Turkey, Other (custom).                 |
| **Features**            | Madhab support (Shafi/Hanafi), polar circle resolution, Qibla direction, time offsets, high latitude rules.                                                                       |
| **Relevance**           | **Best choice for this project.** TypeScript-native, MIT license, implements MoonsightingCommittee method (matches Hizbul Ulama/Moonsighting.com), works offline in React Native. |

**Usage:**

```typescript
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';
const coordinates = new Coordinates(51.5074, -0.1278);
const params = CalculationMethod.MoonsightingCommittee();
const prayerTimes = new PrayerTimes(coordinates, new Date(), params);
// prayerTimes.fajr, .sunrise, .dhuhr, .asr, .maghrib, .isha → Date objects
```

#### 2. PrayTimes.org

| Field                   | Details                                                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Provider**            | Hamid Zarrabi-Zadeh                                                                                                                                  |
| **Website**             | [praytimes.org](https://praytimes.org)                                                                                                               |
| **npm Package**         | [`praytimes`](https://www.npmjs.com/package/praytimes) (v0.0.5, ~50 weekly downloads)                                                                |
| **GitHub**              | [abodehq/Pray-Times](https://github.com/abodehq/Pray-Times) (~225 stars)                                                                             |
| **Description**         | One of the earliest widely-adopted prayer time calculation libraries.                                                                                |
| **Languages**           | JavaScript, Python, PHP, Java, C++, C#, Objective-C                                                                                                  |
| **License**             | LGPL                                                                                                                                                 |
| **Maintenance**         | **Effectively unmaintained.** No new npm versions in years.                                                                                          |
| **Calculation Methods** | MWL, ISNA, Egypt, Makkah, Karachi, Tehran, Jafari. **No MoonsightingCommittee.**                                                                     |
| **Features**            | 9 time values (Imsak, Fajr, Sunrise, Dhuhr, Asr, Sunset, Maghrib, Isha, Midnight). Time offset tuning. Standard/Hanafi Asr. Higher latitude methods. |
| **Limitations**         | No TypeScript. Not a modern ES module. Script tag only. No MoonsightingCommittee method.                                                             |
| **Relevance**           | Legacy. Wifaqul Ulama's web timetable uses it under the hood, but **adhan-js is the better choice** for new projects.                                |

---

## Comparison Table

### Mosque Display APIs — Side-by-Side

| Provider          | Public API         | Iqamah Data        | Open Source | Free       | Coverage             | Auth    | UK Mosques |
| ----------------- | ------------------ | ------------------ | ----------- | ---------- | -------------------- | ------- | ---------- |
| **MasjidiAPI**    | Yes (Swagger)      | Yes (crowdsourced) | Yes         | Yes        | Global (sparse)      | API key | Unknown    |
| **MosqueOS**      | Yes (REST)         | Yes (Sheets)       | Yes         | Yes        | Primarily UK         | None    | Yes        |
| **Masjid Times**  | Yes (REST)         | Yes (DB)           | Yes         | Yes        | Per-mosque           | Unclear | Unknown    |
| **MAWAQIT**       | Private (wrappers) | Yes (admin)        | Partial     | Yes (Waqf) | 85+ countries, 9.5K+ | Private | Some       |
| **Masjidal**      | No (widget)        | Yes (admin)        | No          | Freemium   | Global (NA focus)    | N/A     | Few        |
| **ConnectMazjid** | No                 | Yes (admin)        | No          | Yes        | Global (NA focus)    | N/A     | Few        |
| **FivePrayers**   | No                 | Yes (admin)        | No          | Yes        | Global               | N/A     | Unknown    |
| **Masjidbox**     | No                 | Yes (admin)        | No          | Paid       | Global (EU focus)    | N/A     | Unknown    |
| **Mosque Cloud**  | No                 | Yes (bespoke)      | No          | Paid       | UK                   | N/A     | Few        |
| **My-Masjid**     | No                 | Yes (admin)        | No          | Yes        | Global               | N/A     | Unknown    |
| **SalatTimes**    | No                 | Yes (admin)        | No          | Yes        | Global               | N/A     | Unknown    |

### Calculation APIs — Side-by-Side

| Provider             | Auth      | Free      | Methods     | UK-Relevant Method | Global | Status                |
| -------------------- | --------- | --------- | ----------- | ------------------ | ------ | --------------------- |
| **Aladhan**          | None      | Yes       | 16          | Moonsighting (15)  | Yes    | Active (60M req/day)  |
| **Moonsighting.com** | None      | Yes       | 1 (own)     | Native             | Yes    | Active                |
| **UmmahAPI**         | None      | Yes       | Multiple    | Via method param   | Yes    | Active                |
| **IslamicFinder**    | Account   | Yes       | 9+          | Via method param   | Yes    | Active                |
| **MuslimSalat**      | API key   | Free/paid | Multiple    | Via config         | Yes    | Active                |
| **IslamicAPI**       | API key   | Yes       | Multiple    | Unknown            | Yes    | Active                |
| **Diyanet**          | User/pass | Yes       | 1 (Diyanet) | Limited            | Yes    | Active (rate-limited) |
| **Pray.zone**        | None      | Yes       | Multiple    | Unknown            | Yes    | **Down (404)**        |
| **AzanTimes.in**     | None      | Yes       | 1           | None (Kerala only) | No     | **HTML-only**         |
| **PawanOsman**       | None      | Yes       | Multiple    | Self-host          | Yes    | **Deprecated**        |

### Client Libraries — Side-by-Side

| Feature       | adhan-js                          | PrayTimes.org       |
| ------------- | --------------------------------- | ------------------- |
| npm Package   | `adhan`                           | `praytimes`         |
| TypeScript    | Yes (native)                      | No                  |
| Module Format | ESM + UMD                         | Script tag only     |
| Methods       | 12+ (incl. MoonsightingCommittee) | 7 (no Moonsighting) |
| Maintained    | Yes (May 2025)                    | No (years stale)    |
| Stars         | ~438+                             | ~225                |
| Downloads     | Established                       | ~50/week            |
| License       | MIT                               | LGPL                |

---

## Relationship to ADR-008

### ADR-008 is no longer needed for the core use case

ADR-008 was designed to solve the problem of extracting **mosque-specific iqamah/jamaat times** from individual mosque websites using AI-powered scraping (Browser Use + Gemini 3 Pro navigation, Opus 4.6 extraction, Cloud Run hosting). With the clarification that only prayer start times are needed, the entire scraping pipeline is unnecessary — calculated times from adhan-js provide exactly what's required.

### ADR-008 status: Deferred Indefinitely

- The scraping pipeline's complexity (LLM costs, Cloud Run infrastructure, maintenance burden) is not justified when calculation APIs are sufficient
- ADR-008 remains documented as a **future enhancement** — if jamaah/iqamah times are ever wanted, the research and tooling decisions are preserved
- The multi-location expansion problem that ADR-008 aimed to solve is now addressed by adhan-js alone: any coordinates in, prayer times out

### Mosque display platform APIs (reference)

The API landscape survey revealed three platforms with public/semi-public APIs for iqamah data (MasjidiAPI, MosqueOS, MAWAQIT). These remain documented in the catalogue below for potential future use, but are not part of the current implementation plan.

---

## Consequences

### Positive

- **Dramatically simpler architecture** — no backend, no scraping infrastructure, no LLM costs
- **Works offline** — adhan-js runs entirely client-side, no network dependency for non-London locations
- **Instant response** — calculation is sub-millisecond vs API latency or 5-15s scraping
- **Zero recurring costs** — no Cloud Run, no LLM API calls, no third-party API dependencies
- **Any location worldwide** — adhan-js calculates for any coordinates, solving multi-location expansion trivially
- **TypeScript-native** — adhan-js ships type definitions, fits the project's strict TypeScript codebase

### Negative

- **Calculated times diverge from mushahadah-enhanced timetables** — adhan-js MoonsightingCommittee() produces Fajr ~7 minutes later than LUPT (observed Feb 2026, London). Both trace to the same author (Khalid Shaukat), but adhan-js uses an algorithmic approximation (18° base + seasonal adjustments) while LUPT incorporates the full mushahadah observation dataset (Hizbul Ulama Blackburn 1987–88, varying angles 10.6°–14.5° by season). The gap is methodological, not a question of authority. For London this is mitigated by keeping the LUPT API; for non-London UK locations, the divergence is an open question (see "adhan-js Tuning for UK Locations").
- **No iqamah/jamaat times** — If users later want mosque-specific congregation times, this approach doesn't provide them. Would need to revisit ADR-008 or mosque platform APIs.

### Neutral

- **Mosque display platform APIs remain documented** — The full catalogue of 28 APIs/sources is preserved below for potential future use
- **ADR-008 is deferred, not invalidated** — If iqamah times become a requirement, the scraping pipeline research is available

---

## Alternatives Considered

### Alternative 1: Tiered API Strategy (Iqamah APIs → Calculation → Scraping)

**Description:** The original recommendation in this ADR's first draft. Query mosque display platform APIs (MasjidiAPI, MosqueOS, MAWAQIT) for iqamah times first, fall back to calculation, then to ADR-008 scraping.

**Pros:**

- Provides mosque-specific iqamah/jamaat times where available
- Progressive enhancement — calculated baseline with iqamah overlay

**Cons:**

- Requires integrating 3+ third-party APIs with varying auth, reliability, and coverage
- Unknown UK mosque coverage on these platforms
- Adds significant client-side complexity for data that isn't needed

**Why Rejected:** Iqamah/jamaat times are not required. Calculation-only is sufficient and dramatically simpler.

### Alternative 2: Proceed with ADR-008 Scraping Pipeline

**Description:** Build the full AI-powered scraping pipeline (Browser Use + Gemini 3 Pro navigation, Opus 4.6 extraction, Cloud Run hosting) to extract prayer times from mosque websites.

**Pros:**

- Covers any mosque with a website
- Could extract both adhan and iqamah times

**Cons:**

- Massive overkill for calculated prayer start times — adhan-js provides the same data with zero infrastructure
- High recurring costs (LLM API calls, Cloud Run hosting)
- Complex maintenance (mosque websites change, scrapers break)
- 5-15s latency per request vs sub-millisecond local calculation

**Why Rejected:** The scraping pipeline was designed for iqamah extraction. For calculated prayer start times, adhan-js is a complete solution with no backend required.

### Alternative 3: Aladhan API as Primary (Server-Side)

**Description:** Use Aladhan API (Method 15) as the primary prayer time source instead of client-side adhan-js.

**Pros:**

- Well-established API serving 60M requests/day
- No client-side library needed
- Returns additional data (Hijri calendar, Qibla)

**Cons:**

- Requires network connectivity — breaks offline use
- Adds API dependency and latency
- adhan-js uses the same calculation algorithms locally

**Why Rejected:** adhan-js provides identical calculations client-side with offline support. Aladhan remains available as a server-side complement or validation tool.

---

## Implementation Notes

### Integration Order

1. **`yarn add adhan`** — Add adhan-js to the project
2. **Create a calculation service** — Wrap adhan-js with `CalculationMethod.MoonsightingCommittee()`. Input: coordinates + date. Output: prayer times matching the app's existing `ISingleApiResponseTransformed` interface.
3. **Keep LUPT API for London** — Already integrated (`api/config.ts`, `api/client.ts`). The London Unified Prayer Timetable is a curated, community-agreed timetable — not reproducible by pure calculation. It should remain the source for London.
4. **For non-London locations: use adhan-js** — Calculate all 6 standard prayer times (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha) from coordinates.
5. **Derive extra prayers** — Use existing `shared/prayer.ts` logic to calculate Midnight, Last Third, Suhoor, Duha, and Istijaba from the 6 standard times.
6. **Location selection UI** — Future work, separate ADR. Needs coordinates input (GPS, city search, or manual entry).

### Key Technical Decisions

- **adhan-js over Aladhan API** — Client-side, offline, zero network dependency, TypeScript-native, same calculation method (MoonsightingCommittee). Aladhan can serve as validation/fallback.
- **MoonsightingCommittee method** — Matches Hizbul Ulama's observation-based approach. Most appropriate for UK latitudes. Available as `CalculationMethod.MoonsightingCommittee()` in adhan-js and Method 15 in Aladhan.
- **adhan-js over PrayTimes.org** — TypeScript-native, MIT license, actively maintained, ESM + UMD bundles, implements MoonsightingCommittee (PrayTimes.org does not).
- **Keep LUPT for London** — The London Unified Prayer Timetable uses a mushahadah-guided computation model developed by Khalid Shaukat (moonsighting.com), incorporating actual observation data from Hizbul Ulama's Blackburn 1987–88 study. It diverges from adhan-js's MoonsightingCommittee() by ~7 minutes for Fajr because adhan-js implements an algorithmic approximation of Shaukat's method, not the full observation-enhanced model. LUPT cannot be reproduced by pure calculation and is already integrated.

---

## LUPT Provenance — The Mushahadah-Guided Computation Model

### Origin of the Unified Prayer Timetable for London (UPTTL)

The Unified Prayer Timetable for London was adopted on **1 Ramadan 1432 (1 August 2011)** following an agreement between major London mosques including:

- London Central Mosque (Regent's Park)
- East London Mosque
- Al Manaar (Westbourne Grove)
- Muslim Welfare House (Finsbury Park)
- Mayfair Islamic Centre
- Al Muntada Al Islami (Parsons Green)
- Masjid Al Tawhid (Leyton)

The agreement was backed by **Hizbul Ulama UK** and the **Central Moon Sighting Committee of Great Britain**. The timetable is maintained and published by East London Mosque via the London Prayer Times API (londonprayertimes.com).

### The Calculation Method: Mushahadah-Guided Computation

LUPT uses a **mushahadah-guided computation model developed and maintained by Khalid Shaukat of moonsighting.com**. This is not a pure astronomical calculation — it combines:

1. **Standard astronomical data** — sun/earth positional calculations (same foundation as any prayer time calculator)
2. **Actual mushahadah (observation) data** for Fajr and Isha — collected from:
   - Various northern high-latitude locations worldwide
   - **Hizbul Ulama observations in northern England** (outskirts of Blackburn, Lancashire, September 1987 – August 1988)
3. **A model that treats Fajr and Isha as functions of latitude AND season**, not fixed solar depression angles

The Hizbul Ulama observations found that:

- **Shafaq** (twilight for Isha) disappeared at **66–100 minutes after sunset** (equivalent to 9°–13.6° solar depression)
- **Subh Sadiq** (dawn for Fajr) appeared at **94–122 minutes before sunrise** (equivalent to 10.6°–14.5° solar depression)

These vary significantly by season — a fixed-angle method (e.g. "always 18°") cannot capture this variation. East London Mosque confirms that Fajr times are based on "the work of Hizbul Ulama."

LUPT also applies **precautionary safety margins** — for example, approximately 3 minutes off sunrise for M25-wide geographic coverage, ensuring the timetable is valid across the entire Greater London area.

### Why LUPT Diverges from adhan-js MoonsightingCommittee()

Both LUPT and adhan-js's `CalculationMethod.MoonsightingCommittee()` trace back to the same author — **Khalid Shaukat** — but they implement his work differently:

| Aspect               | LUPT                                                                              | adhan-js / Aladhan Method 15                          |
| -------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **Model type**       | Mushahadah-guided computation                                                     | Algorithmic approximation                             |
| **Fajr/Isha basis**  | Observation dataset (varying angles 10.6°–14.5° by season)                        | 18° base + seasonal adjustment formula                |
| **Observation data** | Incorporates Hizbul Ulama Blackburn 1987–88 study + other high-latitude locations | Does not incorporate the full observation dataset     |
| **Safety margins**   | Precautionary offsets for M25-wide coverage                                       | None (point calculation for exact coordinates)        |
| **Author**           | Khalid Shaukat (moonsighting.com)                                                 | Khalid Shaukat's method, algorithmically approximated |

**Observed divergence (London, February 2026):**

- LUPT Fajr: **05:31**
- adhan-js MoonsightingCommittee Fajr: **05:38**
- Gap: **~7 minutes**

The gap is methodological, not a question of authority — both derive from Shaukat's research. The LUPT output is richer because it incorporates the actual observation dataset rather than approximating it with a formula.

### Implication

This is why LUPT cannot be replaced by pure calculation. The mushahadah-guided model encodes empirical observation data that no fixed-angle or formula-based approximation fully reproduces. For London, LUPT remains the authoritative source.

---

## Resolved — adhan-js / Aladhan Static Tuning Is Not Viable for London

### Investigation Summary

A full-year comparison (365 days × 6 prayers = 2190 data points) was conducted between LUPT and Aladhan Method 15 (`method=15`, `school=1`, `shafaq=abyad`) for London (51.5074, -0.1278). Per-day tune offsets were computed, and tuned Aladhan output was verified against LUPT.

**Result: 2190 / 2190 comparisons match** — Aladhan _can_ reproduce LUPT exactly, but only with per-day tune strings that vary throughout the year.

### Why Static Tuning Fails

There is **no single Aladhan URL that matches LUPT year-round**. The tune offsets vary per day:

| Prayer   | Offset range    | Distinct values | Stable?                  |
| -------- | --------------- | --------------- | ------------------------ |
| Sunrise  | -3m to -2m      | 2               | Yes                      |
| Dhuhr    | +5m to +6m      | 2               | Yes                      |
| Maghrib  | +3m to +4m      | 2               | Yes                      |
| Asr      | -1m to +2m      | 4               | Mostly                   |
| Fajr     | -7m to +6m      | 14              | No — seasonal            |
| **Isha** | **-72m to +9m** | **82**          | **No — wildly seasonal** |

**302 unique tune combinations** are needed across 365 days. The Isha offset alone ranges from +9m in winter to -72m at the summer solstice (Jun 22) — the mushahadah-guided model produces fundamentally different Isha times in summer compared to the algorithmic formula.

### Example Tune Strings

For any given date, the Aladhan URL pattern is:

```
https://api.aladhan.com/v1/timings/{DD-MM-YYYY}?latitude=51.5074&longitude=-0.1278&method=15&school=1&shafaq=abyad&tune={TUNE_STRING}
```

| Date       | Tune string             | Note            |
| ---------- | ----------------------- | --------------- |
| 2026-01-15 | `0,-1,-3,5,2,3,3,6,0`   | Winter          |
| 2026-03-29 | `0,-1,-3,5,1,3,3,-6,0`  | BST transition  |
| 2026-06-21 | `0,-3,-3,5,0,3,3,-70,0` | Summer solstice |
| 2026-10-25 | `0,-2,-3,5,-1,3,3,2,0`  | GMT transition  |
| 2026-12-25 | `0,0,-2,5,1,3,3,2,0`    | Winter          |

### Conclusion

Using a per-day tune lookup table would just be storing LUPT data with extra steps — defeating the purpose of an independent fallback. **LUPT must remain the primary source for London and cannot be replaced by adhan-js or Aladhan.**

**Status: Resolved** — Static tuning is not viable.

### Resolved — Non-London UK: Same Pattern Confirmed (Manchester)

The Hizbul Ulama (HU) PDF timetable for Manchester (53°30'N, 2°15'W) was digitised and compared against Aladhan Method 15 (Hanafi, Shafaq Abyad) for the full year 2026.

**Methodology:** 357 days compared. 8 days excluded due to BST transition date mismatch between HU's 2007 template year and 2026 (Mar 25–28 and Oct 25–28, where one source is BST and the other GMT, causing ~60m false offsets).

#### Offset Summary (HU minus Aladhan, 357 days)

| Prayer  | Min | Max | Mean  | Distinct | Top offsets                                            |
| ------- | --- | --- | ----- | -------- | ------------------------------------------------------ |
| Fajr    | -2  | +2  | -0.3  | 5        | +0m (144d), -1m (108d), +1m (70d), -2m (34d), +2m (1d) |
| Sunrise | -1  | +1  | 0.0   | 3        | +0m (139d), -1m (114d), +1m (104d)                     |
| Dhuhr   | +4  | +6  | +5.0  | 3        | +5m (284d), +6m (39d), +4m (34d)                       |
| Asr (H) | -1  | +2  | 0.0   | 4        | +0m (133d), -1m (121d), +1m (81d), +2m (22d)           |
| Maghrib | +2  | +5  | +3.1  | 4        | +3m (130d), +4m (124d), +2m (102d), +5m (1d)           |
| Isha    | -71 | +3  | -19.6 | 75       | +2m (41d), +0m (39d), +1m (36d), -1m (25d), +3m (20d)  |

#### Manchester vs London — Same Structural Pattern

| Prayer  | MCR range | MCR mean | London range | London mean |
| ------- | --------- | -------- | ------------ | ----------- |
| Fajr    | -2 to +2  | -0.3     | -7 to +6     | seasonal    |
| Sunrise | -1 to +1  | 0.0      | -3 to -2     | -2.1        |
| Dhuhr   | +4 to +6  | +5.0     | +5 to +6     | +5.1        |
| Asr (H) | -1 to +2  | 0.0      | -1 to +2     | +0.6        |
| Maghrib | +2 to +5  | +3.1     | +3 to +4     | +3.1        |
| Isha    | -71 to +3 | -19.6    | -72 to +9    | -18.1       |

Five of six prayers match within ±2m. Dhuhr (+5m) and Maghrib (+3m) show the same stable offsets as London — confirming these are deliberate mushahadah adjustments, not calculation artefacts.

#### Isha Divergence by Month

| Month | Min | Max | Mean      |
| ----- | --- | --- | --------- |
| Jan   | 0   | +2  | +0.9      |
| Feb   | -2  | 0   | -0.6      |
| Mar   | -10 | -1  | -2.8      |
| Apr   | -36 | -10 | -23.6     |
| May   | -57 | -37 | -47.7     |
| Jun   | -71 | -58 | **-65.3** |
| Jul   | -65 | -45 | -55.0     |
| Aug   | -45 | -20 | -33.0     |
| Sep   | -19 | 0   | -7.2      |
| Oct   | -1  | +2  | +0.6      |
| Nov   | +1  | +3  | +1.9      |
| Dec   | +1  | +3  | +2.4      |

The Isha pattern is identical to London: near-zero in winter, catastrophic divergence at summer solstice (-65m mean in June at 53.5°N vs -65m at 51.5°N).

#### Fajr Surprise: Stable at 53.5°N

In London, Fajr had 14 distinct offset values ranging -7 to +6 (seasonal). In Manchester it's only 5 values ranging -2 to +2 — essentially a rounding error. This suggests the Aladhan seasonal function for Fajr is better calibrated at higher latitudes, or the mushahadah observations (conducted in Blackburn/Lancashire at ~53.7°N) align more naturally with the Manchester latitude.

#### Conclusion

The same Isha problem exists at every UK latitude. Static tuning is not viable for any UK location — the mushahadah model for Isha cannot be approximated by Aladhan Method 15 with fixed offsets.

**Status: Resolved**

---

## Hizbul Ulama as UK-Wide Data Source

The Hizbul Ulama (HU) PDF is not a London-only resource — it covers **40+ UK cities**, making it the primary candidate for UK-wide mushahadah prayer times.

### Source Details

- **PDF:** [Salat Times & Qiblah Guide](http://www.hizbululama.org.uk/files/salat_times_&_qiblah_guide_2.pdf) (537 pages, 983 KB, machine-extractable via `pdftotext`)
- **Author:** Molvi Yaqub Ahmed Miftahi
- **Computed by:** Khalid Shaukat (moonsighting.com — same author as Aladhan Method 15)
- **Method:** Fajr and Isha based on mushahadah (naked eye observations) carried out by Ulama in Blackburn, Lancashire, September 1987 – August 1988
- **Template year:** 2007 (times are perennial, not year-specific; BST adjustment built in)

### Calculation Parameters

| Parameter | Value                                      |
| --------- | ------------------------------------------ |
| Dhuhr     | +5 minutes after solar noon                |
| Maghrib   | +3 minutes after calculated sunset         |
| Asr       | Hanafi fiqh (2 shadow lengths)             |
| Fajr      | Mushahadah observations (not fixed-degree) |
| Isha      | Mushahadah observations (not fixed-degree) |

### Cities Covered

Aberdeen, Belfast, Birmingham, Blackburn, Bolton, Bradford, Bristol, Burnley, Cardiff, Chorley, Coventry, Croydon, Derby, Dewsbury/Batley, Dundee, Ealing, Edinburgh, Essex, Exeter, Glasgow, Hackney, Halifax, Huddersfield, Hull, Ipswich, Lancaster, Leeds, Leicester, Liverpool, London, Luton, Manchester, Newcastle upon Tyne, Nottingham, Oldham, Oxford, Peterborough, Plymouth, Portsmouth, Preston, Rochdale, Rotherham, Sheffield, Southampton, Stoke on Trent, Sunderland, Swansea, Wakefield, Walsall.

### MasjidBox: Distribution Layer, Not Calculation Engine

MasjidBox is a mosque management SaaS platform (digital signage, mobile apps, widgets, donation tracking). It allows mosques to choose a calculation method or upload their own timetable — making it a **distribution layer** for whatever timetable the mosque chooses, not an independent calculation engine.

- **London mosques** serve LUPT data via MasjidBox (verified: Al Furqan Education Trust, Hounslow — exact match with LUPT for all 6 prayers)
- **Manchester mosques** serve Hizbul Ulama data via MasjidBox (verified: Al Furqaan Islamic Centre — within 1m of HU for Fajr/Sunrise)

MasjidBox has no public developer API. It is irrelevant as a data source — the upstream timetables (LUPT, HU) are what matter.

---

## Conclusion — Mushahadah Data Required for All UK Locations

The full-year comparisons for both London (LUPT vs Aladhan) and Manchester (HU vs Aladhan) prove the same structural result:

1. **Aladhan Method 15 is the correct base algorithm** — same author (Khalid Shaukat), same underlying research
2. **5 of 6 prayers match within ±2m** with stable, deliberate offsets (Dhuhr +5m after noon, Maghrib +3m after sunset)
3. **Isha diverges by up to 71–72m at summer solstice** — a -65m mean in June, at both 51.5°N and 53.5°N
4. **No gap is acceptable** — even 1 minute of divergence from the mushahadah timetable is unacceptable; the mushahadah data must be authoritative

No calculation library can replicate the mushahadah Isha model with static parameters. The data itself must be embedded:

- **London:** LUPT remains the authoritative source (API available at `londonprayertimes.com`)
- **Non-London UK:** Hizbul Ulama timetable data must be digitised and embedded (40+ cities available in the PDF)
- **Outside UK / fallback:** adhan-js or Aladhan Method 15 remain useful for locations without mushahadah data, or as a last-resort fallback

---

## Related Decisions

- [ADR-008: Multi-Location Expansion via AI-Powered Mosque Scraping](008/ADR.md) — the scraping approach this ADR may partially replace

---

## Revision History

| Date       | Author | Change                                                                                                                    |
| ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| 2026-02-16 | muji   | Initial draft — comprehensive API landscape research                                                                      |
| 2026-02-16 | muji   | Revised to calculation-first strategy — jamaah times not required                                                         |
| 2026-02-16 | muji   | Resolved adhan-js tuning question — full-year LUPT vs Aladhan comparison proves static tuning not viable                  |
| 2026-02-16 | muji   | Updated Moonsighting Committee entry — moonsighting.com redirects to GitHub                                               |
| 2026-02-16 | muji   | Added LUPT provenance analysis — mushahadah-guided model, calculation divergence, tuning open questions                   |
| 2026-02-16 | muji   | Resolved non-London UK question — Manchester HU vs Aladhan comparison, MasjidBox investigation, HU as UK-wide data source |
