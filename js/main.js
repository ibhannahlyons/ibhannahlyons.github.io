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
  const light = document.documentElement.dataset.theme === "light";
  themeToggle.textContent = light ? "Dark" : "Light";
  themeToggle.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
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
const countdown = document.querySelector("[data-countdown]");
if (countdown) {
  const target = new Date(countdown.dataset.countdown);
  const days = Math.ceil((target - new Date()) / 86400000);
  if (days > 1) countdown.textContent = `${days.toLocaleString()} days to go`;
  else if (days === 1) countdown.textContent = "Tomorrow!";
  else if (days === 0) countdown.textContent = "Today's the day";
  else countdown.textContent = "Happily married";
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

// ---- click animations: a ripple on anything tappable, clovers from buttons ----
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
document.addEventListener("click", (e) => {
  if (quiet.matches) return;
  const btn = e.target.closest(".btn");
  if (!btn) return;
  for (let i = 0; i < 7; i++) {
    const c = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    c.setAttribute("viewBox", "0 0 40 40");
    c.setAttribute("class", "clover-pop");
    c.innerHTML = '<use href="img/botanical.svg#clover"></use>';
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
    const dist = 50 + Math.random() * 60;
    c.style.left = e.clientX + "px";
    c.style.top = e.clientY + "px";
    c.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    c.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
    c.style.setProperty("--spin", `${(Math.random() - 0.5) * 220}deg`);
    c.style.animationDelay = `${i * 25}ms`;
    document.body.appendChild(c);
    c.addEventListener("animationend", () => c.remove());
  }
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
