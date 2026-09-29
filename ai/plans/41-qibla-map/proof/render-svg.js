const {decodeTile}=require('/tmp/mvt.js');
const fs=require('fs');
const d2r=Math.PI/180,r2d=180/Math.PI,norm=a=>((a%360)+360)%360;
const K={lat:21.4225241,lon:39.8261818};
const gc=(a,b)=>{const p1=a.lat*d2r,p2=b.lat*d2r,dl=(b.lon-a.lon)*d2r;
  return norm(Math.atan2(Math.sin(dl)*Math.cos(p2),Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(dl))*r2d);};

const lat=51.5074,lon=-0.1278,z=15,x=16372,y=10896;
const layers=decodeTile(fs.readFileSync('/tmp/london.mvt'));

// MVT geometry decode for one layer -> SVG paths in tile space
function reader(buf){let p=0;return{get end(){return p>=buf.length},
  varint(){let r=0,s=0,b;do{b=buf[p++];r+=(b&0x7f)*2**s;s+=7;}while(b>=0x80);return r;},
  key(){const k=this.varint();return{field:k>>3,wire:k&7};},
  bytes(){const l=this.varint();const b=buf.slice(p,p+l);p+=l;return b;},
  skip(w){if(w===0)this.varint();else if(w===2)this.bytes();else if(w===5)p+=4;else if(w===1)p+=8;}};}
function geom(buf){const r=reader(buf);const cmds=[];while(!r.end)cmds.push(r.varint());
  const rings=[];let cur=[],cx=0,cy=0,i=0;
  while(i<cmds.length){const ci=cmds[i++],id=ci&7,cnt=ci>>3;
    if(id===1){for(let k=0;k<cnt;k++){if(cur.length)rings.push(cur);cur=[];
      cx+=((cmds[i]>>1)^(-(cmds[i]&1)));i++;cy+=((cmds[i]>>1)^(-(cmds[i]&1)));i++;cur.push([cx,cy]);}}
    else if(id===2){for(let k=0;k<cnt;k++){cx+=((cmds[i]>>1)^(-(cmds[i]&1)));i++;
      cy+=((cmds[i]>>1)^(-(cmds[i]&1)));i++;cur.push([cx,cy]);}}
    else if(id===7){if(cur.length){cur.push(cur[0]);rings.push(cur);cur=[];}}}
  if(cur.length)rings.push(cur); return rings;}
function rawFeatures(layerBuf){const r=reader(layerBuf);const out=[];
  while(!r.end){const{field,wire}=r.key();
    if(field===2&&wire===2){const fb=r.bytes();const fr=reader(fb);const f={rings:[],type:0};
      while(!fr.end){const k=fr.key();
        if(k.field===3)f.type=fr.varint();
        else if(k.field===4&&k.wire===2)f.rings=geom(fr.bytes());
        else fr.skip(k.wire);} out.push(f);}
    else r.skip(wire);} return out;}

// re-decode raw layer buffers
function tileLayerBufs(buf){const r=reader(buf);const o=[];
  while(!r.end){const{field,wire}=r.key();
    if(field===3&&wire===2){const lb=r.bytes();
      const lr=reader(lb);let name=null;
      while(!lr.end){const k=lr.key(); if(k.field===1&&k.wire===2){name=lr.bytes().toString();break;} lr.skip(k.wire);}
      o.push({name,buf:lb});} else r.skip(wire);} return o;}

const bufs=tileLayerBufs(fs.readFileSync('/tmp/london.mvt'));
const E=4096, SIZE=800;
const sc=v=>v/E*SIZE;
let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
<rect width="${SIZE}" height="${SIZE}" fill="#2c1c77"/>`;
for(const {name,buf} of bufs){
  if(!['earth','water','landuse','buildings','roads'].includes(name)) continue;
  const style={earth:'fill="#3a2a8a" stroke="none"',water:'fill="#1a1050" stroke="none"',
    landuse:'fill="#33237e" stroke="none"',buildings:'fill="rgba(255,255,255,0.20)" stroke="none"',
    roads:'fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="2"'}[name];
  for(const f of rawFeatures(buf)){
    for(const ring of f.rings){
      if(ring.length<2) continue;
      const d=ring.map((pt,i)=>`${i?'L':'M'}${sc(pt[0]).toFixed(1)} ${sc(pt[1]).toFixed(1)}`).join(' ');
      svg+=`<path d="${d}${f.type===3?' Z':''}" ${style}/>`;
    }
  }
}
// THE QIBLA RAY: great-circle initial bearing, drawn from tile centre
const b=gc({lat,lon},K);
const cx=SIZE/2, cy=SIZE/2, len=SIZE*0.46;
const ex=cx+Math.sin(b*d2r)*len, ey=cy-Math.cos(b*d2r)*len;
svg+=`<line x1="${cx}" y1="${cy}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="#fbbf24" stroke-width="5" stroke-linecap="round"/>`;
svg+=`<circle cx="${cx}" cy="${cy}" r="9" fill="#fbbf24" stroke="#2c1c77" stroke-width="3"/>`;
svg+=`<text x="${(ex+ (ex>cx?-70:10)).toFixed(0)}" y="${(ey+20).toFixed(0)}" fill="#fbbf24" font-family="sans-serif" font-size="22" font-weight="bold">Qibla ${b.toFixed(0)}°</text>`;
svg+=`<text x="12" y="30" fill="#fff" font-family="sans-serif" font-size="16">London z15 offline tile, ${bufs.length} layers, qibla ray at great-circle bearing</text>`;
svg+='</svg>';
fs.writeFileSync('/tmp/qibla-london.svg',svg);
console.log('WROTE /tmp/qibla-london.svg');
console.log('qibla bearing from tile centre:',b.toFixed(3));
console.log('svg bytes:',svg.length);
