# Round 2, agent 1: dark-theme dial design, with build-to numbers

Returned 2026-09-28. This brief was dispatched specifically because round 1 established the surface is a
DARK bottom sheet, which invalidated the light-modal assumption the first UX brief had been given.

The agent graded every claim ✅ verified from a primary source, 👁 verified visually, ⚠️ inferred. Planner's
ruling in `RESEARCH.md` section 14.

---

## 1. The reference set

**Apple iOS Compass**, the canonical minimal dark compass. Macworld on the iOS 7 redesign: "a cockpit
flight instrument as designed by Dieter Rams... uses just **four colors**: black, gray, white, and a hint
of red." ✅ **That four-colour discipline is the entire premium trick.**

Tapping to lock a bearing draws a **red deviation arc** inside the ring that widens as you drift: a static
state indicator, not a per-frame redraw. Directly transplantable.

An accessibility review confirms the palette mechanics: "White on Black with a color change of Red for
Degrees or Angles and **Green for Level 0 degrees**." **Green is reserved exclusively for the success
state, never decoration.** ✅

**Apple Watch Compass:** cardinal letters **rotate with the dial**; the bearing number is fixed and
centred. Waypoint navigation uses an **orange shrinking ring** that closes as you turn toward the target.
A single saturated accent carries all the "getting closer" meaning. ✅👁

**Garmin HSI, the best documented tick spec found anywhere.** From the AXIS Pilot's Guide, verbatim:
*"Letters indicate the cardinal points and numeric labels occur every 30˚. **Major tick marks are at 10˚
intervals and minor tick marks at 5˚ intervals.** A digital reading of the current heading appears on top
of the HSI."* ✅

Also: a cyan **heading bug** marks the selected heading, and **if the bug is off-screen it clamps to the
edge of the rose**. That is exactly the behaviour needed when the qibla is behind the user.

**Traditional aviation heading indicator:** numbers are **abbreviated two digits** (36 for 360, then 33,
30, 27...). At a 312pt dial, three-digit labels every 30° will not fit the arc; two-digit is the
aviation-proven answer. ✅

**Marine compass:** the premium cue is **damping fluid**, so the card glides instead of twitching. Our
equivalent is the low-pass filter. ✅

## 2. What makes a dark dial read as premium

1. **Four colours maximum.** Background, one light tick/label colour, one muted secondary, one saturated
   accent reserved for meaning. No gradients across the dial face; depth from a single inner shadow, never
   bevels.
2. **A tick hierarchy of exactly three weights.** "Premium instruments never use two tick lengths only;
   the three-step hierarchy is what reads as instrument."
3. **Contrast, computed against our actual palette:** white on `#0b183a` is about **15.9:1**; the icon
   lilac `rgba(165,180,252,1)` about **9:1**; the muted `rgba(86,134,189,0.725)` composited lands about
   **4.2:1**, so it is fit for secondary readouts at 15pt or larger, not small text.
4. **One differentiated north mark**, everything else uniform.

## 3. The recommended tick spec

At 312pt the circumference is ~980pt, which is the constraint that kills over-densification: 120 ticks
gives 8.2pt spacing (unreadable), 72 gives 13.6pt (comfortable).

> **72 minor ticks (every 5°), 12 labelled majors (every 30°, two-digit), N/E/S/W replacing the
> 0/90/180/270 labels, tick length ratio about 1 : 1.6 : 2.2.**

**Cardinal letters rotate with the dial**, which is what iOS, Apple Watch, Garmin and marine compasses all
do. Counter-rotating "always upright" letters break the instrument metaphor and cost per-frame text
transforms.

## 4. The Kaaba icon on dark navy

**The problem the agent identified:** at 24 to 40pt on `#0b183a`, a black cube disappears.

Existing solutions:
- **FontAwesome** renders it as an isometric cube silhouette where the gold band is **negative space**, and
  ships a **duotone** variant explicitly for dark backgrounds. ✅
- **Salati (App Store changelog):** "the Kaaba icon now sits at the top of the screen when you face the
  Qibla", so the marker travels to the lubber position when aligned. ✅
- Stock libraries (3,329 kaaba icons on Flaticon) overwhelmingly draw it **flat-on front elevation**: a
  square with a door shape and a horizontal band. **Front elevation survives miniaturisation far better
  than an isometric cube.** ✅

Recommendations:
1. **Never use black fill.** Fill darker than the navy with a 1pt lilac stroke at ~60%, so it reads as a
   lit object in shadow.
