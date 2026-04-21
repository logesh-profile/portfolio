/* =====================================================
   Logeshwaran — Portfolio (vanilla JS + GSAP)
===================================================== */
gsap.registerPlugin(ScrollTrigger);

/* ---------- Year ---------- */
document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Preloader ---------- */
(function preloader(){
  const el = document.getElementById('preloader');
  const count = document.getElementById('preCount');
  const bar = document.getElementById('preBar');
  document.body.style.overflow = 'hidden';

  const obj = { v: 0 };
  gsap.to(obj, {
    v: 100, duration: 2.4, ease: "power2.inOut",
    onUpdate: () => {
      const n = Math.floor(obj.v);
      count.textContent = n;
      bar.style.width = n + "%";
    },
    onComplete: () => {
      const tl = gsap.timeline({
        onComplete: () => { el.remove(); document.body.style.overflow = ''; ScrollTrigger.refresh(); }
      });
      // FIX: explicitly set the start state via gsap.set (not CSS transform) so text
      // is always visible if GSAP hasn't fired yet, and never stuck off-screen
      gsap.set('.hero .reveal-line > span', { yPercent: 110 });
      tl.to('.preloader-inner', { opacity: 0, duration: 0.4, ease: "power2.out" })
        .to('.curtain-top',    { yPercent: -100, duration: 1.0, ease: "expo.inOut" }, 0.2)
        .to('.curtain-bottom', { yPercent: 100,  duration: 1.0, ease: "expo.inOut" }, 0.2)
        // FIX: animate each reveal-line span from yPercent:110 → 0, staggered per line
        .to('.hero .reveal-line > span', { yPercent: 0, duration: 1.0, ease: "expo.out", stagger: 0.12 }, 0.5)
        .from('.hero-fade', { opacity: 0, y: 24, duration: 0.9, ease: "expo.out", stagger: 0.1 }, 0.7)
        .from('.portrait-tilt', { opacity: 0, scale: 0.88, duration: 1.2, ease: "expo.out" }, 0.55);
    }
  });
})();

/* ---------- Custom cursor — watery pointer ---------- */
(function cursor(){
  const el = document.getElementById('cursor');
  if (!el) return;

  // Inject the SVG pointer + ripple rings into the cursor div
  el.innerHTML = `
    <div class="cursor-ripple"></div>
    <div class="cursor-ripple"></div>
    <div class="cursor-ripple"></div>
    <svg class="cursor-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 2L20 12L12 13.5L8.5 21L4 2Z"
        fill="hsl(72,100%,61%)" stroke="hsl(0,0%,0%)" stroke-width="1.2"
        stroke-linejoin="round"/>
    </svg>`;

  let x = -200, y = -200, tx = -200, ty = -200;
  let revealed = false;
  let moveTimer = null;

  window.addEventListener('mousemove', (e) => {
    tx = e.clientX; ty = e.clientY;
    if (!revealed) { el.style.opacity = '1'; revealed = true; }

    // Add 'moving' class to trigger bigger ripple burst while mouse is moving
    el.classList.add('moving');
    clearTimeout(moveTimer);
    moveTimer = setTimeout(() => el.classList.remove('moving'), 120);

    const t = e.target.closest("a, button, [data-cursor='hover']");
    el.classList.toggle('hover', !!t);
  });

  function loop(){
    x += (tx - x) * 1; //mouse speed
    y += (ty - y) * 1;
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    requestAnimationFrame(loop);
  }
  loop();
})();

