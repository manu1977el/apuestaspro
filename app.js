// =========================
// ⚽ Apuestas PRO — PWA
// =========================

// ===== Claves =====
const API_FOOTBALL_KEY = "6DF57D1853E112002FA1139673F50218";
const ODDS_API_KEY      = "ddc3cb56d665397d69ceb71faf0e1b8b";

// ===== Endpoints =====
const API_URL  = "https://v3.football.api-sports.io";

// ===== LocalStorage =====
const LS_KEY_PICKS = "apuestaspro_picks_v1";

// ===== Elementos =====
const tabInicio  = document.getElementById('tab-inicio');
const tabPicks   = document.getElementById('tab-picks');
const sectionIni = document.getElementById('inicio');
const sectionPic = document.getElementById('picks');
const apiStatus  = document.getElementById('apiStatus');
const oddsStatus = document.getElementById('oddsStatus');

// Inicio
const ligaSelect = document.getElementById('ligaSelect');
const dateInput  = document.getElementById('dateInput');
const btnBuscar  = document.getElementById('btnBuscar');
const partidosContainer = document.getElementById('partidosContainer');

// Picks manuales
const mpHome = document.getElementById('mpHome');
const mpAway = document.getElementById('mpAway');
const btnAddPick = document.getElementById('btnAddPick');
const listaPicks = document.getElementById('listaPicks');
const btnExportar = document.getElementById('btnExportar');
const btnClearPicks = document.getElementById('btnClearPicks');
const searchPicks = document.getElementById('searchPicks');

// FAB
const fabRefresh = document.getElementById('fabRefresh');
const fabGoPicks = document.getElementById('fabGoPicks');

// Modal
const modalPick = document.getElementById('modalPick');
const modalEquipos = document.getElementById('modalEquipos');
const modalAddPick = document.getElementById('modalAddPick');
const modalCancel = document.getElementById('modalCancel');
let modalLocal = "";
let modalVisitante = "";

// =========================
// Utilidades
// =========================
function setToday() {
  const tzOffset = new Date().getTimezoneOffset() * 60000;
  const todayISO = new Date(Date.now() - tzOffset).toISOString().slice(0,10);
  dateInput.value = todayISO;
}

function setOnline(el, isOk) {
  el.textContent = isOk ? "Online" : "Offline";
  el.className   = isOk ? "online" : "offline";
}

// =========================
// Tabs
// =========================
tabInicio.addEventListener('click', () => {
  tabInicio.classList.add('active');
  tabPicks.classList.remove('active');
  sectionIni.style.display = 'block';
  sectionPic.style.display = 'none';
});

tabPicks.addEventListener('click', () => {
  tabPicks.classList.add('active');
  tabInicio.classList.remove('active');
  sectionPic.style.display = 'block';
  sectionIni.style.display = 'none';
});

// =========================
// Cargar competiciones
// =========================
async function cargarLigas() {
  try {
    const res = await fetch(`${API_URL}/leagues?current=true`, {
      headers: { "x-apisports-key": API_FOOTBALL_KEY }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    ligaSelect.innerHTML = "";
    data.response
      .sort((a,b) => (a.country.name+a.league.name).localeCompare(b.country.name+b.league.name))
      .forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.league.id;
        opt.textContent = `${item.country.name} - ${item.league.name}`;
        ligaSelect.appendChild(opt);
      });

    setOnline(apiStatus, true);
  } catch (e) {
    console.error("Error cargar ligas:", e);
    setOnline(apiStatus, false);
    ligaSelect.innerHTML = `<option value="">(Sin conexión)</option>`;
  }
}

// =========================
// Buscar partidos
// =========================
async function buscarPartidos() {
  const league = ligaSelect.value;
  const date   = dateInput.value;

  if (!league || !date) {
    partidosContainer.innerHTML = `<p>Selecciona competición y fecha.</p>`;
    return;
  }

  partidosContainer.innerHTML = `<p>⏳ Buscando…</p>`;

  try {
    const url = `${API_URL}/fixtures?league=${league}&season=2025&date=${date}`;
    const res = await fetch(url, {
      headers: { "x-apisports-key": API_FOOTBALL_KEY }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    partidosContainer.innerHTML = "";

    if (!data.response || data.response.length === 0) {
      partidosContainer.innerHTML = `<p>No hay partidos para esta fecha.</p>`;
      return;
    }

    data.response.forEach(fx => {
      const hora = new Date(fx.fixture.date).toLocaleTimeString('es-ES', {hour:'2-digit',minute:'2-digit'});
      const card = document.createElement('div');
      card.className = "card";
      card.innerHTML = `
        <div class="row">
          <div class="col">
            <strong>${fx.teams.home.name}</strong><br>
            vs<br>
            <strong>${fx.teams.away.name}</strong>
          </div>
          <div class="col right">
            <div>${fx.league.country} - ${fx.league.name}</div>
            <div>🕒 ${hora}</div>
            <button class="btn small btnAddFromMatch">➕ Pick</button>
          </div>
        </div>
      `;
      card.querySelector('.btnAddFromMatch').addEventListener('click', () => {
        abrirModalPick(fx.teams.home.name, fx.teams.away.name);
      });
      partidosContainer.appendChild(card);
    });

    setOnline(apiStatus, true);
  } catch (e) {
    console.error("Error buscar partidos:", e);
    setOnline(apiStatus, false);
    partidosContainer.innerHTML = `<p>❌ Error al consultar partidos.</p>`;
  }
}

// =========================
// Picks
// =========================
function cargarPicks() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY_PICKS) || "[]");
  } catch { return []; }
}

