// ===== Apuestas PRO (COMPLETO) =====
(() => {
  const {
    API_BASE_FOOTBALL,
    API_BASE_ODDS,
    SEASON,
    LS_PICKS_KEY,
    STATIC_COMPETITIONS,
    HEADERS_FOOTBALL,
    HEADERS_ODDS
  } = window.__AP_CFG__;

  // ---- UI refs
  const apiStatusEl  = document.getElementById("apiStatus");
  const oddsStatusEl = document.getElementById("oddsStatus");

  const tabHome  = document.getElementById("tabHome");
  const tabPicks = document.getElementById("tabPicks");
  const pageHome = document.getElementById("home");
  const pagePicks= document.getElementById("picks");

  const leagueSelect = document.getElementById("leagueSelect");
  const dateInput    = document.getElementById("dateInput");
  const btnBuscar    = document.getElementById("btnBuscar");
  const matchesBox   = document.getElementById("matchesContainer");

  // picks manual
  const mpHome  = document.getElementById("mpHome");
  const mpAway  = document.getElementById("mpAway");
  const mpOdd   = document.getElementById("mpOdd");

  const odd1    = document.getElementById("odd1");
  const oddX    = document.getElementById("oddX");
  const odd2    = document.getElementById("odd2");
  const oddOver25  = document.getElementById("oddOver25");
  const oddUnder25 = document.getElementById("oddUnder25");
  const oddBTTSYes = document.getElementById("oddBTTSYes");
  const oddBTTSNo  = document.getElementById("oddBTTSNo");

  const btnAddPick = document.getElementById("btnAddPick");
  const btnExport  = document.getElementById("btnExport");
  const btnClear   = document.getElementById("btnClear");
  const picksList  = document.getElementById("picksList");

  const fabRefresh = document.getElementById("fabRefresh");
  const fabGoPicks = document.getElementById("fabGoPicks");

  // ---- helpers
  const setAPIStatus = (ok) => {
    apiStatusEl.textContent = ok ? "Online" : "Offline";
    apiStatusEl.className   = ok ? "online" : "offline";
  };
  const setOddsStatus = (ok) => {
    oddsStatusEl.textContent = ok ? "Online" : "Offline";
    oddsStatusEl.className   = ok ? "online" : "offline";
  };

  const fmtDate = (d) => d.toISOString().slice(0,10);

  // ---- Tabs
  function goHome() {
    tabHome.classList.add("active");
    tabPicks.classList.remove("active");
    pageHome.classList.add("active");
    pagePicks.classList.remove("active");
  }
  function goPicks() {
    tabPicks.classList.add("active");
    tabHome.classList.remove("active");
    pagePicks.classList.add("active");
    pageHome.classList.remove("active");
  }
  tabHome.addEventListener("click", goHome);
  tabPicks.addEventListener("click", goPicks);
  fabGoPicks.addEventListener("click", goPicks);

  // ---- Cargar ligas
  async function cargarLigas() {
    try {
      const url = `${API_BASE_FOOTBALL}/leagues?current=true`;
      const res = await fetch(url, { headers: HEADERS_FOOTBALL, cache: "no-store" });
      if (!res.ok) throw new Error("Bad status leagues");
      const data = await res.json();

      // Limpiar y llenar
      leagueSelect.innerHTML = "";
      data.response
        .filter(x => !!x?.league?.id)
        .sort((a,b) => a.country.name.localeCompare(b.country.name))
        .forEach(x => {
          const opt = document.createElement("option");
          opt.value = x.league.id;
          opt.textContent = `${x.country.name} - ${x.league.name}`;
          leagueSelect.appendChild(opt);
        });

      // si no hay nada, fallback
      if (!leagueSelect.options.length) {
        throw new Error("Empty leagues");
      }
      setAPIStatus(true);
    } catch (e) {
      console.warn("Leagues fallback:", e.message);
      setAPIStatus(false);
      leagueSelect.innerHTML = STATIC_COMPETITIONS
        .map(l => `<option value="${l.id}">${l.name}</option>`).join("");
    }
  }

  // ---- Buscar partidos
  async function buscarPartidos() {
    matchesBox.innerHTML = `<div class="hint">Buscando…</div>`;

    const leagueId = leagueSelect.value;
    const day = dateInput.value || fmtDate(new Date());

    if (!leagueId) {
      matchesBox.innerHTML = `<div class="warn">Selecciona competición</div>`;
      return;
    }

    try {
      const url = `${API_BASE_FOOTBALL}/fixtures?league=${leagueId}&season=${SEASON}&date=${day}`;
      const res = await fetch(url, { headers: HEADERS_FOOTBALL, cache: "no-store" });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();

      setAPIStatus(true);

      if (!data.response?.length) {
        matchesBox.innerHTML = `<div class="hint">No hay partidos para esta búsqueda.</div>`;
        return;
      }

      matchesBox.innerHTML = data.response.map(f => {
        const h = f.teams?.home?.name ?? "Local";
        const a = f.teams?.away?.name ?? "Visitante";
        const t = (f.fixture?.date || "").slice(11,16);
        return `
          <div class="card">
            <div class="row">
              <strong>${h}</strong> vs <strong>${a}</strong>
              <span class="muted">${t}</span>
            </div>
            <div class="row gap">
              <button class="btn sm" data-add="${h}||${a}">⭐ Añadir pick</button>
            </div>
          </div>
        `;
      }).join("");

      // botones "Añadir pick" desde listado
      matchesBox.querySelectorAll("[data-add]").forEach(btn=>{
        btn.addEventListener("click", ()=>{
          const [h,a] = btn.dataset.add.split("||");
          mpHome.value = h; mpAway.value = a;
          goPicks();
        });
      });

    } catch (err) {
      setAPIStatus(false);
      matchesBox.innerHTML = `<div class="error">Error al obtener partidos.</div>`;
      console.error(err);
    }
  }

  // ---- Picks en LocalStorage
  const readPicks  = () => JSON.parse(localStorage.getItem(LS_PICKS_KEY) || "[]");
  const writePicks = (arr) => localStorage.setItem(LS_PICKS_KEY, JSON.stringify(arr));

  function renderPicks() {
    const picks = readPicks();
    if (!picks.length) {
      picksList.innerHTML = `<div class="hint">No tienes picks guardados.</div>`;
      return;
    }
    picksList.innerHTML = picks.map((p,i)=>`
      <div class="card">
        <div><strong>${p.home}</strong> vs <strong>${p.away}</strong></div>
        <div class="muted">Prob: ${p.prob || "-"}% | EV: ${p.ev || "0"}%</div>
        <div class="row gap">
          <button class="btn sm danger" data-del="${i}">Borrar</button>
        </div>
      </div>
    `).join("");

    picksList.querySelectorAll("[data-del]").forEach(b=>{
      b.addEventListener("click", ()=>{
        const idx = +b.dataset.del;
        const arr = readPicks();
        arr.splice(idx,1);
        writePicks(arr);
        renderPicks();
      });
    });
  }

  function addManualPick() {
    const home = mpHome.value.trim();
    const away = mpAway.value.trim();
    if (!home || !away) return;

    // cálculo de prob a partir de cuota única opcional
    let prob = "";
    const baseOdd = parseFloat(mpOdd.value.replace(",","."));
    if (!isNaN(baseOdd) && baseOdd > 1) {
      prob = Math.round((1/baseOdd)*100);
    }

    // también guardamos mercados si los has rellenado
    const pick = {
      ts: Date.now(),
      home, away,
      prob,
      markets: {
        "1x2": { "1": odd1.value, "X": oddX.value, "2": odd2.value },
        "O/U 2.5": { over: oddOver25.value, under: oddUnder25.value },
        "BTTS": { yes: oddBTTSYes.value, no: oddBTTSNo.value }
      }
    };

    const arr = readPicks();
    arr.unshift(pick);
    writePicks(arr);
    renderPicks();

    // limpiar mínimos
    // mpHome.value = ""; mpAway.value = ""; mpOdd.value = "";
  }

  // ---- Odds ping (solo estado)
  async function pingOdds() {
    try {
      const test = `${API_BASE_ODDS}/mapping`;
      const r = await fetch(test, { headers: HEADERS_ODDS });
      setOddsStatus(r.ok);
    } catch { setOddsStatus(false); }
  }

  // ---- Eventos
  btnBuscar.addEventListener("click", buscarPartidos);
  fabRefresh.addEventListener("click", cargarLigas);
  btnAddPick.addEventListener("click", addManualPick);
  btnExport.addEventListener("click", ()=> {
    const blob = new Blob([localStorage.getItem(LS_PICKS_KEY) || "[]"], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "picks.json";
    a.click();
  });
  btnClear.addEventListener("click", ()=> {
    if (confirm("¿Borrar todos los picks?")) {
      localStorage.removeItem(LS_PICKS_KEY);
      renderPicks();
    }
  });

  // ---- Init
  (function init(){
    // fecha por defecto hoy
    dateInput.value = fmtDate(new Date());
    cargarLigas();
    pingOdds();
    renderPicks();
  })();
})();
