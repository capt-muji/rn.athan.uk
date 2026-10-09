/**
 * The gate that keeps personal and device identifiers out of a public repository
 *
 * Every identifier below is invented, and assembled from parts at run time: a literal would be refused by the gate
 * this suite tests, on the commit that carries it.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

type Hit = { file: string; line: number; rule: string; detail: string };

const ROOT = join(__dirname, '..', '..');
const SCRIPT = join(ROOT, 'scripts', 'check-identifiers.js');

const { addedLines, scanAddedFile, scanText } = jest.requireActual('../../scripts/check-identifiers') as {
  addedLines: (diff: string) => Map<string, string>;
  scanAddedFile: (file: string) => Hit[];
  scanText: (text: string, file: string, privateList: string[]) => Hit[];
};

const RECORD = 'ai/plans/99-example/LOG.md';

/** The rules a line trips, when it sits in an ordinary record with no private list */
const rulesFor = (line: string, file = RECORD) => scanText(line, file, []).map((hit) => hit.rule);

const glue = (...parts: string[]) => parts.join('');

const HOME_PATH = glue('/Us', 'ers/', 'someone', '/repos/app/file.ts');
const IPHONE = glue('0000', '8030', '-', '001A2B3C', '4D5E6F78');
const DEVICE_UUID = glue('1A2B3C4D', '-5E6F', '-5A7B', '-8C9D', '-0E1F2A3B4C5D');
const SERIAL = glue('a1b2', 'c3d4');
const LAN = glue('192', '.168', '.4', '.27');
const TEAM = glue('ABCDE', '12345');
const POSTCODE = glue('EC', '1A', ' ', '1BB');
const LONDON = glue('51', '.4612', ', ', '-0', '.2345');

describe('a path under a home directory', () => {
  it('is refused', () => {
    expect(rulesFor(`cd ${HOME_PATH}`)).toEqual(['home-path']);
  });

  it('passes as $HOME', () => {
    expect(rulesFor('cd $HOME/repos/app')).toEqual([]);
  });

  it('passes for the example names third-party documentation uses', () => {
    expect(rulesFor(glue('/Us', 'ers/', 'expo/', 'project'))).toEqual([]);
  });
});

describe('an iPhone identifier', () => {
  it('is refused whole', () => {
    expect(rulesFor(`devicectl says ${IPHONE}`)).toContain('apple-device');
  });

  it('is refused shortened, because a shortened identifier is still one', () => {
    expect(rulesFor(glue('the phone ', '0000', '8030', '-', '...'))).toEqual(['apple-device']);
    expect(rulesFor(glue('the phone ', '0000', '8030', '-', '…'))).toEqual(['apple-device']);
  });

  it('passes as its placeholder', () => {
    expect(rulesFor('xcrun devicectl device install app --device IPHONE_UDID')).toEqual([]);
  });
});

describe('a device or simulator identifier', () => {
  it('is refused beside a device tool', () => {
    expect(rulesFor(`xcrun simctl terminate ${DEVICE_UUID} com.example`)).toEqual(['device-uuid']);
    expect(rulesFor(`agent-device open --udid ${DEVICE_UUID}`)).toEqual(['device-uuid']);
  });

  it('passes where no device tool is named, since a project id has the same shape', () => {
    expect(rulesFor(`"projectId": "${DEVICE_UUID}"`)).toEqual([]);
  });

  it('passes as its placeholder', () => {
    expect(rulesFor('xcrun simctl terminate SIMULATOR_UDID com.example')).toEqual([]);
  });
});

describe('a phone serial', () => {
  it('is refused after adb -s', () => {
    expect(rulesFor(`adb -s ${SERIAL} shell dumpsys alarm`)).toEqual(['adb-serial']);
    expect(rulesFor(`ANDROID_SERIAL=${SERIAL} maestro test flow.yaml`)).toEqual(['adb-serial']);
  });

  it.each([
    'adb -s 3T_SERIAL shell dumpsys alarm',
    'adb -s emulator-5554 shell getprop',
    'adb -s "$SERIAL" shell getprop',
    'adb -s $1 shell getprop',
    'adb -s PHONE_ADDRESS:5555 shell getprop',
  ])('passes for %s', (line) => {
    expect(rulesFor(line)).toEqual([]);
  });
});

