  `$HOME/athan-gitree/uat.lock` around every merge into `uat` (merges happen
  only in the main tree, `git fetch -q origin uat` first, `--no-ff`, and run
  `node scripts/check-version-uniqueness.js` after the fetch and before
  `git merge`, resolving any collision first);
  `$HOME/athan-gitree/build.lock` around `build-prod.zsh`, `build-mock.zsh` and
  any Xcode or toolchain change (the scripts hardcode the main tree and build
  `uat` content: run a build step only after its code is merged);
  `$HOME/athan-gitree/device-<SERIAL>.lock` around any contact with one phone.
