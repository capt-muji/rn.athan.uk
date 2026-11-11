import fs from 'node:fs';
const raw = JSON.parse(fs.readFileSync('data/admin-districts-template.json','utf8'));
const out = {};
for (const [prov, names] of Object.entries(raw)) {
  out[prov] = names
    .filter(n => !n.startsWith(prov + ' (il)'))
    .map(n => n.replace(new RegExp(`,\\s*${prov}$`), '').trim())
    .filter(n => n && n !== 'Avrupa Yakası' && n !== 'Anadolu Yakası');
}
fs.writeFileSync('data/admin-districts.json', JSON.stringify(out, null, 1));
for (const [p, n] of Object.entries(out)) console.log(p, n.length);
