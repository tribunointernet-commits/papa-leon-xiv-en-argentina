// Infografía: tooltip compartido para hover, foco y toque.
// No utiliza bibliotecas externas ni afecta al script de noticias.
document.addEventListener('DOMContentLoaded', () => {
  const section = document.getElementById('visitas-latinoamerica');
  const tip = document.getElementById('papal-tooltip');
  if (!section || !tip) return;
  const controls = [...section.querySelectorAll('[data-tooltip]')];
  let active = null;
  let locked = false;
  const setPosition = (control) => {
    if (!control || tip.hidden) return;
    const r = control.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    const left = Math.min(Math.max(14, r.left + r.width / 2 - t.width / 2), window.innerWidth - t.width - 14);
    let top = r.top - t.height - 10;
    if (top < 12) top = r.bottom + 10;
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  };
  const show = (control, pin = false) => {
    if (locked && active && active !== control && !pin) return;
    active = control;
    locked = pin;
    tip.textContent = control.dataset.tooltip;
    tip.hidden = false;
    setPosition(control);
    controls.forEach(el => el.setAttribute('aria-expanded', String(el === control)));
  };
  const hide = () => {
    active = null;
    locked = false;
    tip.hidden = true;
    controls.forEach(el => el.setAttribute('aria-expanded', 'false'));
  };
  controls.forEach(control => {
    control.setAttribute('aria-expanded', 'false');
    control.addEventListener('mouseenter', () => { if (!locked) show(control); });
    control.addEventListener('mouseleave', () => { if (!locked && active === control) hide(); });
    control.addEventListener('focus', () => { if (!locked) show(control); });
    control.addEventListener('blur', () => { if (!locked && active === control) hide(); });
    control.addEventListener('click', (event) => {
      event.stopPropagation();
      if (locked && active === control) hide();
      else show(control, true);
    });
  });
  document.addEventListener('click', event => {
    if (locked && !section.contains(event.target)) hide();
    else if (locked && !event.target.closest('[data-tooltip]')) hide();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
  window.addEventListener('resize', () => { if (active) setPosition(active); });
  window.addEventListener('scroll', () => { if (active) setPosition(active); }, { passive: true });
});
