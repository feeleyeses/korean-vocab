const state = { enrichment: null, scheduled: false };
const important = (el, prop, value) => el?.style?.setProperty(prop, value, 'important');
const txt = el => (el?.textContent || '').replace(/\s+/g, ' ').trim();

async function enrichment() {
  if (state.enrichment) return state.enrichment;
  try {
    const r = await fetch('data/enrichment.json', { cache: 'no-store' });
    state.enrichment = r.ok ? await r.json() : { entries: {} };
  } catch { state.enrichment = { entries: {} }; }
  return state.enrichment;
}

function hideMisplacedPlacement() {
  const study = document.querySelector('#study');
  if (!study) return;
  for (const label of [...study.querySelectorAll('span,p,div,small')].filter(x => txt(x) === '选择备考起点')) {
    let node = label;
    for (let i = 0; node && i < 6; i++, node = node.parentElement) {
      const t = txt(node);
      if ((t.includes('从初级 1 开始') || t.includes('定位测验')) && t.length < 480) {
        node.classList.add('kwf-v3-placement-misplaced');
        break;
      }
    }
  }
}

function normalizeCard() {
  const card = document.querySelector('#study-card.study-card');
  if (!card) return;
  const mobile = matchMedia('(max-width: 900px)').matches;
  const cardH = mobile ? '600px' : '620px';
  const wordH = mobile ? '160px' : '168px';
  const revealed = Boolean(card.querySelector('.answer,.compact-answer,.answer-scroll'));
  const review = Boolean(card.querySelector('.review-question')) || /复习/.test(card.className);
  card.dataset.kwfUi = 'v3';
  card.dataset.kwfState = revealed ? 'revealed' : 'initial';
  card.dataset.kwfMode = review ? 'review' : 'learn';

  for (const [prop, value] of [
    ['overflow', 'hidden'], ['display', 'flex'], ['flex-direction', 'column'],
    ['height', cardH], ['min-height', cardH], ['max-height', cardH]
  ]) important(card, prop, value);

  const meta = card.querySelector('.card-meta');
  if (meta) {
    important(meta, 'flex', '0 0 68px');
    important(meta, 'height', '68px');
    important(meta, 'min-height', '68px');
    important(meta, 'max-height', '68px');
  }

  const word = card.querySelector('.word');
  if (word) {
    important(word, 'position', 'static');
    important(word, 'inset', 'auto');
    important(word, 'transform', 'none');
    important(word, 'translate', 'none');
    important(word, 'flex', `0 0 ${wordH}`);
    important(word, 'height', wordH);
    important(word, 'min-height', wordH);
    important(word, 'max-height', wordH);
    important(word, 'margin', '0');
  }

  // Kill inherited legacy offsets/sizing in state-dependent content.
  for (const el of card.querySelectorAll('.pre-answer,.answer,.compact-answer,.answer-scroll,.review-question,.pronunciation-stack,.sentence,.continue')) {
    important(el, 'position', 'static');
    important(el, 'inset', 'auto');
    important(el, 'transform', 'none');
    important(el, 'translate', 'none');
  }

  const pre = card.querySelector('.pre-answer');
  if (pre) {
    important(pre, 'flex', '1 1 0');
    important(pre, 'height', 'auto');
    important(pre, 'min-height', '0');
    important(pre, 'max-height', 'none');
  }

  for (const answer of card.querySelectorAll('.answer,.compact-answer')) {
    important(answer, 'flex', '1 1 0');
    important(answer, 'display', 'flex');
    important(answer, 'flex-direction', 'column');
    important(answer, 'height', 'auto');
    important(answer, 'min-height', '0');
    important(answer, 'max-height', 'none');
    important(answer, 'padding', '0');
    important(answer, 'margin', '0');
  }
  for (const scroll of card.querySelectorAll('.answer-scroll')) {
    important(scroll, 'flex', '1 1 0');
    important(scroll, 'height', 'auto');
    important(scroll, 'min-height', '0');
    important(scroll, 'max-height', 'none');
    important(scroll, 'overflow', 'visible');
  }
  for (const el of card.querySelectorAll('.answer *, .compact-answer *, .answer-scroll *')) important(el, 'text-align', 'center');

  const question = card.querySelector('.review-question');
  if (question) {
    important(question, 'flex', '1 1 0');
    important(question, 'height', 'auto');
    important(question, 'min-height', '0');
    important(question, 'max-height', 'none');
    important(question, 'overflow', 'visible');
  }

  // Review choices must always be a balanced 2 × 2 grid.
  for (const grid of card.querySelectorAll('.review-question > div')) {
    important(grid, 'display', 'grid');
    important(grid, 'grid-template-columns', 'repeat(2, minmax(0, 1fr))');
    important(grid, 'grid-template-rows', mobile ? 'repeat(2, 50px)' : 'repeat(2, 54px)');
    important(grid, 'height', 'auto');
  }
}

function normalizeReviewStack() {
  const board = document.querySelector('#review .review-board');
  if (!board) return;
  board.classList.add('kwf-v3-review-stack');
  important(board, 'display', 'flex');
  important(board, 'flex-direction', 'column');
  important(board, 'width', '100%');
  for (const el of board.querySelectorAll('.learned-stat,.memory-profile,.memory-note,#learned-library-section')) {
    important(el, 'width', '100%');
    important(el, 'max-width', '100%');
    important(el, 'grid-column', '1 / -1');
  }
}

async function normalizeLearnedRows() {
  const data = await enrichment();
  const entries = data?.entries || {};
  for (const row of document.querySelectorAll('#learned-library-section .kwf-learned-row')) {
    row.dataset.kwfUi = 'v3';
    important(row, 'align-items', 'center');
    const main = row.querySelector('.learned-word-main');
    const meaning = row.querySelector('.learned-word-meaning');
    const status = row.querySelector('.learned-word-status');
    for (const el of [main, meaning, status]) {
      important(el, 'align-self', 'center');
      important(el, 'justify-content', 'center');
    }

    const word = txt(main?.querySelector('b,strong'));
    if (!word) continue;
    const collocations = entries[word]?.collocations?.slice(0, 2) || [];
    let host = row.querySelector('.kwf-row-collocation');
    if (!collocations.length) { host?.remove(); continue; }
    if (!host) { host = document.createElement('div'); host.className = 'kwf-row-collocation'; row.appendChild(host); }
    host.replaceChildren(...collocations.map(item => {
      const s = document.createElement('span'); s.textContent = item; s.title = item; return s;
    }));
  }
}

async function apply() {
  state.scheduled = false;
  document.documentElement.dataset.kwfUi = 'v3';
  window.__KWF_UI_V3_READY__ = true;
  hideMisplacedPlacement();
  normalizeCard();
  normalizeReviewStack();
  await normalizeLearnedRows();
}

function schedule() {
  if (state.scheduled) return;
  state.scheduled = true;
  requestAnimationFrame(apply);
}

const observer = new MutationObserver(schedule);
function boot() {
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  addEventListener('resize', schedule, { passive: true });
  schedule();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
