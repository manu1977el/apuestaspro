// ======================================================
// ⚽ Apuestas PRO - Versión final estable con Proxy Worker
// ======================================================

// 🌐 Tu proxy de Cloudflare Workers
const API_BASE = "https://apuestaspro-proxy.pimanema.workers.dev";

// 📅 Fecha de hoy
const TODAY = new Date().toISOString().split("T")[0];

// 🏆 Ligas principales (fallback si no carga la API)
const MAIN_LEAGUES = [
  { id: 39,  name: "Premier League" },
  { id: 140, name: "LaLiga" },
  { id: 135, name: "Serie A" },
  { id: 78,  name: "Bundesliga" },
  { id: 61,  name: "Ligue 1" },
  { id: 2,   name: "UEFA Champions League" },
  { id: 3,   name: "UEFA Europa League" }
];

// 🧭 Elementos del DOM
const el = {
  statusApi: document.getElementById("status-api"),
  statusOdds: document.getElementById("status-odds"),
  tabInicio: document.getElementById("tab-inicio"),
  tabPicks: document.getElementById("tab-picks"),
  sectionInicio: document.getElementById("inicio"),
  sectionPicks: document.getElementById("picks"),
  filtroLigas: document.getElementById("filtro-ligas"),
  fechaInput: document.getElementById("fecha"),
  btnBuscar: document.getElementById("buscar-partidos") || document.getElementById("buscar"),
  resultados: document.getElementById("resultados"),
  listaPicks: document.getElementById("lista-picks")
};

