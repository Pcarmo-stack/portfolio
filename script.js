/* =================================================================
   PEDRO CARMO — PORTFOLIO SCRIPT
   ================================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- DISABLE PAGE ZOOM ON MOBILE (iOS ignores the meta tag) ---------- */
  // Block pinch-zoom gestures…
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((evt) => {
    document.addEventListener(evt, (e) => e.preventDefault(), { passive: false });
  });
  // …and double-tap-to-zoom everywhere, including over the 3D models.
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
  // Block desktop double-click on the models too.
  document.addEventListener('dblclick', (e) => {
    if (e.target.closest('model-viewer')) e.preventDefault();
  });

  /* ---------- CURRENT YEAR ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- COOKIE 3D MODEL + CRUMB PARTICLES ---------- */
  const cookieMount = document.getElementById('cookie-mount');
  const cookieMsg   = document.getElementById('cookie-msg');

  /* -- crumb particle burst at a given screen position -- */
  function spawnCrumbs(originX, originY) {
    const colors = ['#8B4513','#A0522D','#D2691E','#CD853F','#F4A460','#DEB887','#c8813a'];
    const count  = 18;
    for (let i = 0; i < count; i++) {
      const el   = document.createElement('div');
      el.className = 'crumb';
      const size = 4 + Math.random() * 9;
      el.style.cssText = [
        `width:${size}px`, `height:${size * (0.6 + Math.random() * 0.8)}px`,
        `background:${colors[Math.floor(Math.random() * colors.length)]}`,
        `border-radius:${30 + Math.random() * 40}%`,
        `left:${originX}px`, `top:${originY}px`,
        `opacity:1`
      ].join(';');
      document.body.appendChild(el);

      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 7;
      let vx = Math.cos(angle) * speed;
      let vy = Math.sin(angle) * speed - (3 + Math.random() * 4); // slight upward bias
      let cx = originX, cy = originY, op = 1;

      (function tick() {
        vy += 0.35;       // gravity
        vx *= 0.97;       // air drag
        cx += vx; cy += vy;
        op -= 0.022;
        el.style.left    = cx + 'px';
        el.style.top     = cy + 'px';
        el.style.opacity = op;
        if (op > 0) requestAnimationFrame(tick);
        else el.remove();
      })();
    }
  }

  /* -- Web Audio crunch: preload buffer up front so the FIRST click has sound -- */
  let audioCtx = null;
  let crunchBuffer = null;

  function initAudio() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      fetch('sounds/crunch.mp3')
        .then(r => r.arrayBuffer())
        .then(buf => audioCtx.decodeAudioData(buf))
        .then(decoded => { crunchBuffer = decoded; })
        .catch(() => {});
    } catch (e) {}
  }
  // Decode immediately (context starts suspended until a user gesture; that's fine).
  initAudio();

  function playCrunch() {
    try {
      initAudio();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      if (!crunchBuffer) return; // buffer not loaded yet — skip silently

      const src    = audioCtx.createBufferSource();
      src.buffer   = crunchBuffer;
      // Tiny speed change, wide pitch shift via detune (cents)
      src.playbackRate.value = 0.97 + Math.random() * 0.06; // 0.97× – 1.03× (barely noticeable)
      src.detune.value       = -700 + Math.random() * 1400;  // −700 to +700 cents (≈ ±7 semitones)

      // Random EQ filter changes the texture each time
      const filter   = audioCtx.createBiquadFilter();
      const types    = ['lowpass', 'highpass', 'bandpass', 'peaking'];
      filter.type    = types[Math.floor(Math.random() * types.length)];
      filter.frequency.value = 300 + Math.random() * 4000; // 300 Hz – 4.3 kHz
      filter.Q.value         = 0.4 + Math.random() * 3.5;
      filter.gain.value      = -6 + Math.random() * 12;    // ±6 dB boost/cut

      const gain        = audioCtx.createGain();
      gain.gain.value   = 0.15 + Math.random() * 0.2; // 0.15 – 0.35 (50% quieter)

      src.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      src.start();
    } catch (e) {}
  }

  /* -- build model-viewer after custom element is ready (fixes Safari) -- */
  if (cookieMount) {
    const build = () => {
      const mv = document.createElement('model-viewer');
      mv.setAttribute('src',                 'models/cookie.glb');
      mv.setAttribute('auto-rotate',         '');
      mv.setAttribute('interaction-prompt',  'none');
      mv.setAttribute('shadow-intensity',    '1');
      mv.setAttribute('exposure',            '1');
      mv.setAttribute('environment-image',   'neutral');
      mv.setAttribute('alt',                 'A 3D cookie');
      mv.style.cssText = 'display:block;width:100%;height:100%;background:#07070a;--mv-background-color:#07070a;cursor:pointer;pointer-events:none;';

      cookieMount.appendChild(mv);

      // clicks fall through to the mount since mv has pointer-events:none
      cookieMount.style.cursor = 'pointer';
      let cookieBitten = false;
      cookieMount.addEventListener('click', (e) => {
        spawnCrumbs(e.clientX, e.clientY);
        playCrunch();
        if (cookieBitten) return;
        cookieBitten = true;
        const prompt = document.getElementById('cookie-prompt');
        const msg    = document.getElementById('cookie-msg');
        // Step 1: hide prompt instantly (no transition — beats the killswitch)
        if (prompt) prompt.style.opacity = '0';
        // Step 2: show message after prompt is fully gone
        setTimeout(() => {
          if (msg) msg.style.opacity = '1';
        }, 120);
      });
    };

    if (window.customElements && customElements.whenDefined) {
      customElements.whenDefined('model-viewer').then(build);
    } else {
      build();
    }
  }

  /* ---------- INTERACTIVE RESUME CARDS ---------- */
  document.querySelectorAll('[data-resume-card]').forEach((card) => {
    const head   = card.querySelector('.resume-card-head');
    const toggle = card.querySelector('.resume-toggle');
    if (!head) return;
    const sync = () => { if (toggle) toggle.textContent = card.classList.contains('open') ? '−' : '+'; };
    sync();
    head.addEventListener('click', () => {
      card.classList.toggle('open');
      sync();
    });
  });

  /* ---------- STICKY NAV ---------- */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- HOVER VIDEOS (desktop only) ---------- */
  if (!window.matchMedia('(hover: none), (pointer: coarse)').matches) {
    document.querySelectorAll('.project-card').forEach((card) => {
      const video = card.querySelector('.project-hover-video');
      if (!video) return;
      card.addEventListener('mouseenter', () => video.play().catch(() => {}));
      card.addEventListener('mouseleave', () => { video.pause(); video.currentTime = 0; });
    });
  }

  /* ---------- PROJECT MODAL ---------- */
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');

  const openModal = (project) => {
    const tpl = project.querySelector('.project-details');
    if (!tpl || !modal || !modalContent) return;
    modalContent.innerHTML = '';
    modalContent.appendChild(tpl.content.cloneNode(true));
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const v = modalContent.querySelector('video');
    if (v) v.play().catch(() => {});
    modalContent.querySelectorAll('[data-compare]').forEach(initCompare);
    modalContent.querySelectorAll('[data-model-wrap]').forEach(initModelWrap);
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (modalContent) modalContent.innerHTML = '';
  };

  document.querySelectorAll('.project').forEach((project) => {
    project.addEventListener('click', () => openModal(project));
  });
  document.querySelectorAll('[data-modal-close]').forEach((el) => {
    el.addEventListener('click', closeModal);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  /* ---------- 3D MODEL VIEWER — zoom buttons + optional mode bar ---------- */
  function initModelWrap(wrap) {
    const mv = wrap.querySelector('model-viewer');
    if (!mv) return;

    /* --- zoom buttons (always shown) --- */
    let defaultRadius = null;
    mv.addEventListener('load', () => {
      defaultRadius = mv.getCameraOrbit().radius;
    });

    const zoomBtn = (label) => {
      const b = document.createElement('button');
      b.className = 'mv-zoom-btn';
      b.textContent = label;
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const orbit   = mv.getCameraOrbit();
        const maxOut  = defaultRadius != null ? defaultRadius * 2 : orbit.radius * 2;
        const minIn   = defaultRadius != null ? defaultRadius * 0.3 : 0.1;
        const factor  = label === '+' ? 0.8 : 1.25;
        const clamped = Math.min(Math.max(orbit.radius * factor, minIn), maxOut);
        mv.cameraOrbit = `${orbit.theta}rad ${orbit.phi}rad ${clamped}m`;
      });
      return b;
    };
    const zoomBar = document.createElement('div');
    zoomBar.className = 'mv-zoom-bar';
    zoomBar.appendChild(zoomBtn('+'));
    zoomBar.appendChild(zoomBtn('−'));
    zoomBar.addEventListener('click', (e) => e.stopPropagation());
    wrap.appendChild(zoomBar);

    /* --- mode bar (only when data-model-modes is present) --- */
    if (!wrap.hasAttribute('data-model-modes')) return;

    const modeBar = document.createElement('div');
    modeBar.className = 'mv-mode-bar';
    modeBar.innerHTML = `
      <button class="mv-mode active" data-mode="solid">No Textures</button>
      <button class="mv-mode"        data-mode="textures">Textures</button>
      <button class="mv-mode"        data-mode="wireframe">Wireframe</button>
    `;
    modeBar.addEventListener('click', (e) => e.stopPropagation());
    wrap.appendChild(modeBar);

    let originalMaterials = [];
    let threeMeshes = [];
    let modelReady = false;

    mv.addEventListener('load', () => {
      modelReady = true;
      const mats = mv.model ? mv.model.materials : [];
      originalMaterials = mats.map((m) => {
        const pbr = m.pbrMetallicRoughness;
        return {
          color:     [...(pbr.baseColorFactor || [1,1,1,1])],
          metallic:  pbr.metallicFactor  ?? 0,
          roughness: pbr.roughnessFactor ?? 1,
        };
      });
      try {
        const sym = Object.getOwnPropertySymbols(mv).find(s => s.toString().includes('scene'));
        if (sym && mv[sym] && mv[sym].traverse) {
          mv[sym].traverse(node => { if (node.isMesh) threeMeshes.push(node); });
        }
      } catch (_) {}
    });

    modeBar.querySelectorAll('.mv-mode').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!modelReady) return;
        modeBar.querySelectorAll('.mv-mode').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const mats = mv.model ? mv.model.materials : [];
        const mode = btn.dataset.mode;

        // clear wireframe first
        threeMeshes.forEach(mesh => {
          [].concat(mesh.material || []).forEach(mat => { mat.wireframe = false; });
        });

        if (mode === 'solid') {
          mats.forEach(m => {
            m.pbrMetallicRoughness.setBaseColorFactor([0.76, 0.70, 0.64, 1]);
            m.pbrMetallicRoughness.setMetallicFactor(0);
            m.pbrMetallicRoughness.setRoughnessFactor(0.95);
          });
        } else if (mode === 'textures') {
          mats.forEach((m, i) => {
            const o = originalMaterials[i];
            if (!o) return;
            m.pbrMetallicRoughness.setBaseColorFactor(o.color);
            m.pbrMetallicRoughness.setMetallicFactor(o.metallic);
            m.pbrMetallicRoughness.setRoughnessFactor(o.roughness);
          });
        } else if (mode === 'wireframe') {
          threeMeshes.forEach(mesh => {
            [].concat(mesh.material || []).forEach(mat => {
              mat.wireframe = true;
              if (mat.color) mat.color.set('#1a1a1a');
              mat.opacity = 1;
              mat.transparent = false;
            });
          });
        }
      });
    });
  }

  /* ---------- BEFORE / AFTER COMPARE SLIDER ---------- */
  function initCompare(el) {
    const after  = el.querySelector('.d-compare-after');
    const handle = el.querySelector('.d-compare-handle');
    if (!after || !handle) return;

    const setPos = (x) => {
      const rect = el.getBoundingClientRect();
      const pct  = Math.min(100, Math.max(0, ((x - rect.left) / rect.width) * 100));
      after.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
      handle.style.left    = `${pct}%`;
    };

    const touchMode = window.matchMedia('(hover: none), (pointer: coarse)').matches;

    if (touchMode) {
      // Touch events with passive:false so we can preventDefault on horizontal drags.
      // Vertical drags pass through untouched so the page scrolls normally.
      let sliding = false, decided = false;
      let startX = 0, startY = 0;

      el.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        startX  = t.clientX;
        startY  = t.clientY;
        sliding = false;
        decided = false;
        // Touching directly on the handle = commit immediately, no threshold.
        if (e.target.closest('.d-compare-handle')) {
          sliding = true;
          decided = true;
          setPos(t.clientX);
          e.preventDefault();
        }
      }, { passive: false });

      el.addEventListener('touchmove', (e) => {
        const t  = e.touches[0];
        const dx = Math.abs(t.clientX - startX);
        const dy = Math.abs(t.clientY - startY);

        if (!decided) {
          if (dx < 5 && dy < 5) return;   // not enough movement yet
          decided = true;
          sliding = dx > dy;               // horizontal wins → slide
        }

        if (sliding) {
          e.preventDefault();             // block page scroll while dragging
          setPos(t.clientX);
        }
        // vertical gesture → do nothing, let browser scroll
      }, { passive: false });

      const end = () => { sliding = false; decided = false; };
      el.addEventListener('touchend',    end);
      el.addEventListener('touchcancel', end);
    } else {
      let dragging = false;
      el.addEventListener('pointerdown',  (e) => { dragging = true; el.setPointerCapture(e.pointerId); setPos(e.clientX); });
      el.addEventListener('pointermove',  (e) => { if (dragging) setPos(e.clientX); });
      el.addEventListener('pointerup',    ()  => { dragging = false; });
      el.addEventListener('pointercancel',()  => { dragging = false; });
    }
  }

});
