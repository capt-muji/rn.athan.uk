'use strict';
// MVT decoder with full geometry, written against the spec:
// https://github.com/mapbox/vector-tile-spec/tree/master/2.1

function reader(u8) {
  let p = 0;
  return {
    get pos() {
      return p;
    },
    get end() {
      return p >= u8.length;
    },
    varint() {
      let r = 0;
      let s = 0;
      let b;
      do {
        b = u8[p++];
        r += (b & 0x7f) * 2 ** s;
        s += 7;
      } while (b >= 0x80);
      return r;
    },
    key() {
      const k = this.varint();
      return { field: k >> 3, wire: k & 7 };
    },
    bytes() {
      const l = this.varint();
      const b = u8.subarray(p, p + l);
      p += l;
      return b;
    },
    skip(w) {
      if (w === 0) this.varint();
      else if (w === 2) this.bytes();
      else if (w === 5) p += 4;
      else if (w === 1) p += 8;
    },
  };
}

const utf8 = (u8) => new TextDecoder().decode(u8);

function decodeGeometry(u8) {
  const r = reader(u8);
  const cmds = [];
  while (!r.end) cmds.push(r.varint());
  const parts = [];
  let cur = [];
  let cx = 0;
  let cy = 0;
  let i = 0;
  while (i < cmds.length) {
    const ci = cmds[i++];
    const id = ci & 7;
    const n = ci >> 3;
    if (id === 1) {
      for (let k = 0; k < n; k++) {
        if (cur.length) parts.push(cur);
        cur = [];
        cx += (cmds[i] >> 1) ^ -(cmds[i] & 1);
        i++;
        cy += (cmds[i] >> 1) ^ -(cmds[i] & 1);
        i++;
        cur.push([cx, cy]);
      }
    } else if (id === 2) {
      for (let k = 0; k < n; k++) {
        cx += (cmds[i] >> 1) ^ -(cmds[i] & 1);
        i++;
        cy += (cmds[i] >> 1) ^ -(cmds[i] & 1);
        i++;
        cur.push([cx, cy]);
      }
    } else if (id === 7) {
      if (cur.length) {
        parts.push(cur);
        cur = [];
      }
    }
  }
  if (cur.length) parts.push(cur);
  return parts;
}

function decodeValue(u8) {
  const r = reader(u8);
  let out = null;
  while (!r.end) {
    const { field, wire } = r.key();
    if (field === 1 && wire === 2) out = utf8(r.bytes());
    else if (field === 4 || field === 5) out = r.varint();
    else if (field === 7) out = !!r.varint();
    else r.skip(wire);
  }
  return out;
}

function decodeLayer(u8) {
  const r = reader(u8);
  const layer = { name: null, keys: [], values: [], features: [], extent: 4096 };
  while (!r.end) {
    const { field, wire } = r.key();
    if (field === 1 && wire === 2) layer.name = utf8(r.bytes());
    else if (field === 2 && wire === 2) {
      const fr = reader(r.bytes());
      const f = { tags: [], type: 0, parts: [] };
      while (!fr.end) {
        const k = fr.key();
        if (k.field === 2 && k.wire === 2) {
          const t = reader(fr.bytes());
          while (!t.end) f.tags.push(t.varint());
        } else if (k.field === 3) f.type = fr.varint();
        else if (k.field === 4 && k.wire === 2) f.parts = decodeGeometry(fr.bytes());
        else fr.skip(k.wire);
      }
      layer.features.push(f);
    } else if (field === 3 && wire === 2) layer.keys.push(utf8(r.bytes()));
    else if (field === 4 && wire === 2) layer.values.push(decodeValue(r.bytes()));
    else if (field === 5) layer.extent = r.varint();
    else r.skip(wire);
  }
  return layer;
}

function decodeTile(u8) {
  const r = reader(u8);
  const layers = {};
  while (!r.end) {
    const { field, wire } = r.key();
    if (field === 3 && wire === 2) {
      const l = decodeLayer(r.bytes());
      layers[l.name] = l;
    } else r.skip(wire);
  }
  return layers;
}

function tagsOf(layer, feature) {
  const o = {};
  for (let i = 0; i < feature.tags.length; i += 2) o[layer.keys[feature.tags[i]]] = layer.values[feature.tags[i + 1]];
  return o;
}

module.exports = { decodeTile, tagsOf };
