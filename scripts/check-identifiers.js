/**
 * Refuses a commit or a push that would publish something identifying a person or a device.
 *
 * This repository is public, and a written rule only works when whoever is typing reads it. This gate runs in the
 * git hooks instead, so it applies to every tool and every model alike.
 *
 * Two lists are checked. The SHAPES below are public: they describe what an identifier looks like without naming
 * one. The PRIVATE list holds the exact strings that must never appear, and it lives outside the repository, because
 * inside a public repository that list would itself be the leak.
 *
 * A hit never prints the matched text in full, since hook output is copied into session records.
 *
 *   node scripts/check-identifiers.js --staged          the lines added by this commit, and the files it adds
 *   node scripts/check-identifiers.js --message <file>  the commit message
 *   node scripts/check-identifiers.js --push <sha>      every commit up to <sha> that no remote has
 *   node scripts/check-identifiers.js --all             every tracked file as it stands
 *   node scripts/check-identifiers.js --history         every version of every file reachable from HEAD
 *   node scripts/check-identifiers.js --learn           add the attached devices and this machine to the private list
 *
 * A false positive is fixed by editing a shape here, in the same commit, where the change is reviewed. There is no
 * flag that skips the check.
 */

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PRIVATE_LIST =
  process.env.ATHAN_IDENTIFIER_DENYLIST || path.join(os.homedir(), '.config', 'athan', 'identifier-denylist.txt');

/**
 * The position the tests use: Charing Cross, the public point London is measured from, and the only London position a
 * file may carry. Published sources spell it to slightly different precisions, so it is matched as a small box.
 */
const FIXTURE = { latitude: [51.505, 51.509], longitude: [0.126, 0.129] };

const within = (value, [low, high]) => value >= low && value <= high;

/** Third-party documentation and published research data, whose example values are not this project's */
const SHAPES_NOT_APPLIED = [
  /^\.agents\/skills\/(?!athan-next\/)/,
  /^ai\/features\/global-prayer-times\/data\//,
  /^ai\/features\/moonsighting\//,
  /^yarn\.lock$/,
];

