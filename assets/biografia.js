document.addEventListener('DOMContentLoaded', () => {
  const accordion = document.querySelector('[data-accordion]');
  if (!accordion) return;

  const items = Array.from(accordion.querySelectorAll('.bio-item'));

  function closeItem(item) {
    const btn = item.querySelector('.bio-trigger');
    const panel = item.querySelector('.bio-panel');
    item.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    panel.style.display = 'none';
  }

  function openItem(item) {
    const btn = item.querySelector('.bio-trigger');
    const panel = item.querySelector('.bio-panel');
    items.forEach(other => {
      if (other !== item) closeItem(other);
    });
    item.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    panel.style.display = 'block';
  }

  items.forEach((item) => {
    const btn = item.querySelector('.bio-trigger');
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    item.classList.toggle('is-open', expanded);
    item.querySelector('.bio-panel').style.display = expanded ? 'block' : 'none';

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      if (isOpen) {
        closeItem(item);
      } else {
        openItem(item);
      }
    });
  });
});
