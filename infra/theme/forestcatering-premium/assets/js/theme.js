(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const switchButtons = Array.from(document.querySelectorAll('[data-brand-switch] [data-brand]'));
  const brandBlocks = Array.from(document.querySelectorAll('[data-brand-content]'));

  const setBrand = (brand) => {
    switchButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.brand === brand);
    });
    brandBlocks.forEach((block) => {
      block.classList.toggle('is-hidden', block.dataset.brandContent !== brand);
    });
  };

  switchButtons.forEach((button) => {
    button.addEventListener('click', () => setBrand(button.dataset.brand));
  });

  if (!reducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
  } else {
    document.querySelectorAll('[data-animate]').forEach((el) => el.classList.add('is-visible'));
  }
})();
