#!/usr/bin/env bash
# Step 3 breaks: the owner's redesign, broken one decision at a time.
# Run from the repository root: bash ai/plans/29-help-faq-modal/scripts/breaks-3.sh
set -u

UNIT="shared/__tests__/help.test.ts"
MODAL="components/modals/__tests__/Help.test.tsx"
OTHERS="components/modals/__tests__/Modal.test.tsx components/modals/__tests__/Update.test.tsx components/modals/__tests__/WhatsNew.test.tsx"

all_as_expected=1

# label, file, perl substitution, jest project, suite, the test expected to fail
run_break() {
  label="$1"; file="$2"; subst="$3"; project="$4"; suite="$5"; expected="$6"

  cp "$file" "$file.bak"
  perl -CSD -0pi -e "$subst" "$file"

  if cmp -s "$file" "$file.bak"; then
    echo "BREAK NOT APPLIED: $label"
    all_as_expected=0
    mv "$file.bak" "$file"
    return
  fi

  if npx jest $suite --watchman=false --selectProjects="$project" > "$TMPDIR/break-3-out.txt" 2>&1; then
    echo "NOT CAUGHT: $label (expected $expected to fail)"
    all_as_expected=0
  else
    echo "caught: $label"
  fi

  mv "$file.bak" "$file"
}

# 1. The app's name creeps back into the copy, which a rename would then falsify
run_break "an answer names the app" shared/help.ts \
  "s/text: 'Without permission this app cannot alert you at all\.'/text: 'Without permission Athan cannot alert you at all.'/" \
  unit "$UNIT" "names no app in any answer"

# 2. A dropped question comes back
run_break "the widget question returns" shared/help.ts \
  "s/^const HELP_ENTRIES: HelpEntry\[\] = \[/const HELP_ENTRIES: HelpEntry[] = [\n  {\n    question: 'My widget shows an old time',\n    ios: { text: 'Open the app to refresh it.' },\n    android: { text: 'Open the app to refresh it.' },\n  },/m" \
  unit "$UNIT" "drops the two questions the owner cut"

# 3. An answer grows back into a paragraph, which is what the owner rejected
run_break "an answer grows past a phone's reading length" shared/help.ts \
  "s/text: 'It plays at alarm volume, not ring volume\.'/text: 'It plays at alarm volume rather than your ring volume, which is a separate stream on Android, so a phone whose alarm volume has been turned down will still sound the athan quietly even when everything else is correct.'/" \
  unit "$UNIT" "keeps every answer short enough to read on a phone"

# 4. A step list is emptied, so guidance reverts to prose alone
run_break "a step list is emptied" shared/help.ts \
  "s/steps: \['Open this app once after a restart'\],/steps: [],/" \
  unit "$UNIT" "guides with a numbered list wherever it gives more than one instruction"

# 5. An action loses the steps that tell the user what the screen is for
run_break "an action offers no steps" shared/help.ts \
  "s/      steps: \['Open the screen below', 'Allow Do Not Disturb access'\],\n      action: 'dndAccess',/      action: 'dndAccess',/" \
  unit "$UNIT" "tells a user how to reach each settings screen it offers to open"

# 6. The silent answer stops saying no app can play through it
run_break "the silent answer drops its promise" shared/help.ts \
  "s/No app can play through it\./Try the app settings./g" \
  unit "$UNIT" "never claims an app setting can play through the silent switch"

# 7. The dot before each question goes, so questions stop reading as questions
# The bullet is multi-byte UTF-8, which is why run_break runs perl with -CSD
run_break "the question dot is removed" components/modals/Help.tsx \
  's/>\x{2022}</></' \
  components "$MODAL" "draws a dot before every question"

# 8. The steps stop being numbered
run_break "the steps lose their numbers" components/modals/Help.tsx \
  "s/\{stepIndex \+ 1\}\./{''}/" \
  components "$MODAL" "numbers the steps it lists"

# 9. The steps stop rendering at all
run_break "the steps are not rendered" components/modals/Help.tsx \
  "s/\{steps\?\.map\(/{[]?.map(/" \
  components "$MODAL" "numbers the steps it lists"

# 10. Modal's new props stop defaulting off, which would change the other two modals
run_break "the wide card becomes the default" components/modals/Modal.tsx \
  "s/export default function Modal\(\{ visible, children, title, wide, divider, icon \}: Props\)/export default function Modal({ visible, children, title, wide = true, divider = true, icon }: Props)/" \
  components "$OTHERS" "the update prompt and What's New keep their own compact card"

echo "ALL AS EXPECTED: $all_as_expected"
