const v2State = { enrichment: null, scheduled: false };

async function getEnrichment() {
  if (v2State.enrichment) return v2State.enrichment;
  try {
    const res = await fetch('data/enrichment.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    v2State.enrichment = await res.json();
  } catch (error) {
    console.warn('[KWF v2] enrichment unavailable', error);
    v2State.enrichment = { entries: {} };
  }
  return v2State.enrichment;
}

const text = el => (el?.textContent || '').replace(/\s+/g, ' ').trim();
function imp(el, prop, value) { if (el) el.style.setProperty(prop, value, 'important'); }
function forceFullRow(el) {
  if (!el) return;
  for (const [p, v] of [['width','100%'],['max-width','100%'],['min-width','0'],['grid-column','1 / -1'],['grid-row','auto'],['grid-area','auto'],['flex-basis','100%'],['transform','none'],['left','auto'],['right','auto']]) imp(el,p,v);
}

function markOverviewStructure() {
  const board = document.querySelector('#review .review-board');
  const summary = document.querySelector('#review .review-stat.learned-stat');
  const profile = document.querySelector('#review .memory-profile');
  const note = document.querySelector('#review .memory-note');
  const library = document.querySelector('#review #learned-library-section');

  if (board) {
    imp(board,'display','flex'); imp(board,'flex-direction','column'); imp(board,'align-items','stretch');
  }
  for (const [el, cls] of [[summary,'kwf-v2-summary'],[profile,'kwf-v2-profile'],[note,'kwf-v2-note'],[library,'kwf-v2-library']]) {
    if (!el) continue;
    el.classList.add(cls); forceFullRow(el);
    let parent = el.parentElement;
    while (parent && parent !== board && parent.id !== 'review') {
      parent.classList.add('kwf-v2-full-row-wrap'); forceFullRow(parent);
      imp(parent,'display','flex'); imp(parent,'flex-direction','column'); imp(parent,'align-items','stretch');
      parent = parent.parentElement;
    }
  }
  if (summary && profile) {
    let node = summary.parentElement;
    while (node && node.id !== 'review') {
      if (node.contains(profile)) {
        node.classList.add('kwf-v2-overview-stack'); forceFullRow(node);
        imp(node,'display','flex'); imp(node,'flex-direction','column'); imp(node,'align-items','stretch');
        break;
      }
      node = node.parentElement;
    }
  }
}

function markMisplacedPlacementControls() {
  const study = document.querySelector('#study') || document;
  const labels = [...study.querySelectorAll('span, p, div, small')].filter(el => text(el) === '选择备考起点');
  for (const label of labels) {
    let node = label;
    for (let depth = 0; node && depth < 5; depth += 1, node = node.parentElement) {
      const body = text(node);
      if ((body.includes('从初级 1 开始') || body.includes('我有基础，从 3 级开始') || body.includes('备考高级，从 5 级开始') || body.includes('定位测验')) && body.length < 420) {
        node.classList.add('kwf-v2-placement-misplaced');
        node.dataset.kwfV2Placement = 'hidden-from-study-library';
        break;
      }
    }
  }
}

async function enhanceLearnedRows() {
  const data = await getEnrichment();
  const entries = data?.entries || {};
  for (const row of document.querySelectorAll('#learned-library-section .kwf-learned-row')) {
    const word = text(row.querySelector('.learned-word-main b'));
    if (!word) continue;
    const existing = row.querySelector('.kwf-row-collocation');
    const collocations = entries[word]?.collocations?.slice(0, 2) || [];
    if (!collocations.length) { existing?.remove(); row.classList.remove('kwf-has-collocation'); continue; }
    const host = existing || document.createElement('div');
    host.className = 'kwf-row-collocation'; host.dataset.word = word; host.setAttribute('aria-label', '常用搭配'); host.replaceChildren();
    for (const item of collocations) { const span = document.createElement('span'); span.textContent = item; span.title = item; host.appendChild(span); }
    if (!existing) row.appendChild(host);
    row.classList.add('kwf-has-collocation');
  }
}

function markV2Ready() { document.documentElement.dataset.kwfLayout = 'v2'; window.__KWF_LAYOUT_V2_READY__ = true; }
async function applyV2() { v2State.scheduled = false; markV2Ready(); markOverviewStructure(); markMisplacedPlacementControls(); await enhanceLearnedRows(); }
function schedule() { if (v2State.scheduled) return; v2State.scheduled = true; requestAnimationFrame(() => applyV2()); }
const observer = new MutationObserver(schedule);
function boot() { observer.observe(document.documentElement, { childList: true, subtree: true }); schedule(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
