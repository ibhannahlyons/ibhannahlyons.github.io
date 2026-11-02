// Shared behavior: mobile nav, slow fade-ins, countdown, gallery lightbox.
document.documentElement.classList.remove("no-js");

// ---- mobile nav ----
const nav = document.querySelector(".nav");
const toggle = document.querySelector(".nav-toggle");
if (nav && toggle) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
    toggle.textContent = open ? "Close" : "Menu";
  });
}

// ---- light / dark theme (dark is the default) ----
const themeToggle = document.querySelector(".theme-toggle");
function labelThemeToggle() {
  // a switch: "on" means light mode
  themeToggle.setAttribute("aria-checked", document.documentElement.dataset.theme === "light");
}
if (themeToggle) {
  labelThemeToggle();
  themeToggle.addEventListener("click", () => {
    const light = document.documentElement.dataset.theme !== "light";
    if (light) document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;
    try { localStorage.setItem("theme", light ? "light" : "dark"); } catch (e) {}
    labelThemeToggle();
  });
}

// ---- fade-ins ----
const revealer = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          revealer.unobserve(e.target);
        }
      }
    }, { rootMargin: "0px 0px -8% 0px" })
  : null;

function reveal(el) {
  if (revealer) revealer.observe(el);
  else el.classList.add("in");
}
document.querySelectorAll(".reveal").forEach(reveal);

// ---- countdown ----
// Days / hours / minutes / seconds until the ceremony, updated once a second.
const countdown = document.querySelector("[data-countdown]");
if (countdown) {
  const target = new Date(countdown.dataset.countdown);
  const cells = Object.fromEntries(
    [...countdown.querySelectorAll("[data-unit]")].map((el) => [el.dataset.unit, el])
  );
  const pad = (n) => String(n).padStart(2, "0");
  let timer;
  const tick = () => {
    const left = target - new Date();
    if (left <= 0) {
      clearInterval(timer);
      const sameDay = left > -12 * 3600000; // the rest of the wedding day
      countdown.innerHTML = `<p class="countdown-done">${sameDay ? "Today's the day!" : "Happily married"}</p>`;
      return;
    }
    const s = Math.floor(left / 1000);
    cells.days.textContent = Math.floor(s / 86400).toLocaleString();
    cells.hours.textContent = pad(Math.floor(s / 3600) % 24);
    cells.minutes.textContent = pad(Math.floor(s / 60) % 60);
    cells.seconds.textContent = pad(s % 60);
  };
  tick();
  timer = setInterval(tick, 1000);
}

// ---- family passphrase gate ----
// The hidden page is named cottages-<first 16 hex of sha256(passphrase)>.html,
// so the passphrase itself never appears anywhere on the site.
const gate = document.querySelector("[data-gate]");
if (gate) {
  const gateToggle = document.querySelector(".gate-toggle");
  gateToggle.addEventListener("click", () => {
    gate.hidden = !gate.hidden;
    gateToggle.setAttribute("aria-expanded", !gate.hidden);
    if (!gate.hidden) gate.querySelector("input").focus();
  });
  gate.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = gate.querySelector(".gate-msg");
    const word = gate.querySelector("input").value.trim().toLowerCase().replace(/\s+/g, " ");
    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(word));
    const hash = [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
    const page = `cottages-${hash}.html`;
    const res = await fetch(page, { method: "HEAD", cache: "no-store" }).catch(() => null);
    if (res && res.ok) location.href = page;
    else msg.textContent = "That's not quite it. Check the message we sent you.";
  });
}

