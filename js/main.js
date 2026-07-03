/* ============================================================
   THE AMBASSADOR — interactions
   Stack: GSAP + ScrollTrigger + Lenis
   ============================================================ */
gsap.registerPlugin(ScrollTrigger);
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------
   HERO config — swap images / drop in a video here.
   For slide 1 you can later set: { video: 'assets/video/hero.mp4', image: 'poster.jpg' }
------------------------------------------------------------ */
const SLIDES = [
  // Slide 1 — brand masked title over background video (dining image = poster while it loads)
  { type: "brand", video: "assets/video/hero-1.mp4", image: "assets/img/hero-dining.jpg" },
  // Slide 2 — Golden Mango Hour (offer-style, centered card)
  { type: "offer", image: "assets/img/hero-mango.png",
    title: "Golden Mango Hour",
    sub: "애플 망고 빙수와 함께 달콤하고 시원한 여름의 순간을 즐겨보세요.",
    date: "2026.06.22 ~ 2026.07.14", href: "#" },
  // Slide 3 — Midnight Lounge (offer-style, centered card)
  { type: "offer", image: "assets/img/hero-lounge.png",
    title: "Midnight Lounge",
    sub: "어둠이 내려앉은 순간, 라운지는 더 우아해집니다.",
    date: "2026.06.22 ~ 2026.07.14", href: "#" },
];
const SLIDE_DURATION = 5; // seconds each slide is held while the bar fills

/* ------------------------------------------------------------
   Smooth scroll (Lenis) wired into GSAP ticker
------------------------------------------------------------ */
let lenis;
function initSmooth() {
  if (reduced || location.hash === "#nolenis") return; // #nolenis: native scroll (debug/screenshots)
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  window.lenis = lenis; // debug handle
}

/* ------------------------------------------------------------
   Hero title — split into masked chars, reveal bottom→top
------------------------------------------------------------ */
function splitTitle() {
  document.querySelectorAll(".hero__title .line").forEach((line) => {
    const text = line.textContent.trim();
    line.textContent = "";
    [...text].forEach((ch) => {
      if (ch === " ") {
        const sp = document.createElement("span");
        sp.className = "space";
        line.appendChild(sp);
        return;
      }
      const span = document.createElement("span");
      span.className = "char";
      span.textContent = ch;
      line.appendChild(span);
    });
  });
}
function revealTitle() {
  const chars = document.querySelectorAll(".hero__title .char");
  if (reduced) {
    gsap.set(chars, { yPercent: 0, opacity: 1 });
    return;
  }
  gsap.set(chars, { yPercent: 118 });
  gsap.to(chars, {
    yPercent: 0,
    duration: 1.0,
    ease: "power3.out",
    stagger: 0.022,
    delay: 0.35,
  });
}

