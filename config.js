// =============================
// ⚙️ CONFIGURACIÓN Apuestas PRO
// =============================

// ✅ Claves de API (tuyas)
const API_FOOTBALL_KEY = "6DF57D1853E112002FA1139673F50218";
const ODDS_API_KEY = "ddc3cb56d665397d69ceb71faf0e1b8b";

// 🌐 Endpoints base
const API_FOOTBALL_BASE = "https://v3.football.api-sports.io";
const ODDS_API_BASE = "https://api.the-odds-api.com/v4";

// 🌍 Zona horaria por defecto
const TIMEZONE = "Europe/Madrid";

// 📊 Almacenamiento local
const LS_KEY = "ap_picks_v2";

// 🧾 Headers para las peticiones
const apiHeaders = {
  "x-apisports-key": API_FOOTBALL_KEY,
  "Content-Type": "application/json"
};

const oddsHeaders = {
  "x-api-key": ODDS_API_KEY,
  "Content-Type": "application/json"
};

// 🕒 Función para comprobar estado de APIs
async function checkAPIStatus() {
  const apiStatusEl = document.getElementById("apiStatus");
  const oddsStatusEl = document.getElementById("oddsStatus");

  try {
    const resp = await fetch(`${API_FOOTBALL_BASE}/status`, { headers: apiHeaders });
    if (resp.ok) {
      apiStatusEl.textContent = "Online";
      apiStatusEl.className = "status-online";
    } else {
      throw new Error();
    }
  } catch {
    apiStatusEl.textContent = "Offline";
    apiStatusEl.className = "status-offline";
  }

  try {
    const respOdds = await fetch(`${ODDS_API_BASE}/sports`, { headers: oddsHeaders });
    if (respOdds.ok) {
      oddsStatusEl.textContent = "Online";
      oddsStatusEl.className = "status-online";
    } else {
      throw new Error();
    }
  } catch {
    oddsStatusEl.textContent = "Offline";
    oddsStatusEl.className = "status-offline";
  }
}

// ✅ Ejecutar estado al cargar
window.addEventListener("load", checkAPIStatus);