describe('a position', () => {
  it('is refused when it is a precise point in London', () => {
    expect(rulesFor(`the fix was ${LONDON}`)).toEqual(['position']);
  });

  it('is refused in either order', () => {
    expect(rulesFor(glue('lon -0', '.2345', ' lat 51', '.4612'))).toEqual(['position']);
  });

  it('is refused as a phone prints it', () => {
    expect(rulesFor(glue('Location[gps 40', '.1,', '-3', '.2 hAcc=14]'))).toEqual(['position']);
  });

  it.each([
    ['the fixture', 'latitude: 51.5074, longitude: -0.1278'],
    ['the fixture as published sources round it', 'Charing Cross, 51.5073 N, 0.12755 W'],
    ['the Kaaba', '21.4225, 39.8262'],
    ['another city', 'New York 40.7128, -74.0060'],
    ['a city-level London figure', 'London is near 51.5, -0.1'],
    ['a region', 'the bbox `-0.510,51.280` to `0.334,51.686`'],
    ['drawing data', "d='M51.463,0.212c0.828,0.151,1.500,0.671,1.500,1.500v4.601h4.451c0.828,0.333,1.500,0.671'"],
  ])('passes for %s', (_name, line) => {
    expect(rulesFor(line)).toEqual([]);
  });
});

describe('a postcode', () => {
  it('is refused', () => {
    expect(rulesFor(`the geocoder answered ${POSTCODE}`)).toEqual(['postcode']);
  });

  it('passes beside a public venue, which publishes its own', () => {
    expect(rulesFor(`London Central Mosque, ${POSTCODE}`)).toEqual([]);
  });
});

describe('an address on a private network', () => {
  it('is refused', () => {
    expect(rulesFor(`adb connect ${LAN}:5555`)).toContain('lan-address');
  });

  it('passes for the emulator host and for the placeholder', () => {
    expect(rulesFor('the Metro host is 10.0.2.2:8081 on an emulator')).toEqual([]);
    expect(rulesFor('adb connect PHONE_ADDRESS:5555')).toEqual([]);
  });
});

describe('a Wi-Fi name', () => {
  it('is refused', () => {
    expect(rulesFor(glue('WIFI CONNECTED ... SS', 'ID "the network', ' at home"'))).toEqual(['wifi-name']);
  });

  it('passes as its placeholder', () => {
    expect(rulesFor('WIFI CONNECTED ... SSID "WIFI_NAME"')).toEqual([]);
  });
});

describe('an Apple team id', () => {
  it('is refused in a build setting, a team line and a certificate name', () => {
    expect(rulesFor(`DEVELOPMENT_TEAM=${TEAM}`)).toEqual(['team-id']);
    expect(rulesFor(`No Account for Team "${TEAM}"`)).toEqual(['team-id']);
    expect(rulesFor(`cert "Apple Development: the maintainer (${TEAM})"`)).toEqual(['team-id']);
  });

  it('passes as its placeholders', () => {
    expect(rulesFor('DEVELOPMENT_TEAM=TEAM_ID')).toEqual([]);
    expect(rulesFor('cert "Apple Development: the maintainer (CERT_TEAM_ID)"')).toEqual([]);
  });
});

describe('a device named after a person', () => {
  it('is refused', () => {
    expect(rulesFor(glue('installed on Some', 'one’s iPh', 'one'))).toEqual(['device-name']);
    expect(rulesFor(glue('installed on Some', "one's Mac", ' mini'))).toEqual(['device-name']);
  });

  it('passes for a role and for the maker', () => {
    expect(rulesFor('installed on the owner’s iPhone')).toEqual([]);
    expect(rulesFor('Apple’s iPhone compass')).toEqual([]);
  });
});

describe('the private list', () => {
  const SECRET = glue('zebra', 'crossing', '42');

  it('is refused whatever the case', () => {
    const hits = scanText(`found at ${SECRET.toUpperCase()} today`, RECORD, [SECRET]);

    expect(hits.map((hit) => hit.rule)).toEqual(['private-list']);
  });

  it('is refused even where the shapes are not applied', () => {
    expect(scanText(SECRET, '.agents/skills/expo-router/SKILL.md', [SECRET])).toHaveLength(1);
    expect(scanText(SECRET, 'yarn.lock', [SECRET])).toHaveLength(1);
  });

  it('names the entry by its position, never by its text', () => {
    const [hit] = scanText(`found at ${SECRET}`, RECORD, ['first', SECRET]);

    expect(hit.detail).toBe('entry 2 of the private list');
    expect(JSON.stringify(hit)).not.toContain(SECRET);
  });
});

