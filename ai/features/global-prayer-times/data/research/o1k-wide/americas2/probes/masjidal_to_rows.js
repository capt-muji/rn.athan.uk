// Convert a Masjidal year capture into the brief's dated-row shape {date: [fajr,sunrise,dhuhr,asr,maghrib,isha]}.
// node masjidal_to_rows.js <id> <out.json>
const fs = require('fs');
const [id, out] = process.argv.slice(2);
const rows = JSON.parse(fs.readFileSync(`captures/masjidal_${id}_2026.json`)).data.salah;
const to24 = s => {
  const m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(s);
  let h = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) h += 12;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
};
const data = {};
for (const r of rows) {
  const d = new Date(r.date.replace(/^[A-Za-z]+,\s*/, ''));
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  data[key] = [to24(r.fajr), to24(r.sunrise), to24(r.zuhr), to24(r.asr), to24(r.maghrib), to24(r.isha)];
}
fs.writeFileSync(out, JSON.stringify(data, null, 1));
console.log(out, Object.keys(data).length, 'rows', Object.keys(data)[0], '->', Object.keys(data).pop());
