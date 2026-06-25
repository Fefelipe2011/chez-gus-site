const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const gsapReady = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
if (gsapReady && !reduceMotion) window.gsap.registerPlugin(window.ScrollTrigger);

// ===== Révélation au scroll (IntersectionObserver) =====
const reveals = document.querySelectorAll('.reveal');

if (reduceMotion || !('IntersectionObserver' in window)) {
  reveals.forEach((el) => el.classList.add('is-visible'));
} else {
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach((el) => io.observe(el));
}

// ===== Scroll-spy : lien actif dans la barre glassmorphism =====
const navLinks = document.querySelectorAll('.gnav-link');
const sections = [...navLinks]
  .map((link) => document.getElementById(link.dataset.section))
  .filter(Boolean);

function setActive(id) {
  navLinks.forEach((link) => {
    link.classList.toggle('is-active', link.dataset.section === id);
  });
}

if ('IntersectionObserver' in window && sections.length) {
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

  sections.forEach((sec) => spy.observe(sec));
}

// Mise à jour immédiate au clic
navLinks.forEach((link) => {
  link.addEventListener('click', () => setActive(link.dataset.section));
});

// ===== Galerie : Card Fan Carousel (port fidèle du composant React) =====
(function initFanCarousel() {
  const fan = document.getElementById('fan');
  const container = document.getElementById('fanLayout');
  const gallery = document.getElementById('galerie');
  const pager = document.getElementById('fanPager');
  const dotsWrap = document.getElementById('fanDots');
  if (!fan || !container || !gallery) return;

  const cardElements = Array.from(container.querySelectorAll('.fan-card'));
  const totalCards = cardElements.length;
  if (!totalCards) return;

  // Repli : pas d'animation -> grille statique
  if (reduceMotion || !gsapReady) {
    gallery.classList.add('is-static');
    return;
  }

  const g = window.gsap;
  const MAX_VISIBLE = 7;
  const HALF = 3;

  const FAN_POSITIONS = [
    { rot: -21, scale: 0.7756, x: -30, y: 7.3, zIndex: 1 },
    { rot: -14, scale: 0.8498, x: -22, y: 4.0, zIndex: 2 },
    { rot: -7,  scale: 0.9346, x: -11, y: 1.3, zIndex: 3 },
    { rot: 0,   scale: 1.0,    x: 0,   y: 0.0, zIndex: 10 },
    { rot: 7,   scale: 0.9346, x: 11,  y: 1.3, zIndex: 3 },
    { rot: 14,  scale: 0.8498, x: 22,  y: 4.0, zIndex: 2 },
    { rot: 21,  scale: 0.7756, x: 30,  y: 7.3, zIndex: 1 },
  ];

  function getResponsiveMultiplier(width) {
    if (width < 480) return 0.28;
    if (width < 640) return 0.38;
    if (width < 768) return 0.5;
    if (width < 1024) return 0.75;
    return 1.0;
  }

  function getHeightMultiplier(width) {
    let idealPx;
    if (width < 480) idealPx = 22 * 16;
    else if (width < 640) idealPx = 26 * 16;
    else if (width < 768) idealPx = 28 * 16;
    else if (width < 1024) idealPx = 34 * 16;
    else idealPx = 38 * 16;
    const available = window.innerHeight * 0.7;
    if (available >= idealPx) return 1;
    return available / idealPx;
  }

  function getSlotConfig(total, slot) {
    if (total >= MAX_VISIBLE) return FAN_POSITIONS[slot];
    const center = total >> 1;
    const distance = total > 1 ? (slot - center) / center : 0;
    const absDistance = Math.abs(distance);
    return {
      rot: distance * 21,
      scale: 1.0 - 0.2244 * absDistance * absDistance,
      x: distance * 30,
      y: absDistance * absDistance * 7.3,
      zIndex: 10 - Math.abs(slot - center),
    };
  }

  const needsPagination = totalCards > MAX_VISIBLE;
  let centerIndex = needsPagination ? HALF : totalCards >> 1;
  let isAnimating = false;
  let hasEntered = false;
  let direction = null;
  let prevVisible = new Set();
  let cleanupHover = null;

  function getVisibleMap(center) {
    const map = new Map();
    if (!needsPagination) {
      cardElements.forEach((_, i) => map.set(i, i));
      return map;
    }
    for (let slot = 0; slot < MAX_VISIBLE; slot++) {
      map.set(((center + slot - HALF) % totalCards + totalCards) % totalCards, slot);
    }
    return map;
  }

  function render() {
    const visibleMap = getVisibleMap(centerIndex);
    const previouslyVisible = prevVisible;
    const isFirstMount = !hasEntered;
    const multiplier = getResponsiveMultiplier(window.innerWidth);
    const hMult = getHeightMultiplier(window.innerWidth);
    const slotCount = needsPagination ? MAX_VISIBLE : totalCards;
    const config = (slot) => getSlotConfig(slotCount, slot);

    if (isFirstMount) isAnimating = true;

    let completedCount = 0;
    const visibleCount = visibleMap.size;
    const onCardDone = () => {
      if (++completedCount >= visibleCount) {
        isAnimating = false;
        if (isFirstMount) hasEntered = true;
      }
    };

    cardElements.forEach((card, cardIndex) => {
      const slot = visibleMap.get(cardIndex);
      const wasVisible = previouslyVisible.has(cardIndex);

      if (slot !== undefined) {
        const { x, y, rot, scale, zIndex } = config(slot);
        const target = { x: `${x * multiplier}rem`, y: `${y * hMult}rem`, rotation: rot, scale, opacity: 1, zIndex };

        if (isFirstMount) {
          g.set(card, { x: 0, y: `${12 * hMult}rem`, rotation: 0, scale: 0.5, opacity: 0 });
          g.to(card, { ...target, duration: 1.2, ease: 'elastic.out(1.05,.78)', delay: 0.2 + slot * 0.06, onComplete: onCardDone });
        } else if (!wasVisible) {
          const enterX = direction === 'right' ? 40 : -40;
          g.set(card, { x: `${enterX}rem`, y: `${y * hMult}rem`, rotation: direction === 'right' ? 30 : -30, scale: 0.5, opacity: 0 });
          g.to(card, { ...target, duration: 0.6, ease: 'power2.out', onComplete: onCardDone });
        } else {
          g.to(card, { ...target, duration: 0.5, ease: 'power2.out', onComplete: onCardDone });
        }
      } else if (wasVisible) {
        const exitX = direction === 'right' ? -40 : 40;
        g.to(card, { x: `${exitX}rem`, opacity: 0, scale: 0.5, rotation: direction === 'right' ? -30 : 30, duration: 0.4, ease: 'power2.in', zIndex: 0 });
      } else if (isFirstMount) {
        g.set(card, { opacity: 0, scale: 0.3, x: 0, y: 0, zIndex: 0 });
      }
    });

    prevVisible = new Set(visibleMap.keys());

    // --- Interactions de survol ---
    if (cleanupHover) cleanupHover();

    const visibleEntries = [];
    cardElements.forEach((el, i) => {
      const slot = visibleMap.get(i);
      if (slot !== undefined) visibleEntries.push({ el, slot });
    });
    visibleEntries.sort((a, b) => a.slot - b.slot);

    let activeSlot = null;
    let leaveTimer = null;
    const centerSlot = visibleEntries.length >> 1;

    const updateHoverLayout = (hoveredSlot) => {
      const mult = getResponsiveMultiplier(window.innerWidth);
      const hM = getHeightMultiplier(window.innerWidth);

      visibleEntries.forEach(({ el, slot }) => {
        const base = config(slot);
        let targetX = base.x * mult;
        let targetY = base.y * hM;
        let targetRot = base.rot;
        let targetScale = base.scale;
        let delay = 0;

        if (hoveredSlot !== null) {
          const distance = Math.abs(slot - hoveredSlot);
          delay = distance * 0.02;

          if (slot === hoveredSlot) {
            targetY -= 2.5 * hM;
            targetScale *= 1.08;
          } else {
            const normalized = centerSlot > 0 ? (slot - centerSlot) / centerSlot : 0;
            const pushStrength = 8 * (1 - Math.abs(normalized)) * (1 + 0.2 * Math.max(0, 3 - distance));

            if (slot < hoveredSlot) {
              targetX -= pushStrength * mult;
              targetRot -= 3 / (distance + 1);
            } else {
              targetX += pushStrength * mult;
              targetRot += 3 / (distance + 1);
            }

            if (slot === visibleEntries.length - 1 && hoveredSlot < centerSlot) targetY -= 1 * hM;
            if (slot === 0 && hoveredSlot > centerSlot) targetY -= 1 * hM;
          }
        } else {
          delay = Math.abs(slot - centerSlot) * 0.02;
        }

        g.to(el, { x: `${targetX}rem`, y: `${targetY}rem`, rotation: targetRot, scale: targetScale, duration: 0.5, delay, ease: 'elastic.out(1,.75)', overwrite: 'auto' });
        g.set(el, { zIndex: base.zIndex });
      });
    };

    const enterHandlers = visibleEntries.map(({ el, slot }) => {
      const handler = () => {
        if (isAnimating) return;
        if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
        if (activeSlot !== slot) { activeSlot = slot; updateHoverLayout(slot); }
      };
      el.addEventListener('mouseenter', handler);
      return { el, handler };
    });

    const onMouseLeave = () => {
      if (isAnimating) return;
      if (leaveTimer) clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => { activeSlot = null; updateHoverLayout(null); }, 50);
    };
    container.addEventListener('mouseleave', onMouseLeave);

    const onResize = () => { if (!isAnimating) updateHoverLayout(activeSlot); };
    window.addEventListener('resize', onResize);

    cleanupHover = () => {
      enterHandlers.forEach(({ el, handler }) => el.removeEventListener('mouseenter', handler));
      container.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('resize', onResize);
      if (leaveTimer) clearTimeout(leaveTimer);
    };

    updateDots();
  }

  function cycle(dir) {
    if (isAnimating || !needsPagination) return;
    isAnimating = true;
    direction = dir;
    centerIndex = dir === 'right'
      ? (centerIndex + 1) % totalCards
      : (centerIndex - 1 + totalCards) % totalCards;
    render();
  }

  // --- Pagination (uniquement si plus de 7 cartes) ---
  let dots = [];
  function updateDots() {
    dots.forEach((d, i) => d.classList.toggle('is-active', i === centerIndex));
  }
  if (needsPagination && pager && dotsWrap) {
    for (let i = 0; i < totalCards; i++) {
      const dot = document.createElement('span');
      dot.className = 'fan-dot';
      dotsWrap.appendChild(dot);
      dots.push(dot);
    }
    const prev = document.getElementById('fanPrev');
    const next = document.getElementById('fanNext');
    if (prev) prev.addEventListener('click', () => cycle('left'));
    if (next) next.addEventListener('click', () => cycle('right'));
  } else if (pager) {
    pager.style.display = 'none';
  }

  // Montage : entrée animée immédiate (fidèle au composant React)
  render();
})();