/* ---------- Scroll progress ---------- */
(function scrollProgress(){
  const bar = document.getElementById('scrollBar');
  const onScroll = () => {
    const h = document.documentElement;
    const total = h.scrollHeight - h.clientHeight;
    bar.style.width = total > 0 ? (h.scrollTop / total * 100) + "%" : "0%";
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ---------- Navbar ---------- */
(function navbar(){
  const pill = document.getElementById('navPill');
  const burger = document.getElementById('navBurger');
  const mobile = document.getElementById('navMobile');
  window.addEventListener('scroll', () => {
    pill.classList.toggle('scrolled', window.scrollY > 30);
  });
  burger.addEventListener('click', () => mobile.classList.toggle('open'));
  mobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobile.classList.remove('open')));
})();

/* ---------- Hero role rotator ---------- */
(function roles(){
  const el = document.getElementById('roleText');
  const arr = ["Developer.", "IoT Builder.", "Web Creator.", "Problem Solver."];
  let i = 0;
  setInterval(() => {
    i = (i + 1) % arr.length;
    gsap.to(el, { yPercent: -100, opacity: 0, duration: 0.4, ease: "power3.in",
      onComplete: () => {
        el.textContent = arr[i];
        gsap.fromTo(el, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: "expo.out" });
      }
    });
  }, 2400);
})();

/* ---------- Hero portrait — spotlight mask reveal ---------- */
(function portraitMask(){
  const tilt  = document.getElementById('portraitTilt');
  const frame = tilt ? tilt.querySelector('.portrait-frame') : null;
  if (!frame) return;

  // Get the existing <img> src, then rebuild the two-layer structure
  const originalImg = frame.querySelector('img');
  const src = originalImg ? originalImg.getAttribute('src') : '';
  const alt = originalImg ? originalImg.getAttribute('alt') : '';

  // Clear and rebuild
  frame.innerHTML = '';

  // Layer 1 — grayscale dark base (always visible)
  const imgBase = document.createElement('img');
  imgBase.src = src; imgBase.alt = alt;
  imgBase.className = 'img-base';
  frame.appendChild(imgBase);

  // Layer 2 — full colour, revealed by mask
  const imgReveal = document.createElement('img');
  imgReveal.src = src; imgReveal.alt = alt;
  imgReveal.className = 'img-reveal';
  frame.appendChild(imgReveal);

  // Glow ring that follows the mask circle
  const glowEl = document.createElement('div');
  glowEl.className = 'mask-glow';
  frame.appendChild(glowEl);

  // Idle hint
  const hint = document.createElement('div');
  hint.className = 'mask-hint';
  hint.textContent = '✦ Hover to reveal';
  frame.appendChild(hint);

  // Mask radius — starts at 0, expands on enter
  const RADIUS = 90; // px — spotlight size
  let currentR = 0;
  let targetR  = 0;
  let mx = 0, my = 0; // mouse pos relative to frame
  let isHovered = false;
  let rafId = null;

  function applyMask(x, y, r){
    const mask = `radial-gradient(circle ${r}px at ${x}px ${y}px, black 55%, transparent 80%)`;
    imgReveal.style.webkitMaskImage = mask;
    imgReveal.style.maskImage       = mask;
    // Move glow ring
    glowEl.style.left   = x + 'px';
    glowEl.style.top    = y + 'px';
    glowEl.style.width  = r * 2 + 'px';
    glowEl.style.height = r * 2 + 'px';
    glowEl.style.opacity = r > 5 ? '1' : '0';
  }

  function loop(){
    // Smoothly interpolate radius
    currentR += (targetR - currentR) * 0.12;
    applyMask(mx, my, currentR);
    rafId = requestAnimationFrame(loop);
  }

  // 3D tilt + mask mouse tracking
  tilt.addEventListener('mousemove', (e) => {
    const r = frame.getBoundingClientRect();
    mx = e.clientX - r.left;
    my = e.clientY - r.top;

    // Also do the 3D tilt on the tilt container
    const tr = tilt.getBoundingClientRect();
    const tx = (e.clientX - tr.left - tr.width/2)  / tr.width;
    const ty = (e.clientY - tr.top  - tr.height/2) / tr.height;
    gsap.to(tilt, { rotateY: tx * 8, rotateX: -ty * 8, duration: 0.5, ease: "power3.out", transformPerspective: 800 });
  });

  tilt.addEventListener('mouseenter', () => {
    isHovered = true;
    targetR = RADIUS;
    if (!rafId) loop();
  });

  tilt.addEventListener('mouseleave', () => {
    isHovered = false;
    targetR = 0;
    gsap.to(tilt, { rotateX: 0, rotateY: 0, duration: 0.8, ease: "expo.out" });
    // Stop loop once radius fully collapses
    const check = setInterval(() => {
      if (currentR < 1){ currentR = 0; cancelAnimationFrame(rafId); rafId = null; clearInterval(check); }
    }, 50);
  });

  loop();
})();

