# Ticket 67: Widget digits follow the app locale, not the device locale

## Planning (2026-10-12)

Session opened after ticket 63's plan was drafted. The owner took D78 (D61
superseded for digit keying only, app locale baked into the props, device-locale
fallback for old blobs) and D79 (static copy stays device-keyed per D44) in the
question round that also ruled 63's formats. The explore fact pack of 2026-10-12
mapped every read, pin and forcing site; it is folded into PLAN.md section 4.

Scratch-worktree proof (deleted): the mixed-script red (`19د` with the device
forced `en` and an `ar` stamp), the green pass after the change, the exact six
re-key sites (three renderer fixtures, two version pins, one stale-entry shape),
`tsc` and Biome clean. Anchors extracted at `fc1e3b89`, all fifteen counting 1.
Gate: `PLAN OK`.

Grill round one (twelve findings, all applied): the new red tests now carry the
Arabic unit words (the English `m` beside Arabic digits would have failed at
green, not red), the fallback case is labelled a green-at-red pin, the
lying-blob case covers R1.5, the green run names the simulation, lock-renderer
and runtime-load suites with corrected paths, and the field union is written
literally so `widgetTypes.ts` gains no i18n import.

Grill round two (four findings, all applied): the commit's add list carries the
three version files, both v1 fixtures strip the stamp, the section 4 pin list
and the proof narrative agree that only the two contract pins and one timeline
shape assertion move, and the proof narrative names the two Android ar-device
tests (the iOS v6 case survives through the fallback). Gate rerun: `PLAN OK`.