/* ------------------------------------------------------------
   Hero slideshow — 7 slides, auto-filling progress bar
------------------------------------------------------------ */
function initHero() {
  const slidesEl = document.getElementById("heroSlides");
  const barsEl = document.getElementById("heroBars");
  const indexEl = document.getElementById("heroIndex");
  const totalEl = document.getElementById("heroTotal");
  totalEl.textContent = SLIDES.length;

  // foreground content swap: slide 1 = brand title, slides 2+ = offer card
  const heroEl = document.getElementById("hero");
  const offerEl = document.getElementById("heroOffer");
  const ARROW = `<svg class="ic" viewBox="0 0 24 24" fill="none"><path d="M7 17 17 7M9 7h8v8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  function renderForeground(i) {
    const s = SLIDES[i];
    if (s.type === "offer") {
      offerEl.innerHTML = `
        <div class="hero__offer-group">
          <h2 class="hero__offer-title">${s.title}</h2>
          <p class="hero__offer-sub">${s.sub}</p>
          <span class="hero__offer-rule"></span>
          <p class="hero__offer-date">${s.date}</p>
        </div>
        <a class="hero__offer-btn" href="${s.href || "#"}">자세히 보기 ${ARROW}</a>`;
      offerEl.setAttribute("aria-hidden", "false");
      heroEl.classList.add("is-offer");
      // reveal is handled by CSS transition (delayed) so it doesn't depend on rAF
    } else {
      offerEl.setAttribute("aria-hidden", "true");
      heroEl.classList.remove("is-offer");
      revealTitle(); // replay the big masked-title reveal on the brand slide
    }
  }

  const slideNodes = SLIDES.map((s) => {
    const slide = document.createElement("div");
    slide.className = "hero__slide";
    if (s.video) {
      const v = document.createElement("video");
      v.src = s.video;
      v.muted = true;
      v.playsInline = true;
      v.preload = "auto";
      if (s.image) v.poster = s.image;
      slide.appendChild(v);
    } else {
      const m = document.createElement("div");
      m.className = "hero__slide-media";
      m.style.backgroundImage = `url(${s.image})`;
      slide.appendChild(m);
    }
    slidesEl.appendChild(slide);
    return slide;
  });

  const fills = SLIDES.map(() => {
    const bar = document.createElement("div");
    bar.className = "hero__bar";
    const fill = document.createElement("div");
    fill.className = "hero__bar-fill";
    bar.appendChild(fill);
    barsEl.appendChild(bar);
    return fill;
  });

  let current = -1;
  let progressTween = null;

  const setBars = (active) =>
    fills.forEach((f, i) => gsap.set(f, { scaleX: i < active ? 1 : 0 }));

  function kenBurns(i) {
    const media = slideNodes[i].querySelector(".hero__slide-media");
    if (!media || reduced) return;
    gsap.fromTo(
      media,
      { scale: 1.02 },
      { scale: 1.14, duration: SLIDE_DURATION + 1.3, ease: "none" }
    );
  }

  function goTo(index) {
    index = (index + SLIDES.length) % SLIDES.length;
    if (index === current) return;
    const prevIndex = current;
    current = index;

    slideNodes.forEach((n, i) => {
      n.classList.toggle("is-active", i === index);
      n.classList.toggle("is-prev", i === prevIndex);
    });
    indexEl.textContent = index + 1;
    renderForeground(index);

    // premium curtain wipe — incoming slide clip-reveals over the outgoing one
    // (no opacity fade, so it never flashes through the black page background)
    if (!reduced && prevIndex !== -1) {
      gsap.set(slideNodes[index], { clipPath: "inset(0% 0% 0% 100%)" });
      gsap.to(slideNodes[index], {
        clipPath: "inset(0% 0% 0% 0%)", duration: 1.15, ease: "power3.inOut",
        onComplete: () => {
          gsap.set(slideNodes[index], { clearProps: "clipPath" });
          const p = slideNodes[prevIndex];
          if (p) p.classList.remove("is-prev");
        },
      });
    }

    slideNodes.forEach((n, i) => {
      const v = n.querySelector("video");
      if (!v) return;
      if (i === index) {
        v.currentTime = 0;
        v.play().catch(() => {});
      } else v.pause();
    });

    kenBurns(index);

    if (progressTween) progressTween.kill();
    setBars(index);

    const fill = fills[index];
    if (reduced) {
      gsap.set(fill, { scaleX: 1 });
      return; // no auto-advance when reduced motion
    }

    let dur = SLIDE_DURATION;
    const vid = slideNodes[index].querySelector("video");
    if (vid && vid.duration) dur = vid.duration;

    progressTween = gsap.fromTo(
      fill,
      { scaleX: 0 },
      { scaleX: 1, duration: dur, ease: "none", onComplete: () => goTo(current + 1) }
    );
  }

  document.getElementById("heroControls").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-dir]");
    if (!btn) return;
    goTo(current + (btn.dataset.dir === "next" ? 1 : -1));
  });

  goTo(0);
}

/* ------------------------------------------------------------
   GNB — transparent over hero, dark+blur after; hide on scroll-down
------------------------------------------------------------ */
function initGnb() {
  const gnb = document.getElementById("gnb");
  const hero = document.getElementById("hero");

  ScrollTrigger.create({
    trigger: hero,
    start: "bottom top+=1",
    onEnter: () => gnb.classList.add("is-scrolled"),
    onLeaveBack: () => gnb.classList.remove("is-scrolled"),
  });

  let lastY = 0;
  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      const y = self.scroll();
      if (y < window.innerHeight * 0.9) {
        gnb.classList.remove("is-hidden");
        lastY = y;
        return;
      }
      if (y > lastY + 6) gnb.classList.add("is-hidden");
      else if (y < lastY - 6) gnb.classList.remove("is-hidden");
      lastY = y;
    },
  });
}

