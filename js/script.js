if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
    const r = Array.isArray(radii) ? radii[0] : radii;
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    this.closePath();
  };
}

document.addEventListener('DOMContentLoaded', () => {

  // ============================================================
  // 1. CURSOR FOLLOWER
  // ============================================================
  const cursor = document.getElementById('cursorDot');
  let cursorX = 0, cursorY = 0;

  document.addEventListener('mousemove', e => {
    cursorX = e.clientX;
    cursorY = e.clientY;
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
  });

  document.querySelectorAll('a, button, .song-card, .btn, .theme-toggle, .hamburger, .player-btn, input').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });

  // ============================================================
  // 2. THEME TOGGLE
  // ============================================================
  const toggle = document.getElementById('themeToggle');
  const html = document.documentElement;
  const savedTheme = localStorage.getItem('theme') || 'dark';
  html.setAttribute('data-theme', savedTheme);

  toggle.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });

  // ============================================================
  // 3. HAMBURGER
  // ============================================================
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('open');
  });

  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });

  // ============================================================
  // 4. TYPING EFFECT
  // ============================================================
  const heroSub = document.getElementById('heroSub');
  const text = 'Data Science student at IIT Madras. I build with Python, ML, and Vue — turning messy data into clean stories and useful tools.';
  let charIndex = 0;

  function typeWriter() {
    if (charIndex < text.length) {
      heroSub.textContent = text.slice(0, charIndex + 1);
      charIndex++;
      setTimeout(typeWriter, 25 + Math.random() * 20);
    } else {
      heroSub.innerHTML = text + '<span class="cursor-blink"></span>';
    }
  }
  typeWriter();

  // ============================================================
  // 5. PARTICLE CANVAS
  // ============================================================
  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animFrame;

  function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 3 + 1;
      this.speedX = (Math.random() - 0.5) * 0.5;
      this.speedY = (Math.random() - 0.5) * 0.5;
      this.opacity = Math.random() * 0.5 + 0.1;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
      if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      const style = getComputedStyle(document.documentElement);
      ctx.fillStyle = style.getPropertyValue('--particle-color').trim() || 'rgba(204,120,92,0.15)';
      ctx.fill();
    }
  }

  function initParticles() {
    const count = Math.min(60, Math.floor(canvas.width * canvas.height / 12000));
    particles = Array.from({ length: count }, () => new Particle());
  }
  initParticles();
  window.addEventListener('resize', () => { resizeCanvas(); initParticles(); });

  function drawLines() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          const style = getComputedStyle(document.documentElement);
          ctx.strokeStyle = style.getPropertyValue('--particle-color').trim() || 'rgba(204,120,92,0.15)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    drawLines();
    animFrame = requestAnimationFrame(animateParticles);
  }
  animateParticles();

  // ============================================================
  // 6. PARALLAX ON PHOTO
  // ============================================================
  const photoFrame = document.getElementById('photoFrame');

  document.addEventListener('mousemove', e => {
    if (!photoFrame) return;
    const rect = photoFrame.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) / 30;
    const deltaY = (e.clientY - centerY) / 30;
    photoFrame.style.transform = `perspective(800px) rotateY(${deltaX}deg) rotateX(${-deltaY}deg)`;
  });

  // ============================================================
  // 7. ANIMATED COUNTERS
  // ============================================================
  function animateCounters() {
    document.querySelectorAll('.stat-number[data-target]').forEach(el => {
      const target = parseInt(el.dataset.target);
      let current = 0;
      const increment = Math.ceil(target / 40);
      const interval = setInterval(() => {
        current += increment;
        if (current >= target) { current = target; clearInterval(interval); }
        el.textContent = current + (target >= 10 ? '+' : '+');
      }, 40);
    });
  }

  // ============================================================
  // 8. SCROLL ANIMATIONS
  // ============================================================
  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        if (entry.target.id === 'statsContainer') animateCounters();
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.section-label, .section-title, .skill-card, .song-card, .audio-player').forEach(el => {
    scrollObserver.observe(el);
  });
  scrollObserver.observe(document.getElementById('statsContainer'));

  // Stagger skill cards
  document.querySelectorAll('.skill-card').forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.06}s`;
  });

  // Stagger song cards
  document.querySelectorAll('.song-card').forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.1}s`;
  });

  // ============================================================
  // 9. NAVBAR HIDE ON SCROLL
  // ============================================================
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    if (currentScroll > 100) {
      navbar.classList.toggle('hidden', currentScroll > lastScroll && currentScroll > 200);
    } else {
      navbar.classList.remove('hidden');
    }
    lastScroll = currentScroll;
  });

  // ============================================================
  // 10. SMOOTH SCROLL
  // ============================================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // ============================================================
  // 11. AUDIO PLAYER
  // ============================================================
  const audio = document.getElementById('audioElement');
  const songCards = document.querySelectorAll('.song-card');
  const playerPlay = document.getElementById('playerPlay');
  const playerPrev = document.getElementById('playerPrev');
  const playerNext = document.getElementById('playerNext');
  const playerTrackInfo = document.getElementById('playerTrackInfo');
  const progressFill = document.getElementById('progressFill');
  const progressTrack = document.getElementById('progressTrack');
  const playerTime = document.getElementById('playerTime');
  const volumeSlider = document.getElementById('volumeSlider');
  const playerVolume = document.getElementById('playerVolume');
  const visualizerCanvas = document.getElementById('visualizerCanvas');
  const vCtx = visualizerCanvas.getContext('2d');

  let currentTrackIndex = -1;
  let audioContext = null;
  let analyser = null;
  let source = null;
  let isMuted = false;
  let previousVolume = 0.7;

  const tracks = [
    { src: 'songs/Brain needs reboot.aac', title: 'Brain Needs Reboot', artist: 'Unknown' },
    { src: 'songs/Hey aisha.aac.m4a', title: 'Hey Aisha', artist: 'Unknown' },
    { src: 'songs/hoke ruposh.mp3', title: 'Hoke Ruposh', artist: 'Unknown' },
    { src: 'songs/mehak.aac.m4a', title: 'Mehak', artist: 'Unknown' }
  ];

  // Setup visualizer canvas size
  function resizeViz() {
    const rect = visualizerCanvas.parentElement.getBoundingClientRect();
    visualizerCanvas.width = rect.width || 600;
    visualizerCanvas.height = 80;
  }
  resizeViz();
  window.addEventListener('resize', resizeViz);

  // Initialize Web Audio
  function initAudioContext() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      source = audioContext.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
    }
  }

  function loadTrack(index) {
    if (index < 0 || index >= tracks.length) return;
    currentTrackIndex = index;
    const track = tracks[index];
    audio.src = track.src;
    audio.load();
    playerTrackInfo.textContent = `${track.title} — ${track.artist}`;
    updateActiveCard();
    audio.play().catch(() => {});
  }

  function updateActiveCard() {
    songCards.forEach((card, i) => {
      card.classList.toggle('playing', i === currentTrackIndex && !audio.paused);
    });
  }

  function togglePlay() {
    if (currentTrackIndex === -1) { loadTrack(0); return; }
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  }

  function prevTrack() {
    const idx = currentTrackIndex <= 0 ? tracks.length - 1 : currentTrackIndex - 1;
    loadTrack(idx);
  }

  function nextTrack() {
    const idx = currentTrackIndex >= tracks.length - 1 ? 0 : currentTrackIndex + 1;
    loadTrack(idx);
  }

  function formatTime(s) {
    if (isNaN(s) || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  // Song card clicks
  songCards.forEach((card, i) => {
    card.addEventListener('click', () => {
      if (currentTrackIndex === i && !audio.paused) {
        audio.pause();
      } else {
        if (audioContext && audioContext.state === 'suspended') audioContext.resume();
        if (currentTrackIndex !== i) {
          initAudioContext();
          loadTrack(i);
        } else {
          audio.play();
        }
      }
    });

    const playBtn = card.querySelector('.song-play');
    playBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (currentTrackIndex === i && !audio.paused) {
        audio.pause();
      } else {
        if (audioContext && audioContext.state === 'suspended') audioContext.resume();
        if (currentTrackIndex !== i) {
          initAudioContext();
          loadTrack(i);
        } else {
          audio.play();
        }
      }
    });
  });

  // Player controls
  playerPlay.addEventListener('click', togglePlay);
  playerPrev.addEventListener('click', prevTrack);
  playerNext.addEventListener('click', nextTrack);

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    if (e.code === 'ArrowLeft') prevTrack();
    if (e.code === 'ArrowRight') nextTrack();
  });

  // Volume
  volumeSlider.addEventListener('input', () => {
    audio.volume = volumeSlider.value;
    isMuted = audio.volume === 0;
    playerVolume.textContent = isMuted ? '🔇' : audio.volume > 0.5 ? '🔊' : audio.volume > 0 ? '🔉' : '🔈';
  });

  playerVolume.addEventListener('click', () => {
    isMuted = !isMuted;
    if (isMuted) {
      previousVolume = audio.volume;
      audio.volume = 0;
      volumeSlider.value = 0;
      playerVolume.textContent = '🔇';
    } else {
      audio.volume = previousVolume;
      volumeSlider.value = previousVolume;
      playerVolume.textContent = '🔊';
    }
  });

  // Progress bar click
  progressTrack.addEventListener('click', e => {
    const rect = progressTrack.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
  });

  // Audio events
  audio.addEventListener('play', () => {
    playerPlay.textContent = '⏸';
    updateActiveCard();
  });

  audio.addEventListener('pause', () => {
    playerPlay.textContent = '▶';
    updateActiveCard();
  });

  audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
      const pct = (audio.currentTime / audio.duration) * 100;
      progressFill.style.width = pct + '%';
      playerTime.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    }
  });

  audio.addEventListener('ended', nextTrack);
  audio.addEventListener('loadedmetadata', () => {
    playerTime.textContent = `0:00 / ${formatTime(audio.duration)}`;
  });

  // ============================================================
  // 12. AUDIO VISUALIZER
  // ============================================================
  let vizAnimId = null;

  function drawVisualizer() {
    vizAnimId = requestAnimationFrame(drawVisualizer);
    if (!analyser) {
      vCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
      const isDark = html.getAttribute('data-theme') === 'dark';
      vCtx.fillStyle = isDark ? '#1f1e1b' : '#181715';
      vCtx.fillRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const w = visualizerCanvas.width;
    const h = visualizerCanvas.height;

    const isDark = html.getAttribute('data-theme') === 'dark';
    vCtx.fillStyle = isDark ? '#1f1e1b' : '#181715';
    vCtx.fillRect(0, 0, w, h);

    const barCount = bufferLength * 0.6;
    const barWidth = (w / barCount) * 0.8;
    const gap = (w / barCount) * 0.2;

    for (let i = 0; i < barCount; i++) {
      const val = dataArray[Math.floor(i / 0.6)];
      const barHeight = Math.max(2, (val / 255) * h * 0.9);
      const x = i * (barWidth + gap);
      const y = h - barHeight;

      const gradient = vCtx.createLinearGradient(0, y, 0, h);
      const alpha = 0.4 + (val / 255) * 0.6;
      gradient.addColorStop(0, `rgba(204, 120, 92, ${alpha})`);
      gradient.addColorStop(1, `rgba(93, 184, 166, ${alpha * 0.5})`);

      vCtx.fillStyle = gradient;
      vCtx.beginPath();
      vCtx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
      vCtx.fill();
    }
  }
  drawVisualizer();

});
