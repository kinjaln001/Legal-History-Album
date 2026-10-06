(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const ease = t => 1 - Math.pow(1 - t, 3);
  const $ = s => document.querySelector(s);
  const set = (el, k, v) => el && el.style.setProperty(k, v);

  /* ---------- embers ---------- */
  const embers = $('.embers');
  if (embers && !reduce) {
    for (let i = 0; i < 38; i++) {
      const e = document.createElement('span');
      e.className = 'ember';
      e.style.left = `${Math.random() * 100}%`;
      e.style.setProperty('--s', `${1.5 + Math.random() * 3}px`);
      e.style.setProperty('--d', `${7 + Math.random() * 9}s`);
      e.style.setProperty('--delay', `${-Math.random() * 14}s`);
      e.style.setProperty('--drift', `${(Math.random() - .5) * 160}px`);
      embers.appendChild(e);
    }
  }

  /* ---------- date chip from each caption ---------- */
  document.querySelectorAll('.plate').forEach(p => {
    const meta = p.querySelector('.plate-meta');
    if (meta) p.dataset.chip = meta.textContent.split('·')[0].trim();
  });

  /* ---------- tap to open captions ---------- */
  document.querySelectorAll('.plate').forEach(p => {
    p.addEventListener('click', e => {
      if (e.target.closest('a')) return;
      const was = p.classList.contains('open');
      document.querySelectorAll('.plate.open').forEach(o => o.classList.remove('open'));
      if (!was) p.classList.add('open');
    });
    p.addEventListener('keydown', e => { if (e.key === 'Enter') p.click(); });
  });

  /* ---------- prologue words ---------- */
  const hot = new Set(['pyre.', 'sari.', 'wedding.']);
  document.querySelectorAll('[data-split]').forEach(el => {
    el.innerHTML = el.textContent.trim().split(/\s+/)
      .map(w => `<span class="w${hot.has(w) ? ' hot-word' : ''}">${w}</span>`).join(' ');
  });
  const words = [...document.querySelectorAll('.big-words .w')];

  /* ---------- reveal on enter ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: .15, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ---------- postscript video: plays muted while on screen ---------- */
  const video = $('.phone video'), sound = $('.sound');
  if (video) {
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !reduce) video.play().catch(() => {}); else video.pause();
    }, { threshold: .5 }).observe(video);
    sound.addEventListener('click', () => {
      video.muted = !video.muted;
      if (!video.muted) video.play().catch(() => {});
      sound.textContent = video.muted ? 'Sound off' : 'Sound on';
      sound.setAttribute('aria-label', video.muted ? 'Turn sound on' : 'Turn sound off');
    });
  }

  /* ---------- scroll scenes ---------- */
  const vh = () => innerHeight;
  const prog = el => {
    const r = el.getBoundingClientRect(), span = r.height - vh();
    return span > 0 ? clamp(-r.top / span) : clamp((vh() - r.top) / (vh() + r.height));
  };
  const hero = $('.hero'), prologue = $('.prologue'), bleed = $('.bleed'), stack = $('.stack');
  const cards = [...document.querySelectorAll('.stack-card')];
  const ash = $('.ash'), pair = $('.pair'), pandit = $('.pandit'), act = $('.act'), actDoc = $('.act-doc');
  const sindoor = $('.sindoor'), doorway = $('.doorway'), light = $('.part-light'), bar = $('.progress');

  // where the camera looks on the Act: whole page, section 1, section 2
  // s = zoom, f = how far down the page (0–1) the camera centres
  const actViews = [
    { s: 1, f: .5 },
    { s: 1.3, f: .67 },
    { s: 1.3, f: .865 }
  ];
  let actN = -1;
  const setAct = n => {
    if (n === actN) return;
    actN = n;
    act.dataset.n = n;
    const v = actViews[n];
    set(actDoc, "--ds", v.s);
    set(actDoc, "--dty", `${-(v.f - .5) * v.s * 100}%`);
  };
  setAct(0);

  function frame() {
    set(bar, '--read', clamp(scrollY / (document.documentElement.scrollHeight - vh())));

    let p = prog(hero);
    set(hero, '--ty', `${-seg(p, 0, .6) * 16}vh`);
    set(hero, '--to', 1 - seg(p, .25, .7));
    set(hero, '--cue', 1 - seg(p, 0, .1));
    set(hero, '--glow', 1 - seg(p, .4, 1) * .7);
    set(hero, '--emb', 1 - seg(p, .6, 1) * .8);

    p = prog(prologue);
    const lit = Math.floor(seg(p, .05, .8) * (words.length + 1));
    words.forEach((w, i) => {
      w.classList.toggle('lit', i < lit);
      w.classList.toggle('hot', i < lit && w.classList.contains('hot-word'));
    });

    p = prog(bleed);
    const f = ease(seg(p, 0, .6));
    set(bleed, '--fi', `${16 * (1 - f)}%`);
    set(bleed, '--fr', `${10 * (1 - f)}px`);
    set(bleed, '--fs', 1.15 - f * .15);

    // each print slides up over the last; the ones beneath dim and sink
    p = prog(stack);
    const enter = [seg(p, 0, .18), seg(p, .3, .52), seg(p, .62, .84)].map(ease);
    cards.forEach((c, i) => {
      const covered = enter.slice(i + 1).reduce((a, b) => a + b, 0);
      set(c, '--cy', `${(1 - enter[i]) * 110}vh`);
      set(c, '--cs', 1 - covered * .05);
      set(c, '--cb', 1 - covered * .35);
    });

    // 1829: year rises in ember, the page whitens to ash, then chapter ii arrives
    p = prog(ash);
    const ac = seg(p, .05, .25), mix = seg(p, .35, .6), aa = seg(p, .75, .9);
    set(ash, '--ac', ac * (1 - aa));
    set(ash, '--at', `${30 - ac * 30}px`);
    set(ash, '--mix', mix);
    set(ash, '--ash-col', mix > .5 ? '#1d1c1a' : '#d4622b');
    set(ash, '--ash-ink', mix > .5 ? '#5f5a52' : '#e4ddd0');
    set(ash, '--aa', aa);
    set(ash, '--aat', `${30 - aa * 30}px`);
    const lightTop = light.getBoundingClientRect().top;
    document.body.dataset.part = (mix > .5 || lightTop < vh() * .5) ? 'light' : 'dark';

    p = prog(pair);
    set(pair, '--pa', `${(1 - p * 2) * 12}vh`);
    set(pair, '--pb', `${(p * 2 - 1) * 12}vh`);

    // the portrait opens from an oval
    p = prog(pandit);
    const o = ease(seg(p, 0, .5));
    set(pandit, '--pin', `${30 * (1 - o)}% ${22 * (1 - o)}%`);
    set(pandit, '--prad', `${50 * (1 - o) + 1}%`);
    set(pandit, '--pz', 1.3 - o * .3);
    set(pandit, '--bt', seg(p, .35, .6));
    set(pandit, '--btt', `${20 - seg(p, .35, .6) * 20}px`);

    p = prog(act);
    setAct(p < .3 ? 0 : p < .66 ? 1 : 2);

    p = prog(sindoor);
    set(sindoor, '--draw', 1 - ease(seg(p, 0, .45)));
    const sc = seg(p, .35, .55);
    set(sindoor, '--sc', sc);
    set(sindoor, '--st', `${30 - sc * 30}px`);

    p = prog(doorway);
    set(doorway, '--dz', 1.9 - ease(seg(p, 0, .7)) * .9);
  }

  if (reduce) {
    // static: every scene in its final state; only the Act notes and nav follow scroll
    words.forEach(w => w.classList.add('lit'));
    [[bleed, { '--fi': '0%', '--fr': '0px', '--fs': 1 }],
     [ash, { '--ac': 1, '--at': '0px', '--mix': 1, '--ash-col': '#1d1c1a', '--ash-ink': '#5f5a52', '--aa': 0 }],
     [pandit, { '--pin': '0% 0%', '--prad': '1%', '--pz': 1, '--bt': 1, '--btt': '0px' }],
     [sindoor, { '--draw': 0, '--sc': 1, '--st': '0px' }],
     [doorway, { '--dz': 1 }]
    ].forEach(([el, vars]) => Object.entries(vars).forEach(([k, v]) => set(el, k, v)));
    // stacked prints become a simple column when motion is off
    stack.style.height = 'auto';
    stack.querySelector('.sticky').style.cssText = 'position:relative;height:auto;display:flex;flex-direction:column;align-items:center;gap:6vh;padding:10vh 0';
    cards.forEach(c => { c.style.position = 'relative'; c.style.top = c.style.left = 'auto'; c.style.transform = 'none'; });
    const lightOnly = () => {
      setAct(Math.min(2, Math.floor(prog(act) * 3)));
      set(bar, '--read', clamp(scrollY / (document.documentElement.scrollHeight - vh())));
      document.body.dataset.part = light.getBoundingClientRect().top < vh() * .5 || prog(ash) > .5 ? 'light' : 'dark';
    };
    addEventListener('scroll', lightOnly, { passive: true });
    lightOnly();
  } else {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { frame(); ticking = false; });
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    frame();
  }
})();
