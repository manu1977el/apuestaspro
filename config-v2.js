window.__AP_CFG__ = {
  // 🚀 Con proxy CORS para evitar bloqueos en iPhone/navegadores
  API_BASE_FOOTBALL: "https://corsproxy.io/?https://v3.football.api-sports.io/",
  API_BASE_ODDS: "https://api.the-odds-api.com/v4",
  SEASON: 2025,
  LS_PICKS_KEY: "apuestaspro-picks",

  STATIC_COMPETITIONS: [
    { id: 0, name: "🌍 Todas las competiciones" },
    { id: 39, name: "Premier League" },
    { id: 140, name: "LaLiga" },
    { id: 135, name: "Serie A" },
    { id: 78, name: "Bundesliga" },
    { id: 61, name: "Ligue 1" },
    { id: 2, name: "UEFA Champions League" },
    { id: 3, name: "UEFA Europa League" }
  ],

  HEADERS_FOOTBALL: {
    "x-apisports-key": "6DF57D1853E112002FA1139673F50218",
    "Accept": "application/json"
  },

  HEADERS_ODDS: {
    "x-api-key": "ddc3cb56d665397d69ceb71faf0e1b8b",
    "Accept": "application/json"
  },

  SHEETS_URL: "https://script.google.com/macros/s/AKfycbxvohOZ7f7wIBxCwHeEihIxuyq6iiiM6KgzQsVMjFPh8Mcrj5i5ioXaYs8IA53Ril/exec"
};

console.log("✅ Config cargada correctamente:", window.__AP_CFG__);
