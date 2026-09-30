const fs=require('node:fs');
// The previous run measured decode TRANSIENTS, not retained size. Measure what is HELD.
const src=fs.readFileSync('/tmp/mem.js','utf8');
eval(src.split("const raw=fs.readFileSync")[0]); // reuse decode()
const raw=fs.readFileSync('/tmp/london.mvt');
const u8=new Uint8Array(raw.buffer,raw.byteOffset,raw.byteLength);

function retained(rad,n){
  global.gc();global.gc();
  const before=process.memoryUsage().heapUsed;
  const held=[];
  for(let i=0;i<n;i++) held.push(decode(u8,rad));
  global.gc();global.gc();               // collect decode garbage, keep `held`
  const after=process.memoryUsage().heapUsed;
  let paths=0,coords=0;
  for(const L of held[0]){paths+=L.feats.length; for(const f of L.feats) for(const g of f.rings) coords+=g.length;}
  return {paths,coords,bytes:after-before};
}
console.log('=== RETAINED memory after GC, which is the real number ===\n');
console.log('Radius       paths   coords   retained x9   per tile');
for(const [label,rad] of [['122 m',327],['228 m',614],['381 m',1024],['whole tile',2048]]){
  const r=retained(rad,9);
  console.log(`${label.padEnd(12)} ${String(r.paths).padStart(5)}   ${String(r.coords).padStart(6)}   ${(r.bytes/1048576).toFixed(2).padStart(6)} MB     ${(r.bytes/9/1024).toFixed(0).padStart(5)} KB`);
}
console.log('\n=== Sanity: theoretical minimum for the 122 m case ===');
const r=retained(327,1);
console.log(`${r.coords} coords as Float32 = ${(r.coords*4/1024).toFixed(1)} KB of pure geometry per tile.`);
console.log(`Measured retained per tile at that radius: ${(retained(327,9).bytes/9/1024).toFixed(0)} KB.`);
console.log('\nOnly the CENTRE tile needs the full radius. The 8 ring tiles only');
console.log('contribute where the radius overlaps them, which at 122 m is almost nothing.');
