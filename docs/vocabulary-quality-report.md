# Vocabulary Quality Report

## 2026-09-02 Mobile Long-Content and Polysemy Flow Fix

- Scope: no vocabulary expansion and no raw/published data changes; this pass only fixed UI data mapping and queue behavior.
- Published learning vocabulary: 4020 entries / 4059 senses.
- Example rendering rule: revealed cards now show only real examples; definition-like rows such as `고등학교` and `교통사고` are not displayed as examples.
- Long-content rule: collocations and optional sound rules remain inside the knowledge area above the fixed Continue footer; the knowledge area scrolls only when content actually overflows.
- Polysemy queue rule: learning uses unlearned polysemy senses, single-sense review uses real learned/due/weak sense records, and whole-word review advances through the active learned/weak queue without fixed `같다` / `잡다` fallback.
- Quality audit blocking failures: 0.
- Quality audit warnings: 7438.
- Report: `artifacts/vocab-quality-mobile-polysemy-longcontent-fix.json`.

## 2026-09-02 Headword Pollution Cleanup

- Scope: paused vocabulary expansion and removed polluted headwords from the approved learning queue.
- Scanner: `scripts/suspect-headword-report.mjs`.
- Raw entries scanned: 4064.
- Suspect headwords reported: 64.
- Approved entries moved to `needs_review`: 44 total in this cleanup pass, including 38 spaced phrase-like headwords and 6 clear particle-attached headwords (`꽃이`, `밭이`, `옷이`, `책을`, `끝이`, `밥을`).
- Published learning vocabulary after cleanup: 4020 entries / 4059 senses.
- `밥을` publish status: removed from `data/vocabulary.json`; retained in raw as `needs_review`.
- Current raw status: approved 4020, draft 0, needs_review 44.
- Published all-level distribution: TOPIK-1 596, TOPIK-2 984, TOPIK-3 882, TOPIK-4 520, TOPIK-5 574, TOPIK-6 479.
- Collocation fallback-to-gloss rows: 0.
- Quality audit blocking failures: 0.
- Quality audit warnings: 7438.
- Reports: `docs/suspect-headword-report.md`, `artifacts/suspect-headword-report.json`, and `artifacts/vocab-quality-headword-nav-fix.json`.

## 2026-09-01 Bulk TOPIK-2/3/4 Calibration

- Scope: expanded the published learning vocabulary toward the 4000-entry milestone while keeping UI Freeze.
- Sources: TOPIK II 2662 PDF (`https://learning-korean.com/DL/topik-2662.pdf`), TOPIK I 1671 PDF (`https://learning-korean.com/DL/TOPIK-I-1671.pdf`), and KRDict Open API mid/high search candidates (`https://krdict.korean.go.kr`).
- Processing rule: auto-approved only exact KRDict headword matches with headword, part of speech, TOPIK level, romanization, and at least one Chinese gloss; ambiguous, duplicate, or non-exact candidates were skipped.
- Raw entries before batch: 2981.
- Raw entries after batch: 4064.
- New raw entries in this batch: 1083.
- New approved entries in this batch: 1083.
- Current published learning vocabulary: 4064 entries / 4103 senses.
- Remaining distance to 6000 entries: 1936.
- New approved distribution: TOPIK-2 684, TOPIK-3 333, TOPIK-4 66.
- Current published primary-level distribution: TOPIK-1 603, TOPIK-2 986, TOPIK-3 900, TOPIK-4 515, TOPIK-5 581, TOPIK-6 479.
- Current raw status: approved 4064, draft 0, needs_review 0.
- Duplicate lexicalEntryId: 0.
- Missing TOPIK level: 0.
- Missing romanization: 0.
- Missing glossZh: 0.
- Duplicate headword groups: 15; report classifies 1 same-headword/different-POS group, 5 same-headword/polysemy groups, and 9 likely-keep groups.
- Collocation cleanup: filled another 61 high-confidence phrase meanings with `EDITORIAL_REVIEW`; unresolved items stayed empty under the no-fallback rule.
- Collocation fallback-to-gloss rows: 0.
- Quality audit blocking failures: 0.
- Quality audit warnings: 7442; previous total was 5398, so this batch added 2044 non-blocking warnings.
- Warning density: 1.831 warnings per approved entry (previous density: 1.811).
- Warning type distribution: missing_collocation_zh 268, missing_collocation_verification 3721, missing_example_verification 3453.
- Example verification backlog: 3453 rows; all have a KRDict exact-headword entry point for future KRDict view API example harvesting, but Chinese example translations still need verification.
- Reports: `artifacts/vocab-quality-expansion-topik234-bulk.json`, `artifacts/vocabulary-expansion-topik234-bulk-report.json`, `artifacts/vocabulary-expansion-topik2-gap-report.json`, `artifacts/vocabulary-expansion-krdict-mid-high-gap-report.json`, `artifacts/example-verification-backlog.json`, and `artifacts/duplicate-headword-report.json`.

