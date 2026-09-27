# Step 3: The Help modal's visual design, as the owner specified it (specified)

**This step changes visuals, and that is its purpose.** The owner specified the design on 2026-09-27 while this plan
was written (section 2.1, decision 3). Every value below comes from that ruling or from an existing constant. Nothing
here is the executor's taste, and nothing outside `components/modals/Help.tsx` changes appearance.

0. **Anchor check:** run the section 3 pre-flight for step 3. Both must count `1`:

```bash
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
  ai/plans/33-sound-atomicity-keep-help-design/scripts/anchors/3-1.txt components/modals/Help.tsx
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
  ai/plans/33-sound-atomicity-keep-help-design/scripts/anchors/3-2.txt components/modals/Help.tsx
```

Any count other than `1` means NEEDS REPLAN.

1. **Goal:** the Help modal reads as a calm document: each answer on a very faint card with a gentle corner, and its
   settings button a plain right-aligned text link rather than a black slab.

2. **Branch:** `git checkout -b feat/33-help-visual-design uat-2`

3. **Files:**
   - `components/modals/Help.tsx`
   - `components/modals/__tests__/Help.test.tsx`

   Nothing else may change, apart from `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.

4. **Tests first (red).**

The owner's design is about appearance, and a test does not pin appearance. Two things in it ARE rules
rather than taste, because breaking either changes what the user can do, so exactly two tests are added to
`components/modals/__tests__/Help.test.tsx`, in its existing `describe` for iOS.

| Test name | What it proves | Inputs | Asserts |
| --- | --- | --- | --- |
| `puts each settings button at the end of its own answer` | The action stays a real button, reachable by its label, and sits at the trailing edge where the owner put it. A text link that stops being a button is unreachable to a screen reader | render the modal on iOS | every element found by `screen.getAllByRole('button', { name: 'Open Settings' })` has a flattened style whose `alignSelf` is `'flex-end'` |
| `keeps the Close button full width at the foot of the card` | The Close button is the one solid button and spans the card, which is what session 29's owner ruling fixed and this step must not undo | render the modal on iOS | the flattened style of `screen.getByRole('button', { name: 'Close' })` has `alignSelf: 'stretch'` and no `width` |

Both read a style, which this suite already does deliberately for a rule rather than a look: its existing
`scrolls its answers rather than growing past the screen` test carries the comment explaining why. Follow that
comment's reasoning and add no further style assertions: the card's colour, radius and spacing are the owner's to
change and must not be frozen by a test.

The existing test `badges every question with a small question mark, one per card` MUST be deleted, because the
badge is removed by this step. Say so in the commit message. No other existing test changes: the question list, the
platform split, the actions and Close all behave exactly as before.

Command, path before flags:

```bash
npx jest components/modals/__tests__/Help.test.tsx --watchman=false --selectProjects=components
```

Expected BEFORE the change: both new tests fail. `puts each settings button at the end of its own answer` fails with
a received `alignSelf` of `"flex-start"`, the value `styles.action` carries today. `keeps the Close button full width
at the foot of the card` fails because today's `styles.button` sets `width: SIZE.modal.buttonWidth` and
`alignSelf: 'center'`. If either passes, STOP.

5. **Change.** This step is built from the specification below; no file is copied.

Only `components/modals/Help.tsx` changes. Its structure, its data and its behaviour stay exactly as they are: same
`getHelpTopics` call, same question, answer, steps and action per topic, same `runAction`, same `Modal` props
(`wide divider centreTitle`), same `ANSWERS_HEIGHT_SHARE`. What changes is the styling and two pieces of markup.

**Markup changes, and only these two:**
- Delete the badge. The `View style={styles.badge}` and its `Text style={styles.badgeGlyph}` with `?` are removed,
  and the question `Text` becomes the only child of the head row. Delete `styles.badge`, `styles.badgeGlyph` and
  `styles.head` with it, and render the question `Text` directly.
- The action `Pressable` keeps its `accessibilityRole='button'`, its `accessibilityLabel` and its two `Text`
  children (the label and the `›` chevron). Only its style changes.

**Style specification.** Constants come from `@/shared/constants`; the slate values already at the top of the file
stay as they are, apart from `CARD`.

| Style | Property | Value | Why |
| --- | --- | --- | --- |
| `card` | `backgroundColor` | `CARD`, changed to `'rgba(52, 78, 92, 0.03)'` | 🐋  "the background cards should be very, very faint". Today's `0.05` is the value the owner called too present |
| `card` | `borderRadius` | `RADIUS.md` | 🐋  "not too much of a border radius". `RADIUS.md` is 8, against today's `RADIUS.xl` at 12 |
| `card` | `padding` | `SPACING.mid` | Slightly more air inside a fainter card, so the card reads as grouping rather than as a box. 14, against today's 12 |
| `card` | `marginBottom` | `SPACING.md` | Unchanged in spirit; the gap between cards stays smaller than the padding inside them so each card reads as one unit |
| `question` | unchanged | | The question keeps today's size, family, colour and letter spacing. It is already the strongest thing on the card and the badge's removal is what gives it the leading edge |
| `answer`, `steps`, `stepRow`, `stepNumber`, `stepText` | unchanged | | The owner asked for soft colours and good structure, which these already are; the numbered steps are the owner's own session 29 ruling |
| `action` | `alignSelf` | `'flex-end'` | 🐋  "buttons positioned to the right side" |
| `action` | `backgroundColor` | removed | 🐋  "no outline on them, there should just be a text" |
| `action` | `borderRadius` | removed | Nothing is drawn behind the label, so a radius shapes nothing |
| `action` | `paddingHorizontal` | removed | A text link is aligned on its text, and horizontal padding would push it off the card's right edge |
| `action` | `paddingVertical` | `SPACING.sm` | Kept, and only this: it is the touch target's height, not decoration. Removing it would leave a link roughly 16pt tall |
| `action` | `marginTop`, `flexDirection`, `alignItems`, `gap` | unchanged | The row keeps the label and chevron side by side |
| `actionText` | `color` | `INK` | The label must read as the one tappable thing on the card, so it stays the darkest text there. It was `COLORS.light.background` only because the slab behind it was dark |
| `actionChevron` | `color` | `INK` | Same reason |
| `button` (Close) | `alignSelf` | `'stretch'` | The owner's session 29 ruling, that Close is realigned full width at the foot of the card |
| `button` (Close) | `width` | removed | `SIZE.modal.buttonWidth` is 160 and would fight `stretch` |
| `button` (Close) | everything else | unchanged | It stays the one solid button, which is what makes the text links read as secondary |

`SIZE` becomes unused in the file once `button.width` is removed; remove it from the import, or Biome fails on an
unused import. Check the same for `RADIUS`, which is still used by `card`.

Comments: the file's existing comment above the slate constants explains why the palette is slate rather than
indigo, and it stays. Add no comment to a style value. `ai/AGENTS.md` section 15 forbids annotating styling, and the
owner's ruling behind these values belongs in `ai/prompts/README.md`, which section 8 of this plan updates.

6. **Green.** The same command. Both new tests pass, every other test in the file passes apart from the deleted one.
   Then `npx tsc --noEmit` and `npx biome check . --error-on-warnings`, both exiting 0.

7. **Breaks.** Save as `$TMPDIR/breaks-33-3.sh` and run with `bash $TMPDIR/breaks-33-3.sh` from the repository root.

```bash
#!/bin/bash
# Step 3 breaks: the two rules the design carries, as opposed to its looks
set -u
SUITE="components/modals/__tests__/Help.test.tsx"
TARGET="components/modals/Help.tsx"
CAUGHT=0
TOTAL=0

