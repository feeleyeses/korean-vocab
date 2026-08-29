#!/usr/bin/env python3
"""Non-destructive audit for the published vocabulary JSON."""
from __future__ import annotations

import json
from collections import Counter, defaultdict
from pathlib import Path

payload = json.loads(Path("data/vocabulary.json").read_text(encoding="utf-8"))
entries = payload["entries"] if isinstance(payload, dict) else payload

ids = Counter(entry.get("lexicalEntryId") for entry in entries)
sense_ids = Counter(
    sense.get("senseId")
    for entry in entries
    for sense in entry.get("senses", [])
)
by_headword: dict[str, list[dict]] = defaultdict(list)
for entry in entries:
    by_headword[entry.get("headword", "")].append(entry)

id_dupes = {key: count for key, count in ids.items() if not key or count > 1}
sense_dupes = {key: count for key, count in sense_ids.items() if not key or count > 1}
homograph_risks = {
    headword: rows
    for headword, rows in by_headword.items()
    if len(rows) > 1 and len({tuple(s.get("glossZh", "") for s in row.get("senses", [])) for row in rows}) > 1
}
field_errors: list[str] = []

for entry in entries:
    entry_id = entry.get("lexicalEntryId", "(missing)")
    pronunciation = entry.get("pronunciation") or {}
    quality = entry.get("qualityScore") or {}
    if not entry.get("headword"):
        field_errors.append(f"{entry_id}: missing headword")
    if not entry.get("levels"):
        field_errors.append(f"{entry_id}: missing TOPIK level")
    if not pronunciation.get("hangul") or not pronunciation.get("romanization"):
        field_errors.append(f"{entry_id}: missing pronunciation or romanization")
    if not isinstance(pronunciation.get("soundRules"), list):
        field_errors.append(f"{entry_id}: soundRules must be an array")
    if not entry.get("source"):
        field_errors.append(f"{entry_id}: missing source")
    if not isinstance(quality.get("score"), (int, float)):
        field_errors.append(f"{entry_id}: missing quality score")
    for sense in entry.get("senses", []):
        sense_id = sense.get("senseId", "(missing)")
        if not sense.get("glossZh"):
            field_errors.append(f"{entry_id}/{sense_id}: missing Chinese gloss")
        if not sense.get("examples"):
            field_errors.append(f"{entry_id}/{sense_id}: missing examples")
        if not sense.get("collocations"):
            field_errors.append(f"{entry_id}/{sense_id}: missing collocations")

print("# Korean Word Field vocabulary audit")
print()
print(f"- Schema version: {payload.get('schemaVersion') if isinstance(payload, dict) else 'array'}")
print(f"- LexicalEntry records scanned: {len(entries)}")
print(f"- Sense records scanned: {len(sense_ids)}")
print(f"- Duplicate entry IDs: {len(id_dupes)}")
print(f"- Duplicate sense IDs: {len(sense_dupes)}")
print(f"- Same-spelling / different-gloss groups: {len(homograph_risks)}")
print(f"- Field errors: {len(field_errors)}")
print()

print("## Homograph review queue")
if homograph_risks:
    for headword, rows in sorted(homograph_risks.items()):
        variants = " / ".join(f"{row.get('lexicalEntryId')}: {row.get('senses', [{}])[0].get('glossZh', '')}" for row in rows)
        print(f"- **{headword}** - {variants}")
else:
    print("- None detected.")
print()

if field_errors:
    print("## ERROR: field errors")
    for error in field_errors[:80]:
        print(f"- {error}")
    if len(field_errors) > 80:
        print(f"- ... {len(field_errors) - 80} more")
    print()

if id_dupes or sense_dupes or field_errors:
    raise SystemExit(1)
