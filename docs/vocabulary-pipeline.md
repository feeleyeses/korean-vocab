# Vocabulary Entry Pipeline

New entries must pass this path before they enter the production vocabulary. The production page reads `data/vocabulary.json`; new data should be introduced through `data/vocabulary.raw.json` or another raw intake file, then published by `scripts/vocab-pipeline.mjs`.

1. Raw: intake draft headword, source, candidate meanings, pronunciation notes, and track.
2. Normalize: normalize spelling, part of speech, TOPIK levels, register, and source metadata.
3. Split Sense: create Sense records; never merge only because `headword` matches.
4. Pronunciation: add actual Hangul pronunciation and sound-change labels when applicable.
5. Romanization: add learner-facing romanization for every entry.
6. Collocation: add common collocations and examples only when sourced or human verified.
7. Quality Check: calculate Quality Score and record blocking issues.
8. Publish: run `scripts/vocab-quality-audit.mjs`; only approved, valid entries can move into `data/vocabulary.json`.
