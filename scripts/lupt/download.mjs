// Downloads the LUPT workbooks into the gitignored .cache/lupt/ and records each
// year's etag and byte size in etag-manifest.json. The manifest is committed: a
// changed etag at release time must fail verify and force regeneration, because
// the publisher regenerates workbooks without a changelog (T-595, Q7 ruling).
import fs from 'node:fs';
import path from 'node:path';

const YEARS = Array.from({ length: 50 }, (_, i) => 2027 + i);
const URL = (year) => `https://londonsalahtimes.com/downloads/LUPT-${year}.xlsx`;
const ROOT = path.resolve(import.meta.dirname, '../..');
const CACHE = path.join(ROOT, '.cache/lupt');
const MANIFEST = path.join(import.meta.dirname, 'etag-manifest.json');

// Out-of-range URLs on this host 301-loop to themselves (T-595 intake), so the
// redirect count is capped manually: a loop dies here instead of spinning.
const MAX_REDIRECTS = 3;

const fetchCapped = async (url) => {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const response = await fetch(current, { redirect: 'manual' });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) throw new Error(`${current}: redirect without location`);
      current = new URL(location, current).toString();
      continue;
    }
    return response;
  }
  throw new Error(`${url}: more than ${MAX_REDIRECTS} redirects`);
};

const main = async () => {
  fs.mkdirSync(CACHE, { recursive: true });
  const manifest = {};
  let total = 0;

  for (const year of YEARS) {
    const file = path.join(CACHE, `LUPT-${year}.xlsx`);
    if (fs.existsSync(file)) {
      const { etag } = JSON.parse(fs.readFileSync(`${file}.meta.json`, 'utf8'));
      const size = fs.statSync(file).size;
      manifest[String(year)] = { etag, size };
      total += size;
      console.log(`${year}: cached ${size} bytes etag ${etag}`);
      continue;
    }

    const response = await fetchCapped(URL(year));
    if (!response.ok) throw new Error(`${year}: HTTP ${response.status}`);

    const bytes = Buffer.from(await response.arrayBuffer());
    const etag = response.headers.get('etag');

    // An xlsx is a zip: the local file header of the first entry starts with PK\x03\x04
    if (bytes.subarray(0, 4).toString('hex') !== '504b0304') {
      throw new Error(`${year}: not an xlsx (${bytes.length} bytes, starts ${bytes.subarray(0, 8).toString('hex')})`);
    }

    fs.writeFileSync(file, bytes);
    fs.writeFileSync(`${file}.meta.json`, JSON.stringify({ etag, url: URL(year) }, null, 2));
    manifest[String(year)] = { etag, size: bytes.length };
    total += bytes.length;
    console.log(`${year}: downloaded ${bytes.length} bytes etag ${etag}`);
  }

  fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  const sizes = Object.values(manifest).map((entry) => entry.size);
  console.log(`${YEARS.length} files, ${total} bytes total, min ${Math.min(...sizes)}, max ${Math.max(...sizes)}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
