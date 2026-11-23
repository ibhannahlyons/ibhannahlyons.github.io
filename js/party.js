// Wedding party: polaroids that zigzag down the page, built from data/party.json.

function escapeText(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function memberHtml(p, i) {
  const name = escapeText(p.name);
  const lead = /(maid|matron) of honor|best man/i.test(p.role || "");
  // "flipPhoto" is the secret second photo: a tap turns the polaroid over to show it
  const photo = p.photo && p.flipPhoto
    ? `<div class="flip-inner">
         <img class="flip-front" src="${escapeText(p.photo)}" alt="${name}" loading="lazy">
         <img class="flip-back" src="${escapeText(p.flipPhoto)}" alt="" aria-hidden="true" loading="lazy">
       </div>`
    : p.photo
    ? `<img src="${escapeText(p.photo)}" alt="${name}" loading="lazy">`
    : `<span class="party-placeholder" aria-hidden="true">
         <svg viewBox="0 0 40 40"><use href="img/botanical.svg?v=20261102k#clover"></use></svg>
         <span>Photo coming soon</span>
       </span>`;
  // a slightly different tilt for every polaroid
  const tilt = ((i % 2 ? 1 : -1) * (2 + ((i * 7) % 3))).toFixed(1);
  return `
    <li class="party-member reveal" style="--tilt:${tilt}deg">
      <figure class="polaroid${p.photo && p.flipPhoto ? " can-flip" : ""}">
        <div class="polaroid-photo">${photo}</div>
        <figcaption class="polaroid-name" aria-hidden="true">${name}</figcaption>
      </figure>
      <span class="party-node" aria-hidden="true"><svg viewBox="0 0 40 40"><use href="img/botanical.svg?v=20261102k#clover"></use></svg></span>
      <div class="party-text">
        <span class="party-role${lead ? " lead" : ""}">${escapeText(p.role)}</span>
        <h3>${name}</h3>
        <p>${escapeText(p.relation)}</p>
      </div>
    </li>`;
}

async function buildParty() {
  let party = {};
  try {
    const r = await fetch("data/party.json", { cache: "no-store" });
    if (r.ok) party = await r.json();
  } catch {}
  document.querySelectorAll("[data-party]").forEach((list) => {
    const people = party[list.dataset.party] || [];
    list.innerHTML = people.map(memberHtml).join("");
    list.querySelectorAll(".reveal").forEach((el) => {
      if (typeof reveal === "function") reveal(el);
      else el.classList.add("in");
    });
  });
  // a tap gives a polaroid a happy little wiggle, or flips it over if it has a secret photo
  document.querySelectorAll(".polaroid").forEach((card) => {
    card.addEventListener("click", () => {
      if (card.classList.contains("can-flip")) {
        card.classList.toggle("flipped");
        return;
      }
      card.classList.remove("wiggle");
      void card.offsetWidth; // restart the animation
      card.classList.add("wiggle");
    });
  });
}

buildParty();