/* ------------------------------------------------------------
   WHERE TO GO NEXT — centered, infinitely rolling carousel
   Cards flow left→right, active card centered + detailed,
   2s dwell, pause on hover, click a card to focus.
------------------------------------------------------------ */
const WTG_CARDS = [
  { img:"assets/img/wtg-1.jpg", hotel:"앰배서더 서울 풀만", name:"GLOW YOUR SUMMER", date:"2026.06.15 ~ 2026.08.31", tags:["회원전용","조식포함","수영장포함"], was:"230,000원", badge:"-15% GOLD", price:"345,000" },
  { img:"assets/img/wtg-2.jpg", hotel:"페어몬트 앰배서더 서울", name:"URBAN STAYCATION", date:"2026.06.01 ~ 2026.09.30", tags:["회원전용","레이트체크아웃"], was:"280,000원", badge:"-12% GOLD", price:"389,000" },
  { img:"assets/img/wtg-3.jpg", hotel:"소피텔 앰배서더 서울", name:"WELLNESS RETREAT", date:"2026.07.01 ~ 2026.08.31", tags:["스파포함","조식포함"], was:"420,000원", badge:"-20% GOLD", price:"520,000" },
  { img:"assets/img/wtg-4.jpg", hotel:"노보텔 앰배서더 서울 강남", name:"GOURMET ESCAPE", date:"2026.06.15 ~ 2026.08.15", tags:["디너포함","조식포함"], was:"310,000원", badge:"-15% GOLD", price:"395,000" },
  { img:"assets/img/wtg-5.jpg", hotel:"그랜드 머큐어 앰배서더 서울 용산", name:"SKY VIEW NIGHTS", date:"2026.06.01 ~ 2026.08.31", tags:["회원전용","수영장포함"], was:"350,000원", badge:"-18% GOLD", price:"430,000" },
  { img:"assets/img/wtg-6.jpg", hotel:"호텔 나루 서울 엠갤러리 앰배서더", name:"ROMANTIC MOMENTS", date:"2026.06.10 ~ 2026.09.10", tags:["샴페인","레이트체크아웃"], was:"330,000원", badge:"-15% GOLD", price:"410,000" },
  { img:"assets/img/wtg-7.jpg", hotel:"풀만 앰배서더 서울 이스트폴", name:"FAMILY DELIGHT", date:"2026.07.01 ~ 2026.08.31", tags:["키즈","조식포함","수영장포함"], was:"390,000원", badge:"-15% GOLD", price:"480,000" },
];

