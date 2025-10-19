// ==================================
// ⚽ Apuestas PRO - APP PRINCIPAL
// ==================================

// Extrae la configuración global
const {
  API_BASE_FOOTBALL,
  API_BASE_ODDS,
  HEADERS_FOOTBALL,
  HEADERS_ODDS,
  TEMPORADA,
  LS_KEY,
  STATIC_COMPETITIONS
} = window.__AP_CFG__;

// Elementos DOM
const tabInicio = document.getElementById("tab-inicio");
const tabPicks = document.getElementById("tab-picks");
const sectionInicio = document.getElementById("inicio");
const sectionPicks = document.getElementById("picks");

const apiStatusEl = document.getElementById("api-football-status");
const oddsStatusEl = document.getElementById("odds-status");

const ligaSelect = document.getElementById("ligaSeleccionar");
const dateInput = document.getElementById("dateInput");
const btnBuscar = document.getElementById("btnBuscar");
const partidosContainer = document.getElementById("partidosContainer");

const btnAddPick = document.getElementById("btnAddPick");
const listaPicks = document.getElementById("listaPicks");
const btnExportar = document.getElementById("btnExportar");
const btnClearPicks = document.getElementById("btnClearPicks");

// =========================
// 🧭 Navegación pestañas
// =========================
tabInicio.addEventListener("click", () => {
  tabInicio.classList.add("active");
  tabPicks.classList.remove("active");
  sectionInicio.classList.add("active");
  sectionPicks.classList.remove("active");
});

tabPicks.addEventListener("click", () => {
  tabPicks.classList.add("active");
  tabInicio.classList.remove("active");
  sectionPicks.classList.add("active");
  sectionInicio.classList.remove("active");
});

// =========================
// 🏆 Cargar competiciones
// =========================
async function cargarLigas() {
  try {
    const res = await fetch(`${API_BASE_FOOTBALL}/leagues?current=true`, {
      headers: HEADERS_FOOTBALL
    });
    if (!res.ok) throw new Error("Error API Football");

    const data = await res.json();
    ligaSelect.innerHTML = "";

    // Si no devuelve ligas, usar catálogo estático
    const ligas = data.response.length > 0 ? data.response.map(l => ({
      id: l.league.id,
      name: `${l.country.name} - ${l.league.name}`
    })) : STATIC_COMPETITIONS;

    ligas.forEach(liga => {
      const opt = document.createElement("option");
      opt.value = liga.id;
      opt.textContent = liga.name;
      ligaSelect.appendChild(opt);
    });

    apiStatusEl.textContent = "Online";
    apiStatusEl.className = "online";
  } catch (err) {
    console.warn("❌ Error cargando ligas", err);
    ligaSelect.innerHTML = STATIC_COMPETITIONS.map(
      l => `<option value="${l.id}">${l.name}</option>`
    ).join("");
    apiStatusEl.textContent = "Offline";
    apiStatusEl.className = "offline";
  }
}

// =========================
// 📅 Buscar partidos
// =========================
btnBuscar.addEventListener("click", async () => {
  const ligaId = ligaSelect.value;
  const fecha = dateInput.value;
  if (!ligaId || !fecha) return alert("Selecciona liga y fecha");

  partidosContainer.innerHTML = "<p>⏳ Cargando partidos...</p>";

  try {
    const res = await fetch(
      `${API_BASE_FOOTBALL}/fixtures?league=${ligaId}&season=${TEMPORADA}&date=${fecha}`,
      { headers: HEADERS_FOOTBALL }
    );
    const data = await res.json();

    if (data.response.length === 0) {
      partidosContainer.innerHTML = "<p>No hay partidos para esta fecha.</p>";
      return;
    }

    partidosContainer.innerHTML = "";
    for (const match of data.response) {
      const div = document.createElement("div");
      div.classList.add("match");
      div.innerHTML = `
        <strong>${match.teams.home.name} vs ${match.teams.away.name}</strong>
        <div class="odds" id="odds-${match.fixture.id}">Cargando cuotas...</div>
      `;
      partidosContainer.appendChild(div);

      fetchCuotas(match.fixture.id);
    }
  } catch (err) {
    console.error("❌ Error cargando partidos", err);
    partidosContainer.innerHTML = "<p>Error al cargar partidos.</p>";
  }
});

// =========================
// 💰 Cuotas automáticas 1X2
// =========================
async function fetchCuotas(fixtureId) {
  try {
    const res = await fetch(`${API_BASE_ODDS}?fixture=${fixtureId}`, {
      headers: HEADERS_ODDS
    });
    if (!res.ok) throw new Error("Error Odds API");

    const data = await res.json();
    const oddsDiv = document.getElementById(`odds-${fixtureId}`);

    if (data.response.length === 0) {
      oddsDiv.textContent = "Sin cuotas disponibles";
      oddsStatusEl.textContent = "Offline";
      oddsStatusEl.className = "offline";
      return;
    }

    const bookie = data.response[0].bookmakers[0];
    const bet = bookie.bets.find(b => b.name === "Match Winner");
    if (bet) {
      const home = bet.values.find(v => v.value === "Home")?.odd || "-";
      const draw = bet.values.find(v => v.value === "Draw")?.odd || "-";
      const away = bet.values.find(v => v.value === "Away")?.odd || "-";
      oddsDiv.innerHTML = `🏠 ${home} | 🤝 ${draw} | 🧳 ${away}`;
    } else {
      oddsDiv.textContent = "Sin cuotas 1X2";
    }

    oddsStatusEl.textContent = "Online";
    oddsStatusEl.className = "online";
  } catch (err) {
    console.warn("❌ Error cuotas", err);
    oddsStatusEl.textContent = "Offline";
    oddsStatusEl.className = "offline";
  }
}

// =========================
// 📝 Picks manuales
// =========================
function mostrarPicks() {
  const picks = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  listaPicks.innerHTML = picks.map((p, i) =>
    `<li>${p.local} vs ${p.visitante} | Cuota: ${p.cuota || '-'} 
     <button onclick="eliminarPick(${i})">❌</button></li>`
  ).join("");
}

function guardarPick(pick) {
  const picks = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  picks.push(pick);
  localStorage.setItem(LS_KEY, JSON.stringify(picks));
  mostrarPicks();
}

btnAddPick.addEventListener("click", () => {
  const local = document.getElementById("mpHome").value.trim();
  const visitante = document.getElementById("mpAway").value.trim();
  const cuota = document.getElementById("mpOdd").value.trim();
  if (!local || !visitante) return alert("Completa los equipos");
  guardarPick({ local, visitante, cuota });
  document.getElementById("mpHome").value = "";
  document.getElementById("mpAway").value = "";
  document.getElementById("mpOdd").value = "";
});

window.eliminarPick = (i) => {
  const picks = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  picks.splice(i, 1);
  localStorage.setItem(LS_KEY, JSON.stringify(picks));
  mostrarPicks();
};

btnClearPicks.addEventListener("click", () => {
  localStorage.removeItem(LS_KEY);
  mostrarPicks();
});

// =========================
// 🚀 Inicialización
// =========================
cargarLigas();
mostrarPicks();
