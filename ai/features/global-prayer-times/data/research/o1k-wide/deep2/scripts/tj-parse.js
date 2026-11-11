// Tajikistan Shuroi Ulamo month endpoint -> window bounds in local minutes.
// Row cells: city | date | hijri | fajr win | dhuhr win | asr win | sunset bracket | maghrib win | isha win
const fs = require("fs");
const path = require("path");

const W = process.env.HOME + "/athan-gitree/census/o1k-wide/deep2";
const dir = `${W}/captures/tj-months`;

const rows = {};
const raw = {};

for (const f of fs.readdirSync(dir).sort()) {
  const m = /tj-ntime-(\d{4})-(\d{2})\.html$/.exec(f);
  if (!m) continue;
  const [y, mo] = [Number(m[1]), Number(m[2])];
  const html = fs.readFileSync(path.join(dir, f), "utf8");
  const trs = html.match(/<tr[\s\S]*?<\/tr>/g) || [];
  let n = 0;
  for (const tr of trs) {
    const tds = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((x) =>
      x[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim(),
    );
    if (tds.length < 9) continue;
    const dm = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(tds[1]);
    if (!dm) continue;
    const [dd, mm, yy] = [Number(dm[1]), Number(dm[2]), Number(dm[3])];
    if (yy !== y || mm !== mo) continue;
    const key = `${yy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
    const win = (s) => {
      const mm2 = /^(\d{1,2}):(\d{2}) - (\d{1,2}):(\d{2})$/.exec(s);
      return mm2 ? [Number(mm2[1]) * 60 + Number(mm2[2]), Number(mm2[3]) * 60 + Number(mm2[4])] : null;
    };
    raw[key] = {
      city: tds[0],
      hijri: tds[2],
      fajr: win(tds[3]),
      dhuhr: win(tds[4]),
      asr: win(tds[5]),
      sunset: win(tds[6]),
      maghrib: win(tds[7]),
      isha: win(tds[8]),
    };
    const r = raw[key];
    if (!r.fajr || !r.dhuhr || !r.asr || !r.maghrib || !r.isha) continue;
    rows[key] = {
      fajr: r.fajr[0], sunrise: r.fajr[1],
      dhuhr: r.dhuhr[0], asr: r.asr[0],
      sunset: r.sunset ? r.sunset[0] : null,
      sunsetEnd: r.sunset ? r.sunset[1] : null,
      maghrib: r.maghrib[0], isha: r.isha[0],
      ishaEnd: r.isha[1],
      dhuhrEnd: r.dhuhr[1], asrEnd: r.asr[1], maghribEnd: r.maghrib[1],
    };
    n++;
  }
  console.log(`${y}-${String(mo).padStart(2, "0")}: ${n} rows`);
}

fs.writeFileSync(`${W}/data/tj-window-bounds-24mo.json`, JSON.stringify(rows, null, 1));
fs.writeFileSync(`${W}/data/tj-window-raw-24mo.json`, JSON.stringify(raw, null, 1));
const keys = Object.keys(rows).sort();
console.log(`total ${keys.length} rows, ${keys[0]} .. ${keys[keys.length - 1]}`);
