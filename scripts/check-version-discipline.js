/**
 * Refuses a version bump of the wrong class: a commit whose subject is typed
 * `feat` must take the minor (patch reset to zero), every other non-merge
 * subject must take exactly one patch, and a major is the owner's alone.
 *
 * The uniqueness gate reads versions across branches; this one reads one
 * commit against its parent, at commit-msg time: HEAD is still the parent
 * and the index already holds the tree being committed, so the candidate
 * is the staged blob alone - a worktree fallback would bless bytes no
 * commit carries. Merge conclusions skip the class rules (the convention
 * repeats the landed version) but never the direction: a conflicted merge
 * fires no pre-merge hook, so the concluding commit is the last gate
 * against a resolution that takes the line backward.
 *
 * A major passes only through scripts/version-major-allowlist.json, whose
 * entries are [{ "version": "...", "reason": "..." }]: an entry is added
 * only with the owner's recorded order, naming the queue row and date in
 * `reason`, and a major without that record is a revertible audit finding.
 *
 * The --merge-check arm serves the pre-merge-commit hook: at that moment the
 * index already holds the merge result, and a merge whose version does not
 * strictly exceed HEAD's would take the line backward, so it is refused and
 * the lane rebases and renumbers onto the higher line.
 *
 *   node scripts/check-version-discipline.js [--message-file <file>] [--allowlist <file>] [--merge-check]
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
const MESSAGE_FILE = flag('--message-file', null);
const ALLOWLIST = flag('--allowlist', path.join(__dirname, 'version-major-allowlist.json'));
const MERGE_CHECK = args.includes('--merge-check');

const git = (...cmdArgs) => execFileSync('git', cmdArgs, { cwd: CWD, encoding: 'utf8' });

const fail = (reason) => {
  process.stdout.write(`DISCIPLINE FAIL ${reason}\n`);
  process.exit(1);
};

const mergeFail = (reason) => {
  process.stdout.write(`MERGE VERSION FAIL ${reason}\n`);
  process.exit(1);
};

const readVersion = (spec) => {
  try {
    return JSON.parse(git('cat-file', '-p', spec)).expo.version;
  } catch {
    return null;
  }
};

const parseSegments = (version) => {
  const parts = String(version).split('.');
  if (parts.length !== 3 || parts.some((part) => !/^\d+$/.test(part))) return null;
  const [major, minor, patch] = parts.map(Number);
  return { major, minor, patch };
};

// Weights rank every legal segment step inside one major line; the patch tail
// is already past a thousand.
const total = (s) => s.major * 1e12 + s.minor * 1e6 + s.patch;
const strictlyIncreasing = (from, to) => {
  const f = parseSegments(from);
  const t = parseSegments(to);
  if (f === null || t === null) return null;
  return t.major > f.major || (t.major === f.major && total(t) > total(f));
};

if (MERGE_CHECK) {
  const headVersion = readVersion('HEAD:app.json');
  if (headVersion === null) mergeFail('no app.json at HEAD');
  // The pre-merge index is the merge result; the worktree may still hold
  // pre-merge bytes, so the incoming version is the staged blob alone.
  let incomingVersion = null;
  try {
    incomingVersion = JSON.parse(git('cat-file', '-p', ':app.json')).expo.version;
  } catch {
    mergeFail('no staged app.json');
  }
  const increasing = strictlyIncreasing(headVersion, incomingVersion);
  if (increasing === null) {
    mergeFail(`not X.Y.Z (${headVersion} -> ${incomingVersion})`);
  }
  if (!increasing) {
    mergeFail(`${headVersion} -> ${incomingVersion} (rebase and renumber onto the higher line)`);
  }
  process.stdout.write(`MERGE VERSION OK ${headVersion} -> ${incomingVersion}\n`);
  process.exit(0);
}

const mergeHeadRefExists = () => {
  try {
    git('rev-parse', '-q', '--verify', 'MERGE_HEAD');
    return true;
  } catch {
    return false;
  }
};

// Git does not export MERGE_HEAD to hooks, so the check reads the ref too:
// concluding a merge runs the commit-msg hook with the merge convention
// repeating the landed version, which is no class step to judge. A
// conflicted merge never ran the pre-merge gate, so the conclusion is the
// last chance to refuse a resolution that takes the line backward.
if (process.env.MERGE_HEAD || mergeHeadRefExists()) {
  const headVersion = readVersion('HEAD:app.json');
  let resolutionVersion = null;
  try {
    resolutionVersion = JSON.parse(git('cat-file', '-p', ':app.json')).expo.version;
  } catch {
    resolutionVersion = null;
  }
  const increasing = strictlyIncreasing(headVersion, resolutionVersion);
  if (increasing === false) {
    fail(`merge resolution takes the line backward (${headVersion} -> ${resolutionVersion})`);
  }
  process.stdout.write('DISCIPLINE SKIP merge in flight (class rules)\n');
  process.exit(0);
}

if (!MESSAGE_FILE) fail('no message file');

const subject = fs.readFileSync(MESSAGE_FILE, 'utf8').split('\n')[0];
const stripped = subject.replace(/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)? - /, '');
// `feat` is the one token the verdict reads; the other living types are
// display-only, and anything else (including `featur`) is untyped.
const displayType = (text) =>
  ['fix', 'docs', 'build', 'test', 'chore', 'refactor', 'perf', 'style', 'ci', 'merge', 'revert'].find(
    (t) => text.startsWith(t) && /^[(:\s]/.test(text.slice(t.length))
  );
const type = /^feat(?=[(:\s])/.test(stripped) ? 'feat' : (displayType(stripped) ?? 'untyped');

const parentVersion = readVersion('HEAD:app.json');
// The commit records the index, not the worktree: the bump being committed is
// the staged blob, and its absence is a refusal - a fallback to the worktree
// file blessed bytes no commit carried.
const candidateVersion = readVersion(':app.json');
if (parentVersion === null || candidateVersion === null) {
  if (candidateVersion === null) fail(`no staged app.json (parent ${parentVersion})`);
  fail(`cannot read a version (parent ${parentVersion})`);
}

const parent = parseSegments(parentVersion);
const candidate = parseSegments(candidateVersion);
if (parent === null || candidate === null) {
  fail(`version is not X.Y.Z (${parentVersion} -> ${candidateVersion})`);
}
const sameVersion = (a, b) => a.major === b.major && a.minor === b.minor && a.patch === b.patch;

// One class-step per commit: patch+1, or minor+1 with patch 0, or major+1 with
// minor and patch 0. Equal versions, skipped numbers and mixed deltas fail.
const classOf = (from, to) => {
  if (from.major === to.major && from.minor === to.minor && to.patch === from.patch + 1) return 'patch';
  if (from.major === to.major && to.minor === from.minor + 1 && to.patch === 0) return 'minor';
  if (to.major === from.major + 1 && to.minor === 0 && to.patch === 0) return 'major';
  return 'invalid';
};
const delta = classOf(parent, candidate);

let allowed = [];
try {
  allowed = JSON.parse(fs.readFileSync(ALLOWLIST, 'utf8')).map((entry) => entry.version);
} catch {
  allowed = [];
}

if (delta === 'invalid') {
  const reason = sameVersion(parent, candidate) ? 'version did not move' : 'not a single class step';
  fail(`${reason} (${parentVersion} -> ${candidateVersion})`);
}
if (delta === 'major' && !allowed.includes(candidateVersion)) {
  fail(`major versions are the owner's alone (${parentVersion} -> ${candidateVersion})`);
}
if (delta === 'minor' && type !== 'feat') {
  fail(`only feat may take a minor (${parentVersion} -> ${candidateVersion})`);
}
if (delta === 'patch' && type === 'feat') {
  fail(`feat requires a minor (${parentVersion} -> ${candidateVersion})`);
}

process.stdout.write(`DISCIPLINE OK ${parentVersion} -> ${candidateVersion} (${delta}, ${type})\n`);