### Collocation zh by TOPIK Level

| TOPIK | Total | With zh | Missing zh | Fallback to gloss |
|---|---:|---:|---:|---:|
| TOPIK-1 | 188 | 188 | 0 | 0 |
| TOPIK-2 | 113 | 61 | 52 | 0 |
| TOPIK-3 | 157 | 90 | 67 | 0 |
| TOPIK-4 | 32 | 4 | 28 | 0 |
| TOPIK-5 | 131 | 38 | 93 | 0 |
| TOPIK-6 | 29 | 1 | 28 | 0 |

## 2026-09-01 Bulk TOPIK-5/6 Expansion and Collocation Cleanup

- Scope: expanded the published learning vocabulary with a second TOPIK II batch while keeping UI Freeze.
- Source: TOPIK II 2662 PDF (`https://learning-korean.com/DL/topik-2662.pdf`) plus KRDict exact-headword Chinese lookup.
- Processing rule: auto-approved only exact KRDict headword matches with headword, part of speech, TOPIK level, romanization, and at least one Chinese gloss; ambiguous or non-exact candidates were skipped instead of forced into approved data.
- Raw entries before batch: 2081.
- Raw entries after batch: 2981.
- New raw entries in this batch: 900.
- New approved entries in this batch: 900.
- Current published learning vocabulary: 2981 entries / 3020 senses.
- Remaining distance to 6000 entries: 3019.
- New TOPIK II approved distribution: TOPIK-5 450, TOPIK-6 450.
- Current published primary-level distribution: TOPIK-1 603, TOPIK-2 302, TOPIK-3 567, TOPIK-4 449, TOPIK-5 581, TOPIK-6 479.
- Current published all-level coverage distribution: TOPIK-1 603, TOPIK-2 303, TOPIK-3 575, TOPIK-4 455, TOPIK-5 581, TOPIK-6 479.
- Current raw status: approved 2981, draft 0, needs_review 0.
- Duplicate lexicalEntryId: 0.
- Missing TOPIK level: 0.
- Missing romanization: 0.
- Missing glossZh: 0.
- Historical duplicate headword warnings in raw: 15.
- Collocation cleanup: filled 61 high-confidence manual-review phrase meanings with `EDITORIAL_REVIEW`; unresolved items stayed empty instead of falling back to headword or sense gloss.
- Collocation fallback-to-gloss rows: 0.
- Quality audit blocking failures: 0.
- Quality audit warnings: 5398; previous total was 3720, so this batch added 1678 non-blocking warnings.
- Warning type distribution: missing_collocation_zh 329, missing_collocation_verification 2699, missing_example_verification 2370.
- Reports: `artifacts/vocab-quality-expansion-topik56-bulk.json`, `artifacts/vocabulary-expansion-topik56-bulk-report.json`, and `artifacts/collocation-zh-editorial-topik1-batch-report.json`.

### Collocation zh by TOPIK Level

| TOPIK | Total | With zh | Missing zh | Fallback to gloss |
|---|---:|---:|---:|---:|
| TOPIK-1 | 188 | 146 | 42 | 0 |
| TOPIK-2 | 113 | 42 | 71 | 0 |
| TOPIK-3 | 157 | 90 | 67 | 0 |
| TOPIK-4 | 32 | 4 | 28 | 0 |
| TOPIK-5 | 131 | 38 | 93 | 0 |
| TOPIK-6 | 29 | 1 | 28 | 0 |

