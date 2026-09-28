# Round 2, agent 2: honest copy, permissions, and what needs scholarly sign-off

Returned 2026-09-28. Dispatched because round 1 established the governing principle (the number is exact,
the needle is not) and the fiqh constraint (never imply a prayer was invalid), which together demand
careful wording.

**This report is the most directly shippable of the seven.** It ends with proposed copy per screen state
and, critically, **flags four items as religious claims needing approval rather than product decisions.**

Planner's ruling in `RESEARCH.md` section 15.

---

## 1. Permission copy

### Real purpose strings from this category

| Source | String |
| --- | --- |
| GeoQibla (KMP library docs) | "GeoQibla uses your location to calculate the direction of the Qibla." |
| `islamic_kit` (Flutter) | "This app needs access to location to provide accurate prayer times and Qibla direction." |
| `react-native-qibla-compass` | "We need your location to calculate the Qibla direction" |
| **`precise_compass`** | **"Used to show your true (geographic) heading."** |

The agent's note on the last: **it names the outcome rather than the mechanism, and it is the only one that
does not over-claim accuracy.**

### What gets rejected under Guideline 5.1.1

Two documented failure modes from the July 2026 automated tightening: **insufficient wording** ("the string
names the resource without describing the use") and **declared but unused**.

The formula: **"Each one is a verb, the data, and the outcome the user gets."** Worked contrast:

> Weak: "Opens the camera so you can take photos and videos in the app."
> Strong: "Opens the camera so you can photograph a receipt and attach it to an expense claim."

A real rejection sequence from r/iOSProgramming ("Got rejected by the App Store 5 times before getting
approved"):

> Rejected: "We use your location to show nearby matches and improve recommendations."
> Approved: "We use your location to show experiences near you on the map. For example, you will see
> coffee meetups and activities within your preferred distance."

**The lesson: Apple wants a specific EXAMPLE of what the user sees, not a category of benefit.**

### Permission priming: the quantitative evidence

From the Incognia white paper, summarising Tan et al. (CHI 2014) and a Berkeley study of ~700 users:

- A purpose string at all raised opt-in from **62.8% to 73.6%**
- The best wording achieved **70.2% against 38.8%** for an unclear message, an 81% relative lift
- Apps whose value obviously depends on location see ~90% opt-in; unclear rationale drops to ~50%
- One fintech moved **45% to 93%** by asking at the moment of use, adding a primer, and fixing the string

**NN/g's formula:** "[app] would like to access your [resource] so that you can [benefit/task]." And the
warning: *"Avoid vague phrases such as to offer a better user experience... Users are highly skeptical of
vague promises and often suspect that they cover nefarious schemes."*

**On timing**, which validates our decision to ask on the sheet rather than at launch: *"Whenever possible,
initiate a permission request when the user selects a feature that requires that permission. This approach
gives the request important context and the user a feeling of control."*

**On the dark-pattern line:** *"Avoid using dark patterns. Give your users enough information to make their
own choice. Respect their decision."*

### Coarse-only wording

Apple: "To share only your approximate location, which may be sufficient for an app that doesn't need your
exact location, turn Precise Location off."

**There is no established convention for in-app copy explaining "Precise: Off".** The closest real example
(Milwaukee One-Key) acknowledges the setting, states the effect, and does not nag.

## 2. Explaining uncertainty: the best real examples

**Apple Compass ships exactly ONE uncertainty string**, and it is the gold standard of tone. A condition
and an instruction, no apology:

> **"Hold the device flat for accurate bearing"**

**Google Maps** renders certainty as geometry rather than words: "When Google Maps isn't sure about your
location, a light blue circle shows around the blue dot... The smaller the circle, the more certain the app
is." Its calibration instruction bounds the effort:

> **"Make a figure 8 until the beam becomes narrow and points in the right direction. You only have to do
> this a few times."**

**Apple Watch heart rate**, the canonical honest-without-undermining paragraph:

> "Even under ideal conditions, Apple Watch may not be able to get a reliable heart rate reading every time
> for everybody... But there are things you can do to help Apple Watch get the most consistent and best
> heart rate readings possible."

**The structure: (1) it may not work, (2) that is normal, (3) here is what helps.** It never calls the
product unreliable; it scopes the doubt to *a reading*.

**Muslim App's developer reply** to a one-star review from a user standing in front of the Kaaba is the
exact sentence structure we need, separating calculation from sensor:

> "Our Qibla Finder uses your phone's built-in compass sensor. When this sensor needs calibration, the
> direction may appear incorrect **even though our Qibla calculation is accurate**. Move your phone in a
> horizontal figure-eight motion 3 to 5 times, then reopen our Qibla Finder."

**Mufti Selangor (Taudhih al-Falak #17, 10 Nov 2025)**, a religious authority writing about this exact
problem in a technical rather than preachy register, and citing a 2017 study: **"only 2 of 10 apps tested
pointed correctly; the rest strayed by more than 45°."** Another cited study measured compass error up to
26°.

**GOV.UK's tone guidance** is the best short statement of the register: "specific; informative; clear and
concise; brisk, but not terse... serious but not pompous; emotionless." And: **"There's usually no need to
say 'please' or 'please note'."**

### How to say "estimate" without undermining the feature

Every good source converges on **the split claim**: separate what is exact from what is approximate, and
put the doubt only where it belongs. `precise_compass` states the philosophy outright: *"so your app never
has to lie to its users about how good the heading is."*

Al-Noor Islam phrases the split for users, and then does the crucial move:

> "The qibla angle is exact; the compass needle is only as good as your phone's magnetometer."
> "After a figure-8 calibration and away from magnets and metal, most phones read within a few degrees,
> **which is more than enough to face the Kaaba correctly**."

**The uncertainty is relieved against the tolerance.** Honest and confidence-preserving at once.

## 3. What an app may and may not say

**IslamQA 148900 (Feb 2024)**, the governing text:

> "If the Muslim is in a place where he cannot determine the direction of the Qiblah, then he should pray
> facing the direction which he thinks is most likely... **and he does not have to repeat the prayer after
> that.**"

**IslamQA 42574 (Jul 2024):** "if a person tries his best to get it right, he has done what is required of
him."

**Mufti Selangor**, an official fatwa department declining to rule apps accurate:

> "checking the qibla through an app can only serve as a guide, while the qibla direction **verified by the
> authorities should be the primary reference**."

**Marketing overclaim is the category norm**, and provably false at the sensor level: "ensures your Qibla
is always precise for every prayer", "calculates the exact Qibla angle with precision", "pinpoint accurate
Qibla direction". The same developers quietly admit it in review replies. **The agent's recommendation: be
the app whose store listing and in-app copy say the same true thing.**

**The convention for deferring to authority** is settled across Islamic content: the app states what it
computed, then defers the *ruling* to named or local scholarship. **No major Islamic app issues fiqh
itself.**

**The test the agent proposes for any line, which is excellent: "can a sensor engineer and a mufti both
sign it?"**

## 4. Microcopy observed in real products

| Element | Real wording | Source |
| --- | --- | --- |
| Turn instruction | "7° turn right" | Al-Noor Islam |
| Aligned | the screen floods green, **no words** | Qibla Pro |
| Bearing | "268° W" / "≈ 58° (NE)" | Al-Noor / online-compass |
| Location needed | "Location needed, grant location permission to compute the Qibla bearing." | online-compass |
| Interference | "hold your phone flat and keep it away from metal objects and electromagnetic fields" | Muslim App |
| Tilt | **"Hold the device flat for accurate bearing"** | Apple Compass |
| No sensor | "GetQibla still shows the calculated angle after it receives your location. Use that angle with a separate physical compass." | GetQibla |

**On the aligned label:** no dominant convention, and the strongest products use no words at all.
**"Facing qibla" is defensible because it describes the device's geometric state; "Qibla confirmed" or
"Prayer valid" would be a claim about the prayer, which is fiqh rather than geometry.**

## 5. Accessibility

**Apple Compass, exactly what VoiceOver says**, the best-documented compass a11y transcript found:

> "Compass 349 degrees, N, Rutland, VT
> (tilt) Hold the device flat for accurate bearing
> (turn left) 270 degrees, W."

Design facts from that transcript: heading announced as "N degrees, cardinal"; **changes announced on the
user's turn, not continuously**; the tilt warning spoken as it becomes true.

**Accessible Compass** (written by a blind developer) uses the **announce-on-demand** model: "the app will
announce how far off course you are... To do this tap the screen." The user interrogates; the app does not
babble.

**The rule:** announce state *transitions* (entering near, reaching aligned, losing alignment, accuracy
band change), **never the raw stream.** General live-region guidance: "Never mark the streaming region
live, you will fire hundreds of announcements."

## 6. The agent's proposed copy

Plain British English, no em dashes, no exclamation marks, no emoji, **app never named** (which matches our
own rule, pinned by `shared/__tests__/help.test.ts`).

**Purpose string:** "Your location is used to work out the qibla direction for where you are, for example
119 degrees east of north in London."

**Priming screen:** "The qibla direction depends on where you are. Sharing your location once lets the app
calculate it for your exact position. Approximate location is enough; nothing is sent anywhere."
Buttons: "Share my location" / "Enter a city instead".

**Coarse state:** "Using approximate location. The direction for your area is still accurate to within a
fraction of a degree."

**Steady state:** bearing "119°" large; "4,748 km to Makkah" small; "Turn right 24°" live; near alignment
"A little more to the right"; aligned **"Facing qibla"**.

**Interference:** "The reading may be off. Move away from metal and magnets, then turn the phone in a
figure of eight a few times."

**Indoors:** "Indoors, compass readings are less certain. Try taking one reading near a window and lining
up with a fixed feature of the room, such as a door frame."

**Tilt:** "Hold the phone flat for an accurate reading" (a near-quote of Apple's own string, deliberately,
because Apple has already trained users on it).

**No magnetometer:** "The qibla angle for your location is 119° from north. Line that up with any physical
compass, or use the sun or a landmark. In a mosque, the mihrab already faces the qibla."

## 7. Copy never to write, with the evidence

- **"Exact", "precise", "always accurate"** describing the direction shown. Falsified by the sensor; JAKIM
  and Mufti Selangor both measured 3 to 45° of app error.
- **"Ensures your prayers are aligned"**: promises a religious outcome.
- **"Your prayer is valid"** in any form.
- "Please note", "simply", "just" (GOV.UK).
- **Exclamation marks anywhere near a religious term.**

## 8. FLAGGED FOR SCHOLARLY APPROVAL, not product decisions

The agent explicitly separated these, which is the most valuable thing in the report:

1. **"Facing qibla" as the aligned label.** Mild, describes geometry, but worth a check.
2. **Any sentence asserting scholarly consensus** ("scholars agree that sincere effort is what counts").
   Well supported by IslamQA 42574 and 148900, but it is still the app stating fiqh. Alternatives: attribute
   it to a named authority, or cut it and link to a help article quoting fatwa bodies verbatim.
3. **The near-Kaaba screen in any wording.**
4. **Any mention of tolerance ranges** ("within X degrees is accepted"). The ranges exist and differ by
   authority (Malaysia 3°, Egypt 45°), so **quoting one is a de facto ruling.** The agent's recommendation:
   **do not surface ranges in the UI at all.**

## Key sources

- NN/g permission requests: `nngroup.com/articles/mobile-app-permission-requests`
- Incognia location permissions white paper (the opt-in figures)
- Guideline 5.1.1 rejection analysis: `blog.despia.com`
- Apple Compass VoiceOver transcript: `perkins.org/resource/mobile-app-review-compass-apple-inc`
- Apple Watch heart rate accuracy: `support.apple.com`
- Google Maps location accuracy help: `support.google.com`
- Mufti Selangor, Taudhih al-Falak #17: `muftiselangor.gov.my`
- IslamQA 148900, 42574, 11691: `islamqa.info`
- GOV.UK tone: `guidance.publishing.service.gov.uk`
- GetQibla troubleshooting: `getqibla.com`
- `precise_compass` README (the "never has to lie" philosophy)
