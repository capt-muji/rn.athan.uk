const {decodeTile}=require('/tmp/mvt.js');
const fs=require('fs');
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
function layerFeatures(lb){const r=reader(lb);const out=[];let name=null,keys=[],vals=[];
  while(!r.end){const{field,wire}=r.key();
    if(field===1&&wire===2)name=r.bytes().toString();
    else if(field===2&&wire===2){const fb=r.bytes();const fr=reader(fb);const f={rings:[],type:0,tags:[]};
      while(!fr.end){const k=fr.key();
        if(k.field===2&&k.wire===2){const tb=reader(fr.bytes());while(!tb.end)f.tags.push(tb.varint());}
        else if(k.field===3)f.type=fr.varint();
        else if(k.field===4&&k.wire===2)f.rings=geom(fr.bytes());
        else fr.skip(k.wire);} out.push(f);}
    else if(field===3&&wire===2)keys.push(r.bytes().toString());
    else if(field===4&&wire===2){const vb=reader(r.bytes());let v=null;
      while(!vb.end){const k=vb.key(); if(k.field===1&&k.wire===2)v=vb.bytes().toString(); else vb.skip(k.wire);} vals.push(v);}
    else r.skip(wire);} return {name,features:out,keys,vals};}
function tileLayers(buf){const r=reader(buf);const o=[];
  while(!r.end){const{field,wire}=r.key();
    if(field===3&&wire===2)o.push(layerFeatures(r.bytes())); else r.skip(wire);} return o;}

const layers=tileLayers(fs.readFileSync('/tmp/london.mvt'));
const E=4096, C=E/2;
console.log("=== FEATURES WITHIN A RADIUS OF THE CENTRE (tile units, 4096 = 761 m) ===\n");
console.log("Radius      metres   roads  buildings  water  TOTAL paths");
for(const frac of [0.08,0.15,0.25,0.4,0.5]){
  const R=E*frac, m=Math.round(761*frac*2);
  const near={};
  for(const L of layers){
    if(!['roads','buildings','water'].includes(L.name)) continue;
    let n=0;
    for(const f of L.features){
      let hit=false;
      for(const ring of f.rings){ for(const [x,y] of ring){
        if(Math.abs(x-C)<R && Math.abs(y-C)<R){hit=true;break;} } if(hit)break; }
      if(hit)n++;
    }
    near[L.name]=n;
  }
  const tot=(near.roads||0)+(near.buildings||0)+(near.water||0);
  console.log(`${(frac*2).toFixed(2)} of tile  ${String(m).padStart(4)} m   ${String(near.roads||0).padStart(5)}  ${String(near.buildings||0).padStart(9)}  ${String(near.water||0).padStart(5)}  ${String(tot).padStart(6)}`);
}
