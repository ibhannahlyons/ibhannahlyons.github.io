// Honeymoon fund: builds contribution cards from data/experiences.json,
// with optional progress from data/funds.json (edited by hand).
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
  const [experiences, funds] = await Promise.all([
    loadJson("data/experiences.json", []),
    loadJson("data/funds.json", {}),
  ]);

  for (const x of experiences) {
    const raised = funds[x.id];
    const card = document.createElement("article");
    card.className = "card fund-card reveal";
    let progress = "";
    if (x.goal && raised !== undefined) {
      const pct = Math.min(100, Math.round((raised / x.goal) * 100));
      progress = `
        <div class="progress">
          <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="${x.goal}" aria-valuenow="${raised}" aria-label="${escapeHtml(x.title)} funding">
            <div class="progress-fill" data-pct="${pct}"></div>
          </div>
          <div class="progress-label">${raised >= x.goal ? "Fully funded — thank you!" : `${dollars(raised)} of ${dollars(x.goal)} funded`}</div>
        </div>`;
    }
    card.innerHTML = `
      <img src="${escapeHtml(x.photo)}" alt="" loading="lazy">
      <div class="card-body">
        <h3>${escapeHtml(x.title)}</h3>
        <p>${escapeHtml(x.description)}</p>
        <div class="amount">${dollars(x.amount)}</div>
        ${progress}
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
      <p>Every little bit becomes part of the adventure.</p>
      <a class="btn" href="${venmoLink(null, "Honeymoon fund")}" target="_blank" rel="noopener">Contribute</a>
    </div>`;
  root.appendChild(any);

  root.querySelectorAll(".reveal").forEach((el) => {
    if (typeof reveal === "function") reveal(el);
    else el.classList.add("in");
  });
  // let the bars grow in once they're on screen
  requestAnimationFrame(() => {
    root.querySelectorAll(".progress-fill").forEach((f) => { f.style.width = f.dataset.pct + "%"; });
  });
}

buildFund();