2. **Carry identity in the gold band alone.** Gold on navy is a canonical pairing.
3. **Glow at rest looks cheap; glow on state change is premium.** A soft gold halo only in the aligned
   state, as part of the confirmation.
4. **Front elevation, not isometric.** Solid/silhouette forms are recognised measurably faster than
   outline forms at small sizes (a 1,260-participant study). Drop internal detail below ~24px.
5. **24pt is the floor** for cube-plus-band; at 28 to 32pt the door notch survives. **Use ~34pt.**

## 5. Islamic geometry

**The 8-pointed star (khatam / Rub el Hizb)** is two overlapping squares, one rotated 45°. It is Unicode
۞ (U+06DE), marks quarter-hizb divisions in Qurans, and the Petronas Towers floor plan is developed from
it. ✅

**It maps exactly onto 45° compass divisions**: orient one square edge-on to north and the 8 points land
precisely on N/NE/E/SE/S/SW/W/NW. ✅

**The traditional compass-and-straightedge construction**, verbatim from the source:
1. Draw a circle; draw a horizontal line through the centre.
2. With the **same radius**, place the compass point where the horizontal meets the circle and sweep
   semicircles above, below, left and right. The arcs give the perpendicular bisector and the 45°
   diagonals.
3. Connect the four points where the lines cross the circle: the inscribed **static square**.
4. Rotate it 45°: the **dynamic square**.
5. The union of the two outlines is the khatam.

**In vector code this is two rounded-corner squares, one rotated 45°: trivially cheap as a static asset.**

**12-fold (30° divisions)** rosettes are a documented family, common in Moroccan ornament, and their points
land exactly on our 30° labelled ticks. **16-fold (22.5°)** maps onto the full 16-wind rose.

**A rendering note that matters:** periodic tilings are limited to 2/3/4/6-fold symmetry, but **a single
radial medallion can have any n-fold symmetry**. So 8, 12 and 16 are all legitimate for a dial centre;
only a repeating background texture is restricted. ✅

**Tasteful vs tacky:** the field is full of "gorgeous apps where the user experience wasn't great", with
visual ornament standing in for substance as the acknowledged failure mode. The historical patterns are
themselves quiet: girih's sophistication is in the *underlying* structure, with visible strapwork a thin
fraction of the surface.

> **Working rule: ornament at 4 to 8% opacity in exactly one of two places, either an 8-fold medallion
> inside the dial centre or a 16-fold ring outside the tick ring. Never both.**

## 6. The turn instruction, and the anti-flicker problem

**A shipping app with our exact feature.** "Prayer Times, Salah & Qibla" (Google Play) documents verbatim:
*"a clear 'Turn left/right N°' indicator and a haptic tap when you're aligned with Mecca... Haptic feedback
when you're within 5° of Mecca."* ✅

**And its changelog contains the exact bug class:** *"the alignment tap no longer repeats at the edge of
alignment"*, which is hysteresis added after shipping. Another entry: *"Fixed the compass dial holding
still during slow turns."*

**GeoQibla (open-source Kotlin Multiplatform) has the best-documented threshold model**, from its
`QiblaConfig` defaults: ✅

- **"Near": within 10°**
- **"Aligned": heading stays within 3° for 750 milliseconds**, separating "roughly correct" from "stably
  correct"
- Tilt limit 55°, magnetic-field warning thresholds
- State priority: errors > permission > location > heading > tilt/calibration > **aligned > near > ready**

**AirTag Precision Finding:** a large 360° arrow plus live distance, **haptics rising in intensity and
frequency as you close**, a circle pulse when very close, and a **screen flash** on arrival. Its VoiceOver
guidance is discrete "ahead / behind / left / right", and the reviewer's complaint is instructive:
**discrete text directions feel worse than the continuous arrow.** The arrow carries continuous guidance;
text reinforces.

**Strobe tuners solve flicker by never discretising near the centre:** motion slows asymptotically to
stillness, so there is no binary state to flicker around.

## 7. Alignment feedback: the tuner analogy

**Tolerance windows in tuners:** ±1 cent professional, ±3 high quality, ±5 adequate, ±10 casual. But apps'
own green zones are deliberately coarser: StroboPro's trips at roughly **8 cents**. ✅

**The three-tier visual language is universal:** off-target either side, a green window at centre, and a
needle that must physically enter it.

**The lock-on moment:** rings "come to a complete, shimmering halt", and the **whole display** turns green
as a global state, not just the local element. Peterson's own FAQ: **stationary means in tune.** The
success state is *stillness*, the strongest perceptual contrast with the approach state. ✅

