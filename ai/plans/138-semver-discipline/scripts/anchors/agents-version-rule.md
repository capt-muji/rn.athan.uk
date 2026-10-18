- Version bump on every commit: `package.json`, `app.json` and `android/app/build.gradle`
  together, patch per commit and minor per completed feature. Fetch `origin` first, because
  concurrent sessions have taken the same number twice. Bump `app.json` FIRST, then prebuild,
  then build: `expo run:*` never re-syncs an existing native folder.
