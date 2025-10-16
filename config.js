// =========================
// 🧭 CONFIGURACIÓN PRINCIPAL
// =========================
window.APP_CONFIG = {
  // 🔑 Claves de API
  API_FOOTBALL_KEY: "6DF57D1853E112002FA1139673F50218",
  ODDS_API_KEY:     "ddc3cb56d665397d69ceb71faf0e1b8b",

  // 🌐 URL del Proxy (tu Worker de Cloudflare)
  PROXY_URL: "https://throbbing-wood-a602.pimanema.workers.dev",

  // ⚽️ Competiciones principales
  MAIN_LEAGUES: [
    39,   // Premier League (Inglaterra)
    140,  // LaLiga (España)
    61,   // Ligue 1 (Francia)
    78,   // Bundesliga (Alemania)
    135,  // Serie A (Italia)
    2,    // UEFA Champions League
    3     // UEFA Europa League
  ],

  // 📅 Lista estática de competiciones (para modo offline o selector manual)
  STATIC_COMPETITIONS: [
    { id: 0, name: "🌍 Todas las competiciones" },
    { id: 39, name: "Premier League" },
    { id: 140, name: "LaLiga" },
    { id: 61, name: "Ligue 1" },
    { id: 78, name: "Bundesliga" },
    { id: 135, name: "Serie A" },
    { id: 2, name: "UEFA Champions League" },
    { id: 3, name: "UEFA Europa League" }
  ],

  // 🧾 Tipos de mercados para “Mis Picks”
  MARKETS: [
    "1X2 Local", "1X2 Empate", "1X2 Visitante",
    "Over 0.5", "Over 1.5", "Over 2.5", "Over 3.5",
    "Under 0.5", "Under 1.5", "Under 2.5", "Under 3.5",
    "BTTS Sí", "BTTS No",
    "Doble oportunidad 1X", "Doble oportunidad 12", "Doble oportunidad X2"
  ]
};