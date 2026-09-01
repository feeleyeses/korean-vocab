# Vocabulary Entry Pipeline

New entries must pass this path before they enter the production vocabulary. The production page reads `data/vocabulary.json`; new data should be introduced through `data/vocabulary.raw.json` or another raw intake file, then published by `scripts/vocab-pipeline.mjs`.

1. Raw: intake draft headword, source, candidate meanings, pronunciation notes, and track.
2. Normalize: normalize spelling, part of speech, TOPIK levels, register, and source metadata.
3. Split Sense: create Sense records; never merge only because `headword` matches.
4. Pronunciation: add actual Hangul pronunciation and sound-change labels when applicable.
5. Romanization: add learner-facing romanization for every entry.
6. Collocation: add common collocations and examples only when sourced or human verified. `collocation.zh` must come from a real phrase-level `collocationZh` value; if raw data has no verified phrase meaning, publish an empty `zh` value and let the UI show Korean only.
7. Expansion Intake: import new candidates as `draft` or `needs_review` raw entries first. A draft must include `headword`, `partOfSpeech`, TOPIK level, `pronunciation.romanization`, and at least one `sense.glossZh`; incomplete optional fields stay in the review queue and do not block raw intake.
8. Quality Check: calculate Quality Score, record blocking issues, and generate the review queue with `scripts/vocab-quality-audit.mjs data/vocabulary.json --raw=data/vocabulary.raw.json --report=artifacts/vocab-quality-report.json`.
9. Publish: only `approved` entries move into `data/vocabulary.json`. `needs_review` entries stay in human review queues, and `draft` entries stay in raw intake only; use `--strict` when a batch must also clear every warning.

## Expansion Commands

- Import a controlled TOPIK-1/2 draft batch with KRDict exact-headword Chinese lookup:
  `node scripts/vocab-expansion-import.mjs --key=<KRDICT_API_KEY> --limit=120 --out=artifacts/vocabulary-expansion-import-report.json`
- Extract reusable TOPIK I candidates from the source PDF:
  `python scripts/extract-topik-i-candidates.py artifacts/TOPIK-I-1671.pdf artifacts/topik-i-candidates.txt artifacts/topik-i-candidates-report.json`
- Import a bulk TOPIK-1/2 approved batch from exact KRDict hits:
  `node scripts/vocab-expansion-import.mjs --key=<KRDICT_API_KEY> --candidates=artifacts/topik-i-candidates.txt --limit=500 --status=approved --out=artifacts/vocabulary-expansion-bulk-report.json`
- Import a bulk TOPIK-3/4 approved batch from exact TOPIK II KRDict hits:
  `node scripts/vocab-expansion-import.mjs --key=<KRDICT_API_KEY> --candidates=artifacts/topik-ii-candidates.txt --limit=850 --status=approved --levels=3,4 --source-url=https://learning-korean.com/DL/topik-2662.pdf --source-name=TOPIK_II_2662 --batch-id=2026-09-01-topik34-expansion-bulk --id-prefix=exp-tii --out=artifacts/vocabulary-expansion-topik34-bulk-report.json`
- Import a bulk TOPIK-5/6 approved batch from exact TOPIK II KRDict hits:
  `node scripts/vocab-expansion-import.mjs --key=<KRDICT_API_KEY> --candidates=artifacts/topik-ii-candidates.txt --limit=900 --status=approved --levels=5,6 --source-url=https://learning-korean.com/DL/topik-2662.pdf --source-name=TOPIK_II_2662 --batch-id=2026-09-01-topik56-expansion-bulk --id-prefix=exp-tii --out=artifacts/vocabulary-expansion-topik56-bulk-report.json`
- Fill a reviewed collocation phrase-meaning batch without using headword or sense-gloss fallback:
  `node scripts/fill-collocation-zh-batch.mjs data/vocabulary.raw.json artifacts/collocation-zh-editorial-topik1-batch-report.json`
- Regenerate production data:
  `node scripts/vocab-pipeline.mjs data/vocabulary.raw.json data/vocabulary.json`
- Regenerate the unresolved collocation queue:
  `node scripts/vocab-collocation-review-queue.mjs --input=data/vocabulary.json --coverage=artifacts/krdict-collocation-coverage-2026-08-29T21-26-08-061Z.json`

## Publication Status

- `approved`: published to learning and review queues.
- `needs_review`: retained in raw data and human review queues; not published.
- `draft`: retained in raw data only; not published.

See `docs/vocabulary-quality-maintenance.md` for the Sprint 3 review queue and batch-maintenance workflow.
