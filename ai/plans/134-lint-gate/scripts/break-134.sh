# Break script for plan 134 step 1: mutation pass on the guarded logic.
# Applies each mutation, expects the named tests to fail, restores.
# Run with bash from the lane worktree root. Ends ALL AS EXPECTED: <n>.
set -uo pipefail
ROOT=$PWD
[[ -f app.config.ts && "$(git rev-parse --show-toplevel 2>/dev/null)" == "$ROOT" ]] || {
  echo "run from the lane worktree root"; exit 1
}

run_tests() {
  npx jest shared/__tests__/config.test.ts shared/__tests__/flags.test.ts \
    shared/__tests__/nativeLocalesConfig.test.ts --watchman=false \
    --selectProjects=unit --silent > "$TMPDIR/break-134-jest.log" 2>&1
}

expect_fail() {
  local name=$1
  if run_tests; then
    echo "BREAK NOT APPLIED: $name (tests still pass)"
    return 1
  fi
  grep -q "✕" "$TMPDIR/break-134-jest.log" || { echo "BREAK NOT APPLIED: $name (no failing test)"; return 1; }
  echo "mutant killed: $name"
  return 0
}

BACKUP=$(mktemp -d)
cp app.config.ts plugins/androidLocaleConfig.js "$BACKUP/"
FAILS=0

# Mutation 1: drop the androidOnlyResolution disjunct's argv route entirely
python3 - <<'EOF'
raw = open('app.config.ts').read()
old = "if (platform === 'android' || (platform === undefined && androidOnlyResolution)) {"
new = "if (platform === 'android') {"
assert raw.count(old) == 1
open('app.config.ts','w').write(raw.replace(old, new))
EOF
expect_fail "branch entered on androidOnlyResolution without platform" || FAILS=$((FAILS+1))
cp "$BACKUP/app.config.ts" app.config.ts

# Mutation 2: drop the platform-undefined guard
python3 - <<'EOF'
raw = open('app.config.ts').read()
old = "platform === undefined && androidOnlyResolution"
new = "androidOnlyResolution"
assert raw.count(old) == 1
open('app.config.ts','w').write(raw.replace(old, new))
EOF
expect_fail "platform-defined resolutions never take the android branch" || FAILS=$((FAILS+1))
cp "$BACKUP/app.config.ts" app.config.ts

# Mutation 3: drop the ios-token veto
python3 - <<'EOF'
raw = open('app.config.ts').read()
old = "argvTokens.includes('android') && !argvTokens.includes('ios')"
new = "argvTokens.includes('android')"
assert raw.count(old) == 1
open('app.config.ts','w').write(raw.replace(old, new))
EOF
expect_fail "argv carrying ios stays out of the android branch" || FAILS=$((FAILS+1))
cp "$BACKUP/app.config.ts" app.config.ts

# Mutation 4: widgets flag gates the branch again (the original defect)
python3 - <<'EOF'
raw = open('app.config.ts').read()
old = "if (platform === 'android' || (platform === undefined && androidOnlyResolution)) {"
new = "if (platform === 'android' || (platform === undefined && androidOnlyResolution && androidWidgetsEnabled)) {"
assert raw.count(old) == 1
open('app.config.ts','w').write(raw.replace(old, new))
EOF
expect_fail "widgets-off android resolution still registers the locale plugin" || FAILS=$((FAILS+1))
cp "$BACKUP/app.config.ts" app.config.ts

# Mutation 5: the plugin never writes android-kind defaults
python3 - <<'EOF'
raw = open('plugins/androidLocaleConfig.js').read()
old = "if (widget.android && expoWidgetsResolvesWidgetDefaults(config)) continue;"
new = "if (widget.android) continue;"
assert raw.count(old) == 1
open('plugins/androidLocaleConfig.js','w').write(raw.replace(old, new))
EOF
expect_fail "stripped resolution writes all 14 kinds' defaults" || FAILS=$((FAILS+1))
cp "$BACKUP/androidLocaleConfig.js" plugins/androidLocaleConfig.js

# Mutation 6: the plugin always writes android-kind defaults
python3 - <<'EOF'
raw = open('plugins/androidLocaleConfig.js').read()
old = "if (widget.android && expoWidgetsResolvesWidgetDefaults(config)) continue;"
new = "if (false) continue;"
assert raw.count(old) == 1
open('plugins/androidLocaleConfig.js','w').write(raw.replace(old, new))
EOF
expect_fail "expo-widgets-present resolution keeps 14 entries" || FAILS=$((FAILS+1))
cp "$BACKUP/androidLocaleConfig.js" plugins/androidLocaleConfig.js

# Mutation 7: enumerate kinds from the resolved config again (the second defect)
python3 - <<'EOF'
raw = open('plugins/androidLocaleConfig.js').read()
old = "const appExpo = JSON.parse(fs.readFileSync(path.join(projectRoot, 'app.json'), 'utf8')).expo;"
new = "const appExpo = config;"
assert raw.count(old) == 1
open('plugins/androidLocaleConfig.js','w').write(raw.replace(old, new))
EOF
expect_fail "kind enumeration survives the strip" || FAILS=$((FAILS+1))
cp "$BACKUP/androidLocaleConfig.js" plugins/androidLocaleConfig.js

rm -rf "$BACKUP"
if [[ $FAILS -eq 0 ]]; then
  echo "ALL AS EXPECTED: 7"
else
  echo "BREAKS FAILED: $FAILS"
  exit 1
fi
