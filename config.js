// ================== CONFIGURACIÓN GLOBAL ==================

// ⚽ API-Football
const API_BASE_URL = "https://v3.football.api-sports.io";
const API_KEY = "6DF57D1853E112002FA1139673F50218";   // 👈 PEGA AQUÍ TU KEY REAL

// 🧮 Odds API (opcional)
const ODDS_API_URL = "https://api.the-odds-api.com/v4";
const ODDS_API_KEY = "ddc3cb56d665397d69ceb71faf0e1b8b";   // 👈 PEGA AQUÍ TU KEY REAL (si usas odds)

// 🕒 Zona horaria
const TIMEZONE = "Europe/Madrid";

// ================== HEADERS ==================
const API_HEADERS = {
  "x-apisports-key": API_KEY,
  "x-rapidapi-host": "v3.football.api-sports.io"
};

const ODDS_HEADERS = {
  "x-api-key": ODDS_API_KEY
};

// ================== FUNCIONES AUXILIARES ==================
async function apiFootballFetch(endpoint) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, { headers: API_HEADERS });
  if (!res.ok) throw new Error("Error al conectar con API-Football");
  return res.json();
}

async function oddsFetch(endpoint) {
  const res = await fetch(`${ODDS_API_URL}${endpoint}?apiKey=${ODDS_API_KEY}`);
  if (!res.ok) throw new Error("Error al conectar con Odds API");
  return res.json();
}
