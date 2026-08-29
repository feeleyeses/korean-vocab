# Changelog

All meaningful product, UI, data, and pipeline changes must be recorded here.

## 2026-08-29

- UI Fix: centered the learned-library favorite star inside its circular button and froze the learned row template after the final alignment audit.
- Sprint 3: started vocabulary quality infrastructure with aligned QualityScore schema fields, reportable quality audit output, and a documented human review/batch maintenance workflow.
- UI Fix: locked the learned-library row status column to a fixed favorite/state/next-review template and rebuilt the learned pager as a flex baseline row without changing typography or colors.
- UI Layout Rhythm: tightened global spacing tokens, compacted the study controls and learned drawer, restructured the polysemy intro/filter/footer rhythm, and fixed learned-row status time placement.
- UI Layout System: replaced section-specific width rules with one Content Safe Area token, aligned study/polysemy/review first-level modules to the same width, and added shared card/footer rhythm for the polysemy reference drawer.
- UI Fix: changed Continue to span the full initial three-button action group width, added review Hero bottom spacing, and locked review container width across learned-library expansion.
- UI Polish: added shared layout tokens for Hero left inset, filter title/chip baseline, learned-card vertical padding/alignment, and Primary CTA dimensions.
- Fixed memory Hero title alignment, learned-library filter group baseline alignment, learned-card vertical centering, and Continue button token reuse without changing home modules or interactions.
- UI Polish: unified study/review Primary CTA width so the revealed Continue button now uses the same fixed token as each initial action button instead of text-width sizing.
- Added desktop Hero single-line guards for the memory-profile and learned-library copy while preserving mobile responsive wrapping.
- Added a full-site UI consistency audit script and Pages workflow step for hover geometry, transition-property, and CLS checks across Desktop 1920 and Mobile 390.
- Sprint 2: migrated the production vocabulary out of the JavaScript bundle into `data/vocabulary.json`, loaded through the existing UI without changing the home screen or interactions.
- Added `data/vocabulary.schema.json`, `data/vocabulary.raw.json`, `scripts/extract-vocabulary-from-bundle.mjs`, and `scripts/vocab-pipeline.mjs` for the Raw -> Normalize -> Split Sense -> Pronunciation -> Romanization -> Collocation -> Quality Check -> Publish flow.
- Fixed study-card button geometry regression: initial action group is centered, the revealed Continue button keeps the same centerline with fixed width, and hover states cannot change size, spacing, weight, or transform.
- Removed historical UI patch assets (`ui-v3*`, `study-card-v2*`, `layout-v2*`, `stabilize.css`) so the mounted page keeps one active layout source.
- Expanded Playwright UI regression coverage to Desktop 1920 and Mobile 390 hover geometry, DOM/layout audit, and interaction checks.
- Established Sprint 1 cache-busted versioned Layout System entrypoint with a single CSS/runtime authority for study cards, review cards, and learned-library rows.
- Added canonical vocabulary model documentation for LexicalEntry, Sense, Example, Collocation, Pronunciation, and Quality Score.
- Added vocabulary intake pipeline and non-destructive quality audit for future entries.
- Updated browser smoke and regression checks to assert the unified layout authority after React redraws.
