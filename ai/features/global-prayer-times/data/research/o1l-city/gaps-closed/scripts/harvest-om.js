// Oman MARA calendar_page2.asp — six second cities across the full 2021-2031 span,
// plus Muscat's missing tail. Raw HTML per month, parsed rows per city-year.
// Parse rule (deep2): fajr/sunrise print 24h; asr/maghrib/isha print 12h with no meridiem,
// so hour < 12 gains 12; dhuhr prints 24h and never gains 12 (11:59 is a real dhuhr).
const fs = require("fs");
const { execFileSync } = require("child_process");
const O = process.env.HOME + "/athan-gitree/census/o1l-city/gaps-closed";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

const CITIES = [
  { name: "salalah", id: 55 },
  { name: "sohar", id: 51 },
  { name: "nizwa", id: 78 },
  { name: "sur", id: 56 },
  { name: "ibri", id: 60 },
  { name: "buraimi", id: 5 },
  { name: "muscat", id: 0 },
];
const HELD = { salalah: [2026, 2031], sohar: [2026, 2031], nizwa: [2026, 2031], sur: [2026, 2031], ibri: [2026, 2031], buraimi: [2026, 2031], muscat: [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028] };
const YEARS = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031];

function pad(n) { return String(n).padStart(2, "0"); }
function toMin(hhmm) { return Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5)); }

function parse(body) {
  const rows = {};
  const re = /<td\s+align='center'><font color='#000000'>(\d+)\/(\d+)\/(\d+)<\/font><\/td><td align='center'><font color='#000000'>([\d:]+)<\/font><\/td><td align='center'><font color='#000000'>([\d:]+)<\/font><\/td><td\s+align='center'><font color='#000000'>([\d:]+)<\/font><\/td><td\s+align='center'><font color='#000000'>([\d:]+)<\/font><\/td><td\s+align='center'><font color='#000000'>([\d:]+)<\/font><\/td><td\s+align='center'><font color='#000000'>([\d:]+)<\/font><\/td>/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const [, d, mo, y, fa, sr, dh, as, mg, is] = m;
    const key = `${y}-${pad(mo)}-${pad(d)}`;
    const plus12 = (t) => (Number(t.slice(0, 2)) < 12 ? toMin(`${pad(Number(t.slice(0, 2)) + 12)}${t.slice(2)}`) : toMin(t));
    rows[key] = { fajr: toMin(fa), sunrise: toMin(sr), dhuhr: toMin(dh), asr: plus12(as), maghrib: plus12(mg), isha: plus12(is) };
  }
  return rows;
}

const logFd = fs.openSync(`${O}/logs/om-harvest.log`, "a");
const log = (s) => fs.writeSync(logFd, s + "\n");
let ok = 0, fail = 0;

for (const city of CITIES) {
  for (const year of YEARS) {
    if ((HELD[city.name] || []).includes(year)) continue;
    const out = {};
    for (let month = 1; month <= 12; month++) {
      const cap = `${O}/captures/om-${city.name}-${year}-${pad(month)}.html`;
      let body = null;
      for (let a = 0; a < 3 && body === null; a++) {
        try {
          body = execFileSync("curl", ["-sS", "-A", UA, "--max-time", "60",
            `https://www.mara.gov.om/calendar_page2.asp?year=${year}&month=${month}&CityID=${city.id}`],
            { encoding: "utf8", timeout: 65000, maxBuffer: 32 * 1024 * 1024 });
        } catch (e) { body = null; }
        if (body === null) sleep(2000);
      }
      if (body === null || body.length < 2000) { fail++; log(`FAIL ${city.name} ${year}-${pad(month)}`); continue; }
      fs.writeFileSync(cap, body);
      const rows = parse(body);
      const want = new Date(year, month, 0).getDate();
      if (Object.keys(rows).length < want - 2) { fail++; log(`SHORT ${city.name} ${year}-${pad(month)} ${Object.keys(rows).length}/${want}`); }
      Object.assign(out, rows);
      ok++;
      sleep(350);
    }
    fs.writeFileSync(`${O}/data/om-${city.name}-${year}.json`, JSON.stringify(out));
    log(`${city.name} ${year}: ${Object.keys(out).length} rows`);
  }
}
log(`DONE om: months ok ${ok} fail ${fail}`);
console.log(`DONE ok ${ok} fail ${fail}`);