function initWhereToGo() {
  const carousel = document.getElementById("wtgCarousel");
  const track = document.getElementById("wtgTrack");
  const barsEl = document.getElementById("wtgBars");
  const idxEl = document.getElementById("wtgIndex");
  document.getElementById("wtgTotal").textContent = WTG_CARDS.length;
  if (!track) return;

  const N = WTG_CARDS.length;
  const SETS = 3;

  const info = document.getElementById("wtgInfo");
  const infoHTML = (d) => `
    <div class="wtg-card__top">
      <div class="wtg-card__meta">
        <p class="hotel">${d.hotel}</p>
        <p class="name">${d.name}</p>
        <p class="date">${d.date}</p>
      </div>
      <div class="wtg-card__tags">${d.tags.map((t) => `<span>${t}</span>`).join("")}</div>
    </div>
    <div class="wtg-card__price">
      <div class="row"><s>${d.was}</s><span class="badge">${d.badge}</span></div>
      <div class="amount"><b>${d.price}</b><em>원~</em></div>
    </div>`;

  const makeCard = (d, idx) => {
    const el = document.createElement("article");
    el.className = "wtg-card";
    el.dataset.i = idx; // logical card index for the fixed info block
    el.innerHTML = `<div class="wtg-card__media"><img src="${d.img}" alt="${d.name}" /></div>`;
    return el;
  };

  const all = [];
  for (let s = 0; s < SETS; s++) {
    WTG_CARDS.forEach((d, idx) => {
      const el = makeCard(d, idx);
      track.appendChild(el);
      all.push(el);
    });
  }

  const fills = WTG_CARDS.map(() => {
    const bar = document.createElement("div");
    bar.className = "wtg__bar";
    const fill = document.createElement("div");
    fill.className = "wtg__bar-fill";
    bar.appendChild(fill);
    barsEl.appendChild(fill.parentElement);
    return fill;
  });

  let active = N; // rendered pointer, starts in middle set (logical card 0)
  let count = 0; // logical 0..N-1 for counter + bars
  let slideTween = null;
  let dwell = null;

  const centerX = (i) => carousel.clientWidth / 2 - (all[i].offsetLeft + all[i].offsetWidth / 2);

  function setActiveVisuals() {
    all.forEach((el, i) => el.classList.toggle("is-active", i === active));
    idxEl.textContent = count + 1;
    fills.forEach((f, i) => gsap.set(f, { scaleX: i < count ? 1 : 0 }));
  }
  function showInfo() {
    const d = WTG_CARDS[+all[active].dataset.i];
    info.innerHTML = infoHTML(d);
    if (!reduced) gsap.fromTo(info, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" });
  }

  function settle() {
    let shift = 0;
    if (active >= 2 * N) shift = -N;
    else if (active < N) shift = N;
    if (!shift) return;
    active += shift;
    gsap.set(track, { x: centerX(active) });
    // move the enlarged (is-active) state onto the identical twin card instantly,
    // so the centred card stays scaled up after the seamless wrap (no glitch)
    all.forEach((el) => (el.style.transition = "none"));
    all.forEach((el, i) => el.classList.toggle("is-active", i === active));
    void track.offsetHeight; // force reflow so the no-transition swap applies
    all.forEach((el) => (el.style.transition = ""));
  }

  function startDwell() {
    if (reduced) return;
    if (dwell) dwell.kill();
    dwell = gsap.fromTo(fills[count], { scaleX: 0 }, {
      scaleX: 1, duration: 3.5, ease: "none", onComplete: () => advance(1),
    });
  }

  // step +1 = forward in time → cards travel left→right (new card enters from the left)
  function advance(step) {
    if (slideTween) slideTween.kill();
    active -= step;
    count = ((count + step) % N + N) % N;
    setActiveVisuals();
    if (!reduced) gsap.to(info, { opacity: 0, y: -8, duration: 0.22, ease: "power1.in" }); // hide while moving
    slideTween = gsap.to(track, {
      x: centerX(active), duration: 1.2, ease: "power3.inOut",
      onComplete: () => { settle(); showInfo(); }, // info appears once the photo reaches centre
    });
    startDwell();
  }

  // init
  gsap.set(track, { x: centerX(active) });
  setActiveVisuals();
  showInfo();
  startDwell();

  document.getElementById("wtgControls").addEventListener("click", (e) => {
    const b = e.target.closest("[data-dir]");
    if (!b) return;
    advance(b.dataset.dir === "next" ? 1 : -1);
  });
  all.forEach((el, i) => el.addEventListener("click", () => {
    if (i !== active) advance(active - i); // bring clicked card to center
  }));
  carousel.addEventListener("mouseenter", () => dwell && dwell.pause());
  carousel.addEventListener("mouseleave", () => dwell && dwell.resume());
  window.addEventListener("resize", () => gsap.set(track, { x: centerX(active) }));
}

/* ------------------------------------------------------------
   SPECIAL OFFERS — stacking cards
   Cards are position:sticky (they stack). As each next card rises
   to cover the current one, the covered card scales down + darkens.
------------------------------------------------------------ */
function initSpecialOffers() {
  // Cards stack via position:sticky at identical size & brightness.
  // The section title is pinned while cards 1–3 stack, then released so it
  // scrolls up together with the last (4th) card.
  const head = document.querySelector(".so__head");
  const cards = gsap.utils.toArray(".so-card");
  if (!head || cards.length < 2 || reduced) return;
  ScrollTrigger.create({
    trigger: head,
    start: "top 100px",
    endTrigger: cards[cards.length - 1],
    end: "top 240px",
    pin: head,
    pinSpacing: false,
  });
}

/* ------------------------------------------------------------
   SUMMER CHILL — early-bird countdown (Hours : Minutes : Seconds)
   Change the deadline in one place:
------------------------------------------------------------ */
// Fixed 32-hour early-bird window (starts at 32:08:27 and counts down)
const SUMMER_DEADLINE = Date.now() + (32 * 3600 + 8 * 60 + 27) * 1000;

function initSummerChill() {
  const root = document.getElementById("summerChill");
  if (!root) return;
  const nums = {
    h: root.querySelector('[data-u="h"]'),
    m: root.querySelector('[data-u="m"]'),
    s: root.querySelector('[data-u="s"]'),
  };

  // flip-clock style: new number drops/flips down from the top edge
  const flip = (el, val) => {
    const str = String(val).padStart(2, "0");
    if (el.textContent === str) return;
    el.textContent = str;
    if (!reduced) gsap.fromTo(el,
      { rotationX: -90, opacity: 0, transformOrigin: "50% 0%" },
      { rotationX: 0, opacity: 1, duration: 0.55, ease: "power4.out" }
    );
  };

  let timer = null;
  const tick = () => {
    const diff = SUMMER_DEADLINE - Date.now();
    if (diff <= 0) { root.classList.add("is-closed"); return; }
    const total = Math.floor(diff / 1000);
    flip(nums.h, Math.floor(total / 3600));
    flip(nums.m, Math.floor((total % 3600) / 60));
    flip(nums.s, total % 60);
    // re-align to the real second boundary so each flip lands on the actual tick
    timer = setTimeout(tick, 1000 - (Date.now() % 1000));
  };
  tick();

  // gentle reveal of the panel
  if (!reduced) {
    gsap.from(root.querySelector(".sc__panel"), {
      y: 60, opacity: 0, duration: 1, ease: "power3.out",
      scrollTrigger: { trigger: root, start: "top 75%" },
    });
  }
}

/* ------------------------------------------------------------
   AMBASSADOR'S FAMILY — scattered reveal + parallax + bg shift
------------------------------------------------------------ */
function initStory() {
  const root = document.getElementById("story");
  if (!root) return;
  initStoryCursor(root);
  if (reduced) return;

  const items = gsap.utils.toArray("#afScatter .af-fig, #afScatter .af-word");
  items.forEach((el) => {
    const speed = (parseFloat(el.dataset.speed) || 0) * 6; // stronger parallax
    // appear (opacity only — leaves transform free for parallax)
    gsap.fromTo(el, { opacity: 0 }, {
      opacity: 1, duration: 1.1, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 94%" },
    });
    // parallax drift (transform)
    gsap.fromTo(el, { y: -speed }, {
      y: speed, ease: "none",
      scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true },
    });
  });

  // background colour shift through the section
  gsap.fromTo(root, { backgroundColor: "#faf6f0" }, {
    backgroundColor: "#e7d8c2", ease: "none",
    scrollTrigger: { trigger: root, start: "top center", end: "bottom bottom", scrub: true },
  });
}

