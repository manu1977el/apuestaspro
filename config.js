window.APP_CONFIG = {
  // 🔑 Tus claves API
  API_FOOTBALL_KEY: "TU_KEY_API_FOOTBALL_AQUI",
  API_ODDS_KEY: "TU_KEY_API_ODDS_AQUI",

  // 🌍 Rutas base
  API_BASE_FOOTBALL: "https://v3.football.api-sports.io",
  API_BASE_ODDS: "https://v3.football.api-sports.io/odds",

  // 📅 Temporada activa
  TEMPORADA: "2025",

  // 💾 LocalStorage
  LS_KEY: "misPicks_v1",

  // 🏆 Competiciones fallback
  STATIC_COMPETITIONS: [
    { id: 140, name: "Spain - La Liga" },
    { id: 39, name: "England - Premier League" },
    { id: 61, name: "France - Ligue 1" },
    { id: 78, name: "Germany - Bundesliga" },
    { id: 135, name: "Italy - Serie A" },
    { id: 2, name: "UEFA Champions League" },
    { id: 3, name: "UEFA Europa League" }
  ]
};

// 📡 Cabeceras API con RapidAPI host para evitar CORS
window.__AP_CFG__ = {
  API_BASE_FOOTBALL: window.APP_CONFIG.API_BASE_FOOTBALL,
  API_BASE_ODDS: window.APP_CONFIG.API_BASE_ODDS,
  TEMPORADA: window.APP_CONFIG.TEMPORADA,
  LS_KEY: window.APP_CONFIG.LS_KEY,
  STATIC_COMPETITIONS: window.APP_CONFIG.STATIC_COMPETITIONS,
  HEADERS_FOOTBALL: {
    "x-apisports-key": window.APP_CONFIG.API_FOOTBALL_KEY,
    "x-rapidapi-host": "v3.football.api-sports.io"
  },
  HEADERS_ODDS: {
    "x-apisports-key": window.APP_CONFIG.API_ODDS_KEY,
    "x-rapidapi-host": "v3.football.api-sports.io"
  }
};
