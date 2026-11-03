// Release-time etag verification (T-595 ruling Q7): the publisher regenerates workbooks without a
// changelog, so every app release re-checks each year's etag against the committed manifest. A
// changed etag fails this script and names the years, forcing regeneration plus a version bump.
//
//   node scripts/lupt/verify.mjs
import fs from 'node:fs';
import path from 'node:path';

const MANIFEST = path.join(import.meta.dirname, 'etag-manifest.json');
const URL_OF = (year) => `https://londonsalahtimes.com/downloads/LUPT-${year}.xlsx`;

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const years = Object.keys(manifest)
  .map(Number)
  .sort((a, b) => a - b);
if (years.length !== 50) {
  process.stderr.write(`etag manifest holds ${years.length} years, expected 50\n`);
  process.exit(1);
}

const changed = [];
const errored = [];
for (const year of years) {
  const expected = manifest[String(year)].etag;
  try {
    const response = await fetch(URL_OF(year), { headers: { 'If-None-Match': expected }, redirect: 'follow' });
    if (response.status === 304) continue;
    if (response.status !== 200) {
      errored.push(`${year}: HTTP ${response.status}`);
      continue;
    }
    const etag = response.headers.get('etag');
    if (etag !== expected) changed.push(`${year}: ${expected} -> ${etag}`);
  } catch (error) {
    errored.push(`${year}: ${error}`);
  }
}

for (const line of changed) process.stderr.write(`CHANGED etag ${line}\n`);
for (const line of errored) process.stderr.write(`ERROR ${line}\n`);
if (changed.length > 0 || errored.length > 0) {
  process.exit(1);
}
process.stdout.write(`verify.mjs: all ${years.length} workbook etags unchanged\n`);
