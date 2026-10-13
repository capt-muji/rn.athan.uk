# Ticket 66 findings: always restart on any language switch

Investigation only (D84). Every load-bearing claim cites `file:line`, re-opened and read on
this run's tree (uat at 2.0.181, at or above the Planned at 2.0.179), or a queue record
(D87). A claim neither source carries names its settling test and sits in section 4's
ruling list.

## 1. The switch-path map

One row per hop, in code order, from a language-sheet pick to a settled UI. The D59
restart sits inside the commit (hop 7), before the commit settles and before the dismiss
(hop 8): the grill-corrected trace, verified against the source below.

| # | Hop | Where | Role |
| --- | --- | --- | --- |
| 1 | The pick | `components/sheets/screens/Language.tsx:44` | The row's `onPress` calls `pickLanguage(entry.id, active, commitLanguagePreference, hideLanguageSheet)`; rows disable while busy. |
| 2 | The pick flow | `components/sheets/screens/languageSheet.ts:18-31` | `pickLanguage`: the active row only closes (:24-27); a changed locale calls `commit(id)` and chains `.catch(() => undefined).then(dismiss)` (:29-31), so the dismiss is unconditional (D34, D47). |
| 3 | The commit | `stores/language.ts:65-93` | `commitLanguagePreference` computes the direction in force (:70-71), sets the busy atom (:72), stores the preference (:74), switches the locale (:75), awaits convergence (:76), runs the D59 branch (:77-89), clears the busy atom in `finally` (:91). |
| 4 | The locale bump | `shared/i18n/locale.ts:48-52` | `setActiveLocale` writes the module `active` (:50) and increments `localeVersionAtom` (:51). |
| 5 | The remount | `app/_layout.tsx:85-92` | The layout reads `localeVersion` (:85) and keys `InitialWidthMeasurement` (:90) and `Slot` (:92) with it, so screens and width measurement remount in place; `SheetHost` (:93) carries no key and stays mounted, so the D51 face survives the apply. |
| 6 | The convergence | `stores/language.ts:37-49` | `reconcileLanguageSurfaces` bails when the stamp matches (:38), clears the channel dedup caches (:41), runs `rescheduleAllForLanguageChange` under the scheduling lock (:43), and writes the stamp only after a real pass (:45). |
| 7 | The widget push inside the pass | `stores/notifications.ts:1672-1673` | The language driver runs `_rescheduleAllNotifications({ deferWidgetRefresh: false })`, so the widget push is awaited inside the pass, not deferred past a paint. |
| 8 | The widget push | `stores/widget.ts:237-256` | `refreshPrayerWidgets` pushes both Android snapshots (:242-243) and arms the native minute-refresh chain (:247), or pushes both iOS timelines (:254-255). |
| 9 | The D59 restart inside the commit | `stores/language.ts:77-89` | Only when the direction changes: `I18nManager.allowRTL(true)` and `forceRTL` (:80-81), then `await Updates.reloadAsync()` (:83); a refused relaunch logs and leaves the forced direction for the next launch (:84-88). |
| 10 | The dismiss | `components/sheets/screens/languageSheet.ts:29-31` | The `.then(dismiss)` fires only after the commit settles; on a direction change the reload happens first, so the D51 face dies at the reload, not at the dismiss. |

## 2. The cache inventory

One row per per-locale or per-process cache or selector the switch path reads, writes or
leaves stale (the plan's six expected rows plus the two extra per-process states the path
writes; state outside the switch path is out of scope). "Always-restart" below means a
restart after convergence, the shape the brief asks about; the two mechanisms themselves
are section 3's subject.