**Levels:** bubblelevel.io "turns green with a small vibration the moment you hit level". **Apple's iOS
level requires the circles to overlap "for more than a few seconds"** before the screen floods green,
which is GeoQibla's 750ms idea stretched longer. ✅

**Animation timing, documented:** NN/g puts most UI animation at 100 to 500ms, simple feedback ~100ms,
substantial screen changes 200 to 300ms. Material 3's Standard is 300ms, emphasised 500ms, exits 200ms. ✅

**Haptics:** iOS exposes `UINotificationFeedbackGenerator(.success)` for confirmation and
`UISelectionFeedbackGenerator` for discrete ticks. **They are different generators by design.** ✅

### The recommended choreography

1. Inside ±10°: dial accent brightens slightly, no text change.
2. **Aligned (±5° sustained 750ms): green wash floods the inner face over 250 to 300ms ease-out, one
   success haptic, text swaps.**
3. Hold while heading stays within **±7°** (a 2° hysteresis gap). Do not re-run the animation while held.
4. Re-arm only after exiting ±7°.

## 8. Typography

**Tabular figures are the whole fix for jitter:** "with proportional figures, a 1 is narrower than an 8,
and the column jitters. Tabular figures give every digit exactly the same width." The Apple Watch even has
a "Numerals Mono" face because tick-over animations jitter otherwise. ✅

**Rounding:** aviation, Garmin and iOS Compass all show **whole degrees**. Bearings are conventionally
**three digits** in navigation ("a bearing of 045 means exactly 45°, to avoid communication errors").
Rounding to whole degrees both hides sensor noise and is convention-correct. ✅

**Layout:** Garmin puts a large digital heading readout directly above the rose with the selected-heading
chip beside it; Apple Watch puts the bearing in the dial centre with elevation as a small footer.

## 9. The agent's build-to summary

| Decision | Value |
| --- | --- |
| Ticks | 72 minor @5°, 12 labelled major @30° two-digit, N/E/S/W replacing 0/90/180/270, length ratio 1 : 1.6 : 2.2 |
| Cardinals | rotate with the dial; fixed lubber triangle at top |
| Colours | white majors, lilac minors, indigo qibla accent, **green only for aligned** |
| Kaaba marker | front elevation, ~34pt, dark fill + lilac stroke, gold band carries identity, halo only when aligned |
| Ornament | one 8-fold khatam medallion at 4 to 8% opacity, or a 16-fold rim, never both |
| Guidance | "Turn left/right N°" + chevron below the dial, shortest path, whole degrees |
| Zones | near ±10°, **aligned ±5° held 750ms**, exit at ±7° |
| Confirmation | green wash 250 to 300ms ease-out, one success haptic, text swap, no re-trigger while held |
| Numbers | three-digit tabular lining figures, whole degrees |

**The agent's three biggest flagged surprises:** GeoQibla's 3°/750ms sustained-alignment model paired with
the Prayer Times app's "no repeat at the edge" fix form a complete proven anti-flicker spec; Garmin's
published 5°/10°/30° hierarchy gives an authoritative tick count rather than taste; and **Apple reserves
green exclusively for success across both Compass and Level, so it must not appear anywhere else on the
sheet.**

## Key sources

- Macworld on iOS 7 Compass: `macworld.com/article/221949/get-to-know-ios-7-compass.html`
- Garmin AXIS HSI tick spec: `garmin.com/manuals/webhelp/` GUID-979A0B3B
- GeoQibla thresholds: `medium.com/@shahid.iqbal4213/building-a-cross-platform-qibla-experience-with-geoqibla-052968a548d0`
- Prayer Times, Salah & Qibla changelog: `play.google.com/store/apps/details?id=com.danvilela.prayer_times`
- Rub el Hizb: `en.wikipedia.org/wiki/Rub_el_Hizb`
- Khatam construction: `mandalameadow.com/arabic-geometry-star-and-cross`
- FontAwesome kaaba: `fontawesome.com/icons/classic/duotone/kaaba`
- NN/g animation duration: `nngroup.com/articles/animation-duration`
- Material 3 motion: `m3.material.io/styles/motion/easing-and-duration`
- Tabular figures: `mediaatelier.com/en/Posts/Tabular-Figures`
- Perkins accessibility review of Apple Compass: `perkins.org/resource/mobile-app-review-compass-apple-inc`
