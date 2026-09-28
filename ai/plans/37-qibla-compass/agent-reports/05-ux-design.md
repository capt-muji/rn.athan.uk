# Agent report 5: UX, visual design and accessibility

Returned 2026-09-28 by an independent research agent, attempt 3 (the first two failed on the gateway).
Kept verbatim in substance; the planner's reading of it, including where it contradicts this session's own
findings, is in `RESEARCH.md` section 9.

The agent tagged every claim **[V]** (verified from a fetched source) or **[I]** (inferred). That
discipline is why this report is usable, and the tags are preserved below.

---

## 1. The three interaction models found in the wild

**A. Rotating dial, fixed pointer** (the aviation "heading indicator" metaphor)

- **Muslim Pro [V]**: compass rose rotates, fixed blue Qibla hand and red "N" at the top. Support docs name
  the failure state: "If your compass is not moving and if both the blue Qibla hand and the red North 'N'
  indicator are pointing up, it usually means that the phone has not been able to detect your location."
  Shows "Unknown accuracy" on the dial. Drops into an infinite figure-8 calibration screen on interference.
- **Garmin Qibla Compass [V]**: "The compass rotates in real-time as you turn your wrist. A golden arrow
  points toward the Qibla direction. When you face the Qibla (within ±5°), the screen turns green, the
  watch vibrates, and the backlight activates." **The most explicit public spec of the tolerance-plus-
  feedback contract found: ±5° to green, vibrate, backlight.**
- Aviation precedent [V]: heading indicators rotate a card under a fixed lubber line and are considered
  easier to read than a swinging needle (pilotinstitute.com).

**B. Arrow that just points**

- **Qibla Pro [V]**, 4.8 stars, 1.2K ratings: "a living constellation of stars searches with you, gliding
  as you turn. The moment your direction is found, the stars rush together and crystallize into a giant
  arrow pointing to the Kaaba. When you face Makkah, the whole screen floods green." Haptics on reaching
  AND on drifting off. The developer confirmed on Reddit it was **inspired by Apple's AirTag Precision
  Finding UI**.
- **IslamicFinder [V]**: "minimalist: no graphics, just a line pointing toward the Kaaba".

**C. Instruction-based ("turn this way by this much")**

- **Zarrah [V]**, the best-documented rationale found: shows **three numbers, Qibla Direction, Your Heading
  and Turn**. "Knowing the qibla is 278° doesn't help if you don't know which way you're currently facing.
  Showing 'Turn: 175°' gives you a clear action." Requires calibration BEFORE showing the qibla at all.
  Shows GPS accuracy live ("~18m" vs "~100m").
- **qibla.lghou.dev [V]**: "Most qibla compasses hand you a spinning needle and leave you to work out what
  it means. This one gives you an instruction instead: turn right 43°, then almost, then a confirmation and
  a short vibration when you are facing the right way."
- **Sajda [V]**: "tells you which way to turn, and turns green when you are facing it."

## 2. What users complain about

**The rotating-dial metaphor is genuinely misunderstood.** The key thread, r/islam "Am I using Qibla apps
wrong?" [V]: a user asks why the qibla rotates when they rotate the phone. One reply insists "The Qibla
should always point in the same direction no matter how you turn your phone" (wrong, and the asker accepted
it); another says "I don't think you understand how a compass works" (right). **Even describing which thing
rotates is contested among users.**

**Drift and instability is the number one recurring complaint [V]:** "Every day the qibla changes on the
app"; "every hour shows different directions"; "every time I use my Qibla app, it changes... is it really
strict, or do we have some margin of error?" That last one carries religious anxiety, not just annoyance.

**Figure-8 calibration is folk knowledge** passed between users on Reddit rather than taught by the apps
[V]. SimplyQibla's developer: "many apps don't tell you when it needs calibration. So when I'm travelling,
I get 2 (sometimes 3) different directions for Qibla after trying to calibrate."

**The near-Kaaba edge case [V].** A user metres from the Kaaba found their app pointing the wrong way. A
Pillars team member gave the best public explanation found: "at this distance to the Ka'ba (metres away)
your GPS is not accurate enough to know if you're on the North, South, East, or West side... your GPS would
quite literally have to be accurate to <5m."

