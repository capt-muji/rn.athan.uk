import { loadAdhan, params, columns, bestMargin, tzOffsetMinutes, parseHHMM } from './lib.mjs';
const A = await loadAdhan();
const LAT = 12.3714, LNG = -1.5197, TZ = 'Africa/Ouagadougou';
const OCT2021 = [['01','04:46'],['02','04:46'],['03','04:46'],['04','04:46'],['05','04:46'],['06','04:46'],['07','04:46'],['08','04:46'],['09','04:46'],['10','04:46'],['11','04:46'],['12','04:46'],['13','04:46'],['14','04:46'],['15','04:46'],['16','04:46'],['17','04:46'],['18','04:46'],['19','04:46'],['20','04:46'],['21','04:46'],['22','04:46'],['23','04:46'],['24','04:47'],['25','04:47'],['26','04:47'],['27','04:47'],['28','04:47'],['29','04:47'],['30','04:47'],['31','04:47']];
for (const angle of [17.0,17.2,17.4,17.5,17.6,17.8,18.0,18.2,18.4,18.6]) {
  const p = params(A, angle, angle);
  const mins = [], printed = [];
  for (const [dd, t] of OCT2021) {
    const c = columns(A, {lat:LAT,lng:LNG}, new Date(Date.UTC(2021,9,+dd,0)), p);
    const off = tzOffsetMinutes(TZ, new Date(Date.UTC(2021,9,+dd,12)));
    mins.push(((c.fajr/60+off)%1440+1440)%1440); printed.push(parseHHMM(t));
  }
  const r = bestMargin(mins, printed, {m0:-6, step:0.5, jMax:24});
  console.log(angle.toFixed(1), 'margin', r.margin, r.mode, 'exact', r.exact+'/31', 'w1', r.within1+'/31', 'worst', r.worst);
}
