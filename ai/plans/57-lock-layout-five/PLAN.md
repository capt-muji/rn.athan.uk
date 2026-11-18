# Row 57: Lock screen Layout 5 restored + backgrounds on every lock layout

Owner order 2026-11-18 (voice), ticket ATHA-501, anchored at uat `db9fa0c88`
(2.53.23).

## Goal

Two changes to the iOS Lock Screen accessory widgets, both schedules (prayer +
extras): (1) restore the retired stacked composition - prayer name beside the
absolute time on one line, the ticking countdown beneath - as Layout 5, fifth in
the gallery; (2) give every lock layout (all five, both schedules) a background
behind the whole component, because today every face paints
`containerBackground('rgba(0, 0, 0, 0)')` and the content is hard to read over
the wallpaper. Then compile a mock/local development build of BOTH platforms,
uninstall the current app from the iPhone XS (owner order: never a fleettest
side-by-side install), install the new build under the original bundle id, and
capture screenshot evidence of the placed lock widgets for the owner.

## Facts the plan rests on (measured 2026-11-18)

- The retired composition is `AthanLockWidgetStacked`, deleted in `ce04dfa2f`
  (T-484, owner order 2026-10-29). Its old live face: HStack(name medium 16pt
  WHITE, time medium 16pt monospacedDigit WHITE) over a ticking countdown
  (medium 16pt monospacedDigit WHITE_MUTED), all with minimumScaleFactor(0.88).
- The current family conventions differ from the retired body: every name is
  BOLD; the SECOND reading on a line is the muted one; stacked layouts read
  16pt, one-row layouts 17pt; the stacked floors are 0.88. Layout 5 restyles to
  the current conventions (bold name, muted time on the line, muted countdown
  beneath, 16pt), not to the retired bytes.
- The four layout functions in `widgets/LockPrayerWidget.tsx` each carry a
  byte-identical 976-line STATIC locale table (verified). Layout 5 copies the
  CURRENT table verbatim - the retired function's table is stale relative to
  the T-537 wave and must not be resurrected.
- Each layout function is self-contained (the 'widget' directive serializes
  each body alone; helpers must live inside each function). No sharing.
- Gallery copy: `app.json` registers each kind with displayName
  "Next Prayer (Layout N)" / "Extra Times (Layout N)" plus a description, and
  every locale block under `expo.locales[*].ios.Localizable.strings` carries
  those four strings localized. `shared/i18n/native-strings.json` holds the
  same rows and a test asserts app.json's locale blocks stay byte-identical to
  it. The retired kind's copy still exists at `ce04dfa2f^:app.json` under
  "Layout 3" keys: display names embed the digit (swap 3 -> 5), descriptions
  ("Next prayer time with a countdown." / "Next extra time with a countdown.")
  carry no digit and copy verbatim per locale.
- The CJK subset pipeline now covers ko only (zh-Hans/ja pairs were dropped by
  T-538 owner ruling C3, 2026-11-01); `scripts/cjk-subset.mjs` regenerates the
  KR subset + `shared/i18n/cjk-glyph-lock.json` over the closed string set
  (ko catalog + native-strings ko row + widget-statics ko row + endonym). The
  restored ko gallery copy may or may not need new glyphs:
  `shared/__tests__/cjkSubset.test.ts` decides; recut only if red.
- Home-screen widgets already paint `containerBackground(palette.card)`;
  "all the widgets" scopes to the lock layouts. The home module is untouched.
- `stores/widget.ts` pushes all lock kinds per schedule (both schedules push
  eight today; ten after this change).
- Lock kinds are iOS-only in `app.json` (`"android": null`); no Android
  resource strings for them.
- The XS is on iOS 18.7.10, physical, driven per `e2e/device-atlas-iphone-xs.md`
  (customize-sheet route reads placed lock widgets at true size; the gallery
  pager previews every kind). Signing: the cached paid-team profile pair for
  the store id; headless xcodebuild cannot sign a NEW bundled id with the app
  group (the fleettest wall) - which the owner's uninstall-first order makes
  moot.
- `containerBackground` on accessory families may be ignored or honored by iOS
  18.7 - unknown until measured. The value is chosen from device evidence, not
  guesswork: start `rgba(0, 0, 0, 0.4)`, read the customize sheet, adjust once
  if invisible, then report what the system actually renders. A frosted
  material is NOT expressible (`containerBackground` takes a color string
  only); a translucent dark is the closest available treatment.

## Steps

1. **Tests first, red.** Extend the suites to name every miss:
   `widgetContract` (directive count 4 -> 5, closure walk, label pairs),
   `widgetLockRenderer` (render Layout 5 in every family; assert the
   name+time row and the countdown element beneath), `widgetStaticStrings`
   (label lists and layout loops gain the fifth), `nativeLocalesConfig`
   (per-locale key sets grow the four strings), `widgetSettingsSync` (kind
   arrays), plus the mocks file gains `PrayerLockWidget5`/`ExtrasLockWidget5`.
   Run: every new row red, naming Layout 5 or the missing kinds.
