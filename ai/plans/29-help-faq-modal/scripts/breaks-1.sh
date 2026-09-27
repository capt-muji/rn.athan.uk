#!/usr/bin/env bash
# Step 1 breaks: every decision the Help path makes, broken one at a time.
# Run from the repository root: bash ai/plans/29-help-faq-modal/scripts/breaks-1.sh
set -u

UNIT="shared/__tests__/help.test.ts"
MODAL="components/modals/__tests__/Help.test.tsx"
DEVICE="device/__tests__/androidChannelUpdate.test.ts"
LAUNCH="__tests__/app/index.test.tsx"

all_as_expected=1

# label, file, perl substitution, jest project, suite, the test expected to fail
run_break() {
  label="$1"; file="$2"; subst="$3"; project="$4"; suite="$5"; expected="$6"

  cp "$file" "$file.bak"
  perl -0pi -e "$subst" "$file"

  if cmp -s "$file" "$file.bak"; then
    echo "BREAK NOT APPLIED: $label"
    all_as_expected=0
    mv "$file.bak" "$file"
    return
  fi

  if npx jest "$suite" --watchman=false --selectProjects="$project" > "$TMPDIR/break-1-out.txt" 2>&1; then
    echo "NOT CAUGHT: $label (expected $expected to fail)"
    all_as_expected=0
  else
    echo "caught: $label"
  fi

  mv "$file.bak" "$file"
}

# 1. The platform split stops dropping a topic: iOS would answer Android's questions
run_break "the platform split is ignored" shared/help.ts \
  "s/const answer = os === 'ios' \? entry\.ios : entry\.android;/const answer = entry.android ?? entry.ios;/" \
  unit "$UNIT" "keeps the reboot question for Android alone"

# 2. The order stops being the declared one, so the most common cause is no longer first
run_break "the questions are reordered" shared/help.ts \
  "s/^const HELP_ENTRIES: HelpEntry\[\] = \[/const HELP_ENTRIES: HelpEntry[] = [\n  {\n    question: 'Reordered',\n    ios: { text: 'Reordered' },\n    android: { text: 'Reordered' },\n  },/m" \
  unit "$UNIT" "asks about notifications first on both platforms"

# 3. The silent-switch answer promises a setting that does not exist
run_break "the silent answer claims a setting can override it" shared/help.ts \
  "s/No app setting can play through it\. /Turn on override in Athan settings. /g" \
  unit "$UNIT" "never claims an app setting can play through the silent switch"

# 4. Both platforms share one silent-switch wording, which the brief forbids
run_break "the silent answer is shared across platforms" shared/help.ts \
  "s/'Silent mode silences notification sound/'The mute switch silences notification sound/" \
  unit "$UNIT" "words the silent switch answer for each platform"

# 5. The Do Not Disturb grant leaks onto iOS, which has no such screen
run_break "the Do Not Disturb grant is offered on iOS" shared/help.ts \
  "s/      text: 'A Focus holds/      action: 'dndAccess',\n      text: 'A Focus holds/" \
  unit "$UNIT" "offers the Do Not Disturb grant on Android only"

# 6. A button loses its label, so an action would render blank
run_break "an action label is emptied" shared/help.ts \
  "s/dndAccess: 'Grant Do Not Disturb access'/dndAccess: ''/" \
  unit "$UNIT" "names a button for every action an answer offers"

# 7. Every action routes to the app settings, so Android's grant screen is never opened
run_break "runAction ignores which action it was given" components/modals/Help.tsx \
  "s/if \(action === 'dndAccess'\)/if (false)/" \
  components "$MODAL" "opens the Do Not Disturb access screen from its own answer"

# 8. The answers stop scrolling, so Close leaves the screen on a small phone
run_break "the answers lose their height cap" components/modals/Help.tsx \
  "s/maxHeight: height \* ANSWERS_HEIGHT_SHARE/maxHeight: undefined/" \
  components "$MODAL" "scrolls its answers rather than growing past the screen"

# 9. Close stops reporting, so the modal could never be dismissed
run_break "the Close button stops reporting" components/modals/Help.tsx \
  "s/<Pressable style=\{styles\.button\} onPress=\{onClose\}/<Pressable style={styles.button} onPress={() => {}}/" \
  components "$MODAL" "reports Close when it is pressed"

# 10. An answer that declares no action renders a button anyway
run_break "every answer renders an action button" components/modals/Help.tsx \
  "s/\{action \? \(/{true ? (/" \
  components "$MODAL" "renders one button for each answer that offers a settings screen"

# 11. openAppSettings swallows a failure as success, so a caller would claim it opened
run_break "openAppSettings reports a failure as success" device/notifications.ts \
  "s/logger\.error\('NOTIFICATION: Failed to open the app settings:', error\);\n    return false;/logger.error('NOTIFICATION: Failed to open the app settings:', error);\n    return true;/" \
  unit "$DEVICE" "answers false when the page cannot open"

# 12. The Help modal is no longer mounted on the launch screen
run_break "the Help modal is unmounted" app/index.tsx \
  "s/\{chromeDeferred && <ModalHelp visible=\{helpVisible\}/{false && <ModalHelp visible={helpVisible}/" \
  components "$LAUNCH" "shows Help when the settings sheet asks for it"

# 13. The update nag stops standing aside for Help
run_break "the update nag stacks on Help" app/index.tsx \
  "s/updateAvailable && !whatsNewVisible && !helpVisible/updateAvailable \&\& !whatsNewVisible/" \
  components "$LAUNCH" "holds the update prompt back while Help is showing"

echo "ALL AS EXPECTED: $all_as_expected"
