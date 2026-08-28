const state = { data: null, lastKey: '' };

async function loadEnrichment() {
  if (state.data) return state.data;
  try {
    const res = await fetch('data/enrichment.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state.data = await res.json();
  } catch (error) {
    console.warn('[KWF] enrichment unavailable', error);
    state.data = { entries: {} };
  }
  return state.data;
}

function section(title, className, body) {
  const el = document.createElement('section');
  el.className = className;
  const h = document.createElement('h5');
  h.textContent = title;
  el.appendChild(h);
  el.appendChild(body);
  return el;
}

function renderExtra(entry, host, key) {
  const existing = host.querySelector('.kwf-learning-extra');
  if (existing?.dataset.key === key) return;
  existing?.remove();

  if (!entry?.collocations?.length && !entry?.confusion) return;

  const wrap = document.createElement('div');
  wrap.className = 'kwf-learning-extra';
  wrap.dataset.key = key;

  if (entry.collocations?.length) {
    const ul = document.createElement('ul');
    entry.collocations.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      ul.appendChild(li);
    });
    wrap.appendChild(section('固定搭配', 'kwf-collocations', ul));
  }

  if (entry.confusion) {
    const p = document.createElement('p');
    const label = document.createElement('mark');
    label.textContent = `${key} vs ${entry.confusion.with}`;
    p.append(label, document.createTextNode(`：${entry.confusion.note}`));
    wrap.appendChild(section('易混辨析', 'kwf-confusion', p));
  }

  host.appendChild(wrap);
}

async function enhanceCard() {
  const card = document.querySelector('#study .study-card');
  const headword = card?.querySelector('.word h3')?.textContent?.trim();
  const host = card?.querySelector('.answer-scroll');
  if (!card || !headword || !host) return;

  const key = `${headword}:${host.textContent?.slice(0, 80) ?? ''}`;
  if (state.lastKey === key && host.querySelector('.kwf-learning-extra')) return;
  state.lastKey = key;

  const data = await loadEnrichment();
  renderExtra(data.entries?.[headword], host, headword);
}

const observer = new MutationObserver(() => {
  requestAnimationFrame(enhanceCard);
});

function boot() {
  window.__KWF_ENHANCEMENT_READY__ = true;
  observer.observe(document.documentElement, { childList: true, subtree: true });
  enhanceCard();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
