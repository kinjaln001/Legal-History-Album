/* Narrator component.
   Reads window.NARRATOR_MOMENTS and window.NARRATOR_OPTIONS (see index.html) and the
   artwork in <template id="narrator-art">. One narrator is reused for every moment. */
(() => {
  const opts = Object.assign({ typeSpeed: 20, minDwell: 900, hysteresis: 0.04 }, window.NARRATOR_OPTIONS || {});
  const moments = (window.NARRATOR_MOMENTS || [])
    .map((m, i) => ({ side: 'left', theme: 'temple', kicker: 'Did you know?', range: [0, 1], ...m, id: i, el: document.querySelector(m.trigger), played: false }))
    .filter(m => m.el);
  const art = document.getElementById('narrator-art');
  if (!moments.length || !art) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- DOM ---------- */
  const root = document.createElement('aside');
  root.className = 'narrator';
  root.dataset.side = moments[0].side;
  root.dataset.theme = moments[0].theme;
  root.innerHTML = '<div class="nar-figure"></div><div class="nar-bubble" aria-live="polite"><p class="nar-kicker"></p><p class="nar-text"></p></div>';
  root.querySelector('.nar-figure').appendChild(art.content.cloneNode(true));
  document.body.appendChild(root);
  const kickerEl = root.querySelector('.nar-kicker');
  const textEl = root.querySelector('.nar-text');

  /* ---------- progress through a trigger section, unclamped ----------
     Sticky scenes (taller than the viewport): 0 when the section top reaches the top of the screen, 1 when it is about to leave.
     Ordinary sections: 0 when the top enters at the bottom of the screen, 1 when the bottom leaves at the top. */
  const progress = el => {
    const r = el.getBoundingClientRect(), vh = innerHeight;
    const sticky = el.classList.contains('scene') && r.height > vh * 1.2;
    return sticky ? -r.top / (r.height - vh) : (vh - r.top) / (vh + r.height);
  };
  const inRange = (m, pad = 0) => { const p = progress(m.el); return p >= m.range[0] - pad && p <= m.range[1] + pad; };

  /* ---------- state ---------- */
  let active = null, isIn = false, shownAt = 0, seq = 0;
  let exitTimer = null, typeTimer = null;
  const later = (fn, ms) => { const s = seq; return setTimeout(() => { if (s === seq) fn(); }, reduce ? 0 : ms); };

  function stopTyping() { clearInterval(typeTimer); typeTimer = null; textEl.classList.remove('typing'); }

  function speak(m) {
    stopTyping();
    kickerEl.textContent = m.kicker;
    root.classList.add('is-speaking');
    if (m.played || reduce || !opts.typeSpeed) { textEl.textContent = m.text; m.played = true; return; }
    m.played = true; // never replay the typing for this moment
    textEl.textContent = '';
    textEl.classList.add('typing');
    let i = 0;
    later(() => {
      typeTimer = setInterval(() => {
        i += 1;
        textEl.textContent = m.text.slice(0, i);
        if (i >= m.text.length) stopTyping();
      }, opts.typeSpeed);
    }, 380);
  }

  function enter(m) {
    seq++;
    active = m; isIn = true; shownAt = performance.now();
    root.dataset.side = m.side;
    root.dataset.theme = m.theme;
    kickerEl.textContent = ''; textEl.textContent = '';
    root.classList.remove('is-speaking', 'shift');
    void root.offsetWidth; // let the side change settle before sliding in
    root.classList.add('is-in', 'walking');
    later(() => root.classList.remove('walking'), 950);
    later(() => speak(m), 750);
  }

  function swap(m) {
    seq++;
    const themeChanged = m.theme !== active.theme;
    active = m; shownAt = performance.now();
    root.classList.remove('is-speaking', 'walking');
    stopTyping();
    if (themeChanged) {
      // he steps across as the page turns from temple to file
      root.classList.remove('shift'); void root.offsetWidth;
      root.classList.add('shift');
      root.dataset.theme = m.theme;
      later(() => root.classList.remove('shift'), 1000);
    }
    later(() => speak(m), themeChanged ? 700 : 300);
  }

  function exit(then) {
    seq++;
    stopTyping();
    root.classList.remove('is-speaking');
    later(() => {
      root.classList.remove('is-in', 'walking', 'shift');
      isIn = false; active = null;
      if (then) later(then, 700);
    }, 250);
  }

  function show(m) {
    clearTimeout(exitTimer); exitTimer = null;
    if (!isIn) return enter(m);
    if (m.side === active.side) return swap(m);
    exit(() => enter(m));
  }

  function requestExit() {
    if (exitTimer) return;
    const wait = Math.max(0, opts.minDwell - (performance.now() - shownAt));
    exitTimer = setTimeout(() => {
      exitTimer = null;
      if (active && !inRange(active, opts.hysteresis) && !moments.some(m => inRange(m))) exit();
    }, wait);
  }

  function tick() {
    const cand = moments.find(m => inRange(m));
    if (cand) {
      clearTimeout(exitTimer); exitTimer = null;
      if (cand !== active) show(cand);
    } else if (active && !inRange(active, opts.hysteresis)) {
      requestExit();
    }
  }

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { tick(); ticking = false; });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  tick();
})();