**Ads and privacy are a live wound in this category [V].** Muslim Pro was revealed in 2020 to have sold
location data onward to US military-linked buyers; "Qibla Compass" and "Al-Moazin" were removed in 2022 for
a hidden data-harvesting SDK. Reddit steers people to privacy-respecting apps explicitly. The agent's
reading, which is sound: a qibla screen is where a user is about to stand before God, and an ad there reads
as sacrilege to a non-trivial share of users.

**What people praise [V]:** "clean and aesthetic... no ads, privacy options, nice minimalistic design";
"one of the smoothest apps I've used". Nobody praises skeuomorphic realism.

## 3. Communicating uncertainty honestly (real wording, all verified)

- **qiblafinderweb.com**: three-state label **"Not calibrated / Medium / Ready"**; "Accuracy looks weak.
  Move away from metal or magnets, rotate the phone in a gentle figure-eight, then try again."; and the
  honesty line: **"This is a technical Qibla estimate, not an official religious ruling."**
- **FirdawsWay**: "When your phone's compass reading is unreliable, FirdawsWay says so and shows you how to
  calibrate, rather than pointing you the wrong way."
- **Zarrah**: "We require calibration before showing the qibla direction... It may take a few moments, but
  it prevents false readings that could point you the wrong way."
- **lghou, the single best line found [V]**: **"If the compass reading and the sun check disagree, trust
  the sun."**
- **lghou on the exact/estimate split [V]**: "That part is exact: it is spherical trigonometry, not an
  estimate, and it needs no sensors. Knowing which way you are facing is the harder half."

**Patterns for showing confidence:**

1. **Google Maps' blue beam [V]**: "The narrower the beam, the more accurate the direction. The wider the
   beam, the more likely it is that your phone's compass is temporarily uncalibrated." Directly portable to
   a dial as an arc width around the needle.
2. **Field-magnitude detection [V]**: NorthPin monitors total field strength; Earth's is ~25 to 65 µT, so
   "If your phone suddenly reads 120 µT, you're not in a magnetic anomaly, you're next to a speaker."
3. **Degrade, don't disappear [V/I]**: no major app fully hides the dial. Keep the mathematically exact
   bearing visible (it needs no sensors) and deprecate only the live needle.
4. Every well-reviewed warning pairs the problem with **one concrete action**. Avoid bare "error",
   "failure", "unreliable".

## 4. Accessibility

- **WCAG 1.4.1 Use of Color (A) [V]**: a screen that only floods green at alignment FAILS. Pair colour with
  a text state change and an icon change.
- **WCAG 1.3.3 Sensory Characteristics (A) [V]**: "rotate until the arrow points at the top" is a
  sensory-only instruction and needs a text equivalent, such as "turn right 28°".
- **WCAG 2.3.3 Animation from Interactions [V]**: the needle's motion is essential, which the understanding
  doc allows for, but damping still helps vestibular-sensitive users.
- **Android guidance [V]**: describe purpose and result, not visual details. So the label is "Qibla bearing
  118 degrees, you are facing 90, turn right 28", never "rotating dial with needle".
- **Qibla Pro is the standout and the only verified full implementation [V]**: "VoiceOver guidance for
  blind users. Vibration quickens as you near the qibla, with spoken directions... Built with feedback from
  a blind user... A signature pulse the moment you face the qibla."
- **A hardware precedent [V]** (JUTeC, UTM) cites a Malaysian fatwa tolerance of **≤3% deviation, about
  10.8°**, which is a useful cross-check on the ±5° window.
- **No mainstream multi-feature app documents qibla accessibility at all [V].** There is open space here.

## 5. Visual design

**What reads as premium:** restraint ("That is the entire app, and that is the point"); one strong metaphor
executed deeply; motion quality as luxury (Garmin markets "anti-aliased smooth rendering"); Islamic
geometry as background texture rather than foreground sticker.

**Common mistakes [V]:** low-contrast grey on dark (NN/g); light-on-dark producing "blurred edges or halo"
for low-vision and astigmatic users (Smashing), **which is directly relevant to a glowing needle on
indigo**; skeuomorphic clutter; small text.

**The 8-pointed star (khatam / Rub el Hizb) [V]:** constructed from two squares rotated 45° through an
octagon; "one of the most recognizable forms in Islamic geometric art"; the Petronas Towers floor plan is
based on it, which is the proof it scales into contemporary minimal design. Its **8-fold symmetry aligns
naturally with 45° compass divisions.**

