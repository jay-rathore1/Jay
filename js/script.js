/* ============================================================
   Jay — interactions, motion & audio player
   ============================================================ */
(function () {
  'use strict';

  const doc = document;
  const html = doc.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const smoothEnabled = finePointer && !reducedMotion;
  const supportsViewTimeline = !!(window.CSS && CSS.supports && CSS.supports('animation-timeline', 'view()'));

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

  doc.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  doc.addEventListener('DOMContentLoaded', () => {
    initCursor();
    initSmoothScroll();
    initParallax();
    initMagnetic();
    initRipples();
    initTheme();
    initNav();
    initMobileMenu();
    initSearch();
    initReveals();
    initCounters();
    initParticles();
    initTyping();
    initAudioPlayer();

    window.scrollTo(0, 0);
  });

  /* ============================================================
     CURSOR
     ============================================================ */
  function initCursor() {
    if (!finePointer) return;
    doc.body.classList.add('has-cursor');

    const cursor = doc.getElementById('cursor');
    const dot = cursor.querySelector('.cursor-dot');
    const ring = cursor.querySelector('.cursor-ring');
    let rx = mouseX, ry = mouseY;

    const interactive = 'a, button, input, [data-magnetic], .song-card, .theme-toggle, .nav-icon, .hamburger, .btn, .player-btn, .player-progress-track, .player-volume-slider, .tag, .search-item';

    function loop() {
      rx += (mouseX - rx) * 0.18;
      ry += (mouseY - ry) * 0.18;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    }
    loop();

    doc.addEventListener('mouseover', e => {
      if (e.target.closest(interactive)) cursor.classList.add('cursor-hover');
    });
    doc.addEventListener('mouseout', e => {
      if (e.target.closest(interactive)) cursor.classList.remove('cursor-hover');
    });
    doc.addEventListener('mousedown', () => cursor.classList.add('cursor-down'));
    doc.addEventListener('mouseup', () => cursor.classList.remove('cursor-down'));
    doc.addEventListener('mouseleave', () => cursor.classList.add('cursor-hide'));
    doc.addEventListener('mouseenter', () => cursor.classList.remove('cursor-hide'));
  }

  /* ============================================================
     SMOOTH / INERTIA SCROLL
     ============================================================ */
  function initSmoothScroll() {
    let current = window.scrollY;
    let target = current;
    let velocity = 0;
    let running = false;
    const maxScroll = () => doc.documentElement.scrollHeight - window.innerHeight;
    const nav = doc.getElementById('nav');
    const navPill = nav.querySelector('.nav-pill');

    const anchorLinks = doc.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
      link.addEventListener('click', e => {
        const hash = link.getAttribute('href');
        if (hash === '#') return;
        const el = doc.querySelector(hash);
        if (!el) return;
        e.preventDefault();
        const y = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 84);
        jumpTo(y);
        closeMobileMenu();
      });
    });

    function jumpTo(y) {
      y = Math.max(0, Math.min(y, maxScroll()));
      if (smoothEnabled) {
        target = y;
        if (!running) { running = true; requestAnimationFrame(step); }
      } else {
        window.scrollTo({ top: y, behavior: reducedMotion ? 'auto' : 'smooth' });
      }
    }
    window.jayScroll = { jumpTo };

    if (smoothEnabled) {
      let locked = false;
      window.addEventListener('wheel', e => {
        if (e.ctrlKey || locked) return;
        if (doc.getElementById('search').open) return;
        e.preventDefault();
        target += e.deltaY * (e.deltaMode === 1 ? 16 : 1);
        target = Math.max(0, Math.min(target, maxScroll()));
        if (!running) { running = true; requestAnimationFrame(step); }
      }, { passive: false });

      window.addEventListener('keydown', e => {
        const tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
        const jump = { ArrowDown: 90, ArrowUp: -90, PageDown: window.innerHeight * 0.9, PageUp: -window.innerHeight * 0.9 };
        if (jump[e.key]) {
          e.preventDefault();
          target = Math.max(0, Math.min(target + jump[e.key], maxScroll()));
          if (!running) { running = true; requestAnimationFrame(step); }
        } else if (e.key === 'Home') { e.preventDefault(); target = 0; if (!running) { running = true; requestAnimationFrame(step); } }
        else if (e.key === 'End') { e.preventDefault(); target = maxScroll(); if (!running) { running = true; requestAnimationFrame(step); } }
      });

      window.addEventListener('resize', () => { target = Math.min(target, maxScroll()); });
    }

    let lastY = current;
    function step() {
      velocity = (velocity + (target - current) * 0.13) * 0.9;
      velocity = Math.max(-60, Math.min(60, velocity));
      current += velocity;

      if (Math.abs(target - current) < 0.4 && Math.abs(velocity) < 0.05) {
        current = target;
        velocity = 0;
        running = false;
      }
      window.scrollTo(0, current);

      updateNavUI(current, nav, navPill, lastY);
      lastY = current;
      if (running) requestAnimationFrame(step);
    }

    if (!smoothEnabled) {
      const onNative = () => updateNavUI(window.scrollY, nav, navPill, lastY);
      window.addEventListener('scroll', onNative, { passive: true });
    }
    window.scrollTo(0, current);
  }

  function updateNavUI(sy, nav, navPill, lastY) {
    nav.classList.toggle('scrolled', sy > 24);
    if (sy > 280 && sy > lastY + 2) navPill.classList.add('nav-hide');
    else navPill.classList.remove('nav-hide');
  }

  /* ============================================================
     PARALLAX BLOBS + HERO
     ============================================================ */
  function initParallax() {
    const blobs = doc.querySelectorAll('.blob-layer .blob, .blob-layer .blob-shape');
    const speeds = Array.from(blobs, b => parseFloat(b.dataset.speed || '0.5'));
    if (reducedMotion) return;

    function frame() {
      const sy = window.scrollY;
      blobs.forEach((b, i) => {
        b.style.transform = `translate3d(0, ${-sy * speeds[i]}px, 0)`;
      });
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ============================================================
     MAGNETIC ELEMENTS
     ============================================================ */
  function initMagnetic() {
    if (!finePointer || reducedMotion) return;
    doc.querySelectorAll('.btn[data-magnetic]').forEach(el => {
      const strength = parseFloat(el.dataset.magnetic || '0.25');
      const rect = () => el.getBoundingClientRect();
      el.addEventListener('mousemove', e => {
        const r = rect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${Math.max(-10, Math.min(10, x * strength))}px, ${Math.max(-8, Math.min(8, y * strength))}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transition = 'transform 0.5s cubic-bezier(0.22,1,0.36,1)';
        el.style.transform = 'translate(0px, 0px)';
        setTimeout(() => { el.style.transition = ''; }, 500);
      });
    });
  }

  /* ============================================================
     RIPPLE ON BUTTONS
     ============================================================ */
  function initRipples() {
    if (reducedMotion) return;
    doc.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const r = btn.getBoundingClientRect();
        const size = Math.max(r.width, r.height);
        const span = doc.createElement('span');
        span.className = 'ripple';
        span.style.width = span.style.height = size + 'px';
        span.style.left = (e.clientX - r.left - size / 2) + 'px';
        span.style.top = (e.clientY - r.top - size / 2) + 'px';
        btn.appendChild(span);
        setTimeout(() => span.remove(), 700);
      });
    });
  }

  /* ============================================================
     THEME TOGGLE (View Transitions API)
     ============================================================ */
  function initTheme() {
    const toggle = doc.getElementById('themeToggle');
    const apply = t => {
      html.setAttribute('data-theme', t);
      try { localStorage.setItem('theme', t); } catch (e) {}
    };
    toggle.addEventListener('click', () => {
      const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      if (doc.startViewTransition && !reducedMotion) {
        doc.startViewTransition(() => apply(next));
      } else {
        apply(next);
      }
    });
  }

  /* ============================================================
     NAV — active section
     ============================================================ */
  function initNav() {
    const links = doc.querySelectorAll('.nav-links a[href^="#"]');
    const map = {};
    links.forEach(l => { map[l.getAttribute('href')] = l; });

    const sections = doc.querySelectorAll('main section[id]');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          links.forEach(l => l.classList.remove('active'));
          const link = map['#' + en.target.id];
          if (link) link.classList.add('active');
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      sections.forEach(s => io.observe(s));
    }
  }

  /* ============================================================
     MOBILE MENU
     ============================================================ */
  function initMobileMenu() {
    const burger = doc.getElementById('hamburger');
    const menu = doc.getElementById('navLinks');
    burger.addEventListener('click', () => {
      burger.classList.toggle('active');
      menu.classList.toggle('open');
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobileMenu));
    doc.addEventListener('click', e => {
      if (!e.target.closest('.nav-pill') && menu.classList.contains('open')) closeMobileMenu();
    });
  }
  function closeMobileMenu() {
    const burger = doc.getElementById('hamburger');
    const menu = doc.getElementById('navLinks');
    burger.classList.remove('active');
    menu.classList.remove('open');
  }

  /* ============================================================
     SEARCH OVERLAY (in-page jump)
     ============================================================ */
  function initSearch() {
    const overlay = doc.getElementById('search');
    const input = doc.getElementById('searchInput');
    const results = doc.getElementById('searchResults');
    const hint = doc.getElementById('searchHint');
    const openBtn = doc.getElementById('searchOpen');

    const index = buildSearchIndex();
    let activeIndex = -1;

    function buildSearchIndex() {
      const items = [
        { tag: 'Section', title: 'Back to top', target: '#hero' },
        { tag: 'Section', title: 'About', target: '#about' },
        { tag: 'Section', title: 'Skills', target: '#skills' },
        { tag: 'Section', title: 'Playlist', target: '#songs' }
      ];
      doc.querySelectorAll('.skill-card h3').forEach(h => {
        items.push({ tag: 'Skill', title: h.textContent, target: '#skills' });
      });
      doc.querySelectorAll('.song-card .song-info h3').forEach(h => {
        items.push({ tag: 'Song', title: h.textContent, target: '#songs' });
      });
      return items;
    }

    function open() {
      overlay.open = true;
      overlay.hidden = false;
      doc.body.style.overflow = 'hidden';
      input.value = '';
      render(index);
      setTimeout(() => input.focus(), 40);
    }
    function close() {
      overlay.hidden = true;
      overlay.open = false;
      doc.body.style.overflow = '';
      input.blur();
    }
    function jump(target) {
      close();
      const el = doc.querySelector(target);
      if (!el) return;
      const y = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 84);
      if (window.jayScroll) window.jayScroll.jumpTo(y);
    }

    openBtn.addEventListener('click', open);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    doc.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); overlay.hidden ? open() : close(); }
      if (e.key === 'Escape' && !overlay.hidden) close();
    });

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (!q) { render(index); return; }
      render(index.filter(i => i.title.toLowerCase().includes(q)));
    });

    input.addEventListener('keydown', e => {
      const items = [...results.querySelectorAll('.search-item')];
      if (items.length === 0) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIndex + 1, items); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIndex - 1, items); }
      if (e.key === 'Enter') { e.preventDefault(); const el = items[activeIndex] || items[0]; if (el) jump(el.dataset.target); }
    });

    function setActive(i, items) {
      activeIndex = (i + items.length) % items.length;
      items.forEach((el, idx) => el.classList.toggle('active', idx === activeIndex));
      items[activeIndex].scrollIntoView({ block: 'nearest' });
    }

    function render(items) {
      activeIndex = -1;
      results.innerHTML = '';
      hint.textContent = items.length ? `${items.length} result${items.length === 1 ? '' : 's'} — arrow keys to browse` : 'No matches. Try "Python", "About", "Playlist"…';
      items.slice(0, 9).forEach(it => {
        const a = doc.createElement('a');
        a.className = 'search-item';
        a.href = it.target;
        a.dataset.target = it.target;
        a.innerHTML = `<span class="si-tag">${it.tag}</span><span class="si-title"></span>`;
        a.querySelector('.si-title').textContent = it.title;
        a.addEventListener('click', e => { e.preventDefault(); jump(it.target); });
        results.appendChild(a);
      });
    }
  }

  /* ============================================================
     REVEALS — scroll-driven + IntersectionObserver fallback
     ============================================================ */
  function initReveals() {
    doc.querySelectorAll('.skill-card, .song-card, .stat-card').forEach(el => el.classList.add('reveal'));
    const reveals = doc.querySelectorAll('.reveal');

    const groups = new Map();
    reveals.forEach(el => {
      const p = el.parentElement;
      if (!groups.has(p)) groups.set(p, []);
      groups.get(p).push(el);
    });
    groups.forEach(els => {
      els.forEach((el, i) => {
        el.style.setProperty('--i', i);
        el.style.setProperty('--d', (i * 0.09).toFixed(2) + 's');
        if (els.length > 1) el.dataset.stagger = '';
      });
    });

    if (!supportsViewTimeline && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (en.isIntersecting) {
            en.target.classList.add('in-view');
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      reveals.forEach(el => io.observe(el));
    }

    if ('IntersectionObserver' in window) {
      const barIO = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (en.isIntersecting) { en.target.classList.add('in-view'); barIO.unobserve(en.target); }
        });
      }, { threshold: 0.2 });
      doc.querySelectorAll('.skill-card').forEach(c => barIO.observe(c));
    }
  }

  /* ============================================================
     COUNTERS
     ============================================================ */
  function initCounters() {
    const nums = doc.querySelectorAll('.stat-number[data-target]');
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        const el = en.target;
        const target = parseInt(el.dataset.target, 10);
        let cur = 0;
        const inc = Math.max(1, Math.ceil(target / 30));
        const t = setInterval(() => {
          cur += inc;
          if (cur >= target) { cur = target; clearInterval(t); }
          el.textContent = cur + '+';
        }, 42);
      });
    }, { threshold: 0.4 });
    nums.forEach(n => io.observe(n));
  }

  /* ============================================================
     TYPING EFFECT
     ============================================================ */
  function initTyping() {
    const sub = doc.getElementById('heroSub');
    if (!sub) return;
    const text = 'Data Science student at IIT Madras. I build with Python, ML, and Vue — turning messy data into clean stories and useful tools.';
    if (reducedMotion) { sub.textContent = text; return; }
    let i = 0;
    function tick() {
      if (i < text.length) {
        sub.textContent = text.slice(0, i + 1);
        i++;
        setTimeout(tick, 26 + Math.random() * 22);
      } else {
        sub.innerHTML = text + '<span class="caret"></span>';
      }
    }
    tick();
  }

  /* ============================================================
     PARTICLE CANVAS (hero)
     ============================================================ */
  function initParticles() {
    if (reducedMotion) return;
    const canvas = doc.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const colorOf = name => {
      const v = getComputedStyle(html).getPropertyValue(name).trim();
      return v || '#a58cf0';
    };

    let particles = [];

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const count = Math.min(50, Math.floor(canvas.width * canvas.height / 16000));
      particles = Array.from({ length: count }, () => new Particle());
    }
    window.addEventListener('resize', resize);

    function hexToRgba(hex, a) {
      const m = hex.replace('#', '');
      const n = parseInt(m.length === 3 ? m.split('').map(c => c + c).join('') : m, 16);
      return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
    }

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.r = Math.random() * 2.2 + 0.8;
        this.vx = (Math.random() - 0.5) * 0.35;
        this.vy = (Math.random() - 0.5) * 0.35;
        this.a = Math.random() * 0.4 + 0.15;
        this.hue = Math.random() > 0.5 ? '--lavender' : '--blush';
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < -5) this.x = canvas.width + 5;
        if (this.x > canvas.width + 5) this.x = -5;
        if (this.y < -5) this.y = canvas.height + 5;
        if (this.y > canvas.height + 5) this.y = -5;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(colorOf(this.hue), this.a);
        ctx.fill();
      }
    }

    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const col1 = hexToRgba(colorOf('--lavender'), 0.14);
      const col2 = hexToRgba(colorOf('--blush'), 0.14);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.update();
        p.draw();
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = (i % 2) ? col1 : col2;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(frame);
    }

    resize();
    requestAnimationFrame(frame);
  }

  /* ============================================================
     AUDIO PLAYER + VISUALIZER
     ============================================================ */
  function initAudioPlayer() {
    const audio = doc.getElementById('audioElement');
    const cards = [...doc.querySelectorAll('.song-card')];
    const playerPlay = doc.getElementById('playerPlay');
    const playerPrev = doc.getElementById('playerPrev');
    const playerNext = doc.getElementById('playerNext');
    const trackInfo = doc.getElementById('playerTrackInfo');
    const progressFill = doc.getElementById('progressFill');
    const progressTrack = doc.getElementById('progressTrack');
    const timeEl = doc.getElementById('playerTime');
    const volumeSlider = doc.getElementById('volumeSlider');
    const volumeBtn = doc.getElementById('playerVolume');
    const vizCanvas = doc.getElementById('visualizerCanvas');
    const vctx = vizCanvas.getContext('2d');

    let current = -1;
    let aCtx = null, analyser = null, source = null;
    let muted = false;
    let lastVol = 0.7;

    const tracks = cards.map(c => ({
      src: c.dataset.src,
      title: c.dataset.title,
      artist: c.dataset.artist
    }));

    function resizeViz() {
      vizCanvas.width = vizCanvas.parentElement.clientWidth || 600;
      vizCanvas.height = 90;
    }
    resizeViz();
    window.addEventListener('resize', resizeViz);

    function initAudio() {
      if (aCtx) return;
      aCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = aCtx.createAnalyser();
      analyser.fftSize = 128;
      source = aCtx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(aCtx.destination);
    }

    function fmt(s) {
      if (isNaN(s) || !isFinite(s)) return '0:00';
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return m + ':' + String(sec).padStart(2, '0');
    }

    function load(i) {
      if (i < 0 || i >= tracks.length) return;
      current = i;
      const t = tracks[i];
      audio.src = t.src;
      audio.load();
      trackInfo.textContent = t.title + ' — ' + t.artist;
      markActive();
      audio.play().catch(() => {});
    }

    function markActive() {
      cards.forEach((c, i) => c.classList.toggle('playing', i === current && !audio.paused));
    }

    function playPause() {
      if (current === -1) { load(0); return; }
      audio.paused ? audio.play() : audio.pause();
    }
    function prev() { load(current <= 0 ? tracks.length - 1 : current - 1); }
    function next() { load(current >= tracks.length - 1 ? 0 : current + 1); }

    function select(i) {
      if (aCtx && aCtx.state === 'suspended') aCtx.resume();
      if (current === i && !audio.paused) audio.pause();
      else if (current === i) audio.play();
      else { initAudio(); load(i); }
    }

    cards.forEach((c, i) => {
      c.addEventListener('click', () => select(i));
      const b = c.querySelector('.song-play');
      b.addEventListener('click', e => { e.stopPropagation(); select(i); });
    });

    playerPlay.addEventListener('click', playPause);
    playerPrev.addEventListener('click', prev);
    playerNext.addEventListener('click', next);

    doc.addEventListener('keydown', e => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (e.code === 'Space') { e.preventDefault(); playPause(); }
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    });

    volumeSlider.addEventListener('input', () => {
      audio.volume = parseFloat(volumeSlider.value);
      muted = audio.volume === 0;
      volumeBtn.textContent = muted ? '🔇' : audio.volume > 0.5 ? '🔊' : audio.volume > 0 ? '🔉' : '🔈';
    });
    volumeBtn.addEventListener('click', () => {
      muted = !muted;
      if (muted) { lastVol = audio.volume; audio.volume = 0; volumeSlider.value = 0; volumeBtn.textContent = '🔇'; }
      else { audio.volume = lastVol; volumeSlider.value = lastVol; volumeBtn.textContent = '🔊'; }
    });

    progressTrack.addEventListener('click', e => {
      const r = progressTrack.getBoundingClientRect();
      audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
    });

    audio.addEventListener('play', () => { playerPlay.textContent = '⏸'; markActive(); });
    audio.addEventListener('pause', () => { playerPlay.textContent = '▶'; markActive(); });
    audio.addEventListener('ended', next);
    audio.addEventListener('timeupdate', () => {
      if (audio.duration) {
        progressFill.style.width = (audio.currentTime / audio.duration) * 100 + '%';
        timeEl.textContent = fmt(audio.currentTime) + ' / ' + fmt(audio.duration);
      }
    });
    audio.addEventListener('loadedmetadata', () => { timeEl.textContent = '0:00 / ' + fmt(audio.duration); });

    const isDark = () => html.getAttribute('data-theme') === 'dark';

    function vizFrame() {
      requestAnimationFrame(vizFrame);
      if (!analyser) {
        vctx.fillStyle = '#100f16';
        vctx.fillRect(0, 0, vizCanvas.width, vizCanvas.height);
        return;
      }
      const bufferLength = analyser.frequencyBinCount;
      const data = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(data);

      const w = vizCanvas.width, h = vizCanvas.height;
      vctx.fillStyle = isDark() ? '#100f16' : '#2c2740';
      vctx.fillRect(0, 0, w, h);

      const bars = Math.floor(bufferLength * 0.55);
      const bw = (w / bars) * 0.75;
      const gap = (w / bars) * 0.25;

      for (let i = 0; i < bars; i++) {
        const val = data[Math.floor(i / 0.55)];
        const bh = Math.max(3, (val / 255) * h * 0.92);
        const x = i * (bw + gap);
        const y = h - bh;
        const g = vctx.createLinearGradient(0, y, 0, h);
        const a = 0.35 + (val / 255) * 0.65;
        g.addColorStop(0, `rgba(165, 140, 240, ${a})`);
        g.addColorStop(1, `rgba(242, 166, 192, ${a * 0.55})`);
        vctx.fillStyle = g;
        vctx.beginPath();
        vctx.roundRect(x, y, bw, bh, [2, 2, 0, 0]);
        vctx.fill();
      }
    }
    vizFrame();
  }
})();
