#!/usr/bin/env bash
# Every decision the accessibility and back-press work makes, broken one at a time.
# Run from the repository root. Ends with "ALL AS EXPECTED: 1" when every break was caught.
set -uo pipefail

caught=0
total=0

# break <label> <file> <perl substitution> <test path> <project>
break_one() {
  local label="$1" file="$2" subst="$3" tests="$4" project="$5"
  total=$((total + 1))

  cp "$file" "$file.bak"
  perl -0pi -e "$subst" "$file"

  if cmp -s "$file" "$file.bak"; then
    echo "BREAK NOT APPLIED: $label"
    mv "$file.bak" "$file"
    return
  fi

  if npx jest "$tests" --watchman=false --selectProjects="$project" > /tmp/break-out.log 2>&1; then
    echo "SURVIVED: $label"
  else
    echo "CAUGHT: $label"
    caught=$((caught + 1))
  fi

  mv "$file.bak" "$file"
}

# --- The candidate horizon ---
break_one "horizon back to budget + 1" \
  shared/constants.ts \
  's/NOTIFICATION_REQUEST_BUDGET \+ 2;/NOTIFICATION_REQUEST_BUDGET + 1;/' \
  shared/__tests__/candidateHorizon.test.ts unit

# --- The modal's back press ---
break_one "modal ignores the back press" \
  components/modals/Modal.tsx \
  's/    if \(!visible\) return;\n    const subscription = BackHandler/    if (true) return;\n    const subscription = BackHandler/' \
  components/modals/__tests__/Modal.test.tsx components

break_one "modal lets the back press fall through to the app" \
  components/modals/Modal.tsx \
  's/      closeRef\.current\(\);\n      return true;/      closeRef.current();\n      return false;/' \
  components/modals/__tests__/Modal.test.tsx components

# A modal given no close handler must leave the press alone rather than swallowing it
break_one "modal swallows the press even with no close handler" \
  components/modals/Modal.tsx \
  's/      if \(!closeRef\.current\) return false;/      if (!closeRef.current) return true;/' \
  components/modals/__tests__/Modal.test.tsx components

break_one "Help does not pass its close handler to the modal" \
  components/modals/Help.tsx \
  's/      onRequestClose=\{onClose\}\n//' \
  components/modals/__tests__/Help.test.tsx components

break_one "What's New does not pass its close handler to the modal" \
  components/modals/WhatsNew.tsx \
  's/ onRequestClose=\{onClose\}//' \
  components/modals/__tests__/WhatsNew.test.tsx components

break_one "the update prompt updates on a back press instead of closing" \
  components/modals/Update.tsx \
  's/onRequestClose=\{onClose\}/onRequestClose={onUpdate}/' \
  components/modals/__tests__/Update.test.tsx components

# --- The overlay's back press ---
break_one "overlay ignores the back press" \
  components/overlay/Overlay.tsx \
  's/    if \(!overlay\.isOn\) return;\n    const subscription = BackHandler/    if (true) return;\n    const subscription = BackHandler/' \
  components/overlay/__tests__/Overlay.test.tsx components

break_one "overlay lets the back press fall through to the app" \
  components/overlay/Overlay.tsx \
  's/      closeOverlay\(\);\n      return true;/      closeOverlay();\n      return false;/' \
  components/overlay/__tests__/Overlay.test.tsx components

break_one "overlay fires the tap haptic on a back press" \
  components/overlay/Overlay.tsx \
  's/    const subscription = BackHandler\.addEventListener\(.hardwareBackPress., \(\) => \{\n      closeOverlay\(\);/    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {\n      handleClose();/' \
  components/overlay/__tests__/Overlay.test.tsx components

# --- Names, roles and states ---
break_one "the sound row loses its chosen state" \
  components/sheets/parts/SoundItem.tsx \
  's/accessibilityState=\{\{ selected: isSelected \}\}/accessibilityState={{ selected: false }}/' \
  components/sheets/parts/__tests__/SoundItem.test.tsx components

break_one "the play button stops saying which way it acts" \
  components/sheets/parts/SoundItem.tsx \
  's/isPlaying \? `Stop previewing \$\{name\}` : `Preview \$\{name\}`/`Preview ${name}`/' \
  components/sheets/parts/__tests__/SoundItem.test.tsx components

break_one "the switch loses the setting's name" \
  components/sheets/parts/LabeledToggle.tsx \
  's/<Toggle value=\{value\} onToggle=\{handleToggle\} accessibilityLabel=\{label\} \/>/<Toggle value={value} onToggle={handleToggle} \/>/' \
  components/sheets/parts/__tests__/LabeledToggle.test.tsx components

break_one "Toggle drops the label it is handed" \
  components/sheets/parts/Toggle.tsx \
  's/      accessibilityLabel=\{accessibilityLabel\}\n//' \
  components/sheets/parts/__tests__/LabeledToggle.test.tsx components

break_one "the settings button loses its name" \
  components/ui/SettingsButton.tsx \
  "s/\n      accessibilityLabel='Settings'>/>/" \
  components/ui/__tests__/SettingsButton.test.tsx components

break_one "the update prompt's buttons lose their role" \
  components/modals/Update.tsx \
  's/          accessibilityRole=.button.\n          accessibilityLabel=.Later.>/>/' \
  components/modals/__tests__/Update.test.tsx components

# Both props must go together: they are the iOS and Android halves of one rule, and React Native
# Testing Library honours either alone, so breaking one proves nothing (measured: each alone SURVIVES)
break_one "an invisible Reset stays reachable by a screen reader" \
  components/sheets/screens/ColorPicker.tsx \
  's/accessibilityElementsHidden=\{!isCustomColor\}/accessibilityElementsHidden={false}/; s/importantForAccessibility=\{isCustomColor \? .yes. : .no-hide-descendants.\}/importantForAccessibility={"yes"}/' \
  components/sheets/screens/__tests__/ColorPicker.test.tsx components

break_one "the colour picker's Done button loses its name" \
  components/sheets/screens/ColorPicker.tsx \
  's/                  accessibilityLabel=.Done.>/>/' \
  components/sheets/screens/__tests__/ColorPicker.test.tsx components

break_one "the colour picker keeps the change on a back press" \
  components/sheets/screens/ColorPicker.tsx \
  's/onRequestClose=\{handleDismiss\}/onRequestClose={handleDone}/' \
  components/sheets/screens/__tests__/ColorPicker.test.tsx components

echo "caught $caught of $total"
[ "$caught" -eq "$total" ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
