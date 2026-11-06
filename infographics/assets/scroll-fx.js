/* Shared scroll effects for infographics. Content stays visible if this script fails to run. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sections = Array.prototype.slice.call(document.querySelectorAll('main > section'));
  if (!sections.length || !('IntersectionObserver' in window)) return;

  root.classList.add('fx');

  // Ghost layer: copy each section's heading icon as a big background element.
  sections.forEach(function (s) {
    var ic = s.querySelector('h2 > span');
    if (!ic) return;
    var g = document.createElement('div');
    g.className = 'fx-ghost';
    g.setAttribute('aria-hidden', 'true');
    g.textContent = ic.textContent;
    s.appendChild(g);
  });

  // Stagger index per group of siblings.
  sections.forEach(function (s) {
    var groups = new Map();
    s.querySelectorAll('.card,.step,.rung,.col,.vsb,.stat,.chk li,.bar,tr,.callout').forEach(function (el) {
      var p = el.parentElement;
      var n = groups.get(p) || 0;
      el.style.setProperty('--i-fx', Math.min(n, 10));
      groups.set(p, n + 1);
    });
  });

  // Reveal when entering view.
  var reveal = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  sections.forEach(function (s) { reveal.observe(s); });

  if (reduce) return;

  var bar = document.createElement('div');
  bar.className = 'fx-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  var hero = document.querySelector('.hero');
  var ticking = false;

  function update() {
    ticking = false;
    var y = window.scrollY, h = root.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(y / h, 1) : 0) + ')';
    if (hero) {
      var p = Math.min(Math.max(y / (hero.offsetHeight || 1), 0), 1);
      hero.style.setProperty('--hero-p', p.toFixed(3));
    }
    // Parallax scenes. Pin offset lets sections taller than the viewport scroll
    // to their bottom before pinning.
    var vh = window.innerHeight;
    var natTop = sections[0].parentElement.getBoundingClientRect().top + y; // un-pinned layout position
    sections.forEach(function (s, i) {
      s.style.setProperty('--stick', Math.min(0, vh - s.offsetHeight) + 'px');
      var next = sections[i + 1];
      var cover = next ? Math.min(Math.max(1 - next.getBoundingClientRect().top / vh, 0), 1) : 0;
      s.style.setProperty('--cover', cover.toFixed(3));
      var off = natTop + s.offsetHeight / 2 - (y + vh / 2); // 0 when section is centred
      natTop += s.offsetHeight;
      s.style.setProperty('--py', (off * -0.25).toFixed(1));
      s.style.setProperty('--py2', (off * 0.18).toFixed(1));
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();
})();