| Cache | Where | Reset trigger today | What an always-restart changes |
| --- | --- | --- | --- |
| Per-locale width atoms | `stores/ui.ts:114` (the `widthAtoms` Map), `:122-131` (`nameWidthAtomFor`: key `prayer_max_name_width_<locale>_<side>` at :124, seeded 0 at :128), widen guard `:249-263` (`setNameWidth` rejects non-positive :256 and narrower :260, writes :262) | None on a switch. The new locale's atom is created on first access seeded 0, and the remount (section 1 hop 5) re-measures every name into it (`components/ui/InitialWidthMeasurement.tsx:19-40`, hidden Texts at :22-37). Within-locale staleness self-heals through widen-only writes (row 61's heal) | None. The Map is per-process and rebuilds empty; the MMKV keys survive and the measurement re-runs on the post-restart remount. The Somali wrap class row 61 healed stays healed under every option |
| Legacy width-key sweep | `stores/ui.ts:111` (`clearPrefix('prayer_max_english_width_')`, the 59 re-key) | Once per process, at module evaluation | An in-process reload re-runs it (a no-op today, the keys are gone); a full restart re-runs the same sweep. No behaviour change either way |
| Android channel dedup caches | `shared/notifications.ts:431`, `:434`, `:437` (`createdReminderChannels`, `createdAthanChannels`, `extrasChannelCreated`) | `resetAndroidChannelCaches` (:444-448), called by every convergence pass (`stores/language.ts:41`) | Becomes implicit: process death empties the Sets. The explicit reset already runs before any restart point, so the always-restart adds nothing and removes nothing |
| Countdown name and display selectors | `stores/countdown.ts:74-78` (`makeCountdownNameAtom`), `:90-94` (`makeCountdownDisplayAtom`); sources `standardCountdownAtom` :51, `extraCountdownAtom` :54 | Only their source atoms' writes, one per wall-clock second (`startWallClockTicker` :235-257, per-tick `writeDisplayCountdown` at :353; initial write at :340) | A rebuild empties the derived cache mid-reload, so no stale string survives into the relaunched tree; the cost is paid one way or another (see the transient below) |
| Catalog loader runtime state | `shared/i18n/loader.ts:16-23` (all six catalogs required once per process), `:34-41` (the `MODULES` adapter), per-call reads `:43` and `:45`; `shared/i18n/index.ts:41-49` (`t` resolves per call), `:51` (`prayerLabel` per call) | None needed: the per-call resolution follows the active locale immediately, and the only cached state (the six catalog modules) is locale-independent | None. A reload re-evaluates the module graph (the `catalog_require` marks replay, `loader.ts:15` and `:24`); lookups read the new locale on the first post-restart call with no stale-copy class to clear |
| Baked widget strings | `shared/widgetTimeline.ts:62-71` (`widgetStrings()` bakes `t()` copy per push), Android snapshot `:304-355` (`prayerLabel` names :333 and :339, `localiseDigits` times :334 and :339, `rtl` stamp :350, `strings` :353), iOS timeline rows :156-157 with `rtl` at :210 and :271 | The convergence pass's awaited push rewrites every snapshot and timeline in the new locale (section 1 hops 7-8) | Nothing, provided the restart stays after convergence. A restart before or racing the push is the section 3 ordering question |
| Last-armed stamp | `stores/language.ts:22` (`lastArmedLanguageAtom`, MMKV-backed) | Written only after a real pass (:45); a bail or failure leaves it dirty so the next launch or foreground retries (`device/listeners.ts:73`) | Survives both mechanisms (MMKV). After a restart the launch path re-runs convergence and the stamp-match bail (:38) makes it a no-op when the pass already completed |
| Language preference | `stores/language.ts:25` (`languagePreferenceAtom`, MMKV-backed) | Written at commit (:74), never cleared | Survives both mechanisms: the brief's "keep preferences" holds under every option |
| Commit busy atom | `stores/language.ts:28`, set :72, cleared in `finally` :91 | The commit's own `finally` | On a direction change the reload interrupts the `await` at :83, so the `finally` never runs in the dying tree; the atom dies with it. Harmless today and under always-restart: no reader exists across the reload |
| Module locale state | `shared/i18n/locale.ts:31` (`active`, written by the switch at :50), `:34` (`resolved`, computed lazily once at :43), launch direction `stores/language.ts:59-60` | None within a process: forward-only by D34 | Rebuilt from the MMKV preference at the first read after a restart, so the relaunched tree resolves the same locale the commit stored |

### The transient: confirmed mechanism

Planning's working diagnosis stands, confirmed from the selectors and the row 57 record;
no runtime trace is needed and nothing joins the ruling list from this item.

- `setActiveLocale` writes only the module `active` and `localeVersionAtom`
  (`shared/i18n/locale.ts:49-52`). It writes no countdown atom.
- The name selector depends only on its source atom (`stores/countdown.ts:74-78`); the
  display selector only on its source and `showSecondsAtom` (:90-94). Jotai recomputes a
  derived atom only after one of its dependencies writes, so both keep their cached
  strings across the bump.
- The sources write once per wall-clock second: the wall-clock ticker fires `tick` at each
  :000 boundary (`stores/countdown.ts:235-257`), and each tick ends in
  `writeDisplayCountdown` (:353), which stores a fresh object into the source (:437).
