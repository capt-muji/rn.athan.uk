# R4: why Android reads "Greater London" and iOS reads "London"

The owner, testing 1.29.203 on both phones in the same spot: "I don't know how you get the location because on
Android it says 'Greater London, United Kingdom', and then on iOS it says 'London, United Kingdom'."

**Verdict: NOT a defect. Both labels are true, the position is identical, the bearing is untouched. No code
changed; the investigating agent measured rather than reasoned, and the measurement is conclusive.**

## Mechanism, from the installed native source

`device/qibla.ts:49` calls `Location.reverseGeocodeAsync`; `shared/qiblaPlace.ts:39` picks narrowest-first
(`city ?? district ?? subregion ?? region`). Both platforms expose the same JS keys — `city` from
`placemark.locality` / `address.locality` (`ios/Geocoder.swift:33`, `records/LocationResults.kt:221`),
`district` from `subLocality`/`subLocality` (`:34`/`:222`), `subregion` from
`subAdministrativeArea`/`subAdminArea` (`:38`/`:226`), `region` from `administrativeArea`/`adminArea`
(`:37`/`:225`), `country` from `country`/`countryName` (`:39`/`:227`). **The selection order runs identically;
the difference is entirely upstream**, in which fields each system geocoder fills.

## The measurement: both labels from ONE coordinate

Both geocoders run against the same coordinate (the OnePlus's own last known fix, from `dumpsys location`;
Android probed on the 3T itself with a dex probe through `app_process`, because a release build carries no app
logging):

| Field | Apple `CLGeocoder` | Android `Geocoder` |
| --- | --- | --- |
| `locality` (city) | **London** ← wins | **null** |
| `subLocality` (district) | the borough | null |
| `subAdminArea` (subregion) | London | **Greater London** ← wins |
| `adminArea` (region) | England | England |
| `country` | United Kingdom | United Kingdom |

**Android gets null for the two narrowest fields, falls through two steps, lands on "Greater London."** A
Google trait for UK addresses, not a one-off: `locality=null` with `subAdminArea="Greater London"` at all four
London coordinates tried; "London" exists on Android only inside `addressLine[0]` (Google carries it as a
`postal_town`, unmapped to `locality`). Android DOES populate `locality="Makkah"` at the Kaaba, so the
geocoder is not broken; UK addresses are modelled differently.

## Not a position difference, not a bearing difference

**Both labels were reproduced from a SINGLE coordinate**, so the divergence is fully explained with the
position held constant — no evidence of a position difference (the iPhone's own coordinate has no read-only
route and was correctly left UNVERIFIED). Moot regardless: **the qibla bearing across the whole of Greater
London spans 0.818 degrees** (Uxbridge 118.638 to Upminster 119.455), and the 3T's own fine-vs-coarse fixes
differ by 0.0026 degrees. The place name is fetched un-awaited on a path that only writes `state.place`;
nothing reads it back into the geometry, and `readPlaceName` swallows its own failures by design
(`device/qibla.ts:52-54`). **Two phones showing different labels are pointing the same way.**

## The one judgement left for the owner

No reordering can fix it — "London" is not in any field `placeName` reads on Android. The alternatives are
worse: `formattedAddress` prints the user's house number, street and postcode (a privacy regression for a
label); stripping a `"Greater "` prefix mangles Greater Manchester, where that is the only name the place has.
Because this app is London-only today, every Android user reads "Greater London" and every iOS user reads
"London" — the whole user base, not an edge case. Making them agree is a product decision about what the label
should say, left to the owner.
