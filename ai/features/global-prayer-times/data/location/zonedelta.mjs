// The cost of picking the WRONG JAKIM zone, measured on JAKIM's own published times.
const ZONES = ['PRK01','PRK02','PRK05','PRK06','PRK07','SGR01','SGR02','SGR03','WLY01','WLY02',
  'PHG02','PHG05','PHG06','KTN01','KTN02','JHR02','JHR03','JHR04','SBH01','SBH07','SWK01','SWK08',
  'TRG01','TRG04','KDH01','KDH06','KDH07','PNG01','MLK01','PLS01','NGS01','NGS03'];
const KEYS = ['imsak','fajr','syuruk','dhuhr','asr','maghrib','isha'];
const data = {};
for (const z of ZONES) {
  const r = await fetch(`https://api.waktusolat.app/v2/solat/${z}?year=2026&month=9`);
  const j = await r.json();
  if (!j.prayers) { console.error('no data', z, JSON.stringify(j).slice(0,100)); continue; }
  data[z] = j.prayers;
}
console.log('zones fetched', Object.keys(data).length, 'days', data[ZONES[0]].length);
function delta(a, b) {
  const out = {};
  for (const k of KEYS) out[k] = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    for (const k of KEYS) {
      if (a[i][k] == null || b[i][k] == null) continue;
      const d = Math.abs(Math.round((a[i][k] - b[i][k]) / 60));
      if (d > out[k]) out[k] = d;
    }
  }
  return out;
}
const PAIRS = [
  ['PRK01','PRK02','Tanjung Malim vs Ipoh, the pair the GPS lookup confuses'],
  ['PRK02','PRK06','Ipoh vs Taiping'],
  ['PRK02','PRK07','Ipoh vs Bukit Larut, the high-ground zone'],
  ['PRK02','PRK05','Ipoh vs the coastal zone'],
  ['SGR01','SGR03','Shah Alam vs Klang, 30 km apart'],
  ['SGR01','SGR02','Shah Alam vs Sabak Bernam'],
  ['SGR01','WLY01','Selangor vs Kuala Lumpur, adjacent'],
  ['PHG02','PHG06','Kuantan vs Cameron Highlands, the elevation zone'],
  ['PHG05','PHG06','Genting Sempah vs Genting Highlands'],
  ['KTN01','KTN02','Kota Bharu vs Gua Musang'],
  ['JHR02','JHR03','Johor Bahru vs Kluang'],
  ['JHR03','JHR04','Kluang vs Batu Pahat'],
  ['SBH01','SBH07','Sandakan vs Kota Kinabalu'],
  ['SWK01','SWK08','Limbang vs Kuching'],
  ['TRG01','TRG04','Kuala Terengganu vs Dungun'],
  ['KDH01','KDH07','Kota Setar vs Gunung Jerai, the high-ground zone'],
  ['WLY01','WLY02','Kuala Lumpur vs Labuan, same zone code family, 1500 km apart'],
  ['PNG01','KDH06','Penang vs Langkawi'],
  ['NGS01','NGS03','Tampin vs Seremban'],
];
const rows = [];
for (const [a,b,note] of PAIRS) {
  if (!data[a] || !data[b]) continue;
  const d = delta(data[a], data[b]);
  rows.push([a+' vs '+b, ...KEYS.map(k=>String(d[k])), note]);
}
const hdr = ['pair', ...KEYS, 'note'];
const all=[hdr,...rows];
const w=hdr.map((_,i)=>Math.max(...all.map(r=>String(r[i]).length)));
const L=r=>'| '+r.map((c,i)=>String(c).padEnd(w[i])).join(' | ')+' |';
console.log(L(hdr));
console.log('| '+w.map(n=>'-'.repeat(n)).join(' | ')+' |');
for (const r of rows) console.log(L(r));
// all-pairs max within a state
console.log('\nWorst single-field gap over ALL pairs in this sample:');
let worst=0, who='';
const zs=Object.keys(data);
for (let i=0;i<zs.length;i++) for (let j=i+1;j<zs.length;j++){
  const d=delta(data[zs[i]],data[zs[j]]);
  for (const k of KEYS) if (d[k]>worst){worst=d[k];who=`${zs[i]} vs ${zs[j]} on ${k}`;}
}
console.log(worst, 'min,', who);