// ==============================
// 🧰 Utilidades
// ==============================
function setStatus(node, online) {
  if (!node) return;
  node.textContent = online ? "Online" : "Offline";
  node.classList.toggle("online", online);
  node.classList.toggle("offline", !online);
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function timeFromIso(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

// ==============================
// 🧪 Comprobar estado APIs
// ==============================
async function checkApis() {
  try {
    const r = await fetch(`${API_BASE}/fixtures?date=${TODAY}&limit=1`);
    setStatus(el.statusApi, r.ok);
  } catch {
    setStatus(el.statusApi, false);
  }

  try {
    const r2 = await fetch(`${API_BASE}/odds?date=${TODAY}&limit=1`);
    setStatus(el.statusOdds, r2.ok);
  } catch {
    setStatus(el.statusOdds, false);
  }
}

// ==============================
// 🏆 Cargar ligas
// ==============================
async function cargarLigas() {
  if (!el.filtroLigas) return;
  el.filtroLigas.innerHTML = `<option value="all">🌍 Todas las competiciones</option>`;

  try {
    const res = await fetch(`${API_BASE}/leagues`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const arr = (data?.response ?? [])
      .map(x => ({ id: x.league.id, name: x.league.name }))
      .sort((a,b)=>a.name.localeCompare(b.name,"es"));
    (arr.length ? arr : MAIN_LEAGUES).forEach(l => {
      const opt = document.createElement("option");
      opt.value = l.id;
      opt.textContent = l.name;
      el.filtroLigas.appendChild(opt);
    });
  } catch {
    MAIN_LEAGUES.forEach(l => {
      const opt = document.createElement("option");
      opt.value = l.id;
      opt.textContent = l.name;
      el.filtroLigas.appendChild(opt);
    });
  }
}

// ==============================
// 💰 Obtener cuotas 1X2
// ==============================
async function fetchOddsForFixture(fixtureId) {
  try {
    const url = `${API_BASE}/odds?fixture=${fixtureId}&bookmaker=8`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = await r.json();
    const bm = j.response?.[0]?.bookmakers?.[0];
    const bet = bm?.bets?.find(b => b.name === "Match Winner");
    if (!bet) return null;
    const out = { "1": "-", "X": "-", "2": "-" };
    bet.values?.forEach(v => {
      if (v.value === "Home") out["1"] = v.odd;
      if (v.value === "Draw") out["X"] = v.odd;
      if (v.value === "Away") out["2"] = v.odd;
    });
    return out;
  } catch {
    return null;
  }
}

// ==============================
// 🏟 Obtener fixtures
// ==============================
async function fetchFixtures(date, leagueId = "all") {
  let url = `${API_BASE}/fixtures?date=${date}`;
  if (leagueId !== "all") url += `&league=${leagueId}&season=2025`;
  const r = await fetch(url);
  if (!r.ok) throw new Error();
  const j = await r.json();
  return j.response ?? [];
}

// ==============================
// 🖼 Render partidos
// ==============================
async function renderFixtures(fixtures, fechaTexto) {
  if (!el.resultados) return;
  if (!fixtures || fixtures.length === 0) {
    el.resultados.innerHTML = `<p>⚽ No hay partidos para ${escapeHtml(fechaTexto)}</p>`;
    return;
  }

  let html = `<h3>📅 Partidos — ${escapeHtml(fechaTexto)}</h3><ul style="list-style:none;padding:0;margin:0;">`;

  for (const f of fixtures) {
    const home = escapeHtml(f.teams?.home?.name || "Local");
    const away = escapeHtml(f.teams?.away?.name || "Visitante");
    const hora = timeFromIso(f.fixture?.date);

    const odds = await fetchOddsForFixture(f.fixture?.id);
    const cuotasHtml = odds
      ? `<div style="margin-top:6px">💰 <strong>1</strong>: ${odds["1"]} &nbsp; <strong>X</strong>: ${odds["X"]} &nbsp; <strong>2</strong>: ${odds["2"]}</div>`
      : `<div style="margin-top:6px;color:#999">📉 Cuotas no disponibles</div>`;

    html += `
      <li style="margin-bottom:10px;background:#1b1b1b;padding:10px;border-radius:8px;">
        <div><strong>${home}</strong> vs <strong>${away}</strong></div>
        <div style="color:#aaa;font-size:13px;">⏰ ${hora}</div>
        ${cuotasHtml}
        <div style="margin-top:8px;">
          <button class="btn-pick" data-home="${home}" data-away="${away}" style="padding:6px 10px;border-radius:6px;border:0;background:#0077ff;color:#fff;">⭐ Guardar pick</button>
        </div>
      </li>`;
  }

  html += `</ul>`;
  el.resultados.innerHTML = html;

  document.querySelectorAll(".btn-pick").forEach(b => {
    b.addEventListener("click", e => {
      const node = e.currentTarget;
      guardarPick({
        home: node.dataset.home,
        away: node.dataset.away,
        savedAt: new Date().toISOString()
      });
    });
  });
}

// ==============================
// 🔎 Buscar partidos
// ==============================
async function buscarYMostrar() {
  const fecha = el.fechaInput?.value || TODAY;
  const liga = el.filtroLigas?.value || "all";
  el.resultados.innerHTML = `<p>⏳ Buscando partidos...</p>`;
  try {
    const fixtures = await fetchFixtures(fecha, liga);
    await renderFixtures(fixtures, fecha);
  } catch {
    el.resultados.innerHTML = `<p style="color:#f66">❌ Error al obtener partidos</p>`;
  }
}

// ==============================
// ⭐ Picks en localStorage
// ==============================
function guardarPick(pick) {
  const arr = JSON.parse(localStorage.getItem("ap_picks_v1") || "[]");
  arr.unshift(pick);
  localStorage.setItem("ap_picks_v1", JSON.stringify(arr.slice(0, 200)));
  mostrarPicks();
}

function mostrarPicks() {
  if (!el.listaPicks) return;
  const arr = JSON.parse(localStorage.getItem("ap_picks_v1") || "[]");
  if (!arr.length) {
    el.listaPicks.innerHTML = `<p>📭 No tienes picks guardados.</p>`;
    return;
  }
  let html = `<ul style="list-style:none;padding:0;margin:0;">`;
  arr.forEach(p => {
    html += `<li style="background:#121212;padding:10px;border-radius:8px;margin-bottom:8px;">
      ⭐ <strong>${escapeHtml(p.home)}</strong> vs <strong>${escapeHtml(p.away)}</strong>
      <div style="font-size:12px;color:#aaa">Guardado: ${new Date(p.savedAt).toLocaleString()}</div>
    </li>`;
  });
  html += `</ul>`;
  el.listaPicks.innerHTML = html;
}

// ==============================
// 🧭 Pestañas
// ==============================
function initTabs() {
  if (!el.tabInicio || !el.tabPicks) return;
  el.tabInicio.addEventListener("click", () => {
    el.sectionInicio.style.display = "block";
    el.sectionPicks.style.display = "none";
    el.tabInicio.classList.add("active");
    el.tabPicks.classList.remove("active");
  });
  el.tabPicks.addEventListener("click", () => {
    el.sectionInicio.style.display = "none";
    el.sectionPicks.style.display = "block";
    el.tabPicks.classList.add("active");
    el.tabInicio.classList.remove("active");
  });
  el.sectionInicio.style.display = "block";
  el.sectionPicks.style.display = "none";
}

// ==============================
// 🚀 Inicializar App
// ==============================
function initApp() {
  initTabs();
  cargarLigas();
  mostrarPicks();
  checkApis();
  el.btnBuscar?.addEventListener("click", buscarYMostrar);
  el.filtroLigas?.addEventListener("change", buscarYMostrar);
  el.fechaInput?.addEventListener("change", buscarYMostrar);
  setTimeout(buscarYMostrar, 300);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
