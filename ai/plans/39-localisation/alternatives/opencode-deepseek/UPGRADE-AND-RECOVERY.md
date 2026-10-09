# Upgrade path, switch transaction and recovery

Two things must hold under every interleaving: an armed alarm is never missed, and the
stored alert preferences and armed identifiers survive 2.0.0 byte-for-byte. This file
specifies the upgrade steps and the failure matrix.

## 1. The 1.x to 2.0.0 upgrade

Order at launch `app/_layout.tsx:1-10` imports, then `stores/bootstrap.ts:53-81`):

1. Module evaluation resolves `DEVICE_LANGUAGE` from the device locale
   (`stores/language.ts`), before any UI.
2. `stores/bootstrap.ts:65` checks `wasAppUpgraded() && cacheSchemaChanged()`. The
   schema does not move (`stores/version.ts:135`), so `cacheSchemaChanged()` is false
   for a 1.x to 2.0.0 update and bootstrap hydrates from cache (`stores/bootstrap.ts:39-51`).
   A warm launch paints real content and no wipe touches the timetable or the alarms.
3. `stores/sync.ts` runs `handleAppUpgrade` (`stores/sync.ts:523`). For an upgrade it
   calls `forceNotificationReschedule` (`stores/version.ts:261-263`), which reopens the
   2-hour gate through the atom (`stores/version.ts:194-201`), then runs
   `migrateLocalisation(storedVersion)` beside `migrateIndexKeyedAlertPreferences`
   (`stores/version.ts:289`).
4. `migrateLocalisation` removes `preference_show_arabic_names` and nothing else. It
   does not write `preference_language` and does not touch any `scheduled_*` key.
5. `initializeAppState` (`stores/sync.ts:234-261`) rebuilds the sequences, calls
   `reconcileLanguageSurfaces`, then pushes widgets with the resolved locale.
6. Notification initialization (`app/index.tsx:102-118`) runs a reschedule, which
   renders titles and creates channels in the resolved language.

What survives, and why:

| Data | Survives because |
| --- | --- |
| Alert and reminder preferences | `preference_` is a keep prefix (`stores/version.ts:151`) and no migration writes these keys |
| Armed OS notification identifiers | No code path changes an identifier or a record key |
| Notification records | `scheduled_*` is a keep prefix in the cache swap (`stores/sync.ts:369-370`) |
| Prayer-time cache | `CACHE_SCHEMA_VERSION` unchanged (`stores/version.ts:135`) |
| Audio files | Names derived from `PrayerId`, unchanged |
| The dead `preference_show_arabic_names` | Removed on purpose; it no longer has a reader |

## 2. The language switch state machine

State: `requested` (`preference_language`), `chosen` (`preference_language_chosen`),
`applied` (`preference_language_applied`).

```
IDLE: requested == applied
  user picks L2 ->
COMMITTED: requested = L2, chosen = true            (atom write, UI re-renders)
  rescheduleNotifications()                         (schedule-first-then-cancel-stale)
  refreshWidgets()
  deleteSupersededChannels(L2)
APPLIED: applied = L2                               (reconcile on next launch if interrupted)
```

`switchLanguage` and `reconcileLanguageSurfaces` run the same apply body; only
`switchLanguage` writes `requested` and `chosen`. A launch always calls `reconcile`,
which no-ops when `requested == applied`.

Interleavings:

| Interruption | On-disk state | Recovery |
| --- | --- | --- |
| Crash after COMMITTED, before APPLIED | `requested = L2`, `applied = L1` | Next launch reconcile re-runs apply |
| Crash during reschedule | Some alarms L2, some L1, identifiers unchanged | Repair marks + sweep plus reconcile |
| Crash during channel delete | Some old channels remain | Init delete removes them; alarms unaffected |
| Crash during widget push | Widget shows L1 until next push | Language subscription and launch push re-send |
| Reschedule throws | `applied` stays L1 | Reconcile retries next launch |
| User switches back to L1 mid-apply | Two reconciles, second wins, converges on L1 | Idempotent by requested/applied |

## 3. Failure-mode matrix

| # | Failure | Without care | Response | Evidence |
| --- | --- | --- | --- | --- |
| 1 | Process death between language commit and scheduling | New-language UI, old-language alarms indefinitely | Durable `requested`/`applied`; launch reconcile | `MODULE-CONTRACTS.md` §6 |
| 2 | A scheduling call refused mid-switch | A possibly unlocalized alarm | Identifiers unchanged; repair mark; sweep retries | `stores/notifications.ts:333-390,448-472` |
| 3 | A cancel refused mid-switch | Record kept for a live alarm | `canStillFire` gate keeps the record | `stores/notifications.ts:124-134,973-990` |
| 4 | Android channel deleted while an alarm references it | Alarm on the fallback channel | Reschedule to the new ids before delete | `MODULE-CONTRACTS.md` §12 |
| 5 | Corrupt or unknown stored locale | Crash or blank UI | `isLocaleCode` guard, then device, then English | `shared/i18n/locales.ts` |
| 6 | Device locale is unshipped (Polish, Indonesian) | Wrong language | `resolveDeviceLanguage` returns English | `shared/i18n/locales.ts` |
| 7 | `Intl` missing or throws | Formatter throws | Hijri keeps its Gregorian fallback; Gregorian has a tested fallback path | `shared/time.ts:241-254` |
| 8 | A prayer has no readable time | A title for an alarm that must not fire | Existing skip unchanged | `stores/notifications.ts:847-850` |
| 9 | Widget push fails | Stale widget | Failure-tolerant, retried on next push | `stores/widget.ts:226-228` |
| 10 | User switches language rapidly | Interleaved applies | Serializable through the scheduling lock; last write wins | `stores/notifications.ts:55-79` |
| 11 | 50 locales later | Key sprawl | Catalogs are data; channel delete enumerates `LOCALE_CODES` | `PROPOSAL.md` §6, `DATA-AND-IDENTIFIERS.md` §7 |
| 12 | Arabic device | Mirrored row | Forced `direction: 'ltr'` plus a guard test | `PROPOSAL.md` §7 |

## 4. What is deliberately not done

- No journal file or transaction table. The `requested`/`applied` mismatch is the
  journal, which is smaller and cannot go stale.
- No migration of identifiers or record keys. Any such migration is the one operation
  that can orphan an alarm, and the hard constraint forbids it.
- No channel id change to the notification identifier. The two are independent; only
  the channel target moves.
- No network fetch for catalogs. Offline behaviour is preserved by construction.
- No version bump of `CACHE_SCHEMA_VERSION`. The cache shape is unchanged.

## 5. Verification checklist for the build (acceptance)

A build session may call the architecture done only when all of these hold on a device,
in addition to `yarn validate` green:

1. Upgrade install from a 1.x build with a mix of alert preferences: every preference
   reads back the same integer, and `yarn check:device` shows the same armed identifiers
   within one foreground refresh (`e2e/scripts/device-checks.sh`).
2. Switch language: the row, countdown units, date and month names change immediately;
   no alarm is cancelled (identifier set is a superset across the switch).
3. Kill the app between the language write and the reschedule (test build with an
   injected throw), relaunch, and confirm the OS surfaces reach the new language.
4. Arabic device locale: the row is not mirrored and stays left-aligned.
5. Widget on the home and lock screen shows localized names and localized captions
   after a switch, with no English fallback visible.
6. Android Settings shows one channel set in the selected language, with no left-over
   channels from the previous language.