## 2026-09-01 Bulk TOPIK-3/4 Expansion

- Scope: expanded the published learning vocabulary with TOPIK II candidates while keeping UI Freeze.
- Source: TOPIK II 2662 PDF (`https://learning-korean.com/DL/topik-2662.pdf`) plus KRDict exact-headword Chinese lookup.
- Processing rule: auto-approved only exact KRDict headword matches with headword, part of speech, TOPIK level, romanization, and at least one Chinese gloss; ambiguous or non-exact candidates were skipped instead of forced into the queue.
- Raw entries before batch: 1231.
- Raw entries after batch: 2081.
- New raw entries in this batch: 850.
- Draft reevaluation: 120 previous TOPIK-1/2 drafts were promoted to approved, 0 moved to needs_review.
- New approved in this batch: 970 (850 new TOPIK II entries + 120 promoted drafts).
- Current published learning vocabulary: 2081 entries / 2120 senses.
- Remaining distance to 6000 entries: 3919.
- New TOPIK II approved distribution: TOPIK-3 425, TOPIK-4 425.
- Current published distribution: TOPIK-1 603, TOPIK-2 302, TOPIK-3 567, TOPIK-4 449, TOPIK-5 131, TOPIK-6 29.
- Current raw status: approved 2081, draft 0, needs_review 0.
- Duplicate lexicalEntryId: 0.
- Missing TOPIK level: 0.
- Missing romanization: 0.
- Missing glossZh: 0.
- Historical duplicate headword warnings in raw: 15.
- Collocation fallback-to-gloss rows: 0.
- Quality audit blocking failures: 0.
- Quality audit warnings: 3720; previous total was 1780, so this batch added 1940 non-blocking warnings.
- Warning type distribution: missing_collocation_zh 390, missing_collocation_verification 1860, missing_example_verification 1470.
- Reports: `artifacts/vocab-quality-expansion-topik34-bulk.json`, `artifacts/vocabulary-expansion-topik34-bulk-report.json`, `artifacts/draft-reevaluation-report.json`, and `artifacts/topik-ii-candidates-report.json`.

### Collocation zh by TOPIK Level

| TOPIK | Total | With zh | Missing zh | Fallback to gloss |
|---|---:|---:|---:|---:|
| TOPIK-1 | 188 | 85 | 103 | 0 |
| TOPIK-2 | 113 | 42 | 71 | 0 |
| TOPIK-3 | 157 | 90 | 67 | 0 |
| TOPIK-4 | 32 | 4 | 28 | 0 |
| TOPIK-5 | 131 | 38 | 93 | 0 |
| TOPIK-6 | 29 | 1 | 28 | 0 |

## 2026-09-01 Bulk TOPIK-1/2 Expansion

- Scope: moved expansion from trial-sized draft intake to bulk intake plus automatic publishing for exact, field-complete entries.
- Raw entries before batch: 731.
- Raw entries after batch: 1231.
- New raw entries in this batch: 500.
- New approved entries in this batch: 500.
- Current published learning vocabulary: 1111 entries / 1150 senses.
- Remaining distance to 6000 entries: 4889.
- Bulk source: TOPIK I 1671 PDF candidate extraction plus KRDict exact-headword Chinese lookup.
- Bulk importer result: 500 imported, 239 skipped as already present, ambiguous, or not exact enough for automatic approval.
- New approved distribution: TOPIK-1 335, TOPIK-2 165.
- Current raw status: approved 1111, draft 120, needs_review 0.
- Current raw TOPIK distribution: TOPIK-1 603, TOPIK-2 302, TOPIK-3 142, TOPIK-4 24, TOPIK-5 131, TOPIK-6 29.
- Publication boundary: `data/vocabulary.json` publishes only approved entries and still skips the 120 existing draft entries.
- Duplicate lexicalEntryId: 0.
- Missing TOPIK level: 0.
- Missing romanization: 0.
- Missing glossZh: 0.
- Historical duplicate headword warnings in raw: 15.
- Collocation fallback-to-gloss rows: 0.
- Quality audit blocking failures: 0.
- Quality audit warnings: 1780.
- Reports: `artifacts/vocab-quality-expansion-bulk.json`, `artifacts/vocabulary-expansion-bulk-report.json`, and `artifacts/topik-i-candidates-report.json`.

