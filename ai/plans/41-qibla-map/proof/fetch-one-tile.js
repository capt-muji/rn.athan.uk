const {deserializeDir,zxyToTileId,findEntry}=require('/tmp/dir.js');
const zlib=require('zlib'),https=require('https');
const U='https://build.protomaps.com/20260928.pmtiles';
const HDR={root:{off:127,len:15558},leafOff:138063528287,tileOff:16384};
function range(start,len){return new Promise((res,rej)=>{
  https.get(U,{headers:{Range:`bytes=${start}-${start+len-1}`}},r=>{
    const c=[];r.on('data',d=>c.push(d));r.on('end',()=>res(Buffer.concat(c)));}).on('error',rej);});}
(async()=>{
  const lat=51.5074, lon=-0.1278, z=15;
  const n=2**z, x=Math.floor((lon+180)/360*n);
  const lr=lat*Math.PI/180;
  const y=Math.floor((1-Math.log(Math.tan(lr)+1/Math.cos(lr))/Math.PI)/2*n);
  const tid=zxyToTileId(z,x,y);
  console.log(`London z${z} x${x} y${y}  tileId ${tid}`);
  const root=deserializeDir(zlib.gunzipSync(await range(HDR.root.off,HDR.root.len)));
  console.log('root entries:',root.length);
  let e=findEntry(root,tid);
  console.log('root hit:',JSON.stringify(e));
  // runLength 0 means it points at a LEAF directory
  if(e && e.runLength===0){
    const leaf=deserializeDir(zlib.gunzipSync(await range(HDR.leafOff+e.offset,e.length)));
    console.log('leaf entries:',leaf.length);
    e=findEntry(leaf,tid);
    console.log('leaf hit:',JSON.stringify(e));
  }
  if(!e){console.log('NO TILE');return;}
  const raw=await range(HDR.tileOff+e.offset,e.length);
  const mvt=zlib.gunzipSync(raw);
  console.log(`\nTILE FETCHED: ${raw.length} bytes gzipped, ${mvt.length} bytes MVT`);
  require('fs').writeFileSync('/tmp/london.mvt',mvt);
})();
