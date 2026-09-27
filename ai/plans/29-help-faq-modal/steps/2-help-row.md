# Step 2: The Other card, the Help row and the What's New item

This step is **(specified)**: build it from the contracts below. No file is handed to you to copy.

## 0. Anchor check

```bash
bash $TMPDIR/preflight-29.sh 2
```

Every anchor line prints `1`, and the script ends `PREFLIGHT OK`. Any other count means NEEDS REPLAN.

## 1. Goal

Settings' About card becomes "Other" and carries a Help row beneath What's new. Help stays reachable on a
silent release, where the whole card used to vanish. The What's New archive gains one parked Help item.

## 2. Branch

```bash
git checkout -b feat/29-help-row uat-2
```

## 3. Files

- `components/sheets/screens/Settings.tsx`
- `components/sheets/screens/__tests__/Settings.test.tsx`
- `shared/whatsNew.ts`
- `app.json`, `package.json` (version)

Nothing else may change, apart from `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.

## 4. Tests first (red)

Two tests go into `components/sheets/screens/__tests__/Settings.test.tsx`, both inside
`describe('the settings sheet outside the Ramadan season, Friday 11 September 2026 at 14:00', ...)`,
immediately after `offers no What's New button on a release with no notes to show`.

First add `popupHelpEnabledAtom` to that file's `@/stores/ui` import.

| Test name | What it proves | Inputs | Asserts |
| --- | --- | --- | --- |
| `keeps Help reachable on a release with no notes to show` | The gate moved to the What's new row, so a silent release can no longer take Help with it. This is the brief's one explicit "Care" item | `mockVisibleWhatsNew = null`, then render | a button labelled `'Help'` is on the screen, and the text `'Other'` is on the screen |
| `closes itself, then opens Help once the close has had time to finish` | The row closes the sheet, waits out its animation, then opens the modal, and fires the same haptic every other row does | render, spy on the settings sheet's own `dismiss` through the file's `renderedSheet` helper, press `'Help'`, advance 149ms, then 1ms more | at 149ms `popupHelpEnabledAtom` is still `false`; after the last millisecond `dismiss` was called once, the atom is `true`, and `Haptics.impactAsync` was called with `Haptics.ImpactFeedbackStyle.Medium` |

The 149ms then 1ms split is the same shape the file's What's new test already uses, and it is what makes the
150ms deliberate rather than incidental: a test that only advanced 150ms would pass with no delay at all.

Both tests use the file's existing helpers (`renderedSheet`, `store`) rather than new ones.

**Command:**

```bash
npx jest components/sheets/screens/__tests__/Settings.test.tsx --watchman=false --selectProjects=components
```

**Expected before the change:**

- `keeps Help reachable on a release with no notes to show` fails with
  `Unable to find an element with text: Other`;
- `closes itself, then opens Help once the close has had time to finish` fails with
  `Unable to find an element with accessibilityLabel: Help`;
- the file's other 13 tests pass.

If either passes, or another test fails, STOP.

No test is added for the What's New item. `shared/__tests__/whatsNew.test.ts`'s content contract iterates
`WHATS_NEW.items` with `it.each`, so the new item is covered the moment it exists: its non-empty title within
the limit, its non-empty body within the limit, and its platform validity. The suite's total rises from 47 to
49, measured in the planning session.

**And no test pins that the item is PARKED**, deliberately. That file's own comment (lines 65 to 73 of
`shared/whatsNew.ts`) refuses such a test: it would fail every time the owner makes the editorial choice it
exists to allow. The planning session proved this by trying it as a break, stamping the item at the archive's
own version, and nothing failed. That is correct behaviour, not a gap: `shouldShowWhatsNew` already refuses a
release whose stamp is not the installed version, so a wrongly stamped item can never reach a user. The break
script therefore breaks the item's title, which IS a stable decision the suite guards.

## 5. Change

### 5.1 `components/sheets/screens/Settings.tsx`

**The handler.** Add, directly above `return (`, matching `handleWhatsNewPress` beside it:

```tsx
const handleHelpPress = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  hideSettingsSheet();
  setTimeout(() => setPopupHelpEnabled(true), 150);
};
```

No comment on it. `handleWhatsNewPress` carries one because "display-only, never touches the shown-version
tracker" is a why the code cannot show; this handler has no such quirk.

Add `setPopupHelpEnabled` to the `@/stores/ui` import, in Biome's order.

**The card.** Replace the whole About card, found by anchors `2-1.txt` and `2-2.txt`, so that:

1. The card is no longer conditional: `<View style={styles.card}>` renders always.
2. Its title reads `Other`, not `About`.
3. Its comment reads
   `{/* Other Card - the What's new row alone is hidden on a silent release, so Help always stays reachable */}`
4. The What's new `Pressable` is unchanged, byte for byte, but now wrapped in
   `{VISIBLE_WHATS_NEW ? ( ... ) : null}` inside the card.
5. A Help `Pressable` follows it, still inside the card, with:
   - `style={styles.whatsNewButton}`, the same row style, because the rows are identical in shape;
   - `onPress={handleHelpPress}`;
   - `hitSlop={HIT_SLOP.md}`;
   - `accessibilityLabel='Help'`;
   - `accessibilityRole='button'`;
   - a `<View style={styles.infoButton}>` holding `<Text style={styles.helpIcon}>?</Text>`;
   - `<Text style={styles.whatsNewLabel}>Help</Text>`;
   - `<Text style={styles.chevron}>›</Text>`.

The `?` is text inside the existing circular badge, the way the `♪` glyph already sits beside Change athan.
There is no `?` SVG in `assets/icons/svg/`, and one glyph does not earn a file.

