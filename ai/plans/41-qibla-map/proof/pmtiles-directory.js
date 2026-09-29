const zlib=require('zlib');
// PMTiles v3: varint-encoded directory entries
function readVarint(b,p){let r=0,s=0,by;do{by=b[p.i++];r+=(by&0x7f)*2**s;s+=7;}while(by>=0x80);return r;}
function deserializeDir(buf){
  const p={i:0}; const n=readVarint(buf,p); const e=[];
  let last=0; for(let i=0;i<n;i++){const v=readVarint(buf,p); last+=v; e.push({tileId:last,offset:0,length:0,runLength:0});}
  for(let i=0;i<n;i++) e[i].runLength=readVarint(buf,p);
  for(let i=0;i<n;i++) e[i].length=readVarint(buf,p);
  for(let i=0;i<n;i++){const v=readVarint(buf,p);
    e[i].offset = v===0 && i>0 ? e[i-1].offset+e[i-1].length : v-1;}
  return e;
}
// ZXY -> Hilbert tileId
function zxyToTileId(z,x,y){
  let acc=0; for(let t=0;t<z;t++) acc += 4**t;
  const n=2**z; let rx,ry,d=0,tx=x,ty=y;
  for(let s=n/2;s>0;s=s/2){
    rx=(tx&s)>0?1:0; ry=(ty&s)>0?1:0;
    d+=s*s*((3*rx)^ry);
    // rotate
    if(ry===0){ if(rx===1){tx=s-1-tx; ty=s-1-ty;} const t=tx; tx=ty; ty=t;}
  }
  return acc+d;
}
function findEntry(entries,tileId){
  let lo=0,hi=entries.length-1,res=null;
  while(lo<=hi){const m=(lo+hi)>>1;
    if(entries[m].tileId<=tileId){res=entries[m];lo=m+1;} else hi=m-1;}
  if(res && (res.runLength===0 || tileId < res.tileId+res.runLength)) return res;
  return null;
}
module.exports={deserializeDir,zxyToTileId,findEntry};
