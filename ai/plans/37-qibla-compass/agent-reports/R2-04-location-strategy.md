# Round 2, agent 4: location strategy, and the critical iOS question

Returned 2026-09-28. Dispatched to answer one question that could have invalidated the whole coarse-location
plan: **does iOS reduced accuracy break `trueHeading`?**

Planner's ruling in `RESEARCH.md` section 17.

---

## THE CRITICAL ANSWER: no, reduced accuracy does NOT break true north

**Verdict: the coarse-location plan is safe on iOS. High confidence, with one caveat that changes our
implementation.**

The chain of evidence:

1. **What `trueHeading` needs.** Apple: "Core Location needs the current location of the device to compute
   the value of this property." It needs *a* location, for the declination correction, nothing more.
2. **What reduced accuracy delivers.** Apple: "The approximate location preserves the user's country or
   region, typically preserves the city, and is usually **within 1 to 20 kilometers** of the actual
   location." WWDC20 adds that fixes are quantised into sectors and delivered about 4 times an hour, and
   that **significant-location-change and Visits keep working** under reduced accuracy.
3. **The arithmetic.** Declination varies smoothly, roughly 0.01 to 0.1° per km. **A 1 to 20 km error
   changes the declination correction by well under 2°** even in the worst geomagnetic patches.
4. **No documented failure mode.** Apple documents `trueHeading` returning −1 only when heading cannot be
   determined or when location permission or services are off. **WWDC20 explicitly disabled only beacons
   and region monitoring under reduced accuracy; heading was never restricted.**

### THE CAVEAT THAT CHANGES OUR CODE

**`expo-location`'s iOS `DeviceHeadingStreamer` calls only `manager.startUpdatingHeading()` and never
`startUpdatingLocation()` on its own manager.** (Verified independently by this session in the installed
source: `startUpdatingHeading` appears at line 28, `startUpdatingLocation` appears zero times.)

Apple's note says location updates *should* be enabled for a valid `trueHeading`. In practice iOS computes
declination from the system's own position estimate, so it works.

> **Mitigation, and it is free: call `getCurrentPositionAsync` (which we need anyway for the bearing)
> BEFORE or alongside `watchHeadingAsync`. That guarantees location services are warm.**

**Android's counterpart is also safe:** `LocationModule.kt` builds its `GeomagneticField` from the last
known location and **explicitly accepts either FINE or COARSE permission**. A 2 km grid offset changes
declination negligibly.

## 1. The accuracy enum, mapped to what actually happens

| Level | iOS constant | Android priority | Effective |
| --- | --- | --- | --- |
| `Lowest` | ThreeKilometers | `PRIORITY_LOW_POWER` | ~10 km, no GPS |
| `Low` | Kilometer | `PRIORITY_BALANCED_POWER_ACCURACY` | WiFi/cell |
| **`Balanced`** | **HundredMeters** | **`PRIORITY_BALANCED_POWER_ACCURACY`** | **~100 m, returns in 1 to 5 s** |
| `High` | NearestTenMeters | `PRIORITY_HIGH_ACCURACY` | GPS, 10 to 50 m |
| `Highest` | Best | `PRIORITY_HIGH_ACCURACY` | GPS, more power |
| `BestForNavigation` | BestForNavigation | `PRIORITY_HIGH_ACCURACY` | most power |

Official Android figures: **approximate is about a 2 km grid ("3 square kilometers")**, precise "usually
within about 50 meters".

**For qibla, `Balanced` is the right ask.**

## 2. `getLastKnownPositionAsync` vs `getCurrentPositionAsync`

- **`getCurrentPositionAsync`**: an active fix, 1 to 10 s typical, can reject if none obtainable.
- **`getLastKnownPositionAsync`**: a pure cache read that **never turns on radios**. Options: `maxAge` in
  ms and `requiredAccuracy` in metres, both returning null when unmet.
- **Returns null when** there is no permission, nothing cached, or the cache fails the filter.
- **The trap:** Android's last-known can be **hours or days old**. Fine for a bearing, poison for a
  "current city" label. **Always pass `maxAge`.**

**Expo's own documented guidance:** "Consider using `getLastKnownPositionAsync` if you expect to get a
quick response and high accuracy is not required."

## 3. The Android 12+ approximate/precise toggle

- **Requesting FINE and COARSE** (which is what `expo-location` does) shows a dialog with **two pills,
  Precise and Approximate.**
- **Requesting COARSE only** shows **only the Approximate option.**
- "If the user grants the approximate location permission, your app only has access to approximate
  location, **regardless of which location permissions your app declares**."
- **Android 12+ users can force coarse from Settings for any app**, so coarse-graceful behaviour is
  mandatory regardless of what we request.

**Detection is available.** `getForegroundPermissionsAsync()` resolves with `android.accuracy` of
`"fine" | "coarse" | "none"` and `ios.accuracy` of `"full" | "reduced"`. **Verified independently by this
session in the installed source** at `LocationModule.kt:402-409`.

**`expo-location` always requests BOTH permissions**, so a coarse-only posture needs a small config plugin
that strips `ACCESS_FINE_LOCATION` from the merged manifest.

**How Android computes approximate location:** historically a static **2 km grid**. Google's Android 17
post: "Previously, coarse locations used a static 2 km-wide grid... The new approach replaces this fixed
grid with a dynamically-sized area based on local population density."

