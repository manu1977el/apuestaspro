// ======================================================
// app.js — Versión completa CON KEYS (reemplaza archivo actual)
// ======================================================

// ---------------------------
// 🔐 KEYS (ya incluidas)
// ---------------------------
// API-Football (v3 api-sports)
const API_FOOTBALL_KEY = "6DF57D1853E112002FA1139673F50218";
// The Odds API key (si usas api externa a api-sports). No se usa por defecto
const ODDS_API_KEY = "ddc3cb56d665397d69ceb71faf0e1b8b";

// ---------------------------
// 🧭 Endpoints directos (sin proxy)
// ---------------------------
const API_SPORTS_BASE = "https://v3.football.api-sports.io";
const FIXTURES_ENDPOINT = `${API_SPORTS_BASE}/fixtures`;
const LEAGUES_ENDPOINT = `${API_SPORTS_BASE}/leagues`;
const ODDS_ENDPOINT = `${API_SPORTS_BASE}/odds`; // api-sports also has odds endpoint

// Si deseases usar The Odds API en vez de api-sports para cuotas,
// usa la variable ODDS_API_KEY y su endpoint correspondiente.

// ---------------------------
// 🗓 Fecha base
// ---------------------------
const TODAY = new Date().toISOString().split("T")[0];

// ---------------------------
// IDs / nombres de ligas por defecto
// (fallback por si falla la consulta a /leagues)
// ---------------------------
const MAIN_LEAGUES = [
  { id: 39,  name: "Premier League" },
  { id: 140, name: "LaLiga" },
  { id: 135, name: "Serie A" },
  { id: 78,  name: "Bundesliga" },
  { id: 61,  name: "Ligue 1" },
  { id: 2,   name: "UEFA Champions League" },
  { id: 3,   name: "UEFA Europa League" }
];

// ---------------------------
// 🔌 Cabeceras helper (para api-sports)
// ---------------------------
function sportsHeaders() {
  return {
    "x-apisports-key": API_FOOTBALL_KEY,
    "Accept": "application/json"
  };
}

