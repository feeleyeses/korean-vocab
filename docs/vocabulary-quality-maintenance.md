# Vocabulary Quality Maintenance

Sprint 3 starts with infrastructure, not full data completion. Production UI continues to read `data/vocabulary.json`; quality work happens through repeatable checks and review queues.

## Quality Gate

Run the audit before publishing vocabulary changes:

```bash
node scripts/vocab-quality-audit.mjs data/vocabulary.json --report=artifacts/vocab-quality-report.json
```

Use `--strict` only when the review queue must be empty. The default mode blocks structural data failures while allowing historical entries to produce non-blocking review warnings.

## Review Queue

The audit report creates a `reviewQueue` with:

- `lexicalEntryId`
- `headword`
- `reason`
- `severity`

Reviewers should resolve `failure` items before publish. `warning` items are Sprint 3 backlog candidates for pronunciation normalization, romanization cleanup, sourced examples, collocations, and human verification.

## Batch Maintenance Flow

1. Intake raw changes in `data/vocabulary.raw.json` or a dedicated raw batch file.
2. Normalize through `scripts/vocab-pipeline.mjs`.
3. Run `scripts/vocab-quality-audit.mjs` with a report path.
4. Review generated queue by source group or TOPIK level.
5. Update raw data with verified pronunciation, romanization, sound rules, examples, collocations, and source notes.
6. Publish only after blocking failures are zero.

## Field Expectations

- Korean headword must contain Hangul.
- Chinese gloss must exist for every sense.
- TOPIK level must exist at entry level.
- Pronunciation needs actual Hangul reading and learner-facing romanization.
- `soundRules` must be present as an array, even when empty.
- Examples and collocations should include Korean, Chinese, source, and `verified`.
- `qualityScore` uses 0-100 dimensions: `completeness`, `accuracy`, `sourceReliability`, plus `humanReviewed`, `issues`, and final `score`.
