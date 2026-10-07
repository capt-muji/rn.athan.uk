# ADR-012: Post-update "What's New" modal

**Status:** Accepted
**Current as of:** 2026-10-07 (1.29.265)

## Decision

On the first launch after a store update, a modal shows that release's notes once. The behaviour and the release ritual are described in `README.md` ("What's New Popup") and in `shared/whatsNew.ts`. This file holds the reasons.

- **The notes ship inside the binary.** The one moment that matters, the first launch after an update, can be offline, and release notes are frozen at submission anyway.
- **A fresh install never sees it.** The store already showed those notes at install.
- **The shown-version tracker is its own storage key.** `app_installed_version` cannot serve, because `handleAppUpgrade` overwrites it at every boot.
- **Platform glyphs inform and never filter.** The owner decided that every device shows every item, so Android users can see the app is maintained.

## Alternatives rejected

| Alternative | Why it lost |
| --- | --- |
| Remote notes fetched at runtime | They miss an offline first launch, and editable copy has no use when notes are frozen at release. |
| Accumulated notes since the last version seen | A longer modal full of intermediate steps. A history is something a user pulls, not something pushed at them. |
| A bottom sheet or a paged carousel | Too heavy for two to four items. A dialog matches the update modal. |
| A forced delay before Continue | Hostile, most of all to elderly users. The Settings row that reopens the modal answers a hasty dismissal. |
