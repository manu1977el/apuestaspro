// ===== APP PRINCIPAL (usa window.APP_CONFIG) =====

(function () {
  const CFG = window.APP_CONFIG || {};
  const API_BASE = CFG.API_BASE;
  const API_KEY  = CFG.API_FOOTBALL_KEY;
  const TODAY    = new Date().toISOString().split("T")[0];

  // ---------------- DOM ----------------
  const $ = (id) => document.getElementById(id);
  const sel = CFG.SELECTORS;
  const el = {
    statusApi:   $(sel.statusApi),
    statusOdds:  $(sel.statusOdds),
    tabInicio:   $(sel.tabInicio),
    tabPicks:    $(sel.tabPicks),
    sectionInicio: $(sel.sectionInicio),
    sectionPicks:  $(sel.sectionPicks),
    filtroLigas: $(sel.filtroLigas),
    fecha:       $(sel.fecha),
    btnBuscar:   $(sel.btnBuscar),
    resultados:  $(sel.resultados),
    listaPicks:  $(sel.listaPicks)
  };

  // ------------- Utils -------------
  const setStatus = (node, online) => {
    if (!node) return;
    node.textContent = online ? "Online" : "Offline";
    node.classList.toggle("online", online);
    node.classList.toggle("offline", !online);
  };
  const escapeHtml = (s) =>
    String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const timeFromIso = (iso) => {
    try { return new Date(iso).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"}); }
    catch { return ""; }
  };

  // ------------- Fetch helpers -------------
  async function apiGet(path, extraHeaders = {}) {
    const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
    const r = await fetch(url, {
      headers: {
        "x-apisports-key": API_KEY,
        "Accept": "application/json",
        ...extraHeaders
      }
    });
    return r;
  }

  // ------------- Estados -------------
  async function checkApis() {
    try {
      const r = await apiGet(`/status`);
      setStatus(el.statusApi, r.ok);
    } catch { setStatus(el.statusApi, false); }

    try {
      // No existe status dedicado de odds en API-Sports -> probamos consulta pequeña
      const r2 = await apiGet(`/odds?date=${TODAY}&limit=1`);
      setStatus(el.statusOdds, r2.ok);
    } catch { setStatus(el.statusOdds, false); }
  }

  // ------------- Ligas -------------
  async function cargarLigas() {
    if (!el.filtroLigas) return;
    el.filtroLigas.innerHTML = `<option value="all">🌍 Todas las competiciones</option>`;
    try {
      const r = await apiGet(`/leagues`);
      if (!r.ok) throw new Error("leagues http");
      const j = await r.json();
      const arr = (j?.response ?? [])
        .map(x => ({ id: x.league.id, name: x.league.name }))
        .sort((a,b)=>a.name.localeCompare(b.name,"es"));
      (arr.length ? arr : CFG.MAIN_LEAGUES).forEach(l => {
        const opt = document.createElement("option");
        opt.value = l.id; opt.textContent = l.name;
        el.filtroLigas.appendChild(opt);
      });
    } catch {
      CFG.MAIN_LEAGUES.forEach(l => {
        const opt = document.createElement("option");
        opt.value = l.id; opt.textContent = l.name;
        el.filtroLigas.appendChild(opt);
      });
    }
  }

  // ------------- Fixtures -------------
  async function fetchFixtures(date, leagueId = "all") {
    let path = `/fixtures?date=${date}`;
    if (leagueId !== "all") path += `&league=${leagueId}&season=2025`;
    const r = await apiGet(path);
    if (!r.ok) throw new Error(`fixtures http ${r.status}`);
    const j = await r.json();
    return j?.response ?? [];
  }

  // ------------- Odds 1X2 -------------
  async function fetchOdds(fixtureId) {
    try {
      const r = await apiGet(`/odds?fixture=${fixtureId}&bookmaker=8`);
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
    } catch { return null; }
  }

  // ------------- Renderizar -------------
  async function renderFixtures(fixtures, fechaLabel) {
    if (!el.resultados) return;
    if (!fixtures.length) {
      el.resultados.innerHTML = `<p>⚽ No hay partidos para ${escapeHtml(fechaLabel)}</p>`;
      return;
    }
    let html = `<h3>📅 Partidos — ${escapeHtml(fechaLabel)}</h3><ul style="list-style:none;padding:0;margin:0;">`;
    for (const f of fixtures) {
      const home = escapeHtml(f.teams?.home?.name || "Local");
      const away = escapeHtml(f.teams?.away?.name || "Visitante");
      const hora = timeFromIso(f.fixture?.date);
      const odds = await fetchOdds(f.fixture?.id);
      const cuotas = odds
        ? `<div style="margin-top:6px">💰 <strong>1</strong>: ${odds["1"]} &nbsp; <strong>X</strong>: ${odds["X"]} &nbsp; <strong>2</strong>: ${odds["2"]}</div>`
        : `<div style="margin-top:6px;color:#999">📉 Cuotas no disponibles</div>`;
      html += `
        <li style="margin-bottom:10px;background:#1b1b1b;padding:10px;border-radius:8px;">
          <div><strong>${home}</strong> <span style="color:#ccc">vs</span> <strong>${away}</strong></div>
          <div style="color:#aaa;font-size:13px;">⏰ ${hora}</div>
          ${cuotas}
          <div style="margin-top:8px;">
            <button class="btn-pick" data-home="${home}" data-away="${away}" style="padding:6px 10px;border-radius:6px;border:0;background:#0077ff;color:#fff;">⭐ Guardar pick</button>
          </div>
        </li>`;
    }
    html += `</ul>`;
    el.resultados.innerHTML = html;

    document.querySelectorAll(".btn-pick").forEach(b => {
      b.addEventListener("click", e => {
        const n = e.currentTarget;
        guardarPick({
          home: n.dataset.home,
          away: n.dataset.away,
          savedAt: new Date().toISOString()
        });
      });
    });
  }

  // ------------- Buscar + mostrar -------------
  async function buscarYMostrar() {
    const fecha = el.fecha?.value || TODAY;
    const liga  = el.filtroLigas?.value || "all";
    if (el.resultados) el.resultados.innerHTML = `<p>⏳ Buscando partidos...</p>`;
    try {
      const fixt = await fetchFixtures(fecha, liga);
      await renderFixtures(fixt, fecha);
    } catch {
      if (el.resultados)
        el.resultados.innerHTML = `<p style="color:#f66">❌ Error al obtener partidos. Abre primero: <a href="https://cors-anywhere.herokuapp.com/corsdemo" target="_blank" rel="noopener">corsdemo</a></p>`;
    }
  }

  // ------------- Picks -------------
  function guardarPick(pick) {
    const key = "ap_picks_v1";
    const arr = JSON.parse(localStorage.getItem(key) || "[]");
    arr.unshift(pick);
    localStorage.setItem(key, JSON.stringify(arr.slice(0, 200)));
    mostrarPicks();
  }
  function mostrarPicks() {
    if (!el.listaPicks) return;
    const arr = JSON.parse(localStorage.getItem("ap_picks_v1") || "[]");
    if (!arr.length) { el.listaPicks.innerHTML = `<p>📭 No tienes picks guardados.</p>`; return; }
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

  // ------------- Tabs -------------
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

  // ------------- Init -------------
  function init() {
    // fecha por defecto
    if (el.fecha && !el.fecha.value) el.fecha.value = TODAY;
    initTabs();
    cargarLigas();
    mostrarPicks();
    checkApis();
    el.btnBuscar?.addEventListener("click", buscarYMostrar);
    el.filtroLigas?.addEventListener("change", buscarYMostrar);
    el.fecha?.addEventListener("change", buscarYMostrar);
    // primera carga
    setTimeout(buscarYMostrar, 300);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