**One new style**, added directly above `musicIcon` in the `StyleSheet.create` block:

```tsx
helpIcon: {
  color: COLORS.text.primary,
  fontSize: 12,
  fontFamily: TEXT.family.medium,
},
```

`fontSize: 12` matches the info icon's 12x12 box beside it. No comment: `ai/AGENTS.md` section 15 forbids
comments on styling values.

**What must not change:** the card's own styles, the What's new row's markup and label, every toggle, the athan
row, and the order of the cards. The only visual additions are the renamed title and the new row, both of which
the owner asked for.

### 5.2 `shared/whatsNew.ts`

Anchor `2-3.txt`. Add one item as the archive's last entry, after `A second reminder`:

```ts
{
  // PARKED: stamped at the store release, like every item, because whether a release
  // gets a modal is the owner's editorial call
  title: 'Help page',
  body: 'Settings now answers why an athan was not heard, and opens the setting that caused it',
  version: null,
},
```

`title` is 9 characters against a `MAX_WHATS_NEW_TITLE_LENGTH` of 32, and `body` is 85 against a
`MAX_WHATS_NEW_BODY_LENGTH` of 96, both measured in the planning session. `version: null` parks it: the
archive's own rule (lines 65 to 73 of that file) is that whether a release gets a modal is the owner's
editorial call, stamped at the store release. A stamped item would announce itself from the next local build.

No flag: the Help page ships on both platforms and behind no feature flag.

Change nothing else in that file: not `WHATS_NEW.version`, not another item's stamp, not a limit.

### 5.3 The invariant this step must keep

The Settings sheet always offers a Help row inside a card titled "Other", whatever `VISIBLE_WHATS_NEW` holds,
and the What's new row appears only when it holds a release.

## 6. Green

```bash
npx jest components/sheets/screens/__tests__/Settings.test.tsx --watchman=false --selectProjects=components
```

Expected: `Tests:       15 passed, 15 total`.

```bash
npx jest shared/__tests__/whatsNew.test.ts --watchman=false --selectProjects=unit
```

Expected: `Tests:       49 passed, 49 total`.

Then `npx tsc --noEmit` and `npx biome check . --error-on-warnings`, both exiting 0.

## 7. Breaks

```bash
bash ai/plans/29-help-faq-modal/scripts/breaks-2.sh
```

It must end `ALL AS EXPECTED: 1`. A `BREAK NOT APPLIED: <label>` line means the substitution matched nothing:
STOP and ask.

## 8. Version and commit

```bash
node -e "const v=require('./package.json').version.split('.');v[2]=Number(v[2])+1;console.log(v.join('.'))"
```

Set it in `app.json`, `package.json` and, if `android/` exists, `android/app/build.gradle` (`versionName`).

```bash
git add components/sheets/screens/Settings.tsx components/sheets/screens/__tests__/Settings.test.tsx \
  shared/whatsNew.ts app.json package.json \
  ai/plans/README.md ai/plans/29-help-faq-modal/PLAN.md ai/plans/29-help-faq-modal/LOG.md
```

Write to `$TMPDIR/msg-2.txt`, replacing `<VERSION>`:

```
<VERSION> - feat(help): a Help row in Settings, and the What's New item for it

The About card becomes Other and carries a Help row beneath What's new, with the
same row shape and a ? glyph in the badge the info icon used.

VISIBLE_WHATS_NEW gated the whole card, so a silent release took the card away
with it. The gate now sits on the What's new row alone, which is what keeps Help
reachable on every release.

The archive gains a parked Help item. Whether a release gets a modal is the
owner's editorial call, so it is stamped at the store release like every other
item rather than here.
```

The hook runs the full suite: the last `Tests:` line ends `passed, <n> total`, and four `100%` coverage lines are
present.

## 9. Review

Read `git show <sha>` back cold, against this checklist:

1. The card renders unconditionally, and its title reads `Other`.
2. `VISIBLE_WHATS_NEW` now wraps the What's new `Pressable` alone.
3. The What's new row's markup, label and handler are unchanged.
4. The Help row's `accessibilityLabel` is `Help`, its role is `button`, and its glyph is `?`.
5. `handleHelpPress` fires a Medium haptic, dismisses the sheet, then sets the atom after 150ms, in that order.
6. `helpIcon` is the only new style, and it carries no comment.
7. No existing style, toggle, card order or label changed.
8. The archive item is parked at `version: null`, carries no flag, and its title and body are within the limits.
9. `WHATS_NEW.version` and every other item's stamp are untouched.
10. Every comment explains why; the new handler carries none.
11. Nothing beyond part 3's file list changed.
12. Both acceptance commands in part 6 pass with the totals given.

A finding is handled by `EXECUTOR-BRIEF.md` section 4, item 8: a fix section 10 gives word for word, or a fix
meeting all three of that item's conditions, is applied; anything else is a STOP.

## 10. Merge

```bash
git checkout uat-2 && git merge --no-ff feat/29-help-row -m "Merge feat/29-help-row into uat-2: the Other card, the Help row and the What's New item"
```

## 11. Done when

- `npx jest components/sheets/screens/__tests__/Settings.test.tsx --watchman=false --selectProjects=components`
  prints `Tests:       15 passed, 15 total`;
- `npx jest shared/__tests__/whatsNew.test.ts --watchman=false --selectProjects=unit` prints
  `Tests:       49 passed, 49 total`;
- `bash ai/plans/29-help-faq-modal/scripts/breaks-2.sh` ends `ALL AS EXPECTED: 1`;
- `git log --oneline -1 uat-2` names the merge above;
- `git status --porcelain` lists nothing but `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.
