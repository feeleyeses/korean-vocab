#!/usr/bin/env python3
"""Non-destructive audit for the mirrored vocabulary bundle.

The production bundle currently contains the vocabulary data, so this script
extracts explicit object literals and reports risks without rewriting meanings.
It is intentionally advisory: homographs can be legitimate separate lexemes.
"""
from __future__ import annotations

import glob
import re
from collections import Counter, defaultdict
from pathlib import Path

bundles = sorted(glob.glob("assets/page-*.js"))
if not bundles:
    raise SystemExit("No assets/page-*.js bundle found")

text = "\n".join(Path(p).read_text(encoding="utf-8") for p in bundles)

# Explicit structured vocabulary objects (KRDICT/sound-change/polysemy additions).
obj_re = re.compile(
    r"id:`(?P<id>[^`]+)`,headword:`(?P<headword>[^`]+)`.*?senses:\[\{id:`[^`]+`,gloss:`(?P<gloss>[^`]+)`",
    re.S,
)
records = [m.groupdict() for m in obj_re.finditer(text)]

ids = Counter(r["id"] for r in records)
by_headword: dict[str, list[dict[str, str]]] = defaultdict(list)
for r in records:
    by_headword[r["headword"]].append(r)

id_dupes = {k: v for k, v in ids.items() if v > 1}
homograph_risks = {
    headword: rows
    for headword, rows in by_headword.items()
    if len({r["gloss"] for r in rows}) > 1
}

print("# Korean Word Field vocabulary audit")
print()
print(f"- Explicit structured records scanned: {len(records)}")
print(f"- Duplicate IDs: {len(id_dupes)}")
print(f"- Same-spelling / different-gloss groups: {len(homograph_risks)}")
print()

if id_dupes:
    print("## ERROR: duplicate IDs")
    for key, count in sorted(id_dupes.items()):
        print(f"- `{key}` × {count}")
    print()

print("## Homograph review queue")
if not homograph_risks:
    print("- None detected in explicit object records.")
else:
    for headword, rows in sorted(homograph_risks.items()):
        variants = " / ".join(f"{r['id']}: {r['gloss']}" for r in rows)
        print(f"- **{headword}** — {variants}")

print()
print("## Policy")
print("Same spelling is not automatically polysemy. Keep separate lexeme IDs when meanings come from distinct dictionary entries; merge only senses belonging to the same lexical entry.")

# Only duplicate IDs block CI. Homographs are a review queue, not an automatic error.
if id_dupes:
    raise SystemExit(1)
