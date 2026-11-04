#!/usr/bin/env node
// The T-623 gallery builder: turns the fasting-layouts variant catalog plus the
// screenshot pass's PNG directory into one browsable, dark, dependency-free
// gallery page OUTSIDE the repository (the device step passes ~/athan-fasting-layouts/
// as outDir; production reads devlayouts/catalog.json but any catalog path works).
//
// Order matters: every expected screenshot is verified present before anything is
// written, the page then references each copy through a relative images/ path, and
// every copied image is re-statted after the write so a landed gallery always
// references files that exist. Deterministic: catalog order, no timestamps.
//
//   node scripts/fasting-layouts-gallery.mjs <catalogPath> <shotsDir> <outDir>
import fs from 'node:fs';
import path from 'node:path';

const [catalogPath, shotsDir, outDir] = process.argv.slice(2);
if (!catalogPath || !shotsDir || !outDir) {
  process.stderr.write('usage: node scripts/fasting-layouts-gallery.mjs <catalogPath> <shotsDir> <outDir>\n');
  process.exit(2);
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
const escapeHtml = (value) => value.replace(/[&<>"']/g, (ch) => ESCAPES[ch]);

let catalog;
try {
  catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
} catch (error) {
  process.stderr.write(`gallery: cannot read catalog ${catalogPath}: ${error.message}\n`);
  process.exit(2);
}
if (!Array.isArray(catalog)) {
  process.stderr.write(`gallery: ${catalogPath} must hold an array of rows\n`);
  process.exit(2);
}
for (const row of catalog) {
  if (typeof row.index !== 'number' || typeof row.id !== 'string' || row.id === '') {
    process.stderr.write(`gallery: every row needs a numeric index and a non-empty id, got ${JSON.stringify(row)}\n`);
    process.exit(2);
  }
}

const shotName = (row) => `variant-${String(row.index).padStart(2, '0')}-${row.id}.png`;

const missing = catalog.map(shotName).filter((name) => !fs.existsSync(path.join(shotsDir, name)));
if (missing.length > 0) {
  process.stderr.write(`gallery: ${missing.length} screenshot(s) missing from ${shotsDir}:\n`);
  for (const name of missing) process.stderr.write(`  ${name}\n`);
  process.exit(1);
}

fs.mkdirSync(path.join(outDir, 'images'), { recursive: true });
for (const row of catalog) {
  fs.copyFileSync(path.join(shotsDir, shotName(row)), path.join(outDir, 'images', shotName(row)));
}

const cards = catalog
  .map((row) => {
    const label = `#${row.index} ${escapeHtml(row.name ?? row.id)}`;
    const chip = row.hidesExplanations === true ? '<span class="chip">hints hidden</span>' : '';
    return [
      '    <figure class="card">',
      `      <img loading="lazy" src="images/${escapeHtml(shotName(row))}" alt="${label}">`,
      '      <figcaption>',
      `        <h2>${label}</h2>`,
      `        <p class="archetype">${escapeHtml(row.archetype ?? '')}</p>`,
      chip,
      '      </figcaption>',
      '    </figure>',
    ]
      .filter(Boolean)
      .join('\n');
  })
  .join('\n');

const html = [
  '<!doctype html>',
  '<html lang="en">',
  '<head>',
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1">',
  '<title>Fasting layout variants</title>',
  '<style>',
  'body { margin: 0 auto; padding: 24px; max-width: 1200px; background: #101014; color: #e8e8ee; font-family: system-ui, sans-serif; }',
  'h1 { font-size: 20px; }',
  '.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }',
  '.card { margin: 0; background: #1a1a22; border: 1px solid #2a2a34; border-radius: 12px; overflow: hidden; }',
  '.card img { display: block; width: 100%; height: auto; }',
  'figcaption { padding: 12px 14px; }',
  'h2 { margin: 0 0 4px; font-size: 15px; }',
  '.archetype { margin: 0 0 8px; color: #9a9aa8; font-size: 13px; }',
  '.chip { display: inline-block; padding: 2px 8px; border-radius: 999px; background: #262636; color: #b8b8ff; font-size: 12px; }',
  '</style>',
  '</head>',
  '<body>',
  '<h1>Fasting layout variants</h1>',
  '<main class="grid">',
  cards,
  '</main>',
  '</body>',
  '</html>',
].join('\n');
fs.writeFileSync(path.join(outDir, 'index.html'), html);

const lost = catalog.map(shotName).filter((name) => !fs.existsSync(path.join(outDir, 'images', name)));
if (lost.length > 0) {
  process.stderr.write('gallery: copied image(s) missing after write:\n');
  for (const name of lost) process.stderr.write(`  ${name}\n`);
  process.exit(1);
}
process.stdout.write(`gallery: ${catalog.length} variant(s) at ${outDir}\n`);