function guardarPicks(arr) {
  localStorage.setItem(LS_KEY_PICKS, JSON.stringify(arr));
}

function pintarPicks(filtro = "") {
  const picks = cargarPicks();
  listaPicks.innerHTML = "";
  const lowerFilter = filtro.toLowerCase();

  const filtrados = picks.filter(p => {
    return (
      p.local.toLowerCase().includes(lowerFilter) ||
      p.visitante.toLowerCase().includes(lowerFilter) ||
      JSON.stringify(p.markets).toLowerCase().includes(lowerFilter)
    );
  });

  if (filtrados.length === 0) {
    listaPicks.innerHTML = `<li class="muted">No se encontraron picks</li>`;
    return;
  }

  filtrados.forEach((p, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      ⭐ <strong>${p.local}</strong> vs <strong>${p.visitante}</strong>
      <div class="markets">
        1X2: ${p.markets["1X2"].home || '-'} / ${p.markets["1X2"].draw || '-'} / ${p.markets["1X2"].away || '-'}<br>
        +2.5 / -2.5: ${p.markets["O/U 2.5"].over || '-'} / ${p.markets["O/U 2.5"].under || '-'}<br>
        BTTS: ${p.markets["BTTS"].yes || '-'} / ${p.markets["BTTS"].no || '-'}
      </div>
      <button class="btn secondary btn-delete" data-index="${i}">🗑️ Eliminar</button>
    `;
    listaPicks.appendChild(li);
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      const picks = cargarPicks();
      picks.splice(index, 1);
      guardarPicks(picks);
      pintarPicks(searchPicks.value);
    });
  });
}

btnAddPick.addEventListener('click', () => {
  const local = mpHome.value.trim();
  const visitante = mpAway.value.trim();

  if (!local || !visitante) return;

  const markets = {
    "1X2": {
      home: parseFloat(document.getElementById('odd_home').value) || null,
      draw: parseFloat(document.getElementById('odd_draw').value) || null,
      away: parseFloat(document.getElementById('odd_away').value) || null
    },
    "O/U 2.5": {
      over: parseFloat(document.getElementById('odd_over').value) || null,
      under: parseFloat(document.getElementById('odd_under').value) || null
    },
    "BTTS": {
      yes: parseFloat(document.getElementById('odd_btts_yes').value) || null,
      no: parseFloat(document.getElementById('odd_btts_no').value) || null
    }
  };

  const pick = { local, visitante, markets };
  const picks = cargarPicks();
  picks.push(pick);
  guardarPicks(picks);

  mpHome.value = '';
  mpAway.value = '';
  document.querySelectorAll('.market-input').forEach(input => input.value = '');

  pintarPicks(searchPicks.value);
});

btnClearPicks.addEventListener('click', () => {
  localStorage.removeItem(LS_KEY_PICKS);
  pintarPicks();
});

btnExportar.addEventListener('click', () => {
  const blob = new Blob([localStorage.getItem(LS_KEY_PICKS) || "[]"], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `picks_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
});

searchPicks.addEventListener('input', (e) => {
  pintarPicks(e.target.value);
});

// =========================
// Modal Crear Pick desde partido
// =========================
function abrirModalPick(local, visitante) {
  modalLocal = local;
  modalVisitante = visitante;
  modalEquipos.textContent = `${local} vs ${visitante}`;
  modalPick.classList.add('open');
}

function cerrarModalPick() {
  modalPick.classList.remove('open');
  modalLocal = "";
  modalVisitante = "";
  document.querySelectorAll('#modalPick .market-input').forEach(i => i.value = "");
}

modalCancel.addEventListener('click', cerrarModalPick);

modalAddPick.addEventListener('click
