#!/usr/bin/env bash
# Step 2 breaks: the Other card, the Help row and the archive item.
# Run from the repository root: bash ai/plans/29-help-faq-modal/scripts/breaks-2.sh
set -u

SETTINGS="components/sheets/screens/__tests__/Settings.test.tsx"
ARCHIVE="shared/__tests__/whatsNew.test.ts"

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

  if npx jest "$suite" --watchman=false --selectProjects="$project" > "$TMPDIR/break-2-out.txt" 2>&1; then
    echo "NOT CAUGHT: $label (expected $expected to fail)"
    all_as_expected=0
  else
    echo "caught: $label"
  fi

  mv "$file.bak" "$file"
}

# 1. The card goes back to hiding entirely on a silent release, taking Help with it
run_break "the whole card is gated on the release again" components/sheets/screens/Settings.tsx \
  "s/<Text style=\{styles\.cardTitle\}>Other<\/Text>/<Text style={styles.cardTitle}>Other<\/Text>\n        {VISIBLE_WHATS_NEW ? null : null}/ ; s/      <View style=\{styles\.card\}>\n        <Text style=\{styles\.cardTitle\}>Other/      {VISIBLE_WHATS_NEW ? (\n      <View style={styles.card}>\n        <Text style={styles.cardTitle}>Other/" \
  components "$SETTINGS" "keeps Help reachable on a release with no notes to show"

# 2. The card keeps its old title, so the owner's rename never shipped
run_break "the card is still called About" components/sheets/screens/Settings.tsx \
  "s/>Other<\/Text>/>About<\/Text>/" \
  components "$SETTINGS" "keeps Help reachable on a release with no notes to show"

# 3. The Help row loses its label, so no screen reader can find it
run_break "the Help row loses its label" components/sheets/screens/Settings.tsx \
  "s/accessibilityLabel='Help'/accessibilityLabel='Support'/" \
  components "$SETTINGS" "closes itself, then opens Help once the close has had time to finish"

# 4. The row opens the modal without closing the sheet first
run_break "the Help row leaves the sheet open" components/sheets/screens/Settings.tsx \
  "s/  const handleHelpPress = \(\) => \{\n    Haptics\.impactAsync\(Haptics\.ImpactFeedbackStyle\.Medium\);\n    hideSettingsSheet\(\);/  const handleHelpPress = () => {\n    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);/" \
  components "$SETTINGS" "closes itself, then opens Help once the close has had time to finish"

# 5. The modal opens on the same tick, so it slides in over a sheet still closing
run_break "the Help row opens the modal with no delay" components/sheets/screens/Settings.tsx \
  "s/setTimeout\(\(\) => setPopupHelpEnabled\(true\), 150\)/setPopupHelpEnabled(true)/" \
  components "$SETTINGS" "closes itself, then opens Help once the close has had time to finish"

# 6. The row stops firing the haptic every other row in this sheet fires
run_break "the Help row fires no haptic" components/sheets/screens/Settings.tsx \
  "s/  const handleHelpPress = \(\) => \{\n    Haptics\.impactAsync\(Haptics\.ImpactFeedbackStyle\.Medium\);/  const handleHelpPress = () => {/" \
  components "$SETTINGS" "closes itself, then opens Help once the close has had time to finish"

# 7. The archive item loses its title, so a release would announce a blank row
#
# NOT a break on `version: null`. That would assert WHICH release is stamped, and
# shared/whatsNew.ts lines 65 to 73 refuse that test on purpose: it fails every time the
# owner makes the editorial choice it exists to allow. Measured in the planning session:
# stamping the item at the archive's own version is caught by nothing, correctly, because
# shouldShowWhatsNew already refuses a release whose stamp is not the installed version.
run_break "the archive item loses its title" shared/whatsNew.ts \
  "s/      title: 'Help page',/      title: ' ',/" \
  unit "$ARCHIVE" 'item " " has a non-empty title within the limit'

# 8. The item's body grows past the limit the modal is laid out for
run_break "the archive item's body exceeds its limit" shared/whatsNew.ts \
  "s/      body: 'Settings now answers why an athan was not heard, and opens the setting that caused it',/      body: 'Settings now answers why an athan was not heard, and opens the setting that caused it, with every question a user has ever asked about a silent phone',/" \
  unit "$ARCHIVE" 'item "Help page" has a non-empty body within the limit'

echo "ALL AS EXPECTED: $all_as_expected"
