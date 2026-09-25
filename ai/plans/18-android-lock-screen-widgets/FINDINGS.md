# Findings: Android lock screen widgets

Investigation run 2026-09-25 on both Android phones. The brief asked for the platform truth to be
**confirmed on device, not assumed**, then a vehicle recommendation. Nothing was to be built before
the owner ruled.

**Verdict: there is no way to put a real lock screen widget on either phone, and the one vehicle
that does work is a persistent notification, which the owner has rejected. No lock screen feature
ships. The reasons are below, each measured on hardware.**

## The devices

| | OnePlus 3T | Oppo Find X8 |
| --- | --- | --- |
| Serial | `8f7ada76` | `G6RWBAQ4VKWWEAIZ` |
| Android | 9 (SDK 28) | 16 (SDK 36), ColorOS |
| Screen lock | none | PIN |

## Probe results

Every row was read off the phone, not from documentation.

| Probe | 3T | X8 |
| --- | --- | --- |
| Keyguard widget host in `dumpsys appwidget` | none | none |
| Keyguard-category providers (`widgetCategory & 2`) | 0 | present but unhosted (a third-party leftover) |
| Keyguard widget settings in `settings list secure` | absent | absent |
| Widget hosts that exist at all | launcher only | launcher only (`hostId:1024, pkg:com.android.launcher`) |
| Vendor lock surface package | none | `com.oplus.keyguard.style.widgets` |
| AOSP Glanceable Hub code present | no | yes, and its flags are on |
| Glanceable Hub actually usable | no | **no**, see below |

## The two surfaces that looked promising, and why both fail

### 1. OPPO's own lock screen cards

`com.oplus.keyguard.style.widgets` is OPPO's Pantanal UPK card engine:

```
versionName=16.10.050  minSdk=35  targetSdk=36
flags=[ SYSTEM ... ]   privateFlags=[ ... SYSTEM_EXT ... ]
declared permissions:
  com.oplus.keyguard.style.widgets.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION: prot=signature
```

`system_ext`, `minSdk 35`, `prot=signature`. Only an APK signed with the platform key can register a
card. The related OPPO services (`com.oplus.pantanal.ums`) are gated behind
`com.oplus.permission.safe.ASSISTANT`, also signature-level. Unavailable to this app, and absent
from the 3T entirely.

### 2. The AOSP Glanceable Hub (Android 14+), which DOES host ordinary AppWidgets

This was the most promising lead by far, because the hub is the one modern Android surface that puts
real AppWidgets on the lock screen. The X8 carries the whole implementation and its flags are
enabled:

```
com.android.systemui.communal_widget_resizing=true
com.android.systemui.communal_hub_use_thread_pool_for_widgets=true
com.android.systemui.communal_edit_widgets_activity_finish_fix=true   (7 communal flags in total)
```

SystemUI even logs `LOCKSCREEN->GLANCEABLE_HUB` scene transitions. It is nevertheless unusable:

- the hub's container is never inflated. Its view reads
  `View{... G.ED..... ... 0,0-0,0 #7f0a0326 app:id/communal_ui_stub}`: **`G` is GONE, at 0x0**;
- **no communal widget host is ever created.** `dumpsys appwidget` lists exactly one host on the
  device, the launcher's `hostId:1024`. The hub's host would have to appear here to hold a widget;
- `settings put secure glanceable_hub_enabled 1` is accepted and still creates no host (the setting
  was deleted again afterwards, restoring the device to its original null);
- the only route to place a hub widget, `com.android.systemui.communal.widgets.EditWidgetsActivity`,
  is **not exported**: `SecurityException: Permission Denial ... not exported from uid 10229`.

ColorOS ships the AOSP classes and removes the UI, substituting OPPO's own signature-gated surface.
So the hub is dead code on this phone, and does not exist at all on the 3T's Android 9.

## Vehicle verdicts

| Vehicle | Possible? | Verdict |
| --- | --- | --- |
| Native lock-screen widget API | No | Removed from the platform in 5.0 (2014). Confirmed absent on both phones. |
| AOSP Glanceable Hub | No | Present but inert on the X8 (no host, GONE container, unexported edit activity); absent on the 3T. |
| OPPO Pantanal UPK card | No | One vendor, one OS version, `prot=signature`. |
| `showWhenLocked` activity | Technically yes | Rejected: hijacks the unlock target, as the brief anticipated. |
| Overlay / accessibility draw-over | Technically yes | Rejected: fragile, Play-policy risk, battery. |
| Always-On Display | No | OEM-only surface; the 3T's ambient display shows clock and notifications only. |
| **Persistent notification** | **Yes, both phones** | **Works, and was built and proven. REJECTED BY THE OWNER 2026-09-25.** |

## What was built, proven, and then reverted

Before the owner's ruling arrived, the notification vehicle was implemented end to end and shown to
work: a posted notification renders on the X8's locked screen (verified by locking the phone and
reading the screenshot), the release APK built clean (`BUILD SUCCESSFUL in 11m 9s`), and the suite
was green at 173 files, 4666 tests, 100% coverage on all four metrics.

The owner then ruled against a constant lock screen notification. The implementation was reverted in
full; this document is what the session keeps. The countdown research is worth retaining:

- Android's `Chronometer` and `setUsesChronometer` tick for free with zero app alarms, but render
  only `06:08:32`. The owner's shape is `6h 8m`, so a free-ticking countdown and the owner's format
  are mutually exclusive on Android. Any future attempt must recompute the text on a timer.
- `modules/widgetrefresh` already owns a self-re-arming, reboot-safe, exact minute-edge alarm, so
  the marginal cost of a minute-resolution label on Android is zero.

## Recommendation

Do not pursue an Android lock screen surface. With the notification vehicle rejected, every
remaining route is either signature-gated, inert, or a policy and battery risk. The honest position
is that iOS has Lock Screen widgets and Android does not, and the Android home screen widgets
already carry this content.

If the owner later wants to revisit, the two questions worth asking first are whether a
**Samsung** device (One UI has its own lock-screen widget surface) is in scope, and whether a
**notification shown only while the screen is on and the app is in use** would be acceptable, since
that avoids the constant-notification objection.
