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

function text(el) {
  return (el?.textContent || '').replace(/\s+/g, ' ').trim();
}

function markMisplacedPlacementControls() {
  const study = document.querySelector('#study') || document;
  const labels = [...study.querySelectorAll('span, p, div, small')]
    .filter(el => text(el) === '选择备考起点');

  for (const label of labels) {
    let node = label;
    for (let depth = 0; node && depth < 5; depth += 1, node = node.parentElement) {
      const body = text(node);
      const hasPlacementActions =
        body.includes('从初级 1 开始') ||
        body.includes('我有基础，从 3 级开始') ||
        body.includes('备考高级，从 5 级开始') ||
        body.includes('定位测验');
      if (hasPlacementActions && body.length < 420) {
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
  const rows = document.querySelectorAll('#learned-library-section .kwf-learned-row');

  for (const row of rows) {
    const word = text(row.querySelector('.learned-word-main b'));
    if (!word) continue;

    const existing = row.querySelector('.kwf-row-collocation');
    const collocations = entries[word]?.collocations?.slice(0, 2) || [];

    if (!collocations.length) {
      existing?.remove();
      row.classList.remove('kwf-has-collocation');
      continue;
    }

    const host = existing || document.createElement('div');
    host.className = 'kwf-row-collocation';
    host.dataset.word = word;
    host.setAttribute('aria-label', '常用搭配');
    host.replaceChildren();

    for (const item of collocations) {
      const span = document.createElement('span');
      span.textContent = item;
      span.title = item;
      host.appendChild(span);
    }

    if (!existing) row.appendChild(host);
    row.classList.add('kwf-has-collocation');
  }
}

function markV2Ready() {
  document.documentElement.dataset.kwfLayout = 'v2';
  window.__KWF_LAYOUT_V2_READY__ = true;
}

async function applyV2() {
  v2State.scheduled = false;
  markV2Ready();
  markMisplacedPlacementControls();
  await enhanceLearnedRows();
}

function schedule() {
  if (v2State.scheduled) return;
  v2State.scheduled = true;
  requestAnimationFrame(() => applyV2());
}

const observer = new MutationObserver(schedule);
function boot() {
  observer.observe(document.documentElement, { childList: true, subtree: true });
  schedule();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
