(() => {
  'use strict';
  const slider = document.getElementById('salta-slider');
  const prev = document.getElementById('salta-prev');
  const next = document.getElementById('salta-next');
  const status = document.getElementById('salta-status');
  const position = document.getElementById('salta-position');
  if (!slider || !prev || !next || !position) return;
  let cards = [];

  function updateNavigation() {
    const maxScroll = Math.max(0, slider.scrollWidth - slider.clientWidth);
    prev.disabled = slider.scrollLeft < 8;
    next.disabled = slider.scrollLeft >= maxScroll - 8;
    const step = slider.querySelector('.salta-story');
    if (step) {
      const full = step.getBoundingClientRect().width + 16;
      const current = Math.min(cards.length, Math.max(1, Math.round(slider.scrollLeft / full) + 1));
      position.textContent = `Historia ${current} de ${cards.length}`;
    }
  }

  function move(direction) {
    const first = slider.querySelector('.salta-story');
    if (!first) return;
    const style = getComputedStyle(slider);
    const gap = parseFloat(style.columnGap || style.gap) || 0;
    const step = first.getBoundingClientRect().width + gap;
    slider.scrollBy({ left: direction * step, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }

  function makeCard(item, i) {
    const a = document.createElement('a');
    a.className = 'salta-story';
    a.href = item.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', `Leer: ${item.title}`);
    if (item.image && /^https:\/\//i.test(item.image)) {
      const photo = document.createElement('img');
      photo.className = 'salta-story-image';
      photo.src = item.image;
      photo.alt = '';
      photo.loading = i < 2 ? 'eager' : 'lazy';
      photo.decoding = 'async';
      photo.addEventListener('error', () => { photo.remove(); });
      a.appendChild(photo);
    }
    const placeholder = document.createElement('span');
    placeholder.className = 'salta-story-fallback';
    placeholder.setAttribute('aria-hidden', 'true');
    placeholder.textContent = '✝';
    a.prepend(placeholder);

    const content = document.createElement('span');
    content.className = 'salta-story-content';
    const category = document.createElement('span');
    category.className = 'salta-story-category';
    category.textContent = item.category || 'SALTA Y EL PAPA';
    const title = document.createElement('strong');
    title.className = 'salta-story-title';
    title.textContent = item.title;
    const link = document.createElement('span');
    link.className = 'salta-story-link';
    link.textContent = 'LEER HISTORIA ↗';
    content.append(category, title, link);
    a.appendChild(content);
    return a;
  }

  async function loadStories() {
    try {
      const response = await fetch(`data/salta-cards.json?v=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      cards = (Array.isArray(payload.items) ? payload.items : []).filter(x => x.url && x.title);
      if (!cards.length) throw new Error('sin tarjetas');
      slider.replaceChildren(...cards.map(makeCard));
      updateNavigation();
    } catch (err) {
      status.textContent = 'No se pudieron cargar las historias. Consultá la cobertura de El Tribuno.';
      position.textContent = 'Historias no disponibles';
      prev.disabled = next.disabled = true;
    }
  }

  prev.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  slider.addEventListener('scroll', updateNavigation, { passive:true });
  window.addEventListener('resize', updateNavigation);
  slider.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
  });
  loadStories();
})();