describe('where the shapes apply', () => {
  it('leaves third-party documentation and published research data alone', () => {
    expect(rulesFor(`cd ${HOME_PATH}`, '.agents/skills/expo-router/references/setup.md')).toEqual([]);
    expect(rulesFor(LONDON, 'ai/features/global-prayer-times/data/cities.csv')).toEqual([]);
  });

  it('still applies them to this project’s own skill', () => {
    expect(rulesFor(`cd ${HOME_PATH}`, '.agents/skills/athan-next/SKILL.md')).toEqual(['home-path']);
  });
});

describe('what a hit says', () => {
  it('carries the file and the line', () => {
    const [hit] = scanText(`first line\ncd ${HOME_PATH}\n`, RECORD, []);

    expect(hit).toMatchObject({ file: RECORD, line: 2, rule: 'home-path' });
  });

  it('shows the first three characters and the length, never the whole match', () => {
    const [hit] = scanText(`adb connect ${LAN}:5555`, RECORD, []);

    expect(hit.detail).toContain('192… (12 characters)');
    expect(hit.detail).not.toContain(LAN);
  });
});

describe('a file added by a commit', () => {
  it.each(['ai/plans/99-example/shot.png', 'evidence/screen.MP4', 'capture.jpeg', 'ai/notes/scan.pdf'])(
    'refuses %s, which is most likely a capture of a device',
    (file) => {
      expect(scanAddedFile(file).map((hit) => hit.rule)).toEqual(['media']);
    }
  );

  it.each([
    'assets/icons/png/star.png',
    'ai/features/global-prayer-times/data/countries/sheet.pdf',
    'ai/plans/x/LOG.md',
  ])('passes %s', (file) => {
    expect(scanAddedFile(file)).toEqual([]);
  });
});

describe('the lines a diff adds', () => {
  const DIFF = [
    'diff --git a/one.md b/one.md',
    '--- a/one.md',
    '+++ b/one.md',
    '@@ -3 +3,2 @@',
    '-a line that leaves',
    '+a line that arrives',
    '+and another',
    'diff --git a/gone.md b/gone.md',
    '--- a/gone.md',
    '+++ /dev/null',
    '@@ -1 +0,0 @@',
    '-the whole file leaves',
    'diff --git a/two.md b/two.md',
    '--- /dev/null',
    '+++ b/two.md',
    '@@ -0,0 +1 @@',
    '+a new file',
  ].join('\n');

  it('are grouped by the file they land in, and a deletion adds nothing', () => {
    const added = addedLines(DIFF);

    expect([...added.keys()]).toEqual(['one.md', 'two.md']);
    expect(added.get('one.md')).toBe('a line that arrives\nand another\n');
    expect(added.get('two.md')).toBe('a new file\n');
  });
});

describe('the command, on a commit message', () => {
  const dirs: string[] = [];
  const SECRET = glue('zebra', 'crossing', '42');

  const run = (message: string, list: string | null) => {
    const dir = mkdtempSync(join(tmpdir(), 'identifier-gate-'));
    dirs.push(dir);
    const messageFile = join(dir, 'COMMIT_EDITMSG');
    const listFile = join(dir, 'list.txt');
    writeFileSync(messageFile, message);
    if (list !== null) writeFileSync(listFile, list);

    try {
      execFileSync('node', [SCRIPT, '--message', messageFile], {
        encoding: 'utf8',
        env: { ...process.env, ATHAN_IDENTIFIER_DENYLIST: listFile },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      return { code: 0, output: '' };
    } catch (error) {
      const failure = error as { status?: number; stderr?: string };

      return { code: failure.status ?? 1, output: failure.stderr ?? '' };
    }
  };

  afterEach(() => {
    while (dirs.length) rmSync(dirs.pop() as string, { recursive: true, force: true });
  });

  it('passes a clean message', () => {
    expect(run('1.2.3 - fix: a clean message\n', `# a comment\n${SECRET}\n`).code).toBe(0);
  });

  it('refuses a message holding a listed string, without repeating it', () => {
    const { code, output } = run(`1.2.3 - fix: seen at ${SECRET}\n`, `# a comment\n\n${SECRET}\n`);

    expect(code).toBe(1);
    expect(output).toContain('the commit message:1  [private-list] entry 1 of the private list');
    expect(output).not.toContain(SECRET);
  });

  it('refuses a shape with no private list at all, and says the list is missing', () => {
    const { code, output } = run(`1.2.3 - fix: ran on ${glue('adb -s ', SERIAL)}\n`, null);

    expect(code).toBe(1);
    expect(output).toContain('no private list');
    expect(output).toContain('[adb-serial]');
  });

  it('ignores the comment lines git adds to a message', () => {
    expect(run(`1.2.3 - fix: clean\n# On branch ${SECRET}\n`, `${SECRET}\n`).code).toBe(0);
  });
});
