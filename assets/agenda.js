// Filtros de la agenda local. No modifica el minuto a minuto ni su feed.
(() => {
  'use strict';
  const buttons = Array.from(document.querySelectorAll('.agenda-filter-btn'));
  const panels = Array.from(document.querySelectorAll('.agenda-city-panel'));
  if (!buttons.length || !panels.length) return;
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const id = 'agenda-panel-' + button.dataset.target;
      buttons.forEach(b => {
        const active = b === button;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      panels.forEach(panel => { panel.hidden = panel.id !== id; });
    });
  });
})();
