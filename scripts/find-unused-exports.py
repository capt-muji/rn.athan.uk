"""
Every exported symbol in the app, and whether any PRODUCTION file references it.

Biome's noUnusedImports only sees imports, never an export nobody imports, so a symbol can sit
fully covered by its own tests while no screen uses it. Run this to find those.

KNOWN FALSE POSITIVE: `ErrorBoundary` in app/_layout.tsx is called by Expo Router by file
convention, not by import, so it reports unused and must never be deleted. Verify every hit the
same way before removing anything: a framework may call it by name.

    python3 scripts/find-unused-exports.py
"""
import os, re, io, collections

SRC_DIRS = ["app","components","shared","stores","hooks","device","assets","modules","api"]
EXCL = ("__tests__","__mocks__","node_modules",".claude","android","ios")

def files():
    for d in SRC_DIRS:
        for root,_,fs in os.walk(d):
            if any(x in root for x in EXCL): continue
            for f in fs:
                if f.endswith((".ts",".tsx")) and not f.endswith(".d.ts"):
                    yield os.path.join(root,f)

exports = {}   # name -> file
for p in files():
    s = io.open(p, encoding="utf8", errors="ignore").read()
    for m in re.finditer(r'^export\s+(?:const|function|class|type|interface|enum)\s+(\w+)', s, re.M):
        exports.setdefault(m.group(1), []).append(p)
    for m in re.finditer(r'^export\s+(?:async\s+)?function\s+(\w+)', s, re.M):
        exports.setdefault(m.group(1), []).append(p)

# every identifier referenced anywhere in production code
prod_text = {}
for p in files():
    prod_text[p] = io.open(p, encoding="utf8", errors="ignore").read()

unused = []
for name, defs in exports.items():
    hits = 0
    for p, s in prod_text.items():
        if p in defs:
            # references inside its own file, excluding the export line itself
            body = re.sub(r'^export\s+(?:const|function|class|type|interface|enum|async)\s+'+name+r'\b', '', s, flags=re.M)
            hits += len(re.findall(r'\b'+re.escape(name)+r'\b', body))
        else:
            hits += len(re.findall(r'\b'+re.escape(name)+r'\b', s))
    if hits == 0:
        unused.append((name, defs[0]))

print(f"exported symbols scanned: {len(exports)}")
print(f"NEVER referenced in production code: {len(unused)}\n")
for n,f in sorted(unused, key=lambda x:x[1]):
    print(f"  {f}: {n}")
