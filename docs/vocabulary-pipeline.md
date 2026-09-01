# Vocabulary Entry Pipeline

New entries must pass this path before they enter the production vocabulary. The production page reads `data/vocabulary.json`; new data should be introduced through `data/vocabulary.raw.json` or another raw intake file, then published by `scripts/vocab-pipeline.mjs`.

1. Raw: intake draft headword, source, candidate meanings, pronunciation notes, and track.
2. Normalize: normalize spelling, part of speech, TOPIK levels, register, and source metadata.
3. Split Sense: create Sense records; never merge only because `headword` matches.
4. Pronunciation: add actual Hangul pronunciation and sound-change labels when applicable.
5. Romanization: add learner-facing romanization for every entry.
6. Collocation: add common collocations and examples only when sourced or human verified. `collocation.zh` must come from a real phrase-level `collocationZh` value; if raw data has no verified phrase meaning, publish an empty `zh` value and let the UI show Korean only.
7. Quality Check: calculate Quality Score, record blocking issues, and generate the review queue with `scripts/vocab-quality-audit.mjs data/vocabulary.json --report=artifacts/vocab-quality-report.json`.
8. Publish: only entries with zero blocking failures can move into `data/vocabulary.json`; use `--strict` when a batch must also clear every warning.

See `docs/vocabulary-quality-maintenance.md` for the Sprint 3 review queue and batch-maintenance workflow.
