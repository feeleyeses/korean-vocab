const state = { enrichment: null, vocabulary: null, scheduled: false, rebuildingCard: false, answerMap: null };
const important = (el, prop, value) => el?.style?.setProperty(prop, value, 'important');
const txt = el => (el?.textContent || '').replace(/\s+/g, ' ').trim();

function injectPolishStyles() {
  document.querySelector('#kwf-layout-system-prev')?.remove();
  if (document.querySelector('#kwf-layout-system-runtime')) return;
  const style = document.createElement('style');
  style.id = 'kwf-layout-system-runtime';
  style.textContent = `
    :root { --kwf-card-h: 500px !important; --kwf-word-h: 136px !important; --kwf-content-safe-w: 1180px !important; --kwf-page-pad-x: max(24px, calc((100vw - var(--kwf-content-safe-w)) / 2)) !important; --kwf-section-gap: 22px !important; --kwf-card-gap: 12px !important; --kwf-card-pad: 16px !important; --kwf-footer-pad: 18px !important; --kwf-action-h: 52px !important; --kwf-action-x: 24px !important; --kwf-action-gap: 8px !important; --kwf-primary-action-w: 134px !important; --kwf-primary-action-group-w: calc((3 * var(--kwf-primary-action-w)) + (2 * var(--kwf-action-gap))) !important; --kwf-secondary-action-w: 168px !important; --kwf-review-action-w: 206px !important; --kwf-hero-x: var(--kwf-page-pad-x) !important; --kwf-hero-bottom-gap: 24px !important; --kwf-review-container-w: var(--kwf-content-safe-w) !important; --kwf-filter-title-h: 16px !important; --kwf-filter-chip-h: 32px !important; --kwf-card-vpad: 0px !important; --kwf-card-content-align: center !important; --kwf-card-v2-block-gap:4px!important; --kwf-card-v2-inner-gap:4px!important; --kwf-card-v2-answer-max-w:560px!important; --kwf-card-v2-title-font:700 12px/1.1 Arial,"Noto Sans KR","Microsoft YaHei",sans-serif!important; --kwf-card-v2-body-font:600 15px/1.1 Arial,"Noto Sans KR","Microsoft YaHei",sans-serif!important; --kwf-card-v2-support-font:600 12px/1.1 Arial,"Noto Sans KR","Microsoft YaHei",sans-serif!important; --kwf-card-v2-block-pad:4px 10px!important; --kwf-card-v2-block-radius:12px!important; --kwf-card-v2-block-bg:rgba(255,253,247,.74)!important; --kwf-card-v2-block-border:1px solid rgba(34,56,44,.08)!important; --kwf-card-v2-pronunciation-clearance:0px!important; }
    .hero,.study-wrap,.polysemy,.review-hub,#review.review-hub { padding-left:var(--kwf-hero-x)!important; padding-right:var(--kwf-hero-x)!important; }
    .study-wrap,.polysemy,.review-hub { display:flex!important; flex-direction:column!important; gap:var(--kwf-section-gap)!important; box-sizing:border-box!important; }
    .study-wrap>.section-heading,.study-wrap>.mode-switch,.study-wrap>.study-tools,.study-wrap>.deck-switch,.study-wrap>.level-selector,.study-wrap>.study-settings,.study-wrap>.unlock-panel,.study-wrap>.study-grid,.study-wrap>.session-summary,.polysemy>.section-heading,.polysemy>.poly-actions,.polysemy>#poly-reference,#review .review-title,#review .review-board,#review .kwf-layout-review-stack { box-sizing:border-box!important; width:100%!important; max-width:var(--kwf-content-safe-w)!important; margin-left:auto!important; margin-right:auto!important; margin-top:0!important; margin-bottom:0!important; }
    .study-wrap>.section-heading,.polysemy>.section-heading,#review .review-title { align-self:center!important; }
    .study-wrap>.level-selector{order:1!important}.study-wrap>.deck-switch{order:2!important}.study-wrap>.study-settings{order:3!important}.study-wrap>.mode-switch,.study-wrap>.study-tools{order:0!important}.study-wrap>.unlock-panel{order:4!important}.study-wrap>.study-grid,.study-wrap>.session-summary{order:5!important}
    .study-wrap>.deck-switch,.study-wrap>.level-selector,.study-wrap>.study-settings{margin-top:0!important;margin-bottom:0!important}
    .study-wrap>.study-settings{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto!important;align-items:center!important;gap:var(--kwf-card-gap)!important}
    .study-wrap>.study-settings>p{display:flex!important;align-items:center!important;align-self:stretch!important;margin:0!important;min-height:100%!important}
    .polysemy>.section-heading{display:grid!important;grid-template-columns:minmax(0,720px)!important;justify-content:start!important;align-items:start!important;gap:var(--kwf-space-2)!important}
    .polysemy>.section-heading>p{max-width:720px!important;margin:0!important}
    button,summary,a.mobile-tab { box-sizing:border-box!important; transform:none!important; transition-property:background-color,background,color,border-color,box-shadow,opacity!important; transition-duration:.18s!important; transition-timing-function:ease!important; }
    button:hover,summary:hover,a.mobile-tab:hover { transform:none!important; }
    #study #study-card.study-card { position:relative!important; border-radius:22px!important; padding:0 22px 18px!important; overflow:hidden!important; }
    #study #study-card .card-meta { flex:0 0 56px!important; height:56px!important; min-height:56px!important; max-height:56px!important; padding:12px 0 6px!important; }
    #study #study-card .word { padding:6px 0 4px!important; gap:6px!important; }
    #study #study-card .word h3 { font-size:clamp(52px,5vw,72px)!important; }
    #study #study-card .pronunciation-stack { gap:4px 14px!important; }

    /* Product rule: short interaction path. Keep action controls in one fixed rail. */
    #study .logic-panel ol>li:nth-child(3) { font-size:0!important; }
    #study .logic-panel ol>li:nth-child(3)>b { font-size:inherit!important; }
    #study .logic-panel ol>li:nth-child(3)::after { content:'判断后原位继续，尽量不移动鼠标'; font-size:14px; }

    #study #study-card .pre-answer { position:relative!important; display:flex!important; flex-direction:column!important; justify-content:center!important; align-items:stretch!important; padding:0 0 70px!important; margin:0!important; }
    #study #study-card .pre-answer>p { position:static!important; margin:0 auto 6px!important; line-height:1.35!important; text-align:center!important; }
    #study #study-card .pre-answer>.show-shortcut,
    #study #study-card .review-question>.show-shortcut { position:static!important; display:inline-flex!important; align-items:center!important; justify-content:center!important; align-self:center!important; width:var(--kwf-secondary-action-w)!important; min-width:var(--kwf-secondary-action-w)!important; max-width:var(--kwf-secondary-action-w)!important; height:34px!important; min-height:34px!important; max-height:34px!important; margin:0 auto!important; padding:0 14px!important; line-height:1.2!important; text-align:center!important; border-width:0!important; }
    #study #study-card .pre-answer>div { position:absolute!important; left:calc(50% - (var(--kwf-primary-action-group-w) / 2))!important; right:auto!important; bottom:0!important; display:grid!important; grid-template-columns:repeat(3,var(--kwf-primary-action-w))!important; gap:var(--kwf-action-gap)!important; width:var(--kwf-primary-action-group-w)!important; height:var(--kwf-action-h)!important; margin:0!important; padding:0!important; }
    #study #study-card .pre-answer>div>button { width:var(--kwf-primary-action-w)!important; min-width:var(--kwf-primary-action-w)!important; max-width:var(--kwf-primary-action-w)!important; height:var(--kwf-action-h)!important; min-height:var(--kwf-action-h)!important; max-height:var(--kwf-action-h)!important; margin:0!important; border-width:0!important; }

    #study #study-card .review-question { position:relative!important; justify-content:center!important; padding:0 0 126px!important; }
    #study #study-card .review-question>p { margin:0 0 6px!important; text-align:center!important; }
    #study #study-card .review-question>.show-shortcut { margin-bottom:10px!important; }
    #study #study-card .review-question>div { position:absolute!important; left:calc(50% - (((2 * var(--kwf-review-action-w)) + var(--kwf-action-gap)) / 2))!important; right:auto!important; bottom:0!important; display:grid!important; grid-template-columns:repeat(2,var(--kwf-review-action-w))!important; grid-template-rows:repeat(2,52px)!important; gap:8px var(--kwf-action-gap)!important; width:calc((2 * var(--kwf-review-action-w)) + var(--kwf-action-gap))!important; height:112px!important; margin:0!important; padding:0!important; }
    #study #study-card .review-question>div>button { width:var(--kwf-review-action-w)!important; min-width:var(--kwf-review-action-w)!important; max-width:var(--kwf-review-action-w)!important; height:52px!important; min-height:52px!important; max-height:52px!important; margin:0!important; text-align:center!important; border-width:1px!important; }

    #study #study-card .answer,#study #study-card .compact-answer { position:static!important; padding:0 0 70px!important; margin:0!important; justify-content:flex-start!important; }
    #study #study-card .answer-scroll { gap:var(--kwf-card-v2-block-gap)!important; padding:var(--kwf-card-v2-pronunciation-clearance) 8px calc(var(--kwf-action-h) + 28px)!important; overflow:visible!important; justify-content:flex-start!important; align-items:center!important; }
    #study #study-card.review-mode.revealed .answer-scroll { padding-top:0!important; padding-bottom:0!important; }
    #study #study-card .answer-scroll>.kwf-v2-status,#study #study-card .answer-scroll>section,#study #study-card details.answer-map { width:min(100%,var(--kwf-card-v2-answer-max-w))!important; margin-left:auto!important; margin-right:auto!important; }
    #study #study-card .answer-scroll>.kwf-v2-status { padding:0!important; border:0!important; background:transparent!important; font:var(--kwf-card-v2-support-font)!important; }
    #study #study-card .answer-scroll>section { box-sizing:border-box!important; display:grid!important; gap:var(--kwf-card-v2-inner-gap)!important; width:min(100%,var(--kwf-card-v2-answer-max-w))!important; margin-left:auto!important; margin-right:auto!important; }
    #study #study-card .answer-scroll>.kwf-v2-definition,#study #study-card .answer-scroll>.kwf-v2-example,#study #study-card .answer-scroll>.kwf-v2-collocation,#study #study-card .answer-scroll>.kwf-v2-sound-rule { justify-items:stretch!important; padding:var(--kwf-card-v2-block-pad)!important; border:var(--kwf-card-v2-block-border)!important; border-radius:var(--kwf-card-v2-block-radius)!important; background:var(--kwf-card-v2-block-bg)!important; box-shadow:none!important; }
    #study #study-card .answer-scroll>.kwf-v2-definition::before { content:'释义'; display:block!important; text-align:left!important; font:var(--kwf-card-v2-title-font)!important; margin:0!important; color:rgba(34,56,44,.72)!important; }
    #study #study-card details.answer-map { padding:0!important; border:0!important; }
    #study #study-card .answer-scroll .chosen-answer { display:none!important; }
    #study #study-card .answer-scroll h4 { width:100%!important; text-align:left!important; font:var(--kwf-card-v2-body-font)!important; margin:0 auto!important; }
    #study #study-card .answer-scroll section>b { display:block!important; text-align:left!important; font:var(--kwf-card-v2-title-font)!important; margin:0!important; color:rgba(34,56,44,.72)!important; }
    #study #study-card .answer-scroll :is(.kwf-v2-example,.kwf-v2-collocation,.kwf-v2-sound-rule)>:is(p,small) { width:100%!important; text-align:left!important; margin:0 auto!important; font:var(--kwf-card-v2-body-font)!important; }
    #study #study-card .answer-scroll .kwf-v2-collocation>small,#study #study-card .answer-scroll .sentence+p,#study #study-card .answer-map>summary,#study #study-card .pronunciation-stack,#study #study-card .answer-scroll>.kwf-v2-status { font:var(--kwf-card-v2-support-font)!important; }
    #study #study-card .answer-scroll .kwf-v2-collocation>small:empty { display:none!important; }
    #study #study-card .answer-scroll .sentence { font:var(--kwf-card-v2-body-font)!important; }
    #study #study-card .answer-scroll aside { display:none!important; }
    #study #study-card :is(button,summary) { box-sizing:border-box!important; font:700 14px/1.2 Arial,"Noto Sans KR","Microsoft YaHei",sans-serif!important; transition-property:background-color,color,border-color,box-shadow,opacity!important; transition-duration:.18s!important; transition-timing-function:ease!important; }
    #study #study-card :is(button,summary):hover { transform:none!important; }
    #study #study-card .continue { --kwf-continue-w:var(--kwf-primary-action-group-w); position:absolute!important; left:calc(50% - (var(--kwf-continue-w) / 2))!important; right:auto!important; bottom:18px!important; width:var(--kwf-continue-w)!important; min-width:var(--kwf-continue-w)!important; max-width:var(--kwf-continue-w)!important; height:var(--kwf-action-h)!important; min-height:var(--kwf-action-h)!important; max-height:var(--kwf-action-h)!important; margin:0!important; padding:0 18px!important; z-index:30!important; border-width:0!important; }
    #study #study-card.study-card.revealed { height:var(--kwf-card-h)!important; min-height:var(--kwf-card-h)!important; max-height:var(--kwf-card-h)!important; padding-bottom:0!important; overflow:hidden!important; }
    #study #study-card.study-card.revealed .card-meta { flex:0 0 auto!important; height:auto!important; min-height:0!important; max-height:none!important; padding:12px 0 6px!important; }
    #study #study-card.study-card.revealed .word { flex:0 0 auto!important; display:flex!important; flex-direction:column!important; place-items:center!important; height:auto!important; min-height:0!important; max-height:none!important; padding:6px 0 8px!important; gap:6px!important; overflow:visible!important; }
    #study #study-card.study-card.revealed .word h3 { font-size:clamp(48px,4.5vw,70px)!important; line-height:1.02!important; }
    #study #study-card.study-card.revealed .pronunciation-stack { position:static!important; display:flex!important; flex-wrap:wrap!important; justify-content:center!important; align-items:center!important; gap:4px 12px!important; width:min(100%,var(--kwf-card-v2-answer-max-w))!important; margin:0 auto!important; }
    #study #study-card.study-card.revealed .pronunciation-stack .sound-rule { flex:0 0 100%!important; justify-content:center!important; }
    #study #study-card.study-card.revealed .word .kwf-v2-status { position:static!important; display:inline-flex!important; align-items:center!important; justify-content:center!important; gap:8px!important; width:auto!important; margin:0 auto!important; padding:0!important; border:0!important; background:transparent!important; font:var(--kwf-card-v2-support-font)!important; text-align:center!important; }
    #study #study-card.study-card.revealed .answer,#study #study-card.study-card.revealed .compact-answer { flex:0 0 auto!important; display:flex!important; flex-direction:column!important; height:auto!important; min-height:0!important; max-height:none!important; padding:0!important; overflow:visible!important; }
    #study #study-card.study-card.revealed .answer-scroll { flex:0 0 auto!important; display:flex!important; flex-direction:column!important; align-items:center!important; justify-content:flex-start!important; gap:var(--kwf-card-v2-block-gap)!important; width:100%!important; height:auto!important; min-height:0!important; max-height:none!important; padding:0 10px!important; overflow:visible!important; }
    #study #study-card.study-card.revealed .answer-scroll>.kwf-v2-status { display:none!important; }
    #study #study-card.study-card.revealed .answer-map[open] { position:static!important; inset:auto!important; display:grid!important; grid-template-rows:auto auto!important; width:min(100%,var(--kwf-card-v2-answer-max-w))!important; height:auto!important; min-height:0!important; max-height:none!important; margin:8px auto 0!important; overflow:visible!important; z-index:auto!important; transform:none!important; translate:none!important; }
    #study #study-card.study-card.revealed .answer-map[open]>summary { flex:0 0 auto!important; height:34px!important; min-height:34px!important; max-height:none!important; }
    #study #study-card.study-card.revealed .answer-map[open] .option-map-list { display:grid!important; grid-template-columns:repeat(2,minmax(0,1fr))!important; grid-template-rows:none!important; height:auto!important; min-height:0!important; max-height:none!important; overflow:visible!important; }
    #study #study-card .fuzzy-correction { margin:2px auto!important; min-height:32px!important; }

    #study #study-card details.answer-map { box-sizing:border-box!important; position:static!important; width:min(100%,500px)!important; margin:2px auto 0!important; padding:0!important; border:1px solid rgba(18,49,38,.14)!important; border-radius:12px!important; background:#fffdf7!important; opacity:1!important; overflow:hidden!important; }
    #study #study-card details.answer-map>summary { list-style:none!important; cursor:pointer!important; display:flex!important; align-items:center!important; justify-content:center!important; height:34px!important; min-height:34px!important; margin:0!important; padding:0 12px!important; font-size:13px!important; line-height:1!important; text-align:center!important; text-decoration:none!important; background:#fffdf7!important; }
    #study #study-card details.answer-map>summary::-webkit-details-marker { display:none!important; }
    #study #study-card details.answer-map>summary::after { content:'⌄'; margin-left:7px; opacity:.55; }
    #study #study-card details.answer-map[open]>summary::after { content:'⌃'; }

    /* Open state replaces only the answer body, never the fixed action rail. */
    #study #study-card details.answer-map[open] { position:absolute!important; left:22px!important; right:22px!important; top:238px!important; bottom:82px!important; z-index:20!important; display:flex!important; flex-direction:column!important; width:auto!important; margin:0!important; border:1px solid rgba(18,49,38,.18)!important; border-radius:14px!important; background:#fffdf7!important; opacity:1!important; overflow:hidden!important; box-shadow:0 8px 24px rgba(18,49,38,.08)!important; }
    #study #study-card details.answer-map[open]>summary { flex:0 0 36px!important; height:36px!important; min-height:36px!important; max-height:36px!important; border-bottom:1px solid rgba(18,49,38,.12)!important; }
    #study #study-card .option-map-list { flex:1 1 0!important; display:grid!important; grid-template-columns:repeat(2,minmax(0,1fr))!important; grid-template-rows:repeat(2,minmax(0,1fr))!important; gap:8px!important; width:100%!important; height:auto!important; min-height:0!important; max-height:none!important; margin:0!important; padding:8px!important; overflow:hidden!important; }
    #study #study-card .option-map-list article { box-sizing:border-box!important; display:grid!important; place-content:center!important; min-width:0!important; min-height:0!important; height:auto!important; margin:0!important; padding:8px 10px!important; gap:4px!important; border-radius:11px!important; overflow:hidden!important; text-align:center!important; }
    #study #study-card .option-map-list article b { font-size:14px!important; line-height:1.25!important; }
    #study #study-card .option-map-list article span { font-size:20px!important; line-height:1.2!important; font-weight:700!important; }
    #study #study-card .option-map-list article small,#study #study-card .answer-map>small { display:none!important; }
    #review { --kwf-layout-lock-w:min(var(--kwf-review-container-w), 100%)!important; }
    #review .review-title { margin-bottom:var(--kwf-hero-bottom-gap)!important; }
    #review .review-board,#review .kwf-layout-review-stack { width:var(--kwf-layout-lock-w)!important; max-width:var(--kwf-review-container-w)!important; margin-left:auto!important; margin-right:auto!important; }
    #review .review-module-grid,#review .review-stat.learned-stat,#review .memory-profile,#review .memory-note,#review #learned-library-section { box-sizing:border-box!important; width:100%!important; max-width:100%!important; }
    #learned-library-section { box-sizing:border-box!important; left:auto!important; right:auto!important; transform:none!important; translate:none!important; width:100%!important; max-width:var(--kwf-content-safe-w)!important; margin-left:auto!important; margin-right:auto!important; }
    #learned-panel.open { padding:var(--kwf-card-pad)!important; }
    .polysemy>.poly-actions,.polysemy>#poly-reference { align-self:center!important; }
    #poly-reference { box-sizing:border-box!important; overflow:hidden!important; }
    #poly-reference[open] { padding-bottom:var(--kwf-footer-pad)!important; }
    #poly-reference summary { box-sizing:border-box!important; padding-left:var(--kwf-card-pad)!important; padding-right:var(--kwf-card-pad)!important; }
    #poly-reference .kwf-poly-ref-controls { box-sizing:border-box!important; display:grid!important; grid-template-columns:repeat(2,minmax(0,1fr))!important; align-items:start!important; gap:var(--kwf-card-gap)!important; padding:var(--kwf-card-pad) var(--kwf-card-pad) var(--kwf-space-4)!important; margin:0!important; }
    #poly-reference .kwf-poly-ref-controls>div { box-sizing:border-box!important; display:flex!important; flex-wrap:wrap!important; align-items:start!important; align-content:start!important; gap:6px!important; margin:0!important; padding:0!important; }
    #poly-reference .kwf-poly-ref-controls>div>span { display:flex!important; align-items:baseline!important; flex:0 0 100%!important; height:var(--kwf-filter-title-h)!important; min-height:var(--kwf-filter-title-h)!important; max-height:var(--kwf-filter-title-h)!important; line-height:var(--kwf-filter-title-h)!important; margin:0!important; }
    #poly-reference .kwf-poly-ref-controls button { display:inline-flex!important; align-items:center!important; justify-content:center!important; height:var(--kwf-filter-chip-h)!important; min-height:var(--kwf-filter-chip-h)!important; max-height:var(--kwf-filter-chip-h)!important; padding:0 12px!important; line-height:1!important; margin:0!important; }
    #poly-reference .kwf-poly-ref-list { box-sizing:border-box!important; width:100%!important; padding-left:var(--kwf-card-pad)!important; padding-right:var(--kwf-card-pad)!important; margin:0!important; }
    #poly-reference .kwf-poly-ref-bottom { box-sizing:border-box!important; display:flex!important; align-items:center!important; justify-content:space-between!important; gap:var(--kwf-card-gap)!important; width:100%!important; margin:0!important; padding:var(--kwf-space-4) var(--kwf-card-pad) var(--kwf-footer-pad)!important; }
    #poly-reference .kwf-poly-ref-bottom>div { display:flex!important; flex-wrap:wrap!important; justify-content:flex-end!important; gap:8px!important; }
    @media(min-width:1200px){ #review .review-title { width:100%!important; max-width:none!important; margin-left:0!important; margin-right:0!important; } }
    #learned-library-section .kwf-learned-control { align-items:start!important; }
    #learned-library-section .learned-filters,#learned-library-section .learned-sort { display:flex!important; flex-wrap:wrap!important; align-items:start!important; align-content:start!important; gap:6px!important; margin:0!important; padding:0!important; }
    #learned-library-section .learned-filters>span,#learned-library-section .learned-sort>span { display:flex!important; align-items:baseline!important; flex:0 0 100%!important; height:var(--kwf-filter-title-h)!important; min-height:var(--kwf-filter-title-h)!important; max-height:var(--kwf-filter-title-h)!important; margin:0!important; line-height:var(--kwf-filter-title-h)!important; }
    #learned-library-section .learned-drawer-head { padding:var(--kwf-space-4) var(--kwf-card-pad) var(--kwf-space-2)!important; gap:var(--kwf-card-gap)!important; }
    #learned-library-section .kwf-learned-control { gap:var(--kwf-card-gap)!important; padding:var(--kwf-space-3) var(--kwf-card-pad)!important; }
    #learned-library-section .learned-filters button,#learned-library-section .learned-sort button { display:inline-flex!important; align-items:center!important; justify-content:center!important; height:var(--kwf-filter-chip-h)!important; min-height:var(--kwf-filter-chip-h)!important; max-height:var(--kwf-filter-chip-h)!important; padding:0 10px!important; line-height:1!important; margin:0!important; }
    #learned-library-section .kwf-learned-pager { box-sizing:border-box!important; display:flex!important; align-items:center!important; justify-content:space-between!important; gap:var(--kwf-card-gap)!important; min-height:46px!important; height:46px!important; padding:var(--kwf-space-2) var(--kwf-card-pad)!important; margin:0!important; line-height:1!important; }
    #learned-library-section .kwf-learned-pager>* { display:inline-flex!important; align-items:center!important; min-height:30px!important; margin:0!important; line-height:1!important; }
    #learned-library-section .kwf-learned-pager>div,#learned-library-section .kwf-learned-pager [class*="action"],#learned-library-section .kwf-learned-pager [class*="button"] { display:inline-flex!important; align-items:center!important; justify-content:flex-end!important; gap:var(--kwf-card-gap)!important; }
    #learned-library-section .kwf-learned-pager button { display:inline-flex!important; align-items:center!important; justify-content:center!important; height:30px!important; min-height:30px!important; max-height:30px!important; line-height:1!important; }
    #learned-library-section .kwf-learned-list { gap:var(--kwf-card-gap)!important; padding-left:var(--kwf-card-pad)!important; padding-right:var(--kwf-card-pad)!important; padding-bottom:var(--kwf-card-pad)!important; }
    #learned-library-section .kwf-learned-row { align-items:center!important; padding:var(--kwf-card-vpad) var(--kwf-card-pad)!important; }
    #learned-library-section .kwf-learned-row>* { align-self:center!important; align-items:var(--kwf-card-content-align)!important; margin:0!important; }
    #learned-library-section .learned-word-status { box-sizing:border-box!important; display:grid!important; grid-template-columns:42px 54px!important; grid-template-rows:42px 18px!important; justify-content:center!important; align-content:center!important; justify-items:center!important; align-items:center!important; gap:6px 8px!important; width:180px!important; min-width:180px!important; max-width:180px!important; }
    #learned-library-section .learned-word-status .favorite-chip{display:grid!important;grid-row:1!important;grid-column:1!important;place-items:center!important;justify-self:center!important;align-self:center!important;line-height:1!important;text-align:center!important;transform:none!important;translate:none!important}#learned-library-section .learned-word-status mark{grid-row:1!important;grid-column:2!important;justify-self:center!important;align-self:center!important;min-width:54px!important;text-align:center!important;white-space:nowrap!important}#learned-library-section .learned-word-status small{grid-row:2!important;grid-column:1/3!important;align-self:center!important;justify-self:center!important;white-space:nowrap!important;text-align:center!important}

    @media(max-width:900px){
      :root { --kwf-card-h:500px!important; --kwf-word-h:132px!important; --kwf-action-h:50px!important; --kwf-action-x:14px!important; --kwf-primary-action-w:102px!important; --kwf-primary-action-group-w:calc((3 * var(--kwf-primary-action-w)) + (2 * var(--kwf-action-gap)))!important; --kwf-secondary-action-w:154px!important; --kwf-review-action-w:158px!important; }
      #study #study-card.study-card { padding:0 14px 14px!important; }
      #study #study-card .word h3 { font-size:clamp(48px,14vw,64px)!important; }
      #study #study-card .review-question>div { grid-template-rows:repeat(2,48px)!important; height:104px!important; }
      #study #study-card .review-question>div>button { height:48px!important; min-height:48px!important; max-height:48px!important; }
      #study #study-card .continue { bottom:14px!important; }
      #study #study-card details.answer-map[open] { left:14px!important; right:14px!important; top:224px!important; bottom:76px!important; }
      #study #study-card .option-map-list article b { font-size:13px!important; }
      #study #study-card .option-map-list article span { font-size:18px!important; }
    }
  `;
  document.head.appendChild(style);
}