// ===== Lightbox : clic sur une photo de la galerie -> agrandissement =====
(function initLightbox() {
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImg');
  const lbClose = document.getElementById('lightboxClose');
  const cards = document.querySelectorAll('#fanLayout .fan-card');
  if (!lb || !lbImg || !cards.length) return;

  // Version plus grande de l'image quand c'est une URL Unsplash
  function hiRes(src) {
    return src.replace('w=400&h=700&fit=crop', 'w=1000&fit=crop');
  }

  function open(card) {
    const img = card.querySelector('img');
    if (!img) return;
    lbImg.src = hiRes(img.currentSrc || img.src);
    lbImg.alt = img.alt || '';
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  cards.forEach((card) => {
    card.addEventListener('click', () => open(card));
  });
  if (lbClose) lbClose.addEventListener('click', close);
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lb.classList.contains('is-open')) close();
  });
})();

// ===== Carte 3D : redressement au scroll =====
(function initCarteScroll() {
  const card = document.querySelector('.scroll3d__card');
  if (!card || reduceMotion || !gsapReady) return; // sinon : carte à plat (état CSS par défaut)

  const isMobile = window.innerWidth <= 768;
  window.gsap.fromTo(card,
    { rotateX: 20, scale: isMobile ? 0.92 : 1.04 },
    {
      rotateX: 0, scale: 1, ease: 'none',
      scrollTrigger: {
        trigger: '#carteScroll',
        start: 'top 85%',
        end: 'top 30%',
        scrub: 1,
      },
    });
})();

// ===== Année dynamique dans le footer =====
document.getElementById('year').textContent = new Date().getFullYear();