// ---- click animation: a ripple on anything tappable ----
const quiet = window.matchMedia("(prefers-reduced-motion: reduce)");
const tappable = ".btn, .nav-toggle, .theme-toggle, .gate-toggle, .link-cards a.card, .gallery button";
document.addEventListener("pointerdown", (e) => {
  if (quiet.matches) return;
  const el = e.target.closest(tappable);
  if (!el) return;
  const box = el.getBoundingClientRect();
  const size = Math.max(box.width, box.height) * 2.2;
  const r = document.createElement("span");
  r.className = "ripple";
  r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - box.left}px;top:${e.clientY - box.top}px`;
  el.appendChild(r);
  r.addEventListener("animationend", () => r.remove());
});

// ---- shared clover drawing ----
// Drawn inline: a <use> pointing at the sprite file doesn't render when added by script.
const CLOVER_TINTS = ["var(--rose)", "var(--moonstone)", "var(--pearl)", "var(--mauve)"];
const CLOVER_LEAF = "M20 18 C 16.5 14.5, 13 10.5, 15.6 7.6 C 17.4 5.6, 19.6 6.6, 20 8.6 C 20.4 6.6, 22.6 5.6, 24.4 7.6 C 27 10.5, 23.5 14.5, 20 18 Z";
function cloverSvg(stroke = 2.4) {
  return '<svg viewBox="0 0 40 40" aria-hidden="true">' +
    `<g fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">` +
    '<g transform="translate(0 -2) rotate(20 20 18)">' +
    [0, 90, 180, 270].map((r) => `<path d="${CLOVER_LEAF}" transform="rotate(${r} 20 18)"/>`).join("") +
    "</g>" +
    '<path d="M21.5 18.5 C 23 23, 26.5 25, 25 29.5 C 24 32.5, 20.5 32.5, 21 30"/></g></svg>';
}
function makeClover(className, stroke) {
  const holder = document.createElement("span");
  holder.innerHTML = cloverSvg(stroke);
  const svg = holder.firstElementChild;
  svg.setAttribute("class", className);
  return svg;
}
const prefersCalm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// a burst of clovers flying out in a circle from (x, y)
function burstClovers(x, y, count = 18) {
  for (let i = 0; i < count; i++) {
    const c = makeClover("clover-burst");
    // spread evenly around a circle, with a little wobble
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const dist = 90 + Math.random() * 90;
    c.style.left = `${x}px`;
    c.style.top = `${y}px`;
    c.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    c.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
    c.style.setProperty("--spin", `${(Math.random() - 0.5) * 540}deg`);
    c.style.setProperty("--size", `${1.8 + Math.random() * 1.2}rem`);
    c.style.setProperty("--tint", CLOVER_TINTS[i % CLOVER_TINTS.length]);
    document.body.appendChild(c);
    c.addEventListener("animationend", () => c.remove());
    setTimeout(() => c.remove(), 2000); // backup if animationend never fires (e.g. background tab)
  }
}

// ---- d20 Easter egg (registry): it always rolls an 18, the wedding date ----
let d20Toast, d20Timer;
function sayD20() {
  if (!d20Toast) {
    d20Toast = document.createElement("div");
    d20Toast.className = "lucky-toast d20-toast";
    d20Toast.setAttribute("role", "status");
    document.body.appendChild(d20Toast);
  }
  d20Toast.innerHTML = `~ Natural 18 ${cloverSvg()} See you March 18! ~`;
  requestAnimationFrame(() => d20Toast.classList.add("show"));
  clearTimeout(d20Timer);
  d20Timer = setTimeout(() => d20Toast.classList.remove("show"), 3600);
}
document.addEventListener("click", (e) => {
  const die = e.target.closest(".d20");
  if (!die || die.classList.contains("rolling")) return;
  die.classList.add("rolling");
  const spinner = die.querySelector(".d20-die");
  const num = die.querySelector(".d20-num");
  const land = () => {
    num.textContent = "18";
    die.classList.remove("rolling");
    sayD20();
    if (!prefersCalm()) {
      const box = spinner.getBoundingClientRect();
      burstClovers(box.left + box.width / 2, box.top + box.height / 2, 10);
    }
  };
  if (prefersCalm()) return land();
  const turns = (Number(die.dataset.turns) || 0) + 2;
  die.dataset.turns = turns;
  spinner.style.transform = `rotate(${turns * 360}deg)`;
  let ticks = 0;
  const flicker = setInterval(() => {
    num.textContent = 1 + Math.floor(Math.random() * 20);
    if (++ticks >= 14) { clearInterval(flicker); land(); }
  }, 65);
});

