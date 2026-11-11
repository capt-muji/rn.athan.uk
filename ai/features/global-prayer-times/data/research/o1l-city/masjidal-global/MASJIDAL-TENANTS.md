# Masjidal / Masjidi tenant universe (O1l-43)

Two distinct platforms share the name and are enumerated separately. Neither is an authority;
both are platform tier.

## A. Masjidal (masjidal.com) - the keyless range API

**Surface.** `https://masjidal.com/api/v1/time/range?masjid_id=<id>&masjid_detail=yes&from_date=&to_date=`
returns, keyless and unauthenticated, `salah` (athan, one row per day), `iqamah` (a second row
per day), `reminder`, `announcements` and `masjid_info` (name, full postal address, logo,
website). Whole years in one request. `masjid_info.location` ends in the ISO country code, so
every id resolves to a country from the platform's own payload.

**Directory status: RETIRED.** The public mosque directory that once lived at
`masjidal.com/timings/` (Wayback 2019-12-05: "SEARCH BY LOCATION / MASJID / 5 / 10 / 25 MILES")
now 302s to the Shopify store; `masjidal.com/timings/`, `/timings/<slug>`, `/<slug>/` and
`/sitemap.xml` all return nginx 404. The portal (`portal.masjidal.com`) is a login SPA whose
bundle exposes 95 endpoints, none of them a public tenant list. The keyed API
(`api.masjidal.com/timings`) requires `x-api-key: msj_sk_...` per the vendor's own KB
(help.masjidal.com/knowledge-base/prayer-times-api/). There is therefore **no live directory to
walk**: the universe is enumerable only from tenants that published their own widget, and from
the archive of the retired directory.

**Enumeration method and ceiling.** 3,570 archived `masjidal.com` URLs (Wayback CDX, domain
match, status 200) yielded 210 distinct `masjid_id` values in `messages`, `time/range` and widget
URLs; index and community search added 6 more; all 216 resolve. This is a **floor, not a
census**: an id is only discoverable where a mosque embedded the widget in a crawlable page or
where the archive recorded it. Ids are opaque 8-character tokens (base62 decode shows no
counter structure), so they cannot be enumerated by construction.

**Counts per country (216 tenants resolved, all 216 carrying athan and iqamah rows):**

| Country | Tenants |
| --- | --- |
| United States | 174 |
| Canada | 21 |
| United Kingdom | 12 |
| Australia | 6 |
| Hong Kong | 1 |
| Mauritius | 1 |
| Chile | 1 |

The shape is a North-America-first vendor: 90.3 pc of the reachable universe sits in the US and
Canada, 5.6 pc in the UK, 2.8 pc in Australia, and one tenant each in Hong Kong (TADREES-UL-QURAN,
Kowloon), Mauritius (`Test01`, a test tenant that nonetheless serves a clean ISNA table) and Chile
(Mezquita As-Salam, Santiago).

**Surface shape (all 216).** Range API works for every id; iqamah present for every id; athan and
iqamah are separate row sets keyed by the same date string; the payload carries no method, no
coordinates, no timezone. The mosque's coordinates and clock are recoverable from the table's own
solar columns.

## B. Masjidi (masjidi.app / tv.masjidi.app) - the Lebanon feed platform

**Surface.** `https://tv.masjidi.app/` is a live, public, server-rendered directory: 495 tenants
in 33 countries across 266 city groups, each a card with `data-id`, `data-name`, `data-address`
and a link to `https://tv.masjidi.app/<id>`. Each tenant screen embeds its config and points at
one regional athan table,
`https://tv.masjidi.app/upload/json_prayers_times/prayer_times_region_json_<n>.json`: a 366-row
undated day-of-year array of `{Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha}` with no year, no
coordinates and no method. The iqamah layer is per-prayer wait durations plus Friday overrides in
the screen config, not a dated table.

**Counts per country (495 tenants):**

| Country | Tenants | Country | Tenants |
| --- | --- | --- | --- |
| Lebanon | 244 | Kuwait | 4 |
| Saudi Arabia | 49 | Canada | 4 |
| Algeria | 31 | Palestine | 4 |
| Syria | 24 | Germany | 3 |
| Indonesia | 23 | Australia | 2 |
| Oman | 16 | Sweden | 2 |
| Jordan | 15 | Norway | 2 |
| Morocco | 13 | Spain | 2 |
| Malaysia | 9 | India | 2 |
| Tunisia | 8 | Turkey | 1 |
| Egypt | 7 | Belgium | 1 |
| United States | 6 | Russia | 1 |
| Iraq | 6 | Romania | 1 |
| United Kingdom | 5 | Pakistan | 1 |
| Libya | 5 | Qatar | 1 |
| | | Bosnia and Herzegovina | 1 |
| | | Bahrain | 1 |
| | | Italy | 1 |

Lebanon is half the platform (244 of 495), which is the Dar al-Fatwa deployment the record already
carries as five regional tables. The remainder is a genuinely global long tail: the Gulf (Saudi,
Oman, Kuwait, Qatar, Bahrain, Iraq), the Levant (Syria, Jordan, Palestine), North Africa (Algeria,
Morocco, Tunisia, Libya, Egypt), South-East Asia (Indonesia, Malaysia), Europe and South Asia.

**Distinct regional tables held.** 76 tenant screens were sampled (up to 3 per country); 58 of
them reference a table and 18 carry none, and those 58 resolve to 37 distinct tables. Tables are
per mosque or per cluster, not per country: 244 Lebanese tenants collapse onto five tables, while
three Malaysian tenants hold three different tables.

## C. Athanplus (timing.athanplus.com)

The sibling consumer product serves the same tenant ids through
`https://timing.athanplus.com/masjid/widgets/monthly?theme=1&masjid_id=<id>` and carries no
separate tenant namespace: every athanplus id tried (`4KB01PA5`, `VdwqwMLe`, `wdqDq6Ab`)
resolves on the Masjidal range API to the same mosque. It adds no tenants and no data.