/* ---------- Hero scroll parallax ---------- */
gsap.to('.portrait-wrap', { yPercent: -18, ease: "none",
  scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 } });
gsap.to('.hero-headline', { yPercent: 12, opacity: 0.6, ease: "none",
  scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 } });
gsap.to('.hero-orb', { yPercent: -40, ease: "none",
  scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });

/* ---------- Magnetic buttons ---------- */
document.querySelectorAll('.magnetic').forEach(el => {
  const strength = 0.35;
  el.addEventListener('mousemove', (e) => {
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width/2);
    const y = e.clientY - (r.top + r.height/2);
    el.style.transform = `translate(${x*strength}px, ${y*strength}px)`;
  });
  el.addEventListener('mouseleave', () => { el.style.transform = "translate(0,0)"; });
  el.style.transition = "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)";
});

/* ---------- Bento glow follow ---------- */
document.querySelectorAll('.bento').forEach(b => {
  b.addEventListener('mousemove', (e) => {
    const r = b.getBoundingClientRect();
    b.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
    b.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
  });
});

/* ---------- 3D tilt cards ---------- */
document.querySelectorAll('.tilt').forEach(el => {
  const max = parseFloat(el.dataset.tilt || '6');
  el.addEventListener('mousemove', (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width/2) / r.width;
    const y = (e.clientY - r.top - r.height/2) / r.height;
    gsap.to(el, { rotateY: x * max, rotateX: -y * max, duration: 0.5, ease: "power3.out", transformPerspective: 800 });
  });
  el.addEventListener('mouseleave', () => gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.7, ease: "expo.out" }));
});