// a gentle rain of clovers drifting down the whole screen
function cloverRain(count = 30) {
  for (let i = 0; i < count; i++) {
    const drop = document.createElement("span");
    drop.className = "rain-drop";
    drop.appendChild(makeClover("rain-clover", 2.2));
    const dur = 4.2 + Math.random() * 2.8;
    const delay = Math.random() * 2.4;
    drop.style.setProperty("--x", `${Math.random() * 100}vw`);
    drop.style.setProperty("--size", `${0.9 + Math.random() * 1.1}rem`);
    drop.style.setProperty("--dur", `${dur.toFixed(2)}s`);
    drop.style.setProperty("--delay", `${delay.toFixed(2)}s`);
    drop.style.setProperty("--sway-dur", `${(1.2 + Math.random() * 1.2).toFixed(2)}s`);
    drop.style.setProperty("--tint", CLOVER_TINTS[i % CLOVER_TINTS.length]);
    document.body.appendChild(drop);
    setTimeout(() => drop.remove(), (dur + delay) * 1000 + 600);
  }
}

// ---- a secret: tap "L & H" three times quickly for clover rain ----
// One tap still goes home (after a short pause to listen for more taps).
document.querySelectorAll(".nav-brand").forEach((brand) => {
  let taps = 0, timer;
  brand.addEventListener("click", (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    taps++;
    clearTimeout(timer);
    if (taps >= 3) {
      taps = 0;
      cloverRain();
      return;
    }
    timer = setTimeout(() => {
      if (taps > 0 && taps < 3) window.location.href = brand.href;
      taps = 0;
    }, 420);
  });
});

// ---- a few clovers drifting slowly across the home photo ----
const hero = document.querySelector(".hero");
if (hero && !prefersCalm()) {
  const field = document.createElement("div");
  field.className = "hero-drift";
  field.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 6; i++) {
    const d = document.createElement("span");
    d.className = "drifter";
    d.appendChild(makeClover("drift-clover", 2));
    const dur = 26 + Math.random() * 14;
    d.style.setProperty("--top", `${8 + Math.random() * 78}%`);
    d.style.setProperty("--size", `${0.9 + Math.random() * 0.8}rem`);
    d.style.setProperty("--dur", `${dur.toFixed(1)}s`);
    d.style.setProperty("--delay", `${(-Math.random() * dur).toFixed(1)}s`); // start mid-journey
    d.style.setProperty("--bob", `${(4 + Math.random() * 3).toFixed(1)}s`);
    d.style.setProperty("--tint", CLOVER_TINTS[i % 3]);
    d.style.setProperty("--alpha", (0.35 + Math.random() * 0.25).toFixed(2));
    field.appendChild(d);
  }
  hero.insertBefore(field, hero.querySelector(".hero-inner"));
}