/** Where an image, a recording or a document may live. Anywhere else it is most likely a capture of a device */
const MEDIA_ALLOWED = [/^assets\//, /^ai\/features\/global-prayer-times\/data\//, /^ai\/features\/moonsighting\//];
const MEDIA = /\.(png|jpe?g|gif|webp|heic|mp4|mov|m4v|pdf)$/i;

const DEVICE_TOOL = /udid|--device|devicectl|simctl|simulator|-destination|agent-device/i;
const UUID = /[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/i;
const PLACEHOLDER = /^(SIMULATOR_UDID|IPHONE_UDID)$/;

/** A mosque's or a station's postcode is published by the place itself */
const PUBLIC_VENUE = /mosque|masjid|islamic centre|church|station|airport|museum|university/i;

/** A decimal with three or more places, which is where a position stops being a city and starts being a street */
const PRECISE_DECIMAL = /-?\d{1,3}\.\d{3,}/g;

/** Past this many decimals a line is drawing data, such as an SVG path, and a region's bounding box is not a position */
const MOST_DECIMALS_IN_A_POSITION = 8;
const REGION = /\bbbox\b|bounding box/i;

const isLondonPosition = (line) => {
  const numbers = (line.match(PRECISE_DECIMAL) || []).map((text) => ({ text, value: Number(text) }));
  if (numbers.length > MOST_DECIMALS_IN_A_POSITION || REGION.test(line)) return null;
  const latitudes = numbers.filter(({ value }) => value >= 51.2 && value <= 51.8);
  const longitudes = numbers.filter(({ value }) => Math.abs(value) <= 0.6);

  const fixtureLongitude = longitudes.some(({ value }) => within(Math.abs(value), FIXTURE.longitude));

  for (const latitude of latitudes) {
    const isFixture = within(latitude.value, FIXTURE.latitude) && fixtureLongitude;
    if (!isFixture && longitudes.length > 0) return latitude.text;
  }

  return null;
};

/**
 * What an identifier looks like. Each shape answers the text it matched, or null.
 *
 * Every pattern is written so that the rule's own placeholders pass: 3T_SERIAL, IPHONE_UDID, SIMULATOR_UDID,
 * TEAM_ID, CERT_TEAM_ID, PHONE_ADDRESS, WIFI_NAME and $HOME.
 */
const SHAPES = [
  {
    id: 'home-path',
    advice: 'a path under a home directory. Write $HOME/...',
    find: (line) =>
      line.match(
        /\/(?:Users|home)\/(?!(?:expo|gabe|dev|runner|Shared|username|user|name|you|me)[/\s"'`)])[A-Za-z0-9][\w.-]*\//
      ),
  },
  {
    id: 'apple-device',
    advice: 'an iPhone identifier, whole or shortened. Write IPHONE_UDID',
    find: (line) => line.match(/\b0000[0-9A-F]{4}-(?:[0-9A-F]{16}\b|…|\.\.\.)/i),
  },
  {
    id: 'device-uuid',
    advice: 'a device or simulator identifier. Write IPHONE_UDID or SIMULATOR_UDID',
    find: (line) => (DEVICE_TOOL.test(line) ? line.match(UUID) : null),
  },
  {
    id: 'adb-serial',
    advice: 'a phone serial. Write 3T_SERIAL, X8_SERIAL, S23_SERIAL or 8T_SERIAL',
    find: (line) => {
      const match = line.match(/(?:adb(?: -d)? -s |ANDROID_SERIAL=)["']?([A-Za-z0-9][\w.:-]{5,})/);
      if (!match) return null;

      return /^(emulator-|PHONE_ADDRESS|SERIAL$|[A-Z0-9]+_SERIAL$)/.test(match[1]) ? null : [match[1]];
    },
  },
  {
    id: 'position',
    advice: 'a precise position in London that is not the test fixture. Use the fixture, or say where in words',
    find: (line) => {
      const dumped = line.match(/Location\[[a-z]+ -?\d+\.\d+,-?\d+\.\d+/);
      if (dumped) return dumped;

      const latitude = isLondonPosition(line);

      return latitude ? [latitude] : null;
    },
  },
  {
    id: 'postcode',
    advice: 'a postcode. Never write an address a phone or a geocoder reported',
    find: (line) => (PUBLIC_VENUE.test(line) ? null : line.match(/\b[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}\b/)),
  },
  {
    id: 'lan-address',
    advice: 'an address on a private network. Write PHONE_ADDRESS',
    find: (line) =>
      line.match(
        /\b(?:192\.168\.\d{1,3}\.\d{1,3}|10\.(?!0\.2\.)\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/
      ),
  },
  {
    id: 'wifi-name',
    advice: 'a Wi-Fi network name. Write WIFI_NAME',
    find: (line) => line.match(/\bSSID[ =:]+"(?!WIFI_NAME")[^"\n]+"/),
  },
  {
    id: 'team-id',
    advice: 'an Apple team id. Write TEAM_ID or CERT_TEAM_ID',
    find: (line) =>
      line.match(
        /(?:DEVELOPMENT_TEAM\s*[=:]\s*|\bTeam[ `"]+|Apple (?:Development|Distribution): [^(\n]{0,60}\()(?!TEAM_ID|CERT_TEAM_ID)[A-Z0-9]{10}\b/
      ),
  },
  {
    id: 'device-name',
    advice: 'a device named after a person. Say which model it is',
    find: (line) => line.match(/\b(?!Apple)[A-Z][a-z]+[’']s (?:iPhone|iPad|MacBook|Mac mini|Mac)\b/),
  },
];

/** The first characters and the length, enough to find the text without repeating it */
const mask = (text) => `${text.slice(0, 3)}… (${text.length} characters)`;

const readPrivateList = () => {
  if (!fs.existsSync(PRIVATE_LIST)) return null;

  return fs
    .readFileSync(PRIVATE_LIST, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
};

/**
 * Every hit in one piece of text
 *
 * @param text What is being published: added lines, a whole file, or a commit message
 * @param file The path it belongs to, which decides whether the shapes apply
 * @param privateList The exact strings that must appear nowhere
 */
const scanText = (text, file, privateList) => {
  const hits = [];
  const shapesApply = !SHAPES_NOT_APPLIED.some((pattern) => pattern.test(file));
  const lines = text.split('\n');

  lines.forEach((line, index) => {
    const lowered = line.toLowerCase();

    privateList.forEach((entry, position) => {
      if (lowered.includes(entry.toLowerCase())) {
        hits.push({ file, line: index + 1, rule: 'private-list', detail: `entry ${position + 1} of the private list` });
      }
    });

    if (!shapesApply) return;

    for (const shape of SHAPES) {
      const match = shape.find(line);
      if (match && !PLACEHOLDER.test(match[0])) {
        hits.push({ file, line: index + 1, rule: shape.id, detail: `${shape.advice}. Found ${mask(match[0])}` });
      }
    }
  });

  return hits;
};

/** A screenshot or a recording of a device is never committed: what was read off the screen is written as text */
const scanAddedFile = (file) =>
  MEDIA.test(file) && !MEDIA_ALLOWED.some((pattern) => pattern.test(file))
    ? [{ file, line: 0, rule: 'media', detail: 'an image, recording or document outside assets/. Record it as text' }]
    : [];

const git = (args, options = {}) =>
  execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 1024, ...options });

/**
 * The lines a diff adds, grouped by the file they land in
 *
 * @param diff Unified diff text with no context lines
 */
const addedLines = (diff) => {
  const byFile = new Map();
  let file = null;

  for (const line of diff.split('\n')) {
    if (line.startsWith('+++ ')) {
      file = line === '+++ /dev/null' ? null : line.slice(6);
      continue;
    }
    if (file && line.startsWith('+')) byFile.set(file, `${byFile.get(file) ?? ''}${line.slice(1)}\n`);
  }

  return byFile;
};

const scanDiff = (diff, privateList) =>
  [...addedLines(diff)].flatMap(([file, text]) => scanText(text, file, privateList));

const scanStaged = (privateList) => {
  const added = git(['diff', '--cached', '--name-only', '--diff-filter=A', '-z']).split('\0').filter(Boolean);
  const diff = git(['diff', '--cached', '-U0', '--no-color', '--no-ext-diff', '--diff-filter=ACMR']);

  return [...added.flatMap(scanAddedFile), ...scanDiff(diff, privateList)];
};

const scanMessage = (file, privateList) => {
  const message = fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => !line.startsWith('#'))
    .join('\n');

  return scanText(message, 'the commit message', privateList);
};

const scanPush = (sha, privateList) => {
  const commits = git(['rev-list', sha, '--not', '--remotes']).split('\n').filter(Boolean);

  return commits.flatMap((commit) => {
    const short = commit.slice(0, 8);
    const message = git(['log', '-1', '--format=%an %ae%n%B', commit]);
    const diff = git(['show', '-U0', '--no-color', '--no-ext-diff', '--format=', commit]);
    const added = git(['show', '--name-only', '--diff-filter=A', '--format=', '-z', commit])
      .split('\0')
      .filter(Boolean);
    const hits = [
      ...scanText(message, 'the commit message', privateList),
      ...added.flatMap(scanAddedFile),
      ...scanDiff(diff, privateList),
    ];

    return hits.map((hit) => ({ ...hit, file: `${hit.file} (commit ${short})` }));
  });
};

const isText = (buffer) => !buffer.subarray(0, 8000).includes(0);

const scanAll = (privateList) => {
  const files = git(['ls-files', '-z']).split('\0').filter(Boolean);

  return files.flatMap((file) => {
    const absolute = path.join(ROOT, file);
    if (!fs.existsSync(absolute) || fs.statSync(absolute).isDirectory()) return [];

    const buffer = fs.readFileSync(absolute);

    return isText(buffer) ? scanText(buffer.toString('utf8'), file, privateList) : [];
  });
};

/** Blobs are read in batches, since the whole history at once would not fit in memory */
const BATCH = 400;

const scanHistory = (privateList) => {
  const objects = git(['rev-list', '--objects', '--filter=object:type=blob', 'HEAD']).split('\n').filter(Boolean);
  const hits = [];
  const seen = new Set();

  for (let start = 0; start < objects.length; start += BATCH) {
    const batch = objects.slice(start, start + BATCH).map((entry) => {
      const space = entry.indexOf(' ');
      return { oid: entry.slice(0, space), file: entry.slice(space + 1) };
    });
    const output = execFileSync('git', ['cat-file', '--batch'], {
      cwd: ROOT,
      input: batch.map(({ oid }) => oid).join('\n'),
      maxBuffer: 2 * 1024 * 1024 * 1024,
    });

    let offset = 0;
    for (const { file } of batch) {
      const headerEnd = output.indexOf(10, offset);
      const size = Number(output.subarray(offset, headerEnd).toString().split(' ')[2]);
      const body = output.subarray(headerEnd + 1, headerEnd + 1 + size);
      offset = headerEnd + 1 + size + 1;
      if (!isText(body)) continue;

      for (const hit of scanText(body.toString('utf8'), file, privateList)) {
        // One line per file and rule: a string that sat in a file for a hundred commits is one finding
        const key = `${hit.file}|${hit.rule}|${hit.detail}`;
        if (!seen.has(key)) {
          seen.add(key);
          hits.push({ ...hit, file: `${hit.file} (in history)` });
        }
      }
    }
  }

  const log = git(['log', '--format=%an %ae %cn %ce%n%B%x01', 'HEAD']);
  for (const message of log.split('\x01')) hits.push(...scanText(message, 'a commit message', privateList));

  return hits;
};

/** What this machine and the phones attached to it would write into a log */
const learn = () => {
  const found = new Set();
  const run = (command, args) => {
    try {
      return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    } catch {
      return '';
    }
  };

  for (const line of run('adb', ['devices']).split('\n').slice(1)) {
    const [serial, state] = line.trim().split(/\s+/);
    if (serial && state === 'device' && !serial.startsWith('emulator-')) found.add(serial);
  }

  for (const line of run('xcrun', ['devicectl', 'list', 'devices', '--columns', '*']).split('\n')) {
    if (!/physical/i.test(line)) continue;
    for (const match of line.match(new RegExp(UUID, 'gi')) || []) found.add(match);
    for (const match of line.match(/\b0000[0-9A-F]{4}-[0-9A-F]{16}\b/gi) || []) found.add(match);
  }

  for (const name of ['ComputerName', 'LocalHostName']) {
    const value = run('scutil', ['--get', name]).trim();
    if (value) found.add(value);
  }

  const known = new Set((readPrivateList() ?? []).map((entry) => entry.toLowerCase()));
  const fresh = [...found].filter((entry) => !known.has(entry.toLowerCase()));

  fs.mkdirSync(path.dirname(PRIVATE_LIST), { recursive: true });
  if (fresh.length > 0) fs.appendFileSync(PRIVATE_LIST, `${fresh.join('\n')}\n`, { mode: 0o600 });
  process.stdout.write(`Identifier gate: ${fresh.length} new entries added to the private list.\n`);
};

const main = ([mode, argument]) => {
  if (mode === '--learn') return learn();

  const privateList = readPrivateList();
  if (privateList === null) {
    process.stderr.write(
      `Identifier gate: no private list at ${PRIVATE_LIST.replace(os.homedir(), '$HOME')}, so only shapes are checked.\n`
    );
  }
  const list = privateList ?? [];

  let hits;
  if (mode === '--staged') hits = scanStaged(list);
  else if (mode === '--message' && argument) hits = scanMessage(argument, list);
  else if (mode === '--push' && argument) hits = scanPush(argument, list);
  else if (mode === '--all') hits = scanAll(list);
  else if (mode === '--history') hits = scanHistory(list);
  else {
    process.stderr.write(
      'usage: check-identifiers.js --staged | --message <file> | --push <sha> | --all | --history | --learn\n'
    );
    process.exit(2);
  }

  if (hits.length === 0) return;

  const lines = hits.map((hit) => `  ${hit.file}${hit.line ? `:${hit.line}` : ''}  [${hit.rule}] ${hit.detail}`);
  process.stderr.write(
    `Identifier gate: this repository is public, and these would publish something identifying.\n${lines.join('\n')}\n` +
      'Replace each with its placeholder (ai/AGENTS.md, "Keep the repository free of personal and device identifiers").\n'
  );
  process.exit(1);
};

if (require.main === module) main(process.argv.slice(2));

module.exports = { addedLines, scanAddedFile, scanText };
