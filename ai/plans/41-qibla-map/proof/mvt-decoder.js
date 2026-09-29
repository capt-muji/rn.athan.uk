// Minimal MVT (protobuf) decoder: enough to list layers and read road names.
const fs=require('fs');
function reader(buf){let p=0;return{
  get p(){return p}, set p(v){p=v}, get end(){return p>=buf.length},
  varint(){let r=0,s=0,b;do{b=buf[p++];r+=(b&0x7f)*2**s;s+=7;}while(b>=0x80);return r;},
  key(){const k=this.varint();return{field:k>>3,wire:k&7};},
  bytes(){const l=this.varint();const b=buf.slice(p,p+l);p+=l;return b;},
  skip(w){if(w===0)this.varint();else if(w===2)this.bytes();else if(w===5)p+=4;else if(w===1)p+=8;},
  dbl(){const v=buf.readDoubleLE(p);p+=8;return v;},
  f32(){const v=buf.readFloatLE(p);p+=4;return v;}};}
function decodeValue(b){const r=reader(b);const o={};
  while(!r.end){const{field,wire}=r.key();
    if(field===1&&wire===2)o.s=r.bytes().toString('utf8');
    else if(field===2)o.f=r.f32(); else if(field===3)o.d=r.dbl();
    else if(field===4||field===5)o.i=r.varint();
    else if(field===6)o.si=r.varint(); else if(field===7)o.b=!!r.varint();
    else r.skip(wire);} return o.s??o.i??o.d??o.f??o.si??o.b;}
function decodeFeature(b){const r=reader(b);const f={tags:[]};
  while(!r.end){const{field,wire}=r.key();
    if(field===1)f.id=r.varint(); else if(field===2&&wire===2){
      const t=reader(r.bytes()); while(!t.end)f.tags.push(t.varint());}
    else if(field===3)f.type=r.varint();
    else if(field===4&&wire===2){const g=reader(r.bytes());f.geomLen=0;while(!g.end){g.varint();f.geomLen++;}}
    else r.skip(wire);} return f;}
function decodeLayer(b){const r=reader(b);const L={keys:[],values:[],features:[]};
  while(!r.end){const{field,wire}=r.key();
    if(field===1&&wire===2)L.name=r.bytes().toString('utf8');
    else if(field===2&&wire===2)L.features.push(decodeFeature(r.bytes()));
    else if(field===3&&wire===2)L.keys.push(r.bytes().toString('utf8'));
    else if(field===4&&wire===2)L.values.push(decodeValue(r.bytes()));
    else if(field===5)L.extent=r.varint(); else if(field===15)L.version=r.varint();
    else r.skip(wire);} return L;}
function decodeTile(buf){const r=reader(buf);const layers=[];
  while(!r.end){const{field,wire}=r.key();
    if(field===3&&wire===2)layers.push(decodeLayer(r.bytes())); else r.skip(wire);}
  return layers;}
module.exports={decodeTile};
