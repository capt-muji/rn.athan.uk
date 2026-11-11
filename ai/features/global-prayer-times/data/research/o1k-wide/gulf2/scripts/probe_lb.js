const adhan=require('/tmp/opensrc/repos/github.com/batoulapps/adhan-js/4.4.6/lib/cjs/Adhan.js');
const c=new adhan.Coordinates(33.8938,35.5018);
const fmt=new Intl.DateTimeFormat('en-GB',{timeZone:'Etc/GMT-2',hour12:false,hour:'2-digit',minute:'2-digit'});
const show=(y,m,d)=>{const p=new adhan.CalculationParameters('Other',18,18);
 const t=new adhan.PrayerTimes(c,new Date(Date.UTC(y,m-1,d,12)),p);
 return ['fajr','sunrise','dhuhr','asr','maghrib','isha'].map(k=>fmt.format(t[k])).join(' ');};
for (const [y,m,d] of [[2028,1,1],[2027,1,1],[2026,1,1],[2028,2,29],[2028,3,1],[2027,2,28],[2027,3,1],[2028,7,1],[2027,7,1]]) console.log(y,m,d,show(y,m,d));
