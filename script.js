(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a)); // map p from [a,b] to [0,1]
  const ease = t => 1 - Math.pow(1 - t, 3);
  const $ = s => document.querySelector(s);
  const set = (el, k, v) => el && el.style.setProperty(k, v);

  /* ---------- date chip on each plate, taken from its caption ---------- */
  document.querySelectorAll('.plate').forEach(p => {
    const meta = p.querySelector('.plate-meta');
    if (meta) p.dataset.chip = meta.textContent.split('·')[0].trim();
  });

  /* ---------- optional Part II images: images/<name>.(jpg|png|webp|jpeg), hidden if absent ---------- */
  const exts = ['jpg', 'png', 'webp', 'jpeg'];
  document.querySelectorAll('.file-img[data-src]').forEach(fig => {
    const img = fig.querySelector('img');
    let i = 0;
    const next = () => {
      if (i >= exts.length) { fig.classList.add('no-img'); img.remove(); return; }
      img.src = `${fig.dataset.src}.${exts[i++]}`;
    };
    img.addEventListener('error', next);
    next();
  });

  /* ---------- tap to open captions on touch ---------- */
  document.querySelectorAll('.plate').forEach(p => {
    p.addEventListener('click', e => {
      if (e.target.closest('a')) return;
      const was = p.classList.contains('open');
      document.querySelectorAll('.plate.open').forEach(o => o.classList.remove('open'));
      if (!was) p.classList.add('open');
    });
    p.addEventListener('keydown', e => { if (e.key === 'Enter') p.click(); });
  });

  /* ---------- split prologue into words ---------- */
  const hot = new Set(['god.', 'temple.', 'file.']);
  document.querySelectorAll('[data-split]').forEach(el => {
    el.innerHTML = el.textContent.trim().split(/\s+/)
      .map(w => `<span class="w${hot.has(w) ? ' hot-word' : ''}">${w}</span>`).join(' ');
  });

  /* ---------- reveal on enter ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: .15, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ---------- Part II ledgers: sticky year follows the card in view ---------- */
  document.querySelectorAll('.ledger').forEach(ledger => {
    const num = ledger.querySelector('.ledger-year-num');
    const label = ledger.querySelector('.ledger-year-label');
    const yio = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const { year, label: l } = en.target.dataset;
        if (num.textContent === year) return;
        num.classList.add('swap');
        setTimeout(() => { num.textContent = year; label.textContent = l; num.classList.remove('swap'); }, 220);
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    ledger.querySelectorAll('.entry').forEach(el => yio.observe(el));
  });

  /* ---------- ritual steps: zoom regions on the drawing ---------- */
  const zoomRegions = [
    { ox: '50%', oy: '17%', s: 2.7, name: 'The tali and the jewels' },
    { ox: '18%', oy: '41%', s: 3.0, name: 'Hands and bangles' },
    { ox: '44%', oy: '83%', s: 3.0, name: 'Ankle bells for the procession' },
    { ox: '74%', oy: '32%', s: 3.0, name: 'The vessel' }
  ];
  const stepsEl = $('.steps');
  const stepItems = [...document.querySelectorAll('.step')];
  const railItems = [...document.querySelectorAll('.step-rail span')];
  const zoomImg = $('.zoom-img');
  const zoomName = $('.zoom-name');
  let curStep = -1;
  const setStep = i => {
    if (i === curStep) return;
    curStep = i;
    stepItems.forEach((s, k) => s.classList.toggle('on', k === i));
    railItems.forEach((s, k) => s.classList.toggle('on', k <= i));
    const r = zoomRegions[i];
    set(zoomImg, '--ox', r.ox); set(zoomImg, '--oy', r.oy); set(zoomImg, '--zs', r.s);
    zoomName.textContent = r.name;
  };
  setStep(0);

  /* ---------- scroll progress helpers (shared with narrator.js) ---------- */
  const vh = () => window.innerHeight;
  const sceneProgress = el => {
    const r = el.getBoundingClientRect();
    const span = r.height - vh();
    return span > 0 ? clamp(-r.top / span) : clamp((vh() - r.top) / (vh() + r.height));
  };
  window.__sceneProgress = sceneProgress;

  const hero = $('.hero'), prologue = $('.prologue'), grant = $('.grant'), parallax = $('.parallax-solo');
  const hs = $('.hscroll'), track = $('.hscroll-track'), procession = $('.procession');
  const hinge = $('.hinge'), yearScene = $('.year-scene'), partFile = $('.part-file');
  const words = [...document.querySelectorAll('.big-words .w')];
  const progressBar = $('.progress');

  function frame() {
    set(progressBar, '--read', clamp(scrollY / (document.documentElement.scrollHeight - vh())));

    // hero: the line art draws itself, then pushes forward and dims
    let p = sceneProgress(hero);
    const draw = ease(seg(p, .08, .6)), out = seg(p, .7, 1);
    set(hero, '--hide', `${(1 - (.15 + .85 * draw)) * 100}%`);
    set(hero, '--ds', 1 + out * .7);
    set(hero, '--dy', `${out * 10}vh`);
    set(hero, '--do', 1 - out * .85);
    set(hero, '--ty', `${-seg(p, 0, .3) * 18}vh`);
    set(hero, '--to', 1 - seg(p, .04, .26));
    set(hero, '--cue', 1 - seg(p, 0, .1));
    set(hero, '--glow', .6 + draw * .4 - out * .5);
    set(hero, '--glow-scale', 1 + draw * .2);

    // prologue words light up
    p = sceneProgress(prologue);
    const lit = Math.floor(seg(p, .05, .8) * (words.length + 1));
    words.forEach((w, i) => {
      w.classList.toggle('lit', i < lit);
      w.classList.toggle('hot', i < lit && w.classList.contains('hot-word'));
    });

    // copper plate tilts up flat
    p = sceneProgress(grant);
    const g0 = ease(seg(p, 0, .55));
    set(grant, '--gx', `${38 * (1 - g0)}deg`);
    set(grant, '--gs', .78 + g0 * .22);
    set(grant, '--go', .3 + g0 * .7);

    // Belur card grows into the frame
    p = sceneProgress(parallax);
    const g = ease(seg(p, 0, .6));
    set(parallax, '--ps', .72 + g * .28);
    set(parallax, '--pr', `${40 - g * 22}px`);
    set(parallax, '--pi', 1.25 - g * .25);

    // horizontal gallery
    p = sceneProgress(hs);
    set(track, '--hx', `${-ease(seg(p, .04, .96)) * (track.scrollWidth - window.innerWidth)}px`);

    // procession opens to full bleed
    p = sceneProgress(procession);
    const f = ease(seg(p, 0, .6));
    set(procession, '--fi', `${18 * (1 - f)}%`);
    set(procession, '--fr', `${28 * (1 - f)}px`);
    set(procession, '--fs', 1.15 - f * .15);

    // the hinge: petition on lamp-light → paper → typed reply → stamp → Part II title
    p = sceneProgress(hinge);
    const mix = seg(p, .3, .5);
    set(hinge, '--mix', mix);
    set(hinge, '--px', `${-seg(p, .45, .65) * 30}px`);
    const o = ease(seg(p, .45, .62));
    set(hinge, '--ox2', `${(1 - o) * 70}vw`);
    set(hinge, '--oo', o);
    const s = seg(p, .64, .7);
    set(hinge, '--stamp-s', 2.5 - s * 1.5);
    set(hinge, '--stamp-o', s);
    const t = seg(p, .76, .9);
    set(hinge, '--title', t);
    set(hinge, '--tt', `${30 - t * 30}px`);
    set(hinge, '--dy2', `${-t * 12}vh`);
    set(hinge, '--docs', 1 - t * .35);
    // page "part" (nav theme) flips once the paper has come in
    const fileTop = partFile.getBoundingClientRect().top;
    document.body.dataset.part = (mix > .5 || fileTop < vh() * .5) ? 'file' : 'ritual';

    // 1909
    p = sceneProgress(yearScene);
    const y = ease(seg(p, 0, .5)), c = seg(p, .3, .55);
    set(yearScene, '--ys', 1.5 - y * .5);
    set(yearScene, '--yo', .2 + y * .35 - c * .3);
    set(yearScene, '--yc', c);
    set(yearScene, '--yt', `${40 - c * 40}px`);
    const st = seg(p, .55, .62);
    set(yearScene, '--stamp-s', 2.5 - st * 1.5);
    set(yearScene, '--stamp-o', st);

    // steps
    setStep(Math.min(3, Math.floor(sceneProgress(stepsEl) * 4)));
  }

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { frame(); ticking = false; });
  };

  if (reduce) {
    // static layout: everything shown in its final state; only the steps and nav still follow scroll
    words.forEach(w => w.classList.add('lit'));
    const finals = [
      [hero, { '--hide': '0%' }],
      [grant, { '--gx': '0deg', '--gs': 1, '--go': 1 }],
      [parallax, { '--ps': 1, '--pr': '18px', '--pi': 1 }],
      [procession, { '--fi': '0%', '--fr': '0px', '--fs': 1 }],
      [hinge, { '--mix': 1, '--ox2': '0vw', '--oo': 1, '--stamp-s': 1, '--stamp-o': 1, '--title': 1, '--tt': '0px' }],
      [yearScene, { '--yc': 1, '--yt': '0px', '--stamp-s': 1, '--stamp-o': 1, '--ys': 1 }]
    ];
    finals.forEach(([el, vars]) => Object.entries(vars).forEach(([k, v]) => set(el, k, v)));
    const light = () => {
      setStep(Math.min(3, Math.floor(sceneProgress(stepsEl) * 4)));
      set(progressBar, '--read', clamp(scrollY / (document.documentElement.scrollHeight - vh())));
      document.body.dataset.part = partFile.getBoundingClientRect().top < vh() * .5 || sceneProgress(hinge) > .4 ? 'file' : 'ritual';
      // the gallery has to scroll sideways or its plates are unreachable
      set(track, '--hx', `${-seg(sceneProgress(hs), .04, .96) * (track.scrollWidth - window.innerWidth)}px`);
    };
    addEventListener('scroll', light, { passive: true });
    light();
  } else {
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    frame();
  }
})();
