const fs=require('node:fs'),zlib=require('node:zlib');
const mvt=fs.readFileSync('/tmp/london.mvt');
const gz=zlib.gzipSync(mvt);
console.log('=== HOW DO 9 TILES GET INTO THE APP? Three routes, measured. ===\n');
const b64=gz.toString('base64');
const rows=[
 ['Raw gzipped tile (the wire format)', gz.length, 'needs assetExts + a native read'],
 ['Decompressed MVT', mvt.length, 'skips fflate entirely, 82% bigger'],
 ['Base64 of the gzipped tile, in a .ts module', b64.length, 'no config change at all'],
];
for(const [k,v,note] of rows) console.log(`  ${k.padEnd(44)} ${String(v).padStart(7)} B   ${note}`);
console.log(`\n  base64 overhead vs raw gzip: ${((b64.length/gz.length-1)*100).toFixed(1)}%  (the classic 4/3)`);
console.log(`\n=== For a 3x3 pack (using London's measured 655 KB of z15) ===`);
const pack=655*1024;
console.log(`  raw gzipped      ${(pack/1024).toFixed(0)} KB`);
console.log(`  as base64 in TS  ${(pack*4/3/1024).toFixed(0)} KB  (+${((pack*4/3-pack)/1024).toFixed(0)} KB)`);
console.log(`\n=== Does Hermes even parse a 900 KB string literal cheaply? ===`);
const t0=process.hrtime.bigint();
const back=Buffer.from(b64,'base64');
const t1=process.hrtime.bigint();
console.log(`  base64 decode of one tile: ${(Number(t1-t0)/1e6).toFixed(2)} ms, correct: ${back.equals(gz)}`);
console.log('\n  NOTE: ai/AGENTS.md records that the JSON.parse-beats-literals trick is a V8');
console.log('  result that does NOT transfer to Hermes (facebook/hermes#1046), so a big');
console.log('  string literal is the thing to be careful about, and it is UNMEASURED here.');
console.log('\n=== The honest recommendation ===');
console.log('  Adding 2 lines to metro.config.js assetExts is cheaper than 33% of bytes');
console.log('  AND avoids an unmeasured Hermes string-literal cost. The repo already');
console.log('  edits assetExts (it REMOVES svg), so the pattern exists.');