- So from the bump until the next tick, the hero reads the cached old-locale label and
  digits: the one-second transient. The next tick rewrites the source, the selectors
  recompute in the new locale, and the transient closes.
- The record agrees: job 57's audit (commit `ca077a32`) carried "the one-second
  old-locale countdown transient after a switch" to row 66, and queue row 66 carries it
  into this row's evidence.

## 3. The restart surface

### 3.1 The two restart mechanisms

The in-process JS reload. `Updates.reloadAsync()` exists at two production sites: the D59
branch (`stores/language.ts:83`) and the error screen's recovery (`components/ui/Error.tsx:30`,
commented "force reload the entire app"). Expo re-evaluates the JS module graph in the same
process; native state (MMKV, armed notifications, widget snapshots, the refresh chain)
survives it. Measured: row 68's device proof ran it on the 3T ("the relaunch is an
in-process JS reload, measured on the 3T"); row 71's record adds pid unchanged, the launch
line re-appearing about 1.5 s later, and one non-fatal `ReactNoCrashSoftException` from
`AppStateModule.onHostPause` racing the ReactContext teardown on every crossing.

The full process restart. Search terms `exit(`, `killProcess`, `System.exit`,
`terminateApp`, `restartApp`, `relaunch`, `reloadAsync`, `moveTaskToBack` over
`app/`, `device/`, `modules/`, `plugins/` for `.ts .tsx .kt .java .swift`: no exit or
restart-native path exists in any of the four directories. `modules/` holds
`qiblaheading`, `tls13` and `widgetrefresh`; `plugins/` holds config plugins; the only
`reloadAsync` hits in the repo are the two sites above plus their tests. What a restart
module would have to do: on Android, a native module that re-launches the app's own task
(a PendingIntent relaunch with a clear-task flag, or scheduling the relaunch then exiting);
on iOS, no sanctioned self-restart exists for a store app, so the options are the JS
reload of 3.1 or asking the user to relaunch. Per D87 these platform mechanisms are
general facts, not repo records: marked unverified, and the check that would settle them
(a spike module on the 3T; a store-review reading for iOS) is out of this row's scope
(D86) and joins the ruling list.

### 3.2 What a restart re-runs for free

The launch path's reconciliation (`app/index.tsx:115-130`). A reload rebuilds the module
graph, so the one-per-process init latch (`launchInitRan`, `app/index.tsx:57`, checked
:117-119) re-arms and the init pass runs again: the refresh gate reopens (`:124`, the
comment's reason is a cold launch following a force-stop that cancelled every armed
alarm), notifications initialize (`:129`), then the same convergence runs (`:130`). The
stamp-match bail (`stores/language.ts:38`) makes that second pass a no-op when the
switch's pass completed, and the retry when it failed. The listener registration
(`app/index.tsx:108`) and the update check (`:137`) re-run the same way; the AppState
guard (`device/listeners.ts:17`, `:24-25`) is module state the reload resets.

The foreground listener is the second free retry: `reconcileLanguageSurfaces()` runs on
every background-to-active crossing (`device/listeners.ts:73`), so a switch that died
mid-apply converges at the next foreground without any launch at all.

Read against the cold-start hydrate (`app/_layout.tsx:7-10`): the bootstrap import
populates prayer sequences from MMKV before first render on warm-cache launches, so the
post-restart first frame has content with no network wait. A full process restart runs
the identical path from process start; the in-process reload runs it from module
re-evaluation and skips native process init: no MMKV re-open (same backing store), no
notification-channel re-creation from scratch (the dedup caches start empty either way,
section 2).

### 3.3 The D51 face

The face is the busy row (`components/sheets/screens/Language.tsx:52-56`: the spinner and
the applying label on the picked row), driven by the bracket `stores/language.ts:72-92`
(set true :72, cleared in `finally` :91). What dies at a restart: on a direction change
the reload at `:83` interrupts the `await` inside the `try`, the `finally` never runs in
the dying tree, and the whole sheet layer dies with the module graph; the relaunched app
returns with no sheet open. The face spans commit to dismiss and dies at the reload, not
at the dismiss (section 1, hops 9 and 10).

The brief's "the restart point moves after convergence" already holds for the landed D59
branch: the await chain orders convergence (`stores/language.ts:76`) before the restart
(`:77-89`). The always-restart question is whether the same in-commit point serves every
switch. Structurally it does: the direction check at `:77` becoming an unconditional
restart changes no ordering. The face's death is the price, and it is already paid on
every RTL crossing today. Under the status quo the face survives to the unconditional
dismiss on an LTR switch (section 1, hop 10), which is D51 as landed.

