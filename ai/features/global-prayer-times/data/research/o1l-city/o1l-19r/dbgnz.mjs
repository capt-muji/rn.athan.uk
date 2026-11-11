import { PrayerTimes, Coordinates, CalculationMethod, Rounding } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js'
const zone='Pacific/Auckland'
const offMin=(iso)=>{const [y,m,dd]=iso.split('-').map(Number);const dt=new Date(Date.UTC(y,m-1,dd,4,0,0));
const dtf=new Intl.DateTimeFormat('en-US',{timeZone:zone,hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
const p=Object.fromEntries(dtf.formatToParts(dt).map(x=>[x.type,x.value]));return Math.round((Date.UTC(+p.year,+p.month-1,+p.day,+p.hour%24,+p.minute)-dt.getTime())/60000)}
console.log('off 2006-09-25',offMin('2006-09-25'),'off 2006-10-10',offMin('2006-10-10'))
const p=CalculationMethod.Other();p.fajrAngle=18;p.ishaAngle=18;p.rounding=Rounding.None
const [y,m,dd]=[2006,9,25]
const off=offMin('2006-09-25')
const pt=new PrayerTimes(new Coordinates(-36.8485,174.7633),new Date(Date.UTC(y,m-1,dd,12,0,0)-off*60000),p)
const f=t=>(t.getTime()-Date.UTC(y,m-1,dd,0,0,0))/60000
console.log('utc minutes', ['fajr','sunrise','dhuhr','asr','maghrib','isha'].map(k=>k+'='+f(pt[k]).toFixed(1)).join(' '))
console.log('local', ['fajr','sunrise','dhuhr','asr','maghrib','isha'].map(k=>k+'='+((f(pt[k])+off)/60).toFixed(2)).join(' '))
console.log('printed akl 25 Sep: 4:40 6:07 12:13 3:41 6:24 7:46')