**Kaaba icon convention [V]:** a black cube in slight isometric perspective with a horizontal gold band
(the hizam) near the top. **The band is the identifying feature; a black cube without it reads as "box".**
Avoid photorealism, drop shadows and gold gradients.

## 6. Motion and feel

**The 0/360 wrap [V]:** Reanimated discussion #4353. Heading arrives at only ~4 Hz; naive interpolation
makes the needle "do a complete 360" crossing north. The working solution keeps a running delta that adds
±360 whenever the raw diff exceeds 180°, then animates the unwrapped value with
`withTiming(..., { duration: 200, easing: Easing.bezier(.27,.78,.27,1) })`.

**Jitter vs lag [V]:** NorthPin names it precisely: "Naive approaches, 'just average the last 10 readings',
work but make the needle feel sluggish." Their fix is a **low-pass filter with a dynamic time constant**:
heavy smoothing when the heading is steady, responsive when it is moving, "instant when you move and
rock-steady when you don't".

**Snap vs continuous [V/I]:** no app found snaps the NEEDLE. What they snap is the STATE, at the ±5°
window. "The haptic click is the snap." Snapping the needle breaks trust the instant the underlying heading
disagrees, and it always jitters ±1 to 3°.

**Bounds [I]:** ~150 to 250 ms easing (the verified recipe uses 200 ms); critically damped settle, no
oscillation, because a wobble reads to users as the calibration-failure signature; one flourish at the
moment of success and stillness everywhere else.

## 7. The agent's recommendations

1. Rotating dial under a fixed top index, **plus a "Turn right 28°" instruction** to resolve the documented
   metaphor confusion. Show all three numbers.
2. Kaaba marker at the fixed top index; black cube plus gold band.
3. Alignment at **±5°**: green wash, one distinct haptic pulse, and a text change to "Facing Qibla". Three
   channels, satisfying WCAG 1.4.1.
4. Show distance to Makkah, for meaning rather than utility.
5. **Uncertainty as an arc, not a label**, borrowing Google Maps' beam logic from `headingAccuracy`.
6. Khatam as the dial's tick geometry, since 8-fold symmetry is native to 45° divisions.
7. Accessibility: the three numbers as the screen-reader value, haptic cadence rising as error falls,
   Reduce Motion keeping the Turn text as the motion-free channel.

**What to avoid:** ads or upsells anywhere near this screen; needle snapping; wobble easing; glow-only
edges on dark indigo; hiding the dial when unreliable.

## Sources

The report carried roughly 60 source URLs. The load-bearing ones are reproduced here; the rest are in the
session record.

- Muslim Pro Qibla help: `support.muslimpro.com/help/es/articles/how-to-access-qibla-on-muslim-pro-app`
- Qibla Pro (App Store): `apps.apple.com/us/app/qibla-pro-kaaba-compass/id1568929172`
- Zarrah design page: `zarrah.app/features/qibla-compass`
- FirdawsWay: `firdawsway.app/en/features/qibla-finder`
- qibla.lghou.dev, qiblafinderweb.com
- Garmin Connect IQ Qibla Compass: `apps.garmin.com/en-US/apps/09b781fe-d2e8-44b5-8b9d-d87b0806dbb0`
- Google Qibla Finder: `blog.google/intl/en-mena/company-news/inside-google/2017_06_qibla-finder/`
- Reanimated #4353: `github.com/software-mansion/react-native-reanimated/discussions/4353`
- NorthPin compass engineering: `dev.to/lapnitodevelopment/i-built-an-offline-compass-app-that-tells-you-when-not-to-trust-it-32a2`
- Google Maps blue beam: `blog.google/products-and-platforms/products/maps/always-know-which-way-youre-headed-with/`
- WCAG 1.4.1, 1.3.3, 2.3.3 understanding documents, w3.org
- JUTeC qibla compass for visually impaired: `jtec.utem.edu.my/jtec/article/view/1271/762`
- r/islam "Am I using Qibla apps wrong?": `reddit.com/r/islam/comments/6ydiol/`
- r/islam near-Kaaba thread with the Pillars reply: `reddit.com/r/islam/comments/1oub4zo/`
- Middle East Eye on the data-harvesting SDK removals
