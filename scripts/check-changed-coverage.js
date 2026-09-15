/**
 * Refuses a commit or a push whose changed source is not fully covered.
 *
 * Run straight after `jest --coverage`, which writes coverage/coverage-summary.json for every file collectCoverageFrom
 * measures, tested or not. A changed source file must be in that summary at 100% statements, branches, functions and
 * lines, or sit under a path listed in UNMEASURED with the reason it is not measured. Anything else fails, so a new
 * folder cannot escape the measure by not being listed in jest.config.js.
 *
 * Coverage is measured on the working tree, so the tree must be exactly what is being committed or pushed: an unstaged
 * or untracked test would cover a file whose commit does not carry that test.
 *
 * A commit that only weakens or deletes a test changes no source file, so this gate passes it; the global coverage
 * thresholds in jest.config.js, at 100, are what refuse it.
 *
 *   node scripts/check-changed-coverage.js --staged        the files staged for this commit
 *   node scripts/check-changed-coverage.js --push <sha>    the files of every commit up to <sha> that no remote has
 */

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SUMMARY = path.join(ROOT, 'coverage', 'coverage-summary.json');
const METRICS = ['statements', 'branches', 'functions', 'lines'];
const CODE = /\.(ts|tsx|js|jsx|mjs)$/;
const NOT_SOURCE = [/(^|\/)__tests__\//, /(^|\/)__mocks__\//, /\.d\.ts$/];
const IGNORE_COMMENT = /(istanbul|c8|v8)\s+ignore/;

/** Source that is deliberately outside the measure, each with the reason nothing in it can be covered by Jest */
const UNMEASURED = [
  {
    path: 'widgets/',
    reason: 'serialized into the iOS widget extension runtime; checked by AST in widgetContract.test.ts',
  },
  { path: 'plugins/', reason: 'Expo config plugins, run by prebuild on the build machine, never by the app' },
  { path: 'app.config.ts', reason: 'build-time Expo configuration' },
  { path: 'metro.config.js', reason: 'bundler configuration' },
  { path: 'jsx-runtime-shim.ts', reason: 'resolved only by Metro, which Jest does not use' },
  { path: 'modules/', reason: 'native Kotlin module; its JavaScript surface is device/tls13.ts, which is measured' },
  { path: 'assets/', reason: 'static asset registries (require maps and SVG path strings), no logic' },
  { path: 'mocks/', reason: 'fabricated API data for dev builds' },
  { path: 'e2e/', reason: 'device test harness, run against the app on hardware' },
  { path: 'scripts/', reason: 'repository tooling, including this gate' },
  { path: '.agents/', reason: 'Expo and EAS agent skills, documentation for coding agents' },
  { path: 'jest.config.js', reason: 'test runner configuration' },
  { path: 'jest.setup.js', reason: 'test runner configuration' },
  { path: 'jest.components.setup.js', reason: 'test runner configuration' },
];

const fail = (lines) => {
  process.stderr.write(`Coverage gate: ${lines.join('\n  ')}\n`);
  process.exit(1);
};

// -z keeps every path byte for byte: without it git quotes a path holding a non-ASCII character, and no pattern matches
const gitPaths = (...args) => {
  try {
    const output = execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });
    return output
      .split('\0')
      .map((entry) => entry.replace(/^\n+/, ''))
      .filter(Boolean);
  } catch (error) {
    return fail([`git ${args.join(' ')} failed:`, String(error.message).trim()]);
  }
};

/**
 * Code in the working tree that differs from what is being checked
 *
 * @param stagedCounts Whether a staged change is what is being checked (a commit) or is itself unrecorded (a push)
 */
const unrecordedCode = (stagedCounts) => {
  const entries = gitPaths('status', '--porcelain=v1', '--untracked-files=all', '-z');
  const unrecorded = [];

  for (let index = 0; index < entries.length; index += 1) {
    const [staged, unstaged] = entries[index];
    const file = entries[index].slice(3);
    // A rename or copy is followed by the path it came from
    if (staged === 'R' || staged === 'C') index += 1;

    const differs = unstaged !== ' ' || (!stagedCounts && staged !== ' ');
    if (differs && CODE.test(file)) unrecorded.push(file);
  }

  return unrecorded;
};

const changedFiles = ([mode, sha]) => {
  if (mode === '--staged') {
    const unrecorded = unrecordedCode(true);
    if (unrecorded.length > 0) {
      fail(['stage or stash these first, since coverage is measured on the working tree:', ...unrecorded]);
    }
    return gitPaths('diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z');
  }

  if (mode === '--push' && sha) {
    const [head] = gitPaths('rev-parse', 'HEAD');
    if (head.trim() !== sha) fail([`check out the branch being pushed (${sha}), since coverage is measured on it`]);

    const unrecorded = unrecordedCode(false);
    if (unrecorded.length > 0) fail(['commit or stash these first:', ...unrecorded]);

    // A merge commit lists nothing by default, so an edit made while resolving it would never be gated
    const files = gitPaths(
      'log',
      '--format=',
      '--name-only',
      '--diff-merges=dense-combined',
      '-z',
      sha,
      '--not',
      '--remotes'
    );
    return [...new Set(files)].filter((file) => fs.existsSync(path.join(ROOT, file)));
  }

  return fail(['usage: check-changed-coverage.js --staged | --push <sha>']);
};

const main = () => {
  const files = changedFiles(process.argv.slice(2)).filter(
    (file) => CODE.test(file) && !NOT_SOURCE.some((pattern) => pattern.test(file))
  );
  if (files.length === 0) return;

  if (!fs.existsSync(SUMMARY)) fail(['coverage/coverage-summary.json is missing. Run `yarn validate` first.']);

  const summary = JSON.parse(fs.readFileSync(SUMMARY, 'utf8'));
  const summaryWrittenAt = fs.statSync(SUMMARY).mtimeMs;
  const failures = [];

  for (const file of files) {
    const absolute = path.join(ROOT, file);
    const measured = summary[absolute];

    // An ignore comment reports the code under it as covered, which would pass this gate with nothing tested
    if (IGNORE_COMMENT.test(fs.readFileSync(absolute, 'utf8'))) {
      failures.push(`${file}: a coverage ignore comment. Test the code, or list the file in UNMEASURED with a reason`);
      continue;
    }

    if (!measured) {
      if (!UNMEASURED.some((entry) => file === entry.path || file.startsWith(entry.path))) {
        failures.push(`${file}: not measured. Add its folder to collectCoverageFrom, or to UNMEASURED with a reason`);
      }
      continue;
    }

    // A summary from before the last edit describes other code
    if (fs.statSync(absolute).mtimeMs > summaryWrittenAt) {
      failures.push(`${file}: changed after coverage was measured. Run \`yarn validate\` again`);
      continue;
    }

    const short = METRICS.filter((metric) => measured[metric].pct < 100).map(
      (metric) => `${metric} ${measured[metric].covered}/${measured[metric].total}`
    );
    if (short.length > 0) failures.push(`${file}: ${short.join(', ')}`);
  }

  if (failures.length > 0) fail(['every changed source file needs 100% coverage.', ...failures]);
};

main();
