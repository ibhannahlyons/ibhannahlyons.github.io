// Honeymoon fund: builds contribution cards from data/experiences.json.
const VENMO_USER = "Hannah-Lyons-12";

function venmoLink(amount, note) {
  // Build by hand: URLSearchParams would turn spaces into "+", which Venmo shows literally.
  let url = `https://venmo.com/?txn=pay&recipients=${encodeURIComponent(VENMO_USER)}`;
  if (amount) url += `&amount=${amount}`;
  url += `&note=${encodeURIComponent(note)}&audience=private`;
  return url;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function dollars(n) {
  return "$" + Number(n).toLocaleString();
}

async function loadJson(path, fallback) {
  try {
    const r = await fetch(path, { cache: "no-store" });
    return r.ok ? await r.json() : fallback;
  } catch {
    return fallback;
  }
}

async function buildFund() {
  const root = document.querySelector("[data-fund]");
  if (!root) return;
  const experiences = await loadJson("data/experiences.json", []);
  experiences.sort((a, b) => a.amount - b.amount);

  for (const x of experiences) {
    const card = document.createElement("article");
    card.className = "card fund-card reveal";
    card.innerHTML = `
      <img src="${escapeHtml(x.photo)}" alt="" loading="lazy">
      <div class="card-body">
        <h3>${escapeHtml(x.title)}</h3>
        <p>${escapeHtml(x.description)}</p>
        <div class="amount">${dollars(x.amount)}</div>
        <a class="btn" href="${venmoLink(x.amount, x.title)}" target="_blank" rel="noopener">Contribute</a>
      </div>`;
    root.appendChild(card);
  }

  const any = document.createElement("article");
  any.className = "card any-amount reveal";
  any.innerHTML = `
    <div class="card-body">
      <svg class="flourish" viewBox="0 0 200 40" aria-hidden="true"><use href="img/botanical.svg#sprig"></use></svg>
      <h3>Contribute any amount</h3>
      <p>Don't see the perfect fit? Give whatever feels right, and we'll put it toward the whole adventure.</p>
      <a class="btn" href="${venmoLink(null, "Honeymoon fund")}" target="_blank" rel="noopener">Contribute</a>
    </div>`;
  root.appendChild(any);

  root.querySelectorAll(".reveal").forEach((el) => {
    if (typeof reveal === "function") reveal(el);
    else el.classList.add("in");
  });
}

buildFund();