/* ---------- Section heading character split + scrub reveal ---------- */
document.querySelectorAll('.sh').forEach(sh => {
  const titleEl = sh.querySelector('.sh-title');
  if (titleEl && !titleEl.dataset.split) {
    // FIX: wrap characters in per-word containers (.sh-word = inline-block + nowrap)
    // so the browser can only line-break between words, never mid-character.
    const splitNode = (node) => {
      if (node.nodeType === 3) {
        const text = node.textContent || "";
        const frag = document.createDocumentFragment();
        // Split into words (preserving spaces between them)
        const parts = text.split(/(\s+)/);
        parts.forEach(part => {
          if (/^\s+$/.test(part)) {
            // it's whitespace — keep it as a text node so natural spacing is preserved
            frag.appendChild(document.createTextNode(part));
          } else {
            // it's a word — wrap each character in a .sh-char inside a .sh-word wrapper
            const wordEl = document.createElement('span');
            wordEl.className = 'sh-word';
            part.split('').forEach(ch => {
              const charEl = document.createElement('span');
              charEl.className = 'sh-char';
              charEl.textContent = ch;
              wordEl.appendChild(charEl);
            });
            frag.appendChild(wordEl);
          }
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1) {
        Array.from(node.childNodes).forEach(splitNode);
      }
    };
    Array.from(titleEl.childNodes).forEach(splitNode);
    titleEl.dataset.split = '1';
  }

  gsap.fromTo(sh.querySelector('.eb-line'),
    { scaleX: 0 }, { scaleX: 1, ease: "none",
      scrollTrigger: { trigger: sh, start: 'top 95%', end: 'top 70%', scrub: true } });
  gsap.fromTo(sh.querySelector('.sh-eyebrow'),
    { opacity: 0, x: -20 }, { opacity: 1, x: 0, ease: "none",
      scrollTrigger: { trigger: sh, start: 'top 95%', end: 'top 75%', scrub: true } });
  gsap.fromTo(sh.querySelectorAll('.sh-char'),
    { yPercent: 110, opacity: 0, rotate: 8 },
    { yPercent: 0, opacity: 1, rotate: 0, ease: "none", stagger: { each: 0.015 },
      scrollTrigger: { trigger: sh, start: 'top 90%', end: 'top 40%', scrub: 0.6 } });
  if (sh.querySelector('.sh-desc')) {
    gsap.fromTo(sh.querySelector('.sh-desc'),
      { opacity: 0, y: 30 }, { opacity: 1, y: 0, ease: "none",
        scrollTrigger: { trigger: sh, start: 'top 80%', end: 'top 55%', scrub: true } });
  }
});

/* ---------- About / Service / Project / Stat scrub entrances + drift ---------- */
function scrubReveal(selector, opts = {}) {
  const { rotateAlt = true, drift = true, driftAmt = 14 } = opts;
  document.querySelectorAll(selector).forEach((card, i) => {
    gsap.fromTo(card,
      { opacity: 0, y: 100, scale: 0.85, rotate: rotateAlt ? (i % 2 === 0 ? -4 : 4) : 0 },
      { opacity: 1, y: 0, scale: 1, rotate: 0, ease: "none",
        scrollTrigger: { trigger: card, start: 'top 95%', end: 'top 55%', scrub: 0.8 } });
    if (drift) {
      gsap.to(card, { yPercent: i % 2 === 0 ? -driftAmt : -(driftAmt + 8), ease: "none",
        scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: 1.2 } });
    }
  });
}
scrubReveal('.about-card');
scrubReveal('.service-card');
scrubReveal('.project-card', { driftAmt: 8 });
scrubReveal('.stat-card', { rotateAlt: false, driftAmt: 10 });

/* Timeline rows */
gsap.utils.toArray('.tl-item').forEach(item => {
  gsap.fromTo(item, { opacity: 0, x: -60 },
    { opacity: 1, x: 0, ease: "none",
      scrollTrigger: { trigger: item, start: 'top 92%', end: 'top 65%', scrub: 0.8 } });
});

/* ---------- Skills (injected list + animated bars) ---------- */
(function skills(){
  const data = [
    { name: "Python", level: 75, group: "Languages" },
    { name: "Java", level: 45, group: "Languages" },
    { name: "JavaScript", level: 50, group: "Languages" },
    { name: "HTML / CSS", level: 80, group: "Web" },
    { name: "React", level: 65, group: "Web" },
    { name: "Flutter", level: 60, group: "Mobile" },
  ];
  const list = document.querySelector('.skill-list');
  if (!list) return;
  data.forEach(s => {
    const row = document.createElement('div');
    row.className = 'skill-row';
    row.innerHTML = `
      <div class="skill-meta"><strong>${s.name}</strong><span class="overline">${s.group} · ${s.level}%</span></div>
      <div class="skill-track"><div class="skill-bar" data-level="${s.level}"></div></div>`;
    list.appendChild(row);
  });
  gsap.from('.skill-row', {
    scrollTrigger: { trigger: '.skill-list', start: 'top 80%' },
    opacity: 0, y: 30, stagger: 0.08, duration: 0.7, ease: "expo.out"
  });
  gsap.utils.toArray('.skill-bar').forEach(bar => {
    const w = bar.dataset.level || '0';
    gsap.fromTo(bar, { width: '0%' }, { width: w + '%', duration: 1.4, ease: "expo.out",
      scrollTrigger: { trigger: bar, start: 'top 90%' } });
  });
  gsap.from('.tool-pill', {
    scrollTrigger: { trigger: '.tool-cloud', start: 'top 85%' },
    opacity: 0, scale: 0.8, stagger: 0.05, duration: 0.5, ease: "back.out(1.7)"
  });
})();

/* ---------- Counters ---------- */
gsap.utils.toArray('.counter').forEach(el => {
  const to = parseInt(el.dataset.to, 10) || 0;
  const obj = { v: 0 };
  gsap.to(obj, { v: to, duration: 2, ease: "expo.out",
    scrollTrigger: { trigger: el, start: 'top 85%' },
    onUpdate: () => el.textContent = Math.floor(obj.v) });
});

/* ---------- Horizontal pinned case studies ---------- */
/* FIX: added ResizeObserver to invalidate ScrollTrigger on resize so getDistance()
   stays accurate when the viewport changes (e.g. mobile rotation, devtools resize) */
(function horizontalPin(){
  const section = document.getElementById('case-studies');
  const track = document.getElementById('hpinTrack');
  if (!section || !track) return;
  if (window.matchMedia('(max-width: 768px)').matches) return;

  const getDistance = () => track.scrollWidth - window.innerWidth;

  const st = ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: () => "+=" + getDistance(),
    pin: true,
    scrub: 1,
    invalidateOnRefresh: true,
    anticipatePin: 1,
    onUpdate: (self) => {
      gsap.set(track, { x: -getDistance() * self.progress });
    }
  });

  // FIX: re-calculate on window resize so the pin end is always correct
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { ScrollTrigger.refresh(); }, 200);
  });
})();