async function enrichment(){ if(state.enrichment)return state.enrichment; try{const r=await fetch('data/enrichment.json',{cache:'no-store'});state.enrichment=r.ok?await r.json():{entries:{}};}catch{state.enrichment={entries:{}};} return state.enrichment; }
async function vocabulary(){ if(state.vocabulary)return state.vocabulary; try{const r=await fetch('data/vocabulary.json',{cache:'no-store'});state.vocabulary=r.ok?await r.json():{entries:[]};}catch{state.vocabulary={entries:[]};} return state.vocabulary; }
function hideMisplacedPlacement(){ const study=document.querySelector('#study'); if(!study)return; for(const label of [...study.querySelectorAll('span,p,div,small')].filter(x=>txt(x)==='选择备考起点')){let node=label;for(let i=0;node&&i<6;i++,node=node.parentElement){const t=txt(node);if((t.includes('从初级 1 开始')||t.includes('定位测验'))&&t.length<480){node.classList.add('kwf-layout-placement-misplaced');break;}}} }

function normalizeCard(){
  const card=document.querySelector('#study-card.study-card'); if(!card)return;
  const mobile=matchMedia('(max-width:900px)').matches, cardH='500px', wordH=mobile?'132px':'136px', actionH=mobile?'50px':'52px', actionX=mobile?'14px':'24px', actionGap='8px', primaryActionW=mobile?'102px':'134px', secondaryActionW=mobile?'154px':'168px', reviewActionW=mobile?'158px':'206px', preActionGroupW=`calc((3 * ${primaryActionW}) + (2 * ${actionGap}))`, continueW=preActionGroupW, reviewActionGroupW=`calc((2 * ${reviewActionW}) + ${actionGap})`;
  const revealed=Boolean(card.querySelector('.answer,.compact-answer,.answer-scroll')), review=Boolean(card.querySelector('.review-question'))||/review-mode/.test(card.className);
  card.dataset.kwfLayoutSystem='layout-v1';card.dataset.kwfLayoutAuthority='layout-system'; card.dataset.kwfState=revealed?'revealed':'initial'; card.dataset.kwfMode=review?'review':'learn';
  for(const [p,v] of [['--kwf-card-h',cardH],['--kwf-action-h',actionH],['--kwf-action-x',actionX],['--kwf-action-gap',actionGap],['--kwf-primary-action-w',primaryActionW],['--kwf-primary-action-group-w',preActionGroupW],['--kwf-secondary-action-w',secondaryActionW],['--kwf-review-action-w',reviewActionW]])card.style.setProperty(p,v,'important');
  if(!revealed){
    card.classList.remove('kwf-reveal-v2-card');
    card.querySelector(':scope > .kwf-reveal-v2')?.remove();
    if(!card.classList.contains('kwf-card-v3-card'))for(const old of card.querySelectorAll(':scope > .card-meta,:scope > .word,:scope > .answer,:scope > .compact-answer'))important(old,'display','');
    for(const stale of card.querySelectorAll(':scope > .word > .kwf-v2-status'))important(stale,'display','none');
  }
  if(revealed){
    for(const [p,v] of [['position','relative'],['overflow','visible'],['display','flex'],['flex-direction','column'],['height','auto'],['min-height',cardH],['max-height','none'],['padding-bottom',`calc(${actionH} + ${mobile?'14px':'18px'} + 18px)`]])important(card,p,v);
  }else{
    for(const [p,v] of [['position','relative'],['overflow','hidden'],['display','flex'],['flex-direction','column'],['height',cardH],['min-height',cardH],['max-height',cardH]])important(card,p,v);
  }
  const meta=card.querySelector('.card-meta'); if(meta)for(const [p,v] of revealed?[['flex','0 0 auto'],['height','auto'],['min-height','0'],['max-height','none'],['padding','12px 0 6px']]:[['flex','0 0 56px'],['height','56px'],['min-height','56px'],['max-height','56px']])important(meta,p,v);
  const word=card.querySelector('.word'); if(word){
    for(const [p,v] of revealed?[['position','static'],['inset','auto'],['transform','none'],['translate','none'],['flex','0 0 auto'],['display','flex'],['flex-direction','column'],['height','auto'],['min-height','0'],['max-height','none'],['padding','6px 0 8px'],['gap','6px'],['margin','0'],['overflow','visible']]:[['position','static'],['inset','auto'],['transform','none'],['translate','none'],['flex',`0 0 ${wordH}`],['height',wordH],['min-height',wordH],['max-height',wordH],['margin','0']])important(word,p,v);
  }
  for(const el of card.querySelectorAll('.pronunciation-stack,.sentence')){important(el,'position','static');important(el,'inset','auto');important(el,'transform','none');important(el,'translate','none');}
  const pre=card.querySelector('.pre-answer'); if(pre){for(const [p,v] of [['position','relative'],['flex','1 1 0'],['height','auto'],['min-height','0'],['max-height','none']])important(pre,p,v);const shortcut=pre.querySelector(':scope>.show-shortcut');if(shortcut)for(const [p,v] of [['position','static'],['align-self','center'],['width',secondaryActionW],['min-width',secondaryActionW],['max-width',secondaryActionW],['height','34px'],['min-height','34px'],['max-height','34px'],['padding','0 14px'],['border-width','0'],['transform','none'],['translate','none'],['margin-left','auto'],['margin-right','auto']])important(shortcut,p,v);const grid=pre.querySelector(':scope>div');if(grid){for(const [p,v] of [['box-sizing','border-box'],['position','absolute'],['left',`calc(50% - (${preActionGroupW} / 2))`],['right','auto'],['bottom','0'],['width',preActionGroupW],['min-width',preActionGroupW],['max-width',preActionGroupW],['height',actionH],['display','grid'],['grid-template-columns',`repeat(3,${primaryActionW})`],['gap',actionGap],['transform','none'],['translate','none'],['margin','0'],['padding','0']])important(grid,p,v);for(const b of grid.querySelectorAll(':scope>button'))for(const [p,v] of [['box-sizing','border-box'],['display','flex'],['align-items','center'],['justify-content','center'],['width',primaryActionW],['min-width',primaryActionW],['max-width',primaryActionW],['height',actionH],['min-height',actionH],['max-height',actionH],['margin','0'],['padding','0 14px'],['border-width','0'],['transform','none'],['translate','none']])important(b,p,v);}}
  for(const answer of card.querySelectorAll('.answer,.compact-answer'))for(const [p,v] of [['position','static'],['flex',revealed?'0 0 auto':'1 1 0'],['display','flex'],['flex-direction','column'],['height','auto'],['min-height','0'],['max-height','none'],['padding',revealed?'0':'0 0 70px'],['margin','0'],['overflow','visible']])important(answer,p,v);
  for(const scroll of card.querySelectorAll('.answer-scroll'))for(const [p,v] of [['position','static'],['flex','0 0 auto'],['height','auto'],['min-height','0'],['max-height','none'],['padding',revealed?'0 10px':''],['overflow','visible']])important(scroll,p,v);
  for(const el of card.querySelectorAll('.answer *, .compact-answer *, .answer-scroll *'))if(!el.closest('.kwf-v2-definition,.kwf-v2-example,.kwf-v2-collocation,.kwf-v2-sound-rule'))important(el,'text-align','center');
  for(const el of card.querySelectorAll('.kwf-v2-definition>h4,.kwf-v2-example>p,.kwf-v2-collocation>p,.kwf-v2-collocation>small,.kwf-v2-sound-rule>p'))important(el,'text-align','left');
  const cont=card.querySelector('.answer .continue,.compact-answer .continue'); if(cont){if(txt(cont)!=='继续')cont.textContent='继续';for(const [p,v] of [['box-sizing','border-box'],['position','absolute'],['left',`calc(50% - (${continueW} / 2))`],['right','auto'],['bottom',mobile?'14px':'18px'],['width',continueW],['min-width',continueW],['max-width',continueW],['height',actionH],['min-height',actionH],['max-height',actionH],['margin','0'],['border-width','0'],['z-index','30'],['transform','none'],['translate','none']])important(cont,p,v);}
  const map=card.querySelector('details.answer-map');
  if(map){
    const summary=map.querySelector(':scope>summary'), list=map.querySelector('.option-map-list');
    const closedBottom=mobile?'76px':'82px', openBottom=mobile?'76px':'82px', openH=mobile?'204px':'212px';
    if(!map.open){
      for(const [p,v] of [['box-sizing','border-box'],['position','static'],['left','auto'],['right','auto'],['bottom','auto'],['top','auto'],['width','min(100%,560px)'],['min-width','0'],['max-width','100%'],['height','20px'],['min-height','20px'],['max-height','20px'],['margin','2px auto 0'],['padding','0 0 2px'],['overflow','hidden'],['z-index','20'],['background','#fffdf7'],['transform','none'],['translate','none']])important(map,p,v);
    }else{
      for(const [p,v] of [['box-sizing','border-box'],['position','static'],['left','auto'],['right','auto'],['top','auto'],['bottom','auto'],['width','min(100%,560px)'],['min-width','0'],['max-width','100%'],['height','auto'],['min-height','0'],['max-height','none'],['margin','8px auto 0'],['padding','0'],['display','grid'],['grid-template-rows','auto auto'],['overflow','visible'],['z-index','auto'],['opacity','1'],['background','#fffdf7'],['border-radius','14px'],['transform','none'],['translate','none']])important(map,p,v);
    }
    if(summary)for(const [p,v] of [['box-sizing','border-box'],['height',map.open?'36px':'20px'],['min-height',map.open?'36px':'20px'],['max-height',map.open?'36px':'20px'],['display','flex'],['align-items','center'],['justify-content','center'],['margin','0'],['padding','0 12px']])important(summary,p,v);
    if(list){
      for(const [p,v] of [['box-sizing','border-box'],['display',map.open?'grid':'none'],['grid-template-columns','repeat(2,minmax(0,1fr))'],['grid-template-rows',map.open?'none':'repeat(2,minmax(0,1fr))'],['gap','8px'],['width','100%'],['min-width','0'],['max-width','100%'],['height',map.open?'auto':'100%'],['min-height','0'],['max-height',map.open?'none':'100%'],['padding','8px'],['margin','0'],['overflow',map.open?'visible':'hidden'],['grid-row','2']])important(list,p,v);
      for(const a of list.querySelectorAll(':scope>article'))for(const [p,v] of [['box-sizing','border-box'],['display','grid'],['place-content','center'],['visibility','visible'],['opacity','1'],['width','100%'],['min-width','0'],['max-width','100%'],['height',map.open?'auto':'100%'],['min-height','0'],['max-height',map.open?'none':'100%'],['overflow',map.open?'visible':'hidden'],['margin','0'],['padding',mobile?'6px 8px':'8px 10px'],['text-align','center'],['transform','none'],['translate','none']])important(a,p,v);
    }
  }
  const question=card.querySelector('.review-question'); if(question){for(const [p,v] of [['position','relative'],['flex','1 1 0'],['height','auto'],['min-height','0'],['max-height','none'],['overflow','visible']])important(question,p,v);const shortcut=question.querySelector(':scope>.show-shortcut');if(shortcut)for(const [p,v] of [['position','static'],['align-self','center'],['width',secondaryActionW],['min-width',secondaryActionW],['max-width',secondaryActionW],['height','34px'],['min-height','34px'],['max-height','34px'],['padding','0 14px'],['border-width','0'],['transform','none'],['translate','none'],['margin-left','auto'],['margin-right','auto']])important(shortcut,p,v);const grid=question.querySelector(':scope>div');if(grid){for(const [p,v] of [['box-sizing','border-box'],['position','absolute'],['left',`calc(50% - (${reviewActionGroupW} / 2))`],['right','auto'],['bottom','0'],['width',reviewActionGroupW],['min-width',reviewActionGroupW],['max-width',reviewActionGroupW],['display','grid'],['grid-template-columns',`repeat(2,${reviewActionW})`],['grid-template-rows',mobile?'repeat(2,48px)':'repeat(2,52px)'],['gap',`8px ${actionGap}`],['height',mobile?'104px':'112px'],['transform','none'],['translate','none'],['margin','0'],['padding','0']])important(grid,p,v);for(const b of grid.querySelectorAll(':scope>button'))for(const [p,v] of [['box-sizing','border-box'],['display','flex'],['align-items','center'],['justify-content','center'],['width',reviewActionW],['min-width',reviewActionW],['max-width',reviewActionW],['height',mobile?'48px':'52px'],['min-height',mobile?'48px':'52px'],['max-height',mobile?'48px':'52px'],['margin','0'],['padding','0 14px'],['border-width','1px'],['transform','none'],['translate','none']])important(b,p,v);}}
}
async function enhanceRevealData(){
  const card=document.querySelector('#study-card.study-card.revealed'); if(!card)return;
  const headword=txt(card.querySelector('.word h3')); if(!headword)return;
  const data=await vocabulary();
  const entry=data.entries?.find(e=>e.headword===headword); if(!entry)return;
  const collocations=(entry.senses||[]).flatMap(s=>(s.collocations||[]).map(c=>({...c,zh:c?.zh||''}))).filter(c=>c?.ko);
  const block=card.querySelector('.kwf-v2-collocation'); if(!block||!collocations.length)return;
  const signature=collocations.map(c=>`${c.ko}\u0000${c.zh||''}`).join('\u0001');
  if(block.dataset.kwfCollocationSignature===signature)return;
  block.dataset.kwfCollocationSignature=signature;
  const title=document.createElement('b'); title.textContent='固定搭配';
  block.replaceChildren(title,...collocations.flatMap(c=>{
    const ko=document.createElement('p'); ko.textContent=`• ${c.ko}`;
    if(!c.zh)return [ko];
    const zh=document.createElement('small'); zh.textContent=c.zh;
    return [ko,zh];
  }));
}
function cloneInto(tag, className, source){
  const el=document.createElement(tag); if(className)el.className=className;
  if(source)el.innerHTML=source.innerHTML;
  return el;
}
function cloneDetails(source,key=''){
  const clone=document.createElement('section');
  clone.className='answer-map kwf-card-v3-answer-map';
  const toggle=document.createElement('button');
  toggle.type='button';
  toggle.className='kwf-card-v3-answer-map-toggle';
  toggle.textContent=txt(source.querySelector(':scope > summary'))||'查看选项对应韩文';
  const list=source.querySelector('.option-map-list')?.cloneNode(true);
  list?.querySelectorAll('small').forEach(el=>el.remove());
  if(list)clone.append(toggle,list); else clone.append(toggle);
  const setOpen=open=>{
    state.answerMap={key,open};
    clone.classList.toggle('is-open',open);
    toggle.setAttribute('aria-expanded',String(open));
    if(list)list.hidden=!open;
    normalizeAnswerMapClone(clone);
  };
  toggle.addEventListener('click',event=>{
    event.preventDefault();
    event.stopPropagation();
    setOpen(!clone.classList.contains('is-open'));
  });
  setOpen(source.open||(state.answerMap?.key===key&&state.answerMap.open));
  return clone;
}
function normalizeAnswerMapClone(map){
  const open=map.classList.contains('is-open')||map.open;
  const summary=map.querySelector(':scope > summary, :scope > .kwf-card-v3-answer-map-toggle');
  const list=map.querySelector('.option-map-list');
  const listH=window.matchMedia('(max-width: 560px)').matches?'116px':'126px';
  for(const [p,v] of [
    ['box-sizing','border-box'],['position','relative'],['inset','auto'],['display','block'],
    ['grid-template-rows','none'],['width','min(100%, var(--kwf-card-v2-answer-max-w))'],
    ['height','34px'],['min-height','34px'],['max-height','34px'],['flex','0 0 34px'],['margin','0 auto'],
    ['padding','0'],['z-index',open?'8':'1'],['transform','none'],['translate','none'],['overflow','visible'],
    ['border','1px solid rgba(18,49,38,.14)'],['border-radius','16px'],['background','#fffdf7'],
    ['box-shadow','0 7px 18px rgba(18,49,38,.06)'],['pointer-events','auto']
  ])important(map,p,v);
  if(summary){
    for(const [p,v] of [
      ['box-sizing','border-box'],['display','flex'],['align-items','center'],['justify-content','center'],
      ['height','34px'],['min-height','34px'],['max-height','34px'],['margin','0'],['padding','0 12px'],
      ['cursor','pointer'],['font','var(--kwf-card-v2-support-font)'],['line-height','1'],['text-align','center'],
      ['background','#fffdf7'],['border-bottom','0'],['border-radius','16px'],['position','relative'],['z-index','2']
    ])important(summary,p,v);
  }
  if(list){
    if(!open){
      for(const [p,v] of [['display','none'],['height','0'],['min-height','0'],['max-height','0'],['padding','0'],['overflow','hidden']])important(list,p,v);
      return;
    }
    for(const [p,v] of [
      ['box-sizing','border-box'],['position','absolute'],['left','0'],['right','0'],['bottom','32px'],['z-index','1'],
      ['display','grid'],['grid-template-columns','repeat(2, minmax(0, 1fr))'],
      ['grid-template-rows','repeat(2, minmax(0, 1fr))'],['gap','6px'],['width','100%'],['height',listH],['min-height',listH],
      ['max-height',listH],['margin','0'],['padding','8px'],['overflow','hidden'],['border','1px solid rgba(18,49,38,.12)'],
      ['border-radius','16px 16px 10px 10px'],['background','#fffdf7'],['box-shadow','0 12px 28px rgba(18,49,38,.14)']
    ])important(list,p,v);
    for(const article of list.querySelectorAll('article')){
      const ko=article.querySelector('span');
      const zh=article.querySelector('b');
      if(ko&&zh&&article.firstElementChild!==ko)article.insertBefore(ko,zh);
      for(const [p,v] of [
        ['box-sizing','border-box'],['display','grid'],['align-content','center'],['justify-items','center'],
        ['grid-template-areas','"ko" "zh"'],
        ['min-width','0'],['min-height','0'],['height','auto'],['margin','0'],['padding','3px 7px'],
        ['gap','2px'],['border-radius','12px'],['overflow','hidden'],['text-align','center']
      ])important(article,p,v);
      for(const b of article.querySelectorAll('b')){important(b,'grid-area','zh');important(b,'font-size','10px');important(b,'line-height','1');}
      for(const span of article.querySelectorAll('span')){important(span,'grid-area','ko');important(span,'font-size','13px');important(span,'line-height','1');}
      for(const small of article.querySelectorAll('small'))important(small,'display','none');
    }
  }
}
function proxyButton(source, className, label){
  if(!source)return null;
  const button=source.cloneNode(true);
  button.className=className || source.className || '';
  button.textContent=label || txt(source);
  button.removeAttribute('style');
  button.removeAttribute('disabled');
  button.dataset.kwfProxy='true';
  button.addEventListener('click',event=>{
    event.preventDefault();
    event.stopPropagation();
    const findCurrent=()=>label==='继续'
      ? document.querySelector('#study-card > .answer .continue, #study-card > .compact-answer .continue')
      : source;
    const clickTarget=attempt=>{
      const target=findCurrent()||source;
      if(target.disabled&&attempt<8){
        window.setTimeout(()=>clickTarget(attempt+1),80);
        return;
      }
      target.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true,view:window}));
      target.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,cancelable:true,view:window}));
      target.click();
      if(label==='继续'){
        window.setTimeout(()=>keepStudySectionAfterContinue(),120);
        window.setTimeout(()=>keepStudySectionAfterContinue(),360);
      }
    };
    clickTarget(0);
  });
  return button;
}
function keepStudySectionAfterContinue(){
  const study=document.getElementById('study');
  if(!study)return;
  const poly=document.getElementById('polysemy');
  const polyTop=poly?.getBoundingClientRect().top;
  const driftedToPoly=location.hash==='#polysemy'||(poly&&polyTop<Math.min(320,window.innerHeight*.35)&&study.getBoundingClientRect().bottom<window.innerHeight*.45);
  if(!driftedToPoly)return;
  history.replaceState(null,'',`${location.pathname}${location.search}#study`);
  study.scrollIntoView({block:'start'});
}
function metaRows(sourceWord){
  return [...sourceWord.querySelectorAll('.pronunciation-stack p')].map(source=>{
    const label=txt(source.querySelector('span'));
    const value=txt(source).replace(label,'').trim();
    if(!label&&!value)return null;
    const row=document.createElement('p');
    const l=document.createElement('span');
    const v=document.createElement('b');
    l.textContent=label;
    v.textContent=value;
    row.append(l,v);
    return row;
  }).filter(Boolean);
}
function hideCardOriginals(card){
  for(const old of card.querySelectorAll(':scope > .card-meta,:scope > .word,:scope > .pre-answer,:scope > .review-question,:scope > .answer,:scope > .compact-answer')){
    important(old,'display','none');
    important(old,'pointer-events','none');
  }
}
async function rebuildCardV3(){
  const card=document.querySelector('#study-card.study-card'); if(!card)return;
  if(state.rebuildingCard)return;
  state.rebuildingCard=true;
  try{
  const shells=[...card.querySelectorAll(':scope > .kwf-card-v3')];
  const shell=shells[0]||document.createElement('div');
  for(const extra of shells.slice(1))extra.remove();
  const sourceMeta=card.querySelector(':scope > .card-meta, .card-meta');
  const sourceWord=card.querySelector(':scope > .word, .word');
  if(!sourceMeta||!sourceWord)return;
  const sourceAnswer=card.querySelector(':scope > .answer, :scope > .compact-answer');
  const sourceScroll=sourceAnswer?.querySelector('.answer-scroll');
  const pre=card.querySelector(':scope > .pre-answer');
  const reviewQuestion=card.querySelector(':scope > .review-question');
  const revealed=Boolean(sourceAnswer&&sourceScroll);
  const headword=txt(sourceWord.querySelector('h3'));
  const mode=revealed?'revealed':reviewQuestion?'review-initial':'learn-initial';
  const signature=[mode,card.className,headword,txt(sourceMeta),txt(sourceWord),txt(sourceAnswer||pre||reviewQuestion)].join('|');
  if(shell.dataset.signature===signature){
    const fill=shell.querySelector('.kwf-card-v3-progress > i');
    const sourceProgress=document.querySelector('#study .progress-panel .progress i');
    if(fill&&sourceProgress)fill.setAttribute('style',sourceProgress.getAttribute('style')||'');
    for(const map of shell.querySelectorAll('.kwf-card-v3-answer-map'))normalizeAnswerMapClone(map);
    card.classList.add('kwf-card-v3-card');
    for(const [p,v] of [['display','block'],['height','var(--kwf-card-h)'],['min-height','var(--kwf-card-h)'],['max-height','var(--kwf-card-h)'],['padding','0'],['overflow','hidden']])important(card,p,v);
    hideCardOriginals(card);
    return;
  }
  const data=await vocabulary();
  const entry=data.entries?.find(e=>e.headword===headword);
  shell.className='kwf-card-v3';
  shell.dataset.signature=signature;
  const progress=document.createElement('div');
  progress.className='kwf-card-v3-progress';
  const fill=document.createElement('i');
  const sourceProgress=document.querySelector('#study .progress-panel .progress i');
  if(sourceProgress)fill.setAttribute('style',sourceProgress.getAttribute('style')||'');
  progress.appendChild(fill);
  const header=cloneInto('header','kwf-card-v3-header',sourceMeta);
  const hero=document.createElement('section');
  hero.className='kwf-card-v3-hero';
  const word=document.createElement('h3');
  word.className='kwf-card-v3-word';
  word.textContent=headword;
  const meta=document.createElement('div');
  meta.className='kwf-card-v3-meta';
  meta.replaceChildren(...metaRows(sourceWord));
  const status=cloneInto('div','kwf-card-v3-status',sourceScroll?.querySelector('.kwf-v2-status'));
  hero.replaceChildren(word,meta);
  const knowledge=document.createElement('section');
  knowledge.className='kwf-card-v3-knowledge';
  let answerMap=null;
  const content=document.createElement('section');
  content.className='kwf-card-v3-content';
  const block=(className,title,nodes)=>{
    const section=document.createElement('section');
    section.className=`kwf-card-v3-block ${className}`;
    const b=document.createElement('b');
    b.textContent=title;
    section.appendChild(b);
    for(const node of nodes.filter(Boolean))section.appendChild(node);
    return section;
  };
  if(revealed){
    const definition=document.createElement('p');
    definition.textContent=txt(sourceScroll.querySelector('.kwf-v2-definition h4'))||txt(sourceScroll.querySelector('h4'));
    if(definition.textContent)knowledge.appendChild(block('kwf-v2-definition','释义',[definition]));
    const exampleKo=document.createElement('p');
    exampleKo.textContent=txt(sourceScroll.querySelector('.kwf-v2-example .sentence,.kwf-v2-example p'));
    const exampleZh=document.createElement('small');
    exampleZh.textContent=txt(sourceScroll.querySelector('.kwf-v2-example .sentence + p,.kwf-v2-example small'));
    if(exampleKo.textContent||exampleZh.textContent)knowledge.appendChild(block('kwf-v2-example','例句',[exampleKo,exampleZh.textContent?exampleZh:null]));
    const collocations=(entry?.senses||[]).flatMap(s=>(s.collocations||[]).map(c=>({...c,zh:c?.zh||''}))).filter(c=>c?.ko);
    const collocationNodes=collocations.flatMap(c=>{const ko=document.createElement('p');ko.textContent=`• ${c.ko}`;if(!c.zh)return [ko];const zh=document.createElement('small');zh.textContent=c.zh;return [ko,zh];});
    if(!collocationNodes.length){
      const fallbackKo=txt(sourceScroll.querySelector('.kwf-v2-collocation p'));
      if(fallbackKo){const ko=document.createElement('p');ko.textContent=fallbackKo.startsWith('•')?fallbackKo:`• ${fallbackKo}`;collocationNodes.push(ko);}
    }
    if(collocationNodes.length)knowledge.appendChild(block('kwf-v2-collocation','固定搭配',collocationNodes));
    const soundRuleText=txt(sourceScroll.querySelector('.kwf-v2-sound-rule p'));
    if(soundRuleText){const sound=document.createElement('p');sound.textContent=soundRuleText;knowledge.appendChild(block('kwf-v2-sound-rule','音变规则',[sound]));}
    const map=card.querySelector('details.answer-map');
    if(map)answerMap=cloneDetails(map,`${mode}|${headword}`);
  }
  shell.classList.toggle('kwf-card-v3-has-answer-map',Boolean(answerMap));
  const spacer=document.createElement('div');
  spacer.className='kwf-card-v3-spacer';
  const footer=document.createElement('footer');
  footer.className='kwf-card-v3-footer';
  if(revealed){
    const originalContinue=sourceAnswer.querySelector('.continue');
    const cont=proxyButton(originalContinue,'kwf-card-v3-continue','继续');
    if(cont)footer.appendChild(cont);
  }else if(reviewQuestion){
    const group=document.createElement('div');
    group.className='kwf-card-v3-review-actions';
    const originals=[...reviewQuestion.querySelectorAll(':scope > div > button')];
    for(const original of originals)group.appendChild(proxyButton(original,'',txt(original)));
    footer.appendChild(group);
  }else if(pre){
    const shortcut=proxyButton(pre.querySelector(':scope > .show-shortcut'),'kwf-card-v3-shortcut show-shortcut','直接看答案');
    const group=document.createElement('div');
    group.className='kwf-card-v3-actions';
    const originals=[...pre.querySelectorAll(':scope > div > button')];
    for(const original of originals)group.appendChild(proxyButton(original,'',txt(original)));
    if(shortcut)footer.appendChild(shortcut);
    footer.appendChild(group);
  }
  content.appendChild(hero);
  if(revealed&&status.childNodes.length)content.appendChild(status);
  if(revealed)content.appendChild(knowledge);
  if(answerMap){
    content.appendChild(spacer);
    content.appendChild(answerMap);
  }else{
    content.appendChild(spacer);
  }
  shell.replaceChildren(progress,header,content,footer);
  if(!shell.parentElement)card.prepend(shell);
  card.classList.add('kwf-card-v3-card');
  card.classList.remove('kwf-reveal-v2-card');
  for(const [p,v] of [['display','block'],['height','var(--kwf-card-h)'],['min-height','var(--kwf-card-h)'],['max-height','var(--kwf-card-h)'],['padding','0'],['overflow','hidden']])important(card,p,v);
  card.querySelector(':scope > .kwf-reveal-v2')?.remove();
  hideCardOriginals(card);
  }finally{
    state.rebuildingCard=false;
  }
}
async function rebuildRevealCard(){
  const card=document.querySelector('#study-card.study-card.revealed'); if(!card)return;
  const sourceMeta=card.querySelector(':scope > .card-meta, .card-meta');
  const sourceWord=card.querySelector(':scope > .word, .word');
  const sourceAnswer=card.querySelector('.answer,.compact-answer');
  const sourceScroll=sourceAnswer?.querySelector('.answer-scroll');
  const continueButton=sourceAnswer?.querySelector('.continue')||card.querySelector('.continue');
  if(!sourceMeta||!sourceWord||!sourceScroll||!continueButton)return;
  const headword=txt(sourceWord.querySelector('h3'));
  const data=await vocabulary();
  const entry=data.entries?.find(e=>e.headword===headword);
  const shell=card.querySelector(':scope > .kwf-reveal-v2')||document.createElement('div');
  const existingProxy=shell.querySelector?.('.kwf-reveal-v2-action .continue[data-kwf-proxy="continue"]');
  if(shell.dataset.headword===headword&&existingProxy){
    const fill=shell.querySelector('.kwf-reveal-v2-progress > i');
    const sourceProgress=document.querySelector('#study .progress-panel .progress i');
    if(fill&&sourceProgress)fill.setAttribute('style',sourceProgress.getAttribute('style')||'');
    for(const [p,v] of [['display','block'],['height','var(--kwf-card-h)'],['min-height','var(--kwf-card-h)'],['max-height','var(--kwf-card-h)'],['padding','0'],['overflow','hidden']])important(card,p,v);
    for(const old of card.querySelectorAll(':scope > .card-meta,:scope > .word,:scope > .answer,:scope > .compact-answer'))important(old,'display','none');
    for(const [p,v] of [['position','static'],['display','flex'],['align-items','center'],['justify-content','center'],['left','auto'],['right','auto'],['top','auto'],['bottom','auto'],['inset','auto'],['width','var(--kwf-primary-action-group-w)'],['min-width','var(--kwf-primary-action-group-w)'],['max-width','var(--kwf-primary-action-group-w)'],['height','var(--kwf-action-h)'],['min-height','var(--kwf-action-h)'],['max-height','var(--kwf-action-h)'],['transform','none'],['translate','none'],['margin','0'],['pointer-events','auto']])important(existingProxy,p,v);
    return;
  }
  shell.className='kwf-reveal-v2';
  shell.dataset.headword=headword;
  const header=cloneInto('header','kwf-reveal-v2-header',sourceMeta);
  const hero=document.createElement('section'); hero.className='kwf-reveal-v2-hero';
  const word=document.createElement('h3'); word.className='kwf-reveal-v2-word'; word.textContent=headword;
  const pronunciation=cloneInto('div','kwf-reveal-v2-pronunciation',sourceWord.querySelector('.pronunciation-stack'));
  const status=cloneInto('div','kwf-reveal-v2-status',sourceWord.querySelector('.kwf-v2-status')||sourceScroll.querySelector('.kwf-v2-status'));
  hero.replaceChildren(word,pronunciation,status);
  const knowledge=document.createElement('section'); knowledge.className='kwf-reveal-v2-knowledge';
  const makeBlock=(className,title,nodes)=>{
    const block=document.createElement('section'); block.className=`kwf-reveal-v2-block ${className}`;
    const b=document.createElement('b'); b.textContent=title;
    block.appendChild(b);
    for(const node of nodes.filter(Boolean))block.appendChild(node);
    return block;
  };
  const definition=document.createElement('p'); definition.textContent=txt(sourceScroll.querySelector('.kwf-v2-definition h4'))||txt(sourceScroll.querySelector('h4'));
  const exampleKo=document.createElement('p'); exampleKo.textContent=txt(sourceScroll.querySelector('.kwf-v2-example .sentence,.kwf-v2-example p'));
  const exampleZh=document.createElement('small'); exampleZh.textContent=txt(sourceScroll.querySelector('.kwf-v2-example .sentence + p,.kwf-v2-example small'));
  const collocations=(entry?.senses||[]).flatMap(s=>(s.collocations||[]).map(c=>({...c,zh:c?.zh||''}))).filter(c=>c?.ko);
  const collocationNodes=collocations.flatMap(c=>{const ko=document.createElement('p'); ko.textContent=`• ${c.ko}`; if(!c.zh)return [ko]; const zh=document.createElement('small'); zh.textContent=c.zh; return [ko,zh];});
  if(!collocationNodes.length){
    const fallbackKo=txt(sourceScroll.querySelector('.kwf-v2-collocation p'));
    if(fallbackKo){const ko=document.createElement('p'); ko.textContent=fallbackKo.startsWith('•')?fallbackKo:`• ${fallbackKo}`; collocationNodes.push(ko);}
  }
  const soundRuleText=txt(sourceScroll.querySelector('.kwf-v2-sound-rule p'));
  const soundRule=soundRuleText?Object.assign(document.createElement('p'),{textContent:soundRuleText}):null;
  knowledge.appendChild(makeBlock('kwf-v2-definition','释义',[definition]));
  if(exampleKo.textContent||exampleZh.textContent)knowledge.appendChild(makeBlock('kwf-v2-example','例句',[exampleKo,exampleZh.textContent?exampleZh:null]));
  if(collocationNodes.length)knowledge.appendChild(makeBlock('kwf-v2-collocation','固定搭配',collocationNodes));
  if(soundRule)knowledge.appendChild(makeBlock('kwf-v2-sound-rule','音变规则',[soundRule]));
  const map=card.querySelector('details.answer-map');
  if(map)knowledge.appendChild(cloneDetails(map));
  const action=document.createElement('footer'); action.className='kwf-reveal-v2-action';
  const proxyContinue=continueButton.cloneNode(true);
  proxyContinue.textContent='继续';
  proxyContinue.removeAttribute('disabled');
  proxyContinue.dataset.kwfProxy='continue';
  proxyContinue.addEventListener('click',event=>{
    event.preventDefault();
    event.stopPropagation();
    continueButton.click();
  });
  action.appendChild(proxyContinue);
  const progress=document.createElement('div');
  progress.className='kwf-reveal-v2-progress';
  const sourceProgress=document.querySelector('#study .progress-panel .progress i');
  const fill=document.createElement('i');
  if(sourceProgress)fill.setAttribute('style',sourceProgress.getAttribute('style')||'');
  progress.appendChild(fill);
  shell.replaceChildren(progress,header,hero,knowledge,action);
  if(!shell.parentElement)card.prepend(shell);
  card.classList.add('kwf-reveal-v2-card');
  for(const [p,v] of [['display','block'],['height','var(--kwf-card-h)'],['min-height','var(--kwf-card-h)'],['max-height','var(--kwf-card-h)'],['padding','0'],['overflow','hidden']])important(card,p,v);
  for(const old of card.querySelectorAll(':scope > .card-meta,:scope > .word,:scope > .answer,:scope > .compact-answer'))important(old,'display','none');
  for(const [p,v] of [['display','flex'],['align-items','flex-start'],['justify-content','center'],['height','auto'],['min-height','0'],['padding','0'],['margin-top','auto']])important(action,p,v);
  for(const [p,v] of [['position','static'],['display','flex'],['align-items','center'],['justify-content','center'],['left','auto'],['right','auto'],['top','auto'],['bottom','auto'],['inset','auto'],['width','var(--kwf-primary-action-group-w)'],['min-width','var(--kwf-primary-action-group-w)'],['max-width','var(--kwf-primary-action-group-w)'],['height','var(--kwf-action-h)'],['min-height','var(--kwf-action-h)'],['max-height','var(--kwf-action-h)'],['transform','none'],['translate','none'],['margin','0'],['pointer-events','auto']])important(proxyContinue,p,v);
}
function normalizeReviewStack(){const review=document.querySelector('#review'),board=document.querySelector('#review .review-board');if(!board)return;review?.style?.setProperty('--kwf-layout-lock-w','min(var(--kwf-review-container-w), 100%)','important');const title=document.querySelector('#review .review-title');important(title,'margin-bottom','var(--kwf-hero-bottom-gap)');board.classList.add('kwf-layout-review-stack');important(board,'display','flex');important(board,'flex-direction','column');important(board,'width','var(--kwf-layout-lock-w)');important(board,'max-width','var(--kwf-review-container-w)');important(board,'margin-left','auto');important(board,'margin-right','auto');for(const el of board.querySelectorAll('.review-module-grid,.learned-stat,.memory-profile,.memory-note,#learned-library-section')){important(el,'box-sizing','border-box');important(el,'width','100%');important(el,'max-width','100%');important(el,'grid-column','1 / -1');}const drawer=document.querySelector('#learned-library-section');for(const [p,v] of [['box-sizing','border-box'],['left','auto'],['right','auto'],['transform','none'],['translate','none'],['width','100%'],['max-width','var(--kwf-content-safe-w)'],['margin-left','auto'],['margin-right','auto']])important(drawer,p,v);}
async function normalizeLearnedRows(){const data=await enrichment(),entries=data?.entries||{};for(const row of document.querySelectorAll('#learned-library-section .kwf-learned-row')){row.dataset.kwfLayoutSystem='layout-v1';const compact=matchMedia('(max-width:560px)').matches, mobile=matchMedia('(max-width:900px)').matches;for(const [p,v] of [['align-items','center'],['padding','var(--kwf-card-vpad) var(--kwf-card-pad)'],['height',compact?'132px':mobile?'124px':'112px'],['min-height',compact?'132px':mobile?'124px':'112px'],['max-height',compact?'132px':mobile?'124px':'112px']])important(row,p,v);const main=row.querySelector('.learned-word-main'),meaning=row.querySelector('.learned-word-meaning'),status=row.querySelector('.learned-word-status'),select=row.querySelector('.select-word'),collocation=row.querySelector('.kwf-row-collocation');for(const el of [main,meaning,status,select,collocation]){important(el,'align-self','center');important(el,'justify-content','center');important(el,'margin','0');}if(status){const statusW=compact?'110px':'180px';for(const [p,v] of [['box-sizing','border-box'],['display','grid'],['grid-template-columns','42px 54px'],['grid-template-rows','42px 18px'],['justify-content','center'],['align-content','center'],['justify-items','center'],['align-items','center'],['gap','6px 8px'],['width',statusW],['min-width',statusW],['max-width',statusW],['height','72px'],['min-height','72px'],['max-height','72px']])important(status,p,v);const fav=status.querySelector('.favorite-chip'),mark=status.querySelector('mark'),small=status.querySelector('small');important(fav,'display','grid');important(fav,'grid-row','1');important(fav,'grid-column','1');important(fav,'place-items','center');important(fav,'justify-self','center');important(fav,'align-self','center');important(fav,'line-height','1');important(fav,'text-align','center');important(fav,'transform','none');important(fav,'translate','none');important(mark,'grid-row','1');important(mark,'grid-column','2');important(mark,'justify-self','center');important(mark,'align-self','center');important(mark,'min-width','54px');important(mark,'white-space','nowrap');important(small,'grid-row','2');important(small,'grid-column','1 / 3');important(small,'align-self','center');important(small,'justify-self','center');important(small,'white-space','nowrap');}const word=txt(main?.querySelector('b,strong'));if(!word)continue;const collocations=entries[word]?.collocations?.slice(0,2)||[];let host=row.querySelector('.kwf-row-collocation');if(!collocations.length){host?.remove();continue;}if(!host){host=document.createElement('div');host.className='kwf-row-collocation';row.appendChild(host);}important(host,'align-self','center');important(host,'justify-content','center');host.replaceChildren(...collocations.map(item=>{const s=document.createElement('span');s.textContent=item;s.title=item;return s;}));}}
function injectBugfixStyles(){
  if(document.querySelector('#kwf-critical-bugfixes'))return;
  const style=document.createElement('style');
  style.id='kwf-critical-bugfixes';
  style.textContent=`
    #study #study-card.kwf-card-v3-card{padding:0!important;overflow:hidden!important}
    #study #study-card.kwf-card-v3-card .kwf-card-v3-footer{padding-bottom:20px!important}
    #study #study-card.kwf-card-v3-card .kwf-card-v3-continue{cursor:pointer!important;pointer-events:auto!important}
    .kwf-mobile-review-menu{position:fixed;left:12px;right:12px;bottom:74px;z-index:90;display:grid;gap:8px;padding:12px;border:1px solid rgba(18,49,38,.16);border-radius:18px;background:#fffdf7;box-shadow:0 18px 44px rgba(18,49,38,.18)}
    .kwf-mobile-review-menu[hidden]{display:none!important}
    .kwf-mobile-review-menu button{width:100%;min-height:42px;border-radius:999px;white-space:nowrap;cursor:pointer}
    .kwf-toast{position:fixed;left:50%;bottom:86px;z-index:120;max-width:min(320px,calc(100vw - 32px));padding:10px 14px;border-radius:999px;background:#173d2e;color:#fffdf7;font:600 13px/1.35 Arial,"Noto Sans KR","Microsoft YaHei",sans-serif;box-shadow:0 14px 30px rgba(18,49,38,.22);transform:translateX(-50%);opacity:.98}
    .poly-secondary[data-kwf-disabled-review="true"],.review-subnav button[data-kwf-disabled-review="true"]{opacity:.55!important;cursor:not-allowed!important}
    @media (max-width:760px){
      html,body{overflow-x:hidden!important}
      .mobile-tabbar{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:6px!important;padding:8px 10px calc(8px + env(safe-area-inset-bottom))!important}
      .mobile-tabbar>*{min-width:0!important;white-space:nowrap!important;writing-mode:horizontal-tb!important;text-orientation:mixed!important;font-size:12px!important}
      .mobile-tabbar>button:nth-of-type(1){order:1!important}
      .mobile-tabbar>a[href*="polysemy"]{order:2!important}
      .mobile-tabbar>button:nth-of-type(2){order:3!important}
      .mobile-tabbar>button:nth-of-type(3){order:4!important}
      .study-wrap>.level-selector{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;padding:12px!important}
      .study-wrap>.level-selector>span{grid-column:1/-1!important}
      .study-wrap>.level-selector>button{min-width:0!important;width:100%!important;height:36px!important;padding:0 8px!important;font-size:12px!important;white-space:nowrap!important}
      .study-wrap>.study-settings{display:grid!important;grid-template-columns:1fr!important;gap:10px!important}
      .study-wrap>.study-settings>div{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;align-items:center!important}
      .study-wrap>.study-settings>div:nth-child(2){grid-template-columns:repeat(2,minmax(0,1fr))!important}
      .study-wrap>.study-settings span{grid-column:1/-1!important;white-space:nowrap!important}
      .study-wrap>.study-settings button{min-width:0!important;width:100%!important;height:34px!important;padding:0 8px!important;font-size:12px!important;white-space:nowrap!important}
      .study-wrap>.study-settings p{min-height:40px!important;align-items:center!important;justify-content:center!important;text-align:center!important}
      #study #study-card.kwf-card-v3-card{height:520px!important;min-height:520px!important;max-height:520px!important}
      #study #study-card.kwf-card-v3-card .kwf-card-v3-footer{padding-bottom:22px!important}
      #study #study-card.kwf-card-v3-card .kwf-card-v3-review-actions{grid-template-columns:1fr!important;width:min(100%,var(--kwf-primary-action-group-w))!important}
      #poly-reference.kwf-poly-ref>summary{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:2px!important}
      #poly-reference.kwf-poly-ref>summary .kwf-poly-summary-title,#poly-reference.kwf-poly-ref>summary .kwf-poly-summary-count{display:block!important;white-space:normal!important;min-width:0!important}
      #poly-reference .kwf-poly-ref-controls button,#poly-reference .kwf-poly-ref-bottom button{min-height:34px!important;padding:7px 10px!important;font-size:12px!important;white-space:nowrap!important}
      #poly-reference .kwf-poly-ref-bottom>div{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;width:100%!important;gap:8px!important}
      #learned-library-section .learned-card-actions .ghost{white-space:nowrap!important;writing-mode:horizontal-tb!important;text-orientation:mixed!important;min-width:max-content!important}
      #learned-panel .learned-card-actions{display:flex!important;justify-content:flex-start!important;align-items:center!important;width:100%!important}
      #learned-panel .learned-card-actions .ghost{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:auto!important;min-width:132px!important;height:38px!important;padding:0 14px!important;white-space:nowrap!important;writing-mode:horizontal-tb!important;text-orientation:mixed!important}
      #learned-library-section .profile-level-progress{display:flex!important;flex-wrap:nowrap!important;overflow-x:auto!important;gap:8px!important;padding-bottom:4px!important}
      #learned-library-section .profile-level-progress>button{flex:0 0 58px!important;min-width:58px!important;padding:8px!important}
      #learned-library-section .archive-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
      #learned-library-section .archive-actions button{min-width:0!important;width:100%!important;white-space:nowrap!important;font-size:12px!important;padding:8px!important}
    }
  `;
  document.head.appendChild(style);
}
function ensureTopikUnlock(){
  try{
    const profile=JSON.parse(localStorage.getItem('kwf:profile')||'{}');
    if((profile.unlockedLevel||0)<6){
      profile.unlockedLevel=6;
      localStorage.setItem('kwf:profile',JSON.stringify(profile));
    }
  }catch{}
  for(const button of document.querySelectorAll('.level-selector button')){
    const match=txt(button).match(/TOPIK\s*(\d)/);
    if(!match)continue;
    button.disabled=false;
    button.removeAttribute('disabled');
    button.textContent=txt(button).replace(/\s*·\s*锁定/g,'');
  }
}
function ensureMobileLanding(){
  if(!matchMedia('(max-width:760px)').matches)return;
  if(location.hash&&location.hash!=='#top')return;
  const top=document.querySelector('#top');
  if(top&&window.scrollY>24)requestAnimationFrame(()=>top.scrollIntoView({block:'start'}));
}
function toast(message){
  let box=document.querySelector('.kwf-toast');
  if(!box){box=document.createElement('div');box.className='kwf-toast';document.body.appendChild(box);}
  box.textContent=message;
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>box.remove(),2200);
}
function bindTts(){
  if(window.__KWF_TTS_BOUND__)return;
  window.__KWF_TTS_BOUND__=true;
  document.addEventListener('click',event=>{
    const button=event.target?.closest?.('button');
    if(!button)return;
    const label=`${button.getAttribute('aria-label')||''} ${button.title||''} ${txt(button)}`;
    if(!/播放韩语发音|听/.test(label))return;
    const card=button.closest('#study-card,.kwf-card-v3,.study-card')||document;
    const headword=txt(card.querySelector('.kwf-card-v3-word,.word h3,h3'));
    const actual=txt(card.querySelector('.pronunciation-stack p:first-child,.kwf-card-v3-meta p:first-child'))?.replace(/^实际读音\s*/,'');
    const text=(actual&&/[\u3131-\u318e\uac00-\ud7a3]/u.test(actual)?actual:headword).trim();
    if(!text)return toast('暂时没有可播放的韩文。');
    if(!('speechSynthesis'in window)||typeof SpeechSynthesisUtterance==='undefined')return toast('当前浏览器不支持语音播放。');
    try{
      window.speechSynthesis.cancel();
      const utterance=new SpeechSynthesisUtterance(text);
      utterance.lang='ko-KR';
      utterance.rate=.86;
      window.speechSynthesis.speak(utterance);
    }catch{
      toast('语音播放启动失败，请稍后再试。');
    }
  },true);
}
function learnedMemoryCount(){
  let count=0;
  try{
    for(let i=0;i<localStorage.length;i+=1){
      const key=localStorage.key(i);
      if(key?.startsWith('memory:'))count+=1;
    }
  }catch{}
  return count;
}
function guardPolysemyReview(){
  const hasLearned=learnedMemoryCount()>0;
  for(const button of document.querySelectorAll('.poly-secondary,.review-subnav button')){
    const label=txt(button);
    if(!/单个释义|整词多选/.test(label))continue;
    if(!hasLearned){
      button.disabled=true;
      button.dataset.kwfDisabledReview='true';
      button.title='先学习对应多义词后再复习';
    }else{
      button.dataset.kwfDisabledReview='false';
    }
  }
}
function splitPolysemyMobileSummary(){
  const summary=document.querySelector('#poly-reference.kwf-poly-ref>summary');
  if(!summary||summary.dataset.kwfSplitSummary)return;
  const span=summary.querySelector('span');
  if(!span)return;
  const text=txt(span);
  const [title,count]=text.split(/\s*·\s*/);
  if(!count)return;
  const titleNode=document.createElement('span');
  titleNode.className='kwf-poly-summary-title';
  titleNode.textContent=title;
  const countNode=document.createElement('span');
  countNode.className='kwf-poly-summary-count';
  countNode.textContent=count;
  span.replaceChildren(titleNode,countNode);
  summary.dataset.kwfSplitSummary='true';
}
function bindMobileReviewNav(){
  if(window.__KWF_MOBILE_REVIEW_NAV_BOUND__&&document.querySelector('.kwf-mobile-review-menu')&&document.querySelector('.mobile-tabbar[data-kwf-review-capture="true"]'))return;
  let menu=document.querySelector('.kwf-mobile-review-menu');
  if(!menu)menu=document.createElement('div');
  menu.className='kwf-mobile-review-menu';
  menu.hidden=true;
  menu.replaceChildren();
  const enter=document.createElement('button');
  enter.type='button';
  enter.textContent='进入复习页';
  const close=document.createElement('button');
  close.type='button';
  close.textContent='收起复习菜单';
  menu.append(enter,close);
  if(!menu.parentElement)document.body.appendChild(menu);
  window.__KWF_MOBILE_REVIEW_NAV_BOUND__=true;
  let lastTap=0;
  const goReview=()=>{menu.hidden=true;document.querySelector('#review')?.scrollIntoView({block:'start'});history.replaceState(null,'','#review');};
  enter.addEventListener('click',goReview);
  close.addEventListener('click',()=>{menu.hidden=true;});
  document.addEventListener('click',event=>{
    const target=event.target?.closest?.('.mobile-tabbar button,.mobile-tabbar a');
    if(!target)return;
    const label=txt(target);
    if(label==='已学')target.textContent='词库';
    if(label!=='复习')return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const now=Date.now();
    if(now-lastTap<360){lastTap=0;goReview();return;}
    lastTap=now;
    menu.hidden=!menu.hidden;
  },true);
  const bindButtons=()=>{for(const button of document.querySelectorAll('.mobile-tabbar button')){if(txt(button)!=='复习')continue;button.onclick=event=>{event.preventDefault();event.stopPropagation();const now=Date.now();if(now-lastTap<360){lastTap=0;goReview();return false;}lastTap=now;menu.hidden=false;return false;};button.ondblclick=event=>{event.preventDefault();event.stopPropagation();goReview();return false;};}};
  bindButtons();
  setTimeout(bindButtons,800);
  const tabbar=document.querySelector('.mobile-tabbar');
  if(tabbar&&!tabbar.dataset.kwfReviewCapture){
    tabbar.dataset.kwfReviewCapture='true';
    tabbar.addEventListener('pointerup',event=>{
      const target=event.target?.closest?.('button');
      if(!target||txt(target)!=='复习')return;
      event.preventDefault();
      event.stopPropagation();
      const now=Date.now();
      if(now-lastTap<360){lastTap=0;goReview();return;}
      lastTap=now;
      menu.hidden=false;
    },true);
  }
}
function normalizeMobileTabLabels(){
  for(const button of document.querySelectorAll('.mobile-tabbar button'))if(txt(button)==='已学')button.textContent='词库';
}
async function apply(){state.scheduled=false;injectPolishStyles();injectBugfixStyles();document.documentElement.dataset.kwfLayoutSystem='layout-v1';document.documentElement.dataset.kwfLayoutAuthority='layout-system';window.__KWF_LAYOUT_SYSTEM_READY__=true;ensureTopikUnlock();bindTts();bindMobileReviewNav();normalizeMobileTabLabels();hideMisplacedPlacement();normalizeCard();await enhanceRevealData();await rebuildCardV3();normalizeReviewStack();await normalizeLearnedRows();guardPolysemyReview();splitPolysemyMobileSummary();ensureMobileLanding();}
function schedule(){if(state.scheduled)return;state.scheduled=true;requestAnimationFrame(apply);}
const observer=new MutationObserver(schedule);
function boot(){window.__KWF_LAYOUT_SYSTEM_READY__=true;injectPolishStyles();observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','open']});addEventListener('resize',schedule,{passive:true});schedule();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
