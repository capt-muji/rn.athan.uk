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