/* ---------- Sticky scramble headline ---------- */
(function scrambleSection(){
  const word = document.getElementById('scrambleWord');
  const sub = document.getElementById('scrambleSub');
  const bar = document.getElementById('scrambleBar');
  const section = document.getElementById('scramble');
  if (!word || !section) return;

  const phrases = [
    { word: "SOFTWARE", sub: "software that ships fast and feels alive." },
    { word: "INTERFACES", sub: "interfaces that respect attention and reward curiosity." },
    { word: "HARDWARE", sub: "hardware that bridges atoms with bytes." },
    { word: "SYSTEMS",  sub: "systems that scale calmly under pressure." },
    { word: "FUTURES",  sub: "futures we get to design — one experiment at a time." },
  ];
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&@!*<>/\\";
  let scrambleId = null;

  function setWord(target, subText) {
    if (scrambleId) cancelAnimationFrame(scrambleId);
    const start = performance.now();
    const dur = 500;
    function tick(now){
      const t = Math.min(1, (now - start) / dur);
      let out = "";
      for (let i = 0; i < target.length; i++){
        if (i / target.length < t) out += target[i];
        else out += chars[Math.floor(Math.random() * chars.length)];
      }
      word.textContent = out;
      if (t < 1) scrambleId = requestAnimationFrame(tick);
      else word.textContent = target;
    }
    scrambleId = requestAnimationFrame(tick);
    sub.textContent = subText;
  }

  let lastIdx = -1;
  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      bar.style.width = (p * 100) + "%";
      const idx = Math.min(phrases.length - 1, Math.floor(p * phrases.length));
      if (idx !== lastIdx) {
        lastIdx = idx;
        setWord(phrases[idx].word, phrases[idx].sub);
      }
    }
  });
})();

/* ---------- Floating field labels ---------- */
/* FIX: use 'input' + 'change' + 'blur' events to also catch autofill and paste.
   Also check value on DOMContentLoaded to handle browser-remembered values. */
function updateFieldState(inp) {
  inp.parentElement.classList.toggle('active', inp.value.length > 0);
}
document.querySelectorAll('.field input, .field textarea').forEach(inp => {
  inp.placeholder = ' ';
  inp.addEventListener('input', () => updateFieldState(inp));
  inp.addEventListener('change', () => updateFieldState(inp));
  inp.addEventListener('blur',  () => updateFieldState(inp));
});
// Catch browser autofill on load
window.addEventListener('load', () => {
  document.querySelectorAll('.field input, .field textarea').forEach(inp => updateFieldState(inp));
});

/* ---------- Contact submit -> mailto ---------- */
const form = document.getElementById('contactForm');
const toast = document.getElementById('toast');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const subject = `Portfolio inquiry from ${fd.get('name')}`;
    const body = `${fd.get('message')}\n\n— ${fd.get('name')} (${fd.get('email')})`;
    window.location.href = `mailto:mlogeshwaran2007@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast.textContent = "Opening your email client...";
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  });
}

/* ---------- Refresh ScrollTrigger on load ---------- */
window.addEventListener('load', () => ScrollTrigger.refresh());