### 3.4 The widget re-push ordering

Two push disciplines live in the reschedule driver. The language pass awaits the push
inside the scheduling lock: `rescheduleAllForLanguageChange` runs
`{ deferWidgetRefresh: false }` (`stores/notifications.ts:1672-1673`), whose else branch
awaits `refreshPrayerWidgets()` (`:1625-1628`). Foreground paths defer the push past the
next paint: `rescheduleAllNotifications` (`:1652-1662`) takes the defer branch
(`:1612-1624`, `requestAnimationFrame` then `setTimeout` then the push, catching its own
failure because nothing awaits it).

The native minute chain: `armWidgetRefreshChain()` (`stores/widget.ts:247`) arms the
Android chain whose watchdog "re-arms the tick after the OS has destroyed it"
(`modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh/WidgetRefreshScheduler.kt:167-172`,
a WorkManager periodic). The chain survives both a JS reload and process death.

Race window, in-process reload: push and reload are sequential awaits in one chain
(converge at `stores/language.ts:76`, direction check `:77`, reload `:83`), so no widget
push is in flight when the JS dies. The pushed snapshots live in the widget host, outside
the JS heap, and survive the reload. After the reload the launch path's convergence
stamp-bails (`stores/language.ts:38`), so the widgets are pushed exactly once per switch.
The teardown race the records carry is the AppState soft exception (row 71), not a widget
race.

Race window, full process restart: identical up to the restart point; the process dies
instead of the JS heap. Snapshots and the WorkManager state survive process death (same
citations). The race the brief names opens only if the restart moves before the awaited
push lands: a restart ordered before or beside the pass could kill the process mid-push
and leave the widgets in the old locale until the next natural push (a foreground return,
a reschedule, or the next switch). The brief's "restart last as a force-clean" and the
landed in-commit point (3.3) both keep the push first, so the option's cost is that
ordering discipline, held as a requirement rather than a free property.

### 3.5 The splash cost

The gate chain: `SplashScreen.preventAutoHideAsync()` at `app/_layout.tsx:49`; the reveal
gates at `app/index.tsx:78-90` (the Masjid icon bitmap `:81`, the decoration expectation
`:86-89` and load `:90`); `hideAsync()` at `:186` (the cold-launch branch) and `:206`
(the reveal-ready branch). Every restart pays the chain again: the reload re-evaluates
the module graph, the loaded atoms reset (`masjidIconLoadedAtom` starts false,
`stores/ui.ts:70`; `decorationsLoadedAtom` `:81`), and the reveal holds until the bitmap,
and in season the sprites, re-arrive.

Price: row 71's recorded span prices the whole in-process reload at about 1.5 s to the
launch line (reload-to-launch-line). The splash gates' share of that span is unquantified
in the records (D87) and joins the ruling list. Under always-restart the span is paid
once per switch; under the status quo an LTR switch pays none of it: the remount
(`app/_layout.tsx:90-92`) re-renders into a revealed app, the loaded atoms still hold
true (module state a remount does not reset), and the reveal gate re-passes on the first
post-remount frame (`app/index.tsx:198-206`).

### 3.6 The status quo baseline, and the preferences

What the in-place remount already delivers: the layout keys `InitialWidthMeasurement` and
`Slot` on `localeVersionAtom` (`app/_layout.tsx:90-92`), so every screen, the width
measurement and the countdown hero remount cold in the new locale while `SheetHost`
(`:93`) stays mounted through the apply (D51). The convergence pass re-arms copy,
channels and widgets before the commit settles (section 1, hops 6 to 9).

What it leaves open, from section 2's inventory: the one-second countdown transient is
the only stale-string class the switch path leaves open. Every other cache is reset by
the pass (channels), keyed per locale (width atoms), resolved per call (catalogs), or
rewritten by the awaited push (widget strings).

Preferences survive both mechanisms: `lastArmedLanguageAtom` and `languagePreferenceAtom`
are MMKV-backed (`stores/language.ts:22`, `:25`, through `atomWithStorageString`,
`stores/storage.ts:106-114`: `database.getString` and `database.set`), and MMKV is native
state neither the JS reload nor a process death touches. The error screen's owner ruling
already rests on exactly this: "the destruction is acceptable because preferences survive
it" (`components/ui/Error.tsx:13-15`, the reload at `:30`). The brief's "keep
preferences" holds under every option.

