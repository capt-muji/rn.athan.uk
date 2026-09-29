# R4: the picture that lets a human verify the direction, and what shipping apps prove about it

Research agent R4, brief questions 3 and 5. Written 2026-09-30. Sources are TinyFish search and
fetch (announced per global AGENTS.md; every claim below carries its URL or is marked UNVERIFIED).
Where a store page or thread was read through a search snippet rather than a full fetch, that is
stated. All computations marked "computed here" were run with `node` against the great-circle
formula in `shared/qibla.ts` and are reproducible.

## 0. Verdict table

Ranked by how reliably an ordinary user can CATCH an error in the presentation. "See the error"
means: if the direction shown is wrong, does the presentation contain something the user can check
it against, without trusting another sensor.

| Rank | Presentation | Can the user SEE the error | Why |
| --- | --- | --- | --- |
| 1 | North-up street map with a qibla ray from the user's position | **Yes** | The line crosses streets and buildings the user can see from where they stand. A wrong line contradicts the visible world. A user caught exactly this class of bug in a shipped app (section 3, Qibla Finder 100%). |
| 2 | Satellite imagery with the same ray | **Yes** | Same check, more texture (rooftops, back gardens, the user's own building). Costs far more bytes. The rhumb-line trap is easier to see on imagery than on a vector street map. |
| 3 | Mosque position drawn on the same map | **Yes, with a caveat** | A second, independent reference the user can verify by walking to it. Orientation is NOT recorded in OSM, and some mosques are oriented wrong (section 6.3), so the building is a reference, not a truth. |
| 4 | The sun as the reference (qibla time) | **Yes, completely** | The reference is in the sky, not in the phone. No sensor, no map, no network. Availability is time-limited and weather-limited. |
| 5 | Static diagram the user screenshots or prints | **Yes, but frozen** | Same content as rank 1 for one fixed place. Good for a prayer spot used repeatedly, useless in a new room. |
| 6 | Line plus text instruction referencing a landmark or clock face | Partly | Works when the user knows the landmark and can hold an angle in their head. Fails for curved streets and unknown landmarks. |
| 7 | The compass dial as it ships today | **No** | Session 40 measured 30 degrees of position-dependent error in the owner's own bedroom and nothing on the screen reveals it. This row exists to eliminate this case. |
| 8 | Camera view with an AR overlay | **No, and it hides the failure** | It needs the same magnetometer (Google's own help page says so), and it dresses the reading in the most convincing picture of all. Perceived accuracy rises while actual accuracy is unchanged. |

**The one to build: rank 1, the north-up map with a qibla ray**, with rank 3 drawn on top where
OSM has the mosque, and rank 4 offered as the cross-check. Section 7 gives the design rules this
implies, including one arithmetic trap (the rhumb line) that a shipped app has already fallen into.

---

## 1. The minimum sufficient picture

The task: the user must end up facing a direction. Every presentation is a claim about that
direction. The question for each is what the user can check the claim against.

### 1.1 The candidates, side by side

| Presentation | What the user must do | What can go wrong | Is the error visible to them |
| --- | --- | --- | --- |
| Street map, line from their position | Read the line's angle against their own street, then turn their body to match | Misread the map; curved street; mental rotation (section 2) | **Yes.** The street is visible from where they stand. Wrong line, wrong-looking angle, they see it. |
| Satellite imagery, line | Same, with more visual anchors | Same, plus imagery can be years stale | **Yes.** Same check, richer texture. |
| Building footprints only, no streets | Recognise their building or a neighbour's outline, align to it | Harder without street geometry; footprints are dense and similar | **Yes**, but weaker. Recognition is slower and more error-prone than a street. No user report found of anyone doing it this way. UNVERIFIED as a standalone presentation. |
| Line plus text ("22 degrees right of the way your street runs") | Hold an angle in the head and apply it | Clock-face and landmark angles must be estimated by eye | Partly. The landmark is visible, the angle is not. Users who do this (section 4) memorise it once and re-derive it with the sun. |
| Compass dial as shipped | Bring the Kaaba marker under the fixed mark | The needle is wrong by up to 30 degrees indoors (session 40) | **No.** That is the whole defect. |
| AR camera overlay | Point the camera, see the line or rug in the world | The overlay inherits the magnetometer error and hides it behind a convincing picture | **No.** Worse than the dial, because it looks more authoritative. |
| The sun as reference | At the stated time, face the sun (or its shadow) | Cloud, night, wrong time, or the user must transfer an angle at non-transit times | **Yes.** The sun is the check. Nothing on the phone can bend it. |
| Static diagram, screenshot or print | Read a frozen picture for one known place | Stale position; wrong room in the same building | **Yes**, same as the map, but only for the place it was drawn for. |

### 1.2 Per-candidate detail

**Street map with a line.** This is what the owner does today with Google Maps, and he is not
alone. In an r/islam thread asking for an accurate qibla app, the top practical answers describe
the map method in their own words:

> "I use google maps for orientation: Open Google maps and turn on your location. Try to recognize
> where you exactly are, then look on Google Maps which direction you are facing right now and
> adjust it so you look towards Qibla." (u/yuskan, r/islam, 2024,
> https://www.reddit.com/r/islam/comments/1g21km2/i_have_qibla_compass_but_every_hour_shows/)

> "You could always use Google Maps to figure out the Qibla too. Drop a pin on the Kaaba in Mecca
> and then hit 'Measure Distance'. Then move the dot to your current location. You'll see a blue
> line follow you and when you zoom in on your current location, the blue line will show you the
> direction of Mecca." ([deleted user], same thread, 2022,
> https://www.reddit.com/r/islam/comments/yk8ib0/anyone_know_of_an_accurate_qibla_app/)

And the most precise statement of why the method is trustworthy, from 2015, eleven years before
this session:

> "However, most apps also let you view the map of where you're currently at and point toward the
> Qibla. I find this method trustworthy, as long as you can verify what's around you. Using this
> feature you figure out 'oh, so I stand this way relative to Suchandsuch Street in order to face
> the qibla.' Also, this only works if you're near buildings, streets, etc., and won't be of much
> help in the wildnerness." (u/costofanarchy, r/islam, 2015,
> https://www.reddit.com/r/islam/comments/3hyhm8/do_you_use_apps_to_find_the_direction_of_qibla/)

That last quote names the boundary of the method honestly: it needs features. Prayer happens
indoors and in built areas, which is exactly where features exist.

**Satellite imagery with a line.** Same verification act, richer anchors. Google's own Qibla
Finder renders this way. The one recorded defect is instructive: a user of a different app
believed the drawn line was a flat-map rhumb line rather than a great circle, and could tell
because the map made the line's angle inspectable (section 3.4). Imagery is heavier than vector
streets; the megabyte question is R1's, recorded here only as a cost axis.

**Building footprints only.** No street skeleton. A human can recognise their own terrace's shape,
but the act is slower and the mistake space is larger (mirrored terraces, cul-de-sacs). No
evidence found of a shipped qibla app doing footprints-only, and no user report of wanting it.
UNVERIFIED as a standalone presentation; as an ADDITION to streets it is free in OSM-derived
basemaps and strengthens the check.

**Line plus text instruction referencing a landmark.** The clock-face form has a real practitioner
in the wild:

> "In general it helps to know the general direction/degree of qibla. For example for me qibla is
> around 25 minutes on a clock. Not directly South but pretty close. 25 minutes when you would put
> a full hour to North, 15 minutes to East, 30 minutes to South, 45 minutes to West. Like that you
> can memorize both the direction and also how to find it from a map or such." (u/mandzeete,
> r/islam, 2022,
> https://www.reddit.com/r/islam/comments/yk8ib0/anyone_know_of_an_accurate_qibla_app/)

This is a memorised instruction, derived once from a map, and then re-applied with the sun. It is
not a primary presentation; it is what users build FOR themselves after a successful map read. It
belongs in the product as the caption under the map line, not as the interface itself.

**The compass dial as it ships.** Two sessions of correct code and a 30-degree unobservable error.
The screen states a number that is arithmetic and true, and a needle that can be wrong by more
than the width of the marker band, with the room's steel as the cause and nothing on screen as the
witness (session 40 `LOG.md`). The dial fails the brief's single test: it gives the user nothing to
check the needle against.

**AR camera view.** Google's Qibla Finder "paint[s] a clear blue line within the imagery your
phone camera sees" (Google blog, 2017,
https://blog.google/intl/en-mena/company-news/inside-google/2017_06_qibla-finder/). Does it need
the magnetometer? Google's own help page answers:

> "Qibla Finder works with your device's compass. To make sure that the direction is as accurate
> as possible, we recommend calibrating your compass before using."
> (https://support.google.com/faqs/answer/7364753?hl=en)

So yes: the AR overlay is a compass reading wearing a camera's clothes. On iOS the equivalent is
ARKit's `.gravityAndHeading` world alignment, which is fed by CoreMotion's true-north heading,
which is the magnetometer; a Stack Overflow answer on ARKit true-north accuracy reports it
"usually comes in to be within 5-10 deg" (question 50781650, read via search snippet, UNVERIFIED
beyond the snippet). This defeats the purpose: it relocates the dial's exact failure into a
presentation that looks MORE trustworthy, not less. One more quote belongs here, from a user
testing apps inside the Haram itself:

> "I actually tried some of these apps standing in the Haram, facing Kaaba few feet away and the
> apps got it wrong. So Idk." (u/814T, r/islam, 2025,
> https://www.reddit.com/r/islam/comments/1imq97s/qibla_apps_in_north_america_i_am_confused_please/)

The most convincing presentation and the least checkable one. Rank 8 is earned.

**The sun as the reference.** The strongest of the sensor-free references. Twice a year the sun
culminates over the Kaaba and every shadow on the sunlit hemisphere points along the qibla; twice
more it passes the antipodal point and shadows point the other way along the same line. The
published instants: 27/28 May 09:18 UTC and 15/16 July 09:27 UTC for the zenith events, and 12 to
14 January 21:30 UTC and 28/29 November 21:09 UTC for the antipodal events. Observations within
five minutes, and one or two days either side, carry negligible deviation
(https://en.wikipedia.org/wiki/Qibla_observation_by_shadows). IslamicFinder's own methods article
publishes the same dates (https://www.islamicfinder.org/news/how-to-find-the-qibla-direction/).
The daily form (the moment each day when the sun crosses the great circle through your position
and the Kaaba) is computable offline and is brief question 4's territory; recorded here because
the enumeration asks for it. Its error profile is the inverse of the dial's: no sensor can corrupt
it, but the user must be able to see the sun and must transfer an angle by eye outside the four
transit windows. Note the coverage hole: the zenith events are not observable in the hemisphere
opposite the Kaaba, which includes most of the Americas and Australia; the antipodal events fall
there at night for the Americas (Wikipedia, same page).

**Static diagram.** The American Surveyor article records the pre-smartphone form of this: pocket
qibla compasses shipped with booklets of index numbers per city, "updated every 10 years to
account for the annual changes in magnetic variation"
(https://amerisurv.com/2010/09/25/not-what-but-where-is-qibla/). A screenshot or print of the map
line is the same artifact. For a fixed prayer room it is entirely verifiable at draw time and
then trusted. Its weakness is that a printed line does not follow the user to a new room.

---

## 2. The rotation problem

### 2.1 What is up

Two options exist for orienting the map:

- **North-up.** The map never turns. The qibla line is a fixed geometric object on it. No sensor
  is needed to draw it or to keep it drawn. The user performs the alignment between the map and
  the world in their head.
- **Heading-up / track-up.** The map rotates so the user's facing direction is always up. This
  needs a heading. Indoors, that heading is the magnetometer, which is the broken thing
  (session 40). Track-up does not escape the sensor failure; it re-subscribes to it at 60fps.

**A north-up map is the only orientation that removes the magnetometer from the picture entirely.**
The cost is a documented cognitive one, and the literature on it is real and consistent.

### 2.2 The HCI literature, cited

The framing used by current work: when the map's world-centred reference frame (WRF) does not
match the user's ego-centred frame (ERF), errors rise, because the user must mentally transform
one into the other (Savino et al., "Evaluating route preview as an alternative to turn-by-turn
navigation in pedestrian mobility", PMC13008247, https://pmc.ncbi.nlm.nih.gov/articles/PMC13008247/).
That paper's related-work section carries the chain cleanly:

- **Aretz and Wickens (1990)**: the transformation happens in two stages, first rotate the map so
  its top matches the forward direction, then tilt it 90 degrees to match the forward view. A
  forward-up map eliminates the first rotation. (As cited in PMC13008247, section 2.2.)
- **Wickens et al.**: error rate on a tracking task was substantially lower with rotating
  (aligned) maps than fixed maps. (Same source, same section.)
- **Rodes and Gugerty (2012)**: with a track-up map, participants performed better on cardinal
  direction and route-following tasks; the north-up map won on map reconstruction. PubMed abstract
  at https://pubmed.ncbi.nlm.nih.gov/22908682/ (page fetch is bot-blocked; abstract read through
  search snippet, wording verified against the PMC citation of the same study).
- **Park 2024** (40 participants, virtual maze): map orientation interacted with cognitive style.
  Field-dependent participants showed higher angular error with north-up maps; field-independent
  participants showed no significant difference on the pointing task
  (https://www.mdpi.com/2076-3417/14/10/4012).
- The older aviation literature agrees on the split: track-up superior for local guidance, north-up
  superior for global situational awareness ("Which Way Is Up?", Flying Magazine, 2022,
  https://www.flyingmag.com/which-way-is-up-2/, summarising 1980s and 1990s studies).
- The foundational statement for you-are-here maps is **Levine's alignment principle**: a map is
  easiest to use when "up" on the map matches the user's forward heading, and misaligned maps
  produce predictable, systematic rotation errors (Levine, "You-Are-Here Maps", 1982,
  https://www.semanticscholar.org/paper/You-Are-Here-Maps-Levine/825db54811d7f1bee6f56d598c7e395d76d12231;
  Levine, "The placement and misplacement of you-are-here maps", 1984, abstract at
  https://search.proquest.com/openview/fb44ec6988d56026f5dde0b4fb99af83/1.pdf). Montello's review
  states the aligned condition precisely: a YAH map is aligned when the up direction on the map
  represents the viewer's heading (Montello, "You Are Where? The Function and Frustration of
  You-Are-Here Maps",
  https://people.geog.ucsb.edu/~montello/pubs/YAH.pdf; PDF fetch failed, claim read through the
  paper's own abstract and the ResearchGate listing,
  https://www.researchgate.net/publication/228508765).

### 2.3 What this means for a qibla map

The literature's headline (aligned maps are easier) is true and is the honest cost of going
north-up. Three things qualify it for this specific task:

1. **The task is not route-following.** Aretz's ERF advantage belongs to continuous guidance
   tasks. The qibla user is stationary and performs one alignment act, once, against a street they
   can see. The relevant skill is the one costofanarchy described: matching the line to
   "Suchandsuch Street", which is a feature-matching act more than a rotation act.
2. **Track-up needs a heading even when standing still.** There is no track for a stationary user;
   the only source of "which way the user faces" is the compass. The alternative, letting the user
   rotate the map by hand until it matches their room, is possible (Google Maps supports two-finger
   rotation) but then the app has stopped telling them anything; the user's own rotation is the
   claim, unchecked.
3. **The cost is asymmetric and visible.** A mental-rotation error makes the user face a few
   degrees off, bounded by how badly they can misjudge their own street. A sensor error indoors is
   30 degrees and invisible. Park's result is the strongest counter-evidence (field-dependent users
   pay a real angular penalty under north-up), and it is why the caption instruction from section
   1.2 matters: give the angle against the street explicitly so the rotation is not left entirely
   in the head.

**Answer to the brief's question: the map does escape the sensor failure, but only in north-up
form, and it relocates the failure into the user's head as a small, bounded, self-correctable
alignment error.** The user who walks to their window and checks the line against the road outside
is performing Levine's alignment with the world as the reference, which is exactly the check the
dial never offered.

---

## 3. Competitor teardown

Sizes are the store-listed figure for the US storefront, fetched 2026-09-29 or 2026-09-30 unless
noted. "Offline" means the qibla feature works without network, as the listing or support docs
state it, not as verified on a device.

| App | Interaction | Map? | Offline? | Store-listed size |
| --- | --- | --- | --- | --- |
| Muslim Pro | Compass dial, AR mode, distance to Makkah | AR through camera; map in the nearby-places feature, not the qibla itself | Compass needs location (network or GPS); no offline claim for qibla | 324.6 MB iOS (fetched); ~98.5 MB Android per Aptoide, third-party figure |
| Athan (IslamicFinder) | Compass dial; map view offered as verification | Yes, optional map view of the line | No offline claim found | 301 MB iOS (fetched); 10M+ downloads on Play |
| Pillars | "Smart Qibla" compass with "integrated smart calibration" | No map found in listing or reviews | No offline claim found | 171.2 MB iOS (fetched) |
| Google Qibla Finder | AR blue line on Android camera; map line on desktop | Yes, map is the desktop form | No, it is a web app, needs the network | Not an installable app; ~0 MB on device |
| Qibla Finder 100% (Muslim Assistant) | Map with line as PRIMARY, compass secondary, AR mode added later | Yes, primary | "You do not need internet to see where the Qibla is... even on offline mode with the help of its compass feature"; changelog: "opens the compass when you're offline" | 110.6 MB iOS (fetched) |
| Qibla Connect | Compass dial | No map found | No offline claim found | UNVERIFIED (listing read via snippet, https://play.google.com/store/apps/details?id=com.quranreading.qibladirection) |
| umma (com.muslim.android) | "GPS-based Qibla finder" per listing | UNVERIFIED | UNVERIFIED | UNVERIFIED (listing read via snippet, https://play.google.com/store/apps/details?id=com.muslim.android) |
| Muwaqqit | Users report it "superimposes the qibla on a map" | Yes, per two independent user reports | UNVERIFIED | Web service plus mobile app, size UNVERIFIED (https://www.muwaqqit.com/) |
| qiblafinder.org (independent) | Live compass OR map tab with the line; satellite and OSM layers | Yes | No, it is a website on Google Maps | Not applicable |

Per-app notes:

### 3.1 Muslim Pro

The largest of the category. Its support docs describe a compass that can show "Unknown accuracy",
an infinite-loop figure-8 recalibration screen, and interference advice, and they make the user
hold the phone flat ("Keep the device flat on a table or on the floor")
(https://support.muslimpro.com/help/es/articles/how-to-access-qibla-on-muslim-pro-app). The
listing on the US App Store (fetched, version 17.9) sells "Instantly find your prayer direction
using your phone's compass". The qibla is a compass, with an AR mode per the Just Pray roundup
(https://justprayapp.co/blog/best-qibla-finder-app). No map-based qibla. The support doc's
geo-location section tells users to "Be connected to a data network (through wifi or mobile data)
or be standing outside in order to obtain a clearer GPS fix", which stops short of claiming the
qibla works offline.

### 3.2 Athan by IslamicFinder

Compass-first. The Just Pray roundup notes "the option to view the direction on a map. The map view
is particularly helpful when you want to verify the direction by seeing the line from your
location to Makkah" (https://justprayapp.co/blog/best-qibla-finder-app). That a compass-first app
ships a map view as the verification path is evidence for the brief's thesis from inside the
category leader. The IslamicFinder website's own Qibla Finder tool is map-and-pin based
("Simply drag and drop the pin to your current or desired location",
https://www.islamicfinder.org/Qibla-Direction/). The app's listing instructs users to "rotate your
phone and make an 8 in the air in order to get accurate Qibla direction" (fetched from the US App
Store listing). A Reddit user reports the direction changing daily on Athan (section 4).

### 3.3 Pillars

The community's trust leader, on evidence. Recommended twice unprompted in the threads fetched:
"Pillars." (u/WookieEatsHobbit, 2022) and "use Pillars" plus "Was going to say this, always right,
I double check against Google and it's correct, others just aren't consistently correct"
(u/Fatboyonadiet4lyf, 2024), both in
https://www.reddit.com/r/islam/comments/1g21km2/i_have_qibla_compass_but_every_hour_shows/. Its
listing claims "Smart Qibla - find the correct direction to pray with our Qibla and integrated
smart calibration feature" (https://apps.apple.com/us/app/pillars-prayer-times-qibla/id1559086853).
What "smart calibration" does is UNVERIFIED; the listing does not describe it. No map. 171.2 MB on
a feature set closest to this app's own scope, versus our 67 MB APK baseline (brief, section 2).

### 3.4 Google's Qibla Finder web experiment

Exactly what it does and whether it still exists, as the brief asks:

- Launched 11 June 2017 by Google MENA as a browser web app, "uses the latest in augmented
  reality to paint a clear blue line within the imagery your phone camera sees" on Android, with a
  non-AR experience elsewhere
  (https://blog.google/intl/en-mena/company-news/inside-google/2017_06_qibla-finder/).
- It still exists: `qiblafinder.withgoogle.com` resolves and redirects to
  `/intl/en/desktop`, "Locate the Qibla, wherever you are" (fetched 2026-09-29).
- Its calculation is the great circle: "the most direct route between two points on the globe,
  also known as the great-circle distance... calculated using the haversine formula. When viewed
  on a flat map, the line can sometimes appear bent due to the curvature of the earth"
  (https://support.google.com/faqs/answer/7364753?hl=en).
- It relies on the device compass and recommends calibration before use (same page, quoted in
  section 1.2).
- It won a Mobile Lynx Grand Prix at the 2019 Dubai Lynx festival
  (https://www.youtube.com/watch?v=ueDGVcfY4qs).
- It requires the network: it is a web page. A user verdict from launch week: "Slmz, to confirm it
  works in South Africa. Tested at work and at home at it pointed correct." (u/narikov, 2017,
  https://www.reddit.com/r/islam/comments/6gyz5o/google_qibla_finder_apparently_google_can_help/)

**The design warning buried in its help page.** "The line can sometimes appear bent" is Google
acknowledging the projection problem. An app that instead draws a STRAIGHT line from the user to
Makkah on a Web Mercator map is drawing the rhumb line, and the rhumb line is not the qibla.
Computed here, London to Kaaba: great circle 118.99 degrees, rhumb 133.83 degrees, a gap of
**14.84 degrees**. New York: great circle 58.48, rhumb 101.28, a gap of **42.80 degrees**. A user
of Qibla Finder 100% filed a store review making exactly this complaint:

> "It seems the app calculates the Qibla direction using a straight, two-dimensional line on a
> flat map rather than accounting for the Earth's round shape. This results in an inaccurate
> direction for the Qibla, as the shortest path between two points on a sphere is a curved line
> (the great circle route)." (DavidRuth21, App Store review, Qibla Finder 100%,
> https://apps.apple.com/us/app/qibla-finder-100-%D8%A7%D8%AA%D8%AC%D8%A7%D9%87-%D8%A7%D9%84%D9%82%D8%A8%D9%84%D8%A9/id1444860666)

Whether that app truly draws a rhumb line is UNVERIFIED; the review's existence is the
evidence, because the map is what made the bug VISIBLE to a user. A dial can hide a 14-degree
projection error forever; a line on a street map cannot.

The companion computation, also run here: a SHORT ray drawn at the great-circle initial bearing
stays true locally. Over 1 km the true bearing drifts 0.010 degrees in London and 0.007 in New
York; over 5 km, 0.049 and 0.033. **Design rule: draw a short local ray at the initial bearing,
never a long straight line to Makkah.**

### 3.5 Qibla Finder 100% (Muslim Assistant / CNT Interaktif)

The closest shipped thing to the brief's hypothesis, and the developer's own response to the
complaint above is the most honest sentence any competitor has written:

> "For better results, we show the Kaaba on the map using the line method. Again, even if your
> compass sensor rotates too much, you can confirm 100% which side of the building you are on is
> the qibla. Accordingly, you should find the most accurate qibla by comparing." (Developer
> response, same App Store page)

That is the map thesis in a competitor's words: the map survives a spinning compass because the
user compares. Its changelog shows the fallback routing: "The app now picks the best map view for
your device and connection, and opens the compass when you're offline" (same page). So the map
needs the network and the compass is the offline path, which inverts our constraint: for THIS app
the map must be offline and bundled, and the compass becomes the fallback. 110.6 MB with maps
onboard (iOS, fetched).

### 3.6 Qibla Connect, umma, and the top-rated compass-only apps

- Qibla Connect: compass-based; one user reports verifying it against their mosque: "I use Qibla
  Connect which I find extremely reliable, Allahamdulliah. I have tested it out in my local mosque
  and it points exactly where the mosque is directed." ([deleted user], r/islam, 2015,
  https://www.reddit.com/r/islam/comments/3hyhm8/do_you_use_apps_to_find_the_direction_of_qibla/).
  Another: "Qibla Connect is a good app imho" (2022,
  https://www.reddit.com/r/islam/comments/yk8ib0/anyone_know_of_an_accurate_qibla_app/).
- umma (Play, com.muslim.android): listing text says "GPS-based Qibla finder"
  (https://play.google.com/store/apps/details?id=com.muslim.android, read via snippet). What its
  qibla screen shows is UNVERIFIED.
- Top-rated compass-only apps on the stores advertise the offline property this project needs, via
  the compass: "Qibla Compass still works even if there's no internet or a weak connection"
  (Qibla Finder - Qibla Compass, Play listing,
  https://play.google.com/store/apps/details?id=qibladirectioncompass.qiblafinder.truenorthcompass,
  read via snippet) and "Even without internet" (Qibla Direction finder Offline, Play listing,
  https://play.google.com/store/apps/details?id=com.kingapps.qiblacompas, read via snippet). A
  compass needs no network, so the claim is plausible and the accuracy remains the dial's.
- SimplyQibla, an open-source app built by a Reddit user out of frustration: "I got tired of
  getting wrong compass direction and ads in simple Qibla apps, so I built my own open-source
  'SimplyQibla'." (https://www.reddit.com/r/Izlam/comments/1fjycl5/, read via snippet; title
  verbatim, emoji stripped from the quote).

---

## 4. What users complain about

Recurring reports, with verbatim quotes and attribution. Three threads were fetched in full; others
were read via snippets and are marked.

### 4.1 "The needle spins / it changes every time"

> "Hello I use qibla compass to find the direction to Mekka to pray in the direction but every
> hours it shows different directions" (u/Far-Mathematician122, r/islam, 2024,
> https://www.reddit.com/r/islam/comments/1g21km2/i_have_qibla_compass_but_every_hour_shows/)

> "Every day the qibla changes on the app, I'm using athan" (u/[deleted], r/islam, 2025,
> https://www.reddit.com/r/islam/comments/1ihg565/what_to_do_when_the_qibla_direction_in_my_app/,
> read via snippet)

> "The qibla app on my phone rotates the direction of the qibla when I rotate my phone on the
> ground. Am I misunderstanding how these compasses..." (r/islam, 2017,
> https://www.reddit.com/r/islam/comments/6ydiol/am_i_using_qibla_apps_wrong/, read via snippet)

> "Mine can easily become uncalibrated in a matter of seconds, and I can have it suggest North is
> one way, then a few seconds later North is another way." (u/costofanarchy, r/islam, 2015,
> https://www.reddit.com/r/islam/comments/3hyhm8/do_you_use_apps_to_find_the_direction_of_qibla/)

> "I've been praying but the qiblah keep changing on all the apps I have tried." (Quora question
> title, https://www.quora.com/I-ve-been-praying-but-the-qiblah-keep-changing-on-all-the-apps-I-have-tried-Are-there-any-suggestions-on-finding-the-correct-Qibla-and-is-my-Salah-accepted-if-I-ve-prayed-in-the-direction-my-app-suggested,
> read via snippet)

Session 40's physics explains these reports exactly: a position-dependent magnetic field produces
a reading that changes when the phone moves between rooms, and none of it is the user's
misunderstanding.

### 4.2 "It points the wrong way"

> "the app said the Qiblah was behind me, so I turned around and tried it again and it still said
> the Qiblah was behind me" (u/tyfa3, r/islam, 2015,
> https://www.reddit.com/r/islam/comments/3hyhm8/do_you_use_apps_to_find_the_direction_of_qibla/)

> "I found out that the qibla is inaccurate. If it is supposed to be at twelve o'clock, then using
> the app it is said to be at 12.03." (Facebook post on Sheikh Assim Alhakeem's page, read via
> search snippet only, UNVERIFIED beyond the snippet,
> https://www.facebook.com/SheikhAssimAlhakeemTeam/posts/app-shows-the-wrong-qiblah-there-are-no-muslims-around-to-help-assim-al-hakeem/1459727322864687/)

### 4.3 "It disagrees with my mosque"

> "I was in masjid and realized the qibla that the apps I use give is not the same as the one in
> masjid, obviously I thought it was a problem with my phone. I tried a bunch of Qibla apps, most
> of them give Qibla around North-East, but some of them give the Qibla by using Geographic
> location instead of just relying on compass. The later one gives Qibla between South and East,
> close to East." (u/Chamrockk, r/islam, 2025,
> https://www.reddit.com/r/islam/comments/1imq97s/qibla_apps_in_north_america_i_am_confused_please/)

This thread is the North America great-circle confusion in the wild, and the community's answers
were unanimous that the north-easterly (great-circle) reading is correct and the south-easterly
one comes from flat-map reasoning: "NE is the correct one.." (u/shan_bhai). One reply explains the
mosque disagreement itself:

> "It is unfortunately a problem in some communities that their masjid are oriented towards the
> wrong qibla for whatever reason, sometimes it's because you can fit more people in the room if
> you face a certain way, I've seen this before." (u/Typical_Cut_8497, same thread)

Which is why section 6 treats the mosque as a reference, not a truth.

### 4.4 "It is wrong even in front of the Kaaba"

> "I remember seeing a picture (probably posted on here) of a brother standing in fornt of Ka'bah
> with one of those apps on and it was pointing somewhere else" (u/tyfa3, 2015, same thread)

> "Standing right in front of the Kaaba... we decided to test Qibla" (Instagram reel caption, read
> via snippet, UNVERIFIED beyond the snippet,
> https://www.instagram.com/reel/DN3Z7sqWItw/)

Near Makkah the bearing is hypersensitive to position (P0's error budget: Jeddah moves 0.83
degrees per kilometre of position error), and the room-steel problem does not care how holy the
coordinates are. The category's most-shared failure image is this one.

### 4.5 "It needs internet"

Present as a listing claim more than as a complaint: users WANT it (the offline-claiming apps in
section 3.6 advertise it), and one Qibla Finder 100% reviewer was stranded by a paywall while
overseas on low internet ("it asked me to pay for a subscription. Wish they let you know about
that part in the app description", u/Leethetraveller, same App Store page). No fetched thread
framed network dependence itself as the primary qibla complaint; the dial's instability is the
loudest theme everywhere.

### 4.6 Which presentation users say they TRUST

From the fetched threads, in order of how often they appear:

1. **The map line, checked against surroundings.** yuskan's Google Maps method, QNUA_LEGEND's
   Google Earth ruler method ("Best way for me is using Google Earth", with five numbered steps
   ending "compare the map and your surroundings"), costofanarchy's "I find this method
   trustworthy, as long as you can verify what's around you", and kible-yonu: "Instead of mobile
   applications, you can use online maps to find the qibla direction of your location. It is both
   accurate and reliable."
2. **The local mosque.** "You can also use nearby mosques as guides" (u/Flat_Ad_4669). The
   Qiblafinder.org FAQ treats it as the first practical method: "one of the most practical ways to
   determine the Qibla is to ask someone who knows the Qibla direction or use the direction of a
   local mosque as a reference" (https://www.qiblafinder.org/).
3. **A named app cross-checked against another source.** Pillars, "always right, I double check
   against Google and it's correct". The Just Pray roundup generalises the habit: "Use multiple
   apps to cross-verify if you are unsure. If two or three apps agree, you can be confident in the
   direction" (https://justprayapp.co/blog/best-qibla-finder-app).
4. **The sun.** TruthSeekerWW's satellite-dish trick ("look for satellite dishes as they are a good
   indicator"), mandzeete's afternoon-sun method, and the Amerisurv surveyor's note that the shadow
   method is the centuries-old check on compass work.
5. **A physical compass.** "You can always use an old school compass. The physical one you can buy
   from a camping store... From Google Maps and such you can find out the correct degree/direction,
   memorize it or mark on your compass" (u/mandzeete), and the Suunto clipper owner:
   "It is my go to to find the qiblah anywhere I am. You just have to know the bearing of the
   qiblah relevant to your country."

The pattern across all five: **users trust references they can see or walk to, and they trust the
map because it is the thing that tells them the number to carry to those references.** Nobody in
any fetched thread says they trust the dial on its own.

---

## 5. The honesty question

Session 37's principle: the screen is honest about the needle and never about the number. What do
shipping apps do, and which of it is honest?

| App | What it shows | Honest or theatre |
| --- | --- | --- |
| Muslim Pro | "Unknown accuracy" state; interference advice ("stay away from metallic and magnetic interferences"); the figure-8 loop screen; "keep the device flat" | Partly honest. Naming interference is honest. The figure-8 as a FIX is partly theatre: calibration corrects a soft-iron offset, it does nothing about a position-dependent field, which is the 30-degree case. Telling users the phone "has not been able to detect your location" when the compass reads "Unknown accuracy" conflates two different failures. |
| Athan (IslamicFinder) | Listing instructs the figure-8 ("rotate your phone and make an 8 in the air in order to get accurate Qibla direction") | Theatre-leaning. The instruction promises accuracy from a ritual. |
| Mawaqit | Ordered recovery ladder: remove metal cases, force-stop, figure-8, restart, reinstall | Mostly ritual. Reinstalling cannot fix a magnetometer reading a distorted room. Reasonable as triage, dishonest as a promise. (https://help.mawaqit.net/en/articles/6934824) |
| Pray Watch | "The app uses information from the built-in Apple compass, so if the qibla is wrong then it's most likely coming from the phone or watch itself" plus steps to recalibrate | Honest about the mechanism, deflection-adjacent in framing. It names the true source (the device compass) rather than claiming the app is right. (https://praywatch.app/help/articles/qibla-direction-wrong/) |
| Qibla Finder 100% | Name promises "100%"; "real-time accuracy indicator"; "so you never have to second-guess where the Qibla is" | Theatre. From London the Kaaba subtends 0.47 arcseconds (P0's budget); "100%" is not available to anyone on Earth outside Makkah, and "never second-guess" is the exact opposite of what a qibla tool owes the user. The same developer's support response (section 3.5) is honest, which makes the marketing the theatre. |
| Google Qibla Finder | "We recommend calibrating your compass before using" | Honest and minimal. One line, no promise, names the dependency. |
| Pillars | "integrated smart calibration feature" | UNVERIFIED what it does; the words alone are neither honest nor theatre. |

The honest pattern this project already ships is stronger than every row above: `isFieldTrustworthy`
checks the measured field against Earth's 25 to 65 uT band and warns on physics, not on a
confidence score (session 40). Session 40 also recorded why the alternative is theatre: the Find X8
reported accuracy band 3 (HIGH) while 71 degrees wrong, and band 0 (UNRELIABLE) while its field was
correct. **Any accuracy indicator driven by the platform's accuracy API is theatre, and the
category ships several.**

The transferable rule from the evidence: honest uncertainty communication names the CAUSE and the
CHECK, never a percentage. Google's single calibration line, Pray Watch's "it is the phone's
compass", and the Qibla Finder 100% developer's "you can confirm... by comparing" all point the
user at something they can act on. An accuracy cone or percentage points the user at nothing.

---

## 6. The mosque cross-check

### 6.1 Is there an offline dataset of mosque locations

Yes, and it is OSM. Real counts, from the taginfo API on 2026-09-29 (data_until 2026-09-29):

| Tag | Objects | Source |
| --- | --- | --- |
| `amenity=place_of_worship` (all religions) | 1,624,055 (1,013,813 ways) | https://taginfo.openstreetmap.org/api/4/tag/stats?key=amenity&value=place_of_worship |
| `religion=muslim` | 339,252 (112,784 nodes, 224,662 ways) | https://taginfo.openstreetmap.org/api/4/tag/stats?key=religion&value=muslim |
| `building=mosque` | 109,551 (101,443 ways, so mostly outlines) | https://taginfo.openstreetmap.org/api/4/tag/stats?key=building&value=mosque |
| `religion=muslim` + `amenity=place_of_worship` | 290,005 | https://taginfo.openstreetmap.org/api/4/tag/combinations?key=religion&value=muslim |
| `religion=muslim` in Great Britain (Geofabrik extract) | 1,679 | https://taginfo.geofabrik.de/europe:great-britain/tags/religion=muslim |
| `building=mosque` in Great Britain (Geofabrik extract) | 229 | https://taginfo.geofabrik.de/europe:great-britain/tags/building=mosque |

London-first reading of those numbers: global coverage is substantial (290k places of worship
tagged muslim, 95k with building outlines), and the GB extract's 1,679 objects is thin against the
real mosque population of a country with a mosque in most postcodes. Coverage in Britain is
partial; a London-bounded extract would need measuring before the feature promises anything, and
that measurement belongs to R1's extract work. UNVERIFIED at borough resolution.

Data size: a points-only extract (name, lat, lon) of 290k mosques is on the order of a few
megabytes; an outline extract is larger. R1's brief covers real measurement; recorded here as an
estimate, not a figure.

### 6.2 Does OSM record building orientation

**No.** The `direction` key exists (5,395,565 uses overall, overwhelmingly on nodes: 5,328,521
nodes against 57,601 ways; https://taginfo.openstreetmap.org/api/4/key/stats?key=direction), and
its documented meanings are the facing of benches, viewpoints, cave entrances, traffic signs and
roof ridges (https://wiki.openstreetmap.org/wiki/Key:direction). The mosque-tagging wiki pages
(`building=mosque`, `amenity=place_of_worship`, `religion=muslim`) document no orientation or
qibla tag and none is proposed
(https://wiki.openstreetmap.org/wiki/Tag:building%3Dmosque). Decisive check: `direction` does not
appear anywhere in the top 108 keys co-occurring with `religion=muslim`
(https://taginfo.openstreetmap.org/api/4/tag/combinations?key=religion&value=muslim), a list that
reaches down to keys co-occurring on ~1,000 objects. Mosque orientation is, for practical
purposes, untagged.

What OSM DOES carry, for the 101k ways tagged `building=mosque`, is the outline itself: the
building's geometry, from which the prayer-hall axis is readable by a human looking at the map, and
computable if a renderer draws it. That is geometry as orientation, not data as orientation, and it
is exactly what a drawn mosque footprint gives the user on the qibla map.

### 6.3 Are mosque orientations trustworthy

No, not unconditionally, and the evidence is specific:

1. **Some mosques are oriented wrong, deliberately or accidentally.** u/Typical_Cut_8497's report
   (section 4.3) names the pragmatic cause. The North American south-east controversy is a live
   scholarly dispute with its own fatwa literature ("the qibla in the United States is
   definitively north to northeast",
   https://daruliftaa.us/fatwa/366/; "The common misunderstanding of praying to the Southeast is
   based on the use of a map",
   https://raleighmasjid.org/fiqh/prayer-salah/is-the-qibla-in-north-america-north-east-or-south-east-2/).
2. **Orientations get surveyed and argued about professionally.** The Washington DC mosque "faces
   North 56 degrees, 33 minutes and 15 seconds East. It has been proven correct in its
   alignment", and the same article's author was hired to orient a new Tennessee mosque with a
   transit after a pocket qibla compass proved insufficient
   (https://amerisurv.com/2010/09/25/not-what-but-where-is-qibla/). A surveying journal exists for
   this problem because the pocket compass version of it was not good enough.
3. **The scholarly literature measures the spread.** A figure from the mosque-orientation
   literature reports "2% of the mosques are outside the Qibla direction" (ResearchGate figure
   caption, read via snippet, UNVERIFIED beyond the snippet,
   https://www.researchgate.net/figure/The-range-of-the-actual-mosque-orientations-coloured-section-and-accepted-qibla_fig2_257156237).
   Even taken as indicative, 2 in 100 is a real error rate for a ground-truth claim.

### 6.4 Could "your nearest mosque is 400 m north-east and faces this way" be a checkable reference

**Yes, and users already do the manual version** ("You can also use nearby mosques as guides";
Qibla Connect's user tested the app against the mosque; Qiblafinder.org lists the mosque as a
primary method). The honest form of the feature:

- **Distance and direction to the nearest mapped mosque: checkable.** The user can walk there or
  see it on the map against their street. This part is a reference, not a claim.
- **The mosque's own orientation: drawable where OSM has the outline, otherwise absent.** Where the
  outline exists, drawing it next to the qibla ray lets the user SEE both lines and notice the
  disagreement, which is information, not error. Where only a node exists, the app must not
  fabricate an orientation; a point tells you where the mosque is, not which way it faces.
- **Never present the mosque as the truth.** A mosque line disagreeing with the qibla ray can mean
  the mosque is oriented to a different qibla convention (south-east camp in North America), a
  pragmatic reorientation, or an app bug. The screen's job is to show both and let the human judge,
  which is the row's whole philosophy applied twice.

---

## 7. Verdict

**Ranking by error-catchability** (restating the table at section 0):

1. North-up street map with qibla ray (error visible against the street)
2. Satellite imagery with ray (same, heavier)
3. Mosque position and outline on the same map (visible, second reference, orientation never
   claimed)
4. The sun at qibla time (fully visible, availability-limited)
5. Static diagram (visible, place-frozen)
6. Text-plus-landmark instruction (partly visible, depends on the user's landmarks)
7. The compass dial (invisible error, 30 degrees measured)
8. AR overlay (invisible error wearing a camera's credibility)

**Build rank 1, with 3 drawn on it and 4 offered as the cross-check.** Concretely:

- **North-up, always.** The map never asks the sensor for anything. The rotation cost is real
  (Levine; Aretz and Wickens; Rodes and Gugerty; Park) and is paid once per user per room, against
  a street they can see, which is the cheapest place it can be paid.
- **Draw the qibla as a short local ray at the great-circle initial bearing.** It drifts 0.010
  degrees over the first kilometre in London (computed here). Never draw the long straight line to
  Makkah on Mercator: that is the rhumb line, wrong by 14.84 degrees in London and 42.80 in New
  York, and a shipped app has already been caught at it by a user who could only catch it BECAUSE
  it was on a map.
- **Keep the bearing number on screen** (119 degrees from north, as the sheet already states). It
  is arithmetic, it is exact, and it is the number users like mandzeete and the Suunto owner carry
  to a physical compass. Honest about the number, per session 37.
- **Draw OSM mosque outlines where they exist, as outlines, with no orientation arrow.** The
  disagreement between the mosque axis and the qibla ray is the user's to see, not the app's to
  resolve.
- **Caption the line with the street-relative instruction** ("the line runs across your road at
  about x degrees to the kerb" or the clock-face form users already invent), because Park's
  field-dependent users pay the north-up penalty precisely when the rotation is left entirely in
  the head.
- **Offer the sun check** (the four annual instants are globally fixed and need no sensor; the
  daily qibla time is computable offline) as the thing the user can verify the MAP against. It is
  the only reference in this report that no sensor and no dataset can corrupt.
- **Keep the dial as the secondary view**, with the interference warning, for the user outdoors on
  open ground where the fused sensor measured 9.7 degrees. The sensor work of sessions 37 and 40
  stands; it stops being the only door.

The map is the right answer, on the evidence: it is the only presentation in the category that
users already trust, already built for themselves out of Google Maps and Google Earth, and the
only one whose errors are visible to the person about to pray. Google, IslamicFinder, Muwaqqit and
Qibla Finder 100% have all converged on some form of map line; the gap in the market is the same
as this app's constraint: one that works with the network off.

---

## What I attacked in my own conclusion

- **The HCI literature argues AGAINST me, and I read it anyway.** The headline of Levine, Aretz and
  Wickens, Rodes and Gugerty, and Park is that aligned maps beat north-up maps, which is an
  argument for track-up, which needs the broken magnetometer. I tested whether north-up's rotation
  cost could swallow the map's advantage: the cost is a few degrees of body-angle error, bounded
  and self-correctable against a visible street; the dial's indoor cost is 30 degrees and
  invisible. Park's field-dependent result is the strongest counter and it moves real users from
  6.2 to perhaps 8 or 9 degrees of RSS error, which still loses to 30. The conclusion survives,
  with the caption instruction recorded as the mitigation rather than hand-waved away.
- **I checked whether the map merely relocates the sensor failure.** In heading-up form it does,
  and I ruled that form out on the same evidence the dial failed on (Google's own help page names
  the compass dependency for its AR). Only the north-up map escapes; the report says so narrowly
  rather than claiming "the map" escapes.
- **I looked for the map being caught wrong, and found it.** The rhumb-line complaint against Qibla
  Finder 100% is a user catching a projection bug through the map, which I first treated as a risk
  to the thesis and then recognised as its strongest support: the same bug on a dial is
  uncatchable. It also produced the report's one hard design rule, quantified by computation.
- **I attacked the mosque cross-check hardest, because it looked like free ground truth.** It is
  not: OSM records no orientation tag (verified down the combinations list), only 229 building
  outlines in all of Great Britain, and the orientations that exist in the real world are
  measurably fallible (2% in one study, the whole North American south-east controversy, and a
  surveying article that exists because pocket compasses were not good enough to orient mosques).
  The verdict draws mosques as a reference and never as a truth, which is a weaker feature than
  the one I expected to ship.
- **I questioned whether the user quotes generalise.** Reddit r/islam is self-selected
  map-literate. The counterweight is that the complaints come from the same population and the
  same threads: the people who complain the dial spins are the people who solved it with Google
  Maps. The population that cannot read a map exists but is absent from every thread, and no
  published study of qibla-app usability exists to fill the gap; that is marked as a hole rather
  than papered over.
- **I tried to kill the sun recommendation.** Its availability windows are narrow (four instants a
  year for the zero-angle form, weather- and night-limited), and the daily form needs an ephemeris
  and an angle transfer. It survived as the CROSS-check rather than the primary, which is the
  honest place for it; R2's report owns the full evaluation.