# A real perl regex, escaped in each call. \Q...\E is not used: it does not protect an
# interpolated newline, so a multi-line search silently matches nothing (see step 2).
run_break() {
  local label="$1" search="$2" replace="$3"
  TOTAL=$((TOTAL + 1))
  cp "$TARGET" "$TARGET.bak"
  perl -0pi -e "s/$search/$replace/" "$TARGET"
  if cmp -s "$TARGET" "$TARGET.bak"; then
    echo "BREAK NOT APPLIED: $label"
    mv "$TARGET.bak" "$TARGET"
    return
  fi
  if npx jest "$SUITE" --watchman=false --selectProjects=components > /dev/null 2>&1; then
    echo "SURVIVED: $label"
  else
    echo "CAUGHT: $label"
    CAUGHT=$((CAUGHT + 1))
  fi
  mv "$TARGET.bak" "$TARGET"
}

# 1. The settings button drifts back to the leading edge
run_break "action no longer trailing" \
  "alignSelf: 'flex-end'" \
  "alignSelf: 'flex-start'"

# 2. Close stops spanning the card
run_break "close no longer full width" \
  "alignSelf: 'stretch'" \
  "alignSelf: 'center'"

# 3. The action stops being a button at all, which no style assertion would catch
run_break "action loses its button role" \
  "accessibilityRole='button'\n                accessibilityLabel=\{HELP_ACTION_LABELS\[action\]\}" \
  "accessibilityLabel={HELP_ACTION_LABELS[action]}"

