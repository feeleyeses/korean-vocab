# Vocabulary Quality Report

## 2026-09-01 Collocation Meaning Cleanup

- Scope: fixed the collocation meaning data chain without UI style changes.
- Pipeline rule: `collocation.zh` is now published only from a real `collocationZh`; it no longer falls back to `sense.gloss` or the headword meaning.
- KRDict exact auto-fill applied to raw data: 159 collocations marked `KRDICT_EXACT`.
- Published collocations with verified Chinese phrase meaning: 159/650.
- Published collocations without Chinese phrase meaning: 491; frontend should display Korean only for these rows.
- Detected fallback-to-sense-gloss rows after regeneration: 0.
- Manual review queue: 491 rows (478 unavailable, 13 manual/ambiguous).
- Manual review queue document: `docs/collocation-manual-review-queue.md`.

### Collocation zh by TOPIK Level

| TOPIK | Total | With zh | Missing zh | Fallback to gloss |
|---|---:|---:|---:|---:|
| TOPIK-1 | 188 | 26 | 162 | 0 |
| TOPIK-2 | 113 | 3 | 110 | 0 |
| TOPIK-3 | 157 | 90 | 67 | 0 |
| TOPIK-4 | 32 | 1 | 31 | 0 |
| TOPIK-5 | 131 | 38 | 93 | 0 |
| TOPIK-6 | 29 | 1 | 28 | 0 |

## 2026-08-30 Sprint 4 TOPIK-4/5/6 Cleanup

- Scope: TOPIK-4 through TOPIK-6 romanization cleanup, preserving the existing schema and UI Freeze.
- Review items before batch: 177.
- TOPIK-4 review items before batch: 20.
- TOPIK-5 review items before batch: 128.
- TOPIK-6 review items before batch: 29.
- Review items processed: 177 romanization normalization items.
- Review items after batch: 0.
- TOPIK-4 review items after batch: 0.
- TOPIK-5 review items after batch: 0.
- TOPIK-6 review items after batch: 0.
- TOPIK levels completed in this batch: TOPIK-4, TOPIK-5, and TOPIK-6 romanization cleanup; 175 entries had romanization newly written through the normalized pipeline and 2 entries were updated with reviewed actual readings.
- Pronunciation cleanup: 2 entries received actual reading review.
- Sound-rule cleanup: 2 entries received high-confidence sound-rule labels.
- Example cleanup: 10 entries received stronger learning examples.
- Collocation cleanup: 10 entries received stronger common collocations.
- Source cleanup: 10 entries moved to `EDITORIAL_REVIEW`, the current human-reviewed source tier.
- Current complete-quality count by audit queue: 611 lexical entries.
- Blocking audit failures: 0.
- Remaining review items: 0.

## 2026-08-30 Sprint 3 Batch 3

- Scope: TOPIK-3 vocabulary, continuing in TOPIK order.
- Review items before batch: 309.
- TOPIK-3 review items before batch: 132.
- Review items processed: 132 romanization normalization items.
- Review items after batch: 177.
- TOPIK-3 review items after batch: 0.
- TOPIK levels completed in this batch: TOPIK-3 romanization cleanup; 120 TOPIK-3 entries had romanization newly written or changed, while existing romanized TOPIK-3 sound-rule entries remained valid.
- Pronunciation cleanup: 12 TOPIK-3 entries received actual reading review.
- Sound-rule cleanup: 12 TOPIK-3 entries received sound-rule labels.
- Example cleanup: 10 TOPIK-3 entries received stronger learning examples.
- Collocation cleanup: 10 TOPIK-3 entries received stronger common collocations.
- Source cleanup: 10 TOPIK-3 entries moved to `EDITORIAL_REVIEW`, the current human-reviewed source tier.
- Current complete-quality count by audit queue: 434 lexical entries.
- Blocking audit failures: 0.
- Remaining review items: 177, all non-blocking romanization normalization warnings in TOPIK-4 and above.

## 2026-08-30 Sprint 3 Batch 2

- Scope: TOPIK-2 vocabulary, continuing in TOPIK order.
- Review items before batch: 394.
- TOPIK-2 review items before batch: 85.
- Review items processed: 85 romanization normalization items.
- Review items after batch: 309.
- TOPIK-2 review items after batch: 0.
- TOPIK levels completed in this batch: TOPIK-2 romanization cleanup, 87 TOPIK-2 entries normalized to learner-facing Latin romanization.
- Pronunciation cleanup: 9 TOPIK-2 entries received actual reading and sound-rule review.
- Example cleanup: 10 TOPIK-2 entries received stronger learning examples.
- Collocation cleanup: 10 TOPIK-2 entries received stronger common collocations.
- Source cleanup: 10 TOPIK-2 entries moved to `EDITORIAL_REVIEW`, the current human-reviewed source tier.
- Current complete-quality count by audit queue: 302 lexical entries.
- Blocking audit failures: 0.
- Remaining review items: 309, all non-blocking romanization normalization warnings in TOPIK-3 and above.

## Source Tiers

- `KRDICT`: official dictionary-derived source.
- `TOPIK`: exam-list source awaiting source-level human review.
- `EDITORIAL`: editorial seed data awaiting source-level human review.
- `EDITORIAL_REVIEW`: human-reviewed editorial source for pronunciation, examples, and collocations.

## 2026-08-30 Sprint 3 Batch 1

- Scope: TOPIK-1 high-priority vocabulary.
- Review items before batch: 574.
- Review items processed: 180 romanization normalization items.
- Review items after batch: 394.
- TOPIK levels completed in this batch: TOPIK-1 romanization cleanup, 187 TOPIK-1 entries normalized to learner-facing Latin romanization.
- Pronunciation cleanup: 12 TOPIK-1 entries received verified actual reading, romanization, and sound-rule labels.
- Blocking audit failures: 0.
- Remaining review items: 394, all non-blocking romanization normalization warnings in TOPIK-2 and above.

## Remaining Review Queue

- TOPIK-2: 0.
- TOPIK-3: 0.
- TOPIK-4: 0.
- TOPIK-5: 0.
- TOPIK-6: 0.

## Manual Confirmation Needed

- The romanization review queue is clear across TOPIK-1 through TOPIK-6.
- Source credibility is present for all entries, but external citation quality still needs a separate source-traceability pass.
- Examples and collocations pass structural quality checks, but broader source-level linguistic review remains future work.
