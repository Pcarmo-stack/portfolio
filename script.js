/* =================================================================
   PEDRO CARMO — PORTFOLIO SCRIPT
   ================================================================= */

/* always start at the top on load/refresh — browsers often restore scroll position */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.addEventListener('load', () => window.scrollTo(0, 0));

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- DISABLE PAGE ZOOM ON MOBILE (iOS ignores the meta tag) ---------- */
  // Block pinch-zoom gestures. (Double-tap-to-zoom is handled by
  // `touch-action: manipulation` in the CSS — doing it here in JS would also
  // cancel legitimate fast taps, so it's intentionally left to CSS.)
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((evt) => {
    document.addEventListener(evt, (e) => e.preventDefault(), { passive: false });
  });
  // Block desktop double-click on the models too.
  document.addEventListener('dblclick', (e) => {
    if (e.target.closest('model-viewer')) e.preventDefault();
  });

  /* ---------- CURRENT YEAR ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- SCROLL INDICATOR — no URL hash change ---------- */
  const scrollBtn = document.querySelector('.hero-scroll');
  if (scrollBtn) {
    scrollBtn.addEventListener('click', () => {
      const target = document.getElementById('work');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ---------- COOKIE 3D MODEL + CRUMB PARTICLES ---------- */
  const cookieMount = document.getElementById('cookie-mount');

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

  /* -- build model-viewer after custom element is ready (fixes Safari) --
     Three bite stages: full → bitten → nearly gone → vanished.
     Each click swaps to the next model while preserving the live rotation,
     so it reads as one continuous animation. After the last bite the cookie
     vanishes and the prompt swaps to the "one more?" message. */
  if (cookieMount) {
    const COOKIE_STAGES = ['models/cookie-1.glb', 'models/cookie-2.glb', 'models/cookie-3.glb'];

    const build = () => {
      const mv = document.createElement('model-viewer');
      mv.setAttribute('src',                 COOKIE_STAGES[0]);
      mv.setAttribute('auto-rotate',         '');
      mv.setAttribute('auto-rotate-delay',   '0');   // keep spinning right after a click
      mv.setAttribute('interaction-prompt',  'none');
      mv.setAttribute('shadow-intensity',    '1');
      mv.setAttribute('exposure',            '1');
      mv.setAttribute('environment-image',   'neutral');
      mv.setAttribute('alt',                 'A 3D cookie');
      mv.style.cssText = 'display:block;width:100%;height:100%;background:#07070a;--mv-background-color:#07070a;--poster-color:#07070a;--progress-bar-height:0px;--progress-bar-color:transparent;cursor:pointer;pointer-events:none;';

      cookieMount.appendChild(mv);
      cookieMount.style.cursor = 'pointer';

      const promptEl = document.getElementById('cookie-prompt');
      const msgEl    = document.getElementById('cookie-msg');

      // After the first model loads, lock the camera position (target + radius + phi)
      // so every subsequent bite-stage model is seen from the EXACT same spot.
      // The cookie shrinks visually as it gets eaten — no re-centering.
      let lockedTarget = null, lockedRadius = null, lockedPhi = null;

      mv.addEventListener('load', () => {
        if (lockedTarget) return;   // already locked — don't re-lock on swap loads
        const o = mv.getCameraOrbit();
        const t = mv.getCameraTarget();
        lockedRadius = o.radius;
        lockedPhi    = o.phi;
        lockedTarget = `${t.x}m ${t.y}m ${t.z}m`;
        // Apply the lock so model-viewer never auto-frames again
        mv.setAttribute('camera-target',      lockedTarget);
        mv.setAttribute('min-camera-orbit',   `auto auto ${lockedRadius}m`);
        mv.setAttribute('max-camera-orbit',   `auto auto ${lockedRadius}m`);
      });

      const swapModel = (src) => {
        const theta = mv.getCameraOrbit().theta;
        mv.setAttribute('src', src);
        // After the swap load, restore live theta (rotation kept continuous)
        mv.addEventListener('load', () => {
          if (lockedRadius !== null) {
            mv.cameraOrbit = `${theta}rad ${lockedPhi}rad ${lockedRadius}m`;
          }
        }, { once: true });
      };

      const setGone = (gone) => {
        if (promptEl) promptEl.style.opacity = gone ? '0' : '1';
        if (msgEl)    msgEl.style.opacity    = gone ? '1' : '0';
      };

      // 0 = full, 1 = bitten, 2 = nearly gone, 3 = vanished
      let stage = 0;
      cookieMount.addEventListener('click', (e) => {
        spawnCrumbs(e.clientX, e.clientY);
        playCrunch();

        if (stage >= 3) {                    // "tap for one more" → fresh cookie
          stage = 0;
          mv.style.visibility = 'visible';
          // release framing lock so the fresh cookie re-frames naturally, then re-locks
          lockedTarget = null;
          mv.removeAttribute('camera-target');
          mv.removeAttribute('min-camera-orbit');
          mv.removeAttribute('max-camera-orbit');
          swapModel(COOKIE_STAGES[0]);
          setGone(false);
          return;
        }

        stage++;
        if (stage < 3) {
          swapModel(COOKIE_STAGES[stage]);   // next bite
        } else {
          mv.style.visibility = 'hidden';    // all gone → vanish
          setGone(true);
        }
      });
    };

    if (window.customElements && customElements.whenDefined) {
      customElements.whenDefined('model-viewer').then(build);
    } else {
      build();
    }
  }

  /* ---------- HERO 3D HEAD — mouse-reactive "push" rotation (desktop) ---------- */
  const heroHeadMount = document.getElementById('hero-head');
  const isMobileLayout = window.matchMedia('(max-width: 1000px)').matches;
  if (heroHeadMount && !isMobileLayout && !window.matchMedia('(hover: none), (pointer: coarse)').matches) {
    const DEG = Math.PI / 180;
    const BASE_THETA = 0   * DEG;  // resting pose: face toward viewer
    const BASE_PHI   = 88 * DEG;
    const MAX_THETA  = 38  * DEG;  // horizontal swing
    const MAX_PHI    = 14  * DEG;  // up/down tilt
    const buildHead = () => {
      const mv = document.createElement('model-viewer');
      mv.setAttribute('src',                'models/MyHeadblend.glb');
      mv.setAttribute('interaction-prompt', 'none');
      mv.setAttribute('shadow-intensity',   '0');
      mv.setAttribute('exposure',           '1');
      mv.setAttribute('environment-image',  'neutral');
      mv.setAttribute('disable-zoom',       '');
      mv.setAttribute('disable-tap',        '');
      mv.setAttribute('interpolation-decay','30');
      mv.setAttribute('camera-orbit',       '0deg 88deg auto');
      mv.setAttribute('alt',                "Pedro's 3D head");
      mv.style.cssText = 'width:100%;height:100%;background:transparent;--mv-background-color:transparent;--poster-color:transparent;--progress-bar-height:0px;pointer-events:none;';
      heroHeadMount.appendChild(mv);

      let baseRadius = null;
      // raw target (set instantly by mouse), smoothed target (eases toward raw),
      // spring state (chases smoothed target with physics)
      let rawT = BASE_THETA, rawP = BASE_PHI;   // cursor intent
      let tgtT = BASE_THETA, tgtP = BASE_PHI;   // smoothed intermediate
      let curT = BASE_THETA, velT = 0;
      let curP = BASE_PHI,   velP = 0;

      mv.addEventListener('load', () => {
        baseRadius = mv.getCameraOrbit().radius;
      }, { once: true });

      // track cursor globally, using the head's own centre as the origin
      document.addEventListener('mousemove', (e) => {
        const rect   = heroHeadMount.getBoundingClientRect();
        const headCX = rect.left + rect.width  / 2;
        const headCY = rect.top  + rect.height / 2;
        // normalise offset against half-viewport so the range feels consistent
        const nx = (e.clientX - headCX) / (window.innerWidth  * 0.5);
        const ny = (e.clientY - headCY) / (window.innerHeight * 0.5);
        rawT = BASE_THETA - nx * MAX_THETA;
        rawP = BASE_PHI   - ny * MAX_PHI;
      }, { passive: true });

      // cursor left the viewport — snap back to rest with a small shake
      document.addEventListener('mouseleave', () => {
        rawT = BASE_THETA;
        rawP = BASE_PHI;
        const SHAKE = 0.28;
        velT += (Math.random() * 2 - 1) * SHAKE;
        velP += (Math.random() * 2 - 1) * SHAKE * 0.4;
      });

      // physics loop:
      // 1. smooth target eases toward raw cursor intent   → removes snappiness on enter
      // 2. spring chases smoothed target with momentum    → bouncy settle + bounce-back on leave
      const tick = () => {
        if (baseRadius !== null) {
          const TARGET_EASE = 0.10;   // smooth follow
          const STIFFNESS   = 0.08;   // medium spring pull
          const DAMPING     = 0.74;   // low enough for visible oscillations on shake

          tgtT += (rawT - tgtT) * TARGET_EASE;
          tgtP += (rawP - tgtP) * TARGET_EASE;

          velT += (tgtT - curT) * STIFFNESS;
          velT *= DAMPING;
          curT += velT;

          velP += (tgtP - curP) * STIFFNESS;
          velP *= DAMPING;
          curP += velP;

          mv.cameraOrbit = `${curT}rad ${curP}rad ${baseRadius}m`;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    /* align head so it's centred between the top of "Pedro Carmo" and the bottom of the tagline */
    const alignHead = () => {
      const titleEl = document.querySelector('.hero-title');
      const subEl   = document.querySelector('.hero-sub');
      const heroEl  = document.querySelector('.hero');
      if (!titleEl || !subEl || !heroEl) return;
      const heroRect  = heroEl.getBoundingClientRect();
      const titleRect = titleEl.getBoundingClientRect();
      const subRect   = subEl.getBoundingClientRect();
      // span from the top edge of the title to the bottom edge of the tagline
      const blockTop    = titleRect.top    - heroRect.top;
      const blockBottom = subRect.bottom   - heroRect.top;
      const midY        = (blockTop + blockBottom) / 2;
      heroHeadMount.style.top       = midY + 'px';
      heroHeadMount.style.transform = 'translateY(-50%)';
    };
    alignHead();
    window.addEventListener('resize', alignHead, { passive: true });

    if (window.customElements && customElements.whenDefined) {
      customElements.whenDefined('model-viewer').then(buildHead);
    } else {
      buildHead();
    }
  }

  /* ---------- MOBILE 3D HEAD — static, sits by the title, scrolls away ---------- */
  const mobileHeadMount = document.getElementById('hero-head-mobile');
  if (mobileHeadMount && isMobileLayout) {
    // align the (absolutely-positioned) head with the "Pedro Carmo" title line
    const alignMobileHead = () => {
      const titleEl = document.querySelector('.hero-title');
      if (!titleEl) return;
      const r = titleEl.getBoundingClientRect();
      // document-space centre of the title (scroll-independent → correct for absolute)
      mobileHeadMount.style.top = (r.top + window.scrollY + r.height / 2) + 'px';
    };
    alignMobileHead();
    window.addEventListener('resize', alignMobileHead, { passive: true });

    const buildMobileHead = () => {
      const mv = document.createElement('model-viewer');
      mv.setAttribute('src',                'models/MyHeadblend.glb');
      mv.setAttribute('interaction-prompt', 'none');
      mv.setAttribute('shadow-intensity',   '0');
      mv.setAttribute('exposure',           '1');
      mv.setAttribute('environment-image',  'neutral');
      mv.setAttribute('disable-zoom',       '');
      mv.setAttribute('disable-tap',        '');
      mv.setAttribute('camera-orbit',       '0deg 88deg auto');  // starting pose
      mv.setAttribute('alt',                "Pedro's 3D head");
      mv.style.cssText = 'width:100%;height:100%;background:transparent;--mv-background-color:transparent;--poster-color:transparent;--progress-bar-height:0px;pointer-events:none;';
      mobileHeadMount.appendChild(mv);

      // Idle gaze: it only looks straight ahead or turns to its left (the head
      // sits in the top-right corner, so it glances toward the page). Long holds
      // between deliberate, eased moves keep it calm and non-distracting.
      const DEG = Math.PI / 180;
      const BASE_PHI = 88 * DEG;
      const LEFT     = 1;           // sign of theta that turns the head toward the content
      const MAX_T    = 30 * DEG;    // furthest left turn
      const TILT     = 4  * DEG;    // tiny up/down variation → stays basically level

      // cubic ease-in-out → starts slow, accelerates, settles softly
      const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

      let curT = 0,        curP = BASE_PHI;
      let fromT = 0,       fromP = BASE_PHI;
      let toT   = 0,       toP   = BASE_PHI;
      let moveStart = 0,   moveDur = 1000;
      let dwellUntil = 0,  phase = 'dwell';

      const pickTarget = (now) => {
        fromT = curT; fromP = curP;
        // ~45% return to front, otherwise a partial→full glance to the left
        toT = (Math.random() < 0.45) ? 0
                                     : LEFT * (0.5 + Math.random() * 0.5) * MAX_T;
        toP = BASE_PHI + (Math.random() * 2 - 1) * TILT;   // essentially level
        moveDur = 700 + Math.random() * 700;               // 0.7–1.4s, deliberate
        moveStart = now;
        phase = 'move';
      };

      const tick = (now) => {
        if (phase === 'move') {
          const p = Math.min(1, (now - moveStart) / moveDur);
          const e = ease(p);
          curT = fromT + (toT - fromT) * e;
          curP = fromP + (toP - fromP) * e;
          if (p >= 1) { phase = 'dwell'; dwellUntil = now + 2500 + Math.random() * 3000; }
        } else if (now >= dwellUntil) {
          pickTarget(now);
        }
        mv.cameraOrbit = `${curT}rad ${curP}rad auto`;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (window.customElements && customElements.whenDefined) {
      customElements.whenDefined('model-viewer').then(buildMobileHead);
    } else {
      buildMobileHead();
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

    /* --- video fullscreen button (no other controls shown) --- */
    modalContent.querySelectorAll('.d-video').forEach(vid => {
      const wrap = document.createElement('div');
      wrap.className = 'd-video-wrap';
      vid.after(wrap);
      wrap.appendChild(vid);

      const btn = document.createElement('button');
      btn.className = 'd-video-fs';
      btn.setAttribute('aria-label', 'Fullscreen');
      btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 4.5V1H4.5M8.5 1H12V4.5M12 8.5V12H8.5M4.5 12H1V8.5" stroke="white" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const req = vid.requestFullscreen || vid.webkitRequestFullscreen || vid.mozRequestFullScreen;
        if (req) req.call(vid);
      });
      wrap.appendChild(btn);
    });
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

  /* ---------- 3D MODEL VIEWER — zoom buttons + rotate cue ---------- */
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

    /* --- block page scroll when 2 fingers are rotating the model --- */
    wrap.addEventListener('touchmove', (e) => {
      if (e.touches.length >= 2) e.preventDefault();
    }, { passive: false });

    /* rotate affordance is model-viewer's own built-in hand prompt
       (interaction-prompt), so no custom cue is injected here. */
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
