# FINDINGS XS 137

Read at 2026-10-18, iPhone XS (iPhone11,2), iOS 18.7.10, physical, read-only contact.

| Field | Value |
| --- | --- |
| Installed app | `com.example.athan` 2.0.939 (era check passed: at or past 2.0.811, the Rubik era; D137.5) |
| Arrival language | ar, read from the home-screen accessibility face (labels `الإعدادات`, `لندن، المملكة المتحدة`, `الظهر`, `جمادى الأولى 7، 1448`, the six prayer rows) |
| Language round trip | none: the app was already ar, so no switch happened (D137.4) |
| Restore | ar face verified from the tree after the sheet closed; the app terminated through devicectl; no system setting touched; device lock released |

## Void, the row 120 form (PLAN.md section 7)

- Attempted: agent-device snapshot frames on the static settings sheet (the step's
  primary instrument, D137.2), at default depth, interactiveOnly, and raw depth 40,
  after a one-plus-second settle, twice, across two presentations of the sheet; a
  `wait text اللغة` for 8 s; a scroll to force the sheet's ScrollView to refresh its
  tree; the pixel fallback screenshot (`pymobiledevice3 developer dvt screenshot`) taken
  into `sessions/137/`.
- The phone answered: every snapshot healthy, and the sheet's accessibility tree ends at
  its chrome. Presented, the sheet exposes exactly `Bottom sheet backdrop` (Button, full
  screen), `Bottom sheet handle` (375x24 at y 136.8) and `Bottom Sheet` (375x651.2 at
  y 160.8): zero content nodes. No title, no subtitle, no cards, no rows, at any depth,
  on the settings sheet and on the launch popup alike. `wait` timed out for the language
  row's own label. `pymobiledevice3 developer accessibility list-items`, an instrument
  independent of the runner, agrees: with the sheet presented it returns 12 items, the 9
  home-screen elements behind the backdrop plus the same 3 chrome elements, and no sheet
  content. The app's sheet content publishes no accessibility elements to iOS itself.
- Corroboration: `sessions/137/xs-02-sheet-axitems.json` (the 12-item listing),
  `sessions/137/xs-02-sheet-runner-tree.json` (the wedge note), the runner's wait
  timeout `wait timed out for text: اللغة`, and the unread screenshots
  `sessions/137/xs-01-arrival.png` and `sessions/137/xs-02-settings.png`. The pixel
  fallback could not be read: this executor's model has no image input and the `vision`
  subagent refuses to spawn at this nesting depth, so no image-capable reader was
  reachable this session.
- What the hole removes: every XS surface reading. Rows inside the sheet cannot be
  located by label-matched refs (the plan's only sanctioned locate method on the XS), so
  the Help modal was never opened and the pinned controls were not read either. The
  verdict's XS half is empty; the 3T numbers stand alone. The lead adjudicates before
  the verdict step runs (symptom table, last row).

## Surfaces

| Surface | Nominal size | Face | Frame | Height px | em at scale 3 | Nearest candidates |
| --- | --- | --- | --- | --- | --- | --- |
| Settings sheet title | 22 | Rubik-Medium, unpinned | VOID, no frame obtainable | VOID | not computable | not computable |
| Settings sheet subtitle | 14 | Rubik-Regular, unpinned | VOID, no frame obtainable | VOID | not computable | not computable |
| Settings card title | 14 | Rubik-Medium, unpinned | VOID, no frame obtainable | VOID | not computable | not computable |
| Help question | 15 | Rubik-Medium, pinned 23 | VOID, modal never reached | VOID | not computable | not computable |
| Help answer | 13 | Rubik-Regular, pinned 20 | VOID, modal never reached | VOID | not computable | not computable |

No number in this file was read from the phone beyond the installed version, the OS
version, the sheet chrome's own frames, and the Arabic face. Nothing here is extrapolated
from the 3T or the TTF tables.
