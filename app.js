(function () {
  "use strict";

  const STORAGE_KEY = "halcyon-cove-plan";

  const els = {
    list: document.getElementById("place-list"),
    empty: document.getElementById("empty"),
    count: document.getElementById("count"),
    search: document.getElementById("search"),
    sort: document.getElementById("sort"),
    chips: document.getElementById("chips"),
    planList: document.getElementById("plan-list"),
    planTotal: document.getElementById("plan-total"),
    clear: document.getElementById("clear-plan"),
    year: document.getElementById("year")
  };

  const categories = ["All", ...new Set(PLACES.map(p => p.category))];

  const state = {
    query: "",
    category: "All",
    sort: "name",
    plan: loadPlan(),   // ids of places added to the day plan
    open: new Set()     // ids of places with tips expanded
  };

  /* ---------- storage (falls back quietly if unavailable) ---------- */

  function loadPlan() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const valid = Array.isArray(saved) ? saved.filter(id => PLACES.some(p => p.id === id)) : [];
      return new Set(valid);
    } catch (err) {
      return new Set();
    }
  }

  function savePlan() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.plan]));
    } catch (err) {
      // Storage blocked: the plan still works for this visit.
    }
  }

  /* ---------- helpers ---------- */

  function esc(value) {
    return String(value).replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[ch]);
  }

  function priceLabel(level) {
    return ["Free", "$", "$$", "$$$"][level] || "";
  }

  function durationLabel(minutes) {
    if (minutes < 60) return minutes + " min";
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return hours + " h" + (rest ? " " + rest + " min" : "");
  }

  // Keeps keyboard focus on the control the person just used after a re-render.
  function refocus(selector) {
    const el = document.querySelector(selector);
    if (el) el.focus();
  }

  /* ---------- filtering and sorting ---------- */

  function visiblePlaces() {
    const q = state.query.trim().toLowerCase();

    const items = PLACES.filter(p => {
      const inCategory = state.category === "All" || p.category === state.category;
      const haystack = (p.name + " " + p.summary + " " + p.category).toLowerCase();
      return inCategory && (!q || haystack.includes(q));
    });

    const sorters = {
      name: (a, b) => a.name.localeCompare(b.name),
      time: (a, b) => a.minutes - b.minutes || a.name.localeCompare(b.name),
      cost: (a, b) => a.price - b.price || a.name.localeCompare(b.name)
    };

    return items.sort(sorters[state.sort]);
  }

  /* ---------- rendering ---------- */

  function renderChips() {
    els.chips.innerHTML = categories.map(cat =>
      `<button type="button" class="chip" data-cat="${esc(cat)}" aria-pressed="${cat === state.category}">${esc(cat)}</button>`
    ).join("");
  }

  function renderList() {
    const items = visiblePlaces();
    els.count.textContent = items.length + (items.length === 1 ? " place" : " places");
    els.empty.hidden = items.length > 0;

    els.list.innerHTML = items.map(p => {
      const inPlan = state.plan.has(p.id);
      const isOpen = state.open.has(p.id);
      return `
        <li class="place" data-id="${esc(p.id)}">
          <div class="place-main">
            <div class="place-title">
              <h3>${esc(p.name)}</h3>
              <span class="tag">${esc(p.category)}</span>
            </div>
            <p class="place-summary">${esc(p.summary)}</p>
            <dl class="meta">
              <div><dt>Visit</dt><dd>${durationLabel(p.minutes)}</dd></div>
              <div><dt>Cost</dt><dd>${priceLabel(p.price)}</dd></div>
            </dl>
          </div>
          <div class="place-actions">
            <button type="button" class="btn btn-ghost" data-action="toggle-detail"
              aria-expanded="${isOpen}" aria-controls="detail-${esc(p.id)}">
              ${isOpen ? "Hide tips" : "Tips"}
            </button>
            <button type="button" class="btn ${inPlan ? "btn-added" : "btn-solid"}" data-action="toggle-plan"
              aria-pressed="${inPlan}">
              ${inPlan ? "Added" : "Add to plan"}
            </button>
          </div>
          <div class="place-detail" id="detail-${esc(p.id)}" ${isOpen ? "" : "hidden"}>
            <p><strong>Best time:</strong> ${esc(p.bestTime)}</p>
            <p><strong>Tip:</strong> ${esc(p.tip)}</p>
          </div>
        </li>`;
    }).join("");
  }

  function renderPlan() {
    const items = PLACES.filter(p => state.plan.has(p.id));
    const minutes = items.reduce((sum, p) => sum + p.minutes, 0);

    els.planTotal.textContent = items.length
      ? `${items.length} stop${items.length > 1 ? "s" : ""}, about ${durationLabel(minutes)} in total.`
      : "Nothing planned yet. Add places from the list.";

    els.planList.innerHTML = items.map(p => `
      <li>
        <span>${esc(p.name)}</span>
        <button type="button" class="link-btn" data-action="remove" data-id="${esc(p.id)}">
          Remove<span class="sr-only"> ${esc(p.name)}</span>
        </button>
      </li>`).join("");

    els.clear.disabled = items.length === 0;
  }

  function render() {
    renderChips();
    renderList();
    renderPlan();
  }

  /* ---------- events ---------- */

  els.search.addEventListener("input", e => {
    state.query = e.target.value;
    renderList();
  });

  els.sort.addEventListener("change", e => {
    state.sort = e.target.value;
    renderList();
  });

  els.chips.addEventListener("click", e => {
    const button = e.target.closest("button[data-cat]");
    if (!button) return;
    state.category = button.dataset.cat;
    render();
    refocus(`#chips button[data-cat="${CSS.escape(state.category)}"]`);
  });

  els.list.addEventListener("click", e => {
    const button = e.target.closest("button[data-action]");
    if (!button) return;

    const id = button.closest(".place").dataset.id;
    const action = button.dataset.action;

    if (action === "toggle-detail") {
      state.open.has(id) ? state.open.delete(id) : state.open.add(id);
      renderList();
    } else if (action === "toggle-plan") {
      state.plan.has(id) ? state.plan.delete(id) : state.plan.add(id);
      savePlan();
      render();
    }
    refocus(`li[data-id="${CSS.escape(id)}"] button[data-action="${action}"]`);
  });

  els.planList.addEventListener("click", e => {
    const button = e.target.closest("button[data-action='remove']");
    if (!button) return;
    state.plan.delete(button.dataset.id);
    savePlan();
    renderPlan();
    renderList();
  });

  els.clear.addEventListener("click", () => {
    state.plan.clear();
    savePlan();
    render();
  });

  /* ---------- start ---------- */

  els.year.textContent = new Date().getFullYear();
  render();
})();
