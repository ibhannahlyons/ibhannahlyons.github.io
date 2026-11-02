// Honeymoon fund: a "Contribute any amount" card, plus (when the grid has
// data-show-ideas) experience cards from data/experiences.json.
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
  const showIdeas = root.hasAttribute("data-show-ideas");
  const experiences = showIdeas ? await loadJson("data/experiences.json", []) : [];
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
      <button class="d20" type="button" aria-label="Roll the die"><svg class="flourish" viewBox="0 0 200 40" aria-hidden="true"><path class="d20-rules" d="M4 20H82M118 20H196"></path><g class="d20-die"><use href="img/botanical.svg?v=20261102h#d20"></use><text class="d20-num" x="100" y="23.5" text-anchor="middle">20</text></g></svg></button>
      <h3>Contribute any amount</h3>
      <p>${showIdeas
        ? "Don't see the perfect fit? Give whatever feels right, and we'll put it toward the whole adventure."
        : "Give whatever feels right. Every bit goes toward our honeymoon adventure, wherever it takes us."}</p>
      <a class="btn" href="${venmoLink(null, "Honeymoon fund")}" target="_blank" rel="noopener">Contribute</a>
    </div>`;
  root.appendChild(any);

  root.querySelectorAll(".reveal").forEach((el) => {
    if (typeof reveal === "function") reveal(el);
    else el.classList.add("in");
  });
}

buildFund();
