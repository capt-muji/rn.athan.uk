# Ticket 60: Sheets and modals: max height and scrollable regions, one by one

| Field | Value |
| --- | --- |
| Brief | Queue row 60, owner ask 2026-10-12 |
| Planned at | PENDING (uat sha, version, date) |
| Planned by | Planning session 2026-10-12 |
| Needs first | 39 (DONE) |
| Parent | none |
| Group | app layout styles (serialized with rows 61, 63) |
| Batch budget | PENDING |
| Session budget | PENDING |
| Steps count | PENDING |
| Device | PENDING |
| Owner decisions still needed | the interview (section 2) |

Resume from: the interview. The surface inventory below is mapped and verified
against uat; the owner interview (per-surface scroll-region rulings) has not
started.

## 1. Goal

Owner ask, 2026-10-12: some modals can grow taller than the screen in longer
languages. Go through each sheet one by one and decide which region scrolls
when content exceeds the max. Visuals are owner-ruled: the plan proposes the
per-sheet scroll regions and the owner approves the faces.

## 2. Decisions

### 2.1 Taken

None yet. The interview is next.

### 2.2 The executor must not decide

PENDING.

## 3. Pre-flight

PENDING.

## 4. Background the executor needs

### Surface inventory (verified against uat 2026-10-12)

Bottom sheets, all through `components/sheets/parts/Sheet.tsx` (one
ContentWrapper wraps Header plus children, so the header scrolls away with the
body on every scrollable sheet):

| Surface | Sizing | Today when content exceeds the max |
| --- | --- | --- |
| Alert (`screens/Alert.tsx:86`) | dynamic, cap 85% window | whole content scrolls, header included |
| Settings (`screens/Settings.tsx:83`) | snap 85% | whole content scrolls, header included |
| Sound (`screens/Sound.tsx:173`) | snap 85% | whole content scrolls, header included |
| Language (`screens/Language.tsx:30`) | snap 60% | whole content scrolls, header included |
| Qibla (`screens/Qibla.tsx:140`) | dynamic, cap 85%, `scrollable={false}` | fixed instrument content, never scrolls |

Modals, through `components/modals/Modal.tsx`:

| Surface | Card | Today when content exceeds the max |
| --- | --- | --- |
| Help (`modals/Help.tsx:119`) | wide, maxHeight 96% | list ScrollView caps at 62% window and scrolls; title and Close pinned |
| WhatsNew (`modals/WhatsNew.tsx:27`) | compact, NO maxHeight | nothing scrolls, nothing caps: the card grows past the screen |
| Update (`modals/Update.tsx:14`) | compact, NO maxHeight | nothing scrolls, nothing caps: the card grows past the screen |

ColorPicker (`screens/ColorPicker.tsx:131`) uses React Native's own Modal with
fixed-height panels: bounded, no change candidate. Error.tsx is a full screen,
not a modal.

### Library facts, verified at @gorhom/bottom-sheet 5.2.14

- `useAnimatedDetents.ts:79-92`: the dynamic detent is
  `containerHeight - min(contentHeight + handleHeight, maxDynamicContentSize)`,
  so content past the cap scrolls inside a capped sheet.
- `createBottomSheetScrollableComponent.tsx:102`: the scrollable's
  `onContentSizeChange` writes `contentHeight`.
- `BottomSheetView.tsx:44-57`: under dynamic sizing, BottomSheetView's own
  layout ALSO writes `contentHeight`. A pinned BottomSheetView header above a
  scrolling body therefore fights the scrollable over the same value: the
  pinned-header split is clean under fixed snap points and unsound under
  `enableDynamicSizing`.

## 5. Design

PENDING.

## 6. Steps

PENDING.

## 7. Device proof

PENDING.

## 8. Records

PENDING.

## 9. Push

None. The executor never pushes. The lead pushes after review.

## 10. When something goes wrong

PENDING.

## 11. Subagents

PENDING.

## 12. Report to the owner

PENDING.
