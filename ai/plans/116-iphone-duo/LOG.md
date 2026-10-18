# Ticket 116 - ledger

**Resume from:** the plan grill and the gate (`bash scripts/check-plan.sh ai/plans/116-iphone-duo`,
expect `PLAN OK`), then step 1's cold glass matrix, then the audit. The planning investigation is
complete and section 2 of `PLAN.md` holds every decision.

## Planning (2026-10-18)

Her evening order earlier the same day superseded the 2026-10-16 two-pane design and set the
ticket's present shape: no iPhone Duo-specific layout, the Duo rides the existing adaptable-width
system, one schedule in the middle, no other form factor changed, `expo-hinge` optional,
production-ready with full testing. Her follow-up reduced the ticket to investigation and testing.
The bench record (branch `bench/116-iphone-duo` at `2148368a`, the 2026-10-16 facts and the
superseded two-panel specification) stays in the queue row and in git history; nothing from that
branch merges.

### The toolchain

Xcode 27.1 (27A9275) with the iOS 27.1 SDK (`iphoneos27.1`, `iphonesimulator27.1`), the iOS 27.1
simulator runtime (24A94425) and the `iPhone Duo` device type are all present. The preflight check
that failed in the 2026-10-16 lane now passes.

### Readings taken at planning, on glass

The installed mock build 2.0.1054 was built with the iOS 27.1 SDK. The simulator was booted, the app
opened with `agent-device`, and every value below was read from the accessibility tree's application
rect and from the simulator's own screenshots.

| Reading | Closed pose | Open pose |
| --- | --- | --- |
| Display | 466 by 678 points | 951 by 669 points |
| App window | 466 by 678 points, the whole display | 469 by 669 points, centred, 241 points each side |
| Schedules | one, the Standard page | one, the Standard page |
| Page dots | present | present, at the app window's bottom |
| Overlay | opens on a tapped row, explanation box inside the window | opens on a tapped row, explanation box inside the window |
| Settings sheet | opens inside the window, scrolls | opens inside the app window, scrolls |
| Extras page | one swipe, rows filled | one swipe, rows filled |
| Cross-fold state | process 98145 before and after, overlay stayed open | same |
| Cold launch while open | not applicable | 469 by 669 points, Standard page |

Evidence: `$HOME/athan-gitree/sessions/116/inv-closed.png`, `inv-open-1.png`,
`inv-open-extras.png`, `inv-open-overlay.png`, `inv-open-settings.png`, `inv-closed-overlay.png`,
`inv-open-cold-launch.png`, `inv-half-open.png`. No screenshot is committed.

### What the readings mean

The closed display grants the app the whole 466 by 678 points. The open display is a landscape
panel; the portrait lock (`app.json` `"orientation": "portrait"`, `requireFullScreen: true`, the
bundle's portrait-only orientation list) makes iOS present the app in a 469 by 669 point portrait
window centred in it. Inside that window the layout is the shipped one: one `Screen` at 469 points
wide, below the 500 point `SIZE.contentMaxWidth` cap, so the cap never binds and no wider layout is
reachable on this device.

Filling the open panel needs landscape support. That turns rotation on for every iPhone and iPad,
which her order excludes, and the fixed vertical stack clips at an iPhone's landscape height. The
presentation is therefore the shipped portrait behaviour, recorded in the row.

### The agent-ruled decisions

Recorded in `PLAN.md` section 2.1 as D116.1 to D116.7, each challenged once:

- **D116.1** the Duo rides the shipped pager and `Screen` cap, no Duo branch. Challenge: a wide
  window could want two columns. Answer: her evening order supersedes the two-pane design by name.
- **D116.2** the two-pane design and `SIZE.twoPaneMinWidth` are dead; the bench branch stays
  history. Challenge: the bench code is written and tested. Answer: the later order outranks saved
  work.
- **D116.3** no orientation or resizability change. Challenge: Apple asks for all orientations.
  Answer: that checklist targets resizable apps; her order forbids changing other form factors.
- **D116.4** no `expo-hinge`. Challenge: hinge state could separate half-open. Answer: half-open
  presents the same 951 by 669 screen, so it would select nothing.
- **D116.5** no unit test. Challenge: her order says full testing. Answer: no production line
  changes, Jest cannot construct the OS-granted window, and the glass matrix is the test.
- **D116.6** the centred portrait window is accepted and recorded, not repaired. Challenge: App
  Store screenshots will show it. Answer: it is Apple's presentation for a portrait-only scene, and
  the repair is excluded by D116.3.
- **D116.7** the installed 2.0.1054 build is the proof vehicle. Challenge: a fresh build is cleaner.
  Answer: `git diff --name-only 8efd0b91..3407e984 -- app components hooks modules shared/constants.ts`
  prints nothing, the installed app's `DTSDKName` is `iphonesimulator27.1`, and the build lock is
  parked with no holder and is not this lane's to reap.

### What this planning session leaves

`PLAN.md` (one device step), `steps/01-duo-glass-matrix.md`, five anchors verified once each,
`scripts/preflight-116.sh`. No production code changed.

session: ses_eb07d2d72ffeZZ06VFfy9ZaQ9A
