# R18. The 2.0.0 upgrade path, adversarially designed (research agent report, 2026-10-09)

Dispatched by the owner's instruction after his question: "When the user upgrades to 2.0.0, what
is the right approach? Should we wipe everything except their preferences and then reschedule
everything, so the database is as clean as possible?" All machinery verified against the repo.

## (a) Verdict

**A, hardened.** No wipe, no `CACHE_SCHEMA_VERSION` bump, three key-state-guarded migrations
(language stamp, toggle delete, width seed), the existing forced reschedule left exactly as it
is, and the What's New ritual. Every step is guarded by key absence rather than by version
comparison, and the width seed moves to module-eval time so it lands before the atoms that read
it exist.

**Against B (wipe-except-preferences).** `clearUpgradeCache` (stores/version.ts:208-223)
whitelists `app_installed_version`, `whats_new_shown_version`, `cache_schema_version`,
`preference_`, `prayer_max_english_width_`. Everything else goes: every `prayer_YYYY-MM-DD` day,
`fetched_years`, and every `scheduled_notifications_*` / `scheduled_reminders_*` bookkeeping
record. The costs:

- **Offline users get no timetable.** A wiped install has zero days, so `hydrateFromCache` finds
  nothing (stores/bootstrap.ts:43-46), and when the fetch fails `sync` throws to the error screen
  because `hasUsableDays()` is false (stores/sync.ts:529-532). That screen's Refresh wipes
  again. Under A the same user paints 100 percent of the cached year on the first commit. The
  invariant "works fully offline after first sync" is suspended for the entire upgrade session
  under B, for no shape reason.
- **Alarms become unmanageable while offline.** The OS keeps the armed alarms, but with no
  records the sweep refuses to cancel anything (notifications.ts:1521-1526) and the per-prayer
  cancel paths enumerate records they no longer have (device/notifications.ts:163, :272). A user
  who turns a bell off while offline keeps hearing the athan. The reschedule that would rewrite
  the records bails while the cache is empty (notifications.ts:1594-1610).
- **B does not even buy cleanliness.** `preference_show_arabic_names` matches the `preference_`
  whitelist, so the wipe keeps the one dead key this release exists to delete. The only stale
  bytes 2.0.0 leaves are that key, the two legacy width keys, and `arabicName` inside old
  bookkeeping records. A deletes the first two explicitly; the third disappears on its own: the
  forced reschedule rewrites every armed record, and the sweep reads only `id` and `date`.

**Against the C bump.** The marker's own law: bump "ONLY when a release changes the SHAPE of
cached data, so that data written by the previous version can no longer be read correctly"
(version.ts:122-125). Verified against every stored family:

| Stored family | 2.0.0 effect | Readable by new code |
| --- | --- | --- |
| `prayer_YYYY-MM-DD` days | none: shape is `date` plus nine lowercase time fields, no name fields (shared/types.ts:108-122) | yes, byte-identical |
| `scheduled_*` records | an extra `arabicName` JSON field | yes, extra fields are ignored by parse |
| `preference_*` | one key deleted, one added | yes |
| width keys | new per-locale keys seeded from legacy | yes |
| `fetched_years` | untouched | yes |

The row-shape change (`english` becomes `id`, `arabic` leaves the row) lives in code that
rebuilds rows from storage on every launch; it is never cached. A bump here is a category error
that converts a code change into an offline outage.

## (b) Upgrade sequence

Phase 0, before first render:

1. **Freeze test first.** `shared/__tests__/prayerIdContract.test.ts` (R15) pinning the four
   MMKV key families and both OS identifier builders byte-for-byte, `last third` space form
   included. Every step below is safe only because those bytes do not move.
2. **Width seed, module scope of `stores/ui.ts`, above the per-locale atom definitions.** For
   each of `standard`, `extra`: if `prayer_max_english_width_en_standard` is absent and the
   legacy `prayer_max_english_width_standard` is present, copy the number with a raw MMKV read
   and write; then remove the legacy key unconditionally. Raw writes are legal here because no
   atom over the new keys exists yet in the process. Module evaluation runs before any component
   reads the atoms, which satisfies "the upgrade runs before the first render that needs the new
   shape". Both wipe keep-lists already carry the `prayer_max_english_width_` prefix, so the
   seeded keys survive any future wipe.

Phase 1, `handleAppUpgrade` (stores/version.ts:230-292), unchanged skeleton:

3. **No bump.** `CACHE_SCHEMA_VERSION` stays 1. The ordinary-upgrade branch runs
   `forceNotificationReschedule()`, which resets `preference_last_notification_schedule_check`
   through the atom (version.ts:194-201). That is the entire "notification copy re-arms once"
   step, and it already exists.
4. `setStoredVersion`, marker re-stamp, fresh-install What's New seed: unchanged.
5. **New `migrateToLocaleDefaults()`, after `migrateIndexKeyedAlertPreferences`, both steps
   guarded by key state, not version:**
   - If `preference_language` is absent, write `'en'` through the language atom. The atom write
     matters because atoms created at module eval hold pre-migration snapshots, and a bare
     `database.set` leaves them reading the default all session.
   - `Database.remove('preference_show_arabic_names')`. Idempotent by nature.
6. `migrateIndexKeyedAlertPreferences` stays last and untouched. Its pattern matches none of the
   keys above, and the repair-mark family is untouched, so outstanding repair generations
   survive and finish.

Phase 2, post-paint, no new machinery:

7. **The forced reschedule does the reconciliation.** At app/index.tsx:118 and :144,
   `refreshNotifications` runs the reopened gate into `_rescheduleAllNotifications`: every
   enabled prayer and reminder re-arms under same-id replace, so the copy moves from the 1.x
   title builder to the catalog builder with `en` bytes identical. Every armed bookkeeping
   record is rewritten without `arabicName`; stale per-prayer ids cancel after their replacements
   arm; the sweep reconciles against surviving records; the widget push defers past the next
   paint. Old records that still carry `arabicName` parse fine: tolerance at read, organic
   disappearance on write. Offline, this step arms entirely from cached days and bails rather
   than arms against missing data.
8. **What's New gate.** Stamp the 2.0.0 items, move `WHATS_NEW.version`. Shows once per upgrade
   and records on display; the fresh-install seed keeps it from new users. Zero upgrade code.
9. **Widget settings sync.** The language atom joins `readWidgetSettings` and subscribes beside
   `hijriDateEnabledAtom`, debounced 1000 ms. Step 7 already re-pushed once.

Ordering proof: the only first-render inputs whose shape changed are the width keys (seeded at
module eval) and the language atom (absent key defaults to `en`, byte-identical rendering). Day
rows keep their stored shape, so bootstrap's synchronous hydration is already valid under 2.0.0
code. `handleAppUpgrade` runs later, inside `sync()` on the async path, and nothing it writes is
read by first paint.

## (c) Crash-window table

| Dies right after | Disk state left | Next-launch healing | User impact |
| --- | --- | --- | --- |
| 2, mid width seed | one `en` width key, one legacy key | per-key absence guard completes the copy | none |
| 3, gate reopen | old version key, gate open | `wasAppUpgraded` fires again; every step idempotent | none |
| 4, before language stamp | version 2.0.0, no `preference_language` | key-absence guard still stamps (a version gate would skip this) | none |
| 5a, before toggle delete | dead key present with no reader | remove runs next launch | none |
| 5b, before post-paint refresh | gate open, 1.x alarms armed | gate unstamped on a failed pass, next foreground retries | alarms fire as armed; `en` copy byte-identical |
| 7, mid re-arm | some ids replaced, rest 1.x-armed, same ids | gate open, full pass replaces the rest | none; never zero armed |
| 7, mid record rewrite | mixed records with/without `arabicName` | extra JSON field ignored | none |
| 7, mid sweep | some strays cancelled | gate open, sweep retries | none |
| 7, deferred widget push | widgets one cycle stale | pushes on launch, foreground, reschedule, background task | stale names until next push; copy identical |
| 8, before shown-version write | modal may show once more | recorded on display | modal twice at worst |

## (d) Test suite shape

| Suite | What it proves |
| --- | --- |
| `stores/__tests__/upgrade2_0_0.test.ts` (new) | seeds the `en` width keys and removes legacy; never overwrites existing per-locale values; stamps the language only when absent; removes the dead toggle idempotently; keeps `prayer_` days with no schema bump (goes red if anyone bumps the marker casually); keeps the bookkeeping records |
| `stores/__tests__/upgrade2_0_0CrashWindows.test.ts` (new) | one test per crash-window row: kill, relaunch, assert convergence |
| `shared/__tests__/prayerIdContract.test.ts` (new, R15) | the freeze table: 2.0.0 arms beside 1.x alarms instead of orphaning them |
| `stores/__tests__/version.test.ts` (existing, unmodified) | copy re-arms once with zero new machinery |
| `stores/__tests__/ui.test.ts`, `InitialWidthMeasurement.test.tsx` (extend) | per-key widen-only, no cross-locale leakage; measuring side matches seeded side |
| `widgetSettingsSync.test.ts` (extend) | language subscription fires the debounced push |
| `shared/__tests__/notifications.test.ts` (extend) | a 1.x record fixture carrying `arabicName` reconciles by id without throwing |
| What's New suites (existing) | 2.0.0 items show once on upgrade, never on fresh install |

## (e) What would change this verdict

- Any stored day shape changes (field added, retyped, or a name field sneaks in): the bump law
  takes over, because a stale-shaped record produces a wrong prayer time, which outranks every
  concern above.
- The id vocabulary stops being byte-exact with the stored keys (the `last_third` landmine): a
  key-family migration becomes the design's center, and alarm orphaning joins the risk list.
- A non-`en` locale is stamped at upgrade: the width seed must seed `en` only and let the other
  locale measure, accepting one reflow by design.
- The language key leaves the `preference_` prefix: both wipes drop it; it must stay under
  `preference_`.
- The reschedule loses same-id replace: the never-zero property dies, and R11's persisted intent
  marker and completion pass replace the one forced gate.
- A functional read of `arabicName` appears in bookkeeping: a one-pass strip joins step 5.

## Assumptions

- The language preference key is `preference_language`, a string atom defaulting to `en`. No
  repo file fixes the name yet; this is the one new MMKV key, named for the owner's sign-off per
  the ask-first rule.
- 2.0.0's catalog renders `en` byte-identical to today's literals, per R15; the whole
  "copy re-arm is a no-op replace" argument rests on it.
- The per-locale width key shape is `prayer_max_english_width_<locale>_<standard|extra>`; the
  seed copies numbers, never re-measures.
- Old bookkeeping records keep parsing under the narrowed type because the record reader is
  `JSON.parse` with no schema validation (stores/database.ts:42-48, :74-83).
