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

// ---- "Click me!": 18 clovers burst out, one for each day up to the 18th ----
const burstButton = document.querySelector("[data-clover-burst]");
if (burstButton) {
  const tints = ["var(--lilac)", "var(--rose)", "var(--parchment)", "var(--sage)"];
  // drawn inline: <use> pointing at the sprite file doesn't render when added by script
  const leaf = "M20 18 C 16.5 14.5, 13 10.5, 15.6 7.6 C 17.4 5.6, 19.6 6.6, 20 8.6 C 20.4 6.6, 22.6 5.6, 24.4 7.6 C 27 10.5, 23.5 14.5, 20 18 Z";
  const clover =
    '<g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
    '<g transform="translate(0 -2) rotate(20 20 18)">' +
    [0, 90, 180, 270].map((r) => `<path d="${leaf}" transform="rotate(${r} 20 18)"/>`).join("") +
    "</g>" +
    '<path d="M21.5 18.5 C 23 23, 26.5 25, 25 29.5 C 24 32.5, 20.5 32.5, 21 30"/></g>';
  burstButton.addEventListener("click", () => {
    const box = burstButton.getBoundingClientRect();
    const x = box.left + box.width / 2, y = box.top + box.height / 2;
    const count = 18;
    for (let i = 0; i < count; i++) {
      const c = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      c.setAttribute("viewBox", "0 0 40 40");
      c.setAttribute("class", "clover-burst");
      c.innerHTML = clover;
      // spread evenly around a circle, with a little wobble
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const dist = 90 + Math.random() * 90;
      c.style.left = `${x}px`;
      c.style.top = `${y}px`;
      c.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      c.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
      c.style.setProperty("--spin", `${(Math.random() - 0.5) * 540}deg`);
      c.style.setProperty("--size", `${1.8 + Math.random() * 1.2}rem`);
      c.style.setProperty("--tint", tints[i % tints.length]);
      document.body.appendChild(c);
      c.addEventListener("animationend", () => c.remove());
      setTimeout(() => c.remove(), 2000); // backup if animationend never fires (e.g. background tab)
    }
  });
}

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
const SMOKE_SVG =
  '<svg viewBox="0 0 44 128" aria-hidden="true">' +
  // one thin line rising in lazy S-curves, finishing in a little curl
  '<path class="line" pathLength="100" d="M22 128 C 12 116, 32 104, 22 92 S 10 70, 22 58 S 35 38, 24 26 C 18 19, 21 11, 27 12 C 32 13, 31 20, 26 20"/>' +
  '<circle class="ring one" cx="28" cy="6" r="3.4"/>' +
  '<circle class="ring two" cx="19" cy="-4" r="2.6"/>' +
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