// ---- fairy lights strung down both edges: they switch on from the top as you scroll ----
(function () {
  const COUNT = 30;
  const TINTS = ["", "", "rose", "", "lilac", "", "rose", ""];
  const bulbs = [];
  ["left", "right"].forEach((side) => {
    const strand = document.createElement("div");
    strand.className = `fairy-lights ${side}`;
    strand.setAttribute("aria-hidden", "true");
    const pts = [];
    for (let i = 0; i < COUNT; i++) pts.push([i % 2 ? 70 : 30, ((i + 0.5) / COUNT) * 100]);
    // the wire swags from bulb to bulb
    let d = `M${pts[0][0]} 0`;
    let prev = [pts[0][0], 0];
    for (const p of [...pts, [pts[COUNT - 1][0], 100]]) {
      const midY = (prev[1] + p[1]) / 2;
      d += ` C${prev[0]} ${midY} ${p[0]} ${midY} ${p[0]} ${p[1]}`;
      prev = p;
    }
    strand.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${d}"/></svg>`;
    pts.forEach(([x, y], i) => {
      const b = document.createElement("span");
      b.className = `bulb ${TINTS[(i + (side === "right" ? 3 : 0)) % TINTS.length]}`.trim();
      b.style.left = `${x}%`;
      b.style.top = `${y}%`;
      b.style.setProperty("--tw", `${1.1 + Math.random() * 1.8}s`);
      b.style.setProperty("--td", `${-Math.random() * 3}s`);
      // every few bulbs throws off a little star-shaped glint now and then
      if (Math.random() < 0.35) {
        b.classList.add("spark");
        b.style.setProperty("--sd", `${3 + Math.random() * 4}s`);
        b.style.setProperty("--sdl", `${-Math.random() * 7}s`);
      }
      b.dataset.at = y / 100;
      strand.appendChild(b);
      bulbs.push(b);
    });
    document.body.appendChild(strand);
  });
  let ticking = false;
  const light = () => {
    const room = document.documentElement.scrollHeight - window.innerHeight;
    const p = room > 40 ? Math.min(1, Math.max(0, window.scrollY / room)) : 1;
    const reach = 0.12 + p * 0.88; // a few are always on at the top
    bulbs.forEach((b) => b.classList.toggle("on", b.dataset.at <= reach));
    ticking = false;
  };
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(light); } };
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  window.addEventListener("load", request);
  light();
})();

// ---- a cluster of candles above the footer: they light as you scroll to them, and go out when you leave ----
(function () {
  const footer = document.querySelector(".site-footer");
  if (!footer) return;
  const heights = [30, 48, 24, 62, 38, 70, 34, 54, 26, 44, 22];
  // light them in a loose, hand-lit order rather than left to right
  const order = heights.map((_, i) => i).sort(() => Math.random() - 0.5);
  const row = document.createElement("div");
  row.className = "candle-row";
  row.setAttribute("aria-hidden", "true");
  row.innerHTML = heights.map((h, i) =>
    `<span class="candle" style="--h:${h}px;--o:${order.indexOf(i)}">` +
    '<span class="candle-glow"></span><span class="flame"></span><span class="smoke"></span></span>').join("");
  footer.before(row);
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      row.classList.remove("out");
      row.classList.add("lit");
    } else if (row.classList.contains("lit")) {
      row.classList.remove("lit");
      row.classList.add("out"); // a little curl of smoke as each one goes out
    }
  }, { threshold: 0.6 }).observe(row);
})();

