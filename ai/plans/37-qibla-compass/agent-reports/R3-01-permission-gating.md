# Round 3, agent 1: gating the compass behind the location permission

Returned 2026-09-28. **This brief was redirected mid-flight**: it began as refusal-UX research (city
pickers, timezone proxies, SIM country) and the owner's ruling cancelled that branch, so it was re-issued
against the narrower question of how to gate the feature.

Planner's ruling in `RESEARCH.md` section 20.

---

## 1. The platform guidance endorses this architecture explicitly

**Android's own developer guidance describes the owner's ruling almost word for word:**

> "If the user denies or revokes a permission that a feature needs, gracefully degrade your app so that the
> user can continue using your app, **possibly by disabling the feature that requires the permission**."

And its limits, from the same page: "Minimize functionality loss. Users should be able to access the app to
whatever extent is possible without the requested permissions" and **"Don't block the user interface...
don't display a full-screen warning message that prevents users from continuing to use your app at all."**

**Apple HIG:** "Request permission only when your app clearly needs access... Ideally, **wait to request
permission until people actually use an app feature that requires access**." And: "Avoid requesting
permission at launch unless the data or resource is required for your app to function."

**Our Qibla row asking on tap is exactly the pattern Apple recommends.**

## 2. THE KEY UX FINDING: do NOT grey the row out

Jakob Nielsen's synthesis of ~60 sources (Nov 2025) found 76% recommend visible-but-muted with an
explanation, 24% normal-with-error-on-click, ~0% hide. **But the agent identified the nuance that decides
our case:**

> **The row is never actually disabled. Tapping it always does something purposeful: it fires the OS
> prompt, or opens the compass, or explains and routes to Settings. A greyed-out style would
> miscommunicate "this row is broken" when it has a working action.**

Nielsen's own requirement is that a control must never be "a communication dead end", which a tappable row
satisfies. Google's recommended code comment for a denied permission likewise keeps the control live:
"Explain to the user that the feature is unavailable because the feature requires a permission that the
user has denied."

**Recommendation: the row stays fully enabled-looking and always tappable in all three states. If state
needs signalling, use a trailing value ("Location off"), never a disabled style.**

## 3. The three states

**A. Undetermined.** Tap fires the OS request immediately. **No separate priming screen**: on iOS the
purpose string in the OS dialog IS the priming, and there is no evidence a pre-prompt sheet helps for a
single, obviously-located feature. The row label and sheet title already establish context.

Apple's rule for the purpose string: "Aim for a brief, complete sentence that's straightforward,
specific... Use sentence case, avoid passive voice, and include a period at the end." Its own examples:

- Good: "The app records during the night to detect snoring sounds."
- Bad: "Microphone access is needed for a better experience."
- Bad: "Turn on microphone access."

On Android, if `shouldShowRequestPermissionRationale()` is true (one soft denial so far), show an
educational UI before re-requesting, **with a cancel option.**

**B. Granted.** Opens the sheet, no ceremony.

**C. Denied.** **Do NOT try to re-prompt**: silently does nothing on iOS, suppressed on Android after two
denials. Show a small recovery sheet **inside the Qibla context, not a blocking full-screen alert**, per
Android's "don't block the user interface".

**One deliberate limit from Android's guidance:** on a plain first soft denial, "Don't link to system
settings in an effort to convince the user to change their decision." **The Settings deep link belongs in
the permanently-denied path only.** On iOS there is no soft-denied state, so the link is correct there
immediately.

## 4. iOS "Allow Once" expires, so never cache "granted"

Verified: one-time authorisation "expires when your app is no longer in use, **reverting to
`CLAuthorizationStatus.notDetermined`**", and the prompt appears again next time.

**Consequences:**

- The gate must treat `notDetermined` as "ask on every tap", which is correct anyway.
- **Do not cache "granted" in JS state across sessions.** Always call `getForegroundPermissionsAsync()` at
  the moment of the decision.
