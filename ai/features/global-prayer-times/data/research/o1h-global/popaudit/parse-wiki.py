#!/usr/bin/env python3
"""Extract the wikitables of a saved Wikipedia article as rows of cell text."""
import sys
from html.parser import HTMLParser


class Tables(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tables = []
        self.depth = 0
        self.row = None
        self.cell = None

    def handle_starttag(self, tag, attrs):
        if tag == "table":
            self.depth += 1
            if self.depth == 1:
                self.tables.append([])
        elif self.depth != 1:
            return
        elif tag == "tr":
            self.row = []
            self.tables[-1].append(self.row)
        elif tag in ("td", "th") and self.row is not None:
            self.cell = []
            self.row.append(self.cell)
        elif tag == "br" and self.cell is not None:
            self.cell.append(" ")

    def handle_endtag(self, tag):
        if tag == "table":
            self.depth -= 1
        elif self.depth == 1:
            if tag in ("td", "th"):
                self.cell = None
            elif tag == "tr":
                self.row = None

    def handle_data(self, data):
        if self.depth == 1 and self.cell is not None:
            self.cell.append(data)


def main(path, needle):
    p = Tables()
    with open(path, encoding="utf-8") as fh:
        p.feed(fh.read())
    for i, table in enumerate(p.tables):
        rows = [[" ".join("".join(c).split()) for c in r] for r in table if r]
        flat = " ".join(" ".join(r) for r in rows[:3])
        if needle.lower() in flat.lower():
            print(f"### table {i}: {len(rows)} rows")
            for r in rows:
                print(" | ".join(r))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "")