echo "CAUGHT $CAUGHT of $TOTAL"
[ "$CAUGHT" -eq "$TOTAL" ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
```

Expected: every break CAUGHT, ending `ALL AS EXPECTED: 1`. Break 1 is caught by
`puts each settings button at the end of its own answer`, break 2 by
`keeps the Close button full width at the foot of the card`, and break 3 by the existing
`renders one button for each answer that offers a settings screen, plus Close`. If break 3 prints
`BREAK NOT APPLIED`, the attribute order in the file differs from the plan's: adjust the search to the two
attributes as written, keeping the same intent, since this is the executor's own formatting rather than a contract.

8. **Version and commit.**

```bash
node -p "const v=require('./package.json').version.split('.');v[2]=+v[2]+1;v.join('.')"
```

Set that version in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). Add by name:
`components/modals/Help.tsx`, `components/modals/__tests__/Help.test.tsx`, `app.json`, `package.json`,
`ai/prompts/README.md`, `ai/plans/README.md`, and this folder's `PLAN.md` and `LOG.md`. Commit message, in a heredoc
at `$TMPDIR/msg-3.txt`:

```
<VERSION> - feat(help): the Help modal's chosen design, on the owner's ruling

Session 29 shipped design 1 as an interim and kept 25 candidates. The owner reviewed them while this
session was planned and specified the design directly rather than picking a number: faint cards, a
gentle corner, soft colours, and the settings buttons on the right as plain text.

So the ? badge goes, the card drops to 3% slate at RADIUS.md, and Open Settings becomes a right-aligned
text link in ink rather than a black slab. Close keeps its solid fill and now spans the foot of the
card, which leaves exactly one filled button on the screen and makes the links read as secondary.

Only the styling and two pieces of markup change: the questions, answers, numbered steps, platform
split and both settings actions behave exactly as before. Two tests are added for the parts of the
design that are rules rather than looks, the trailing action and the full-width Close, and the badge
test is deleted with the badge it described. The card's colour, radius and spacing are deliberately NOT
pinned by a test, because they are the owner's to change.
```

The pre-commit hook runs the full suite: the last `Tests:` line ends `passed, <n> total`, and four `100%` coverage
lines are present.

9. **Review.** Read `git show <sha>` back cold, as a stranger, against this list:
   - every style value matches part 5's table exactly, and no other value moved;
   - the badge, `styles.badge`, `styles.badgeGlyph` and `styles.head` are all gone, with no leftover import;
   - the action is still a `Pressable` with `accessibilityRole='button'` and its label;
   - Close is still the only filled button;
   - no data, question, answer, step or action behaviour changed;
   - no comment was added to a style value;
   - the deleted badge test is gone and no other existing test changed;
   - nothing outside the two files changed.

   Handle a finding as `EXECUTOR-BRIEF.md` section 4, item 8 says. A finding that the design itself looks wrong is
   NOT the executor's to act on: the design is the owner's, so that is a STOP.

10. **Merge.**

```bash
git checkout uat-2 && git merge --no-ff feat/33-help-visual-design -m "Merge feat/33-help-visual-design into uat-2: the Help modal's chosen design, reviewed"
```

11. **Done when:**
    - `npx jest components/modals/__tests__/Help.test.tsx --watchman=false --selectProjects=components` passes with no failures;
    - `bash $TMPDIR/breaks-33-3.sh` ends `ALL AS EXPECTED: 1`;
    - `npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exit 0;
    - `grep -c "styles.badge" components/modals/Help.tsx` prints `0`.
