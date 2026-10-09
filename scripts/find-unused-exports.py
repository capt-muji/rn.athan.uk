"""
Every exported symbol in the app, and whether any PRODUCTION file can reach it.

Biome's noUnusedImports only sees imports, never an export nobody imports, so a symbol can sit
fully covered by its own tests while no screen uses it. Run this to find those.

A reference counts only where it RESOLVES to this export, which a bare identifier search cannot
do: three separate symbols are named `clearAllScheduledRemindersForPrayer` (exports of
stores/database.ts and device/notifications.ts, plus a local const in stores/notifications.ts), so
counting the name alone reports the dead one as used. Resolution follows the import graph, through
`@/` aliases, relative specifiers, `require()`, and the barrel files that re-export a symbol
under its own name or a new one.

KNOWN FALSE POSITIVE: `ErrorBoundary` in app/_layout.tsx is called by Expo Router by file
convention, not by import, so it reports unreachable and must never be deleted. Verify every hit
the same way before removing anything: a framework may call it by name.

    python3 scripts/find-unused-exports.py
"""

import io
import os
import re

SRC_DIRS = ["app", "components", "shared", "stores", "hooks", "device", "assets", "modules", "api", "widgets"]
EXCL = ("__tests__", "__mocks__", "node_modules", ".claude", "android", "ios")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

EXPORT_KINDS = r"(?:declare\s+)?(?:async\s+)?(?:const|let|var|function|class|type|interface|enum)"
EXPORT_RE = re.compile(rf"^export\s+{EXPORT_KINDS}\s+(\w+)", re.M)
# A clause holds no quote and no semicolon, so it can never run past the statement before it.
# `const { name } = require('...')` binds its names to the RIGHT of the specifier, so that form is
# matched separately rather than folded in here.
IMPORT_RE = re.compile(r"""import\s+(?:type\s+)?([^'";]*?)\s*from\s*['"]([^'"]+)['"]""")
REQUIRE_RE = re.compile(r"""(?:const|let|var)\s*(\{[^}]*\}|\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]""")
REEXPORT_RE = re.compile(r"""export\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]""")
STAR_REEXPORT_RE = re.compile(r"""export\s*\*\s*from\s*['"]([^'"]+)['"]""")


def files():
    for directory in SRC_DIRS:
        for root, _, names in os.walk(directory):
            if any(part in root for part in EXCL):
                continue
            for name in names:
                if name.endswith((".ts", ".tsx")) and not name.endswith(".d.ts"):
                    yield os.path.join(root, name)


source = {path: io.open(path, encoding="utf8", errors="ignore").read() for path in files()}


def resolve(specifier, importing_file):
    """The source file a specifier names, or None when it leaves the scanned tree."""
    if specifier.startswith("@/"):
        base = specifier[2:]
    elif specifier.startswith("."):
        base = os.path.normpath(os.path.join(os.path.dirname(importing_file), specifier))
    else:
        return None
    for candidate in (f"{base}.ts", f"{base}.tsx", f"{base}/index.ts", f"{base}/index.tsx"):
        if candidate in source:
            return candidate
    return None


def clause_names(clause):
    """The (exported, local) name pairs a brace clause binds, and any `* as NS` alias."""
    star = re.fullmatch(r"\*\s+as\s+(\w+)", clause.strip())
    if star:
        return set(), {star.group(1)}
    braces = re.search(r"\{([^}]*)\}", clause, re.S)
    if not braces:
        return set(), set()
    names = set()
    for part in braces.group(1).split(","):
        token = part.strip().removeprefix("type ").strip()
        alias = re.fullmatch(r"(\w+)(?:\s+as\s+(\w+))?", token, re.S)
        if alias:
            names.add((alias.group(1), alias.group(2) or alias.group(1)))
    return names, set()


def imports_in(path, text):
    """Every scanned file this one imports, with the names and namespaces it binds from each."""
    found = {}
    for pattern in (IMPORT_RE, REQUIRE_RE):
        for match in pattern.finditer(text):
            target = resolve(match.group(2), path)
            if not target:
                continue
            names, namespaces = found.setdefault(target, (set(), set()))
            bound, star = clause_names(match.group(1))
            names |= bound
            namespaces |= star
    return found


# A barrel re-export forwards a name onward, so reaching the barrel's name reaches the original
reexports = {}
for path, text in source.items():
    for match in REEXPORT_RE.finditer(text):
        target = resolve(match.group(2), path)
        if not target:
            continue
        for original, exposed in clause_names("{" + match.group(1) + "}")[0]:
            reexports.setdefault((original, target), set()).add((exposed, path))
    for match in STAR_REEXPORT_RE.finditer(text):
        target = resolve(match.group(1), path)
        if target:
            reexports.setdefault(("*", target), set()).add(("*", path))

# The identifier search runs over the body alone, so an import or re-export naming a symbol
# nobody calls cannot make it look reachable
BLOCK_COMMENT_RE = re.compile(r"/\*.*?\*/", re.S)
LINE_COMMENT_RE = re.compile(r"^\s*//.*$", re.M)


def to_body(text):
    """The file's code alone: no import or re-export clause, and no comment.

    A name a comment merely mentions is not a caller. Three `MAX_WHATS_NEW_*` constants are named
    only by the prose above their own definitions, and counting those read them as live.
    """
    for pattern in (IMPORT_RE, REQUIRE_RE, REEXPORT_RE, STAR_REEXPORT_RE, BLOCK_COMMENT_RE, LINE_COMMENT_RE):
        text = pattern.sub("", text)
    return text


body = {path: to_body(text) for path, text in source.items()}
imported = {path: imports_in(path, text) for path, text in source.items()}
exports = sorted({(match.group(1), path) for path, text in source.items() for match in EXPORT_RE.finditer(text)})


def reachable(name, defining_file, seen=None):
    seen = seen or set()
    if (name, defining_file) in seen:
        return False
    seen.add((name, defining_file))

    own = re.sub(rf"^export\s+{EXPORT_KINDS}\s+{name}\b", "", body[defining_file], flags=re.M)
    if re.search(rf"\b{re.escape(name)}\b", own):
        return True

    for path, targets in imported.items():
        if path == defining_file or defining_file not in targets:
            continue
        names, namespaces = targets[defining_file]
        for exported, local in names:
            if exported == name and re.search(rf"\b{re.escape(local)}\b", body[path]):
                return True
        for namespace in namespaces:
            if re.search(rf"\b{re.escape(namespace)}\s*\.\s*{re.escape(name)}\b", body[path]):
                return True

    for key in ((name, defining_file), ("*", defining_file)):
        for exposed, barrel in reexports.get(key, ()):
            if reachable(name if exposed == "*" else exposed, barrel, seen):
                return True
    return False


unreachable = [(name, path) for name, path in exports if not reachable(name, path)]

print(f"exported symbols scanned: {len(exports)}")
print(f"NEVER reachable from production code: {len(unreachable)}\n")
for name, path in sorted(unreachable, key=lambda pair: pair[1]):
    print(f"  {path}: {name}")
