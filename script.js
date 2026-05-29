/* =================================================================
   PEDRO CARMO — PORTFOLIO SCRIPT
   ================================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- CURRENT YEAR ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- STICKY NAV ---------- */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- HOVER VIDEOS ---------- */
  document.querySelectorAll('.project-card').forEach((card) => {
    const video = card.querySelector('.project-hover-video');
    if (!video) return;
    card.addEventListener('mouseenter', () => video.play().catch(() => {}));
    card.addEventListener('mouseleave', () => { video.pause(); video.currentTime = 0; });
  });

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
    const zoomBtn = (label) => {
      const b = document.createElement('button');
      b.className = 'mv-zoom-btn';
      b.textContent = label;
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const orbit  = mv.getCameraOrbit();
        const factor = label === '+' ? 0.8 : 1.25;
        const clamped = Math.min(Math.max(orbit.radius * factor, 0.1), 20);
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

    let dragging = false;

    const setPos = (x) => {
      const rect = el.getBoundingClientRect();
      const pct  = Math.min(100, Math.max(0, ((x - rect.left) / rect.width) * 100));
      after.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
      handle.style.left    = `${pct}%`;
    };

    el.addEventListener('pointerdown',  (e) => { dragging = true; el.setPointerCapture(e.pointerId); setPos(e.clientX); });
    el.addEventListener('pointermove',  (e) => { if (dragging) setPos(e.clientX); });
    el.addEventListener('pointerup',    ()  => { dragging = false; });
    el.addEventListener('pointercancel',()  => { dragging = false; });
  }

});