// ---- lucky clover hunt: one hidden clover on each page ----
(function () {
  const heading = (text) => [...document.querySelectorAll("h2")].find((h) => h.textContent.trim() === text);
  // page -> where its clover hides ("inline" sits after a heading; corners sit inside a section)
  const SPOTS = {
    home:     { el: () => document.querySelector(".hero"), place: "corner-br" },
    story:    { el: () => heading("Through the years"), place: "inline" },
    party:    { el: () => heading("Team Liam"), place: "inline" },
    details:  { el: () => document.getElementById("schedule"), place: "corner-bl" },
    travel:   { el: () => document.getElementById("things-to-do"), place: "corner-tr" },
    registry: { el: () => document.querySelector(".fine-print h3"), place: "inline" },
  };
  const TOTAL = Object.keys(SPOTS).length;
  const file = location.pathname.split("/").pop().replace(".html", "") || "index";
  const page = file === "index" ? "home" : file;
  const spot = SPOTS[page];
  const target = spot && spot.el();
  if (!target) return;

  const load = () => { try { return JSON.parse(localStorage.getItem("lucky-clovers")) || []; } catch (e) { return []; } };
  const save = (list) => { try { localStorage.setItem("lucky-clovers", JSON.stringify(list)); } catch (e) {} };
  let found = load().filter((p) => p in SPOTS);

  const toast = document.createElement("div");
  toast.className = "lucky-toast";
  toast.setAttribute("role", "status");
  document.body.appendChild(toast);
  let toastTimer;
  const say = (msg) => {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3600);
  };

  const hint = document.createElement("p");
  hint.className = "lucky-hint";
  const footer = document.querySelector(".site-footer");
  const updateHint = () => {
    if (found.length >= TOTAL) {
      hint.textContent = `You found all ${TOTAL} lucky clovers. Lucky you! `;
      const again = document.createElement("button");
      again.type = "button";
      again.className = "lucky-reset";
      again.textContent = "Play again?";
      again.addEventListener("click", () => {
        found = [];
        save(found);
        btn.classList.remove("found", "just-found");
        updateHint();
        say("The clovers are hidden again. Happy hunting! 🍀");
      });
      hint.appendChild(again);
    } else {
      hint.textContent = `psst… a lucky clover is hidden on every page (${found.length} of ${TOTAL} found)`;
    }
  };

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `lucky lucky-${spot.place}`;
  btn.setAttribute("aria-label", "A lucky clover");
  btn.appendChild(makeClover("lucky-svg", 2.4));
  if (found.includes(page)) btn.classList.add("found");
  if (spot.place !== "inline" && getComputedStyle(target).position === "static") target.style.position = "relative";
  target.appendChild(btn);
  if (footer) { updateHint(); footer.appendChild(hint); }

  btn.addEventListener("click", () => {
    const box = btn.getBoundingClientRect();
    if (found.includes(page)) {
      say(`You already found this one! (${found.length} of ${TOTAL})`);
      return;
    }
    found = [...found, page];
    save(found);
    btn.classList.add("found", "just-found");
    if (!prefersCalm()) burstClovers(box.left + box.width / 2, box.top + box.height / 2, 8);
    updateHint();
    if (found.length >= TOTAL) {
      say(`You found all ${TOTAL} lucky clovers! Lucky you 🍀`);
      cloverRain(40);
    } else {
      say(`🍀 Lucky clover found! ${found.length} of ${TOTAL}`);
    }
  });
})();

// ---- "Add to calendar" menus ----
document.querySelectorAll("[data-cal-menu]").forEach((menu) => {
  const toggle = menu.querySelector(".cal-toggle");
  const options = menu.querySelector(".cal-options");
  const setOpen = (open) => {
    options.hidden = !open;
    toggle.setAttribute("aria-expanded", open);
  };
  toggle.addEventListener("click", () => setOpen(options.hidden));
  options.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("click", (e) => { if (!menu.contains(e.target)) setOpen(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !options.hidden) { setOpen(false); toggle.focus(); }
  });
});

// ---- a secret: tap "4:20" for a little cartoon curl of smoke ----
// Two versions of the same smoke line, with the curves on opposite sides; the line
// slowly morphs back and forth between them so it ripples side to side as it rises.
const SMOKE_A = "M32 128 C 16 116, 48 104, 32 92 S 14 70, 32 58 S 52 38, 34 26 C 25 19, 29 10, 37 11 C 44 12, 43 20, 36 20";
const SMOKE_B = "M32 128 C 48 116, 16 104, 32 92 S 50 70, 32 58 S 12 38, 30 26 C 21 19, 25 10, 33 11 C 40 12, 39 20, 32 20";
const SMOKE_SVG =
  '<svg viewBox="0 0 64 128" aria-hidden="true">' +
  `<path class="line" pathLength="100" d="${SMOKE_A}">` +
  // the ripple is skipped for visitors who prefer reduced motion
  (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "" :
    `<animate attributeName="d" dur="2.6s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1"` +
    ` keySplines=".45 0 .55 1;.45 0 .55 1" values="${SMOKE_A};${SMOKE_B};${SMOKE_A}"/>`) +
  "</path>" +
  '<circle class="ring one" cx="37" cy="6" r="3.4"/>' +
  '<circle class="ring two" cx="26" cy="-4" r="2.6"/>' +
  "</svg>";
