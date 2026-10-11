# Device atlas: Samsung Galaxy S23 (SM-S911B)

Serial `S23_SERIAL`. Android 16 (API 36), One UI. Third Android test device beside the
OnePlus 3T and the Oppo Find X8. The tall-font phone for the localisation job (target SDK 36).

Read this BEFORE screenshotting. Screenshot only what is missing, then write back what you learned.
Every coordinate is keyed on model + panel + density + screen state, and is void when any of those change.

## Panel and density

| What | Value |
| --- | --- |
| Physical size | 1080x2340 |
| Density | 480 dpi (3x) |
| Locale (as found 2026-10-11) | en-GB |
| Automatic time | on (`auto_time=1`) |

## Launcher map (measured 2026-10-11 via uiautomator, content-keyed)

Four pages. One UI's `Home screen Page N of M` content-desc is STALE in uiautomator dumps
(it kept reading `Page 3 of 4` on every page), so navigate by content, never by that desc.

| Page (left to right) | Contents |
| --- | --- |
| 1 | Investing.com widget [265,762][1017,1268], Scene (Kasa) widget [265,1316][1017,1822], hotseat |
| 2 | Digital clock widget [265,247][816,675], icons (Voice Recorder, Calculator, Obsidian, Qaf, YouTube, Camera, Hadith Collection, RedReader) |
| 3 | Icons: ChatGPT [41,738], OpenCode [841,738], RikkaHub [41,1015], folder [441,1015], Perplexity [841,1015], LocalSend [41,1292], folder [441,1292], WhatsApp [841,1292], Pinterest [41,1569], folder [441,1569], Play Store [841,1569] |
| 4 | Slack [841,1292], WhatsApp [41,1569], Authenticator [841,1569], hotseat. The whole top (y 247 to 1292) is EMPTY: the widget placement spot |

Hotseat (all pages): Phone [39,2010][239,2295], Messages [239,2010][439,2295],
**Athan [439,2010][639,2295]** (tap 539,2150), Brave [639,2010][839,2295],
Outlook [839,2010][1039,2295].

No Athan widget is hosted as found (dumpsys appwidget hosts: Samsung clock, Kasa, two
Investing watchlists on pages 1-2).

## Install ritual

| What | How |
| --- | --- |
| Install | `adb -s S23_SERIAL install -r <apk>` completes unattended; no One UI verifier prompt appeared (2026-10-11, 66 MB release APK). |
| Launch | `adb -s S23_SERIAL shell monkey -p com.mugtaba.athan -c android.intent.category.LAUNCHER 1` |
| In-app navigation | The Settings button sits bottom-centre at (540, 2122); the in-app sheets open from it. Maestro LABEL taps on RN nodes are UNRELIABLE here: a `tapOn {label: 'الإعدادات'}` opened the prayer-details overlay instead of the sheet (the driver tapped a row). Drive the app with measured coordinates plus screencap verification; read live text with Maestro `hierarchy` while it still exposes the tree (see the driver note below). |
| Screen sleep | A window-manager override (`mUserActivityTimeoutOverrideFromWindowManager=10000`) sleeps the display ~10 s after the last input even on USB. `svc power stayon usb` holds it for the session (not persistent; resets on reboot). |
| Keyguard | Swipe-only. `input keyevent KEYCODE_WAKEUP` + `input keyevent 82` + swipe up (540 2000 -> 540 500) unlocks. A plain `wm dismiss-keyguard` alone did not. |
| Launcher paging | Swipes at y=1900 do NOT page (dock area); swipe at y=1100. One UI's `Page N of M` desc is stale in dumps; navigate by content. |

## Widget picker route (One UI, device-locale labels, measured 2026-10-11)

1. Navigate to the free-top page (the page holding Slack/WhatsApp/Authenticator only).
2. Long-press empty space: `input swipe 540 400 540 400 1200` -> home-screen EDIT MODE (not a context menu).
3. Edit-mode action bar: Wallpaper and style (150, 2169), Themes (408, 2146), **Widgets (668, 2147)**, Settings (928, 2147).
4. The picker lists Athan's 8 gallery entries ("Next Prayer (Light/Dark) 2x2", "Extra Times (Light/Dark) 2x2/4x2", medium variants) with live previews. CAUTION: a swipe INSIDE the picker can drag-place a widget straight to the home page (it landed the extras dark widget once) - tap deliberately, never scroll fast.
5. One UI chrome (picker, edit mode) reads the DEVICE locale (en-GB as found), never the app's in-app language.

## Tooling findings (2026-10-11)

- Maestro `hierarchy` stops exposing RN content after the prayer-details overlay has been opened and closed a few times, and stays empty across app restarts; reinstalling the driver might restore it (not tried - installs on the owner's phone). Until then pixels + screencap carry the proof. `uiautomator dump` never exposed RN text here (status bar and the settings button only).
- The countdown animation does not block `maestro hierarchy` while the tree is still exposing.
- Screenshots capture black when the display sleeps; wake first.