- **A known Expo footgun:** `useForegroundPermissions()` **does not refresh when the user changes the
  permission in Settings** (expo/expo#30351). **Re-query on foreground; do not trust a stale hook.**

## 5. Re-requesting and Settings, precisely, in 2026

**iOS:** the system location prompt appears **once per install** per authorisation level. "After the initial
interruption, the system stores your app's authorization status and **doesn't prompt again**." After
`.denied`, re-requesting is a **silent no-op**.

`UIApplication.openSettingsURLString` (the `app-settings:` URL) **is still current** and opens the app's own
settings pane. Reports of it failing on iOS 18 traced to plugin implementations, not the scheme.

**In React Native, `Linking.openSettings()` is the sanctioned wrapper.** Note the asymmetry: **on Android it
opens the app-details screen, not the Permissions pane**, so the user taps "Permissions" once more. There is
no supported deep link into the Permissions fragment on modern Android; this is accepted behaviour in every
RN app.

**Android, unchanged since 11:** "if the user taps Deny for a specific permission **more than once** during
your app's lifetime of installation on a device, the user doesn't see the system permissions dialog if your
app requests that permission again." One denial sets `USER_SET`; two set `USER_FIXED`.

**`shouldShowRequestPermissionRationale()` returns false BOTH before the first request AND after permanent
denial**, so it is ambiguous by design; true only in the window after a single soft denial. React Native
surfaces the terminal state directly as `'never_ask_again'`.

**Also worth knowing:** revoking any permission **terminates the app process**, which "will look like a
crash if it happens mid-compass."

**Detecting the return from Settings:** the standard `AppState` pattern. Listen for `active`, re-query, and
open the sheet if now granted. Two cautions: **on Android, opening Settings can fire spurious
background/active cycles**, so compare the permission result rather than trusting the transition; and open
the compass only on an actual `granted` result.

## 6. Store review: gating one feature is NOT a risk

**"It is the documented, encouraged pattern."**

- **Apple:** Guideline 5.1.1 in 2026 is about privacy policies, purpose strings, consent, and forcing
  account registration. **The "must not refuse to function" doctrine applies to the WHOLE app.** Our prayer
  times, notifications and widgets all work without location, which is precisely Apple's stated ideal.
  Real 5.1.1 rejections are about missing or placeholder purpose strings, a missing privacy policy, or
  forced login.
  **Preempt the one real risk:** put the flow in the App Review notes, since a reviewer who cannot exercise
  the feature may ask.
- **Google:** its own UX guidance recommends disabling the affected feature on denial, so policy and
  guidance agree. Risk concentrates on **background** location, which we do not use.

**On manipulativeness**, which the agent was asked to flag: no source treats a per-feature gate as coercive.
Two things to avoid: **never re-show an interstitial on every app open** after denial (only on tap), and
**do not word the recovery as blame**: "Location is off" rather than "You refused".

## 7. Accessibility

**The key insight: the row is never actually disabled, so do not expose it as disabled.** TalkBack
announces "disabled" only on nodes that are both disabled and actionable, which is inconsistent
(issuetracker 172366489), and a genuinely inert control leaves screen-reader users guessing.

| State | Label | Value | Hint |
| --- | --- | --- | --- |
| Undetermined | "Qibla" | "Location needed" | "Requests location permission, then opens the Qibla compass" |
| Granted | "Qibla" | "Location on" | "Opens the Qibla compass" |
| Denied | "Qibla" | "Location off" | "Explains how to turn on location in Settings" |

`accessibilityValue` is the canonical channel for state on iOS; Android's equivalent is `stateDescription`,
which RN's `accessibilityValue` maps to. The recovery sheet needs a `header` role on its title and an
explicit label on the Settings button, since "Open Settings" alone is ambiguous out of context.

## 8. The agent's bottom line

| State | Appearance | On tap | Copy |
| --- | --- | --- | --- |
| Undetermined | normal, trailing "Location needed" | OS prompt immediately, no priming sheet | purpose string below |
| Granted | normal | opens the compass | — |
| Denied | normal, trailing "Location off" | recovery sheet, then `Linking.openSettings()`, then AppState re-check and auto-open | title "Qibla needs your location"; body "The compass points to the Kaaba from where you are. Location is turned off."; buttons **Open Settings** / **Not now** |

Proposed purpose string: **"Your location is used to point the compass toward the Kaaba. It never leaves
your device."**

**The platform wrinkle to encode:** iOS has **no** soft-denied state (one "Don't Allow" is terminal, so
Settings immediately), Android has a three-step ladder (soft denial, rationale, re-request; second denial is
terminal), and **both platforms' one-time options silently expire, so never cache granted across sessions.**

## Key sources

- Android, Request runtime permissions: `developer.android.com/training/permissions/requesting`
- Android 11 permissions update (the deny-twice rule): `developer.android.com/about/versions/11/privacy/permissions`
- Material permissions pattern: `m2.material.io/design/platform-guidance/android-permissions.html`
- Apple HIG, Privacy: `developer.apple.com/design/human-interface-guidelines/privacy`
- Apple, Requesting authorization to use location services
- `UIApplication.openSettingsURLString`: `developer.apple.com/documentation/uikit/uiapplication/opensettingsurlstring`
- RN `PermissionsAndroid`: `reactnative.dev/docs/permissionsandroid`
- **expo/expo#30351** (the `useForegroundPermissions` staleness bug)
- Nielsen, "Inactive GUI Controls: Show, Disable, or Hide?"
- Google issuetracker 172366489 (TalkBack disabled-state inconsistency)