document.querySelectorAll("[data-puff]").forEach((spot) => {
  spot.addEventListener("click", () => {
    const box = spot.getBoundingClientRect();
    const trail = document.createElement("span");
    trail.className = "smoke-trail";
    trail.innerHTML = SMOKE_SVG;
    trail.style.left = `${box.left + box.width / 2}px`;
    trail.style.top = `${box.top + 2}px`;
    trail.style.color = getComputedStyle(spot).color; // drawn in the text's own color
    document.body.appendChild(trail);
    trail.addEventListener("animationend", (e) => { if (e.target === trail) trail.remove(); });
    setTimeout(() => trail.remove(), 6000); // backup if animationend never fires
  });
});

// ---- galleries + lightbox ----
// Each [data-gallery="name"] loads data/name.json and photos from img/name/.
// A gallery with no photos shows its [data-empty] message instead.
document.querySelectorAll("[data-gallery]").forEach((root) => {
  const name = root.dataset.gallery;
  fetch(`data/${name}.json`, { cache: "no-store" })
    .then((r) => r.json())
    .then((photos) => {
      if (photos.length) buildGallery(root, photos, name);
      else root.parentElement.querySelector("[data-empty]")?.removeAttribute("hidden");
    });
});

// "Caption" plus a small "March 2026 · Park City, UT" line, built as text nodes.
function captionEl(p, tag) {
  const el = document.createElement(tag);
  el.className = "g-cap";
  if (p.caption) {
    const c = document.createElement("span");
    c.className = "g-cap-text";
    c.textContent = p.caption;
    el.appendChild(c);
  }
  const meta = [p.date, p.place].filter(Boolean).join(" · ");
  if (meta) {
    const m = document.createElement("span");
    m.className = "g-cap-meta";
    m.textContent = meta;
    el.appendChild(m);
  }
  return el;
}

function buildGallery(root, photos, name) {
  const label = root.dataset.label || "Liam and Hannah";
  photos.forEach((p, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("aria-label", `Open photo ${i + 1} of ${photos.length}`);
    btn.innerHTML = `<img src="img/${name}/thumbs/${p.file}" width="${p.w}" height="${p.h}" loading="lazy" decoding="async" alt="${label}, photo ${i + 1}">`;
    if (p.caption || p.date) {
      btn.classList.add("captioned");
      btn.appendChild(captionEl(p, "span"));
    }
    btn.addEventListener("click", () => openLightbox(i));
    root.appendChild(btn);
  });

  const lb = document.createElement("div");
  lb.className = "lightbox";
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-modal", "true");
  lb.setAttribute("aria-label", "Photo viewer");
  lb.innerHTML = `
    <img alt="">
    <button class="lb-close" aria-label="Close">&times;</button>
    <button class="lb-prev" aria-label="Previous photo">&lsaquo;</button>
    <button class="lb-next" aria-label="Next photo">&rsaquo;</button>
    <div class="lb-foot"><div class="lb-caption"></div><div class="lb-count"></div></div>`;
  document.body.appendChild(lb);

  const img = lb.querySelector("img");
  const count = lb.querySelector(".lb-count");
  const caption = lb.querySelector(".lb-caption");
  let current = 0;
  let lastFocus = null;

  function show(i) {
    current = (i + photos.length) % photos.length;
    img.src = `img/${name}/${photos[current].file}`;
    img.alt = `${label}, photo ${current + 1}`;
    count.textContent = `${current + 1} / ${photos.length}`;
    caption.replaceChildren(captionEl(photos[current], "div"));
    // warm the cache for the next photo
    new Image().src = `img/${name}/${photos[(current + 1) % photos.length].file}`;
  }
  function openLightbox(i) {
    lastFocus = document.activeElement;
    show(i);
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
    lb.querySelector(".lb-close").focus();
  }
  function close() {
    lb.classList.remove("open");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  lb.querySelector(".lb-close").addEventListener("click", close);
  lb.querySelector(".lb-prev").addEventListener("click", () => show(current - 1));
  lb.querySelector(".lb-next").addEventListener("click", () => show(current + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });

  let startX = null;
  lb.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) show(current + (dx < 0 ? 1 : -1));
    startX = null;
  });
}
