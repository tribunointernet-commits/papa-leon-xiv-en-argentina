// Infografía de viajes papales. Hover/foco en escritorio, toque/clic en celulares.
// Funciona de forma independiente del minuto a minuto y de la agenda.
document.addEventListener('DOMContentLoaded', () => {
  const section = document.getElementById('visitas-latinoamerica');
  const tooltip = document.getElementById('papal-tooltip');
  if (!section || !tooltip) return;

  const controls = [...section.querySelectorAll('[data-tooltip]')];
  let active = null;
  let pinned = false;

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'papal-tooltip-close';
  close.setAttribute('aria-label', 'Cerrar información');
  close.textContent = '×';
  close.addEventListener('click', (event) => { event.stopPropagation(); hide(); });

  function position(el) {
    if (!el || tooltip.hidden) return;
    if (window.matchMedia('(max-width: 600px)').matches) {
      tooltip.style.left = '12px';
      tooltip.style.top = 'auto';
      tooltip.style.bottom = '12px';
      return;
    }
    tooltip.style.bottom = 'auto';
    const r = el.getBoundingClientRect();
    const t = tooltip.getBoundingClientRect();
    tooltip.style.left = `${Math.max(12, Math.min(r.left + r.width / 2 - t.width / 2, innerWidth - t.width - 12))}px`;
    const above = r.top - t.height - 12;
    tooltip.style.top = `${above >= 12 ? above : Math.min(r.bottom + 12, innerHeight - t.height - 12)}px`;
  }
  function show(el, pin=false) {
    if (pinned && !pin && active !== el) return;
    active = el;
    pinned = pin;
    tooltip.replaceChildren();
    const content = document.createElement('span');
    content.className = 'papal-tooltip-content';
    content.textContent = el.dataset.tooltip;
    tooltip.append(content, close);
    tooltip.hidden = false;
    position(el);
    controls.forEach(button => button.setAttribute('aria-expanded', String(button === el)));
  }
  function hide() {
    active = null;
    pinned = false;
    tooltip.hidden = true;
    controls.forEach(button => button.setAttribute('aria-expanded', 'false'));
  }
  controls.forEach(el => {
    el.setAttribute('aria-expanded', 'false');
    el.setAttribute('aria-controls', 'papal-tooltip');
    el.addEventListener('mouseenter', () => { if (!pinned) show(el); });
    el.addEventListener('mouseleave', () => { if (!pinned && active===el) hide(); });
    el.addEventListener('focus', () => { if (!pinned) show(el); });
    el.addEventListener('blur', () => { if (!pinned && active===el) hide(); });
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      if (pinned && active===el) hide();
      else show(el,true);
    });
  });
  document.addEventListener('click', event => {
    if (pinned && !tooltip.contains(event.target) && !event.target.closest('#visitas-latinoamerica [data-tooltip]')) hide();
  });
  document.addEventListener('keydown', event => { if (event.key==='Escape') hide(); });
  window.addEventListener('resize', () => { if (active) position(active); });
  window.addEventListener('scroll', () => { if (active) position(active); }, {passive:true});
});