2. **Layout 5 implementation.** Build the new function by scripting the file:
   copy the current `AthanLockWidgetCountdownPair` block whole (it carries the
   current STATIC table and boilerplate), rename to
   `AthanLockWidgetStacked`, and replace only its live face with:
   VStack(spacing 1, rect modifiers) > HStack(spacing 6) [name bold 16 WHITE
   lineLimit 1 minScale 0.88; time medium 16 monospacedDigit WHITE_MUTED
   lineLimit 1 minScale 0.88] then TickingTextEl(timerInterval segment,
   countsDown, medium 16 monospacedDigit WHITE_MUTED multilineTextAlignment
   center lineLimit 1 minScale 0.88 frame maxWidth Infinity center). Export
   `PrayerLockWidget5`/`ExtrasLockWidget5`. Update the module header comment
   (four -> five compositions, Layout 5 described).
3. **Backgrounds.** In every lock layout function (all five), every
   accessoryRectangular face (live, stale, neutral) swaps
   `containerBackground('rgba(0, 0, 0, 0)', 'widget')` for
   `containerBackground(BG, 'widget')` with `const BG = 'rgba(0, 0, 0, 0.4)'`
   defined inside each function (self-containment law). The accessoryInline
   Text faces keep the transparent value (a single system-rendered line takes
   no background). The VStack modifier-list shape distinguishes rect faces
   from inline faces; only the VStack list pattern changes.
4. **Store pushes.** `stores/widget.ts`: both schedule branches push
   `lock.PrayerLockWidget5` / `lock.ExtrasLockWidget5`.
5. **Registration + gallery copy.** `app.json`: two widget entries after
   `ExtrasLockWidget4` (accessoryRectangular + accessoryInline, android null)
   with displayName "Next Prayer (Layout 5)" / "Extra Times (Layout 5)" and
   descriptions "Next prayer time with a countdown." / "Next extra time with
   a countdown.". Locale blocks: script the migration from
   `ce04dfa2f^:app.json` - for every locale, old "Layout 3" display-name value
   with its LAST "3" replaced by "5" (assert exactly one replacement), the two
   descriptions verbatim; write the same rows into
   `shared/i18n/native-strings.json` so the byte-parity test holds. En values
   come from the entries themselves.
6. **CJK gate.** Run the suite; if `cjkSubset` is red, fetch the Noto Sans KR
   VF outside the repo, `node scripts/cjk-subset.mjs <dir>`, commit the recut
   binaries + lock. If green, no font work.
7. **Coverage + validate.** Full unit coverage of every touched line, red
   before green, mutation pass on the new guards (a Layout 5 render byte, a
   schedule push count, a locale row). `yarn validate` green.
8. **Docs + version.** README's widget documentation gains Layout 5 and the
   background note. Version 2.53.23 -> 2.54.0 (feat, minor) in package.json +
   app.json + the What's New stamp, fetched against origin first. No new
   What's New catalog item: the 2.50 lockLayouts item already covers lock
   layout changes and no new catalog copy is being authored.
9. **Build both platforms in parallel.** `scripts/build/build-ios.zsh <ref>
   <out>.app local` and `scripts/build/build-mock.zsh <ref> mocks/minutes.ts
   <out.apk>` (Gradle and Xcode may run together; never two of one toolchain).
10. **XS install.** Confirm the XS via `xcrun devicectl list devices`
    ($IPHONE_UDID). Uninstall the current app
    (`devicectl device uninstall app`), install the new build, launch once so
    both schedules push all ten lock kinds.
11. **Device evidence.** Drive the atlas's lock-customize route; screenshot
    the placed widgets and the gallery pages; read every screenshot directly.
    Record: Layout 5 present and rendering name+time+countdown; the
    background's actual rendering per layout. Adjust BG once if invisible,
    rebuild, re-read, then stop iterating and report.
12. **Audit + land.** Cold read of the whole diff against this plan and the
    repository. `yarn validate` again. Row 57 DONE, `uat` pushed; ATHA-501 to
    done; the plan folder is deleted in the landing commit (the row keeps
    order number and short name only).

## Acceptance criteria

- Every new test row was red before the implementation and is green after;
  `yarn validate` passes end to end.
- The lock module registers five layouts under ten kinds; both schedules push
  all ten; app.json and native-strings.json carry the four new strings in
  every locale, byte-identical between them.
- Both platform builds succeed with logs kept under `~/athan-build`.
- The XS carries the new build under the original bundle id (uninstalled
  first, no fleettest), the app launches, and the customize-sheet screenshots
  show Layout 5 and the background verdict is recorded either way.
- Row 57 DONE and pushed; ATHA-501 done; plan folder deleted in the landing
  commit.

## Risks and falsifiers

- **iOS ignores accessory backgrounds** - falsified by the customize-sheet
  screenshot: if the wallpaper shows through unchanged at 0.4, one stronger
  value is tried; if that too renders flat, the finding is reported with the
  screenshots and the owner rules on the next move. The code keeps the
  constant so a ruling is one byte.
- **A locale's old display name breaks the digit-swap pattern** (no "3" or
  several) - falsified by the script's assert-before-write; any failure is
  resolved by hand for that locale only.
- **ko subset misses a restored glyph** - falsified by `cjkSubset.test.ts`
  red; remedy is the committed recut script.
- **The XS is not attached** - falsified by `devicectl list devices`; the
  owner named the fallback: the device-hub simulator ($SIMULATOR_UDID).
- **Uninstalling wipes the owner's placed widgets/settings on the phone** -
  accepted by the owner's explicit uninstall-first order; the widgets are
  re-placed by the owner or via the customize route during evidence capture.
- **Version collision with a concurrent session** - falsified by fetching
  origin before bumping.