// custom "자세히 보기" cursor over the scattered photos
function initStoryCursor(root) {
  const cur = document.getElementById("afCursor");
  if (!cur || matchMedia("(hover: none)").matches) return;
  root.addEventListener("mousemove", (e) => {
    cur.style.left = e.clientX + "px";
    cur.style.top = e.clientY + "px";
    cur.classList.toggle("is-on", !!e.target.closest(".af-fig"));
  });
  root.addEventListener("mouseleave", () => cur.classList.remove("is-on"));
}

/* ------------------------------------------------------------
   LIVE MOMENTS — seamless left→right marquee (pause on hover)
------------------------------------------------------------ */
function initLiveMoments() {
  const track = document.getElementById("lmTrack");
  const marquee = document.getElementById("lmMarquee");
  if (!track) return;

  if (reduced) {
    marquee.style.overflowX = "auto";
    return;
  }
  // duplicate the set for a seamless loop
  track.innerHTML += track.innerHTML;
  const tween = gsap.fromTo(track, { xPercent: -50 }, { xPercent: 0, duration: 48, ease: "none", repeat: -1 });
  marquee.addEventListener("mouseenter", () => tween.pause());
  marquee.addEventListener("mouseleave", () => tween.resume());
}

/* ------------------------------------------------------------
   FOOTER — THE AMBASSADOR text-mask with a slow moving pan
------------------------------------------------------------ */
function initFooter() {
  const t = document.querySelector(".ft__maskimg");
  if (!t) return;
  if (!reduced) {
    gsap.to(t, { backgroundPosition: "100% 50%", duration: 16, ease: "sine.inOut", yoyo: true, repeat: -1 });
    gsap.from(t, {
      opacity: 0, y: 40, duration: 1.2, ease: "power3.out",
      scrollTrigger: { trigger: ".ft__mask", start: "top 90%" },
    });
  }
}

