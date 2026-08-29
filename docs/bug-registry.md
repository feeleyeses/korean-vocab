# Bug Registry

Every bug fix must add or update a registry item before commit.

| ID | Status | Area | Summary | Guardrail |
| --- | --- | --- | --- | --- |
| BUG-2026-08-29-001 | Mitigated | Layout runtime | Multiple historical CSS/runtime files could compete over study/review/learned-card geometry after React redraws. | `assets/layout-system-v1a.css` and `assets/layout-system-v1a.js` are the only page-mounted Sprint 1 layout authority; tests assert `data-kwf-layout-authority="layout-system"`. |
| BUG-2026-08-29-002 | Guarded | Vocabulary data | Future duplicated headwords could be merged as false polysemy if identity is based only on display text. | `docs/vocabulary-model.md` requires `lexicalEntryId` ownership and sense-level IDs; `scripts/vocab-quality-audit.mjs` blocks invalid draft entries. |
| BUG-2026-08-29-003 | Fixed | DOM audit | Legacy `kwf-v2-*`/`kwf-v3-*` layout classes could remain in the DOM and obscure which system owns layout. | Historical `ui-v3*`, `study-card-v2*`, `layout-v2*`, and `stabilize.css` assets were deleted; active DOM uses `kwf-layout-review-stack` from the Layout System. |
| BUG-2026-08-29-004 | Fixed | Study card geometry | Initial learning buttons were not guarded as a centered group and the revealed Continue button could drift onto a different action rail. | `scripts/ui-regression.mjs` checks 1920 and 390 viewports for shared centerline, fixed Continue width, and hover-stable button geometry. |
| BUG-2026-08-29-005 | Fixed | Hover states | Button hover rules could animate or modify geometry-sensitive properties, causing visual flicker or layout shift. | Layout System restricts transitions to color, border color, shadow, and opacity; regression checks width, height, padding, margin, border, font weight, and transform before and after hover. |
