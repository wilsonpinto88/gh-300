/* Shared scroll effects for infographics. Content stays visible if this script fails to run.
   Perf model: measure layout once (and on resize), then each scroll frame does pure math and
   writes only transform/opacity inline styles, and only when a value actually changed. */
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

  // Glow layer: real element (not a pseudo) so it can be moved without restyling the section subtree.
  var glows = sections.map(function (s) {
    var g = document.createElement('div');
    g.className = 'fx-glow';
    g.setAttribute('aria-hidden', 'true');
    s.insertBefore(g, s.firstChild);
    return g;
  });
  var ghosts = sections.map(function (s) { return s.querySelector(':scope > .fx-ghost'); });

  // Cached layout (updated by measure only).
  var tops = [], hs = [], stick = [], vh = 0, maxScroll = 0, heroH = 1;
  // Last written values, to skip redundant style writes.
  var last = sections.map(function () { return { c: -1, a: false, py: 1e9, py2: 1e9 }; });
  var lastBar = -1, lastHero = -1;

  function measure() {
    var y = window.scrollY;
    vh = window.innerHeight;
    // Reads first, writes after, so the browser lays out once.
    var mainTop = sections[0].parentElement.getBoundingClientRect().top + y; // un-pinned layout position
    var t = mainTop;
    for (var i = 0; i < sections.length; i++) {
      hs[i] = sections[i].offsetHeight;
      tops[i] = t;
      t += hs[i];
      stick[i] = Math.min(0, vh - hs[i]); // lets sections taller than the viewport scroll to their bottom before pinning
    }
    maxScroll = root.scrollHeight - vh;
    heroH = hero ? (hero.offsetHeight || 1) : 1;
    for (var j = 0; j < sections.length; j++) sections[j].style.top = stick[j] + 'px';
    update();
  }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function update() {
    ticking = false;
    var y = window.scrollY;

    var pr = maxScroll > 0 ? Math.min(y / maxScroll, 1) : 0;
    if (Math.abs(pr - lastBar) > 0.0005) { lastBar = pr; bar.style.transform = 'scaleX(' + pr.toFixed(4) + ')'; }

    if (hero) {
      var p = clamp(y / heroH, 0, 1);
      if (Math.abs(p - lastHero) > 0.002) {
        lastHero = p;
        hero.style.transform = 'translateY(' + (p * 40).toFixed(1) + 'px)';
        hero.style.opacity = (1 - p * 0.5).toFixed(3);
      }
    }

    for (var i = 0; i < sections.length; i++) {
      var s = sections[i], L = last[i];
      var nextTop = i + 1 < sections.length ? Math.max(tops[i + 1] - y, stick[i + 1]) : vh;
      var cover = clamp(1 - nextTop / vh, 0, 1);
      var selfTop = tops[i] - y;
      var active = selfTop < vh * 1.2 && cover < 1; // layer only while it can be seen moving

      if (active !== L.a) { L.a = active; s.style.willChange = active ? 'transform, opacity' : 'auto'; }
      if (Math.abs(cover - L.c) > 0.002 || (cover === 0) !== (L.c === 0) || (cover === 1) !== (L.c === 1)) {
        L.c = cover;
        s.style.transform = cover > 0.001 ? 'scale(' + (1 - cover * 0.06).toFixed(4) + ')' : '';
        s.style.opacity = cover > 0.001 ? (1 - cover * 0.65).toFixed(3) : '';
      }

      // Parallax: 0 when the section is centred. Clamped, so far-away sections stop writing.
      var off = clamp(tops[i] + hs[i] / 2 - (y + vh / 2), -3 * vh, 3 * vh);
      var py = Math.round(off * -0.25), py2 = Math.round(off * 0.18);
      if (py !== L.py) { L.py = py; glows[i].style.transform = 'translateY(' + py + 'px)'; }
      if (py2 !== L.py2 && ghosts[i]) {
        L.py2 = py2;
        ghosts[i].style.transform = 'translateY(' + py2 + 'px) rotate(' + (py2 * 0.06).toFixed(2) + 'deg)';
      }
    }
  }

  var ticking = false;
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  var rt;
  function onResize() { clearTimeout(rt); rt = setTimeout(measure, 120); }

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onResize);
  addEventListener('orientationchange', onResize);
  addEventListener('load', measure);
  if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(sections[0].parentElement);
  measure();
})();
