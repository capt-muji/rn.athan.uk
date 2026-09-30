const fs=require('node:fs');
const d2r=Math.PI/180,r2d=180/Math.PI,norm=a=>((a%360)+360)%360;
const K={lat:21.4225241,lon:39.8261818};
const gc=(a,b)=>{const p1=a.lat*d2r,p2=b.lat*d2r,dl=(b.lon-a.lon)*d2r;
  return norm(Math.atan2(Math.sin(dl)*Math.cos(p2),Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(dl))*r2d);};
function reader(u8){let p=0;return{get end(){return p>=u8.length},
  varint(){let r=0,s=0,b;do{b=u8[p++];r+=(b&0x7f)*2**s;s+=7;}while(b>=0x80);return r;},
  key(){const k=this.varint();return{field:k>>3,wire:k&7};},
  bytes(){const l=this.varint();const b=u8.subarray(p,p+l);p+=l;return b;},
  skip(w){if(w===0)this.varint();else if(w===2)this.bytes();else if(w===5)p+=4;else if(w===1)p+=8;}};}
const utf8=u8=>new TextDecoder().decode(u8);
function geom(u8){const r=reader(u8);const c=[];while(!r.end)c.push(r.varint());
  const rings=[];let cur=[],cx=0,cy=0,i=0;
  while(i<c.length){const ci=c[i++],id=ci&7,n=ci>>3;
    if(id===1){for(let k=0;k<n;k++){if(cur.length)rings.push(cur);cur=[];
      cx+=((c[i]>>1)^(-(c[i]&1)));i++;cy+=((c[i]>>1)^(-(c[i]&1)));i++;cur.push([cx,cy]);}}
    else if(id===2){for(let k=0;k<n;k++){cx+=((c[i]>>1)^(-(c[i]&1)));i++;
      cy+=((c[i]>>1)^(-(c[i]&1)));i++;cur.push([cx,cy]);}}
    else if(id===7){if(cur.length){rings.push(cur);cur=[];}}}
  if(cur.length)rings.push(cur);return rings;}
function roadsLayer(buf){const r=reader(buf);
  while(!r.end){const{field,wire}=r.key();
    if(field===3&&wire===2){const lb=r.bytes();const lr=reader(lb);
      let name=null,keys=[],vals=[],feats=[];
      const l2=reader(lb);
      while(!l2.end){const k=l2.key();
        if(k.field===1&&k.wire===2)name=utf8(l2.bytes());
        else if(k.field===2&&k.wire===2){const fr=reader(l2.bytes());const f={tags:[],rings:[]};
          while(!fr.end){const kk=fr.key();
            if(kk.field===2&&kk.wire===2){const t=reader(fr.bytes());while(!t.end)f.tags.push(t.varint());}
            else if(kk.field===4&&kk.wire===2)f.rings=geom(fr.bytes());
            else fr.skip(kk.wire);} feats.push(f);}
        else if(k.field===3&&k.wire===2)keys.push(utf8(l2.bytes()));
        else if(k.field===4&&k.wire===2){const vb=reader(l2.bytes());let v=null;
          while(!vb.end){const kk=vb.key(); if(kk.field===1&&kk.wire===2)v=utf8(vb.bytes()); else vb.skip(kk.wire);} vals.push(v);}
        else l2.skip(k.wire);}
      if(name==='roads') return {feats,keys,vals};}
    else r.skip(wire);}}

// tile z15 x16372 y10896, extent 4096
const Z=15,X=16372,Y=10896,E=4096;
const t2ll=(px,py)=>{const n=2**Z; const lon=((X+px/E)/n)*360-180;
  const k=Math.PI*(1-2*(Y+py/E)/n); const lat=r2d*Math.atan(Math.sinh(k)); return {lat,lon};};

const raw=fs.readFileSync('/tmp/london.mvt');
const L=roadsLayer(new Uint8Array(raw.buffer,raw.byteOffset,raw.byteLength));
const qibla=gc(t2ll(E/2,E/2),K);
console.log('=== STREET BEARINGS, computed from the tile we already decoded ===');
console.log('qibla here:',qibla.toFixed(1),'degrees from true north\n');
console.log('Street                       runs at      qibla is');
const out=[];
for(const f of L.feats){
  let nm=null; for(let i=0;i<f.tags.length;i+=2) if(L.keys[f.tags[i]]==='name') nm=L.vals[f.tags[i+1]];
  if(!nm||!f.rings.length) continue;
  const g=f.rings[0]; if(g.length<2) continue;
  const a=t2ll(g[0][0],g[0][1]), b=t2ll(g[g.length-1][0],g[g.length-1][1]);
  const p1=a.lat*d2r,p2=b.lat*d2r,dl=(b.lon-a.lon)*d2r;
  const brg=norm(Math.atan2(Math.sin(dl)*Math.cos(p2),Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(dl))*r2d);
  let d=norm(qibla-brg); const side=d<=180?'right':'left'; if(d>180)d=360-d;
  if(d<2||d>178) continue;
  out.push({nm,brg,d,side});
}
const seen=new Set();
for(const r of out){ if(seen.has(r.nm))continue; seen.add(r.nm);
  if(seen.size>12) break;
  console.log(`${r.nm.padEnd(28)} ${r.brg.toFixed(0).padStart(3)}deg      ${r.d.toFixed(0).padStart(3)}deg to the ${r.side}`);
}
console.log('\n=== THE POINT ===');
console.log('Every line above needs ZERO sensors. A street bearing is a fact of the');
console.log('ground held in the tile. The qibla is arithmetic. The difference is');
console.log('arithmetic. The user looks at a street they can SEE.');
