// ============================================
// ⚽ Apuestas PRO – CONFIG GLOBAL (COMPLETO)
// ============================================

// 🔐 Claves (tuyas)
window.APP_CONFIG = {
  API_FOOTBALL_KEY: "6DF57D1853E112002FA1139673F50218",   // API-Football
  ODDS_API_KEY:     "ddc3cb56d665397d69ceb71faf0e1b8b",   // Odds (si usas otro proveedor, cámbiala)

  // 🌍 Endpoints base (directo, sin proxy)
  API_BASE_FOOTBALL: "https://v3.football.api-sports.io",
  API_BASE_ODDS:     "https://v3.football.api-sports.io/odds",

  // 🧭 Proxy (si algún día lo necesitas, pon USE_PROXY:true y PROXY_URL)
  USE_PROXY: false,
  PROXY_URL: "", // p.ej. "https://tu-worker.tudominio.workers.dev"

  // 📆 Temporada y zona horaria
  SEASON: "2025",
  TIMEZONE: "Europe/Madrid",

  // 🧾 Clave de localStorage para tus picks
  LS_KEY: "ap_picks_v1",

  // ⭐ Ligas principales (para priorizar en el desplegable)
  MAIN_LEAGUES: [39, 140, 61, 78, 135, 2, 3], // EPL, LaLiga, Ligue1, Bundesliga, SerieA, UCL, UEL

  // 📚 Catálogo estático (fallback) por si la API no carga
  STATIC_COMPETITIONS: [
    { id: 0,   name: "🌍 Todas las competiciones" },
    { id: 39,  name: "England - Premier League" },
    { id: 140, name: "Spain - La Liga" },
    { id: 135, name: "Italy - Serie A" },
    { id: 78,  name: "Germany - Bundesliga" },
    { id: 61,  name: "France - Ligue 1" },
    { id: 2,   name: "UEFA Champions League" },
    { id: 3,   name: "UEFA Europa League" }
  ],

  // 🏷️ Mercados visibles en “Mis Picks” (manuales y auto)
  MARKETS: [
    "1X2 Local", "1X2 Empate", "1X2 Visitante",
    "Over 0.5", "Over 1.5", "Over 2.5", "Over 3.5",
    "Under 0.5", "Under 1.5", "Under 2.5", "Under 3.5",
    "BTTS Sí", "BTTS No",
    "Doble oportunidad 1X", "Doble oportunidad 12", "Doble oportunidad X2"
  ]
};

// ---------------------------------------------------------
// 🔧 Constantes derivadas que usa app.js (no toques)
// ---------------------------------------------------------
const {
  API_FOOTBALL_KEY,
  ODDS_API_KEY,
  API_BASE_FOOTBALL,
  API_BASE_ODDS,
  USE_PROXY,
  PROXY_URL,
  SEASON: TEMPORADA,
  TIMEZONE,
  LS_KEY,
  MAIN_LEAGUES,
  STATIC_COMPETITIONS
} = window.APP_CONFIG;

// Endpoints efectivos (respetan proxy si lo activas)
const BASE_FOOTBALL = USE_PROXY ? `${PROXY_URL}/football` : API_BASE_FOOTBALL;
const BASE_ODDS     = USE_PROXY ? `${PROXY_URL}/odds`     : API_BASE_ODDS;

// Cabeceras para llamadas
const HEADERS_FOOTBALL = { "x-apisports-key": API_FOOTBALL_KEY };
const HEADERS_ODDS     = { "x-apisports-key": ODDS_API_KEY };

// (Opcional) Ligas favoritas para mostrar arriba del todo
const LIGAS_FAVORITAS = [
  { id: 39,  nombre: "England - Premier League" },
  { id: 140, nombre: "Spain - La Liga" },
  { id: 78,  nombre: "Germany - Bundesliga" },
  { id: 135, nombre: "Italy - Serie A" },
  { id: 61,  nombre: "France - Ligue 1" },
  { id: 2,   nombre: "UEFA Champions League" }
];

// Export “amigable” para app.js (si lo importas por <script> ya están en global)
window.__AP_CFG__ = {
  API_BASE_FOOTBALL: BASE_FOOTBALL,
  API_BASE_ODDS: BASE_ODDS,
  HEADERS_FOOTBALL,
  HEADERS_ODDS,
  TEMPORADA,
  TIMEZONE,
  LS_KEY,
  MAIN_LEAGUES,
  STATIC_COMPETITIONS,
  LIGAS_FAVORITAS
};