**Qibla impact of a 2 km error:** harmless globally. At 66 km (Jeddah) about 1.7°; at 10 km about 11°;
inside ~5 km of the Kaaba it dominates.

## 4. iOS reduced accuracy in detail

- **Not a fuzz**: system-chosen representative points, "selecting a nearby point of interest",
  sector-quantised, refreshed a few times an hour.
- **`NSLocationDefaultAccuracyReduced = true`** in `Info.plist` makes the app request reduced by default and
  omits the precise switch from the prompt. Settable from `app.json`.
- **`requestTemporaryFullAccuracyAuthorization` is NOT exposed by expo-location.** Verified against SDK 58
  docs and source. The options are a Settings deep link, or a patch.

## 5. Caching and staleness for travellers

| Approach | Battery | Permission cost | Verdict |
| --- | --- | --- | --- |
| Fresh `Balanced` fix on sheet open | negligible | foreground only | **core strategy** |
| `getLastKnownPositionAsync` | zero | foreground only | **instant paint** |
| Significant-location-change | negligible | **Always (iOS)** | rejected, indefensible here |
| Background location | real | **special Play review + justification video** | rejected |
| Timezone-change listener | zero | none | free invalidation signal |

**The agent's key insight, and it dissolves the staleness problem entirely:**

> **Do not cache authoritatively at all for the qibla sheet. Every sheet open re-fixes with `Balanced`
> (1 to 5 s, imperceptible behind the cached paint). The cache is only a UX paint-over and a refusal
> fallback. A cached fix can then never mislead a traveller, because it is never shown without a refresh
> in flight.**

No timers, no significant-location-change, no background anything, no extra permissions.

## 6. The manual fallback: a bundled city list

| Dataset | Contents | Size | Licence |
| --- | --- | --- | --- |
| **GeoNames `cities15000`** | ~25 to 30k places over 15k population | **3.2 MB zipped, ~1 MB trimmed** | **CC BY 4.0** |
| GeoNames `cities1000` | ~150k places | 11 MB zipped | CC BY 4.0 |
| npm `all-the-cities` | 138,398 cities | 6.4 MB unpacked | MIT (data from GeoNames) |

**Recommendation: `cities15000` trimmed to name, country, lat, lng, about 1 MB**, with a CC BY 4.0
attribution line. Search is prefix and substring matching over 25k rows, instant in JS, no SQLite.

**`geocodeAsync` is NOT an offline option.** iOS CLGeocoder is network-based and rate-limited to about one
request per minute. **On Android, expo's docs state geocoding requires location permission already granted,
which defeats the refusal fallback entirely.**

## 7. Store compliance, and a 2026 policy change that matters

**App Store:** "Collect" means transmitting off the device. **If location is only read on-device to compute
a bearing and never transmitted, it is not "collected" and we may declare "Data Not Collected."**

**Play:** "User data accessed by your app that is **only processed locally** on the user's device and not
sent off device does **not** need to be disclosed."

### The policy change that argues for coarse-only

**Play's "Minimum Scope" location policy, announced 15 April 2026:**

- Apps targeting **Android 17+** must use a new one-shot location button for transactional precise use.
- **From November 2026, every app requesting `ACCESS_FINE_LOCATION` must complete a Play Console
  declaration** explaining "why `ACCESS_COARSE_LOCATION` or LocationButton is not sufficient". **Enforced
  27 January 2027 for new AND existing apps.**
- **A coarse-only app is exempt from both.**

Google's own list of coarse-appropriate uses reads like a description of this feature.

## 8. The recommended strategy

**Request once, when the sheet opens. Never at launch. Coarse everywhere, precise optional near Makkah,
manual fallback always.**

1. **Paint instantly** from cache, so the arrow is usable immediately.
2. `getForegroundPermissionsAsync()`, then request **in response to the open action**.
3. `getLastKnownPositionAsync({ maxAge: 15 * 60_000 })` for a free instant refresh.
4. **`getCurrentPositionAsync({ accuracy: Accuracy.Balanced })`** in the background. **This also warms
   location services so `trueHeading` is valid.**
5. `watchHeadingAsync` for rotation; fall back to `magHeading` only when `trueHeading === -1`.

**Near-Makkah handling:** compute distance to the Kaaba. Under 100 km with coarse accuracy, show a notice.
At 66 km a 2 km error is 1.7°; at 10 km it is 11°; at 3 km it is 34°.

## Key sources

- expo SDK 58 Location docs and source: `LocationModule.kt`, `LocationHelpers.kt`, `LocationAccuracy.swift`,
  **`DeviceHeadingStreamer.swift`**
- Apple `kCLLocationAccuracyReduced`, `CLHeading.trueHeading`, CLGeocoder, WWDC20 session 10660
- Android location permissions and the approximate-location codelab
- Android 17 privacy post: `developer.android.com/blog/posts/redefining-location-privacy-new-tools-and-improvements-for-android-17`
- **Play Minimum Scope policy: `support.google.com/googleplay/android-developer/answer/17033915`**
- Apple privacy details: `developer.apple.com/app-store/app-privacy-details/`
- Play Data Safety: `support.google.com/googleplay/android-developer/answer/10787469`
