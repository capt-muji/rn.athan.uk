import sys, re
from pypdf import PdfReader

path = sys.argv[1]
r = PdfReader(path)
for i, page in enumerate(r.pages):
    t = page.extract_text() or ""
    print(f"===== PAGE {i+1} =====")
    print(t[:2500])
