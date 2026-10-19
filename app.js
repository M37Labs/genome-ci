/* M37 delivery protocol: every animation is an anime.js v4 instance, scrubbed by a smoothed scroll position. */
(() => {
  const { animate, createTimeline, stagger, svg, spring, cubicBezier } = window.anime;
  const glide = cubicBezier(0.2, 0.8, 0.2, 1); // the same curve as --ease in CSS
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const mk = (tag, attrs = {}, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  };
  const docTop = (el) => el.getBoundingClientRect().top + window.scrollY;

  document.documentElement.classList.add('js');

  let target = window.scrollY;
  let smooth = target;
  let vh = window.innerHeight;
  const scenes = [];

  /* A scene maps an element's passage through the viewport to 0..1 and seeks a timeline with it. */
  function scene(el, tl, { start = 0.85, end = 0.4, after } = {}) {
    const s = { el, tl, start, end, after, top: 0, h: 0, last: -1 };
    s.measure = () => { s.top = docTop(el); s.h = el.offsetHeight; };
    s.update = (sy) => {
      const p = clamp((sy + vh * s.start - s.top) / (s.h + vh * (s.start - s.end)));
      if (Math.abs(p - s.last) < 0.0005) return;
      s.last = p;
      tl.seek(p * tl.duration);
      if (s.after) s.after(p);
    };
    scenes.push(s);
    return s;
  }

  /* ---------------- HUD ---------------- */
  const stages = $$('.stage');
  const modes = $$('.mode');
  const hudTicks = $('.hud-ticks');
  const hudNow = $('.hud-now');
  const hudItems = [...stages.map((s) => [s.dataset.code, s.dataset.name]), ['M37-10', 'Rollout']];
  hudItems.forEach(() => hudTicks.appendChild(document.createElement('i')));
  let hudKey = '';
  function setHud(idx, label, code) {
    const key = idx + label;
    if (key === hudKey) return;
    hudKey = key;
    [...hudTicks.children].forEach((t, i) => t.classList.toggle('on', i <= idx));
    hudNow.innerHTML = idx < 0 ? '<b>Standby</b> scroll to begin' : `<b>${code ?? hudItems[Math.min(idx, hudItems.length - 1)][0]}</b> ${label}`;
  }

  /* ---------------- HERO ---------------- */
  if (!reduce) {
    createTimeline({ defaults: { ease: glide } })
      .add('.hero h1 .line > span', { y: ['105%', '0%'], opacity: [0, 1], duration: 1300, delay: stagger(120) })
      .add('.hero-lede', { opacity: [0, 1], y: [18, 0], filter: ['blur(8px)', 'blur(0px)'], duration: 1000 }, 380)
      .add('.hero-tube', { opacity: [0, 1], scale: [0.92, 1], duration: 900 }, 520)
      .add('.hero-capsule', { x: [-320, 0], duration: 1400, ease: spring({ bounce: 0.38, duration: 1100 }) }, 700)
      .add('.hero-cue', { opacity: [0, 1], duration: 700 }, 1100);
    animate('.cue-dot', { cy: [8, 17], opacity: [1, 0], duration: 1500, loop: true, ease: 'inOutSine' });
    // Ambient light drifts slowly behind the glass.
    $$('.ambient i').forEach((orb, i) => animate(orb, {
      x: [0, (i % 2 ? -1 : 1) * 90], y: [0, (i === 1 ? -1 : 1) * 70], scale: [1, 1.12],
      duration: 14000 + i * 3000, loop: true, alternate: true, ease: 'inOutSine',
    }));
  }

  /* ---------------- GENOME (scroll-scrubbed GitFlow) ---------------- */
  {
    const root = $('.flow svg');
    const T = 3; // ms per SVG unit, so the playhead sweeps at a constant speed
    const tl = createTimeline({ autoplay: false });
    $$('.br', root).forEach((p) => {
      const x0 = +p.dataset.x0, x1 = +p.dataset.x1;
      tl.add(svg.createDrawable(p), { draw: ['0 0', '0 1'], duration: (x1 - x0) * T, ease: 'linear' }, x0 * T);
    });
    $$('.dot', root).forEach((d) => tl.add(d, { r: [0, 7], duration: 260, ease: 'outBack(3)' }, +d.dataset.x * T));
    $$('.tagg, .note', root).forEach((g) => tl.add(g, { opacity: [0, 1], duration: 300 }, +g.dataset.x * T));
    tl.add($('.playhead', root), { x1: [110, 1100], x2: [110, 1100], duration: 990 * T, ease: 'linear' }, 110 * T);
    tl.add($('.playhead', root), { opacity: [0.7, 0], duration: 200 }, 1100 * T);
    scene($('.flow'), tl, { start: 0.9, end: 0.55 });
  }

  /* ---------------- PIPELINE ---------------- */
  const pipe = $('#pipeline');
  const railSvg = $('.rail svg');
  const rail = { nodes: [], x: 0, echoX: 0, H: 0, top: 0, fill: null, forks: [], capsule: null, orbiters: [] };
  const stageTl = stages.map((st) => {
    const tl = createTimeline({ autoplay: false, defaults: { ease: glide } });
    const steps = $$('.steps li', st);
    if (steps.length) {
      tl.add(steps, { opacity: [0.28, 1], duration: 260, delay: stagger(170) }, 0);
      tl.add($$('.tick i', st), { scale: [0, 1], duration: 240, ease: 'outBack(2.4)', delay: stagger(170) }, 90);
    }
    if (st.dataset.kind === 'airlock') {
      tl.add($$('.door', st), { x: ['0%', '102%'], duration: 380, ease: 'inOutQuart', delay: stagger(150) }, 0);
    }
    if (st.dataset.kind === 'swarm') {
      tl.add($$('.agent', st), { opacity: [0.28, 1], duration: 220, delay: stagger(90) }, 0);
      tl.add($$('.agent-eye i', st), { x: [-6, 6], duration: 500, delay: stagger(60) }, 0);
      tl.add($('.verdict', st), { opacity: [0.2, 1], duration: 260 }, '+=60');
    }
    if (st.dataset.kind === 'sigil') {
      tl.add({ k: 0 }, { k: 1, duration: 800, ease: 'linear' }, 0); // placeholder span; hash text is written in update
    }
    return tl;
  });

  // Fingerprint scramble: characters lock in from left to right as the specimen passes.
  const hashEl = $('.hash');
  const real = hashEl.dataset.real;
  const hexes = '0123456789abcdef';
  let hashLocked = -1;
  function renderHash(p) {
    const n = Math.round(clamp(p) * real.length);
    if (n === hashLocked && n === real.length) return;
    hashLocked = n;
    let noise = '';
    const seed = Math.floor(performance.now() / 70);
    for (let i = n; i < real.length; i++) noise += hexes[(i * 7 + seed * 13 + i * seed) % 16];
    hashEl.innerHTML = `<span class="locked">${real.slice(0, n)}</span><span class="noise">${noise}</span>`;
  }

  function buildRail() {
    railSvg.innerHTML = '';
    const narrow = window.innerWidth <= 760;
    const W = pipe.querySelector('.rail').offsetWidth;
    rail.x = narrow ? 26 : W / 2;
    rail.echoX = rail.x + (narrow ? 22 : 52);
    rail.H = pipe.offsetHeight;
    rail.top = docTop(pipe);
    const x = rail.x;
    const end = rail.H - 20;

    rail.nodes = stages.map((st) => st.offsetTop + st.querySelector('h3').offsetTop + st.querySelector('h3').offsetHeight * 0.5);

    const d = `M${x} 0 V${end}`;
    // The M37 spectrum runs down the tube, pink at the bench to mint at release.
    const grad = mk('linearGradient', { id: 'm37-spectrum', gradientUnits: 'userSpaceOnUse', x1: x, y1: 0, x2: x, y2: end }, mk('defs', {}, railSvg));
    [['0', '#FF7BE7'], ['.14', '#FE01D0'], ['.28', '#C89FFC'], ['.42', '#A06BFF'], ['.58', '#4F86FF'], ['.78', '#47F0FF'], ['1', '#2BFFAA']]
      .forEach(([offset, c]) => mk('stop', { offset, 'stop-color': c }, grad));
    mk('path', { class: 'tube-bed', d }, railSvg);
    mk('path', { class: 'tube-wall', d: `M${x - 11} 0 V${end}` }, railSvg);
    mk('path', { class: 'tube-wall', d: `M${x + 11} 0 V${end}` }, railSvg);

    // Airlock: the tube splits into four parallel gates, then rejoins.
    rail.forks = [];
    const ai = stages.findIndex((s) => s.dataset.kind === 'airlock');
    if (ai > -1) {
      const y0 = rail.nodes[ai] + 30, y1 = rail.nodes[ai + 1] - 60;
      const spread = narrow ? [-15, -5, 5, 15] : [-36, -12, 12, 36];
      spread.forEach((dx) => {
        const fd = `M${x} ${y0} C${x} ${y0 + 40} ${x + dx} ${y0 + 20} ${x + dx} ${y0 + 70} V${y1 - 70} C${x + dx} ${y1 - 20} ${x} ${y1 - 40} ${x} ${y1}`;
        mk('path', { class: 'fork', d: fd }, railSvg);
        const f = mk('path', { class: 'fork-fill', d: fd }, railSvg);
        const anim = animate(svg.createDrawable(f), { draw: ['0 0', '0 1'], duration: 1000, ease: 'linear', autoplay: false });
        rail.forks.push({ anim, y0, y1 });
      });
    }

    const fillPath = mk('path', { class: 'tube-fill', d }, railSvg);
    rail.fill = animate(svg.createDrawable(fillPath), { draw: ['0 0', '0 1'], duration: 1000, ease: 'linear', autoplay: false });

    // Echo: a ground wire that every chamber reports to.
    mk('path', { class: 'echo-line', d: `M${rail.echoX} ${rail.nodes[0] - 60} V${end}` }, railSvg);
    const lbl = mk('text', { class: 'echo-label', x: rail.echoX + 6, y: rail.nodes[0] - 50 }, railSvg);
    lbl.textContent = 'ECHO';

    const hues = ['#FF7BE7', '#F54CDF', '#E06BF2', '#C89FFC', '#A06BFF', '#7F8BFF', '#5BA8FF', '#47F0FF', '#2BFFAA'];
    rail.chambers = rail.nodes.map((y, i) => {
      const style = `--c:${hues[Math.round((i / Math.max(rail.nodes.length - 1, 1)) * (hues.length - 1))]}`;
      mk('line', { class: 'echo-tap', x1: x + 18, y1: y, x2: rail.echoX, y2: y }, railSvg);
      const spark = mk('circle', { class: 'echo-spark', cx: x + 18, cy: y, r: 4 }, railSvg);
      const ring = mk('circle', { class: 'chamber-ring', cx: x, cy: y, r: 17, style }, railSvg);
      const c = mk('circle', { class: 'chamber', cx: x, cy: y, r: 17, style }, railSvg);
      const t = mk('text', { class: 'chamber-num', x, y }, railSvg);
      t.textContent = String(i + 1).padStart(2, '0');
      return { c, t, ring, spark, on: false };
    });

    rail.orbiters = [];
    const og = mk('g', {}, railSvg);
    for (let i = 0; i < 7; i++) rail.orbiters.push(mk('circle', { class: 'orbiter', r: narrow ? 2.5 : 3.5, opacity: 0 }, og));

    rail.capsule = mk('g', { class: 'capsule' }, railSvg);
    mk('rect', { class: 'capsule-glow', x: -16, y: -30, width: 32, height: 60, rx: 16 }, rail.capsule);
    mk('rect', { class: 'capsule-body', x: -9, y: -20, width: 18, height: 40, rx: 9 }, rail.capsule);
    mk('rect', { class: 'capsule-core', x: -4, y: -13, width: 4.5, height: 16, rx: 2.25 }, rail.capsule);

    rail.chambers.forEach((ch) => (ch.on = false));
    lastCapY = -1;
  }

  let lastCapY = -1;
  function updatePipeline(sy, now) {
    if (!rail.capsule) return;
    const capY = clamp(sy + vh * 0.5 - rail.top, 0, rail.H - 20);
    const swarmIdx = stages.findIndex((s) => s.dataset.kind === 'swarm');
    const inSwarm = swarmIdx > -1 && capY > rail.nodes[swarmIdx] - 20 && capY < rail.nodes[swarmIdx + 1] - 40;

    // Orbiters spin on wall-clock time, so update them every frame while visible.
    rail.orbiters.forEach((o, i) => {
      const a = now / 650 + (i * Math.PI * 2) / 7;
      const r = window.innerWidth <= 760 ? 20 : 30;
      o.setAttribute('cx', rail.x + Math.cos(a) * r);
      o.setAttribute('cy', capY + Math.sin(a) * r * 0.9);
      o.setAttribute('opacity', inSwarm ? 1 : 0);
    });

    const sigilIdx = stages.findIndex((s) => s.dataset.kind === 'sigil');
    if (sigilIdx > -1) {
      const p = (capY - rail.nodes[sigilIdx]) / ((rail.nodes[sigilIdx + 1] - rail.nodes[sigilIdx]) * 0.6);
      renderHash(reduce ? 1 : p);
    }

    if (Math.abs(capY - lastCapY) < 0.3) return;
    lastCapY = capY;

    rail.capsule.setAttribute('transform', `translate(${rail.x} ${capY})`);
    rail.fill.seek((capY / (rail.H - 20)) * 1000);
    rail.forks.forEach((f) => f.anim.seek(clamp((capY - f.y0) / (f.y1 - f.y0)) * 1000));

    let current = -1;
    rail.nodes.forEach((y, i) => {
      const ch = rail.chambers[i];
      const on = capY >= y - 2;
      if (on) current = i;
      if (on !== ch.on) {
        ch.on = on;
        ch.c.classList.toggle('on', on);
        ch.t.classList.toggle('on', on);
        stages[i].classList.toggle('live', on);
        if (on && !reduce) {
          animate(ch.ring, { r: [17, 40], opacity: [0.9, 0], ease: spring({ bounce: 0.2, duration: 900 }) });
          animate(ch.c, { r: [13, 17], ease: spring({ bounce: 0.55, duration: 700 }) });
          animate(ch.spark, { cx: [rail.x + 18, rail.echoX], opacity: [1, 1, 0], duration: 650, ease: 'inOutQuad' });
        }
      }
      const next = rail.nodes[i + 1] ?? rail.H;
      const p = clamp((capY - y) / ((next - y) * 0.7));
      stageTl[i].seek((reduce ? 1 : p) * stageTl[i].duration);
    });

    if (current >= 0) setHud(current, stages[current].dataset.name);
    else if (sy < rail.top - vh) setHud(-1, '');
  }

  /* ---------------- ROLLOUT: Kestrel ---------------- */
  const outputs = (mode) => ({ pct: $('[data-out="pct"]', mode), phase: $('[data-out="phase"]', mode) });
  // Phase tables are keyed by timeline time in ms, so the words always match what is on screen.
  const phaseOf = (ms, table) => table.find(([t]) => ms <= t)?.[1] ?? table[table.length - 1][1];

  {
    const mode = $('[data-mode="kestrel"]');
    const out = outputs(mode);
    const linksG = $('.k-links', mode), instG = $('.k-insts', mode);
    const overlays = [], linkOverlays = [];
    for (let i = 0; i < 10; i++) {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 300 + col * 110, y = 18 + row * 54;
      const ld = `M90 150 C190 150 200 ${y + 15} ${x} ${y + 15}`;
      mk('path', { class: 'link', d: ld }, linksG);
      linkOverlays.push(mk('path', { class: 'link flowing', d: ld, style: 'stroke:var(--specimen);stroke-width:2.4', opacity: 0 }, linksG));
      mk('rect', { class: 'inst', x, y, width: 92, height: 30, rx: 15 }, instG);
      overlays.push(mk('rect', { x, y, width: 92, height: 30, rx: 15, fill: 'var(--specimen)', opacity: 0 }, instG));
      const t = mk('text', { class: 'sv-label knock', x: x + 46, y: y + 19, 'text-anchor': 'middle' }, instG);
      t.textContent = i === 0 ? 'canary' : 'current';
    }
    const st = { pct: 0 };
    const tl = createTimeline({ autoplay: false, defaults: { ease: 'inOutQuad' } })
      .add(overlays[0], { opacity: [0, 1], duration: 120 }, 20)
      .add(linkOverlays[0], { opacity: [0, 1], duration: 120 }, 20)
      .add(st, { pct: [0, 5], duration: 120 }, 20)
      .add($('.k-base', mode), { width: [0, 118], duration: 380 }, 170)
      .add($('.k-can', mode), { width: [0, 104], duration: 380 }, 190)
      .add(overlays.slice(1), { opacity: [0, 1], duration: 140, delay: stagger(28) }, 620)
      .add(linkOverlays.slice(1), { opacity: [0, 1], duration: 140, delay: stagger(28) }, 620)
      .add(st, { pct: [5, 100], duration: 360 }, 620);
    const phases = [[10, 'waiting for ignition'], [160, 'one canary takes 5% of traffic'], [600, 'comparing with the baseline'], [990, 'within budget, promoting'], [Infinity, 'promoted to the whole fleet']];
    scene(mode.querySelector('.stagebox'), tl, {
      start: 0.8, end: 0.3,
      after: (p) => { out.pct.textContent = Math.round(st.pct); out.phase.textContent = phaseOf(p * tl.duration, phases); },
    });
  }

  /* ---------------- ROLLOUT: Twin Suns ---------------- */
  {
    const mode = $('[data-mode="twins"]');
    const out = outputs(mode);
    const st = { pct: 0 };
    const tl = createTimeline({ autoplay: false, defaults: { ease: 'inOutQuad' } })
      .add($$('.t-gblock', mode), { opacity: [0.15, 1], duration: 160, delay: stagger(70) }, 20)
      .add($('.t-check', mode), { opacity: [0, 1], duration: 140 }, 330)
      .add($('.t-lever', mode), { y2: [148, 192], duration: 140, ease: 'outBack(2)' }, 520)
      .add($('.t-blue', mode), { opacity: [1, 0], duration: 120 }, 530)
      .add($('.t-green', mode), { opacity: [0, 1], duration: 120 }, 540)
      .add(st, { pct: [0, 100], duration: 120 }, 530)
      .add($('.t-bluestack', mode), { opacity: [1, 0.35], duration: 260 }, 700);
    const phases = [[10, 'blue is live'], [320, 'deploying green beside blue'], [510, 'green smoke-tested privately'], [670, 'switching the router'], [Infinity, 'green live, blue on standby']];
    scene(mode.querySelector('.stagebox'), tl, {
      start: 0.8, end: 0.3,
      after: (p) => { out.pct.textContent = Math.round(st.pct); out.phase.textContent = phaseOf(p * tl.duration, phases); },
    });
  }

  /* ---------------- ROLLOUT: Tide ---------------- */
  {
    const mode = $('[data-mode="tide"]');
    const out = outputs(mode);
    const marks = $('.tide-marks', mode), holds = $('.tide-holds', mode);
    const steps = [10, 20, 50, 100];
    const checks = steps.map((p, i) => {
      const x = 20 + 480 * (p / 100);
      mk('line', { x1: x, y1: 100, x2: x, y2: 112, stroke: 'var(--rule-strong)', 'stroke-width': 1.5 }, marks);
      const t = mk('text', { class: 'sv-label', x: Math.min(x, 486), y: 130, 'text-anchor': 'middle' }, marks);
      t.textContent = `${p}%`;
      const y = 172 + i * 30;
      mk('circle', { cx: 28, cy: y - 4, r: 8, fill: 'none', stroke: 'var(--rule-strong)' }, holds);
      const c = mk('circle', { cx: 28, cy: y - 4, r: 5, fill: 'var(--pass)', opacity: 0 }, holds);
      const tx = mk('text', { class: 'sv-text', x: 46, y }, holds);
      tx.textContent = p < 100 ? `Hold at ${p}%: errors, latency and sign-ins within budget` : 'Full traffic, old version drained and retired';
      return c;
    });
    const fill = $('.tide-fill', mode);
    const st = { pct: 0 };
    const tl = createTimeline({ autoplay: false, defaults: { ease: 'inOutQuad' } })
      .add(st, { pct: [0, 10], duration: 80 }, 0)
      .add(checks[0], { opacity: [0, 1], duration: 40 }, 200)
      .add(st, { pct: [10, 20], duration: 70 }, 260)
      .add(checks[1], { opacity: [0, 1], duration: 40 }, 420)
      .add(st, { pct: [20, 50], duration: 90 }, 470)
      .add(checks[2], { opacity: [0, 1], duration: 40 }, 660)
      .add(st, { pct: [50, 100], duration: 110 }, 720)
      .add(checks[3], { opacity: [0, 1], duration: 40 }, 900);
    const phases = [[2, 'all traffic on current'], [80, 'rising to 10%'], [260, 'holding at 10%, checking'], [330, 'rising to 20%'], [470, 'holding at 20%, checking'], [560, 'rising to 50%'], [720, 'holding at 50%, checking'], [830, 'rising to 100%'], [930, 'holding at 100%, draining old'], [Infinity, 'tide is in']];
    scene(mode.querySelector('.stagebox'), tl, {
      start: 0.8, end: 0.3,
      after: (p) => {
        fill.setAttribute('width', 480 * (st.pct / 100));
        out.pct.textContent = Math.round(st.pct);
        out.phase.textContent = phaseOf(p * tl.duration, phases);
      },
    });
  }

  /* ---------------- Watchtower sparklines ---------------- */
  {
    const tl = createTimeline({ autoplay: false });
    $$('.wt-draw').forEach((p, i) => tl.add(svg.createDrawable(p), { draw: ['0 0', '0 1'], duration: 600, ease: 'inOutSine' }, i * 150));
    scene($('.watchtower'), tl, { start: 0.95, end: 0.6 });
  }

  /* ---------------- Loop ---------------- */
  let modeTops = [];
  function measure() {
    vh = window.innerHeight;
    modeTops = modes.map(docTop);
    buildRail();
    scenes.forEach((s) => { s.measure(); s.last = -1; });
  }

  const hud = $('.hud');
  const band = $('.band');
  const refSections = [['Fault lines', $('#faults')], ['Codex', $('#codex')]];
  function hudForBand() {
    const r = band.getBoundingClientRect();
    hud.classList.toggle('on-light', r.top < 52 && r.bottom > 0);
    let label = null;
    refSections.forEach(([name, el]) => { if (el.getBoundingClientRect().top < vh * 0.5) label = name; });
    if (label) setHud(hudItems.length - 1, label, 'Notes');
  }

  function hudForModes(sy) {
    // Once the specimen leaves the tube, the HUD follows the rollout modes.
    const mid = sy + vh * 0.5;
    let label = null;
    modeTops.forEach((t, i) => { if (t < mid) label = modes[i].dataset.hud; });
    if (label && mid > rail.top + rail.H) setHud(hudItems.length - 1, label);
  }

  function frame(now) {
    target = window.scrollY;
    smooth = reduce ? target : smooth + (target - smooth) * 0.12;
    if (Math.abs(target - smooth) < 0.2) smooth = target;
    updatePipeline(smooth, now);
    scenes.forEach((s) => s.update(smooth));
    hudForModes(smooth);
    hudForBand();
    requestAnimationFrame(frame);
  }

  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(measure, 150); });
  measure();
  (document.fonts?.ready ?? Promise.resolve()).then(measure);
  window.addEventListener('load', measure);
  requestAnimationFrame(frame);
})();
