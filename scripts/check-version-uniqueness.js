/**
 * Refuses a version number that another unpushed commit already carries.
 *
 * The per-commit lockstep test keeps one commit's three version files equal
 * but cannot see across branches: two lanes that bump from the same base take
 * the same number twice, and both merge green. This gate reads app.json -
 * the file the app reads, and the only source whose content never lies; commit
 * messages have carried the wrong number - from every non-merge commit on
 * every local branch except main, all minus the base ref, and from the
 * working tree's staged bump. Merge commits are excluded because the merge
 * convention repeats the version of the commit it lands, and the staged bump
 * is skipped while MERGE_HEAD is set because a merge-in-flight worktree
 * already holds the incoming version.
 *
 *   node scripts/check-version-uniqueness.js [--base <ref>] [--allowlist <file>]
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// The process cwd is the checkout under check: the worktree when the hook runs,
// a throwaway fixture when the tests run the script from outside the repo.
const CWD = process.cwd();
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const BASE = flag('--base', 'origin/uat');
// The merge hook passes this: at pre-merge-commit time no MERGE_HEAD ref
// exists on disk yet, and the worktree already holds the incoming version.
const NO_CANDIDATE = args.includes('--no-candidate');
const ALLOWLIST = flag('--allowlist', path.join(__dirname, 'version-collisions-allowlist.json'));

const git = (...cmdArgs) => execFileSync('git', cmdArgs, { cwd: CWD, encoding: 'utf8' });
const commitVersion = (sha) => {
  try {
    return JSON.parse(git('cat-file', '-p', `${sha}:app.json`)).expo.version;
  } catch {
    return null;
  }
};

const mergeHeadRefExists = () => {
  try {
    git('rev-parse', '-q', '--verify', 'MERGE_HEAD');
    return true;
  } catch {
    return false;
  }
};

let refCount = 1;
const shas = new Set(
  (() => {
    try {
      git('rev-parse', '--verify', '-q', BASE);
    } catch {
      process.stdout.write(`VERSIONS FAIL cannot resolve base ${BASE}\n`);
      process.exit(2);
    }
    const branches = git('for-each-ref', 'refs/heads', '--format=%(refname:short)')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '' && line !== 'main');
    const currentBranch = git('rev-parse', '--abbrev-ref', 'HEAD').trim();
    refCount = branches.length + (branches.includes(currentBranch) ? 0 : 1);
    const ranges = branches.map((branch) => `${BASE}..${branch}`);
    ranges.push(`${BASE}..HEAD`);
    return git('rev-list', '--no-merges', ...ranges)
      .split('\n')
      .filter((s) => s !== '');
  })()
);

const byVersion = new Map();
let skipped = 0;
for (const sha of shas) {
  const version = commitVersion(sha);
  if (version === null) {
    skipped += 1;
    continue;
  }
  const held = byVersion.get(version) ?? [];
  held.push(sha);
  byVersion.set(version, held);
}

// Git does not export MERGE_HEAD to hooks, so the check reads the ref too:
// concluding a merge runs the pre-commit hook with the worktree already
// holding the incoming version while HEAD is still the base side.
const mergeInFlight = NO_CANDIDATE || Boolean(process.env.MERGE_HEAD) || mergeHeadRefExists();
const headVersion = commitVersion('HEAD');
if (headVersion !== null && !mergeInFlight) {
  // The commit records the index, not the worktree: a staged bump must be
  // read from the staged blob so a later un-staged edit cannot hide it.
  let staged = null;
  try {
    staged = JSON.parse(git('cat-file', '-p', ':app.json')).expo.version;
  } catch {
    staged = JSON.parse(fs.readFileSync(path.join(CWD, 'app.json'), 'utf8')).expo.version;
  }
  if (staged !== headVersion) {
    const held = byVersion.get(staged) ?? [];
    held.push('staged');
    byVersion.set(staged, held);
  }
}

let allowed = [];
try {
  allowed = JSON.parse(fs.readFileSync(ALLOWLIST, 'utf8')).map((entry) => entry.version);
} catch {
  allowed = [];
}

let failed = false;
for (const [version, holders] of [...byVersion.entries()].sort()) {
  if (holders.length < 2) continue;
  if (allowed.includes(version)) {
    process.stdout.write(`VERSION GRANDFATHERED ${version} (${holders.length} commits)\n`);
    continue;
  }
  process.stdout.write(`VERSION COLLISION ${version}: ${holders.join(' ')}\n`);
  failed = true;
}

if (failed) process.exit(1);
process.stdout.write(
  `VERSIONS OK ${shas.size} commits across ${refCount} refs, ${skipped} unreadable, no shared version\n`
);
