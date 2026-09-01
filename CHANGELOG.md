# Changelog

All meaningful product, UI, data, and pipeline changes must be recorded here.

## 2026-09-01

- Bulk Vocabulary Expansion: extracted TOPIK I candidates from the source PDF, imported 500 KRDict exact-headword Chinese matches as approved TOPIK-1/2 entries, grew the published learning vocabulary from 611 to 1111 entries, kept the previous 120 drafts out of the frontend queue, preserved the no-fallback collocation rule, and fixed the visible Continue proxy so reveal cards advance during smoke validation.
- Vocabulary Expansion Intake: added 120 TOPIK-1/2 draft entries to `data/vocabulary.raw.json`, kept draft entries out of `data/vocabulary.json`, added the expansion importer, raw expansion audit checks, regenerated the collocation manual review queue after 101 TOPIK-1/2 editorial phrase-meaning fixes, and adjusted runtime collocation mapping to trust audited `collocation.zh` instead of hiding exact phrase translations that equal the sense gloss.
- Collocation Meaning Cleanup: removed the `sense.gloss` fallback from the vocabulary pipeline, applied 159 KRDict exact Chinese phrase meanings to `data/vocabulary.raw.json`, regenerated `data/vocabulary.json`, upgraded the quality audit with collocation-meaning fallback detection and TOPIK statistics, and added the manual review queue for unresolved collocations.

## 2026-08-30

- Card Hero Sync and Completion Slot Fix: kept sound-rule learning/review Hero typography identical between initial and revealed states, prevented revealed-card content overlap while preserving the fixed Continue rail, and placed the completed learning summary back in the study-card flow after learning controls.
- Reveal Density and Flow Fix: rebalanced sound-rule revealed-card block padding, moved the closed option-Korean control closer to the fixed Continue rail, expanded the option overlay upward without covering status/meta content, ordered option-map Korean above Chinese, and kept completed learning groups anchored in the study section.
- Review Card Content Polish: removed the review-initial bottom divider, collapsed the option-Korean control to a single 34px row when closed, changed the expanded option map into an upward overlay above the fixed Continue rail, and restored fuller revealed-card knowledge block padding for sound-rule cards.
- Card Footer Fix: split the v3 study/review card into Header, Hero/ContentArea, and fixed Footer rows, kept learning/review revealed Continue buttons on the same bottom rail, compacted the review option-Korean drawer without internal scrolling, reduced card header metadata to caption weight, and cache-busted the Layout System assets for Pages validation.
- Review Reveal Layout Fix: removed internal scrolling from the option-Korean drawer, kept sound-rule review cards at the fixed card height, and compacted the review reveal drawer into a complete 2x2 grid above the fixed Continue action.
- V2 Card Bugfix: constrained the review reveal option-Korean drawer inside the v3 card flow so sound-rule cards keep Continue visible and clickable, and restored the shared rounded button token for learning, shortcut, review, and Continue actions.
- Card Interaction Recovery: restored visible button affordance for learning actions, secondary direct reveal, review options, and Continue while keeping learning/review cards on the shared `kwf-card-v3` layout.
- Card Structure Recovery: rebuilt the visible study card shell for both initial and revealed states with ordered Header/Hero/Meta/Status/Information/Spacer/Footer regions, restoring learning actions, direct reveal, fixed-height parity, and a normal clickable Continue button.
- V2 Reveal Card Bugfix: attached the progress bar to the revealed card, restored fixed learning/reveal card height parity, kept Continue clickable through a React-safe proxy, and removed stale reveal shells after state changes.
- V2 Reveal Card Redesign: replaced the patched revealed-card view with a rebuilt `kwf-reveal-v2` Header/Hero/Knowledge/Action flow and moved Continue into the normal document flow.
- V2 Reveal Card Layout: rebuilt revealed study/review cards as a vertical flow layout so the hero, knowledge blocks, optional sound rules, answer map, and fixed Continue rail no longer overlap.
- V2 Card Layout: applied the reference-card vertical budget so revealed definition, example, collocation, and optional sound-rule sections share lightweight rounded blocks with one left baseline across desktop and mobile.
- V2 Card Reference Polish: restored definition and example to the main reading flow while keeping collocation and sound-rule content in lightweight rounded information blocks.
- V2 Card Information Hierarchy: aligned revealed-card block titles and body baselines, kept sound rules as optional independent blocks, and preserved the fixed Continue rail.
- V2 Card Block Layout: replaced revealed-card divider sections with lightweight rounded Information Blocks, kept Continue fixed, and filtered generated collocation-meaning fallbacks from card rendering.
- Added a read-only KRDict collocation coverage analyzer and recorded full-run coverage for future `collocationZh` repair planning without modifying vocabulary data.
- V2 Card Section Layout: organized revealed-card content into definition, example, collocation, optional sound-rule, option-map, and Continue sections with a shared centered content column and fixed section spacing.
- V2 Card Polish: unified revealed-card information block spacing and fixed collocation translation rendering to use the collocation's own Chinese meaning.
- V2 Card Spec: added four implementation-ready card specification diagrams and aligned learning/review card states to the unified reveal order, stable Continue action rail, and initial-state information rules.
- Sprint 4: cleared the remaining TOPIK-4, TOPIK-5, and TOPIK-6 romanization review queue, added conservative pronunciation/sound-rule updates, and upgraded selected examples, collocations, and source tier entries without touching UI.
- Sprint 3 Batch 3: cleared TOPIK-3 romanization review items and upgraded selected TOPIK-3 pronunciation, sound rules, examples, collocations, and source tier.
- Sprint 3 Batch 2: cleared all TOPIK-2 romanization review items, upgraded selected TOPIK-2 pronunciation/examples/collocations, and introduced tracked source tiers in the quality report.
- Sprint 3 Batch 1: normalized TOPIK-1 romanization, added verified pronunciation/sound-rule cleanup for 12 basic TOPIK-1 entries, and recorded the quality report summary.

## 2026-08-29

- UI Fix: rebuilt the learned-library Right Info Group so the favorite circle and memory state share one row and the next-review time sits directly below.
- Sprint 3: expanded vocabulary quality reports with review summaries by severity, reason, source, and TOPIK level for batch cleanup planning.
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
