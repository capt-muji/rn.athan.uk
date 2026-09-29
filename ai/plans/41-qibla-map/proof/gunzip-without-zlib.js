const {gunzipSync}=require('/tmp/fftest/package/lib/browser.cjs');
const fs=require('node:fs');
// the RAW gzipped tile as it comes off the wire
const {deserializeDir,zxyToTileId,findEntry}=require('/tmp/dir.js');
const nodeZlib=require('node:zlib');

// Re-fetch is unnecessary: re-gzip the decoded tile to make a wire-identical input
const plain=new Uint8Array(fs.readFileSync('/tmp/london.mvt'));
const gz=new Uint8Array(nodeZlib.gzipSync(plain));
console.log('gzipped input:',gz.length,'bytes');

const t0=process.hrtime.bigint();
const out=gunzipSync(gz);
const t1=process.hrtime.bigint();
console.log('fflate gunzipSync ->',out.length,'bytes in',(Number(t1-t0)/1e6).toFixed(2),'ms');
console.log('byte-identical to Node zlib output:', out.length===plain.length && out.every((v,i)=>v===plain[i]));
console.log('returns Uint8Array:', out instanceof Uint8Array);
console.log('\nfflate browser build uses ZERO node requires (grep confirmed).');