// ---------------------------
// 🔎 Elementos del DOM (esperados en index.html)
// ---------------------------
const el = {
  statusApi: document.getElementById("status-api"),     // muestra Online/Offline API-Football
  statusOdds: document.getElementById("status-odds"),   // muestra Online/Offline Odds
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

// ---------------------------
// 🛠 Utilidades
// ---------------------------
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

// ---------------------------
// 🧪 Comprobación de estado de APIs
// ---------------------------
async function checkApis() {
  // API-Football (simple ping /status no oficial -> hacemos small fixtures request as check)
  try {
    const r = await fetch(`${FIXTURES_ENDPOINT}?date=${TODAY}&limit=1`, { headers: sportsHeaders() });
    setStatus(el.statusApi, r.ok);
  } catch (e) {
    setStatus(el.statusApi, false);
  }

  // Odds (usaremos same service check)
  try {
    const r2 = await fetch(`${ODDS_ENDPOINT}?date=${TODAY}&limit=1`, { headers: sportsHeaders() });
    setStatus(el.statusOdds, r2.ok);
  } catch (e) {
    setStatus(el.statusOdds, false);
  }
}

// ---------------------------
// 🔽 Cargar Ligas (llenar selector)
// ---------------------------
async function cargarLigas() {
  if (!el.filtroLigas) return;

  // limpiar
  el.filtroLigas.innerHTML = `<option value="all">🌍 Todas las competiciones</option>`;

  try {
    const res = await fetch(`${LEAGUES_ENDPOINT}`, { headers: sportsHeaders() });
    if (!res.ok) throw new Error("no leagues");
    const data = await res.json();

    // data.response es un array con info>league
    const arr = (data?.response ?? []).map(x => ({
      id: x.league.id,
      name: x.league.name
    })).sort((a,b)=>a.name.localeCompare(b.name, "es"));

    if (arr.length === 0) throw new Error("empty");

    arr.forEach(l => {
      const opt = document.createElement("option");
      opt.value = l.id;
      opt.textContent = l.name;
      el.filtroLigas.appendChild(opt);
    });
  } catch (err) {
    // fallback: añadir ligas principales
    MAIN_LEAGUES.forEach(l => {
      const opt = document.createElement("option");
      opt.value = l.id;
      opt.textContent = l.name;
      el.filtroLigas.appendChild(opt);
    });
  }
}

// ---------------------------
// 🔁 Obtener cuotas 1X2 para un fixture específico (api-sports odds)
// devuelve objeto { "1": odd, "X": odd, "2": odd } o null
// ---------------------------
async function fetchOddsForFixture(fixtureId) {
  try {
    const url = `${ODDS_ENDPOINT}?fixture=${fixtureId}&bookmaker=8`; // bookmaker 8 = Bet365 (si está disponible)
    const r = await fetch(url, { headers: sportsHeaders() });
    if (!r.ok) throw new Error("odds fetch failed");
    const j = await r.json();

    if (!j?.response || j.response.length === 0) return null;

    // api-sports: response[0].bookmakers[0].bets -> find "Match Winner"
    const bm = j.response[0].bookmakers?.[0];
    const bet = bm?.bets?.find(b => b.name === "Match Winner");
    if (!bet) return null;

    const out = { "1": "-", "X": "-", "2": "-" };
    bet.values?.forEach(v => {
      if (v.value === "Home") out["1"] = v.odd;
      if (v.value === "Draw") out["X"] = v.odd;
      if (v.value === "Away") out["2"] = v.odd;
    });
    return out;
  } catch (e) {
    console.error("fetchOddsForFixture error", e);
    return null;
  }
}

// ---------------------------
// 🏟 Obtener fixtures por fecha y opcional league
// ---------------------------
async function fetchFixtures(date, leagueId = "all") {
  try {
    let url = `${FIXTURES_ENDPOINT}?date=${date}`;
    if (leagueId && leagueId !== "all") url += `&league=${leagueId}&season=2025`;
    const r = await fetch(url, { headers: sportsHeaders() });
    if (!r.ok) throw new Error(`fixtures http ${r.status}`);
    const j = await r.json();
    return j?.response ?? [];
  } catch (e) {
    console.error("fetchFixtures error", e);
    throw e;
  }
}

// ---------------------------
// 🖼 Render de partidos en pantalla (incluye llamadas a odds por partido)
// ---------------------------
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

    // intentamos obtener cuotas (si hay)
    const odds = await fetchOddsForFixture(f.fixture?.id);
    const cuotasHtml = odds
      ? `<div style="margin-top:6px">💰 <strong>1</strong>: ${odds["1"]} &nbsp; <strong>X</strong>: ${odds["X"]} &nbsp; <strong>2</strong>: ${odds["2"]}</div>`
      : `<div style="margin-top:6px;color:#999">📉 Cuotas no disponibles</div>`;

    html += `
      <li style="margin-bottom:10px;background:#1b1b1b;padding:10px;border-radius:8px;">
        <div style="font-size:15px;"><strong>${home}</strong> <span style="color:#ccc">vs</span> <strong>${away}</strong></div>
        <div style="font-size:13px;color:#aaa">⏰ ${hora}</div>
        ${cuotasHtml}
        <div style="margin-top:8px;">
          <button class="btn-pick" data-home="${home}" data-away="${away}" data-fixture="${f.fixture?.id}" style="padding:6px 10px;border-radius:6px;border:0;background:#0077ff;color:#fff;">⭐ Guardar pick</button>
        </div>
      </li>
    `;
  }

  html += `</ul>`;
  el.resultados.innerHTML = html;

  // attach pick handlers
  document.querySelectorAll(".btn-pick").forEach(b => {
    b.addEventListener("click", e => {
      const node = e.currentTarget;
      guardarPick({
        fixture: node.dataset.fixture,
        home: node.dataset.home,
        away: node.dataset.away,
        savedAt: new Date().toISOString()
      });
    });
  });
}

// ---------------------------
// 🧭 Buscar + render (invocado por botón o cambio de select)
// ---------------------------
async function buscarYMostrar() {
  if (!el.resultados) return;
  const fecha = el.fechaInput?.value || TODAY;
  const liga = el.filtroLigas?.value || "all";

  el.resultados.innerHTML = `<p>⏳ Buscando partidos...</p>`;
  try {
    const fixtures = await fetchFixtures(fecha, liga);
    await renderFixtures(fixtures, fecha);
  } catch (e) {
    el.resultados.innerHTML = `<p style="color:#f66">❌ Error al obtener partidos. Intenta recargar.</p>`;
  }
}

// ---------------------------
// 🔖 Picks: localStorage
// ---------------------------
function guardarPick(pick) {
  const arr = JSON.parse(localStorage.getItem("ap_picks_v1") || "[]");
  arr.unshift(pick); // push al inicio
  localStorage.setItem("ap_picks_v1", JSON.stringify(arr.slice(0, 200))); // límite 200
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

// ---------------------------
// 🧭 Pestañas
// ---------------------------
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
  // estado inicial
  el.sectionInicio && (el.sectionInicio.style.display = "block");
  el.sectionPicks && (el.sectionPicks.style.display = "none");
}

// ---------------------------
// 🧪 Inicialización
// ---------------------------
function initApp() {
  initTabs();
  cargarLigas();
  mostrarPicks();
  checkApis();

  // eventos UI
  el.btnBuscar?.addEventListener("click", buscarYMostrar);
  el.filtroLigas?.addEventListener("change", buscarYMostrar);
  el.fechaInput?.addEventListener("change", buscarYMostrar);

  // buscar por defecto
  setTimeout(() => { buscarYMostrar(); }, 400);
}

// arrancar cuando DOM listo
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
