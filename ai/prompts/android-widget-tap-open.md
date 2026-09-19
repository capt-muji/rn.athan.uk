# Session brief: Android widgets open the app on tap

Owner ruling 2026-09-19 (evening): tapping any placed Android widget must open the app. Currently
taps do nothing.

## Context from session 15b

- The Android card is a Box stack in `widgets/PrayerWidget.tsx` (`ACard`, `androidRender`) — plain
  views, not tappable.
- The widget runtime DOES route taps for interactive elements: `@expo/ui` jetpack exposes a `Button`
  component, and the generated provider (`ExpoWidgetsAppWidgetProvider.kt`) handles a
  `WIDGET_INTERACTION_ACTION` broadcast, calling `WidgetsInteraction.handle(context, source, target)`
  (`WidgetInteractionAction.kt`). READ THAT FILE FIRST: if `handle` only dispatches a JS event to a
  running app, a tap with a dead app does nothing, and the button needs a different action; if it
  launches the MainActivity (or can be made to), the card-as-button is enough.
- iOS widgets already open the app (system default widgetURL behaviour) — Android only, all 8 kinds.

## Plan shape

1. Investigate the interaction path (`WidgetInteractionAction.kt`, `@expo/ui` jetpack `Button`
   prop shape: does it take `onPress`? What does the serialized tree look like? The widget renderer
   test harness in `shared/__tests__/widgetRenderer.test.ts` shows how to assert the tree).
2. Wrap the Android card content (the full-size Box in `ACard` and the medium's outer Box) in the
   button element so the whole card is the tap target, keeping the layout byte-identical otherwise.
3. Renderer tests: the Android tree's root content sits inside the button marker; no size/layout
   change (the pill, rows, footer geometry constants are owner-tuned — do not touch
   `A_ROW_HEIGHT`, `PILL_VPAD`, `FOOTER_BOTTOM_PAD`, `HERO_WIDTH`, `LIST_WIDTH`).
4. Device proof on the 3T (serial `8f7ada76`): `am kill com.mugtaba.athan` (never force-stop), tap
   the widget, the app opens. Screenshot for the owner.
5. Build ritual: `zsh ~/athan-device-sweep/session15b/bin/build-mock-realid.zsh uat-2 mocks/simple.ts
   <out.apk>` builds the ONE app (real id com.mugtaba.athan, mock data, widgets on). The phone holds
   exactly one Athan app; keep it that way.
6. Mock resting state (owner's standing definition): Asr next at +1 minute from each download, Fajr
   −3, Isha +3, every prayer 1 minute apart — already committed in `mocks/simple.ts`; verify, do not
   change.
