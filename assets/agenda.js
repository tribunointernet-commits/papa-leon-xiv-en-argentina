// Agenda cerrada inicialmente: solo se abre la ciudad elegida.
// No modifica el feed ni el minuto a minuto.
(() => {
  'use strict';
  const buttons = [...document.querySelectorAll('.agenda-filter-btn')];
  const panels = [...document.querySelectorAll('.agenda-city-panel')];
  const container = document.querySelector('.agenda-panels');
  if (!buttons.length || !panels.length || !container) return;

  function setOpen(target) {
    buttons.forEach(button => {
      const open = button.dataset.target === target;
      button.classList.toggle('is-active', open);
      button.setAttribute('aria-pressed', String(open));
      button.setAttribute('aria-expanded', String(open));
    });
    panels.forEach(panel => {
      panel.hidden = panel.id !== `agenda-panel-${target}`;
    });
    container.hidden = !target;
  }

  setOpen(null);
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const target = button.dataset.target;
      setOpen(button.classList.contains('is-active') ? null : target);
    });
  });
})();