/* ------------------------------------------------------------
   HERO BOOKING — interactive selection UI
   Popovers are appended to <body> and position:fixed, so the hero's
   overflow:hidden never clips them and they sit above everything.
------------------------------------------------------------ */
function initBooking() {
  const booking = document.getElementById("booking");
  if (!booking) return;
  const fields = [...booking.querySelectorAll(".booking__field")];
  const valHotel = document.getElementById("bkHotel");
  const valDates = document.getElementById("bkDates");
  const valGuests = document.getElementById("bkGuests");

  const HOTELS = [
    "앰배서더 서울 풀만", "노보텔 앰배서더 서울 강남", "머큐어 앰배서더 서울 홍대",
    "이비스 스타일 앰배서더 서울 명동", "이비스 앰배서더 서울 명동", "이비스 스타일 앰배서더 서울 강남",
    "이비스 앰배서더 서울 인사동", "머큐어 앰배서더 서울 동대문", "페어몬트 앰배서더 서울",
    "호텔 나루 서울 엠갤러리 앰배서더", "소피텔 앰배서더 서울 호텔 & 서비스드 레지던스", "노보텔 앰배서더 수원",
    "노보텔 앰배서더 서울 동대문 호텔 & 레지던스", "이비스 스타일 앰배서더 인천 에어포트", "그랜드 머큐어 앰배서더 창원",
    "머큐어 앰배서더 울산", "풀만 앰배서더 서울 이스트폴", "몬드리안 서울 이태원",
    "노보텔 스위트 앰배서더 서울 용산", "노보텔 앰배서더 서울 용산", "머큐어 앰배서더 제주",
    "그랜드 머큐어 앰배서더 호텔 앤 레지던스 서울 용산", "그랜드 머큐어 임피리얼 팰리스 서울 강남",
    "이비스 스타일 앰배서더 서울 용산", "이비스 스타일 앰배서더 전주",
  ];
  // prefilled to match the logged-in default (친구와 2인, 1박)
  const state = { hotel: HOTELS[0], start: new Date(2026, 7, 25), end: new Date(2026, 7, 26), rooms: 1, adults: 2, children: 0, calMonth: new Date(2026, 7, 1) };

  const pop = document.createElement("div");
  pop.className = "bk-pop";
  document.body.appendChild(pop);
  // keep clicks inside the popover from bubbling to the document close-handler
  // (re-renders detach the clicked node, which would otherwise read as an outside click)
  pop.addEventListener("click", (e) => e.stopPropagation());
  let openField = null;
  const fieldByType = (t) => fields.find((f) => f.dataset.field === t);

  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (d) => `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
  const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  // reflect the prefilled stay in the field on load
  if (state.start && state.end) valDates.textContent = `${fmt(state.start)} ~ ${fmt(state.end)}`;

  function positionPop(field) {
    // pop is already display:block (.is-open) so offsetHeight is valid synchronously
    const r = field.getBoundingClientRect();
    const ph = pop.offsetHeight, pw = pop.offsetWidth;
    // open downward, but flip above the field if it would overflow the bottom
    let top = r.bottom + 10;
    if (top + ph > innerHeight - 16) top = r.top - ph - 10;
    top = Math.max(16, Math.min(top, innerHeight - ph - 16));
    let left = Math.max(16, Math.min(r.left, innerWidth - pw - 16));
    pop.style.top = top + "px";
    pop.style.left = left + "px";
  }
  function closePop() {
    pop.classList.remove("is-open");
    fields.forEach((f) => { f.classList.remove("is-open"); f.setAttribute("aria-expanded", "false"); });
    openField = null;
  }

  // --- HOTEL ---
  function paintHotel() {
    pop.innerHTML = `<div class="bk-list">${HOTELS.map((h) => `<button data-hotel="${h}" class="${h === state.hotel ? "is-sel" : ""}">${h}</button>`).join("")}</div>`;
    pop.querySelectorAll("[data-hotel]").forEach((b) => (b.onclick = () => {
      state.hotel = b.dataset.hotel; valHotel.textContent = state.hotel;
      openPop(fieldByType("dates")); // → auto-open date picker
    }));
  }

  // --- DATES (range calendar) ---
  function renderCal() {
    const y = state.calMonth.getFullYear(), mo = state.calMonth.getMonth();
    const startDow = new Date(y, mo, 1).getDay();
    const daysIn = new Date(y, mo + 1, 0).getDate();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dow = ["일", "월", "화", "수", "목", "금", "토"];
    let grid = `<div class="bk-cal__grid">${dow.map((d) => `<div class="bk-cal__dow">${d}</div>`).join("")}`;
    for (let i = 0; i < startDow; i++) grid += `<div class="bk-cal__day is-muted"></div>`;
    for (let d = 1; d <= daysIn; d++) {
      const date = new Date(y, mo, d);
      const past = date < today;
      let cls = "bk-cal__day";
      if (past) cls += " is-muted";
      if (state.start && state.end && date > state.start && date < state.end) cls += " is-range";
      if (sameDay(date, state.start) || sameDay(date, state.end)) cls += " is-end";
      grid += `<div class="${cls}" ${past ? "" : `data-day="${d}"`}>${d}</div>`;
    }
    grid += `</div>`;
    return `<div class="bk-cal"><div class="bk-cal__head"><button data-cal="prev">‹</button><span class="bk-cal__title">${y}.${pad(mo + 1)}</span><button data-cal="next">›</button></div>${grid}<p class="bk-cal__hint">체크인·체크아웃 날짜를 선택하세요</p></div>`;
  }
  function paintCal() {
    pop.innerHTML = renderCal();
    pop.querySelectorAll("[data-cal]").forEach((b) => (b.onclick = () => {
      state.calMonth = new Date(state.calMonth.getFullYear(), state.calMonth.getMonth() + (b.dataset.cal === "next" ? 1 : -1), 1);
      paintCal();
    }));
    pop.querySelectorAll("[data-day]").forEach((el) => (el.onclick = () => {
      const d = new Date(state.calMonth.getFullYear(), state.calMonth.getMonth(), +el.dataset.day);
      if (!state.start || (state.start && state.end)) { state.start = d; state.end = null; }
      else if (d > state.start) state.end = d;
      else state.start = d;
      paintCal();
      // first click sets start (stays open); once end is set → update + auto-open guests
      if (state.start && state.end) {
        valDates.textContent = `${fmt(state.start)} ~ ${fmt(state.end)}`;
        setTimeout(() => openPop(fieldByType("guests")), 320);
      }
    }));
  }

  // --- GUESTS (steppers) ---
  const LIMITS = { rooms: [1, 5], adults: [1, 8], children: [0, 6] };
  function renderGuests() {
    const row = (label, k) => `<div class="bk-row"><span class="bk-row__label">${label}</span><div class="bk-step"><button data-dec="${k}" ${state[k] <= LIMITS[k][0] ? "disabled" : ""}>−</button><span class="bk-step__val">${state[k]}</span><button data-inc="${k}" ${state[k] >= LIMITS[k][1] ? "disabled" : ""}>+</button></div></div>`;
    return `<div class="bk-guests">${row("객실", "rooms")}${row("성인", "adults")}${row("아동", "children")}<button class="bk-apply">적용</button></div>`;
  }
  function paintGuests() {
    pop.innerHTML = renderGuests();
    pop.querySelectorAll("[data-inc]").forEach((b) => (b.onclick = () => { const k = b.dataset.inc; if (state[k] < LIMITS[k][1]) state[k]++; paintGuests(); }));
    pop.querySelectorAll("[data-dec]").forEach((b) => (b.onclick = () => { const k = b.dataset.dec; if (state[k] > LIMITS[k][0]) state[k]--; paintGuests(); }));
    pop.querySelector(".bk-apply").onclick = () => {
      valGuests.textContent = `객실 ${state.rooms} / 성인 ${state.adults}` + (state.children ? ` / 아동 ${state.children}` : "");
      closePop();
    };
  }

  function openPop(field) {
    if (openField === field) { closePop(); return; }
    closePop();
    const type = field.dataset.field;
    if (type === "hotel") paintHotel();
    else if (type === "dates") paintCal();
    else if (type === "guests") paintGuests();
    pop.classList.add("is-open");
    field.classList.add("is-open"); field.setAttribute("aria-expanded", "true");
    openField = field;
    positionPop(field);
  }

  fields.forEach((f) => f.addEventListener("click", (e) => { e.stopPropagation(); openPop(f); }));
  document.addEventListener("click", (e) => { if (openField && !pop.contains(e.target) && !e.target.closest(".booking__field")) closePop(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePop(); });
  window.addEventListener("scroll", () => openField && closePop(), { passive: true });
  window.addEventListener("resize", () => openField && closePop());

  booking.querySelectorAll(".booking__tab").forEach((t) =>
    t.addEventListener("click", () => {
      booking.querySelectorAll(".booking__tab").forEach((x) => x.classList.remove("is-active"));
      t.classList.add("is-active");
    })
  );
  booking.querySelector(".booking__search").addEventListener("click", closePop);
}

/* ------------------------------------------------------------
   GNB language / currency dropdowns
------------------------------------------------------------ */
function initGnbDropdowns() {
  const dds = [...document.querySelectorAll(".gnb__dd")];
  if (!dds.length) return;
  const closeAll = () => dds.forEach((d) => d.classList.remove("is-open"));
  dds.forEach((dd) => {
    const btn = dd.querySelector(".gnb__dd-btn");
    const label = dd.querySelector(".gnb__dd-label");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = dd.classList.contains("is-open");
      closeAll();
      if (!open) dd.classList.add("is-open");
    });
    dd.querySelectorAll(".gnb__dd-menu button").forEach((b) =>
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        label.textContent = b.dataset.val;
        dd.querySelectorAll(".gnb__dd-menu button").forEach((x) => x.classList.remove("is-sel"));
        b.classList.add("is-sel");
        dd.classList.remove("is-open");
      })
    );
  });
  document.addEventListener("click", closeAll);
}

/* ------------------------------------------------------------
   QUICK MENU — recently-viewed room dock (right edge)
   First visit per session: reveal the card once, then tuck away.
------------------------------------------------------------ */
function initQuick() {
  const q = document.getElementById("quickMenu");
  if (!q) return;
  const KEY = "amb_quick_seen";
  const recentBtn = q.querySelector('[data-q="recent"]');

  // first visit this session → auto-reveal the card, then collapse
  if (!sessionStorage.getItem(KEY)) {
    setTimeout(() => q.classList.add("is-open"), 900);
    setTimeout(() => q.classList.remove("is-open"), 4200);
    sessionStorage.setItem(KEY, "1");
  }
  recentBtn && recentBtn.addEventListener("click", () => q.classList.toggle("is-open"));
  const card = q.querySelector("#quickCard");
  card && card.addEventListener("mouseenter", () => q.classList.add("is-open"));

  // hide the whole dock once we scroll past the hero
  const hero = document.getElementById("hero");
  if (hero) {
    ScrollTrigger.create({
      trigger: hero, start: "bottom 40%",
      onEnter: () => q.classList.add("is-hidden"),
      onLeaveBack: () => q.classList.remove("is-hidden"),
    });
  }
}

/* ------------------------------------------------------------
   HERO — scroll parallax (content + background move at different rates)
   Ref: aupalevodka.com top interaction
------------------------------------------------------------ */
function initHeroScroll() {
  if (reduced) return;
  const hero = document.getElementById("hero");
  const content = hero && hero.querySelector(".hero__content");
  const slides = document.getElementById("heroSlides");
  if (!hero || !content) return;
  const st = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
  // foreground (title / booking) rises faster and fades out
  gsap.to(content, { yPercent: -32, opacity: 0, ease: "none", scrollTrigger: st });
  // background slides drift slower + gently scale → depth
  if (slides) gsap.to(slides, { scale: 1.08, yPercent: -6, ease: "none", scrollTrigger: st });
}

/* ------------------------------------------------------------
   AMBASSADOR'S FAMILY — scroll-linked horizontal flow
------------------------------------------------------------ */
function initFamilyFlow() {
  const track = document.getElementById("famTrack");
  const section = document.getElementById("ambassadorFamily");
  if (!track || !section || reduced) return;
  // seamless continuous flow (independent of page scroll)
  track.innerHTML += track.innerHTML;
  const tween = gsap.fromTo(track, { xPercent: 0 }, { xPercent: -50, duration: 64, ease: "none", repeat: -1 });
  section.addEventListener("mouseenter", () => tween.pause());
  section.addEventListener("mouseleave", () => tween.resume());
}

/* ------------------------------------------------------------
   Boot
------------------------------------------------------------ */
window.addEventListener("DOMContentLoaded", () => {
  initSmooth();
  splitTitle();
  initHero();
  initBooking();
  initWhereToGo();
  initSpecialOffers();
  initSummerChill();
  initStory();
  initLiveMoments();
  initFooter();
  initGnb();
  initGnbDropdowns();
  initQuick();
  initHeroScroll();
  initFamilyFlow();
});
