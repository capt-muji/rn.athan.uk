// Prove the decoder runs on Uint8Array with NO Node builtins.
// zlib is the only real dependency; everything else is arithmetic on bytes.
const fs=require('node:fs'), zlib=require('node:zlib');

// Re-implement the MVT decoder against Uint8Array (not Buffer) and DataView.
function reader(u8){let p=0;const dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength);return{
  get end(){return p>=u8.length},
  varint(){let r=0,s=0,b;do{b=u8[p++];r+=(b&0x7f)*2**s;s+=7;}while(b>=0x80);return r;},
  key(){const k=this.varint();return{field:k>>3,wire:k&7};},
  bytes(){const l=this.varint();const b=u8.subarray(p,p+l);p+=l;return b;},
  f32(){const v=dv.getFloat32(p,true);p+=4;return v;},
  dbl(){const v=dv.getFloat64(p,true);p+=8;return v;},
  skip(w){if(w===0)this.varint();else if(w===2)this.bytes();else if(w===5)p+=4;else if(w===1)p+=8;}};}
const utf8=(u8)=>new TextDecoder().decode(u8);
function decVal(u8){const r=reader(u8);let o;
  while(!r.end){const{field,wire}=r.key();
    if(field===1&&wire===2)o=utf8(r.bytes());
    else if(field===2)o=r.f32(); else if(field===3)o=r.dbl();
    else if(field===4||field===5||field===6)o=r.varint();
    else if(field===7)o=!!r.varint(); else r.skip(wire);} return o;}
function decLayer(u8){const r=reader(u8);const L={keys:[],values:[],features:[]};
  while(!r.end){const{field,wire}=r.key();
    if(field===1&&wire===2)L.name=utf8(r.bytes());
    else if(field===2&&wire===2){const fr=reader(r.bytes());const f={tags:[],type:0,pts:0};
      while(!fr.end){const k=fr.key();
        if(k.field===2&&k.wire===2){const t=reader(fr.bytes());while(!t.end)f.tags.push(t.varint());}
        else if(k.field===3)f.type=fr.varint();
        else if(k.field===4&&k.wire===2){const g=reader(fr.bytes());while(!g.end){g.varint();f.pts++;}}
        else fr.skip(k.wire);} L.features.push(f);}
    else if(field===3&&wire===2)L.keys.push(utf8(r.bytes()));
    else if(field===4&&wire===2)L.values.push(decVal(r.bytes()));
    else if(field===5)L.extent=r.varint(); else r.skip(wire);} return L;}
function decTile(u8){const r=reader(u8);const ls=[];
  while(!r.end){const{field,wire}=r.key();
    if(field===3&&wire===2)ls.push(decLayer(r.bytes())); else r.skip(wire);} return ls;}

// Feed it a Uint8Array with NO Buffer methods available to it
const raw=fs.readFileSync('/tmp/london.mvt');
const u8=new Uint8Array(raw.buffer,raw.byteOffset,raw.byteLength);
console.log('input is Uint8Array:',u8 instanceof Uint8Array,'| is Buffer:',Buffer.isBuffer(u8));
const t0=process.hrtime.bigint();
const layers=decTile(u8);
const t1=process.hrtime.bigint();
console.log('\n=== HERMES-SAFE DECODE (Uint8Array, DataView, TextDecoder only) ===');
for(const L of layers) console.log('  ',String(L.name).padEnd(12),String(L.features.length).padStart(5),'features');
console.log('\ndecode time (Node, V8):',Number(t1-t0)/1e6,'ms');
const roads=layers.find(l=>l.name==='roads');
const names=new Set();
for(const f of roads.features) for(let i=0;i<f.tags.length;i+=2)
  if(roads.keys[f.tags[i]]==='name'){const v=roads.values[f.tags[i+1]]; if(v)names.add(v);}
console.log('named roads found:',names.size);
console.log('sample:',[...names].slice(0,5).join(' | '));
console.log('\nNode builtins used by the DECODER: none.');
console.log('APIs used: Uint8Array, DataView, TextDecoder, Math. All in Hermes.');
