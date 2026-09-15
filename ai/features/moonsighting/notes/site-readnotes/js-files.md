# JS files read (www.moonsighting.com)

Reader checkpoint file. Rows were appended as each file was finished; all 9 files are complete.

| path | bytes | how read | what it is |
|---|---|---|---|
| moonsightingmenu.js | 6013 | full, direct Read (152 lines, max line 235 chars, no fold needed) | Milonic DHTML Menu configuration (the site's left "sidemenu" plus 7 submenus) |
| header.js | 242 | full, direct Read (1 line, 241 chars) | One `document.write` that injects moonsighting.css and a Netscape-4-era `<BODY>` tag |
| assets/js/index.js | 286 | full, direct Read (16 lines; the last line `initialize();` has no trailing newline) | jQuery "back to top" button, then calls a global `initialize()` |
| cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js | 1239 | full via 5-line fold (w300; non-newline bytes 1238 = 1238 checked) | Cloudflare Email Address Obfuscation decoder (standard Cloudflare-injected script) |
| mmenu.js | 31446 | full via 523-line fold (w300; non-newline bytes 30954 = 30954 checked), 2 consecutive Reads | Milonic DHTML Website Navigation Menu v3.5.03 (2002) engine |
| assets/js/apple_map.js | 9523 | full, 279-line redacted copy (3 JWTs replaced by <REDACTED_JWT>; max line 282 chars, no fold needed) | Prayer-table page script: Apple MapKit JS map, Qibla line, geolocation, XHR to praytable.php |
| assets/js/tz.js | 73439 | full via 245-line fold (w300; non-newline bytes 73438 = 73438 checked), 3 consecutive Reads | tz-lookup (Dark Sky `tzlookup(lat,lon)`), 438 IANA zones, data between tzdata 2018h and 2020a |
| assets/js/jquery.min.js | 86658 | full via 290-line fold (w300; non-newline bytes 86655 = 86655 checked; file has no trailing newline, so line 290 was read separately) | jQuery v3.2.1 (standard minified build, Sizzle included) |
| assets/bootstrap/js/bootstrap.min.js | 67742 | full via 231-line fold (w300; non-newline bytes 67736 = 67736 checked; line 231 is the unterminated source-map comment) | Bootstrap v4.0.0 **bundle** build (includes Popper.js 1.x), saved under the name bootstrap.min.js |
<!-- ROWS-END: later rows are inserted above this line -->

Identity check: all nine files `cmp` byte-identical between `site/www.moonsighting.com/` and `site/moonsighting.com/` (cmp printed nothing for every pair), so no diff was needed.

---

## Findings

### moonsightingmenu.js (6013 bytes, 152 lines)

**What it is:** the settings file for the Milonic DHTML Menu engine (mmenu.js, below). Line 13 comment: `// Special effect string for IE5.5 or above please visit http://www.milonic.co.uk/menu/filters_sample.php for more filters`. It defines `addmenu()` and `dumpmenus()`. `dumpmenus()` uses `document.write` to emit `<script language=javascript> menu1=menus[1]; ...`, and mmenu.js then renders those arrays.

**Settings (quoted):** `timegap=500`, `followspeed=5`, `followrate=40` (comment: "use a minimum of 40 or you may experience problems"), `suboffset_top=6;`, `suboffset_left=12;`. The IE6 check `navigator.appVersion.indexOf("MSIE 6.0")>0` picks `effect = "Fade(duration=0.2);Shadow(color='#777777', Direction=135, Strength=5)"`; any other browser gets `"Shadow(color='#777777', Direction=135, Strength=5);"`. `style1` colours: off font `#000000`, off background `#D2DDE4` (comment "fffacd Mouse Off Background Color  #B6C7D0"), on font `#000000`, on background `#FDFDF7`, border `#0A780A`, `"12px"`, `"normal"`, `"bold"`, `"Verdana"`, padding `3`, sub-menu image `"images/tri.gif"`, 3D high `#66ffff`, low `#000099`, header font `#ffffff` on `#000000`. Commented out: `//"arrowdn.gif"`, `//effect2 = "Alpha( style=0,opacity=65)"`, `//effect=""`.

**Main menu `"sidemenu"`** (width 129, top 0, left 0). Every entry, in order, as "label" -> target:
1. "Home" -> `moon.html`
2. "Moon - FAQs" -> `faq_ms.html`
3. "Moon Photos" -> `moonphotos.html`
4. "Moonsighting Committee Worldwide(MCW)" -> `mcw.html`
5. "Articles" -> `articles.html target=_blank`
6. "Astronomy" -> `show-menu=Astronomy`
7. "Countries" -> `show-menu=Countries`
8. "Do Not Click" -> `dont/don_a.html`
9. "Ever Wonder Why" -> `ever-wonder.html`
10. "Fun Time" -> `show-menu=fun-time`
11. "Islam Chronology" -> `articles/chronology.html target=_blank`
12. "Calendar" -> `show-menu=Islamic Calendar`
13. "Lectures" -> `lectures.html`
14. "Links" -> `links.html`
15. "LatitudeLongitude" -> `https://www.latlong.net/ target=_blank`
16. "Prayer Times" -> `show-menu=Prayer Times`
17. "Qibla Direction" -> `show-menu=Qibla`
18. "Ramadan & Eid" -> `ramadan-eid.html`
19. "Time Zones" -> `show-menu=Time Zones`
20. "Visibility Curves" -> `visibility.html`
21. "World Mosques" -> `mosques.html`
22. "About Us" -> `about-us.html`

**Sub-menus** (every entry):
- "Astronomy" (w125): "Astronomy for Beginners" -> `https://alexandertutoring.com/astronomy-guide-for-beginners/ target=_blank`; "Astronomy Links" -> `links.html target=_blank`; "Eclipses" -> `eclipses.html target=_blank`; "Planets" -> `planets.html target=_blank`; "Conjunction Maps" -> `https://www.timeanddate.com/worldclock/sunearth.html target=_blank`; "Eqinox/Solstice" [sic] -> `https://stellafane.org/misc/equinox.html target=_blank`; "Perigee-Apogee, New-Full Moon" -> `perigee-apogee-new-full.html target=_blank`
- "Countries" (w146): "Countries that have used our website" -> `countries.html target=_blank`; "How Countries start Islamic month" -> `how-countries.html target=_blank`
- "Fun-time" (w138): "Fun-Time - Enjoy" -> `fun-time.html target=_blank`; "NED67-Warrenton" -> `ned67warrenton.html target=_blank`
- "Islamic Calendar" (w165): "Global Hijri Calendar" -> `globalcalendar.html target=_blank`; "Soomu li-Ru'yatihi" -> `soomu-hadith.html target=_blank`; "FCNA & UQ Calendar" -> `fcna-uq-calendar.html target=_blank`; "Hijri Comittee of India" [sic] -> `1444HijriCalendar.pdf target=_blank`; "Important Hijri Dates" -> `important-dates.html target=_blank`; "Actual Saudi Dates" -> `actual-saudi-dates.pdf target=_blank`; "Gregorian Calendar" -> `gregorian-calendar.php target=_blank`
- **"Prayer Times" (w133):** "Prayer Times" -> `pray.php target=_blank`; "How We Calculate" -> `how-we.html target=_blank`; "PrayerTimes-FAQs" -> `faq_pt.html target=_blank`; **"API Prayer Times for Programmers" -> `https://github.com/PrayerTimeResearch/PrayerTimeAPI target=_blank`**
- "Qibla" (w110): "Qibla Direction" -> `qibla.html target=_blank`; "Second Qibla" -> `secondqibla.html target=_blank`; "Qibla FAQs" -> `faq_qd.html target=_blank`
- "Time Zones" (w110): "Time Zones" -> `http://www.worldtimezone.com target=_blank`; "Time Zone Map" -> `http://www.worldtimezone.com/wtz011-24.php target=_blank`

**Notes:**
- **Name matching:** the main menu calls `show-menu=fun-time` while the sub-menu is named `"Fun-time"`. mmenu.js lower-cases both sides (`Mname[m]=tmenu[0].toLowerCase()`, and in `hl()` `arg[1]=arg[1].toLowerCase()`), so they match. "Calendar" -> "Islamic Calendar" works the same way.
- **Dates and hosts:** the only date-like token is `1444HijriCalendar.pdf`, which suggests the menu was last edited around 1444 AH (2022-23). Third-party hosts: www.latlong.net, alexandertutoring.com, www.timeanddate.com, stellafane.org, github.com (PrayerTimeResearch/PrayerTimeAPI), www.worldtimezone.com (plain http), www.milonic.co.uk (comment only).
- **Nothing prayer-maths:** no trackers and no coordinates. The only prayer-time content is the four Prayer Times links; there are no method indices or parameters.

### header.js (242 bytes, 1 line)

The whole file (quoted exactly):

`document.write('<link rel="stylesheet" type="text/css" href="moonsighting.css" /><BODY onresize="if (isNS4) nsResizeHandler()" style="MARGIN: 0px" text=#000000 leftMargin=0 topMargin=0 marginwidth="0" marginheight="0" onload=writeMenus()>');`

- It injects `moonsighting.css` and writes a `<BODY>` tag with Netscape 4 resize handling.
- `isNS4`, `nsResizeHandler` and `writeMenus` are **not defined in any of the nine JS files read here**. mmenu.js does not define `writeMenus`, so this header comes from a different, older menu system. Unless a page defines those names inline, the `onload=writeMenus()` would throw a ReferenceError.
- No URLs beyond the relative CSS path, no dates, no prayer content.

### assets/js/index.js (286 bytes, 16 lines)

- A jQuery "back to top" button. `var btn = $('#button');`; when `$(window).scrollTop() > 300` it adds class `show`, otherwise removes it. On click it calls `e.preventDefault()` and `$('html, body').animate({scrollTop:0}, '300');`.
- The duration is the string `'300'`, not the number. jQuery looks the string up in `jQuery.fx.speeds`, does not find it, and falls back to the 400 ms default. This is a cosmetic quirk.
- The last line is `initialize();`, a bare call to a global defined in **assets/js/apple_map.js**. index.js must therefore load after jQuery and apple_map.js, and it starts the prayer-table page's map, geolocation and first `praytable.php` request at the moment the script runs.
- No URLs, dates or trackers.

### cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js (1239 bytes, 1 line)

- **What it is:** Cloudflare's "Email Address Obfuscation" decoder, which Cloudflare's proxy injects automatically. No version string. `5c5dd728` is Cloudflare's script-path hash.
- **Constants (quoted):** `var l="/cdn-cgi/l/email-protection#",u=".__cf_email__",f="data-cfemail"`.
- **Decoding:** it reads the hex string, takes byte 0 as the XOR key and XORs each later byte pair (`var l=r(n,i)^a`), then applies `decodeURIComponent(escape(o))`.
- **Replacements:** every `<a>` whose href contains `/cdn-cgi/l/email-protection#` gets `href="mailto:"+decoded`. Every `.__cf_email__` element is replaced by a text node of its decoded `data-cfemail`. It recurses into `<template>` contents, then removes its own `<script>` element (`document.currentScript||document.scripts[document.scripts.length-1]`).
- **Implication:** the site is served through **Cloudflare**, and email addresses in the mirrored HTML are XOR-obfuscated `data-cfemail` values, not plain text.
- No network calls, no trackers, no prayer content.

### mmenu.js (31446 bytes, 492 lines)

- **What it is:** header comment, quoted:
  `/* Milonic DHTML Website Navigation Menu - Version 3.5.03`
  ` Written by Andy Woolley - Copyright 2002 (c) Milonic Solutions Limited. All Rights Reserved.`
  ` Please visit http://www.milonic.co.uk/menu or e-mail menu3@milonic.com for more information.`
  ` The Free use of this menu is only available to Non-Profit, Educational & Personal web sites.`
  ` Commercial and Corporate licenses  are available for use on all other web sites & Intranets. ...*/`
  It is the rendering engine for the menu arrays in moonsightingmenu.js.
- **Only URL and host:** `http://www.milonic.co.uk/menu` (comment). **Only in-site path:** `ifBlnk="/blank.htm"`, used as the src of the IE5.5/6 iframe shim when `location.protocol=="https:"`.
- **Browser sniffing (2002 era):**
  - `ns4=(_d.layers)`
  - `ns6=(navigator.userAgent.indexOf("Gecko")!=-1)`
  - `mac`, `mac45` ("MSIE 4.5")
  - `opera`
  - `ns61=(parseInt(navigator.productSub)>=20010726)`
  - `ie4`, `ie55` ("MSIE 6.0"/"MSIE 5.5")
  - `konq` (Konqueror)
  - `IEDtD` (`_d.compatMode=="CSS1Compat"`)
- **Timers:** `Mtimer=setTimeout("rep_img()",99999)`; `setInterval("MScan()",150)` polls scroll and window size every 150 ms for as long as the page is open; the scroll routine uses `setTimeout(...,30)`. On a size change, Opera runs `location.reload()` and NS4 runs `window.history.go(0)`.
- **How it works:**
  - It walks `window.menu1..menuN` with `eval`.
  - For every menu, `dmenu()` writes `<div>`/`<layer>` markup through `document.write` at parse time.
  - Links are real `<a href=... target=...>` elements inside those divs.
- **Item option keywords that `parseLink` accepts:** `target`, `align`, `keytoopen`, `onfunction`, `offfunction`, `type` (`form`/`header`), `offfontcolor`, `offbackcolor`, `onfontcolor`, `onbackcolor`, `onbordercolor`, `offbordercolor`, `swapimage`, `suboverimage`, `backimage`, `overbackimage`, `dragable`, `separatorcolor`, `margin`, `sourceframe`, `offset=`, `minimum`.
- **Referenced but not defined in this file:** `drag_drop` (only used when `dragable` is set; unused here) and `Frames_Left_Offset`/`Frames_Top_Offset` (cross-frame path only; unused).
- **Notes:**
  - **Menu links depend on JS:** the entire left menu exists only after JS runs (`document.write`), so any page linked only from the menu is reachable only through JS. See the cross-check section.
  - **Not relevant to prayer times:** no dates besides the 2002 copyright, no trackers, no coordinates, no prayer-time content.
  - The last two lines are commented out: `//if(ns4)_d.captureEvents(Event.MOUSEMOVE)` and `//_d.onmouseup=closeallmenus;`.

### assets/js/apple_map.js (9523 bytes, 279 lines), read from the redacted copy

**What it is:** the page script for the **prayer-times table page** (`pray.php`; see the cross-check section). It uses **Apple MapKit JS** (the global `mapkit`; the MapKit library itself is not in this file) to show a map, a draggable pin and a great-circle Qibla line. It fills `latitude`/`longitude`/`timeZone`/`year` form fields and fetches the prayer table from **`praytable.php`** by XHR.

**Header comment:** `//This is the new file 01/08/2022`. The date format is ambiguous (1 Aug or 8 Jan 2022). The JWT issue dates below are 2022-08-01, so it almost certainly means **1 August 2022**. Google Maps code is left commented out, which shows this replaced a Google Maps version.

**Apple MapKit JWTs (values REDACTED, never copied).** `initMap()` selects one of three tokens by `location.hostname`. Claims decoded locally (no key material copied):

| hostname test | alg | header keys | payload keys | iat | exp | origin claim |
|---|---|---|---|---|---|---|
| `"www.moonsighting.com"` | ES256 | alg, kid, typ | exp, iat, iss, origin | 2022-08-01T20:05:24Z | **2023-08-01T00:00:00Z (expired)** | `www.moonsighting.com` |
| `"moonsighting.com"` | ES256 | alg, kid, typ | exp, iat, iss, origin | 2022-08-01T20:13:36Z | **2023-08-01T00:00:00Z (expired)** | `moonsighting.com` |
| `"localhost"` | ES256 | alg, kid, typ | exp, iat, iss (**no origin**) | 2020-05-02T17:11:59Z | **2090-09-11T17:11:59Z** | none |

- **Both production tokens expired on 2023-08-01.** If this mirrored file is what the live site serves, the MapKit map fails to authorise on both hostnames. The prayer table itself comes from `praytable.php` and does not need the map. Security note: the "localhost" token has **no origin restriction and a 70-year expiry**, so anyone who copies it can use it from any origin. Its kid/iss (Apple key ID and team ID) are present; the values are not recorded here.
- Any other hostname leaves `mapkey = ""`.

**Hard-coded coordinates (quoted):**
- **Kaaba (Qibla target):** `var makalng=de_ra(39.823333); var makalat=de_ra(21.423333);`, and the last polyline point `new mapkit.Coordinate(21.423333,39.823333)`.
- **Fallback when geolocation fails** (`positionError`): `new mapkit.Coordinate(24.5247,39.5692)`, then `myFunction(24.5247,39.5692); drawQibla(24.5247,39.5692);`. This point is near Madinah. A user who blocks geolocation gets a **Madinah-area** table, not London.
- **Initial map region:** `new mapkit.Coordinate(-34.397, 150.644)` with `CoordinateSpan(10, 10)`, near Sydney (the value used in Google Maps sample code). The commented-out Google block has the same `center: {lat: -34.397, lng: 150.644}, zoom: 6`.
- **Commented-out `handleNoGeolocation`:** `siberia = new google.maps.LatLng(60, 105)`, `newyork = new google.maps.LatLng(40.69847032728747, -73.9514422416687)`, `myFunction(40.719160,-74.001846)` / `drawQibla(40.719160,-74.001846)`, messages "Error: The Geolocation service failed. \r\n Drag and drop the pin to your location" and "Error: Your browser doesn't support geolocation. Are you in Siberia?".

**Geolocation:** `navigator.geolocation.getCurrentPosition(foundPosition,positionError, { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 })`.

**Qibla:** `drawQibla` samples 50 points (`i<50`, `fraction=i/(50 * 1.0)`) of great-circle interpolation from the user to the Kaaba, spherical formula `d=Math.acos(sin*sin+cos*cos*cos(Δλ))`, drawn as `mapkit.PolylineOverlay` with `lineWidth: 2, lineJoin: "round", strokeColor: "red"`.

**PRAYER-TIME ENDPOINT (quoted exactly, lines 274-277):**
```
var url = window.location.href;
url = url.substring(0, url.lastIndexOf("/") + 1);
xmlhttp.open("GET",url + "praytable.php?year=" + year + "&tz=" + timezoneID + "&lat=" + lat + "&lon=" + lon +"&method=" + method + "&both=" + both + 
"&time=" + time ,true);
```
- **Endpoint and parameters:** `praytable.php`, resolved against the current page's directory. Parameters, in order:
  - `year`: element `#year`, defaults to `rightNow.getFullYear()` when the field is 0
  - `tz`: element `#timeZone`, an **IANA zone name**, not an offset
  - `lat`: `#latitude`
  - `lon`: `#longitude`
  - `method`: `#method` value
  - `both`: `#both` checkbox value if checked, else the string `"false"`
  - `time`: `#time` value
- **Response:** HTML injected as `document.getElementById("myDiv").innerHTML=xmlhttp.responseText`, with a `#test` spinner shown by `$('#test').fadeIn()`/`fadeOut()`.
- **Error handling:** none. On a non-200 response the spinner stays and nothing is reported.
- **Encoding:** values are **not URL-encoded**. For example `tz=Europe/London` is sent with a raw `/`; a zone containing `+` (e.g. `Etc/GMT+1`) would reach PHP as a space.
- **Method index rule (quoted):** `if(document.getElementById('method').selectedIndex == 3)` disables and unchecks `#both`; any other index re-enables it. So the **4th option (index 3) of the method `<select>` cannot be combined with "both"**. The option labels live in pray.php, not here. `changeSelection()` then calls `loadXMLDoc()`.
- **Legacy branch:** `new ActiveXObject("Microsoft.XMLHTTP")` with the comment `// code for IE6, IE5`.

**Where the time zone comes from (the timezone differs by path):**
- **Geolocation success** (`foundPosition` -> `myFunction`): `timezoneID = Intl.DateTimeFormat().resolvedOptions().timeZone;`, i.e. the **browser's own zone, not the zone of the located point**. Offset code is commented out: `//    var zone=-1 * rightNow.getTimezoneOffset()/60;`. `//timezoneService(latitude,longitude);` is also commented out.
- **Geolocation failure:** it still calls `myFunction(24.5247,39.5692)`, so it sends the Madinah-area coordinates with the **viewer's** browser zone (e.g. Europe/London). The `tz` does not match the location.
- **Pin drag** (`dragEnd`): `document.getElementById('timeZone').value = tzlookup(marker.coordinate.latitude,marker.coordinate.longitude);`, i.e. the point's zone from **tz.js**.
- **Location preset** (`latitude` field != 0): `timeZone` is whatever the page pre-filled.
- `getTimezone(jData)` reads `jData.timeZoneId` (Google Time Zone API response shape). It is not called anywhere in this file; it is a Google-era leftover.

**Probable bugs, from this file alone:**
- **Preset location:** `initialize()` calls `map.setCenterAnimated(...)` and then `drawQibla` (which uses `map.addOverlay`) **before** `initMap()` creates `map`. `map` is still undefined at that point, so this throws a TypeError and `initMap()`/`loadXMLDoc()` never run, unless the page creates `map` earlier.
- **Duplicate requests:** in the geolocation branch, `loadXMLDoc()` runs immediately with whatever the fields hold (possibly lat 0) and runs again from `myFunction`. `myFunction` also calls `loadXMLDoc()` a second time after `addEventListener`. Several overlapping XHRs can be sent, and whichever response returns last wins.
- **Duplicate declaration:** `var marker;` is declared twice (harmless).

No trackers or analytics in this file. `console.log(location.hostname)` and `console.log('placeMarker')` are left in.

### assets/js/tz.js (73439 bytes, 1 line)

**What it is:** one self-contained function, `function tzlookup(Y,W){"use strict";...}`, ending with `"undefined"!=typeof module&&(module.exports=tzlookup);`. The name, the `(lat, lon)` signature, the packed quadtree string and the CommonJS export match the **`tz-lookup` npm package by Dark Sky (darkskyapp/tz-lookup)**. The file has **no banner, version string or licence comment**, so the exact package version cannot be read from it. apple_map.js calls it in exactly one place: `dragEnd()` -> `tzlookup(marker.coordinate.latitude, marker.coordinate.longitude)`.

**Structure:**
- **`var U`:** a 65,024-character packed string built from two-character base-56 codes (`56*U.charCodeAt(G)+U.charCodeAt(G+1)-1995`). I read the whole string through fold lines 1-217; it is opaque data with no embedded text, URLs or dates.
- **`T`:** an array of **438 IANA zone names**, "Africa/Abidjan" through "Pacific/Wallis". I read every one; the list includes 24 `Etc/GMT±N` ocean zones, `Etc/GMT` and `Etc/UTC`.
- **Lookup (quoted):** `if(W=+W,!(-90<=(Y=+Y)&&Y<=90&&-180<=W&&W<=180))throw new RangeError("invalid coordinates");if(90<=Y)return"Etc/GMT";var S=-1,V=48*(180+W)/360.00000000000006,X=24*(90-Y)/180.00000000000003,Z=0|V,M=0|X,G=96*M+2*Z;`
  - It starts from a coarse 48 x 24 grid of 7.5° cells.
  - It then descends a 2x2 quadtree (`G=8*(S=S+G+1)+4*(M=0|(X=2*(X-M)%2))+2*(Z=0|(V=2*(V-Z)%2))+2304`) until `G+T.length>=3136`.
  - It returns `T[G+T.length-3136]`.
  - It is a raster approximation of timezone-boundary-builder polygons, so points very near a border can resolve to the neighbouring zone.
  - Exactly lat 90 returns "Etc/GMT".
- **Data vintage** (inferred from which zone names are present):
  - `Asia/Qostanay` is present (added in tzdata 2018h), as are `Asia/Famagusta`, `Europe/Saratov` (2016j), `America/Punta_Arenas` (2017a) and `America/Fort_Nelson`.
  - `America/Godthab` is present and `America/Nuuk` is absent (renamed in tzdata 2020a).
  - `Pacific/Enderbury` is present and `Pacific/Kanton` absent (2021b).
  - `Europe/Kiev` is present and `Europe/Kyiv` absent (2022b).
  - `Australia/Currie` is present (merged away in 2020e/2021).
  - `America/Ciudad_Juarez` is absent (2022g).
  - `America/Nipigon`, `America/Rainy_River` and `America/Montreal` are absent, while `America/Thunder_Bay`, `America/Yellowknife`, `Europe/Uzhgorod` and `Europe/Zaporozhye` are present.
  - **Conclusion: the boundary data dates from between tzdata 2018h and 2020a, i.e. about 2019.** The live tz database has moved on, but the renamed zones are still accepted as backward-compatible links by PHP and ICU, so the stale names still work when sent as `tz=`.
- **London relevance:** `Europe/London` is in the list. See the node check below for which zone London coordinates resolve to.
- No URLs, hostnames, comments, trackers or prayer-time content.

### Cross-check: which pages load these scripts, and pages reachable only through JS

Supplementary greps over the www mirror, run **after** the full reads and not in place of them. Counts are files whose name matches `*.htm*`/`*.php*` and that contain the string. It is a substring match, so a count of 0 is reliable, while a non-zero count may include false positives (e.g. `qibla.html` also matches `secondqibla.html`).

**Script usage:**
- `header.js`: 1074 pages. `moonsightingmenu.js` and `mmenu.js`: 1072 pages each (e.g. 1429jmo.html, 1429jmt.html, 1429muh.html). This is the site-wide legacy header and left menu.
- `email-decode.min.js`: 416 pages.
- `apple_map.js`, `assets/js/index.js`, `tz.js`, `bootstrap.min.js`: **only `pray.php`**.
- `jquery.min.js`: the substring appears in `pray.php` and `qibla.html`, but **qibla.html line 21 loads `https://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js`** (jQuery 1.11.2 from Google), not the local file. The local `assets/js/jquery.min.js` is used **only by pray.php**. qibla.html line 373 also loads the Google Maps JS API (`https://maps.googleapis.com/maps/api/js?key=<REDACTED_GOOGLE_KEY>&callback=initialize`), which embeds a Google API key; the value is not copied here.
- **pray.php script order** (line numbers from pray.php): 16 `https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js` (Apple MapKit JS 5.x from Apple's CDN), 17 `assets/js/tz.js`, 18 `assets/js/jquery.min.js`, 19 `assets/js/apple_map.js`, 100 `assets/bootstrap/js/bootstrap.min.js`, 123 `assets/js/index.js`. index.js runs last, after the form elements exist, and its `initialize();` call starts everything. Stylesheets pull from fonts.googleapis.com (Bitter, Cabin, Source Code Pro, Merriweather) and maxcdn.bootstrapcdn.com (font-awesome 4.5.0).

**Prayer-time pages:**
- **`pray.php`** (the "Prayer Times" page) exists in both mirrors. Across the whole mirror, in any file type, the only file containing the string `pray.php` is **moonsightingmenu.js**. The prayer-times page is **reachable only through the JS menu**.
- **`praytable.php`** (the table endpoint) is referenced only by **assets/js/apple_map.js**. It exists in the **www mirror but not in the apex mirror** (`www=yes apex=no`).
- `time_json.php`: no reference in any of the nine files, and no `time_json*` file at the www mirror root.
- `PrayTimes` (the praytimes.org JS library): not present in any of the nine files.

**Menu targets (www exists / apex exists / HTML-PHP pages referencing):**
- **Referenced by no HTML/PHP page, i.e. reachable only through the JS menu (all exist in both mirrors):**
  - moonphotos.html, articles.html, dont/don_a.html, ever-wonder.html, links.html, ramadan-eid.html, visibility.html, mosques.html
  - planets.html, perigee-apogee-new-full.html
  - how-countries.html, fun-time.html, ned67warrenton.html
  - globalcalendar.html, 1444HijriCalendar.pdf, important-dates.html, gregorian-calendar.php
  - **pray.php**, faq_qd.html
  - (gregorian-calendar.php and faq_qd.html are likewise found only in moonsightingmenu.js across all file types.)
- **Also linked from HTML (count):** moon.html 1, faq_ms.html 1, mcw.html 1, articles/chronology.html 1, lectures.html 2, about-us.html 412, eclipses.html 3, countries.html 1, soomu-hadith.html 1, fcna-uq-calendar.html 1, actual-saudi-dates.pdf 1, **how-we.html 2**, **faq_pt.html 1**, qibla.html 3, secondqibla.html 1.
- **Referenced by the JS but absent from both mirrors:** `blank.htm` (mmenu.js https iframe shim), `images/tri.gif` (sub-menu arrow), `moonsighting.css` (header.js; also named by 4 HTML pages).

**tz.js behaviour check** (ran `tzlookup` locally in node; this is not a prayer time):

| point | coordinates | result |
|---|---|---|
| London | 51.5074,-0.1278 | Europe/London |
| Heathrow | 51.47,-0.4543 | Europe/London |
| Belfast | 54.597,-5.93 | Europe/London |
| Dover | 51.1279,1.3134 | Europe/London |
| apple_map fallback | 24.5247,39.5692 | Asia/Riyadh |
| Makkah | 21.423333,39.823333 | Asia/Riyadh |
| north pole | 90,0 | Etc/GMT |
| mid-Atlantic | 45,-30 | Etc/GMT+2 |

A dragged London pin sends `tz=Europe/London`. `Etc/GMT+2` contains a `+` that apple_map.js does not URL-encode, so PHP would receive `Etc/GMT 2`.

### assets/js/jquery.min.js (86658 bytes, 4 lines, no trailing newline)

- **What it is:** banner line 1, quoted: `/*! jQuery v3.2.1 | (c) JS Foundation and other contributors | jquery.org/license */`. Internal `var q="3.2.1"`. The file is the complete standard minified build:
  - UMD wrapper (`"object"==typeof module&&"object"==typeof module.exports?...`)
  - embedded Sizzle (`u="sizzle"+1*new Date`)
  - ends `r.isArray=Array.isArray,r.parseJSON=JSON.parse,r.nodeName=B,"function"==typeof define&&define.amd&&define("jquery",[],function(){return r});var Vb=a.jQuery,Wb=a.$;return r.noConflict=function(b){...},b||(a.jQuery=a.$=r),r});`
  - a node parse check passed
  - no `sourceMappingURL` comment (`assets/js/jquery.min.map`: www=no apex=no)
- **URLs and hosts:** only `jquery.org/license` in the banner. No endpoints, trackers or dates beyond the version.
- **Defaults relevant to the other scripts:**
  - `r.fx.speeds={slow:600,fast:200,_default:400}` and `r.fx.interval=13`. This confirms index.js's `animate(..., '300')` string runs at the 400 ms default.
  - ajax defaults: `contentType:"application/x-www-form-urlencoded; charset=UTF-8"`, `jsonp:"callback"`, `"X-Requested-With"="XMLHttpRequest"` on same-origin requests.
  - apple_map.js does **not** use jQuery ajax; it uses a raw `XMLHttpRequest` and uses jQuery only for `$('#test').fadeIn()/fadeOut()`.
- **Known public advisories for 3.2.1** (general knowledge, not verified in this session): CVE-2019-11358 (`jQuery.extend(true, ...)` prototype pollution, fixed 3.4.0) and CVE-2020-11022/11023 (the `htmlPrefilter` regex, present here as `htmlPrefilter:function(a){return a.replace(za,"<$1></$2>")}`, fixed 3.5.0). The praytable.php response is injected with plain `innerHTML`, so these jQuery paths are not on the prayer-table data path.
- No prayer-time content.

### assets/bootstrap/js/bootstrap.min.js (67742 bytes, 7 lines, no trailing newline)

- **What it is:** banner, quoted:
  `/*!`
  `  * Bootstrap v4.0.0 (https://getbootstrap.com)`
  `  * Copyright 2011-2018 The Bootstrap Authors (https://github.com/twbs/bootstrap/graphs/contributors)`
  `  * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)`
  `  */`
- **It is the bundle build:** the last line is `//# sourceMappingURL=bootstrap.bundle.min.js.map` (map file: www=no apex=no), and the body contains **Popper.js** (class `Ot` with modifiers shift/offset/preventOverflow/keepTogether/arrow/flip/inner/hide/computeStyle/applyStyle, `Ot.Utils=(...).PopperUtils`). So this is **bootstrap.bundle.min.js saved as bootstrap.min.js**. Popper's version string is not present. Its messages include "WARNING: `gpuAcceleration` option moved to `computeStyle` modifier and will not be supported in future versions of Popper.js!" and "Offsets separated by white space(s) are deprecated, use a comma (,) instead."
- **Version gate (quoted):** `"Bootstrap's JavaScript requires at least jQuery v1.9.1 but less than v4.0.0"`, which the local jQuery 3.2.1 satisfies. Also `"Bootstrap's JavaScript requires jQuery. jQuery must be included before Bootstrap's JavaScript."`, `"Bootstrap dropdown require Popper.js (https://popper.js.org)"` and `"Bootstrap tooltips require Popper.js (https://popper.js.org)"`.
- **Components exported:** `t.Util=k,t.Alert=L,t.Button=P,t.Carousel=x,t.Collapse=R,t.Dropdown=Nt,t.Modal=kt,t.Popover=Pt,t.Scrollspy=xt,t.Tab=Rt,t.Tooltip=Lt`. Every component's `VERSION` getter returns `"4.0.0"`. Carousel defaults `{interval:5e3,keyboard:!0,slide:!1,pause:"hover",wrap:!0}`. Transition emulation durations are 150/300/600 ms.
- **URLs and hosts:** getbootstrap.com, github.com/twbs/bootstrap (contributors, LICENSE), popper.js.org. All appear in strings or comments only; there are no network calls and no trackers.
- **Known public advisories for 4.0.0** (general knowledge, not verified in this session): CVE-2018-14040/14041/14042 (XSS via `data-parent`, `data-target`, `data-container`, fixed 4.1.2) and CVE-2019-8331 (tooltip/popover `data-template` XSS, fixed 4.3.1).
- No prayer-time content.

### Reading-method note

- **Copies:** every minified or long-line file was folded at 300 columns into readnotes/, and each fold's non-newline byte count was checked against the original (all equal). apple_map.js was read from a copy with its three JWTs replaced by `<REDACTED_JWT>`. Files with short lines were read directly.
- **Early-stop catch:** `wc -l` does not count a final line that lacks a newline. jquery.min.js, bootstrap.min.js and assets/js/index.js have no trailing newline. The first pass over the jQuery fold stopped at line 289 and the Bootstrap fold at line 230. An end-of-file byte check caught this, and fold line 290 (jQuery's closing `r.isArray ... r});`) and line 231 (Bootstrap's `//# sourceMappingURL=bootstrap.bundle.min.js.map`) were then read. Offsets past the end were also requested for mmenu (524) and tz (246); both returned nothing. index.js was read without a limit, so all 16 of its lines were seen.
- **Completeness:** every character of all nine files has been read. The apex copies are byte-identical (`cmp`), so no diff was needed.

## Summary of notable findings

1. **Prayer-table endpoint:** `praytable.php?year=&tz=&lat=&lon=&method=&both=&time=`, resolved against the page's directory. It is called only from assets/js/apple_map.js and exists only in the www mirror. `tz` is an IANA name. Values are not URL-encoded, so a `+` in `Etc/GMT+N` becomes a space. Method `selectedIndex == 3` disables the "both" option. Neither `time_json.php` nor the PrayTimes library appears in any of the nine files.
2. **Where tz comes from depends on the path:**
   - geolocation success or failure: the **browser's** `Intl` zone. On failure it sends Madinah-area coordinates `24.5247,39.5692` together with the viewer's own zone.
   - pin drag: `tzlookup()` from tz.js
   - preset location: whatever the page pre-filled
3. **tz.js is Dark Sky's tz-lookup** with 438 zones and boundary data from about 2019 (between tzdata 2018h and 2020a: Godthab, Enderbury, Kiev, Currie still present). London, Heathrow, Belfast and Dover all resolve to Europe/London.
4. **Apple MapKit JS tokens** (values redacted): the tokens for www.moonsighting.com and moonsighting.com were issued 2022-08-01 and **expired 2023-08-01**. A third "localhost" token has **no origin claim and expires 2090-09-11**, so it would work from any origin. qibla.html separately embeds a Google Maps API key (not copied).
5. **Probable apple_map.js bugs:** with a preset latitude, `initialize()` uses `map` before `initMap()` creates it. Several overlapping `praytable.php` XHRs are sent, and whichever response arrives last is shown. There is no error handling.
6. **pray.php is reachable only through the JavaScript menu** (moonsightingmenu.js is the only file in the mirror that names it), as are 18 other menu targets. moonsightingmenu.js's Prayer Times sub-menu links pray.php, how-we.html, faq_pt.html and https://github.com/PrayerTimeResearch/PrayerTimeAPI.
7. **Third-party hosts** across these files and their loaders:
   - Apple: cdn.apple-mapkit.com
   - Google: ajax.googleapis.com, maps.googleapis.com, fonts.googleapis.com
   - maxcdn.bootstrapcdn.com
   - Cloudflare email obfuscation (`/cdn-cgi/`), which shows the site is behind Cloudflare
   - menu links: latlong.net, alexandertutoring.com, timeanddate.com, stellafane.org, worldtimezone.com (http), github.com
   
   **No analytics or trackers** in any of the nine files (checked for google-analytics, gtag, googletagmanager, facebook and doubleclick; all zero).
8. **Libraries:** Milonic DHTML Menu 3.5.03 (2002); jQuery 3.2.1; Bootstrap 4.0.0 bundle with Popper.js 1.x. Both jQuery and Bootstrap have publicly known XSS/prototype-pollution advisories. header.js calls `writeMenus()`/`nsResizeHandler()`, which none of these files define.
