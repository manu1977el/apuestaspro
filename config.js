// ===== CONFIG GLOBAL (COMPLETO) =====
window.APP_CONFIG = {
  // --- TUS KEYS (las pediste explícitas) ---
  API_FOOTBALL_KEY: "6DF57D1853E112002FA1139673F50218",
  API_ODDS_KEY: "ddc3cb56d665397d69ceb71faf0e1b8b",

  // Endpoints base
  API_BASE_FOOTBALL: "https://v3.football.api-sports.io",
  API_BASE_ODDS:     "https://v3.football.api-sports.io/odds",

  // Temporada (2025/26)
  SEASON: "2025",

  // LocalStorage
  LS_PICKS_KEY: "ap_picks_v1",

  // Ligas fallback si la API no responde
  STATIC_COMPETITIONS: [
    { id: 39,  name: "England - Premier League" },
    { id: 140, name: "Spain - La Liga" },
    { id: 78,  name: "Germany - Bundesliga" },
    { id: 61,  name: "France - Ligue 1" },
    { id: 135, name: "Italy - Serie A" }
  ]
};

// Encapsulado para uso interno en app.js
window.__AP_CFG__ = {
  API_BASE_FOOTBALL: window.APP_CONFIG.API_BASE_FOOTBALL,
  API_BASE_ODDS:     window.APP_CONFIG.API_BASE_ODDS,
  SEASON:            window.APP_CONFIG.SEASON,
  LS_PICKS_KEY:      window.APP_CONFIG.LS_PICKS_KEY,
  STATIC_COMPETITIONS: window.APP_CONFIG.STATIC_COMPETITIONS,

  // Cabeceras correctas para API-Football v3
  HEADERS_FOOTBALL: {
    "x-apisports-key": window.APP_CONFIG.API_FOOTBALL_KEY
  },
  HEADERS_ODDS: {
    "x-apisports-key": window.APP_CONFIG.API_ODDS_KEY
  }
};
