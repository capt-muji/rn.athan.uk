/**
 * Pins git's hook directory to the tracked .husky/ files.
 *
 * husky's own init points core.hooksPath at .husky/_, a gitignored directory
 * that only exists after an install; until then a fresh worktree's commits
 * run no hooks at all and pass green. The tracked hooks need no generated
 * shim - every command they run resolves node_modules/.bin by itself - so the
 * repository's own .husky/ can be the hooks path, present in every checkout
 * from the moment it is created.
 */
const { execFileSync } = require('node:child_process');

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

try {
  git('rev-parse', '--git-common-dir');
} catch {
  // Not a repository (an install into a packed tarball): nothing to pin.
  process.exit(0);
}

if (git('rev-parse', '--is-bare-repository') === 'true') {
  // A bare repository has no working tree, so the tracked .husky/ cannot resolve.
  process.stdout.write('bare repository, no hooks path pinned\n');
  process.exit(0);
}

git('config', 'core.hooksPath', '.husky');
process.stdout.write('core.hooksPath -> .husky\n');
