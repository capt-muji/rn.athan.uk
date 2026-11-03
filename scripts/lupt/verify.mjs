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
const years = Object.keys(manifest).map(Number).sort((a, b) => a - b);
if (years.length !== 50) {
  console.error(`VERIFY FAIL: manifest holds ${years.length} years, expected 50`);
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

for (const line of changed) console.log(`CHANGED ${line}`);
for (const line of errored) console.log(`ERROR ${line}`);

if (changed.length > 0) {
  console.error(`VERIFY FAIL: ${changed.length} workbook(s) changed; regenerate the artifact and bump the version`);
  process.exit(1);
}
if (errored.length > 0) {
  console.error(`VERIFY FAIL: ${errored.length} year(s) could not be checked; re-run before releasing`);
  process.exit(1);
}
console.log(`VERIFY OK: ${years.length} etags unchanged, ${years[0]}-${years.at(-1)}`);
