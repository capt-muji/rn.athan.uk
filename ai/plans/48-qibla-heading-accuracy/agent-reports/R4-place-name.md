# R4: why Android reads "Greater London" and iOS reads "London"

The owner, testing 1.29.203 on both phones in the same spot: "I don't know how you get the location because on
Android it says 'Greater London, United Kingdom', and then on iOS it says 'London, United Kingdom'. So I don't
actually know how you get the location."

**Verdict: NOT a defect. Both labels are true, the position is identical, and the bearing is untouched.** No code
was changed. The investigating agent measured rather than reasoned, and the measurement is conclusive.

---

## The mechanism, read from the installed native source

`device/qibla.ts:49` calls `Location.reverseGeocodeAsync`, and `shared/qiblaPlace.ts:39` picks a locality
narrowest-first:

```
city ?? district ?? subregion ?? region
```

Both platforms expose the same five JS keys, mapped from each one's own native address type:

| JS key | iOS source | Android source |
| --- | --- | --- |
| `city` | `placemark.locality` (`ios/Geocoder.swift:33`) | `address.locality` (`records/LocationResults.kt:221`) |
| `district` | `placemark.subLocality` (`:34`) | `address.subLocality` (`:222`) |
| `subregion` | `placemark.subAdministrativeArea` (`:38`) | `address.subAdminArea` (`:226`) |
| `region` | `placemark.administrativeArea` (`:37`) | `address.adminArea` (`:225`) |
| `country` | `placemark.country` (`:39`) | `address.countryName` (`:227`) |

**So the selection order runs identically on both. The difference is entirely upstream**, in which native fields
each system geocoder fills in.

## The measurement: both labels from ONE coordinate

The agent ran both geocoders against the same coordinate, `51.474213, -0.202080`, which is the OnePlus's own last
known fix (`dumpsys location`, `hAcc=14`). Android was probed on the 3T itself with a dex probe through
`app_process`, because a release build carries no app logging.

| Field | Apple `CLGeocoder` | Android `Geocoder` |
| --- | --- | --- |
| `locality` (city) | **London** ← wins | **null** |
| `subLocality` (district) | Hammersmith and Fulham | null |
| `subAdminArea` (subregion) | London | **Greater London** ← wins |
| `adminArea` (region) | England | England |
| `country` | United Kingdom | United Kingdom |

**iOS stops at the first branch. Android gets `null` for the two narrowest fields, falls through two steps, and
lands on "Greater London".**

This is a Google trait for UK addresses rather than a one-off: Android returned `locality=null` with
`subAdminArea="Greater London"` at all four London coordinates tried (Parsons Green, Charing Cross, Uxbridge,
Upminster). "London" exists on the Android side only inside the formatted line
(`addressLine[0] = "4 Heathman's Rd, London SW6 4TJ, UK"`), because Google carries it as a `postal_town`, which
Android's `Address` does not map to `locality`. For contrast Android DOES populate `locality="Makkah"` at the
Kaaba, so the geocoder is not broken; UK addresses are modelled differently.

## Does it mean the phones have different positions? No

**Both labels were reproduced from a SINGLE coordinate**, so the divergence is fully explained with the position
held constant and is therefore no evidence of a position difference at all. That is the right shape of proof, and
it did not require reading the iPhone's own coordinate (which has no read-only route and was correctly left
UNVERIFIED).

The upper bound makes it moot regardless: **the qibla bearing across the whole of Greater London spans 0.818
degrees** (Uxbridge 118.638 to Upminster 119.455). Even if the two phones disagreed by the full width of the
capital the needle would move under a degree, and between the 3T's own fine and coarse fixes the difference is
0.0026 degrees.

## Is the bearing affected? Not in any way

`hooks/useQibla.ts` computes the bearing from the coordinate pair alone, through `qiblaBearing`, which is pure
trigonometry. The place name is fetched afterwards, un-awaited, on a path that only ever writes `state.place`, and
nothing reads `place` back into the geometry. `readPlaceName` swallows its own failures by design
(`device/qibla.ts:52-54`) precisely so a dead geocoder cannot cost the user a bearing.

**The label is cosmetic. Two phones showing different labels are pointing the same way.**

## Why no code changed, and the one judgement left for the owner

The field order is correct, and this incident is it working rather than failing: narrowest-first is how a person
names where they are, and the widening fallback is exactly what rescued the Android label from being blank, since
Android had nothing narrower to offer.

**No reordering can fix it, because "London" is not present in any field `placeName` reads on Android.** The
alternatives are worse:

| Alternative | Why not |
| --- | --- |
| Use `formattedAddress` / `addressLine[0]` | Prints "4 Heathman's Rd, London SW6 4TJ, UK": the user's street and postcode on screen, a privacy regression for a label |
| Strip a `"Greater "` prefix | A UK-specific hack that mangles Greater Manchester, where that is the only name the place has |

**The consequence worth the owner's judgement:** because this app is London-only today, every Android user reads
"Greater London" and every iOS user reads "London". That is the whole user base rather than an edge case. Making
them agree is a product decision about what the label should say, not a bug fix, so it is left to him.
