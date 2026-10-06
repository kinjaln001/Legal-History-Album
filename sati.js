(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const ease = t => 1 - Math.pow(1 - t, 3);
  const $ = s => document.querySelector(s);
  const set = (el, k, v) => el && el.style.setProperty(k, v);

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
  const hot = new Set(['stone', 'fire', '1829,', '1987.']);
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

  /* ---------- 1987 film: plays muted while on screen ---------- */
  const video = $('.phone video'), sound = $('.sound');
  if (video) {
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !reduce) video.play().catch(() => {}); else video.pause();
    }, { threshold: .5 }).observe(video);
    sound.addEventListener('click', () => {
      video.muted = !video.muted;
      video.play().catch(() => {});
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
  const hero = $('.hero'), prologue = $('.prologue'), arch = $('.arch'), verm = $('.vermilion'), pan = $('.pan');
  const track = $('.track'), rail = $('.track-rail'), read = $('.read'), readDoc = $('.read-doc');
  const litho = $('.litho'), drain = $('.drain'), steps = $('.steps'), turn = $('.turn'), press = $('.press');
  const tract = $('.tract'), ghat = $('.ghat');
  const news = $('.part-news'), bar = $('.progress');

  // where the camera looks on the satire: whole print, the speech bubble, the bags of rupees
  // s = zoom, x / y = the point (0–1) the camera centres on
  const readViews = [
    { s: 1, x: .5, y: .5 },
    { s: 2.2, x: .8, y: .18 },
    { s: 2.2, x: .9, y: .68 }
  ];
  let readN = -1;
  const setRead = n => {
    if (n === readN) return;
    readN = n;
    read.dataset.n = n;
    const v = readViews[n];
    // keep the view inside the print's edges
    const lim = .5 - .5 / v.s;
    const cx = clamp(v.x - .5, -lim, lim), cy = clamp(v.y - .5, -lim, lim);
    set(readDoc, '--rs', v.s);
    set(readDoc, '--rx', `${-cx * v.s * 100}%`);
    set(readDoc, '--ry', `${-cy * v.s * 100}%`);
  };
  setRead(0);

  const railShift = () => Math.max(0, rail.scrollWidth - innerWidth);

  function frame() {
    set(bar, '--read', clamp(scrollY / (document.documentElement.scrollHeight - vh())));

    // the handprint presses in, the title lifts away
    let p = prog(hero);
    const press0 = ease(seg(p, 0, .35));
    set(hero, '--hs', 1.35 - press0 * .35);
    set(hero, '--ho', .1 + press0 * .55 - seg(p, .7, 1) * .4);
    set(hero, '--ty', `${-seg(p, .1, .7) * 16}vh`);
    set(hero, '--to', 1 - seg(p, .35, .75));
    set(hero, '--cue', 1 - seg(p, 0, .1));

    p = prog(prologue);
    const lit = Math.floor(seg(p, .05, .8) * (words.length + 1));
    words.forEach((w, i) => {
      w.classList.toggle('lit', i < lit);
      w.classList.toggle('hot', i < lit && w.classList.contains('hot-word'));
    });

    // the arch widens until the whole pillar shows
    p = prog(arch);
    const a = ease(seg(p, 0, .6));
    set(arch, '--ay', `${22 * (1 - a)}%`);
    set(arch, '--ax', `${26 * (1 - a)}%`);
    set(arch, '--ar', `${50 - a * 49}%`);
    set(arch, '--az', 1.25 - a * .25);

    // start on the vermilion, pull back to the whole stone
    p = prog(verm);
    set(verm, '--vz', 4.5 - ease(seg(p, .05, .75)) * 3.5);

    p = prog(pan);
    set(pan, '--pan', seg(p, .08, .92));

    p = prog(track);
    set(rail, '--tx', `${-seg(p, .05, .95) * railShift()}px`);

    p = prog(read);
    setRead(p < .3 ? 0 : p < .62 ? 1 : 2);

    // the lithograph is pulled from the top down
    p = prog(litho);
    const l = ease(seg(p, 0, .5));
    set(litho, '--lp', 1 - l);
    set(litho, '--lr', 1 - seg(p, .45, .55));
    set(litho, '--lt', seg(p, .4, .62));
    set(litho, '--ltt', `${20 - seg(p, .4, .62) * 20}px`);

    // portrait from the left, the tract from the right
    p = prog(tract);
    const ta = ease(seg(p, 0, .4)), tb = ease(seg(p, .15, .55));
    set(tract, '--ta', `${-(1 - ta) * 40}vw`);
    set(tract, '--tao', ta);
    set(tract, '--tb', `${(1 - tb) * 40}vw`);
    set(tract, '--tbo', tb);

    // 1829: the fire goes grey and the year comes up
    p = prog(drain);
    const d = seg(p, .25, .6);
    set(drain, '--sat', 1 - d);
    set(drain, '--br', 1 - d * .55);
    set(drain, '--dzm', 1.08 - seg(p, 0, 1) * .08);
    const dc = seg(p, .45, .65);
    set(drain, '--dc', dc);
    set(drain, '--dct', `${30 - dc * 30}px`);

    // Bourne's ghat settles, then dissolves into the later photograph
    p = prog(ghat);
    set(ghat, '--ga', 1.12 - ease(seg(p, 0, .45)) * .12);
    const gb = seg(p, .45, .7);
    set(ghat, '--gb', gb);
    ghat.classList.toggle('b-on', gb > .5);

    p = prog(steps);
    set(steps, '--sz', 1.35 - ease(seg(p, 0, .7)) * .35);

    // night turns to newsprint, then the date
    p = prog(turn);
    const mix = seg(p, .15, .45), tc = seg(p, .4, .6);
    set(turn, '--mix', mix);
    set(turn, '--tc', tc);
    set(turn, '--tct', `${30 - tc * 30}px`);
    set(turn, '--turn-ink', mix > .5 ? '#1c1714' : '#ecdcc6');
    set(turn, '--turn-soft', mix > .5 ? '#5d544b' : '#b19883');
    document.body.dataset.part = (mix > .5 || news.getBoundingClientRect().top < vh() * .5) ? 'light' : 'dark';

    // the magazine lands on the table
    p = prog(press);
    const m = ease(seg(p, 0, .45));
    set(press, '--py', `${(1 - m) * 60}vh`);
    set(press, '--pr', `${-9 + m * 6.5}deg`);
    set(press, '--pt', seg(p, .4, .6));
    set(press, '--ptt', `${20 - seg(p, .4, .6) * 20}px`);
  }

  if (reduce) {
    // static: every scene in its final state; only the satire notes and nav follow scroll
    words.forEach(w => w.classList.add('lit', ...(w.classList.contains('hot-word') ? ['hot'] : [])));
    [[hero, { '--hs': 1, '--ho': .5 }],
     [arch, { '--ay': '0%', '--ax': '0%', '--ar': '1%', '--az': 1 }],
     [verm, { '--vz': 1 }],
     [litho, { '--lp': 0, '--lr': 0, '--lt': 1, '--ltt': '0px' }],
     [drain, { '--sat': .15, '--br': .5, '--dzm': 1, '--dc': 1, '--dct': '0px' }],
     [tract, { '--ta': '0vw', '--tao': 1, '--tb': '0vw', '--tbo': 1 }],
     [steps, { '--sz': 1 }],
     [turn, { '--mix': 1, '--tc': 1, '--tct': '0px', '--turn-ink': '#1c1714', '--turn-soft': '#5d544b' }],
     [press, { '--py': '0vh', '--pr': '-2.5deg', '--pt': 1, '--ptt': '0px' }]
    ].forEach(([el, vars]) => Object.entries(vars).forEach(([k, v]) => set(el, k, v)));
    // the travelling prints and the miniature become plain blocks
    track.style.height = 'auto';
    track.querySelector('.sticky').style.cssText = 'position:relative;height:auto;padding:10vh 0';
    rail.style.cssText = 'flex-direction:column;align-items:center;gap:6vh';
    // the two ghat photographs stack one above the other
    ghat.style.height = 'auto';
    ghat.querySelector('.sticky').style.cssText = 'position:relative;height:auto;padding:10vh 0;display:grid;place-items:center';
    ghat.querySelector('.ghat-stage').style.cssText = 'aspect-ratio:auto;display:grid;gap:6vh';
    ghat.querySelectorAll('.ghat-plate').forEach(g => { g.style.cssText = 'position:relative;inset:auto;opacity:1;pointer-events:auto;aspect-ratio:1760 / 1290'; });
    pan.style.height = 'auto';
    pan.querySelector('.sticky').style.cssText = 'position:relative;height:auto;padding:10vh 0;display:grid;place-items:center';
    pan.querySelector('.pan-plate').style.height = 'auto';
    const lightOnly = () => {
      setRead(Math.min(2, Math.floor(prog(read) * 3)));
      set(bar, '--read', clamp(scrollY / (document.documentElement.scrollHeight - vh())));
      document.body.dataset.part = news.getBoundingClientRect().top < vh() * .5 || prog(turn) > .3 ? 'light' : 'dark';
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
    addEventListener('load', onScroll);
    frame();
  }
})();
