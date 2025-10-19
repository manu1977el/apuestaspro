// ==========================
// ⚽ Apuestas PRO - config.js
// ==========================

// Claves de acceso
window.APP_CONFIG = {
  API_FOOTBALL_KEY: "6DF57D1853E112002FA1139673F50218",
  ODDS_API_KEY: "ddc3cb56d665397d69ceb71faf0e1b8b",

  // URL base de la API Football
  API_FOOTBALL_URL: "https://v3.football.api-sports.io",

  // Ligas principales (útil para offline y selección rápida)
  MAIN_LEAGUES: [
    39,   // Premier League
    140,  // LaLiga
    61,   // Ligue 1
    78,   // Bundesliga
    135,  // Serie A
    2,    // Champions League
    3     // Europa League
  ],

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

  // Mercados que se mostrarán en los picks manuales y en el modal
  MARKETS: [
    "1X2 Local",
    "1X2 Empate",
    "1X2 Visitante",
    "Over 0.5",
    "Over 1.5",
    "Over 2.5",
    "Over 3.5",
    "Under 0.5",
    "Under 1.5",
    "Under 2.5",
    "Under 3.5",
    "BTTS Sí",
    "BTTS No",
    "Doble oportunidad 1X",
    "Doble oportunidad 12",
    "Doble oportunidad X2"
  ]
};