### Collocation zh by TOPIK Level

| TOPIK | Total | With zh | Missing zh | Fallback to gloss |
|---|---:|---:|---:|---:|
| TOPIK-1 | 188 | 85 | 103 | 0 |
| TOPIK-2 | 113 | 42 | 71 | 0 |
| TOPIK-3 | 157 | 90 | 67 | 0 |
| TOPIK-4 | 32 | 4 | 28 | 0 |
| TOPIK-5 | 131 | 38 | 93 | 0 |
| TOPIK-6 | 29 | 1 | 28 | 0 |

## 2026-09-01 TOPIK-1/2 Collocation Batch and Expansion Intake

- Scope: continued the collocation meaning cleanup and started controlled TOPIK-1/2 expansion without UI changes.
- Collocation batch: added 101 verified phrase-level `collocationZh` values across 100 high-confidence TOPIK-1/2 phrase rows, marked `EDITORIAL_REVIEW`.
- Collocation publication rule: `collocation.zh` still publishes only from real phrase-level `collocationZh`; missing phrase meanings remain empty and never fallback to `sense.gloss`.
- Published collocations with Chinese phrase meaning: 260/650.
- Published collocations without Chinese phrase meaning: 390.
- Detected fallback-to-sense-gloss rows after regeneration: 0.
- Manual review queue: 390 rows.
- Expansion intake: imported 120 TOPIK-1/2 raw draft entries from the TOPIK I source list after KRDict exact-headword Chinese lookup; skipped 52 already-existing or non-exact candidates.
- Expansion status: 611 approved raw entries, 120 draft raw entries, 0 needs_review raw entries.
- Publication boundary: `data/vocabulary.json` still publishes only the 611 approved entries and skips 120 draft entries.
- Expansion draft distribution: TOPIK-1 81, TOPIK-2 39.
- Expansion audit: 0 missing TOPIK level, 0 missing romanization, 0 missing glossZh, 0 duplicate lexicalEntryId; 15 historical duplicate headword warnings remain in raw for later lexical identity cleanup.
- Blocking audit failures: 0.
- Non-blocking quality warnings: 780.
- Reports: `artifacts/vocab-quality-expansion-collocation.json`, `artifacts/vocabulary-expansion-import-report.json`, and `docs/collocation-manual-review-queue.md`.

### Collocation zh by TOPIK Level

| TOPIK | Total | With zh | Missing zh | Fallback to gloss |
|---|---:|---:|---:|---:|
| TOPIK-1 | 188 | 85 | 103 | 0 |
| TOPIK-2 | 113 | 42 | 71 | 0 |
| TOPIK-3 | 157 | 90 | 67 | 0 |
| TOPIK-4 | 32 | 4 | 28 | 0 |
| TOPIK-5 | 131 | 38 | 93 | 0 |
| TOPIK-6 | 29 | 1 | 28 | 0 |

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
## 2026-09-02 Mobile Navigation and Polysemy Regression Fix

- Scope: no vocabulary expansion and no new entries; this pass only verified the existing published vocabulary after mobile navigation, polysemy queue, and revealed-card mapping fixes.
- Published vocabulary: 4020 approved lexical entries and 4059 senses.
- Blocking audit failures: 0.
- Non-blocking warnings: 7438.
- Data guardrails confirmed: `data/vocabulary.json` still publishes only `approved` entries, `밥을` is absent from the published learning vocabulary, and collocation meaning fallback-to-gloss remains blocked by the audit.
- UI/data mapping note: revealed-card examples now require a real example source; missing examples are left empty instead of borrowing `sense.gloss`.

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
