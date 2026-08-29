# Bug Registry

Every bug fix must add or update a registry item before commit.

| ID | Status | Area | Summary | Guardrail |
| --- | --- | --- | --- | --- |
| BUG-2026-08-29-001 | Mitigated | Layout runtime | Multiple historical CSS/runtime files could compete over study/review/learned-card geometry after React redraws. | `assets/layout-system-v1a.css` and `assets/layout-system-v1a.js` are the only page-mounted Sprint 1 layout authority; tests assert `data-kwf-layout-authority="layout-system"`. |
| BUG-2026-08-29-002 | Guarded | Vocabulary data | Future duplicated headwords could be merged as false polysemy if identity is based only on display text. | `docs/vocabulary-model.md` requires `lexicalEntryId` ownership and sense-level IDs; `scripts/vocab-quality-audit.mjs` blocks invalid draft entries. |
| BUG-2026-08-29-003 | Fixed | DOM audit | Legacy `kwf-v2-*`/`kwf-v3-*` layout classes could remain in the DOM and obscure which system owns layout. | `assets/layout-system-v1a.js` removes legacy review-stack markers before applying `kwf-layout-review-stack`. |
